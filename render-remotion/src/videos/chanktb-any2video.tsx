import React from "react";
import {
  AbsoluteFill,
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
import { Rise, countAt, progressAt } from "../lib/core";
import { KaraokeNeon } from "../lib/karaoke";
import { FootageScene } from "../lib/footage";
import { SCENES } from "./chanktb-any2video-data";

// Run: chanktb-any2video (intro v2) · path B · skin REPO-DARK
// Voice: VieNeu-TTS local clone (style tu_nhien, temp 0.5), bilingual <en> tags.
// Safe zone: x 90-990, content y 345-1440 (karaoke band 1470-1635 stays empty).

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
  pink: "#ec4899",
  line: "rgba(255,255,255,0.12)",
  cardBg: "rgba(255,255,255,0.04)",
};

// ------------------------------------------------------------------- chrome

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

const Chip: React.FC<{ text: string; color?: string; size?: number }> = ({ text, color = C.cyan, size = 24 }) => (
  <span
    style={{
      display: "inline-block",
      fontFamily: mono,
      fontSize: size,
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
    chanktb/any2video
  </div>
);

const Inner: React.FC<{ children: React.ReactNode; top?: number }> = ({ children, top = 345 }) => (
  <div style={{ position: "absolute", left: 90, right: 90, top }}>{children}</div>
);

// --------------------------------------------------------------- scene bodies

// S1 HOOK: two VERTICAL feed mock cards (FB / TikTok), centered, sequential reveal
const FeedCard: React.FC<{ hue: string; tag: string; phase: number }> = ({ hue, tag, phase }) => {
  const frame = useCurrentFrame();
  const bob = 9 * Math.sin(frame / 22 + phase);
  return (
    <div
      style={{
        width: 316,
        borderRadius: 22,
        border: `1px solid ${C.line}`,
        background: "rgba(255,255,255,0.03)",
        overflow: "hidden",
        translate: `0px ${bob}px`,
      }}
    >
      <div
        style={{
          height: 372,
          background: `linear-gradient(160deg, ${hue}33, ${hue}0d 70%)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg width="78" height="78" viewBox="0 0 66 66">
          <circle cx="33" cy="33" r="31" fill="rgba(7,15,29,0.7)" stroke={hue} strokeWidth="2" />
          <path d="M27 21 L48 33 L27 45 Z" fill={hue} />
        </svg>
      </div>
      <div style={{ padding: "16px 20px 20px" }}>
        <div style={{ fontFamily: mono, fontSize: 20, color: hue, marginBottom: 10 }}>{tag}</div>
        <div style={{ height: 12, width: "82%", borderRadius: 6, background: "rgba(255,255,255,0.16)" }} />
        <div style={{ height: 12, width: "55%", borderRadius: 6, background: "rgba(255,255,255,0.09)", marginTop: 9 }} />
      </div>
    </div>
  );
};

const S01: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const zoom = interpolate(frame, [0, durationInFrames], [1, 1.06]);
  const pulse = 0.4 + 0.3 * (0.5 + 0.5 * Math.sin(frame / 5));
  const sweep = interpolate(frame % 52, [0, 52], [-500, 1500]);
  return (
    <Shell glow={C.cyan}>
      <div
        style={{
          position: "absolute",
          left: sweep,
          top: -200,
          width: 220,
          height: 2400,
          rotate: "18deg",
          background: "linear-gradient(90deg, transparent, rgba(34,211,238,0.13), transparent)",
        }}
      />
      <Inner top={345}>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <Rise from={3} dur={9}><RepoChip /></Rise>
        </div>
        <div style={{ scale: String(zoom), transformOrigin: "12% 30%", marginTop: 26 }}>
          <Rise from={2} dur={10}>
            <div style={{ fontSize: 66, fontWeight: 800, lineHeight: 1.24 }}>Lướt đâu cũng gặp</div>
          </Rise>
          <Rise from={8} dur={10}>
            <div
              style={{
                fontSize: 118,
                fontWeight: 800,
                lineHeight: 1.16,
                color: C.cyan,
                textShadow: `0 0 ${26 + 34 * pulse}px rgba(34,211,238,${pulse})`,
              }}
            >
              VIDEO REPO
            </div>
          </Rise>
          <Rise from={14} dur={10}>
            <div style={{ fontSize: 86, fontWeight: 800, lineHeight: 1.22, color: C.amber }}>
              TIN AI DỰNG ĐẸP
            </div>
          </Rise>
        </div>
        <div style={{ display: "flex", gap: 44, marginTop: 44, justifyContent: "center" }}>
          <Rise from={55} dur={16}><FeedCard hue={C.cyan} tag="Facebook Reels" phase={0} /></Rise>
          <Rise from={120} dur={16}><FeedCard hue={C.pink} tag="TikTok" phase={2.1} /></Rise>
        </div>
      </Inner>
    </Shell>
  );
};

// S2: giant question mark + pill
const S02: React.FC = () => {
  const frame = useCurrentFrame();
  const pulse = 0.4 + 0.3 * (0.5 + 0.5 * Math.sin(frame / 5));
  const drift = 8 * Math.sin(frame / 18);
  return (
    <Shell glow={C.amber}>
      <Inner top={345}>
        <Rise from={2} dur={10}>
          <div style={{ fontSize: 62, fontWeight: 800, lineHeight: 1.24 }}>Câu hỏi quen thuộc</div>
        </Rise>
        <div style={{ display: "flex", justifyContent: "center", marginTop: 6 }}>
          <Rise from={8} dur={14}>
            <div
              style={{
                fontFamily: mono,
                fontSize: 460,
                fontWeight: 700,
                lineHeight: 1.0,
                color: C.amber,
                translate: `0px ${drift}px`,
                textShadow: `0 0 ${40 + 60 * pulse}px rgba(251,191,36,${0.5 * pulse})`,
              }}
            >
              ?
            </div>
          </Rise>
        </div>
        <div style={{ display: "flex", justifyContent: "center", marginTop: 10 }}>
          <Rise from={20} dur={12}><Pill text="LÀM BẰNG GÌ?" color={C.amber} /></Rise>
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 18, marginTop: 40 }}>
          <Rise from={30} dur={12}><Chip text="ngày nào cũng ra clip" color={C.cyan} /></Rise>
        </div>
      </Inner>
    </Shell>
  );
};

// S3: DIY hours vs editor price
const S03: React.FC = () => {
  const frame = useCurrentFrame();
  const hours = countAt(frame, 4, 22, 46);
  const pulse = 0.5 + 0.5 * Math.sin(frame / 6);
  return (
    <Shell glow={C.red}>
      <Inner top={345}>
        <Rise from={2} dur={10}>
          <div style={{ fontSize: 62, fontWeight: 800, lineHeight: 1.24 }}>
            Hai lựa chọn, <span style={{ color: C.red }}>cùng đau ví</span>
          </div>
        </Rise>
        <div style={{ display: "flex", gap: 24, marginTop: 48 }}>
          <Rise from={14} dur={12} style={{ flex: 1 }}>
            <Panel glow={C.amber} style={{ padding: "34px 30px", height: 470 }}>
              <Chip text="TỰ DỰNG" color={C.amber} />
              <div style={{ fontFamily: mono, fontSize: 150, fontWeight: 700, lineHeight: 1.0, marginTop: 46, color: C.amber }}>
                {Math.round(hours)}h+
              </div>
              <div style={{ fontSize: 32, color: C.muted, marginTop: 26, lineHeight: 1.4 }}>
                cả buổi tối cho một clip 60 giây
              </div>
            </Panel>
          </Rise>
          <Rise from={26} dur={12} style={{ flex: 1 }}>
            <Panel glow={C.red} style={{ padding: "34px 30px", height: 470 }}>
              <Chip text="THUÊ EDITOR" color={C.red} />
              <div
                style={{
                  fontFamily: mono,
                  fontSize: 150,
                  fontWeight: 700,
                  lineHeight: 1.0,
                  marginTop: 46,
                  color: C.red,
                  textShadow: `0 0 ${20 + 26 * pulse}px rgba(239,68,68,0.5)`,
                }}
              >
                $$$
              </div>
              <div style={{ fontSize: 32, color: C.muted, marginTop: 26, lineHeight: 1.4 }}>
                giá không hề dễ chịu
              </div>
            </Panel>
          </Rise>
        </div>
      </Inner>
    </Shell>
  );
};

// S4: template tools = identical frames on a conveyor
const CloneFrame: React.FC<{ dim?: number }> = ({ dim = 1 }) => (
  <div
    style={{
      width: 210,
      height: 372,
      borderRadius: 18,
      border: `1px solid ${C.line}`,
      background: "rgba(255,255,255,0.03)",
      padding: 18,
      opacity: dim,
      flexShrink: 0,
    }}
  >
    <div style={{ height: 16, width: "70%", borderRadius: 8, background: "rgba(255,255,255,0.2)" }} />
    <div style={{ height: 120, borderRadius: 12, background: "rgba(255,255,255,0.08)", marginTop: 16 }} />
    <div style={{ height: 12, width: "85%", borderRadius: 6, background: "rgba(255,255,255,0.13)", marginTop: 16 }} />
    <div style={{ height: 12, width: "60%", borderRadius: 6, background: "rgba(255,255,255,0.08)", marginTop: 10 }} />
    <div style={{ height: 36, width: 110, borderRadius: 999, border: `1px solid ${C.line}`, marginTop: 22 }} />
  </div>
);

const S04: React.FC = () => {
  const frame = useCurrentFrame();
  const step = 210 + 24;
  const shift = (frame * 2.2) % step;
  return (
    <Shell glow={C.red}>
      <Inner top={345}>
        <Rise from={2} dur={10}>
          <div style={{ fontSize: 62, fontWeight: 800, lineHeight: 1.24 }}>
            Tool template thì <span style={{ color: C.red }}>một khuôn</span>
          </div>
        </Rise>
        <div style={{ overflow: "hidden", marginTop: 52, width: 900 }}>
          <Rise from={12} dur={12}>
            <div style={{ display: "flex", gap: 24, translate: `${-shift}px 0px`, width: 1500 }}>
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <CloneFrame key={i} dim={0.9 - 0.06 * i} />
              ))}
            </div>
          </Rise>
        </div>
        <div style={{ display: "flex", justifyContent: "center", marginTop: 48 }}>
          <Rise from={30} dur={12}>
            <Chip text="người xem lướt qua trong nửa giây" color={C.red} size={27} />
          </Rise>
        </div>
      </Inner>
    </Shell>
  );
};

// S5 REVEAL: identity card + LINK -> AI -> VIDEO flow
const S05: React.FC = () => {
  const frame = useCurrentFrame();
  const glowP = 0.5 + 0.5 * Math.sin(frame / 7);
  const a1 = progressAt(frame, 96, 22);
  const a2 = progressAt(frame, 126, 22);
  return (
    <Shell glow={C.cyan}>
      <Inner top={360}>
        <Rise from={4} dur={14}>
          <Panel glow={C.cyan} style={{ padding: "44px 40px", textAlign: "center", boxShadow: `0 0 ${50 + 40 * glowP}px rgba(34,211,238,0.25)` }}>
            <Img
              src={staticFile("brand/chanktb.png")}
              style={{ width: 128, height: 128, borderRadius: "50%", border: `2px solid ${C.cyan}66` }}
            />
            <div style={{ fontFamily: mono, fontSize: 56, fontWeight: 700, marginTop: 24, lineHeight: 1.2 }}>
              chanktb/<span style={{ color: C.cyan }}>any2video</span>
            </div>
            <div style={{ fontSize: 33, color: C.muted, marginTop: 16, lineHeight: 1.4 }}>
              any input, one designed video
            </div>
            <div style={{ marginTop: 26 }}>
              <Chip text="Mới ra mắt · Open Source" color={C.green} />
            </div>
          </Panel>
        </Rise>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, marginTop: 60 }}>
          <Rise from={80} dur={12}><Chip text="LINK" color={C.muted} size={30} /></Rise>
          <svg width="86" height="20" style={{ overflow: "visible" }}>
            <line x1="4" y1="10" x2={4 + 70 * a1} y2="10" stroke={C.cyan} strokeWidth="3" />
            {a1 > 0.95 && <path d="M66 2 L80 10 L66 18 Z" fill={C.cyan} />}
          </svg>
          <Rise from={104} dur={12}><Chip text="AI" color={C.cyan} size={30} /></Rise>
          <svg width="86" height="20" style={{ overflow: "visible" }}>
            <line x1="4" y1="10" x2={4 + 70 * a2} y2="10" stroke={C.cyan} strokeWidth="3" />
            {a2 > 0.95 && <path d="M66 2 L80 10 L66 18 Z" fill={C.cyan} />}
          </svg>
          <Rise from={134} dur={12}><Chip text="VIDEO 9:16" color={C.green} size={30} /></Rise>
        </div>
      </Inner>
    </Shell>
  );
};

// S7: 5-step pipeline lighting up
const S07: React.FC = () => {
  const frame = useCurrentFrame();
  const steps = ["ĐỌC NGUỒN", "KỊCH BẢN", "GIỌNG ĐỌC", "DỰNG HÌNH", "SOÁT LỖI"];
  const startF = (i: number) => 18 + i * 34;
  return (
    <Shell glow={C.cyan}>
      <Inner top={345}>
        <Rise from={2} dur={10}><Pill text="5 BƯỚC · MỘT EKIP" color={C.cyan} /></Rise>
        <div style={{ position: "relative", marginTop: 40 }}>
          <svg width="900" height="980" style={{ position: "absolute", left: 0, top: 0 }}>
            {steps.slice(0, -1).map((_, i) => {
              // connector doctrine: circle-center x, start/end at the circle EDGES + 6px gap
              const yStart = 96 + i * 196 + 88 + 6;
              const yEnd = 96 + (i + 1) * 196 - 6;
              const p = progressAt(frame, startF(i) + 16, 26);
              return (
                <line
                  key={i}
                  x1="44"
                  y1={yStart}
                  x2="44"
                  y2={yStart + (yEnd - yStart) * p}
                  stroke={C.cyan}
                  strokeWidth="3"
                  opacity="0.7"
                />
              );
            })}
          </svg>
          {steps.map((label, i) => {
            const on = progressAt(frame, startF(i), 16);
            return (
              <div
                key={label}
                style={{
                  position: "absolute",
                  left: 0,
                  top: 96 + i * 196,
                  display: "flex",
                  alignItems: "center",
                  gap: 30,
                  opacity: 0.25 + 0.75 * on,
                }}
              >
                <div
                  style={{
                    width: 88,
                    height: 88,
                    borderRadius: "50%",
                    border: `2.5px solid ${C.cyan}`,
                    background: `rgba(34,211,238,${0.05 + 0.14 * on})`,
                    boxShadow: `0 0 ${34 * on}px rgba(34,211,238,0.5)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: mono,
                    fontSize: 38,
                    fontWeight: 700,
                    color: C.cyan,
                  }}
                >
                  {i + 1}
                </div>
                <div style={{ fontSize: 56, fontWeight: 800, lineHeight: 1.22 }}>{label}</div>
              </div>
            );
          })}
        </div>
      </Inner>
    </Shell>
  );
};

