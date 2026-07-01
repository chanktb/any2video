# analysis.md — Phase 1 output contract

Fixed structure. Phase 2 planner relies on these section names being exact.

```markdown
# Analysis: <slug>

> Source: <input type> — <input identifier>
> Generated: <leave blank, no Date.now in skills>

## Problem
What problem does this solve? Who has it? Why does it matter?

- Bullet points, concrete.
- No marketing fluff. State the pain.
- 2-4 bullets.

## Solution
What's the approach? What's novel? How is it different from alternatives?

- 2-4 bullets.
- Name the specific mechanism, not "uses AI" or "smart algorithm."

## Architecture
Key components and how they fit together.

- Component → role → connects to
- For repos: name the actual files/modules (cite path)
- For articles: name the actual entities/systems described

## Flow
End-to-end workflow: trigger → steps → output.

1. Step 1 (what triggers it)
2. Step 2 (the actual transformation)
3. ...
4. Step N (final state)

## How to use
Concrete usage steps. Copy-pasteable when possible.

- Install / setup
- Invoke / call
- Configure / customize

## Why it matters
Audience, impact, what differentiates this from doing nothing or using alternatives.

- 2-3 sentences max. Sharp.

## Evidence
Proof for every claim above. This is what the critic gate checks.

- **<claim from Problem/Solution/etc>** — citation. For a **repo, code claims MUST cite a
  source file** (`path/to/file.ext:symbol` or line), NOT a README sentence. README excerpts
  are OK only for the author's declared *intent*, never for how it works / what it does.
- Include at least: the real flow (file-cited), **one non-obvious "weapon"** (the clever
  mechanism — file-cited), and **one honest caveat / limit** (TODO / hardcoded assumption /
  narrow scope — file-cited).
- Repeat for every non-trivial claim. If you can't cite it, remove the claim.
```

## Rules

- **Section names exact.** Phase 2 parser greps `## Problem`, `## Solution`, etc.
- **Read the code, not just the README (HARD).** The README is the author's pitch. For a
  repo, open the entry point + 3–7 core files and trace the real flow before writing this.
  An analysis whose Evidence is all README quotes is rejected — re-read the source (SKILL §1.1).
- **Cross-check the README against the code.** If the README claims "supports X" and no code
  does X, drop it. Never repeat an unverified boast.
- **Evidence is mandatory.** Empty Evidence = Gate 1 fails = regenerate.
- **No invention.** Don't state a number or capability you didn't see in code or a cited source.
- **No marketing words.** "revolutionary," "game-changer," "powerful" → strip.
- **Concrete > abstract.** "Reads `index.ts` and dispatches to `handlers/`" beats "intelligent routing."
