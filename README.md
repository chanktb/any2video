# any2video

Turn **any input** — a GitHub repo, a URL, an article, or raw text — into a
**9:16 vertical narrated video** (Reels / Shorts / TikTok format).

Unlike fixed-template video generators, an agent (Claude Code) does the deep
extraction itself, writes the plan, designs **per-scene HTML/CSS** (no layout
pool), then the toolbox here measures the voiceover, renders each scene, and
composes the final `mp4`.

## What makes the output feel professional

These are baked into the pipeline (learned from a teardown of several 9/10
repo-tour Shorts — see `skill/references/reference-video-teardown.md`):

- **Word-synced karaoke captions** — burned per scene, filling word-by-word with
  the voice, number-words accented. (`lib/compose/subtitles.py`)
- **Real repo-footage scenes** — a genuine scrolling screen-capture of the live
  repo (file tree → README → screenshots) or an author profile, framed in a
  browser chrome bar with the real URL. An authenticity beat, not synthetic text.
  (`lib/render/repo_footage.py`)
- **Beat-split reveals** — list/bar items appear (and bars fill left→right) exactly
  as the narrator names them, not all at once.
- **AV-sync by design** — TTS is measured first; scenes are joined with a
  gap-hardcut so the picture never drifts ahead of the voice.
- **Per-scene visual design** with 3-tier safe-zone enforcement for 9:16.

## How it works (pipeline)

```
input → 1. extract  → 2. plan (narrative)  → 3. TTS (measure duration)
      → 4. per-scene HTML → render → 5. compose (mux + captions + join) → final.mp4
```

TTS runs **before** the visuals so every scene's layout is sized to the real
audio duration (no drift). See `skill/SKILL.md` for the full agent spec.

## Prerequisites

- **Python 3.10+**
- **FFmpeg** (`ffmpeg` + `ffprobe`) on your `PATH`
- **Playwright** Chromium (renders scenes and captures repo footage)

## Install

```bash
pip install -r requirements.txt
python -m playwright install chromium
```

## Configuration

Copy `.env.example` to `.env` (it is gitignored) and fill in what you need — or
set the same names as environment variables.

**Text-to-speech (pick one):**

| Option | Quality | Key needed |
|---|---|---|
| **edge-tts** (default fallback) | Good, free | none |
| **Google Cloud TTS** (Chirp 3 HD) | Best, natural | `GOOGLE_TTS_API_KEY` |

If `GOOGLE_TTS_API_KEY` is set and the plan requests a Google voice
(`meta.voice_provider: google`), it is used; otherwise the pipeline falls back to
edge-tts automatically — so it works with **no key at all**.

**Optional — Telegram delivery** (send the transcript / final video to a chat):

```
ANY2VIDEO_TG_BOT_TOKEN=...
ANY2VIDEO_TG_CHAT_ID=...
```

The loader also supports a **secrets pointer** — set
`ANY2VIDEO_ENV_FILE=/path/to/other.env` in your `.env` and that file is loaded
too, so you can keep secrets outside the repo.

## Usage

The primary interface is a **coding-agent skill** in `skill/SKILL.md`. It works
great with **Claude Code** and with **Antigravity** — any agent that can run the
CLIs below drives the same pipeline and produces the same quality videos. A run is
a normal agent session (Phase 4 injects data into templates, so it is not
token-heavy). Every phase is also a standalone CLI you can run from the repo root:

```bash
# 1. Extract + scaffold a run from any input
python -m lib.cli init "https://github.com/<owner>/<repo>" --lang vi
#    → the agent writes analysis.md + plan.md into workspace/runs/<slug>/

# 3. Synthesize the voiceover (measures real durations)
python -m lib.tts.narrate workspace/runs/<slug>/plan.md

# 4. Render each scene (Playwright video)
python -m lib.render.playwright_render all workspace/runs/<slug>/plan.md

# 5. Compose the final mp4 (karaoke captions on by default)
python -m lib.compose.ffmpeg_compose workspace/runs/<slug>/plan.md --gap 350
```

Add `--bgm auto` to the compose step once you drop a licensed background loop at
`skill/templates/bgm/default.mp3` (no music ships with the repo).

## Repo layout

```
lib/            the toolbox (sources, tts, render, compose, notify, critic)
skill/          the Claude Code skill
  SKILL.md      agent workflow spec (the "brain")
  templates/    scene templates, SFX, design tokens, schemas
  references/   the reference-video craft teardown
workspace/      generated runs (gitignored)
```

## Language

Defaults to Vietnamese narration (`--lang vi`); pass `--lang en` for English.
The TTS rules and some docs include Vietnamese examples.

## Credits

- Scene templates under `skill/templates/scenes/` each carry their own `NOTICE.md`
  with the original author + license — the source of truth. Two (`frame-aicoding-*`)
  are original (MIT); the rest are adapted from open-source template designs under
  Apache-2.0. Keep the `NOTICE.md` files intact if you redistribute.
- Bundled SFX are placeholder clips synthesized with FFmpeg; swap in curated CC0
  audio for production.

## Author

Built by **Khue Tran** — [khuetran.com](https://khuetran.com).

## License

[MIT](LICENSE) © 2026 Khue Tran. (Vendored templates remain under Apache-2.0.)
