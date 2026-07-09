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
import { SCENES } from "./money-leak-ep2-data";

// Run: money-leak-ep2 · serie DUNG DOT TIEN tap 02 · path B · skin CHALKBOARD
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
    ĐỪNG ĐỐT TIỀN · TẬP 02
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
  for (let i = 0; i < segs; i++) d += ` q 12 -9 23 0 t 23 0`;
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

// --------------------------------------------------------------- scene bodies

// S1 HOOK: PMax hugging the brand money bag
const S01: React.FC = () => {
  const frame = useCurrentFrame();
  const look = 8 * Math.sin(frame / 14);
  return (
    <Shell>
      <Inner top={352}>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <Rise from={3} dur={9}><Badge /></Rise>
        </div>
        <Rise from={4} dur={10}>
          <div style={{ fontSize: 54, color: C.dim, marginTop: 10, ...chalkShadow }}>ROAS đẹp nhất tài khoản?</div>
        </Rise>
        <Rise from={10} dur={12}>
          <div style={{ fontSize: 118, lineHeight: 1.14, color: C.chalk, ...chalkShadow }}>PMAX ĂN BRANDED</div>
          <Wavy w={700} from={22} />
        </Rise>
        <Rise from={34} dur={14}>
          <svg width="880" height="620" style={{ marginTop: 30 }}>
            <rect x="80" y="90" width="330" height="300" rx="18" fill="none" stroke={C.chalk} strokeWidth="5" strokeDasharray="16 11" />
            <text x="245" y="150" textAnchor="middle" fill={C.chalk} style={{ fontFamily: hand, fontSize: 52 }}>PMAX</text>
            <circle cx={185 + look} cy="205" r="9" fill={C.chalk} />
            <circle cx={305 + look} cy="205" r="9" fill={C.chalk} />
            <path d="M170 300 q 75 46 150 0" fill="none" stroke={C.chalk} strokeWidth="4.5" />
            <path d="M540 210 q -40 40 -28 110 q 10 66 88 66 q 78 0 88 -66 q 12 -70 -28 -110 z" fill="none" stroke={C.yellow} strokeWidth="5" />
            <path d="M540 210 q 30 -34 60 -34 q 30 0 60 34" fill="none" stroke={C.yellow} strokeWidth="5" />
            <text x="600" y="330" textAnchor="middle" fill={C.yellow} style={{ fontFamily: hand, fontSize: 56 }}>$</text>
            <rect x="520" y="400" width="164" height="52" rx="10" fill="none" stroke={C.pink} strokeWidth="4" />
            <text x="602" y="437" textAnchor="middle" fill={C.pink} style={{ fontFamily: hand, fontSize: 32 }}>BRAND</text>
            <path d="M410 250 q 60 30 118 6" fill="none" stroke={C.chalk} strokeWidth="4.5" strokeDasharray="10 8" />
            <path d="M410 330 q 60 -6 116 24" fill="none" stroke={C.chalk} strokeWidth="4.5" strokeDasharray="10 8" />
          </svg>
        </Rise>
      </Inner>
    </Shell>
  );
};

