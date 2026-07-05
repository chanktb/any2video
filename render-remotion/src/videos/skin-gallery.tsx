import React from "react";
import { AbsoluteFill, random, useCurrentFrame } from "remotion";
import { loadFont as loadBVP } from "@remotion/google-fonts/BeVietnamPro";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadJBM } from "@remotion/google-fonts/JetBrainsMono";
import { loadFont as loadSG } from "@remotion/google-fonts/SpaceGrotesk";
import { loadFont as loadPaytone } from "@remotion/google-fonts/PaytoneOne";
import { loadFont as loadFraunces } from "@remotion/google-fonts/Fraunces";
import { loadFont as loadBaloo } from "@remotion/google-fonts/Baloo2";
import { loadFont as loadPatrick } from "@remotion/google-fonts/PatrickHand";
import { loadFont as loadLora } from "@remotion/google-fonts/Lora";

// SKIN GALLERY: the same demo content restyled once per skin. STATIC stills for
// picking a skin. One frame = one skin: npx remotion still skin-gallery --frame=<N>
// Frames 0-8 = the 9 stills-only skins; frame 9 = repo-dark (the DEFAULT skin for
// GitHub repo tours: tech-dark-neon blended with escbase-starfield). The other
// skins' previews in docs/skins/ come from real production videos.

const { fontFamily: bvp } = loadBVP("normal", { weights: ["500", "700", "800"], subsets: ["latin", "vietnamese"] });
const { fontFamily: inter } = loadInter("normal", { weights: ["400", "700", "900"], subsets: ["latin", "vietnamese"] });
const { fontFamily: jbm } = loadJBM("normal", { weights: ["400", "700"], subsets: ["latin", "vietnamese"] });
const { fontFamily: grotesk } = loadSG("normal", { weights: ["500", "700"], subsets: ["latin"] });
const { fontFamily: paytone } = loadPaytone("normal", { weights: ["400"], subsets: ["latin", "vietnamese"] });
const { fontFamily: fraunces } = loadFraunces("normal", { weights: ["600", "700"], subsets: ["latin", "vietnamese"] });
const { fontFamily: baloo } = loadBaloo("normal", { weights: ["700", "800"], subsets: ["latin", "vietnamese"] });
const { fontFamily: patrick } = loadPatrick("normal", { weights: ["400"], subsets: ["latin", "vietnamese"] });
const { fontFamily: lora } = loadLora("normal", { weights: ["500", "600"], subsets: ["latin", "vietnamese"] });

const Label: React.FC<{ text: string; color: string; bg?: string }> = ({ text, color, bg }) => (
  <div
    style={{
      position: "absolute",
      left: 60,
      top: 60,
      fontFamily: jbm,
      fontSize: 30,
      fontWeight: 700,
      letterSpacing: 4,
      color,
      background: bg,
      padding: bg ? "8px 20px" : 0,
      zIndex: 50,
    }}
  >
    {text}
  </div>
);

// ------------------------------------------------------------ 0 TERMINAL CRT
const Terminal: React.FC = () => (
  <AbsoluteFill style={{ background: "#040804", fontFamily: jbm, color: "#33FF66" }}>
    <Label text="SKIN 01 · TERMINAL CRT" color="#33FF66" />
    <div style={{ position: "absolute", left: 80, right: 80, top: 300, fontSize: 34, lineHeight: 1.9, textShadow: "0 0 14px rgba(51,255,102,0.55)" }}>
      <div style={{ color: "#1E9944" }}>$ run_film --script film.md</div>
      <div style={{ marginTop: 30 }}>FLOW MOVIE PIPELINE v2.0</div>
      <div style={{ color: "#1E9944" }}>────────────────────────────</div>
      <div style={{ marginTop: 20 }}>&gt; dán kịch bản, nhận phim.</div>
      <div style={{ marginTop: 50 }}>[1/5] sinh ảnh........ OK</div>
      <div>[2/5] QC 2 vòng....... OK</div>
      <div>[3/5] sinh video...... OK</div>
      <div>[4/5] upscale 1080p... OK</div>
      <div>[5/5] ghép phim....... ██████████░░ 82%</div>
      <div style={{ marginTop: 50 }}>throttle: 3-8s · cờ bot: lùi 20-40s</div>
      <div style={{ marginTop: 60, fontSize: 60, fontWeight: 700, textShadow: "0 0 26px rgba(51,255,102,0.8)" }}>
        1,275 dòng điều phối<span style={{ background: "#33FF66", color: "#040804" }}>▌</span>
      </div>
    </div>
    {/* scanlines + vignette */}
    <AbsoluteFill style={{ background: "repeating-linear-gradient(180deg, rgba(0,0,0,0) 0 3px, rgba(0,0,0,0.28) 3px 6px)" }} />
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(0,20,0,0.55) 100%)" }} />
  </AbsoluteFill>
);

