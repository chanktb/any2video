# Bundled background music — credits & license

These tracks play as a **ducked bed** under the narration (auto side-chain-compressed to
~−20 dB beneath speech). One is picked **at random** per video unless a track is named.

All three are **CC-BY 4.0** — free for commercial use, **attribution required**.

| File | Title | Artist | Vibe | Source |
|------|-------|--------|------|--------|
| `digital-lemonade.mp3` | Digital Lemonade | Kevin MacLeod | lo-fi / upbeat tech | incompetech.com |
| `the-complex.mp3` | The Complex | Kevin MacLeod | dark synth / tech | incompetech.com |
| `ouroboros.mp3` | Ouroboros | Kevin MacLeod | ambient / calm | incompetech.com |

Each file is trimmed to ~100 s and loudness-normalized from the original.

**Attribution — include this when you publish a video that uses a track:**

> Music: "<Title>" by Kevin MacLeod (incompetech.com) — Licensed under Creative Commons:
> By Attribution 4.0. https://creativecommons.org/licenses/by/4.0/

## Using your own music

Drop any `.mp3` / `.m4a` / `.wav` / `.ogg` in this folder (files starting with `_` are
ignored). Then:

- `--bgm random` (default) — pick one from this folder at random
- `--bgm <name>` — a specific track by filename stem (e.g. `--bgm the-complex`)
- `--bgm off` — no music

Prefer **CC0** tracks if you want zero attribution burden.