// S8: no template pool vs free-compose reflow
const S08: React.FC = () => {
  const frame = useCurrentFrame();
  const cross = progressAt(frame, 30, 22);
  // free-compose blocks reflow between two layouts
  const t = progressAt(frame, 90, 40);
  const lay = (a: number, b: number) => a + (b - a) * t;
  const blocks = [
    { x: lay(20, 20), y: lay(20, 20), w: lay(360, 170), h: lay(120, 300), c: C.cyan },
    { x: lay(20, 210), y: lay(160, 20), w: lay(170, 170), h: lay(200, 140), c: C.purple },
    { x: lay(210, 210), y: lay(160, 180), w: lay(170, 170), h: lay(200, 140), c: C.green },
    { x: lay(20, 20), y: lay(380, 340), w: lay(360, 360), h: lay(90, 130), c: C.amber },
  ];
  return (
    <Shell glow={C.cyan}>
      <Inner top={345}>
        <Rise from={2} dur={10}>
          <div style={{ fontSize: 60, fontWeight: 800, lineHeight: 1.24 }}>
            Không kho template, <span style={{ color: C.cyan }}>thiết kế riêng</span>
          </div>
        </Rise>
        <div style={{ display: "flex", gap: 24, marginTop: 46, alignItems: "stretch" }}>
          <Rise from={14} dur={12}>
            <Panel glow={C.red} style={{ width: 400, height: 560, padding: 0, position: "relative", overflow: "hidden" }}>
              <div style={{ padding: "22px 24px 0" }}><Chip text="KHO TEMPLATE" color={C.muted} /></div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, padding: 24, opacity: 0.5 }}>
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} style={{ height: 170, borderRadius: 14, border: `1px solid ${C.line}`, background: "rgba(255,255,255,0.05)", padding: 12 }}>
                    <div style={{ height: 10, width: "65%", borderRadius: 5, background: "rgba(255,255,255,0.2)" }} />
                    <div style={{ height: 62, borderRadius: 8, background: "rgba(255,255,255,0.08)", marginTop: 10 }} />
                    <div style={{ height: 8, width: "80%", borderRadius: 4, background: "rgba(255,255,255,0.12)", marginTop: 10 }} />
                  </div>
                ))}
              </div>
              <svg width="400" height="560" style={{ position: "absolute", inset: 0 }}>
                <line x1="40" y1="90" x2={40 + 320 * cross} y2={90 + 420 * cross} stroke={C.red} strokeWidth="7" strokeLinecap="round" />
                <line x1="360" y1="90" x2={360 - 320 * cross} y2={90 + 420 * cross} stroke={C.red} strokeWidth="7" strokeLinecap="round" />
              </svg>
            </Panel>
          </Rise>
          <Rise from={26} dur={12}>
            <Panel glow={C.cyan} style={{ width: 476, height: 560, position: "relative", overflow: "hidden" }}>
              <div style={{ padding: "22px 24px 0" }}><Chip text="FREE-COMPOSE" color={C.cyan} /></div>
              <div style={{ position: "absolute", left: 38, top: 84, width: 400, height: 456 }}>
                {blocks.map((b, i) => (
                  <div
                    key={i}
                    style={{
                      position: "absolute",
                      left: b.x,
                      top: b.y,
                      width: b.w,
                      height: b.h,
                      borderRadius: 14,
                      border: `1.5px solid ${b.c}aa`,
                      background: `${b.c}14`,
                      boxShadow: `0 0 22px ${b.c}22`,
                    }}
                  />
                ))}
              </div>
            </Panel>
          </Rise>
        </div>
      </Inner>
    </Shell>
  );
};

