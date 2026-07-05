import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  Sequence,
  interpolate,
  random,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Audio } from "@remotion/media";
import { loadFont as loadBVP } from "@remotion/google-fonts/BeVietnamPro";
import { loadFont as loadJBM } from "@remotion/google-fonts/JetBrainsMono";
import { Rise, progressAt } from "../lib/core";
import { KaraokeNeon } from "../lib/karaoke";
import { FootageScene } from "../lib/footage";
import { SCENES } from "./flow-movie-pipeline-tour-data";

// Run: chanktb-flow-movie-pipeline · path B · skin REPO-DARK (tech-dark-neon x escbase)
// Re-skin of the approved tour: same narration/audio/timings (imports the same data
// file), same per-scene structures, new shape language. Safe zone: x 90-990,
// content y 345-1440 (karaoke band 1470-1635 stays empty).

const { fontFamily: sans } = loadBVP("normal", {
  weights: ["500", "700", "800"],
  subsets: ["latin", "vietnamese"],
});
const { fontFamily: mono } = loadJBM("normal", {
  weights: ["400", "700"],
  subsets: ["latin", "vietnamese"],
});

const C = {
  bg: "#070f1d",
  fg: "#F5F7FA",
  muted: "#9fb3c8",
  cyan: "#22d3ee",
  amber: "#fbbf24",
  green: "#4ADE80",
  purple: "#c084fc",
  red: "#ef4444",
  line: "rgba(255,255,255,0.12)",
  cardBg: "rgba(255,255,255,0.04)",
};

// ------------------------------------------------------------------- chrome

// Starfield with a slow twinkle, deterministic
const Stars: React.FC = () => {
  const frame = useCurrentFrame();
  const stars = Array.from({ length: 90 }, (_, i) => ({
    x: random(`sx${i}`) * 1080,
    y: random(`sy${i}`) * 1920,
    r: 0.7 + random(`sr${i}`) * 1.5,
    ph: random(`sp${i}`) * Math.PI * 2,
  }));
  return (
    <svg width="1080" height="1920" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {stars.map((s, i) => (
        <circle
          key={i}
          cx={s.x}
          cy={s.y}
          r={s.r}
          fill="#eaf2fb"
          opacity={0.12 + 0.28 * (0.5 + 0.5 * Math.sin(s.ph + frame / 13))}
        />
      ))}
    </svg>
  );
};

// Scene shell: flat dark bg + starfield + soft radial glow + fade at both edges
const Shell: React.FC<{ children: React.ReactNode; glow?: string }> = ({ children, glow = C.cyan }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const opacity = interpolate(
    frame,
    [0, 9, durationInFrames - 8, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  return (
    <AbsoluteFill style={{ background: C.bg, color: C.fg, fontFamily: sans, opacity }}>
      <Stars />
      <AbsoluteFill
        style={{ background: `radial-gradient(ellipse at 50% 24%, ${glow}1f, transparent 58%)` }}
      />
      {children}
    </AbsoluteFill>
  );
};

// escbase badge pill: opens a scene, colored per beat
const Pill: React.FC<{ text: string; color?: string }> = ({ text, color = C.cyan }) => (
  <span
    style={{
      display: "inline-block",
      fontFamily: mono,
      fontSize: 25,
      fontWeight: 700,
      letterSpacing: 3,
      color,
      border: `1.5px solid ${color}88`,
      borderRadius: 999,
      padding: "11px 26px",
      background: `${color}12`,
    }}
  >
    {text}
  </span>
);

// small token chip
const Chip: React.FC<{ text: string; color?: string }> = ({ text, color = C.cyan }) => (
  <span
    style={{
      display: "inline-block",
      fontFamily: mono,
      fontSize: 24,
      color,
      border: `1px solid ${color}66`,
      borderRadius: 12,
      padding: "9px 20px",
      background: `${color}0f`,
    }}
  >
    {text}
  </span>
);

// glow card panel
const Panel: React.FC<{ children: React.ReactNode; glow?: string; style?: React.CSSProperties }> = ({
  children,
  glow = C.cyan,
  style,
}) => (
  <div
    style={{
      background: C.cardBg,
      border: `1px solid ${C.line}`,
      borderRadius: 24,
      boxShadow: `0 0 40px ${glow}18`,
      ...style,
    }}
  >
    {children}
  </div>
);

const RepoChip: React.FC = () => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 12,
      fontFamily: mono,
      fontSize: 22,
      color: C.muted,
      border: `1px solid ${C.line}`,
      borderRadius: 999,
      padding: "8px 20px",
      background: "rgba(7,15,29,0.6)",
    }}
  >
    <Img src={staticFile("brand/chanktb.png")} style={{ width: 30, height: 30, borderRadius: "50%" }} />
    chanktb/flow-movie-pipeline
  </div>
);

