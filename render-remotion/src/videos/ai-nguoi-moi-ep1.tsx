import React from "react";
import {
  AbsoluteFill,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Audio } from "@remotion/media";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadJBM } from "@remotion/google-fonts/JetBrainsMono";
import { Rise, countAt, progressAt } from "../lib/core";
import { KaraokeMarker } from "../lib/karaoke";
import { SCENES, TOTAL_FRAMES } from "./ai-nguoi-moi-ep1-data";

const HOOK_FRAMES = 45; // ~1.5s silent title flash (thumbnail + hook)
export const TOTAL_WITH_HOOK = TOTAL_FRAMES + HOOK_FRAMES;

// Run: ai-nguoi-moi-ep1 · serie "AI cho nguoi moi" tap 01 · path B · skin KEYNOTE-CLEAN
// Voice: VieNeu clone "Giong Nam ESC A" (tu_nhien, temp 0.5).
// Safe zone: x 90-990, y 345-1440 (karaoke band 1470-1635 kept empty).

const { fontFamily: sans } = loadInter("normal", {
  weights: ["400", "600", "700", "800", "900"],
  subsets: ["latin", "vietnamese"],
});
const { fontFamily: mono } = loadJBM("normal", {
  weights: ["400", "700"],
  subsets: ["latin", "vietnamese"],
});

const C = {
  bg: "#F7F9FC",
  bg2: "#EAEFF7",
  ink: "#1D1D1F",
  sub: "#6E7686",
  card: "#FFFFFF",
  line: "rgba(29,29,31,0.10)",
  blue: "#0A84FF",
  blueSoft: "rgba(10,132,255,0.10)",
  red: "#FF3B30",
  redSoft: "rgba(255,59,48,0.10)",
  green: "#2FB457",
  greenSoft: "rgba(47,180,87,0.12)",
  shadow: "0 22px 60px rgba(20,45,90,0.10)",
};

// chrome

const Shell: React.FC<{ kicker?: string; kickerColor?: string; children: React.ReactNode }> = ({
  kicker,
  kickerColor = C.blue,
  children,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const opacity = interpolate(
    frame,
    [0, 9, durationInFrames - 8, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const drift = interpolate(frame, [0, durationInFrames], [0, 60]);
  return (
    <AbsoluteFill style={{ background: C.bg, color: C.ink, fontFamily: sans, opacity }}>
      {/* soft moving background blob to keep light bg alive */}
      <AbsoluteFill style={{ overflow: "hidden" }}>
        <div
          style={{
            position: "absolute",
            top: 260 + drift,
            left: 620 - drift,
            width: 620,
            height: 620,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(10,132,255,0.10), transparent 68%)",
            filter: "blur(6px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 120 + drift,
            left: -120,
            width: 520,
            height: 520,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(47,180,87,0.07), transparent 68%)",
          }}
        />
      </AbsoluteFill>
      {/* brand row */}
      <div
        style={{
          position: "absolute",
          top: 150,
          left: 90,
          right: 90,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontFamily: mono,
          fontSize: 24,
          letterSpacing: 1,
          color: C.sub,
        }}
      >
        <span style={{ fontWeight: 700, color: C.ink }}>AI CHO NGƯỜI MỚI</span>
        <span>TẬP 01</span>
      </div>
      {kicker && (
        <div style={{ position: "absolute", top: 228, left: 90 }}>
          <Rise from={2} dur={10}>
            <span
              style={{
                fontFamily: mono,
                fontSize: 26,
                fontWeight: 700,
                letterSpacing: 2,
                color: kickerColor,
                background: kickerColor === C.blue ? C.blueSoft : kickerColor === C.red ? C.redSoft : C.greenSoft,
                border: `1.5px solid ${kickerColor}44`,
                borderRadius: 999,
                padding: "9px 22px",
              }}
            >
              {kicker}
            </span>
          </Rise>
        </div>
      )}
      {children}
    </AbsoluteFill>
  );
};

const Inner: React.FC<{ children: React.ReactNode; top?: number }> = ({ children, top = 330 }) => (
  <div style={{ position: "absolute", left: 90, right: 90, top }}>{children}</div>
);

const Card: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div
    style={{
      background: C.card,
      borderRadius: 32,
      boxShadow: C.shadow,
      border: `1px solid ${C.line}`,
      ...style,
    }}
  >
    {children}
  </div>
);

