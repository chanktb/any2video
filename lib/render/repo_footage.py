r"""Repo-footage scene — a real, scrolling screen-capture of the actual repo.

WHY (feedback from a reference video): "họ còn đưa vào scene đoạn video
scroll view repo trên điện thoại rất thực tế, ko đơn giản chỉ là text và edit."
The best reference video (OmniRoute, 9.4/10) breaks its dark motion-graphics
with ONE scene of the genuine GitHub repo scrolling — file tree → rendered
README → dashboard screenshot. It is the authenticity beat: proof the project
is real, not a fabricated pitch. Our videos were 100% synthetic. This adds a
real-footage scene.

Pipeline: Playwright renders the live repo URL in a narrow (phone-ish) viewport,
takes ONE tall full-page screenshot, then ffmpeg pans it vertically inside a
9:16 canvas (a "scrolling on a phone" clip) framed with a minimal browser bar.
Output is a normal silent scenes/<id>.mp4 — it then flows through the standard
mux (voice) + karaoke-subtitle + concat path like any other scene.

Usage:
  python -m lib.render.repo_footage \
    --url https://github.com/<owner>/<repo> \
    --out workspace/runs/<slug>/scenes/3.mp4 --duration 10
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path

# Phone-ish capture: narrow viewport → GitHub renders its responsive single-column
# layout (matches the reference's "repo trên điện thoại" look). DSF 2 → crisp.
CAPTURE_W = 500
CAPTURE_H = 900
DEVICE_SCALE = 2
# Scroll speed cap (user feedback: "scroll ko nên quá nhanh khó xem"). We pan at
# most this many on-canvas px/sec, so a very tall page just shows less content,
# readably, instead of blurring past.
PAN_SPEED_PX_PER_SEC = 300

# Canvas / framing
CANVAS_W, CANVAS_H = 1080, 1920
CARD_W = 900                   # screenshot width on canvas (leaves 90px side safe)
WIN_TOP = 250                  # below the browser bar
# Crop the footage window shorter (user feedback: "crop ngắn preview đi 1 chút
# để chỗ cho captions") — footage ends here, dark band below seats the karaoke line.
WIN_BOTTOM = 1470
# System monospace for the address-bar URL (VN-safe, always present on Windows).
ADDR_FONT = "C:/Windows/Fonts/consola.ttf"
BG = "0x0a0e14"

# JS to de-clutter GitHub chrome before the shot (cookie banner, sign-in dialog,
# sticky header) so the capture reads as clean repo content.
_DECLUTTER = r"""
() => {
  const kill = (sel) => document.querySelectorAll(sel).forEach(e => e.remove());
  kill('.js-notice, .flash, .cookie-consent, [data-testid="cookie-consent"]');
  kill('div[role="dialog"], .Popover, .js-header-wrapper, .AppHeader');
  kill('.js-sticky, .js-notification-shelf, dialog');
  // collapse the "sign up" bottom bar
  kill('.signup-prompt, .footer, .js-signup-prompt');
  document.body.style.paddingTop = '0';
}
"""


def capture_screenshot(url: str, out_png: Path) -> dict:
    """Render `url` narrow + full-page → tall PNG. Returns {w,h} of the image."""
    from playwright.sync_api import sync_playwright

    with sync_playwright() as pw:
        browser = pw.chromium.launch()
        ctx = browser.new_context(
            viewport={"width": CAPTURE_W, "height": CAPTURE_H},
            device_scale_factor=DEVICE_SCALE,
            user_agent=("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) "
                        "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile"),
        )
        page = ctx.new_page()
        page.goto(url, wait_until="domcontentloaded", timeout=25000)
        try:
            page.wait_for_timeout(1200)
            page.evaluate(_DECLUTTER)
            page.wait_for_timeout(400)
        except Exception:
            pass
        page.screenshot(path=str(out_png), full_page=True)
        ctx.close()
        browser.close()

    # probe PNG dims
    cp = subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "v:0",
         "-show_entries", "stream=width,height", "-of", "csv=p=0:s=x", str(out_png)],
        capture_output=True, text=True,
    )
    try:
        w, h = (int(x) for x in cp.stdout.strip().split("x"))
    except ValueError:
        return {"error": "png_probe_failed", "stderr": cp.stdout + cp.stderr}
    return {"png": str(out_png), "w": w, "h": h}


def _addr_label(url: str) -> str:
    """github.com/owner/repo — strip scheme + trailing slash, keep it short."""
    s = (url or "").strip()
    for pre in ("https://", "http://", "www."):
        if s.startswith(pre):
            s = s[len(pre):]
    s = s.rstrip("/")
    return s[:46]


def _render_chrome_png(url_label: str, out_png: Path) -> None:
    """Render the top browser-chrome bar (dark mask + 3 dots + address pill +
    URL text) as an opaque PNG via PIL — avoids ffmpeg drawtext font-path pain
    on Windows and gives full control of the address text."""
    from PIL import Image, ImageDraw, ImageFont

    img = Image.new("RGBA", (CANVAS_W, WIN_TOP), (10, 14, 20, 255))  # BG opaque
    d = ImageDraw.Draw(img)
    # window bar
    d.rounded_rectangle([90, 140, 90 + CARD_W, 204], radius=14, fill=(22, 27, 34, 255))
    # traffic-light dots
    for cx, col in ((127, (255, 95, 87)), (153, (254, 188, 46)), (179, (40, 200, 64))):
        d.ellipse([cx - 7, 166, cx + 7, 180], fill=col)
    # address pill
    d.rounded_rectangle([220, 156, 960, 192], radius=8, fill=(13, 17, 23, 255))
    # small padlock glyph drawn with primitives (Consolas has no emoji)
    lock_x, lock_y = 240, 166
    d.rounded_rectangle([lock_x, lock_y + 7, lock_x + 15, lock_y + 20], radius=3, fill=(139, 148, 158, 255))
    d.arc([lock_x + 3, lock_y, lock_x + 12, lock_y + 12], start=180, end=360, fill=(139, 148, 158, 255), width=2)
    # URL text (monospace)
    try:
        font = ImageFont.truetype("C:/Windows/Fonts/consola.ttf", 25)
    except OSError:
        font = ImageFont.load_default()
    d.text((268, 162), _addr_label(url_label), font=font, fill=(154, 164, 175, 255))
    img.save(out_png)


def build_scroll_clip(png: Path, png_w: int, png_h: int,
                      out_mp4: Path, duration_sec: float,
                      url_label: str = "") -> dict:
    """Pan the tall screenshot vertically inside a 9:16 browser-framed canvas,
    with a real address-bar URL and a caption-safe bottom crop."""
    scaled_h = round(png_h * (CARD_W / png_w))
    win_h = WIN_BOTTOM - WIN_TOP
    crop_note = None

    # Pan distance: how far the image travels so its bottom reaches the window
    # bottom, but capped by PAN_SPEED so tall pages scroll readably (show less).
    full_pan = max(0, scaled_h - win_h)
    speed_cap = int(PAN_SPEED_PX_PER_SEC * duration_sec)
    pan = min(full_pan, speed_cap)
    if pan < full_pan:
        crop_note = f"pan_speed_capped_{PAN_SPEED_PX_PER_SEC}px/s (showing top {pan + win_h}px)"

    # overlay y: starts at WIN_TOP (image top at window top), ends WIN_TOP-pan.
    if pan > 0:
        y_expr = f"{WIN_TOP}-({pan})*min(1\\,t/{max(0.1, duration_sec):.3f})"
    else:
        y_expr = f"{WIN_TOP}+({(win_h - scaled_h)}/2)"  # center static

    # Render the browser chrome (bar + dots + pill + URL) once as a PNG (PIL),
    # then overlay it — dodges ffmpeg drawtext font-path escaping on Windows.
    chrome_png = out_mp4.parent / f"._chrome_{out_mp4.stem}.png"
    _render_chrome_png(url_label, chrome_png)

    # Filtergraph:
    #  [bg] dark canvas → [img] screenshot scaled+panned via overlay →
    #  overlay chrome PNG at top (opaque, hides upward spill) → bottom crop band.
    filt = (
        f"color=c={BG}:s={CANVAS_W}x{CANVAS_H}:d={duration_sec:.3f}:r=30[bg];"
        f"[0:v]scale={CARD_W}:-1[img];"
        f"[bg][img]overlay=x=(W-w)/2:y='{y_expr}':shortest=0[ov];"
        f"[ov][1:v]overlay=x=0:y=0[chr];"
        f"[chr]drawbox=x=0:y={WIN_BOTTOM}:w={CANVAS_W}:h={CANVAS_H - WIN_BOTTOM}:"
        f"color={BG}:t=fill[out]"
    )

    cp = subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error",
         "-loop", "1", "-t", f"{duration_sec:.3f}", "-i", str(png),
         "-i", str(chrome_png),
         "-filter_complex", filt,
         "-map", "[out]",
         "-c:v", "libx264", "-preset", "veryfast", "-crf", "20",
         "-pix_fmt", "yuv420p", "-r", "30",
         str(out_mp4)],
        capture_output=True, text=True,
    )
    chrome_png.unlink(missing_ok=True)
    if cp.returncode != 0:
        return {"error": "scroll_clip_failed", "stderr": cp.stderr[-600:]}
    return {"mp4": str(out_mp4), "scaled_h": scaled_h, "pan_px": pan,
            "duration_sec": duration_sec, "note": crop_note}


def capture(url: str, out_mp4: Path, duration_sec: float,
            keep_png: bool = False, url_label: str = "") -> dict:
    """Full path: live repo URL → scrolling 9:16 scene clip."""
    png = out_mp4.with_suffix(".repo.png")
    shot = capture_screenshot(url, png)
    if "error" in shot:
        return shot
    clip = build_scroll_clip(png, shot["w"], shot["h"], out_mp4,
                             duration_sec, url_label or url)
    if not keep_png:
        png.unlink(missing_ok=True)
    if "error" in clip:
        return clip
    return {"mode": "repo_footage", "url": url, "png_dims": [shot["w"], shot["h"]], **clip}


def main() -> int:
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except (AttributeError, OSError):
        pass
    ap = argparse.ArgumentParser(description="Repo-footage scene — real scrolling repo capture")
    ap.add_argument("--url", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--duration", type=float, required=True)
    ap.add_argument("--keep-png", action="store_true")
    args = ap.parse_args()
    r = capture(args.url, Path(args.out).resolve(), args.duration, keep_png=args.keep_png)
    print(json.dumps(r, indent=2, ensure_ascii=False))
    return 0 if "error" not in r else 1


if __name__ == "__main__":
    sys.exit(main())
