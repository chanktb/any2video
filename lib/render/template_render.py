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
import hashlib
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


# ---- Hero palette ("intro theme") ---------------------------------------
# The opening/pain-hero scene (frame-pain-hero) is the frame the compose step
# lifts as the video POSTER (thumbnail). If every video opens on the same
# palette, a channel's grid looks monotonous. These palettes recolour the hero
# per video so thumbnails differ at a glance yet stay bold (dark base + one
# bright accent pair = high contrast = pops). Every hex is scene_gate-safe
# (none of the banned "slop" colours). frame-pain-hero reads them as CSS vars
# (--h-bg/--h-blob1/--h-blob2/--h-acc/--h-acc2/--h-eyebrow/--h-sub) with the
# azure-noir values as fallbacks, so an un-themed render is unchanged.
HERO_TEMPLATES = {"frame-pain-hero"}

HERO_PALETTES = [
    {"name": "azure-noir",   "bg": "#020c1a", "blob1": "#0e7490", "blob2": "#9f1239",
     "acc": "#22d3ee", "acc2": "#fb7185", "eyebrow": "#7ec8e3", "sub": "#a9c3d6"},
    {"name": "crimson-ember", "bg": "#120609", "blob1": "#7f1d1d", "blob2": "#b45309",
     "acc": "#fb7185", "acc2": "#fbbf24", "eyebrow": "#fca5a5", "sub": "#d8b4a0"},
    {"name": "emerald-deep",  "bg": "#04140e", "blob1": "#065f46", "blob2": "#0e7490",
     "acc": "#34d399", "acc2": "#5eead4", "eyebrow": "#6ee7b7", "sub": "#9fd6c0"},
    {"name": "violet-dusk",   "bg": "#0d0820", "blob1": "#4338ca", "blob2": "#be185d",
     "acc": "#818cf8", "acc2": "#f472b6", "eyebrow": "#a5b4fc", "sub": "#c7bfe0"},
    {"name": "amber-gold",    "bg": "#14100a", "blob1": "#b45309", "blob2": "#7c2d12",
     "acc": "#fbbf24", "acc2": "#fb923c", "eyebrow": "#fcd34d", "sub": "#d6c3a0"},
    {"name": "coral-sunset",  "bg": "#140a08", "blob1": "#9a3412", "blob2": "#9f1239",
     "acc": "#fb923c", "acc2": "#f472b6", "eyebrow": "#fdba74", "sub": "#d8b0a8"},
    {"name": "slate-mono",    "bg": "#0b0f14", "blob1": "#334155", "blob2": "#1e3a5f",
     "acc": "#38bdf8", "acc2": "#e2e8f0", "eyebrow": "#94a3b8", "sub": "#b6c2d0"},
    {"name": "teal-lime",     "bg": "#04120f", "blob1": "#0f766e", "blob2": "#3f6212",
     "acc": "#2dd4bf", "acc2": "#a3e635", "eyebrow": "#5eead4", "sub": "#a8c3a0"},
]


def hero_palette_by_name(name):
    if not name:
        return None
    n = str(name).lower().strip()
    for p in HERO_PALETTES:
        if p["name"] == n:
            return p
    return None


def pick_hero_palette(key):
    """Deterministic palette for a video, keyed by its slug — same repo always
    gets the same intro colour (stable re-renders), different repos spread across
    the set (a channel looks varied). None key → the default (fallback) look."""
    if not key:
        return None
    idx = int(hashlib.sha1(str(key).encode("utf-8")).hexdigest(), 16) % len(HERO_PALETTES)
    return HERO_PALETTES[idx]


def _hero_palette_css(pal) -> str:
    """Set the hero CSS vars on :root so html/body/#root all inherit them."""
    if not isinstance(pal, dict):
        return ""
    return (
        "<style>/* hero palette: " + pal.get("name", "?") + " */"
        ":root{"
        f"--h-bg:{pal['bg']};--h-blob1:{pal['blob1']};--h-blob2:{pal['blob2']};"
        f"--h-acc:{pal['acc']};--h-acc2:{pal['acc2']};"
        f"--h-eyebrow:{pal['eyebrow']};--h-sub:{pal['sub']};}}"
        "</style>"
    )


