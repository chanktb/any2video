# Template audit checklist (any2video v5+)

Run through this BEFORE adding a new template under `templates/scenes/<frame-xxx>/` OR after editing an existing one. Each item maps to a HARD rule in `SKILL.md` § "Typography rules". A violation = Gate 3 block.

## Quick grep audit

From `skill/templates/scenes/`, run:

```
# violations to find
font-style:\s*italic                            # rule 1a — no italic
transform:[^;]*rotate\(\s*-?[1-9]               # rule 1b — no text rotate (decorative SVGs OK)
line-height:\s*0\.                              # rule 3 — line-height < 1.0 on display type
line-height:\s*1\.[01][^0-9]                    # rule 2 — line-height < 1.22 on multi-line VN text
left:\s*[0-9]\dpx[^0-9]                         # rule 5 — content padding < 96 (decorative-only may be smaller)
right:\s*[0-9]\dpx[^0-9]
padding:[^;]*\b[0-8]\dpx\b                      # rule 5 — root padding < 96
position:\s*absolute;[^}]*top:\s*[0-9]+px;\s*right:\s*[0-9]+px[^}]*}  # rule 7 — badge INSIDE card
```

## The 8-point checklist

For each portrait.html composition, confirm:

### 1. No nghiêng (italic + rotation) on text
- [ ] No `font-style: italic`, no `<i>`, no `<em>` anywhere
- [ ] No `transform: rotate(<deg>)` on text elements (including end-state `@keyframes to { … rotate(2deg) }`)
- [ ] Allowed: rotation on SVG decoration (corner ticks), vertical side-labels rotated ±90°

### 2. VN line-height minimums
- [ ] Multi-line text (headlines wrapping, lists, paragraphs): **`line-height ≥ 1.22`**
- [ ] Body / standfirst / desc: **`line-height ≥ 1.4`**
- [ ] Single-line display glyphs (font-size ≥ 200px, autofit nowrap): `line-height ≥ 1.0`

### 3. Glyph overflow compensation
- [ ] For any text with `line-height < 1.0` AND `font-size ≥ 200px`: confirm glyph top stays below y=285 (4:5 top cut). Formula: visual top = `top` − `font-size × (0.78 − line-height) / 2`. If at risk, set `line-height: 1.0` instead.

### 4. Assembled multi-span headlines (concatenated by JS)
- [ ] Each gradient label span has `display: inline-block; white-space: nowrap;`
- [ ] JS trims leading/trailing whitespace on inputs before concatenation
- [ ] Empty `pre` / `post` doesn't leave dangling space (test with empty string)

### 5. Safe-zone padding
- [ ] Body content (text containers) at `left/right ≥ 96px`, `top/bottom ≥ 60px`
- [ ] Decorative-only elements (rules, corner ticks, brand chips, side labels) MAY sit at 40-80px from edge
- [ ] BUT decoratives must NOT straddle y=285 or y=1635 (the 4:5 feed-crop cuts)

### 6. Item-style diversity hook (only if template renders a repeating list)
- [ ] Supports an input flag (`numberStyle`, `accent_palette`, etc.) to visually distinguish the SECOND occurrence of the same template in one video
- [ ] When numberStyle:circle is on, the left color-stripe (`.item::before`) is suppressed (else it competes with the circle marker)

### 7. Decorative badges (WIN/NEW/sale) never overlap autofit text
- [ ] If template has an autofit display-size label inside a card, badges MUST be OUTSIDE the card box (`top: -22px` ribbon)
- [ ] Badge has `z-index ≥ 3` + 3px outline `box-shadow: 0 0 0 3px <canvas-bg-color>` so it pops above the dark scene