// S9: Remotion = live counter + self-drawing chart + ring
const S09: React.FC = () => {
  const frame = useCurrentFrame();
  const n = Math.round(countAt(frame, 1000, 20, 70));
  const chart = progressAt(frame, 26, 80);
  const ringP = progressAt(frame, 32, 76);
  const pct = Math.round(82 * ringP);
  const circ = 2 * Math.PI * 74;
  const pts = [
    [10, 200], [90, 150], [170, 168], [250, 96], [330, 118], [410, 30],
  ];
  const shown = Math.max(2, Math.ceil(pts.length * chart));
  const path = pts.slice(0, shown).map((p, i) => `${i === 0 ? "M" : "L"}${p[0]} ${p[1]}`).join(" ");
  return (
    <Shell glow={C.purple}>
      <Inner top={345}>
        <Rise from={2} dur={10}><Pill text="ĐỘNG THEO TỪNG KHUNG HÌNH" color={C.purple} /></Rise>
        <div style={{ display: "flex", gap: 22, marginTop: 44 }}>
          <Rise from={12} dur={12} style={{ flex: 1 }}>
            <Panel glow={C.cyan} style={{ padding: "28px 22px", height: 420, textAlign: "center" }}>
              <Chip text="SỐ TỰ ĐẾM" color={C.cyan} size={20} />
              <div style={{ fontFamily: mono, fontSize: 88, fontWeight: 700, marginTop: 92, color: C.cyan, lineHeight: 1.0 }}>
                {n.toLocaleString("vi-VN")}
              </div>
            </Panel>
          </Rise>
          <Rise from={20} dur={12} style={{ flex: 1 }}>
            <Panel glow={C.green} style={{ padding: "28px 12px", height: 420, textAlign: "center" }}>
              <Chip text="CHART TỰ VẼ" color={C.green} size={20} />
              <svg width="240" height="240" viewBox="0 0 430 240" style={{ marginTop: 46 }}>
                <path d={path} fill="none" stroke={C.green} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
                {pts.slice(0, shown).map((p, i) => (
                  <circle key={i} cx={p[0]} cy={p[1]} r="9" fill={C.green} />
                ))}
              </svg>
            </Panel>
          </Rise>
          <Rise from={28} dur={12} style={{ flex: 1 }}>
            <Panel glow={C.purple} style={{ padding: "28px 22px", height: 420, textAlign: "center" }}>
              <Chip text="RING TỰ CHẠY" color={C.purple} size={20} />
              <div style={{ position: "relative", marginTop: 40, display: "inline-block" }}>
                <svg width="180" height="180">
                  <circle cx="90" cy="90" r="74" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="13" />
                  <circle
                    cx="90"
                    cy="90"
                    r="74"
                    fill="none"
                    stroke={C.purple}
                    strokeWidth="13"
                    strokeLinecap="round"
                    strokeDasharray={circ}
                    strokeDashoffset={circ * (1 - 0.82 * ringP)}
                    transform="rotate(-90 90 90)"
                  />
                </svg>
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: mono,
                    fontSize: 46,
                    fontWeight: 700,
                    color: C.purple,
                  }}
                >
                  {pct}%
                </div>
              </div>
            </Panel>
          </Rise>
        </div>
        <div style={{ display: "flex", justifyContent: "center", marginTop: 44 }}>
          <Rise from={60} dur={12}><Chip text="không phải ảnh tĩnh ghép nhạc" color={C.muted} size={26} /></Rise>
        </div>
      </Inner>
    </Shell>
  );
};

