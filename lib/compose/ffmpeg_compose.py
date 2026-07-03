"""Final compose — mux per-scene video + TTS audio, concat to final.mp4.

Two-pass approach:
  Pass 1: per scene, mux scenes/<id>.mp4 (silent video) + scenes/<id>.mp3 (TTS)
          → scenes/<id>.muxed.mp4

  Pass 2: ffmpeg concat demuxer over all muxed scene files
          → workspace/runs/<slug>/final.mp4

Crossfade between scenes (--crossfade <ms>) re-encodes via the xfade + acrossfade
filters; default is plain concat (faster, no re-encode).
"""
from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
from pathlib import Path

from .. import plan_yaml
from ..audio import sfx_selector
from ..audio import bgm as _bgm
from . import subtitles as _subs


# Keep 0.15s of silence at start/end after trim — else the first/last phoneme's
# attack transient gets clipped ("hụt" at scene start). Also require ≥ 0.15s
# continuous silence before trimming (start_duration) so we don't chop tiny gaps
# inside natural speech.
_TRIM_LEADING = "silenceremove=start_periods=1:start_duration=0.15:start_silence=0.15:start_threshold=-55dB:detection=peak"
_TRIM_TRAILING = "areverse," + _TRIM_LEADING + ",areverse"


def _build_trim_filter(trim_leading: bool, trim_trailing: bool) -> str | None:
    if not trim_leading and not trim_trailing:
        return None
    parts = []
    if trim_leading:
        parts.append(_TRIM_LEADING)
    if trim_trailing:
        parts.append(_TRIM_TRAILING)
    return ",".join(parts)


def _probe_dur(path: Path) -> float | None:
    try:
        cp = subprocess.run(
            ["ffprobe", "-v", "error", "-show_entries", "format=duration",
             "-of", "default=noprint_wrappers=1:nokey=1", str(path)],
            capture_output=True, text=True, check=True, timeout=15,
        )
        return float(cp.stdout.strip())
    except (subprocess.CalledProcessError, ValueError, subprocess.TimeoutExpired):
        return None


def mux_last_scene(video_mp4: Path, audio_mp3: Path, out_mp4: Path,
                   sfx: dict | None = None, trim_leading: bool = True,
                   tail_pad_sec: float = 0.6) -> dict:
    """Mux the FINAL scene so its narration is NEVER clipped.

    Root cause of "câu chót bị cắt" (user, e.g. 'Link repo ở dưới comment nhé'
    → 'Link repo ở dưới'): the common mux path uses `-shortest`, which caps the
    output at whichever of {video, voice} is SHORTER. If the last scene's voice
    runs a hair longer than its rendered video, `-shortest` chops the tail words.

    Fix (last scene only): freeze-extend the video to cover the full voice
    length, pad the voice with `tail_pad_sec` of trailing silence (a closing
    breath), and drop `-shortest` — both streams end at the same, voice-driven
    length. Trailing-silence trim is always OFF here (we WANT the closing pause).
    """
    a_dur = _probe_dur(audio_mp3) or 0.0
    v_dur = _probe_dur(video_mp4) or 0.0
    target = max(a_dur, v_dur) + max(0.0, tail_pad_sec)
    v_pad = max(0.0, target - v_dur)

    trim_filter = _build_trim_filter(trim_leading, False)  # never trim the tail
    a_chain = (trim_filter + ",") if trim_filter else ""
    filters = [f"[0:v]tpad=stop_mode=clone:stop_duration={v_pad:.3f}[v_out]",
               f"[1:a]{a_chain}apad=whole_dur={target:.3f}[a_pad]"]
    a_map = "[a_pad]"
    extra_inputs: list[str] = []
    use_sfx = bool(sfx and Path(sfx.get("path", "")).is_file())
    if use_sfx:
        sfx_vol = float(sfx.get("volume", 0.6))
        sfx_off = int(float(sfx.get("start_offset_sec", 0.0)) * 1000)
        filters.append(f"[2:a]adelay={sfx_off}|{sfx_off},volume={sfx_vol}[sfx]")
        filters.append("[a_pad][sfx]amix=inputs=2:duration=first:dropout_transition=0[a_out]")
        a_map = "[a_out]"
        extra_inputs = ["-i", str(sfx.get("path"))]

    cp = subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error",
         "-i", str(video_mp4), "-i", str(audio_mp3), *extra_inputs,
         "-filter_complex", ";".join(filters),
         "-map", "[v_out]", "-map", a_map,
         "-c:v", "libx264", "-preset", "veryfast", "-crf", "20",
         "-pix_fmt", "yuv420p", "-r", "30",
         "-c:a", "aac", "-b:a", "192k",
         str(out_mp4)],
        capture_output=True, text=True,
    )
    if cp.returncode != 0:
        return {"error": "mux_last_scene_failed", "stderr": cp.stderr[-500:]}
    return {"muxed_path": str(out_mp4), "sfx": sfx if use_sfx else None,
            "trim_leading": trim_leading, "trim_trailing": False,
            "tail_pad_sec": tail_pad_sec, "voice_sec": round(a_dur, 2)}


