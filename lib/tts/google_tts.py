"""Google Cloud TTS via REST API (api-key auth, no SA JSON).

Default voice = vi-VN-Chirp3-HD-Charon (male, technical, premium). Falls back
to Neural2 if Chirp 3 HD rejected (region/quota).

Used when `meta.voice_provider: google` in plan.md. Default provider stays
edge-tts for zero-config fallback.

Auth: set `GOOGLE_TTS_API_KEY` as an environment variable or in a `.env` at the
repo root (loaded via lib.paths.load_env). No key → the pipeline uses edge-tts.
"""
from __future__ import annotations

import asyncio
import base64
import json
import os
import sys
from pathlib import Path

try:
    import requests
except ImportError:
    print(json.dumps({"error": "requests_not_installed", "fix": "pip install requests"}),
          file=sys.stderr)
    raise

_API_URL = "https://texttospeech.googleapis.com/v1/text:synthesize"

# Default Chirp 3 HD voices per language (instruction-following, premium).
_DEFAULT_VOICE = {
    "vi": "vi-VN-Chirp3-HD-Charon",   # male, calm narrator (good for tech/explainer)
    "en": "en-US-Chirp3-HD-Charon",
}
_FALLBACK_VOICE = {
    "vi": "vi-VN-Neural2-D",          # male fallback if Chirp HD rejected
    "en": "en-US-Neural2-D",
}


def _load_api_key() -> str | None:
    """Read GOOGLE_TTS_API_KEY from the environment or a .env (see paths.load_env)."""
    from .. import paths
    paths.load_env()
    return os.environ.get("GOOGLE_TTS_API_KEY")


def _resolve_voice(voice_hint: str | None, lang: str) -> str:
    """Pick voice from hint or lang default."""
    if voice_hint and voice_hint.startswith("vi-VN-") or voice_hint and voice_hint.startswith("en-"):
        return voice_hint
    return _DEFAULT_VOICE.get(lang, _DEFAULT_VOICE["vi"])


def _rate_str_to_speaking_rate(rate: str | None) -> float:
    """Convert edge-tts rate string '+15%' → google speakingRate 1.15."""
    if not rate:
        return 1.0
    r = rate.strip().rstrip("%")
    try:
        pct = float(r)
        return max(0.25, min(4.0, 1.0 + pct / 100.0))
    except ValueError:
        return 1.0


def synthesize_sync(text: str, voice: str, out_path: Path,
                    rate: str = "+15%", lang: str = "vi") -> dict:
    """Synchronous synth — returns {ok, voice_used} or {error, detail}."""
    api_key = _load_api_key()
    if not api_key:
        return {"error": "no_api_key",
                "fix": "Set GOOGLE_TTS_API_KEY as an env var or in a .env at the repo root "
                       "(or just use the edge-tts fallback, which needs no key)"}

    speaking_rate = _rate_str_to_speaking_rate(rate)

    body = {
        "input": {"text": text},
        "voice": {"languageCode": lang + "-VN" if lang == "vi" else "en-US",
                  "name": voice},
        "audioConfig": {"audioEncoding": "MP3", "speakingRate": speaking_rate},
    }

    # Attempt 1: requested voice (likely Chirp 3 HD)
    try:
        r = requests.post(f"{_API_URL}?key={api_key}", json=body, timeout=60)
    except Exception as e:
        return {"error": "request_failed", "detail": str(e)}

    if r.status_code != 200:
        # If Chirp 3 HD rejected, retry with Neural2 fallback
        err_text = r.text[:300]
        if "HD" in voice or "Chirp" in voice:
            fallback = _FALLBACK_VOICE.get(lang, _FALLBACK_VOICE["vi"])
            body["voice"]["name"] = fallback
            try:
                r2 = requests.post(f"{_API_URL}?key={api_key}", json=body, timeout=60)
                if r2.status_code == 200:
                    data = r2.json()
                    out_path.write_bytes(base64.b64decode(data["audioContent"]))
                    return {"ok": True, "voice_used": fallback, "fallback": True,
                            "original_rejected": voice, "reason": err_text}
                err_text = r2.text[:300]
            except Exception as e:
                return {"error": "fallback_failed", "detail": str(e)}
        return {"error": f"http_{r.status_code}", "detail": err_text}

    data = r.json()
    out_path.write_bytes(base64.b64decode(data["audioContent"]))
    return {"ok": True, "voice_used": voice}


async def synthesize(text: str, voice: str, out_path: Path,
                     rate: str = "+15%", lang: str = "vi") -> None:
    """Async wrapper matching edge-tts narrate.synthesize signature."""
    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(
        None, synthesize_sync, text, voice, out_path, rate, lang
    )
    if "error" in result:
        raise RuntimeError(f"Google TTS failed: {result.get('error')} — {result.get('detail', '')}")
    return result


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Google Cloud TTS — Chirp 3 HD")
    parser.add_argument("text")
    parser.add_argument("--out", required=True)
    parser.add_argument("--voice", default="vi-VN-Chirp3-HD-Charon")
    parser.add_argument("--rate", default="+15%")
    parser.add_argument("--lang", default="vi")
    args = parser.parse_args()

    r = synthesize_sync(args.text, args.voice, Path(args.out), args.rate, args.lang)
    print(json.dumps(r, ensure_ascii=False, indent=2))
    sys.exit(0 if r.get("ok") else 1)
