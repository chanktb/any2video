import React from "react";
import {
  AbsoluteFill,
  Easing,
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
import { SCENES } from "./caveman-ponytail-data";

// Run: caveman-ponytail (2-repo roundup) · path B · skin REPO-DARK
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

const Stars: React.FC = () => {
  const frame = useCurrentFrame();
  const stars = Array.from({ length: 90 }, (_, i) => ({
    x: random(`cx${i}`) * 1080,
    y: random(`cy${i}`) * 1920,
    r: 0.7 + random(`cr${i}`) * 1.5,
    ph: random(`cp${i}`) * Math.PI * 2,
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

const Inner: React.FC<{ children: React.ReactNode; top?: number }> = ({ children, top = 345 }) => (
  <div style={{ position: "absolute", left: 90, right: 90, top }}>{children}</div>
);

const Head: React.FC<{ children: React.ReactNode; size?: number }> = ({ children, size = 78 }) => (
  <div style={{ fontFamily: sans, fontSize: size, fontWeight: 800, lineHeight: 1.24 }}>{children}</div>
);

// ------------------------------------------------------------------ 1 HOOK
// Keyword-first + continuous motion: giant "2" pulses, sweep light, slow zoom.
const S1: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const zoom = interpolate(frame, [0, durationInFrames], [1, 1.07]);
  const pulse = 0.3 + 0.25 * (0.5 + 0.5 * Math.sin(frame / 4.5));
  const sweep = interpolate(frame % 44, [0, 44], [-500, 1500]);
  return (
    <Shell glow={C.amber}>
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
        <Rise from={1} dur={8}><Pill text="⭐ GITHUB TRENDING" color={C.amber} /></Rise>
        <div style={{ display: "flex", alignItems: "center", gap: 40, marginTop: 40, scale: String(zoom), transformOrigin: "20% 40%" }}>
          <Rise from={3} dur={9}>
            <div
              style={{
                fontFamily: sans,
                fontSize: 340,
                fontWeight: 800,
                lineHeight: 1,
                color: C.cyan,
                textShadow: `0 0 ${40 + 50 * pulse}px rgba(34,211,238,${pulse})`,
              }}
            >
              2
            </div>
          </Rise>
          <div>
            <Rise from={8} dur={9}>
              <div style={{ fontFamily: sans, fontSize: 88, fontWeight: 800, lineHeight: 1.2 }}>
                NHÂN SỰ
                <br />
                MỚI
              </div>
            </Rise>
          </div>
        </div>
        <Rise from={14} dur={9} style={{ marginTop: 30 }}>
          <div style={{ fontFamily: sans, fontSize: 56, fontWeight: 800, color: C.amber }}>
            cho Claude Code · Codex
          </div>
        </Rise>
      </Inner>
    </Shell>
  );
};

// --------------------------------------------------------------- 2 CONTEXT
// Two repo cards, each wearing a #1 TRENDING crown badge.
const S2: React.FC = () => (
  <Shell>
    <Inner top={345}>
      <div style={{ display: "flex", gap: 26 }}>
        {[
          { ic: "🪨", name: "Caveman", c: C.cyan },
          { ic: "🐴", name: "Ponytail", c: C.green },
        ].map((r, i) => (
          <Rise key={r.name} from={6 + i * 12} style={{ flex: 1 }}>
            <Panel glow={r.c} style={{ padding: "40px 20px", textAlign: "center" }}>
              <div style={{ fontSize: 84 }}>{r.ic}</div>
              <div style={{ fontFamily: sans, fontSize: 46, fontWeight: 800, marginTop: 18 }}>{r.name}</div>
              <div style={{ marginTop: 20 }}>
                <Chip text="TRENDING #1" color={C.amber} />
              </div>
            </Panel>
          </Rise>
        ))}
      </div>
      <Rise from={34} style={{ marginTop: 46, textAlign: "center" }}>
        <div style={{ fontFamily: sans, fontSize: 42, fontWeight: 700, color: C.muted }}>
          không phải model mới
        </div>
        <div style={{ fontFamily: sans, fontSize: 52, fontWeight: 800, color: C.fg, marginTop: 12 }}>
          chỉ đổi <span style={{ color: C.cyan }}>cách AI làm việc</span>
        </div>
      </Rise>
    </Inner>
  </Shell>
);

// --------------------------------------------------------------- 3 FRAMING
// Vertical split: BỚT NÓI / BỚT CODE.
const S3: React.FC = () => {
  const frame = useCurrentFrame();
  const div = progressAt(frame, 8, 16);
  return (
    <Shell glow={C.purple}>
      <Inner top={420}>
        <div style={{ display: "flex", gap: 0, alignItems: "stretch", height: 620 }}>
          <Rise from={10} style={{ flex: 1 }}>
            <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 30 }}>
              <div style={{ fontSize: 110 }}>💬</div>
              <div style={{ fontFamily: sans, fontSize: 66, fontWeight: 800, color: C.cyan }}>BỚT NÓI</div>
              <Chip text="Caveman" />
            </div>
          </Rise>
          <div style={{ width: 3, height: `${div * 100}%`, alignSelf: "center", background: `linear-gradient(180deg, transparent, ${C.purple}, transparent)`, boxShadow: `0 0 20px ${C.purple}` }} />
          <Rise from={22} style={{ flex: 1 }}>
            <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 30 }}>
              <div style={{ fontSize: 110 }}>⌨️</div>
              <div style={{ fontFamily: sans, fontSize: 66, fontWeight: 800, color: C.green }}>BỚT CODE</div>
              <Chip text="Ponytail" color={C.green} />
            </div>
          </Rise>
        </div>
      </Inner>
    </Shell>
  );
};

