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
import { loadFont as loadSG } from "@remotion/google-fonts/SpaceGrotesk";
import { SCENES_V6 } from "./flow-movie-pipeline-pop-data";
import { KaraokeSticker } from "../lib/karaoke";

// SKIN: POP (màu sắc). Nền kem, viền mực dày, shadow lệch cứng, sticker nhiều màu.
// Kịch bản + voice theo chuẩn any2video Phase 2 (arc PA1, phonetic, rate +15%).

const { fontFamily: sans } = loadBVP("normal", {
  weights: ["500", "700", "800"],
  subsets: ["latin", "vietnamese"],
});
const { fontFamily: num } = loadSG("normal", {
  weights: ["500", "700"],
  subsets: ["latin"],
});

const P = {
  bg: "#FFF3E2",
  ink: "#1D1814",
  white: "#FFFFFF",
  coral: "#E5484D",
  blue: "#2667FF",
  teal: "#06A77D",
  gold: "#F7B801",
  orange: "#FF6B35",
};

const pop = (frame: number, from: number, dur = 14) => ({
  opacity: interpolate(frame, [from, from + dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  }),
  scale: String(
    interpolate(frame, [from, from + dur], [0.7, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.back(1.8)),
    }),
  ),
});

const Pop: React.FC<{
  from: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ from, children, style }) => {
  const frame = useCurrentFrame();
  return <div style={{ ...pop(frame, from), ...style }}>{children}</div>;
};

// Thẻ pop: viền mực + shadow lệch cứng
const Card: React.FC<{
  children: React.ReactNode;
  bg?: string;
  pad?: string;
  rotate?: number;
  style?: React.CSSProperties;
}> = ({ children, bg = P.white, pad = "30px 34px", rotate = 0, style }) => (
  <div
    style={{
      background: bg,
      border: `3px solid ${P.ink}`,
      borderRadius: 20,
      boxShadow: `9px 9px 0 ${P.ink}`,
      padding: pad,
      rotate: `${rotate}deg`,
      ...style,
    }}
  >
    {children}
  </div>
);

// Sticker chữ (tô màu, xoay nhẹ) dùng trong headline
const Sticker: React.FC<{ children: string; bg: string; deg?: number; color?: string }> = ({
  children,
  bg,
  deg = -2,
  color,
}) => (
  <span
    style={{
      display: "inline-block",
      background: bg,
      color: color ?? P.ink,
      border: `3px solid ${P.ink}`,
      borderRadius: 14,
      boxShadow: `5px 5px 0 ${P.ink}`,
      padding: "2px 20px 6px",
      rotate: `${deg}deg`,
      whiteSpace: "nowrap",
    }}
  >
    {children}
  </span>
);

const RepoChip: React.FC = () => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 12,
      background: P.white,
      border: `3px solid ${P.ink}`,
      borderRadius: 999,
      boxShadow: `5px 5px 0 ${P.ink}`,
      padding: "10px 24px",
      fontFamily: num,
      fontSize: 24,
      fontWeight: 700,
    }}
  >
    <span
      style={{
        width: 16,
        height: 16,
        borderRadius: "50%",
        background: P.teal,
        border: `2px solid ${P.ink}`,
      }}
    />
    chanktb/flow-movie-pipeline
  </div>
);

