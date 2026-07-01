"""Phase 4.5 gate — render + inspect EVERY template scene HTML BEFORE the expensive
Phase 5 video render.

This is a hard block. It renders each `scenes/<id>.html`, runs the full scene_critic
(safe-zone bounds, 4:5 straddle, body overflow, TEXT CLIPPING incl. Vietnamese tone
marks, TEXT-vs-TEXT overlap, tight line-height, slop palette, neighbor diff) and exits
non-zero if ANY scene fails. Claude MUST fix the offending HTML and re-run until this
passes — never render video on a failing plan (each Phase 5 scene costs real minutes;
shipping a clipped/overlapping frame means throwing that work away).

Usage:  python -m lib.critic.scene_gate all <plan.md>
        exit 0 → every scene clean, safe to render
        exit 1 → at least one defect (see results[].issues), fix HTML + re-run
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

# Force UTF-8 stdout for Windows cp1252 (issue hints carry ≥, →, …, Vietnamese)
try:
    sys.stdout.reconfigure(encoding="utf-8")  # type: ignore[attr-defined]
    sys.stderr.reconfigure(encoding="utf-8")  # type: ignore[attr-defined]
except (AttributeError, OSError):
    pass

from .. import plan_yaml
from . import scene_critic


def gate(plan_path: Path) -> dict:
    """Inspect every template scene HTML in the plan's run dir; aggregate pass/fail."""
    plan = plan_yaml.load_plan(plan_path)
    scenes = plan.get("scenes") or []
    scenes_dir = plan_path.parent / "scenes"

    results: list[dict] = []
    rendered_pngs: list[Path] = []
    for s in scenes:
        sid = s.get("id")
        html = scenes_dir / f"{sid}.html"
        cap = s.get("capture_url")
        if not html.is_file():
            # Footage scenes (capture_url) render via repo_footage, not template HTML —
            # they're real screenshots, exempt from the HTML critic.
            if cap:
                results.append({"id": sid, "status": "footage_skipped", "capture_url": cap})
            else:
                results.append({
                    "id": sid, "status": "html_missing", "expected": str(html),
                    "fix": "Run `python -m lib.render.template_render all <plan.md>` first.",
                })
            continue
        r = scene_critic.evaluate(html, rendered_pngs[-2:])
        rendered_pngs.append(Path(r["png_path"]))
        results.append({
            "id": sid,
            "status": "pass" if r["pass"] else "fail",
            "issues": r["issues"],
        })

    hard_fail = [r for r in results if r["status"] in ("fail", "html_missing")]
    return {
        "plan_path": str(plan_path),
        "pass": len(hard_fail) == 0,
        "checked": sum(1 for r in results if r["status"] in ("pass", "fail")),
        "failed_scene_ids": [r["id"] for r in hard_fail],
        "results": results,
    }


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Phase 4.5 gate — inspect ALL scene HTML before Phase 5 render"
    )
    sub = parser.add_subparsers(dest="cmd", required=True)
    allp = sub.add_parser("all", help="Gate every scene in plan.md")
    allp.add_argument("plan")
    args = parser.parse_args()

    plan_path = Path(args.plan).resolve()
    if not plan_path.is_file():
        print(json.dumps({"error": "plan_not_found", "path": str(plan_path)}), file=sys.stderr)
        return 2

    result = gate(plan_path)
    print(json.dumps(result, indent=2, ensure_ascii=False))
    return 0 if result["pass"] else 1


if __name__ == "__main__":
    sys.exit(main())
