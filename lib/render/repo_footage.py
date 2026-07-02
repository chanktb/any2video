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

# Canvas / framing — FULL-BLEED scroll (feedback 2026-07-02): the repo-scroll scene
# fills the whole width and runs edge-to-edge (it does NOT obey the card safe-zone
# — it's real footage, not a designed card). We keep only a slim browser bar up
# top (the real github.com URL is a HARD authenticity signal) and a dark caption
# scrim down bottom so the karaoke line never drowns in the page background.
CANVAS_W, CANVAS_H = 1080, 1920
CARD_W = 1080                  # FULL width — no side margin (was 900)
WIN_TOP = 200                  # slim browser bar height
WIN_BOTTOM = 1920              # footage runs to the very bottom (was 1470)
# Bottom caption scrim: a soft transparent→dark ramp (SCRIM_TOP→PLATE_TOP) that
# blends into a near-solid dark plate (PLATE_TOP→bottom). The karaoke caption
# (subtitles MARGIN_V≈300 → ~y1560-1680) lands on the plate at ≥PLATE_ALPHA so
# white text stays legible even over a bright (light-mode) GitHub page.
SCRIM_TOP = 1360
PLATE_TOP = 1520
PLATE_ALPHA = 185
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


def _render_overlay_png(url_label: str, out_png: Path) -> None:
    """Render a FULL-CANVAS RGBA overlay for the footage: an opaque top browser
    bar (dark mask + 3 dots + full-width address pill + URL text) AND a bottom
    caption scrim (transparent → dark gradient). Overlaid once over the panned
    screenshot. PIL avoids ffmpeg drawtext font-path pain on Windows and gives
    full control of the address text + the scrim ramp."""
    from PIL import Image, ImageDraw, ImageFont

    img = Image.new("RGBA", (CANVAS_W, CANVAS_H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    # ── top browser bar (opaque, hides any upward footage spill) ──
    d.rectangle([0, 0, CANVAS_W, WIN_TOP], fill=(10, 14, 20, 255))
    d.rounded_rectangle([40, 118, CANVAS_W - 40, 182], radius=14, fill=(22, 27, 34, 255))
    for cx, col in ((82, (255, 95, 87)), (108, (254, 188, 46)), (134, (40, 200, 64))):
        d.ellipse([cx - 7, 143, cx + 7, 157], fill=col)
    # address pill spans most of the (now full-width) bar
    d.rounded_rectangle([178, 134, CANVAS_W - 60, 170], radius=8, fill=(13, 17, 23, 255))
    lock_x, lock_y = 198, 144
    d.rounded_rectangle([lock_x, lock_y + 7, lock_x + 15, lock_y + 20], radius=3, fill=(139, 148, 158, 255))
    d.arc([lock_x + 3, lock_y, lock_x + 12, lock_y + 12], start=180, end=360, fill=(139, 148, 158, 255), width=2)
    try:
        font = ImageFont.truetype("C:/Windows/Fonts/consola.ttf", 25)
    except OSError:
        font = ImageFont.load_default()
    d.text((226, 140), _addr_label(url_label), font=font, fill=(154, 164, 175, 255))

    # ── bottom caption scrim: soft ramp (SCRIM_TOP→PLATE_TOP) blending into a
    #    near-solid plate (PLATE_TOP→bottom) so the caption band is solidly dark ──
    for y in range(SCRIM_TOP, CANVAS_H):
        if y < PLATE_TOP:
            frac = (y - SCRIM_TOP) / max(1, PLATE_TOP - SCRIM_TOP)
            a = int(PLATE_ALPHA * (frac ** 1.3))
        else:
            frac = (y - PLATE_TOP) / max(1, CANVAS_H - PLATE_TOP)
            a = int(PLATE_ALPHA + (238 - PLATE_ALPHA) * frac)
        d.line([(0, y), (CANVAS_W, y)], fill=(6, 10, 16, a))

    img.save(out_png)


def build_scroll_clip(png: Path, png_w: int, png_h: int,
                      out_mp4: Path, duration_sec: float,
                      url_label: str = "") -> dict:
    """Pan the tall screenshot vertically, full-bleed, inside a 9:16 canvas with
    a slim real address-bar up top and a dark caption scrim at the bottom."""
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

    # Render the full-canvas overlay (top browser bar + bottom caption scrim)
    # once as a PNG (PIL), then overlay it — dodges ffmpeg drawtext font-path
    # escaping on Windows and bakes the caption-legibility gradient.
    overlay_png = out_mp4.parent / f"._overlay_{out_mp4.stem}.png"
    _render_overlay_png(url_label, overlay_png)

    # Filtergraph:
    #  [bg] dark canvas → [img] screenshot scaled to FULL width + panned →
    #  overlay the full-canvas PNG (top bar hides upward spill, bottom scrim
    #  darkens the caption band). Footage is full-bleed — no side/bottom crop.
    filt = (
        f"color=c={BG}:s={CANVAS_W}x{CANVAS_H}:d={duration_sec:.3f}:r=30[bg];"
        f"[0:v]scale={CARD_W}:-1[img];"
        f"[bg][img]overlay=x=(W-w)/2:y='{y_expr}':shortest=0[ov];"
        f"[ov][1:v]overlay=x=0:y=0[out]"
    )

    cp = subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error",
         "-loop", "1", "-t", f"{duration_sec:.3f}", "-i", str(png),
         "-i", str(overlay_png),
         "-filter_complex", filt,
         "-map", "[out]",
         "-c:v", "libx264", "-preset", "veryfast", "-crf", "20",
         "-pix_fmt", "yuv420p", "-r", "30",
         str(out_mp4)],
        capture_output=True, text=True,
    )
    overlay_png.unlink(missing_ok=True)
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
