"""Template renderer — inject scene `inputs` into a template's portrait.html.

Phase 4 of any2video v5+ uses pre-designed templates from
`.claude/skills/any2video/templates/scenes/<templateId>/`. Each template has:
  - `compositions/portrait.html` — the 9:16 layout with default placeholders
  - inline JS that reads `data-composition-variables='{...}'` and binds to DOM

This module reads the template, replaces the variables JSON with the scene's
`inputs`, and writes a self-contained scratch HTML for `playwright_render` to load.

The injected HTML stays in the workspace run dir as `scenes/<id>.html` (same
location and naming as before), so the downstream pipeline doesn't change.
"""
from __future__ import annotations

import argparse
import json
import re
import shutil
import sys
from pathlib import Path

# Force UTF-8 stdout for Windows cp1252 (Vietnamese diacritics in slot values)
try:
    sys.stdout.reconfigure(encoding="utf-8")  # type: ignore[attr-defined]
    sys.stderr.reconfigure(encoding="utf-8")  # type: ignore[attr-defined]
except (AttributeError, OSError):
    pass

# Scene templates ship with the skill (see lib/paths.TEMPLATES_DIR).
from .. import paths
SKILLS_DIR = paths.TEMPLATES_DIR / "scenes"

# Regex to find the data-composition-variables attribute (single-quoted JSON).
# Template authors use single-quote outer + double-quote inner JSON, so we
# tolerate either quoting.
_VARS_ATTR_RE = re.compile(
    r"data-composition-variables\s*=\s*(['\"])(.*?)\1",
    re.DOTALL,
)


def list_templates() -> list[str]:
    """Return template IDs that have a portrait.html composition."""
    if not SKILLS_DIR.is_dir():
        return []
    out = []
    for d in sorted(SKILLS_DIR.iterdir()):
        if (d / "compositions" / "portrait.html").is_file():
            out.append(d.name)
    return out


def _accent_css(accent) -> str:
    """Video-wide accent override. `accent` = {"from": "#hex", "to": "#hex"} (or a
    single "color"). Recolours the main gradient-text accents across templates so a
    whole video can be a chosen vibrant colour without editing each scene."""
    if not isinstance(accent, dict):
        return ""
    a = accent.get("from") or accent.get("color")
    b = accent.get("to") or a
    if not a:
        return ""
    grad = f"linear-gradient(92deg,{a} 0%,{b} 100%)"
    # `.grad` (comparison's two-colour labels) is intentionally left out.
    return (
        "<style>/* video-wide accent override (meta.accent) */"
        ".accent,.figure,.hero .ch,.headline .accent,.headline-accent{"
        f"background-image:{grad} !important;"
        "-webkit-background-clip:text !important;background-clip:text !important;"
        "-webkit-text-fill-color:transparent !important;color:transparent !important;}"
        "</style>"
    )