const Person: React.FC<{ color?: string; size?: number }> = ({ color = C.ink, size = 120 }) => (
  <svg width={size} height={size} viewBox="0 0 120 120">
    <circle cx="60" cy="42" r="26" fill="none" stroke={color} strokeWidth="6" />
    <path d="M18 108 q42 -44 84 0" fill="none" stroke={color} strokeWidth="6" strokeLinecap="round" />
  </svg>
);

// scene bodies

// S1: twins, same morning, same AI plan, same price
const S01: React.FC = () => {
  const frame = useCurrentFrame();
  const eq = progressAt(frame, 60, 16);
  const col = (delay: number) => (
    <Card style={{ width: 400, padding: "44px 34px", textAlign: "center" }}>
      <Rise from={delay} dur={12}>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <Person color={C.ink} size={130} />
        </div>
        <div
          style={{
            marginTop: 26,
            background: C.blueSoft,
            border: `1.5px solid ${C.blue}33`,
            borderRadius: 16,
            padding: "16px 10px",
            fontSize: 33,
            fontWeight: 700,
            color: C.blue,
          }}
        >
          GÓI AI
        </div>
        <div style={{ marginTop: 14, fontSize: 27, color: C.sub }}>đã thanh toán</div>
      </Rise>
    </Card>
  );
  return (
    <Shell kicker="CÙNG MỘT BUỔI SÁNG">
      <Inner top={420}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 26 }}>
          {col(14)}
          <div
            style={{
              fontSize: 120,
              fontWeight: 800,
              color: C.ink,
              opacity: eq,
              scale: String(0.6 + 0.4 * eq),
            }}
          >
            =
          </div>
          {col(24)}
        </div>
        <Rise from={78} dur={14}>
          <div style={{ marginTop: 60, textAlign: "center", fontSize: 40, fontWeight: 700, color: C.sub }}>
            Cùng một số tiền
          </div>
        </Rise>
      </Inner>
    </Shell>
  );
};

// S2: divergence, same start, two different afternoons
const S02: React.FC = () => {
  const frame = useCurrentFrame();
  const q = progressAt(frame, 150, 20);
  const side = (opts: { delay: number; time: string; label: string; color: string }) => (
    <Card style={{ flex: 1, padding: "38px 30px", textAlign: "center", borderTop: `6px solid ${opts.color}` }}>
      <Rise from={opts.delay} dur={12}>
        <div style={{ fontFamily: mono, fontSize: 66, fontWeight: 700, color: opts.color }}>{opts.time}</div>
        <div style={{ marginTop: 22, display: "flex", justifyContent: "center" }}>
          <Person color={opts.color} size={110} />
        </div>
        <div style={{ marginTop: 22, fontSize: 38, fontWeight: 800, color: opts.color, lineHeight: 1.25 }}>
          {opts.label}
        </div>
      </Rise>
    </Card>
  );
  return (
    <Shell kicker="ĐẾN CHIỀU">
      <Inner top={410}>
        <div style={{ display: "flex", gap: 26 }}>
          {side({ delay: 14, time: "17:00", label: "XONG VIỆC, VỀ SỚM", color: C.green })}
          {side({ delay: 24, time: "23:00", label: "CÒN NGỒI HỌC AI", color: C.red })}
        </div>
        <div style={{ marginTop: 54, textAlign: "center" }}>
          <span
            style={{
              fontSize: 108,
              fontWeight: 900,
              color: C.blue,
              opacity: q,
              scale: String(0.5 + 0.5 * q),
              display: "inline-block",
            }}
          >
            ?
          </span>
          <div style={{ fontSize: 34, color: C.sub, marginTop: 4 }}>cùng một công cụ</div>
        </div>
      </Inner>
    </Shell>
  );
};

