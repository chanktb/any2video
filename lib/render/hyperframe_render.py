"""Default render path (static screenshot → ffmpeg loop).

MVP impl: take ONE screenshot of the scene HTML, then ffmpeg-loop it for the
measured TTS duration. Fast, deterministic, ~1 sec per scene.

The name "hyperframe" preserves the SKILL.md contract (default = hyperframe-style
composite). Future revision can swap this for a GSAP-timeline renderer to get
proper entry animations on each frame.
"""
from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
from pathlib import Path

from .. import plan_yaml

FPS = 30


def render_scene(html_path: Path, duration_sec: float, out_mp4: Path) -> dict:
    """Screenshot the HTML, then ffmpeg-loop to mp4 of `duration_sec`."""
    from playwright.sync_api import sync_playwright

    png_path = html_path.with_suffix(".png")
    with sync_playwright() as pw:
        browser = pw.chromium.launch()
        ctx = browser.new_context(viewport={"width": 1080, "height": 1920}, device_scale_factor=1)
        page = ctx.new_page()
        page.goto("file:///" + str(html_path).replace("\\", "/"))
        page.wait_for_load_state("networkidle", timeout=5000)
        page.wait_for_timeout(300)  # let any opacity-fade settle
        page.screenshot(path=str(png_path), full_page=False)
        browser.close()

    cp = subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error",
         "-loop", "1", "-i", str(png_path),
         "-t", f"{duration_sec:.3f}",
         "-r", str(FPS),
         "-pix_fmt", "yuv420p",
         "-vf", "scale=1080:1920:flags=lanczos",
         "-c:v", "libx264", "-preset", "veryfast", "-crf", "20",
         str(out_mp4)],
        capture_output=True, text=True,
    )
    if cp.returncode != 0:
        return {"error": "ffmpeg_failed", "stderr": cp.stderr[-500:]}

    return {"png_path": str(png_path), "mp4_path": str(out_mp4), "duration_sec": duration_sec, "fps": FPS}


def render_all(plan_path: Path) -> dict:
    """Render every scene in plan.md → scenes/<id>.mp4."""
    if not shutil.which("ffmpeg"):
        return {"error": "ffmpeg_not_on_path"}

    plan = plan_yaml.load_plan(plan_path)
    scenes = plan.get("scenes") or []
    if not scenes:
        return {"error": "no_scenes_in_plan"}

    run_dir = plan_path.parent
    scenes_dir = run_dir / "scenes"

    results = []
    for s in scenes:
        sid = s["id"]
        html = scenes_dir / f"{sid}.html"
        if not html.is_file():
            results.append({"id": sid, "error": "html_missing", "expected": str(html)})
            continue
        duration = float(s.get("duration_sec") or 4.0)
        out_mp4 = scenes_dir / f"{sid}.mp4"
        try:
            r = render_scene(html, duration, out_mp4)
            r["id"] = sid
            results.append(r)
        except Exception as e:
            results.append({"id": sid, "error": str(e), "type": type(e).__name__})

    return {"plan_path": str(plan_path), "scene_results": results}


def main() -> int:
    parser = argparse.ArgumentParser(description="Default render — static screenshot + ffmpeg loop per scene")
    sub = parser.add_subparsers(dest="cmd", required=True)
    one = sub.add_parser("one", help="Render a single scene HTML")
    one.add_argument("html")
    one.add_argument("--duration", type=float, required=True)
    one.add_argument("--out", required=True)
    allp = sub.add_parser("all", help="Render every scene in plan.md")
    allp.add_argument("plan")
    args = parser.parse_args()

    if args.cmd == "one":
        r = render_scene(Path(args.html).resolve(), args.duration, Path(args.out).resolve())
        print(json.dumps(r, indent=2, ensure_ascii=False))
        return 0 if "error" not in r else 1

    r = render_all(Path(args.plan).resolve())
    print(json.dumps(r, indent=2, ensure_ascii=False))
    return 0 if "error" not in r else 1


if __name__ == "__main__":
    sys.exit(main())
