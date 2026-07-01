"""Image input — copy into run_dir and emit metadata for Claude vision.

The actual vision description happens at Claude orchestration layer (Claude reads
the image directly via its multimodal capability). This module just stages the
file + emits dimensions/format so the planner knows what it's working with.
"""
from __future__ import annotations

import json
import shutil
from pathlib import Path

from PIL import Image


def extract(image_path: str, run_dir: Path) -> dict:
    src = Path(image_path)
    if not src.exists():
        return {"error": "file_not_found", "path": image_path}

    dest = run_dir / ("input" + src.suffix.lower())
    shutil.copyfile(src, dest)

    try:
        with Image.open(dest) as im:
            width, height = im.size
            mode = im.mode
            fmt = im.format
    except Exception as e:
        return {"error": "image_open_failed", "detail": str(e)}

    return {
        "image_path": str(dest),
        "original_path": str(src),
        "width": width,
        "height": height,
        "mode": mode,
        "format": fmt,
        "aspect": round(width / height, 3) if height else None,
        "note": "Claude reads this image directly for description/OCR via multimodal capability.",
    }


if __name__ == "__main__":
    import argparse
    import sys
    from .. import paths as P

    parser = argparse.ArgumentParser()
    parser.add_argument("path")
    args = parser.parse_args()
    slug = P.slug_for(args.path, "image")
    out = extract(args.path, P.run_dir(slug))
    print(json.dumps(out, indent=2, ensure_ascii=False))
    sys.exit(0 if "error" not in out else 1)