// ---------------------------------------------------- 4 CAVEMAN PAIN (chat)
// Tall rambling bubble vs one terse bubble.
const S4: React.FC = () => (
  <Shell glow={C.red}>
    <Inner top={345}>
      <Rise from={2}><Pill text="🪨 CAVEMAN · BỆNH NÓI NHIỀU" color={C.red} /></Rise>
      <Rise from={14} style={{ marginTop: 44 }}>
        <div
          style={{
            width: 720,
            background: C.cardBg,
            border: `1px solid ${C.line}`,
            borderRadius: "26px 26px 26px 6px",
            padding: "30px 34px",
          }}
        >
          <div style={{ fontFamily: mono, fontSize: 23, color: C.muted, marginBottom: 16 }}>
            Kế hoạch... nguyên nhân... phân tích...
          </div>
          <svg width="640" height="230">
            {Array.from({ length: 8 }, (_, i) => (
              <rect
                key={i}
                x={0}
                y={i * 30}
                width={640 * (0.55 + random(`bl${i}`) * 0.4)}
                height={13}
                rx={6}
                fill="rgba(159,179,200,0.28)"
              />
            ))}
          </svg>
          <div style={{ fontFamily: mono, fontSize: 22, color: C.red, marginTop: 14 }}>...3 đoạn văn sau mới sửa</div>
        </div>
      </Rise>
      <Rise from={46} style={{ marginTop: 40, display: "flex", justifyContent: "flex-end" }}>
        <div
          style={{
            background: `${C.green}14`,
            border: `1.5px solid ${C.green}88`,
            borderRadius: "26px 26px 6px 26px",
            padding: "26px 40px",
            fontFamily: sans,
            fontSize: 44,
            fontWeight: 800,
            color: C.green,
            boxShadow: `0 0 34px ${C.green}22`,
          }}
        >
          Sửa xong ✅
        </div>
      </Rise>
      <Rise from={58} style={{ marginTop: 30, textAlign: "right" }}>
        <span style={{ fontFamily: sans, fontSize: 28, fontWeight: 500, color: C.muted }}>
          mình chỉ cần vậy thôi
        </span>
      </Rise>
    </Inner>
  </Shell>
);

