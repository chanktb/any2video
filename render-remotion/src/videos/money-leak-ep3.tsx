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
import { Rise, progressAt } from "../lib/core";
import { KaraokeNeon } from "../lib/karaoke";
import { FootageScene } from "../lib/footage";
import { SCENES } from "./money-leak-ep3-data";

// Run: money-leak-ep3 · serie DUNG DOT TIEN tap 03 · path B · skin CHALKBOARD
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
    ĐỪNG ĐỐT TIỀN · TẬP 03
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

// S1 HOOK: PMax box tripping over its own feet
const S01: React.FC = () => {
  const frame = useCurrentFrame();
  const wobble = 5 * Math.sin(frame / 10);
  const starP = progressAt(frame, 66, 14);
  return (
    <Shell>
      <Inner top={352}>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <Rise from={3} dur={9}><Badge /></Rise>
        </div>
        <Rise from={4} dur={10}>
          <div style={{ fontSize: 50, color: C.dim, marginTop: 10, ...chalkShadow }}>
            Dựng cho nhóm A, search term ra nhóm B?
          </div>
        </Rise>
        <Rise from={12} dur={12}>
          <div style={{ fontSize: 104, lineHeight: 1.14, color: C.chalk, ...chalkShadow }}>
            PMAX TỰ GIẪM<br />CHÂN MÌNH
          </div>
          <Wavy w={640} from={24} />
        </Rise>
        <Rise from={38} dur={14}>
          <svg width="880" height="560" style={{ marginTop: 26 }}>
            {/* body box leans with the wobble; the text label stays UNROTATED per the no-text-rotation rule */}
            <g style={{ transformOrigin: "440px 250px", transform: `rotate(${wobble}deg)` } as React.CSSProperties}>
              <rect x="300" y="110" width="280" height="230" rx="18" fill="none" stroke={C.chalk} strokeWidth="5" strokeDasharray="16 11" />
              <circle cx="385" cy="205" r="9" fill={C.chalk} />
              <circle cx="495" cy="205" r="9" fill={C.chalk} />
              <path d="M380 275 q 60 -30 120 0" fill="none" stroke={C.chalk} strokeWidth="4.5" />
            </g>
            <text x="440" y="165" textAnchor="middle" fill={C.chalk} style={{ fontFamily: hand, fontSize: 50 }}>PMAX</text>
            {/* crossed legs: left foot lands on the right side and vice versa */}
            <path d="M380 340 q 30 90 130 130" fill="none" stroke={C.yellow} strokeWidth="6" strokeLinecap="round" />
            <path d="M500 340 q -30 90 -130 130" fill="none" stroke={C.yellow} strokeWidth="6" strokeLinecap="round" />
            <ellipse cx="512" cy="478" rx="46" ry="14" fill="none" stroke={C.yellow} strokeWidth="4.5" />
            <ellipse cx="368" cy="478" rx="46" ry="14" fill="none" stroke={C.yellow} strokeWidth="4.5" />
            <line x1="150" y1="512" x2="730" y2="512" stroke={C.line} strokeWidth="4" strokeDasharray="14 10" />
            <g opacity={starP}>
              <path d="M640 120 l 10 26 26 4 -19 19 5 27 -22 -13 -22 13 5 -27 -19 -19 26 -4 z" fill="none" stroke={C.pink} strokeWidth="4" />
              <text x="700" y="90" fill={C.pink} style={{ fontFamily: hand, fontSize: 46 }}>!</text>
            </g>
          </svg>
        </Rise>
      </Inner>
    </Shell>
  );
};