// -------------------------------------------------------------- 1 BLUEPRINT
const Blueprint: React.FC = () => (
  <AbsoluteFill style={{ background: "#0E2A47", color: "#EAF2FB", fontFamily: grotesk }}>
    <AbsoluteFill
      style={{
        backgroundImage:
          "linear-gradient(rgba(255,255,255,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.07) 1px, transparent 1px)",
        backgroundSize: "44px 44px",
      }}
    />
    <Label text="SKIN 02 · BLUEPRINT" color="#8FC1EE" />
    <div style={{ position: "absolute", left: 80, right: 80, top: 290 }}>
      <div style={{ fontFamily: bvp, fontSize: 72, fontWeight: 800, lineHeight: 1.25 }}>
        Dán kịch bản,
        <br />
        nhận phim.
      </div>
      <svg width="920" height="760" style={{ marginTop: 60 }}>
        {[
          { x: 30, y: 40, w: 240, label: "KỊCH BẢN" },
          { x: 340, y: 40, w: 240, label: "QC ×2" },
          { x: 650, y: 40, w: 240, label: "PHIM.mp4" },
        ].map((b, i) => (
          <g key={i}>
            <rect x={b.x} y={b.y} width={b.w} height={130} fill="none" stroke="#EAF2FB" strokeWidth="2.5" />
            <rect x={b.x + 8} y={b.y + 8} width={b.w} height={130} fill="none" stroke="rgba(234,242,251,0.3)" strokeWidth="1.5" />
            <text x={b.x + b.w / 2} y={b.y + 76} fill="#EAF2FB" fontSize="30" fontFamily={grotesk} textAnchor="middle">
              {b.label}
            </text>
          </g>
        ))}
        <line x1="270" y1="105" x2="340" y2="105" stroke="#EAF2FB" strokeWidth="2.5" markerEnd="url(#arr)" />
        <line x1="580" y1="105" x2="650" y2="105" stroke="#EAF2FB" strokeWidth="2.5" />
        <defs>
          <marker id="arr" markerWidth="10" markerHeight="10" refX="8" refY="4" orient="auto">
            <path d="M0 0 L8 4 L0 8" fill="none" stroke="#EAF2FB" strokeWidth="1.6" />
          </marker>
        </defs>
        {/* dimension line */}
        <line x1="30" y1="230" x2="890" y2="230" stroke="#8FC1EE" strokeWidth="1.5" strokeDasharray="8 6" />
        <line x1="30" y1="218" x2="30" y2="242" stroke="#8FC1EE" strokeWidth="1.5" />
        <line x1="890" y1="218" x2="890" y2="242" stroke="#8FC1EE" strokeWidth="1.5" />
        <text x="460" y="270" fill="#8FC1EE" fontSize="26" fontFamily={jbm} textAnchor="middle">
          throttle 3-8s · tự lùi 20-40s khi dính cờ
        </text>
        {/* corner spec frame */}
        <g transform="translate(30, 380)">
          <rect width="420" height="220" fill="none" stroke="#8FC1EE" strokeWidth="1.5" />
          <text x="20" y="45" fill="#8FC1EE" fontSize="24" fontFamily={jbm}>BẢN VẼ SỐ: FMP-02</text>
          <text x="20" y="90" fill="#EAF2FB" fontSize="24" fontFamily={jbm}>ĐIỀU PHỐI: 1,275 DÒNG</text>
          <text x="20" y="135" fill="#EAF2FB" fontSize="24" fontFamily={jbm}>FLOWKIT: 63 FILE PY</text>
          <text x="20" y="180" fill="#EAF2FB" fontSize="24" fontFamily={jbm}>KIỂM DUYỆT: chanktb</text>
        </g>
      </svg>
    </div>
  </AbsoluteFill>
);

