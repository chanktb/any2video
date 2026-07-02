"""Rich render path (--rich flag) — Playwright video recording.

Records each scene's HTML as a video for `duration_sec`. CSS @keyframes,
inline JS animations, and transition effects all play through. Output is
a webm (Playwright's native format), then ffmpeg-converted to mp4 for the
ffmpeg_compose step.

~5-15 sec per scene depending on duration. Use for "important" videos
where motion matters. Default mode (hyperframe_render) is much faster for
mostly-static scenes.
"""
from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
from pathlib import Path

from .. import plan_yaml


_PRE_RECORD_PAD_MS = 200   # let networkidle settle before counting
_SKIP_LEAD_SEC    = 1.2    # trim from start of webm: skips pre-paint white + font-freeze period
_FONT_READY_CAP_MS = 8000  # hard cap on font wait; blocked CDN must not stall render

# Freeze script — injected before page parse so CSS @keyframes don't start running
# while we're waiting for Google Fonts. Without this, the swap from fallback font
# to the real face shows up as visible jank in the first ~0.5s of every scene.
# Reference: html-video packages/adapter-hyperframes/src/render.ts L96-172.
_FREEZE_SCRIPT = r"""
() => {
  const style = document.createElement('style');
  style.id = '__a2v_freeze';
  style.textContent =
    '*, *::before, *::after { animation-play-state: paused !important;' +
    ' -webkit-animation-play-state: paused !important; }';
  const attach = () => (document.head || document.documentElement).appendChild(style);
  if (document.head || document.documentElement) attach();
  else document.addEventListener('DOMContentLoaded', attach, { once: true });
  window.__a2vUnfreeze = () => { document.getElementById('__a2v_freeze')?.remove(); };
}
"""

# Dark-background init — runs at document_start (IIFE, so it actually executes,
# unlike _FREEZE_SCRIPT above which is a bare arrow expression). Playwright's video
# recording starts on the browser's WHITE about:blank; before the page paints its
# own #020c1a, the recording shows white — and the lead-trim can't fully remove it
# (sparse-keyframe webm). Painting the document dark from the first frame means the
# lead is dark (the intended canvas), never a white flash over the voice.
_DARK_BG_SCRIPT = r"""
(() => {
  var BG = '#020c1a';
  var set = function () {
    if (document.documentElement) {
      document.documentElement.style.background = BG;
      document.documentElement.style.backgroundColor = BG;
    }
    if (document.body) { document.body.style.background = BG; }
  };
  set();
  document.addEventListener('DOMContentLoaded', set, { once: true });
})()
"""

# Wait-for-fonts script — runs after page goto:
# 1. wait for all <link rel="stylesheet"> to load (so @font-face rules register)
# 2. explicitly fonts.load() each registered face (display:swap doesn't auto-download)
# 3. await fonts.ready + 2× rAF (so layout settles on real glyph metrics)
_FONTS_READY_SCRIPT = r"""
() => new Promise((resolve) => {
  const fonts = document.fonts;
  if (!fonts || typeof fonts.ready?.then !== 'function') { resolve(); return; }
  let settled = false;
  const finish = () => {
    if (settled) return;
    settled = true;
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  };
  const cap = setTimeout(finish, 8000);
  const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
  Promise.all(links.map(l => l.sheet ? Promise.resolve() : new Promise(r => {
    l.addEventListener('load', r, { once: true });
    l.addEventListener('error', r, { once: true });
  }))).then(() => {
    const facePromises = [];
    fonts.forEach(face => facePromises.push(face.load().catch(() => {})));
    return Promise.all(facePromises);
  }).then(() => fonts.ready).then(() => { clearTimeout(cap); finish(); });
});
"""