// S10: 14 real skin previews, two counter-scrolling rows
const SKIN_FILES = [
  "01-terminal-crt", "02-blueprint", "03-swiss", "04-keynote-clean", "05-poster-70s",
  "06-cinematic-teal", "07-comic", "08-notebook", "09-chalkboard", "10-tech-dark-neon",
  "11-escbase-starfield", "12-mono-editorial", "13-pop-sticker", "14-repo-dark",
];

const SkinRow: React.FC<{ files: string[]; dir: 1 | -1; speed: number }> = ({ files, dir, speed }) => {
  const frame = useCurrentFrame();
  const cardW = 236;
  const gap = 18;
  const span = files.length * (cardW + gap);
  const raw = (frame * speed) % span;
  const shift = dir === -1 ? -raw : raw - span;
  return (
    <div style={{ overflow: "hidden", width: 900 }}>
      <div style={{ display: "flex", gap, translate: `${shift}px 0px`, width: span * 2 }}>
        {[...files, ...files].map((f, i) => (
          <Img
            key={`${f}${i}`}
            src={staticFile(`footage/skins/${f}.png`)}
            style={{
              width: cardW,
              height: 419,
              borderRadius: 16,
              border: `1px solid ${C.line}`,
              objectFit: "cover",
              flexShrink: 0,
            }}
          />
        ))}
      </div>
    </div>
  );
};

