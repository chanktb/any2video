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
import { loadFont as loadFraunces } from "@remotion/google-fonts/Fraunces";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadJBM } from "@remotion/google-fonts/JetBrainsMono";
import { Rise, progressAt } from "../lib/core";
import { KaraokeNeon } from "../lib/karaoke";
import { FootageScene } from "../lib/footage";
import { SCENES } from "./flow-movie-pipeline-tour-data";

// Run: chanktb-flow-movie-pipeline · path B · skin CINEMATIC-TEAL
// Slide = nhãn cấu trúc, voice + karaoke = lời bình (SCENE-DESIGN.md).
// Mỗi scene 1 layout riêng theo design brief trong plan.md.

const { fontFamily: serif } = loadFraunces("normal", {
  weights: ["600", "700"],
  subsets: ["latin", "vietnamese"],
});
const { fontFamily: sans } = loadInter("normal", {
  weights: ["400", "600", "700"],
  subsets: ["latin", "vietnamese"],
});
const { fontFamily: mono } = loadJBM("normal", {
  weights: ["400", "700"],
  subsets: ["latin", "vietnamese"],
});

const C = {
  bgA: "#0F2027",
  bgB: "#1A2942",
  bar: "#05080C",
  fg: "#E9F2F1",
  muted: "#9FB3C8",
  mint: "#4FD1C5",
  rose: "#F687B3",
  line: "rgba(79,209,197,0.35)",
};

// ------------------------------------------------------------------- chrome

// Hạt film grain lơ lửng, deterministic
const Grain: React.FC = () => {
  const frame = useCurrentFrame();
  const dots = Array.from({ length: 40 }, (_, i) => ({
    x: random(`gx${i}`) * 1080,
    y: 190 + random(`gy${i}`) * 1540,
    r: 0.8 + random(`gr${i}`) * 1.8,
    ph: random(`gp${i}`) * Math.PI * 2,
  }));
  return (
    <svg width="1080" height="1920" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {dots.map((d, i) => (
        <circle
          key={i}
          cx={d.x}
          cy={d.y}
          r={d.r}
          fill={C.fg}
          opacity={0.04 + 0.07 * (0.5 + 0.5 * Math.sin(d.ph + frame / 17))}
        />
      ))}
    </svg>
  );
};

