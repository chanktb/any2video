import React from "react";
import {
  AbsoluteFill,
  Sequence,
  interpolate,
  random,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Audio } from "@remotion/media";
import { loadFont as loadHand } from "@remotion/google-fonts/PatrickHand";
import { loadFont as loadJBM } from "@remotion/google-fonts/JetBrainsMono";
import { Rise, countAt, progressAt } from "../lib/core";
import { KaraokeNeon } from "../lib/karaoke";
import { FootageScene } from "../lib/footage";
import { SCENES } from "./money-leak-ep1-data";

// Run: money-leak-ep1 · serie DUNG DOT TIEN tap 01 · path B · skin CHALKBOARD
// Voice: VieNeu clone (tu_nhien, temp 0.5). Safe zone: x 90-990, y 345-1440.

const { fontFamily: hand } = loadHand("normal", {
  weights: ["400"],
  subsets: ["latin", "vietnamese"],
});
const { fontFamily: mono } = loadJBM("normal", {
  weights: ["400", "700"],
  subsets: ["latin", "vietnamese"],
});

const C = {
  bg: "#24382E",
  wood: "#5f4630",
  woodDark: "#4a3625",
  chalk: "#F2EFE4",
  dim: "rgba(242,239,228,0.55)",
  faint: "rgba(242,239,228,0.28)",
  yellow: "#FFE08A",
  pink: "#F5B8C4",
  line: "rgba(242,239,228,0.4)",
};

const chalkShadow = { textShadow: `0 0 8px rgba(242,239,228,0.28)` } as const;

// ------------------------------------------------------------------- chrome

const ChalkDust: React.FC = () => {
  const frame = useCurrentFrame();
  const dots = Array.from({ length: 70 }, (_, i) => ({
    x: random(`dx${i}`) * 1080,
    y: random(`dy${i}`) * 1920,
    r: 0.8 + random(`dr${i}`) * 1.8,
    ph: random(`dp${i}`) * Math.PI * 2,
  }));
  return (
    <svg width="1080" height="1920" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {dots.map((d, i) => (
        <circle
          key={i}
          cx={d.x}
          cy={d.y}
          r={d.r}
          fill={C.chalk}
          opacity={0.04 + 0.07 * (0.5 + 0.5 * Math.sin(d.ph + frame / 17))}
        />
      ))}
    </svg>
  );
};

const Shell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const opacity = interpolate(
    frame,
    [0, 9, durationInFrames - 8, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  return (
    <AbsoluteFill style={{ background: C.bg, color: C.chalk, fontFamily: hand, opacity }}>
      <AbsoluteFill
        style={{ background: "radial-gradient(ellipse at 50% 30%, rgba(242,239,228,0.05), transparent 60%)" }}
      />
      <ChalkDust />
      {/* wood frame */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          border: `26px solid ${C.wood}`,
          boxShadow: `inset 0 0 0 4px ${C.woodDark}, inset 0 0 60px rgba(0,0,0,0.35)`,
          pointerEvents: "none",
        }}
      />
      {children}
    </AbsoluteFill>
  );
};

const Badge: React.FC = () => (
  <span
    style={{
      fontFamily: mono,
      fontSize: 23,
      letterSpacing: 2,
      color: C.yellow,
      border: `2px dashed ${C.yellow}88`,
      borderRadius: 10,
      padding: "8px 18px",
      background: "rgba(255,224,138,0.06)",
    }}
  >
    ĐỪNG ĐỐT TIỀN · TẬP 01
  </span>
);

const Chip: React.FC<{ text: string; color?: string; size?: number; dash?: boolean }> = ({
  text,
  color = C.chalk,
  size = 26,
  dash = true,
}) => (
  <span
    style={{
      display: "inline-block",
      fontFamily: hand,
      fontSize: size,
      color,
      border: `2px ${dash ? "dashed" : "solid"} ${color}77`,
      borderRadius: 12,
      padding: "7px 18px",
      ...chalkShadow,
    }}
  >
    {text}
  </span>
);

const Panel: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div
    style={{
      border: `3px dashed ${C.line}`,
      borderRadius: 16,
      background: "rgba(255,255,255,0.025)",
      ...style,
    }}
  >
    {children}
  </div>
);

// wavy chalk underline, drawn left to right
const Wavy: React.FC<{ w: number; color?: string; from: number; dur?: number }> = ({
  w,
  color = C.yellow,
  from,
  dur = 20,
}) => {
  const frame = useCurrentFrame();
  const p = progressAt(frame, from, dur);
  const segs = Math.ceil(w / 46);
  let d = "M4 8";
  for (let i = 0; i < segs; i++) d += ` q 12 -9 23 0 t 23 0`.replace(/23/g, "23");
  const total = w * 1.15;
  return (
    <svg width={w} height="18" style={{ display: "block" }}>
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray={total}
        strokeDashoffset={total * (1 - p)}
        opacity="0.9"
      />
    </svg>
  );
};

