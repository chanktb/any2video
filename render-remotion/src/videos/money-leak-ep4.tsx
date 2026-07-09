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
import { SCENES } from "./money-leak-ep4-data";

// Run: money-leak-ep4 · serie DUNG DOT TIEN tap 04 · path B · skin CHALKBOARD
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
    ĐỪNG ĐỐT TIỀN · TẬP 04
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

// S1 HOOK: friend's store doubles the budget
const S01: React.FC = () => {
  const frame = useCurrentFrame();
  const arrowP = progressAt(frame, 60, 20);
  return (
    <Shell>
      <Inner top={352}>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <Rise from={3} dur={9}><Badge /></Rise>
        </div>
        <Rise from={4} dur={10}>
          <div style={{ fontSize: 50, color: C.dim, marginTop: 10, ...chalkShadow }}>
            Chuyện một người bạn bán hàng online
          </div>
        </Rise>
        <Rise from={12} dur={12}>
          <div style={{ fontSize: 100, lineHeight: 1.14, color: C.chalk, ...chalkShadow }}>
            BÀI HỌC<br />SCALE BUDGET
          </div>
          <Wavy w={640} from={24} />
        </Rise>
        <Rise from={40} dur={14}>
          <svg width="880" height="540" style={{ marginTop: 26 }}>
            {/* the little store */}
            <rect x="70" y="200" width="240" height="180" rx="10" fill="none" stroke={C.chalk} strokeWidth="5" />
            <path d="M50 200 L190 120 L330 200" fill="none" stroke={C.chalk} strokeWidth="5" />
            <rect x="150" y="290" width="80" height="90" rx="6" fill="none" stroke={C.chalk} strokeWidth="4" />
            <text x="190" y="255" textAnchor="middle" fill={C.dim} style={{ fontFamily: hand, fontSize: 30 }}>STORE</text>
            {/* budget columns */}
            <rect x="480" y="300" width="130" height="140" rx="10" fill="none" stroke={C.chalk} strokeWidth="5" />
            <text x="545" y="380" textAnchor="middle" fill={C.chalk} style={{ fontFamily: hand, fontSize: 38 }}>$300</text>
            <rect x="690" y="160" width="130" height="280" rx="10" fill="none" stroke={C.yellow} strokeWidth="5" strokeDasharray="14 10" opacity={progressAt(frame, 56, 12)} />
            <text x="755" y="310" textAnchor="middle" fill={C.yellow} opacity={progressAt(frame, 56, 12)} style={{ fontFamily: hand, fontSize: 38 }}>$600</text>
            {/* jump arrow from column edge to column edge */}
            <path
              d="M616 300 Q 650 220 684 190"
              fill="none"
              stroke={C.yellow}
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={120}
              strokeDashoffset={120 * (1 - arrowP)}
            />
            <path d="M668 180 L692 186 L682 210" fill="none" stroke={C.yellow} strokeWidth="5" strokeLinecap="round" opacity={arrowP > 0.9 ? 1 : 0} />
            <text x="545" y="495" textAnchor="middle" fill={C.dim} style={{ fontFamily: hand, fontSize: 30 }}>ngân sách một ngày</text>
          </svg>
        </Rise>
      </Inner>
    </Shell>
  );
};

// S2: the text message
const S02: React.FC = () => {
  const frame = useCurrentFrame();
  const upP = progressAt(frame, 44, 22);
  return (
    <Shell>
      <Inner top={370}>
        <Rise from={2} dur={10}><Head size={58}>Mấy hôm sau, tin nhắn tới</Head></Rise>
        <Rise from={16} dur={14}>
          <div style={{ marginTop: 40, position: "relative" }}>
            <Panel style={{ padding: "36px 40px", borderRadius: 26 }}>
              <div style={{ fontSize: 54, lineHeight: 1.4, color: C.chalk, ...chalkShadow }}>
                "Đơn không thêm,<br />giá mỗi đơn <span style={{ color: C.pink }}>gần gấp đôi?!</span>"
              </div>
            </Panel>
            <svg width="70" height="54" style={{ position: "absolute", left: 90, bottom: -50 }}>
              <path d="M10 4 q 8 30 50 44 q -20 -26 -12 -44 z" fill="none" stroke={C.line} strokeWidth="4" />
            </svg>
          </div>
        </Rise>
        <Rise from={40} dur={14}>
          <svg width="860" height="430" style={{ marginTop: 80 }}>
            {/* sad face */}
            <circle cx="180" cy="220" r="90" fill="none" stroke={C.chalk} strokeWidth="5" />
            <circle cx="150" cy="195" r="8" fill={C.chalk} />
            <circle cx="212" cy="195" r="8" fill={C.chalk} />
            <path d="M140 275 q 40 -34 82 0" fill="none" stroke={C.chalk} strokeWidth="5" />
            {/* CPA arrow climbing */}
            <path
              d="M400 360 Q 560 340 650 240 Q 710 170 760 120"
              fill="none"
              stroke={C.pink}
              strokeWidth="6"
              strokeLinecap="round"
              pathLength={600}
              strokeDasharray={600}
              strokeDashoffset={600 * (1 - upP)}
            />
            <path d="M728 112 L766 114 L750 148" fill="none" stroke={C.pink} strokeWidth="6" strokeLinecap="round" opacity={upP > 0.9 ? 1 : 0} />
            <text x="560" y="415" textAnchor="middle" fill={C.pink} style={{ fontFamily: hand, fontSize: 36 }}>GIÁ MỖI ĐƠN</text>
          </svg>
        </Rise>
      </Inner>
    </Shell>
  );
};