// S2: PMax hub -> 5 channels, Search highlighted
const S02: React.FC = () => {
  const frame = useCurrentFrame();
  const spokes = [
    { label: "SEARCH", x: 700, y: 210, hot: true },
    { label: "YouTube", x: 790, y: 400, hot: false },
    { label: "Display", x: 740, y: 590, hot: false },
    { label: "Gmail", x: 520, y: 700, hot: false },
    { label: "Maps", x: 300, y: 640, hot: false },
  ];
  const pulse = 0.5 + 0.5 * Math.sin(frame / 6);
  return (
    <Shell>
      <Inner top={352}>
        <Rise from={2} dur={10}><Head size={58}>PMax chạy ở đâu?</Head></Rise>
        <div style={{ position: "relative", height: 860, marginTop: 26 }}>
          <svg width="900" height="820">
            <rect x="60" y="330" width="240" height="130" rx="16" fill="none" stroke={C.chalk} strokeWidth="5" />
            <text x="180" y="410" textAnchor="middle" fill={C.chalk} style={{ fontFamily: hand, fontSize: 48 }}>PMAX</text>
            {spokes.map((s, i) => {
              const p = progressAt(frame, 18 + i * 10, 18);
              const x0 = 300;
              const y0 = 395;
              return (
                <g key={s.label}>
                  <line
                    x1={x0}
                    y1={y0}
                    x2={x0 + (s.x - 90 - x0) * p}
                    y2={y0 + (s.y - y0) * p}
                    stroke={s.hot ? C.yellow : C.dim}
                    strokeWidth={s.hot ? 5 : 3.5}
                    strokeDasharray="12 9"
                  />
                  <g opacity={progressAt(frame, 26 + i * 10, 12)}>
                    <rect
                      x={s.x - 88}
                      y={s.y - 40}
                      width="190"
                      height="76"
                      rx="12"
                      fill="none"
                      stroke={s.hot ? C.yellow : C.dim}
                      strokeWidth={s.hot ? 5 : 3.5}
                    />
                    <text
                      x={s.x + 7}
                      y={s.y + 12}
                      textAnchor="middle"
                      fill={s.hot ? C.yellow : C.dim}
                      style={{ fontFamily: hand, fontSize: 34 }}
                    >
                      {s.label}
                    </text>
                  </g>
                </g>
              );
            })}
            <circle cx="700" cy="170" r={14 + 6 * pulse} fill="none" stroke={C.yellow} strokeWidth="3" opacity={0.5 * pulse + 0.2} />
          </svg>
          <div style={{ position: "absolute", left: 0, bottom: 10 }}>
            <Rise from={70} dur={12}>
              <Chip text="nguồn: Google Ads Help, trên hình" color={C.dim} size={26} />
            </Rise>
          </div>
        </div>
      </Inner>
    </Shell>
  );
};

// S3: the docs quote
const S03: React.FC = () => {
  return (
    <Shell>
      <Inner top={370}>
        <Rise from={2} dur={10}><Head size={58}>Chính docs Google ghi</Head></Rise>
        <Rise from={16} dur={14}>
          <Panel style={{ marginTop: 40, padding: "44px 40px", position: "relative" }}>
            <div style={{ fontFamily: hand, fontSize: 120, color: C.faint, position: "absolute", left: 18, top: -20 }}>"</div>
            <div style={{ fontSize: 46, lineHeight: 1.42, color: C.chalk, ...chalkShadow }}>
              PMax may show for your branded keywords...
            </div>
            <div style={{ fontSize: 46, lineHeight: 1.42, marginTop: 14, color: C.chalk, ...chalkShadow }}>
              <span style={{ color: C.pink }}>even if they are exact match</span> in your Search campaign
            </div>
            <div style={{ marginTop: 20 }}><Wavy w={430} color={C.pink} from={40} /></div>
          </Panel>
        </Rise>
        <Rise from={56} dur={12}>
          <div style={{ marginTop: 34 }}>
            <Chip text="docs Google, nguyên văn (lược dịch)" color={C.dim} size={26} />
          </div>
        </Rise>
      </Inner>
    </Shell>
  );
};