// S3: the cancel button, then STOP
const S03: React.FC = () => {
  const frame = useCurrentFrame();
  const stop = progressAt(frame, 70, 16);
  return (
    <Shell kicker="ĐỪNG VỘI" kickerColor={C.blue}>
      <Inner top={470}>
        <Rise from={14} dur={14}>
          <Card style={{ padding: "56px 44px", textAlign: "center", position: "relative" }}>
            <div style={{ fontSize: 40, color: C.sub, fontWeight: 600 }}>Nhiều người bấm</div>
            <div
              style={{
                margin: "30px auto 0",
                width: 420,
                padding: "26px 0",
                background: C.redSoft,
                border: `2px solid ${C.red}`,
                borderRadius: 20,
                fontSize: 48,
                fontWeight: 800,
                color: C.red,
              }}
            >
              Huỷ gói AI
            </div>
          </Card>
        </Rise>
        <div style={{ textAlign: "center", marginTop: 44 }}>
          <span
            style={{
              display: "inline-block",
              fontSize: 96,
              fontWeight: 900,
              color: C.blue,
              opacity: stop,
              scale: String(0.6 + 0.4 * stop),
            }}
          >
            KHOAN ĐÃ
          </span>
          <Rise from={96} dur={12}>
            <div style={{ fontSize: 42, fontWeight: 700, color: C.ink, marginTop: 10 }}>Bạn không hề kém</div>
          </Rise>
        </div>
      </Inner>
    </Shell>
  );
};

// S4: it is an OLD story
const S04: React.FC = () => {
  const frame = useCurrentFrame();
  const stamp = progressAt(frame, 30, 16);
  return (
    <Shell kicker="VẤN ĐỀ THẬT" kickerColor={C.blue}>
      <Inner top={520}>
        <div style={{ textAlign: "center" }}>
          <Rise from={12} dur={14}>
            <div style={{ fontSize: 48, color: C.sub, fontWeight: 600 }}>Bạn đang dùng AI theo</div>
          </Rise>
          <div
            style={{
              marginTop: 34,
              display: "inline-block",
              border: `5px solid ${C.sub}`,
              borderRadius: 22,
              padding: "22px 54px",
              fontSize: 110,
              fontWeight: 900,
              color: C.sub,
              opacity: 0.35 + 0.55 * stamp,
              scale: String(1.15 - 0.15 * stamp),
              rotate: "-3deg",
            }}
          >
            BẢN CŨ
          </div>
          <Rise from={70} dur={14}>
            <div style={{ fontSize: 40, color: C.ink, marginTop: 40, fontWeight: 700 }}>
              cách hiểu của mấy năm trước
            </div>
          </Rise>
        </div>
      </Inner>
    </Shell>
  );
};

// S5: old = chatbox, ask then answer then done
const S05: React.FC = () => {
  const bubble = (delay: number, align: "flex-start" | "flex-end", bg: string, fg: string, label: string) => (
    <Rise from={delay} dur={12} style={{ display: "flex", justifyContent: align }}>
      <div style={{ maxWidth: 560, background: bg, color: fg, borderRadius: 26, padding: "24px 34px", fontSize: 40, fontWeight: 700 }}>
        {label}
      </div>
    </Rise>
  );
  return (
    <Shell kicker="BẢN CŨ · HỎI ĐÁP" kickerColor={C.sub}>
      <Inner top={410}>
        <Card style={{ padding: "40px 36px", display: "flex", flexDirection: "column", gap: 26, opacity: 0.92 }}>
          {bubble(14, "flex-end", C.blueSoft, C.blue, "Bạn hỏi")}
          {bubble(34, "flex-start", "#EEF1F6", C.ink, "Nó trả lời")}
          {bubble(58, "flex-end", C.blueSoft, C.blue, "Bạn hỏi tiếp")}
          <Rise from={82} dur={12} style={{ display: "flex", justifyContent: "flex-start" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ background: "#EEF1F6", color: C.ink, borderRadius: 26, padding: "24px 34px", fontSize: 40, fontWeight: 700 }}>
                Nó trả lời
              </div>
              <span style={{ fontSize: 38, fontWeight: 800, color: C.sub }}>rồi hết.</span>
            </div>
          </Rise>
        </Card>
        <Rise from={100} dur={12}>
          <div style={{ textAlign: "center", fontSize: 36, color: C.sub, marginTop: 30, fontWeight: 600 }}>
            Bạn vẫn là người làm
          </div>
        </Rise>
      </Inner>
    </Shell>
  );
};