// S3: the Recommendations card someone blindly applied
const S03: React.FC = () => {
  const frame = useCurrentFrame();
  const chartP = progressAt(frame, 70, 30);
  const pressP = progressAt(frame, 52, 10);
  return (
    <Shell>
      <Inner top={360}>
        <Rise from={2} dur={10}><Head size={58}>Có người còn tin nút gợi ý</Head></Rise>
        <Rise from={18} dur={14}>
          <Panel style={{ marginTop: 30, padding: "28px 34px", width: 660 }}>
            <div style={{ fontFamily: mono, fontSize: 24, letterSpacing: 2, color: C.dim }}>RECOMMENDATIONS</div>
            <div style={{ fontSize: 48, color: C.chalk, marginTop: 12, ...chalkShadow }}>
              Tăng ngân sách <span style={{ color: C.yellow }}>x3</span>
            </div>
            <div style={{ marginTop: 18, display: "flex", alignItems: "center", gap: 24 }}>
              <div
                style={{
                  display: "inline-block",
                  fontFamily: mono,
                  fontSize: 30,
                  color: C.bg,
                  background: C.yellow,
                  borderRadius: 10,
                  padding: "10px 34px",
                  scale: String(1 - 0.08 * pressP),
                }}
              >
                APPLY
              </div>
              <svg width="90" height="90" opacity={progressAt(frame, 46, 10)}>
                {/* pointing hand */}
                <path d="M30 82 q -12 -26 2 -40 l 22 -22 q 8 -8 14 0 q 6 8 -2 16 l -10 10 q 26 -4 30 10 q 4 12 -10 16 l -24 8 q -14 4 -22 2" fill="none" stroke={C.chalk} strokeWidth="4.5" />
              </svg>
            </div>
          </Panel>
        </Rise>
        <Rise from={64} dur={14}>
          <svg width="880" height="360" style={{ marginTop: 30 }}>
            <line x1="60" y1="310" x2="820" y2="310" stroke={C.line} strokeWidth="4" />
            {[0, 1, 2].map((i) => (
              <text key={i} x={200 + i * 240} y="352" textAnchor="middle" fill={C.dim} style={{ fontFamily: hand, fontSize: 28 }}>
                ngày {i + 1}
              </text>
            ))}
            <path
              d="M120 290 Q 320 270 480 190 Q 640 110 800 60"
              fill="none"
              stroke={C.pink}
              strokeWidth="6"
              strokeLinecap="round"
              pathLength={700}
              strokeDasharray={700}
              strokeDashoffset={700 * (1 - chartP)}
            />
            <path d="M770 50 L806 58 L788 88" fill="none" stroke={C.pink} strokeWidth="6" strokeLinecap="round" opacity={chartP > 0.92 ? 1 : 0} />
            <text x="640" y="230" fill={C.pink} style={{ fontFamily: hand, fontSize: 34 }} opacity={chartP > 0.5 ? 1 : 0}>giá mỗi đơn</text>
          </svg>
        </Rise>
      </Inner>
    </Shell>
  );
};

