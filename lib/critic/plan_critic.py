"""Plan critic — Phase 2 Gate.

Validates plan.md against the schema + grounding rule:
  - Required fields present
  - duration_sec sums match meta.total_duration_sec (±10%)
  - Scene id=1 present
  - PA1 opening arc (GitHub tours): scene 1 = frame-pain-hero (biggest pain, not a
    title card); ≥4 pain scenes; the reveal card frame-repo-identity sits directly
    before the full-bleed repo-scroll; author-profile scroll + star nudge closes;
    frame-made-with promo (if any) is last
  - Every scene's data_props values appear (verbatim or numerically) in
    analysis.md's "## Evidence" section
  - visual_brief uniqueness: no two scenes share a 5+ consecutive word run

Outputs JSON. Exit 0 = pass, exit 1 = fail (with `issues` list). Claude reads
the issues list and regenerates the failing scene(s) only.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

# Force UTF-8 stdout so unicode chars in issue hints (≥, →, …) don't crash on Windows cp1252
try:
    sys.stdout.reconfigure(encoding="utf-8")  # type: ignore[attr-defined]
    sys.stderr.reconfigure(encoding="utf-8")  # type: ignore[attr-defined]
except (AttributeError, OSError):
    pass

from .. import plan_yaml

VALID_ROLES = {"hook", "problem", "solution", "architecture", "flow", "demo", "cta", "framing", "capability", "honest-caveat", "use-case-landing", "social-proof"}
DURATION_TOLERANCE = 0.10
PHRASE_OVERLAP_THRESHOLD = 5  # words

# Narrative-quality keyword sets (Vietnamese-first; English equivalents listed)
_CONNECTOR_WORDS_VI = {"và", "nhưng", "hay", "mà", "ngay", "này", "cứ", "vẫn", "hoặc", "rồi", "thì", "đó"}
_CONNECTOR_WORDS_EN = {"and", "but", "or", "now", "this", "just", "still", "then", "right"}
_SECOND_PERSON_VI = {"bạn"}
_SECOND_PERSON_EN = {"you", "your"}
_CONTRAST_PATTERNS_VI = [
    r"không chỉ\s+\S+.{0,40}mà còn", r"không chỉ\s+\S+.{0,40}mà", r"cứ như\s+\S+.{0,40}nhưng",
    r"không phải\s+\S+.{0,30}mà là", r"không phải\s+\S+.{0,30}mà",
    r"nhưng lưu ý", r"chứ không phải", r"thay vì",
]
_CONTRAST_PATTERNS_EN = [
    r"not\s+just\b.{0,40}but\b", r"not only\b.{0,40}but\b", r"like\s+\S+\s+but\b",
    r"\bnot\s+\S+\s+but\b", r"instead of\b",
]
_GENERIC_CTA_PATTERNS = [
    r"ghé\s+repo.{0,20}xem", r"ghé\s+link.{0,20}xem", r"hãy\s+xem ngay",
    r"check out the repo", r"visit the repo", r"give it a star and",
]

# English/brand terms that MUST be written PHONETICALLY in narration so TTS reads them
# right (SKILL §2.2.6 d.2). (term_regex, flags, display_term, phonetic). AI is
# case-SENSITIVE (uppercase only) — lowercase "ai" is the Vietnamese word "who".
_PHONETIC_TERMS = [
    (r"\brepo\b", re.IGNORECASE, "repo", "rề pô"),
    (r"\breadme\b", re.IGNORECASE, "README", "ruýt my"),
    (r"\benter\b", re.IGNORECASE, "enter", "en tơ"),
    (r"\bAI\b", 0, "AI", "ây ai"),  # case-sensitive: lowercase "ai" = VN word "who"
    (r"\bAPI\b", re.IGNORECASE, "API", "ây pi ai"),
    (r"\bGPT\b", re.IGNORECASE, "GPT", "gí pi tí"),
    (r"\bgithub\b", re.IGNORECASE, "GitHub", "git hâb"),
    (r"\bffmpeg\b", re.IGNORECASE, "ffmpeg", "ép ép em peg"),
    (r"\bany2video\b", re.IGNORECASE, "any2video", "en ni tu vi đeo"),
]

# Author-profile outro MUST nudge a star (feedback 2026-07-02): "…nếu thấy hay thì
# tặng tác giả một sao làm động lực nhé." Match a star-giving intent, not the
# bare word "sao" (which also means why/how in VN).
_STAR_LINE = re.compile(
    r"(tặng|thả|cho|để lại|một|1)\s*(ngôi\s*)?sao|sao\b.{0,24}(động lực|tác giả|ủng hộ)",
    re.IGNORECASE,
)

# github.com/<owner>/<repo> repo-scroll footage vs github.com/<owner> profile scroll.
_RE_REPO_SCROLL = re.compile(r"https?://github\.com/[^/\s]+/[^/\s]+/?$", re.IGNORECASE)
_RE_PROFILE_SCROLL = re.compile(r"https?://github\.com/[^/\s]+/?$", re.IGNORECASE)


def _template_of(scene: dict) -> str:
    return (scene.get("templateId") or scene.get("template_id") or "").lower()


def load_plan(path: Path) -> dict:
    return plan_yaml.load_plan(path)


def load_evidence(analysis_path: Path) -> str:
    """Extract everything under '## Evidence' to end of file."""
    text = analysis_path.read_text(encoding="utf-8")
    m = re.search(r"^##\s+Evidence\s*$", text, re.MULTILINE | re.IGNORECASE)
    if not m:
        return ""
    return text[m.end():]


def check(plan_path: Path, analysis_path: Path | None) -> dict:
    issues: list[dict] = []
    plan = load_plan(plan_path)

    meta = plan.get("meta") or {}
    for key in ("slug", "voice"):
        if not meta.get(key):
            issues.append({"kind": "meta_missing", "field": key})

    scenes = plan.get("scenes") or []
    if not scenes:
        issues.append({"kind": "no_scenes"})
        return {"pass": False, "issues": issues}

    # Hook (id 1 only)
    s1 = scenes[0]
    if s1.get("id") != 1:
        issues.append({"kind": "hook_id_not_1", "got": s1.get("id")})

    # Per-scene structural checks (accept either legacy `role` or new `beat`)
    for idx, s in enumerate(scenes):
        sid = s.get("id")
        for field in ("duration_sec", "narration", "visual_brief"):
            if not s.get(field):
                issues.append({"kind": "scene_missing_field", "scene_id": sid, "field": field})
        beat_or_role = s.get("beat") or s.get("role")
        if not beat_or_role:
            issues.append({"kind": "scene_missing_field", "scene_id": sid, "field": "beat"})
        d = s.get("duration_sec") or 0
        if not (2 <= d <= 14):
            issues.append({"kind": "duration_out_of_range", "scene_id": sid, "got": d})

    # Total duration vs target
    target = meta.get("total_duration_sec")
    actual = sum(s.get("duration_sec", 0) for s in scenes)
    if target and abs(actual - target) > target * DURATION_TOLERANCE:
        issues.append({
            "kind": "total_duration_drift",
            "target": target,
            "actual": actual,
            "tolerance_pct": DURATION_TOLERANCE * 100,
        })

    # ──────────── OPENING + OUTRO ARC (SKILL §2.2.5 / §2.2.7 — HARD) ────────────
    source_type = (meta.get("source_type") or "").lower()
    source_url = str(meta.get("source") or meta.get("source_url") or "")
    is_github = (source_type in ("github_repo", "github")
                 or bool(re.search(r"github\.com/[^/\s]+/[^/\s]+", source_url)))

    # frame-statement-outro (white card / red text) is banned everywhere.
    for s in scenes:
        tpl = (s.get("templateId") or s.get("template_id") or "").lower()
        if tpl == "frame-statement-outro":
            issues.append({
                "kind": "banned_outro_template",
                "scene_id": s.get("id"),
                "hint": "frame-statement-outro (white card / red text) is banned. Close on "
                        "author-profile scroll footage: set capture_url to https://github.com/<owner>.",
            })

    # Promo bumper (frame-made-with), when present, MUST be the final scene.
    promo_idxs = [i for i, s in enumerate(scenes)
                  if (s.get("templateId") or s.get("template_id") or "").lower() == "frame-made-with"]
    if promo_idxs and promo_idxs[-1] != len(scenes) - 1:
        issues.append({
            "kind": "promo_not_last",
            "scene_id": scenes[promo_idxs[-1]].get("id"),
            "hint": "The frame-made-with promo bumper must be the FINAL scene (after the author-profile outro).",
        })
    # The closing CONTENT scene = last scene that is NOT the promo bumper.
    content_idxs = [i for i in range(len(scenes)) if i not in promo_idxs]
    closing = scenes[content_idxs[-1]] if content_idxs else scenes[-1]

    if is_github:
        # PA1 opening arc — open on the BIGGEST PAIN (frame-pain-hero), NOT a title
        # card. The first seconds decide retention: a pain the viewer feels beats a
        # repo slug they can't parse. The identity card is the REVEAL later, not the intro.
        s1_tpl = _template_of(s1)
        if s1_tpl != "frame-pain-hero":
            issues.append({
                "kind": "opening_not_pain_hero",
                "scene_id": s1.get("id"),
                "got": s1_tpl or None,
                "hint": "Scene 1 of a GitHub tour must be the pain opener templateId frame-pain-hero "
                        "(biggest pain, full-bleed, subtle github context chip). SKILL §2.2.5.",
            })

        # First FULL repo-scroll scene (capture_url = github.com/<owner>/<repo>).
        scroll_idx = next((i for i, s in enumerate(scenes)
                           if _RE_REPO_SCROLL.match((s.get("capture_url") or "").strip())), None)
        if scroll_idx is None:
            issues.append({
                "kind": "missing_repo_scroll",
                "hint": "After the pain scenes + the reveal card, add a FULL-BLEED repo-scroll scene: "
                        "capture_url = https://github.com/<owner>/<repo>.",
            })
        else:
            # The REVEAL/overview (frame-repo-identity) sits DIRECTLY before the scroll —
            # the pivot 'thì repo này giúp bạn'. Its social-proof row is CONDITIONAL
            # (popular repo → stars/forks; new repo → 'mới ra mắt' tag), so stats are
            # never required — only the identity card's presence at the pivot is.
            reveal_idx = scroll_idx - 1
            reveal_tpl = _template_of(scenes[reveal_idx]) if reveal_idx >= 0 else ""
            if reveal_tpl != "frame-repo-identity":
                issues.append({
                    "kind": "reveal_not_before_scroll",
                    "scene_id": scenes[reveal_idx].get("id") if reveal_idx >= 0 else None,
                    "got": reveal_tpl or None,
                    "hint": "The scene immediately BEFORE the repo-scroll must be the reveal card "
                            "frame-repo-identity (avatar + owner/repo + conditional stars/forks). PA1 pivot.",
                })
            # Pain scenes = everything before the reveal. Need ≥4, all frame-pain-hero
            # so every pain scene carries the github context chip (real-tool watermark).
            pain_scenes = scenes[0:reveal_idx] if reveal_idx > 0 else []
            if len(pain_scenes) < 4:
                issues.append({
                    "kind": "too_few_pain_blocks",
                    "found": len(pain_scenes),
                    "minimum": 4,
                    "hint": "List ≥4 pain-scene blocks before the reveal (highlight-as-spoken) so the "
                            "opening is dynamic. SKILL §2.2.5.",
                })
            for ps in pain_scenes:
                if _template_of(ps) != "frame-pain-hero":
                    issues.append({
                        "kind": "pain_scene_wrong_template",
                        "scene_id": ps.get("id"),
                        "got": _template_of(ps) or None,
                        "hint": "Every pain scene before the reveal must use frame-pain-hero so it carries "
                                "the github context chip (owner avatar + owner/repo). PA1.",
                    })

        # Closing content scene = author profile scroll (github.com/<owner>, NO /repo).
        cap = (closing.get("capture_url") or "").strip()
        if not _RE_PROFILE_SCROLL.match(cap):
            issues.append({
                "kind": "outro_not_author_profile",
                "scene_id": closing.get("id"),
                "got": cap or None,
                "hint": "The closing content scene MUST be the author's profile scroll: capture_url = "
                        "https://github.com/<owner> (profile root, NO /repo).",
            })
        elif not _STAR_LINE.search(closing.get("narration") or ""):
            issues.append({
                "kind": "outro_missing_star_line",
                "scene_id": closing.get("id"),
                "hint": "End the author-profile narration with a star nudge, e.g. "
                        "'…nếu thấy hay thì tặng tác giả một sao làm động lực nhé.'",
            })

    # Name casing: owner/repo must be shown EXACTLY as the author wrote them
    # (never uppercased / title-cased). Verifiable against the source URL.
    m = re.search(r"github\.com/([^/\s]+)/([^/\s?#]+)", source_url)
    if m:
        c_owner = m.group(1)
        c_repo = re.sub(r"\.git$", "", m.group(2).rstrip("/"))
        for s in scenes:
            inp = s.get("inputs") or {}
            for slot, canon in (("owner", c_owner), ("repo", c_repo)):
                val = inp.get(slot)
                if isinstance(val, str) and val and val.lower() == canon.lower() and val != canon:
                    issues.append({
                        "kind": "name_casing_changed",
                        "scene_id": s.get("id"),
                        "slot": slot,
                        "got": val,
                        "expected": canon,
                        "hint": f"Show '{slot}' EXACTLY as the author wrote it: '{canon}', not '{val}'. "
                                "Never uppercase/title-case a repo/owner name (respect the author).",
                    })

    # Grounding: every data_props value present in Evidence
    if analysis_path and analysis_path.is_file():
        evidence = load_evidence(analysis_path).lower()
        if not evidence.strip():
            issues.append({"kind": "evidence_section_missing", "analysis_path": str(analysis_path)})
        else:
            for s in scenes:
                sid = s.get("id")
                for k, v in (s.get("data_props") or {}).items():
                    if not _value_in_evidence(v, evidence):
                        issues.append({
                            "kind": "data_prop_ungrounded",
                            "scene_id": sid,
                            "key": k,
                            "value": str(v)[:80],
                        })

    # Visual brief uniqueness
    briefs = [(s.get("id"), _normalize(s.get("visual_brief") or "")) for s in scenes]
    for i, (id_i, b_i) in enumerate(briefs):
        for j, (id_j, b_j) in enumerate(briefs):
            if i >= j:
                continue
            if _has_phrase_overlap(b_i, b_j, PHRASE_OVERLAP_THRESHOLD):
                issues.append({
                    "kind": "visual_brief_repetition",
                    "scene_ids": [id_i, id_j],
                    "min_overlap_words": PHRASE_OVERLAP_THRESHOLD,
                })

    # ──────────── NARRATIVE CRAFT CHECKS (SKILL.md 2.4) ────────────
    lang = (meta.get("lang") or "vi").lower()
    connectors = _CONNECTOR_WORDS_VI if lang == "vi" else _CONNECTOR_WORDS_EN
    second_person = _SECOND_PERSON_VI if lang == "vi" else _SECOND_PERSON_EN
    contrast_patterns = _CONTRAST_PATTERNS_VI if lang == "vi" else _CONTRAST_PATTERNS_EN

    full_narration = " ".join((s.get("narration") or "") for s in scenes).lower()

    # 2nd-person presence (across whole video)
    if not any(re.search(rf"\b{re.escape(w)}\b", full_narration) for w in second_person):
        issues.append({
            "kind": "narrative_no_second_person",
            "hint": f"At least one scene must address the viewer with {sorted(second_person)}.",
        })

    # Contrast structures (≥2 scenes)
    contrast_hits = 0
    for s in scenes:
        n = (s.get("narration") or "").lower()
        if any(re.search(p, n) for p in contrast_patterns):
            contrast_hits += 1
    if contrast_hits < 2:
        issues.append({
            "kind": "narrative_low_contrast",
            "found": contrast_hits,
            "minimum": 2,
            "hint": "Use 'không chỉ X mà còn Y' / 'cứ như X nhưng có Y' / 'không phải X mà là Y' in ≥2 scenes.",
        })

    # Generic CTA (auto-fail)
    for s in scenes:
        n = (s.get("narration") or "").lower()
        for p in _GENERIC_CTA_PATTERNS:
            if re.search(p, n):
                issues.append({
                    "kind": "narrative_generic_cta",
                    "scene_id": s.get("id"),
                    "matched_pattern": p,
                    "hint": "Land on a SPECIFIC viewer scenario instead of 'ghé repo xem thử'.",
                })

    # Per-scene narrative checks
    for s in scenes:
        sid = s.get("id")
        n = (s.get("narration") or "")
        # include beat texts so beat-split scenes are checked too
        _beats = s.get("beats")
        if isinstance(_beats, list):
            n = n + " " + " ".join((b.get("text") if isinstance(b, dict) else str(b)) or "" for b in _beats)
        n_lower = n.lower()
        words = re.findall(r"\S+", n)

        # Raw English/brand terms that TTS will mispronounce → must be phonetic.
        for pat, flags, term, phon in _PHONETIC_TERMS:
            if re.search(pat, n, flags):
                issues.append({
                    "kind": "narration_needs_phonetic",
                    "scene_id": sid,
                    "term": term,
                    "suggest": phon,
                    "hint": f"Write '{term}' phonetically in the READ narration so TTS says it "
                            f"right: '{phon}' (the display inputs keep '{term}'). SKILL §2.2.6 d.2.",
                })

        # Telegraphic fragments: ≥3 sentences AND avg sentence length < 5 words
        sentences = [seg.strip() for seg in re.split(r"[.!?]", n) if seg.strip()]
        if len(sentences) >= 3:
            avg_words = sum(len(seg.split()) for seg in sentences) / len(sentences)
            if avg_words < 5:
                issues.append({
                    "kind": "narrative_telegraphic_fragments",
                    "scene_id": sid,
                    "sentences": len(sentences),
                    "avg_words_per_sentence": round(avg_words, 1),
                    "hint": "Sentences too choppy. Connect with conjunctions; one breath instead of fragments.",
                })

        # Connector presence per scene (≥1 connector)
        if words and not any(re.search(rf"\b{re.escape(c)}\b", n_lower) for c in connectors):
            issues.append({
                "kind": "narrative_no_connector",
                "scene_id": sid,
                "hint": f"Add ≥1 connector ({sorted(connectors)[:5]}) so the sentence flows.",
            })

    return {
        "pass": len(issues) == 0,
        "scene_count": len(scenes),
        "total_duration_sec": actual,
        "target_duration_sec": target,
        "issues": issues,
    }


def _value_in_evidence(value, evidence: str) -> bool:
    """Match value (scalar or list) in lower-cased evidence text.
    Numbers match with or without thousands separators."""
    if isinstance(value, list):
        return all(_value_in_evidence(v, evidence) for v in value)
    if isinstance(value, dict):
        return all(_value_in_evidence(v, evidence) for v in value.values())
    s = str(value).strip().lower()
    if not s:
        return True
    if s in evidence:
        return True
    # Numeric tolerance: also try without thousand separators
    digits = re.sub(r"[,\s_]", "", s)
    if digits.isdigit() and digits in re.sub(r"[,\s_]", "", evidence):
        return True
    return False


def _normalize(text: str) -> list[str]:
    return re.findall(r"[a-zA-Z0-9]+", text.lower())


def _has_phrase_overlap(a: list[str], b: list[str], min_len: int) -> bool:
    if len(a) < min_len or len(b) < min_len:
        return False
    b_set = {tuple(b[i:i + min_len]) for i in range(len(b) - min_len + 1)}
    for i in range(len(a) - min_len + 1):
        if tuple(a[i:i + min_len]) in b_set:
            return True
    return False


def main() -> int:
    parser = argparse.ArgumentParser(description="Phase 2 critic — validate plan.md")
    parser.add_argument("plan", help="Path to plan.md")
    parser.add_argument("--analysis", help="Path to analysis.md for grounding check")
    args = parser.parse_args()

    plan_path = Path(args.plan).resolve()
    if not plan_path.is_file():
        print(json.dumps({"error": "plan_not_found", "path": str(plan_path)}), file=sys.stderr)
        return 2

    analysis_path = Path(args.analysis).resolve() if args.analysis else None
    result = check(plan_path, analysis_path)
    print(json.dumps(result, indent=2, ensure_ascii=False))
    return 0 if result["pass"] else 1


if __name__ == "__main__":
    sys.exit(main())