// content frame inside the safe zone (x 90-990, top >= 345)
const Inner: React.FC<{ children: React.ReactNode; top?: number }> = ({ children, top = 345 }) => (
  <div style={{ position: "absolute", left: 90, right: 90, top }}>{children}</div>
);

const Head: React.FC<{ children: React.ReactNode; size?: number }> = ({ children, size = 80 }) => (
  <div style={{ fontFamily: sans, fontSize: size, fontWeight: 800, lineHeight: 1.24 }}>{children}</div>
);

// ------------------------------------------------------- 5 PAIN chapter cards

// HOOK ~3s: keyword to rõ + CHUYỂN ĐỘNG liên tục (zoom + pulse + vệt sáng quét)
const S01: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const zoom = interpolate(frame, [0, durationInFrames], [1, 1.08]);
  const pulse = 0.3 + 0.25 * (0.5 + 0.5 * Math.sin(frame / 4.5));
  const sweep = interpolate(frame % 46, [0, 46], [-500, 1500]);
  return (
    <Shell glow={C.amber}>
      {/* vệt sáng quét chéo liên tục */}
      <div
        style={{
          position: "absolute",
          left: sweep,
          top: -200,
          width: 220,
          height: 2400,
          rotate: "18deg",
          background: "linear-gradient(90deg, transparent, rgba(34,211,238,0.14), transparent)",
        }}
      />
      <Inner top={345}>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <Rise from={1} dur={8}><RepoChip /></Rise>
        </div>
        <div style={{ scale: String(zoom), transformOrigin: "10% 40%", marginTop: 34 }}>
          <Rise from={2} dur={9}>
            <div style={{ fontFamily: sans, fontSize: 92, fontWeight: 800, lineHeight: 1.22 }}>
              Làm video AI
            </div>
          </Rise>
          <Rise from={7} dur={9}>
            <div
              style={{
                fontFamily: sans,
                fontSize: 128,
                fontWeight: 800,
                lineHeight: 1.18,
                color: C.amber,
                textShadow: `0 0 ${30 + 40 * pulse}px rgba(251,191,36,${pulse})`,
              }}
            >
              kiếm tiền
            </div>
          </Rise>
          <Rise from={12} dur={9}>
            <div style={{ fontFamily: sans, fontSize: 76, fontWeight: 800, lineHeight: 1.28, color: C.cyan }}>
              YouTube · Facebook
            </div>
          </Rise>
        </div>
      </Inner>
    </Shell>
  );
};

// HOOK B: "phim đẹp nhưng canh máy": đồng hồ kim QUAY + progress render bò
const SHookB: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const pct = Math.min(98, interpolate(frame, [10, durationInFrames], [7, 98]));
  return (
    <Shell glow={C.red}>
      <Inner top={345}>
        <Rise from={2}>
          <Head size={86}>
            Phim thì đẹp,
            <br />
            <span style={{ color: C.red }}>canh máy thì đuối.</span>
          </Head>
        </Rise>
        <Rise from={14} style={{ marginTop: 60 }}>
          <Panel glow={C.red} style={{ display: "flex", alignItems: "center", gap: 50, padding: "44px 46px" }}>
            {/* đồng hồ kim quay: thời gian trôi */}
            <svg width="260" height="260" viewBox="0 0 100 100" style={{ flexShrink: 0 }}>
              <circle cx="50" cy="50" r="42" fill="none" stroke={C.cyan} strokeWidth="2.5" opacity="0.8" />
              {Array.from({ length: 12 }, (_, i) => {
                const a = (i * 30 * Math.PI) / 180;
                return (
                  <line
                    key={i}
                    x1={50 + 36 * Math.sin(a)}
                    y1={50 - 36 * Math.cos(a)}
                    x2={50 + 40 * Math.sin(a)}
                    y2={50 - 40 * Math.cos(a)}
                    stroke={C.cyan}
                    strokeWidth="1.6"
                    opacity="0.7"
                  />
                );
              })}
              <g style={{ transformOrigin: "50px 50px", rotate: `${frame * 1.1}deg` }}>
                <line x1="50" y1="50" x2="50" y2="24" stroke={C.fg} strokeWidth="3.4" strokeLinecap="round" />
              </g>
              <g style={{ transformOrigin: "50px 50px", rotate: `${frame * 13}deg` }}>
                <line x1="50" y1="50" x2="50" y2="16" stroke={C.red} strokeWidth="2.2" strokeLinecap="round" />
              </g>
              <circle cx="50" cy="50" r="3" fill={C.fg} />
            </svg>
            {/* thanh render bò mãi không xong */}
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: mono, fontSize: 25, color: C.muted, marginBottom: 14 }}>
                render cảnh 12/40...
              </div>
              <div style={{ height: 20, borderRadius: 10, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                <div
                  style={{
                    width: `${pct}%`,
                    height: "100%",
                    borderRadius: 10,
                    background: `linear-gradient(90deg, ${C.cyan}, rgba(34,211,238,0.45))`,
                    boxShadow: `0 0 16px ${C.cyan}`,
                  }}
                />
              </div>
              <div style={{ fontFamily: mono, fontSize: 27, color: C.cyan, marginTop: 12 }}>
                {Math.round(pct)}%
              </div>
              <div style={{ fontFamily: sans, fontSize: 27, fontWeight: 500, color: C.muted, marginTop: 20 }}>
                22:47 · vẫn còn 28 cảnh nữa
              </div>
            </div>
          </Panel>
        </Rise>
      </Inner>
    </Shell>
  );
};