// S4: blaming the learning reset
const S04: React.FC = () => {
  const frame = useCurrentFrame();
  const shake = 4 * Math.sin(frame / 6) * progressAt(frame, 30, 10);
  return (
    <Shell>
      <Inner top={365}>
        <Rise from={2} dur={10}><Head size={58}>Thủ phạm quen thuộc?</Head></Rise>
        <Rise from={16} dur={14}>
          <div style={{ marginTop: 36, position: "relative" }}>
            <Panel style={{ padding: "34px 40px", borderRadius: 26, width: 700 }}>
              <div style={{ fontSize: 72, color: C.pink, ...chalkShadow }}>RESET LEARNING?!</div>
            </Panel>
            <svg width="70" height="54" style={{ position: "absolute", left: 120, bottom: -50 }}>
              <path d="M10 4 q 8 30 50 44 q -20 -26 -12 -44 z" fill="none" stroke={C.line} strokeWidth="4" />
            </svg>
          </div>
        </Rise>
        <Rise from={36} dur={14}>
          <svg width="880" height="480" style={{ marginTop: 80 }}>
            <g transform={`translate(${shake} 0)`}>
              <rect x="300" y="80" width="280" height="230" rx="18" fill="none" stroke={C.chalk} strokeWidth="5" strokeDasharray="16 11" />
              <circle cx="385" cy="175" r="9" fill={C.chalk} />
              <circle cx="495" cy="175" r="9" fill={C.chalk} />
              <path d="M380 250 q 60 -28 120 0" fill="none" stroke={C.chalk} strokeWidth="4.5" />
            </g>
            <text x="440" y="135" textAnchor="middle" fill={C.chalk} style={{ fontFamily: hand, fontSize: 46 }}>PMAX</text>
            {/* accusing finger from the left */}
            <path d="M90 260 q 80 -20 190 -30" fill="none" stroke={C.pink} strokeWidth="6" strokeLinecap="round" opacity={progressAt(frame, 44, 12)} />
            <path d="M258 218 L292 228 L268 252" fill="none" stroke={C.pink} strokeWidth="6" strokeLinecap="round" opacity={progressAt(frame, 52, 8)} />
            <text x="440" y="420" textAnchor="middle" fill={C.dim} style={{ fontFamily: hand, fontSize: 32 }}>cả làng vẫn dọa nhau thế</text>
          </svg>
        </Rise>
      </Inner>
    </Shell>
  );
};

// S5: the official 3-trigger checklist, budget absent
const S05: React.FC = () => {
  const frame = useCurrentFrame();
  const rows = [
    { label: "CHIẾN LƯỢC MỚI TẠO", from: 20 },
    { label: "ĐỔI SETTING BID STRATEGY", from: 34 },
    { label: "ĐỔI CẤU TRÚC CAMPAIGN", from: 48 },
  ];
  const circ = progressAt(frame, 70, 20);
  return (
    <Shell>
      <Inner top={355}>
        <Rise from={2} dur={10}><Head size={58}>Docs liệt kê đúng ba lý do</Head></Rise>
        <div style={{ marginTop: 30, display: "flex", flexDirection: "column", gap: 20 }}>
          {rows.map((r) => (
            <Rise key={r.label} from={r.from} dur={12}>
              <Panel style={{ padding: "20px 28px", display: "flex", alignItems: "center", gap: 24 }}>
                <svg width="56" height="56">
                  <path d="M10 30 L24 44 L48 12" fill="none" stroke={C.yellow} strokeWidth="6" strokeLinecap="round" />
                </svg>
                <div style={{ fontSize: 42, color: C.chalk, ...chalkShadow }}>{r.label}</div>
              </Panel>
            </Rise>
          ))}
          <Rise from={62} dur={12}>
            <div style={{ position: "relative", padding: "20px 28px", display: "flex", alignItems: "center", gap: 24 }}>
              <div style={{ fontSize: 52, color: C.pink, ...chalkShadow }}>BUDGET?</div>
              <div style={{ fontSize: 36, color: C.dim }}>không có tên trong danh sách</div>
              <svg width="330" height="94" style={{ position: "absolute", left: 0, top: 2 }}>
                <ellipse
                  cx="145"
                  cy="47"
                  rx="138"
                  ry="40"
                  fill="none"
                  stroke={C.pink}
                  strokeWidth="4.5"
                  strokeDasharray={880}
                  strokeDashoffset={880 * (1 - circ)}
                  pathLength={880}
                />
              </svg>
            </div>
          </Rise>
        </div>
        <Rise from={86} dur={12}>
          <div style={{ marginTop: 26 }}>
            <Chip text="docs: bid strategy statuses, nguyên văn 3 mục" color={C.dim} size={26} />
          </div>
        </Rise>
      </Inner>
    </Shell>
  );
};

// S6: the Google PM quote
const S06: React.FC = () => {
  return (
    <Shell>
      <Inner top={380}>
        <Rise from={2} dur={10}><Head size={58}>Người làm ra nó nói gì?</Head></Rise>
        <Rise from={18} dur={14}>
          <Panel style={{ marginTop: 40, padding: "48px 42px", position: "relative" }}>
            <div style={{ fontFamily: hand, fontSize: 120, color: C.faint, position: "absolute", left: 18, top: -20 }}>"</div>
            <div style={{ fontSize: 58, lineHeight: 1.4, color: C.chalk, ...chalkShadow }}>
              Chỉnh budget vừa phải?
            </div>
            <div style={{ fontSize: 58, lineHeight: 1.4, marginTop: 8, color: C.yellow, ...chalkShadow }}>
              Không reset.
            </div>
            <div style={{ marginTop: 20 }}><Wavy w={360} from={40} /></div>
          </Panel>
        </Rise>
        <Rise from={54} dur={12}>
          <div style={{ marginTop: 36, display: "flex", flexDirection: "column", gap: 14 }}>
            <Chip text="Brandon Ervin · Director of PM, Search Ads (Google)" color={C.dim} size={26} />
            <Chip text="podcast Inside Google Ads (kênh độc lập) · 04/2026" color={C.dim} size={26} />
          </div>
        </Rise>
      </Inner>
    </Shell>
  );
};

