# Reference-video teardown — what a 9/10 repo-tour Short actually does

**Source:** 3 real videos the author curated + Gemini frame-analyses + a NotebookLM
technical review, in `references/samplevideos/`. Captured
2026-07-01 after v1–v6 of a Google Ads audit-tool test video kept feeling "chưa
tới". These are the craft standards we now build to. The video is the test rig;
**this document is the deliverable** — it is how the skill stops iterating blind.

| Ref | Topic | Len | Gemini score | Signature device |
|-----|-------|-----|-------------|------------------|
| video1 | Kronos (finance foundation model) | 1:53 | 9.1 | ChatGPT-analogy hook, progressive stat cards, honest "benchmark ≠ nút mua bán" |
| video2 | Open Generative AI (200+ model app) | 1:21 | 9.3 | **Giant hero number + ghost echo**, row-reveal lists w/ right-badge |
| video3 | OmniRoute (AI gateway) | 1:40 | 9.4 | **Real repo screen-recording**, terminal RATE-LIMIT interrupt, node network |

---

## 0. The one-paragraph diagnosis of why v1–v6 felt off

Our videos were *technically clean but synthetic and silent-of-craft*. They had:
correct 7-beat structure, grounded facts, safe-zones, motion. They lacked the
four things that every reference video does and that the eye/ear reads as
"professional": (1) **word-synced karaoke captions**, (2) **a real-footage
authenticity beat**, (3) **a music+SFX bed**, (4) **copywriting that hooks a
person and then de-hypes honestly**. Beat-split reveal (v6) was the right
instinct but only one of the four. This teardown fixes all four.

---

## 1. SCRIPT / COPYWRITING — the arc all three share

All three follow the SAME spine (matches our 7-beat arc — keep it):

```
HOOK (pain or bold analogy)  →  SOCIAL PROOF / framing  →  CORE CONCEPT
   →  2–3 "weapons" (named differentiators)  →  HONEST CAVEAT (de-hype)
   →  RECOMMENDATION (who should / shouldn't)  →  CTA (contextual, no URL read)
```

### 1.1 The hook is a *sentence*, never a fragment list
- v1: "Học ngôn ngữ thị trường từ hơn 12 tỷ cây nến, Kronos đang làm điều đó với
  biểu đồ giá **như ChatGPT làm với văn bản**." — one breath, an analogy that
  translates a niche topic into a universal one.
- v2: "**Bạn đang trả tiền cho năm sáu công cụ AI** tạo ảnh và video khác nhau?
  Có một dự án mã nguồn mở gom tất cả vào một app duy nhất." — 2nd-person pain
  question, then the relief.
- v3: "Bạn đang để AI agent viết code rất mượt, **rồi bỗng dưng mọi thứ khựng
  lại vì hết rate limit**." — names the exact felt moment.
- **Rule:** hook = {who + the pain they feel today} OR {a one-line analogy}.
  Never "X. Y. Z." telegraph fragments.

### 1.2 Name real things, every scene
Competitors (Midjourney, Kling, Sora, 9router, Cursor, Cline), specific numbers
(12B K-lines, 45 exchanges, 160+ providers, 1.6–2.1B tokens, 15–95%), specific
mechanisms (RTK + Caveman compression, hierarchical tokenizer, PMax channel
burn). Concreteness = credibility. Vague = skippable.

### 1.3 "Weapons" framing for differentiators
v3 literally labels them **"Vũ khí 01 / Vũ khí 02"**. v2 walks **Image Studio →
Video Studio → Lip Sync → Cinema → Workflow** as named modules. Give each
differentiator a NAME and a NUMBER. Don't describe features in prose — enumerate
them as titled units.

### 1.4 The honest-caveat beat is a RETENTION FEATURE, not filler (HARD)
Every reference deliberately breaks its own hype to earn trust:
- v1: "**benchmark đẹp không biến model thành nút mua bán**" / "đây là số do tác
  giả công bố" / "DEMO ≠ PRODUCTION".
- v2: privacy caveat framed as a feature ("dữ liệu không gửi ra ngoài").
- v3: "**9router gọn cho coding, OmniRoute rộng cho hạ tầng**" — tells you when
  NOT to pick the subject.
- **Rule:** one scene must state a real limitation or a "who should NOT use this".
  For a Google Ads audit tool that is: *eCommerce-only — not for LeadGen / Local /
  SaaS-CPA*, and *needs ≥15 conv/week or the engine has no signal*. v6 omitted
  this. It is the most trust-building 6 seconds in the video.