// S4: harvesting the ripe field
const S04: React.FC = () => {
  const frame = useCurrentFrame();
  const swing = 14 * Math.sin(frame / 9);
  const stampP = progressAt(frame, 120, 14);
  return (
    <Shell>
      <Inner top={360}>
        <Rise from={2} dur={10}><Head size={58}>Gặt lúa chín hộ</Head></Rise>
        <Rise from={16} dur={14}>
          <svg width="900" height="760" style={{ marginTop: 20 }}>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <g key={i} opacity={progressAt(frame, 20 + i * 5, 12)}>
                <path
                  d={`M${110 + i * 130} 620 q -8 -90 6 -150`}
                  fill="none"
                  stroke={C.yellow}
                  strokeWidth="4"
                />
                <path
                  d={`M${116 + i * 130} 470 q 16 -26 34 -30 M${116 + i * 130} 500 q 18 -20 36 -22 M${116 + i * 130} 530 q 16 -16 32 -18`}
                  fill="none"
                  stroke={C.yellow}
                  strokeWidth="3.5"
                  opacity="0.85"
                />
              </g>
            ))}
            <rect x="640" y="120" width="200" height="160" rx="14" fill="none" stroke={C.chalk} strokeWidth="5" />
            <text x="740" y="215" textAnchor="middle" fill={C.chalk} style={{ fontFamily: hand, fontSize: 44 }}>PMAX</text>
            <g style={{ transformOrigin: "700px 300px", transform: `rotate(${swing}deg)` } as React.CSSProperties}>
              <path d="M700 300 q -60 90 -160 120" fill="none" stroke={C.chalk} strokeWidth="5" />
              <path d="M540 420 q -70 -6 -110 40" fill="none" stroke={C.pink} strokeWidth="6" strokeLinecap="round" />
            </g>
            <g opacity={stampP} style={{ transformOrigin: "620px 700px", transform: `scale(${0.7 + 0.3 * stampP})` } as React.CSSProperties}>
              <rect x="470" y="660" width="310" height="80" rx="12" fill="none" stroke={C.pink} strokeWidth="5" />
              <text x="625" y="715" textAnchor="middle" fill={C.pink} style={{ fontFamily: hand, fontSize: 42 }}>CÔNG CỦA TÔI</text>
            </g>
          </svg>
        </Rise>
      </Inner>
    </Shell>
  );
};

// S5: 33% balloon
const S05: React.FC = () => {
  const frame = useCurrentFrame();
  const n = Math.round(countAt(frame, 33, 26, 44));
  const inflate = 1 + 0.06 * Math.sin(frame / 8);
  return (
    <Shell>
      <Inner top={360}>
        <Rise from={2} dur={10}><Head size={58}>Đo bằng geo lift, không phải cảm giác</Head></Rise>
        <Rise from={20} dur={14}>
          <div style={{ textAlign: "center", marginTop: 26 }}>
            <div
              style={{
                display: "inline-block",
                scale: String(inflate),
                fontSize: 300,
                lineHeight: 1.0,
                color: C.pink,
                ...chalkShadow,
              }}
            >
              {n}%
            </div>
            <div style={{ fontSize: 46, color: C.chalk, marginTop: 14, ...chalkShadow }}>
              hiệu quả brand trong PMax bị thổi phồng
            </div>
          </div>
        </Rise>
        <Rise from={60} dur={12}>
          <div style={{ display: "flex", justifyContent: "center", marginTop: 44 }}>
            <Chip text="geo-lift study 08/2024 · Haus" color={C.dim} size={26} />
          </div>
        </Rise>
      </Inner>
    </Shell>
  );
};

