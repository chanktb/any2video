"""Background-music bed — mix a ducked BGM track under the final voice mix.

WHY (reference-video teardown §4, 2026-07-01): all three 9/10 reference videos
run a lo-fi/synthwave bed (~115-122 BPM) ducked to ~-20 dB under the voice. Our
videos were silent between words. This adds the bed.

MUSIC RULE: only clearly-licensed music. The repo ships 3 CC-BY tracks (Kevin
MacLeod / incompetech — see templates/bgm/CREDITS.md; attribution required when you
publish). Default is ON with a RANDOM pick from templates/bgm/:
  - `--bgm random` (default) → a random bundled track (empty pool → silent),
  - `--bgm <name>`           → a specific track by filename stem,
  - `--bgm <path>`           → an explicit file,
  - `--bgm off`              → no music.
Drop your own .mp3/.m4a/.wav/.ogg in templates/bgm/ (files starting with `_` are
ignored) and they join the pool with zero code change.

Ducking: the BGM is side-chain-compressed by the final's own audio (voice+SFX),
so it dips whenever the narrator speaks and swells in the gaps. amix normalize=0
keeps the voice at full level.
"""
from __future__ import annotations

import random
import subprocess
from pathlib import Path

from .. import paths
BGM_DIR = paths.TEMPLATES_DIR / "bgm"
_POOL_EXTS = (".mp3", ".m4a", ".wav", ".ogg")


def bgm_pool() -> list[Path]:
    """All bundled BGM tracks in templates/bgm/ (files starting with `_` are ignored —
    e.g. work files / non-shippable synth beds)."""
    if not BGM_DIR.is_dir():
        return []
    return sorted(p for p in BGM_DIR.iterdir()
                  if p.suffix.lower() in _POOL_EXTS and not p.name.startswith("_"))


def resolve_bgm(spec: str | None) -> Path | None:
    """Resolve a BGM track.
      - None / '' / 'off' / 'none' → no music.
      - 'auto' / 'random'          → a RANDOM track from templates/bgm/ (empty pool → None).
      - '<name>'                   → the pool track whose filename stem matches (exact, then
                                     substring, case-insensitive); else treated as a file path.
      - an explicit path           → that file if it exists.
    """
    if spec is None or spec in ("", "off", "none"):
        return None
    if spec in ("auto", "random"):
        pool = bgm_pool()
        return random.choice(pool) if pool else None
    p = Path(spec)
    if p.is_file():
        return p
    pool = bgm_pool()
    s = spec.lower()
    for track in pool:                       # exact stem match
        if track.stem.lower() == s:
            return track
    for track in pool:                       # substring match ("complex" → the-complex)
        if s in track.stem.lower():
            return track
    return None


def _probe_dur(p: Path) -> float:
    """Container duration in seconds (0.0 if ffprobe fails)."""
    try:
        cp = subprocess.run(
            ["ffprobe", "-v", "error", "-show_entries", "format=duration",
             "-of", "default=noprint_wrappers=1:nokey=1", str(p)],
            capture_output=True, text=True, check=True, timeout=15,
        )
        return float(cp.stdout.strip())
    except (subprocess.CalledProcessError, ValueError, subprocess.TimeoutExpired):
        return 0.0


def mix_bgm(final_in: Path, bgm: Path, final_out: Path,
            bgm_gain: float = 0.22, duck: bool = True) -> dict:
    """Loop `bgm` under `final_in`'s audio (voice+SFX), duck it beneath speech,
    write `final_out`. Video stream copied untouched.

    Length is pinned to `final_in`'s duration via `-t` (NOT `-shortest`). Root
    cause of "cau chot bi cat khi bat nhac" (user, 2026-07-09): `-shortest`
    capped the output at whatever stream ended first, and the ducked-BGM branch
    consumed `[0:a]` twice (sidechain key plus amix input) WITHOUT `asplit`, so
    the mixed audio ran about 2s short and `-shortest` chopped the closing
    narration off the VIDEO too. Fix: `asplit` the voice for the two consumers,
    drop `-shortest`, and cut to the exact input-video length so nothing is lost.
    """
    dur = _probe_dur(final_in)
    # apad the voice: a render's audio stream can end ~0.5s before the video
    # (trailing scene pad not encoded), and amix duration=first would then cut
    # the mixed audio short of the video, tripping ship_gate. The -t below is
    # what bounds the padded stream to the exact video length.
    if duck:
        filt = (
            f"[0:a]apad,asplit=2[a_main][a_key];"
            f"[1:a]volume={bgm_gain}[bgm];"
            f"[bgm][a_key]sidechaincompress=threshold=0.02:ratio=8:attack=15:"
            f"release=350:makeup=1[bgmduck];"
            f"[a_main][bgmduck]amix=inputs=2:duration=first:normalize=0[aout]"
        )
    else:
        filt = (
            f"[1:a]volume={bgm_gain}[bgm];"
            f"[0:a]apad[a_pad];"
            f"[a_pad][bgm]amix=inputs=2:duration=first:normalize=0[aout]"
        )
    cmd = ["ffmpeg", "-y", "-loglevel", "error",
           "-i", str(final_in),
           "-stream_loop", "-1", "-i", str(bgm),
           "-filter_complex", filt,
           "-map", "0:v", "-map", "[aout]",
           "-c:v", "copy",
           "-c:a", "aac", "-b:a", "192k", "-ar", "48000"]
    if dur > 0:
        cmd += ["-t", f"{dur:.3f}"]   # pin to video length; never let BGM cut it
    else:
        cmd += ["-shortest"]          # fallback only if probe failed
    cmd += [str(final_out)]
    cp = subprocess.run(cmd, capture_output=True, text=True)
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