const Inner: React.FC<{ children: React.ReactNode; top?: number }> = ({ children, top = 345 }) => (
  <div style={{ position: "absolute", left: 96, right: 96, top }}>{children}</div>
);

const Head: React.FC<{ children: React.ReactNode; size?: number; color?: string }> = ({
  children,
  size = 76,
  color = C.chalk,
}) => (
  <div style={{ fontFamily: hand, fontSize: size, lineHeight: 1.24, color, ...chalkShadow }}>{children}</div>
);

const Bill: React.FC<{ delay: number; x: number }> = ({ delay, x }) => {
  const frame = useCurrentFrame();
  const t = ((frame + delay) % 70) / 70;
  const y = t * 560;
  const sway = 26 * Math.sin(t * Math.PI * 3);
  return (
    <div
      style={{
        position: "absolute",
        left: x + sway,
        top: y,
        width: 74,
        height: 40,
        border: `2.5px solid ${C.yellow}`,
        borderRadius: 6,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: hand,
        fontSize: 26,
        color: C.yellow,
        opacity: 0.35 + 0.6 * (1 - t),
      }}
    >
      $
    </div>
  );
};

// --------------------------------------------------------------- scene bodies

// S1 HOOK: TRACKING AU + window doodle with flying bills
const S01: React.FC = () => {
  const frame = useCurrentFrame();
  const zoom = interpolate(frame, [0, 200], [1, 1.05]);
  return (
    <Shell>
      <Inner top={352}>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <Rise from={3} dur={9}><Badge /></Rise>
        </div>
        <div style={{ scale: String(zoom), transformOrigin: "20% 30%" }}>
          <Rise from={4} dur={10}>
            <div style={{ fontSize: 56, color: C.dim, marginTop: 12, ...chalkShadow }}>Chạy Google Ads mà</div>
          </Rise>
          <Rise from={10} dur={12}>
            <div style={{ fontSize: 132, lineHeight: 1.12, color: C.chalk, ...chalkShadow }}>TRACKING ẨU</div>
            <Wavy w={620} from={22} />
          </Rise>
          <Rise from={26} dur={12}>
            <div style={{ fontSize: 62, color: C.pink, marginTop: 14, ...chalkShadow }}>= ném tiền qua cửa sổ</div>
          </Rise>
        </div>
        <Rise from={38} dur={14}>
          <div style={{ position: "relative", height: 600, marginTop: 26 }}>
            <svg width="320" height="420" style={{ position: "absolute", left: 40, top: 20 }}>
              <rect x="8" y="8" width="300" height="400" fill="none" stroke={C.chalk} strokeWidth="5" strokeDasharray="14 10" rx="8" />
              <line x1="158" y1="8" x2="158" y2="408" stroke={C.chalk} strokeWidth="3.5" opacity="0.7" />
              <line x1="8" y1="208" x2="308" y2="208" stroke={C.chalk} strokeWidth="3.5" opacity="0.7" />
            </svg>
            <div style={{ position: "absolute", left: 420, top: 0, width: 460, height: 600, overflow: "hidden" }}>
              <Bill delay={0} x={30} />
              <Bill delay={18} x={150} />
              <Bill delay={36} x={260} />
              <Bill delay={54} x={90} />
            </div>
          </div>
        </Rise>
      </Inner>
    </Shell>
  );
};

// S2: ROAS 7.1 graded down to 2.5-4.8
const S02: React.FC = () => {
  const frame = useCurrentFrame();
  const roas = countAt(frame, 7.1, 16, 40);
  const strike = progressAt(frame, 92, 16);
  return (
    <Shell>
      <Inner top={360}>
        <Rise from={2} dur={10}><Head size={62}>Tài khoản khoe:</Head></Rise>
        <Rise from={12} dur={12}>
          <div style={{ position: "relative", marginTop: 30, display: "inline-block" }}>
            <div style={{ fontFamily: hand, fontSize: 250, lineHeight: 1.0, color: C.chalk, ...chalkShadow }}>
              ROAS {roas.toFixed(1)}
            </div>
            <svg width="880" height="250" style={{ position: "absolute", left: 0, top: 0 }}>
              <line
                x1="10"
                y1="200"
                x2={10 + 830 * strike}
                y2="60"
                stroke={C.pink}
                strokeWidth="11"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </Rise>
        <Rise from={112} dur={14}>
          <div style={{ fontSize: 96, color: C.yellow, marginTop: 26, ...chalkShadow }}>
            thật: 2.5 - 4.8
          </div>
        </Rise>
        <Rise from={140} dur={12}>
          <div style={{ marginTop: 40 }}>
            <Chip text="case audit công khai · 04/2026" color={C.dim} size={25} />
          </div>
        </Rise>
      </Inner>
    </Shell>
  );
};

