# SCENE-DESIGN.md: scene design doctrine (render path B)

These rules are LAW for every video composed in `render-remotion/`. They were locked
in during the first field runs (2026-07) and every one of them was paid for with a
real visual bug or a rejected draft. Read this BEFORE composing scenes.

## Core philosophy

1. **The slide is the STRUCTURE, the voice + karaoke are the WORDS.** Two channels,
   zero text overlap. Text on a scene is a short LABEL (3 words max per label), never
   the narration sentence. A good talk never puts the transcript on the slide: the
   karaoke caption already carries the transcript.
2. **No fixed templates.** A pre-built template pool makes every video look like every
   other tool's output. Each video gets its own layouts, composed from primitives.
   Within one video, no two scenes share a layout; across videos, never paste a layout
   verbatim.
3. **Divide content into blocks.** Every idea becomes a shaped block (card, pill,
   icon tile, ring, arrow, row). Never ship a scene that is only a headline. Standard
   density: 1 title badge + 2-3 block groups + karaoke.

## Materials (src/lib/)

- `core.tsx`: types (`KWord`, `SceneTiming`), `easeOut`, `countAt` / `progressAt`
  (pure functions, safe inside `.map()`), `Rise` / `Pop` / `SceneFade`,
  `clipLineToRect` (slab clipping for connectors).
- `karaoke.tsx`: word-level captions. `KaraokeNeon` (dark skins, glow keywords),
  `KaraokeMarker` (light skins, highlighter fill), `KaraokeSticker` (pop skins).
  The caption band lives at y 1470-1635. Scenes must keep that band empty.
- `skins.ts`: 13 verified skins as TOKENS (palette, fonts, shape language, karaoke
  flavor). A skin is never a layout. One skin per video, chosen by content mood.
- `footage.tsx`: `FootageScene` embeds a real mp4 (repo scroll, product capture)
  muted and cover-fit; karaoke and voice run on top.

## Composing one scene

1. Read the narration sentence and ask: **"what STRUCTURE does this sentence
   have?"** Convergence, comparison, flow, cadence, ratio, ranking, timeline,
   transformation A to B, filter, division of labor...
2. Draw the shape that expresses that structure, in plain JSX/SVG, styled with the
   video's skin tokens. Never start from "which template do I use": start from
   "what shape is this idea".
3. Labels on blocks: 3 words max. Numbers on slides must be real (from the source);
   estimates must be marked as such.
4. Stagger the reveal: badge (frames 0-15), main block (15-40), details (40+),
   karaoke fades in with the voice. The main element should keep animating for
   60-80% of the scene duration; a scene that goes fully static reads as frozen.
5. Connectors (arrows, SVG lines) must STOP AT THE BLOCK EDGE. Use
   `clipLineToRect`: naive per-axis clipping produces stub lines, and unclipped
   lines pierce straight through panels.

## Hard constraints (inherited from path A + paid-for lessons)

- Animation ONLY via `interpolate()` / `spring()` driven by `useCurrentFrame()`.
  CSS animations and transitions are FORBIDDEN (Remotion renders per frame).
- No React hooks inside `.map()`: grab `frame` once, then use `countAt` /
  `progressAt`.
- Safe zone: main content inside x 90-990, y 345-1575. Never cross the 4:5 crop
  guides (y=285 / y=1635). Karaoke band y 1470-1635 is reserved.
- Stickers / chips rendered outside a headline must set an explicit `fontSize`
  (otherwise they inherit the 16px root and render tiny).
- Numbers: digits on the slide, spelled-out words in the narration.
- No em-dash anywhere. No italic for Vietnamese text. Vietnamese line-height 1.22+.
- Fonts via `@remotion/google-fonts/<Font>` with `subsets: ["latin", "vietnamese"]`.
  `tsc` rejects fonts without a vietnamese subset (DMMono, SpaceGrotesk are
  latin-only: use them for digits / EN labels exclusively).
- One focal point per scene. When the sentence is about a number, that number must
  be the largest element on screen.
- Every block must carry content. An empty decorative panel violates the density
  rule: give it a glyph, a label, or delete it.

## Living examples

- `src/videos/flow-movie-pipeline-pop.tsx`: pop-sticker skin, chart-heavy.
- `src/videos/flow-movie-pipeline-tour.tsx`: cinematic-teal skin, full 15-scene
  arc with hybrid Playwright footage scenes and a moving hook.
- Same doctrine, two completely different layout sets. That is the standard:
  every run is a fresh design job.
