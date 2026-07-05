import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

// Core helpers for any2video's Remotion render path.
// SKIN-AGNOSTIC: no hardcoded colors/fonts; each video picks a skin (see skins.ts).

export type KWord = { w: string; s: number; e: number };

export type SceneTiming = {
  id: string;
  audio: string;
  durationInFrames: number;
  words: KWord[];
};

export const easeOut = Easing.bezier(0.16, 1, 0.3, 1);

// Pure (hook-free) variants for use inside .map(): hooks must never run in loops
export const countAt = (
  frame: number,
  to: number,
  start: number,
  dur: number,
) =>
  interpolate(frame, [start, start + dur], [0, to], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

export const progressAt = (frame: number, start: number, dur: number) =>
  interpolate(frame, [start, start + dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeOut,
  });

export const useCount = (to: number, start: number, dur: number) => {
  const frame = useCurrentFrame();
  return countAt(frame, to, start, dur);
};

export const useProgress = (start: number, dur: number) => {
  const frame = useCurrentFrame();
  return progressAt(frame, start, dur);
};

// Rise up + fade in (the default, smooth reveal)
export const Rise: React.FC<{
  from: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
  dur?: number;
}> = ({ from, children, style, dur = 18 }) => {
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        opacity: interpolate(frame, [from, from + dur], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: easeOut,
        }),
        translate: `0px ${interpolate(frame, [from, from + dur], [36, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: easeOut,
        })}px`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

// Bouncy pop-in (for pop/comic skins)
export const Pop: React.FC<{
  from: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ from, children, style }) => {
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        opacity: interpolate(frame, [from, from + 14], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }),
        scale: String(
          interpolate(frame, [from, from + 14], [0.7, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.out(Easing.back(1.8)),
          }),
        ),
        ...style,
      }}
    >
      {children}
    </div>
  );
};

// Fade at both scene edges (wraps every scene)
export const SceneFade: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ children, style }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const opacity = interpolate(
    frame,
    [0, 9, durationInFrames - 8, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  return <AbsoluteFill style={{ opacity, ...style }}>{children}</AbsoluteFill>;
};

// Clip a connector line at a rect's edge (HARD rule: connectors never pierce blocks).
// Returns the endpoint of the segment from (x0,y0) toward (x1,y1), stopped at the
// rect edge minus gap px. Slab method: naive per-axis mins produce stub lines.
export const clipLineToRect = (
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  rect: { x1: number; y1: number; x2: number; y2: number },
  gap = 8,
) => {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const txmin = Math.min((rect.x1 - x0) / dx, (rect.x2 - x0) / dx);
  const tymin = Math.min((rect.y1 - y0) / dy, (rect.y2 - y0) / dy);
  const full = Math.hypot(dx, dy);
  const t = Math.max(0, Math.min(1, Math.max(txmin, tymin))) - gap / full;
  return { x: x0 + dx * t, y: y0 + dy * t };
};
