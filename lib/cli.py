"""Friendly entrypoint — `python -m any2video.lib.cli <input>`.

Runs Phase 1 (source extract) and prints next-step guidance for Claude. This
is NOT a single-shot orchestrator: Claude drives the loop per SKILL.md, calling
each module (sources, tts, critic, render, compose) as discrete steps.
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from . import paths as P
from .sources import router as R


def init(source: str, lang: str = "vi", fast: bool = False) -> dict:
    """Phase 1 — detect type, extract source, write source_pack.json + per-type bundle.

    `lang` (default 'vi') drives the narration language in Phase 2 + the TTS voice
    in Phase 3. `fast` switches Phase 5 render to the static-screenshot path (preview
    only; motion lost) instead of the default Playwright video recording.
    """
    pack = R.dispatch(source)
    pack["lang"] = lang
    pack["render_mode"] = "fast" if fast else "rich"
    render_module = "hyperframe_render" if fast else "playwright_render"
    pack["next_steps"] = [
        "Read source_pack.json + per-type bundle (github_bundle.json / article.md / input.txt).",
        f"Draft analysis.md with the 7 fixed sections (Problem/Solution/Architecture/Flow/How to use/Why/Evidence) → {pack['run_dir']}/analysis.md",
        f"Draft plan.md per templates/plan-schema.md. Narration MUST be in '{lang}'. Include meta.lang: '{lang}', meta.brand, meta.footer. EACH non-footage scene MUST have a `templateId` from templates/scenes/CATALOG.md + an `inputs` block matching that template's slots. Default TTS = MALE + Google (voice: vi-VN-Chirp3-HD-Charon, voice_provider: google).",
        "Validate: python -m lib.critic.plan_critic <plan.md> --analysis <analysis.md>",
        "Synthesize TTS: python -m lib.tts.narrate <plan.md>",
        "Generate scene HTML FROM TEMPLATES (guarded): python -m lib.render.template_render all <plan.md>. This bakes in the 3-tier safe zones + brand bars + caption-band + accent-spacing guards. DO NOT hand-write scene HTML — free-handed HTML loses every guard (safezone violations, overlapping text, stuck coloured words).",
        "Validate each: python -m lib.critic.scene_critic <scene.html> --neighbors <prev pngs>",
        f"Render scenes: python -m lib.render.{render_module} all <plan.md>",
        "Compose final: python -m lib.compose.ffmpeg_compose <plan.md> --gap 350  (gap-hardcut = AV-sync; karaoke on by default; NO --crossfade)",
    ]
    return pack


def status(slug: str) -> dict:
    """Inspect a run dir, report which phases have artifacts."""
    run = P.run_dir(slug, create=False)
    if not run.is_dir():
        return {"error": "run_not_found", "slug": slug, "expected": str(run)}

    def exists(rel: str) -> bool:
        return (run / rel).exists()

    scenes_dir = run / "scenes"
    scene_files = sorted(scenes_dir.glob("*")) if scenes_dir.is_dir() else []
    return {
        "slug": slug,
        "run_dir": str(run),
        "phase_1_source_pack":      exists("source_pack.json"),
        "phase_1_analysis":         exists("analysis.md"),
        "phase_2_plan":             exists("plan.md"),
        "phase_3_tts_mp3_count":    sum(1 for f in scene_files if f.suffix == ".mp3"),
        "phase_4_html_count":       sum(1 for f in scene_files if f.suffix == ".html"),
        "phase_4_screenshot_count": sum(1 for f in scene_files if f.suffix == ".png"),
        "phase_5_scene_mp4_count":  sum(1 for f in scene_files if f.suffix == ".mp4" and ".muxed" not in f.name),
        "final_mp4":                exists("final.mp4"),
    }


def main() -> int:
    parser = argparse.ArgumentParser(prog="any2video", description="any2video — deep-video skill toolbox")
    sub = parser.add_subparsers(dest="cmd", required=True)
    s_init = sub.add_parser("init", help="Phase 1: extract source from any input")
    s_init.add_argument("source", help="URL, file path, or raw text")
    s_init.add_argument("--lang", choices=["vi", "en"], default="vi", help="Narration language (default: vi)")
    s_init.add_argument("--fast", action="store_true", help="Use static screenshot render (no motion). Preview only.")
    s_status = sub.add_parser("status", help="Inspect a run directory")
    s_status.add_argument("slug")
    args = parser.parse_args()

    if args.cmd == "init":
        result = init(args.source, lang=args.lang, fast=args.fast)
    else:
        result = status(args.slug)

    print(json.dumps(result, indent=2, ensure_ascii=False))
    return 0 if "error" not in result else 1


if __name__ == "__main__":
    sys.exit(main())