// S3: one order -> three purchase actions
const S03: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <Shell>
      <Inner top={352}>
        <Rise from={2} dur={10}><Head size={62}>1 đơn, đếm 3 lần</Head></Rise>
        <div style={{ position: "relative", height: 900, marginTop: 36 }}>
          <Rise from={10} dur={12}>
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 330,
                width: 250,
                padding: "26px 14px",
                border: `3px solid ${C.chalk}`,
                borderRadius: 14,
                textAlign: "center",
                fontSize: 42,
                ...chalkShadow,
              }}
            >
              1 ĐƠN HÀNG
            </div>
          </Rise>
          <svg width="900" height="900" style={{ position: "absolute", inset: 0 }}>
            {[0, 1, 2].map((i) => {
              const p = progressAt(frame, 28 + i * 12, 20);
              const y1 = 400;
              const yt = 140 + i * 300;
              return (
                <line
                  key={i}
                  x1="262"
                  y1={y1}
                  x2={262 + (330 - 262) * p}
                  y2={y1 + (yt + 60 - y1) * p}
                  stroke={C.dim}
                  strokeWidth="4"
                  strokeDasharray="12 9"
                />
              );
            })}
          </svg>
          {[0, 1, 2].map((i) => (
            <Rise key={i} from={44 + i * 12} dur={12} style={{ position: "absolute", left: 350, top: 110 + i * 300 }}>
              <Panel style={{ width: 470, padding: "24px 26px" }}>
                <div style={{ fontSize: 40, color: C.chalk, ...chalkShadow }}>PURCHASE #{i + 1}</div>
                <div style={{ fontSize: 34, color: C.pink, marginTop: 6 }}>+1 conversion</div>
              </Panel>
            </Rise>
          ))}
        </div>
      </Inner>
    </Shell>
  );
};

// S4: primary vs secondary two columns
const S04: React.FC = () => {
  const frame = useCurrentFrame();
  const brainP = progressAt(frame, 40, 24);
  return (
    <Shell>
      <Inner top={352}>
        <Rise from={2} dur={10}><Head size={60}>Ai nuôi Smart Bidding?</Head></Rise>
        <div style={{ display: "flex", marginTop: 40, position: "relative" }}>
          <div style={{ flex: 1, paddingRight: 26 }}>
            <Rise from={14} dur={12}>
              <div style={{ fontSize: 88, color: C.yellow, ...chalkShadow }}>PRIMARY</div>
              <Wavy w={360} from={26} />
            </Rise>
            <Rise from={34} dur={12}>
              <svg width="380" height="330" style={{ marginTop: 20 }}>
                <line x1="40" y1="30" x2={40} y2={30 + 90 * brainP} stroke={C.yellow} strokeWidth="4.5" strokeDasharray="12 8" />
                {brainP > 0.9 && <path d="M31 108 L40 126 L49 108 Z" fill={C.yellow} />}
                <ellipse cx="150" cy="220" rx="118" ry="88" fill="none" stroke={C.chalk} strokeWidth="5" />
                <path d="M70 220 q 40 -50 80 0 q 40 44 80 0 q 30 -40 48 -6" fill="none" stroke={C.chalk} strokeWidth="3.5" opacity="0.8" />
              </svg>
              <div style={{ fontSize: 38, color: C.chalk, ...chalkShadow }}>SMART BIDDING học từ đây</div>
            </Rise>
          </div>
          <div style={{ width: 3, background: "transparent", borderLeft: `3px dashed ${C.line}` }} />
          <div style={{ flex: 1, paddingLeft: 30 }}>
            <Rise from={22} dur={12}>
              <div style={{ fontSize: 88, color: C.dim, ...chalkShadow }}>SECONDARY</div>
            </Rise>
            <Rise from={48} dur={12}>
              <svg width="300" height="250" style={{ marginTop: 40 }}>
                <circle cx="120" cy="110" r="74" fill="none" stroke={C.dim} strokeWidth="5" />
                <line x1="172" y1="163" x2="232" y2="224" stroke={C.dim} strokeWidth="7" strokeLinecap="round" />
              </svg>
              <div style={{ fontSize: 38, color: C.dim, marginTop: 4 }}>chỉ quan sát</div>
              <div style={{ marginTop: 14 }}><Chip text='cột "All conv."' color={C.dim} size={30} /></div>
            </Rise>
          </div>
        </div>
      </Inner>
    </Shell>
  );
};

