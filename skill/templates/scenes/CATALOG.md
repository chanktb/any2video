# Scene template catalog (any2video v5+)

Named 9:16 scene templates, each self-contained. Provenance lives in every template's own `NOTICE.md` (source of truth): the two `frame-aicoding-*` are original (© 2026 AI Coding, MIT); the rest are adapted from open-source template designs under Apache-2.0 / MIT.

Each template is a self-contained 9:16 (1080×1920) HTML file at `<templateId>/compositions/portrait.html`. Variables are injected at load time via `data-composition-variables` JSON attribute → inline JS binds to DOM selectors.

## Opening arc for a GitHub tour (HARD — SKILL §2.2.5, plan_critic enforces)

The first 2 seconds decide retention, so the opening is fixed:

1. **intro** — `frame-repo-identity`, **≤ 2s**. Circular owner avatar + GitHub mark + `owner/repo`. That's it — the viewer learns whose repo this is, then move on.
2. **pain blocks** — **4–6** short scenes, one felt pain each, highlight-as-spoken. Any card template works (`frame-vignelli`, `frame-bold-poster`, `frame-aicoding-list`…). This is what makes the opening dynamic.
3. **repo-scroll pivot** — the instant the narration turns to the repo ("…thì repo này giúp bạn"), cut to a **full-bleed** repo-scroll scene: `capture_url: https://github.com/<owner>/<repo>`. Full-width, no safe-zone (real footage); the caption rides the dark bottom band automatically. Its `duration_sec` = the intro narration length so the scroll finishes as the scene ends.
4. **problem → …** — now go into detail with the card templates below.
5. **author outro** — author-profile scroll (see outro row).
6. **promo** — `frame-made-with` (default ON, always the FINAL scene).

## Pick by beat (Phase 2 plan.md)

| Beat | Recommended templateIds | Why |
|------|--------------------------|-----|
| **intro** | `frame-repo-identity` | Circular owner avatar + GitHub mark + `owner/repo` — ≤2s, says whose repo |
| **pain block** | `frame-vignelli` / `frame-bold-poster` / `frame-aicoding-list` | One felt pain, highlighted as spoken — 4-6 of them |
| **repo scroll** | *full-bleed footage — NO template* | Real full-width scroll of `https://github.com/<owner>/<repo>` (`capture_url`) |
| **problem** | `frame-vignelli` | Swiss-grid dark canvas + one stark stat — names the pain in 1 number |
| **solution** | `frame-aicoding-list` | Bullet list with gold #N markers — pipeline steps |
| **details** | `frame-aicoding-comparison` | Head-to-head 2-card layout — before/after, vs alternative |
| **review** | `frame-pentagram-stat` OR `frame-build-minimal` | One hero stat with glow, OR one-word bold statement |
| **outro** | *author-profile footage — NO template* | Close on a real scroll of `https://github.com/<owner>` (author profile, bio, other repos) via `capture_url`. Narration ends with a star nudge (see below). The old `frame-statement-outro` white-card / red-text closing is **BANNED** (SKILL §2.2.7). |
| **promo** | `frame-made-with` | "Made with any2video" bumper — FINAL scene, default ON |

> `frame-liquid-bg-hero` (headline-first hero) still ships for non-repo intros / raw-text videos, but a GitHub tour opens on `frame-repo-identity`.

## Respect the author's name casing (HARD)

Show `owner` and `repo` **exactly as the author wrote them** — never uppercase or title-case them. `chanktb/any2video` stays `chanktb/any2video`, not `CHANKTB / ANY2VIDEO`. The identity/promo templates render these in a non-uppercased pill on purpose; only generic labels (OPEN SOURCE, MIT) are uppercased. plan_critic verifies the casing against the source URL (`name_casing_changed`).

## Slot reference per template

### frame-repo-identity (intro — GitHub tour, ≤2s) — VERIFIED ✓
Circular owner avatar (spinning gradient ring) + GitHub mark + `owner/repo` handle. Owner + repo are shown EXACTLY as the author wrote them (never uppercased).
- `owner` — GitHub username, author's casing (e.g. `chanktb`)
- `repo` — repo name, author's casing (e.g. `any2video`)
- `sep` — separator between owner and repo (default `/`; `:` also works)
- `avatar_url` — owner photo (e.g. `https://github.com/<owner>.png`); omit → a neutral gradient face shows (no broken image)
- `tagline` — one-line repo description (≤80 chars); omit → hidden
- `kicker` — top-left label (default "REPO TOUR"); `category` — bottom-left label (e.g. "OPEN SOURCE")

### frame-made-with (promo bumper — FINAL scene, default ON) — VERIFIED ✓
"Video này được tạo bởi **any2video**" — credits the tool, optionally the author. Author name is NEVER hardcoded: it comes from the operator's config (`ANY2VIDEO_PROMO_AUTHOR`) and is empty by default → the author pill hides and only the tool credit shows. cli surfaces the resolved values in `source_pack.json` → `promo_config`.
- `tool` — tool wordmark, casing preserved (default "any2video")
- `tagline` — one-line tool description
- `author` — author display name (from config; empty → author pill hidden)
- `author_label` — small label above the name (default "Tác giả"); `author_avatar` — author photo
- `url` — repo/site shown in the bottom pill (the tail after the last `/` is accented)
- `kicker` (default "Video này được tạo bởi"), `category`, `license`

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
- id: <second-to-last, before promo>
  beat: outro
  capture_url: https://github.com/<owner>   # profile root, NO /repo → author scroll
  footage_label: github.com/<owner>
  narration: "<pain-CTA per SKILL 2.2.7> … nếu thấy hay thì tặng tác giả một sao làm động lực nhé."
  duration_sec: 6
```
The author-profile narration MUST end with a **star nudge** (`…tặng tác giả một sao làm động lực nhé`) — plan_critic checks for it (`outro_missing_star_line`). plan_critic also FAILs if the closing content scene of a repo tour isn't author-profile footage. When the promo bumper is on, the author-profile scene is second-to-last and `frame-made-with` is the final scene.

## How any2video Phase 4 uses these

Phase 4 generates `plan.md` scenes with `templateId` + `inputs` instead of writing free-form HTML:

```yaml
scenes:
  - id: 1
    beat: intro
    duration_sec: 2                      # ≤2s — identity flash only
    narration: "Đây là repo của <owner>."   # short or empty; the pain blocks carry the hook
    templateId: frame-repo-identity
    inputs:
      owner: "chanktb"                   # author's casing, never uppercased
      repo: "any2video"
      avatar_url: "https://github.com/chanktb.png"
      tagline: "Biến một repo thành video dọc có lồng tiếng."
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
- `frame-repo-identity`, `frame-made-with` — original layouts, MIT; they reuse the Aurora-Violet liquid background from `frame-liquid-bg-hero` (Apache-2.0 lineage) + inline GitHub mark (nominative use).
- `frame-bold-poster`, `frame-build-minimal`, `frame-liquid-bg-hero`, `frame-pentagram-stat`, `frame-vignelli` — Apache-2.0, with upstream design lineage credited in each NOTICE (e.g. "Bold Poster" © Zara Zhang; "Build"/"Pentagram" © alchaincyf).