// S6: transformation, TRA LOI struck to LAM VIEC
const S06: React.FC = () => {
  const frame = useCurrentFrame();
  const strike = progressAt(frame, 30, 16);
  const arrow = progressAt(frame, 48, 18);
  return (
    <Shell kicker="BẢN MỚI" kickerColor={C.green}>
      <Inner top={470}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 30 }}>
          <Rise from={12} dur={12}>
            <div style={{ position: "relative", display: "inline-block" }}>
              <span style={{ fontSize: 78, fontWeight: 800, color: C.sub }}>để TRẢ LỜI bạn</span>
              <div style={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)", height: 9, width: `${100 * strike}%`, background: C.red, borderRadius: 999 }} />
            </div>
          </Rise>
          <svg width="60" height="90" style={{ overflow: "visible" }}>
            <line x1="30" y1="4" x2="30" y2={4 + 66 * arrow} stroke={C.green} strokeWidth="7" strokeLinecap="round" />
            {arrow > 0.85 && <path d="M14 60 L30 84 L46 60 Z" fill={C.green} />}
          </svg>
          <Rise from={64} dur={14}>
            <Card style={{ padding: "34px 50px", borderTop: `6px solid ${C.green}`, textAlign: "center" }}>
              <div style={{ fontSize: 92, fontWeight: 900, color: C.green }}>để LÀM VIỆC</div>
              <div style={{ fontSize: 40, color: C.ink, marginTop: 12, fontWeight: 700 }}>như một nhân viên thật</div>
            </Card>
          </Rise>
        </div>
      </Inner>
    </Shell>
  );
};

// S7: scale, hundreds of products, a month by hand
const S07: React.FC = () => {
  const frame = useCurrentFrame();
  const n = Math.round(countAt(frame, 300, 16, 40));
  const bar = progressAt(frame, 70, 40);
  return (
    <Shell kicker="VÍ DỤ THẬT · SHOPIFY" kickerColor={C.blue}>
      <Inner top={410}>
        <div style={{ textAlign: "center" }}>
          <Rise from={12} dur={12}>
            <div style={{ fontSize: 240, fontWeight: 900, lineHeight: 1.0, color: C.blue }}>{n}+</div>
            <div style={{ fontSize: 44, fontWeight: 700, color: C.ink, marginTop: 6 }}>sản phẩm, mô tả sơ sài</div>
          </Rise>
        </div>
        <Rise from={64} dur={14}>
          <Card style={{ marginTop: 46, padding: "34px 40px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 34, color: C.sub, fontWeight: 600 }}>
              <span>Sửa tay từng cái</span>
              <span style={{ fontFamily: mono, color: C.red, fontWeight: 700 }}>1 THÁNG</span>
            </div>
            <div style={{ marginTop: 22, height: 26, borderRadius: 999, background: "#EDF0F5", overflow: "hidden" }}>
              <div style={{ width: `${18 * bar}%`, height: "100%", borderRadius: 999, background: C.red }} />
            </div>
            <div style={{ marginTop: 16, fontSize: 30, color: C.sub }}>chưa xong</div>
          </Card>
        </Rise>
      </Inner>
    </Shell>
  );
};

// S8: chatbox AI writes smooth but blind, guess, fabricate
const S08: React.FC = () => {
  const frame = useCurrentFrame();
  const guess = progressAt(frame, 60, 16);
  const fab = progressAt(frame, 90, 16);
  return (
    <Shell kicker="AI HỎI ĐÁP" kickerColor={C.sub}>
      <Inner top={410}>
        <Rise from={12} dur={12}>
          <Card style={{ padding: "30px 34px" }}>
            <div style={{ fontSize: 32, color: C.sub, marginBottom: 16 }}>Mô tả nó viết ra, rất mượt</div>
            {[92, 84, 70].map((w, i) => (
              <div key={i} style={{ height: 16, width: `${w}%`, background: "#E7EBF1", borderRadius: 8, marginTop: 14 }} />
            ))}
            <div style={{ marginTop: 22, display: "inline-flex", alignItems: "center", gap: 12, background: C.redSoft, borderRadius: 14, padding: "10px 20px" }}>
              <span style={{ fontSize: 30, fontWeight: 700, color: C.red }}>chưa từng thấy sản phẩm</span>
            </div>
          </Card>
        </Rise>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 26, marginTop: 44 }}>
          <div style={{ fontSize: 56, fontWeight: 800, color: C.sub, opacity: guess }}>ĐOÁN</div>
          <span style={{ fontSize: 50, color: C.sub, opacity: guess }}>→</span>
          <div style={{ fontSize: 84, fontWeight: 900, color: C.red, opacity: fab, scale: String(0.7 + 0.3 * fab) }}>BỊA</div>
        </div>
      </Inner>
    </Shell>
  );
};