// Vỏ scene: kem + confetti nhẹ + fade
const Shell: React.FC<{ children: React.ReactNode; confetti?: boolean }> = ({
  children,
  confetti,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const opacity = interpolate(
    frame,
    [0, 9, durationInFrames - 8, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const bits = confetti
    ? Array.from({ length: 14 }, (_, i) => ({
        x: random(`cx${i}`) * 1080,
        y: 240 + random(`cy${i}`) * 1400,
        r: random(`cr${i}`) * 360,
        c: [P.coral, P.blue, P.teal, P.gold, P.orange][i % 5],
        s: 14 + random(`cs${i}`) * 16,
      }))
    : [];
  return (
    <AbsoluteFill style={{ background: P.bg, color: P.ink, fontFamily: sans, opacity }}>
      {bits.map((b, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: b.x,
            top: b.y + Math.sin(frame / 30 + i) * 8,
            width: b.s,
            height: b.s,
            background: b.c,
            border: `2px solid ${P.ink}`,
            rotate: `${b.r + frame * 0.3}deg`,
            opacity: 0.5,
          }}
        />
      ))}
      {children}
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------- PAIN skeleton
// Beat lặp có chủ đích (theo arc any2video): số to, câu lớn + sticker, glyph màu

const PainPop: React.FC<{
  no: string;
  accent: string;
  line1: React.ReactNode;
  line2?: React.ReactNode;
  glyph: React.ReactNode;
}> = ({ no, accent, line1, line2, glyph }) => {
  return (
    <Shell>
      <div style={{ position: "absolute", left: 90, right: 90, top: 220 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Pop from={2}>
            <div
              style={{
                fontFamily: num,
                fontSize: 130,
                fontWeight: 700,
                color: P.bg,
                WebkitTextStroke: `4px ${P.ink}`,
                lineHeight: 1,
              }}
            >
              {no}
            </div>
          </Pop>
          <Pop from={4}>
            <RepoChip />
          </Pop>
        </div>
        <Pop from={10} style={{ marginTop: 60 }}>
          <div style={{ fontSize: 84, fontWeight: 800, lineHeight: 1.32 }}>
            {line1}
            {line2 ? (
              <>
                <br />
                {line2}
              </>
            ) : null}
          </div>
        </Pop>
        <Pop from={26} style={{ marginTop: 80, display: "flex", justifyContent: "center" }}>
          <Card bg={accent} pad="44px 54px" rotate={-2}>
            {glyph}
          </Card>
        </Pop>
      </div>
    </Shell>
  );
};

// glyph SVG trắng nét mực
const G: React.FC<{ d: string[]; w?: number }> = ({ d, w = 170 }) => (
  <svg width={w} height={w * 0.72} viewBox="0 0 100 72">
    {d.map((path, i) => (
      <path
        key={i}
        d={path}
        fill="none"
        stroke={P.ink}
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ))}
  </svg>
);

// -------------------------------------------------------------------- scenes

const Pain1: React.FC = () => (
  <PainPop
    no="01"
    accent={P.coral}
    line1={
      <>
        Ngồi <Sticker bg={P.coral} color={P.white}>canh máy</Sticker>
      </>
    }
    line2="từng cảnh một."
    glyph={
      // đồng hồ + con mắt mệt mỏi
      <G
        d={[
          "M50 8 A28 28 0 1 1 49.9 8",
          "M50 18 L50 36 L64 44",
          "M14 62 Q30 52 46 62",
          "M54 62 Q70 52 86 62",
        ]}
      />
    }
  />
);

const Pain2: React.FC = () => (
  <PainPop
    no="02"
    accent={P.blue}
    line1={
      <>
        Dán, gửi, chờ, tải...
      </>
    }
    line2={
      <>
        rồi <Sticker bg={P.blue} color={P.white} deg={2}>lặp lại</Sticker> y chang.
      </>
    }
    glyph={
      // vòng lặp mũi tên
      <G
        d={[
          "M30 36 A20 20 0 1 1 36 50",
          "M28 46 L36 50 L32 58",
          "M62 20 L84 20 M62 32 L84 32 M62 44 L78 44",
        ]}
      />
    }
  />
);

const Pain3: React.FC = () => (
  <PainPop
    no="03"
    accent={P.gold}
    line1={
      <>
        Gửi dồn dập là bị
      </>
    }
    line2={
      <>
        <Sticker bg={P.coral} color={P.white} deg={-3}>nghi bot</Sticker>, treo cả buổi.
      </>
    }
    glyph={
      // tam giác cảnh báo + lá cờ
      <G
        d={[
          "M50 10 L88 66 L12 66 Z",
          "M50 30 L50 48",
          "M50 56 L50 58",
        ]}
      />
    }
  />
);

const Pain4: React.FC = () => (
  <PainPop
    no="04"
    accent={P.teal}
    line1={
      <>
        Ảnh dính <Sticker bg={P.teal} color={P.white} deg={2}>ghép lưới</Sticker>,
      </>
    }
    line2="soi mắt từng tấm."
    glyph={
      // khung 2x2 + gạch chéo
      <G
        d={[
          "M20 10 L80 10 L80 62 L20 62 Z",
          "M50 10 L50 62 M20 36 L80 36",
          "M16 6 L84 66",
        ]}
      />
    }
  />
);

const Reveal: React.FC = () => {
  return (
    <Shell confetti>
      <div style={{ position: "absolute", left: 90, right: 90, top: 330 }}>
        <Pop from={4} style={{ textAlign: "center" }}>
          <div style={{ fontSize: 56, fontWeight: 800, lineHeight: 1.3 }}>
            Thì gói hết vào đây.
          </div>
        </Pop>
        <Pop from={14} style={{ marginTop: 56 }}>
          <div style={{ position: "relative" }}>
            <Card pad="60px 44px" style={{ textAlign: "center" }}>
              {/* icon clapper */}
              <svg width="130" height="100" viewBox="0 0 100 76" style={{ margin: "0 auto" }}>
                <rect x="8" y="26" width="84" height="42" rx="6" fill={P.orange} stroke={P.ink} strokeWidth="4" />
                <path d="M8 26 L14 8 L92 16 L88 30 Z" fill={P.gold} stroke={P.ink} strokeWidth="4" />
                <path d="M26 10 L34 24 M46 12 L54 26 M66 14 L74 27" stroke={P.ink} strokeWidth="4" />
              </svg>
              <div
                style={{
                  fontFamily: num,
                  fontSize: 47,
                  fontWeight: 700,
                  marginTop: 24,
                }}
              >
                flow-movie-pipeline
              </div>
              <div style={{ fontSize: 30, fontWeight: 500, marginTop: 14, color: "#6d6459" }}>
                dán kịch bản · bấm 1 lần · nhận phim
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: 18,
                  marginTop: 30,
                }}
              >
                {["ảnh", "video", "1080p", "ghép"].map((t, i) => (
                  <Pop key={t} from={30 + i * 5}>
                    <span
                      style={{
                        fontFamily: num,
                        fontSize: 25,
                        fontWeight: 700,
                        border: `3px solid ${P.ink}`,
                        borderRadius: 999,
                        padding: "6px 20px",
                        background: [P.coral, P.blue, P.teal, P.gold][i],
                        color: i === 3 ? P.ink : P.white,
                      }}
                    >
                      {t}
                    </span>
                  </Pop>
                ))}
              </div>
            </Card>
            <div style={{ position: "absolute", right: -16, top: -34, rotate: "7deg" }}>
              <Pop from={40}>
                <Sticker bg={P.gold} deg={0}>MỚI RA MẮT</Sticker>
              </Pop>
            </div>
          </div>
        </Pop>
        <Pop from={50} style={{ marginTop: 44, textAlign: "center" }}>
          <div style={{ fontFamily: num, fontSize: 26, color: "#6d6459" }}>
            tác giả · chanktb
          </div>
        </Pop>
      </div>
    </Shell>
  );
};

// Nhịp gửi request: vòng tròn nhịp, chấm không đều, 1 chấm cờ đỏ
const Weapon1: React.FC = () => {
  const frame = useCurrentFrame();
  const CX = 450;
  const CY = 330;
  const R = 250;
  const dots = [
    { a: -90, flag: false },
    { a: -38, flag: false },
    { a: 4, flag: false },
    { a: 62, flag: false },
    { a: 118, flag: true },
    { a: 224, flag: false },
  ];
  return (
    <Shell>
      <div style={{ position: "absolute", left: 90, right: 90, top: 250 }}>
        <Pop from={4}>
          <div style={{ fontSize: 72, fontWeight: 800, lineHeight: 1.3 }}>
            Gửi đúng <Sticker bg={P.blue} color={P.white}>nhịp người</Sticker>
          </div>
        </Pop>
        <div style={{ position: "relative", height: 660, marginTop: 40 }}>
          <svg width="900" height="660">
            <circle
              cx={CX}
              cy={CY}
              r={R}
              fill="none"
              stroke={P.ink}
              strokeWidth="4"
              strokeDasharray="2 14"
              strokeLinecap="round"
            />
            {dots.map((d, i) => {
              const show = interpolate(frame, [18 + i * 8, 26 + i * 8], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.out(Easing.back(2)),
              });
              const x = CX + R * Math.cos((d.a * Math.PI) / 180);
              const y = CY + R * Math.sin((d.a * Math.PI) / 180);
              return (
                <g key={i} style={{ transformOrigin: `${x}px ${y}px`, scale: String(show) }}>
                  <circle
                    cx={x}
                    cy={y}
                    r={d.flag ? 30 : 22}
                    fill={d.flag ? P.coral : P.teal}
                    stroke={P.ink}
                    strokeWidth="4"
                  />
                  {d.flag ? (
                    <path
                      d={`M ${x - 6} ${y - 12} L ${x - 6} ${y + 12} M ${x - 6} ${y - 12} L ${x + 12} ${y - 6} L ${x - 6} ${y}`}
                      stroke={P.white}
                      strokeWidth="4"
                      fill="none"
                      strokeLinejoin="round"
                    />
                  ) : null}
                </g>
              );
            })}
          </svg>
          <Pop
            from={30}
            style={{
              position: "absolute",
              left: CX - 160,
              top: CY - 80,
              width: 320,
              textAlign: "center",
            }}
          >
            <Card pad="26px 20px">
              <div style={{ fontFamily: num, fontSize: 54, fontWeight: 700 }}>1</div>
              <div style={{ fontSize: 28, fontWeight: 700 }}>cảnh mỗi lần</div>
            </Card>
          </Pop>
          <Pop from={56} style={{ position: "absolute", left: 0, top: 615 }}>
            <div style={{ display: "flex", gap: 26, fontSize: 31, fontWeight: 700 }}>
              <Sticker bg={P.teal} color={P.white} deg={-2}>nghỉ 3-8s ngẫu nhiên</Sticker>
              <Sticker bg={P.coral} color={P.white} deg={2}>dính cờ: lùi 20-40s</Sticker>
            </div>
          </Pop>
        </div>
      </div>
    </Shell>
  );
};

// QC 2 cổng: polaroid chạy qua GATE 1 / GATE 2, 1 tấm rớt
const Weapon2: React.FC = () => {
  const frame = useCurrentFrame();
  const shots = [
    { x: 0, ok: true },
    { x: 205, ok: false },
    { x: 410, ok: true },
    { x: 615, ok: true },
  ];
  return (
    <Shell>
      <div style={{ position: "absolute", left: 90, right: 90, top: 250 }}>
        <Pop from={4}>
          <div style={{ fontSize: 72, fontWeight: 800, lineHeight: 1.3 }}>
            Ảnh hỏng bị chặn ở <Sticker bg={P.coral} color={P.white}>2 cổng</Sticker>
          </div>
        </Pop>
        <div style={{ position: "relative", height: 620, marginTop: 70 }}>
          {/* 2 cổng gác */}
          {[
            { x: 250, label: "GATE 1", sub: "grid detector", c: P.gold },
            { x: 620, label: "GATE 2", sub: "vision judge", c: P.blue },
          ].map((g, i) => (
            <Pop key={g.label} from={14 + i * 8} style={{ position: "absolute", left: g.x, top: 0 }}>
              <div
                style={{
                  fontFamily: num,
                  fontSize: 26,
                  fontWeight: 700,
                  marginBottom: 14,
                  marginLeft: -45,
                  width: 120,
                  textAlign: "center",
                }}
              >
                {g.label}
                <div style={{ fontSize: 21, fontWeight: 500, color: "#6d6459" }}>{g.sub}</div>
              </div>
              <div
                style={{
                  width: 30,
                  height: 400,
                  background: g.c,
                  border: `3px solid ${P.ink}`,
                  borderRadius: 10,
                  boxShadow: `7px 7px 0 ${P.ink}`,
                }}
              />
            </Pop>
          ))}
          {/* polaroid */}
          {shots.map((s, i) => {
            const from = 26 + i * 9;
            const fall = s.ok
              ? 0
              : interpolate(frame, [58, 84], [0, 300], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                  easing: Easing.in(Easing.cubic),
                });
            const tilt = s.ok ? (i % 2 === 0 ? -2 : 2) : interpolate(frame, [58, 84], [2, 24], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            return (
              <Pop key={i} from={from} style={{ position: "absolute", left: s.x - (s.ok ? 0 : 90) * (fall / 300), top: 140 + fall }}>
                <div
                  style={{
                    width: 170,
                    background: P.white,
                    border: `3px solid ${P.ink}`,
                    boxShadow: `7px 7px 0 ${P.ink}`,
                    padding: 10,
                    rotate: `${tilt}deg`,
                  }}
                >
                  <div
                    style={{
                      height: 130,
                      background: s.ok ? "#EFE6D8" : "#F3D8D6",
                      border: `2px solid ${P.ink}`,
                      position: "relative",
                    }}
                  >
                    {!s.ok ? (
                      <svg width="100%" height="100%" viewBox="0 0 100 80" preserveAspectRatio="none">
                        <path d="M50 0 V80 M0 40 H100" stroke={P.ink} strokeWidth="3" opacity="0.5" />
                        <path d="M10 8 L90 72 M90 8 L10 72" stroke={P.coral} strokeWidth="7" strokeLinecap="round" />
                      </svg>
                    ) : null}
                  </div>
                  <div
                    style={{
                      fontFamily: num,
                      fontSize: 21,
                      fontWeight: 700,
                      marginTop: 8,
                      textAlign: "center",
                      color: s.ok ? P.teal : P.coral,
                    }}
                  >
                    {s.ok ? "PASS" : "LÀM LẠI"}
                  </div>
                </div>
              </Pop>
            );
          })}
          <Pop from={70} style={{ position: "absolute", left: 420, top: 545 }}>
            <div style={{ fontSize: 31, fontWeight: 700 }}>
              <Sticker bg={P.gold} deg={-2}>tự làm lại tối đa 2 vòng</Sticker>
            </div>
          </Pop>
        </div>
      </div>
    </Shell>
  );
};

// Caveat: nhãn cảnh báo kẻ sọc vàng đen, caveat-as-feature
const Caveat: React.FC = () => {
  return (
    <Shell>
      <div style={{ position: "absolute", left: 90, right: 90, top: 300 }}>
        <Pop from={4}>
          <Card pad="0" style={{ overflow: "hidden" }}>
            <div
              style={{
                height: 34,
                background: `repeating-linear-gradient(-45deg, ${P.gold} 0 26px, ${P.ink} 26px 52px)`,
                borderBottom: `3px solid ${P.ink}`,
              }}
            />
            <div style={{ padding: "40px 44px" }}>
              <div style={{ fontSize: 58, fontWeight: 800 }}>Đọc trước khi dùng</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 34, marginTop: 44 }}>
                {[
                  { c: P.coral, t: "Bám nền web Flow, không có API chính thức" },
                  { c: P.blue, t: "Cần tài khoản Google AI Ultra" },
                  { c: P.gold, t: "Google đổi giao diện là phải vá lại" },
                ].map((r, i) => (
                  <Pop key={r.t} from={18 + i * 10}>
                    <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
                      <span
                        style={{
                          width: 34,
                          height: 34,
                          background: r.c,
                          border: `3px solid ${P.ink}`,
                          borderRadius: 8,
                          flexShrink: 0,
                          rotate: "45deg" as const,
                        }}
                      />
                      <span style={{ fontSize: 37, fontWeight: 700, lineHeight: 1.3 }}>{r.t}</span>
                    </div>
                  </Pop>
                ))}
              </div>
            </div>
          </Card>
        </Pop>
        <Pop from={52} style={{ marginTop: 48, textAlign: "center" }}>
          <div style={{ fontSize: 30, fontWeight: 500, color: "#6d6459" }}>
            biết trước rồi thì xài rất sướng
          </div>
        </Pop>
      </div>
    </Shell>
  );
};