const S02: React.FC = () => {
  const frame = useCurrentFrame();
  const words = ["dán", "gửi", "chờ", "tải"];
  const spin = frame * 0.5;
  return (
    <Shell glow={C.red}>
      <Inner top={345}>
        <Rise from={2}><Pill text="😮‍💨 CẢNH KHÓ 02" color={C.red} /></Rise>
        <div style={{ position: "relative", height: 660, marginTop: 30 }}>
          <svg width="900" height="660" style={{ position: "absolute" }}>
            <g style={{ transformOrigin: "450px 330px", rotate: `${spin}deg` }}>
              <circle cx="450" cy="330" r="235" fill="none" stroke="rgba(34,211,238,0.4)" strokeWidth="2.5" strokeDasharray="4 16" />
              <path d="M 450 95 L 466 115 L 442 118 Z" fill={C.cyan} />
              <path d="M 450 565 L 434 545 L 458 542 Z" fill={C.cyan} />
            </g>
          </svg>
          {words.map((w, i) => {
            const a = (-90 + i * 90) * (Math.PI / 180);
            return (
              <Rise
                key={w}
                from={14 + i * 8}
                style={{
                  position: "absolute",
                  left: 450 + 235 * Math.cos(a) - 90,
                  top: 330 + 235 * Math.sin(a) - 42,
                  width: 180,
                  textAlign: "center",
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    fontFamily: sans,
                    fontSize: 44,
                    fontWeight: 800,
                    color: C.fg,
                    background: C.cardBg,
                    border: `1px solid ${C.line}`,
                    borderRadius: 18,
                    padding: "12px 30px",
                    boxShadow: `0 0 26px ${C.cyan}14`,
                  }}
                >
                  {w}
                </span>
              </Rise>
            );
          })}
          <Rise from={46} style={{ position: "absolute", left: 450 - 170, top: 330 - 58, width: 340, textAlign: "center" }}>
            <div style={{ fontFamily: sans, fontSize: 29, fontWeight: 500, color: C.muted, lineHeight: 1.35 }}>
              lặp cho
              <div style={{ fontFamily: sans, fontSize: 46, fontWeight: 800, color: C.cyan }}>hàng chục cảnh</div>
            </div>
          </Rise>
        </div>
      </Inner>
    </Shell>
  );
};