// S2: the two diseases, named
const S02: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <Shell>
      <Inner top={352}>
        <Rise from={2} dur={10}><Head size={58}>Hai bệnh, hai cái tên</Head></Rise>
        <Rise from={16} dur={14}>
          <Panel style={{ marginTop: 30, padding: "26px 30px" }}>
            <div style={{ fontSize: 44, color: C.yellow, ...chalkShadow }}>SELF-COMPETITION</div>
            <div style={{ fontSize: 34, color: C.dim, marginTop: 4 }}>tự cạnh tranh: hai nhóm giành một mặt hàng</div>
            <svg width="820" height="150" style={{ marginTop: 8 }}>
              <rect x="330" y="35" width="160" height="80" rx="12" fill="none" stroke={C.chalk} strokeWidth="5" />
              <text x="410" y="87" textAnchor="middle" fill={C.chalk} style={{ fontFamily: hand, fontSize: 34 }}>HÀNG</text>
              {/* arrows ram into the box edges (x=330 and x=490) with a 6px gap */}
              <line x1="120" y1="75" x2={120 + (324 - 120) * progressAt(frame, 34, 16)} y2="75" stroke={C.pink} strokeWidth="5" />
              <path d="M310 62 L324 75 L310 88" fill="none" stroke={C.pink} strokeWidth="5" opacity={progressAt(frame, 46, 8)} />
              <line x1="700" y1="75" x2={700 - (700 - 496) * progressAt(frame, 34, 16)} y2="75" stroke={C.pink} strokeWidth="5" />
              <path d="M510 62 L496 75 L510 88" fill="none" stroke={C.pink} strokeWidth="5" opacity={progressAt(frame, 46, 8)} />
            </svg>
          </Panel>
        </Rise>
        <Rise from={52} dur={14}>
          <Panel style={{ marginTop: 26, padding: "26px 30px" }}>
            <div style={{ fontSize: 44, color: C.yellow, ...chalkShadow }}>CROSS-MATCH</div>
            <div style={{ fontSize: 34, color: C.dim, marginTop: 4 }}>chạy lệch làn: chữ nhóm A, query nhóm B</div>
            <svg width="820" height="170" style={{ marginTop: 8 }}>
              <line x1="60" y1="40" x2="760" y2="40" stroke={C.line} strokeWidth="4" strokeDasharray="14 10" />
              <line x1="60" y1="130" x2="760" y2="130" stroke={C.line} strokeWidth="4" strokeDasharray="14 10" />
              <path
                d="M90 30 q 180 0 260 50 q 90 55 330 55"
                fill="none"
                stroke={C.pink}
                strokeWidth="5"
                strokeDasharray={800}
                strokeDashoffset={800 * (1 - progressAt(frame, 70, 26))}
              />
              <path d="M660 122 L686 135 L658 148" fill="none" stroke={C.pink} strokeWidth="5" opacity={progressAt(frame, 94, 8)} />
            </svg>
          </Panel>
        </Rise>
      </Inner>
    </Shell>
  );
};

// S3: one product, two asset groups tugging
const S03: React.FC = () => {
  const frame = useCurrentFrame();
  const tug = 16 * Math.sin(frame / 9) * progressAt(frame, 40, 20);
  return (
    <Shell>
      <Inner top={360}>
        <Rise from={2} dur={10}><Head size={58}>Bệnh 1: hai nhóm, một mặt hàng</Head></Rise>
        <Rise from={16} dur={14}>
          <svg width="900" height="640" style={{ marginTop: 26 }}>
            <rect x="60" y="80" width="300" height="170" rx="16" fill="none" stroke={C.chalk} strokeWidth="5" />
            <text x="210" y="150" textAnchor="middle" fill={C.chalk} style={{ fontFamily: hand, fontSize: 36 }}>ASSET</text>
            <text x="210" y="200" textAnchor="middle" fill={C.chalk} style={{ fontFamily: hand, fontSize: 36 }}>GROUP 1</text>
            <rect x="540" y="80" width="300" height="170" rx="16" fill="none" stroke={C.chalk} strokeWidth="5" />
            <text x="690" y="150" textAnchor="middle" fill={C.chalk} style={{ fontFamily: hand, fontSize: 36 }}>ASSET</text>
            <text x="690" y="200" textAnchor="middle" fill={C.chalk} style={{ fontFamily: hand, fontSize: 36 }}>GROUP 2</text>
            {/* the tugged product: centered at x=450, shifted by the tug */}
            <g transform={`translate(${tug} 0)`}>
              <rect x="350" y="380" width="200" height="120" rx="14" fill="none" stroke={C.pink} strokeWidth="6" />
              <text x="450" y="435" textAnchor="middle" fill={C.pink} style={{ fontFamily: hand, fontSize: 34 }}>SẢN PHẨM</text>
              <text x="450" y="478" textAnchor="middle" fill={C.pink} style={{ fontFamily: hand, fontSize: 34 }}>X</text>
            </g>
            {/* pull ropes: from each AG bottom edge (y=250) to the product top corners, drawn from geometry */}
            <path d={`M210 250 Q ${290 + tug / 2} 330 ${356 + tug} 380`} fill="none" stroke={C.dim} strokeWidth="4.5" strokeDasharray="10 8" opacity={progressAt(frame, 34, 12)} />
            <path d={`M690 250 Q ${610 + tug / 2} 330 ${544 + tug} 380`} fill="none" stroke={C.dim} strokeWidth="4.5" strokeDasharray="10 8" opacity={progressAt(frame, 34, 12)} />
          </svg>
        </Rise>
        <Rise from={62} dur={12}>
          <div style={{ marginTop: 8 }}>
            <Chip text="LISTING GROUP OVERLAP" color={C.pink} size={30} />
          </div>
        </Rise>
      </Inner>
    </Shell>
  );
};

