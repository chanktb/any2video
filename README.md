# any2video

Turn **any input** — a GitHub repo, a URL, an article, or raw text — into a
**9:16 vertical narrated video** (Reels / Shorts / TikTok format).

Unlike fixed-template video generators, an agent (Claude Code or Antigravity) does
the deep extraction itself and writes the narrative plan, then assembles each scene by
picking a template from a catalog and filling it with real data — a **guarded** path,
not free-hand HTML, so the safe-zones / brand bars / caption band are always correct.
The toolbox measures the voiceover, **gates every scene**, renders, and composes the
final `mp4`.

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
- **Reads brand names right, shows them clean** — the voice speaks tricky names
  phonetically ("README" → "ruýt my", "any2video" → "en ni tu vi đeo") while every
  on-screen surface (title, karaoke caption, post) keeps the exact spelling.
- **Ducked background music** — a bundled track sits ~−20 dB under the narration and
  swells in the gaps (on by default; random from the pool or pick one).
- **Reads the actual source, not just the README** — for a repo it clones and opens the
  entry point + core files, traces the real flow, and mines the non-obvious "weapon" and
  the honest caveat from the code. Every architecture/flow claim is cited to a file, not a
  marketing bullet, so the tour reflects what the repo *does*, not what its README claims.
- **Template-driven scenes** with 3-tier safe-zone enforcement for 9:16 — every scene
  is measured and gated before render (see below), so broken frames never ship.

## How it works (pipeline)

```
input → 1. extract → 2. plan (+ narrative gate) → ✋ approve script → 3. TTS (measure)
      → 4. fill templates → 4.5 GATE every scene → ✋ approve stills → render → 5. compose → mp4
```

TTS runs **before** the visuals so every scene's layout is sized to the real
audio duration (no drift). See `skill/SKILL.md` for the full agent spec.

**Two human checkpoints** (optional, via Telegram) keep waste out of the loop:

1. **Script — before TTS.** You see each scene's on-screen text **and the read-aloud
   line**, so you fix both wording and *pronunciation* (e.g. "README" spoken as "ruýt my",
   not letter-by-letter) before any audio is synthesized.
2. **Stills — after the gate, before render.** You get the rendered scene frames for a
   final visual sign-off (catches what the automated checks can't — a mojibake glyph, an
   off-brand colour) before the expensive video render. A wrong scene is fixed and
   re-checked on its own.

## Quality gates — why the output is clean

Every run passes gates before a single frame is rendered, so a broken scene never
reaches the final video. This is the difference from a fixed-template generator:
layouts are template-driven (guards always on) **and** every filled scene is measured.

- **Plan gate** (`python -m lib.critic.plan_critic`) — structure + narrative craft: a
  pain-first hook (never "today we look at…"), 2nd-person address, contrast phrasing,
  no generic "check out the repo" close, and durations within ±10s of a requested
  length. It also enforces the closing: a repo tour ends on real author-profile
  footage, never a plain text card.
- **Scene gate** (`python -m lib.critic.scene_gate all <plan>`) — the blocking one.
  It renders every scene at 1080×1920 (fonts loaded, animations settled) and fails on:
  - text cut at the frame edge, past the side safe margins, or straddling the 4:5 crop
  - text clipped by its box — including a **Vietnamese tone mark** (Ậ Ỗ Ồ) sliced at the top
  - two text blocks overlapping / stuck together, or line-height below 1.15
  - an **empty box** — a bordered card that rendered hollow (icon/font/child failed)
  - a **broken image**, an AI-slop palette, or a scene identical to its neighbour

  `pass:false` ⇒ the scene is fixed and re-checked; **video is never rendered on a
  failing plan.** Faint "ghost echo" decoration is filtered out so the gate doesn't
  cry wolf.

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

Default is a **male voice** via **Google Cloud TTS (Chirp 3 HD)** when `GOOGLE_TTS_API_KEY`
is set; otherwise it falls back automatically to a male edge-tts voice — so it works with
**no key at all**. (Pick a female or different voice per plan via `meta.voice`.)

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
# 1. Extract + scaffold a run from any input   (--duration 60 → target length, hit within ±10s)
python -m lib.cli init "https://github.com/<owner>/<repo>" --lang vi
#    → the agent writes analysis.md + plan.md into workspace/runs/<slug>/

# 2.6 CHECKPOINT 1 — approve the script (display + read-aloud) before TTS  [optional]
python -m lib.notify.telegram script workspace/runs/<slug>/plan.md

# 3. Synthesize the voiceover (measures real durations)
python -m lib.tts.narrate workspace/runs/<slug>/plan.md

# 4. Fill scene templates from the plan
python -m lib.render.template_render all workspace/runs/<slug>/plan.md

# 4.5 GATE — inspect every scene; must print pass:true before rendering
python -m lib.critic.scene_gate all workspace/runs/<slug>/plan.md

# 4.6 CHECKPOINT 2 — approve the rendered scene stills before render  [optional]
python -m lib.notify.telegram scenes workspace/runs/<slug>/plan.md

# 5. Render each scene (Playwright video) — only after gate + stills approved
python -m lib.render.playwright_render all workspace/runs/<slug>/plan.md

# 6. Compose the final mp4 (karaoke captions on by default)
python -m lib.compose.ffmpeg_compose workspace/runs/<slug>/plan.md --gap 350
```

**Background music is ON by default** — compose picks a random bundled CC-BY track
(`skill/templates/bgm/`, ducked ~−20 dB under the voice). Use `--bgm the-complex` to pick
a specific one, or `--bgm off` for none. Drop your own `.mp3`/`.wav` in that folder to add
to the pool. See `skill/templates/bgm/CREDITS.md` for the tracks + the CC-BY attribution to
include when you publish.

## Repo layout

```
lib/            the toolbox (sources, tts, render, compose, notify, critic)
skill/          the Claude Code skill
  SKILL.md      agent workflow spec (the "brain")
  templates/    scene templates, SFX, background music, design tokens, schemas
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

[MIT](LICENSE) © 2026 Khue Tran. (Vendored templates remain under Apache-2.0; bundled
background music is CC-BY 4.0 — see `skill/templates/bgm/CREDITS.md`.)