const S10: React.FC = () => {
  const frame = useCurrentFrame();
  const n = Math.round(countAt(frame, 14, 14, 40));
  return (
    <Shell glow={C.cyan}>
      <Inner top={345}>
        <Rise from={2} dur={10}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 24 }}>
            <div style={{ fontFamily: mono, fontSize: 128, fontWeight: 700, lineHeight: 1.0, color: C.cyan }}>{n}</div>
            <div style={{ fontSize: 62, fontWeight: 800, lineHeight: 1.2 }}>SKINS</div>
          </div>
        </Rise>
        <div style={{ marginTop: 40 }}>
          <Rise from={14} dur={14}><SkinRow files={SKIN_FILES.slice(0, 7)} dir={-1} speed={1.7} /></Rise>
        </div>
        <div style={{ marginTop: 20 }}>
          <Rise from={22} dur={14}><SkinRow files={SKIN_FILES.slice(7)} dir={1} speed={1.5} /></Rise>
        </div>
      </Inner>
    </Shell>
  );
};

// S11: same wireframe, three skins
const MiniFrame: React.FC<{ bg: string; stroke: string; text: string; label: string; on: number }> = ({
  bg,
  stroke,
  text,
  label,
  on,
}) => (
  <div style={{ textAlign: "center" }}>
    <div
      style={{
        width: 262,
        height: 466,
        borderRadius: 20,
        background: bg,
        border: `1.5px solid ${stroke}${on > 0.5 ? "ff" : "55"}`,
        boxShadow: on > 0.5 ? `0 0 42px ${stroke}55` : "none",
        scale: String(1 + 0.05 * on),
        padding: 20,
        textAlign: "left",
      }}
    >
      <div style={{ height: 18, width: "62%", borderRadius: 9, background: stroke, opacity: 0.9 }} />
      <div style={{ height: 10, width: "84%", borderRadius: 5, background: text, opacity: 0.35, marginTop: 14 }} />
      <div style={{ height: 10, width: "70%", borderRadius: 5, background: text, opacity: 0.25, marginTop: 9 }} />
      <div style={{ display: "flex", alignItems: "flex-end", gap: 12, height: 130, marginTop: 26 }}>
        {[56, 92, 70, 118].map((h, i) => (
          <div key={i} style={{ width: 38, height: h, borderRadius: 7, background: stroke, opacity: 0.75 }} />
        ))}
      </div>
      <div style={{ height: 40, width: 128, borderRadius: 999, border: `1.5px solid ${stroke}`, marginTop: 30 }} />
    </div>
    <div style={{ fontFamily: mono, fontSize: 21, color: C.muted, marginTop: 14 }}>{label}</div>
  </div>
);

