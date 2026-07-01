"""Raw text passthrough — stash the input as input.txt for the planner."""
from __future__ import annotations

import json
from pathlib import Path


def extract(text: str, run_dir: Path) -> dict:
    out_path = run_dir / "input.txt"
    out_path.write_text(text, encoding="utf-8")
    return {
        "text_path": str(out_path),
        "char_count": len(text),
        "word_count": len(text.split()),
        "preview": text[:160] + ("..." if len(text) > 160 else ""),
    }


if __name__ == "__main__":
    import argparse
    import sys
    from .. import paths as P

    parser = argparse.ArgumentParser()
    parser.add_argument("text")
    args = parser.parse_args()
    slug = P.slug_for(args.text, "text")
    out = extract(args.text, P.run_dir(slug))
    print(json.dumps(out, indent=2, ensure_ascii=False))
    sys.exit(0)
