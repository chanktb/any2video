---
name: any2video
description: Deep-analyze any input (URL, GitHub repo, article, image, raw text) and produce a chi-tiết video with non-templated visuals + voice narration. Unlike a fixed-template video generator (fixed layouts + themes + a small fixed context), the agent does the deep extraction, writes the plan, then assembles each scene by picking a template from a rich catalog and filling it with real data (via `template_render` — not free-hand HTML), and composes the mp4. Use when the user says "làm video từ <url>", "video giới thiệu repo <github>", "dùng any2video", "/any2video", or wants a repo/product tour video.
---

# any2video — Deep Video from Any Input

Claude is the planner + visual designer. Result: each video looks designed for its content, not slotted into a pool of fixed layouts.

## When to use this skill vs a quick templated generator

| Situation | Tool |
|---|---|
| Quick FB/IG video from an article URL, default branding | a fixed-template generator |
| Repo URL, code-heavy explanation needed | **any2video** |
| Raw text → video, needs custom visual treatment | **any2video** |
| Bulk video gen, API-shape, scale to many users | a fixed-template generator |

Runs on any coding agent — Claude Code, **Antigravity**, etc. Phase 4 injects data
into templates instead of hand-writing HTML per scene, so a run is a normal agent
session, not a token-heavy job. Best for videos you want to look bespoke; a
fixed-template generator is still the better fit for high-volume, uniform output.

## Workflow — 6 phases, 7 quality gates (Phase 0 + 3.5 + 6 added 2026-06-30)

### Phase 0 — Interactive intake (NEW)

Before any clone / WebFetch, ask the user 4 questions in ONE message (AskUserQuestion or plain prompt):

1. **Input** — URL repo / URL article / paste raw text? (skill detects type from string)
2. **Output folder** — default `workspace/runs/<slug>/` hay custom path?
3. **Gửi Telegram** — gửi transcript preview + final.mp4 về DM? `[Y/n]` (default Y)
4. **Caption** — (chỉ nếu Y ở câu 3) caption cho post final hay `auto` để skill tự gen từ tiêu đề source

If args present on `/any2video <url>` invocation, skip Q1. Otherwise wait for answer.

Save intake to `workspace/runs/<slug>/intake.json`:
```json
{
  "input": "https://github.com/<owner>/<repo>",
  "output_dir": "workspace/runs/<owner>-<repo>/",
  "telegram": true,
  "caption_mode": "auto" | "<text>"
}
```

### Phase 1 — Source routing + deep extract

Detect input type:
- **GitHub repo URL** → `git clone --depth 1` to `workspace/scratch/<slug>/repo/`, then:
  - Read `README.md`, `package.json` / `pyproject.toml` / `go.mod` / `Cargo.toml` (stack detect)
  - Build tree (depth ≤ 3, skip `node_modules`, `.git`, `dist`)
  - Identify entry points + 3-5 core files (Claude picks from tree)
  - `git log -n 15 --oneline` for recent activity
- **Article URL** → WebFetch, strip nav/footer, keep body + outline
- **Image** → vision: describe scene, extract text (OCR via Claude vision)
- **Raw text** → passthrough

Write **`workspace/runs/<slug>/analysis.md`** with this fixed structure:

```markdown
# Analysis: <slug>
## Problem
What problem does this solve? Who has it? Why does it matter?
## Solution
What's the approach? What's novel?
## Architecture
Key components, how they fit together.
## Flow
End-to-end workflow: trigger → steps → output.
## How to use
Concrete usage: install, invoke, configure.
## Why it matters
Audience, impact, what differentiates it.
## Evidence
Real numbers, quotes, file references — proof for every claim above.
```

**Gate 1 (Sonnet critic):** every claim in Problem/Solution/Architecture/Flow has at least one citation in Evidence. No citation → flag, regenerate that section.

### Phase 2 — Narrative plan (the critical phase — read carefully)

**This is where most any2video runs FAIL the quality bar.** The output is a script the viewer hears — not a marketing card. Treat it as scriptwriting for a friend showing you something on their laptop, not a product slide deck.

#### 2.1 Narrative principles (HARD — these are what separate "cuốn hút" from "tệ")

Derived from the Palmier Pro reference + common templated-video anti-patterns. The 9 patterns:

1. **Pain-first / mid-conversation opening.** Open on the viewer's pain or a stat already-in-flight ("Nếu bạn hay phải …", "Repo này có 9 nghìn sao …"). NEVER a flat catalogue opener: "Đây là một công cụ …", "Hôm nay xem qua repo này …", "Hôm nay chúng ta sẽ tìm hiểu …". A "Hôm nay xem qua X, một công cụ …" opener has no hook, names no problem, and gives the viewer zero reason not to scroll — see §2.2.5.0 Intro pain-hook.
2. **Contrast structures.** Use "không chỉ X mà còn Y", "cứ như X nhưng có Y", "không phải X mà là Y", "Nhưng lưu ý …". Contrast pulls attention.
3. **2nd-person address.** "bạn thấy ngay", "Bạn có thể trim, replace", "Nếu bạn dựng video trên Mac dòng M". Brings the viewer in.
4. **Demonstrative immediacy.** "ngay", "này", "trên đây", "ngay trên timeline", "ngay trong cùng editor này". Concrete and present.
5. **Specific real names.** Name actual files, commands, competitors, brands — "Final Cut", "Cursor", "Claude Code", "FLUX", "Edge TTS", "ffmpeg". Generic terms ("AI tool", "the framework") are forbidden.
6. **Quantified social proof** — but ONCE, not as a sidebar dump. Frame with hedge: "hơn 9 nghìn sao", "khoảng 600 fork". Never list stars + forks + issues + license back-to-back.
7. **Short clauses, comma-flowed.** "Bạn có thể trim, replace, hay regenerate phần đó." One breath. Not bullet fragments.
8. **Caveat-as-feature.** "Nhưng lưu ý, editor và MCP server miễn phí, còn AI generation cần mua thêm credit." Honest framing > marketing fluff.
9. **Use-case landing.** Close on a SPECIFIC viewer scenario: "Nếu bạn dựng video trên Mac dòng M …" / "Nếu repo bạn đang xây có 3-5 file lõi …". Not "Hãy ghé repo xem thử nhé."

#### 2.2 What the narration MUST NOT do (auto-fail patterns)

- ❌ Treat scenes as Hook/Problem/Solution/CTA fill-in-the-blank
- ❌ List GitHub sidebar stats as separate fragments ("Một dòng lệnh. Một video. Không tốn xu nào.")
- ❌ Restart each sentence as a stand-alone bullet ("Repo X runs one pipeline. Gemini writes. Edge TTS narrates.")
- ❌ Generic capability claims ("đầy đủ tính năng", "rất mạnh mẽ", "phổ biến trong cộng đồng")
- ❌ Describe the README/repo instead of the product ("README rất chi tiết và đầy đủ")
- ❌ Close with "Hãy ghé repo và xem thử nhé"

A good example to internalize:
> "Hermes định vị là Agent tự hành — không phải chatbot — với trí nhớ dài hạn lưu state qua nhiều phiên."