// ------------------------------------------------------------------ 2 SWISS
const Swiss: React.FC = () => (
  <AbsoluteFill style={{ background: "#FFFFFF", color: "#111111", fontFamily: inter }}>
    <Label text="SKIN 03 · SWISS" color="#111111" />
    <div style={{ position: "absolute", left: 80, right: 80, top: 250 }}>
      <div style={{ width: 70, height: 70, background: "#E30613" }} />
      <div style={{ fontSize: 150, fontWeight: 900, lineHeight: 1.04, letterSpacing: -6, marginTop: 50 }}>
        Dán
        <br />
        kịch bản,
        <br />
        nhận <span style={{ color: "#E30613" }}>phim.</span>
      </div>
      <div style={{ borderTop: "3px solid #111", marginTop: 70, paddingTop: 26, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24 }}>
        {[
          ["01", "1,275 dòng điều phối"],
          ["02", "QC ảnh 2 vòng"],
          ["03", "throttle 3-8 giây"],
        ].map(([n, t]) => (
          <div key={n}>
            <div style={{ fontSize: 26, fontWeight: 900, color: "#E30613" }}>{n}</div>
            <div style={{ fontSize: 27, fontWeight: 400, lineHeight: 1.4, marginTop: 8 }}>{t}</div>
          </div>
        ))}
      </div>
      <div style={{ fontFamily: jbm, fontSize: 24, marginTop: 60, color: "#666" }}>
        flow-movie-pipeline · chanktb
      </div>
    </div>
  </AbsoluteFill>
);

// ---------------------------------------------------------------- 3 KEYNOTE
const Keynote: React.FC = () => (
  <AbsoluteFill
    style={{
      background: "linear-gradient(180deg, #F7F9FC 0%, #EDF1F7 100%)",
      color: "#1D1D1F",
      fontFamily: inter,
    }}
  >
    <Label text="SKIN 04 · KEYNOTE CLEAN" color="#86868B" />
    <div style={{ position: "absolute", left: 80, right: 80, top: 330, textAlign: "center" }}>
      <div style={{ fontSize: 30, fontWeight: 700, color: "#0A84FF", letterSpacing: 2 }}>
        FLOW MOVIE PIPELINE
      </div>
      <div style={{ fontSize: 88, fontWeight: 700, lineHeight: 1.22, letterSpacing: -2, marginTop: 24 }}>
        Dán kịch bản.
        <br />
        Nhận phim.
      </div>
      <div
        style={{
          margin: "70px auto 0",
          width: 780,
          background: "#FFFFFF",
          borderRadius: 32,
          boxShadow: "0 24px 70px rgba(0,0,0,0.10)",
          padding: "54px 50px",
        }}
      >
        <div style={{ fontSize: 120, fontWeight: 700, letterSpacing: -3, color: "#0A84FF" }}>1,275</div>
        <div style={{ fontSize: 30, color: "#86868B", marginTop: 8 }}>dòng code lo hết mọi bước</div>
        <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 44 }}>
          {["Sinh ảnh", "QC 2 vòng", "Video 1080p", "Ghép phim"].map((t) => (
            <div
              key={t}
              style={{
                fontSize: 24,
                fontWeight: 600,
                padding: "12px 24px",
                borderRadius: 999,
                background: "#F0F5FF",
                color: "#0A84FF",
              }}
            >
              {t}
            </div>
          ))}
        </div>
      </div>
    </div>
  </AbsoluteFill>
);