const S03: React.FC = () => {
  const frame = useCurrentFrame();
  const ticks = [40, 110, 165, 250, 310, 415];
  return (
    <Shell glow={C.red}>
      <Inner top={345}>
        <Rise from={2}><Pill text="🚩 CẢNH KHÓ 03" color={C.red} /></Rise>
        <Rise from={10} style={{ marginTop: 40 }}>
          <Head>Google không thích
            <br />
            kẻ vội.</Head>
        </Rise>
        <div style={{ position: "relative", height: 300, marginTop: 70 }}>
          <div
            style={{
              position: "absolute",
              top: 120,
              left: 0,
              width: 900 * progressAt(frame, 24, 40),
              height: 3,
              background: C.fg,
              opacity: 0.7,
            }}
          />
          {ticks.map((x, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: x,
                top: 96,
                width: 4,
                height: 50,
                background: C.cyan,
                boxShadow: `0 0 12px ${C.cyan}77`,
                opacity: progressAt(frame, 28 + i * 5, 8),
              }}
            />
          ))}
          <div
            style={{
              position: "absolute",
              left: 590,
              top: 74,
              width: 8,
              height: 95,
              background: C.red,
              boxShadow: `0 0 26px ${C.red}`,
              opacity: progressAt(frame, 60, 10),
            }}
          />
          <Rise from={64} style={{ position: "absolute", left: 500, top: 190 }}>
            <Chip text="CỜ BOT · đóng băng" color={C.red} />
          </Rise>
        </div>
      </Inner>
    </Shell>
  );
};

const S04: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <Shell glow={C.red}>
      <Inner top={345}>
        <Rise from={2}><Pill text="🔍 CẢNH KHÓ 04" color={C.red} /></Rise>
        <Rise from={10} style={{ marginTop: 40 }}>
          <Head>Soi mắt từng tấm.</Head>
        </Rise>
        <div style={{ position: "relative", height: 560, marginTop: 46 }}>
          <Rise from={22} style={{ position: "absolute", left: 130 }}>
            <div
              style={{
                width: 420,
                height: 420,
                border: `1px solid ${C.line}`,
                borderRadius: 24,
                position: "relative",
                background: C.cardBg,
                boxShadow: `0 0 34px ${C.red}14`,
                overflow: "hidden",
              }}
            >
              <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: 2, background: C.fg, opacity: 0.35 }} />
              <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 2, background: C.fg, opacity: 0.35 }} />
              <svg width="420" height="420" style={{ position: "absolute", inset: 0, opacity: progressAt(frame, 44, 12) }}>
                <path d="M40 40 L380 380 M380 40 L40 380" stroke={C.red} strokeWidth="9" strokeLinecap="round" />
              </svg>
            </div>
          </Rise>
          {/* kính lúp */}
          <Rise from={34} style={{ position: "absolute", left: 480, top: 210 }}>
            <svg width="300" height="300" viewBox="0 0 100 100">
              <circle cx="42" cy="42" r="30" fill="none" stroke={C.cyan} strokeWidth="4" />
              <line x1="64" y1="64" x2="90" y2="90" stroke={C.cyan} strokeWidth="6" strokeLinecap="round" />
            </svg>
          </Rise>
          <Rise from={50} style={{ position: "absolute", left: 130, top: 466 }}>
            <Chip text="lỗi lưới grid 4 ô" color={C.red} />
          </Rise>
        </div>
      </Inner>
    </Shell>
  );
};

const S05: React.FC = () => (
  <Shell glow={C.red}>
    <Inner top={345}>
      <Rise from={2}><Pill text="🌙 CẢNH KHÓ 05" color={C.red} /></Rise>
      <Rise from={10} style={{ marginTop: 40 }}>
        <Head>Xong cảnh
          <br />
          chưa phải xong phim.</Head>
      </Rise>
      <div style={{ display: "flex", flexDirection: "column", gap: 22, marginTop: 52 }}>
        {[
          ["🎞️", "ghép phim"],
          ["🎙️", "thuyết minh"],
          ["📝", "phụ đề"],
        ].map(([ic, t], i) => (
          <Rise key={t} from={28 + i * 10}>
            <div
              style={{
                marginLeft: i * 60,
                display: "inline-flex",
                alignItems: "center",
                gap: 22,
                background: C.cardBg,
                border: `1px solid ${C.line}`,
                borderRadius: 20,
                padding: "20px 32px",
                boxShadow: `0 0 26px ${C.red}10`,
              }}
            >
              <span style={{ fontSize: 40 }}>{ic}</span>
              <span style={{ fontFamily: sans, fontSize: 35, fontWeight: 700, color: C.fg }}>{t}</span>
              <Chip text="thủ công" color={C.red} />
            </div>
          </Rise>
        ))}
      </div>
      <Rise from={62} style={{ marginTop: 40 }}>
        <div style={{ fontFamily: sans, fontSize: 29, fontWeight: 500, color: C.muted }}>
          cộng thêm một buổi trong CapCut
        </div>
      </Rise>
    </Inner>
  </Shell>
);