def render_template(template_id: str, inputs: dict, out_html: Path,
                    accent=None) -> dict:
    """Inject `inputs` into the template's portrait.html, write to out_html.

    The out_html is self-contained: any relative asset paths in the template
    (like `../assets/`) become invalid. To preserve assets, we copy the entire
    template directory (assets + compositions) next to out_html under a
    subdirectory named `_tpl_<templateId>`, and rewrite the HTML to load
    composition from there.

    Simpler approach used here: copy the WHOLE template directory next to
    out_html and load `compositions/portrait.html` from inside it. The
    `scene<id>.html` file becomes a tiny redirector that immediately
    `<meta http-equiv="refresh">` to the copied template. This keeps assets
    relative paths working.

    Even simpler approach actually used: copy templates/<id>/* into a sibling
    dir, then write out_html as a SYMLINK or direct copy of portrait.html that
    has assets resolved via absolute file:// URLs.

    For MVP: just inline the template's portrait.html with vars replaced.
    Template assets are inlined too (most templates only use Google Fonts CDN
    + inline SVG, no local assets that matter for layout).
    """
    tpl_dir = SKILLS_DIR / template_id
    portrait = tpl_dir / "compositions" / "portrait.html"
    if not portrait.is_file():
        return {"error": "template_not_found", "template_id": template_id,
                "expected": str(portrait), "available": list_templates()}

    html = portrait.read_text(encoding="utf-8")
    vars_json = json.dumps(inputs, ensure_ascii=False)

    # 1. Update the data-composition-variables attribute (for documentation).
    vars_attr = vars_json.replace("'", "&#39;")
    new_attr = f"data-composition-variables='{vars_attr}'"
    if _VARS_ATTR_RE.search(html):
        html = _VARS_ATTR_RE.sub(new_attr, html, count=1)

    # 2. CRITICAL — replace the inline JS that reads from window.__hyperframes.
    # Templates were built for HyperFrames CLI which injects window.__hyperframes
    # at runtime. Without HF, the lookup returns {} → empty DOM. We rewrite the
    # `var v = (window.__hyperframes && ...) ? ... : {};` line to inline our JSON.
    hf_pattern = re.compile(
        r"var\s+v\s*=\s*\(?\s*window\.__hyperframes\s*&&[^;]*;",
        re.DOTALL,
    )
    if not hf_pattern.search(html):
        return {
            "error": "no_hyperframes_var_binding_found",
            "template_id": template_id,
            "hint": "Template may use a non-standard variable binding pattern.",
        }
    # IMPORTANT: use a function replacement to avoid re.sub interpreting backslashes
    # in vars_json as backreferences (\1, \2, ...) or escape sequences.
    new_html = hf_pattern.sub(lambda _m: f"var v = {vars_json};", html, count=1)

    # Karaoke captions (lib/compose/subtitles.py) are burned into the bottom band
    # by default, so a template's OWN bottom `.caption` is redundant and collides
    # with the burned line. Hide it, and reserve the bottom band for karaoke.
    # (Content should already sit above it — see SKILL typography rule.)
    _kara_css = (
        "<style>/* karaoke owns the bottom caption band */"
        ".caption,.caption-overlay{display:none !important;}</style>"
    )
    if "</head>" in new_html:
        new_html = new_html.replace("</head>", _kara_css + "</head>", 1)
    else:
        new_html = _kara_css + new_html

    # VN diacritic headroom guard: Vietnamese stacked tone marks (Ậ Ỗ Ồ Ề Ế…) paint
    # ABOVE cap-height. A tight line-height or a snug fixed-height box slices the top
    # accent off. Give block display text a sliver of top room, and make inline accent
    # spans never clip themselves. Conservative on purpose (additive padding + inline
    # overflow only) so it can't break card layouts — the scene_critic gate catches any
    # residual clip and forces a redo. See SKILL §2.2.7.
    _vn_headroom = (
        "<style>/* VN diacritic headroom (any2video guard) */"
        ".hero,.headline,.figure,.number,.lbl,.title,.eyebrow,.kicker,.desc,.subtitle{"
        "padding-top:0.1em;}"
        ".hero,.headline,.figure,.number,.head,.ln{overflow:visible !important;}"
        ".accent,.kw,.hl,.ch,mark,.headline-accent{overflow:visible !important;}"
        "</style>"
    )
    if "</head>" in new_html:
        new_html = new_html.replace("</head>", _vn_headroom + "</head>", 1)
    else:
        new_html = _vn_headroom + new_html

    # Universal accent-spacing guard: after the template builds its DOM, ensure a
    # space sits around every highlighted phrase (.accent/.kw) so a coloured word
    # never sticks to its neighbour (e.g. "từ" + "GitHub" → "từGitHub"). Covers
    # ALL templates + future ones. Runs once synchronously (before autofit measures
    # width on fonts.ready) and again on fonts.ready; idempotent (won't double-space).
    _space_fix = (
        "<script>(function(){function fx(){"
        "document.querySelectorAll('.accent,.kw,b,strong,mark,[class*=\"accent\"],"
        "[class*=\"grad\"],[class*=\"highlight\"],[class*=\"hl\"],[class*=\"label\"]')"
        ".forEach(function(el){"
        "var t=el.textContent||'';"
        "var p=el.previousSibling;"
        "if(p&&p.nodeType===3&&p.nodeValue&&!/\\s$/.test(p.nodeValue)&&!/^\\s/.test(t)){p.nodeValue+=' ';}"
        "var n=el.nextSibling;"
        "if(n&&n.nodeType===3&&n.nodeValue&&!/^\\s/.test(n.nodeValue)&&!/\\s$/.test(t)){n.nodeValue=' '+n.nodeValue;}"
        "});}fx();"
        "if(document.fonts&&document.fonts.ready){document.fonts.ready.then(fx);}"
        "setTimeout(fx,300);})();</script>"
    )
    if "</body>" in new_html:
        new_html = new_html.replace("</body>", _space_fix + "</body>", 1)
    else:
        new_html = new_html + _space_fix

    # Count-up for stat numbers: a big number should roll 0 → target then stop
    # (SKILL §2.2.7 "counter roll"). Targets any `.countup / [data-countup] / .number /
    # .num` whose text starts with a number; the numeric part tweens (easeOutCubic,
    # ~1s) while the prefix/suffix ("k", "%", " triệu", "$") stay. NON-DESTRUCTIVE:
    # it only resets to 0 and animates when playwright_render calls __a2vUnfreeze
    # (rich video mode). In the still gate / static render there is no unfreeze, so
    # the final number stays put — no risk of capturing a mid-roll "0". No `//` line
    # comments inside (the script is emitted on one line).
    _countup_js = (
        "<script>(function(){"
        "function parse(t){var m=/^(\\D*?)([0-9][0-9.,]*)(.*)$/.exec(String(t));"
        "if(!m)return null;var raw=m[2];var dec=(raw.split('.')[1]||'').length;"
        "var val=parseFloat(raw.replace(/,/g,''));if(isNaN(val))return null;"
        "return{pre:m[1],suf:m[3],val:val,dec:dec,grp:raw.indexOf(',')>-1};}"
        "function fmt(n,d,grp){var s=n.toFixed(d);if(grp){var p=s.split('.');"
        "p[0]=p[0].replace(/\\B(?=(\\d{3})+(?!\\d))/g,',');s=p.join('.');}return s;}"
        "var nodes=[];document.querySelectorAll('.countup,[data-countup],.number,.num')"
        ".forEach(function(el){var info=parse(el.textContent);if(info)nodes.push({el:el,info:info});});"
        "if(!nodes.length)return;"
        "function roll(n){if(n.done)return;n.done=true;var dur=900,t0=null;"
        "function step(ts){if(t0===null)t0=ts;var p=Math.min(1,(ts-t0)/dur),e=1-Math.pow(1-p,3);"
        "n.el.textContent=n.info.pre+fmt(n.info.val*e,n.info.dec,n.info.grp)+n.info.suf;"
        "if(p<1)requestAnimationFrame(step);}requestAnimationFrame(step);}"
        "function effOp(el){var o=1;while(el&&el.nodeType===1){var s=getComputedStyle(el);"
        "if(s.display==='none'||s.visibility==='hidden')return 0;o*=parseFloat(s.opacity||'1');el=el.parentElement;}return o;}"
        "function begin(){nodes.forEach(function(n){n.el.textContent=n.info.pre+fmt(0,n.info.dec,n.info.grp)+n.info.suf;});"
        "var start=null;function tick(ts){if(start===null)start=ts;"
        "nodes.forEach(function(n){if(!n.done&&effOp(n.el)>0.6)roll(n);});"
        "if((ts-start)>3000){nodes.forEach(roll);return;}"
        "if(nodes.some(function(n){return !n.done;}))requestAnimationFrame(tick);}"
        "requestAnimationFrame(tick);}"
        "window.__a2vCountup=begin;"
        "var orig=window.__a2vUnfreeze;"
        "if(typeof orig==='function'){window.__a2vUnfreeze=function(){orig();begin();};}"
        "})();</script>"
    )
    if "</body>" in new_html:
        new_html = new_html.replace("</body>", _countup_js + "</body>", 1)
    else:
        new_html = new_html + _countup_js

    # Optional video-wide accent recolour (meta.accent in plan.md).
    _acc = _accent_css(accent)
    if _acc:
        if "</head>" in new_html:
            new_html = new_html.replace("</head>", _acc + "</head>", 1)
        else:
            new_html = _acc + new_html

    # Copy any template-local assets (fonts, images) into a sibling dir so
    # relative paths in the HTML still resolve. Most lifted templates only use
    # Google Fonts (CDN) — no local assets — so this is usually a no-op.
    asset_src = tpl_dir / "assets"
    if asset_src.is_dir():
        asset_dst = out_html.parent / f"_tpl_{template_id}_assets"
        if asset_dst.exists():
            shutil.rmtree(asset_dst, ignore_errors=True)
        shutil.copytree(asset_src, asset_dst)
        # Rewrite relative asset paths from `../assets/` to the copied dir
        new_html = new_html.replace(
            '"../assets/', f'"./{asset_dst.name}/'
        ).replace(
            "'../assets/", f"'./{asset_dst.name}/"
        )

    out_html.parent.mkdir(parents=True, exist_ok=True)
    out_html.write_text(new_html, encoding="utf-8")

    return {
        "template_id": template_id,
        "out_html": str(out_html),
        "vars": inputs,
        "bytes_written": len(new_html.encode("utf-8")),
    }