// -------------------------------------------------------------- 4 POSTER 70s
const Poster70: React.FC = () => {
  const rays = Array.from({ length: 18 }, (_, i) => i * 20);
  return (
    <AbsoluteFill style={{ background: "#F1E3C8", color: "#4A2C1A", fontFamily: lora, overflow: "hidden" }}>
      <svg width="1080" height="1920" style={{ position: "absolute" }}>
        <g transform="translate(540, 760)">
          {rays.map((a) => (
            <path
              key={a}
              d={`M0 0 L${1400 * Math.cos(((a - 5) * Math.PI) / 180)} ${1400 * Math.sin(((a - 5) * Math.PI) / 180)} L${1400 * Math.cos((a * Math.PI) / 180)} ${1400 * Math.sin((a * Math.PI) / 180)} Z`}
              fill={a % 40 === 0 ? "rgba(216,0,15,0.10)" : "rgba(74,44,26,0.06)"}
            />
          ))}
        </g>
      </svg>
      <Label text="SKIN 05 · POSTER 70s" color="#4A2C1A" />
      <div style={{ position: "absolute", left: 80, right: 80, top: 330, textAlign: "center" }}>
        <div style={{ fontSize: 30, letterSpacing: 8, fontWeight: 600 }}>CHANKTB TRÌNH CHIẾU</div>
        <div style={{ fontFamily: paytone, fontSize: 108, lineHeight: 1.22, color: "#D8000F", marginTop: 26, textShadow: "5px 5px 0 rgba(74,44,26,0.25)" }}>
          Dán kịch bản
          <br />
          nhận phim!
        </div>
        <div
          style={{
            margin: "60px auto 0",
            width: 620,
            border: "5px solid #4A2C1A",
            borderRadius: 200,
            padding: "38px 30px",
            background: "#F7EDD8",
          }}
        >
          <div style={{ fontFamily: paytone, fontSize: 64, color: "#4A2C1A" }}>1,275 dòng</div>
          <div style={{ fontSize: 30, marginTop: 10 }}>tự chạy từ đầu tới cuối</div>
        </div>
        <div style={{ fontSize: 28, marginTop: 56, letterSpacing: 4 }}>
          ẢNH ✶ QC HAI VÒNG ✶ 1080P ✶ GHÉP PHIM
        </div>
      </div>
    </AbsoluteFill>
  );
};

// --------------------------------------------------------- 5 CINEMATIC TEAL
// Full-bleed by doctrine: letterbox bars are wasted pixels on vertical video.
const Cinematic: React.FC = () => (
  <AbsoluteFill style={{ background: "linear-gradient(160deg, #0F2027 0%, #1A2942 100%)", color: "#E9F2F1", fontFamily: fraunces }}>
    <Label text="SKIN 06 · CINEMATIC TEAL" color="#4FD1C5" />
    <div style={{ position: "absolute", left: 90, right: 90, top: 430 }}>
      <div style={{ fontFamily: inter, fontSize: 26, letterSpacing: 10, color: "#4FD1C5", fontWeight: 700 }}>
        CHƯƠNG MỘT · CỖ MÁY LÀM PHIM
      </div>
      <div style={{ fontSize: 96, fontWeight: 700, lineHeight: 1.28, marginTop: 40 }}>
        Bạn viết kịch bản.
        <br />
        Phần còn lại,
        <br />
        <span style={{ color: "#4FD1C5" }}>để đêm lo.</span>
      </div>
      <div style={{ width: 210, height: 3, background: "#4FD1C5", marginTop: 56, boxShadow: "0 0 24px rgba(79,209,197,0.8)" }} />
      <div style={{ fontFamily: inter, fontSize: 30, lineHeight: 1.6, color: "#9FB3C8", marginTop: 44, maxWidth: 760 }}>
        1,275 dòng điều phối. Hai vòng kiểm ảnh. Một cú bấm.
      </div>
      <div style={{ fontFamily: jbm, fontSize: 24, color: "#4FD1C5", marginTop: 60 }}>
        flow-movie-pipeline © chanktb
      </div>
    </div>
  </AbsoluteFill>
);