// S5: three purchase sources -> one conversions box
const S05: React.FC = () => {
  const frame = useCurrentFrame();
  const cards = ["CHANNEL PURCHASE", "GA4 IMPORT", "GTAG / GTM"];
  return (
    <Shell>
      <Inner top={352}>
        <Rise from={2} dur={10}><Head size={60}>Shopify: 3 nguồn cùng lúc</Head></Rise>
        <div style={{ position: "relative", height: 900, marginTop: 34 }}>
          {cards.map((label, i) => (
            <Rise key={label} from={12 + i * 10} dur={12} style={{ position: "absolute", left: i * 302, top: 30 }}>
              <Panel style={{ width: 278, height: 150, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
                <div style={{ fontSize: 37, color: C.chalk, lineHeight: 1.3, padding: "0 10px", ...chalkShadow }}>{label}</div>
              </Panel>
            </Rise>
          ))}
          <svg width="900" height="900" style={{ position: "absolute", inset: 0 }}>
            {cards.map((_, i) => {
              const p = progressAt(frame, 44 + i * 8, 22);
              const x0 = i * 302 + 139;
              return (
                <line
                  key={i}
                  x1={x0}
                  y1={186}
                  x2={x0 + (450 - x0) * p}
                  y2={186 + (536 - 186 - 10) * p}
                  stroke={C.dim}
                  strokeWidth="4"
                  strokeDasharray="12 9"
                />
              );
            })}
          </svg>
          <Rise from={70} dur={14} style={{ position: "absolute", left: 250, top: 546 }}>
            <div
              style={{
                width: 400,
                padding: "30px 0",
                border: `3.5px solid ${C.yellow}`,
                borderRadius: 16,
                textAlign: "center",
                fontSize: 48,
                color: C.yellow,
                ...chalkShadow,
              }}
            >
              CONVERSIONS
            </div>
          </Rise>
        </div>
      </Inner>
    </Shell>
  );
};

// S6: GA4 import flipped to primary -> x2
const S06: React.FC = () => {
  const frame = useCurrentFrame();
  const flip = progressAt(frame, 60, 14);
  const pulse = 0.5 + 0.5 * Math.sin(frame / 5);
  return (
    <Shell>
      <Inner top={360}>
        <Rise from={2} dur={10}><Head size={60}>Cú lật tay tai hại</Head></Rise>
        <div style={{ display: "flex", gap: 40, marginTop: 44, alignItems: "flex-start" }}>
          <Rise from={14} dur={12}>
            <Panel style={{ width: 420, padding: "30px 28px", textAlign: "center" }}>
              <div style={{ fontSize: 46, color: C.chalk, ...chalkShadow }}>GA4 IMPORT</div>
              <div style={{ marginTop: 24, position: "relative", height: 70 }}>
                <div style={{ position: "absolute", inset: 0, opacity: 1 - flip, display: "flex", justifyContent: "center" }}>
                  <Chip text="secondary · mặc định" color={C.dim} size={30} />
                </div>
                <div style={{ position: "absolute", inset: 0, opacity: flip, display: "flex", justifyContent: "center" }}>
                  <Chip text="PRIMARY ?!" color={C.pink} size={34} dash={false} />
                </div>
              </div>
            </Panel>
          </Rise>
          <Rise from={80} dur={12}>
            <div style={{ textAlign: "center" }}>
              <svg width="330" height="300">
                <rect x="30" y="20" width="120" height="150" rx="10" fill="none" stroke={C.chalk} strokeWidth="4" />
                <line x1="50" y1="55" x2="130" y2="55" stroke={C.dim} strokeWidth="3.5" />
                <line x1="50" y1="85" x2="130" y2="85" stroke={C.dim} strokeWidth="3.5" />
                <line x1="50" y1="115" x2="110" y2="115" stroke={C.dim} strokeWidth="3.5" />
                <path d="M180 90 L220 90" stroke={C.pink} strokeWidth="5" strokeLinecap="round" opacity={flip} />
                <path d="M212 82 L226 90 L212 98 Z" fill={C.pink} opacity={flip} />
                <path d="M245 55 L262 75 L295 35" fill="none" stroke={C.pink} strokeWidth="7" strokeLinecap="round" opacity={flip} />
                <path d="M245 135 L262 155 L295 115" fill="none" stroke={C.pink} strokeWidth="7" strokeLinecap="round" opacity={flip} />
              </svg>
              <div
                style={{
                  fontSize: 100,
                  color: C.pink,
                  opacity: flip,
                  textShadow: `0 0 ${10 + 16 * pulse}px rgba(245,184,196,0.5)`,
                }}
              >
                ×2
              </div>
            </div>
          </Rise>
        </div>
        <Rise from={110} dur={12}>
          <div style={{ marginTop: 46 }}>
            <Chip text="1 đơn thật = 2 conversions báo cáo" color={C.pink} size={32} />
          </div>
        </Rise>
      </Inner>
    </Shell>
  );
};

// S7: robot watering wilted plant with money
const S07: React.FC = () => {
  const frame = useCurrentFrame();
  const drop = (i: number) => ((frame + i * 16) % 48) / 48;
  return (
    <Shell>
      <Inner top={360}>
        <Rise from={2} dur={10}><Head size={60}>Smart Bidding học số ảo</Head></Rise>
        <Rise from={14} dur={14}>
          <div style={{ position: "relative", height: 760, marginTop: 30 }}>
            <svg width="900" height="720">
              <rect x="90" y="60" width="200" height="160" rx="16" fill="none" stroke={C.chalk} strokeWidth="5" />
              <circle cx="150" cy="130" r="14" fill={C.chalk} />
              <circle cx="230" cy="130" r="14" fill={C.chalk} />
              <line x1="190" y1="60" x2="190" y2="20" stroke={C.chalk} strokeWidth="4" />
              <circle cx="190" cy="14" r="8" fill="none" stroke={C.chalk} strokeWidth="4" />
              <rect x="120" y="220" width="140" height="150" rx="12" fill="none" stroke={C.chalk} strokeWidth="4.5" />
              <path d="M260 260 L400 300 L430 330" fill="none" stroke={C.chalk} strokeWidth="5" strokeLinecap="round" />
              <path d="M420 320 q 30 -20 70 -6 l -14 40 q -30 -10 -52 4 z" fill="none" stroke={C.chalk} strokeWidth="4.5" />
              <path d="M640 560 l 30 120 l 130 0 l 30 -120 z" fill="none" stroke={C.chalk} strokeWidth="5" />
              <path d="M735 560 q 0 -90 -10 -120" fill="none" stroke={C.dim} strokeWidth="5" />
              <path d="M726 445 q -50 -14 -66 24" fill="none" stroke={C.dim} strokeWidth="4.5" />
              <path d="M727 470 q 44 -30 60 -2" fill="none" stroke={C.dim} strokeWidth="4.5" />
            </svg>
            {[0, 1, 2].map((i) => {
              const t = drop(i);
              return (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    left: 480 + i * 26,
                    top: 360 + t * 190,
                    fontSize: 40,
                    color: C.yellow,
                    opacity: 1 - t * 0.7,
                    fontFamily: hand,
                  }}
                >
                  $
                </div>
              );
            })}
            <div style={{ position: "absolute", left: 90, top: 620 }}>
              <div style={{ position: "relative", display: "inline-block" }}>
                <div style={{ fontSize: 74, color: C.chalk, ...chalkShadow }}>SỐ ẢO ×2</div>
                <svg width="330" height="80" style={{ position: "absolute", left: 0, top: 0 }}>
                  <line x1="0" y1="48" x2={330 * progressAt(frame, 70, 14)} y2="34" stroke={C.pink} strokeWidth="8" strokeLinecap="round" />
                </svg>
              </div>
              <div style={{ fontSize: 40, color: C.dim, marginTop: 8 }}>máy tưởng đang lời, rót thêm tiền</div>
            </div>
          </div>
        </Rise>
      </Inner>
    </Shell>
  );
};

