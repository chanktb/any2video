"""Source router — detect input type, dispatch to extractor, write source_pack.json.

Usage:
    python -m any2video.lib.sources.router <input> [--out <run_dir>]

Returns JSON describing what was extracted + where it lives, for Claude to read.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

from .. import paths as P

_GH_RE = re.compile(r"^https?://(?:www\.)?github\.com/[^/\s]+/[^/\s#?]+", re.IGNORECASE)
_URL_RE = re.compile(r"^https?://", re.IGNORECASE)
_IMG_EXT = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp", ".tiff"}


def detect_type(source: str) -> str:
    """Detect source type from raw input string."""
    s = source.strip()
    if _GH_RE.match(s):
        return "github_repo"
    if _URL_RE.match(s):
        return "article"
    p = Path(s)
    if p.exists() and p.suffix.lower() in _IMG_EXT:
        return "image"
    return "text"


def dispatch(source: str) -> dict:
    """Detect + run the right extractor; return a source_pack dict."""
    stype = detect_type(source)
    slug = P.slug_for(source, stype)
    run = P.run_dir(slug, create=True)

    pack: dict = {
        "source": source,
        "source_type": stype,
        "slug": slug,
        "run_dir": str(run),
    }

    if stype == "github_repo":
        from . import github_deep
        pack["extract"] = github_deep.extract(source, P.scratch_dir(slug), run)
    elif stype == "article":
        from . import article_fetch
        pack["extract"] = article_fetch.extract(source, run)
    elif stype == "image":
        from . import image_meta
        pack["extract"] = image_meta.extract(source, run)
    else:
        from . import text_input
        pack["extract"] = text_input.extract(source, run)

    pack_path = run / "source_pack.json"
    pack_path.write_text(json.dumps(pack, indent=2, ensure_ascii=False), encoding="utf-8")
    pack["pack_path"] = str(pack_path)
    return pack


def main() -> int:
    parser = argparse.ArgumentParser(description="Detect input type, extract source, write source_pack.json")
    parser.add_argument("source", help="URL, file path, or raw text")
    args = parser.parse_args()

    try:
        pack = dispatch(args.source)
    except Exception as e:
        print(json.dumps({"error": str(e), "type": type(e).__name__}), file=sys.stderr)
        return 1

    print(json.dumps(pack, indent=2, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
