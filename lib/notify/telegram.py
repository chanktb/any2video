"""Telegram notify — send transcript preview + final mp4 to a Telegram DM.

Optional delivery step. Configure via env vars (or a .env at the repo root — see
lib/paths.load_env):
  ANY2VIDEO_TG_BOT_TOKEN=<token>
  ANY2VIDEO_TG_CHAT_ID=<chat_id>

CLI modes (two human checkpoints + final delivery):
  script  <plan.md>            — CHECKPOINT 1 (pre-TTS): per scene, the on-screen
                                 DISPLAY text + the READ-ALOUD narration, so the user
                                 can fix pronunciation ("readme" → "rít mi") before any
                                 audio is synthesized. Durations are estimates here.
  scenes  <plan.md>            — CHECKPOINT 2 (post-gate): the rendered scene PNGs for a
                                 final visual sign-off before the expensive video render.
  preview <plan.md>            — (optional) post-TTS transcript with measured durations
  final   <mp4> --source-url U — send final mp4 with source link + caption

Approval flow: the skill calls `script`, pauses for "ok"; only then TTS + render;
then `scenes`, pauses for "ok"; only then the video render + `final`.
"""
from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

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


def _chunks(text: str, limit: int) -> list[str]:
    """Split into ≤limit pieces at line boundaries so an HTML tag is never cut
    mid-way (a long multi-scene script exceeds MAX_TEXT — truncating blindly can
    slice an open <b> tag and make Telegram reject the whole message)."""
    if len(text) <= limit:
        return [text]
    out: list[str] = []
    cur = ""
    for line in text.split("\n"):
        add = line + "\n"
        if cur and len(cur) + len(add) > limit:
            out.append(cur.rstrip("\n"))
            cur = ""
        cur += add
    if cur.strip():
        out.append(cur.rstrip("\n"))
    return out


def send_text(text: str) -> dict:
    result: dict = {}
    for part in _chunks(text, MAX_TEXT):
        result = _api("sendMessage", text=part, parse_mode="HTML",
                      disable_web_page_preview="true")
        if not result.get("ok"):
            return result
    return result


def send_video(path: Path, caption: str = "") -> dict:
    if len(caption) > MAX_CAPTION:
        caption = caption[:MAX_CAPTION - 4] + "..."
    with open(path, "rb") as f:
        return _api("sendVideo", files={"video": f},
                    caption=caption, parse_mode="HTML",
                    supports_streaming="true")


def send_photo(path: Path, caption: str = "") -> dict:
    if len(caption) > MAX_CAPTION:
        caption = caption[:MAX_CAPTION - 4] + "..."
    with open(path, "rb") as f:
        return _api("sendPhoto", files={"photo": f}, caption=caption, parse_mode="HTML")


def _display_text(inputs) -> str:
    """Flatten a scene's template `inputs` into the human-readable ON-SCREEN text
    (skip colours / gradients / urls — the viewer never reads those)."""
    if not isinstance(inputs, dict):
        return ""
    parts: list[str] = []

    def add(v):
        if isinstance(v, str):
            s = v.strip()
            if (s and not s.startswith("#") and not s.startswith("http")
                    and "gradient(" not in s and "linear-" not in s):
                parts.append(s)
        elif isinstance(v, list):
            for el in v:
                if isinstance(el, dict):
                    for k in ("title", "label", "name", "desc", "value", "command", "headline", "text"):
                        if el.get(k):
                            add(el[k])
                else:
                    add(el)
        elif isinstance(v, dict):
            for vv in v.values():
                add(vv)

    for k, v in inputs.items():
        if k in ("accent_from", "accent_to", "gradient", "avatar_url"):
            continue
        add(v)
    seen, out = set(), []
    for p in parts:
        if p not in seen:
            seen.add(p)
            out.append(p)
    return " · ".join(out)[:400]


def _read_text(scene) -> str:
    """The exact text TTS will speak — the concatenated beat texts, or `narration`."""
    beats = scene.get("beats")
    if isinstance(beats, list) and beats:
        return " ".join((b.get("text") if isinstance(b, dict) else str(b)) or "" for b in beats).strip()
    return (scene.get("narration") or "").strip()


def _est_sec(read_text: str) -> float:
    """Rough spoken-duration estimate BEFORE TTS: VN ≈ 4 syllables/sec at ~+5%.
    (whitespace tokens ≈ VN syllables). A gut-check for 'is this scene too long'."""
    toks = len((read_text or "").split())
    return round(toks / 4.0, 1) if toks else 0.0


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


