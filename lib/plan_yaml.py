"""Plan YAML I/O — defends against PyYAML's YAML-1.1 sexagesimal trap.

`aspect: 9:16` is parsed by SafeLoader as a sexagesimal int (9*60 + 16 = 556).
We normalize on load (reverse-extract if it looks like an aspect ratio) and
force-quote string fields on save.

Both plan_critic.py and narrate.py go through these helpers — never call
yaml.safe_load / yaml.safe_dump on plan.md directly.
"""
from __future__ import annotations

from pathlib import Path

import yaml

STRING_META_FIELDS = ("slug", "source_type", "source", "voice", "theme_hint", "aspect")


def load_plan(path: Path) -> dict:
    plan = yaml.safe_load(path.read_text(encoding="utf-8")) or {}
    _normalize_in_place(plan)
    return plan


def save_plan(plan: dict, path: Path) -> None:
    # Coerce known string fields to actual strings so we don't re-trigger sexagesimal
    meta = plan.get("meta") or {}
    for k in STRING_META_FIELDS:
        if k in meta and meta[k] is not None and not isinstance(meta[k], str):
            meta[k] = _coerce_to_str(meta[k])
    path.write_text(
        yaml.safe_dump(plan, sort_keys=False, allow_unicode=True, width=120, default_flow_style=False),
        encoding="utf-8",
    )


def _normalize_in_place(plan: dict) -> None:
    meta = plan.get("meta")
    if not isinstance(meta, dict):
        return
    aspect = meta.get("aspect")
    if isinstance(aspect, int):
        # 9:16 → 556, 4:5 → 245, 16:9 → 969, 1:1 → 61
        meta["aspect"] = _int_to_sexagesimal(aspect)


def _int_to_sexagesimal(n: int) -> str:
    """Reverse 9*60+16=556 → "9:16". Returns str(n) if not decomposable."""
    if n <= 0:
        return str(n)
    parts: list[str] = []
    x = n
    while x > 0:
        parts.insert(0, str(x % 60))
        x //= 60
    return ":".join(parts)


def _coerce_to_str(v) -> str:
    if isinstance(v, int):
        return _int_to_sexagesimal(v)
    return str(v)
