# plan.md — Phase 2 output contract

YAML frontmatter, no body. Phase 3 (TTS), Phase 4 (visual), Phase 5 (compose) all read this.

```yaml
meta:
  slug: <slug>
  source_type: github_repo | article | image | text
  source: <url or path or hash>
  lang: vi                       # narration language: vi (default) or en
  total_duration_sec: 60         # working estimate, refined after TTS measurement
  target_duration_sec: 60        # OPTIONAL — set only when the user requested a length
                                 # (or via `init --duration`). HARD: measured total must
                                 # land within ±10s of this. See SKILL §2.2.6 b.2.
  voice: vi-VN-Chirp3-HD-Charon  # DEFAULT: MALE + Google TTS. Female only if the user asks.
  voice_provider: google         # DEFAULT google (Chirp 3 HD); auto-falls back to edge-tts MALE (NamMinh/Guy)
  theme_hint: "dark, technical, monospace accents"
  aspect: "9:16"                 # quote ALWAYS — PyYAML reads 9:16 as sexagesimal int 556 if unquoted

  # Persistent brand bar — renders in every scene's .brand-header
  brand:
    name: "<owner> / <repo>"             # repo or channel name
    avatar_url: "https://github.com/<owner>.png?size=120"
    tagline: "REPO TOUR"                # uppercase short label

  # Persistent footer strip — renders in every scene's .brand-footer
  # Format: list of "label" strings, joined by mid-dots in HTML
  footer:
    - "★ 9,148"
    - "⑂ 642 forks"
    - "⌥ 720 commits"
    - "v0.4.4"
    - "MIT"

scenes:
  - id: 1
    role: hook                   # hook | problem | solution | architecture | flow | demo | cta
    duration_sec: 4              # estimate; Phase 3 overwrites with measured TTS duration
    narration: "Một dòng lệnh. Một video. Không tốn xu nào."   # lang vi → Vietnamese narration
    visual_brief: |
      Inside .inner: centered hero "$0" in monospace 360px, teal --accent.
      Hero scales 0.92→1 + opacity 0→1 over 800ms (sustained, not 200ms snap).
      Caption overlay: "Một dòng lệnh." line 1, "Một <span class='kw'>video</span>. <span class='kw'>Không tốn xu nào</span>." line 2 — fades in at 1800ms.
      .bg-glow drifts in background throughout.
    caption_html: "Một dòng lệnh.<br>Một <span class='kw'>video</span>. <span class='kw'>Không tốn xu nào</span>."
    data_props:
      hook: "$0"

  - id: 2
    role: problem
    duration_sec: 8
    narration: "..."
    visual_brief: |
      Split screen. Left: a "before" terminal showing 5 lines of cryptic logs.
      Right: a frustrated dev avatar (use lucide-react user-x icon, scale 8x).
      Both fade together; caption "Logs say nothing. Devs guess."
    data_props:
      pain_points:
        - "Logs without context"
        - "Stack traces without root cause"
```

## Field rules

| Field | Type | Constraint |
|---|---|---|
| `slug` | string | kebab-case, ≤ 40 chars |
| `total_duration_sec` | int | 45 ≤ n ≤ 90 for 9:16; up to 180 for 16:9 |
| `voice` | string | valid edge-tts voice (or configured provider) |
| `aspect` | enum | 9:16 default |
| `role` | enum | one of the listed values |
| `duration_sec` | int | 2 ≤ n ≤ 12 per scene |
| `narration` | string | what TTS reads aloud; no SSML tags here, post-process if needed |
| `visual_brief` | string | Claude's own design — must be distinct from sibling scenes |
| `data_props` | object | every key cited in analysis.md Evidence; no invention |

## Critic gate 2 (Sonnet) checks

1. Sum of `duration_sec` ≈ `total_duration_sec` (±10%). If `target_duration_sec` is set, the measured total (scenes + gaps + poster) MUST be within **±10 seconds** of it — absolute, not percentage (SKILL §2.2.6 b.2).
2. Hook scene id 1, role=hook, duration_sec ≤ 4
3. Every `data_props` value appears (verbatim or numerically) in analysis.md Evidence
4. No two `visual_brief` fields share 5+ consecutive identical words (cheap "template repetition" check)
5. Final scene role is `cta` OR the narration ends with a clear close

Fail any → regenerate ONLY the failing scene, keep the rest.