// S6: CAC -40% + 100% experiments
const S06: React.FC = () => {
  const frame = useCurrentFrame();
  const p = progressAt(frame, 24, 40);
  const n = Math.round(countAt(frame, 40, 30, 40));
  return (
    <Shell>
      <Inner top={360}>
        <Rise from={2} dur={10}><Head size={58}>Loại brand khỏi PMax thì sao?</Head></Rise>
        <div style={{ display: "flex", gap: 30, marginTop: 40, alignItems: "center" }}>
          <Rise from={16} dur={12}>
            <svg width="440" height="360">
              <line x1="40" y1="40" x2="40" y2="320" stroke={C.dim} strokeWidth="3.5" />
              <line x1="40" y1="320" x2="410" y2="320" stroke={C.dim} strokeWidth="3.5" />
              <path
                d={`M60 90 Q 200 ${90 + 120 * p} 380 ${90 + 190 * p}`}
                fill="none"
                stroke={C.yellow}
                strokeWidth="6"
                strokeLinecap="round"
              />
              <path d={`M355 ${252 * p + 68} l 26 14 l -4 -30`} fill="none" stroke={C.yellow} strokeWidth="5" opacity={p > 0.9 ? 1 : 0} />
              <text x="120" y="80" fill={C.dim} style={{ fontFamily: hand, fontSize: 32 }}>chi phí ra khách mới</text>
            </svg>
          </Rise>
          <Rise from={30} dur={12}>
            <div style={{ fontSize: 150, lineHeight: 1.0, color: C.yellow, ...chalkShadow }}>-{n}%</div>
          </Rise>
        </div>
        <Rise from={70} dur={12}>
          <div style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 40 }}>
            {[0, 1, 2, 3, 4].map((i) => {
              const tp = progressAt(frame, 76 + i * 7, 10);
              return (
                <svg key={i} width="52" height="52" viewBox="0 0 52 52">
                  <rect x="5" y="5" width="42" height="42" rx="9" fill="none" stroke={C.line} strokeWidth="3" strokeDasharray="9 7" />
                  <path
                    d="M13 27 L22 37 L40 15"
                    fill="none"
                    stroke={C.yellow}
                    strokeWidth="5.5"
                    strokeLinecap="round"
                    strokeDasharray="48"
                    strokeDashoffset={48 * (1 - tp)}
                  />
                </svg>
              );
            })}
            <div style={{ fontSize: 38, color: C.chalk, ...chalkShadow }}>thắng toàn bộ thí nghiệm</div>
          </div>
        </Rise>
      </Inner>
    </Shell>
  );
};

// S7: 91% overlap ring + footprints
const S07: React.FC = () => {
  const frame = useCurrentFrame();
  const ringP = progressAt(frame, 20, 50);
  const n = Math.round(countAt(frame, 91, 20, 50));
  const circ = 2 * Math.PI * 150;
  return (
    <Shell>
      <Inner top={360}>
        <Rise from={2} dur={10}><Head size={58}>Không phải chuyện hiếm</Head></Rise>
        <div style={{ display: "flex", gap: 34, alignItems: "center", marginTop: 36 }}>
          <Rise from={14} dur={12}>
            <div style={{ position: "relative", width: 360, height: 360 }}>
              <svg width="360" height="360">
                <circle cx="180" cy="180" r="150" fill="none" stroke={C.faint} strokeWidth="10" />
                <circle
                  cx="180"
                  cy="180"
                  r="150"
                  fill="none"
                  stroke={C.pink}
                  strokeWidth="11"
                  strokeLinecap="round"
                  strokeDasharray={circ}
                  strokeDashoffset={circ * (1 - 0.9145 * ringP)}
                  transform="rotate(-90 180 180)"
                />
              </svg>
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 110,
                  color: C.pink,
                  ...chalkShadow,
                }}
              >
                {n}%
              </div>
            </div>
          </Rise>
          <Rise from={34} dur={12}>
            <div>
              <div style={{ fontSize: 42, color: C.chalk, lineHeight: 1.35, width: 420, ...chalkShadow }}>
                tài khoản bị Search với PMax giẫm chân nhau
              </div>
              <svg width="420" height="190" style={{ marginTop: 16 }}>
                <ellipse cx="120" cy="60" rx="58" ry="30" fill="none" stroke={C.dim} strokeWidth="4" />
                <text x="120" y="70" textAnchor="middle" fill={C.dim} style={{ fontFamily: hand, fontSize: 26 }}>SEARCH</text>
                <ellipse cx="230" cy="98" rx="58" ry="30" fill="none" stroke={C.yellow} strokeWidth="4" />
                <text x="230" y="108" textAnchor="middle" fill={C.yellow} style={{ fontFamily: hand, fontSize: 26 }}>PMAX</text>
                <rect x="80" y="140" width="230" height="44" rx="10" fill="none" stroke={C.chalk} strokeWidth="3.5" strokeDasharray="10 8" />
                <text x="195" y="171" textAnchor="middle" fill={C.chalk} style={{ fontFamily: hand, fontSize: 26 }}>cùng 1 keyword</text>
              </svg>
            </div>
          </Rise>
        </div>
        <Rise from={70} dur={12}>
          <div style={{ marginTop: 30 }}>
            <Chip text="Optmyzr 07/2025 · 503 tài khoản" color={C.dim} size={26} />
          </div>
        </Rise>
      </Inner>
    </Shell>
  );
};

