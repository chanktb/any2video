# SFX library (any2video v5+)

6 short SFX clips placed at scene boundaries based on a 3-tier semantic selector.
Reference pattern: [ai-auto-generate-video](https://github.com/huytranvan2010/AI-auto-generate-video) `src/render/sfx-selector.ts`.

## What's bundled

Each file is a placeholder synthesized via `ffmpeg lavfi` (sine + noise + fade). Production should swap with curated CC0 audio.

| File | Category | Length | Use when |
|------|----------|--------|----------|
| `intro_chime.mp3` | intro | 0.3s | Scene 1 / intro beat — soft entrance bell |
| `transition_whoosh.mp3` | transition | 0.5s | Cross-scene (default per body scene start) |
| `reveal_sting.mp3` | reveal | 0.6s | Narration matches "tiết lộ", "ra mắt", "công bố" |
| `outro_stinger.mp3` | outro | 0.8s | Final scene / outro beat — closing chord |
| `alert_warning.mp3` | alert | 0.15s | Narration matches "cảnh báo", "lưu ý", "rủi ro" |
| `success_ding.mp3` | success | 0.5s | Narration matches "thành công", "kỷ lục", "đột phá" |

## Selection rules (3-tier — lib/audio/sfx_selector.py)

For each scene at compose time:

1. **Tier 1 — explicit override.** Scene has `sfx: { name: "alert_warning", volume: 0.7, start_offset_sec: 0.0 }` → use that, done.
2. **Tier 2 — keyword match.** Scan narration for Vietnamese keywords:
   - `cảnh báo|lưu ý|rủi ro|nguy hiểm` → alert
   - `thành công|kỷ lục|đột phá|chiến thắng` → success
   - `tiết lộ|ra mắt|công bố|giới thiệu` → reveal
   - `hùng vĩ|hoành tráng|cinematic` → reveal (cinematic substitute)
3. **Tier 3 — beat default.** Fallback by `beat`:
   - `intro` → intro_chime
   - `outro` → outro_stinger
   - everything else → transition_whoosh (and only when not first scene)

## Replacing the placeholder synth with real CC0 audio

Sources to pull from:
- **Freesound.org** (CC0 filter) — search "chime", "whoosh", "sting"
- **mixkit.co/free-sound-effects/** — curated CC0
- **OpenGameArt** — game-style SFX

Drop your replacement file at `templates/sfx/<filename>.mp3` (same names). Keep clips ≤ 1s and normalized to about -20 LUFS so they don't overpower TTS narration.

## Per-category default volume / offset

In `sfx_selector.py`:

| Category | Volume | start_offset_sec |
|----------|--------|------------------|
| intro | 0.55 | 0.0 |
| transition | 0.35 | 0.0 |
| reveal | 0.6 | 0.05 |
| outro | 0.65 | 0.0 |
| alert | 0.7 | 0.0 |
| success | 0.55 | 0.05 |

Volumes deliberately below TTS narration (1.0) — SFX punctuates, doesn't compete.
