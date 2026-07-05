import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import type { KWord } from "./core";

// Word-level karaoke: 3 variants, picked by skin. Words come from tools/gen_voice.py
// (edge-tts boundary=WordBoundary; phonetic clusters already merged into clean words).
// Standard position: top 1470, above the 4:5 crop guide (y=1635). Scenes must NOT
// place content in this band.

const useSpoken = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return frame / fps;
};

const band: React.CSSProperties = {
  position: "absolute",
  left: 80,
  right: 80,
  top: 1470,
  minHeight: 150,
  display: "flex",
  flexWrap: "wrap",
  justifyContent: "center",
  alignContent: "center",
  columnGap: 12,
  rowGap: 8,
  textAlign: "center",
  fontSize: 38,
  fontWeight: 700,
  lineHeight: 1.35,
};

// Kiểu 1: NEON (skin tối): từ đã đọc trắng, từ đang đọc phát sáng màu kw
export const KaraokeNeon: React.FC<{
  words: KWord[];
  fontFamily: string;
  fg?: string;
  dim?: string;
  kw?: string;
}> = ({ words, fontFamily, fg = "#F5F7FA", dim = "rgba(232,240,250,0.38)", kw = "#4ADE80" }) => {
  const t = useSpoken();
  return (
    <div style={{ ...band, fontFamily, fontWeight: 600 }}>
      {words.map((w, i) => {
        const spoken = t >= w.s;
        const current = t >= w.s && t < w.e + 0.08;
        return (
          <span
            key={i}
            style={{
              color: spoken ? (current ? kw : fg) : dim,
              textShadow: current ? `0 0 22px ${kw}99` : "none",
              scale: current ? "1.06" : "1",
            }}
          >
            {w.w}
          </span>
        );
      })}
    </div>
  );
};

// Kiểu 2: MARKER (skin giấy sáng): từ đang đọc được tô nền như bút dạ quang
export const KaraokeMarker: React.FC<{
  words: KWord[];
  fontFamily: string;
  ink?: string;
  dim?: string;
  marker?: string;
  markerText?: string;
}> = ({
  words,
  fontFamily,
  ink = "#151310",
  dim = "rgba(21,19,16,0.32)",
  marker = "#E8590C",
  markerText = "#F6F3EE",
}) => {
  const t = useSpoken();
  return (
    <div style={{ ...band, fontFamily, fontWeight: 600, fontSize: 37, lineHeight: 1.4 }}>
      {words.map((w, i) => {
        const spoken = t >= w.s;
        const current = t >= w.s && t < w.e + 0.08;
        return (
          <span
            key={i}
            style={{
              color: current ? markerText : spoken ? ink : dim,
              background: current ? marker : "transparent",
              padding: "0 6px",
              borderRadius: 2,
            }}
          >
            {w.w}
          </span>
        );
      })}
    </div>
  );
};

// Kiểu 3: STICKER (skin pop/comic): từ đang đọc nhảy lên sticker có viền
export const KaraokeSticker: React.FC<{
  words: KWord[];
  fontFamily: string;
  ink?: string;
  dim?: string;
  sticker?: string;
}> = ({
  words,
  fontFamily,
  ink = "#1D1814",
  dim = "rgba(29,24,20,0.28)",
  sticker = "#F7B801",
}) => {
  const t = useSpoken();
  return (
    <div style={{ ...band, fontFamily }}>
      {words.map((w, i) => {
        const spoken = t >= w.s;
        const current = t >= w.s && t < w.e + 0.08;
        return (
          <span
            key={i}
            style={{
              color: spoken ? ink : dim,
              background: current ? sticker : "transparent",
              border: current ? `3px solid ${ink}` : "3px solid transparent",
              borderRadius: 10,
              padding: "0 8px",
              rotate: current ? "-2deg" : "0deg",
            }}
          >
            {w.w}
          </span>
        );
      })}
    </div>
  );
};