// S8: search terms mini table
const S08: React.FC = () => {
  const frame = useCurrentFrame();
  const rows = [
    { t: "ten shop cua ban", brand: true },
    { t: "ten shop + gel", brand: true },
    { t: "gel polish wholesale", brand: false },
  ];
  return (
    <Shell>
      <Inner top={360}>
        <Rise from={2} dur={10}><Head size={58}>Tự soi trong search terms</Head></Rise>
        <Rise from={14} dur={12}>
          <Panel style={{ marginTop: 36, padding: "26px 30px" }}>
            <div style={{ display: "flex", gap: 16, paddingBottom: 14, borderBottom: `2px dashed ${C.line}` }}>
              <div style={{ flex: 1.4, fontSize: 32, color: C.dim }}>search term</div>
              <Chip text="SOURCE" color={C.yellow} size={22} />
              <Chip text="FORMAT" color={C.yellow} size={22} />
            </div>
            {rows.map((r, i) => (
              <div
                key={r.t}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "20px 0",
                  opacity: progressAt(frame, 28 + i * 14, 12),
                  borderBottom: i < 2 ? `2px dashed rgba(242,239,228,0.18)` : "none",
                }}
              >
                <div style={{ flex: 1, position: "relative" }}>
                  <span style={{ fontSize: 40, color: r.brand ? C.pink : C.chalk, ...chalkShadow }}>{r.t}</span>
                  {r.brand && (
                    <svg width="430" height="86" style={{ position: "absolute", left: -24, top: -18 }}>
                      <ellipse
                        cx="215"
                        cy="43"
                        rx="200"
                        ry="38"
                        fill="none"
                        stroke={C.pink}
                        strokeWidth="4"
                        strokeDasharray={1000}
                        strokeDashoffset={1000 * (1 - progressAt(frame, 60 + i * 10, 16))}
                      />
                    </svg>
                  )}
                </div>
                <div style={{ fontSize: 30, color: C.dim, width: 120 }}>{r.brand ? "Search" : "Search"}</div>
              </div>
            ))}
          </Panel>
        </Rise>
        <Rise from={96} dur={12}>
          <div style={{ marginTop: 32 }}>
            <Chip text="cột source + format: có từ 2025" color={C.dim} size={26} />
          </div>
        </Rise>
      </Inner>
    </Shell>
  );
};

// S9: brand exclusions padlock
const S09: React.FC = () => {
  const frame = useCurrentFrame();
  const lockP = progressAt(frame, 30, 16);
  const t1 = progressAt(frame, 70, 12);
  return (
    <Shell>
      <Inner top={360}>
        <Rise from={2} dur={10}><Head size={58}>Khóa bằng brand exclusions</Head></Rise>
        <div style={{ display: "flex", gap: 36, marginTop: 36, alignItems: "flex-start" }}>
          <Rise from={14} dur={12}>
            <svg width="420" height="470">
              <rect x="60" y="180" width="300" height="230" rx="18" fill="none" stroke={C.chalk} strokeWidth="5" strokeDasharray="16 11" />
              <text x="210" y="310" textAnchor="middle" fill={C.chalk} style={{ fontFamily: hand, fontSize: 52 }}>PMAX</text>
              <rect x="140" y={96 - 26 * lockP} width="140" height="110" rx="18" fill="none" stroke={C.yellow} strokeWidth="6" opacity={0.4 + 0.6 * lockP} />
              <path d={`M170 ${96 - 26 * lockP} q 0 -56 40 -56 q 40 0 40 56`} fill="none" stroke={C.yellow} strokeWidth="6" opacity={0.4 + 0.6 * lockP} />
              <text x="210" y={166 - 26 * lockP} textAnchor="middle" fill={C.yellow} style={{ fontFamily: hand, fontSize: 26 }}>BRAND</text>
            </svg>
          </Rise>
          <Rise from={44} dur={12}>
            <div style={{ display: "flex", flexDirection: "column", gap: 22, marginTop: 30 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16, opacity: 0.3 + 0.7 * t1 }}>
                <svg width="86" height="46">
                  <rect x="4" y="8" width="78" height="30" rx="15" fill="none" stroke={C.yellow} strokeWidth="4" />
                  <circle cx={23 + 40 * t1} cy="23" r="12" fill={C.yellow} />
                </svg>
                <div style={{ fontSize: 38, color: C.yellow, ...chalkShadow }}>scope: SEARCH ONLY</div>
              </div>
              <div style={{ fontSize: 34, color: C.chalk, ...chalkShadow }}>Shopping vẫn chạy bình thường</div>
              <div style={{ marginTop: 10 }}>
                <Chip text="campaign negatives · mở 01/2025" color={C.dim} size={26} />
              </div>
              <Chip text="cap 10.000 (từ 03/2025)" color={C.dim} size={26} />
            </div>
          </Rise>
        </div>
      </Inner>
    </Shell>
  );
};