def mux_scene(video_mp4: Path, audio_mp3: Path, out_mp4: Path,
              sfx: dict | None = None, trim_leading: bool = True,
              trim_trailing: bool = True) -> dict:
    """Mux silent video + TTS audio + optional SFX into a single mp4.

    sfx dict: { path: <str>, volume: <float 0..1>, start_offset_sec: <float> }
    trim_leading: strip leading silence from voice. Skip for scene 1 (give
        the opening animation breathing room — viewer needs ~300ms to register
        the scene before voice kicks in).
    trim_trailing: strip trailing silence from voice. Skip for the final
        scene (preserve the closing pause so the last word isn't clipped).
    """
    trim_filter = _build_trim_filter(trim_leading, trim_trailing)
    if not sfx:
        # `apad` after the trim pads the voice with trailing silence so it is never
        # SHORTER than the rendered video → `-shortest` then equals the VIDEO length
        # (= duration_sec). Lets a footage scroll legitimately outlast its narration;
        # for a normal scene video≈audio so this is a no-op.
        if trim_filter:
            cp = subprocess.run(
                ["ffmpeg", "-y", "-loglevel", "error",
                 "-i", str(video_mp4),
                 "-i", str(audio_mp3),
                 "-filter_complex", f"[1:a]{trim_filter},apad[a_out]",
                 "-map", "0:v", "-map", "[a_out]",
                 "-c:v", "copy",
                 "-c:a", "aac", "-b:a", "192k",
                 "-shortest",
                 str(out_mp4)],
                capture_output=True, text=True,
            )
        else:
            cp = subprocess.run(
                ["ffmpeg", "-y", "-loglevel", "error",
                 "-i", str(video_mp4),
                 "-i", str(audio_mp3),
                 "-map", "0:v", "-map", "1:a", "-af", "apad",
                 "-c:v", "copy",
                 "-c:a", "aac", "-b:a", "192k",
                 "-shortest",
                 str(out_mp4)],
                capture_output=True, text=True,
            )
        if cp.returncode != 0:
            return {"error": "mux_failed", "stderr": cp.stderr[-500:]}
        return {"muxed_path": str(out_mp4), "sfx": None,
                "trim_leading": trim_leading, "trim_trailing": trim_trailing}

    sfx_path = sfx.get("path")
    sfx_vol = float(sfx.get("volume", 0.6))
    sfx_offset_ms = int(float(sfx.get("start_offset_sec", 0.0)) * 1000)

    # Mix: trimmed TTS (input 1) + delayed+volumed SFX (input 2) → single audio track.
    voice_chain = f"[1:a]{trim_filter}[v_trim];" if trim_filter else ""
    voice_label = "[v_trim]" if trim_filter else "[1:a]"
    filter_complex = (
        f"{voice_chain}"
        f"[2:a]adelay={sfx_offset_ms}|{sfx_offset_ms},volume={sfx_vol}[sfx];"
        f"{voice_label}[sfx]amix=inputs=2:duration=first:dropout_transition=0[a_out]"
    )
    cp = subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error",
         "-i", str(video_mp4),
         "-i", str(audio_mp3),
         "-i", str(sfx_path),
         "-filter_complex", filter_complex,
         "-map", "0:v", "-map", "[a_out]",
         "-c:v", "copy",
         "-c:a", "aac", "-b:a", "192k",
         "-shortest",
         str(out_mp4)],
        capture_output=True, text=True,
    )
    if cp.returncode != 0:
        return {"error": "mux_with_sfx_failed", "stderr": cp.stderr[-500:]}
    return {"muxed_path": str(out_mp4), "sfx": sfx,
            "trim_leading": trim_leading, "trim_trailing": trim_trailing}


