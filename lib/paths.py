"""Workspace path helpers, config, and slug generation.

Paths resolve RELATIVE to the repo root by default, with environment overrides
so the tool is portable (no machine-specific absolute paths hardcoded):

  ANY2VIDEO_WORKSPACE   where run artifacts are written  (default: <repo>/workspace)
  ANY2VIDEO_SKILL_DIR   the skill dir (templates/sfx/bgm) (default: <repo>/skill)
  ANY2VIDEO_ENV_FILE    an extra .env to load secrets from (optional)

Secrets (GOOGLE_TTS_API_KEY, ANY2VIDEO_TG_*) are read from the environment or a
gitignored `.env` at the repo root via `load_env()` — never hardcoded.
"""
from __future__ import annotations

import hashlib
import os
import re
from pathlib import Path
from urllib.parse import urlparse

REPO_ROOT = Path(__file__).resolve().parents[1]


def _env_path(var: str, default: Path) -> Path:
    v = os.environ.get(var)
    return Path(v).resolve() if v else default


PROJECT_ROOT = REPO_ROOT
WORKSPACE = _env_path("ANY2VIDEO_WORKSPACE", REPO_ROOT / "workspace")
RUNS_DIR = WORKSPACE / "runs"
SCRATCH_DIR = WORKSPACE / "scratch"
SKILL_DIR = _env_path("ANY2VIDEO_SKILL_DIR", REPO_ROOT / "skill")
TEMPLATES_DIR = SKILL_DIR / "templates"

_ENV_LOADED = False


def _load_env_file(p: Path | str | None) -> None:
    try:
        p = Path(p) if p else None
        if not (p and p.is_file()):
            return
        for line in p.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, _, val = line.partition("=")
            os.environ.setdefault(k.strip(), val.strip().strip('"').strip("'"))
    except OSError:
        pass


def load_env(extra: Path | None = None) -> None:
    """Populate os.environ from .env files (no overwrite of existing vars).

    Supports the SECRETS-POINTER pattern: <repo>/.env may set
    `ANY2VIDEO_ENV_FILE=/path/to/other.env`, and that file is then also loaded.
    This lets a local .env keep only non-sensitive values + a pointer to secrets
    that live elsewhere (e.g. a shared secrets dir). Order:
      1. $ANY2VIDEO_ENV_FILE already in the environment
      2. <repo>/.env
      3. the pointer set by step 2 (if any)
      4. `extra`
    """
    global _ENV_LOADED
    _load_env_file(os.environ.get("ANY2VIDEO_ENV_FILE"))
    _load_env_file(REPO_ROOT / ".env")
    _load_env_file(os.environ.get("ANY2VIDEO_ENV_FILE"))  # follow .env's pointer
    if extra:
        _load_env_file(extra)
    _ENV_LOADED = True


_SLUG_SAFE = re.compile(r"[^a-z0-9-]+")


def slug_for(source: str, source_type: str) -> str:
    """Derive a stable, filesystem-safe slug from any input.

    GitHub repo URL → owner-repo
    Other URL       → domain + 8-char hash of path
    Image path      → filename stem + 8-char hash
    Raw text        → first 6 words + 8-char hash
    """
    source = source.strip()
    if source_type == "github_repo":
        m = re.match(r"https?://(?:www\.)?github\.com/([^/\s]+)/([^/\s#?]+)", source, re.IGNORECASE)
        if m:
            owner = _kebab(m.group(1))
            repo = _kebab(m.group(2).rstrip(".git"))
            return f"{owner}-{repo}"

    if source_type == "article":
        parsed = urlparse(source)
        domain = _kebab(parsed.netloc.replace("www.", ""))
        path_hash = _short_hash(parsed.path or "/")
        return f"{domain}-{path_hash}"

    if source_type == "image":
        stem = _kebab(Path(source).stem)
        return f"img-{stem}-{_short_hash(source)}"

    if source_type == "text":
        words = "-".join(_kebab(w) for w in source.split()[:6] if w)
        return f"text-{words[:40]}-{_short_hash(source)}"

    return f"unknown-{_short_hash(source)}"


def run_dir(slug: str, create: bool = True) -> Path:
    """Return projects/any2video/workspace/runs/<slug>/, mkdir-p by default."""
    d = RUNS_DIR / slug
    if create:
        d.mkdir(parents=True, exist_ok=True)
        (d / "scenes").mkdir(exist_ok=True)
    return d


def scratch_dir(slug: str, create: bool = True) -> Path:
    """Return projects/any2video/workspace/scratch/<slug>/ for repo clones, temp files."""
    d = SCRATCH_DIR / slug
    if create:
        d.mkdir(parents=True, exist_ok=True)
    return d


def _kebab(s: str) -> str:
    s = s.lower()
    s = _SLUG_SAFE.sub("-", s)
    return s.strip("-") or "x"


def _short_hash(s: str) -> str:
    return hashlib.sha1(s.encode("utf-8")).hexdigest()[:8]


if __name__ == "__main__":
    import argparse
    import json

    parser = argparse.ArgumentParser(description="Compute slug + paths for a given input")
    parser.add_argument("source")
    parser.add_argument("--type", required=True, choices=["github_repo", "article", "image", "text"])
    args = parser.parse_args()

    s = slug_for(args.source, args.type)
    print(json.dumps({
        "slug": s,
        "run_dir": str(run_dir(s, create=False)),
        "scratch_dir": str(scratch_dir(s, create=False)),
    }, indent=2))
