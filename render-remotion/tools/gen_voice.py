# -*- coding: utf-8 -*-
"""edge-tts voice + word timestamps for the Remotion render path (any2video path B).

Input : JSON [{"id": "...", "narration": "..."}, ...]  (narration already follows TTS
        rule SKILL.md 2.2.6: numbers spelled out, terms transliterated, no URLs/emoji)
Output: per-scene mp3 into --audio-dir + a .ts data file (SceneTiming[]) for the
        composition to import.

Example:
  python tools/gen_voice.py --scenes workspace/runs/<slug>/narration.json \
      --prefix <slug> --data-out src/videos/<slug>-data.ts
"""
import argparse
import asyncio
import json
import subprocess
import sys
import time
from pathlib import Path

import edge_tts

HERE = Path(__file__).resolve().parent.parent  # render-remotion/

# Phonetic clusters (spoken) -> clean word (karaoke display). Longest match first.
PHONETIC_MAP = [
    (["ây-pi-ai"], "API"),   # Google variant: one hyphenated token so Chirp reads it as a unit
    (["xê-pê-em"], "CPM"),
    (["ây-ai"], "AI"),
    (["git-hâb"], "GitHub"),
    (["ca-pi"], "CAPI"),
    (["ây", "pi", "ai"], "API"),
    (["ây", "ai"], "AI"),
    (["rề", "pô"], "repo"),
    (["git", "hâb"], "GitHub"),
    (["ruýt", "my"], "README"),
    (["gí", "pi", "tí"], "GPT"),
    (["en", "ni", "tu", "vi", "đeo"], "any2video"),
    (["any", "to", "video"], "any2video"),  # VieNeu bilingual spelled-out name
    (["óp", "mai", "dơ"], "Optmyzr"),  # VieNeu: raw Optmyzr letter-spells O-P-T-M-Y-Z-R
    (["hê", "ma"], "HEMA"),            # VieNeu: raw HEMA letter-spells H-E-M-A
    (["en", "gram"], "n-gram"),        # VieNeu: raw "n gram" reads the n as Vietnamese "nờ"
    (["rô", "át"], "ROAS"),        # VieNeu: raw ROAS letter-spells; word reading is the trade term
    (["gi", "ây", "bốn"], "GA4"),  # VieNeu: raw GA4 reads the 4 as Vietnamese in an odd way
    (["diu", "túp"], "YouTube"),
    (["phây", "búc"], "Facebook"),
    (["tun"], "tool"),
]


def merge_phonetics(words):
    out = []
    i = 0
    lower = [w["w"].lower().strip(".,?") for w in words]
    while i < len(words):
        hit = None
        for seq, clean in PHONETIC_MAP:
            if lower[i : i + len(seq)] == seq:
                hit = (seq, clean)
                break
        if hit:
            seq, clean = hit
            tail = words[i + len(seq) - 1]["w"]
            suffix = tail[len(tail.rstrip(".,?")):]
            out.append({"w": clean + suffix, "s": words[i]["s"], "e": words[i + len(seq) - 1]["e"]})
            i += len(seq)
        else:
            out.append(words[i])
            i += 1
    return out


async def tts_with_words(text: str, voice: str, rate: str, dest: Path):
    words = []
    com = edge_tts.Communicate(text, voice, rate=rate, boundary="WordBoundary")
    with open(dest, "wb") as f:
        async for chunk in com.stream():
            if chunk["type"] == "audio":
                f.write(chunk["data"])
            elif chunk["type"] == "WordBoundary":
                words.append({
                    "w": chunk["text"],
                    "s": round(chunk["offset"] / 1e7, 3),
                    "e": round((chunk["offset"] + chunk["duration"]) / 1e7, 3),
                })
    return words


def tts_retry(text: str, voice: str, rate: str, dest: Path):
    """Retry with 3/7/15s backoff + 250ms throttle (long-standing edge-tts lesson)."""
    for i, wait in enumerate([0, 3, 7, 15]):
        if wait:
            time.sleep(wait)
        try:
            words = asyncio.run(tts_with_words(text, voice, rate, dest))
            if dest.exists() and dest.stat().st_size > 1000 and words:
                time.sleep(0.25)
                return words
        except Exception as e:
            print(f"  [!] tts retry {i + 1}: {e}")
    raise RuntimeError(f"TTS fail: {text[:40]}")


def audio_dur(p: Path) -> float:
    r = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "csv=p=0", str(p)], capture_output=True, text=True)
    return float(r.stdout.strip())


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--scenes", required=True, help="JSON [{id, narration}]")
    ap.add_argument("--prefix", required=True, help="audio filename prefix (slug)")
    ap.add_argument("--data-out", required=True, help="path of the generated .ts file (in src/videos/)")
    ap.add_argument("--audio-dir", default=str(HERE / "public" / "audio"))
    ap.add_argument("--voice", default="vi-VN-NamMinhNeural")
    ap.add_argument("--rate", default="+15%", help="any2video standard +15%%")
    ap.add_argument("--fps", type=int, default=30)
    ap.add_argument("--pad", type=float, default=0.8, help="rest seconds after each scene")
    ap.add_argument("--min-frames", type=int, default=100)
    args = ap.parse_args()

    scenes = json.loads(Path(args.scenes).read_text(encoding="utf-8"))
    audio_dir = Path(args.audio_dir)
    audio_dir.mkdir(parents=True, exist_ok=True)

    out = []
    for sc in scenes:
        aud = audio_dir / f"{args.prefix}_{sc['id']}.mp3"
        words = merge_phonetics(tts_retry(sc["narration"], args.voice, args.rate, aud))
        dur = audio_dur(aud)
        frames = max(args.min_frames, int((dur + args.pad) * args.fps))
        print(f"[{sc['id']}] {dur:.2f}s, {len(words)} words -> {frames} frames")
        out.append(dict(id=sc["id"], audio=f"audio/{args.prefix}_{sc['id']}.mp3",
                        durationInFrames=frames, words=words))

    total = sum(s["durationInFrames"] for s in out)
    ts = "// Generated by tools/gen_voice.py. Do not hand-edit.\n"
    ts += "import type { SceneTiming } from \"../lib/core\";\n\n"
    ts += "export const SCENES: SceneTiming[] = " + json.dumps(out, ensure_ascii=False, indent=2) + ";\n\n"
    ts += f"export const TOTAL_FRAMES = {total};\n"
    Path(args.data_out).write_text(ts, encoding="utf-8")
    print(f"TOTAL: {total} frames = {total / args.fps:.1f}s (standard window 50-75s)")


if __name__ == "__main__":
    sys.exit(main())