def concat_plain(muxed_paths: list[Path], out_mp4: Path) -> dict:
    """Concat via concat demuxer with -c copy (no re-encode). Fast."""
    list_file = out_mp4.parent / "_concat_list.txt"
    list_file.write_text(
        "\n".join(f"file '{p.as_posix()}'" for p in muxed_paths) + "\n",
        encoding="utf-8",
    )
    cp = subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error",
         "-f", "concat", "-safe", "0",
         "-i", str(list_file),
         "-c", "copy",
         str(out_mp4)],
        capture_output=True, text=True,
    )
    list_file.unlink(missing_ok=True)
    if cp.returncode != 0:
        return {"error": "concat_failed", "stderr": cp.stderr[-500:]}
    return {"final_mp4": str(out_mp4)}


def concat_filter(muxed_paths: list[Path], out_mp4: Path) -> dict:
    """Concat via concat FILTER (re-encodes). Slower than demuxer, but tolerates
    different codec params between inputs — needed when a poster clip is prepended."""
    inputs: list[str] = []
    for p in muxed_paths:
        inputs += ["-i", str(p)]
    n = len(muxed_paths)
    parts = "".join(f"[{i}:v:0][{i}:a:0]" for i in range(n))
    filter_complex = f"{parts}concat=n={n}:v=1:a=1[outv][outa]"
    cp = subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error",
         *inputs,
         "-filter_complex", filter_complex,
         "-map", "[outv]", "-map", "[outa]",
         "-pix_fmt", "yuv420p", "-r", "30",
         "-c:v", "libx264", "-preset", "veryfast", "-crf", "20",
         "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
         str(out_mp4)],
        capture_output=True, text=True,
    )
    if cp.returncode != 0:
        return {"error": "concat_filter_failed", "stderr": cp.stderr[-500:]}
    return {"final_mp4": str(out_mp4)}


def make_poster_clip(scene1_video: Path, out_mp4: Path, hold_sec: float = 0.1) -> dict:
    """Extract a settled-hero frame from scene 1 (near-end, when entrance anims
    finished) and build a hold_sec silent clip. Used to give final.mp4 a good
    auto-thumbnail on FB/TikTok — those platforms grab frame at t=0 and would
    otherwise pick scene 1's opening-blank frame."""
    # Get scene 1 duration
    try:
        cp = subprocess.run(
            ["ffprobe", "-v", "error", "-show_entries", "format=duration",
             "-of", "default=noprint_wrappers=1:nokey=1", str(scene1_video)],
            capture_output=True, text=True, check=True, timeout=15,
        )
        dur = float(cp.stdout.strip())
    except Exception as e:
        return {"error": "poster_ffprobe_failed", "detail": str(e)}

    # Sample frame at 85% into scene 1 — safely past entrance animations
    frame_time = max(0.5, min(dur - 0.2, dur * 0.85))
    png = out_mp4.parent / "_poster_frame.png"
    cp = subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error",
         "-ss", f"{frame_time:.2f}",
         "-i", str(scene1_video),
         "-vframes", "1",
         str(png)],
        capture_output=True, text=True,
    )
    if cp.returncode != 0 or not png.is_file():
        return {"error": "poster_frame_extract_failed", "stderr": cp.stderr[-500:]}

    # Build hold_sec clip: still frame + silent stereo AAC audio
    cp = subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error",
         "-loop", "1", "-t", f"{hold_sec:.3f}", "-i", str(png),
         "-f", "lavfi", "-t", f"{hold_sec:.3f}", "-i", "anullsrc=cl=stereo:r=48000",
         "-c:v", "libx264", "-preset", "veryfast", "-pix_fmt", "yuv420p",
         "-r", "30", "-vf", "scale=1080:1920,setsar=1",
         "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
         "-shortest",
         str(out_mp4)],
        capture_output=True, text=True,
    )
    png.unlink(missing_ok=True)
    if cp.returncode != 0 or not out_mp4.is_file():
        return {"error": "poster_build_failed", "stderr": cp.stderr[-500:]}
    return {"poster_mp4": str(out_mp4), "hold_sec": hold_sec,
            "sampled_frame_time_sec": round(frame_time, 2)}