// S9: false claim on the store means lying to customers
const S09: React.FC = () => {
  const frame = useCurrentFrame();
  const line = progressAt(frame, 40, 16);
  const stamp = progressAt(frame, 78, 16);
  return (
    <Shell kicker="HẬU QUẢ" kickerColor={C.red}>
      <Inner top={420}>
        <Rise from={12} dur={12}>
          <Card style={{ padding: "34px 38px", position: "relative" }}>
            <div style={{ fontSize: 32, color: C.sub, marginBottom: 18 }}>Trên trang sản phẩm của bạn</div>
            <div style={{ position: "relative", display: "inline-block" }}>
              <span style={{ fontSize: 46, fontWeight: 800, color: C.ink }}>công dụng thực tế không có</span>
              <svg width="640" height="16" style={{ position: "absolute", left: 0, bottom: -12 }}>
                <line x1="0" y1="8" x2={640 * line} y2="8" stroke={C.red} strokeWidth="7" strokeLinecap="round" />
              </svg>
            </div>
            <div
              style={{
                position: "absolute",
                right: 26,
                top: 26,
                border: `4px solid ${C.red}`,
                color: C.red,
                borderRadius: 14,
                padding: "8px 20px",
                fontSize: 34,
                fontWeight: 900,
                rotate: "8deg",
                opacity: stamp,
                scale: String(1.2 - 0.2 * stamp),
              }}
            >
              SAI SỰ THẬT
            </div>
          </Card>
        </Rise>
        <Rise from={100} dur={14}>
          <div style={{ marginTop: 48, textAlign: "center", fontSize: 46, fontWeight: 800, color: C.red }}>
            Vô tình nói dối khách
          </div>
          <div style={{ textAlign: "center", fontSize: 34, color: C.sub, marginTop: 10 }}>mà không hay biết</div>
        </Rise>
      </Inner>
    </Shell>
  );
};

// S10: execution AI grounded, real data + rules to truthful write
const S10: React.FC = () => {
  const frame = useCurrentFrame();
  const inputs = ["DỮ LIỆU THẬT", "NỘI QUY BẠN ĐẶT", "BỐI CẢNH CÔNG TY"];
  const check = progressAt(frame, 96, 16);
  return (
    <Shell kicker="AI THỰC THI" kickerColor={C.green}>
      <Inner top={400}>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {inputs.map((t, i) => (
            <Rise key={t} from={14 + i * 12} dur={12}>
              <div
                style={{
                  background: C.card,
                  border: `1px solid ${C.line}`,
                  borderLeft: `7px solid ${C.green}`,
                  borderRadius: 20,
                  boxShadow: C.shadow,
                  padding: "22px 30px",
                  fontSize: 40,
                  fontWeight: 700,
                  color: C.ink,
                }}
              >
                {t}
              </div>
            </Rise>
          ))}
        </div>
        <div style={{ textAlign: "center", fontSize: 46, color: C.sub, marginTop: 8 }}>↓</div>
        <Rise from={80} dur={14}>
          <Card style={{ padding: "30px 40px", borderTop: `6px solid ${C.green}`, textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: 20 }}>
            <div style={{ fontSize: 60, fontWeight: 900, color: C.green }}>VIẾT ĐÚNG</div>
            <svg width="70" height="70" viewBox="0 0 70 70" style={{ opacity: check }}>
              <circle cx="35" cy="35" r="30" fill="none" stroke={C.green} strokeWidth="6" />
              <path d="M20 36 L31 47 L51 24" fill="none" stroke={C.green} strokeWidth="7" strokeLinecap="round" strokeDasharray="60" strokeDashoffset={60 * (1 - check)} />
            </svg>
          </Card>
        </Rise>
        <Rise from={104} dur={12}>
          <div style={{ textAlign: "center", fontSize: 32, color: C.sub, marginTop: 20 }}>dựa trên sự thật, không phỏng đoán</div>
        </Rise>
      </Inner>
    </Shell>
  );
};