// S10: the standard architecture
const S10: React.FC = () => {
  const frame = useCurrentFrame();
  const strike = progressAt(frame, 40, 14);
  const tick = progressAt(frame, 70, 14);
  return (
    <Shell>
      <Inner top={360}>
        <Rise from={2} dur={10}>
          <Head size={58}>Kiến trúc chuẩn, một câu</Head>
          <Wavy w={430} from={12} />
        </Rise>
        <div style={{ display: "flex", gap: 26, marginTop: 46 }}>
          <Rise from={20} dur={12} style={{ flex: 1 }}>
            <Panel style={{ padding: "32px 28px", textAlign: "center", height: 330 }}>
              <div style={{ fontSize: 52, color: C.chalk, ...chalkShadow }}>PMAX</div>
              <div style={{ position: "relative", display: "inline-block", marginTop: 40 }}>
                <div style={{ fontSize: 60, color: C.dim, ...chalkShadow }}>BRAND</div>
                <svg width="230" height="80" style={{ position: "absolute", left: -18, top: 0 }}>
                  <line x1="6" y1="58" x2={6 + 210 * strike} y2="22" stroke={C.pink} strokeWidth="8" strokeLinecap="round" />
                </svg>
              </div>
              <div style={{ fontSize: 32, color: C.dim, marginTop: 36 }}>lo non-brand</div>
            </Panel>
          </Rise>
          <Rise from={32} dur={12} style={{ flex: 1 }}>
            <Panel style={{ padding: "32px 28px", textAlign: "center", height: 330, borderColor: `${C.yellow}88` }}>
              <div style={{ fontSize: 44, color: C.yellow, lineHeight: 1.25, ...chalkShadow }}>SEARCH BRANDED</div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, marginTop: 40 }}>
                <div style={{ fontSize: 60, color: C.yellow, ...chalkShadow }}>BRAND</div>
                <svg width="54" height="54" viewBox="0 0 54 54">
                  <path
                    d="M12 28 L23 39 L44 15"
                    fill="none"
                    stroke={C.yellow}
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray="55"
                    strokeDashoffset={55 * (1 - tick)}
                  />
                </svg>
              </div>
              <div style={{ fontSize: 32, color: C.dim, marginTop: 36 }}>giữ brand có chủ đích</div>
            </Panel>
          </Rise>
        </div>
        <Rise from={92} dur={12}>
          <div style={{ display: "flex", justifyContent: "center", marginTop: 40 }}>
            <Chip text="= attribution sạch, đo đếm rõ ràng" color={C.chalk} size={30} />
          </div>
        </Rise>
      </Inner>
    </Shell>
  );
};

