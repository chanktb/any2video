"""Telegram notify — send transcript preview + final mp4 to a Telegram DM.

Optional delivery step. Configure via env vars (or a .env at the repo root — see
lib/paths.load_env):
  ANY2VIDEO_TG_BOT_TOKEN=<token>
  ANY2VIDEO_TG_CHAT_ID=<chat_id>

Two CLI modes:
  preview <plan.md>            — send transcript text for review
  final <mp4> --source-url U   — send final mp4 with source link + caption

Approval flow: the skill calls `preview` then pauses until the user replies
"ok" / "go". `final` runs only after that approval.
"""
from __future__ import annotations

import argparse
import json
import os
import sys

try:
    import requests
except ImportError:
    print(json.dumps({"error": "requests_not_installed", "fix": "pip install requests"}),
          file=sys.stderr)
    sys.exit(2)

try:
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
except (AttributeError, OSError):
    pass

MAX_TEXT = 4000
MAX_CAPTION = 1000


def _api(method: str, files=None, **data) -> dict:
    from .. import paths
    paths.load_env()
    token = os.environ.get("ANY2VIDEO_TG_BOT_TOKEN")
    chat_id = os.environ.get("ANY2VIDEO_TG_CHAT_ID")
    if not token or not chat_id:
        return {"error": "missing_credentials",
                "fix": "Set ANY2VIDEO_TG_BOT_TOKEN + ANY2VIDEO_TG_CHAT_ID as env vars "
                       "or in a .env at the repo root"}
    url = f"https://api.telegram.org/bot{token}/{method}"
    data["chat_id"] = chat_id
    try:
        r = requests.post(url, data=data, files=files, timeout=120)
        return r.json()
    except Exception as e:
        return {"error": "request_failed", "detail": str(e)}


def send_text(text: str) -> dict:
    if len(text) > MAX_TEXT:
        text = text[:MAX_TEXT - 100] + "\n\n[...truncated]"
    return _api("sendMessage", text=text, parse_mode="HTML",
                disable_web_page_preview="true")


def send_video(path: Path, caption: str = "") -> dict:
    if len(caption) > MAX_CAPTION:
        caption = caption[:MAX_CAPTION - 4] + "..."
    with open(path, "rb") as f:
        return _api("sendVideo", files={"video": f},
                    caption=caption, parse_mode="HTML",
                    supports_streaming="true")


def preview_transcript(plan_path: Path) -> dict:
    """Send the transcript (per-scene narration) text to TG for review."""
    from .. import plan_yaml
    plan = plan_yaml.load_plan(plan_path)
    meta = plan.get("meta", {})
    src = meta.get("source", "?")
    slug = meta.get("slug", "?")
    total = meta.get("total_duration_sec_measured") or meta.get("total_duration_sec", "?")

    lines = [
        f"<b>🎬 any2video — transcript preview</b>",
        f"<b>Slug:</b> <code>{slug}</code>",
        f"<b>Source:</b> {src}",
        f"<b>Tổng:</b> ~{total}s · {len(plan.get('scenes', []))} scenes",
        "",
    ]
    for s in plan.get("scenes", []):
        sid = s.get("id", "?")
        beat = s.get("beat", "")
        dur = s.get("duration_sec", "?")
        narration = (s.get("narration") or "").strip()
        lines.append(f"<b>[{sid} · {beat}]</b> ({dur}s)")
        lines.append(narration)
        lines.append("")
    lines.append("───")
    lines.append("Anh duyệt thì reply <code>ok</code> trong chat Claude để em render.")
    text = "\n".join(lines)
    return send_text(text)


def final_delivery(mp4_path: Path, source_url: str, caption: str = "") -> dict:
    """Send final mp4 with source URL + caption to TG."""
    header = f"<b>✅ any2video — final</b>"
    if source_url:
        header += f"\n<b>Source:</b> {source_url}"
    full = header + ("\n\n" + caption if caption else "")
    return send_video(mp4_path, caption=full)


def main() -> int:
    parser = argparse.ArgumentParser(description="any2video → Telegram notify")
    sub = parser.add_subparsers(dest="cmd", required=True)

    p = sub.add_parser("preview", help="Send transcript for review")
    p.add_argument("plan", help="Path to plan.md")

    f = sub.add_parser("final", help="Send final mp4 with source + caption")
    f.add_argument("mp4", help="Path to final.mp4")
    f.add_argument("--source-url", default="", help="Original source URL")
    f.add_argument("--caption", default="", help="Caption text (may include <b>...</b>)")

    t = sub.add_parser("text", help="Send arbitrary text (debug)")
    t.add_argument("message")

    args = parser.parse_args()

    if args.cmd == "preview":
        r = preview_transcript(Path(args.plan).resolve())
    elif args.cmd == "final":
        r = final_delivery(Path(args.mp4).resolve(), args.source_url, args.caption)
    elif args.cmd == "text":
        r = send_text(args.message)
    else:
        return 2

    print(json.dumps(r, ensure_ascii=False, indent=2))
    return 0 if r.get("ok") else 1


if __name__ == "__main__":
    sys.exit(main())