// S11: one command, live edit inside the store
const S11: React.FC = () => {
  const frame = useCurrentFrame();
  const swap = progressAt(frame, 74, 18);
  return (
    <Shell kicker="1 CÂU LỆNH" kickerColor={C.blue}>
      <Inner top={400}>
        <Rise from={12} dur={12} style={{ display: "flex", justifyContent: "center" }}>
          <div style={{ fontFamily: mono, fontSize: 34, color: C.blue, background: C.blueSoft, border: `1.5px solid ${C.blue}44`, borderRadius: 16, padding: "18px 30px" }}>
            &gt; viết lại mô tả cho chuẩn
          </div>
        </Rise>
        <div style={{ textAlign: "center", fontSize: 44, color: C.sub, margin: "16px 0" }}>↓</div>
        <Rise from={40} dur={14}>
          <Card style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "18px 26px", borderBottom: `1px solid ${C.line}`, fontFamily: mono, fontSize: 26, color: C.sub }}>
              <span style={{ width: 14, height: 14, borderRadius: 999, background: C.green, display: "inline-block" }} />
              cửa hàng của bạn
            </div>
            <div style={{ padding: "30px 34px", position: "relative", minHeight: 250 }}>
              <div style={{ opacity: 1 - swap }}>
                {[60, 50].map((w, i) => (
                  <div key={i} style={{ height: 16, width: `${w}%`, background: "#E7EBF1", borderRadius: 8, marginTop: 16 }} />
                ))}
                <div style={{ marginTop: 20, fontSize: 30, color: C.sub }}>mô tả cũ, sơ sài</div>
              </div>
              <div style={{ position: "absolute", inset: "30px 34px", opacity: swap }}>
                {[92, 86, 74].map((w, i) => (
                  <div key={i} style={{ height: 16, width: `${w}%`, background: C.greenSoft, borderRadius: 8, marginTop: 14 }} />
                ))}
                <div style={{ marginTop: 18, fontSize: 32, fontWeight: 700, color: C.green }}>đã sửa thật</div>
              </div>
            </div>
          </Card>
        </Rise>
        <Rise from={100} dur={12}>
          <div style={{ textAlign: "center", fontSize: 36, fontWeight: 700, color: C.ink, marginTop: 26 }}>
            Bắt tay vào làm, không chỉ trỏ
          </div>
        </Rise>
      </Inner>
    </Shell>
  );
};

