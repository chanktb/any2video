"""TTS narration — Phase 3 of the any2video pipeline.

For each scene in plan.md:
  1. Run edge-tts on `narration` → scenes/<id>.mp3
  2. ffprobe → real duration
  3. Overwrite plan.md `duration_sec` with measured value

CRITICAL: this MUST run before Phase 4 (per-scene HTML). Visual layout sizes
to the measured audio duration. Estimating duration up front instead → AV drift.

Includes 3/7/15s exponential backoff +
250 ms throttle between scenes to avoid Microsoft-edge-tts rate limits.
"""
from __future__ import annotations

import argparse
import asyncio
import json
import subprocess
import sys
from pathlib import Path

import edge_tts

from .. import plan_yaml
from . import google_tts

# Force UTF-8 stdout for Windows cp1252 (Vietnamese diacritics in beat text)
try:
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
except (AttributeError, OSError):
    pass

_RETRY_BACKOFF = [3, 7, 15]
_THROTTLE_MS = 250

# Per-language default voice. Voice in plan.md > meta.voice wins; this is the fallback.
# Voice policy: MALE for marketing/tech/AI/code/learning content (default for any2video).
# Female (HoaiMyNeural) reserved for narrative/story/fable/wellness.
_LANG_DEFAULT_VOICE = {
    "vi": "vi-VN-NamMinhNeural",  # male, technical — fits repo/tech/explainer content
    "en": "en-US-GuyNeural",      # male, conversational tech
}
_FALLBACK_VOICE = _LANG_DEFAULT_VOICE["vi"]
# Default +15% — a marketing/tech rate. Slow default sounds robotic;
# Palmier Pro and similar VN explainers run +15% to +25% over base.
_DEFAULT_RATE = "+15%"


def _is_google_voice(voice: str) -> bool:
    """Detect Google Cloud voices — Chirp / Neural2 / Studio / Wavenet."""
    v = voice.lower()
    return ("chirp" in v) or ("neural2" in v) or ("studio" in v) or ("wavenet" in v)


async def synthesize(text: str, voice: str, out_path: Path,
                     rate: str = _DEFAULT_RATE, lang: str = "vi") -> dict:
    """Synthesize one scene. Try Google Cloud TTS first (if voice matches OR
    voice starts with google-format), then fall back to edge-tts.

    Returns {ok, provider_used, voice_used} for logging. Raises RuntimeError
    only if BOTH providers fail.

    Rationale (user feedback): Google Chirp 3 HD sounds more natural than
    edge-tts for VN narration. Prefer it when available (API key via env var or .env;
    see lib/paths.load_env). Fall back to edge-tts silently — no hard error unless
    both fail.
    """
    # Try Google TTS first when voice looks like a Google voice
    if _is_google_voice(voice):
        try:
            result = await google_tts.synthesize(text, voice, out_path, rate=rate, lang=lang)
            if result.get("ok"):
                return {"ok": True, "provider_used": "google",
                        "voice_used": result.get("voice_used", voice),
                        "fallback": result.get("fallback", False)}
        except Exception as e:
            print(f"  google-tts failed: {e}. Falling back to edge-tts.", file=sys.stderr)
            # Substitute a language-default edge-tts voice for the fallback
            voice = _LANG_DEFAULT_VOICE.get(lang, _FALLBACK_VOICE)

    # edge-tts path
    last_exc: Exception | None = None
    for attempt, backoff in enumerate([0, *_RETRY_BACKOFF]):
        if backoff:
            await asyncio.sleep(backoff)
        try:
            comm = edge_tts.Communicate(text, voice, rate=rate)
            await comm.save(str(out_path))
            return {"ok": True, "provider_used": "edge-tts", "voice_used": voice}
        except Exception as e:
            last_exc = e
            print(f"  edge-tts attempt {attempt + 1} failed: {e}", file=sys.stderr)
    raise RuntimeError(f"BOTH TTS providers failed after retries. Last edge-tts error: {last_exc}")


def measure_duration(mp3_path: Path) -> float:
    """Return real duration in seconds via ffprobe."""
    cp = subprocess.run(
        ["ffprobe", "-v", "error",
         "-show_entries", "format=duration",
         "-of", "default=noprint_wrappers=1:nokey=1",
         str(mp3_path)],
        capture_output=True, text=True, check=True, timeout=15,
    )
    return float(cp.stdout.strip())