def concat_crossfade(muxed_paths: list[Path], durations: list[float],
                     out_mp4: Path, fade_ms: int, gap_ms: int = 350) -> dict:
    """Concat with VIDEO xfade + AUDIO hard-concat + explicit inter-scene silence gap.

    Voice tracks NEVER cross-fade. Each scene's video gets `gap_ms` of freeze-frame
    padding appended (except the last) — the video xfade transition happens INSIDE
    that freeze zone, and each scene's audio gets a silent `gap_ms` pad on the same
    timeline. Net effect: scene N-1's voice finishes fully, then silence for
    `gap_ms`, then scene N's voice starts. Feels like a narrator taking a breath
    between sentences instead of "tua nhanh cho kịp" (user feedback).

    Design (per-scene):
      video: [scene N video, duration_N] + [freeze last frame, gap_sec]    (except last)
      audio: [scene N audio, duration_N] + [silence, gap_sec]              (except last)
    Then video xfade cascades over the extended videos; audio hard-concats.
    Because both tracks are extended by the same gap_sec per non-last scene,
    they stay aligned.

    Timeline:
      total_audio = sum(durations) + (N-1)*gap_sec
      total_video (after xfade) = sum(durations) + (N-1)*gap_sec - (N-1)*fade_sec
      overhang = (N-1)*fade_sec (small — freeze last video frame this much).
    """
    if len(muxed_paths) < 2:
        return concat_plain(muxed_paths, out_mp4)
    fade_sec = fade_ms / 1000.0
    gap_sec = gap_ms / 1000.0
    n = len(muxed_paths)

    inputs: list[str] = []
    for p in muxed_paths:
        inputs += ["-i", str(p)]

    filters: list[str] = []

    # 1) Extend each scene (except last) with `gap_sec` of freeze-frame video
    #    and silent audio. Produce labels [v_ext_i] + [a_ext_i] per scene.
    for i in range(n):
        if i < n - 1:
            filters.append(
                f"[{i}:v]tpad=stop_mode=clone:stop_duration={gap_sec:.3f}[v_ext{i}]"
            )
            filters.append(
                f"[{i}:a]apad=pad_dur={gap_sec:.3f}[a_ext{i}]"
            )
        else:
            filters.append(f"[{i}:v]null[v_ext{i}]")
            filters.append(f"[{i}:a]anull[a_ext{i}]")

    # 2) Video xfade cascade over the extended videos. Effective scene duration
    #    for xfade offset is durations[i] + gap_sec (except last which is just durations[N-1]).
    ext_dur = [d + gap_sec for d in durations[:-1]] + [durations[-1]]
    v_prev = "[v_ext0]"
    offset = ext_dur[0] - fade_sec
    for i in range(1, n):
        v_cur = f"[v_ext{i}]"
        v_out = f"[v_x{i}]"
        filters.append(
            f"{v_prev}{v_cur}xfade=transition=fade:duration={fade_sec:.3f}:offset={offset:.3f}{v_out}"
        )
        v_prev = v_out
        offset += ext_dur[i] - fade_sec

    # 3) Compute tail overhang and freeze video to match audio length.
    audio_len = sum(ext_dur)
    video_len_before_pad = audio_len - (n - 1) * fade_sec
    overhang_sec = max(0.0, audio_len - video_len_before_pad)
    v_padded_out = "[v_final]"
    filters.append(
        f"{v_prev}tpad=stop_mode=clone:stop_duration={overhang_sec:.3f}{v_padded_out}"
    )

    # 4) Audio hard-concat over the padded scene audios.
    a_parts = "".join(f"[a_ext{i}]" for i in range(n))
    filters.append(f"{a_parts}concat=n={n}:v=0:a=1[a_out]")

    filter_complex = ";".join(filters)

    cp = subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error",
         *inputs,
         "-filter_complex", filter_complex,
         "-map", v_padded_out, "-map", "[a_out]",
         "-pix_fmt", "yuv420p",
         "-c:v", "libx264", "-preset", "veryfast", "-crf", "20",
         "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
         str(out_mp4)],
        capture_output=True, text=True,
    )
    if cp.returncode != 0:
        return {"error": "crossfade_failed", "stderr": cp.stderr[-500:]}
    return {"final_mp4": str(out_mp4),
            "audio_len_sec": round(audio_len, 2),
            "gap_ms": gap_ms,
            "tail_pad_sec": round(overhang_sec, 2)}