// Outro: pain-CTA, KHÔNG đọc URL (theo luật outro any2video)
const Outro: React.FC = () => {
  return (
    <Shell confetti>
      <div style={{ position: "absolute", left: 90, right: 90, top: 380, textAlign: "center" }}>
        <Pop from={6}>
          <div style={{ fontSize: 84, fontWeight: 800, lineHeight: 1.32 }}>
            Tối nào cũng
            <br />
            ngồi <Sticker bg={P.coral} color={P.white}>canh máy</Sticker>?
          </div>
        </Pop>
        <Pop from={28} style={{ marginTop: 80, display: "flex", justifyContent: "center" }}>
          <Card bg={P.gold} pad="30px 54px" rotate={-3}>
            <div style={{ fontSize: 52, fontWeight: 800 }}>THỬ CÁI NÀY</div>
          </Card>
        </Pop>
        <Pop from={40} style={{ marginTop: 56 }}>
          <div style={{ fontSize: 40, fontWeight: 700 }}>link ở dưới ↓</div>
        </Pop>
        <Pop from={52} style={{ marginTop: 44, display: "flex", justifyContent: "center" }}>
          <div style={{ fontSize: 33, fontWeight: 700 }}>
            <Sticker bg={P.teal} color={P.white} deg={2}>thấy hay thì tặng tác giả 1 ★</Sticker>
          </div>
        </Pop>
      </div>
    </Shell>
  );
};

// ---------------------------------------------------------------------- main

const BODIES: Record<string, React.ReactNode> = {
  pain1: <Pain1 />,
  pain2: <Pain2 />,
  pain3: <Pain3 />,
  pain4: <Pain4 />,
  reveal: <Reveal />,
  weapon1: <Weapon1 />,
  weapon2: <Weapon2 />,
  caveat: <Caveat />,
  outro: <Outro />,
};

export const FlowMoviePipelinePop: React.FC = () => {
  let cursor = 0;
  return (
    <AbsoluteFill style={{ backgroundColor: P.bg }}>
      {SCENES_V6.map((scene) => {
        const from = cursor;
        cursor += scene.durationInFrames;
        return (
          <Sequence
            key={scene.id}
            from={from}
            durationInFrames={scene.durationInFrames}
            premountFor={45}
          >
            {BODIES[scene.id]}
            <KaraokeSticker words={scene.words} fontFamily={sans} sticker={P.gold} ink={P.ink} />
            <Audio src={staticFile(scene.audio)} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