// -------------------------------------------------- 5 CAVEMAN WHAT (flow)
const S5: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <Shell>
      <Inner top={345}>
        <Rise from={2}><Pill text="🪨 CAVEMAN · CƠ CHẾ" /></Rise>
        <Rise from={10} style={{ marginTop: 40 }}>
          <Head>Một bộ quy tắc,
            <br />
            nạp là chạy.</Head>
        </Rise>
        <div style={{ display: "flex", alignItems: "center", gap: 0, marginTop: 70 }}>
          {[
            { ic: "📜", label: "RULES", c: C.amber },
            { ic: "🤖", label: "AGENT", c: C.cyan },
            { ic: "🎯", label: "NGẮN GỌN", c: C.green },
          ].map((n, i) => (
            <React.Fragment key={n.label}>
              {i > 0 && (
                <svg width="70" height="24" style={{ flexShrink: 0, opacity: progressAt(frame, 20 + i * 12, 8) }}>
                  <line x1="4" y1="12" x2="52" y2="12" stroke={C.muted} strokeWidth="3" />
                  <path d="M50 4 L64 12 L50 20" fill="none" stroke={C.muted} strokeWidth="3" />
                </svg>
              )}
              <Rise from={14 + i * 12} style={{ flex: 1 }}>
                <Panel glow={n.c} style={{ padding: "34px 10px", textAlign: "center" }}>
                  <div style={{ fontSize: 62 }}>{n.ic}</div>
                  <div style={{ fontFamily: mono, fontSize: 25, fontWeight: 700, color: n.c, marginTop: 14, letterSpacing: 2 }}>
                    {n.label}
                  </div>
                </Panel>
              </Rise>
            </React.Fragment>
          ))}
        </div>
        <Rise from={56} style={{ marginTop: 44, display: "flex", gap: 16 }}>
          <Chip text="bỏ rào đón" color={C.red} />
          <Chip text="giữ thông tin kỹ thuật" />
          <Chip text="code giữ nguyên" color={C.green} />
        </Rise>
      </Inner>
    </Shell>
  );
};