def concat_gap_hardcut(muxed_paths: list[Path], durations: list[float],
                       out_mp4: Path, gap_ms: int = 350) -> dict:
    """Concat with a silence/freeze GAP between scenes and a HARD CUT (no xfade).

    WHY (user feedback): the xfade path overlaps VIDEO (compressing its timeline)
    while the voice track hard-concats — so the picture drifts progressively AHEAD
    of the voice (~fade × scene-index). By scene 6 that's ~1.2s: bullet items
    reveal a full beat before the narrator reaches them. Here BOTH tracks get the
    SAME per-scene extension (scene + gap), so video scene K and audio scene K
    start at the identical timestamp → reveals + karaoke stay locked to the voice.
    Transition is a clean hard cut on the inter-scene breath (what the reference
    Shorts actually do — continuous jump cuts)."""
    if len(muxed_paths) < 2:
        return concat_plain(muxed_paths, out_mp4)
    gap_sec = gap_ms / 1000.0
    n = len(muxed_paths)

    inputs: list[str] = []
    for p in muxed_paths:
        inputs += ["-i", str(p)]

    filters: list[str] = []
    for i in range(n):
        if i < n - 1:
            filters.append(f"[{i}:v]tpad=stop_mode=clone:stop_duration={gap_sec:.3f},"
                           f"setsar=1,fps=30[v{i}]")
            filters.append(f"[{i}:a]apad=pad_dur={gap_sec:.3f}[a{i}]")
        else:
            filters.append(f"[{i}:v]setsar=1,fps=30[v{i}]")
            filters.append(f"[{i}:a]anull[a{i}]")
    v_parts = "".join(f"[v{i}]" for i in range(n))
    a_parts = "".join(f"[a{i}]" for i in range(n))
    filters.append(f"{v_parts}concat=n={n}:v=1:a=0[vout]")
    filters.append(f"{a_parts}concat=n={n}:v=0:a=1[aout]")
    filter_complex = ";".join(filters)

    cp = subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error",
         *inputs,
         "-filter_complex", filter_complex,
         "-map", "[vout]", "-map", "[aout]",
         "-pix_fmt", "yuv420p",
         "-c:v", "libx264", "-preset", "veryfast", "-crf", "20",
         "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
         str(out_mp4)],
        capture_output=True, text=True,
    )
    if cp.returncode != 0:
        return {"error": "gap_hardcut_failed", "stderr": cp.stderr[-500:]}
    return {"final_mp4": str(out_mp4), "gap_ms": gap_ms, "join": "gap_hardcut"}


