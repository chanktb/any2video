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
import { loadFont as loadBVP } from "@remotion/google-fonts/BeVietnamPro";
import { loadFont as loadJBM } from "@remotion/google-fonts/JetBrainsMono";
import { loadFont as loadSG } from "@remotion/google-fonts/SpaceGrotesk";
import { Rise, progressAt } from "../lib/core";
import { KaraokeNeon } from "../lib/karaoke";
import { SCENES } from "./fb-ads-2026-data";

// Run: fb-ads-2026 (news listicle from a factchecked article) · path B · skin ESCBASE-STARFIELD
// Slide = label, voice + karaoke = commentary. One fresh layout per scene.
// Safe zone: x 90-990, content y 345-1440 (karaoke band 1470-1635 empty).

const { fontFamily: sans } = loadBVP("normal", {
  weights: ["500", "700", "800"],
  subsets: ["latin", "vietnamese"],
});
const { fontFamily: mono } = loadJBM("normal", {
  weights: ["400", "700"],
  subsets: ["latin", "vietnamese"],
});
// SpaceGrotesk is latin-only: EN labels + digits exclusively
const { fontFamily: grotesk } = loadSG("normal", {
  weights: ["500", "700"],
  subsets: ["latin"],
});

const C = {
  bg: "#060e1c",
  fg: "#eaf2fb",
  muted: "#8fa6bd",
  blue: "#38bdf8",
  amber: "#fbbf24",
  green: "#10b981",
  purple: "#c084fc",
  rose: "#fb7185",
  line: "rgba(255,255,255,0.12)",
  cardBg: "rgba(255,255,255,0.045)",
};

// ------------------------------------------------------------------- chrome

const Stars: React.FC = () => {
  const frame = useCurrentFrame();
  const stars = Array.from({ length: 120 }, (_, i) => ({
    x: random(`fx${i}`) * 1080,
    y: random(`fy${i}`) * 1920,
    r: 0.6 + random(`fr${i}`) * 1.7,
    ph: random(`fp${i}`) * Math.PI * 2,
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
          opacity={0.1 + 0.3 * (0.5 + 0.5 * Math.sin(s.ph + frame / 12))}
        />
      ))}
    </svg>
  );
};

const Shell: React.FC<{ children: React.ReactNode; glow?: string }> = ({ children, glow = C.blue }) => {
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
        style={{ background: `radial-gradient(ellipse at 50% 22%, ${glow}21, transparent 56%)` }}
      />
      {children}
    </AbsoluteFill>
  );
};

