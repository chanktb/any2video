# Scene template catalog (any2video v5+)

Named 9:16 scene templates, each self-contained. Provenance lives in every template's own `NOTICE.md` (source of truth): the two `frame-aicoding-*` are original (© 2026 AI Coding, MIT); the rest are adapted from open-source template designs under Apache-2.0 / MIT.

Each template is a self-contained 9:16 (1080×1920) HTML file at `<templateId>/compositions/portrait.html`. Variables are injected at load time via `data-composition-variables` JSON attribute → inline JS binds to DOM selectors.

## Pick by 7-beat (Phase 2 plan.md)

| Beat | Recommended templateIds | Why |
|------|--------------------------|-----|
| **intro** | `frame-liquid-bg-hero` | Aurora blob + brand reveal — opens with confidence |
| **hook** | `frame-bold-poster` | 1970s editorial poster — single big number + 3-line tilted headline |
| **problem** | `frame-vignelli` | Swiss-grid dark canvas + one stark stat — names the pain in 1 number |
| **solution** | `frame-aicoding-list` | Bullet list with gold #N markers — pipeline steps |
| **details** | `frame-aicoding-comparison` | Head-to-head 2-card layout — before/after, vs alternative |
| **review** | `frame-pentagram-stat` OR `frame-build-minimal` | One hero stat with glow, OR one-word bold statement |
| **outro** | *author-profile footage — NO template* | Close on a real scroll of `https://github.com/<owner>` (author profile, bio, other repos) via the last scene's `capture_url`. The old `frame-statement-outro` white-card / red-text closing is **BANNED** (SKILL §2.2.7, plan_critic enforces). |

## Slot reference per template

### frame-liquid-bg-hero (intro)
Branding is 100% input-driven — NO hardcoded channel identity. Anything you don't pass is hidden (no stray default shows).
- `kicker` — small uppercase label, top-left (e.g. "REPO TOUR", "MÃ NGUỒN MỞ")
- `headline` — main brand/title, e.g. the repo name (≤24 chars)
- `subheadline` — one-line description (≤80 chars)
- `cta` — call-to-action pill text (≤40 chars)
- `brand` — owner handle shown bottom-left (e.g. "chanktb")
- `role` — gradient label next to the avatar (e.g. owner name / "chanktb"); omit → hidden
- `channel_label` — bottom category label (e.g. "MIT", "OPEN SOURCE"); omit → hidden
- `avatar_url` (or `logo`) — the avatar/logo image URL (e.g. `https://github.com/<owner>.png?size=128`); omit → the image is hidden. A URL that fails to load is caught by the gate (`broken_image`).

### frame-bold-poster (hook)
- `kicker` ≤24 (top-left label)
- `date` ≤24 (top-right metadata)
- `figure` ≤4 (giant gradient number — e.g. "5.5", "200")
- `headline` array, ≤3 lines × ≤14 chars (line 2 auto-accent color)
- `standfirst` ≤160 (italic serif sub-line)
- `footer_left` ≤32, `footer_right` ≤32

### frame-vignelli (problem/single-stat)
- `kicker` ≤30 (red-bar label)
- `number` ≤6 (giant white stat — e.g. "62%", "3/4", "1M")
- `label` ≤40 (uppercase white label, ≤2 lines)

### frame-aicoding-list (solution/list) — VERIFIED ✓
- `title` ≤60 (main heading)
- `accent` ≤24 (highlighted word inside title — gets gradient)
- `accent_from` / `accent_to` (optional, hex colors for gradient)
- `subtitle` ≤90 (1 line under title)
- `items[]` — 2 to 5 items, each: `{ icon: "🤖", title: "Gemini", desc: "viết kịch bản" }`
- (Slot names are `title/accent/subtitle/items` — NOT `headline/bullets`)

### frame-aicoding-comparison (details/vs)
- `badge` ≤20 (top label, e.g. "BEFORE vs AFTER")
- `pre` / `vs` / `post` — string headers
- `left` / `right` — objects each with: `name`, `value`, `desc`, `gradient` (CSS gradient string)

### frame-pentagram-stat (review/stat-hero)
- `label` ≤40 (cyan eyebrow)
- `headline` ≤12 (giant glowing amber stat)
- `subtitle` ≤120 (one supporting sentence)
- `anchor` ≤4 (faint giant number behind, usually = headline digits)
- `footer_left` ≤32, `footer_right` ≤32

### frame-build-minimal (review/statement)
- `eyebrow` ≤20 (small uppercase)
- `hero` ≤10 (ONE short word — revealed char-by-char)
- `desc` ≤90 (supporting sentence)
- `side_left` ≤20, `side_right` ≤20 (rotated edge labels)

### frame-statement-outro — ⛔ DEPRECATED / BANNED as outro
White paper-card + giant red channel name. Rejected as a closing (reads like a cheap
text card). **Do not use it.** Close instead on author-profile scroll footage:
```yaml
- id: <last>
  beat: outro
  capture_url: https://github.com/<owner>   # profile root, NO /repo → author scroll
  footage_label: github.com/<owner>
  narration: "<pain-CTA per SKILL 2.2.7 — no URL spelled out>"
  duration_sec: 5
```
plan_critic will FAIL the plan if the last scene of a repo tour isn't author-profile footage.

## How any2video Phase 4 uses these

Phase 4 generates `plan.md` scenes with `templateId` + `inputs` instead of writing free-form HTML:

```yaml
scenes:
  - id: 1
    beat: intro
    duration_sec: 4
    narration: "Nếu bạn hay phải làm video giới thiệu repo mà lười ngồi edit, thì xem cái này..."
    templateId: frame-liquid-bg-hero
    inputs:
      kicker: "REPO TOUR"
      headline: "REPO NAME"
      subheadline: "AI video editor chạy ngay trên máy bạn"
      cta: "github.com/<owner>/<repo>"
      brand: "<owner> / <repo>"
```

`lib/render/template_render.py` then:
1. Reads `templates/scenes/<templateId>/compositions/portrait.html`
2. Replaces the `data-composition-variables='{...}'` with the scene's `inputs` JSON
3. Writes scratch HTML to `workspace/runs/<slug>/scenes/<id>.html`
4. `playwright_render` picks it up + records

## Anti-rule

**Do NOT** mix beats with template purposes. Don't use `frame-statement-outro` as a hook scene — the layout assumes closing card semantics. Don't use `frame-bold-poster` as outro — too aggressive for a closing.

**Do NOT** invent new slot names — templates have inline JS that maps fixed selectors. Add slots only by editing the template's `<script>` block.

## Attribution

Per-template licenses live in each `<templateId>/NOTICE.md` — the source of truth. Keep those files intact when redistributing.

- `frame-aicoding-list`, `frame-aicoding-comparison` — original, © 2026 AI Coding, MIT.
- `frame-bold-poster`, `frame-build-minimal`, `frame-liquid-bg-hero`, `frame-pentagram-stat`, `frame-vignelli` — Apache-2.0, with upstream design lineage credited in each NOTICE (e.g. "Bold Poster" © Zara Zhang; "Build"/"Pentagram" © alchaincyf).