That single sentence has: contrast (`không phải … mà là`), specific name (`Hermes`), specific design choice (`trí nhớ dài hạn lưu state qua nhiều phiên`). One sentence does the work of 3 generic ones.

#### 2.2.5 The 7-beat narrative arc (HARD)

Every any2video runs through **7 beats** in this order. NEVER skip intro or outro.

| # | Beat | Sec | What it does |
|---|------|-----|--------------|
| 1 | **intro** | 3-5 | PAIN-FIRST opener (HARD, §2.2.5.0). Lead with the viewer's problem in 2nd person — "Nếu bạn hay phải [pain] mà lại [friction], thì xem [repo này] — [one-breath value prop]." The avatar + name + tagline reveal VISUALLY while this line plays, so no "Hôm nay xem qua…" narration is needed to name the thing. NEVER a flat "Hôm nay xem qua repo này, một công cụ…". |
| 2 | **hook** | 4-6 | Sharpen the value prop the intro opened — via contrast / a surprise stat, still 2nd-person, one breath. If the intro already fully hooked, this beat deepens the "why now" instead of re-hooking. |
| 3 | **problem** | 5-8 | Pain it solves. Name competitors / status quo concretely. |
| 4 | **solution** | 8-12 | How it works at a high level. Pipeline / architecture diagram. |
| 5 | **details** | 7-10 | One specific differentiator — the thing nobody else does (e.g. cast lock, channel auto-ideate). |
| 6 | **review** | 5-8 | Honest caveat-as-feature. Quick "what to know before installing". |
| 7 | **outro** | 3-5 | Closing card — repo URL + license + soft sub icon. Narration MUST NOT spell URL char-by-char (rule below). |

Total target: 50-75 sec. Intro and outro are NON-OPTIONAL — they are how the viewer figures out what they're watching and what to do next.

##### 2.2.5.0 Intro pain-hook (HARD — the opening 5 seconds decide the scroll)

The #1 reason a repo-tour Short dies is a flat opener: "Hôm nay xem qua repo này…" / "Đây là một công cụ…". It states no problem, carries no hook, and gives the viewer nothing to stay for. Open on THEIR pain instead — the intro is the front bookend of the SAME pain the outro closes (§ outro pain-CTA below); write them as one thought split across the video.

**Pattern (HARD):**

```
Nếu bạn [hay phải / thường xuyên] [pain-task the audience does],
[hay chỉ là / hoặc] [softer version of the same audience] nhưng lại [friction they hate],
thì xem [repo này] — [one-breath value prop, "chỉ với một câu lệnh"].
```

Structure (mirrors the outro, reversed):
1. **Name the pain-task** the target viewer does today ("hay phải làm video short giới thiệu repo", "thường xuyên audit SEO cho khách").
2. **Widen to the audience + the friction** ("hay chỉ là thích review repo nhưng lại lười ngồi edit video").
3. **Land the repo + value prop in ONE breath** ("thì xem repo này nhé — tự động làm video AI ngay trên máy, chỉ với một câu lệnh"). Naming the repo here is FINE (unlike the outro) — this is where the viewer learns what they're watching, but it comes AFTER the pain, never as the first words.

**Reference (approved shape):**
> "Nếu bạn thường xuyên phải làm video short giới thiệu repo, hay chỉ là thích review repo nhưng lại lười edit video, thì xem repo này nhé — một skill tự động làm video AI ngay trên máy tính của bạn, chỉ với một câu lệnh."

That one sentence carries 2nd-person pain (`hay phải làm video short`), audience-widen (`hay chỉ là thích review repo`), friction (`lười edit video`), and the value prop in one breath (`tự động… chỉ với một câu lệnh`) — and never says "Hôm nay xem qua…".

**Where the pain comes from:** `analysis.md > ## Problem` — the SAME source the outro uses. Intro opens the pain, outro closes it; keep them consistent (same audience, same pain), not two unrelated hooks.

**Examples (per repo type — intro openers):**

| Repo type | Example intro narration |
|-----------|-------------------------|
| Video generator | "Nếu bạn hay phải làm video giới thiệu repo mà lười ngồi edit, thì xem cái này — nó tự dựng video AI ngay trên máy, chỉ một câu lệnh." |
| Google Ads plugin | "Nếu bạn đang chạy Google Ads mà không chắc tiền đang chảy đi đâu, thì xem skill này — nó tự soi tài khoản, chỉ ra chỗ đang lãng phí." |
| Blog SEO auditor | "Nếu blog bạn đang tụt traffic mà không biết sửa từ đâu, thì xem cái này — nó tự audit rồi xếp việc cần làm theo thứ tự." |
| CLI tool | "Nếu ngày nào bạn cũng phải làm [X] thủ công, thì xem một dòng lệnh này — nó làm hết trong vài giây." |

**TTS-sanitize the repo name** in the intro line (rule 2.2.6d): write it as pronounced, not the raw slug (e.g. `any2video` → `any to video`).

**Outro narration (HARD — contextual pain-CTA, NO URL / no repo name).** The video always ships with a caption/post that already contains the URL — the link goes there when posting to FB / TG / TikTok. So the video's outro must NOT waste 5 seconds mentioning URLs or repo names. Instead: use those 5 seconds to hook the SPECIFIC PERSON who'd install this.

**Pattern (HARD):**

```
Nếu đang [pain-scenario the audience recognizes],
hoặc muốn [outcome they want],
thì [dùng thử / dùng cái này / mở lên xem] — link ở dưới.
```