// ------------------------------------------------------------------ 6 COMIC
const Comic: React.FC = () => (
  <AbsoluteFill style={{ background: "#FFFDF5", fontFamily: baloo, color: "#17120E", overflow: "hidden" }}>
    {/* halftone corner */}
    <AbsoluteFill
      style={{
        backgroundImage: "radial-gradient(circle, rgba(23,18,14,0.16) 2.6px, transparent 2.6px)",
        backgroundSize: "22px 22px",
        maskImage: "linear-gradient(135deg, #000 0%, transparent 42%)",
      }}
    />
    <Label text="SKIN 07 · COMIC" color="#17120E" />
    {/* action lines */}
    <svg width="1080" height="1920" style={{ position: "absolute" }}>
      {Array.from({ length: 16 }, (_, i) => {
        const a = (i * 22.5 * Math.PI) / 180;
        return (
          <line
            key={i}
            x1={540 + 330 * Math.cos(a)}
            y1={700 + 330 * Math.sin(a)}
            x2={540 + 560 * Math.cos(a)}
            y2={700 + 560 * Math.sin(a)}
            stroke="#17120E"
            strokeWidth={i % 2 === 0 ? 7 : 3}
            strokeLinecap="round"
            opacity="0.85"
          />
        );
      })}
    </svg>
    {/* burst */}
    <div style={{ position: "absolute", left: 190, top: 470 }}>
      <svg width="700" height="480" viewBox="0 0 700 480">
        <polygon
          points="350,10 400,120 520,60 480,170 630,170 520,240 640,320 490,300 500,430 390,340 330,470 300,340 160,420 220,290 60,300 190,220 70,120 220,150 200,30 300,120"
          fill="#FFD400"
          stroke="#17120E"
          strokeWidth="7"
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
        <div style={{ fontSize: 74, fontWeight: 800, lineHeight: 1.1, rotate: "-4deg" }}>
          DÁN KỊCH BẢN,
          <br />
          <span style={{ color: "#D8000F" }}>NHẬN PHIM!</span>
        </div>
      </div>
    </div>
    {/* speech bubble */}
    <div style={{ position: "absolute", left: 120, top: 1090, width: 840 }}>
      <div style={{ background: "#FFFFFF", border: "6px solid #17120E", borderRadius: 40, padding: "36px 44px", boxShadow: "10px 10px 0 rgba(23,18,14,0.85)" }}>
        <div style={{ fontSize: 42, fontWeight: 700, lineHeight: 1.3 }}>
          1,275 dòng code canh máy giùm bạn, kể cả lúc Google <span style={{ color: "#D8000F" }}>nghi bot!</span>
        </div>
      </div>
      <svg width="90" height="70" style={{ marginLeft: 120, marginTop: -6 }}>
        <polygon points="0,0 90,0 22,66" fill="#FFFFFF" stroke="#17120E" strokeWidth="6" />
      </svg>
    </div>
  </AbsoluteFill>
);

// --------------------------------------------------------------- 7 NOTEBOOK
const Notebook: React.FC = () => (
  <AbsoluteFill style={{ background: "#FDFBF3", fontFamily: patrick, color: "#1E2A5A" }}>
    {/* ruled lines + red margin */}
    <AbsoluteFill
      style={{
        backgroundImage: "linear-gradient(rgba(30,42,90,0.14) 1px, transparent 1px)",
        backgroundSize: "100% 58px",
        backgroundPosition: "0 24px",
      }}
    />
    <div style={{ position: "absolute", left: 130, top: 0, bottom: 0, width: 2, background: "rgba(216,0,15,0.4)" }} />
    <Label text="SKIN 08 · NOTEBOOK" color="#1E2A5A" />
    <div style={{ position: "absolute", left: 180, right: 90, top: 300 }}>
      <div style={{ fontSize: 76, lineHeight: 1.35 }}>
        Ghi chú: cách <span style={{ background: "rgba(255,212,0,0.65)", padding: "0 8px" }}>lười</span> làm phim AI
      </div>
      <div style={{ fontSize: 44, lineHeight: 1.7, marginTop: 50 }}>
        1. viết kịch bản (1 phút)
        <br />
        2. bấm nút rồi... đi ngủ 💤
        <br />
        3. sáng dậy có phim 1080p
      </div>
      <svg width="500" height="130" style={{ marginTop: 20 }}>
        <path d="M20 90 Q 200 20 430 62" fill="none" stroke="#D8000F" strokeWidth="4" strokeLinecap="round" />
        <path d="M410 46 L432 62 L404 74" fill="none" stroke="#D8000F" strokeWidth="4" strokeLinecap="round" />
        <text x="40" y="125" fontFamily={patrick} fontSize="34" fill="#D8000F">máy tự QC 2 vòng nè!!</text>
      </svg>
      <div
        style={{
          marginTop: 30,
          display: "inline-block",
          background: "#FFF",
          border: "2px solid rgba(30,42,90,0.35)",
          boxShadow: "4px 6px 14px rgba(30,42,90,0.15)",
          padding: "24px 30px",
          rotate: "-2deg",
          fontSize: 38,
        }}
      >
        1,275 dòng code = 1 thợ phụ miễn phí
      </div>
      {/* tape strip */}
      <div style={{ position: "absolute", right: 60, top: -26, width: 160, height: 46, background: "rgba(255,212,0,0.5)", rotate: "6deg" }} />
    </div>
  </AbsoluteFill>
);