async def _synth_beat_split_scene(scene, sid, beats, voice, rate, lang,
                                  scenes_dir: Path, run_dir: Path,
                                  beat_pause_sec: float) -> dict:
    """TTS each beat separately, concat with inter-beat silence pauses, write
    reveal_at_sec back to items referenced by beat.reveal[].

    Writes:
      - scenes/<sid>_b<idx>.mp3         per-beat audio (debug + reprocess-friendly)
      - scenes/<sid>.mp3                 concatenated final scene audio
      - scene.duration_sec               total scene length (used by playwright)
      - scene.audio_path                 relative path to final mp3
      - scene.beat_timeline              list of {index, start_sec, dur_sec, text, reveal}
      - scene.inputs.items[N].reveal_at_sec  when to trigger reveal for item N
                                             (0.0 if item never referenced by any beat)
    """
    beat_mp3_paths: list[Path] = []
    beat_durations: list[float] = []
    beat_starts: list[float] = []
    running = 0.0

    # Step 1: TTS each beat + measure
    for beat_idx, beat in enumerate(beats):
        text = (beat.get("text") if isinstance(beat, dict) else str(beat) or "").strip()
        if not text:
            raise RuntimeError(f"beat {beat_idx} of scene {sid} has empty text")

        beat_mp3 = scenes_dir / f"{sid}_b{beat_idx}.mp3"
        await synthesize(text, voice, beat_mp3, rate=rate, lang=lang)
        await asyncio.sleep(_THROTTLE_MS / 1000)

        dur = measure_duration(beat_mp3)
        beat_starts.append(round(running, 3))
        beat_durations.append(round(dur, 3))
        beat_mp3_paths.append(beat_mp3)
        # Advance clock: beat plays for dur_sec, then a pause (except last beat)
        running += dur
        if beat_idx < len(beats) - 1:
            running += beat_pause_sec

    total_scene_dur = round(running, 3)

    # Step 2: Concat beat mp3s with inter-beat silence pause via ffmpeg concat filter
    final_mp3 = scenes_dir / f"{sid}.mp3"
    concat_beat_mp3s(beat_mp3_paths, final_mp3, beat_pause_sec)

    # Step 3: Build beat_timeline (for template + debug) and reveal_at_sec map
    beat_timeline = []
    reveal_at_by_item_index: dict[int, float] = {}
    for i, beat in enumerate(beats):
        entry = {
            "index": i,
            "start_sec": beat_starts[i],
            "dur_sec": beat_durations[i],
            "text": beat.get("text") if isinstance(beat, dict) else str(beat),
        }
        reveal = beat.get("reveal") if isinstance(beat, dict) else None
        if isinstance(reveal, list):
            entry["reveal"] = list(reveal)
            for item_idx in reveal:
                if isinstance(item_idx, int) and item_idx not in reveal_at_by_item_index:
                    reveal_at_by_item_index[item_idx] = beat_starts[i]
        beat_timeline.append(entry)

    # Step 4: Write reveal_at_sec back into the scene's reveal-target list. Which
    # key holds the revealed elements depends on the template: aicoding-list uses
    # `items`, bar-benchmark uses `bars`, hub-spoke `chips`, terminal-mock
    # `commands`. beat.reveal[] indexes positionally into that list. Apply to
    # whichever list is present so EVERY template gets voice-synced reveals.
    inputs = scene.get("inputs") or {}
    _REVEAL_TARGET_KEYS = ("items", "bars", "chips", "commands", "rows", "cards")
    for key in _REVEAL_TARGET_KEYS:
        arr = inputs.get(key)
        if isinstance(arr, list) and arr:
            for idx, el in enumerate(arr):
                if isinstance(el, dict) and idx in reveal_at_by_item_index:
                    el["reveal_at_sec"] = reveal_at_by_item_index[idx]
            break  # a scene uses exactly one reveal-target list

    scene["duration_sec"] = round(total_scene_dur, 2)
    scene["audio_path"] = str(final_mp3.relative_to(run_dir))
    scene["beat_timeline"] = beat_timeline

    return {
        "id": sid,
        "audio_path": scene["audio_path"],
        "duration_sec": scene["duration_sec"],
        "path": "beat_split",
        "beat_count": len(beats),
        "beat_timeline": beat_timeline,
        "reveal_at_by_item": reveal_at_by_item_index,
    }


