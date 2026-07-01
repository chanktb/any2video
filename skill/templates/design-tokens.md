# design-tokens.md — Phase 4 visual language

This is what Claude reads BEFORE writing per-scene HTML. It's the constraint that keeps every video coherent without forcing every video to look the same.

## Canvas + 3-tier safe system

```
viewport: 1080 × 1920 (9:16)         # default
viewport (16:9): 1920 × 1080
viewport (1:1):  1080 × 1080

# 9:16 tiers (3-tier system)
UNSAFE         outer hatched bands (top/bottom 285px, sides 90px)
4:5 crop       y 285..1635, x 0..1080  → IG/FB feed preview cut line; NEVER place elements straddling this edge
OUTER safe     y 285..1635, x 90..990  (900×1350) → background art, full-bleed gradient, decorative shapes
INNER content  y 345..1575, x 90..990  (900×1230) → hero text, hook word, big number, CTA, key visuals
```

Phase 4 critic gate (Gate 3) rules:
- **Primary content** (text, numbers, CTAs, labeled icons) → INNER only
- **Background / gradient / decorative art** → OUTER OK (may touch 4:5 edges)
- **Secondary elements** (channel name, source citation, watermark) → either inside INNER OR fully outside 4:5 (`bottom ≤ 285` or `top ≥ 1635`). NEVER straddling y=285 / y=1635.
- Nothing in the red hatched bands except full-bleed background art.

## Palette (4 themes — pick per scene by theme_hint)

### dark (default for technical content)
```css
--bg:          #0A0E1A;   /* canvas */
--bg-elev:    #141A2E;   /* card surface */
--fg:          #F5F7FA;   /* primary text */
--fg-muted:   #8B95B0;   /* secondary text */
--accent:     #4FD1C5;   /* highlight, links, numbers */
--accent-2:   #F687B3;   /* secondary accent, rare */
--danger:     #FC8181;
--success:    #68D391;
--border:     #1F2942;
```

### light (default for editorial/article)
```css
--bg:          #FAFAFA;
--bg-elev:    #FFFFFF;
--fg:          #1A202C;
--fg-muted:   #4A5568;
--accent:     #3182CE;
--accent-2:   #D53F8C;
--danger:     #C53030;
--success:    #2F855A;
--border:     #E2E8F0;
```

### vivid (default for product/launch)
```css
--bg:          #FFF8F0;
--bg-elev:    #FFFFFF;
--fg:          #2D1B2E;
--fg-muted:   #6B4F6E;
--accent:     #FF6B35;
--accent-2:   #F7B801;
--danger:     #C53030;
--success:    #2F855A;
--border:     #F4E4D0;
```

### mono (default for code-heavy explainer)
```css
--bg:          #FFFFFF;
--bg-elev:    #F7F7F7;
--fg:          #000000;
--fg-muted:   #555555;
--accent:     #000000;     /* mono palette: structure carries the design */
--accent-2:   #000000;
--danger:     #000000;
--success:    #000000;
--border:     #000000;
```

## Typography

```css
--font-sans:  'Inter', -apple-system, system-ui, sans-serif;
--font-mono:  'JetBrains Mono', 'Cascadia Code', monospace;
--font-display: 'Inter', -apple-system, sans-serif;   /* swap to 'Fraunces' for editorial */

/* Sizes (9:16 viewport) */
--size-hero:    180px;     /* one big number / one big word */
--size-h1:      96px;
--size-h2:      64px;
--size-body:    44px;
--size-caption: 32px;
--size-meta:    24px;

/* Weights */
--w-display: 800;
--w-h:        700;
--w-body:    400;
--w-caption: 500;
--w-mono:    500;

/* Line height — tight for headlines, generous for body */
--lh-hero: 0.95;
--lh-h:     1.1;
--lh-body: 1.35;
```

## Spacing — 8pt grid

```css
--s-1: 8px;
--s-2: 16px;
--s-3: 24px;
--s-4: 32px;
--s-5: 48px;
--s-6: 64px;
--s-7: 96px;
--s-8: 128px;
```

## Motion (Phase 4 inline animations)