### 8. Hyperframes binding rewrite
- [ ] Template uses standard `var v = (window.__hyperframes && …) ? … : {};` pattern so `template_render.py` can rewrite to inline JSON
- [ ] `data-composition-variables` attribute exists for defaults
- [ ] Slot names match what `CATALOG.md` documents (read the source, don't guess)

### 9. Strip lifted-template author signatures
- [ ] Scan for decorative Unicode glyphs the upstream designer added as flourish: ◇ ◆ ✦ ★ ※ ✕ — these look like font errors / mystery icons to viewers who didn't see the original
- [ ] Common offender slots: `.whisper`, `.mark`, `.glyph`, `.flourish` — remove the markup AND the CSS
- [ ] Keep only decorations that match the video's brand (channel name, owner avatar, repo logo) — anything that's "just the template designer being clever" goes
- [ ] If unsure: viewers don't know the template lineage, so any glyph without a clear meaning gets cut

### 10. Autofit must wait for `document.fonts.ready`
- [ ] If the template has any JS that measures `scrollWidth` / `offsetWidth` to shrink display-size text (font-size ≥ 60px), the measurement MUST be deferred until Google Fonts have loaded
- [ ] Pattern: `if (document.fonts && document.fonts.ready) document.fonts.ready.then(doFit); else setTimeout(doFit, 400);`
- [ ] Grep signal: `scrollWidth > (offsetWidth|avail)` running synchronously at script-exec time = bug (sync measurement uses fallback system-ui font ~15% narrower → shrink undersized → overflow when real font loads)
- [ ] Also: NEVER reset `white-space: nowrap` back to default at end of autofit — shrunk-font text can still wrap if given the chance

### 11. Move elements as a GROUP — connector lines must follow their chips
- [ ] If the template has SVG `<line>` / `<path>` connectors linking elements (chips to a hub, badges to labels, arrows between cards), and you move any endpoint element, you MUST update the corresponding `x1/y1/x2/y2` (or path `d`) to match new coordinates
- [ ] Grep signal: after any `top:` / `bottom:` / `left:` / `right:` edit on a positioned element, `grep -n "line\\|path\\|x1\\|y1\\|x2\\|y2\\|M[0-9]"` the same file — if there are SVG connectors, they need matching updates
- [ ] Common offender: hub-spoke `.chip.tl/.tr/.bl/.br` positioned via CSS `top/bottom`, connected via SVG `<line x1 y1 x2 y2>` in the markup. Editing the CSS chip position without editing the SVG endpoint = line dangles past chip
- [ ] Rule: **template edits are group edits**. If you touch position of an anchor element, do a full-file sweep for any decoration/connector that references its old coordinates, defeating the whole shrink

## After audit

If you edited a template, also update:
- `CATALOG.md` slot reference table if slot names / shapes changed
- `SKILL.md` § "Typography rules" if a new HARD rule emerged
- Re-render any `workspace/runs/<slug>/` that uses this template (Phase 4 → Phase 5)

## Per-template current status

| Template | Italic | Rotate | LH | Padding | Diversity | Badge | Bind | Notes |
|---|---|---|---|---|---|---|---|---|
| frame-bold-poster | ✓ | ✓ | ✓ | ✓ | n/a | n/a | ✓ | Figure left + tight LH 1.0 |
| frame-build-minimal | ✓ | ✓ | ✓ | ✓ | n/a | n/a | ✓ | Autofit nowrap fix |
| frame-aicoding-comparison | ✓ | ✓ | ✓ | ✓ | n/a | ✓ | ✓ | WIN ribbon ext top:-22 |
| frame-aicoding-list | ✓ | ✓ | ✓ | ✓ | ✓ | n/a | ✓ | numberStyle:circle supported |
| frame-statement-outro | ✓ | ✓ | ✓ | ✓ | n/a | n/a | ✓ | Channel rotate removed |
| frame-vignelli | ✓ | ✓ | ✓ | ✓ | n/a | n/a | ⚠ | Reveal animation timing — empty content risk |
| frame-liquid-bg-hero | ✓ | ✓ | ✓ | ✓ | n/a | n/a | ⚠ | NEEDS HF CLI for SVG animations |
| frame-pentagram-stat | ✓ | ✓ | ✓ | ✓ | n/a | n/a | ⚠ | NEEDS HF CLI for SVG animations |