// -------------------------------------------------------------- 8 CHALKBOARD
const Chalkboard: React.FC = () => {
  const dust = Array.from({ length: 90 }, (_, i) => ({
    x: random(`dx${i}`) * 1080,
    y: random(`dy${i}`) * 1920,
    r: 0.8 + random(`dr${i}`) * 1.6,
    o: 0.05 + random(`do${i}`) * 0.12,
  }));
  return (
    <AbsoluteFill style={{ background: "#24382E", fontFamily: patrick, color: "#F2EFE4", border: "26px solid #7A5230" }}>
      <svg width="1080" height="1920" style={{ position: "absolute" }}>
        {dust.map((d, i) => (
          <circle key={i} cx={d.x} cy={d.y} r={d.r} fill="#F2EFE4" opacity={d.o} />
        ))}
      </svg>
      <Label text="SKIN 09 · CHALKBOARD" color="#F2EFE4" />
      <div style={{ position: "absolute", left: 110, right: 110, top: 300, textAlign: "center" }}>
        <div style={{ fontSize: 84, lineHeight: 1.35, textShadow: "0 0 8px rgba(242,239,228,0.35)" }}>
          Bài hôm nay:
          <br />
          <span style={{ color: "#FFE08A" }}>máy làm phim thay mình</span>
        </div>
        <svg width="620" height="26" style={{ margin: "10px auto 0" }}>
          <path d="M10 14 Q 160 4 300 14 T 610 12" fill="none" stroke="#FFE08A" strokeWidth="5" strokeLinecap="round" opacity="0.9" />
        </svg>
        <div style={{ fontSize: 48, lineHeight: 1.8, marginTop: 60, textAlign: "left" }}>
          • dán kịch bản → bấm 1 lần
          <br />
          • ảnh xấu? <span style={{ color: "#F5B8C4" }}>chặn lại, làm lại (×2)</span>
          <br />
          • gửi từ tốn 3-8s → khỏi bị nghi bot
          <br />
          • sáng ra: phim 1080p ✓
        </div>
        <div
          style={{
            margin: "70px auto 0",
            display: "inline-block",
            border: "3px dashed rgba(242,239,228,0.7)",
            padding: "20px 40px",
            fontSize: 40,
          }}
        >
          bài tập về nhà: thử với 1 kịch bản của bạn
        </div>
      </div>
    </AbsoluteFill>
  );
};

