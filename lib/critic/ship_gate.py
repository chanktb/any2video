"""Ship gate (Phase 6, HARD) — the LAST gate before a final.mp4 is delivered.

A video only ships if ALL of these pass (feedback 2026-07-02, after a render
shipped with a white-flash head + a clipped promo tail):

  1. POSTER / AUTO-THUMB — the first frame (t=0) is the scene-1 poster: a real,
     settled hero frame, NOT a blank/white/black canvas. FB/TikTok grab t=0 as the
     thumbnail; a blank thumb = someone re-uploads by hand every time.
  2. NO WHITE HEAD — none of the first ~1.5s of frames is white/blank. The
     browser records on a white about:blank; if the lead-trim leaks, the video
     opens on a white flash while the voice already plays.
  3. TAIL VOICE INTACT — the audio stream is as long as the video, and there is
     real speech in the final scene's voice window (the closing/promo narration
     isn't cut).

Pure-ffmpeg + pure-Python (no numpy). Exit 0 = ship, exit 1 = BLOCK.
"""
from __future__ import annotations

import argparse
import json
import math
import struct
import subprocess
import sys
from pathlib import Path

try:
    sys.stdout.reconfigure(encoding="utf-8")  # type: ignore[attr-defined]
except (AttributeError, OSError):
    pass

# Luma is 0 (black) .. 255 (white). Dark canvas ≈ 8-15; a designed dark scene with
# text/particles ≈ 25-70. A white flash ≈ 235-255.
WHITE_LUMA = 200          # mean luma above this = "white/blank" head → fail
POSTER_MIN_LUMA = 7       # below this the poster is essentially pure black
POSTER_MIN_STDEV = 6.0    # below this the poster has no visible content (uniform)
HEAD_SAMPLE_TIMES = (0.1, 0.3, 0.6, 1.0, 1.4)
TAIL_SPEECH_FLOOR_DB = -45.0   # window RMS above this = has speech


def _probe(mp4: Path, stream: str) -> float | None:
    try:
        cp = subprocess.run(
            ["ffprobe", "-v", "error", "-select_streams", stream,
             "-show_entries", "stream=duration", "-of", "default=nk=1:nw=1", str(mp4)],
            capture_output=True, text=True, timeout=15,
        )
        return float((cp.stdout or "").strip().splitlines()[0])
    except (ValueError, IndexError, subprocess.TimeoutExpired):
        return None


def _format_dur(mp4: Path) -> float | None:
    try:
        cp = subprocess.run(
            ["ffprobe", "-v", "error", "-show_entries", "format=duration",
             "-of", "default=nk=1:nw=1", str(mp4)],
            capture_output=True, text=True, timeout=15,
        )
        return float((cp.stdout or "").strip())
    except (ValueError, subprocess.TimeoutExpired):
        return None


def _frame_gray_stats(mp4: Path, t: float, w: int = 96, h: int = 170) -> tuple[float, float] | None:
    """Return (mean_luma, stdev) of the frame at time t, or None if unreadable."""
    cp = subprocess.run(
        ["ffmpeg", "-v", "error", "-ss", f"{t:.3f}", "-i", str(mp4),
         "-frames:v", "1", "-vf", f"scale={w}:{h},format=gray", "-f", "rawvideo", "-"],
        capture_output=True,
    )
    data = cp.stdout
    if not data:
        return None
    n = len(data)
    mean = sum(data) / n
    var = sum((b - mean) ** 2 for b in data) / n
    return mean, math.sqrt(var)


def _window_rms_db(mp4: Path, start: float, dur: float) -> float | None:
    """RMS level (dBFS) of the audio in [start, start+dur]; None if no samples."""
    if dur <= 0:
        return None
    cp = subprocess.run(
        ["ffmpeg", "-v", "error", "-ss", f"{start:.3f}", "-t", f"{dur:.3f}",
         "-i", str(mp4), "-vn", "-ac", "1", "-ar", "16000", "-f", "s16le", "-"],
        capture_output=True,
    )
    data = cp.stdout
    n = len(data) // 2
    if n == 0:
        return None
    samples = struct.unpack(f"<{n}h", data[:n * 2])
    rms = math.sqrt(sum(x * x for x in samples) / n)
    return 20 * math.log10(rms / 32768.0 + 1e-9)