// S4: the official quote + alphabet split
const S04: React.FC = () => {
  return (
    <Shell>
      <Inner top={360}>
        <Rise from={2} dur={10}><Head size={58}>Docs Google khuyên thẳng</Head></Rise>
        <Rise from={16} dur={14}>
          <Panel style={{ marginTop: 34, padding: "40px 38px", position: "relative" }}>
            <div style={{ fontFamily: hand, fontSize: 120, color: C.faint, position: "absolute", left: 18, top: -20 }}>"</div>
            <div style={{ fontSize: 46, lineHeight: 1.42, color: C.chalk, ...chalkShadow }}>
              Mỗi asset group một tập sản phẩm <span style={{ color: C.pink }}>khác nhau</span>,
            </div>
            <div style={{ fontSize: 46, lineHeight: 1.42, marginTop: 10, color: C.chalk, ...chalkShadow }}>
              để tránh listing group overlap
            </div>
            <div style={{ marginTop: 18 }}><Wavy w={420} color={C.pink} from={36} /></div>
          </Panel>
        </Rise>
        <Rise from={50} dur={14}>
          <div style={{ display: "flex", gap: 40, marginTop: 40, justifyContent: "center" }}>
            <Panel style={{ padding: "24px 40px", textAlign: "center" }}>
              <div style={{ fontSize: 34, color: C.dim }}>NHÓM 1</div>
              <div style={{ fontSize: 66, color: C.yellow, ...chalkShadow }}>A - L</div>
            </Panel>
            <div style={{ alignSelf: "center", fontSize: 44, color: C.faint }}>|</div>
            <Panel style={{ padding: "24px 40px", textAlign: "center" }}>
              <div style={{ fontSize: 34, color: C.dim }}>NHÓM 2</div>
              <div style={{ fontSize: 66, color: C.yellow, ...chalkShadow }}>M - Z</div>
            </Panel>
          </div>
        </Rise>
        <Rise from={72} dur={12}>
          <div style={{ marginTop: 34, textAlign: "center" }}>
            <Chip text="Google Ads Help, nguyên văn (lược dịch), ví dụ của chính docs" color={C.dim} size={26} />
          </div>
        </Rise>
      </Inner>
    </Shell>
  );
};

// S5: smec measurement, bid up, 90% feed bar
const S05: React.FC = () => {
  const frame = useCurrentFrame();
  const barP = progressAt(frame, 56, 34);
  const arrowP = progressAt(frame, 26, 20);
  return (
    <Shell>
      <Inner top={360}>
        <Rise from={2} dur={10}><Head size={58}>Đo thật, không phải cảm giác</Head></Rise>
        <Rise from={18} dur={12}>
          <div style={{ display: "flex", alignItems: "center", gap: 34, marginTop: 40 }}>
            <div style={{ fontSize: 62, color: C.pink, ...chalkShadow }}>SELF-COMPETE</div>
            <svg width="150" height="150">
              <path
                d="M30 130 q 30 -50 60 -80"
                fill="none"
                stroke={C.yellow}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={130}
                strokeDashoffset={130 * (1 - arrowP)}
              />
              <path d="M70 44 L94 42 L88 68" fill="none" stroke={C.yellow} strokeWidth="6" strokeLinecap="round" opacity={arrowP > 0.9 ? 1 : 0} />
              <text x="102" y="120" fill={C.yellow} style={{ fontFamily: hand, fontSize: 36 }}>BID</text>
            </svg>
          </div>
          <Wavy w={480} color={C.pink} from={30} />
        </Rise>
        <Rise from={50} dur={14}>
          <div style={{ marginTop: 56 }}>
            <div style={{ fontSize: 40, color: C.chalk, ...chalkShadow }}>tiền PMax nằm ở đâu?</div>
            <svg width="880" height="130" style={{ marginTop: 12 }}>
              <rect x="10" y="30" width="820" height="66" rx="12" fill="none" stroke={C.line} strokeWidth="4" />
              <rect x="16" y="36" width={808 * 0.9 * barP} height="54" rx="9" fill="rgba(255,224,138,0.18)" stroke={C.yellow} strokeWidth="4" strokeDasharray="12 8" />
              <text x={26 + 808 * 0.9 * barP - 210} y="72" fill={C.yellow} opacity={barP > 0.85 ? 1 : 0} style={{ fontFamily: hand, fontSize: 38 }}>~90% = FEED</text>
            </svg>
          </div>
        </Rise>
        <Rise from={96} dur={12}>
          <div style={{ marginTop: 30 }}>
            <Chip text="smec · State of PMax 2025 · 4.000+ campaign · 04/2025" color={C.dim} size={26} />
          </div>
        </Rise>
      </Inner>
    </Shell>
  );
};

