"""GitHub repo deep extractor.

Shallow-clones a repo, walks the tree (depth 3), detects stack, picks 3-5 core files,
fetches the README + recent commits. Output goes to scratch_dir/repo/ + a summary
JSON returned to Claude.

Deep by design: instead of a shallow README-only fetch (~2 KB of context), we
pull the tree + core files + README + recent commits (~15-40 KB depending on
repo size) so the narrative is grounded in what the repo actually does.
"""
from __future__ import annotations

import json
import os
import re
import subprocess
from pathlib import Path

_REPO_RE = re.compile(r"^https?://(?:www\.)?github\.com/([^/\s]+)/([^/\s#?]+)", re.IGNORECASE)

# Files that signal the project's stack — read these first
STACK_FILES = [
    "package.json", "pyproject.toml", "requirements.txt", "Pipfile",
    "go.mod", "Cargo.toml", "pom.xml", "build.gradle", "Gemfile",
    "composer.json", "Dockerfile", "deno.json", "bun.lockb",
]
# Doc files to read for "how does this work" understanding
DOC_FILES = [
    "README.md", "README.rst", "README", "ARCHITECTURE.md",
    "DESIGN.md", "DECISIONS.md", "CONTRIBUTING.md",
]
# Likely entry points by language
ENTRY_HINTS = [
    "src/index.ts", "src/index.js", "src/main.ts", "src/main.py",
    "main.go", "main.rs", "src/main.rs", "src/app.py", "app.py",
    "index.html", "src/App.tsx", "src/App.jsx", "cmd/main.go",
]
# Folders to skip when walking
SKIP_DIRS = {".git", "node_modules", "dist", "build", ".next", ".nuxt",
             "target", "vendor", "__pycache__", ".venv", "venv", ".pytest_cache",
             "coverage", ".cache", ".turbo", ".parcel-cache"}
# Limits
MAX_TREE_DEPTH = 3
MAX_TREE_ENTRIES = 200
MAX_FILE_BYTES = 12_000  # cap per file read
MAX_CORE_FILES = 6
MAX_README_BYTES = 8_000


def parse_repo_url(url: str) -> tuple[str, str] | None:
    m = _REPO_RE.match(url)
    if not m:
        return None
    return m.group(1), m.group(2).rstrip(".git")


def extract(url: str, scratch_dir: Path, run_dir: Path) -> dict:
    """Shallow-clone, walk, pick core files. Return summary dict."""
    parsed = parse_repo_url(url)
    if not parsed:
        return {"error": "not_a_github_repo_url"}
    owner, repo = parsed

    repo_dir = scratch_dir / "repo"
    if repo_dir.exists():
        # already cloned, run git fetch to refresh
        try:
            subprocess.run(["git", "-C", str(repo_dir), "fetch", "--depth=1"],
                           capture_output=True, timeout=30, check=False)
        except Exception:
            pass
    else:
        scratch_dir.mkdir(parents=True, exist_ok=True)
        clone_url = f"https://github.com/{owner}/{repo}.git"
        # depth=20 → enough for ~15 recent commits while staying shallow
        cp = subprocess.run(
            ["git", "clone", "--depth=20", "--no-tags", clone_url, str(repo_dir)],
            capture_output=True, text=True, timeout=180,
        )
        if cp.returncode != 0:
            return {"error": "git_clone_failed", "stderr": cp.stderr[:500]}

    # Walk tree
    tree = _walk(repo_dir, MAX_TREE_DEPTH, MAX_TREE_ENTRIES)

    # Detect stack via known files
    stack_files = {}
    for name in STACK_FILES:
        f = repo_dir / name
        if f.is_file():
            stack_files[name] = _read_capped(f)

    # README
    readme = None
    for name in DOC_FILES:
        f = repo_dir / name
        if f.is_file():
            readme = {"path": name, "content": _read_capped(f, MAX_README_BYTES)}
            break

    # Entry-point hints + core files (top 6 by heuristic)
    core_candidates = []
    for hint in ENTRY_HINTS:
        f = repo_dir / hint
        if f.is_file():
            core_candidates.append(hint)
    # Also pull a few of the largest source files at top level + src/
    core_candidates.extend(_rank_core_files(repo_dir, exclude=set(core_candidates)))
    core_files = []
    for rel in core_candidates[:MAX_CORE_FILES]:
        f = repo_dir / rel
        if f.is_file():
            core_files.append({"path": rel, "content": _read_capped(f)})

    # Recent commits
    commits = []
    try:
        cp = subprocess.run(
            ["git", "-C", str(repo_dir), "log", "-n", "15", "--pretty=%h|%an|%ad|%s", "--date=short"],
            capture_output=True, text=True, timeout=15, check=False,
        )
        for line in cp.stdout.splitlines():
            parts = line.split("|", 3)
            if len(parts) == 4:
                commits.append({"hash": parts[0], "author": parts[1], "date": parts[2], "subject": parts[3]})
    except Exception:
        pass

    # Save the extracted bundle so Claude can read it directly from the file
    bundle = {
        "owner": owner,
        "repo": repo,
        "repo_dir": str(repo_dir),
        "tree": tree,
        "stack_files": stack_files,
        "readme": readme,
        "core_files": core_files,
        "commits": commits,
    }
    (run_dir / "github_bundle.json").write_text(
        json.dumps(bundle, indent=2, ensure_ascii=False), encoding="utf-8"
    )

    return {
        "owner": owner,
        "repo": repo,
        "repo_dir": str(repo_dir),
        "bundle_path": str(run_dir / "github_bundle.json"),
        "stats": {
            "tree_entries": len(tree),
            "stack_files_found": list(stack_files.keys()),
            "core_files_picked": [f["path"] for f in core_files],
            "commits": len(commits),
            "readme_path": readme["path"] if readme else None,
        },
    }