def check(final_mp4: Path, tail_pad_sec: float = 0.6) -> dict:
    issues: list[dict] = []
    if not final_mp4.is_file():
        return {"pass": False, "issues": [{"kind": "final_missing", "path": str(final_mp4)}]}

    v_dur = _probe(final_mp4, "v:0") or _format_dur(final_mp4)
    a_dur = _probe(final_mp4, "a:0")

    # 1) POSTER / AUTO-THUMB — first frame must be a real hero, not blank.
    poster = _frame_gray_stats(final_mp4, 0.0)
    if poster is None:
        issues.append({"kind": "poster_unreadable", "hint": "Could not read frame at t=0."})
    else:
        pl, psd = poster
        if pl > WHITE_LUMA:
            issues.append({"kind": "poster_white", "luma": round(pl, 1),
                           "hint": "t=0 (FB/TikTok thumb) is white/blank — poster prepend missing or broken."})
        elif pl < POSTER_MIN_LUMA:
            issues.append({"kind": "poster_black", "luma": round(pl, 1),
                           "hint": "t=0 is (near) pure black — no settled hero frame for the thumb."})
        elif psd < POSTER_MIN_STDEV:
            issues.append({"kind": "poster_blank", "luma": round(pl, 1), "stdev": round(psd, 1),
                           "hint": "t=0 has no visible content (uniform) — poster sampled a blank frame."})

    # 2) NO WHITE HEAD — first ~1.5s must never be white.
    for t in HEAD_SAMPLE_TIMES:
        st = _frame_gray_stats(final_mp4, t)
        if st and st[0] > WHITE_LUMA:
            issues.append({"kind": "white_head", "t": t, "luma": round(st[0], 1),
                           "hint": f"Frame at {t}s is white/blank while voice plays — white-flash head bug."})

    # 3) TAIL VOICE INTACT — audio as long as video + speech in the last voice window.
    if v_dur and a_dur and a_dur < v_dur - 0.15:
        issues.append({"kind": "audio_shorter_than_video", "audio": round(a_dur, 2), "video": round(v_dur, 2),
                       "hint": "Audio stream ends before the video — tail narration cut."})
    if v_dur:
        # The final scene's voice should reach close to (end - closing breath). Probe a
        # ~2s window ending just before the breath; require speech there.
        win_end = max(0.0, v_dur - max(0.0, tail_pad_sec) - 0.2)
        win_start = max(0.0, win_end - 2.0)
        db = _window_rms_db(final_mp4, win_start, win_end - win_start)
        if db is not None and db < TAIL_SPEECH_FLOOR_DB:
            issues.append({"kind": "tail_voice_silent", "window": [round(win_start, 2), round(win_end, 2)],
                           "rms_db": round(db, 1),
                           "hint": "No speech in the final scene's voice window — closing/promo narration is cut."})

    return {
        "pass": len(issues) == 0,
        "final_mp4": str(final_mp4),
        "video_sec": round(v_dur, 2) if v_dur else None,
        "audio_sec": round(a_dur, 2) if a_dur else None,
        "poster_luma": round(poster[0], 1) if poster else None,
        "issues": issues,
    }


def main() -> int:
    ap = argparse.ArgumentParser(description="Phase 6 ship gate — QA final.mp4 before delivery")
    ap.add_argument("final", help="Path to final.mp4")
    ap.add_argument("--tail-pad", type=float, default=0.6, help="Closing breath used at compose (default 0.6)")
    args = ap.parse_args()
    r = check(Path(args.final).resolve(), tail_pad_sec=args.tail_pad)
    print(json.dumps(r, indent=2, ensure_ascii=False))
    return 0 if r["pass"] else 1


if __name__ == "__main__":
    sys.exit(main())