Structure:
1. **Address a real pain** the audience feels TODAY ("đang chạy ads mà không hiệu quả", "đang dựng landing page mà nó chậm", "đang audit SEO mà chưa biết bắt đầu từ đâu")
2. **State the outcome** (framed as their want, not the product's feature) ("muốn xem đang lãng phí ngân sách ở đâu")
3. **Soft CTA** ("thử skill này", "mở cái này lên xem", "dùng thử nhé") + "link ở dưới / link ở comment"

**Never:**
- ✗ Mention URL: "github chấm com…"
- ✗ Mention repo name: "tìm `<repo>` ở github `<owner>`"
- ✗ Mention filename: "clone repo về máy"
- ✗ Generic close: "cảm ơn đã xem", "ghé repo xem thử nhé"

**Examples (per repo type):**

| Repo type | Example outro narration |
|-----------|-------------------------|
| Google Ads plugin | "Nếu đang chạy Google Ads mà thấy không hiệu quả, hoặc muốn xem đang lãng phí ngân sách ở đâu, thì dùng thử skill này. Link ở dưới." |
| Video generator | "Nếu đang muốn làm video AI mà không muốn upload cloud, không muốn trả phí tháng, thử cái này chạy local xem. Link ở dưới." |
| Blog SEO auditor | "Nếu blog bạn đang mất traffic mà không biết chỗ nào cần fix, thử skill này chạy audit xem. Link ở comment." |
| Shopify optimizer | "Nếu store bạn đang có 500+ collection mà rối, không biết cái nào lỗi cái nào ngon, thử cái này xem. Link dưới bài." |
| CLI tool | "Nếu đang phải làm [X] thủ công mỗi ngày, thử một dòng lệnh này xem. Link ở dưới." |

**How Phase 2 drafts this:** the pain-scenario comes from `analysis.md > ## Problem` ("Who has it? Why does it matter?"). Reuse that exact framing — same audience, same pain — but in 2nd-person "bạn" / "đang chạy" mid-conversation tone. The value prop comes from `## Why it matters`. Keep it under 20 words for a 5-6 sec TTS output at +15% rate.

**Visual (statement-outro):** the `source` slot still shows the URL as a quiet visual reference (viewer can screenshot). The `cta` slot shows the pain-CTA in caps (e.g. "THỬ SKILL NÀY NẾU BẠN CHẠY ADS"), and `channel` stays as `<owner> / <repo>`.

#### 2.2.6 VN TTS optimization — voiceText rules (HARD)

These apply to EVERY `narration` field. Violation = re-TTS will sound wrong even with the best voice (vi-VN-NamMinhNeural). Visual `inputs` (template slots) are EXEMPT — they keep formatted display ("82.7%", "$5", "GPT-5.5").

**(a) Scene atomicity — 1 idea per scene.** If a sentence has 2 ideas, SPLIT into 2 scenes instead of cramming. Body scenes target **6-10 sec on screen** (~25-40 VN syllables). Long scene = viewer disengages mid-explanation.

**(b) Total scene count — 7 to 10.** The 7 beats stay, but high-density beats (solution/details/how-to) can split into 2 atomic scenes each. Don't pad to 12 — over-fragmentation creates flash-cut fatigue.

**(b.2) Requested duration → hit it within ±10 sec (HARD).** When the user asks for a target length (e.g. "video 60 giây") or passes `any2video init --duration 60` (writes `meta.target_duration_sec`), the plan is NOT free to drift. Script it deliberately:
- **Phase 2 budgets syllables.** VN TTS at `+15%` speaks ~4.0–4.5 syllables/sec. So a 60s target ≈ 250–270 VN syllables of `narration` total. Divide across scenes by beat weight; write each scene's `narration` to its syllable budget instead of free-writing then hoping.
- **Phase 3 measures + reconciles (the gate).** After TTS, sum the ffprobe'd scene durations + the compose gaps (`gap_ms × (scenes−1)` + poster 0.1s). If `|measured_total − target| > 10s`, FIX before rendering: over → trim the wordiest scenes' narration (or drop a splittable scene); under → expand a thin beat or add one atomic scene. Re-TTS only the changed scenes, then re-measure. Loop until within ±10s.
- No target requested → the default 50–75s window applies, no hard tolerance.
Report the final measured length next to the target when notifying (e.g. "target 60s, thực tế 58.4s").

**(c) Numbers → Vietnamese words in `narration`.** Microsoft Neural TTS reads "5.5" as "năm rưỡi" (wrong for version). Write everything out:

| Form | WRONG (TTS misreads) | RIGHT (write out) |
|---|---|---|
| Version decimal | `GPT 5.5` → "năm rưỡi" | `GPT năm chấm năm` |
| Stat decimal | `82.7%` | `tám mươi hai phẩy bảy phần trăm` |
| Version integer | `iPhone 17` | `iPhone mười bảy` (or `iPhone 17` — both OK) |
| Version with dot | `iOS 18.2` | `iOS mười tám chấm hai` |
| Spec | `200MP` | `hai trăm megapixel` |
| Battery | `5000mAh` | `năm nghìn miliampe giờ` |
| Token count | `1M tokens` | `một triệu token` |
| Price VND | `21 triệu đồng` | `hai mươi mốt triệu đồng` |
| Price USD | `$5` | `năm đô la` (or `năm đô`) |
| Multiplier | `2x` | `gấp đôi` (more natural than "hai lần") |
| Percent | `30%` | `ba mươi phần trăm` |
| Time | `60 giây` | `sáu mươi giây` |
| Ratio | `3:1` | `ba trên một` |
| Code range | `D1 đến D14` | `mười bốn loại lỗi` (paraphrase) or `D một đến D mười bốn` |

Decimal mark: `chấm` (natural) or `phẩy` (formal) — pick one, stay consistent. English acronyms (AI / GPT / API) usually OK; if TTS mangles, spell phonetically (`ây ai` / `gí pi tí` / `ây pi ai`).

**(d) Sanitize `narration` — strip ALL of these:**

- ❌ Emoji / icon (any 🔥 🚀 ⚠️ ✅ etc.)
- ❌ URL (`https://...` / `github.com/...`) — spell as `github chấm com gạch <owner> gạch <repo>`
- ❌ Symbols: `→ ← & % $ # + = / @ * ^ ~`
- ❌ Slash commands like `/plugin install` — say `lệnh plugin install` or `gõ plugin install`
- ❌ File extensions in middle of sentence (`.yaml`, `.json`) — say `file YAML` / `file JSON`
- ❌ Camelcase identifiers (`accountContextYaml`) — split: `account context dot yaml` or rephrase
- ❌ Ellipsis `…` / `...` and em-dash `—` / en-dash `–` ANYWHERE in `narration` (HARD) — TTS misreads them (weird long pause or reads the char). Break the clause into two short sentences with `.` instead, or use a plain comma. Display `inputs` may keep `…`/`—` freely (viewer reads, doesn't hear).

End every sentence with `.` or `?` for natural pause. NEVER end with `:` or `,` or a trailing dash. Keep punctuation in `narration` MINIMAL — a comma or a period, nothing fancier.

**(d.2) English terms → phonetic in `narration`, EXACT spelling in display (HARD).** Any English/brand/repo/product name that TTS would mangle gets written PHONETICALLY in the `narration` field only, while the matching display slot in `inputs` keeps the original spelling verbatim. The two channels never have to match character-for-character — one is heard, one is read.

| Term | `narration` (heard — phonetic) | display `inputs` (read — verbatim) |
|---|---|---|
| any2video | `any to video` (or `eni-tu-vi-đeo`) | `any2video` |
| ffmpeg | `ép ép em peg` (or `f f m peg`) | `ffmpeg` |
| PyTorch | `pai tọt` | `PyTorch` |
| n8n | `en tám en` | `n8n` |
| GitHub | `git hâb` | `GitHub` |
| API / GPT | usually OK; if mangled → `ây pi ai` / `gí pi tí` | `API` / `GPT` |

Pick the transliteration that a Vietnamese reader would pronounce closest to the real English — test by reading the `narration` aloud. If it still sounds wrong, rephrase to avoid the term. NEVER put the raw slug (`any2video`, `ffmpeg`) into `narration` and hope the voice guesses right.

**(e) Visual `inputs` (template slots) — opposite rule.** Keep formatted display:
- Numbers stay formatted: `5.5`, `82%`, `$0`, `D14`
- 0-1 emoji per field for color (kicker `🔥 NEW`, cta `Theo dõi ngay →`) — but NOT inside autofit hero pop-char fields (build-minimal `.hero`, build animations break)
- URLs stay clickable-looking: `github.com/<owner>/<repo>`
- The viewer READS these, doesn't hear them — separate channel.

**Quick mental check before writing a scene:** would a Vietnamese friend reading the narration ALOUD pause at the right places, say all numbers naturally, and not stumble on symbols? If yes → ship. If no → rewrite.

#### 2.2.7 Reference-video craft standard (HARD — read `references/reference-video-teardown.md`)

Distilled from 3 curated 9.1–9.4/10 repo-tour Shorts (teardown doc has the full
analysis + the "why v1–v6 felt off" diagnosis). These are the bar. A video that
misses items 1–4 is **unfinished, not "chưa tới"** — re-open the phase, don't ship.

1. **Karaoke captions are MANDATORY.** Every ref carries a bottom-center caption
   that fills word-by-word in sync with the voice (two-tone dim→bright, keyword
   accent). It's the #1 pro-signal + muted-autoplay comprehension. → burned
   automatically by `lib/compose/subtitles.py` (compose default ON). Beat-split
   scenes sync tight from `beat_timeline`. Nothing to author — just don't pass
   `--no-subtitles`.
   **Reserve the caption band (HARD).** Karaoke burns into the bottom band
   (~y1470–1700). No scene content may sit there or it collides with the line —
   `template_render` auto-hides each template's own `.caption`/`.caption-overlay`
   (karaoke replaces it). Rule of thumb: **push scene content UP toward the top of
   the INNER safe-zone whenever there's spare room**, leaving the bottom clear —
   never leave content floating low where the caption will overlap it.
   **Accent spacing (HARD):** when a headline splits into `title`+`accent` or a
   caption wraps a highlight in `<b>`/`.kw`, ALWAYS include the separating space —
   `title: 'Ba '` (trailing space), or `'... <b>KEY</b> ...'` — so the coloured
   phrase never sticks to its neighbours ("tự thiết kế<b>HTML CSS</b>cho" = wrong).

2. **One real repo-footage scene** (authenticity beat). The best ref inserts a
   genuine scrolling capture of the live repo (file tree → README → screenshots)
   over the caption bar — proof it's real, not a fabricated pitch. Add a scene with:
   ```yaml
   - id: 2
     beat: framing
     capture_url: https://github.com/<owner>/<repo>   # triggers repo_footage
     footage_label: github.com/<owner>/<repo>
     narration: "Đây là repo <name> trên GitHub..."     # narrate over the scroll
     duration_sec: 10
   ```
   Place it early (after hook). Render path auto-dispatches to `repo_footage.py`.
   **Repo-footage rules (HARD):**
   - The browser chrome shows the real `github.com/...` URL (padlock + address).
     Rendered via PIL in `_render_chrome_png` — never fight ffmpeg drawtext on Win.
   - Footage window is cropped short (`WIN_BOTTOM≈1470`) so the karaoke line sits
     in the dark band below it, never over the page.
   - Scroll is speed-capped (`PAN_SPEED_PX_PER_SEC≈300`) — a tall page shows less,
     readably. Never blur past. Give the scene ≥7s.
   - **Outro = author-profile footage (HARD), not a text card.** The LAST scene of a
     repo tour MUST set `capture_url: https://github.com/<owner>` (profile root, NO
     `/repo`) → shows the real person, bio, other repos, contribution graph. The white
     paper-card / red-text `frame-statement-outro` is **BANNED** — `plan_critic` fails
     any plan that uses it or that ends a GitHub tour without author-profile footage.
     A plain text outro reads as "vô giá trị."

3. **One honest-caveat scene** (retention feature, not filler). State a real
   limit or a "who should NOT use this". For claude-google-ads: *eCommerce-only,
   not LeadGen/Local/SaaS; needs ≥15 conv/week*. Every ref de-hypes on purpose
   ("benchmark đẹp không biến model thành nút mua bán").

4. **Hook = one 2nd-person pain sentence OR a one-line analogy** — never "X. Y.
   Z." fragments. Name real competitors + numbers every scene.

5. **Named + numbered "weapons".** Give each differentiator a title and a number
   (v3: "Vũ khí 01/02"). Mine any analysis.md / NotebookLM review for the 2–3
   *non-obvious* specifics (e.g. the Reseller Rule, the word-boundary `nd` regex)
   and make each its own scene. Generic capability lists lose to one precise,
   surprising mechanism.

6. **Pattern-interrupt cadence ≤ ~3.5s.** Every scene shows a visible change at
   least every ~3s (reveal, counter roll, bar growth, line-draw). Beat-split gives
   this for multi-item scenes; single-fact scenes still need internal motion.

7. **Giant hero-number + ghost echo** for the one number that matters most in a
   scene (v2 device). **Warning-red only on the problem/alert beat; mint/emerald
   once the solution lands.** One dark base + 1 accent + warn + success — no rainbow.

8. **Audio bed (when asset present):** lo-fi/synthwave BGM ~115–122 BPM ducked to
   ≈ −20 dB under voice + a soft reveal tick per beat. SFX assets already in
   `templates/sfx/`; BGM asset goes in `templates/bgm/` (do NOT ship unlicensed music).

9. **Pre-render gate is MANDATORY — every scene HTML is measured before ANY video is
   rendered (HARD).** After `template_render all`, run:
   ```
   python -m lib.critic.scene_gate all <plan.md>
   ```
   It renders each `scenes/<id>.html` at 1080×1920 (fonts loaded, entrance animations
   settled) and FAILS the plan on any of:
   - **Text clipped** by an overflow-hidden box — a word cut off, or a Vietnamese tone
     mark (Ậ Ỗ Ồ Ề) sliced at the top edge (`text_clipped` / `text_clipped_vn_diacritic`).
   - **Two text blocks overlapping** / stuck together (`text_elements_overlap`).
   - **Line-height < 1.15** on multi-line VN text (`line_height_too_tight`).
   - **Empty box** — a bordered/card element that rendered hollow because an icon,
     font glyph, or child failed to build (`empty_block`). NEVER ship a block that's
     just a border with nothing inside — fix the icon/font, fill it, or pick another
     template. **Broken image** (`broken_image`) — an `<img>` that failed to load.
   - Content outside the safe zone, 4:5-cut straddle, slop palette.
   `pass:false` → **do NOT render.** Fix the offending scene's `inputs` (shorten the
   string) or the template (raise line-height / add top padding / move the block), re-run
   `template_render` for that scene, re-gate. Loop until `pass:true`. Rendering video on a
   failing plan throws away minutes per scene — the gate exists so you never do that.
   `template_render` already injects a VN-diacritic headroom guard, but tight custom
   `inputs` can still overflow; the gate is the backstop.

   **Nothing ships until EVERY scene is perfect (HARD).** A hollow block (border with
   no content because an icon/font/child failed to build), a broken image, a tofu glyph,
   any clipped/overlapping/edge-cut text — every one of these means REDO that scene (fix
   the asset, swap the icon, pick another template) or find another way. Also eyeball each
   scene's rendered PNG (the gate writes one per scene) for anything the DOM checks can't
   see — a mojibake glyph, a wrong colour, a broken layout. Do not ship "close enough":
   all scenes must be correct before Phase 5.

#### 2.2.8 Only ever reference the CURRENT repo (HARD)

The video, its `narration`, its template `inputs`, `analysis.md`, and the post caption
mention **only the repo being toured** — its name, its `github.com/<owner>/<repo>`, its
author's profile. NEVER name, link, or pull facts from any OTHER repo (a repo the study
templates came from, a "similar tool", a competitor's project). Doing so sends the viewer
to someone else's project. If a source README links out to other repos, ignore those
links — extract only what describes THIS repo.

#### 2.3 Write `workspace/runs/<slug>/plan.md` (YAML)

```yaml
meta:
  slug: <slug>
  lang: vi                          # vi (default) or en — drives narration language
  total_duration_sec: <int>         # 45-75 sec for 9:16 Reels feel
  voice: vi-VN-Chirp3-HD-Charon     # DEFAULT: MALE, Google TTS. Female ONLY if the user asks.
  voice_provider: google            # DEFAULT google (Chirp 3 HD); auto-falls back to edge-tts (also MALE) if no key
  voice_rate: "+0%"                 # Chirp 3 sounds natural at +0%; edge-tts fallback uses +15%
  theme_hint: <free-form mood>
  aspect: "9:16"
  accent: { from: "#ff2d9b", to: "#22d3ee" }   # OPTIONAL video-wide accent colour —
                                               # recolours the highlighted words across ALL
                                               # scenes (pick a vibrant pair). Per-scene
                                               # inputs.accent_from/to still override.
  brand: { name, avatar_url, tagline }
  footer: [ list of stat strings ]

scenes:
  - id: 1
    beat: hook                      # FREE-FORM label (hook / framing / demo / capability /
                                    # honest-caveat / outro). Serves THIS repo's story.
    templateId: frame-hub-spoke     # REQUIRED — pick from templates/scenes/CATALOG.md.
    duration_sec: 5                 # from Phase 3 TTS (measured)
    narration: "<flowing VN sentence(s), see principles 1-9 above>"
    inputs:                         # REQUIRED — keys match the template's slots (see its meta.json).
      headline: "..."               # template_render injects these; DO NOT hand-write HTML.
      chips: [ ... ]                # real data only — see data_props rule below.
    grounded_in:                    # provenance
      - "<exact quote or fact from analysis.md Evidence this scene is built on>"

  # Repo-footage / profile scene: NO templateId — set capture_url instead.
  - id: 2
    beat: proof
    capture_url: https://github.com/<owner>/<repo>
    duration_sec: 8
    narration: "Đây là repo thật trên GitHub..."
```

Constraints (HARD):
- 7-10 atomic scenes total (per 2.2.6 atomicity rule — target 6-10s each)
- Total duration target: 50-75 sec (Reels/Short feel)
- Every non-footage scene has a `templateId` from `templates/scenes/CATALOG.md` + an
  `inputs` block matching that template's slots. Scene HTML is generated by
  `template_render all` (Phase 4) — **never hand-write it.**
- Each scene's `narration` follows the 9 patterns above
- Each scene's `grounded_in` cites at least one specific Evidence line — NOT "implied by README"
- Reuse ≥2 different `templateId`s across the video (visual variety; per typography rule 6)
- **Set `meta.accent` to a vibrant pair that fits the brand/topic** — dev-tool → cyan/blue,
  creative → pink/purple, finance → green/gold, AI → violet/cyan. Don't ship every video on
  the default orange; a distinctive accent is what makes each video pop.
- Numeric/name values in `inputs` must also appear in `narration` AND `analysis.md > ## Evidence`

#### 2.4 Gate 2 (narrative critic — Sonnet, mandatory)

Sonnet sub-agent reads `plan.md` + `analysis.md` and checks:

| Check | Fail signal |
|-------|-------------|
| Narration has connector words (`và`, `nhưng`, `hay`, `mà`, `ngay`, `này`) | < 1 connector per scene on average |
| Narration uses 2nd-person `bạn` at least once across the video | 0 occurrences |
| At least 2 scenes use a contrast structure ("không chỉ … mà còn", "không phải … mà là", "cứ như … nhưng có") | < 2 |
| Each scene's narration contains ≥ 1 specific real name (file, command, brand, competitor) | any scene fails |
| Stars/forks/commits NOT listed as separate scene fragments | violation |
| Intro scene (id 1): opens PAIN-FIRST in 2nd person ("Nếu bạn…" / a problem the viewer feels). NOT a flat "Hôm nay xem qua…" / "Đây là một công cụ…" catalogue opener (§2.2.5.0) | any flat opener |
| Hook scene: NOT 3 telegraphic fragments ("X. Y. Z.") | violation |
| CTA scene: NOT "ghé repo xem thử" / "ghé link xem ngay" generic close | violation |
| Each scene's `grounded_in` references a real line in `analysis.md > ## Evidence` | missing/fabricated |

Fail any → regenerate ONLY the failing scene's narration with the specific anti-pattern called out. Don't replan the whole video.

### Phase 3 — TTS first (timing source of truth)

For each scene: call edge-tts (or configured TTS) on `narration` → save to `scenes/<id>.mp3`.

Run `ffprobe` on each mp3 → get **real duration**. Overwrite `duration_sec` in plan.md with measured value.

Why TTS first: estimating duration then rendering then AV-syncing late causes drift. We measure first, render to fit.

### Phase 3.5 — Transcript preview to Telegram (NEW, gated on `intake.telegram`, OPTIONAL)

After TTS done + plan.md has measured durations, if `intake.telegram == true`:

```
python -m lib.notify.telegram preview workspace/runs/<slug>/plan.md
```

This is an OPTIONAL step — configure it via env vars `ANY2VIDEO_TG_BOT_TOKEN` / `ANY2VIDEO_TG_CHAT_ID` (or a local `.env`). When configured, it sends the full transcript (per-scene narration + duration) to a Telegram DM. Then the skill PAUSES in Claude chat with:

> "Đã gửi transcript về TG. Bạn duyệt thì reply `ok` để render, hoặc nói rõ scene nào cần sửa."

Wait for one of:
- `ok` / `duyệt` / `go` / `render đi` → proceed to Phase 4
- Specific feedback (e.g. "scene 3 narration đổi…") → edit plan.md, re-TTS affected scene only, re-send preview, loop

Do NOT proceed to Phase 4 without explicit approval. This is the key checkpoint — narration is cheap to fix, render+compose is expensive.

### Phase 4 — Per-scene visual generation

**Repo-footage scenes are the exception:** a scene with `capture_url` in plan.md
gets NO hand-written HTML — Phase 5's render auto-dispatches to `repo_footage.py`
(real scrolling capture of the live repo). Author only its `narration` +
`duration_sec`. See rule 2.2.7 #2.

**PRIMARY PATH — generate scene HTML FROM THE TEMPLATES (HARD). Do NOT hand-write HTML.**
Every non-footage scene MUST declare a `templateId` from the catalog
(`templates/scenes/CATALOG.md`) plus an `inputs` block whose keys match that
template's slots (see each template's `meta.json`). Then generate ALL scene HTML in
one command:

```
python -m lib.render.template_render all <plan.md>
```

The pre-built templates already bake in EVERYTHING that keeps a video correct: the
3-tier safe zones, `.brand-header`/`.brand-footer` bands, sustained motion, the
reserved karaoke caption-band (auto-hides the template's own caption), and the
universal accent-spacing guard. **Hand-writing scene HTML loses ALL of these guards
and drifts into exactly the failure seen on a free-handed run: safezone violations,
overlapping text, and stuck coloured words.** So:
- Pick the closest `templateId` per scene from `CATALOG.md`; pass the real data via `inputs`.
- `meta.brand` + `meta.footer` render on every scene automatically — don't re-implement them.
- `duration_sec` comes from Phase 3 TTS; reveal timing is written back into `inputs` by `narrate.py`.

**FALLBACK (rare) — hand-written `scenes/<id>.html`.** ONLY when no template can carry
the content. Then you MUST manually satisfy EVERY rule in "Typography rules" + the
3-tier safe zones, and self-verify with a rendered screenshot. This is error-prone —
prefer bending a template's `inputs` (or adding a new template to `templates/scenes/`)
over free-handing a one-off scene. Self-contained HTML: inline CSS/SVG, viewport 1080×1920.

**Motion (HARD — default render is Playwright video):**
- Entry animations should LAST through 60-80% of the scene, not snap in at 200ms then sit static for 5 sec
- Use staggered reveals: hero element at 0-800ms, supporting details at 800-2000ms, caption fade at 2000ms+
- Add subtle sustained motion to background: slow gradient drift, breathing-scale on accent shapes, parallax dots
- Caption overlay (`.caption-overlay`) shows the narration text — fades in across 400-600ms once the scene's main content has settled
- Never write a scene whose only motion is < 500ms — the recording will look static

**Gate 3 — MANDATORY automated pre-render gate (HARD, blocks Phase 5).** Run once over
the whole plan:
```
python -m lib.critic.scene_gate all <plan.md>
```
It renders every `scenes/<id>.html` at 1080×1920 (fonts loaded + animations settled) and
returns `pass:false` with a per-scene `issues[]` on ANY of:
- **Primary content** (text, numbers, CTAs, labeled icons) outside the **INNER** zone (y 345..1575, x 90..990, 900×1230).
- **Background art / gradient** extending past **OUTER** safe (y 285..1635) into the red unsafe bands.
- **Secondary elements** (channel name, source, watermark) straddling y=285 / y=1635 — feed crop slices them in half.
- **Text clipped** — a word cut off, or a Vietnamese tone mark (Ậ Ỗ Ồ Ề) sliced at the top (`text_clipped` / `text_clipped_vn_diacritic`).
- **Two text blocks overlapping** / stuck together (`text_elements_overlap`).
- **Line-height < 1.15** on multi-line VN text (`line_height_too_tight`).
- **Empty box** (`empty_block`) — a bordered/card element that rendered hollow (icon/font/child failed) → shows only its border. **Broken image** (`broken_image`) — an `<img>` that didn't load.
- Slop palette; scene identical to a neighbour.

`pass:false` → **regenerate ONLY the failing scene's HTML** (shorten the `inputs` string,
raise line-height, add top padding, or move the overlapping block), re-run
`template_render` for it, and re-gate. **Never start Phase 5 while any scene fails** —
each rendered scene costs real minutes and a clipped/overlapping frame throws that away.