def compose(plan_path: Path, crossfade_ms: int = 0,
            add_poster: bool = True, poster_hold_sec: float = 0.1,
            gap_ms: int = 350, subtitles: bool = True,
            bgm: str | None = None, bgm_gain: float = 0.22,
            tail_pad_sec: float = 0.6) -> dict:
    if not shutil.which("ffmpeg"):
        return {"error": "ffmpeg_not_on_path"}

    plan = plan_yaml.load_plan(plan_path)
    scenes = plan.get("scenes") or []
    if not scenes:
        return {"error": "no_scenes_in_plan"}

    run_dir = plan_path.parent
    scenes_dir = run_dir / "scenes"

    # Resolve SFX per scene via 3-tier selector
    sfx_picks = sfx_selector.select_all(plan)
    sfx_by_id = {p["scene_id"]: p.get("sfx") for p in sfx_picks}

    muxed_paths: list[Path] = []
    durations: list[float] = []
    mux_results = []

    last_idx = len(scenes) - 1
    for idx, s in enumerate(scenes):
        sid = s["id"]
        v = scenes_dir / f"{sid}.mp4"
        a = scenes_dir / f"{sid}.mp3"
        if not v.is_file():
            return {"error": "scene_video_missing", "scene_id": sid, "expected": str(v)}
        if not a.is_file():
            return {"error": "scene_audio_missing", "scene_id": sid, "expected": str(a)}
        muxed = scenes_dir / f"{sid}.muxed.mp4"
        sfx = sfx_by_id.get(sid)
        # Footage scenes (capture_url scroll) don't need a reveal-tick SFX, and the
        # SFX mix path caps the scene to the voice length — which would trim a scroll
        # that's intentionally longer than its narration. Skip SFX for them so they
        # use the video-length (apad) mux path.
        if s.get("capture_url"):
            sfx = None
        # Validate SFX file exists; skip silently if not
        if sfx and not Path(sfx.get("path", "")).is_file():
            sfx = None
        # First scene: keep leading silence so opening animation has breathing room.
        # Last scene: keep trailing silence so the final word isn't clipped.
        is_first = idx == 0
        is_last = idx == last_idx
        if is_last:
            # Final scene: guard the closing narration from -shortest clipping
            # + add a breath. See mux_last_scene.
            r = mux_last_scene(v, a, muxed, sfx=sfx,
                               trim_leading=not is_first,
                               tail_pad_sec=tail_pad_sec)
        else:
            r = mux_scene(v, a, muxed, sfx=sfx,
                          trim_leading=not is_first,
                          trim_trailing=True)
        r["id"] = sid
        mux_results.append(r)
        if "error" in r:
            return {"error": "scene_mux_failed", "scene_id": sid, "detail": r}
        # Measure ACTUAL post-mux duration (after silence-trim shortens audio +
        # -shortest caps video). Falls back to plan duration if ffprobe fails.
        try:
            cp = subprocess.run(
                ["ffprobe", "-v", "error",
                 "-show_entries", "format=duration",
                 "-of", "default=noprint_wrappers=1:nokey=1",
                 str(muxed)],
                capture_output=True, text=True, check=True, timeout=15,
            )
            actual = float(cp.stdout.strip())
        except (subprocess.CalledProcessError, ValueError, subprocess.TimeoutExpired):
            actual = float(s.get("duration_sec") or 4.0)
        durations.append(actual)

        # Burn karaoke subtitles onto this scene (local timeline, synced to its
        # own voice). Immune to crossfade/gap/poster shifting because it happens
        # per-scene before concat. See lib/compose/subtitles.py.
        final_scene_path = muxed
        if subtitles:
            ass = scenes_dir / f"{sid}.ass"
            # Karaoke tracks the SPEECH, not the trailing breath: on the last
            # scene `actual` includes tail_pad silence, so subtract it or the
            # final words would stretch past the voice.
            sub_dur = actual - (tail_pad_sec if is_last else 0.0)
            sub_info = _subs.build_scene_ass(s, max(0.5, sub_dur), ass)
            r["subtitles"] = sub_info
            if "events" in sub_info:
                subbed = scenes_dir / f"{sid}.subbed.mp4"
                br = _subs.burn(muxed, ass, subbed)
                if "error" not in br:
                    muxed.unlink(missing_ok=True)
                    final_scene_path = subbed
                else:
                    r["subtitles_burn"] = br  # non-fatal: keep unsubbed scene
        muxed_paths.append(final_scene_path)

    # Poster prepend: extract a settled-hero frame from scene 1's PLAYWRIGHT
    # video (not the muxed) → 0.1s hold clip → prepend. Fixes FB/TikTok auto-
    # thumbnail (they grab t=0 and would otherwise get scene 1's blank opening
    # frame) AND gives 0.1s lead-in before voice starts.
    poster_info = None
    if add_poster and muxed_paths:
        first_scene_video = scenes_dir / f"{scenes[0]['id']}.mp4"
        poster_mp4 = scenes_dir / "_poster.mp4"
        pr = make_poster_clip(first_scene_video, poster_mp4, poster_hold_sec)
        if "error" in pr:
            # Non-fatal: log and continue without poster
            poster_info = {"skipped": True, "reason": pr}
        else:
            poster_info = pr
            muxed_paths.insert(0, poster_mp4)
            durations.insert(0, poster_hold_sec)

    final = run_dir / "final.mp4"
    has_poster = add_poster and poster_info and not poster_info.get("skipped")

    # DEFAULT join = gap_hardcut (perfect AV sync — see concat_gap_hardcut). The
    # xfade path (crossfade_ms > 0) is opt-in and drifts video ahead of voice, so
    # it's only for videos where reveal-sync doesn't matter.
    if crossfade_ms > 0 and has_poster:
        # Poster is a hard-cut, xfade only between real scenes. Do 2-step:
        # (a) xfade-concat all non-poster scenes into a tmp
        # (b) concat_filter [poster, tmp] into final
        tmp = final.parent / "_xfade_tmp.mp4"
        xf = concat_crossfade(muxed_paths[1:], durations[1:], tmp, crossfade_ms, gap_ms=gap_ms)
        if "error" in xf:
            out = xf
        else:
            out = concat_filter([muxed_paths[0], tmp], final)
            tmp.unlink(missing_ok=True)
    elif crossfade_ms > 0:
        out = concat_crossfade(muxed_paths, durations, final, crossfade_ms, gap_ms=gap_ms)
    elif has_poster:
        # gap-hardcut the real scenes into a tmp, then prepend the poster (its
        # codec params differ → concat_filter tolerates the mismatch).
        tmp = final.parent / "_gap_tmp.mp4"
        gh = concat_gap_hardcut(muxed_paths[1:], durations[1:], tmp, gap_ms=gap_ms)
        if "error" in gh:
            out = gh
        else:
            out = concat_filter([muxed_paths[0], tmp], final)
            tmp.unlink(missing_ok=True)
    else:
        out = concat_gap_hardcut(muxed_paths, durations, final, gap_ms=gap_ms)

    if "error" in out:
        return {"error": "final_compose_failed", "detail": out}

    # Cleanup intermediate muxed files (keep originals) + poster clip
    for p in muxed_paths:
        p.unlink(missing_ok=True)

    # Optional BGM bed — mix a ducked music track under the whole final. OFF by
    # default (honesty: no unlicensed music). Used only when a real asset is
    # resolved (explicit path or templates/bgm/default.* via 'auto').
    bgm_info = None
    bgm_path = _bgm.resolve_bgm(bgm)
    if bgm_path is not None:
        bgm_out = run_dir / "_final_bgm.mp4"
        mixres = _bgm.mix_bgm(final, bgm_path, bgm_out, bgm_gain=bgm_gain)
        if "error" not in mixres:
            final.unlink(missing_ok=True)
            bgm_out.replace(final)
            bgm_info = {"bgm": str(bgm_path), "gain": bgm_gain}
        else:
            bgm_info = {"skipped": True, "reason": mixres}
    elif bgm:
        bgm_info = {"skipped": True, "reason": f"no_bgm_asset_for:{bgm}"}

    total = round(sum(durations), 2)
    return {
        "final_mp4": str(final),
        "scene_count": len(scenes),
        "total_duration_sec": total,
        "crossfade_ms": crossfade_ms,
        "poster": poster_info,
        "bgm": bgm_info,
        "mux_results": mux_results,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Phase 5 — compose final.mp4 from per-scene video + TTS")
    parser.add_argument("plan", help="Path to plan.md")
    parser.add_argument("--crossfade", type=int, default=0, help="Crossfade duration in ms between scenes (default 0 = plain concat)")
    parser.add_argument("--no-poster", action="store_true",
                        help="Skip the 0.1s scene-1 poster prepend (default: on for FB/TikTok auto-thumb)")
    parser.add_argument("--poster-hold", type=float, default=0.1,
                        help="Poster hold duration in seconds (default 0.1)")
    parser.add_argument("--gap", type=int, default=350,
                        help="Silence gap in ms between scenes so voice doesn't feel 'tua nhanh cho kịp' "
                             "(default 350, only applied when --crossfade > 0)")
    parser.add_argument("--no-subtitles", action="store_true",
                        help="Skip word-by-word karaoke caption burn (default: ON — "
                             "it's the #1 pro-signal per the reference-video teardown)")
    parser.add_argument("--bgm", default="random",
                        help="BGM bed: 'random' (default) picks a random bundled track from "
                             "templates/bgm/; '<name>' a specific track by filename stem; a path "
                             "to a music file; or 'off' for none. Empty pool → silent.")
    parser.add_argument("--bgm-gain", type=float, default=0.22,
                        help="BGM volume multiplier before ducking (default 0.22)")
    parser.add_argument("--tail-pad", type=float, default=0.6,
                        help="Closing breath (sec) appended to the LAST scene so the "
                             "final narration is never clipped by -shortest (default 0.6)")
    args = parser.parse_args()

    plan_path = Path(args.plan).resolve()
    if not plan_path.is_file():
        print(json.dumps({"error": "plan_not_found", "path": str(plan_path)}), file=sys.stderr)
        return 2

    result = compose(plan_path, args.crossfade,
                     add_poster=not args.no_poster,
                     poster_hold_sec=args.poster_hold,
                     gap_ms=args.gap,
                     subtitles=not args.no_subtitles,
                     bgm=args.bgm, bgm_gain=args.bgm_gain,
                     tail_pad_sec=args.tail_pad)
    print(json.dumps(result, indent=2, ensure_ascii=False))
    return 0 if "error" not in result else 1


if __name__ == "__main__":
    sys.exit(main())