// S12: puzzle pair + audit magnifier
const S12: React.FC = () => {
  const frame = useCurrentFrame();
  const join = progressAt(frame, 30, 30);
  const gap = 90 * (1 - join);
  return (
    <Shell>
      <Inner top={360}>
        <Rise from={2} dur={10}><Head size={58}>Một cặp, không phải hai việc lẻ</Head></Rise>
        <Rise from={18} dur={12}>
          <svg width="900" height="420" style={{ marginTop: 26 }}>
            <g transform={`translate(${-gap} 0)`}>
              <path
                d="M120 120 h 260 v 70 q 46 -28 46 30 q 0 58 -46 30 v 70 h -260 z"
                fill="none"
                stroke={C.yellow}
                strokeWidth="5"
              />
              <text x="250" y="240" textAnchor="middle" fill={C.yellow} style={{ fontFamily: hand, fontSize: 32 }}>BRANDED</text>
              <text x="250" y="282" textAnchor="middle" fill={C.yellow} style={{ fontFamily: hand, fontSize: 32 }}>CAMPAIGN</text>
            </g>
            <g transform={`translate(${gap} 0)`}>
              <path
                d="M480 120 h 280 v 240 h -280 v -70 q 42 24 42 -30 q 0 -54 -42 -30 z"
                fill="none"
                stroke={C.pink}
                strokeWidth="5"
              />
              <text x="625" y="240" textAnchor="middle" fill={C.pink} style={{ fontFamily: hand, fontSize: 32 }}>PMAX</text>
              <text x="625" y="282" textAnchor="middle" fill={C.pink} style={{ fontFamily: hand, fontSize: 32 }}>EXCLUSION</text>
            </g>
          </svg>
        </Rise>
        <Rise from={80} dur={12}>
          <div style={{ display: "flex", alignItems: "center", gap: 24, marginTop: 20 }}>
            <svg width="120" height="120">
              <circle cx="52" cy="48" r="36" fill="none" stroke={C.dim} strokeWidth="5" />
              <line x1="78" y1="76" x2="108" y2="108" stroke={C.dim} strokeWidth="7" strokeLinecap="round" />
            </svg>
            <div>
              <div style={{ fontSize: 38, color: C.chalk, ...chalkShadow }}>audit pull đúng lớp brand exclusions</div>
              <div style={{ marginTop: 12 }}><Chip text="brand_list · shared_set · không đoán mò" color={C.yellow} size={26} /></div>
            </div>
          </div>
        </Rise>
      </Inner>
    </Shell>
  );
};

// S13: the incrementality question
const S13: React.FC = () => {
  const frame = useCurrentFrame();
  const shift = progressAt(frame, 46, 30);
  const pulse = 0.5 + 0.5 * Math.sin(frame / 7);
  return (
    <Shell>
      <Inner top={360}>
        <Rise from={2} dur={10}><Head size={58}>Câu hỏi đáng thử</Head></Rise>
        <div style={{ display: "flex", gap: 60, marginTop: 44, alignItems: "flex-end" }}>
          <Rise from={16} dur={12}>
            <div style={{ textAlign: "center" }}>
              <svg width="220" height="460">
                <rect x="40" y="60" width="140" height="400" rx="10" fill="none" stroke={C.chalk} strokeWidth="5" />
                <rect x="40" y="60" width="140" height="150" rx="10" fill="none" stroke={C.pink} strokeWidth="5" />
                <text x="110" y="145" textAnchor="middle" fill={C.pink} style={{ fontFamily: hand, fontSize: 28 }}>PMax nhận</text>
              </svg>
              <div style={{ fontSize: 34, color: C.dim, marginTop: 10 }}>trước</div>
            </div>
          </Rise>
          <Rise from={30} dur={12}>
            <div style={{ textAlign: "center" }}>
              <svg width="220" height="460">
                <rect x="40" y="60" width="140" height="400" rx="10" fill="none" stroke={C.chalk} strokeWidth="5" />
                <rect x="40" y="60" width="140" height="150" rx="10" fill="none" stroke={C.yellow} strokeWidth="5" opacity={shift} />
                <text x="110" y="145" textAnchor="middle" fill={C.yellow} opacity={shift} style={{ fontFamily: hand, fontSize: 28 }}>Search nhận</text>
              </svg>
              <div style={{ fontSize: 34, color: C.dim, marginTop: 10 }}>sau khi tắt brand</div>
            </div>
          </Rise>
          <Rise from={60} dur={12}>
            <div
              style={{
                fontSize: 210,
                color: C.yellow,
                textShadow: `0 0 ${12 + 16 * pulse}px rgba(255,224,138,0.5)`,
                marginBottom: 80,
              }}
            >
              ?
            </div>
          </Rise>
        </div>
        <Rise from={84} dur={12}>
          <div style={{ marginTop: 18 }}>
            <Chip text="tổng đơn giữ nguyên = chỉ đổi chỗ ghi công" color={C.chalk} size={30} />
          </div>
        </Rise>
      </Inner>
    </Shell>
  );
};