def _walk(root: Path, max_depth: int, max_entries: int) -> list[str]:
    """Walk the tree, return relative paths (dirs marked with trailing /)."""
    entries: list[str] = []
    root_str = str(root)
    for dirpath, dirnames, filenames in os.walk(root):
        rel_root = Path(dirpath).relative_to(root)
        depth = len(rel_root.parts)
        if depth > max_depth:
            dirnames[:] = []
            continue
        # prune skip dirs in-place
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS and not d.startswith(".")]
        for d in dirnames:
            entries.append(str((rel_root / d).as_posix()) + "/")
        for f in filenames:
            if f.startswith(".") and f not in {".gitignore", ".dockerignore", ".env.example"}:
                continue
            entries.append(str((rel_root / f).as_posix()))
        if len(entries) >= max_entries:
            entries = entries[:max_entries]
            entries.append(f"... ({max_entries} entry cap)")
            break
    entries.sort()
    return entries


def _rank_core_files(root: Path, exclude: set[str]) -> list[str]:
    """Return relative paths of likely 'core' source files.

    Search strategy (in order):
      1. root + root/src + root/lib + root/app + root/cmd + root/pkg
      2. For each top-level subdir that LOOKS like a package (has package.json /
         pyproject.toml / go.mod / Cargo.toml), also search subdir/src and subdir/.

    Ranked by file size descending (heuristic: larger ≈ more central logic).
    """
    EXT = {".py", ".ts", ".tsx", ".js", ".jsx", ".go", ".rs", ".rb", ".java", ".kt", ".swift", ".cpp", ".c"}
    search_dirs: list[Path] = [root, root / "src", root / "lib", root / "app", root / "cmd", root / "pkg"]

    # also include subdirs that look like sub-packages
    for child in root.iterdir():
        if not child.is_dir() or child.name in SKIP_DIRS or child.name.startswith("."):
            continue
        if any((child / marker).is_file() for marker in
               ("package.json", "pyproject.toml", "go.mod", "Cargo.toml")):
            search_dirs.append(child)
            search_dirs.append(child / "src")
            search_dirs.append(child / "lib")

    candidates: list[tuple[int, str]] = []
    seen: set[str] = set()
    for d in search_dirs:
        if not d.is_dir():
            continue
        for child in d.iterdir():
            if not child.is_file() or child.suffix.lower() not in EXT:
                continue
            rel = str(child.relative_to(root).as_posix())
            if rel in exclude or rel in seen:
                continue
            seen.add(rel)
            try:
                candidates.append((child.stat().st_size, rel))
            except OSError:
                continue
    candidates.sort(reverse=True)
    return [p for _, p in candidates]


def _read_capped(f: Path, cap: int = MAX_FILE_BYTES) -> str:
    try:
        data = f.read_bytes()[:cap]
        return data.decode("utf-8", errors="replace")
    except OSError as e:
        return f"<read error: {e}>"


if __name__ == "__main__":
    import argparse
    import sys
    from .. import paths as P

    parser = argparse.ArgumentParser()
    parser.add_argument("url")
    args = parser.parse_args()

    slug = P.slug_for(args.url, "github_repo")
    out = extract(args.url, P.scratch_dir(slug), P.run_dir(slug))
    print(json.dumps(out, indent=2, ensure_ascii=False))
    sys.exit(0 if "error" not in out else 1)