// S8: store vs ads counts
const S08: React.FC = () => {
  const frame = useCurrentFrame();
  const store = Math.round(countAt(frame, 100, 20, 50));
  const ads = Math.round(countAt(frame, 196, 26, 56));
  const ring = progressAt(frame, 92, 18);
  return (
    <Shell>
      <Inner top={360}>
        <Rise from={2} dur={10}><Head size={60}>Tự kiểm số 1: so hai con số</Head></Rise>
        <div style={{ display: "flex", gap: 26, marginTop: 44 }}>
          <Rise from={14} dur={12} style={{ flex: 1 }}>
            <Panel style={{ padding: "30px 26px", textAlign: "center", height: 350 }}>
              <div style={{ fontSize: 40, color: C.dim }}>STORE</div>
              <div style={{ fontSize: 150, lineHeight: 1.05, color: C.chalk, marginTop: 20, ...chalkShadow }}>{store}</div>
              <div style={{ fontSize: 34, color: C.dim, marginTop: 10 }}>đơn hàng</div>
            </Panel>
          </Rise>
          <Rise from={22} dur={12} style={{ flex: 1 }}>
            <Panel style={{ padding: "30px 26px", textAlign: "center", height: 350, borderColor: `${C.pink}88` }}>
              <div style={{ fontSize: 40, color: C.dim }}>GOOGLE ADS</div>
              <div style={{ fontSize: 150, lineHeight: 1.05, color: C.pink, marginTop: 20, ...chalkShadow }}>{ads}</div>
              <div style={{ fontSize: 34, color: C.dim, marginTop: 10 }}>conversions</div>
            </Panel>
          </Rise>
        </div>
        <Rise from={86} dur={12}>
          <div style={{ display: "flex", alignItems: "center", gap: 28, marginTop: 48, justifyContent: "center" }}>
            <div style={{ position: "relative", display: "inline-block" }}>
              <div style={{ fontSize: 92, color: C.pink, padding: "6px 30px", ...chalkShadow }}>≈ ×2</div>
              <svg width="260" height="130" style={{ position: "absolute", left: -20, top: -6 }}>
                <ellipse
                  cx="130"
                  cy="62"
                  rx="118"
                  ry="54"
                  fill="none"
                  stroke={C.pink}
                  strokeWidth="5"
                  strokeDasharray={560}
                  strokeDashoffset={560 * (1 - ring)}
                />
              </svg>
            </div>
            <Chip text="cùng khung 30 ngày" color={C.dim} size={30} />
          </div>
        </Rise>
      </Inner>
    </Shell>
  );
};