const S11: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const seg = durationInFrames / 3;
  const active = Math.min(2, Math.floor(frame / seg));
  const on = (i: number) => (i === active ? 1 : 0);
  return (
    <Shell glow={C.cyan}>
      <Inner top={345}>
        <Rise from={2} dur={10}><Pill text="CÙNG KỊCH BẢN · KHÁC SKIN" color={C.cyan} /></Rise>
        <div style={{ display: "flex", gap: 28, marginTop: 52, justifyContent: "center" }}>
          <Rise from={10} dur={12}>
            <MiniFrame bg="#04160a" stroke={C.green} text="#d7ffe0" label="terminal-crt" on={on(0)} />
          </Rise>
          <Rise from={16} dur={12}>
            <MiniFrame bg="#FFF7ED" stroke={C.pink} text="#3b2130" label="pop-sticker" on={on(1)} />
          </Rise>
          <Rise from={22} dur={12}>
            <MiniFrame bg="#070f1d" stroke={C.cyan} text="#eaf2fb" label="repo-dark" on={on(2)} />
          </Rise>
        </div>
        <div style={{ display: "flex", justifyContent: "center", marginTop: 46 }}>
          <Rise from={34} dur={12}><Chip text="không sửa một chữ nào" color={C.muted} size={26} /></Rise>
        </div>
      </Inner>
    </Shell>
  );
};

// S12: three voice paths
const WaveBar: React.FC<{ color: string; seedOff: number; boost?: number }> = ({ color, seedOff, boost = 1 }) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7, height: 52 }}>
      {Array.from({ length: 26 }, (_, i) => {
        const h = (14 + 30 * (0.5 + 0.5 * Math.sin(frame / 3.2 + i * 0.8 + seedOff))) * boost;
        return <div key={i} style={{ width: 9, height: h, borderRadius: 5, background: color, opacity: 0.85 }} />;
      })}
    </div>
  );
};

const VoiceRow: React.FC<{ name: string; tag: string; color: string; hot?: boolean; seedOff: number }> = ({
  name,
  tag,
  color,
  hot,
  seedOff,
}) => (
  <Panel
    glow={color}
    style={{
      padding: "26px 32px",
      border: hot ? `1.5px solid ${color}cc` : `1px solid ${C.line}`,
      boxShadow: hot ? `0 0 46px ${color}33` : undefined,
    }}
  >
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div style={{ fontFamily: mono, fontSize: 40, fontWeight: 700, color: hot ? color : C.fg }}>{name}</div>
      <Chip text={tag} color={color} size={22} />
    </div>
    <div style={{ marginTop: 18 }}>
      <WaveBar color={color} seedOff={seedOff} boost={hot ? 1.15 : 0.7} />
    </div>
  </Panel>
);

const S12: React.FC = () => (
  <Shell glow={C.green}>
    <Inner top={345}>
      <Rise from={2} dur={10}>
        <div style={{ fontSize: 60, fontWeight: 800, lineHeight: 1.24 }}>
          Ba đường <span style={{ color: C.green }}>giọng đọc</span>
        </div>
      </Rise>
      <div style={{ display: "flex", flexDirection: "column", gap: 26, marginTop: 46 }}>
        <Rise from={14} dur={12}><VoiceRow name="EDGE-TTS" tag="FREE" color={C.cyan} seedOff={0} /></Rise>
        <Rise from={26} dur={12}><VoiceRow name="GOOGLE CHIRP3" tag="HD · PAID" color={C.purple} seedOff={2} /></Rise>
        <Rise from={38} dur={12}><VoiceRow name="LOCAL CLONE" tag="ĐANG DÙNG" color={C.green} hot seedOff={4} /></Rise>
      </div>
    </Inner>
  </Shell>
);

// S13: meta proof, this very voice is a local clone
const S13: React.FC = () => {
  const frame = useCurrentFrame();
  const chev = (i: number) => 0.2 + 0.8 * (0.5 + 0.5 * Math.sin(frame / 6 - i * 1.1));
  return (
    <Shell glow={C.green}>
      <Inner top={360}>
        <Rise from={2} dur={12}>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <Pill text="GIỌNG NÀY LÀ CLONE LOCAL" color={C.green} />
          </div>
        </Rise>
        <Rise from={12} dur={12}>
          <div style={{ display: "flex", justifyContent: "center", marginTop: 30 }}>
            <Chip text="thu chưa tới 10 giây" color={C.muted} size={26} />
          </div>
        </Rise>
        <Rise from={20} dur={14}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, height: 320, marginTop: 40 }}>
            {Array.from({ length: 34 }, (_, i) => {
              const h = 40 + 210 * (0.5 + 0.5 * Math.sin(frame / 3 + i * 0.62));
              const c = i % 3 === 0 ? C.green : C.cyan;
              return <div key={i} style={{ width: 14, height: h, borderRadius: 8, background: c, opacity: 0.9 }} />;
            })}
          </div>
        </Rise>
        <Rise from={40} dur={12}>
          <div style={{ textAlign: "center", marginTop: 44 }}>
            <div style={{ fontFamily: mono, fontSize: 27, color: C.muted }}>phụ đề nhảy theo từng chữ</div>
            <svg width="60" height="120" style={{ marginTop: 14 }}>
              {[0, 1, 2].map((i) => (
                <path
                  key={i}
                  d={`M10 ${12 + i * 34} L30 ${30 + i * 34} L50 ${12 + i * 34}`}
                  fill="none"
                  stroke={C.cyan}
                  strokeWidth="5"
                  strokeLinecap="round"
                  opacity={chev(i)}
                />
              ))}
            </svg>
          </div>
        </Rise>
      </Inner>
    </Shell>
  );
};

