# -*- coding: utf-8 -*-
"""Bridge script that runs INSIDE the VieNeu-TTS uv environment.

gen_voice_vieneu.py spawns this via `uv run --no-sync python <this file> ...`
with cwd = the VieNeu-TTS project dir, so `from vieneu import Vieneu` resolves
there. Loads the model ONCE, then synthesizes every scene to wav.

Args: --scenes <narration.json> --audio-dir <dir> --prefix <slug>
      [--voice <preset name>] [--ref-audio <clip.wav>]
"""
import argparse
import json
import sys
from pathlib import Path


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--scenes", required=True)
    ap.add_argument("--audio-dir", required=True)
    ap.add_argument("--prefix", required=True)
    ap.add_argument("--voice", default="", help="built-in voice name (empty = default)")
    ap.add_argument("--ref-audio", default="", help="3-8s clip for instant voice cloning")
    ap.add_argument("--style", default="tu_nhien", help="delivery style (tu_nhien, ke_chuyen, ...)")
    ap.add_argument("--temperature", type=float, default=0.8, help="sampling temperature")
    args = ap.parse_args()

    from vieneu import Vieneu  # resolved from the VieNeu uv env

    tts = Vieneu()
    scenes = json.loads(Path(args.scenes).read_text(encoding="utf-8"))
    audio_dir = Path(args.audio_dir)
    audio_dir.mkdir(parents=True, exist_ok=True)

    for sc in scenes:
        kwargs = {"style": args.style, "temperature": args.temperature}
        if args.ref_audio:
            kwargs["ref_audio"] = args.ref_audio
        elif args.voice:
            kwargs["voice"] = args.voice
        audio = tts.infer(sc["narration"], **kwargs)
        dest = audio_dir / f"{args.prefix}_{sc['id']}.wav"
        tts.save(audio, str(dest))
        print(f"[bridge] {sc['id']} -> {dest.name}", flush=True)
    return 0


if __name__ == "__main__":
    sys.exit(main())