// -------------------------------------------- 6 CAVEMAN BENCHMARK (hero số)
const S6: React.FC = () => {
  const frame = useCurrentFrame();
  const pct = Math.round(countAt(frame, 65, 12, 40));
  const shrink = interpolate(frame, [50, 85], [1, 19 / 69], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  return (
    <Shell>
      <Inner top={345}>
        <Rise from={2}><Pill text="🪨 CAVEMAN · SỐ CỦA TÁC GIẢ" /></Rise>
        <Rise from={10} style={{ marginTop: 34 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 24 }}>
            <span style={{ fontFamily: sans, fontSize: 250, fontWeight: 800, lineHeight: 1, color: C.cyan, textShadow: `0 0 60px ${C.cyan}55` }}>
              -{pct}%
            </span>
          </div>
          <div style={{ fontFamily: sans, fontSize: 44, fontWeight: 700, color: C.muted, marginTop: 8 }}>
            output · trung bình <span style={{ fontFamily: mono, fontSize: 30, color: C.amber }}>(dải 22-87%)</span>
          </div>
        </Rise>
        <Rise from={44} style={{ marginTop: 64 }}>
          <Panel style={{ padding: "34px 40px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontFamily: mono, fontSize: 26, color: C.muted }}>
              <span>câu trả lời mẫu</span>
              <span style={{ color: C.green, fontWeight: 700 }}>69 → 19 token</span>
            </div>
            <div style={{ height: 26, borderRadius: 13, background: "rgba(255,255,255,0.08)", marginTop: 18, overflow: "hidden" }}>
              <div
                style={{
                  width: `${shrink * 100}%`,
                  height: "100%",
                  borderRadius: 13,
                  background: `linear-gradient(90deg, ${C.green}, rgba(74,222,128,0.5))`,
                  boxShadow: `0 0 18px ${C.green}`,
                }}
              />
            </div>
          </Panel>
        </Rise>
      </Inner>
    </Shell>
  );
};

// ------------------------------------------------ 7 CAVEMAN CAVEAT não/miệng
const S7: React.FC = () => (
  <Shell glow={C.purple}>
    <Inner top={400}>
      <div style={{ display: "flex", gap: 26 }}>
        <Rise from={8} style={{ flex: 1 }}>
          <Panel glow={C.purple} style={{ padding: "50px 24px", textAlign: "center" }}>
            <div style={{ fontSize: 100 }}>🧠</div>
            <div style={{ fontFamily: sans, fontSize: 44, fontWeight: 800, marginTop: 22, color: C.purple }}>NÃO</div>
            <div style={{ fontFamily: sans, fontSize: 32, fontWeight: 600, color: C.fg, marginTop: 10 }}>giữ nguyên</div>
            <div style={{ fontFamily: mono, fontSize: 22, color: C.muted, marginTop: 14 }}>reasoning y như cũ</div>
          </Panel>
        </Rise>
        <Rise from={24} style={{ flex: 1 }}>
          <Panel style={{ padding: "50px 24px", textAlign: "center" }}>
            <div style={{ fontSize: 100 }}>🗣️</div>
            <div style={{ fontFamily: sans, fontSize: 44, fontWeight: 800, marginTop: 22, color: C.cyan }}>MIỆNG</div>
            <div style={{ fontFamily: sans, fontSize: 32, fontWeight: 600, color: C.fg, marginTop: 10 }}>ngắn lại</div>
            <div style={{ fontFamily: mono, fontSize: 22, color: C.muted, marginTop: 14 }}>chỉ đổi cách diễn đạt</div>
          </Panel>
        </Rise>
      </div>
      <Rise from={44} style={{ marginTop: 44, textAlign: "center" }}>
        <Chip text="không bớt thông minh" color={C.amber} />
      </Rise>
    </Inner>
  </Shell>
);

// ------------------------------------------- 8 PONYTAIL PAIN (tháp làm lố)
const S8: React.FC = () => {
  const frame = useCurrentFrame();
  const blocks = [
    { t: "+1 thư viện", c: C.red, w: 560 },
    { t: "interface", c: C.amber, w: 480 },
    { t: "helper", c: C.purple, w: 420 },
    { t: "abstraction", c: C.cyan, w: 360 },
  ];
  return (
    <Shell glow={C.red}>
      <Inner top={345}>
        <Rise from={2}><Pill text="🐴 PONYTAIL · BỆNH LÀM LỐ" color={C.red} /></Rise>
        <Rise from={12} style={{ marginTop: 40 }}>
          <Chip text="yêu cầu: 1 tính năng bé tí" color={C.green} />
        </Rise>
        <div style={{ position: "relative", height: 560, marginTop: 40 }}>
          {blocks.map((b, i) => {
            const lean = (i + 1) * 1.4 * progressAt(frame, 60, 24);
            return (
              <Rise key={b.t} from={22 + i * 10} style={{ position: "absolute", bottom: i * 118, left: 60 + i * 26 }}>
                <div
                  style={{
                    width: b.w,
                    padding: "26px 0",
                    textAlign: "center",
                    fontFamily: mono,
                    fontSize: 30,
                    fontWeight: 700,
                    color: b.c,
                    border: `1.5px solid ${b.c}77`,
                    borderRadius: 16,
                    background: `${b.c}10`,
                    rotate: `${lean}deg`,
                    boxShadow: `0 0 26px ${b.c}22`,
                  }}
                >
                  {b.t}
                </div>
              </Rise>
            );
          })}
          <Rise from={66} style={{ position: "absolute", right: 0, bottom: 220 }}>
            <div style={{ fontFamily: sans, fontSize: 34, fontWeight: 800, color: C.red, rotate: "8deg" }}>
              sắp đổ! 😵
            </div>
          </Rise>
        </div>
      </Inner>
    </Shell>
  );
};

// -------------------------------------------- 9 PONYTAIL EXAMPLE (date input)
const S9: React.FC = () => (
  <Shell glow={C.green}>
    <Inner top={345}>
      <Rise from={2}><Pill text="🐴 VÍ DỤ KINH ĐIỂN · Ô CHỌN NGÀY" color={C.green} /></Rise>
      <Rise from={16} style={{ marginTop: 50 }}>
        <Panel glow={C.green} style={{ padding: "40px 44px", border: `1.5px solid ${C.green}66` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontFamily: mono, fontSize: 38, fontWeight: 700, color: C.green }}>
              {"<input type=\"date\">"}
            </span>
            <span style={{ fontSize: 52 }}>✅</span>
          </div>
          <div style={{ fontFamily: sans, fontSize: 28, color: C.muted, marginTop: 16 }}>
            trình duyệt có sẵn · 0 dependency
          </div>
        </Panel>
      </Rise>
      <Rise from={38} style={{ marginTop: 30 }}>
        <Panel glow={C.red} style={{ padding: "40px 44px", opacity: 0.75 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontFamily: mono, fontSize: 34, fontWeight: 700, color: C.red, textDecoration: "line-through" }}>
              npm install date-picker-lib
            </span>
            <span style={{ fontSize: 52 }}>🚫</span>
          </div>
          <div style={{ fontFamily: sans, fontSize: 28, color: C.muted, marginTop: 16 }}>
            thêm 1 thư viện · nặng thêm · phải bảo trì
          </div>
        </Panel>
      </Rise>
    </Inner>
  </Shell>
);

// ------------------------------------------ 10 PONYTAIL PHILOSOPHY (thang)
const S10: React.FC = () => {
  const steps = [
    { t: "Code sẵn có?", c: C.cyan },
    { t: "Thư viện chuẩn?", c: C.green },
    { t: "Trình duyệt làm được?", c: C.amber },
    { t: "Mới viết thêm, TỐI THIỂU", c: C.purple },
  ];
  return (
    <Shell glow={C.purple}>
      <Inner top={345}>
        <Rise from={2}><Pill text="🐴 PONYTAIL · TRIẾT LÝ CÁI THANG" color={C.purple} /></Rise>
        <Rise from={10} style={{ marginTop: 40 }}>
          <Head>Hỏi từng nấc,
            <br />
            hết cách mới viết.</Head>
        </Rise>
        <div style={{ marginTop: 60 }}>
          {steps.map((s, i) => (
            <Rise key={s.t} from={26 + i * 12}>
              <div style={{ display: "flex", alignItems: "center", gap: 20, marginLeft: i * 70, marginTop: i === 0 ? 0 : 22 }}>
                <div
                  style={{
                    width: 56,
                    height: 56,
                    flexShrink: 0,
                    borderRadius: 14,
                    border: `1px solid ${s.c}77`,
                    background: `${s.c}12`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: mono,
                    fontSize: 26,
                    fontWeight: 700,
                    color: s.c,
                  }}
                >
                  {i + 1}
                </div>
                <span style={{ fontFamily: sans, fontSize: 38, fontWeight: 700, color: i === 3 ? s.c : C.fg }}>{s.t}</span>
              </div>
            </Rise>
          ))}
        </div>
      </Inner>
    </Shell>
  );
};

// ------------------------------------------ 11 PONYTAIL BENCHMARK (4 tiles)
const S11: React.FC = () => {
  const frame = useCurrentFrame();
  const tiles = [
    { v: -Math.round(countAt(frame, 54, 14, 36)), suffix: "% code", sub: "max -94%", c: C.green },
    { v: -Math.round(countAt(frame, 20, 26, 36)), suffix: "% chi phí", sub: "rẻ hơn", c: C.amber },
    { v: Math.round(countAt(frame, 27, 38, 36)), suffix: "% tốc độ", sub: "xong nhanh hơn", c: C.cyan, plus: true },
    { v: -Math.round(countAt(frame, 22, 50, 36)), suffix: "% token", sub: "nhẹ context", c: C.purple },
  ];
  return (
    <Shell glow={C.green}>
      <Inner top={345}>
        <Rise from={2}><Pill text="🐴 PONYTAIL · SỐ CỦA TÁC GIẢ" color={C.green} /></Rise>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginTop: 50 }}>
          {tiles.map((t, i) => (
            <Rise key={t.suffix} from={12 + i * 12}>
              <Panel glow={t.c} style={{ padding: "40px 30px" }}>
                <div style={{ fontFamily: sans, fontSize: 84, fontWeight: 800, lineHeight: 1, color: t.c }}>
                  {t.plus && t.v > 0 ? "+" : ""}
                  {t.v}
                  <span style={{ fontSize: 38 }}>{t.suffix}</span>
                </div>
                <div style={{ fontFamily: mono, fontSize: 24, color: C.muted, marginTop: 14 }}>{t.sub}</div>
              </Panel>
            </Rise>
          ))}
        </div>
        <Rise from={62} style={{ marginTop: 36, textAlign: "center" }}>
          <Chip text="12 task · agentic baseline" color={C.muted} />
        </Rise>
      </Inner>
    </Shell>
  );
};

// -------------------------------------------------- 12 COMBINE (2 lớp 1 khung)
const S12: React.FC = () => (
  <Shell glow={C.purple}>
    <Inner top={380}>
      <Rise from={2}><Pill text="🤝 KHÔNG GIÀNH VIỆC CỦA NHAU" color={C.purple} /></Rise>
      <div style={{ marginTop: 56 }}>
        <Rise from={14}>
          <Panel style={{ padding: "34px 40px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontFamily: sans, fontSize: 44, fontWeight: 800, color: C.cyan }}>🪨 Caveman</span>
            <Chip text="lo phần NÓI" />
          </Panel>
        </Rise>
        <Rise from={28} style={{ marginTop: 22 }}>
          <Panel glow={C.green} style={{ padding: "34px 40px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontFamily: sans, fontSize: 44, fontWeight: 800, color: C.green }}>🐴 Ponytail</span>
            <Chip text="lo phần CODE" color={C.green} />
          </Panel>
        </Rise>
        <Rise from={44} style={{ marginTop: 34, textAlign: "center" }}>
          <svg width="60" height="46">
            <path d="M30 2 L30 32 M16 22 L30 38 L44 22" fill="none" stroke={C.purple} strokeWidth="4" strokeLinecap="round" />
          </svg>
        </Rise>
        <Rise from={52}>
          <div
            style={{
              border: `2px dashed ${C.purple}88`,
              borderRadius: 24,
              padding: "34px 0",
              textAlign: "center",
              fontFamily: sans,
              fontSize: 52,
              fontWeight: 800,
              color: C.purple,
              boxShadow: `0 0 40px ${C.purple}22`,
            }}
          >
            1 WORKFLOW
          </div>
        </Rise>
      </div>
    </Inner>
  </Shell>
);

// --------------------------------------------------- 13 CAVEAT (3 alert bar)
const S13: React.FC = () => (
  <Shell glow={C.amber}>
    <Inner top={345}>
      <Rise from={2}><Pill text="⚠️ ĐỌC KỸ TRƯỚC KHI KỲ VỌNG" color={C.amber} /></Rise>
      <Rise from={10} style={{ marginTop: 40 }}>
        <Head>Cài vào
          <br />
          chưa chắc hay ngay.</Head>
      </Rise>
      <div style={{ display: "flex", flexDirection: "column", gap: 24, marginTop: 54 }}>
        {[
          "benchmark đo trên bài của chính tác giả",
          "review kiến trúc, bảo mật: vẫn cần nói kỹ",
          "ít code hơn ≠ code tốt hơn",
        ].map((t, i) => (
          <Rise key={t} from={26 + i * 12}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 26,
                background: C.cardBg,
                borderLeft: `6px solid ${C.amber}`,
                borderRadius: "8px 20px 20px 8px",
                padding: "26px 30px",
              }}
            >
              <span style={{ fontSize: 36 }}>⚠️</span>
              <span style={{ fontFamily: sans, fontSize: 35, fontWeight: 600, lineHeight: 1.3, color: C.fg }}>{t}</span>
            </div>
          </Rise>
        ))}
      </div>
    </Inner>
  </Shell>
);

// ------------------------------------------------------------- 14 CTA
const S14: React.FC = () => {
  const frame = useCurrentFrame();
  const bounce = 6 * Math.sin(frame / 6);
  return (
    <Shell>
      <Inner top={380}>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {[
            { name: "juliusbrussee/caveman", ic: "🪨", c: C.cyan },
            { name: "DietrichGebert/ponytail", ic: "🐴", c: C.green },
          ].map((r, i) => (
            <Rise key={r.name} from={6 + i * 12}>
              <Panel glow={r.c} style={{ padding: "32px 40px", display: "flex", alignItems: "center", gap: 26 }}>
                <span style={{ fontSize: 52 }}>{r.ic}</span>
                <span style={{ fontFamily: mono, fontSize: 34, fontWeight: 700, color: r.c }}>{r.name}</span>
              </Panel>
            </Rise>
          ))}
        </div>
        <Rise from={32} style={{ marginTop: 50, textAlign: "center", translate: `0px ${bounce}px` }}>
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
            LINK DƯỚI COMMENT ↓
          </span>
        </Rise>
        <Rise from={50} style={{ marginTop: 36, textAlign: "center" }}>
          <Chip text="👍 like để mình tổng hợp tiếp" color={C.amber} />
        </Rise>
      </Inner>
    </Shell>
  );
};

// ------------------------------------------------------------- 15 PROMO
const S15: React.FC = () => (
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
          <div style={{ width: 260, height: 3, background: C.cyan, margin: "26px auto 0", boxShadow: `0 0 24px ${C.cyan}` }} />
        </Rise>
        <Rise from={34} style={{ marginTop: 40 }}>
          <div style={{ fontFamily: mono, fontSize: 26, color: C.muted }}>
            video tổng hợp này do AI dựng
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
  "11": <S11 />, "12": <S12 />, "13": <S13 />, "14": <S14 />, "15": <S15 />,
};

export const CavemanPonytail: React.FC = () => {
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
