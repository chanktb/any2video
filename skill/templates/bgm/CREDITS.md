# Background music — credits & license

The bundled beds play as a **ducked bed** under the narration (auto side-chain-compressed
to ~−20 dB beneath speech). One is picked **at random** per video unless a track is named.

## Bundled beds — ORIGINAL, claim-proof by construction

| File | Mood | Source |
|------|------|--------|
| `amber-drift.mp3` | warm minor pad · calm | generated (`_generate_beds.py`) |
| `slate-focus.mp3` | dark / techy pad · focused | generated (`_generate_beds.py`) |
| `mint-lift.mp3` | bright major pad · optimistic | generated (`_generate_beds.py`) |

These are **synthesised from scratch with ffmpeg** (pure sine partials + filters — see
`_generate_beds.py`). Because no external recording exists, they are:

- **Public-domain / CC0 in effect** — no attribution required, use anywhere.
- **Immune to Content-ID / Facebook Rights Manager** — nothing to fingerprint-match, so
  Facebook / Instagram / YouTube / TikTok will **not** auto-mute or claim them.

Regenerate any time: `python _generate_beds.py` (from this folder).

## Why the old tracks were removed

`_disabled/` holds the previous beds (`digital-lemonade`, `the-complex`, `ouroboros` by
Kevin MacLeod / incompetech). They are **legally** CC-BY 4.0 (free commercial use with
attribution) — but that is a *licensing* fact, not a *Content-ID* fact. Kevin MacLeod's
music is so widely re-uploaded that aggregators (AdRev, HAAWK…) registered it in
Facebook/YouTube Content-ID, so publishing a video with it triggers a **false copyright
claim → partial mute**. Kept in `_disabled/` (not deleted) for reference; the pool ignores
that subfolder. Do NOT move them back if you publish to FB/IG/YT.

## Using your own music

Drop any `.mp3` / `.m4a` / `.wav` / `.ogg` in this folder (files starting with `_` are
ignored). Then:

- `--bgm random` (default) — pick one from this folder at random
- `--bgm <name>` — a specific track by filename stem (e.g. `--bgm slate-focus`)
- `--bgm off` — no music

**If you add third-party music, use a Content-ID-safe source** so FB doesn't mute it:
- **Meta Sound Collection** (Meta Business Suite → Sound Collection) — guaranteed no claims on FB/IG.
- **YouTube Audio Library** / **Pixabay Music** / **Uppbeat** — CC0 / free, no attribution, near-zero claim risk.

Avoid "royalty-free" tracks from unknown sources — a valid license does **not** stop a
Content-ID match.