def _content_start_sec(webm_path: Path, cap: float = 6.0, fps: int = 10) -> float:
    """Find the first moment the recording is NOT white/blank — i.e. where the
    dark scene canvas has painted. The browser records on a white about:blank and
    paint timing varies (font load, batch pressure), so a FIXED lead-trim leaks a
    white flash whenever paint is slow. This samples a tiny gray filmstrip in ONE
    ffmpeg pass and returns the timestamp of the first dark frame (mean luma < 200),
    which becomes the accurate trim offset. Falls back to _SKIP_LEAD_SEC if the whole
    head is bright (shouldn't happen for a dark template scene)."""
    w, h = 16, 28
    cp = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", str(webm_path),
         "-t", f"{cap:.2f}", "-vf", f"fps={fps},scale={w}:{h},format=gray",
         "-f", "rawvideo", "-"],
        capture_output=True,
    )
    data = cp.stdout
    fsize = w * h
    nframes = len(data) // fsize
    for i in range(nframes):
        frame = data[i * fsize:(i + 1) * fsize]
        if sum(frame) / fsize < 200:          # dark canvas is up
            return i / float(fps)
    return _SKIP_LEAD_SEC


def render_scene(html_path: Path, duration_sec: float, out_mp4: Path) -> dict:
    """Record HTML scene as video, convert to mp4 of `duration_sec`.

    Three-step recording: (1) freeze CSS animations + load page + wait fonts
    (this captured period becomes pre-roll trim), (2) unfreeze + wait
    duration_sec (the animation plays through cleanly), (3) ffmpeg cuts the
    leading freeze period and outputs mp4 of exact duration.
    """
    from playwright.sync_api import sync_playwright

    tmp_dir = out_mp4.parent / f"._record_{out_mp4.stem}"
    tmp_dir.mkdir(exist_ok=True)

    try:
        with sync_playwright() as pw:
            browser = pw.chromium.launch()
            ctx = browser.new_context(
                viewport={"width": 1080, "height": 1920},
                record_video_dir=str(tmp_dir),
                record_video_size={"width": 1080, "height": 1920},
                device_scale_factor=1,
            )
            page = ctx.new_page()
            # Step 1: install freeze BEFORE navigation so animations never start
            page.add_init_script(_FREEZE_SCRIPT)
            # Paint the document dark from frame 1 so the recording never shows the
            # browser's white about:blank (the "1-2s màn hình trắng" head bug).
            page.add_init_script(_DARK_BG_SCRIPT)
            # Wait only for DOM parse, NOT 'load'. 'load' blocks on the Google
            # Fonts stylesheet+faces, so the page sits on the WHITE about:blank
            # until fonts finish (~1-2s of white lead — worst on Inter/build-minimal).
            # domcontentloaded paints the dark bg immediately; _FONTS_READY_SCRIPT
            # below then waits for fonts (page shows dark during the wait).
            page.goto("file:///" + str(html_path).replace("\\", "/"),
                      wait_until="domcontentloaded", timeout=10000)
            # Step 2: wait for stylesheets + fonts + any <img> to decode (capped at 8s)
            page.evaluate(_FONTS_READY_SCRIPT)
            try:
                page.evaluate(
                    "() => Promise.all(Array.from(document.images).map("
                    "i => i.complete ? 0 : i.decode().catch(() => 0)))"
                )
            except Exception:
                pass
            page.wait_for_timeout(_PRE_RECORD_PAD_MS)
            # Step 3: unfreeze — animations now play from t=0 with real font metrics
            page.evaluate("() => window.__a2vUnfreeze && window.__a2vUnfreeze()")
            # Kick stat count-ups (template_render injects __a2vCountup). This is the
            # motion-mode signal: only the video render calls it, so the still gate
            # keeps the final numbers (non-destructive). It self-times off each
            # number's fade-in, so the roll plays in the recorded window.
            page.evaluate("() => window.__a2vCountup && window.__a2vCountup()")
            # Step 4: let the scene run + headroom so the content-aware trim (which
            # may cut later than _SKIP_LEAD_SEC when paint is slow) still has `duration`.
            page.wait_for_timeout(int((duration_sec + _SKIP_LEAD_SEC + 1.5) * 1000))
            ctx.close()
            browser.close()

        webms = list(tmp_dir.glob("*.webm"))
        if not webms:
            return {"error": "no_webm_recorded"}
        webm_path = webms[0]

        # Content-aware lead-trim: cut to where the dark canvas actually painted
        # (not a fixed 1.2s — paint timing varies and leaked a white flash under load).
        # -ss AFTER -i = output seek: frame-accurate, decodes from 0 and DROPS the lead.
        # (Input seek before -i lands on the nearest prior keyframe — Playwright webms
        # have very sparse keyframes, so -ss lands on keyframe 0 and the lead survives.)
        lead = _content_start_sec(webm_path)
        cp = subprocess.run(
            ["ffmpeg", "-y", "-loglevel", "error",
             "-i", str(webm_path),
             "-ss", f"{lead:.3f}",
             "-t", f"{duration_sec:.3f}",
             "-pix_fmt", "yuv420p",
             "-vf", "scale=1080:1920:flags=lanczos",
             "-c:v", "libx264", "-preset", "veryfast", "-crf", "20",
             "-r", "30",
             str(out_mp4)],
            capture_output=True, text=True,
        )
        if cp.returncode != 0:
            return {"error": "ffmpeg_convert_failed", "stderr": cp.stderr[-500:]}

        return {"webm_path": str(webm_path), "mp4_path": str(out_mp4), "duration_sec": duration_sec, "mode": "rich"}
    finally:
        # clean tmp dir
        for f in tmp_dir.glob("*"):
            try:
                f.unlink()
            except OSError:
                pass
        try:
            tmp_dir.rmdir()
        except OSError:
            pass