### Phase 5 — Render + compose

Two render paths:
- **Default (Playwright video recording):** records each scene's HTML frame-by-frame so CSS animations + JS transitions actually play in the final video. ~5-15 sec per scene depending on duration. Use `python -m any2video.lib.render.playwright_render all <plan>`. THIS IS THE DEFAULT — motion is the whole point.
- **`--fast` (static screenshot + ffmpeg loop):** one screenshot per scene → ffmpeg loops it for the measured duration. Use `python -m any2video.lib.render.hyperframe_render all <plan>`. For previews only — every CSS @keyframes is invisible in this mode because the screenshot captures the end state and loops it. Never use `--fast` for final output.

Final composite to `workspace/runs/<slug>/final.mp4` with:
- Per-scene audio aligned to measured TTS duration (no drift)
- **DEFAULT join = gap hard-cut, NOT crossfade (HARD, AV-sync).** `--crossfade > 0`
  overlaps video while the voice hard-concats → the picture drifts progressively
  AHEAD of the voice (~fade×scene-index; ~1.2s by scene 6) and bullet reveals fire
  a beat before the narrator. `concat_gap_hardcut` keeps video+audio on the same
  per-scene timeline → reveals + karaoke lock to voice. Just omit `--crossfade`.
  Hard cuts also match the reference Shorts (continuous jump cuts).
