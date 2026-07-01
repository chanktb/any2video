r"""Karaoke subtitle engine — burn word-by-word synced captions into each scene.

WHY (lesson from references/samplevideos teardown, 2026-07-01): all three
9.1-9.4/10 reference videos carry a PERSISTENT bottom-center caption that
reveals word-by-word in sync with the voice, with a two-tone (dim→bright)
sweep. It is the single strongest "this is professional short-form" signal and
doubles as muted-autoplay comprehension. Our v1-v6 shipped voice-only, no
on-screen text synced to it. This closes that gap.

Approach: PER-SCENE, LOCAL timeline. Each scene's caption is synced to that
scene's OWN audio (0..scene_dur), so it is immune to the crossfade/gap/poster
timeline math in ffmpeg_compose. Burned onto the muxed scene BEFORE concat.

Word timing:
  - Beat-split scene (has `beat_timeline`): each beat's words are laid inside
    that beat's [start_sec, start_sec+dur_sec] window — tight sync, because the
    per-beat MP3 durations were measured in Phase 3.
  - Legacy scene (single `narration`): words distributed across [lead, dur-trail]
    weighted by token length. Loose but reads clean.

Karaoke via ASS \k tags (centiseconds). Unsung = dim grey (SecondaryColour),
sung = bright white (PrimaryColour). Dark outline + shadow so it stays legible
over BOTH dark graphic scenes and bright repo-footage scenes.
"""
from __future__ import annotations

import re
import subprocess
from pathlib import Path

# --- layout / style ---------------------------------------------------------
PLAY_W, PLAY_H = 1080, 1920
# Caption sits in the lower band but ABOVE the 4:5 feed-crop line (y=1635) so a
# TikTok/IG 4:5 crop never slices it. MarginV is distance from bottom.
MARGIN_V = 300
MARGIN_H = 110
FONT_NAME = "Arial"          # system font w/ full VN diacritics (libass-safe)
FONT_SIZE = 52

# ASS colours are &HAABBGGRR (alpha inverted: 00 = opaque).
PRIMARY   = "&H00FFFFFF"      # sung → bright white
SECONDARY = "&H009A9A9A"      # unsung → dim grey
OUTLINE   = "&HB0000000"      # semi-opaque black outline
BACK      = "&H64000000"      # soft shadow

MAX_CHARS_PER_LINE = 30       # wrap long narration into sequential events
LEAD_SEC  = 0.12              # small pad so first word doesn't butt the edge
TRAIL_SEC = 0.14

# Keyword accent: numbers-as-words + a few emphatic VN tokens pop in accent so
# the line has the reference "two-tone keyword highlight" feel. Sung colour is
# swapped per-token via inline \c override for these.
ACCENT = "&H00E0C060"         # warm cyan-gold (BGR of ~#60C0E0)
_ACCENT_WORDS = re.compile(
    r"^(một|hai|ba|bốn|năm|sáu|bảy|tám|chín|mười|mươi|trăm|nghìn|triệu|tỷ|"
    r"phần|phẩy|chấm|đô|đồng|gấp|đôi|nhất|nhì|duy)$",
    re.IGNORECASE,
)


def _syllables(text: str) -> list[str]:
    """Split VN narration into display tokens (whitespace = syllable boundary)."""
    toks = [t for t in re.split(r"\s+", text.strip()) if t]
    return toks


def _weight(tok: str) -> float:
    """Rough spoken-length weight of a token (VN syllable ≈ constant, but longer
    clusters and trailing punctuation-heavy tokens take a touch longer)."""
    core = re.sub(r"[^\wÀ-ỹ]", "", tok)
    return max(1.0, len(core) / 3.0)


def _chunk_lines(tokens: list[str]) -> list[list[str]]:
    """Group tokens into caption lines of ≤ MAX_CHARS_PER_LINE."""
    lines: list[list[str]] = []
    cur: list[str] = []
    cur_len = 0
    for t in tokens:
        add = len(t) + (1 if cur else 0)
        if cur and cur_len + add > MAX_CHARS_PER_LINE:
            lines.append(cur)
            cur, cur_len = [t], len(t)
        else:
            cur.append(t)
            cur_len += add
    if cur:
        lines.append(cur)
    return lines