// Vỏ scene cinematic: gradient + grain + letterbox 170px + fade 2 mép
const Cine: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const opacity = interpolate(
    frame,
    [0, 9, durationInFrames - 8, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(160deg, ${C.bgA} 0%, ${C.bgB} 100%)`,
        color: C.fg,
        fontFamily: serif,
        opacity,
      }}
    >
      <Grain />
      {children}
    </AbsoluteFill>
  );
};

const Kicker: React.FC<{ text: string; color?: string }> = ({ text, color = C.mint }) => (
  <div
    style={{
      fontFamily: sans,
      fontSize: 26,
      fontWeight: 700,
      letterSpacing: 10,
      textTransform: "uppercase",
      color,
    }}
  >
    {text}
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
    }}
  >
    <Img src={staticFile("brand/chanktb.png")} style={{ width: 30, height: 30, borderRadius: "50%" }} />
    chanktb/flow-movie-pipeline
  </div>
);

// Khung nội dung chuẩn (trong letterbox, trên band karaoke)
const Inner: React.FC<{ children: React.ReactNode; top?: number }> = ({ children, top = 260 }) => (
  <div style={{ position: "absolute", left: 90, right: 90, top }}>{children}</div>
);

const Serif: React.FC<{ children: React.ReactNode; size?: number }> = ({ children, size = 84 }) => (
  <div style={{ fontFamily: serif, fontSize: size, fontWeight: 700, lineHeight: 1.28 }}>{children}</div>
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
    <Cine>
      {/* vệt sáng quét chéo liên tục */}
      <div
        style={{
          position: "absolute",
          left: sweep,
          top: -200,
          width: 220,
          height: 2400,
          rotate: "18deg",
          background:
            "linear-gradient(90deg, transparent, rgba(79,209,197,0.14), transparent)",
        }}
      />
      <Inner top={250}>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <Rise from={1} dur={8}><RepoChip /></Rise>
        </div>
        <div style={{ scale: String(zoom), transformOrigin: "10% 40%", marginTop: 40 }}>
          <Rise from={2} dur={9}>
            <div style={{ fontFamily: serif, fontSize: 96, fontWeight: 700, lineHeight: 1.24 }}>
              Làm video AI
            </div>
          </Rise>
          <Rise from={7} dur={9}>
            <div
              style={{
                fontFamily: serif,
                fontSize: 132,
                fontWeight: 700,
                lineHeight: 1.2,
                color: C.rose,
                textShadow: `0 0 ${30 + 40 * pulse}px rgba(246,135,179,${pulse})`,
              }}
            >
              kiếm tiền
            </div>
          </Rise>
          <Rise from={12} dur={9}>
            <div style={{ fontFamily: serif, fontSize: 82, fontWeight: 700, lineHeight: 1.3, color: C.mint }}>
              YouTube · Facebook
            </div>
          </Rise>
        </div>
      </Inner>
    </Cine>
  );
};

// HOOK B: "phim đẹp nhưng canh máy": đồng hồ kim QUAY + progress render bò
const SHookB: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const pct = Math.min(98, interpolate(frame, [10, durationInFrames], [7, 98]));
  return (
    <Cine>
      <Inner top={250}>
        <Rise from={2}>
          <Serif size={92}>
            Phim thì đẹp,
            <br />
            <span style={{ color: C.rose }}>canh máy thì đuối.</span>
          </Serif>
        </Rise>
        <div style={{ display: "flex", alignItems: "center", gap: 60, marginTop: 90 }}>
          {/* đồng hồ kim quay: thời gian trôi */}
          <Rise from={14}>
            <svg width="300" height="300" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke={C.mint} strokeWidth="2.5" opacity="0.8" />
              {Array.from({ length: 12 }, (_, i) => {
                const a = (i * 30 * Math.PI) / 180;
                return (
                  <line
                    key={i}
                    x1={50 + 36 * Math.sin(a)}
                    y1={50 - 36 * Math.cos(a)}
                    x2={50 + 40 * Math.sin(a)}
                    y2={50 - 40 * Math.cos(a)}
                    stroke={C.mint}
                    strokeWidth="1.6"
                    opacity="0.7"
                  />
                );
              })}
              <g style={{ transformOrigin: "50px 50px", rotate: `${frame * 1.1}deg` }}>
                <line x1="50" y1="50" x2="50" y2="24" stroke={C.fg} strokeWidth="3.4" strokeLinecap="round" />
              </g>
              <g style={{ transformOrigin: "50px 50px", rotate: `${frame * 13}deg` }}>
                <line x1="50" y1="50" x2="50" y2="16" stroke={C.rose} strokeWidth="2.2" strokeLinecap="round" />
              </g>
              <circle cx="50" cy="50" r="3" fill={C.fg} />
            </svg>
          </Rise>
          {/* thanh render bò mãi không xong */}
          <Rise from={22} style={{ flex: 1 }}>
            <div style={{ fontFamily: mono, fontSize: 25, color: C.muted, marginBottom: 14 }}>
              render cảnh 12/40...
            </div>
            <div style={{ height: 22, border: `1.5px solid ${C.line}`, borderRadius: 11, overflow: "hidden" }}>
              <div
                style={{
                  width: `${pct}%`,
                  height: "100%",
                  background: `linear-gradient(90deg, ${C.mint}, rgba(79,209,197,0.5))`,
                }}
              />
            </div>
            <div style={{ fontFamily: mono, fontSize: 27, color: C.mint, marginTop: 12 }}>
              {Math.round(pct)}%
            </div>
            <div style={{ fontFamily: sans, fontSize: 27, color: C.muted, marginTop: 22 }}>
              22:47 · vẫn còn 28 cảnh nữa
            </div>
          </Rise>
        </div>
      </Inner>
    </Cine>
  );
};

const S02: React.FC = () => {
  const frame = useCurrentFrame();
  const words = ["dán", "gửi", "chờ", "tải"];
  const spin = frame * 0.5;
  return (
    <Cine>
      <Inner top={230}>
        <Rise from={2}><Kicker text="Cảnh khó 02" /></Rise>
        <div style={{ position: "relative", height: 640, marginTop: 40 }}>
          <svg width="900" height="640" style={{ position: "absolute" }}>
            <g style={{ transformOrigin: "450px 320px", rotate: `${spin}deg` }}>
              <circle cx="450" cy="320" r="235" fill="none" stroke={C.line} strokeWidth="2.5" strokeDasharray="4 16" />
              <path d="M 450 85 L 466 105 L 442 108 Z" fill={C.mint} />
              <path d="M 450 555 L 434 535 L 458 532 Z" fill={C.mint} />
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
                  left: 450 + 235 * Math.cos(a) - 70,
                  top: 320 + 235 * Math.sin(a) - 34,
                  width: 140,
                  textAlign: "center",
                }}
              >
                <span style={{ fontFamily: serif, fontSize: 52, fontWeight: 700, color: C.fg }}>{w}</span>
              </Rise>
            );
          })}
          <Rise from={46} style={{ position: "absolute", left: 450 - 170, top: 320 - 60, width: 340, textAlign: "center" }}>
            <div style={{ fontFamily: sans, fontSize: 30, fontWeight: 600, color: C.muted, lineHeight: 1.35 }}>
              lặp cho
              <div style={{ fontFamily: serif, fontSize: 48, fontWeight: 700, color: C.mint }}>hàng chục cảnh</div>
            </div>
          </Rise>
        </div>
      </Inner>
    </Cine>
  );
};

const S03: React.FC = () => {
  const frame = useCurrentFrame();
  const ticks = [40, 110, 165, 250, 310, 415];
  return (
    <Cine>
      <Inner top={230}>
        <Rise from={2}><Kicker text="Cảnh khó 03" color={C.rose} /></Rise>
        <Rise from={10} style={{ marginTop: 50 }}>
          <Serif>Google không thích
            <br />
            kẻ vội.</Serif>
        </Rise>
        <div style={{ position: "relative", height: 300, marginTop: 90 }}>
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
                background: C.mint,
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
              background: C.rose,
              boxShadow: `0 0 26px ${C.rose}`,
              opacity: progressAt(frame, 60, 10),
            }}
          />
          <Rise from={64} style={{ position: "absolute", left: 530, top: 190 }}>
            <div style={{ fontFamily: mono, fontSize: 27, color: C.rose, letterSpacing: 3 }}>
              CỜ BOT · đóng băng
            </div>
          </Rise>
        </div>
      </Inner>
    </Cine>
  );
};

const S04: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <Cine>
      <Inner top={230}>
        <Rise from={2}><Kicker text="Cảnh khó 04" /></Rise>
        <Rise from={10} style={{ marginTop: 50 }}>
          <Serif>Soi mắt từng tấm.</Serif>
        </Rise>
        <div style={{ position: "relative", height: 560, marginTop: 60 }}>
          <Rise from={22} style={{ position: "absolute", left: 130 }}>
            <div style={{ width: 420, height: 420, border: `3px solid ${C.fg}`, opacity: 0.9, position: "relative", background: "rgba(233,242,241,0.06)" }}>
              <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: 2, background: C.fg, opacity: 0.5 }} />
              <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 2, background: C.fg, opacity: 0.5 }} />
              <svg width="420" height="420" style={{ position: "absolute", inset: 0, opacity: progressAt(frame, 44, 12) }}>
                <path d="M40 40 L380 380 M380 40 L40 380" stroke={C.rose} strokeWidth="9" strokeLinecap="round" />
              </svg>
            </div>
          </Rise>
          {/* kính lúp */}
          <Rise from={34} style={{ position: "absolute", left: 480, top: 210 }}>
            <svg width="300" height="300" viewBox="0 0 100 100">
              <circle cx="42" cy="42" r="30" fill="none" stroke={C.mint} strokeWidth="4" />
              <line x1="64" y1="64" x2="90" y2="90" stroke={C.mint} strokeWidth="6" strokeLinecap="round" />
            </svg>
          </Rise>
          <Rise from={50} style={{ position: "absolute", left: 130, top: 470 }}>
            <span style={{ fontFamily: mono, fontSize: 26, color: C.rose, letterSpacing: 2 }}>
              lỗi lưới grid 4 ô
            </span>
          </Rise>
        </div>
      </Inner>
    </Cine>
  );
};

const S05: React.FC = () => (
  <Cine>
    <Inner top={230}>
      <Rise from={2}><Kicker text="Cảnh khó 05" /></Rise>
      <Rise from={10} style={{ marginTop: 50 }}>
        <Serif>Xong cảnh
          <br />
          chưa phải xong phim.</Serif>
      </Rise>
      <div style={{ display: "flex", flexDirection: "column", gap: 26, marginTop: 70 }}>
        {["ghép phim", "thuyết minh", "phụ đề"].map((t, i) => (
          <Rise key={t} from={28 + i * 10}>
            <div
              style={{
                marginLeft: i * 60,
                display: "inline-flex",
                alignItems: "center",
                gap: 20,
                border: `1.5px solid ${C.line}`,
                background: "rgba(5,8,12,0.5)",
                padding: "22px 38px",
                fontFamily: sans,
                fontSize: 36,
                fontWeight: 600,
                color: C.muted,
              }}
            >
              <span style={{ width: 14, height: 14, background: C.rose, rotate: "45deg" }} />
              {t}
              <span style={{ fontFamily: mono, fontSize: 24, color: C.rose }}>thủ công</span>
            </div>
          </Rise>
        ))}
      </div>
      <Rise from={62} style={{ marginTop: 46 }}>
        <div style={{ fontFamily: sans, fontSize: 30, color: C.muted }}>cộng thêm một buổi trong CapCut</div>
      </Rise>
    </Inner>
  </Cine>
);

// ----------------------------------------------------------------- 6 REVEAL

const S06: React.FC = () => {
  const frame = useCurrentFrame();
  const spin = (frame * 1.2) % 360;
  return (
    <Cine>
      <Inner top={280}>
        <div style={{ textAlign: "center" }}>
          <Rise from={4}>
            <div
              style={{
                width: 210,
                height: 210,
                margin: "0 auto",
                borderRadius: "50%",
                padding: 7,
                background: `conic-gradient(from ${spin}deg, ${C.mint}, transparent 60%, ${C.mint})`,
              }}
            >
              <Img
                src={staticFile("brand/chanktb.png")}
                style={{ width: 196, height: 196, borderRadius: "50%", border: `6px solid ${C.bgA}` }}
              />
            </div>
          </Rise>
          <Rise from={16} style={{ marginTop: 40 }}>
            <span
              style={{
                fontFamily: mono,
                fontSize: 34,
                fontWeight: 700,
                border: `1.5px solid ${C.line}`,
                borderRadius: 999,
                padding: "14px 34px",
              }}
            >
              chanktb/flow-movie-pipeline
            </span>
          </Rise>
          <Rise from={28} style={{ marginTop: 52 }}>
            <Serif size={88}>
              Dán kịch bản.
              <br />
              <span style={{ color: C.mint }}>Nhận phim.</span>
            </Serif>
          </Rise>
          <Rise from={44} style={{ marginTop: 48 }}>
            <span
              style={{
                fontFamily: sans,
                fontSize: 27,
                fontWeight: 700,
                letterSpacing: 5,
                color: C.mint,
                border: `2px solid ${C.mint}`,
                padding: "12px 30px",
              }}
            >
              ĐANG TEST · SẮP OPEN SOURCE
            </span>
          </Rise>
        </div>
      </Inner>
    </Cine>
  );
};

// ------------------------------------------------- 7 PROOF footage (safari)

const S07: React.FC = () => (
  <AbsoluteFill>
    <FootageScene src="footage/fmp_safari.mp4" />
    <Rise
      from={8}
      style={{ position: "absolute", left: 60, top: 90 }}
    >
      <span
        style={{
          fontFamily: mono,
          fontSize: 24,
          color: C.fg,
          background: "rgba(5,8,12,0.72)",
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
        background: "linear-gradient(180deg, transparent, rgba(5,8,12,0.88) 62%)",
      }}
    />
  </AbsoluteFill>
);

// ------------------------------------------------------- 8 FILM-STRIP FLOW

const S08: React.FC = () => {
  const stages = ["KỊCH BẢN", "ẢNH", "DUYỆT", "VIDEO", "PHIM"];
  return (
    <Cine>
      <Inner top={250}>
        <Rise from={2}><Kicker text="Dây chuyền 5 chặng" /></Rise>
        <Rise from={10} style={{ marginTop: 46 }}>
          <Serif>Một cuộn phim,
            <br />
            chạy tự động.</Serif>
        </Rise>
        <div style={{ marginTop: 90 }}>
          {/* dải phim: lỗ sprocket trên dưới + 5 khung */}
          <div style={{ background: "rgba(5,8,12,0.6)", border: `1.5px solid ${C.line}`, padding: "0 14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 6px" }}>
              {Array.from({ length: 12 }, (_, i) => (
                <span key={i} style={{ width: 26, height: 16, background: C.bgA, border: `1px solid ${C.line}`, borderRadius: 3 }} />
              ))}
            </div>
            <div style={{ display: "flex", gap: 12, padding: "4px 2px" }}>
              {stages.map((s, i) => (
                <Rise key={s} from={26 + i * 8} style={{ flex: 1 }}>
                  <div
                    style={{
                      height: 150,
                      border: `2px solid ${i === stages.length - 1 ? C.mint : "rgba(233,242,241,0.4)"}`,
                      background: i === stages.length - 1 ? "rgba(79,209,197,0.16)" : "rgba(233,242,241,0.04)",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 10,
                    }}
                  >
                    <span style={{ fontFamily: mono, fontSize: 20, color: i === stages.length - 1 ? C.mint : C.muted }}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span
                      style={{
                        fontFamily: sans,
                        fontSize: 21,
                        fontWeight: 700,
                        letterSpacing: 1,
                        color: i === stages.length - 1 ? C.mint : C.fg,
                      }}
                    >
                      {s}
                    </span>
                  </div>
                </Rise>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 6px" }}>
              {Array.from({ length: 12 }, (_, i) => (
                <span key={i} style={{ width: 26, height: 16, background: C.bgA, border: `1px solid ${C.line}`, borderRadius: 3 }} />
              ))}
            </div>
          </div>
          <Rise from={70} style={{ marginTop: 34 }}>
            <div style={{ fontFamily: mono, fontSize: 25, color: C.muted, textAlign: "center" }}>
              run_film.py · 1,275 dòng điều phối · FlowKit 63 file chạy ngầm
            </div>
          </Rise>
        </div>
      </Inner>
    </Cine>
  );
};

// --------------------------------------------------- 9 WEAPON 1: nhịp người

const S09: React.FC = () => {
  const frame = useCurrentFrame();
  const beats = [30, 150, 235, 380, 460, 640];
  return (
    <Cine>
      <Inner top={240}>
        <Rise from={2}><Kicker text="Vũ khí 01 · Nhịp người thật" /></Rise>
        <Rise from={10} style={{ marginTop: 46 }}>
          <Serif>Chậm một nhịp,
            <br />
            <span style={{ color: C.mint }}>an toàn cả phim.</span></Serif>
        </Rise>
        <div style={{ position: "relative", height: 330, marginTop: 80 }}>
          <div style={{ position: "absolute", top: 110, left: 0, right: 0, height: 3, background: C.fg, opacity: 0.65 }} />
          {[0, 150, 300, 450, 600, 750, 900].map((x) => (
            <div key={x} style={{ position: "absolute", left: x, top: 100, width: 2, height: 22, background: C.fg, opacity: 0.35 }} />
          ))}
          {beats.map((x, i) => {
            const flag = i === 4;
            return (
              <div key={i} style={{ position: "absolute", left: x, top: flag ? 62 : 84, opacity: progressAt(frame, 26 + i * 7, 9) }}>
                <div
                  style={{
                    width: flag ? 9 : 6,
                    height: flag ? 72 : 50,
                    background: flag ? C.rose : C.mint,
                    boxShadow: flag ? `0 0 24px ${C.rose}` : "none",
                  }}
                />
              </div>
            );
          })}
          <Rise from={40} style={{ position: "absolute", left: 30, top: 175 }}>
            <span style={{ fontFamily: mono, fontSize: 25, color: C.muted }}>nghỉ 3-8s ngẫu nhiên</span>
          </Rise>
          <Rise from={62} style={{ position: "absolute", left: 500, top: 175 }}>
            <span style={{ fontFamily: mono, fontSize: 25, color: C.rose }}>cờ bot: lùi 20-40s</span>
          </Rise>
          <Rise from={74} style={{ position: "absolute", left: 0, top: 250 }}>
            <span
              style={{
                fontFamily: sans,
                fontSize: 30,
                fontWeight: 700,
                color: C.bgA,
                background: C.mint,
                padding: "12px 30px",
              }}
            >
              1 cảnh / lần · không bắn loạt
            </span>
          </Rise>
        </div>
      </Inner>
    </Cine>
  );
};

// ------------------------------------------------------ 10 WEAPON 2: QC gates

const S10: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <Cine>
      <Inner top={240}>
        <Rise from={2}><Kicker text="Vũ khí 02 · QC hai cửa" /></Rise>
        <Rise from={10} style={{ marginTop: 46 }}>
          <Serif>Ảnh hỏng,
            <br />
            không có vé đi tiếp.</Serif>
        </Rise>
        <div style={{ position: "relative", height: 500, marginTop: 70 }}>
          {[
            { x: 285, label: "GATE 1", sub: "grid detector" },
            { x: 645, label: "GATE 2", sub: "vision judge" },
          ].map((g, i) => (
            <Rise key={g.label} from={18 + i * 8} style={{ position: "absolute", left: g.x, top: 0 }}>
              <div style={{ fontFamily: mono, fontSize: 24, fontWeight: 700, color: C.mint, width: 160, marginLeft: -80, textAlign: "center" }}>
                {g.label}
                <div style={{ fontSize: 20, fontWeight: 400, color: C.muted, marginTop: 4 }}>{g.sub}</div>
              </div>
              <div
                style={{
                  width: 4,
                  height: 300,
                  margin: "16px auto 0",
                  marginLeft: -2,
                  background: `linear-gradient(180deg, ${C.mint}, transparent)`,
                  boxShadow: `0 0 22px ${C.mint}55`,
                }}
              />
            </Rise>
          ))}
          {[0, 190, 460, 800].map((x, i) => {
            const bad = i === 1;
            const fall = bad
              ? interpolate(frame, [56, 80], [0, 200], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.in(Easing.cubic) })
              : 0;
            return (
              <Rise key={i} from={30 + i * 8} style={{ position: "absolute", left: x, top: 120 + fall }}>
                <div
                  style={{
                    width: 130,
                    height: 96,
                    border: `2.5px solid ${bad ? C.rose : "rgba(233,242,241,0.6)"}`,
                    background: "rgba(233,242,241,0.05)",
                    position: "relative",
                    rotate: bad ? `${interpolate(frame, [56, 80], [0, 16], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}deg` : "0deg",
                  }}
                >
                  {bad ? (
                    <svg width="130" height="96" style={{ position: "absolute", inset: 0 }}>
                      <path d="M18 14 L112 82 M112 14 L18 82" stroke={C.rose} strokeWidth="6" strokeLinecap="round" />
                    </svg>
                  ) : (
                    <svg width="130" height="96" viewBox="0 0 130 96" style={{ position: "absolute", inset: 0, opacity: 0.75 }}>
                      <circle cx="96" cy="26" r="11" fill="none" stroke={C.mint} strokeWidth="3" />
                      <path d="M8 78 L44 44 L66 64 L88 50 L122 78" fill="none" stroke={C.mint} strokeWidth="3.5" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <div
                  style={{
                    fontFamily: mono,
                    fontSize: 21,
                    color: bad ? C.rose : C.mint,
                    textAlign: "center",
                    marginTop: 8,
                  }}
                >
                  {bad ? "LÀM LẠI" : "PASS"}
                </div>
              </Rise>
            );
          })}
          <Rise from={76} style={{ position: "absolute", left: 0, top: 440 }}>
            <span style={{ fontFamily: sans, fontSize: 29, fontWeight: 700, color: C.bgA, background: C.mint, padding: "12px 30px" }}>
              tự làm lại ×2 · hỏng nữa mới tới tay bạn
            </span>
          </Rise>
        </div>
      </Inner>
    </Cine>
  );
};

// -------------------------------------------------- 11 WEAPON 3: hậu kỳ rack

const S11: React.FC = () => (
  <Cine>
    <Inner top={240}>
      <Rise from={2}><Kicker text="Vũ khí 03 · Hậu kỳ tự động" /></Rise>
      <Rise from={10} style={{ marginTop: 46 }}>
        <Serif>Máy dựng nốt
          <br />
          phần còn lại.</Serif>
      </Rise>
      <div style={{ display: "flex", flexDirection: "column", gap: 24, marginTop: 76 }}>
        {[
          { t: "thuyết minh giọng tài liệu", d: "M20 50 Q35 20 50 50 T80 50", note: "tự đọc lời dẫn" },
          { t: "phụ đề tự sinh", d: "M22 36 L78 36 M22 52 L64 52", note: "khớp lời thoại" },
          { t: "upscale 1080p", d: "M30 62 L30 38 L44 38 M56 38 L70 38 L70 62", note: "free trên gói Ultra · 4K tốn credit" },
        ].map((r, i) => (
          <Rise key={r.t} from={26 + i * 12}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 30,
                border: `1.5px solid ${C.line}`,
                background: "rgba(5,8,12,0.55)",
                padding: "26px 34px",
              }}
            >
              <svg width="72" height="72" viewBox="0 0 100 100" style={{ flexShrink: 0 }}>
                <rect x="8" y="8" width="84" height="84" rx="10" fill="none" stroke={C.mint} strokeWidth="3" />
                <path d={r.d} fill="none" stroke={C.mint} strokeWidth="4" strokeLinecap="round" />
              </svg>
              <div>
                <div style={{ fontFamily: sans, fontSize: 37, fontWeight: 700, color: C.fg }}>{r.t}</div>
                <div style={{ fontFamily: mono, fontSize: 24, color: C.muted, marginTop: 6 }}>{r.note}</div>
              </div>
            </div>
          </Rise>
        ))}
      </div>
    </Inner>
  </Cine>
);

// ------------------------------------------------------------- 12 CAVEAT

const S12: React.FC = () => (
  <Cine>
    <Inner top={250}>
      <Rise from={2}><Kicker text="Trước khi bấm máy" color={C.rose} /></Rise>
      <Rise from={10} style={{ marginTop: 46 }}>
        <Serif>Biết trước,
          <br />
          xài mới sướng.</Serif>
      </Rise>
      <div style={{ display: "flex", flexDirection: "column", gap: 40, marginTop: 80 }}>
        {[
          "Bám nền web Flow, không API chính thức",
          "Cần gói Google AI Ultra",
          "Google đổi giao diện là phải vá",
        ].map((t, i) => (
          <Rise key={t} from={26 + i * 12}>
            <div style={{ display: "flex", alignItems: "center", gap: 26 }}>
              <span style={{ width: 18, height: 18, background: C.mint, rotate: "45deg", flexShrink: 0 }} />
              <span style={{ fontFamily: sans, fontSize: 38, fontWeight: 600, lineHeight: 1.32, color: C.fg }}>{t}</span>
            </div>
          </Rise>
        ))}
      </div>
      <Rise from={66} style={{ marginTop: 66 }}>
        <div style={{ width: 210, height: 3, background: C.mint, boxShadow: `0 0 24px ${C.mint}` }} />
      </Rise>
    </Inner>
  </Cine>
);

// ------------------------------------------- 13 AUTHOR OUTRO (profile scroll)

const S13: React.FC = () => (
  <AbsoluteFill>
    <FootageScene src="footage/fmp_author.mp4" />
  </AbsoluteFill>
);

// ------------------------------------------------------------- 14 PROMO

const S14: React.FC = () => (
  <Cine>
    <Inner top={640}>
      <div style={{ textAlign: "center" }}>
        <Rise from={6}>
          <div style={{ fontFamily: sans, fontSize: 26, fontWeight: 700, letterSpacing: 10, color: C.muted, textTransform: "uppercase" }}>
            made with
          </div>
        </Rise>
        <Rise from={16} style={{ marginTop: 26 }}>
          <div style={{ fontFamily: serif, fontSize: 120, fontWeight: 700, color: C.fg }}>
            any2video
          </div>
          <div style={{ width: 260, height: 3, background: C.mint, margin: "26px auto 0", boxShadow: `0 0 24px ${C.mint}` }} />
        </Rise>
        <Rise from={34} style={{ marginTop: 40 }}>
          <div style={{ fontFamily: mono, fontSize: 26, color: C.muted }}>
            video này do AI dựng từ chính repo
          </div>
        </Rise>
      </div>
    </Inner>
  </Cine>
);

// ---------------------------------------------------------------------- main

const BODIES: Record<string, React.ReactNode> = {
  s01: <S01 />, hookb: <SHookB />, s02: <S02 />, s03: <S03 />, s04: <S04 />, s05: <S05 />,
  s06: <S06 />, s07: <S07 />, s08: <S08 />, s09: <S09 />, s10: <S10 />,
  s11: <S11 />, s12: <S12 />, s13: <S13 />, s14: <S14 />,
};

export const FlowMoviePipelineTour: React.FC = () => {
  let cursor = 0;
  return (
    <AbsoluteFill style={{ backgroundColor: C.bgA }}>
      {SCENES.map((scene) => {
        const from = cursor;
        cursor += scene.durationInFrames;
        return (
          <Sequence key={scene.id} from={from} durationInFrames={scene.durationInFrames} premountFor={45}>
            {BODIES[scene.id]}
            <KaraokeNeon words={scene.words} fontFamily={sans} kw={C.mint} />
            <Audio src={staticFile(scene.audio)} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