def preview_script(plan_path: Path) -> dict:
    """CHECKPOINT 1 (pre-TTS): per scene, show the ON-SCREEN display text + the
    READ-ALOUD narration so the user can fix pronunciation before any audio exists."""
    from .. import plan_yaml
    plan = plan_yaml.load_plan(plan_path)
    meta = plan.get("meta", {})
    scenes = plan.get("scenes", [])
    est_total = round(sum(_est_sec(_read_text(s)) for s in scenes), 1)

    lines = [
        "<b>📝 any2video — CHECKPOINT 1: kịch bản (trước khi tạo voice)</b>",
        f"<b>Slug:</b> <code>{meta.get('slug', '?')}</code> · ~{est_total}s ước lượng · {len(scenes)} scenes",
        "",
    ]
    for s in scenes:
        sid = s.get("id", "?")
        beat = s.get("beat", "")
        read = _read_text(s)
        est = _est_sec(read)
        lines.append(f"<b>[{sid} · {beat}]</b> ~{est}s")
        cap = s.get("capture_url")
        if cap:
            lines.append(f"🎬 <i>Repo footage:</i> {cap}")
        else:
            disp = _display_text(s.get("inputs"))
            if disp:
                lines.append(f"📺 <b>Hiển thị:</b> {disp}")
        lines.append(f"🔊 <b>Đọc:</b> {read}")
        lines.append("")
    lines.append("───")
    lines.append("Duyệt <b>chữ + cách đọc</b> thì reply <code>ok</code> trong chat Claude để em tạo voice.")
    lines.append("Sai cách đọc (vd README đọc từng chữ) → nói scene nào, em sửa phần <b>Đọc</b> rồi gửi lại.")
    return send_text("\n".join(lines))


def preview_scenes(plan_path: Path) -> dict:
    """CHECKPOINT 2 (post-gate): send each rendered scene PNG for a final visual
    sign-off before the expensive video render."""
    from .. import plan_yaml
    plan = plan_yaml.load_plan(plan_path)
    scenes = plan.get("scenes", [])
    scenes_dir = plan_path.parent / "scenes"

    sent, missing = [], []
    for s in scenes:
        sid = s.get("id", "?")
        beat = s.get("beat", "")
        png = scenes_dir / f"{sid}.png"
        if png.is_file():
            r = send_photo(png, caption=f"<b>[{sid} · {beat}]</b>")
            sent.append({"id": sid, "ok": r.get("ok", False)})
        elif s.get("capture_url"):
            missing.append({"id": sid, "reason": "footage (no still PNG until render)"})
        else:
            missing.append({"id": sid, "reason": "png_missing — run the gate first"})

    summary = send_text(
        "<b>🖼️ any2video — CHECKPOINT 2: duyệt hình từng scene (trước khi render video)</b>\n"
        f"Đã gửi {len(sent)} ảnh"
        + (f" · {len(missing)} footage/thiếu" if missing else "")
        + ".\n───\nDuyệt hình thì reply <code>ok</code> để em render video. "
          "Lỗi ở scene nào → nói scene đó, em sửa rồi gate + gửi lại đúng scene."
    )
    return {"ok": summary.get("ok", False), "sent": sent, "missing": missing}


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

    sc = sub.add_parser("script", help="CHECKPOINT 1 (pre-TTS): display + read-aloud text")
    sc.add_argument("plan", help="Path to plan.md")

    ss = sub.add_parser("scenes", help="CHECKPOINT 2 (post-gate): rendered scene PNGs")
    ss.add_argument("plan", help="Path to plan.md")

    p = sub.add_parser("preview", help="(optional) post-TTS transcript with measured durations")
    p.add_argument("plan", help="Path to plan.md")

    f = sub.add_parser("final", help="Send final mp4 with source + caption")
    f.add_argument("mp4", help="Path to final.mp4")
    f.add_argument("--source-url", default="", help="Original source URL")
    f.add_argument("--caption", default="", help="Caption text (may include <b>...</b>)")
    f.add_argument("--caption-file", default="", help="Read caption from a UTF-8 file "
                   "(e.g. runs/<slug>/caption.txt) — robust against Windows shell/argv "
                   "encoding that mangles Vietnamese in --caption. Overrides --caption.")

    t = sub.add_parser("text", help="Send arbitrary text (debug)")
    t.add_argument("message")

    args = parser.parse_args()

    if args.cmd == "script":
        r = preview_script(Path(args.plan).resolve())
    elif args.cmd == "scenes":
        r = preview_scenes(Path(args.plan).resolve())
    elif args.cmd == "preview":
        r = preview_transcript(Path(args.plan).resolve())
    elif args.cmd == "final":
        caption = args.caption
        if args.caption_file:
            caption = Path(args.caption_file).read_text(encoding="utf-8").split("\n---")[0].strip()
        r = final_delivery(Path(args.mp4).resolve(), args.source_url, caption)
    elif args.cmd == "text":
        r = send_text(args.message)
    else:
        return 2

    print(json.dumps(r, ensure_ascii=False, indent=2))
    return 0 if r.get("ok") else 1


if __name__ == "__main__":
    sys.exit(main())