// S9: per-campaign table, junk action circled
const S09: React.FC = () => {
  const frame = useCurrentFrame();
  const rows = [
    { c: "Campaign A", a: "Purchase", junk: false },
    { c: "Campaign B", a: "Purchase", junk: false },
    { c: "Campaign C", a: "Page view ?!", junk: true },
  ];
  const ring = progressAt(frame, 84, 18);
  return (
    <Shell>
      <Inner top={360}>
        <Rise from={2} dur={10}><Head size={60}>Tự kiểm số 2: soi từng campaign</Head></Rise>
        <Rise from={14} dur={12}>
          <Panel style={{ marginTop: 40, padding: "26px 30px" }}>
            <div style={{ display: "flex", fontSize: 34, color: C.dim, paddingBottom: 14, borderBottom: `2px dashed ${C.line}` }}>
              <div style={{ flex: 1 }}>campaign</div>
              <div style={{ flex: 1 }}>đang bắn action nào?</div>
            </div>
            {rows.map((r, i) => (
              <div
                key={r.c}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "20px 0",
                  opacity: progressAt(frame, 30 + i * 16, 12),
                  borderBottom: i < 2 ? `2px dashed rgba(242,239,228,0.18)` : "none",
                }}
              >
                <div style={{ flex: 1, fontSize: 42, color: C.chalk, ...chalkShadow }}>{r.c}</div>
                <div style={{ flex: 1, position: "relative" }}>
                  <span style={{ fontSize: 42, color: r.junk ? C.pink : C.yellow, ...chalkShadow }}>{r.a}</span>
                  {r.junk && (
                    <svg width="320" height="90" style={{ position: "absolute", left: -30, top: -20 }}>
                      <ellipse
                        cx="160"
                        cy="45"
                        rx="150"
                        ry="40"
                        fill="none"
                        stroke={C.pink}
                        strokeWidth="4.5"
                        strokeDasharray={720}
                        strokeDashoffset={720 * (1 - ring)}
                      />
                    </svg>
                  )}
                </div>
              </div>
            ))}
          </Panel>
        </Rise>
        <Rise from={110} dur={12}>
          <div style={{ display: "flex", gap: 20, marginTop: 36 }}>
            <Chip text="goal: DEFAULT hay CUSTOM?" color={C.yellow} size={32} />
          </div>
        </Rise>
      </Inner>
    </Shell>
  );
};

// S10: checklist 4 rows
const S10: React.FC = () => {
  const frame = useCurrentFrame();
  const rows = [
    "1 Purchase PRIMARY duy nhất theo nguồn",
    "Counting: EVERY cho đơn hàng",
    "Value bật + đúng tiền tệ",
    "Enhanced conversions + tab Diagnostics",
  ];
  return (
    <Shell>
      <Inner top={352}>
        <Rise from={2} dur={10}>
          <Head size={64}>Checklist chuẩn ecom</Head>
          <Wavy w={470} from={12} />
        </Rise>
        <div style={{ display: "flex", flexDirection: "column", gap: 30, marginTop: 44 }}>
          {rows.map((t, i) => {
            const p = progressAt(frame, 26 + i * 22, 14);
            return (
              <div key={t} style={{ display: "flex", alignItems: "center", gap: 24, opacity: 0.25 + 0.75 * p }}>
                <svg width="56" height="56" viewBox="0 0 56 56">
                  <rect x="5" y="5" width="46" height="46" rx="10" fill="none" stroke={C.line} strokeWidth="3.5" strokeDasharray="10 7" />
                  <path
                    d="M15 29 L25 39 L43 17"
                    fill="none"
                    stroke={C.yellow}
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray="52"
                    strokeDashoffset={52 * (1 - p)}
                  />
                </svg>
                <div style={{ fontSize: 44, color: C.chalk, lineHeight: 1.3, ...chalkShadow }}>{t}</div>
              </div>
            );
          })}
        </div>
      </Inner>
    </Shell>
  );
};