### 1.5 The CTA never reads a URL (we already have this rule — keep it)
Contextual pain-CTA. Link lives in the post caption. ✓ v6 did this right.

### 1.6 What NotebookLM proved our script *under-used* (substance gap)
The review surfaced killer specifics v6 never mentioned. Mine these next time:
- **The Reseller Rule** — auto-builds `carried_brands` from real store data and
  *forbids* negativizing brands you actually sell (routes to a dedicated
  campaign instead). "hiếm công cụ nào trên thị trường có được." → a whole
  "weapon" scene.
- **Word-boundary regex** protecting `nd` without nuking `dnd` / "nail and
  supply": `(?<![a-z0-9])nd(?![a-z0-9])`. → the perfect 8-second "tinh tế" detail.
- **Deterministic engine + AI orchestrator** — all math in Python (no LLM
  hallucination on numbers), Claude only orchestrates + writes the summary. →
  the architecture hook.
- **Human-in-the-loop / CSV-out by default, `api_write:false`** — the safety story.
- **Money-Leak D1–D14 ranked by $/month**, geo Presence-or-Interest leak, 14-day
  cooldown, +10% budget / ±0.3x tROAS caps. (v6 used some of this — good.)
- **Lesson for the skill:** when a NotebookLM/analysis pass exists, mine it for
  the 2–3 *non-obvious* specifics and make each its own scene. Generic capability
  lists lose to one precise, surprising mechanism.

---

## 2. VOICEOVER

- **Pace 145–160 WPM.** Crisp, steady, professional. Not rushed, not draggy.
- **Studio-clean single voice, one provider** (we standardized on Google Chirp3
  HD Charon, edge-tts fallback). ✓
- **Delivery has real pauses between feature blocks** — this is what beat-split +
  the 350ms inter-scene gap buys us. The v5 "tua nhanh cho kịp" was the *absence*
  of these pauses. ✓ fixed in v6.
- **Numbers spoken as words** (our VN TTS rules 2.2.6) — matches how the refs read
  "mười bốn", "gấp đôi". ✓

---

## 3. EDITING / VISUAL — the device catalog

### 3.1 Karaoke captions (HARD — was our #1 gap) ✅ now implemented
Every ref carries a **persistent bottom-center caption that fills word-by-word in
sync with the voice**, two-tone (dim → bright), keywords in accent. It is THE
professional-short-form signal and doubles as muted-autoplay comprehension.
→ Implemented: `lib/compose/subtitles.py`, burned per-scene, on by default.
Beat-split scenes get frame-tight sync from `beat_timeline`; legacy scenes get
weighted distribution. Number-words pop gold accent.

### 3.2 Real repo footage / authenticity beat (HARD — flagged from video3) ✅ now implemented
v3 inserts ONE scene of the genuine GitHub repo scrolling — file tree → rendered
README → dashboard screenshot — over the same karaoke bar. Proof it's real, not a
fabricated pitch.
→ Implemented: `lib/render/repo_footage.py`. Narrow (phone-ish) Playwright
capture → tall screenshot → vertical scroll-pan in a browser-framed 9:16 clip.
Trigger with `scene.capture_url` in plan.md. Place it early (after hook/framing)
as the "đây là repo thật trên GitHub" beat, ~8–11s.

### 3.3 Giant hero number + ghost echo (video2)
"200+", "50+", "60+" as MASSIVE type with a huge faded echo of the same number
behind. Instant scope conveyance. → build into a stat template
(`frame-pentagram-stat` / a new `frame-hero-number`). Use for the one number that
matters most in a scene (e.g. "14" loại rò — v6 already leaned this way, push it
bigger + add the ghost echo).

### 3.4 Progressive within-scene reveal (all three) ✅ we have this (beat-split)
Items appear one-by-one as the voice names them — never "show all then read".
5 bars reveal across 5 beats; list rows drop in with a right-aligned badge
(v2: `Multi-image input → 14`, `Lip Sync Studio → 9`). Keep doing this; extend
the right-badge pattern to list templates.

### 3.5 Pattern-interrupt cadence — visual changes every 2.0–3.5s (HARD)
The refs never let the frame sit. Even a 12s scene has 4–6 internal changes
(reveals, counters, a number ticking, a bar growing). Our scenes are 5–13s;
beat-split gives internal motion but ensure EVERY scene has a visible change at
least every ~3s or it reads static. Counter roll-ups, bar growth, line-draw,
node-connect are the cheap wins.

