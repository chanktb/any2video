# Scene template catalog (any2video v5+)

Named 9:16 scene templates, each self-contained. Provenance lives in every template's own `NOTICE.md` (source of truth): the two `frame-aicoding-*` are original (© 2026 AI Coding, MIT); the rest are adapted from open-source template designs under Apache-2.0 / MIT.

Each template is a self-contained 9:16 (1080×1920) HTML file at `<templateId>/compositions/portrait.html`. Variables are injected at load time via `data-composition-variables` JSON attribute → inline JS binds to DOM selectors.

## Opening arc for a GitHub tour (HARD — SKILL §2.2.5, plan_critic enforces)

The first seconds decide retention, so the opening is fixed (PA1): **open on the biggest pain, NOT a title card.**

1. **pain hero** — `frame-pain-hero`, the viewer's BIGGEST pain, full-bleed + top-anchored. Carries a subtle github context chip (owner avatar + GitHub mark + `owner/repo`). This IS the hook.
2. **pain blocks** — more `frame-pain-hero` scenes, one felt pain each, highlight-as-spoken. Rows 1–2 total **4–6 pains**, all `frame-pain-hero` so each carries the chip.
3. **reveal / overview** — `frame-repo-identity`, the pivot ("…thì repo này giúp bạn"): avatar + `owner/repo` + tagline. **Conditional:** popular repo → stars/forks/language row; new repo → a quiet "mới ra mắt" tag (omit stars). Sits DIRECTLY before the scroll.
4. **repo-scroll pivot** — cut to a **full-bleed** repo-scroll scene: `capture_url: https://github.com/<owner>/<repo>`. Full-width, no safe-zone (real footage); the caption rides the dark bottom band automatically. Its `duration_sec` = the narration length so the scroll finishes as the scene ends.
5. **problem → …** — now go into detail with the card templates below.
6. **author outro** — author-profile scroll (see outro row).
7. **promo** — `frame-made-with` (default ON, always the FINAL scene).

## Pick by beat (Phase 2 plan.md)

| Beat | Recommended templateIds | Why |
|------|--------------------------|-----|
| **pain hero / pain block** | `frame-pain-hero` | Biggest pain full-bleed + github context chip — scene 1 AND every pain block (4-6 total) |
| **reveal / overview** | `frame-repo-identity` | Avatar + `owner/repo` + tagline + CONDITIONAL stars/forks (popular) or "mới ra mắt" tag (new) — the pivot, directly before the scroll |
| **repo scroll** | *full-bleed footage — NO template* | Real full-width scroll of `https://github.com/<owner>/<repo>` (`capture_url`) |
| **problem** | `frame-vignelli` | Swiss-grid dark canvas + one stark stat — names the pain in 1 number |
| **solution** | `frame-aicoding-list` | Bullet list with gold #N markers — pipeline steps |
| **details** | `frame-aicoding-comparison` | Head-to-head 2-card layout — before/after, vs alternative |
| **review** | `frame-pentagram-stat` OR `frame-build-minimal` | One hero stat with glow, OR one-word bold statement |
| **outro** | *author-profile footage — NO template* | Close on a real scroll of `https://github.com/<owner>` (author profile, bio, other repos) via `capture_url`. Narration ends with a star nudge (see below). The old `frame-statement-outro` white-card / red-text closing is **BANNED** (SKILL §2.2.7). |
| **promo** | `frame-made-with` | "Made with any2video" bumper — FINAL scene, default ON |

> `frame-liquid-bg-hero` (headline-first hero) still ships for non-repo intros / raw-text videos, but a GitHub tour opens on `frame-pain-hero`.

## Visual / data-viz library (v6 — charts · graphs · diagrams, all VERIFIED ✓)

A mix-and-match set of **visual-first** templates so a body scene can be a real chart/diagram instead of another text card. Each is pure inline SVG/CSS (no external image → never a `broken_image`), top-anchored, VN-diacritic-safe, and **ships its own distinct palette** so mixing 3-4 of them in one video already looks varied. Numbers count up; bars/arcs/lines animate in. Slots are documented in each template's `meta.json`.

| templateId | What it shows | Good for | Palette |
|---|---|---|---|
| `frame-bar-chart` | vertical bar chart, one bar highlighted | comparison / "X vs the rest" | cyan→blue |
| `frame-metric-bars` | horizontal progress bars (label · fill · %) | scores / feature readiness | amber→orange |
| `frame-donut-stat` | one big % ring, number in the centre | a single headline percentage | emerald→teal |
| `frame-gauge` | semicircle gauge arc 0→value | a score / level with min-max | amber→red |
| `frame-line-chart` | animated trend line + area + peak callout | growth / trend over time | purple→indigo |
| `frame-stat-grid` | 2×2 stat cards, per-card accent bar | "by the numbers" (2-4 stats) | sky (multi-accent) |
| `frame-feature-grid` | 2×2 cards each with an inline-SVG icon | 3-4 capabilities with icons | teal→green |
| `frame-flow-steps` | vertical numbered pipeline + spine | ordered steps / a process | rose→red |
| `frame-timeline` | vertical roadmap: period pill + entry | milestones / phases / history | indigo→violet |
| `frame-quote-callout` | big pull-quote + inline accent + attribution | a philosophy / thesis line | gold |