const Pill: React.FC<{ text: string; color?: string }> = ({ text, color = C.blue }) => (
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

const Chip: React.FC<{ text: string; color?: string; mono?: boolean }> = ({ text, color = C.blue, mono: useMono = true }) => (
  <span
    style={{
      display: "inline-block",
      fontFamily: useMono ? mono : sans,
      fontSize: 24,
      fontWeight: useMono ? 400 : 600,
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

const IconSq: React.FC<{ ic: string; color: string; size?: number }> = ({ ic, color, size = 96 }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: 22,
      border: `1px solid ${color}66`,
      background: `${color}12`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: size * 0.55,
      boxShadow: `0 0 30px ${color}22`,
    }}
  >
    {ic}
  </div>
);

const Panel: React.FC<{ children: React.ReactNode; glow?: string; style?: React.CSSProperties }> = ({
  children,
  glow = C.blue,
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

const Inner: React.FC<{ children: React.ReactNode; top?: number }> = ({ children, top = 345 }) => (
  <div style={{ position: "absolute", left: 90, right: 90, top }}>{children}</div>
);

const Head: React.FC<{ children: React.ReactNode; size?: number }> = ({ children, size = 78 }) => (
  <div style={{ fontFamily: sans, fontSize: size, fontWeight: 800, lineHeight: 1.24 }}>{children}</div>
);

// ------------------------------------------------------------------ 1 HOOK
const S1: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const zoom = interpolate(frame, [0, durationInFrames], [1, 1.07]);
  const pulse = 0.3 + 0.25 * (0.5 + 0.5 * Math.sin(frame / 4.5));
  const sweep = interpolate(frame % 44, [0, 44], [-500, 1500]);
  return (
    <Shell glow={C.rose}>
      <div
        style={{
          position: "absolute",
          left: sweep,
          top: -200,
          width: 220,
          height: 2400,
          rotate: "18deg",
          background: "linear-gradient(90deg, transparent, rgba(56,189,248,0.15), transparent)",
        }}
      />
      <Inner top={345}>
        <Rise from={1} dur={8}><Pill text="⚡ FACEBOOK ADS 2026" color={C.amber} /></Rise>
        <div style={{ scale: String(zoom), transformOrigin: "12% 40%", marginTop: 40 }}>
          <Rise from={4} dur={9}>
            <div style={{ fontFamily: sans, fontSize: 108, fontWeight: 800, lineHeight: 1.18 }}>
              LUẬT CHƠI
            </div>
          </Rise>
          <Rise from={9} dur={9}>
            <div
              style={{
                fontFamily: sans,
                fontSize: 122,
                fontWeight: 800,
                lineHeight: 1.16,
                color: C.rose,
                textShadow: `0 0 ${30 + 40 * pulse}px rgba(251,113,133,${pulse})`,
              }}
            >
              ĐÃ ĐỔI
            </div>
          </Rise>
          <Rise from={15} dur={9} style={{ marginTop: 26 }}>
            <div style={{ fontFamily: sans, fontSize: 54, fontWeight: 800, color: C.blue }}>
              không phải tại bạn
            </div>
          </Rise>
        </div>
      </Inner>
    </Shell>
  );
};

// ----------------------------------------------------------- 2 REVEAL Andromeda
const S2: React.FC = () => {
  const frame = useCurrentFrame();
  const spin = (frame * 1.4) % 360;
  return (
    <Shell glow={C.purple}>
      <Inner top={380}>
        <div style={{ textAlign: "center" }}>
          <Rise from={4}>
            <div
              style={{
                width: 190,
                height: 190,
                margin: "0 auto",
                borderRadius: "50%",
                padding: 6,
                background: `conic-gradient(from ${spin}deg, ${C.purple}, transparent 55%, ${C.purple})`,
                boxShadow: `0 0 48px ${C.purple}33`,
              }}
            >
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: "50%",
                  background: C.bg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 92,
                }}
              >
                🌌
              </div>
            </div>
          </Rise>
          <Rise from={18} style={{ marginTop: 40 }}>
            <div style={{ fontFamily: grotesk, fontSize: 92, fontWeight: 700, letterSpacing: 4, color: C.fg }}>
              ANDROMEDA
            </div>
            <div style={{ fontFamily: sans, fontSize: 34, fontWeight: 600, color: C.muted, marginTop: 14 }}>
              engine truy xuất quảng cáo AI
            </div>
          </Rise>
          <Rise from={38} style={{ marginTop: 40 }}>
            <Chip text="rollout xong 10/2025" color={C.green} />
          </Rise>
          <Rise from={52} style={{ marginTop: 34 }}>
            <div style={{ fontFamily: sans, fontSize: 38, fontWeight: 700, color: C.amber }}>
              target cũ → đồ cổ
            </div>
          </Rise>
        </div>
      </Inner>
    </Shell>
  );
};

// -------------------------------------------------------------- 3 RULE 1 broad
const S3: React.FC = () => {
  const frame = useCurrentFrame();
  const grow = progressAt(frame, 24, 30);
  return (
    <Shell>
      <Inner top={345}>
        <Rise from={2}><Pill text="🎯 LUẬT 01 · TARGETING" /></Rise>
        <Rise from={10} style={{ marginTop: 40 }}>
          <Head size={86}>BROAD =
            <br />
            <span style={{ color: C.blue, textShadow: `0 0 30px ${C.blue}66` }}>MẶC ĐỊNH</span></Head>
        </Rise>
        <div style={{ position: "relative", height: 480, marginTop: 40 }}>
          <svg width="900" height="480">
            {/* vòng broad phình to */}
            <circle
              cx="450"
              cy="240"
              r={90 + 130 * grow}
              fill="rgba(56,189,248,0.08)"
              stroke={C.blue}
              strokeWidth="2.5"
              opacity={0.9}
            />
            <circle cx="450" cy="240" r={90 + 130 * grow} fill="none" stroke={C.blue} strokeWidth="8" opacity={0.14} />
            {/* vòng target tay teo lại */}
            <circle
              cx="450"
              cy="240"
              r={80 * (1 - 0.6 * grow)}
              fill="none"
              stroke={C.rose}
              strokeWidth="2"
              strokeDasharray="6 8"
              opacity={0.85}
            />
          </svg>
          <Rise from={30} style={{ position: "absolute", left: 0, top: 12 }}>
            <Chip text="máy tự khớp hành vi thật" color={C.blue} mono={false} />
          </Rise>
          <Rise from={48} style={{ position: "absolute", right: 0, bottom: 10 }}>
            <span
              style={{
                fontFamily: sans,
                fontSize: 27,
                fontWeight: 600,
                color: C.rose,
                textDecoration: "line-through",
              }}
            >
              cắm sở thích thủ công
            </span>
          </Rise>
        </div>
      </Inner>
    </Shell>
  );
};

// ------------------------------------------------------- 4 RULE 1b objectives
const S4: React.FC = () => {
  const tiles: Array<[string, string, string]> = [
    ["👁️", "Nhận thức", C.blue],
    ["🚦", "Traffic", C.green],
    ["💬", "Tương tác", C.amber],
    ["🧲", "Lead", C.purple],
    ["📱", "App", C.rose],
    ["💰", "Sales", C.green],
  ];
  return (
    <Shell glow={C.purple}>
      <Inner top={345}>
        <Rise from={2}><Pill text="✨ Advantage+ MẶC ĐỊNH" color={C.purple} /></Rise>
        <Rise from={12} style={{ marginTop: 40 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 24 }}>
            <span style={{ fontFamily: grotesk, fontSize: 170, fontWeight: 700, lineHeight: 1, color: C.amber, textShadow: `0 0 46px ${C.amber}44` }}>
              6
            </span>
            <span style={{ fontFamily: sans, fontSize: 48, fontWeight: 800 }}>
              nhóm mục tiêu,
              <br />
              hết.
            </span>
          </div>
        </Rise>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20, marginTop: 50 }}>
          {tiles.map(([ic, t, c], i) => (
            <Rise key={t} from={26 + i * 7}>
              <div
                style={{
                  border: `1px solid ${c}55`,
                  background: `${c}0d`,
                  borderRadius: 20,
                  padding: "24px 0",
                  textAlign: "center",
                  boxShadow: `0 0 24px ${c}18`,
                }}
              >
                <div style={{ fontSize: 44 }}>{ic}</div>
                <div style={{ fontFamily: sans, fontSize: 26, fontWeight: 700, color: c as string, marginTop: 10 }}>{t}</div>
              </div>
            </Rise>
          ))}
        </div>
      </Inner>
    </Shell>
  );
};