// S6: search themes are a dashed fence the query walks through
const S06: React.FC = () => {
  const frame = useCurrentFrame();
  const walkP = progressAt(frame, 46, 34);
  return (
    <Shell>
      <Inner top={360}>
        <Rise from={2} dur={10}><Head size={58}>Bệnh 2: theme không phải hàng rào</Head></Rise>
        <Rise from={18} dur={14}>
          <svg width="900" height="500" style={{ marginTop: 26 }}>
            {/* fence: dashed posts with wide gaps */}
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <line key={i} x1={120 + i * 130} y1="170" x2={120 + i * 130} y2="360" stroke={C.chalk} strokeWidth="5" strokeDasharray="18 14" opacity={progressAt(frame, 20 + i * 4, 10)} />
            ))}
            <line x1="90" y1="180" x2="800" y2="180" stroke={C.chalk} strokeWidth="4" strokeDasharray="18 14" opacity={progressAt(frame, 24, 12)} />
            <text x="445" y="140" textAnchor="middle" fill={C.dim} style={{ fontFamily: hand, fontSize: 34 }}>SEARCH THEMES</text>
            {/* the query slips diagonally THROUGH the gap between posts 4 and 5 (x=510..640) */}
            <path
              d="M216 470 Q 400 455 520 340 Q 590 275 620 210 Q 655 130 730 90"
              fill="none"
              stroke={C.pink}
              strokeWidth="5"
              strokeDasharray="14 10"
              pathLength={900}
              strokeDashoffset={900 * (1 - walkP)}
            />
            <path d="M700 78 L736 88 L716 118" fill="none" stroke={C.pink} strokeWidth="5" strokeLinecap="round" opacity={walkP > 0.92 ? 1 : 0} />
            <g opacity={progressAt(frame, 44, 8)}>
              <rect x="60" y="440" width="150" height="60" rx="10" fill="none" stroke={C.pink} strokeWidth="5" />
              <text x="135" y="480" textAnchor="middle" fill={C.pink} style={{ fontFamily: hand, fontSize: 32 }}>QUERY</text>
            </g>
          </svg>
        </Rise>
        <Rise from={76} dur={12}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 6 }}>
            <div style={{ fontSize: 44, color: C.chalk, ...chalkShadow }}>
              docs: <span style={{ color: C.pink }}>"optional and additive"</span>
            </div>
            <Chip text="docs Google, nguyên văn" color={C.dim} size={26} />
          </div>
        </Rise>
      </Inner>
    </Shell>
  );
};