// S11: 20 actions but healthy
const S11: React.FC = () => {
  const frame = useCurrentFrame();
  const stampP = progressAt(frame, 150, 14);
  return (
    <Shell>
      <Inner top={352}>
        <Rise from={2} dur={10}><Head size={60}>20 action, vẫn khỏe</Head></Rise>
        <div style={{ display: "flex", gap: 30, marginTop: 38 }}>
          <Rise from={12} dur={12}>
            <Panel style={{ width: 330, padding: "22px 24px", opacity: 0.75 }}>
              <div style={{ fontSize: 30, color: C.dim, marginBottom: 14 }}>conversion actions (20)</div>
              {Array.from({ length: 13 }, (_, i) => (
                <div
                  key={i}
                  style={{
                    height: 10,
                    width: `${52 + (i * 37) % 42}%`,
                    background: i % 4 === 0 ? "rgba(245,184,196,0.5)" : "rgba(242,239,228,0.3)",
                    borderRadius: 5,
                    marginTop: 14,
                  }}
                />
              ))}
            </Panel>
          </Rise>
          <Rise from={30} dur={14}>
            <Panel style={{ width: 490, padding: "24px 26px" }}>
              <div style={{ fontSize: 32, color: C.yellow, marginBottom: 16, ...chalkShadow }}>campaigns thật sự bắn:</div>
              {["Camp A → App Purchase", "Camp B → App Purchase", "Camp C → App Purchase"].map((t, i) => (
                <div key={t} style={{ fontSize: 38, color: C.chalk, marginTop: 16, opacity: progressAt(frame, 52 + i * 14, 12), ...chalkShadow }}>
                  {t}
                </div>
              ))}
              <div style={{ fontSize: 32, color: C.dim, marginTop: 22, opacity: progressAt(frame, 108, 12) }}>
                action rác: không ai bắn → vô hại
              </div>
            </Panel>
          </Rise>
        </div>
        <div
          style={{
            marginTop: 42,
            display: "inline-block",
            border: `4px solid ${C.yellow}`,
            borderRadius: 14,
            padding: "12px 34px",
            fontSize: 58,
            color: C.yellow,
            opacity: stampP,
            scale: String(0.7 + 0.3 * stampP),
            ...chalkShadow,
          }}
        >
          VẪN KHỎE
        </div>
      </Inner>
    </Shell>
  );
};

// S13: PASS/WARN/FAIL gate + Ads vs GA4 scale
const S13: React.FC = () => {
  const frame = useCurrentFrame();
  const failP = progressAt(frame, 30, 14);
  const x1 = progressAt(frame, 60, 12);
  const x2 = progressAt(frame, 74, 12);
  const tilt = progressAt(frame, 130, 24);
  const beamY = (side: 1 | -1) => 150 + side * 52 * tilt;
  return (
    <Shell>
      <Inner top={352}>
        <Rise from={2} dur={10}><Head size={60}>Verdict là cái barie</Head></Rise>
        <div style={{ display: "flex", gap: 22, marginTop: 34 }}>
          {["PASS", "WARN", "FAIL"].map((t) => (
            <Rise key={t} from={12} dur={10}>
              <div
                style={{
                  border: `3.5px ${t === "FAIL" ? "solid" : "dashed"} ${t === "FAIL" ? C.pink : C.line}`,
                  color: t === "FAIL" ? C.pink : C.dim,
                  borderRadius: 12,
                  padding: "10px 30px",
                  fontSize: 46,
                  scale: t === "FAIL" ? String(0.9 + 0.25 * failP) : "1",
                  ...chalkShadow,
                }}
              >
                {t}
              </div>
            </Rise>
          ))}
        </div>
        <Rise from={50} dur={12}>
          <div style={{ position: "relative", marginTop: 38, width: 560, height: 110 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 26 }}>
              <Chip text="PLAN" color={C.dim} size={38} />
              <svg width="120" height="40" style={{ overflow: "visible" }}>
                <line x1="4" y1="20" x2="96" y2="20" stroke={C.dim} strokeWidth="4" strokeDasharray="12 9" />
                <path d="M92 10 L110 20 L92 30 Z" fill="none" stroke={C.dim} strokeWidth="3.5" />
                <line x1={20} y1={-14} x2={20 + 64 * x1} y2={-14 + 64 * x1} stroke={C.pink} strokeWidth="9" strokeLinecap="round" />
                <line x1={84} y1={-14} x2={84 - 64 * x2} y2={-14 + 64 * x2} stroke={C.pink} strokeWidth="9" strokeLinecap="round" />
              </svg>
              <Chip text="BUILD" color={C.dim} size={38} />
            </div>
          </div>
        </Rise>
        <Rise from={120} dur={14}>
          <div style={{ display: "flex", alignItems: "center", gap: 30, marginTop: 8 }}>
            <svg width="520" height="330">
              <line x1="260" y1="290" x2="260" y2="150" stroke={C.chalk} strokeWidth="6" />
              <line x1="220" y1="290" x2="300" y2="290" stroke={C.chalk} strokeWidth="6" strokeLinecap="round" />
              <line x1={70} y1={beamY(1)} x2={450} y2={beamY(-1)} stroke={C.chalk} strokeWidth="5.5" />
              <rect x={10} y={beamY(1) + 12} width="150" height="66" rx="12" fill="none" stroke={C.yellow} strokeWidth="4.5" />
              <text
                x={85}
                y={beamY(1) + 58}
                textAnchor="middle"
                fill={C.yellow}
                style={{ fontFamily: hand, fontSize: 38 }}
              >
                ADS
              </text>
              <rect x={360} y={beamY(-1) + 12} width="150" height="66" rx="12" fill="none" stroke={C.yellow} strokeWidth="4.5" />
              <text
                x={435}
                y={beamY(-1) + 58}
                textAnchor="middle"
                fill={C.yellow}
                style={{ fontFamily: hand, fontSize: 38 }}
              >
                GA4
              </text>
            </svg>
            <div>
              <div style={{ fontSize: 58, color: C.pink, ...chalkShadow }}>lệch &gt; 35%</div>
              <div style={{ fontSize: 33, color: C.dim, marginTop: 10, lineHeight: 1.4, width: 300 }}>
                ADS vs GA4, store làm mốc đối chiếu
              </div>
            </div>
          </div>
        </Rise>
      </Inner>
    </Shell>
  );
};