### 3.6 Terminal with a real error-state interrupt (video3 scene 1)
A fake-but-plausible terminal runs ✓ steps, then **flashes a red `RATE LIMIT`
box** — a pattern interrupt that lands the pain. We have `frame-terminal-mock`;
add an alert/error state (red flashing box + `alert` SFX) for the problem beat.

### 3.7 Node / hub-spoke network (video3 scene 2)
A center node with many small colored dots radiating (160+ providers). Reads as
"one hub, many sources". We have `frame-hub-spoke` (4 chips) — add a dense
many-dot variant for "N providers/models converge".

### 3.8 Persistent brand watermark + top bar (all three)
Small handle/logo in a corner on EVERY frame (@escbase, AI Coding, kryn.ai) +
sometimes a top progress/author bar. We render `.brand-header`/`.brand-footer`
already — keep them subtle and ALWAYS on, incl. over repo footage.

### 3.9 Color system discipline
One dark base (#0a0e14 / #070A12 / #0B0F19), 1 primary accent + 1 warning
(crimson) + 1 success (mint/emerald). Numbers in mono. Cards rounded 16–24px.
Warning-red ONLY for the problem/alert beat; mint/emerald once the solution
lands. Don't rainbow every scene.

---

## 4. AUDIO — the bed we're still missing (next build)

All three have, and we do NOT yet fully use:
- **BGM:** lo-fi / synthwave, ~115–122 BPM, ducked to roughly −18 to −22 dB under
  voice, steady, non-melodic-enough to not fight the VO. Runs the whole video.
- **SFX on every reveal:** UI tick/click on card & metric reveals, whoosh on
  scene transitions, sub-bass drop on a big section reveal, alert chime on the
  warning. We have `templates/sfx/*` + a per-scene selector — but the refs fire
  SFX *per reveal* (per beat), not once per scene.
- **Status:** SFX exists (1/scene). TODO: (a) drop a royalty-free BGM bed into
  `templates/bgm/` and mix it under the final (duck via sidechaincompress or a
  flat −20 dB), (b) fire a soft `reveal` tick at each `beat_timeline` start.
  Document only — do not ship unlicensed music.

---

## 5. Gap table — v6 vs the standard

| Craft element | Refs | v6 (before) | Now |
|---|---|---|---|
| Word-synced karaoke captions | ✅ all | ❌ none | ✅ `subtitles.py`, default on |
| Real repo footage beat | ✅ v3 | ❌ 100% synthetic | ✅ `repo_footage.py` |
| Honest-caveat scene | ✅ all | ⚠️ weak/absent | ⏳ script rule added (do next render) |
| Pain-hook 2nd person | ✅ all | ⚠️ generic intro | ⏳ script rule tightened |
| Progressive reveal | ✅ all | ✅ beat-split | ✅ keep |
| Single voice + pauses | ✅ | ✅ (v6 fixed) | ✅ |
| Giant hero-number + echo | ✅ v2 | ⚠️ partial | ⏳ template upgrade |
| Pattern-interrupt ≤3.5s | ✅ | ⚠️ some static | ⏳ enforce in Gate 3 |
| BGM bed | ✅ | ❌ silent | ⏳ needs asset (documented) |
| Per-reveal SFX | ✅ | ⚠️ 1/scene | ⏳ per-beat SFX (documented) |
| Named "weapons" + numbers | ✅ | ⚠️ partial | ⏳ script rule |
| Mine analysis for non-obvious specifics | ✅ (implicit) | ❌ generic | ⏳ script rule |

---

## 6. Definition of done for a repo-tour Short (new bar)

Ship only when ALL are true:
1. Hook is a single 2nd-person pain sentence or a one-line analogy (not fragments).
2. At least one scene is **real repo footage** (`capture_url`).
3. Karaoke captions burned and synced (default on).
4. One scene is an **honest caveat** (a real limit / who-shouldn't).
5. Each differentiator is a NAMED, NUMBERED unit; ≥1 non-obvious specific from
   the analysis is its own scene.
6. Every scene has a visible change at least every ~3s.
7. Single voice, single provider, pauses between scenes (350ms gap).
8. CTA is contextual, no URL read.
9. (When asset available) BGM bed ducked under voice + a reveal tick per beat.

If a video misses 1–4, it is not "chưa tới" — it is unfinished. Re-open the
relevant phase, don't ship-and-iterate.