- Pass `hl: true` on the item/step/entry you want highlighted (bar-chart, metric-bars, flow-steps, timeline).
- `frame-feature-grid` icon keys: `bolt lock sync search chart code cloud layers database link globe cpu check doc rocket` (unknown key → a filled dot).
- `meta.accent` recolours each template's **title accent phrase** video-wide; the chart/number colours stay the template's palette (that's what keeps a multi-template video colourful, not monotone).
- **Reserved class names (HARD):** never name a visible element `.caption`/`.caption-overlay` — the karaoke system force-hides them. And don't put a positioning `transform: translate(...)` on an element that also runs a `transform` animation (the animation wins and un-centres it) — clamp a fixed-width box's `left` instead.

## Ambient themes (`meta.theme` — drifting background motion)

Set `meta.theme` to layer a subtle, always-moving background behind ALL content (adds "chất công nghệ"; pointer-events off, transparent, gated by z-index so any template stays on top). Mix per topic for variety:

| theme | Look |
|---|---|
| `aurora` (default) | the template's own liquid blobs (adds nothing extra) |
| `particles` | two parallax fields of drifting dots |
| `grid` | a faint drifting technical grid |
| `mesh` | three soft colour blobs slowly floating (living gradient) |
| `beams` | faint diagonal light streaks sweeping across |
| `rays` | a very slow rotating conic light fan from the top |
| `stars` | a field of faint stars gently twinkling |

## Respect the author's name casing (HARD)

Show `owner` and `repo` **exactly as the author wrote them** — never uppercase or title-case them. `chanktb/any2video` stays `chanktb/any2video`, not `CHANKTB / ANY2VIDEO`. The identity/promo templates render these in a non-uppercased pill on purpose; only generic labels (OPEN SOURCE, MIT) are uppercased. plan_critic verifies the casing against the source URL (`name_casing_changed`).

## Slot reference per template

### frame-pain-hero (pain opener + pain blocks — scene 1..k) — VERIFIED ✓
The BIGGEST pain, full-bleed + top-anchored, with a subtle context chip. Use for scene 1 AND every pain block. Karaoke caption is burned at compose — no caption band here. The chip has 3 modes: **repo** (pass `owner`/`repo` → octocat + avatar + `owner/repo`), **source** (pass `source_label` only → globe + domain, for article inputs), or **hidden** (pass none → no chip, for raw text). See SKILL §2.2.5.1.
- `owner` / `repo` / `sep` — repo chip handle, author's casing (never uppercased)
- `source_label` — domain/publication for a non-repo article (e.g. `vnexpress.net`); shown with a globe when no owner/repo
- `avatar_url` — owner photo for the chip (e.g. `https://github.com/<owner>.png`); omit → chip avatar hidden
- `pain_no` — pain index label, top-right (e.g. "NỖI ĐAU 01")
- `eyebrow` — small uppercase line above the hero (e.g. "Nếu bạn làm content dạy ngoại ngữ")
- `hero` — array of white headline lines (e.g. `["Ngày nào cũng", "phải ra"]`); a string also works
- `hero_accent` — the punchline on its own line, gradient (themed by `meta.accent`); omit → no accent line
- `sub` — one-line elaboration of the pain (≤2 lines); omit → hidden

### frame-repo-identity (reveal / overview — the pivot, directly before the scroll) — VERIFIED ✓
Circular owner avatar (spinning gradient ring) + GitHub mark + `owner/repo` handle + tagline, then ONE conditional social-proof row. Owner + repo shown EXACTLY as the author wrote them (never uppercased). Top-anchored; no caption band (karaoke burned at compose).
- `owner` / `repo` / `sep` — handle, author's casing
- `avatar_url` — owner photo (e.g. `https://github.com/<owner>.png`); omit → a neutral gradient face shows (no broken image)
- `eyebrow` — the pivot line, top-center (e.g. "Thì repo này giúp bạn"); `kicker` is accepted as a fallback
- `tagline` — one-line repo description; omit → hidden
- **Conditional overview** — pass EITHER (popular repo) or the tag (new repo):
  - `stars` / `forks` / `language` — social-proof pills (any subset; e.g. `stars: "9.2k"`, `forks: "640"`, `language: "TypeScript"`)
  - `new_tag` — a quiet "mới ra mắt" pill for a new/low-star repo (shown only when no stars/forks/language passed)

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

### frame-media-full (USER media — image OR video, full-width) — VERIFIED ✓
A user-provided image or video shown FULL-WIDTH (spans the full 1080px, edge-to-edge, NO safe-zone margins, NO frame). `object-fit: contain` so the WHOLE asset is visible — a 9:16 clip fills the frame exactly, a portrait screenshot fills the width with slim dark bands (carrying the theme dots) top/bottom, never cropping. A **video autoplays muted + loops** (Playwright records it playing). Top/bottom scrims keep the eyebrow + burned karaoke from blending into the media. Good for a screenshot, b-roll, screen-recording, or a demo OUTPUT clip. Use for BOTH image and video — full-width, no framed card.
- `media` — image/video: an `https://` URL or an absolute `file:///…` path (drop assets in `runs/<slug>/assets/`). `.mp4/.webm/.mov` → video; else image. `media_type: video` forces video.
- `eyebrow` — top-left label over a red dot (e.g. "OUTPUT THẬT · LINGORA", "CHỌN NGAY TRÊN WEB"); omit → hidden
- No caption/label slot on purpose — the eyebrow labels the media and the burned karaoke narrates.

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
    beat: hook
    duration_sec: 6                      # pain hero — open on the BIGGEST pain, no title card
    narration: "Nếu bạn hay phải <biggest pain-task>, chắc bạn quen cảnh <felt friction>."
    templateId: frame-pain-hero
    inputs:
      owner: "chanktb"                   # author's casing, never uppercased (chip)
      repo: "any2video"
      avatar_url: "https://github.com/chanktb.png"
      pain_no: "NỖI ĐAU 01"
      eyebrow: "Nếu bạn <audience>"
      hero: ["<pain line 1>", "<pain line 2>"]
      hero_accent: "<punchline>"
      sub: "<one-line elaboration of the pain>"
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