// S14: machine gate + human checkpoints
const S14: React.FC = () => {
  const frame = useCurrentFrame();
  const cross = progressAt(frame, 34, 20);
  const b1 = progressAt(frame, 110, 14);
  const b2 = progressAt(frame, 150, 14);
  const go = progressAt(frame, 190, 18);
  return (
    <Shell glow={C.amber}>
      <Inner top={345}>
        <Rise from={2} dur={10}><Pill text="2 LỚP KIỂM TRA" color={C.amber} /></Rise>
        <Rise from={12} dur={12}>
          <Panel glow={C.red} style={{ padding: "26px 30px", marginTop: 36, height: 400, position: "relative" }}>
            <Chip text="MÁY TỰ SOÁT" color={C.red} />
            <div style={{ display: "flex", gap: 30, marginTop: 24, alignItems: "center" }}>
              <div style={{ width: 170, height: 280, borderRadius: 14, border: `1.5px solid ${C.red}88`, padding: 14, position: "relative", overflow: "visible" }}>
                <div style={{ height: 12, width: "70%", borderRadius: 6, background: "rgba(255,255,255,0.25)" }} />
                <div style={{ height: 12, width: "140%", borderRadius: 6, background: `${C.red}88`, marginTop: 12 }} />
                <div style={{ height: 12, width: "60%", borderRadius: 6, background: "rgba(255,255,255,0.15)", marginTop: 12 }} />
                <svg width="170" height="280" style={{ position: "absolute", inset: 0 }}>
                  <line x1="14" y1="20" x2={14 + 142 * cross} y2={20 + 240 * cross} stroke={C.red} strokeWidth="6" strokeLinecap="round" />
                </svg>
              </div>
              <div>
                <Chip text="TEXT TRÀN · CHẶN" color={C.red} size={27} />
                <div style={{ fontSize: 30, color: C.muted, marginTop: 20, lineHeight: 1.42, width: 480 }}>
                  đo từng scene trước khi render, lỗi hiển thị không lọt qua
                </div>
              </div>
            </div>
          </Panel>
        </Rise>
        <Rise from={90} dur={12}>
          <Panel glow={C.green} style={{ padding: "26px 30px", marginTop: 24, height: 400 }}>
            <Chip text="BẠN DUYỆT QUA TELEGRAM" color={C.green} />
            <div style={{ display: "flex", flexDirection: "column", gap: 18, marginTop: 26, alignItems: "flex-end" }}>
              <div
                style={{
                  opacity: b1,
                  fontSize: 33,
                  fontWeight: 700,
                  background: `${C.green}1c`,
                  border: `1px solid ${C.green}66`,
                  borderRadius: "22px 22px 4px 22px",
                  padding: "16px 30px",
                }}
              >
                Kịch bản ✓
              </div>
              <div
                style={{
                  opacity: b2,
                  fontSize: 33,
                  fontWeight: 700,
                  background: `${C.green}1c`,
                  border: `1px solid ${C.green}66`,
                  borderRadius: "22px 22px 4px 22px",
                  padding: "16px 30px",
                }}
              >
                Hình từng scene ✓
              </div>
              <div
                style={{
                  alignSelf: "center",
                  marginTop: 6,
                  opacity: 0.3 + 0.7 * go,
                  fontFamily: mono,
                  fontSize: 30,
                  fontWeight: 700,
                  color: C.green,
                  border: `1.5px solid ${C.green}`,
                  borderRadius: 999,
                  padding: "12px 40px",
                  boxShadow: `0 0 ${36 * go}px ${C.green}55`,
                }}
              >
                RENDER
              </div>
            </div>
          </Panel>
        </Rise>
      </Inner>
    </Shell>
  );
};

// S15: three use cases converge to one pipeline
const S15: React.FC = () => {
  const frame = useCurrentFrame();
  const cards = ["KÊNH TIN AI", "REVIEW REPO", "RA MẮT APP"];
  const colors = [C.cyan, C.purple, C.green];
  const hubRect = { x1: 330, y1: 560, x2: 570, y2: 660 };
  return (
    <Shell glow={C.cyan}>
      <Inner top={345}>
        <Rise from={2} dur={10}>
          <div style={{ fontSize: 60, fontWeight: 800, lineHeight: 1.24 }}>
            Một quy trình, <span style={{ color: C.cyan }}>ba việc</span>
          </div>
        </Rise>
        <div style={{ position: "relative", height: 760, marginTop: 40 }}>
          {cards.map((label, i) => (
            <Rise key={label} from={12 + i * 10} dur={12} style={{ position: "absolute", left: i * 310, top: 0 }}>
              <div
                style={{
                  width: 280,
                  height: 150,
                  borderRadius: 20,
                  border: `1.5px solid ${colors[i]}88`,
                  background: `${colors[i]}10`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: mono,
                  fontSize: 30,
                  fontWeight: 700,
                  color: colors[i],
                  textAlign: "center",
                  lineHeight: 1.3,
                }}
              >
                {label}
              </div>
            </Rise>
          ))}
          <svg width="900" height="760" style={{ position: "absolute", inset: 0 }}>
            {cards.map((_, i) => {
              const p = progressAt(frame, 50 + i * 10, 26);
              const x0 = i * 310 + 140;
              const y0 = 160;
              const xt = 450;
              const yt = 560;
              return (
                <line
                  key={i}
                  x1={x0}
                  y1={y0}
                  x2={x0 + (xt - x0) * p}
                  y2={y0 + (yt - y0 - 8) * p}
                  stroke={colors[i]}
                  strokeWidth="3.5"
                  opacity="0.8"
                />
              );
            })}
          </svg>
          <Rise from={86} dur={14} style={{ position: "absolute", left: hubRect.x1, top: hubRect.y1, width: hubRect.x2 - hubRect.x1 }}>
            <div
              style={{
                fontFamily: mono,
                fontSize: 36,
                fontWeight: 700,
                color: C.cyan,
                border: `1.5px solid ${C.cyan}`,
                borderRadius: 999,
                padding: "20px 0",
                textAlign: "center",
                background: "rgba(34,211,238,0.08)",
                boxShadow: `0 0 44px ${C.cyan}44`,
              }}
            >
              any2video
            </div>
          </Rise>
        </div>
      </Inner>
    </Shell>
  );
};