Allowed CSS animations (keep cheap, hyperframe-compatible):
- `opacity` fade (200-400ms cubic-bezier(.4,0,.2,1))
- `transform: translateY()` slide-up (300-500ms)
- `transform: scale()` pop (200ms, scale 0.92 → 1)
- `clip-path: inset()` reveal (400-700ms)
- text typing via `width` + `overflow: hidden`

NOT allowed (breaks hyperframe path):
- WebGL, canvas-2d animations
- `@keyframes` longer than scene duration
- Large `<video>` embeds (use SVG/CSS)

If you need richer motion (particle effects, complex SVG morphs), the user invokes with `--rich` → Playwright path, no animation restrictions.

## Iconography

Inline SVG only. Prefer:
- **lucide** for UI icons (lucide.dev)
- **simple-icons** for brand logos (simpleicons.org)
- Hand-drawn `<path>` for unique illustrations

Cite the icon source in an HTML comment so future-Claude knows where it came from.

## Layout principles (NOT layouts — principles)

Phase 4 does NOT pick from a layout pool. Claude writes layout from the scene's `visual_brief`. But layout choices should respect:

1. **One focal point per scene.** If you can't point at the "thing the viewer should look at first," redesign.
2. **Negative space is design.** Don't fill the canvas to fill it.
3. **Type hierarchy ≥ 3 levels.** Hero / body / caption — distinct sizes, distinct weights.
4. **Numbers are heroes.** When showing stats, the number is the largest element.
5. **Code is content.** Render code as a code block (mono font, line numbers, syntax highlight) — never as flat text.
6. **One accent per scene.** `--accent` for the "thing." `--accent-2` rarely.
7. **Distinct from neighbor.** No two consecutive scenes share the same dominant shape/grid/focal layout.

## Required HTML wrapper

Every `scenes/<id>.html` is self-contained with this shell:

```html
<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    /* ───── palette + type vars for chosen theme (paste correct theme block) ───── */
    :root {
      --bg: #0A0E1A; --bg-elev: #141A2E;
      --fg: #F5F7FA; --fg-muted: #8B95B0;
      --accent: #4FD1C5; --accent-2: #F687B3;
      --kw: #4ADE80;           /* caption keyword highlight */
      --border: #1F2942;
      --font-sans: 'Inter', system-ui, sans-serif;
      --font-mono: 'JetBrains Mono', 'Cascadia Code', monospace;
    }
    html, body { margin: 0; padding: 0; }
    body {
      width: 1080px; height: 1920px;
      background: var(--bg); color: var(--fg);
      font-family: var(--font-sans);
      overflow: hidden; position: relative;
    }

    /* ───── 3-tier safe zones ───── */
    .outer  { position: absolute; left: 90px; top:  285px; width: 900px; height: 1350px; }
    .inner  { position: absolute; left: 90px; top:  345px; width: 900px; height: 1230px; }
    /* secondary slots OUTSIDE 4:5 — pick top OR bottom band, never straddle the cut line */
    .out-top    { position: absolute; left: 90px; top:    0px; width: 900px; height: 280px; }
    .out-bottom { position: absolute; left: 90px; top: 1640px; width: 900px; height: 280px; }

    /* ───── BRAND HEADER (top band, OUT-TOP) ───── */
    .brand-header {
      position: absolute; left: 90px; top: 90px;
      width: 900px; height: 80px;
      display: flex; align-items: center; justify-content: space-between;
      padding-bottom: 18px;
      border-bottom: 2px solid var(--fg);   /* thin underline like Palmier Pro */
    }
    .brand-header .b-left { display: flex; align-items: center; gap: 18px; }
    .brand-header .b-avatar {
      width: 56px; height: 56px; border-radius: 50%;
      overflow: hidden; flex-shrink: 0;
      background: var(--bg-elev);
    }
    .brand-header .b-avatar img { width: 100%; height: 100%; object-fit: cover; }
    .brand-header .b-name {
      font-size: 26px; font-weight: 800; letter-spacing: 2.5px;
      color: var(--fg); text-transform: uppercase;
    }
    .brand-header .b-tagline {
      font-size: 18px; font-weight: 500; letter-spacing: 3px;
      color: var(--fg-muted); text-transform: uppercase;
    }

    /* ───── BRAND FOOTER (bottom band, OUT-BOTTOM) ───── */
    .brand-footer {
      position: absolute; left: 90px; top: 1750px;
      width: 900px; height: 90px;
      display: flex; align-items: center; justify-content: flex-start;
      gap: 16px; flex-wrap: wrap;
      font-family: var(--font-mono);
      font-size: 19px; color: var(--fg-muted);
    }
    .brand-footer .stat { display: inline-flex; align-items: center; gap: 6px; opacity: 0.85; }
    .brand-footer .sep  { opacity: 0.4; }
    .brand-footer .icon { width: 16px; height: 16px; vertical-align: middle; fill: var(--accent); }

    /* ───── CAPTION OVERLAY (at the bottom of INNER zone) ───── */
    .caption-overlay {
      position: absolute; left: 90px; top: 1380px;
      width: 900px; min-height: 160px;
      display: flex; align-items: center; justify-content: center;
      text-align: center;
      font-size: 44px; font-weight: 600; line-height: 1.35;
      color: var(--fg);
      opacity: 0;
      animation: cap-fade 480ms ease-out forwards;
    }
    .caption-overlay .kw {
      color: var(--kw); font-weight: 800;
    }
    @keyframes cap-fade { to { opacity: 1; } }

    /* ───── BG GLOW (sustained motion in background — keep all scenes alive) ───── */
    .bg-glow {
      position: absolute; inset: 0; pointer-events: none; z-index: 0;
      background:
        radial-gradient(circle at 22% 18%, rgba(79,209,197,0.10), transparent 35%),
        radial-gradient(circle at 82% 78%, rgba(246,135,179,0.07), transparent 38%);
      animation: glow-drift 14s ease-in-out infinite alternate;
    }
    @keyframes glow-drift {
      0%   { transform: translate(0, 0)        scale(1.00); opacity: 0.85; }
      50%  { transform: translate(-30px, 20px) scale(1.05); opacity: 1.00; }
      100% { transform: translate(20px, -15px) scale(1.02); opacity: 0.90; }
    }

    /* scene-specific styles inline below */
  </style>
</head>
<body>
  <div class="bg-glow"></div>
  <!-- full-bleed background art may render directly on <body> (or omit if .bg-glow is enough) -->

  <!-- BRAND HEADER (every scene) — from meta.brand -->
  <div class="brand-header">
    <div class="b-left">
      <div class="b-avatar"><img src="https://github.com/<owner>.png?size=120" alt=""></div>
      <div class="b-name"><owner> / <repo></div>
    </div>
    <div class="b-tagline">REPO TOUR</div>
  </div>

  <!-- PRIMARY scene content -->
  <div class="inner">
    <!-- hero text, hook, number, CTA, illustration, etc -->
  </div>

  <!-- CAPTION OVERLAY (synced to narration text per scene) -->
  <div class="caption-overlay">
    Một dòng lệnh.<br>
    <span class="kw">Một video.</span> <span class="kw">Không tốn xu nào.</span>
  </div>

  <!-- BRAND FOOTER (every scene) — from meta.footer -->
  <div class="brand-footer">
    <span class="stat">★ 9,148</span>
    <span class="sep">·</span>
    <span class="stat">⑂ 642 forks</span>
    <span class="sep">·</span>
    <span class="stat">⌥ 720 commits</span>
    <span class="sep">·</span>
    <span class="stat">v0.4.4</span>
    <span class="sep">·</span>
    <span class="stat">MIT</span>
  </div>
</body>
</html>
```

## Persistent brand bars — the why

The reference visual language (Palmier Pro style) keeps a tiny brand strip at the top and a metadata strip at the bottom across EVERY scene. Two reasons:

1. **Continuity.** Viewers scrolling Reels look away mid-scene; the bar tells them what they're watching even if the inner content changed.
2. **Authority.** Live stars / commits / version turn the video into a "this is a real shipping thing" signal rather than a generic explainer.