// S7: audience signal circle, ads reach people outside it
const S07: React.FC = () => {
  const frame = useCurrentFrame();
  const Stick: React.FC<{ x: number; y: number; color: string; op: number }> = ({ x, y, color, op }) => (
    <g opacity={op}>
      <circle cx={x} cy={y} r="16" fill="none" stroke={color} strokeWidth="4" />
      <line x1={x} y1={y + 16} x2={x} y2={y + 56} stroke={color} strokeWidth="4" />
      <line x1={x - 18} y1={y + 34} x2={x + 18} y2={y + 34} stroke={color} strokeWidth="4" />
      <line x1={x} y1={y + 56} x2={x - 14} y2={y + 86} stroke={color} strokeWidth="4" />
      <line x1={x} y1={y + 56} x2={x + 14} y2={y + 86} stroke={color} strokeWidth="4" />
    </g>
  );
  const rayP = progressAt(frame, 56, 22);
  return (
    <Shell>
      <Inner top={360}>
        <Rise from={2} dur={10}><Head size={58}>Audience signal cũng chỉ là gợi ý</Head></Rise>
        <Rise from={18} dur={14}>
          <svg width="900" height="620" style={{ marginTop: 20 }}>
            <ellipse cx="330" cy="330" rx="240" ry="190" fill="none" stroke={C.chalk} strokeWidth="5" strokeDasharray="16 12" opacity={progressAt(frame, 20, 14)} />
            <text x="330" y="120" textAnchor="middle" fill={C.dim} style={{ fontFamily: hand, fontSize: 34 }}>SIGNAL CỦA BẠN</text>
            <Stick x={260} y={250} color={C.chalk} op={progressAt(frame, 28, 10)} />
            <Stick x={380} y={280} color={C.chalk} op={progressAt(frame, 34, 10)} />
            <Stick x={310} y={380} color={C.chalk} op={progressAt(frame, 40, 10)} />
            {/* two people OUTSIDE the circle still get the ad ray */}
            <Stick x={740} y={210} color={C.yellow} op={progressAt(frame, 48, 10)} />
            <Stick x={780} y={430} color={C.yellow} op={progressAt(frame, 52, 10)} />
            <rect x="90" y="540" width="170" height="66" rx="12" fill="none" stroke={C.yellow} strokeWidth="5" opacity={progressAt(frame, 50, 10)} />
            <text x="175" y="584" textAnchor="middle" fill={C.yellow} opacity={progressAt(frame, 50, 10)} style={{ fontFamily: hand, fontSize: 34 }}>PMAX</text>
            {/* rays from the PMAX box top-right corner (260,540) to each outsider, 6px short of the figure */}
            <line x1="260" y1="540" x2={260 + (718 - 260) * rayP} y2={540 + (250 - 540) * rayP} stroke={C.yellow} strokeWidth="4" strokeDasharray="10 8" />
            <line x1="260" y1="540" x2={260 + (756 - 260) * rayP} y2={540 + (470 - 540) * rayP} stroke={C.yellow} strokeWidth="4" strokeDasharray="10 8" />
          </svg>
        </Rise>
        <Rise from={84} dur={12}>
          <div style={{ marginTop: 0 }}>
            <Chip text="docs Google, nguyên văn: có thể hiện ngoài signal" color={C.dim} size={26} />
          </div>
        </Rise>
      </Inner>
    </Shell>
  );
};

// S8: creative A swerves into lane B
const S08: React.FC = () => {
  const frame = useCurrentFrame();
  const drift = progressAt(frame, 30, 46);
  // the car moves along x; its y eases from lane A (200) into lane B (470)
  const carX = 100 + 560 * drift;
  const carY = 200 + 270 * Math.min(1, Math.max(0, (drift - 0.25) / 0.5));
  return (
    <Shell>
      <Inner top={360}>
        <Rise from={2} dur={10}><Head size={58}>Chữ một đằng, người xem một nẻo</Head></Rise>
        <Rise from={16} dur={14}>
          <svg width="900" height="600" style={{ marginTop: 24 }}>
            <line x1="60" y1="120" x2="840" y2="120" stroke={C.line} strokeWidth="4" />
            <line x1="60" y1="360" x2="840" y2="360" stroke={C.line} strokeWidth="4" strokeDasharray="26 20" />
            <line x1="60" y1="590" x2="840" y2="590" stroke={C.line} strokeWidth="4" />
            <text x="90" y="170" fill={C.dim} style={{ fontFamily: hand, fontSize: 32 }}>LÀN A · query nhóm A</text>
            <text x="90" y="415" fill={C.dim} style={{ fontFamily: hand, fontSize: 32 }}>LÀN B · query nhóm B</text>
            {/* skid trail behind the car */}
            <path
              d="M100 230 q 240 10 330 120 q 80 100 310 120"
              fill="none"
              stroke={C.pink}
              strokeWidth="4"
              strokeDasharray="12 10"
              opacity={0.6}
              strokeDashoffset={900 * (1 - drift)}
              pathLength={900}
            />
            <g opacity={progressAt(frame, 26, 8)}>
              <rect x={carX - 90} y={carY - 44} width="180" height="88" rx="12" fill="none" stroke={C.pink} strokeWidth="5" />
            </g>
            <text x={carX} y={carY - 8} textAnchor="middle" fill={C.pink} opacity={progressAt(frame, 26, 8)} style={{ fontFamily: hand, fontSize: 28 }}>CREATIVE</text>
            <text x={carX} y={carY + 30} textAnchor="middle" fill={C.pink} opacity={progressAt(frame, 26, 8)} style={{ fontFamily: hand, fontSize: 28 }}>NHÓM A</text>
          </svg>
        </Rise>
        <Rise from={84} dur={12}>
          <div style={{ display: "flex", alignItems: "center", gap: 22, marginTop: 4 }}>
            <div style={{ fontSize: 54, color: C.yellow, ...chalkShadow }}>CROSS-MATCH</div>
            <Chip text="từ mình đặt cho dễ gọi" color={C.dim} size={24} />
          </div>
          <Wavy w={420} from={94} />
        </Rise>
      </Inner>
    </Shell>
  );
};

