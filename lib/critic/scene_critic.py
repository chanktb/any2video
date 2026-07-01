"""Scene critic — Phase 4 Gate (per-scene HTML).

For each scene HTML:
  1. Render 1080×1920 screenshot via Playwright
  2. Inspect DOM for:
     - .inner content stays within INNER zone (x 90..990, y 345..1575)
     - No element straddles the 4:5 cut lines (y=285 or y=1635)
     - Body overflow = 0
  3. Compare screenshot with previous 2 scenes — mean perceptual diff
     above threshold (no template repetition)

WCAG contrast is intentionally skipped from the MVP — pulling computed colors
out of arbitrary CSS is complex; this is a TODO. Most contrast issues are
caught by the design-tokens enforcement upstream.
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from PIL import Image, ImageChops

INNER = {"x_min": 90, "x_max": 990, "y_min": 345, "y_max": 1575}
OUTER = {"x_min": 90, "x_max": 990, "y_min": 285, "y_max": 1635}
CUT_TOP, CUT_BOT = 285, 1635
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
      const inner = document.querySelector('.inner');
      const outer = document.querySelector('.outer');
      const top    = document.querySelector('.out-top');
      const bottom = document.querySelector('.out-bottom');
      const rectsFor = (el) => {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return {x: r.x, y: r.y, w: r.width, h: r.height, right: r.right, bottom: r.bottom};
      };
      const allElems = Array.from(document.querySelectorAll('body *')).filter(e => {
        const r = e.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
      });
      const straddlers = [];
      // Full-bleed = element nearly fills the viewport vertically (background art, starfield, vignette).
      // Allow up to 6px slack for transforms / sub-pixel animation positioning.
      const isFullBleed = (r) => r.y <= 6 && r.bottom >= 1914;
      for (const e of allElems) {
        const r = e.getBoundingClientRect();
        if (isFullBleed(r)) continue;  // background art / canvas-spanning gradient — exempt
        if (r.y < 285 && r.bottom > 285) straddlers.push({tag: e.tagName, cls: e.className, edge: 285, top: r.y, bottom: r.bottom});
        if (r.y < 1635 && r.bottom > 1635) straddlers.push({tag: e.tagName, cls: e.className, edge: 1635, top: r.y, bottom: r.bottom});
      }
      return {
        inner: rectsFor(inner),
        outer: rectsFor(outer),
        out_top: rectsFor(top),
        out_bottom: rectsFor(bottom),
        body: { scrollWidth: document.body.scrollWidth, scrollHeight: document.body.scrollHeight },
        element_count: allElems.length,
        straddlers: straddlers.slice(0, 12),
      };
    }
    """
    with sync_playwright() as pw:
        browser = pw.chromium.launch()
        ctx = browser.new_context(viewport={"width": 1080, "height": 1920}, device_scale_factor=1)
        page = ctx.new_page()
        page.goto("file:///" + str(html_path).replace("\\", "/"))
        page.wait_for_load_state("networkidle", timeout=5000)
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

    # Body overflow check (tolerate 2px for border/sub-pixel rounding)
    body = dom.get("body") or {}
    if body.get("scrollWidth", 0) > 1082:
        issues.append({"kind": "body_overflow_x", "got": body["scrollWidth"]})
    if body.get("scrollHeight", 0) > 1922:
        issues.append({"kind": "body_overflow_y", "got": body["scrollHeight"]})

    # Inner bounds check. Three valid configurations:
    #   - Intro/outro full-card: y=285, h≈1350 — full OUTER safe (no caption-overlay slot)
    #   - Standard compact:      y=345, h≈1015 — caption-overlay reserves bottom 215px
    #   - Standard full:         y=345, h≈1230 — no caption-overlay slot
    VALID_INNER = [
        {"y": 285, "h_range": (1340, 1360), "tag": "intro_outro_full"},
        {"y": 345, "h_range": (1005, 1025), "tag": "standard_compact"},
        {"y": 345, "h_range": (1220, 1240), "tag": "standard_full"},
    ]
    inner = dom.get("inner")
    if inner is None:
        issues.append({"kind": "inner_div_missing"})
    else:
        if abs(inner["x"] - INNER["x_min"]) > 5 or abs(inner["w"] - (INNER["x_max"] - INNER["x_min"])) > 10:
            issues.append({"kind": "inner_x_bounds_wrong", "got": [inner["x"], inner["w"]]})
        matched = any(
            abs(inner["y"] - cfg["y"]) <= 5 and cfg["h_range"][0] <= inner["h"] <= cfg["h_range"][1]
            for cfg in VALID_INNER
        )
        if not matched:
            issues.append({
                "kind": "inner_bounds_wrong",
                "got": {"y": inner["y"], "h": inner["h"]},
                "valid_configs": [{"y": c["y"], "h": c["h_range"], "use": c["tag"]} for c in VALID_INNER],
            })

    # 4:5 cut line straddlers
    for s in dom.get("straddlers") or []:
        issues.append({"kind": "element_straddles_4x5_cut", "edge_y": s["edge"], "tag": s["tag"], "cls": s["cls"]})

    # Out-top / Out-bottom must not cross 4:5 boundary
    ot = dom.get("out_top")
    if ot and ot["bottom"] > CUT_TOP:
        issues.append({"kind": "out_top_crosses_4x5_edge", "bottom": ot["bottom"]})
    ob = dom.get("out_bottom")
    if ob and ob["y"] < CUT_BOT:
        issues.append({"kind": "out_bottom_crosses_4x5_edge", "top": ob["y"]})

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