def _theme_layer(theme) -> str:
    """Ambient background theme (meta.theme). Injects a drifting motion layer as
    the FIRST child of #root at z-index:0 — behind ALL content (content sits at
    z-index ≥1 in every template) but above the base #020c1a fill, so a video
    always feels alive ("chất công nghệ"). `aurora` (default) adds nothing — the
    templates already carry the liquid blobs. `particles` = two parallax dot
    fields; `grid` = a faint drifting grid. Transparent, pointer-events:none;
    gracefully hidden by any template that paints an opaque full-screen sheet."""
    t = (theme or "").lower().strip()
    if t in ("", "aurora", "default", "blobs"):
        return ""
    if t == "particles":
        css = (".a2v-theme{position:absolute;inset:0;z-index:0;pointer-events:none;overflow:hidden;}"
               ".a2v-theme i{position:absolute;inset:-30%;display:block;}"
               ".a2v-theme .d1{background-image:radial-gradient(circle,rgba(120,200,230,0.30) 1.6px,transparent 2.2px);"
               "background-size:48px 48px;animation:a2vDriftA 42s linear infinite;}"
               ".a2v-theme .d2{background-image:radial-gradient(circle,rgba(180,150,255,0.18) 1.2px,transparent 2px);"
               "background-size:80px 80px;animation:a2vDriftB 66s linear infinite;}"
               "@keyframes a2vDriftA{to{transform:translate(48px,72px);}}"
               "@keyframes a2vDriftB{to{transform:translate(-80px,56px);}}")
        inner = "<i class=\\\"d1\\\"></i><i class=\\\"d2\\\"></i>"
    elif t == "grid":
        css = (".a2v-theme{position:absolute;inset:0;z-index:0;pointer-events:none;overflow:hidden;}"
               ".a2v-theme i{position:absolute;inset:-30%;display:block;"
               "background-image:linear-gradient(rgba(120,200,230,0.10) 1px,transparent 1px),"
               "linear-gradient(90deg,rgba(120,200,230,0.10) 1px,transparent 1px);"
               "background-size:64px 64px;animation:a2vDriftA 54s linear infinite;}"
               "@keyframes a2vDriftA{to{transform:translate(64px,64px);}}")
        inner = "<i></i>"
    elif t == "mesh":
        # three soft colour blobs slowly drifting — a living gradient wash.
        css = (".a2v-theme{position:absolute;inset:0;z-index:0;pointer-events:none;overflow:hidden;}"
               ".a2v-theme i{position:absolute;border-radius:50%;filter:blur(80px);opacity:0.28;}"
               ".a2v-theme .m1{width:560px;height:560px;left:-140px;top:6%;background:radial-gradient(circle,rgba(56,189,248,0.9),transparent 70%);animation:a2vFloatA 28s ease-in-out infinite;}"
               ".a2v-theme .m2{width:620px;height:620px;right:-180px;top:42%;background:radial-gradient(circle,rgba(129,140,248,0.85),transparent 70%);animation:a2vFloatB 34s ease-in-out infinite;}"
               ".a2v-theme .m3{width:480px;height:480px;left:24%;bottom:-160px;background:radial-gradient(circle,rgba(45,212,191,0.8),transparent 70%);animation:a2vFloatC 31s ease-in-out infinite;}"
               "@keyframes a2vFloatA{0%,100%{transform:translate(0,0);}50%{transform:translate(90px,64px);}}"
               "@keyframes a2vFloatB{0%,100%{transform:translate(0,0);}50%{transform:translate(-76px,-54px);}}"
               "@keyframes a2vFloatC{0%,100%{transform:translate(0,0);}50%{transform:translate(56px,-78px);}}")
        inner = "<i class=\\\"m1\\\"></i><i class=\\\"m2\\\"></i><i class=\\\"m3\\\"></i>"
    elif t == "beams":
        # faint diagonal light streaks slowly sweeping across.
        css = (".a2v-theme{position:absolute;inset:0;z-index:0;pointer-events:none;overflow:hidden;}"
               ".a2v-theme i{position:absolute;inset:-40%;"
               "background:repeating-linear-gradient(115deg,transparent 0,transparent 92px,"
               "rgba(255,255,255,0.03) 92px,rgba(255,255,255,0.03) 94px,transparent 96px,transparent 240px);"
               "animation:a2vBeam 44s linear infinite;}"
               "@keyframes a2vBeam{to{transform:translateX(240px);}}")
        inner = "<i></i>"
    elif t == "rays":
        # a very slow rotating conic light fan from the top.
        css = (".a2v-theme{position:absolute;inset:0;z-index:0;pointer-events:none;overflow:hidden;}"
               ".a2v-theme i{position:absolute;left:50%;top:-34%;width:1700px;height:1700px;margin-left:-850px;"
               "background:conic-gradient(from 0deg,transparent 0deg,rgba(255,255,255,0.035) 10deg,transparent 22deg,"
               "transparent 58deg,rgba(255,255,255,0.03) 70deg,transparent 82deg,transparent 130deg,"
               "rgba(255,255,255,0.03) 142deg,transparent 154deg);animation:a2vSpin 100s linear infinite;transform-origin:50% 50%;}"
               "@keyframes a2vSpin{to{transform:rotate(360deg);}}")
        inner = "<i></i>"
    elif t == "stars":
        # a field of faint stars gently twinkling.
        css = (".a2v-theme{position:absolute;inset:0;z-index:0;pointer-events:none;overflow:hidden;}"
               ".a2v-theme i{position:absolute;inset:0;background-image:"
               "radial-gradient(1.6px 1.6px at 18% 24%,rgba(255,255,255,0.6),transparent),"
               "radial-gradient(1.4px 1.4px at 68% 58%,rgba(255,255,255,0.5),transparent),"
               "radial-gradient(2px 2px at 42% 82%,rgba(255,255,255,0.5),transparent),"
               "radial-gradient(1.5px 1.5px at 86% 20%,rgba(255,255,255,0.55),transparent),"
               "radial-gradient(1.5px 1.5px at 30% 62%,rgba(255,255,255,0.4),transparent),"
               "radial-gradient(1.5px 1.5px at 78% 82%,rgba(255,255,255,0.45),transparent);"
               "animation:a2vTwinkle 6s ease-in-out infinite;}"
               "@keyframes a2vTwinkle{0%,100%{opacity:0.5;}50%{opacity:1;}}")
        inner = "<i></i>"
    else:
        return ""
    return ("<style>" + css + "</style>"
            "<script>(function(){var r=document.getElementById('root')||document.body;if(!r)return;"
            "var d=document.createElement('div');d.className='a2v-theme';d.innerHTML='" + inner + "';"
            "if(r.firstChild)r.insertBefore(d,r.firstChild);else r.appendChild(d);})();</script>")


