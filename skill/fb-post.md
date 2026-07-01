# fb-post — optional Facebook intro post from a run's `analysis.md`

Once a run's `analysis.md` exists (Phase 1), the repo is already deeply understood — the
same understanding that drives the video. This sub-skill turns it into a short, **detailed**
Facebook post that introduces the repo. It is agent-driven (no CLI): write the post, save it
to `workspace/runs/<slug>/fb-post.md`.

## When to use

- The user says "viết fb post cho repo này", "làm bài fb giới thiệu repo", "viết post
  facebook" (after, or instead of, the video), or asks for a repo-intro post.
- **Reuse the SAME `analysis.md`** — do NOT re-analyze the repo. Every claim comes from there.

## Voice — GENERIC introducer, NOT the author (HARD)

- Write as a **neutral person introducing / sharing** the repo — NOT as its author. Never
  claim "mình làm cái này", never sign with a name, no personal brand or identity.
- The post must be **reusable for any repo**, so it can't be tied to one person. Keep it
  neutral and reader-facing: address readers as **"các bạn" / "ai cần"**. If you use "mình"
  at all, only as a neutral sharer ("mình thấy repo này hay") — never as the author.
- Register: friendly, humble, plain-spoken. Sounds like a person sharing something useful,
  not a marketing account.

## Format rules (HARD — restated so this stands alone)

- **Every paragraph ≤ 2 lines** (~140 chars, i.e. 2 lines on FB mobile). One idea that needs
  3 lines → split into two paragraphs.
- **A blank line between every paragraph** (`\n\n`) — FB shows one empty line, easy to read.
- **NO em-dash `—` / en-dash `–`** anywhere. Use comma, period, newline, colon, or ( ).
  A hyphen inside a technical name (`claude-code`, `nail-supply`) stays.
- **Icon restraint:** 3–5 total per post, NEVER at the start of a paragraph. OK: 👉 📦 🛠 💬 🤝.
  Avoid 🔥 💯 🚀 ✨ 🌟 ⭐.
- **Keep technical terms — don't force-translate jargon** (`repo`, `commit`, `endpoint`,
  `keyword`, `prompt`, `pull request`, `API`… stay in their usual form; see SKILL §2.2.6 f).
- **No hashtags.** **No link in the body** — write "link dưới comment 👇"; the actual link
  goes in the first comment (FB downranks posts with links in the body).
- **No superlatives / oversell** ("tốt nhất", "đỉnh nhất", "revolutionary", "must-have",
  "thay đổi cuộc chơi"). Stay humble; include one small honest caveat.

## Length + structure (~200–350 words — a detailed intro)

Longer than a quick status because the point is to introduce the repo in DETAIL. Aim for
8–12 short paragraphs, each ≤ 2 lines, blank line between:

1. **Intro / hook** (1 para): open on the pain or the one-line value — who this helps.
2. **What it is + the problem** (1–2 paras): from `analysis.md` `## Problem` + `## Solution`.
3. **How it works + 2–3 real "weapons"** (2–3 paras): the concrete, non-obvious mechanisms
   from `## Architecture` / `## Flow` / Evidence. Name real files, commands, terms.
4. **How to use** (1 para): the actual install / invoke (`git clone`, `pip install -e`, run a
   command) — 1–2 lines.
5. **Honest note + who it's for / who can skip** (1 para): a real limit from the analysis,
   plus "ai đang gặp vấn đề X thì xem, ai đã có solution rồi thì cứ bỏ qua".
6. **Outro + soft CTA** (1 para): a calm close + "link repo dưới comment, thấy hữu ích thì
   star giúp, có bug hay ý tưởng thì mở issue hoặc comment".

## Grounding

Pull ONLY from `analysis.md` (already grounded in the code). Don't invent features or numbers.
Carry the same honest caveat the analysis found. If a fact isn't in `analysis.md`, don't
claim it.

## Output

- Save the finished post to `workspace/runs/<slug>/fb-post.md`, inside a fenced code block so
  it copies cleanly, followed by a 1–2 line note: which screenshot to attach, and the repo
  link to paste as the first comment.
- **Self-check before shipping:** every paragraph ≤ 2 lines? zero em-dash? blank line between
  paragraphs? icons ≤ 5 and none at a paragraph start? generic voice (no authorship, no name)?
  technical terms kept (not force-translated)? honest caveat + a "ai cần / ai bỏ qua" line?
  soft CTA + "link dưới comment"? no hashtags, no link in the body?

## Mini example (tone reference — generic voice, using this repo)

```
Nếu các bạn hay phải làm video giới thiệu repo mà ngại ngồi edit, thì đây là một repo đáng xem.

any2video biến một repo GitHub thành video dọc 9:16 có lồng tiếng, chỉ với một câu lệnh.

Nó tự đọc code trong repo, viết kịch bản, rồi dựng từng cảnh từ template có sẵn.

Điểm hay là mỗi cảnh đều đi qua một cổng kiểm tra trước khi render.

Cổng đó bắt các lỗi như chữ tràn khung, dấu tiếng Việt bị cắt, hay block trống, nên hiếm khi ra frame lỗi.

Nó cũng đọc thẳng code chứ không chỉ đọc README, nên phần giới thiệu bám đúng những gì repo thật sự làm.

Cách dùng khá gọn, clone repo về rồi chạy một lệnh init là bắt đầu.

Lưu ý nhỏ, repo hợp với người quen chạy lệnh terminal, ai muốn bấm nút hoàn toàn thì có thể chưa hợp.

Ai đang cần làm nhiều video kiểu review repo thì thử xem, ai đã có quy trình riêng rồi thì cứ bỏ qua 👉

Link repo dưới comment, thấy hữu ích thì star giúp, có bug hay ý tưởng thì mở issue nhé.
```