// S7: Display 20% rule vs Search free rein
const S07: React.FC = () => {
  const frame = useCurrentFrame();
  const xP = progressAt(frame, 80, 14);
  return (
    <Shell>
      <Inner top={355}>
        <Rise from={2} dur={10}><Head size={58}>Luật 20% nằm ở đâu?</Head></Rise>
        <div style={{ display: "flex", gap: 30, marginTop: 32 }}>
          <Rise from={18} dur={12}>
            <Panel style={{ padding: "26px 28px", width: 400 }}>
              <div style={{ fontFamily: mono, fontSize: 26, letterSpacing: 2, color: C.yellow }}>DOCS · DISPLAY</div>
              <div style={{ fontSize: 40, color: C.chalk, marginTop: 16, lineHeight: 1.45, ...chalkShadow }}>
                đổi bid 20%,<br />chờ một tuần
              </div>
              <div style={{ marginTop: 14 }}>
                <Chip text="cho BID ADJUSTMENT" color={C.dim} size={24} />
              </div>
            </Panel>
          </Rise>
          <Rise from={34} dur={12}>
            <Panel style={{ padding: "26px 28px", width: 400 }}>
              <div style={{ fontFamily: mono, fontSize: 26, letterSpacing: 2, color: C.yellow }}>DOCS · SEARCH</div>
              <div style={{ fontSize: 40, color: C.chalk, marginTop: 16, lineHeight: 1.45, ...chalkShadow }}>
                đổi target thoải mái,<br />to nhỏ tuỳ bạn
              </div>
              <div style={{ marginTop: 14 }}>
                <Chip text="nguyên văn, ngược hẳn" color={C.dim} size={24} />
              </div>
            </Panel>
          </Rise>
        </div>
        <Rise from={56} dur={14}>
          <svg width="880" height="330" style={{ marginTop: 24 }}>
            {/* lore arrow: Display rule flying onto everything */}
            <path d="M230 40 Q 400 120 560 100 Q 700 84 800 130" fill="none" stroke={C.pink} strokeWidth="5" strokeDasharray="14 10" opacity={progressAt(frame, 58, 16)} />
            <text x="480" y="200" textAnchor="middle" fill={C.pink} style={{ fontFamily: hand, fontSize: 36 }} opacity={progressAt(frame, 66, 10)}>
              lore: đem áp cho cả budget lẫn mọi campaign
            </text>
            <g opacity={xP}>
              <line x1="410" y1="230" x2={410 + 70 * xP} y2={230 + 70 * xP} stroke={C.pink} strokeWidth="8" strokeLinecap="round" />
              <line x1="480" y1="230" x2={480 - 70 * xP} y2={230 + 70 * xP} stroke={C.pink} strokeWidth="8" strokeLinecap="round" />
            </g>
            <text x="620" y="290" fill={C.dim} style={{ fontFamily: hand, fontSize: 30 }} opacity={xP}>docs không ghi vậy</text>
          </svg>
        </Rise>
      </Inner>
    </Shell>
  );
};