// S14: fair caveat
const S14: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <Shell>
      <Inner top={360}>
        <Rise from={2} dur={10}><Head size={58}>Công bằng với PMax</Head></Rise>
        <Rise from={16} dur={14}>
          <svg width="900" height="560" style={{ marginTop: 20 }}>
            <rect x="90" y="120" width="240" height="180" rx="16" fill="none" stroke={C.chalk} strokeWidth="5" />
            <text x="210" y="225" textAnchor="middle" fill={C.chalk} style={{ fontFamily: hand, fontSize: 46 }}>PMAX</text>
            <path d="M130 120 L210 50 L290 120" fill="none" stroke={C.yellow} strokeWidth="5" />
            <path d="M330 240 q 80 20 130 60" fill="none" stroke={C.chalk} strokeWidth="4.5" />
            {[0, 1, 2].map((i) => {
              const t = ((frame + i * 15) % 45) / 45;
              return (
                <text key={i} x={470 + i * 18} y={300 + t * 90} fill={C.yellow} opacity={1 - t * 0.7} style={{ fontFamily: hand, fontSize: 30 }}>
                  $
                </text>
              );
            })}
            {[0, 1, 2, 3, 4].map((i) => (
              <g key={i} opacity={progressAt(frame, 30 + i * 7, 12)}>
                <path d={`M${560 + i * 66} 520 q -4 -60 4 -100`} fill="none" stroke={C.yellow} strokeWidth="4" />
                <path d={`M${562 + i * 66} 430 q 14 -18 30 -20 M${560 + i * 66} 456 q -16 -14 -30 -14`} fill="none" stroke={C.yellow} strokeWidth="3.5" />
              </g>
            ))}
            <text x="700" y="560" textAnchor="middle" fill={C.dim} style={{ fontFamily: hand, fontSize: 32 }}>NON-BRAND</text>
          </svg>
        </Rise>
        <Rise from={70} dur={12}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 14 }}>
            <Chip text="số liệu: nghiên cứu độc lập, nguồn trên từng hình" color={C.dim} size={26} />
            <Chip text="ngành đơn giá cao: có thể ngược lại, hãy test" color={C.yellow} size={26} />
          </div>
        </Rise>
      </Inner>
    </Shell>
  );
};

// S16: series card
const S16: React.FC = () => {
  const frame = useCurrentFrame();
  const zoom = interpolate(frame, [0, 170], [1, 1.04]);
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
              <div style={{ fontSize: 34, color: C.dim }}>TẬP 03</div>
              <div style={{ fontSize: 50, color: C.yellow, marginTop: 8, ...chalkShadow }}>VIẾT CHO A, CHẠY RA B</div>
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
  "11": <FootageScene src="footage/money-leak-ep2_scroll.mp4" />,
  "12": <S12 />,
  "13": <S13 />,
  "14": <S14 />,
  "15": <FootageScene src="footage/money-leak-ep2_author.mp4" />,
  "16": <S16 />,
};

export const MoneyLeakEp2: React.FC = () => {
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