// ------------------------------------------------------ 5 RULE 2 creative
const S5: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <Shell glow={C.amber}>
      <Inner top={345}>
        <Rise from={2}><Pill text="🎨 LUẬT 02 · CREATIVE" color={C.amber} /></Rise>
        <Rise from={10} style={{ marginTop: 40 }}>
          <Head>Nội dung
            <br />
            là target mới.</Head>
        </Rise>
        <div style={{ display: "flex", alignItems: "center", gap: 0, marginTop: 66 }}>
          <Rise from={22} style={{ flex: 1.2 }}>
            <Panel glow={C.amber} style={{ padding: "30px 24px", textAlign: "center" }}>
              <div style={{ fontSize: 52 }}>🖼️ 🎬 ✍️</div>
              <div style={{ fontFamily: sans, fontSize: 26, fontWeight: 700, color: C.amber, marginTop: 12 }}>
                hình · video · tiêu đề
              </div>
            </Panel>
          </Rise>
          <svg width="66" height="24" style={{ flexShrink: 0, opacity: progressAt(frame, 34, 8) }}>
            <line x1="4" y1="12" x2="48" y2="12" stroke={C.muted} strokeWidth="3" />
            <path d="M46 4 L60 12 L46 20" fill="none" stroke={C.muted} strokeWidth="3" />
          </svg>
          <Rise from={36} style={{ flexShrink: 0 }}>
            <IconSq ic="👁️" color={C.blue} size={110} />
          </Rise>
          <svg width="66" height="24" style={{ flexShrink: 0, opacity: progressAt(frame, 46, 8) }}>
            <line x1="4" y1="12" x2="48" y2="12" stroke={C.muted} strokeWidth="3" />
            <path d="M46 4 L60 12 L46 20" fill="none" stroke={C.muted} strokeWidth="3" />
          </svg>
          <Rise from={48} style={{ flex: 1 }}>
            <Panel glow={C.green} style={{ padding: "30px 24px", textAlign: "center" }}>
              <div style={{ fontSize: 52 }}>🧑‍🤝‍🧑</div>
              <div style={{ fontFamily: sans, fontSize: 26, fontWeight: 700, color: C.green, marginTop: 12 }}>
                đúng tệp
              </div>
            </Panel>
          </Rise>
        </div>
        <Rise from={60} style={{ marginTop: 40 }}>
          <Chip text="AI đọc creative trước, tìm người sau" color={C.blue} mono={false} />
        </Rise>
      </Inner>
    </Shell>
  );
};

