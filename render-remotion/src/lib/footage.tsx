import React from "react";
import { AbsoluteFill, staticFile } from "remotion";
import { Video } from "@remotion/media";

// HYBRID bridge to path A: real footage (repo scroll / author profile) is captured
// by lib/render/repo_footage.py (Playwright) as a silent full-bleed 1080x1920 mp4
// (browser bar + bottom scrim for karaoke baked in). Path B just embeds it.
//
// Per run (the "repo scroll" and "author outro" beats of the PA1 arc):
//   python -m lib.render.repo_footage --url https://github.com/<owner>/<repo> \
//       --out render-remotion/public/footage/<slug>_scroll.mp4 --duration <narration seconds>
// then in the video file:
//   <FootageScene src="footage/<slug>_scroll.mp4" />  + karaoke + <Audio> like any scene.
// The duration passed to repo_footage = exactly the scene's audio duration
// (words/audio from gen_voice.py) so the scroll ends when the narration does.

export const FootageScene: React.FC<{ src: string }> = ({ src }) => (
  <AbsoluteFill style={{ backgroundColor: "#000" }}>
    <Video
      src={staticFile(src)}
      muted
      style={{ width: "100%", height: "100%", objectFit: "cover" }}
    />
  </AbsoluteFill>
);