def render_template(template_id: str, inputs: dict, out_html: Path,
                    accent=None, theme=None, hero_palette=None) -> dict:
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

    # Optional hero palette ("intro theme") — recolours frame-pain-hero via CSS
    # vars so the poster/thumbnail differs per video (channel grid looks varied).
    _hp = _hero_palette_css(hero_palette)
    if _hp:
        if "</head>" in new_html:
            new_html = new_html.replace("</head>", _hp + "</head>", 1)
        else:
            new_html = _hp + new_html

    # Optional ambient background theme (meta.theme in plan.md).
    _theme = _theme_layer(theme)
    if _theme:
        if "</body>" in new_html:
            new_html = new_html.replace("</body>", _theme + "</body>", 1)
        else:
            new_html = new_html + _theme

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
    meta = plan.get("meta") or {}
    accent = meta.get("accent")
    theme = meta.get("theme")   # aurora (default) / particles / grid

    # Hero palette ("intro theme") — ONE per video, keyed by slug so the same repo
    # is stable across re-renders and a channel's videos spread across the set.
    # meta.hero_theme (a palette name) overrides the auto pick; a per-scene
    # hero_theme overrides that. Applied only to HERO_TEMPLATES (the poster frame).
    slug = meta.get("slug") or run_dir.name
    base_palette = hero_palette_by_name(meta.get("hero_theme")) or pick_hero_palette(slug)

    results = []
    for s in scenes:
        sid = s["id"]
        template_id = s.get("templateId") or s.get("template_id")
        inputs = s.get("inputs") or {}
        if not template_id:
            results.append({"id": sid, "status": "skipped", "reason": "no templateId"})
            continue
        # per-scene accent/theme override beats the video-wide one
        scene_accent = s.get("accent") or accent
        scene_theme = s.get("theme") or theme
        hero_palette = None
        if template_id in HERO_TEMPLATES:
            hero_palette = hero_palette_by_name(s.get("hero_theme")) or base_palette
        out_html = scenes_dir / f"{sid}.html"
        r = render_template(template_id, inputs, out_html, accent=scene_accent,
                            theme=scene_theme, hero_palette=hero_palette)
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
    one.add_argument("--hero-theme", default=None,
                     help="Hero palette name (frame-pain-hero only): "
                          + ", ".join(p["name"] for p in HERO_PALETTES))
    allp = sub.add_parser("all", help="Render every scene in plan.md that has templateId")
    allp.add_argument("plan")
    args = parser.parse_args()

    if args.cmd == "list":
        print(json.dumps({"templates": list_templates()}, indent=2))
        return 0
    if args.cmd == "one":
        r = render_template(args.template_id, json.loads(args.inputs), Path(args.out).resolve(),
                            hero_palette=hero_palette_by_name(args.hero_theme))
        print(json.dumps(r, indent=2, ensure_ascii=False))
        return 0 if "error" not in r else 1
    r = render_all_from_plan(Path(args.plan).resolve())
    print(json.dumps(r, indent=2, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
