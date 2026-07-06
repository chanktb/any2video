# -*- coding: utf-8 -*-
"""Voice via VieNeu-TTS (local, free, CPU-friendly) for path B + estimated karaoke timing.

VieNeu (github.com/pnnbao97/VieNeu-TTS, Apache-2.0) is a Vietnamese-native TTS with
instant voice cloning. It returns NO word boundaries, so per-word timing is ESTIMATED
with the same syllable-weight distribution as the Google variant.

VieNeu reads BILINGUAL text natively (sea-g2p code-switching): write English terms
RAW with their correct spelling and casing ("GitHub", "AI", "Claude Code") and they
are pronounced as English (all-caps acronyms are letter-spelled, camelCase splits).
sea-g2p DOES support <en>...</en>, but it FORCES English WORD g2p on the span, which
is the wrong tool here: tagged "AI" reads as the English word "ai" (sounds exactly
like Vietnamese "ai"), tagged "GitHub" collapses into one blob. Only tag a word the
auto-detector would otherwise read as Vietnamese. Do NOT use edge-tts style
phonetics either ("git hâb" gets its diacritics spelled out letter by letter).
Names containing digits still need spelling out ("any2video" -> "any to video",
else the 2 is read as Vietnamese "hai"); add a PHONETIC_MAP merge so captions show
the clean name. This tool strips <en> tags from BOTH the TTS text and the karaoke
words, so tags never reach the engine from this path.

Setup: point --vieneu-dir (or the VIENEU_TTS_DIR env var) at your local VieNeu-TTS
checkout (the dir holding its pyproject/uv env). The heavy work runs inside that env
via `uv run --no-sync` (--no-sync so uv never uninstalls the CPU torch build).

Example:
  python tools/gen_voice_vieneu.py --scenes workspace/runs/<slug>/narration.json \
      --prefix <slug> --data-out src/videos/<slug>-data.ts --voice "Ngọc Lan"
"""
import argparse
import json
import os
import re
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from gen_voice import merge_phonetics  # noqa: E402
from gen_voice_google import audio_dur, estimate_words  # noqa: E402

HERE = Path(__file__).resolve().parent.parent  # render-remotion/
BRIDGE = Path(__file__).resolve().parent / "vieneu_bridge.py"
EN_TAG = re.compile(r"</?en>")


def strip_en(text: str) -> str:
    """Karaoke display text: drop the <en> markers, keep the words."""
    return EN_TAG.sub("", text)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--scenes", required=True)
    ap.add_argument("--prefix", required=True)
    ap.add_argument("--data-out", required=True)
    ap.add_argument("--audio-dir", default=str(HERE / "public" / "audio"))
    ap.add_argument("--vieneu-dir", default=os.environ.get("VIENEU_TTS_DIR", ""),
                    help="VieNeu-TTS checkout dir (or set VIENEU_TTS_DIR)")
    ap.add_argument("--voice", default="", help="built-in voice name (empty = default Ngọc Lan)")
    ap.add_argument("--ref-audio", default="", help="3-8s wav for instant voice cloning")
    ap.add_argument("--style", default="tu_nhien", help="delivery style (tu_nhien, ke_chuyen, ...)")
    ap.add_argument("--temperature", type=float, default=0.8, help="sampling temperature")
    ap.add_argument("--fps", type=int, default=30)
    ap.add_argument("--pad", type=float, default=0.8)
    ap.add_argument("--min-frames", type=int, default=100)
    args = ap.parse_args()

    if not args.vieneu_dir or not Path(args.vieneu_dir).is_dir():
        sys.exit("Set --vieneu-dir or VIENEU_TTS_DIR to your VieNeu-TTS checkout.")

    scenes_path = Path(args.scenes).resolve()
    audio_dir = Path(args.audio_dir).resolve()
    audio_dir.mkdir(parents=True, exist_ok=True)
    ref = str(Path(args.ref_audio).resolve()) if args.ref_audio else ""

    # Safety net: strip any <en> tags before the text reaches the phonemizer.
    scenes = json.loads(scenes_path.read_text(encoding="utf-8"))
    tts_json = audio_dir / f"_{args.prefix}_tts.json"
    tts_json.write_text(json.dumps(
        [dict(sc, narration=strip_en(sc["narration"])) for sc in scenes],
        ensure_ascii=False), encoding="utf-8")

    cmd = ["uv", "run", "--no-sync", "python", str(BRIDGE),
           "--scenes", str(tts_json), "--audio-dir", str(audio_dir),
           "--prefix", args.prefix,
           "--style", args.style, "--temperature", str(args.temperature)]
    if ref:
        cmd += ["--ref-audio", ref]
    elif args.voice:
        cmd += ["--voice", args.voice]
    r = subprocess.run(cmd, cwd=args.vieneu_dir)
    if r.returncode != 0:
        sys.exit(f"vieneu bridge failed ({r.returncode})")

    scenes = json.loads(scenes_path.read_text(encoding="utf-8"))
    out = []
    for sc in scenes:
        aud = audio_dir / f"{args.prefix}_{sc['id']}.wav"
        if not aud.exists() or aud.stat().st_size < 1000:
            sys.exit(f"missing/short audio for scene {sc['id']}: {aud}")
        dur = audio_dur(aud)
        words = merge_phonetics(estimate_words(strip_en(sc["narration"]), dur))
        frames = max(args.min_frames, int((dur + args.pad) * args.fps))
        print(f"[{sc['id']}] {dur:.2f}s, {len(words)} words -> {frames} frames")
        out.append(dict(id=sc["id"], audio=f"audio/{args.prefix}_{sc['id']}.wav",
                        durationInFrames=frames, words=words))

    total = sum(s["durationInFrames"] for s in out)
    ts = "// Generated by tools/gen_voice_vieneu.py (ESTIMATED timing). Do not hand-edit.\n"
    ts += "import type { SceneTiming } from \"../lib/core\";\n\n"
    ts += "export const SCENES: SceneTiming[] = " + json.dumps(out, ensure_ascii=False, indent=2) + ";\n\n"
    ts += f"export const TOTAL_FRAMES = {total};\n"
    Path(args.data_out).write_text(ts, encoding="utf-8")
    print(f"TOTAL: {total} frames = {total / args.fps:.1f}s")
    return 0


if __name__ == "__main__":
    sys.exit(main())
