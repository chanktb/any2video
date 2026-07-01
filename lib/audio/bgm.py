"""Background-music bed — mix a ducked BGM track under the final voice mix.

WHY (reference-video teardown §4, 2026-07-01): all three 9/10 reference videos
run a lo-fi/synthwave bed (~115-122 BPM) ducked to ~-20 dB under the voice. Our
videos were silent between words. This adds the bed.

HONESTY RULE: we do NOT ship unlicensed music. Default is OFF. The bed is used
only when:
  - `--bgm <path>` is passed explicitly, OR
  - `--bgm auto` and a curated file exists at templates/bgm/default.<ext>.
A user-supplied licensed synthwave loop dropped at skill/templates/bgm/default.mp3
is picked up automatically with zero code change.

Ducking: the BGM is side-chain-compressed by the final's own audio (voice+SFX),
so it dips whenever the narrator speaks and swells in the gaps. amix normalize=0
keeps the voice at full level.
"""
from __future__ import annotations

import subprocess
from pathlib import Path

from .. import paths
BGM_DIR = paths.TEMPLATES_DIR / "bgm"
_AUTO_NAMES = ["default.mp3", "default.m4a", "default.wav", "default.ogg"]


def resolve_bgm(spec: str | None) -> Path | None:
    """spec: explicit path | 'auto' | None. Return a usable BGM file or None."""
    if not spec:
        return None
    if spec == "auto":
        for name in _AUTO_NAMES:
            p = BGM_DIR / name
            if p.is_file():
                return p
        return None
    p = Path(spec)
    return p if p.is_file() else None


def mix_bgm(final_in: Path, bgm: Path, final_out: Path,
            bgm_gain: float = 0.22, duck: bool = True) -> dict:
    """Loop `bgm` under `final_in`'s audio (voice+SFX), duck it beneath speech,
    write `final_out`. Video stream copied untouched."""
    if duck:
        filt = (
            f"[1:a]volume={bgm_gain}[bgm];"
            f"[bgm][0:a]sidechaincompress=threshold=0.02:ratio=8:attack=15:"
            f"release=350:makeup=1[bgmduck];"
            f"[0:a][bgmduck]amix=inputs=2:duration=first:normalize=0[aout]"
        )
    else:
        filt = (
            f"[1:a]volume={bgm_gain}[bgm];"
            f"[0:a][bgm]amix=inputs=2:duration=first:normalize=0[aout]"
        )
    cp = subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error",
         "-i", str(final_in),
         "-stream_loop", "-1", "-i", str(bgm),
         "-filter_complex", filt,
         "-map", "0:v", "-map", "[aout]",
         "-c:v", "copy",
         "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
         "-shortest",
         str(final_out)],
        capture_output=True, text=True,
    )
    if cp.returncode != 0:
        return {"error": "bgm_mix_failed", "stderr": cp.stderr[-500:]}
    return {"final_mp4": str(final_out), "bgm": str(bgm),
            "bgm_gain": bgm_gain, "ducked": duck}


def synth_ambient_bed(out_mp3: Path, duration_sec: float = 40.0) -> dict:
    """Generate a subtle, ROYALTY-FREE-BY-CONSTRUCTION warm ambient pad as a
    fallback bed (a low minor-triad drone w/ slow tremolo + lowpass). NOT enabled
    by default — it is warmth, not a produced track. Drop a licensed synthwave
    loop at templates/bgm/default.mp3 for real polish."""
    d = f"{duration_sec:.1f}"
    filt = (
        f"sine=frequency=110:duration={d}[a];"          # A2 root
        f"sine=frequency=164.81:duration={d}[b];"       # E3 fifth
        f"sine=frequency=220:duration={d}[c];"          # A3 octave
        f"[a][b][c]amix=inputs=3:normalize=0,"
        f"tremolo=f=0.12:d=0.35,lowpass=f=900,"
        f"aecho=0.8:0.6:400:0.25,volume=0.18[out]"
    )
    out_mp3.parent.mkdir(parents=True, exist_ok=True)
    cp = subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error",
         "-f", "lavfi", "-i", f"anullsrc=r=48000:cl=stereo",  # placeholder for -t
         "-filter_complex", filt,
         "-map", "[out]", "-t", d,
         "-c:a", "libmp3lame", "-b:a", "160k",
         str(out_mp3)],
        capture_output=True, text=True,
    )
    if cp.returncode != 0:
        return {"error": "synth_bed_failed", "stderr": cp.stderr[-500:]}
    return {"bed": str(out_mp3), "duration_sec": duration_sec}


if __name__ == "__main__":
    import argparse
    import json
    import sys
    ap = argparse.ArgumentParser(description="BGM bed — mix ducked music under final.mp4")
    sub = ap.add_subparsers(dest="cmd", required=True)
    m = sub.add_parser("mix")
    m.add_argument("final_in")
    m.add_argument("bgm")
    m.add_argument("--out", required=True)
    m.add_argument("--gain", type=float, default=0.22)
    s = sub.add_parser("synth")
    s.add_argument("--out", required=True)
    s.add_argument("--duration", type=float, default=40.0)
    args = ap.parse_args()
    if args.cmd == "mix":
        r = mix_bgm(Path(args.final_in).resolve(), Path(args.bgm).resolve(),
                    Path(args.out).resolve(), bgm_gain=args.gain)
    else:
        r = synth_ambient_bed(Path(args.out).resolve(), args.duration)
    print(json.dumps(r, indent=2, ensure_ascii=False))
    sys.exit(0 if "error" not in r else 1)