// S9: negatives have no asset-group tier
const S09: React.FC = () => {
  const frame = useCurrentFrame();
  const xP = progressAt(frame, 64, 16);
  const rows = [
    { label: "ACCOUNT", ok: true, from: 20, extra: "" },
    { label: "CAMPAIGN", ok: true, from: 34, extra: "tới 10.000 từ" },
    { label: "ASSET GROUP", ok: false, from: 52, extra: "không có" },
  ];
  return (
    <Shell>
      <Inner top={360}>
        <Rise from={2} dur={10}><Head size={58}>Negative keyword rào được ở đâu?</Head></Rise>
        <div style={{ marginTop: 34, display: "flex", flexDirection: "column", gap: 26 }}>
          {rows.map((r) => (
            <Rise key={r.label} from={r.from} dur={12}>
              <Panel style={{ padding: "24px 30px", display: "flex", alignItems: "center", gap: 26 }}>
                <svg width="72" height="72">
                  {r.ok ? (
                    <path d="M12 40 L30 58 L62 16" fill="none" stroke={C.yellow} strokeWidth="7" strokeLinecap="round" />
                  ) : (
                    <>
                      <line x1="12" y1="12" x2={12 + 48 * xP} y2={12 + 48 * xP} stroke={C.pink} strokeWidth="8" strokeLinecap="round" />
                      <line x1="60" y1="12" x2={60 - 48 * xP} y2={12 + 48 * xP} stroke={C.pink} strokeWidth="8" strokeLinecap="round" />
                    </>
                  )}
                </svg>
                <div style={{ fontSize: 52, color: r.ok ? C.chalk : C.pink, ...chalkShadow }}>{r.label}</div>
                {r.extra ? (
                  <div style={{ marginLeft: "auto" }}>
                    <Chip text={r.extra} color={r.ok ? C.yellow : C.pink} size={28} />
                  </div>
                ) : null}
              </Panel>
            </Rise>
          ))}
        </div>
        <Rise from={82} dur={12}>
          <div style={{ marginTop: 34 }}>
            <Chip text="docs negative keywords PMax: chỉ 2 tầng · chặn là chặn cả campaign" color={C.dim} size={26} />
          </div>
        </Rise>
      </Inner>
    </Shell>
  );
};

// S10: self-check via per-asset-group search terms
const S10: React.FC = () => {
  const rows = [
    { q: "query đúng hàng nhóm A", bad: false, from: 30 },
    { q: "query về hàng nhóm B", bad: true, from: 44 },
    { q: "lại hàng nhóm B nữa", bad: true, from: 58 },
  ];
  return (
    <Shell>
      <Inner top={360}>
        <Rise from={2} dur={10}><Head size={58}>Tự soi một chỗ, ra cả hai bệnh</Head></Rise>
        <Rise from={18} dur={12}>
          <Panel style={{ marginTop: 30, padding: "26px 30px" }}>
            <div style={{ fontSize: 38, color: C.yellow, ...chalkShadow }}>SEARCH TERMS · ASSET GROUP A</div>
            <div style={{ borderTop: `3px dashed ${C.line}`, marginTop: 16 }} />
            {rows.map((r) => (
              <Rise key={r.q} from={r.from} dur={10}>
                <div style={{ display: "flex", alignItems: "center", gap: 20, padding: "16px 4px" }}>
                  <div style={{ fontSize: 40, color: r.bad ? C.pink : C.chalk, ...chalkShadow }}>{r.q}</div>
                  {r.bad ? (
                    <svg width="54" height="54" style={{ marginLeft: "auto" }}>
                      <ellipse cx="27" cy="27" rx="24" ry="20" fill="none" stroke={C.pink} strokeWidth="4" strokeDasharray="10 7" />
                      <text x="27" y="37" textAnchor="middle" fill={C.pink} style={{ fontFamily: hand, fontSize: 30 }}>!</text>
                    </svg>
                  ) : (
                    <svg width="54" height="54" style={{ marginLeft: "auto" }}>
                      <path d="M10 30 L22 42 L45 14" fill="none" stroke={C.yellow} strokeWidth="6" strokeLinecap="round" />
                    </svg>
                  )}
                </div>
              </Rise>
            ))}
          </Panel>
        </Rise>
        <Rise from={78} dur={12}>
          <div style={{ marginTop: 32, display: "flex", flexDirection: "column", gap: 14 }}>
            <Chip text="search terms xem theo từng asset group · có từ 2025" color={C.yellow} size={28} />
            <Chip text="query toàn về hàng nhóm khác = dính" color={C.dim} size={26} />
          </div>
        </Rise>
      </Inner>
    </Shell>
  );
};