// S8: pumping money into the same old queries
const S08: React.FC = () => {
  const frame = useCurrentFrame();
  const Stick: React.FC<{ x: number; y: number; color: string; op: number }> = ({ x, y, color, op }) => (
    <g opacity={op}>
      <circle cx={x} cy={y} r="14" fill="none" stroke={color} strokeWidth="4" />
      <line x1={x} y1={y + 14} x2={x} y2={y + 48} stroke={color} strokeWidth="4" />
      <line x1={x - 16} y1={y + 30} x2={x + 16} y2={y + 30} stroke={color} strokeWidth="4" />
      <line x1={x} y1={y + 48} x2={x - 12} y2={y + 74} stroke={color} strokeWidth="4" />
      <line x1={x} y1={y + 48} x2={x + 12} y2={y + 74} stroke={color} strokeWidth="4" />
    </g>
  );
  const bidP = progressAt(frame, 60, 20);
  return (
    <Shell>
      <Inner top={360}>
        <Rise from={2} dur={10}><Head size={58}>Tiền thêm, khách không thêm</Head></Rise>
        <Rise from={18} dur={14}>
          <svg width="900" height="600" style={{ marginTop: 22 }}>
            <ellipse cx="420" cy="300" rx="270" ry="200" fill="none" stroke={C.chalk} strokeWidth="5" strokeDasharray="16 12" opacity={progressAt(frame, 20, 14)} />
            <text x="420" y="80" textAnchor="middle" fill={C.dim} style={{ fontFamily: hand, fontSize: 34 }}>QUERY CŨ</text>
            <Stick x={330} y={230} color={C.chalk} op={progressAt(frame, 28, 10)} />
            <Stick x={450} y={270} color={C.chalk} op={progressAt(frame, 34, 10)} />
            <Stick x={380} y={370} color={C.chalk} op={progressAt(frame, 40, 10)} />
            {/* the money pump aimed at the circle */}
            <g opacity={progressAt(frame, 46, 12)}>
              <rect x="60" y="470" width="150" height="90" rx="12" fill="none" stroke={C.yellow} strokeWidth="5" />
              <text x="135" y="528" textAnchor="middle" fill={C.yellow} style={{ fontFamily: hand, fontSize: 40 }}>$$$</text>
              <path d="M216 505 q 60 -30 110 -80" fill="none" stroke={C.yellow} strokeWidth="5" strokeDasharray="12 9" />
            </g>
            {/* bid price arrow inside the circle */}
            <path
              d="M560 420 q 30 -70 40 -130"
              fill="none"
              stroke={C.pink}
              strokeWidth="6"
              strokeLinecap="round"
              pathLength={160}
              strokeDasharray={160}
              strokeDashoffset={160 * (1 - bidP)}
            />
            <path d="M578 288 L602 284 L600 316" fill="none" stroke={C.pink} strokeWidth="6" strokeLinecap="round" opacity={bidP > 0.9 ? 1 : 0} />
            <text x="618" y="352" fill={C.pink} style={{ fontFamily: hand, fontSize: 36 }} opacity={bidP > 0.5 ? 1 : 0}>BID</text>
            <text x="770" y="150" textAnchor="middle" fill={C.dim} style={{ fontFamily: hand, fontSize: 30 }} opacity={progressAt(frame, 74, 10)}>ngoài vòng:</text>
            <text x="770" y="188" textAnchor="middle" fill={C.dim} style={{ fontFamily: hand, fontSize: 30 }} opacity={progressAt(frame, 74, 10)}>không có khách mới</text>
          </svg>
        </Rise>
        <Rise from={88} dur={12}>
          <div style={{ marginTop: 0 }}>
            <Chip text="SEL · Navah Hopkins · 06/2026" color={C.dim} size={26} />
          </div>
        </Rise>
      </Inner>
    </Shell>
  );
};

// S9: judging too early
const S09: React.FC = () => {
  const frame = useCurrentFrame();
  const pkgP = progressAt(frame, 50, 30);
  return (
    <Shell>
      <Inner top={360}>
        <Rise from={2} dur={10}><Head size={58}>Và tội chấm điểm quá sớm</Head></Rise>
        <Rise from={18} dur={14}>
          <svg width="900" height="500" style={{ marginTop: 26 }}>
            {/* 3-week calendar: 21 cells */}
            {Array.from({ length: 21 }, (_, i) => {
              const cx = 80 + (i % 7) * 110;
              const cy = 90 + Math.floor(i / 7) * 110;
              const early = i < 4;
              return (
                <g key={i} opacity={progressAt(frame, 20 + i * 2, 8)}>
                  <rect x={cx} y={cy} width="92" height="92" rx="10" fill={early ? "rgba(245,184,196,0.10)" : "none"} stroke={early ? C.pink : C.line} strokeWidth={early ? 4 : 3} strokeDasharray={early ? "10 7" : "none"} />
                </g>
              );
            })}
            <text x="300" y="64" fill={C.dim} style={{ fontFamily: hand, fontSize: 30 }}>learning: có thể tới 3 tuần</text>
            <text x="130" y="440" fill={C.pink} style={{ fontFamily: hand, fontSize: 32 }} opacity={progressAt(frame, 66, 10)}>mấy ngày đầu: số chưa đủ</text>
            {/* the late package flying in */}
            <g opacity={pkgP > 0.05 ? 1 : 0}>
              <rect x={620 + 160 * pkgP - 160} y={420 - 260 * pkgP + 260 - 300 * Math.sin(Math.PI * pkgP)} width="70" height="58" rx="8" fill="none" stroke={C.yellow} strokeWidth="4.5" transform={`rotate(${10 - 20 * pkgP} ${655 + 160 * pkgP - 160} ${449 - 260 * pkgP + 260})`} />
            </g>
            <text x="700" y="470" fill={C.yellow} style={{ fontFamily: hand, fontSize: 30 }} opacity={progressAt(frame, 74, 10)}>đơn về trễ</text>
          </svg>
        </Rise>
        <Rise from={88} dur={12}>
          <div style={{ marginTop: 4 }}>
            <Chip text="docs: up to 3 weeks / 1-2 conversion cycles" color={C.dim} size={26} />
          </div>
        </Rise>
      </Inner>
    </Shell>
  );
};