def render_all(plan_path: Path) -> dict:
    if not shutil.which("ffmpeg"):
        return {"error": "ffmpeg_not_on_path"}

    plan = plan_yaml.load_plan(plan_path)
    scenes = plan.get("scenes") or []
    if not scenes:
        return {"error": "no_scenes_in_plan"}

    run_dir = plan_path.parent
    scenes_dir = run_dir / "scenes"

    results = []
    for s in scenes:
        sid = s["id"]
        duration = float(s.get("duration_sec") or 4.0)
        out_mp4 = scenes_dir / f"{sid}.mp4"

        # Repo-footage scene: a real scrolling capture of the live repo/URL
        # instead of a synthetic HTML render. Triggered by scene.capture_url
        # (authenticity beat — see lib/render/repo_footage.py).
        capture_url = s.get("capture_url") or s.get("footage_url")
        if capture_url:
            from . import repo_footage
            try:
                r = repo_footage.capture(capture_url, out_mp4, duration,
                                         url_label=s.get("footage_label", ""))
                r["id"] = sid
                results.append(r)
            except Exception as e:
                results.append({"id": sid, "error": str(e), "type": type(e).__name__})
            continue

        html = scenes_dir / f"{sid}.html"
        if not html.is_file():
            results.append({"id": sid, "error": "html_missing"})
            continue
        try:
            r = render_scene(html, duration, out_mp4)
            r["id"] = sid
            results.append(r)
        except Exception as e:
            results.append({"id": sid, "error": str(e), "type": type(e).__name__})

    return {"plan_path": str(plan_path), "scene_results": results, "mode": "rich"}


def main() -> int:
    parser = argparse.ArgumentParser(description="Rich render — Playwright video recording per scene")
    sub = parser.add_subparsers(dest="cmd", required=True)
    one = sub.add_parser("one")
    one.add_argument("html")
    one.add_argument("--duration", type=float, required=True)
    one.add_argument("--out", required=True)
    allp = sub.add_parser("all")
    allp.add_argument("plan")
    args = parser.parse_args()

    if args.cmd == "one":
        r = render_scene(Path(args.html).resolve(), args.duration, Path(args.out).resolve())
        print(json.dumps(r, indent=2, ensure_ascii=False))
        return 0 if "error" not in r else 1

    r = render_all(Path(args.plan).resolve())
    print(json.dumps(r, indent=2, ensure_ascii=False))
    return 0 if "error" not in r else 1


if __name__ == "__main__":
    sys.exit(main())