// S11: one prescription per disease
const S11: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <Shell>
      <Inner top={352}>
        <Rise from={2} dur={10}><Head size={58}>Chữa đúng bệnh</Head></Rise>
        <Rise from={18} dur={14}>
          <Panel style={{ marginTop: 28, padding: "26px 32px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
              <div style={{ fontSize: 40, color: C.pink, ...chalkShadow }}>BỆNH 1 · SELF-COMPETITION</div>
              <svg width="60" height="60" style={{ marginLeft: "auto" }} opacity={progressAt(frame, 52, 10)}>
                <path d="M10 32 L24 46 L50 14" fill="none" stroke={C.yellow} strokeWidth="7" strokeLinecap="round" />
              </svg>
            </div>
            <div style={{ fontSize: 40, color: C.chalk, marginTop: 14, lineHeight: 1.4, ...chalkShadow }}>
              chia lại listing group: <span style={{ color: C.yellow }}>1 sản phẩm = 1 asset group</span>
            </div>
            <div style={{ marginTop: 12 }}>
              <Chip text="mọi tầng: Everything Else = EXCLUDE" color={C.yellow} size={30} />
            </div>
          </Panel>
        </Rise>
        <Rise from={66} dur={14}>
          <Panel style={{ marginTop: 30, padding: "26px 32px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
              <div style={{ fontSize: 40, color: C.pink, ...chalkShadow }}>BỆNH 2 · CROSS-MATCH</div>
              <svg width="60" height="60" style={{ marginLeft: "auto" }} opacity={progressAt(frame, 108, 10)}>
                <path d="M10 32 L24 46 L50 14" fill="none" stroke={C.yellow} strokeWidth="7" strokeLinecap="round" />
              </svg>
            </div>
            <div style={{ fontSize: 40, color: C.chalk, marginTop: 14, lineHeight: 1.4, ...chalkShadow }}>
              rào bằng <span style={{ color: C.yellow }}>negative cấp campaign</span>
            </div>
            <div style={{ marginTop: 12 }}>
              <Chip text="giờ được tới 10.000 từ (03/2025)" color={C.yellow} size={30} />
            </div>
          </Panel>
        </Rise>
      </Inner>
    </Shell>
  );
};

// S13: themes from converting queries + the anti-pattern list
const S13: React.FC = () => {
  const frame = useCurrentFrame();
  const flowP = progressAt(frame, 26, 22);
  return (
    <Shell>
      <Inner top={355}>
        <Rise from={2} dur={10}><Head size={58}>Theme không được bịa</Head></Rise>
        <Rise from={16} dur={12}>
          <svg width="880" height="220" style={{ marginTop: 22 }}>
            <rect x="20" y="60" width="340" height="110" rx="14" fill="none" stroke={C.chalk} strokeWidth="5" />
            <text x="190" y="106" textAnchor="middle" fill={C.chalk} style={{ fontFamily: hand, fontSize: 30 }}>QUERY ĐÃ RA</text>
            <text x="190" y="146" textAnchor="middle" fill={C.chalk} style={{ fontFamily: hand, fontSize: 30 }}>CHUYỂN ĐỔI</text>
            {/* connector: from the left box right edge (x=360) to the right box left edge (x=540), 6px gaps */}
            <line x1="366" y1="115" x2={366 + (534 - 366) * flowP} y2="115" stroke={C.yellow} strokeWidth="5" strokeDasharray="12 9" />
            <path d="M520 100 L534 115 L520 130" fill="none" stroke={C.yellow} strokeWidth="5" opacity={flowP > 0.9 ? 1 : 0} />
            <rect x="540" y="60" width="320" height="110" rx="14" fill="none" stroke={C.yellow} strokeWidth="5" />
            <text x="700" y="106" textAnchor="middle" fill={C.yellow} style={{ fontFamily: hand, fontSize: 30 }}>SEARCH</text>
            <text x="700" y="146" textAnchor="middle" fill={C.yellow} style={{ fontFamily: hand, fontSize: 30 }}>THEMES</text>
            <text x="452" y="205" textAnchor="middle" fill={C.dim} style={{ fontFamily: hand, fontSize: 28 }}>+ đối chiếu catalog: không bán = không seed</text>
          </svg>
        </Rise>
        <Rise from={58} dur={14}>
          <Panel style={{ marginTop: 26, padding: "24px 30px", position: "relative" }}>
            <div style={{ fontSize: 38, color: C.dim, ...chalkShadow }}>ANTI-PATTERNS (trong repo)</div>
            <div style={{ fontSize: 38, color: C.chalk, marginTop: 14, lineHeight: 1.65, ...chalkShadow }}>
              · chia nhỏ tới mức campaign đói data<br />
              · <span style={{ color: C.pink }}>một sản phẩm nằm hai nhóm</span><br />
              · audience khác nhau, creative giống hệt
            </div>
            <svg width="560" height="70" style={{ position: "absolute", left: 20, top: 145 }}>
              <ellipse
                cx="250"
                cy="35"
                rx="238"
                ry="32"
                fill="none"
                stroke={C.pink}
                strokeWidth="4"
                strokeDasharray={1720}
                strokeDashoffset={1720 * (1 - progressAt(frame, 92, 22))}
                pathLength={1720}
              />
            </svg>
          </Panel>
        </Rise>
      </Inner>
    </Shell>
  );
};

// S14: the fair scale, Google's word vs independent measurement
const S14: React.FC = () => {
  const frame = useCurrentFrame();
  const tilt = 0.35 * progressAt(frame, 60, 26); // 0..0.35, right side dips
  const beamY = (side: -1 | 1) => 210 - side * 52 * tilt; // left rises, right dips
  const lx = 250;
  const rx = 650;
  return (
    <Shell>
      <Inner top={360}>
        <Rise from={2} dur={10}><Head size={58}>Công bằng mà nói</Head></Rise>
        <Rise from={18} dur={14}>
          <svg width="900" height="640" style={{ marginTop: 22 }}>
            {/* post + base */}
            <line x1="450" y1="180" x2="450" y2="540" stroke={C.chalk} strokeWidth="6" />
            <line x1="330" y1="545" x2="570" y2="545" stroke={C.chalk} strokeWidth="6" />
            {/* beam between pan tops, computed from tilt */}
            <line x1={lx} y1={beamY(-1)} x2={rx} y2={beamY(1)} stroke={C.chalk} strokeWidth="6" />
            <circle cx="450" cy={(beamY(-1) + beamY(1)) / 2} r="10" fill={C.chalk} />
            {/* pans hang from beam ends; text placed at pan coordinates, never rotated */}
            <line x1={lx} y1={beamY(-1)} x2={lx} y2={beamY(-1) + 54} stroke={C.dim} strokeWidth="4" />
            <rect x={lx - 190} y={beamY(-1) + 58} width="380" height="150" rx="14" fill="none" stroke={C.yellow} strokeWidth="5" />
            <text x={lx} y={beamY(-1) + 122} textAnchor="middle" fill={C.yellow} style={{ fontFamily: hand, fontSize: 32 }}>GOOGLE NÓI</text>
            <text x={lx} y={beamY(-1) + 168} textAnchor="middle" fill={C.yellow} style={{ fontFamily: hand, fontSize: 30 }}>Ad Rank cao nhất chạy</text>
            <line x1={rx} y1={beamY(1)} x2={rx} y2={beamY(1) + 54} stroke={C.dim} strokeWidth="4" />
            <rect x={rx - 190} y={beamY(1) + 58} width="380" height="150" rx="14" fill="none" stroke={C.pink} strokeWidth="5" />
            <text x={rx} y={beamY(1) + 122} textAnchor="middle" fill={C.pink} style={{ fontFamily: hand, fontSize: 32 }}>ĐO ĐỘC LẬP</text>
            <text x={rx} y={beamY(1) + 168} textAnchor="middle" fill={C.pink} style={{ fontFamily: hand, fontSize: 30 }}>bid vẫn bị đội</text>
          </svg>
        </Rise>
        <Rise from={88} dur={12}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 0 }}>
            <Chip text="docs: campaign cùng tài khoản không đấu giá chèn nhau" color={C.dim} size={26} />
            <Chip text="smec 04/2025 đo ngược lại khi trùng sản phẩm · chia làn sạch vẫn rẻ nhất" color={C.yellow} size={26} />
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
              <div style={{ fontSize: 34, color: C.dim }}>TẬP 04</div>
              <div style={{ fontSize: 48, color: C.yellow, marginTop: 8, ...chalkShadow }}>TĂNG TIỀN KHÔNG PHẢI HỌC LẠI</div>
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
  "12": <FootageScene src="footage/money-leak-ep2_scroll.mp4" />,
  "13": <S13 />,
  "14": <S14 />,
  "15": <FootageScene src="footage/money-leak-ep2_author.mp4" />,
  "16": <S16 />,
};

export const MoneyLeakEp3: React.FC = () => {
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
