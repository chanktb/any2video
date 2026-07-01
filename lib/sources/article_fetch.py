"""Article URL extractor — fetch + readability-style body extract.

Uses httpx + BeautifulSoup heuristics (article tag, main tag, body fallback)
to pull the readable body. Strips nav/footer/aside/script/style.

Output written to run_dir/article.md so Claude can read it as plain markdown.
"""
from __future__ import annotations

import json
import re
from pathlib import Path
from urllib.parse import urlparse

import httpx
from bs4 import BeautifulSoup

_USER_AGENT = "any2video/0.1 (+local-skill)"
_TIMEOUT = 15.0
_MAX_BODY_BYTES = 1_500_000
_MAX_OUTPUT_CHARS = 30_000

STRIP_TAGS = {"script", "style", "nav", "footer", "aside", "noscript", "iframe", "svg", "form"}
KEEP_TAGS_AS_HEADINGS = {"h1", "h2", "h3", "h4"}


def extract(url: str, run_dir: Path) -> dict:
    try:
        with httpx.Client(timeout=_TIMEOUT, follow_redirects=True,
                          headers={"User-Agent": _USER_AGENT}) as client:
            r = client.get(url)
            r.raise_for_status()
    except Exception as e:
        return {"error": "fetch_failed", "detail": str(e)}

    html = r.text[:_MAX_BODY_BYTES]
    soup = BeautifulSoup(html, "html.parser")

    # strip noise
    for tag in soup.find_all(STRIP_TAGS):
        tag.decompose()

    title = (soup.title.string.strip() if soup.title and soup.title.string else None) or _guess_h1(soup) or "(untitled)"

    # try article > main > body in order
    body = soup.find("article") or soup.find("main") or soup.body
    if body is None:
        return {"error": "no_body_found", "title": title}

    md_chunks: list[str] = [f"# {title}\n", f"_Source: {url}_\n"]
    for el in body.descendants:
        if not hasattr(el, "name") or el.name is None:
            continue
        name = el.name.lower()
        text = el.get_text(" ", strip=True)
        if not text:
            continue
        if name in KEEP_TAGS_AS_HEADINGS:
            level = int(name[1])
            md_chunks.append("\n" + "#" * level + " " + text + "\n")
        elif name == "p":
            md_chunks.append(text + "\n")
        elif name == "li":
            md_chunks.append("- " + text)
        elif name == "blockquote":
            md_chunks.append("> " + text + "\n")
        elif name == "code" and el.parent and el.parent.name == "pre":
            md_chunks.append("```\n" + text + "\n```")

    md = _dedupe_lines("\n".join(md_chunks))[:_MAX_OUTPUT_CHARS]
    out_path = run_dir / "article.md"
    out_path.write_text(md, encoding="utf-8")

    return {
        "title": title,
        "url": url,
        "domain": urlparse(url).netloc,
        "article_md_path": str(out_path),
        "char_count": len(md),
        "truncated": len(md) >= _MAX_OUTPUT_CHARS,
    }


def _guess_h1(soup: BeautifulSoup) -> str | None:
    h1 = soup.find("h1")
    return h1.get_text(strip=True) if h1 else None


def _dedupe_lines(text: str) -> str:
    """Collapse runs of identical lines (defends against nav bars repeated everywhere)."""
    out: list[str] = []
    prev = None
    for line in text.splitlines():
        clean = re.sub(r"\s+", " ", line).strip()
        if clean and clean == prev:
            continue
        out.append(line)
        prev = clean
    return "\n".join(out)


if __name__ == "__main__":
    import argparse
    import sys
    from .. import paths as P

    parser = argparse.ArgumentParser()
    parser.add_argument("url")
    args = parser.parse_args()
    slug = P.slug_for(args.url, "article")
    out = extract(args.url, P.run_dir(slug))
    print(json.dumps(out, indent=2, ensure_ascii=False))
    sys.exit(0 if "error" not in out else 1)