// --------------------------------------------------- 6 RULE 2b original vs reup
const S6: React.FC = () => {
  const frame = useCurrentFrame();
  const shrink = interpolate(frame, [40, 80], [0.92, 0.18], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <Shell glow={C.green}>
      <Inner top={345}>
        <Rise from={2}><Pill text="🌱 GỐC ĐƯỢC ƯU TIÊN" color={C.green} /></Rise>
        <div style={{ display: "flex", gap: 26, marginTop: 46 }}>
          <Rise from={14} style={{ flex: 1 }}>
            <Panel glow={C.green} style={{ padding: "36px 28px", border: `1.5px solid ${C.green}66` }}>
              <div style={{ fontSize: 60, textAlign: "center" }}>🌱</div>
              <div style={{ fontFamily: sans, fontSize: 36, fontWeight: 800, color: C.green, textAlign: "center", marginTop: 14 }}>
                content GỐC
              </div>
              <div style={{ height: 18, borderRadius: 9, background: "rgba(255,255,255,0.08)", marginTop: 24 }}>
                <div style={{ height: 18, width: "92%", borderRadius: 9, background: C.green, boxShadow: `0 0 16px ${C.green}` }} />
              </div>
              <div style={{ fontFamily: mono, fontSize: 22, color: C.muted, marginTop: 10 }}>reach ▲</div>
            </Panel>
          </Rise>
          <Rise from={28} style={{ flex: 1 }}>
            <Panel glow={C.rose} style={{ padding: "36px 28px", opacity: 0.85 }}>
              <div style={{ fontSize: 60, textAlign: "center" }}>♻️</div>
              <div style={{ fontFamily: sans, fontSize: 36, fontWeight: 800, color: C.rose, textAlign: "center", marginTop: 14 }}>
                re-up · copy
              </div>
              <div style={{ height: 18, borderRadius: 9, background: "rgba(255,255,255,0.08)", marginTop: 24 }}>
                <div style={{ height: 18, width: `${shrink * 100}%`, borderRadius: 9, background: C.rose, boxShadow: `0 0 14px ${C.rose}` }} />
              </div>
              <div style={{ fontFamily: mono, fontSize: 22, color: C.rose, marginTop: 10 }}>reach ▼ bị bóp</div>
            </Panel>
          </Rise>
        </div>
        <Rise from={52} style={{ marginTop: 38, textAlign: "center" }}>
          <Chip text="hiệu lực 15/7/2025" color={C.amber} />
        </Rise>
      </Inner>
    </Shell>
  );
};