// S10: the staircase rhythm
const S10: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <Shell>
      <Inner top={355}>
        <Rise from={2} dur={10}><Head size={58}>Nhịp của giới làm nghề</Head></Rise>
        <Rise from={18} dur={14}>
          <svg width="900" height="560" style={{ marginTop: 24 }}>
            {[0, 1, 2, 3].map((i) => {
              const x = 80 + i * 190;
              const y = 460 - i * 100;
              return (
                <g key={i} opacity={progressAt(frame, 22 + i * 12, 12)}>
                  <path d={`M${x} ${y} h 190 v -100`} fill="none" stroke={C.chalk} strokeWidth="5" />
                  <text x={x + 95} y={y - 18} textAnchor="middle" fill={C.yellow} style={{ fontFamily: hand, fontSize: 32 }}>+10-20%</text>
                </g>
              );
            })}
            <text x="520" y="520" textAnchor="middle" fill={C.dim} style={{ fontFamily: hand, fontSize: 32 }} opacity={progressAt(frame, 62, 10)}>giữ 1-2 TUẦN mỗi bậc</text>
          </svg>
        </Rise>
        <Rise from={76} dur={12}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 0 }}>
            <Chip text="1 lần = đổi đúng 1 thứ" color={C.yellow} size={28} />
            <Chip text="SEL (Hop Skip Media) 06/2026 · blog North Country 05/2026" color={C.dim} size={24} />
          </div>
        </Rise>
      </Inner>
    </Shell>
  );
};

// S11: the real green light (not the recommendation button)
const S11: React.FC = () => {
  const frame = useCurrentFrame();
  const greenOn = progressAt(frame, 30, 12);
  return (
    <Shell>
      <Inner top={355}>
        <Rise from={2} dur={10}><Head size={58}>Đèn xanh thật sự</Head></Rise>
        <div style={{ display: "flex", gap: 40, marginTop: 30, alignItems: "flex-start" }}>
          <Rise from={16} dur={12}>
            <svg width="220" height="560">
              <rect x="50" y="30" width="120" height="360" rx="20" fill="none" stroke={C.chalk} strokeWidth="5" />
              <circle cx="110" cy="110" r="38" fill="none" stroke={C.dim} strokeWidth="4" />
              <circle cx="110" cy="210" r="38" fill="none" stroke={C.dim} strokeWidth="4" />
              <circle cx="110" cy="310" r="38" fill={`rgba(255,224,138,${0.14 + 0.2 * greenOn})`} stroke={C.yellow} strokeWidth="5" />
              <line x1="110" y1="390" x2="110" y2="520" stroke={C.chalk} strokeWidth="5" />
            </svg>
          </Rise>
          <div style={{ display: "flex", flexDirection: "column", gap: 22, marginTop: 20 }}>
            <Rise from={34} dur={12}>
              <Panel style={{ padding: "22px 28px", display: "flex", alignItems: "center", gap: 20 }}>
                <svg width="52" height="52"><path d="M8 28 L20 40 L44 10" fill="none" stroke={C.yellow} strokeWidth="6" strokeLinecap="round" /></svg>
                <div style={{ fontSize: 38, color: C.chalk, ...chalkShadow }}>LIMITED BY BUDGET</div>
              </Panel>
            </Rise>
            <Rise from={48} dur={12}>
              <Panel style={{ padding: "22px 28px", display: "flex", alignItems: "center", gap: 20 }}>
                <svg width="52" height="52"><path d="M8 28 L20 40 L44 10" fill="none" stroke={C.yellow} strokeWidth="6" strokeLinecap="round" /></svg>
                <div style={{ fontSize: 38, color: C.chalk, ...chalkShadow }}>ROAS VẪN ĐẠT TARGET</div>
              </Panel>
            </Rise>
            <Rise from={62} dur={12}>
              <div style={{ position: "relative", width: 360 }}>
                <Panel style={{ padding: "16px 24px", opacity: 0.55 }}>
                  <div style={{ fontFamily: mono, fontSize: 20, letterSpacing: 2, color: C.dim }}>RECOMMENDATIONS</div>
                  <div style={{ fontSize: 30, color: C.dim, marginTop: 6 }}>Tăng ngân sách x3</div>
                </Panel>
                <svg width="360" height="110" style={{ position: "absolute", left: 0, top: 0 }}>
                  <line x1="20" y1="14" x2="340" y2="96" stroke={C.pink} strokeWidth="6" strokeLinecap="round" opacity={progressAt(frame, 72, 10)} />
                </svg>
              </div>
            </Rise>
            <Rise from={82} dur={10}>
              <Chip text="thiếu tiền, không thiếu khách" color={C.yellow} size={28} />
            </Rise>
          </div>
        </div>
      </Inner>
    </Shell>
  );
};

