"""SFX selector — pick a sound effect per scene via 3-tier semantic rules.

Pattern: a level-keyed SFX selector — per-beat reveal ticks / boundary stings.
Bundled SFX: <repo>/skill/templates/sfx/*.mp3

Tier 1: Explicit per-scene override (scene.sfx in plan.md)
Tier 2: Keyword match in Vietnamese narration (cảnh báo / thành công / tiết lộ / ...)
Tier 3: Default by beat (intro→intro_chime, outro→outro_stinger, else→transition_whoosh)

Output is deterministic — same scene config always picks same SFX (no hash randomness
needed here since each category has only one bundled clip).
"""
from __future__ import annotations

import re
from pathlib import Path

from .. import paths
SFX_DIR = paths.TEMPLATES_DIR / "sfx"

# Per-category defaults: filename + volume + start offset within scene
CATEGORIES = {
    "intro":      {"file": "intro_chime.mp3",       "volume": 0.55, "start_offset_sec": 0.0},
    "transition": {"file": "transition_whoosh.mp3", "volume": 0.35, "start_offset_sec": 0.0},
    "reveal":     {"file": "reveal_sting.mp3",      "volume": 0.60, "start_offset_sec": 0.05},
    "outro":      {"file": "outro_stinger.mp3",     "volume": 0.65, "start_offset_sec": 0.0},
    "alert":      {"file": "alert_warning.mp3",     "volume": 0.70, "start_offset_sec": 0.0},
    "success":    {"file": "success_ding.mp3",      "volume": 0.55, "start_offset_sec": 0.05},
}

# Vietnamese keyword → category. Lowercased substring match.
KEYWORD_RULES_VI = [
    ("alert",   ["cảnh báo", "lưu ý", "rủi ro", "nguy hiểm", "cẩn thận"]),
    ("success", ["thành công", "kỷ lục", "đột phá", "chiến thắng", "đạt"]),
    ("reveal",  ["tiết lộ", "ra mắt", "công bố", "giới thiệu", "khám phá",
                 "hùng vĩ", "hoành tráng", "cinematic"]),
]
KEYWORD_RULES_EN = [
    ("alert",   ["warning", "danger", "caution", "alert", "watch out"]),
    ("success", ["success", "record", "breakthrough", "achievement", "won"]),
    ("reveal",  ["reveal", "unveil", "introduce", "discover", "behold",
                 "cinematic", "epic", "stunning"]),
]


def select_sfx(scene: dict, beat: str, lang: str = "vi", scene_index: int = 0) -> dict | None:
    """Return {file, volume, start_offset_sec} for this scene, or None to skip.

    Args:
      scene: plan.md scene dict (may have explicit `sfx` override)
      beat: scene.beat string (intro / hook / problem / solution / details / review / outro)
      lang: 'vi' or 'en' for keyword rules
      scene_index: 0-based index in scenes array (used to suppress transition on scene 0)
    """
    # Tier 1: explicit override
    explicit = scene.get("sfx")
    if explicit:
        fname = explicit.get("name") or explicit.get("file")
        if fname:
            return {
                "file": fname if fname.endswith(".mp3") else f"{fname}.mp3",
                "volume": explicit.get("volume", 0.6),
                "start_offset_sec": explicit.get("start_offset_sec", 0.0),
                "tier": 1,
                "source": "explicit",
            }

    # Tier 2: keyword match in narration
    narration = (scene.get("narration") or "").lower()
    rules = KEYWORD_RULES_VI if lang == "vi" else KEYWORD_RULES_EN
    for category, keywords in rules:
        if any(k in narration for k in keywords):
            cfg = CATEGORIES[category].copy()
            cfg.update({"tier": 2, "source": f"keyword:{category}"})
            return cfg

    # Tier 3: beat default
    beat = (beat or "").lower()
    if beat == "intro":
        cfg = CATEGORIES["intro"].copy()
        cfg.update({"tier": 3, "source": "beat:intro"})
        return cfg
    if beat == "outro":
        cfg = CATEGORIES["outro"].copy()
        cfg.update({"tier": 3, "source": "beat:outro"})
        return cfg
    # Skip transition whoosh on scene 0 (intro had its own SFX; don't double-stack)
    if scene_index == 0:
        return None
    cfg = CATEGORIES["transition"].copy()
    cfg.update({"tier": 3, "source": "beat:transition"})
    return cfg


def absolute_sfx_path(filename: str) -> Path:
    """Resolve filename → absolute path under templates/sfx/."""
    return SFX_DIR / filename


def select_all(plan: dict) -> list[dict]:
    """Run the selector over every scene. Returns list of {scene_id, sfx | None}."""
    lang = (plan.get("meta", {}).get("lang") or "vi").lower()
    scenes = plan.get("scenes") or []
    out = []
    for i, s in enumerate(scenes):
        sfx = select_sfx(s, s.get("beat") or s.get("role"), lang=lang, scene_index=i)
        if sfx:
            sfx["path"] = str(absolute_sfx_path(sfx["file"]))
        out.append({"scene_id": s.get("id"), "sfx": sfx})
    return out


if __name__ == "__main__":
    import argparse
    import json
    import sys
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except (AttributeError, OSError):
        pass
    from .. import plan_yaml

    parser = argparse.ArgumentParser(description="SFX selector — preview what SFX each scene gets")
    parser.add_argument("plan", help="Path to plan.md")
    args = parser.parse_args()
    plan = plan_yaml.load_plan(Path(args.plan).resolve())
    print(json.dumps(select_all(plan), indent=2, ensure_ascii=False))