def _ass_time(sec: float) -> str:
    sec = max(0.0, sec)
    h = int(sec // 3600)
    m = int((sec % 3600) // 60)
    s = sec % 60
    return f"{h:d}:{m:02d}:{s:05.2f}"


def _k_run(tokens: list[str], seg_start: float, seg_end: float) -> str:
    """Build one Dialogue line's \\k karaoke body for `tokens` filling
    [seg_start, seg_end]. Returns the {\\k..}word... string."""
    span = max(0.2, seg_end - seg_start)
    weights = [_weight(t) for t in tokens]
    wsum = sum(weights) or 1.0
    parts: list[str] = []
    for tok, w in zip(tokens, weights):
        cs = max(6, int(round((w / wsum) * span * 100)))  # centiseconds, ≥60ms
        clean = tok.replace("{", "(").replace("}", ")")
        if _ACCENT_WORDS.match(re.sub(r"[^\wÀ-ỹ]", "", tok)):
            # accent tokens: sung colour swaps to ACCENT, then restore
            parts.append(f"{{\\k{cs}\\c{ACCENT}}}{clean}{{\\c{PRIMARY}}}")
        else:
            parts.append(f"{{\\k{cs}}}{clean}")
    return " ".join(parts)


def _scene_segments(scene: dict, scene_dur: float) -> list[tuple[float, float, list[str]]]:
    """Return [(start, end, tokens)] local to the scene for caption events."""
    segs: list[tuple[float, float, list[str]]] = []
    timeline = scene.get("beat_timeline")
    if timeline:
        for b in timeline:
            text = (b.get("text") or "").strip()
            if not text:
                continue
            start = float(b.get("start_sec", 0.0))
            dur = float(b.get("dur_sec", 0.0)) or 0.6
            end = min(scene_dur, start + dur)
            for line in _chunk_lines(_syllables(text)):
                segs.append((start, end, line))
                # if a beat wraps to >1 line, split its window evenly
        # even-split multi-line beats
        return _rebalance_multiline(timeline, scene_dur)
    # legacy single narration
    text = (scene.get("narration") or "").strip()
    if not text:
        return segs
    tokens = _syllables(text)
    lines = _chunk_lines(tokens)
    start = LEAD_SEC
    end = max(start + 0.5, scene_dur - TRAIL_SEC)
    total_w = sum(_weight(t) for ln in lines for t in ln) or 1.0
    cur = start
    for ln in lines:
        w = sum(_weight(t) for t in ln)
        seg_end = min(end, cur + (w / total_w) * (end - start))
        segs.append((cur, seg_end, ln))
        cur = seg_end
    return segs


def _rebalance_multiline(timeline: list[dict], scene_dur: float
                         ) -> list[tuple[float, float, list[str]]]:
    """For beat scenes: split each beat's window across its wrapped caption lines
    proportional to line token-weight."""
    segs: list[tuple[float, float, list[str]]] = []
    for b in timeline:
        text = (b.get("text") or "").strip()
        if not text:
            continue
        start = float(b.get("start_sec", 0.0))
        dur = float(b.get("dur_sec", 0.0)) or 0.6
        end = min(scene_dur, start + dur)
        lines = _chunk_lines(_syllables(text))
        total_w = sum(_weight(t) for ln in lines for t in ln) or 1.0
        cur = start
        for ln in lines:
            w = sum(_weight(t) for t in ln)
            seg_end = min(end, cur + (w / total_w) * (end - start))
            segs.append((cur, max(cur + 0.3, seg_end), ln))
            cur = seg_end
    return segs


_ASS_HEADER = f"""[Script Info]
ScriptType: v4.00+
PlayResX: {PLAY_W}
PlayResY: {PLAY_H}
WrapStyle: 2
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Kara,{FONT_NAME},{FONT_SIZE},{PRIMARY},{SECONDARY},{OUTLINE},{BACK},1,0,0,0,100,100,0.4,0,1,3,2,2,{MARGIN_H},{MARGIN_H},{MARGIN_V},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""


def build_scene_ass(scene: dict, scene_dur: float, out_ass: Path) -> dict:
    """Write a scene-local karaoke .ass. Returns {events: n} or {skipped: reason}."""
    segs = _scene_segments(scene, scene_dur)
    if not segs:
        return {"skipped": "no_text"}
    lines = [_ASS_HEADER]
    for (start, end, tokens) in segs:
        body = _k_run(tokens, start, end)
        lines.append(
            f"Dialogue: 0,{_ass_time(start)},{_ass_time(end)},Kara,,0,0,0,,{body}"
        )
    out_ass.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return {"events": len(segs), "ass": str(out_ass)}


def burn(in_mp4: Path, ass: Path, out_mp4: Path) -> dict:
    """Burn the .ass onto in_mp4's video. Audio copied untouched (voice+sfx mix
    preserved). Consistent h264 params so downstream concat -c copy still works.

    Windows path trap: the ffmpeg `ass=` filter uses ':' as an option separator,
    so the drive-letter colon in an absolute path (D:/...) gets misparsed. Fix:
    run ffmpeg with cwd = the .ass directory and reference it by bare filename
    (no colon → no escaping). in/out mp4 stay absolute (cwd doesn't affect them).
    """
    cp = subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error",
         "-i", str(in_mp4),
         "-vf", f"ass={ass.name}",
         "-c:v", "libx264", "-preset", "veryfast", "-crf", "20",
         "-pix_fmt", "yuv420p", "-r", "30",
         "-c:a", "copy",
         str(out_mp4)],
        capture_output=True, text=True,
        cwd=str(ass.parent),
    )
    if cp.returncode != 0:
        return {"error": "subtitle_burn_failed", "stderr": cp.stderr[-500:]}
    return {"subbed_path": str(out_mp4), "ass": str(ass)}