// S12: seasonality switch for short sales
const S12: React.FC = () => {
  const frame = useCurrentFrame();
  const flip = progressAt(frame, 44, 12);
  return (
    <Shell>
      <Inner top={360}>
        <Rise from={2} dur={10}><Head size={58}>Sale ngắn ngày thì sao?</Head></Rise>
        <Rise from={18} dur={14}>
          <svg width="880" height="330" style={{ marginTop: 30 }}>
            {Array.from({ length: 7 }, (_, i) => {
              const sale = i >= 2 && i <= 4;
              return (
                <g key={i} opacity={progressAt(frame, 20 + i * 4, 10)}>
                  <rect x={70 + i * 110} y="80" width="94" height="94" rx="10" fill={sale ? "rgba(255,224,138,0.12)" : "none"} stroke={sale ? C.yellow : C.line} strokeWidth={sale ? 5 : 3} />
                  {sale ? (
                    <text x={117 + i * 110} y="138" textAnchor="middle" fill={C.yellow} style={{ fontFamily: hand, fontSize: 30 }}>SALE</text>
                  ) : null}
                </g>
              );
            })}
            <text x="440" y="250" textAnchor="middle" fill={C.dim} style={{ fontFamily: hand, fontSize: 30 }} opacity={progressAt(frame, 40, 10)}>event ngắn: đừng giật budget bằng tay</text>
          </svg>
        </Rise>
        <Rise from={44} dur={14}>
          <Panel style={{ marginTop: 20, padding: "26px 32px", display: "flex", alignItems: "center", gap: 30, width: 760 }}>
            <svg width="130" height="64">
              <rect x="6" y="12" width="118" height="40" rx="20" fill={flip > 0.5 ? "rgba(255,224,138,0.18)" : "none"} stroke={C.yellow} strokeWidth="4" />
              <circle cx={32 + 60 * flip} cy="32" r="16" fill={C.yellow} />
            </svg>
            <div style={{ fontSize: 40, color: C.chalk, ...chalkShadow }}>SEASONALITY ADJUSTMENTS</div>
          </Panel>
        </Rise>
        <Rise from={70} dur={12}>
          <div style={{ marginTop: 26 }}>
            <Chip text="docs: lý tưởng 1-7 ngày · đừng quá 14" color={C.dim} size={26} />
          </div>
        </Rise>
      </Inner>
    </Shell>
  );
};

// S14: the validator wall
const S14: React.FC = () => {
  const frame = useCurrentFrame();
  const hitP = progressAt(frame, 26, 20);
  const xP = progressAt(frame, 70, 14);
  return (
    <Shell>
      <Inner top={355}>
        <Rise from={2} dur={10}><Head size={58}>Vi phạm là bị chặn</Head></Rise>
        <Rise from={16} dur={14}>
          <svg width="900" height="430" style={{ marginTop: 22 }}>
            {/* scale command sliding into the barrier */}
            <g transform={`translate(${-190 + 320 * Math.min(1, hitP * 1.15)} 0)`}>
              <rect x="60" y="120" width="230" height="80" rx="12" fill="none" stroke={C.yellow} strokeWidth="5" />
              <text x="175" y="172" textAnchor="middle" fill={C.yellow} style={{ fontFamily: hand, fontSize: 36 }}>SCALE +20%</text>
            </g>
            {/* the barrier */}
            <g opacity={progressAt(frame, 20, 10)}>
              <rect x="470" y="60" width="34" height="260" fill="none" stroke={C.pink} strokeWidth="5" />
              {[0, 1, 2, 3].map((i) => (
                <line key={i} x1="470" y1={78 + i * 62} x2="504" y2={110 + i * 62} stroke={C.pink} strokeWidth="4" />
              ))}
            </g>
            <g opacity={hitP > 0.85 ? 1 : 0}>
              <text x="560" y="120" fill={C.pink} style={{ fontFamily: mono, fontSize: 34 }}>ERROR:</text>
              <text x="560" y="168" fill={C.pink} style={{ fontFamily: mono, fontSize: 34 }}>WITHIN COOLDOWN</text>
            </g>
            {/* reversal arrows (clean up + down pair) crossed out */}
            <g opacity={progressAt(frame, 56, 12)}>
              <line x1="140" y1="392" x2="140" y2="312" stroke={C.chalk} strokeWidth="5" strokeLinecap="round" />
              <path d="M126 330 L140 310 L154 330" fill="none" stroke={C.chalk} strokeWidth="5" strokeLinecap="round" />
              <line x1="205" y1="312" x2="205" y2="392" stroke={C.chalk} strokeWidth="5" strokeLinecap="round" />
              <path d="M191 374 L205 394 L219 374" fill="none" stroke={C.chalk} strokeWidth="5" strokeLinecap="round" />
              <line x1="108" y1="316" x2={108 + 128 * xP} y2={316 + 72 * xP} stroke={C.pink} strokeWidth="7" strokeLinecap="round" />
              <line x1="236" y1="316" x2={236 - 128 * xP} y2={316 + 72 * xP} stroke={C.pink} strokeWidth="7" strokeLinecap="round" />
              <text x="300" y="372" fill={C.dim} style={{ fontFamily: hand, fontSize: 30 }}>đảo chiều trong cooldown = chặn</text>
            </g>
          </svg>
        </Rise>
        <Rise from={80} dur={14}>
          <svg width="880" height="150" style={{ marginTop: 6 }}>
            <line x1="60" y1="70" x2="820" y2="70" stroke={C.line} strokeWidth="4" />
            {[0, 1, 2, 3, 4].map((i) => (
              <g key={i} opacity={progressAt(frame, 84 + i * 5, 8)}>
                <circle cx={140 + i * 160} cy="70" r="10" fill={i === 2 ? C.pink : C.chalk} />
                <text x={140 + i * 160} y="120" textAnchor="middle" fill={C.dim} style={{ fontFamily: hand, fontSize: 24 }}>{i === 2 ? "đổi budget" : ""}</text>
              </g>
            ))}
            <text x="60" y="30" fill={C.dim} style={{ fontFamily: hand, fontSize: 28 }}>timeline: ai đổi gì, hôm nào</text>
          </svg>
        </Rise>
      </Inner>
    </Shell>
  );
};