// S14: EC / consent verify-in-UI
const S14: React.FC = () => {
  const frame = useCurrentFrame();
  const pulse = 0.5 + 0.5 * Math.sin(frame / 7);
  return (
    <Shell>
      <Inner top={370}>
        <Rise from={2} dur={10}><Head size={60}>Không phán bừa</Head></Rise>
        <div style={{ display: "flex", gap: 30, marginTop: 46 }}>
          {["ENHANCED CONVERSIONS", "CONSENT MODE"].map((t, i) => (
            <Rise key={t} from={14 + i * 12} dur={12} style={{ flex: 1 }}>
              <Panel style={{ padding: "36px 26px", textAlign: "center", position: "relative", overflow: "hidden" }}>
                <div style={{ fontSize: 42, color: C.chalk, lineHeight: 1.3, ...chalkShadow }}>{t}</div>
                <div style={{ position: "absolute", inset: 0, background: "rgba(36,56,46,0.45)" }} />
                <div style={{ position: "relative", fontSize: 90, color: C.yellow, marginTop: 18, textShadow: `0 0 ${8 + 12 * pulse}px rgba(255,224,138,0.5)` }}>
                  ?
                </div>
              </Panel>
            </Rise>
          ))}
        </div>
        <Rise from={54} dur={12}>
          <div style={{ marginTop: 44, textAlign: "center" }}>
            <Chip text="API không thấy → ghi rõ: VERIFY IN UI" color={C.yellow} size={36} />
          </div>
        </Rise>
        <Rise from={80} dur={12}>
          <div style={{ marginTop: 26, textAlign: "center", fontSize: 38, color: C.dim }}>
            dấu hỏi trung thực tốt hơn dấu X phán ẩu
          </div>
        </Rise>
      </Inner>
    </Shell>
  );
};

// S16: series card
const S16: React.FC = () => {
  const frame = useCurrentFrame();
  const zoom = interpolate(frame, [0, 150], [1, 1.04]);
  return (
    <Shell>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ scale: String(zoom), textAlign: "center", marginTop: -80 }}>
          <Rise from={4} dur={12}>
            <div style={{ fontSize: 100, color: C.chalk, ...chalkShadow }}>ĐỪNG ĐỐT TIỀN</div>
            <div style={{ display: "flex", justifyContent: "center" }}><Wavy w={560} from={14} /></div>
          </Rise>
          <Rise from={22} dur={12}>
            <Panel style={{ marginTop: 44, padding: "26px 40px", display: "inline-block" }}>
              <div style={{ fontSize: 34, color: C.dim }}>TẬP 02</div>
              <div style={{ fontSize: 52, color: C.yellow, marginTop: 8, ...chalkShadow }}>PMAX ĂN BRANDED</div>
            </Panel>
          </Rise>
          <Rise from={38} dur={12}>
            <div style={{ fontFamily: mono, fontSize: 24, color: C.dim, marginTop: 48 }}>
              made with any2video · github.com/chanktb/any2video
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
  "6": <S06 />,
  "7": <S07 />,
  "8": <S08 />,
  "9": <S09 />,
  "10": <S10 />,
  "11": <S11 />,
  "12": <FootageScene src="footage/money-leak-ep1_scroll.mp4" />,
  "13": <S13 />,
  "14": <S14 />,
  "15": <FootageScene src="footage/money-leak-ep1_author.mp4" />,
  "16": <S16 />,
};

export const MoneyLeakEp1: React.FC = () => {
  let cursor = 0;
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      {SCENES.map((scene) => {
        const from = cursor;
        cursor += scene.durationInFrames;
        return (
          <Sequence key={scene.id} from={from} durationInFrames={scene.durationInFrames} premountFor={45}>
            {BODIES[scene.id]}
            <KaraokeNeon words={scene.words} fontFamily={hand} kw={C.yellow} />
            <Audio src={staticFile(scene.audio)} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
