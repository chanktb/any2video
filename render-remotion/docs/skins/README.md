# Skin gallery (render path B)

13 verified skins for the Remotion free-compose path. A skin is **tokens only**
(palette, fonts, shape language, karaoke variant), defined in
[`src/lib/skins.ts`](../../src/lib/skins.ts). Layouts are never part of a skin:
every video composes its own scenes (see [`SCENE-DESIGN.md`](../../SCENE-DESIGN.md)).

Pick **one skin per video**, by content mood. All previews below show the same demo
content restyled, so differences are the skin, not the layout.

| | | |
|---|---|---|
| ![terminal-crt](01-terminal-crt.png) `terminal-crt`: dev tool, hacker, a machine really running | ![blueprint](02-blueprint.png) `blueprint`: architecture teardown, how-it-works | ![swiss](03-swiss.png) `swiss`: benchmarks, numbers, minimal authority |
| ![keynote-clean](04-keynote-clean.png) `keynote-clean`: serious product, buying audience | ![poster-70s](05-poster-70s.png) `poster-70s`: retro personality, personal channel | ![cinematic-teal](06-cinematic-teal.png) `cinematic-teal`: storytelling, long narrative |
| ![comic](07-comic.png) `comic`: hot news, drama, high energy | ![notebook](08-notebook.png) `notebook`: friendly tutorial | ![chalkboard](09-chalkboard.png) `chalkboard`: teaching, lecture |
| ![tech-dark-neon](10-tech-dark-neon.png) `tech-dark-neon`: tech repo tour, serious with glow | ![escbase-starfield](11-escbase-starfield.png) `escbase-starfield`: AI-news infographic, high density | ![mono-editorial](12-mono-editorial.png) `mono-editorial`: print newspaper, analytical |
| ![pop-sticker](13-pop-sticker.png) `pop-sticker`: playful mass-market, TikTok/Reels | | |

Karaoke variant per skin: `neon` (dark skins, glow keywords), `marker` (light skins,
highlighter fill), `sticker` (pop skins). Components in
[`src/lib/karaoke.tsx`](../../src/lib/karaoke.tsx).