// ------------------------------------------------------- 7 RULE 3 signals
const S7: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <Shell>
      <Inner top={345}>
        <Rise from={2}><Pill text="📡 LUẬT 03 · TÍN HIỆU" /></Rise>
        <Rise from={10} style={{ marginTop: 40 }}>
          <Head>Nạp gì,
            <br />
            nhận nấy.</Head>
        </Rise>
        <div style={{ display: "flex", alignItems: "center", gap: 0, marginTop: 60 }}>
          <Rise from={22} style={{ flex: 1 }}>
            <Panel glow={C.green} style={{ padding: "28px 20px", textAlign: "center" }}>
              <div style={{ fontSize: 46 }}>✨</div>
              <div style={{ fontFamily: sans, fontSize: 27, fontWeight: 700, color: C.green, marginTop: 10 }}>
                tín hiệu sạch
              </div>
            </Panel>
          </Rise>
          <svg width="64" height="24" style={{ flexShrink: 0, opacity: progressAt(frame, 32, 8) }}>
            <line x1="4" y1="12" x2="46" y2="12" stroke={C.muted} strokeWidth="3" />
            <path d="M44 4 L58 12 L44 20" fill="none" stroke={C.muted} strokeWidth="3" />
          </svg>
          <Rise from={34} style={{ flexShrink: 0 }}>
            <IconSq ic="🤖" color={C.purple} size={104} />
          </Rise>
          <svg width="64" height="24" style={{ flexShrink: 0, opacity: progressAt(frame, 44, 8) }}>
            <line x1="4" y1="12" x2="46" y2="12" stroke={C.muted} strokeWidth="3" />
            <path d="M44 4 L58 12 L44 20" fill="none" stroke={C.muted} strokeWidth="3" />
          </svg>
          <Rise from={46} style={{ flex: 1 }}>
            <Panel glow={C.amber} style={{ padding: "28px 20px", textAlign: "center" }}>
              <div style={{ fontSize: 46 }}>🛒</div>
              <div style={{ fontFamily: sans, fontSize: 27, fontWeight: 700, color: C.amber, marginTop: 10 }}>
                khách xịn
              </div>
            </Panel>
          </Rise>
        </div>
        <Rise from={56} style={{ marginTop: 36, display: "flex", gap: 14, alignItems: "center" }}>
          <span style={{ fontFamily: grotesk, fontSize: 32, fontWeight: 700, color: C.blue, border: `1.5px solid ${C.blue}77`, borderRadius: 14, padding: "10px 26px", background: `${C.blue}10` }}>
            PIXEL
          </span>
          <span style={{ fontFamily: sans, fontSize: 34, fontWeight: 800, color: C.fg }}>+</span>
          <span style={{ fontFamily: grotesk, fontSize: 32, fontWeight: 700, color: C.purple, border: `1.5px solid ${C.purple}77`, borderRadius: 14, padding: "10px 26px", background: `${C.purple}10` }}>
            CAPI
          </span>
          <Chip text="bắt buộc đủ cặp" color={C.rose} mono={false} />
        </Rise>
      </Inner>
    </Shell>
  );
};