// S12: role swap, ban lam to giao viec + duyet
const S12: React.FC = () => {
  const frame = useCurrentFrame();
  const strike = progressAt(frame, 28, 16);
  return (
    <Shell kicker="VAI CỦA BẠN ĐỔI" kickerColor={C.blue}>
      <Inner top={430}>
        <div style={{ textAlign: "center" }}>
          <Rise from={12} dur={12}>
            <div style={{ position: "relative", display: "inline-block" }}>
              <span style={{ fontSize: 84, fontWeight: 900, color: C.sub }}>BẠN LÀM</span>
              <div style={{ position: "absolute", left: 0, top: "47%", transform: "translateY(-50%)", height: 10, width: `${100 * strike}%`, background: C.red, borderRadius: 999 }} />
            </div>
          </Rise>
        </div>
        <div style={{ display: "flex", gap: 24, justifyContent: "center", marginTop: 44 }}>
          {["GIAO VIỆC", "DUYỆT"].map((t, i) => (
            <Rise key={t} from={48 + i * 12} dur={12}>
              <Card style={{ padding: "34px 46px", borderTop: `6px solid ${C.blue}` }}>
                <div style={{ fontSize: 58, fontWeight: 900, color: C.blue }}>{t}</div>
              </Card>
            </Rise>
          ))}
        </div>
        <Rise from={84} dur={14}>
          <div style={{ marginTop: 46, display: "flex", justifyContent: "center" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 16, background: C.greenSoft, border: `1.5px solid ${C.green}55`, borderRadius: 999, padding: "16px 30px" }}>
              <span style={{ fontSize: 36, fontWeight: 800, color: C.green }}>Nhân viên đầu tiên của bạn</span>
            </div>
          </div>
        </Rise>
      </Inner>
    </Shell>
  );
};

// S13: onboard like a new hire, 3 pillars
const S13: React.FC = () => {
  const pillars = [
    { n: "01", t: "ĐÀO TẠO", d: "dạy nó biết công ty bạn" },
    { n: "02", t: "NỘI QUY", d: "đặt luật cho nó" },
    { n: "03", t: "QUYỀN HẠN", d: "cho chạm tới đâu" },
  ];
  return (
    <Shell kicker="DẠY NHƯ NHÂN VIÊN MỚI" kickerColor={C.blue}>
      <Inner top={410}>
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          {pillars.map((p, i) => (
            <Rise key={p.n} from={16 + i * 16} dur={14}>
              <Card style={{ padding: "28px 34px", display: "flex", alignItems: "center", gap: 28 }}>
                <div style={{ fontFamily: mono, fontSize: 62, fontWeight: 700, color: C.blue, minWidth: 100 }}>{p.n}</div>
                <div>
                  <div style={{ fontSize: 54, fontWeight: 900, color: C.ink }}>{p.t}</div>
                  <div style={{ fontSize: 32, color: C.sub, marginTop: 4 }}>{p.d}</div>
                </div>
              </Card>
            </Rise>
          ))}
        </div>
      </Inner>
    </Shell>
  );
};

// S14: the one realization, hop chat struck to nhan vien
const S14: React.FC = () => {
  const frame = useCurrentFrame();
  const strike = progressAt(frame, 40, 16);
  const reveal = progressAt(frame, 66, 16);
  return (
    <Shell kicker="MẤU CHỐT" kickerColor={C.blue}>
      <Inner top={470}>
        <div style={{ textAlign: "center" }}>
          <Rise from={12} dur={12}>
            <div style={{ fontSize: 40, color: C.sub, fontWeight: 600 }}>AI không phải</div>
          </Rise>
          <Rise from={20} dur={12}>
            <div style={{ position: "relative", display: "inline-block", marginTop: 10 }}>
              <span style={{ fontSize: 78, fontWeight: 800, color: C.sub }}>HỘP CHAT để hỏi</span>
              <div style={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)", height: 9, width: `${100 * strike}%`, background: C.red, borderRadius: 999 }} />
            </div>
          </Rise>
          <div style={{ fontSize: 44, color: C.sub, margin: "26px 0 8px" }}>nó là</div>
          <div style={{ display: "inline-block", fontSize: 96, fontWeight: 900, color: C.blue, opacity: reveal, scale: String(0.7 + 0.3 * reveal) }}>
            NHÂN VIÊN
          </div>
          <Rise from={92} dur={12}>
            <div style={{ fontSize: 44, fontWeight: 700, color: C.ink, marginTop: 10 }}>để giao việc</div>
          </Rise>
        </div>
      </Inner>
    </Shell>
  );
};