// S15: the safety-line honest note
const S15: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <Shell>
      <Inner top={358}>
        <Rise from={2} dur={10}><Head size={58}>Công bằng mà nói</Head></Rise>
        <Rise from={18} dur={14}>
          <svg width="880" height="520" style={{ marginTop: 22 }}>
            {/* ladder */}
            <line x1="240" y1="60" x2="200" y2="470" stroke={C.chalk} strokeWidth="5" />
            <line x1="360" y1="60" x2="320" y2="470" stroke={C.chalk} strokeWidth="5" />
            {[0, 1, 2, 3, 4].map((i) => (
              <line key={i} x1={232 - i * 8} y1={120 + i * 80} x2={352 - i * 8} y2={120 + i * 80} stroke={C.chalk} strokeWidth="4.5" />
            ))}
            {/* climber */}
            <g opacity={progressAt(frame, 30, 12)}>
              <circle cx="440" cy="200" r="22" fill="none" stroke={C.yellow} strokeWidth="4.5" />
              <line x1="440" y1="222" x2="440" y2="290" stroke={C.yellow} strokeWidth="4.5" />
              <line x1="440" y1="245" x2="380" y2="230" stroke={C.yellow} strokeWidth="4.5" />
              <line x1="440" y1="245" x2="500" y2="262" stroke={C.yellow} strokeWidth="4.5" />
              <line x1="440" y1="290" x2="400" y2="350" stroke={C.yellow} strokeWidth="4.5" />
              <line x1="440" y1="290" x2="480" y2="350" stroke={C.yellow} strokeWidth="4.5" />
            </g>
            {/* safety line hooked to the ladder */}
            <path d="M448 250 q 90 30 60 110 q -24 64 -172 40" fill="none" stroke={C.pink} strokeWidth="4.5" strokeDasharray="10 8" opacity={progressAt(frame, 44, 14)} />
            <circle cx="330" cy="396" r="10" fill="none" stroke={C.pink} strokeWidth="4" opacity={progressAt(frame, 54, 10)} />
            <text x="560" y="420" fill={C.dim} style={{ fontFamily: hand, fontSize: 32 }} opacity={progressAt(frame, 58, 10)}>dây an toàn, không phải luật</text>
          </svg>
        </Rise>
        <Rise from={72} dur={14}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 4 }}>
            <Chip text="Google: không công bố % nào cho budget" color={C.dim} size={26} />
            <Chip text="repo tự ghi: practitioner consensus" color={C.yellow} size={26} />
          </div>
        </Rise>
      </Inner>
    </Shell>
  );
};

// S17: series card
const S17: React.FC = () => {
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
              <div style={{ fontSize: 34, color: C.dim }}>TẬP 05</div>
              <div style={{ fontSize: 50, color: C.yellow, marginTop: 8, ...chalkShadow }}>AUDIT FULL TÀI KHOẢN</div>
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
  "12": <S12 />,
  "13": <FootageScene src="footage/money-leak-ep2_scroll.mp4" />,
  "14": <S14 />,
  "15": <S15 />,
  "16": <FootageScene src="footage/money-leak-ep2_author.mp4" />,
  "17": <S17 />,
};

export const MoneyLeakEp4: React.FC = () => {
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