// ----------------------------------------------------------------- 6 REVEAL

const S06: React.FC = () => {
  const frame = useCurrentFrame();
  const spin = (frame * 1.2) % 360;
  return (
    <Shell glow={C.cyan}>
      <Inner top={380}>
        <div style={{ textAlign: "center" }}>
          <Rise from={4}>
            <div
              style={{
                width: 200,
                height: 200,
                margin: "0 auto",
                borderRadius: "50%",
                padding: 7,
                background: `conic-gradient(from ${spin}deg, ${C.cyan}, transparent 60%, ${C.cyan})`,
                boxShadow: `0 0 44px ${C.cyan}33`,
              }}
            >
              <Img
                src={staticFile("brand/chanktb.png")}
                style={{ width: 186, height: 186, borderRadius: "50%", border: `6px solid ${C.bg}` }}
              />
            </div>
          </Rise>
          <Rise from={16} style={{ marginTop: 36 }}>
            <span
              style={{
                fontFamily: mono,
                fontSize: 32,
                fontWeight: 700,
                border: `1px solid ${C.line}`,
                borderRadius: 999,
                padding: "14px 34px",
                background: C.cardBg,
              }}
            >
              chanktb/flow-movie-pipeline
            </span>
          </Rise>
          <Rise from={28} style={{ marginTop: 46 }}>
            <Head size={84}>
              Dán kịch bản.
              <br />
              <span style={{ color: C.cyan, textShadow: `0 0 30px ${C.cyan}66` }}>Nhận phim.</span>
            </Head>
          </Rise>
          <Rise from={44} style={{ marginTop: 44 }}>
            <Pill text="ĐANG TEST · SẮP OPEN SOURCE" color={C.amber} />
          </Rise>
        </div>
      </Inner>
    </Shell>
  );
};

// ------------------------------------------------- 7 PROOF footage (safari)

const S07: React.FC = () => (
  <AbsoluteFill>
    <FootageScene src="footage/fmp_safari.mp4" />
    <Rise from={8} style={{ position: "absolute", left: 60, top: 90 }}>
      <span
        style={{
          fontFamily: mono,
          fontSize: 24,
          color: C.fg,
          background: "rgba(7,15,29,0.74)",
          border: `1px solid ${C.line}`,
          borderRadius: 999,
          padding: "10px 24px",
        }}
      >
        phim do máy làm · 4K dọc · african-safari
      </span>
    </Rise>
    {/* scrim đáy cho karaoke */}
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        height: 560,
        background: "linear-gradient(180deg, transparent, rgba(7,15,29,0.9) 62%)",
      }}
    />
  </AbsoluteFill>
);

// ------------------------------------------------------- 8 FILM-STRIP FLOW