- **Karaoke captions burned per-scene by default** (`lib/compose/subtitles.py`) —
  word-by-word, synced to voice, keyword-accent. `--no-subtitles` to disable
  (don't, unless the user asks). This is MANDATORY per rule 2.2.7 #1.
- 350ms silence gap between scenes so voice never feels "tua nhanh cho kịp"
- Optional outro CTA

Recommended compose call: `python -m any2video.lib.compose.ffmpeg_compose <plan> --gap 350`
(add `--bgm auto` when a licensed loop exists at `templates/bgm/default.mp3`)

### Phase 6 — Final delivery to Telegram (NEW, gated on `intake.telegram`, OPTIONAL)

After `final.mp4` exists + Gate-3 passes, if `intake.telegram == true`:

```
python -m lib.notify.telegram final workspace/runs/<slug>/final.mp4 \
  --source-url "<original input URL>" \
  --caption "<caption text from intake.caption_mode or auto-gen>"
```

This step is OPTIONAL and only runs when `ANY2VIDEO_TG_BOT_TOKEN` / `ANY2VIDEO_TG_CHAT_ID` are configured (env vars or a local `.env`).

**Caption auto-gen** (when `intake.caption_mode == "auto"`): pull `meta.brand.tagline` + `meta.total_duration_sec_measured` + 1-sentence hook from scene 1 narration. Keep under 1000 chars (TG video caption cap).

The bot sends the mp4 as a streamable video to the configured Telegram DM with the source URL pinned to the top, so it can be forwarded to channels from there.

If TG send fails: skill notifies the user in chat with error + still produced final.mp4 locally. Don't block local delivery on TG failure.

## Output paths (workspace hygiene — HARD)

All outputs go under:
```
workspace/runs/<slug>/
├── analysis.md
├── plan.md
├── scenes/
│   ├── 1.mp3
│   ├── 1.html
│   ├── 1.png        (preview screenshot)
│   └── ...
└── final.mp4
```

`<slug>` = sanitize(input identifier). For URL: domain + path-hash. For repo: `<owner>-<repo>`. For text: short keyword + timestamp-less hash (avoid `Date.now` in scripts — keep slugs deterministic).

NEVER write outside the project workspace (e.g. filesystem root, `/tmp/`, or other system temp dirs).

## Sub-agent delegation (model tier — HARD)

Reserve the most expensive model tier for judgment; dispatch routine work to cheaper tiers:
- Phase 1 source fetch (git clone, WebFetch, ffprobe) → Haiku
- Phase 1 analysis.md draft → Opus (judgment)
- Phase 2 plan.md draft → Opus
- Gate 1, 2, 3 critics → Sonnet
- Phase 3 TTS dispatch → Haiku (single MCP call per scene)
- Phase 4 HTML draft → Opus
- Phase 4 screenshot + compare → Sonnet
- Phase 5 ffmpeg compose → Haiku

When delegating file creation to a sub-agent, MANDATORY include in prompt:
```
Output paths (MANDATORY):
- Save all files under: workspace/runs/<slug>/ (relative to the project root)
- mkdir parent folder if missing.
- DO NOT write outside the project workspace, and DO NOT use system temp dirs.
```

## Typography rules (HARD — no italic, VN line-height, glyph overflow)

These rules apply to **every** template HTML in `templates/scenes/` and to any per-scene HTML drafted in Phase 4. They are blocking — Gate 3 fails on violation.

1. **No nghiêng = no italic AND no rotation on text.** "Nghiêng" covers BOTH `font-style: italic` AND `transform: rotate(<angle>deg)` / `skew(...)` on text elements (including via @keyframes end-states like `rotate(2deg)`). Tilted typography looks cheap on video — avoid it entirely. Allowed rotations: only on non-text decoration (corner SVGs, side-label rotated -90/90 for vertical labels are OK because they're decorative). For emphasis on text: use weight, color, gradient, contrasting font-family — never slant or tilt.

2. **Vietnamese line-height minimums.** VN diacritics (â ă ê ô ơ ư + tone marks) stack vertically, so default 1.0–1.1 line-heights make consecutive lines touch.
   - **Multi-line text** (headlines, paragraphs, lists): `line-height ≥ 1.22`. 1.25–1.35 is the safe zone.
   - **Single-line text** (large hero glyphs): `line-height ≥ 1.0`. Never go below 1.0 — see rule 3.
   - **Body / standfirst / desc**: `line-height ≥ 1.4`.

3. **Glyph overflow above the line box.** When `line-height < 1.0` on display-size type (font-size ≥ 200px), the rendered glyph extends ABOVE the element's box top by `font-size × (font-ascent-ratio − line-height) / 2`. A 340px figure with line-height 0.8 in Be Vietnam Pro extends ~68px above its `top` position. If that pushes content above the 4:5 cut line (y=285), the figure gets cropped on Facebook feed. Either set `line-height: 1.0` (safest), or compensate by moving `top` down by at least `(1.0 − line-height) × font-size × 0.4`.

4. **Whitespace nowrap on assembled headlines.** If a template script concatenates spans (e.g. aicoding-comparison's `pre + label + vs + label + post`), wrap each gradient/colored label in `display: inline-block; white-space: nowrap;` so the label can't break mid-word. Trim leading/trailing whitespace on inputs before assembly so empty `post` doesn't leave a dangling space.

5. **Safe-zone padding ≥ 96/60.** Body-padding-left/right ≥ 96px (~8.9% of 1080 — a 6px buffer above the 90px floor for shadow/border safety); body-padding-top/bottom ≥ 60px (3.125% of 1920). Decorative-only elements (channel name, corner ticks, side labels) may sit outside this — but must NOT straddle the 4:5 cut lines at y=285 / y=1635. Verify with the `workspace/tools/safezone-viewer.html` helper before shipping.

6. **Item-style diversity across scenes.** If the same templateId appears twice in one video (e.g. two `frame-aicoding-list` scenes), the SECOND occurrence must visually differ: pass `numberStyle: "circle"` to swap icon-chips for numbered circles, OR change accent color, OR use a different template entirely. Two consecutive scenes with identical chip+title+desc rows feel duplicate.

7. **Decorative badges never overlap autofit text.** Floating badges (WIN ribbons, NEW pills, sale tags) inside a card that also contains autofit display-size text (e.g. aicoding-comparison `.lbl` shrunk by JS to fill the card) WILL collide — the badge sits at fixed coords while the text grows to occupy them. Place badges OUTSIDE the card box: `top: -22px` (pinned to top edge as a ribbon) or `bottom: -16px` (footer ribbon). Give them `z-index: 3` + 3px outline `box-shadow: 0 0 0 3px <bg-color>` so they pop above the dark canvas and don't visually merge with the card border.

8. **Autofit MUST wait for `document.fonts.ready`.** Every autofit routine that measures `scrollWidth` to shrink display-size text (e.g. build-minimal `.hero`, aicoding-comparison `.lbl`, vignelli `.number`, liquid-bg-hero `.headline`, pentagram-stat `.headline`) MUST defer measurement until Google Fonts have loaded. If it measures synchronously at script exec, it uses the system-ui fallback font (~15% narrower than the real Inter/Be Vietnam Pro) → shrink is undersized → the real font renders wider than measured → text overflows the viewport once fonts arrive. Wrap in `document.fonts.ready.then(doFit)` with `setTimeout(doFit, 400)` fallback. Also: NEVER reset `white-space: nowrap` back to default after shrinking — the shrunk font can still wrap if given the chance.

9. **Scene 1 poster prepend (Phase 5, HARD).** Every final.mp4 MUST get a 0.1s poster clip prepended by `ffmpeg_compose --poster` (on by default). The poster is a still frame extracted from scene 1 at t=(duration×0.85), when entrance animations have settled. Reason: FB/TikTok auto-thumbnail grabs the frame at t=0. Without the poster, that frame is scene 1's opening-blank canvas (all @keyframes start at opacity: 0) → black/blank auto-thumb → someone has to manually upload a thumb every time. With poster, thumb is a fully-rendered hero. Bonus: 0.1s lead-in before voice starts. Use `--no-poster` only for internal previews.

10. **Connector lines / paths MUST follow their anchor elements when repositioned (HARD).** Templates with SVG `<line x1 y1 x2 y2>` or `<path d="M…">` connecting positioned elements (chip → hub, badge → label, arrow → card) hard-code the endpoint coordinates. If you move an anchor via CSS `top/bottom/left/right`, the SVG endpoint does NOT auto-update — the line dangles past the moved element, still terminating at the OLD coordinate. This bit hub-spoke: chip repositions from `top:320` → `top:400` left 4 SVG lines pointing at the old y=360 endpoint, creating a visual bug where lines shoot into empty space above each chip.
   - **After every CSS edit to `top`/`bottom`/`left`/`right` of a positioned element**, immediately grep the same file: `line|path|x1|y1|x2|y2|"M[0-9]"`. If any SVG connector references the old coordinates, update it.
   - **Template edits are group edits.** Never edit one anchor's position in isolation. Do a full-file sweep for decorations/connectors/glow-shadows referencing the old coordinate. Any of those left behind = visual bug.

11. **Narrative flow between scenes — connectors are HARD, not optional.** Each scene ≥ 2's narration MUST start with a linguistic connector referring backward to the previous scene, so the whole video plays as ONE monologue split by visual cuts, not 7 telegraphic captions read in a row. Without connectors the video sounds like a slide deck being read out — "biên tập ẩu, câu ko liên quan gì tới nhau". Approved connector openings (mix, don't repeat):

    | Scene beat | Sample opening | Bad opening |
    |------------|----------------|-------------|
    | hook (2) | "Lõi của nó là…" / "Điểm khác biệt là…" / "Không chỉ vậy…" | "X là Y" (restart) |
    | problem (3) | "Cụ thể là…" / "Ví dụ như…" / "Tức là…" | "A, B, C. Tất cả xếp theo…" (list-dump) |
    | solution (4) | "Đặc biệt, khác với…" / "Còn cái này thì…" / "Điểm hay là…" | "Khác tool khác, X…" (mid-sentence start) |
    | details (5) | "Cụ thể có ba lớp…" / "Chi tiết là…" / "Cách nó làm là…" | "Ba lớp bảo vệ. X, Y, Z." (fragment) |
    | how (6) | "Còn về cách dùng…" / "Cách chạy thì…" / "Thao tác thì…" | "Cách dùng có ba bước. X, Y, Z." (list-dump) |
    | context (7) | "Toàn bộ thông tin đó thì…" / "Về mặt cấu hình…" | "X nằm trong Y" (restart) |
    | review (8) | "Nhưng lưu ý…" / "Điều cần biết là…" / "Còn về phía…" | "Bạn cần A, B, C, D" (list-dump) |
    | outro (9) | Pain-CTA pattern per outro rule above | URL / repo name |

    Scene 1 doesn't need connector (it's the opener). Each scene should END with a soft trailing clause that hooks the next, not a hard period. Read the whole plan.md `narration` fields in sequence out loud before Gate 2 — if it sounds like 7 disconnected soundbites, regenerate.

12. **Single voice + single provider across all scenes (HARD).** All scenes in one video MUST use the same TTS voice and same TTS provider. Never let scenes 1-8 render on Google Chirp then scene 9 on edge-tts NamMinhNeural — the outro voice change is jarring to the listener. `narrate.py` now fails loud (`unsupported_tts_provider`) if `meta.voice_provider` isn't `edge-tts` OR `meta.voice` contains "chirp" / "hd-", instead of silently substituting a fallback voice. When re-TTS'ing a subset of scenes: verify `meta.voice` matches what generated the OTHER scenes (check ffprobe on an existing mp3 or listen). If mismatch, re-TTS the WHOLE video, not just the changed scene.

13. **NEVER `acrossfade` voice tracks — video xfade only, audio hard-concat with explicit inter-scene silence gap (HARD).** Voice is a narrator monologue. If scene N-1's voice crossfades with scene N's voice, the last words of N-1 overlap the first words of N → "voice tua nhanh cho kịp". Decouple visual and audio timing AND insert breathing silence between scenes:
    - **Video:** for each scene except the last, append `gap_ms` (default 350ms) of freeze-last-frame via `tpad=stop_mode=clone:stop_duration=<gap>`. Then cascaded `xfade` between adjacent extended-videos — visuals blend smoothly, the xfade transition happens INSIDE the freeze zone (so no voice overlap during transition).
    - **Audio:** for each scene except the last, append `gap_ms` of silence via `apad=pad_dur=<gap>`. Then `concat=n=N:v=0:a=1` — hard cut, zero overlap. Scene N-1 voice finishes → silent breath → scene N voice starts. Feels like a narrator inhaling between sentences.
    - **Why the gap is HARD (not optional):** Google Chirp 3 HD TTS outputs mp3s with only ~60ms of leading silence (edge-tts has 200–400ms). Without explicit gap, `silenceremove` "keep 150ms" can't add silence that isn't there → voices concatenate back-to-back with only 120ms breath total → "tua nhanh cho kịp" persists even after removing acrossfade. Empirical: `ffmpeg -af silencedetect=noise=-50dB` on Chirp3 mp3 for scene 2 shows `silence_start: 0, silence_end: 0.0619s` — 62ms. Confirms.
    - **Length math:** audio = `sum(durations) + (N−1)×gap_sec`; video after xfade = `sum(durations) + (N−1)×gap_sec − (N−1)×fade_sec`. Overhang = `(N−1)×fade_sec` — freeze final video frame this much.
    - **Default `gap_ms=350`, tune 250–500ms** depending on pacing. Faster scenes (short beats) → 250ms. Slower reflective scenes → 500ms. Never < 200ms with Chirp3.
    - The whole point: voice runs as one flowing story with natural pauses, visuals cut when they cut. Slight drift is acceptable and human-feeling; audio-video micro-sync is not the goal. **any2video ONLY** — do not retrofit this into other, unrelated video tools.

## Invocation

```
/any2video <url>                       # default: Vietnamese narration + Playwright (motion)
/any2video <github-repo-url>
/any2video "raw text to turn into video"
/any2video <local-image-path>
/any2video <input> --lang en           # English narration (default vi)
/any2video <input> --fast              # static screenshot mode (preview only, motion lost)
/any2video <input> --voice <id>        # override TTS voice (else picked from --lang)
/any2video <input> --duration 60       # target total duration
```

## Language (HARD — default vi)

`--lang` accepts `vi` (default) or `en`. Selection determines:

| Aspect | `vi` (default) | `en` |
|--------|----------------|------|
| Narration text | drafted in Vietnamese | English |
| TTS voice (default) | `vi-VN-Chirp3-HD-Charon` (**male**, Google) | `en-US-Chirp3-HD-Charon` (**male**, Google) |
| Caption overlay text | Vietnamese, with `<span class="kw">`-wrapped keywords highlighted | English equivalent |
| Visual labels (numbers, code, badges) | Stay readable across both (no localization needed) | Same |

**TTS defaults (HARD):** **male voice + Google TTS (Chirp 3 HD)** by default. Set
`meta.voice_provider: google` + a Chirp 3 HD voice; `narrate.py` auto-falls back to
edge-tts (`vi-VN-NamMinhNeural` / `en-US-GuyNeural`, both **male**) only when Google
is unavailable (no `GOOGLE_TTS_API_KEY`). Use a **female** voice ONLY when the user
explicitly asks. Never default to edge-tts when a Google key is present.

Claude in Phase 2 generates `narration` in the chosen language. The planner writes `meta.lang: vi` / `en` in `plan.md`. `narrate.py` selects voice from `meta.voice` if set, else falls back to a language-default.

## Known limits (be honest with user)

- Cost is a normal agent session — Phase 4 injects data into templates (no
  per-scene HTML generation), so it is NOT token-heavy. (The old hand-write-HTML
  design was; this isn't. Runs economically on Claude Code AND Antigravity.)
- 2-5 min wall-clock per video (source fetch + gates + Playwright render + compose)
- Playwright rich render adds 30-90 sec for frame capture
- Bespoke per-video design → slower per clip than a template API; for high-volume
  uniform output a fixed-template generator is the better tool

## See also

- `templates/analysis-schema.md` — Phase 1 contract
- `templates/plan-schema.md` — Phase 2 contract
- `templates/design-tokens.md` — Phase 4 visual language