def concat_beat_mp3s(beat_mp3_paths: list[Path], out_mp3: Path, pause_sec: float) -> None:
    """Concat beat mp3s with `pause_sec` of silence between each. Uses ffmpeg
    filter graph — mixes cleanly regardless of source mp3 codec params."""
    if not beat_mp3_paths:
        raise RuntimeError("no beat mp3s to concat")
    if len(beat_mp3_paths) == 1:
        # Just copy the single beat's audio through re-encoding to normalize codec
        subprocess.run(
            ["ffmpeg", "-y", "-loglevel", "error",
             "-i", str(beat_mp3_paths[0]),
             "-c:a", "libmp3lame", "-b:a", "192k",
             str(out_mp3)],
            check=True, capture_output=True,
        )
        return

    inputs = []
    for p in beat_mp3_paths:
        inputs += ["-i", str(p)]

    # Build filter: each input (except last) gets apad appended; then all concat
    filters = []
    labels = []
    n = len(beat_mp3_paths)
    for i in range(n):
        if i < n - 1:
            filters.append(f"[{i}:a]apad=pad_dur={pause_sec:.3f}[b{i}]")
            labels.append(f"[b{i}]")
        else:
            labels.append(f"[{i}:a]")
    filters.append(f"{''.join(labels)}concat=n={n}:v=0:a=1[out]")

    subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error",
         *inputs,
         "-filter_complex", ";".join(filters),
         "-map", "[out]",
         "-c:a", "libmp3lame", "-b:a", "192k",
         str(out_mp3)],
        check=True, capture_output=True,
    )


async def run(plan_path: Path) -> dict:
    """Read plan.md, synthesize all scenes, measure durations, rewrite plan.md."""
    plan = plan_yaml.load_plan(plan_path)

    meta = plan.get("meta", {})
    lang = (meta.get("lang") or "vi").lower()
    # Default: Google Cloud TTS Chirp 3 HD (preference: more natural VN)
    # Auto-fallback to edge-tts NamMinhNeural inside synthesize() on any failure.
    provider = (meta.get("voice_provider") or "google").lower()
    if provider in ("google", "google-tts", "chirp"):
        voice = meta.get("voice") or "vi-VN-Chirp3-HD-Charon"
    else:
        voice = meta.get("voice") or _LANG_DEFAULT_VOICE.get(lang, _FALLBACK_VOICE)
    rate = meta.get("voice_rate") or _DEFAULT_RATE
    scenes = plan.get("scenes") or []
    if not scenes:
        return {"error": "no_scenes_in_plan", "plan_path": str(plan_path)}

    run_dir = plan_path.parent
    scenes_dir = run_dir / "scenes"
    scenes_dir.mkdir(exist_ok=True)

    # Inter-beat pause between chunks of a beat-split scene (natural breath).
    beat_pause_ms = int(meta.get("beat_pause_ms") or 150)
    beat_pause_sec = beat_pause_ms / 1000.0

    results = []
    for scene in scenes:
        sid = scene["id"]
        beats = scene.get("beats")

        # ─── Path A: beat-split scene (voice-first, drives item reveals) ───
        if isinstance(beats, list) and beats:
            try:
                r = await _synth_beat_split_scene(
                    scene, sid, beats, voice, rate, lang,
                    scenes_dir, run_dir, beat_pause_sec,
                )
                results.append(r)
                continue
            except Exception as e:
                results.append({"id": sid, "error": str(e), "type": type(e).__name__,
                                "path": "beat_split"})
                continue

        # ─── Path B: legacy single-narration scene ───
        narration = (scene.get("narration") or "").strip()
        if not narration:
            results.append({"id": sid, "error": "empty_narration_and_no_beats"})
            continue

        mp3_path = scenes_dir / f"{sid}.mp3"
        try:
            # synthesize() handles google → edge-tts fallback internally.
            await synthesize(narration, voice, mp3_path, rate=rate, lang=lang)
            await asyncio.sleep(_THROTTLE_MS / 1000)
            measured = measure_duration(mp3_path)
            scene["duration_sec"] = round(measured, 2)
            scene["audio_path"] = str(mp3_path.relative_to(run_dir))
            results.append({
                "id": sid,
                "audio_path": scene["audio_path"],
                "duration_sec": scene["duration_sec"],
                "path": "single_narration",
            })
        except Exception as e:
            results.append({"id": sid, "error": str(e), "type": type(e).__name__})

    meta["total_duration_sec_measured"] = round(sum(s.get("duration_sec", 0) for s in scenes), 2)
    plan["meta"] = meta

    # Rewrite plan.md with measured values (safe dump preserves quoted strings)
    plan_yaml.save_plan(plan, plan_path)

    return {
        "plan_path": str(plan_path),
        "scenes_dir": str(scenes_dir),
        "voice": voice,
        "rate": rate,
        "scene_results": results,
        "total_duration_sec_measured": meta["total_duration_sec_measured"],
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Phase 3 — synthesize TTS for every scene, measure duration, rewrite plan.md")
    parser.add_argument("plan", help="Path to plan.md")
    args = parser.parse_args()

    plan_path = Path(args.plan).resolve()
    if not plan_path.is_file():
        print(json.dumps({"error": "plan_not_found", "path": str(plan_path)}), file=sys.stderr)
        return 1

    result = asyncio.run(run(plan_path))
    print(json.dumps(result, indent=2, ensure_ascii=False))
    return 0 if "error" not in result else 1


if __name__ == "__main__":
    sys.exit(main())