// ------------------------------------------------------ 8 RULE 4 patience
const S8: React.FC = () => {
  const frame = useCurrentFrame();
  const jitter = Array.from({ length: 24 }, (_, i) => ({
    x: i * 38,
    y: 60 + 40 * Math.sin(i * 1.7) * (i > 8 && i < 16 ? 1.8 : 0.5),
  }));
  const calm = jitter.map((p, i) => ({ x: p.x, y: i < 12 ? p.y : 60 + 8 * Math.sin(i * 0.8) }));
  const t = progressAt(frame, 50, 26);
  return (
    <Shell glow={C.amber}>
      <Inner top={345}>
        <Rise from={2}><Pill text="🧘 LUẬT 04 · KIÊN NHẪN" color={C.amber} /></Rise>
        <Rise from={10} style={{ marginTop: 40 }}>
          <Head>Đừng
            <br />
            ngứa tay.</Head>
        </Rise>
        <div style={{ display: "flex", gap: 22, marginTop: 50 }}>
          <Rise from={24} style={{ flex: 1 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <Chip text="❌ tắt / bật liên tục" color={C.rose} mono={false} />
              <Chip text="❌ đổi cấu trúc mỗi ngày" color={C.rose} mono={false} />
              <div style={{ fontFamily: sans, fontSize: 25, fontWeight: 600, color: C.muted, marginTop: 6 }}>
                → máy học lại từ đầu
              </div>
            </div>
          </Rise>
          <Rise from={38} style={{ flex: 1 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <Chip text="✅ gộp camp cho gọn" color={C.green} mono={false} />
              <Chip text="✅ để yên vài tuần" color={C.green} mono={false} />
              <div style={{ fontFamily: sans, fontSize: 25, fontWeight: 600, color: C.muted, marginTop: 6 }}>
                → AI chạy ổn định
              </div>
            </div>
          </Rise>
        </div>
        <Rise from={46} style={{ marginTop: 40 }}>
          <Panel style={{ padding: "26px 32px" }}>
            <div style={{ fontFamily: mono, fontSize: 23, color: C.muted, marginBottom: 12 }}>CPM</div>
            <svg width="880" height="120">
              <polyline
                points={jitter.map((p, i) => `${p.x},${p.y + (calm[i].y - p.y) * t}`).join(" ")}
                fill="none"
                stroke={t > 0.6 ? C.green : C.rose}
                strokeWidth="4"
                strokeLinejoin="round"
              />
            </svg>
          </Panel>
        </Rise>
      </Inner>
    </Shell>
  );
};

// ------------------------------------------------------------- 9 CTA
const S9: React.FC = () => {
  const frame = useCurrentFrame();
  const bounce = 6 * Math.sin(frame / 6);
  return (
    <Shell glow={C.amber}>
      <Inner top={400}>
        <div style={{ display: "flex", gap: 24 }}>
          {[
            { ic: "🆕", t: "set camp mới", c: C.blue },
            { ic: "🏥", t: "khám bệnh tài khoản", c: C.rose },
          ].map((o, i) => (
            <Rise key={o.t} from={6 + i * 12} style={{ flex: 1 }}>
              <Panel glow={o.c} style={{ padding: "44px 20px", textAlign: "center" }}>
                <div style={{ fontSize: 74 }}>{o.ic}</div>
                <div style={{ fontFamily: sans, fontSize: 34, fontWeight: 800, color: o.c, marginTop: 18, lineHeight: 1.3 }}>{o.t}</div>
              </Panel>
            </Rise>
          ))}
        </div>
        <Rise from={30} style={{ marginTop: 56, textAlign: "center", translate: `0px ${bounce}px` }}>
          <span
            style={{
              display: "inline-block",
              fontFamily: sans,
              fontSize: 46,
              fontWeight: 800,
              color: C.bg,
              background: C.amber,
              borderRadius: 18,
              padding: "22px 44px",
              boxShadow: `0 0 40px ${C.amber}66`,
            }}
          >
            KỂ DƯỚI COMMENT ↓
          </span>
        </Rise>
        <Rise from={48} style={{ marginTop: 36, textAlign: "center" }}>
          <Chip text="👍 like · follow để mình gỡ cùng" color={C.amber} mono={false} />
        </Rise>
      </Inner>
    </Shell>
  );
};

// ------------------------------------------------------------- 10 PROMO
const S10: React.FC = () => (
  <Shell>
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
          <div style={{ width: 260, height: 3, background: C.blue, margin: "26px auto 0", boxShadow: `0 0 24px ${C.blue}` }} />
        </Rise>
        <Rise from={32} style={{ marginTop: 40 }}>
          <div style={{ fontFamily: mono, fontSize: 26, color: C.muted }}>
            bản tin này do AI dựng
          </div>
        </Rise>
      </div>
    </Inner>
  </Shell>
);

// ---------------------------------------------------------------------- main

const BODIES: Record<string, React.ReactNode> = {
  "1": <S1 />, "2": <S2 />, "3": <S3 />, "4": <S4 />, "5": <S5 />,
  "6": <S6 />, "7": <S7 />, "8": <S8 />, "9": <S9 />, "10": <S10 />,
};

export const FbAds2026: React.FC = () => {
  let cursor = 0;
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      {SCENES.map((scene) => {
        const from = cursor;
        cursor += scene.durationInFrames;
        return (
          <Sequence key={scene.id} from={from} durationInFrames={scene.durationInFrames} premountFor={45}>
            {BODIES[scene.id]}
            <KaraokeNeon words={scene.words} fontFamily={sans} kw={C.blue} />
            <Audio src={staticFile(scene.audio)} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
