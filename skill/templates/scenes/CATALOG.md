# Scene template catalog (any2video v5+)

8 named templates lifted from [ai-auto-generate-video](https://github.com/huytranvan2010/AI-auto-generate-video) (MIT, © 2026 AI Coding — see each template's `NOTICE.md` for full attribution).

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
| **outro** | `frame-statement-outro` | Paper-card closing with red CTA + giant channel name |

## Slot reference per template

### frame-liquid-bg-hero (intro)
- `kicker` — small uppercase label (≤24 chars)
- `headline` — main brand/title (≤24 chars)
- `subheadline` — tagline (≤80 chars)
- `cta` — call-to-action pill text (≤40 chars)
- `brand` — channel handle (≤24 chars)

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

### frame-statement-outro (outro)
- `cta` ≤60 (uppercase call-to-action)
- `channel` ≤24 (channel name, giant red)
- `source` ≤40 (e.g. "Nguồn: <domain>" or "github.com/owner/repo")

## How any2video Phase 4 uses these

Phase 4 generates `plan.md` scenes with `templateId` + `inputs` instead of writing free-form HTML:

```yaml
scenes:
  - id: 1
    beat: intro
    duration_sec: 4
    narration: "Hôm nay xem nhanh repo này..."
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

## Attribution (MIT)

All 8 templates: © 2026 AI Coding (Huy Tran VN). MIT License. Original repo: <https://github.com/huytranvan2010/AI-auto-generate-video>. Each template directory has full `NOTICE.md` preserving sub-attribution chains (e.g. frontend-slides © Zara Zhang, huashu-design © alchaincyf).
