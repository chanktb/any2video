"""Scene critic — Phase 4 Gate (per-scene HTML).

Structure-agnostic: the lifted templates share no `.inner`/`.outer` scaffold, so we
render the scene and measure its actual TEXT elements. For each scene HTML:
  1. Render 1080×1920 screenshot via Playwright (fonts loaded, animations settled)
  2. Inspect the DOM for real, ship-blocking defects:
     - Text overflowing the viewport edge (cut off)              → text_overflow_viewport
     - Big primary text past the side safe margins (x 90..990)   → text_past_side_safezone
     - Primary text straddling a 4:5 crop line (y=285 / y=1635)  → text_straddles_4x5_cut
     - Text clipped by an overflow box, incl. VN tone marks Ậ/Ỗ  → text_clipped[_vn_diacritic]
     - Two text blocks overlapping / stuck together             → text_elements_overlap
     - Multi-line VN text with line-height < 1.15               → line_height_too_tight
     - AI-slop palette / combos                                 → slop_banned_*
  3. Compare screenshot with previous 2 scenes — perceptual diff (no template repetition)

Faint "ghost echo" decoration (giant background numbers at opacity ~0.1 that bleed past
the frame by design) is filtered out so it isn't judged as content.

WCAG contrast is intentionally skipped from the MVP — pulling computed colors out of
arbitrary CSS is complex; this is a TODO.
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

# Force UTF-8 stdout for Windows cp1252 (Vietnamese diacritics in samples/hints)
try:
    sys.stdout.reconfigure(encoding="utf-8")  # type: ignore[attr-defined]
    sys.stderr.reconfigure(encoding="utf-8")  # type: ignore[attr-defined]
except (AttributeError, OSError):
    pass

from PIL import Image, ImageChops

NEIGHBOR_DIFF_MIN = 0.01  # mean pixel diff (normalized 0..1).
# Tuned for dark themes with shared palette: actual template-identical scenes
# diff ~0.001-0.005; visually-distinct scenes on same palette diff ~0.015-0.08.
# Lower-bound 0.01 catches true repetition without flagging palette-consistent videos.

# ───── Anti-slop guardrails (visual-explainer SKILL.md L62-73 + CHANGELOG 0.3.0) ─────
# Hex colors AI generators default to that scream "I am AI slop". Hard ban.
SLOP_PALETTE_BANNED = {
    # Tailwind violet/fuchsia defaults
    "#8b5cf6", "#7c3aed", "#a78bfa", "#c4b5fd",   # violet-500/600/400/300
    "#d946ef", "#c026d3", "#e879f9", "#f0abfc",   # fuchsia-500/600/400/300
    # Neon cyan+magenta combos (vaporwave slop)
    "#ff00ff", "#00ffff", "#ff00aa",
}

# Combinations that, when found TOGETHER in the same scene, signal slop even if
# each individually is fine (e.g. fuchsia + cyan = AI dashboard slop).
SLOP_COMBOS_BANNED = [
    ({"#8b5cf6", "#d946ef"}, "violet + fuchsia (Tailwind AI slop)"),
    ({"#00ffff", "#ff00ff"}, "cyan + magenta neon (vaporwave slop)"),
    ({"#a78bfa", "#f0abfc"}, "soft violet + soft fuchsia (AI dashboard slop)"),
]


def render_and_inspect(html_path: Path, png_path: Path) -> dict:
    """Render screenshot + extract DOM bounds. Uses sync_playwright."""
    from playwright.sync_api import sync_playwright

    inspect_js = r"""
    () => {
      // Structure-agnostic: the lifted templates have NO shared .inner/.outer scaffold,
      // so we measure the actual TEXT elements against the 9:16 safe zones directly.
      const VW = 1080, VH = 1920;
      const SAFE = { x0: 90, x1: 990, y0: 285, y1: 1635 };   // side margins + 4:5 crop-safe band

      const sel = (el) => {
        let s = el.tagName.toLowerCase();
        if (el.id) s += '#' + el.id;
        if (typeof el.className === 'string' && el.className.trim())
          s += '.' + el.className.trim().split(/\s+/).slice(0, 3).join('.');
        return s.slice(0, 80);
      };
      const ownText = (el) => {
        let t = '';
        for (const n of el.childNodes)
          if (n.nodeType === 3 && n.nodeValue) t += n.nodeValue;
        return t.trim();
      };
      // Vietnamese chars carrying a STACKED diacritic (tone + circumflex/breve) that
      // paints well above cap-height — Ậ Ầ Ấ Ẫ Ẩ Ộ Ổ Ỗ Ồ Ố Ề Ể Ễ … + lowercase.
      const VN_STACK = /[ẬẦẤẪẨỘỔỖỒỐẶẰẮẴẲỆỂỄỀẾậầấẫẩộổỗồốặằắẵẳệểễềế]/;

      const allElems = Array.from(document.querySelectorAll('body *')).filter(e => {
        const r = e.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
      });
      const isFullBleed = (r) => r.y <= 6 && r.bottom >= VH - 6;
      // Cumulative opacity up the ancestor chain. Faint "ghost echo" decoration —
      // giant background numbers that settle at opacity ~0.1 and bleed past the frame
      // by design (clipped by the stage) — must NOT be judged as readable content.
      const effOpacity = (el) => {
        let op = 1, n = el;
        while (n && n !== document.body) {
          const o = parseFloat(getComputedStyle(n).opacity);
          if (!isNaN(o)) op *= o;
          n = n.parentElement;
        }
        return op;
      };

      // Every visible, non-faint TEXT-bearing element (own text node, not a container).
      const textEls = allElems
        .filter(e => ownText(e).length > 0)
        .map(e => ({ e, r: e.getBoundingClientRect(), t: ownText(e),
                     fs: parseFloat(getComputedStyle(e).fontSize) || 0, op: effOpacity(e) }))
        .filter(o => o.r.width > 0 && o.r.height > 0 && !isFullBleed(o.r) && o.op >= 0.25);

      // Body content bbox EXCLUDING the top brand-bar band (y<320) and bottom footer/
      // caption band (bottom>1600) — for the "content floated low" (top-anchor) check.
      let bTop = Infinity, bBot = -Infinity, bCount = 0;
      for (const o of textEls) {
        if (o.r.y < 320 || o.r.bottom > 1600) continue;
        if (o.r.y < bTop) bTop = o.r.y;
        if (o.r.bottom > bBot) bBot = o.r.bottom;
        bCount++;
      }
      const content_body = bCount ? { top: Math.round(bTop), bottom: Math.round(bBot), count: bCount } : null;

      // (A) Text crossing a 4:5 crop line (feed crop slices primary content in half).
      const straddlers = [];
      for (const o of textEls) {
        const r = o.r;
        if (r.y < SAFE.y0 && r.bottom > SAFE.y0)
          straddlers.push({ sel: sel(o.e), edge: SAFE.y0, top: Math.round(r.y), bottom: Math.round(r.bottom), sample: o.t.slice(0, 20) });
        else if (r.y < SAFE.y1 && r.bottom > SAFE.y1)
          straddlers.push({ sel: sel(o.e), edge: SAFE.y1, top: Math.round(r.y), bottom: Math.round(r.bottom), sample: o.t.slice(0, 20) });
      }

      // (B) Text overflowing the VIEWPORT edge (cut off the screen) — unambiguous defect.
      const viewport_overflow = [];
      for (const o of textEls) {
        const r = o.r; const edges = [];
        if (r.x < -2) edges.push('left');
        if (r.right > VW + 2) edges.push('right');
        if (r.y < -2) edges.push('top');
        if (r.bottom > VH + 2) edges.push('bottom');
        if (edges.length)
          viewport_overflow.push({ sel: sel(o.e), edges, sample: o.t.slice(0, 24),
            box: { x: Math.round(r.x), right: Math.round(r.right), y: Math.round(r.y), bottom: Math.round(r.bottom) } });
      }

      // (C) BIG primary text past the side safe margins (x 90..990) — edge-cut risk.
      // Small edge labels (kicker/footer/rotated side rails, fs<40) are exempt by design.
      const side_overflow = [];
      for (const o of textEls) {
        if (o.fs < 40) continue;
        const r = o.r;
        if (r.x < SAFE.x0 - 2 || r.right > SAFE.x1 + 2)
          side_overflow.push({ sel: sel(o.e), sample: o.t.slice(0, 24),
            x: Math.round(r.x), right: Math.round(r.right), fs: Math.round(o.fs) });
      }

      // (D) Clipping: element clips overflow AND its content exceeds the box → text cut
      // (word truncated, or a Vietnamese tone mark sliced at the top).
      const clipped = [];
      for (const e of allElems) {
        if (effOpacity(e) < 0.25) continue;   // faint decoration — clip is intentional
        const cs = getComputedStyle(e);
        const clipX = cs.overflowX === 'hidden' || cs.overflowX === 'clip';
        const clipY = cs.overflowY === 'hidden' || cs.overflowY === 'clip';
        if (!clipX && !clipY) continue;
        const overX = clipX ? (e.scrollWidth - e.clientWidth) : 0;
        const overY = clipY ? (e.scrollHeight - e.clientHeight) : 0;
        if (overX > 2 || overY > 2) {
          const txt = ownText(e);
          clipped.push({ sel: sel(e), overX, overY,
            has_text: txt.length > 0, vn_stacked: VN_STACK.test(txt), sample: txt.slice(0, 24) });
        }
      }

      // (E) Overlap: two text-bearing, non-nested elements whose boxes intersect.
      const overlaps = [];
      for (let i = 0; i < textEls.length; i++) {
        for (let j = i + 1; j < textEls.length; j++) {
          const A = textEls[i], B = textEls[j];
          if (A.e.contains(B.e) || B.e.contains(A.e)) continue;   // parent/child, not a clash
          const ix = Math.min(A.r.right, B.r.right) - Math.max(A.r.x, B.r.x);
          const iy = Math.min(A.r.bottom, B.r.bottom) - Math.max(A.r.y, B.r.y);
          if (ix <= 0 || iy <= 0) continue;
          const inter = ix * iy;
          const smaller = Math.min(A.r.width * A.r.height, B.r.width * B.r.height);
          if (smaller > 0 && inter / smaller > 0.12) {
            overlaps.push({ a: sel(A.e), b: sel(B.e), pct: Math.round(inter / smaller * 100),
              a_text: A.t.slice(0, 20), b_text: B.t.slice(0, 20) });
          }
        }
      }

      // (F) Line-height too tight on multi-line body text (VN needs headroom).
      const tight = [];
      for (const o of textEls) {
        const cs = getComputedStyle(o.e);
        const lh = parseFloat(cs.lineHeight);
        if (!o.fs || isNaN(lh)) continue;
        const lines = Math.round(o.r.height / lh);
        if (lines >= 2 && lh / o.fs < 1.15)
          tight.push({ sel: sel(o.e), ratio: +(lh / o.fs).toFixed(2), lines, sample: o.t.slice(0, 24) });
      }

      // (F2) BIG display text carrying VN STACKED tone marks with too little vertical
      // headroom. At line-height ~1.0 the marks (Ầ Ổ Ố Ề Ạ …) paint above/below the
      // line box and get sliced — WORST with background-clip:text, where the gradient
      // box won't even fill above the cap-height (the mark just vanishes). Box-model
      // overflow can't see this (scrollHeight==clientHeight), so measure headroom =
      // line-height slack + top padding directly. Fires on a SINGLE line too, unlike (F).
      const diacritic_tight = [];
      for (const o of textEls) {
        if (o.fs < 55 || !VN_STACK.test(o.t)) continue;
        const cs = getComputedStyle(o.e);
        const lh = parseFloat(cs.lineHeight);
        if (isNaN(lh)) continue;                 // 'normal' (~1.2) is safe → skip
        const padTop = parseFloat(cs.paddingTop) || 0;
        // Above-cap room ≈ HALF the line-height slack (the other half drops below the
        // baseline as descender space) PLUS all of the top padding. Stacked marks
        // (circumflex+tone: Ổ Ầ Ề) need ≳0.22em of it or their top gets sliced.
        const headroom = (lh / o.fs - 1) / 2 + padTop / o.fs;
        const clipText = /text/.test((cs.webkitBackgroundClip || cs.backgroundClip || ''));
        if (headroom < (clipText ? 0.22 : 0.14))
          diacritic_tight.push({ sel: sel(o.e), fs: Math.round(o.fs),
            ratio: +(lh / o.fs).toFixed(2), pad_top_px: Math.round(padTop),
            headroom: +headroom.toFixed(2), clip_text: clipText, sample: o.t.slice(0, 24) });
      }

      // (G) Empty content box — a bordered, card-sized box that rendered with NO visible
      // content inside (icon/font/child failed → hollow rectangle showing only its border).
      const hasVisibleContent = (el) => {
        if ((el.textContent || '').trim().length) return true;              // any text, self or child
        for (const m of el.querySelectorAll('img,svg,canvas,video,picture')) {
          if (m.tagName === 'IMG') { if (m.naturalWidth > 0) return true; }
          else { const r = m.getBoundingClientRect(); if (r.width > 1 && r.height > 1) return true; }
        }
        for (const c of [el, ...el.querySelectorAll('*')]) {
          const cs = getComputedStyle(c);
          if (cs.backgroundImage && cs.backgroundImage !== 'none') return true;
          for (const pe of ['::before', '::after']) {
            const p = getComputedStyle(c, pe).content;
            if (p && p !== 'none' && p !== 'normal' && p !== '""' && p !== "''") return true;  // icon-font glyph etc.
          }
        }
        return false;
      };
      const empty_blocks = [];
      for (const e of allElems) {
        if (effOpacity(e) < 0.25) continue;
        const cs = getComputedStyle(e);
        const sides = ['borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth']
          .filter(k => (parseFloat(cs[k]) || 0) >= 1).length;
        if (sides < 3 || cs.borderStyle === 'none') continue;   // need a real box outline, not a single underline/bar
        const r = e.getBoundingClientRect();
        if (r.width < 60 || r.height < 40) continue;            // chips / thin rules exempt
        if (!hasVisibleContent(e))
          empty_blocks.push({ sel: sel(e), w: Math.round(r.width), h: Math.round(r.height) });
      }

      // (H) Broken <img> — declared but failed to load → an empty image frame.
      const broken_images = [];
      for (const img of document.querySelectorAll('img')) {
        const r = img.getBoundingClientRect();
        if (r.width < 2 && r.height < 2) continue;              // hidden / spacer
        if (img.complete && img.naturalWidth === 0)
          broken_images.push({ sel: sel(img), src: (img.getAttribute('src') || '').slice(0, 60) });
      }

      return {
        body: { scrollWidth: document.body.scrollWidth, scrollHeight: document.body.scrollHeight },
        element_count: allElems.length,
        text_count: textEls.length,
        straddlers: straddlers.slice(0, 12),
        viewport_overflow: viewport_overflow.slice(0, 12),
        side_overflow: side_overflow.slice(0, 12),
        clipped: clipped.slice(0, 12),
        text_overlaps: overlaps.slice(0, 12),
        tight_line_height: tight.slice(0, 12),
        diacritic_tight: diacritic_tight.slice(0, 12),
        empty_blocks: empty_blocks.slice(0, 12),
        broken_images: broken_images.slice(0, 12),
        content_body: content_body,
      };
    }
    """
    with sync_playwright() as pw:
        browser = pw.chromium.launch()
        ctx = browser.new_context(viewport={"width": 1080, "height": 1920}, device_scale_factor=1)
        page = ctx.new_page()
        page.goto("file:///" + str(html_path).replace("\\", "/"))
        page.wait_for_load_state("networkidle", timeout=5000)
        # Wait for web fonts (autofit + diacritic metrics depend on real font) and let
        # CSS entrance @keyframes settle, so clip/overlap rects are FINAL not mid-animation.
        try:
            page.evaluate("() => (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => true)")
        except Exception:
            pass
        page.wait_for_timeout(1400)
        dom = page.evaluate(inspect_js)
        page.screenshot(path=str(png_path), full_page=False)
        browser.close()
    return dom


def neighbor_diff(png_path: Path, neighbor_paths: list[Path]) -> dict:
    """Mean normalized pixel diff between current scene and each prior scene."""
    if not neighbor_paths:
        return {"diffs": [], "min_diff": None}
    cur = Image.open(png_path).convert("RGB").resize((270, 480))
    diffs = []
    for n in neighbor_paths:
        if not n.is_file():
            continue
        prev = Image.open(n).convert("RGB").resize((270, 480))
        d = ImageChops.difference(cur, prev)
        # normalize: mean of all channel values / 255
        hist = d.histogram()
        total = sum(i * v for i, v in enumerate(hist[:256]))
        total += sum(i * v for i, v in enumerate(hist[256:512]))
        total += sum(i * v for i, v in enumerate(hist[512:768]))
        pixels = 270 * 480 * 3
        diffs.append({"vs": n.name, "mean_diff": round(total / (pixels * 255), 4)})
    return {
        "diffs": diffs,
        "min_diff": min((d["mean_diff"] for d in diffs), default=None),
    }


def evaluate(html_path: Path, neighbor_pngs: list[Path]) -> dict:
    """Run inspection + neighbor diff, return issues list."""
    png_path = html_path.with_suffix(".png")
    dom = render_and_inspect(html_path, png_path)

    issues: list[dict] = []

    # NOTE: no document.body scroll-size check — decorative "ghost echo" art legitimately
    # bleeds past the frame (the stage clips it visually). Real cut-offs are caught
    # precisely by text_overflow_viewport below (faint decoration already filtered out).

    # Text overflowing the VIEWPORT edge — the frame literally cuts the text off.
    for v in dom.get("viewport_overflow") or []:
        issues.append({
            "kind": "text_overflow_viewport",
            "selector": v["sel"],
            "edges": v["edges"],
            "sample": v.get("sample", ""),
            "box": v.get("box"),
            "fix": "Text is cut off at a screen edge — shorten the string / shrink the font "
                   "/ move it inside the 1080×1920 frame. Re-do the HTML.",
        })

    # Big primary text pushed past the side safe margins (x 90..990) — edge-cut risk.
    for s in dom.get("side_overflow") or []:
        issues.append({
            "kind": "text_past_side_safezone",
            "selector": s["sel"],
            "x": s["x"], "right": s["right"], "font_px": s["fs"],
            "sample": s.get("sample", ""),
            "fix": "Keep primary text within x 90..990 — shorten it or reduce the font so it "
                   "doesn't run to the edge.",
        })

    # Primary TEXT straddling a 4:5 crop line (feed crop slices it in half).
    for s in dom.get("straddlers") or []:
        issues.append({
            "kind": "text_straddles_4x5_cut",
            "selector": s["sel"], "edge_y": s["edge"],
            "top": s.get("top"), "bottom": s.get("bottom"), "sample": s.get("sample", ""),
            "fix": "Move this text fully above y=285 or below y=1635 (or into the INNER zone) — "
                   "the 4:5 feed crop would slice it.",
        })

    # Text clipped by an overflow-hidden box (word cut off, or a Vietnamese tone
    # mark sliced at the top edge — Ậ Ỗ Ồ). Each is a re-do-the-HTML defect.
    # Only flag elements clipping their OWN text — a stage/root box clipping full-bleed
    # background art (has_text=false) is intentional, not a defect.
    for c in dom.get("clipped") or []:
        if not c.get("has_text"):
            continue
        issues.append({
            "kind": "text_clipped_vn_diacritic" if c.get("vn_stacked") else "text_clipped",
            "selector": c["sel"],
            "overflow_x_px": c["overX"],
            "overflow_y_px": c["overY"],
            "sample": c.get("sample", ""),
            "fix": ("Add top padding / raise line-height / set overflow:visible so the "
                    "Vietnamese stacked diacritic isn't sliced; or shorten the text."
                    if c.get("vn_stacked") else
                    "Text overflows its clipping box — shorten the string, shrink the font, "
                    "or widen/heighten the container. Do NOT ship clipped text."),
        })

    # Two text elements physically overlapping (đè chữ lên nhau / dính vào nhau).
    for o in dom.get("text_overlaps") or []:
        issues.append({
            "kind": "text_elements_overlap",
            "a": o["a"], "b": o["b"], "overlap_pct": o["pct"],
            "a_text": o.get("a_text", ""), "b_text": o.get("b_text", ""),
            "fix": "Two text blocks overlap — add spacing/padding or move one; re-do the HTML.",
        })

    # Multi-line body text with too-tight leading (Vietnamese needs line-height ≥ 1.15).
    for t in dom.get("tight_line_height") or []:
        issues.append({
            "kind": "line_height_too_tight",
            "selector": t["sel"], "ratio": t["ratio"], "lines": t["lines"],
            "sample": t.get("sample", ""),
            "fix": "Raise line-height to ≥ 1.15 (VN diacritics need vertical room between lines).",
        })

    # Big display text whose VN stacked tone marks get sliced for lack of headroom
    # (line-height ~1.0 + background-clip:text) — invisible to box-model overflow.
    for d in dom.get("diacritic_tight") or []:
        issues.append({
            "kind": "text_clipped_vn_diacritic",
            "selector": d["sel"],
            "font_px": d["fs"], "line_height_ratio": d["ratio"],
            "pad_top_px": d["pad_top_px"], "headroom_em": d["headroom"],
            "background_clip_text": d.get("clip_text", False),
            "sample": d.get("sample", ""),
            "fix": "Big Vietnamese text with stacked tone marks (Ầ Ổ Ố Ề Ạ) has too little "
                   "headroom — the marks get sliced"
                   + (" (background-clip:text won't paint above the box)" if d.get("clip_text") else "")
                   + ". Raise line-height (≈1.4) and/or add padding-top + overflow:visible.",
        })

    # Empty content box — a bordered card that rendered hollow (icon/font/child failed).
    # NEVER ship a block that's just a border with nothing inside.
    for b in dom.get("empty_blocks") or []:
        issues.append({
            "kind": "empty_block",
            "selector": b["sel"], "w": b["w"], "h": b["h"],
            "fix": "A bordered box rendered with NO content (icon/font/child failed to build). "
                   "Fix the icon/font or fill the block — or use a different template. "
                   "Never ship an empty box showing only its border.",
        })

    # Broken <img> — declared but failed to load → empty image frame.
    for im in dom.get("broken_images") or []:
        issues.append({
            "kind": "broken_image",
            "selector": im["sel"], "src": im.get("src", ""),
            "fix": "Image failed to load (naturalWidth=0) — fix the src / use a reachable asset "
                   "or a different visual. Never ship a broken image frame.",
        })

    # Content floated LOW — a big empty band above while content sits near the bottom.
    # Top-anchor it (spare space belongs at the bottom, not the top). Body bbox excludes
    # the top brand-bar + bottom footer/caption bands. Conservative thresholds so genuine
    # center-compositions (hero-stat over ghost echo, radial diagram) don't trip.
    cb = dom.get("content_body")
    if cb and cb.get("count", 0) >= 2 and cb["top"] > 620 and cb["bottom"] > 1350:
        issues.append({
            "kind": "content_bottom_heavy",
            "body_top": cb["top"], "body_bottom": cb["bottom"],
            "fix": "Content starts low (big empty band above) and runs to the bottom. Top-anchor "
                   "it — `justify-content: flex-start` + top padding, or a fixed `top:` near the "
                   "safe-zone top instead of `top:50%`. Spare space belongs at the BOTTOM (SKILL 5b).",
        })

    # Anti-slop: scan the HTML source for banned palette + banned combos
    try:
        html_src = html_path.read_text(encoding="utf-8").lower()
        import re as _re
        hex_colors = set(_re.findall(r"#[0-9a-f]{6}", html_src))
        for banned in SLOP_PALETTE_BANNED:
            if banned in hex_colors:
                issues.append({
                    "kind": "slop_banned_color",
                    "color": banned,
                    "hint": "Tailwind violet/fuchsia defaults + neon cyan/magenta scream AI slop. Pick a palette with intent.",
                })
        for combo, why in SLOP_COMBOS_BANNED:
            if combo.issubset(hex_colors):
                issues.append({
                    "kind": "slop_banned_combo",
                    "combo": sorted(combo),
                    "reason": why,
                })
    except OSError:
        pass

    # Neighbor diff
    nd = neighbor_diff(png_path, neighbor_pngs)
    if nd["min_diff"] is not None and nd["min_diff"] < NEIGHBOR_DIFF_MIN:
        issues.append({
            "kind": "scene_too_similar_to_neighbor",
            "min_diff": nd["min_diff"],
            "threshold": NEIGHBOR_DIFF_MIN,
            "details": nd["diffs"],
        })

    return {
        "pass": len(issues) == 0,
        "png_path": str(png_path),
        "dom_summary": dom,
        "neighbor_diff": nd,
        "issues": issues,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Phase 4 critic — render + inspect one scene HTML")
    parser.add_argument("html", help="Path to scene HTML")
    parser.add_argument("--neighbors", nargs="*", default=[], help="Paths to prior-scene PNGs for diff")
    args = parser.parse_args()

    html_path = Path(args.html).resolve()
    if not html_path.is_file():
        print(json.dumps({"error": "html_not_found", "path": str(html_path)}), file=sys.stderr)
        return 2

    neighbor_pngs = [Path(p).resolve() for p in args.neighbors]
    result = evaluate(html_path, neighbor_pngs)
    print(json.dumps(result, indent=2, ensure_ascii=False))
    return 0 if result["pass"] else 1


if __name__ == "__main__":
    sys.exit(main())