def render_all_from_plan(plan_path: Path) -> dict:
    """Iterate plan.md scenes; render any scene with `templateId` + `inputs`.
    Scenes without templateId are left alone (assumes user wrote raw HTML)."""
    from .. import plan_yaml
    plan = plan_yaml.load_plan(plan_path)
    scenes = plan.get("scenes") or []
    run_dir = plan_path.parent
    scenes_dir = run_dir / "scenes"
    scenes_dir.mkdir(exist_ok=True)

    # Video-wide accent (meta.accent = {from, to} or {color}). Per-scene
    # inputs.accent_from/accent_to still win where a template reads them.
    accent = (plan.get("meta") or {}).get("accent")

    results = []
    for s in scenes:
        sid = s["id"]
        template_id = s.get("templateId") or s.get("template_id")
        inputs = s.get("inputs") or {}
        if not template_id:
            results.append({"id": sid, "status": "skipped", "reason": "no templateId"})
            continue
        # per-scene accent override beats the video-wide one
        scene_accent = s.get("accent") or accent
        out_html = scenes_dir / f"{sid}.html"
        r = render_template(template_id, inputs, out_html, accent=scene_accent)
        r["id"] = sid
        results.append(r)

    return {"plan_path": str(plan_path), "results": results}


def main() -> int:
    parser = argparse.ArgumentParser(description="Phase 4 — render scene HTML from a template + inputs")
    sub = parser.add_subparsers(dest="cmd", required=True)
    sub.add_parser("list", help="List available templates")
    one = sub.add_parser("one", help="Render one scene from template + inputs JSON")
    one.add_argument("template_id")
    one.add_argument("--inputs", required=True, help="JSON string of slot values")
    one.add_argument("--out", required=True, help="Output HTML path")
    allp = sub.add_parser("all", help="Render every scene in plan.md that has templateId")
    allp.add_argument("plan")
    args = parser.parse_args()

    if args.cmd == "list":
        print(json.dumps({"templates": list_templates()}, indent=2))
        return 0
    if args.cmd == "one":
        r = render_template(args.template_id, json.loads(args.inputs), Path(args.out).resolve())
        print(json.dumps(r, indent=2, ensure_ascii=False))
        return 0 if "error" not in r else 1
    r = render_all_from_plan(Path(args.plan).resolve())
    print(json.dumps(r, indent=2, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
