import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { FootageScene } from "../lib/footage";
import { KaraokeNeon } from "../lib/karaoke";
import { loadFont } from "@remotion/google-fonts/BeVietnamPro";

// DEMO of the hybrid seam: Playwright footage (path A) + Remotion karaoke (path B).
// The footage file is local output of repo_footage.py (gitignored); regenerate with:
//   python -m lib.render.repo_footage --url https://github.com/chanktb/any2video \
//       --out render-remotion/public/footage/demo_scroll.mp4 --duration 8

const { fontFamily } = loadFont("normal", {
  weights: ["600", "700"],
  subsets: ["latin", "vietnamese"],
});

// Mock words for the demo (real runs take them from gen_voice.py)
const DEMO_WORDS = [
  { w: "Đây", s: 0.2, e: 0.5 },
  { w: "là", s: 0.5, e: 0.7 },
  { w: "trang", s: 0.7, e: 1.0 },
  { w: "repo", s: 1.0, e: 1.4 },
  { w: "thật,", s: 1.4, e: 1.9 },
  { w: "đang", s: 2.1, e: 2.4 },
  { w: "cuộn", s: 2.4, e: 2.8 },
  { w: "bằng", s: 2.8, e: 3.1 },
  { w: "Playwright.", s: 3.1, e: 3.9 },
];

export const FOOTAGE_DEMO_FRAMES = 240; // 8s

export const FootageDemo: React.FC = () => (
  <AbsoluteFill>
    <Sequence durationInFrames={FOOTAGE_DEMO_FRAMES}>
      <FootageScene src="footage/demo_scroll.mp4" />
      <KaraokeNeon words={DEMO_WORDS} fontFamily={fontFamily} />
    </Sequence>
  </AbsoluteFill>
);