// S15: series card + tagline + next episode
const S15: React.FC = () => {
  const frame = useCurrentFrame();
  const zoom = interpolate(frame, [0, 240], [1, 1.04]);
  return (
    <Shell>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ scale: String(zoom), textAlign: "center", marginTop: -40, width: 900 }}>
          <Rise from={6} dur={14}>
            <div style={{ fontSize: 96, fontWeight: 900, color: C.ink, lineHeight: 1.1 }}>AI CHO NGƯỜI MỚI</div>
            <div style={{ display: "flex", justifyContent: "center", marginTop: 12 }}>
              <div style={{ width: 220, height: 8, borderRadius: 999, background: C.blue }} />
            </div>
          </Rise>
          <Rise from={26} dur={14}>
            <div style={{ fontSize: 44, fontWeight: 700, color: C.sub, marginTop: 40, lineHeight: 1.35 }}>
              Dùng cho ra việc,<br />không dùng cho vui
            </div>
          </Rise>
          <Rise from={48} dur={14}>
            <Card style={{ display: "inline-block", marginTop: 48, padding: "22px 40px", borderTop: `6px solid ${C.blue}` }}>
              <div style={{ fontFamily: mono, fontSize: 30, color: C.sub }}>TẬP 02</div>
              <div style={{ fontSize: 46, fontWeight: 800, color: C.blue, marginTop: 6 }}>Buổi đào tạo đầu tiên</div>
            </Card>
          </Rise>
          <Rise from={70} dur={12}>
            <div style={{ fontFamily: mono, fontSize: 24, color: C.sub, marginTop: 54 }}>made with any2video</div>
          </Rise>
        </div>
      </AbsoluteFill>
    </Shell>
  );
};

// S00 HOOK / thumbnail: bold reframe title, silent, first frame becomes the poster
const S00: React.FC = () => {
  const frame = useCurrentFrame();
  const strike = progressAt(frame, 8, 12);
  const badge = progressAt(frame, 12, 12);
  return (
    <Shell>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", width: 940, marginTop: -10 }}>
          <Rise from={0} dur={8}>
            <div style={{ fontSize: 64, fontWeight: 800, color: C.ink }}>AI không phải</div>
          </Rise>
          <Rise from={2} dur={8}>
            <div style={{ position: "relative", display: "inline-block", marginTop: 8 }}>
              <span style={{ fontSize: 104, fontWeight: 900, color: C.sub, lineHeight: 1.14 }}>CÁI HỘP CHAT</span>
              <div style={{ position: "absolute", left: 0, top: "47%", transform: "translateY(-50%)", height: 12, width: `${100 * strike}%`, background: C.red, borderRadius: 999 }} />
            </div>
          </Rise>
          <div style={{ fontSize: 46, color: C.sub, margin: "30px 0 14px", fontWeight: 600 }}>mà là một</div>
          <div
            style={{
              display: "inline-block",
              fontSize: 120,
              fontWeight: 900,
              color: "#FFFFFF",
              background: C.blue,
              borderRadius: 28,
              padding: "12px 54px",
              boxShadow: "0 22px 55px rgba(10,132,255,0.35)",
              opacity: badge,
              scale: String(0.82 + 0.18 * badge),
              lineHeight: 1.16,
            }}
          >
            NHÂN VIÊN
          </div>
          <Rise from={22} dur={10}>
            <div style={{ fontSize: 40, color: C.ink, fontWeight: 700, marginTop: 30 }}>để giao việc cho bạn</div>
          </Rise>
        </div>
      </AbsoluteFill>
    </Shell>
  );
};

// main

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
  "13": <S13 />,
  "14": <S14 />,
  "15": <S15 />,
};

export const AiNguoiMoiEp1: React.FC = () => {
  let cursor = HOOK_FRAMES;
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <Sequence from={0} durationInFrames={HOOK_FRAMES} premountFor={20}>
        <S00 />
      </Sequence>
      {SCENES.map((scene) => {
        const from = cursor;
        cursor += scene.durationInFrames;
        return (
          <Sequence key={scene.id} from={from} durationInFrames={scene.durationInFrames} premountFor={45}>
            {BODIES[scene.id]}
            <KaraokeMarker words={scene.words} fontFamily={sans} ink={C.ink} marker={C.blue} markerText="#FFFFFF" dim="rgba(29,29,31,0.34)" />
            <Audio src={staticFile(scene.audio)} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