// --------------------------------------------- 9 REPO DARK (DEFAULT repo tour)
// tech-dark-neon blended with escbase-starfield: neon cards + glow from tech-dark,
// starfield + badge pill + icon squares + token chips + stat rows + ring % from escbase.
const RepoDark: React.FC = () => {
  const stars = Array.from({ length: 110 }, (_, i) => ({
    x: random(`sx${i}`) * 1080,
    y: random(`sy${i}`) * 1920,
    r: 0.7 + random(`sr${i}`) * 1.5,
    o: 0.15 + random(`so${i}`) * 0.5,
  }));
  const stats: Array<[string, number, string]> = [
    ["điều phối", 1275, "#22d3ee"],
    ["flowkit .py", 63, "#fbbf24"],
    ["QC mỗi ảnh", 2, "#4ADE80"],
  ];
  return (
    <AbsoluteFill style={{ background: "#070f1d", color: "#F5F7FA", fontFamily: bvp }}>
      {/* starfield */}
      <svg width="1080" height="1920" style={{ position: "absolute" }}>
        {stars.map((s, i) => (
          <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#eaf2fb" opacity={s.o} />
        ))}
      </svg>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 26%, rgba(34,211,238,0.13), transparent 58%)" }} />
      <Label text="SKIN 14 · REPO DARK" color="#22d3ee" />
      <div style={{ position: "absolute", left: 80, right: 80, top: 290 }}>
        {/* badge pill */}
        <div
          style={{
            display: "inline-block",
            fontFamily: jbm,
            fontSize: 26,
            fontWeight: 700,
            letterSpacing: 3,
            color: "#22d3ee",
            border: "1.5px solid rgba(34,211,238,0.55)",
            borderRadius: 999,
            padding: "12px 28px",
            background: "rgba(34,211,238,0.08)",
          }}
        >
          ⚡ REPO TOUR · MẶC ĐỊNH
        </div>
        <div style={{ fontSize: 84, fontWeight: 800, lineHeight: 1.24, marginTop: 34 }}>
          Dán kịch bản,
          <br />
          nhận <span style={{ color: "#22d3ee", textShadow: "0 0 30px rgba(34,211,238,0.6)" }}>phim.</span>
        </div>
        {/* icon squares row */}
        <div style={{ display: "flex", gap: 20, marginTop: 50 }}>
          {[
            ["🎬", "SINH ẢNH", "#22d3ee"],
            ["🔍", "QC ×2", "#fbbf24"],
            ["🎞️", "GHÉP PHIM", "#4ADE80"],
          ].map(([ic, t, c]) => (
            <div
              key={t}
              style={{
                flex: 1,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 24,
                padding: "26px 0",
                textAlign: "center",
                boxShadow: `0 0 34px ${c}22`,
              }}
            >
              <div style={{ fontSize: 52 }}>{ic}</div>
              <div style={{ fontFamily: jbm, fontSize: 23, fontWeight: 700, color: c as string, marginTop: 12, letterSpacing: 2 }}>{t}</div>
            </div>
          ))}
        </div>
        {/* stat rows + ring, inside one glow card */}
        <div
          style={{
            marginTop: 44,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 24,
            padding: "40px 44px",
            display: "flex",
            gap: 40,
            alignItems: "center",
            boxShadow: "0 0 44px rgba(34,211,238,0.10)",
          }}
        >
          <div style={{ flex: 1 }}>
            {stats.map(([label, v, c]) => (
              <div key={label} style={{ marginTop: label === "điều phối" ? 0 : 26 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontFamily: jbm, fontSize: 25 }}>
                  <span style={{ color: "#9fb3c8" }}>{label}</span>
                  <span style={{ color: c, fontWeight: 700 }}>{v.toLocaleString("en-US")}</span>
                </div>
                <div style={{ height: 10, borderRadius: 6, background: "rgba(255,255,255,0.08)", marginTop: 10 }}>
                  <div style={{ height: 10, borderRadius: 6, width: `${28 + (v % 60)}%`, background: c, boxShadow: `0 0 16px ${c}` }} />
                </div>
              </div>
            ))}
          </div>
          {/* ring % */}
          <svg width="190" height="190" viewBox="0 0 190 190">
            <circle cx="95" cy="95" r="78" fill="none" stroke="rgba(255,255,255,0.09)" strokeWidth="14" />
            <circle
              cx="95"
              cy="95"
              r="78"
              fill="none"
              stroke="#c084fc"
              strokeWidth="14"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 78 * 0.82} ${2 * Math.PI * 78}`}
              transform="rotate(-90 95 95)"
            />
            <text x="95" y="90" fill="#F5F7FA" fontSize="44" fontWeight="800" fontFamily={bvp} textAnchor="middle">82%</text>
            <text x="95" y="126" fill="#9fb3c8" fontSize="21" fontFamily={jbm} textAnchor="middle">tự động</text>
          </svg>
        </div>
        {/* token chips */}
        <div style={{ display: "flex", gap: 14, marginTop: 40, flexWrap: "wrap" }}>
          {["throttle 3-8s", "cờ bot: tự lùi", "upscale 1080p", "phụ đề tự sinh"].map((t) => (
            <div
              key={t}
              style={{
                fontFamily: jbm,
                fontSize: 24,
                padding: "10px 22px",
                borderRadius: 12,
                border: "1px solid rgba(251,191,36,0.45)",
                color: "#fbbf24",
                background: "rgba(251,191,36,0.07)",
              }}
            >
              {t}
            </div>
          ))}
        </div>
        <div style={{ fontFamily: jbm, fontSize: 24, color: "#22d3ee", marginTop: 52 }}>
          flow-movie-pipeline · chanktb
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------- main

const SKIN_FRAMES = [
  <Terminal key="terminal" />,
  <Blueprint key="blueprint" />,
  <Swiss key="swiss" />,
  <Keynote key="keynote" />,
  <Poster70 key="poster70" />,
  <Cinematic key="cinematic" />,
  <Comic key="comic" />,
  <Notebook key="notebook" />,
  <Chalkboard key="chalkboard" />,
  <RepoDark key="repodark" />,
];

export const SKIN_COUNT = SKIN_FRAMES.length;

// One frame = one skin (npx remotion still skin-gallery --frame=N)
export const SkinGallery: React.FC = () => {
  const frame = useCurrentFrame();
  return <>{SKIN_FRAMES[Math.min(Math.floor(frame), SKIN_FRAMES.length - 1)]}</>;
};