For any2video, the brand block comes from `plan.md > meta.brand` (avatar URL, name, tagline) and the footer from `meta.footer` (a list of "icon · value" stat strings the planner extracts from `github_bundle.json`). Each scene's HTML pastes the same `.brand-header` + `.brand-footer` markup; only `.inner` changes per scene.

## Caption overlay — the why

The Palmier-Pro-style caption overlay shows the narration text on screen with keywords highlighted in `--kw` color. Mute-watchers (most of TikTok / Reels) need this; the colored keywords let them follow even at glance speed.

Implementation per scene:
- Drop a `.caption-overlay` block at y=1380 (just inside INNER's bottom)
- 1-2 short lines covering the narration's headline sentence
- Wrap 2-4 keywords in `<span class="kw">…</span>` (highlight color from `--kw`)
- Animation: fades in once the scene's main content has settled (≥ 800ms in)

Don't try to do word-by-word karaoke sync without word-timestamp data from TTS — fade-in is enough.

## Anti-slop guardrails (HARD — Gate 3 enforces)

AI generators default to a handful of palettes/fonts that immediately scream "AI made this." Avoid them. Reference: visual-explainer SKILL.md anti-slop checklist.

### Banned colors (Gate 3 fails)

| Hex | Why banned |
|-----|------------|
| `#8b5cf6` / `#7c3aed` / `#a78bfa` / `#c4b5fd` | Tailwind violet defaults — AI generators love it, viewers tire of it |
| `#d946ef` / `#c026d3` / `#e879f9` / `#f0abfc` | Tailwind fuchsia defaults — same problem |
| `#ff00ff` + `#00ffff` combo | Vaporwave / neon-magenta slop |
| `violet + fuchsia` combo | Tailwind AI-dashboard slop |

### Recommended palette + font pairings

Pick ONE pairing per video. Don't mix.

| Pairing name | Background | Accent | Highlight | Font sans | Font mono | Use for |
|---|---|---|---|---|---|---|
| **Tech dark** (default) | `#0a0e1a` + `#050810` | `#22d3ee` (cyan-400) | `#ef4444` (red-500) | Inter / Be Vietnam Pro | JetBrains Mono | tech / repo tour / explainer |
| **Editorial cream** | `#F5F2EF` (warm white) | `#D8000F` (poster red) | `#1a1a1a` (ink) | Shrikhand + Libre Baskerville | Fira Mono | 1970s poster / opinion piece |
| **Cinematic deep teal** | `#0F2027` → `#1A2942` gradient | `#4FD1C5` (mint) | `#F687B3` (rose) | Fraunces + Inter | Cascadia Code | narrative / story / fable |
| **Mono editorial** | `#FAFAFA` | `#000000` (mono) | `#FF6B35` (signal orange) | DM Sans + Fira Code | DM Mono | code-heavy / dev tool |

### 7-point slop test (run mentally before submitting a scene)

1. **Palette borrowed from a real design language?** (Editorial / cinematic / brutalist / Swiss) → safe. Generic gradient teal-to-purple? → slop.
2. **Font weight + size has hierarchy?** (≥3 distinct levels) → safe. All same weight body text? → slop.
3. **Layout has a reason?** (matches narration content) → safe. 3 floating cards because cards look modern? → slop.
4. **Negative space deliberate?** (focal point clear) → safe. Filled to fill? → slop.
5. **Decorative elements earn screen time?** (parallax, glow that means something) → safe. Random gradient blobs everywhere? → slop.
6. **Typography respects ink traps?** (no all-caps stretched, no display font at 14px) → safe.
7. **Does it look like every other AI video?** Open YouTube Shorts, scroll 10 AI-promo videos. If yours blends in → slop. If it stands out for ANY reason (palette, type, layout, motion) → keep.

## Motion guidance (HARD)

Default render is Playwright video recording — animations actually play. To avoid the "static screenshot" feel:

- **Sustained background motion:** `.bg-glow` drifts over 14s (covers any scene length); always include it
- **Staggered reveals:** hero (0-800ms) → support details (800-2000ms) → caption (2000ms+)
- **No 200ms-and-done** animations on the primary element — extend duration or chain follow-up beats
- **Animation duration should be 60-80% of scene duration** for the hero element (e.g., 5s scene → 3-4s of motion)