// S16: honest caveat flips into the upside
const S16: React.FC = () => {
  const frame = useCurrentFrame();
  const t1 = progressAt(frame, 96, 14);
  const t2 = progressAt(frame, 134, 14);
  return (
    <Shell glow={C.amber}>
      <Inner top={345}>
        <Rise from={2} dur={10}><Pill text="NÓI THẬT" color={C.amber} /></Rise>
        <Rise from={12} dur={12}>
          <Panel glow={C.amber} style={{ padding: "36px 38px", marginTop: 36, border: `1.5px solid ${C.amber}77` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 26 }}>
              <svg width="72" height="72" viewBox="0 0 72 72">
                <path d="M36 6 L68 62 L4 62 Z" fill="none" stroke={C.amber} strokeWidth="4" strokeLinejoin="round" />
                <line x1="36" y1="28" x2="36" y2="44" stroke={C.amber} strokeWidth="5" strokeLinecap="round" />
                <circle cx="36" cy="53" r="3.4" fill={C.amber} />
              </svg>
              <div>
                <div style={{ fontSize: 52, fontWeight: 800, lineHeight: 1.24 }}>KHÔNG PHẢI APP MỘT NÚT</div>
                <div style={{ fontSize: 31, color: C.muted, marginTop: 12, lineHeight: 1.4 }}>
                  cần chạy được Claude Code
                </div>
              </div>
            </div>
          </Panel>
        </Rise>
        <Rise from={86} dur={12}>
          <Panel glow={C.green} style={{ padding: "36px 38px", marginTop: 28 }}>
            <Chip text="ĐỔI LẠI" color={C.green} />
            <div style={{ display: "flex", flexDirection: "column", gap: 22, marginTop: 26 }}>
              {[
                { t: "Bạn duyệt kịch bản trước khi thu giọng", p: t1 },
                { t: "Bạn duyệt từng hình trước khi render", p: t2 },
              ].map((row) => (
                <div key={row.t} style={{ display: "flex", alignItems: "center", gap: 20, opacity: 0.3 + 0.7 * row.p }}>
                  <svg width="44" height="44" viewBox="0 0 44 44">
                    <circle cx="22" cy="22" r="20" fill="none" stroke={C.green} strokeWidth="3" />
                    <path
                      d="M13 22 L20 29 L32 15"
                      fill="none"
                      stroke={C.green}
                      strokeWidth="4.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeDasharray="40"
                      strokeDashoffset={40 * (1 - row.p)}
                    />
                  </svg>
                  <div style={{ fontSize: 36, fontWeight: 700, lineHeight: 1.3 }}>{row.t}</div>
                </div>
              ))}
            </div>
          </Panel>
        </Rise>
      </Inner>
    </Shell>
  );
};

// S18: made-with bumper
const S18: React.FC = () => {
  const frame = useCurrentFrame();
  const pulse = 0.5 + 0.5 * Math.sin(frame / 7);
  const zoom = interpolate(frame, [0, 120], [1, 1.05]);
  return (
    <Shell glow={C.purple}>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ scale: String(zoom), textAlign: "center", marginTop: -60 }}>
          <Rise from={4} dur={12}>
            <div style={{ fontFamily: mono, fontSize: 30, letterSpacing: 6, color: C.muted }}>MADE WITH</div>
          </Rise>
          <Rise from={12} dur={14}>
            <div
              style={{
                fontFamily: mono,
                fontSize: 116,
                fontWeight: 700,
                lineHeight: 1.1,
                marginTop: 18,
                background: `linear-gradient(92deg, ${C.cyan}, ${C.purple})`,
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                color: "transparent",
                filter: `drop-shadow(0 0 ${18 + 22 * pulse}px rgba(34,211,238,0.4))`,
              }}
            >
              any2video
            </div>
          </Rise>
          <Rise from={26} dur={12}>
            <div style={{ marginTop: 34 }}>
              <Chip text="github.com/chanktb/any2video" color={C.cyan} size={28} />
            </div>
          </Rise>
        </div>
      </AbsoluteFill>
    </Shell>
  );
};

// ---------------------------------------------------------------------- main

const BODIES: Record<string, React.ReactNode> = {
  "1": <S01 />,
  "2": <S02 />,
  "3": <S03 />,
  "4": <S04 />,
  "5": <S05 />,
  "6": <FootageScene src="footage/any2video_scroll.mp4" />,
  "7": <S07 />,
  "8": <S08 />,
  "9": <S09 />,
  "10": <S10 />,
  "11": <S11 />,
  "12": <S12 />,
  "13": <S13 />,
  "14": <S14 />,
  "15": <S15 />,
  "16": <S16 />,
  "17": <FootageScene src="footage/any2video_author.mp4" />,
  "18": <S18 />,
};

export const ChanktbAny2Video: React.FC = () => {
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
