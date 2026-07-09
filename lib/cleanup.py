"""Workspace janitor. Video runs pile up (~40 MB each) and fill the disk over time.

The render pipeline already deletes the heaviest intermediates (playwright .webm
recordings + per-scene .muxed.mp4) after a successful compose. What still lingers
per run is `scenes/` (the per-scene .mp4/.mp3/.png/.html/.ass, ~23 MB) plus the
delivered `final.mp4` (~18 MB). And `workspace/scratch/` holds repo clones and
throwaway preview images that are pure garbage once a run is done.

What is SAFE to delete (all regenerable):
  - workspace/scratch/*          repo clones + preview frames  (re-clonable / re-derivable)
  - <run>/scenes/                per-scene render artifacts     (re-render from plan.md)

What is KEPT by `slim` (the source of truth to re-render or reference):
  - final.mp4 (the deliverable) + plan.md + analysis.md + overview.md + caption.txt
    + *.json. A slimmed run can be fully rebuilt: re-run narrate -> render -> compose.

Commands (add --dry-run to any to preview bytes freed, delete nothing):
  python -m lib.cleanup status                    # sizes per run + scratch + total
  python -m lib.cleanup scratch                   # wipe workspace/scratch/*
  python -m lib.cleanup slim <slug>               # drop <run>/scenes/, keep final + sources
  python -m lib.cleanup slim --all --keep-recent 2  # slim every run except the 2 newest
  python -m lib.cleanup nuke <slug>               # delete the whole run dir (final included)
"""
from __future__ import annotations

import argparse
import shutil
import sys
from pathlib import Path

from . import paths

RUNS = paths.RUNS_DIR
SCRATCH = paths.SCRATCH_DIR
# Files/dirs a `slim` keeps; everything else in the run dir is dropped.
KEEP = {"final.mp4", "plan.md", "analysis.md", "overview.md", "caption.txt",
        "source_pack.json", "github_bundle.json", "intake.json", "assets"}


def _bytes(p: Path) -> int:
    if p.is_file():
        return p.stat().st_size
    return sum(f.stat().st_size for f in p.rglob("*") if f.is_file())


def _human(n: int) -> str:
    f = float(n)
    for u in ("B", "KB", "MB", "GB"):
        if f < 1024 or u == "GB":
            return f"{f:.1f}{u}"
        f /= 1024
    return f"{f:.1f}GB"


def _rm(p: Path, dry: bool) -> int:
    n = _bytes(p)
    if not dry:
        if p.is_dir():
            shutil.rmtree(p, ignore_errors=True)
        else:
            p.unlink(missing_ok=True)
    return n


def _runs() -> list[Path]:
    if not RUNS.is_dir():
        return []
    return sorted((d for d in RUNS.iterdir() if d.is_dir()), key=lambda d: d.stat().st_mtime, reverse=True)


def cmd_status() -> int:
    total = 0
    print(f"{'RUN':<40} {'total':>9} {'scenes':>9} {'final':>9}")
    for d in _runs():
        t = _bytes(d); total += t
        sc = _bytes(d / "scenes") if (d / "scenes").is_dir() else 0
        fn = _bytes(d / "final.mp4") if (d / "final.mp4").is_file() else 0
        print(f"{d.name:<40} {_human(t):>9} {_human(sc):>9} {_human(fn):>9}")
    scr = _bytes(SCRATCH) if SCRATCH.is_dir() else 0
    print(f"\nruns total: {_human(total)}  |  scratch: {_human(scr)}  |  workspace: {_human(total + scr)}")
    print(f"reclaimable now: scratch {_human(scr)} + slimming all runs "
          f"{_human(sum(_bytes(d / 'scenes') for d in _runs() if (d / 'scenes').is_dir()))}")
    return 0


def cmd_scratch(dry: bool) -> int:
    if not SCRATCH.is_dir():
        print("no scratch dir"); return 0
    freed = 0
    for child in SCRATCH.iterdir():
        freed += _rm(child, dry)
    print(f"{'[dry-run] would free' if dry else 'freed'} {_human(freed)} from scratch/")
    return 0


def cmd_slim(slug: str | None, all_: bool, keep_recent: int, dry: bool) -> int:
    if all_:
        targets = _runs()[keep_recent:]  # newest `keep_recent` are protected
        if keep_recent:
            print(f"protecting {keep_recent} newest run(s); slimming {len(targets)}")
    else:
        d = RUNS / slug
        if not d.is_dir():
            print(f"run not found: {slug}", file=sys.stderr); return 1
        targets = [d]
    freed = 0
    for d in targets:
        if not (d / "final.mp4").is_file():
            print(f"  skip {d.name} (no final.mp4 yet, would lose work)"); continue
        sc = d / "scenes"
        if sc.is_dir():
            f = _rm(sc, dry); freed += f
            print(f"  {'[dry] ' if dry else ''}{d.name}: drop scenes/ ({_human(f)})")
    print(f"{'[dry-run] would free' if dry else 'freed'} {_human(freed)} total")
    return 0


def cmd_nuke(slug: str, dry: bool) -> int:
    d = RUNS / slug
    if not d.is_dir():
        print(f"run not found: {slug}", file=sys.stderr); return 1
    f = _rm(d, dry)
    print(f"{'[dry-run] would delete' if dry else 'deleted'} run {slug} ({_human(f)})")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(description="any2video workspace janitor")
    ap.add_argument("--dry-run", action="store_true", help="preview bytes freed, delete nothing")
    sub = ap.add_subparsers(dest="cmd", required=True)
    sub.add_parser("status")
    sub.add_parser("scratch")
    s = sub.add_parser("slim")
    s.add_argument("slug", nargs="?")
    s.add_argument("--all", action="store_true")
    s.add_argument("--keep-recent", type=int, default=0)
    n = sub.add_parser("nuke")
    n.add_argument("slug")
    a = ap.parse_args()
    if a.cmd == "status":
        return cmd_status()
    if a.cmd == "scratch":
        return cmd_scratch(a.dry_run)
    if a.cmd == "slim":
        if not a.all and not a.slug:
            print("slim needs a <slug> or --all", file=sys.stderr); return 1
        return cmd_slim(a.slug, a.all, a.keep_recent, a.dry_run)
    if a.cmd == "nuke":
        return cmd_nuke(a.slug, a.dry_run)
    return 1


if __name__ == "__main__":
    sys.exit(main())