const S08: React.FC = () => {
  const stages: Array<[string, string]> = [
    ["📜", "KỊCH BẢN"],
    ["🖼️", "ẢNH"],
    ["✅", "DUYỆT"],
    ["🎬", "VIDEO"],
    ["🍿", "PHIM"],
  ];
  return (
    <Shell glow={C.cyan}>
      <Inner top={345}>
        <Rise from={2}><Pill text="⚙️ DÂY CHUYỀN 5 CHẶNG" /></Rise>
        <Rise from={10} style={{ marginTop: 40 }}>
          <Head>Một cuộn phim,
            <br />
            chạy tự động.</Head>
        </Rise>
        <Rise from={22} style={{ marginTop: 60 }}>
          <Panel style={{ padding: "0 14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 6px" }}>
              {Array.from({ length: 12 }, (_, i) => (
                <span key={i} style={{ width: 26, height: 16, background: C.bg, border: `1px solid ${C.line}`, borderRadius: 3 }} />
              ))}
            </div>
            <div style={{ display: "flex", gap: 12, padding: "4px 2px" }}>
              {stages.map(([ic, s], i) => (
                <Rise key={s} from={26 + i * 8} style={{ flex: 1 }}>
                  <div
                    style={{
                      height: 158,
                      borderRadius: 16,
                      border: `1px solid ${i === stages.length - 1 ? `${C.green}88` : C.line}`,
                      background: i === stages.length - 1 ? `${C.green}14` : "rgba(255,255,255,0.03)",
                      boxShadow: i === stages.length - 1 ? `0 0 26px ${C.green}22` : "none",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                    }}
                  >
                    <span style={{ fontSize: 34 }}>{ic}</span>
                    <span
                      style={{
                        fontFamily: sans,
                        fontSize: 20,
                        fontWeight: 700,
                        letterSpacing: 1,
                        color: i === stages.length - 1 ? C.green : C.fg,
                      }}
                    >
                      {s}
                    </span>
                    <span style={{ fontFamily: mono, fontSize: 17, color: C.muted }}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>
                </Rise>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 6px" }}>
              {Array.from({ length: 12 }, (_, i) => (
                <span key={i} style={{ width: 26, height: 16, background: C.bg, border: `1px solid ${C.line}`, borderRadius: 3 }} />
              ))}
            </div>
          </Panel>
        </Rise>
        <Rise from={70} style={{ marginTop: 32, textAlign: "center" }}>
          <Chip text="run_film.py · 1,275 dòng điều phối · FlowKit 63 file" color={C.purple} />
        </Rise>
      </Inner>
    </Shell>
  );
};

// --------------------------------------------------- 9 WEAPON 1: nhịp người

const S09: React.FC = () => {
  const frame = useCurrentFrame();
  const beats = [30, 150, 235, 380, 460, 640];
  return (
    <Shell glow={C.cyan}>
      <Inner top={345}>
        <Rise from={2}><Pill text="🛡️ VŨ KHÍ 01 · NHỊP NGƯỜI THẬT" /></Rise>
        <Rise from={10} style={{ marginTop: 40 }}>
          <Head>Chậm một nhịp,
            <br />
            <span style={{ color: C.cyan }}>an toàn cả phim.</span></Head>
        </Rise>
        <div style={{ position: "relative", height: 340, marginTop: 64 }}>
          <div style={{ position: "absolute", top: 110, left: 0, right: 0, height: 3, background: C.fg, opacity: 0.55 }} />
          {[0, 150, 300, 450, 600, 750, 900].map((x) => (
            <div key={x} style={{ position: "absolute", left: x, top: 100, width: 2, height: 22, background: C.fg, opacity: 0.3 }} />
          ))}
          {beats.map((x, i) => {
            const flag = i === 4;
            return (
              <div key={i} style={{ position: "absolute", left: x, top: flag ? 62 : 84, opacity: progressAt(frame, 26 + i * 7, 9) }}>
                <div
                  style={{
                    width: flag ? 9 : 6,
                    height: flag ? 72 : 50,
                    background: flag ? C.red : C.cyan,
                    boxShadow: flag ? `0 0 24px ${C.red}` : `0 0 12px ${C.cyan}66`,
                  }}
                />
              </div>
            );
          })}
          <Rise from={40} style={{ position: "absolute", left: 20, top: 175 }}>
            <Chip text="nghỉ 3-8s ngẫu nhiên" />
          </Rise>
          <Rise from={62} style={{ position: "absolute", left: 490, top: 175 }}>
            <Chip text="cờ bot: lùi 20-40s" color={C.red} />
          </Rise>
          <Rise from={74} style={{ position: "absolute", left: 0, top: 258 }}>
            <span
              style={{
                fontFamily: sans,
                fontSize: 30,
                fontWeight: 700,
                color: C.bg,
                background: C.cyan,
                borderRadius: 14,
                padding: "12px 30px",
                boxShadow: `0 0 30px ${C.cyan}55`,
              }}
            >
              1 cảnh / lần · không bắn loạt
            </span>
          </Rise>
        </div>
      </Inner>
    </Shell>
  );
};

// ------------------------------------------------------ 10 WEAPON 2: QC gates

const S10: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <Shell glow={C.cyan}>
      <Inner top={345}>
        <Rise from={2}><Pill text="🛡️ VŨ KHÍ 02 · QC HAI CỬA" /></Rise>
        <Rise from={10} style={{ marginTop: 40 }}>
          <Head>Ảnh hỏng,
            <br />
            không có vé đi tiếp.</Head>
        </Rise>
        <div style={{ position: "relative", height: 520, marginTop: 54 }}>
          {[
            { x: 285, label: "GATE 1", sub: "grid detector" },
            { x: 645, label: "GATE 2", sub: "vision judge" },
          ].map((g, i) => (
            <Rise key={g.label} from={18 + i * 8} style={{ position: "absolute", left: g.x, top: 0 }}>
              <div style={{ fontFamily: mono, fontSize: 24, fontWeight: 700, color: C.cyan, width: 180, marginLeft: -90, textAlign: "center" }}>
                {g.label}
                <div style={{ fontSize: 20, fontWeight: 400, color: C.muted, marginTop: 4 }}>{g.sub}</div>
              </div>
              <div
                style={{
                  width: 4,
                  height: 300,
                  margin: "16px auto 0",
                  marginLeft: -2,
                  background: `linear-gradient(180deg, ${C.cyan}, transparent)`,
                  boxShadow: `0 0 22px ${C.cyan}55`,
                }}
              />
            </Rise>
          ))}
          {[0, 190, 460, 800].map((x, i) => {
            const bad = i === 1;
            const fall = bad
              ? interpolate(frame, [56, 80], [0, 150], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.in(Easing.cubic) })
              : 0;
            return (
              <Rise key={i} from={30 + i * 8} style={{ position: "absolute", left: x, top: 120 + fall }}>
                <div
                  style={{
                    width: 130,
                    height: 96,
                    borderRadius: 12,
                    border: `2px solid ${bad ? C.red : "rgba(255,255,255,0.35)"}`,
                    background: "rgba(255,255,255,0.04)",
                    position: "relative",
                    rotate: bad ? `${interpolate(frame, [56, 80], [0, 16], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}deg` : "0deg",
                    boxShadow: bad ? `0 0 24px ${C.red}44` : "none",
                  }}
                >
                  {bad ? (
                    <svg width="130" height="96" style={{ position: "absolute", inset: 0 }}>
                      <path d="M18 14 L112 82 M112 14 L18 82" stroke={C.red} strokeWidth="6" strokeLinecap="round" />
                    </svg>
                  ) : (
                    <svg width="130" height="96" viewBox="0 0 130 96" style={{ position: "absolute", inset: 0, opacity: 0.8 }}>
                      <circle cx="96" cy="26" r="11" fill="none" stroke={C.green} strokeWidth="3" />
                      <path d="M8 78 L44 44 L66 64 L88 50 L122 78" fill="none" stroke={C.green} strokeWidth="3.5" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <div
                  style={{
                    fontFamily: mono,
                    fontSize: 21,
                    fontWeight: 700,
                    color: bad ? C.red : C.green,
                    textAlign: "center",
                    marginTop: 8,
                  }}
                >
                  {bad ? "LÀM LẠI" : "PASS"}
                </div>
              </Rise>
            );
          })}
          <Rise from={76} style={{ position: "absolute", left: 0, top: 452 }}>
            <span
              style={{
                fontFamily: sans,
                fontSize: 29,
                fontWeight: 700,
                color: C.bg,
                background: C.green,
                borderRadius: 14,
                padding: "12px 30px",
                boxShadow: `0 0 30px ${C.green}55`,
              }}
            >
              tự làm lại ×2 · hỏng nữa mới tới tay bạn
            </span>
          </Rise>
        </div>
      </Inner>
    </Shell>
  );
};

// -------------------------------------------------- 11 WEAPON 3: hậu kỳ rack

const S11: React.FC = () => (
  <Shell glow={C.cyan}>
    <Inner top={345}>
      <Rise from={2}><Pill text="🛡️ VŨ KHÍ 03 · HẬU KỲ TỰ ĐỘNG" /></Rise>
      <Rise from={10} style={{ marginTop: 40 }}>
        <Head>Máy dựng nốt
          <br />
          phần còn lại.</Head>
      </Rise>
      <div style={{ display: "flex", flexDirection: "column", gap: 22, marginTop: 56 }}>
        {[
          { t: "thuyết minh giọng tài liệu", d: "M20 50 Q35 20 50 50 T80 50", note: "tự đọc lời dẫn", c: C.cyan },
          { t: "phụ đề tự sinh", d: "M22 36 L78 36 M22 52 L64 52", note: "khớp lời thoại", c: C.purple },
          { t: "upscale 1080p", d: "M30 62 L30 38 L44 38 M56 38 L70 38 L70 62", note: "free trên gói Ultra · 4K tốn credit", c: C.green },
        ].map((r, i) => (
          <Rise key={r.t} from={26 + i * 12}>
            <Panel glow={r.c} style={{ display: "flex", alignItems: "center", gap: 28, padding: "24px 32px" }}>
              <div
                style={{
                  width: 84,
                  height: 84,
                  flexShrink: 0,
                  borderRadius: 18,
                  border: `1px solid ${r.c}66`,
                  background: `${r.c}10`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg width="58" height="58" viewBox="0 0 100 100">
                  <path d={r.d} fill="none" stroke={r.c} strokeWidth="5" strokeLinecap="round" />
                </svg>
              </div>
              <div>
                <div style={{ fontFamily: sans, fontSize: 36, fontWeight: 700, color: C.fg }}>{r.t}</div>
                <div style={{ fontFamily: mono, fontSize: 23, color: C.muted, marginTop: 6 }}>{r.note}</div>
              </div>
            </Panel>
          </Rise>
        ))}
      </div>
    </Inner>
  </Shell>
);

// ------------------------------------------------------------- 12 CAVEAT

const S12: React.FC = () => (
  <Shell glow={C.amber}>
    <Inner top={345}>
      <Rise from={2}><Pill text="⚠️ TRƯỚC KHI BẤM MÁY" color={C.amber} /></Rise>
      <Rise from={10} style={{ marginTop: 40 }}>
        <Head>Biết trước,
          <br />
          xài mới sướng.</Head>
      </Rise>
      <div style={{ display: "flex", flexDirection: "column", gap: 30, marginTop: 60 }}>
        {[
          "Bám nền web Flow, không API chính thức",
          "Cần gói Google AI Ultra",
          "Google đổi giao diện là phải vá",
        ].map((t, i) => (
          <Rise key={t} from={26 + i * 12}>
            <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
              <div
                style={{
                  width: 62,
                  height: 62,
                  flexShrink: 0,
                  borderRadius: 14,
                  border: `1px solid ${C.amber}66`,
                  background: `${C.amber}10`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: mono,
                  fontSize: 28,
                  fontWeight: 700,
                  color: C.amber,
                }}
              >
                {String(i + 1).padStart(2, "0")}
              </div>
              <span style={{ fontFamily: sans, fontSize: 37, fontWeight: 600, lineHeight: 1.3, color: C.fg }}>{t}</span>
            </div>
          </Rise>
        ))}
      </div>
      <Rise from={66} style={{ marginTop: 56 }}>
        <div style={{ width: 210, height: 3, background: C.amber, boxShadow: `0 0 24px ${C.amber}` }} />
      </Rise>
    </Inner>
  </Shell>
);

// ------------------------------------------- 13 AUTHOR OUTRO (profile scroll)

const S13: React.FC = () => (
  <AbsoluteFill>
    <FootageScene src="footage/fmp_author.mp4" />
  </AbsoluteFill>
);

// ------------------------------------------------------------- 14 PROMO

const S14: React.FC = () => (
  <Shell glow={C.cyan}>
    <Inner top={640}>
      <div style={{ textAlign: "center" }}>
        <Rise from={6}>
          <div style={{ fontFamily: mono, fontSize: 26, fontWeight: 700, letterSpacing: 10, color: C.muted, textTransform: "uppercase" }}>
            made with
          </div>
        </Rise>
        <Rise from={16} style={{ marginTop: 26 }}>
          <div style={{ fontFamily: sans, fontSize: 116, fontWeight: 800, color: C.fg }}>
            any2video
          </div>
          <div style={{ width: 260, height: 3, background: C.cyan, margin: "26px auto 0", boxShadow: `0 0 24px ${C.cyan}` }} />
        </Rise>
        <Rise from={34} style={{ marginTop: 40 }}>
          <div style={{ fontFamily: mono, fontSize: 26, color: C.muted }}>
            video này do AI dựng từ chính repo
          </div>
        </Rise>
      </div>
    </Inner>
  </Shell>
);

// ---------------------------------------------------------------------- main

const BODIES: Record<string, React.ReactNode> = {
  s01: <S01 />, hookb: <SHookB />, s02: <S02 />, s03: <S03 />, s04: <S04 />, s05: <S05 />,
  s06: <S06 />, s07: <S07 />, s08: <S08 />, s09: <S09 />, s10: <S10 />,
  s11: <S11 />, s12: <S12 />, s13: <S13 />, s14: <S14 />,
};

export const FlowMoviePipelineRepoDark: React.FC = () => {
  let cursor = 0;
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      {SCENES.map((scene) => {
        const from = cursor;
        cursor += scene.durationInFrames;
        return (
          <Sequence key={scene.id} from={from} durationInFrames={scene.durationInFrames} premountFor={45}>
            {BODIES[scene.id]}
            <KaraokeNeon words={scene.words} fontFamily={sans} kw={C.cyan} />
            <Audio src={staticFile(scene.audio)} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
