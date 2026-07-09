import React from "react";
import {
  AbsoluteFill,
  Sequence,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { Audio } from "@remotion/media";
import { loadFont as loadBVP } from "@remotion/google-fonts/BeVietnamPro";
import { loadFont as loadJBM } from "@remotion/google-fonts/JetBrainsMono";
import { Rise, countAt, progressAt } from "../lib/core";
import { KaraokeNeon } from "../lib/karaoke";
import { SCENES } from "./shopify-schema-2shop-data";

const bvp = loadBVP().fontFamily;
const jbm = loadJBM().fontFamily;

// tech-dark-neon skin tokens
const C = {
  bg: "#0a0e1a",
  fg: "#F5F7FA",
  cyan: "#22d3ee",
  red: "#ef4444",
  green: "#4ADE80",
  amber: "#fbbf24",
  dim: "rgba(245,247,250,0.58)",
  card: "#0f1626",
  border: "rgba(255,255,255,0.09)",
};

// ---- shared chrome ---------------------------------------------------------
const Particles: React.FC = () => {
  const f = useCurrentFrame();
  const dots = React.useMemo(
    () =>
      Array.from({ length: 26 }, (_, i) => ({
        x: (i * 137.5) % 1080,
        y: (i * 223) % 1920,
        r: 1 + (i % 3),
        sp: 0.2 + (i % 5) * 0.08,
      })),
    [],
  );
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
      {dots.map((d, i) => {
        const y = (d.y - f * d.sp + 1920) % 1920;
        return (
          <circle
            key={i}
            cx={d.x}
            cy={y}
            r={d.r}
            fill={i % 4 === 0 ? C.cyan : C.fg}
            opacity={0.09}
          />
        );
      })}
    </svg>
  );
};

const Shell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AbsoluteFill style={{ background: C.bg, fontFamily: bvp, color: C.fg }}>
    <div
      style={{
        position: "absolute",
        top: -260,
        left: -140,
        width: 760,
        height: 760,
        borderRadius: "50%",
        background:
          "radial-gradient(circle, rgba(34,211,238,0.16), transparent 62%)",
      }}
    />
    <div
      style={{
        position: "absolute",
        bottom: -280,
        right: -160,
        width: 720,
        height: 720,
        borderRadius: "50%",
        background:
          "radial-gradient(circle, rgba(74,222,128,0.12), transparent 62%)",
      }}
    />
    <Particles />
    <div
      style={{
        position: "absolute",
        top: 150,
        left: 96,
        fontFamily: jbm,
        fontSize: 26,
        letterSpacing: 3,
        color: C.dim,
      }}
    >
      SCHEMA FIX · CASE
    </div>
    {children}
  </AbsoluteFill>
);

const Inner: React.FC<{ children: React.ReactNode; top?: number }> = ({
  children,
  top = 300,
}) => (
  <div
    style={{
      position: "absolute",
      top,
      left: 90,
      width: 900,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 30,
    }}
  >
    {children}
  </div>
);

const Kicker: React.FC<{ text: string; color?: string; from?: number }> = ({
  text,
  color = C.cyan,
  from = 0,
}) => (
  <Rise from={from}>
    <div
      style={{
        fontFamily: jbm,
        fontSize: 30,
        fontWeight: 700,
        letterSpacing: 2,
        color,
        border: `1px solid ${color}`,
        borderRadius: 999,
        padding: "8px 22px",
        boxShadow: `0 0 24px ${color}44`,
      }}
    >
      {text}
    </div>
  </Rise>
);

const Head: React.FC<{
  children: React.ReactNode;
  size?: number;
  from?: number;
  color?: string;
}> = ({ children, size = 74, from = 6, color = C.fg }) => (
  <Rise from={from}>
    <div
      style={{
        fontSize: size,
        fontWeight: 800,
        lineHeight: 1.22,
        color,
        maxWidth: 900,
        textAlign: "center",
      }}
    >
      {children}
    </div>
  </Rise>
);

const Card: React.FC<{
  children: React.ReactNode;
  from: number;
  color?: string;
  style?: React.CSSProperties;
}> = ({ children, from, color = C.border, style }) => (
  <Rise from={from}>
    <div
      style={{
        background: C.card,
        border: `1px solid ${color}`,
        borderRadius: 24,
        padding: "26px 30px",
        boxShadow: `0 0 30px ${color}22`,
        ...style,
      }}
    >
      {children}
    </div>
  </Rise>
);

const XStrike: React.FC<{ from: number; w: number }> = ({ from, w }) => {
  const f = useCurrentFrame();
  const p = progressAt(f, from, 12);
  return (
    <svg width={w} height={54} style={{ position: "absolute", left: 0, top: 8 }}>
      <line
        x1={4}
        y1={48}
        x2={4 + (w - 8) * p}
        y2={8}
        stroke={C.red}
        strokeWidth={7}
        strokeLinecap="round"
      />
    </svg>
  );
};

// ===========================================================================
// SCENES
// ===========================================================================

// 1 HOOK: 4 keyword chips + 2 store cards + BROKEN stamp
const S1: React.FC = () => {
  const f = useCurrentFrame();
  const kws = ["TỐI ƯU", "SCHEMA", "SEO", "GEO"];
  const stampP = progressAt(f, 70, 12);
  return (
    <Inner top={300}>
      <Kicker text="2 SHOP · E-COMMERCE US" />
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 16, width: 900 }}>
        {kws.map((k, i) => {
          const o = progressAt(f, 14 + i * 8, 14);
          const col = i % 2 === 0 ? C.cyan : C.green;
          return (
            <div
              key={k}
              style={{
                opacity: o,
                translate: `0px ${(1 - o) * 24}px`,
                fontSize: 46,
                fontWeight: 800,
                color: col,
                border: `2px solid ${col}`,
                borderRadius: 18,
                padding: "12px 26px",
                boxShadow: `0 0 26px ${col}55`,
              }}
            >
              {k}
            </div>
          );
        })}
      </div>
      <div style={{ position: "relative", display: "flex", gap: 26, marginTop: 8 }}>
        {["SHOP 1", "SHOP 2"].map((s, i) => (
          <Card key={s} from={40 + i * 8} style={{ width: 300, height: 230 }}>
            <div style={{ fontFamily: jbm, fontSize: 30, color: C.dim }}>{s}</div>
            <div style={{ fontSize: 96, marginTop: 22 }}>🛒</div>
            <div style={{ fontSize: 26, color: C.dim, marginTop: 8 }}>
              schema · SEO · GEO
            </div>
          </Card>
        ))}
        <div
          style={{
            position: "absolute",
            top: 78,
            left: 70,
            opacity: stampP,
            scale: String(1.2 - stampP * 0.2),
            rotate: "-11deg",
            fontSize: 66,
            fontWeight: 900,
            color: C.red,
            border: `6px solid ${C.red}`,
            borderRadius: 14,
            padding: "6px 26px",
            boxShadow: `0 0 30px ${C.red}66`,
          }}
        >
          BROKEN
        </div>
      </div>
    </Inner>
  );
};

// 2 TRAP: theme A -> B, schema fields flip red
const S2: React.FC = () => {
  const f = useCurrentFrame();
  const fields = ["Product", "Organization", "Offer", "FAQ"];
  const swap = progressAt(f, 14, 16);
  return (
    <Inner top={310}>
      <Kicker text="ĐỔI THEME" color={C.amber} />
      <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
        <Card from={6} style={{ width: 220, textAlign: "center" }}>
          <div style={{ fontFamily: jbm, fontSize: 30, color: C.dim }}>THEME</div>
          <div style={{ fontSize: 54, fontWeight: 800 }}>A</div>
        </Card>
        <div style={{ fontSize: 60, color: C.amber, opacity: swap }}>→</div>
        <Card from={16} color={C.amber} style={{ width: 220, textAlign: "center" }}>
          <div style={{ fontFamily: jbm, fontSize: 30, color: C.dim }}>THEME</div>
          <div style={{ fontSize: 54, fontWeight: 800, color: C.amber }}>B</div>
        </Card>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14, width: 620 }}>
        {fields.map((fl, i) => {
          const broke = progressAt(f, 40 + i * 9, 12);
          return (
            <div
              key={fl}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: C.card,
                border: `1px solid ${broke > 0.5 ? C.red : C.border}`,
                borderRadius: 16,
                padding: "16px 24px",
                opacity: progressAt(f, 30 + i * 6, 12),
              }}
            >
              <span style={{ fontSize: 34, fontWeight: 700 }}>{fl}</span>
              <span style={{ fontSize: 34, color: broke > 0.5 ? C.red : C.dim }}>
                {broke > 0.5 ? "✕ vỡ" : "..."}
              </span>
            </div>
          );
        })}
      </div>
    </Inner>
  );
};

// 3 SYMPTOM: two red panels
const S3: React.FC = () => {
  return (
    <Inner top={300}>
      <Kicker text="TRIỆU CHỨNG" color={C.red} />
      <div style={{ display: "flex", gap: 24 }}>
        <Card from={10} color={C.red} style={{ width: 420, height: 400 }}>
          <div style={{ fontFamily: jbm, fontSize: 30, color: C.dim }}>SHOP 1</div>
          <div style={{ fontSize: 40, fontWeight: 800, marginTop: 14 }}>
            Product schema
          </div>
          <div
            style={{
              marginTop: 26,
              height: 150,
              border: `2px dashed ${C.red}`,
              borderRadius: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: C.red,
              fontSize: 40,
              fontWeight: 800,
            }}
          >
            TRỐNG TRƠN
          </div>
        </Card>
        <Card from={20} color={C.red} style={{ width: 420, height: 400 }}>
          <div style={{ fontFamily: jbm, fontSize: 30, color: C.dim }}>SHOP 2</div>
          <div style={{ fontSize: 40, fontWeight: 800, marginTop: 14 }}>
            Product trơ trụi
          </div>
          <div style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 14 }}>
            {["thiếu field", "mất Organization"].map((t) => (
              <div
                key={t}
                style={{
                  fontSize: 32,
                  color: C.red,
                  display: "flex",
                  gap: 12,
                }}
              >
                <span>✕</span>
                <span>{t}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </Inner>
  );
};

// 4 DIG A: giant 0
const S4: React.FC = () => {
  const f = useCurrentFrame();
  const n = Math.round(countAt(f, 100, 20, 26));
  const shrink = progressAt(f, 8, 20);
  return (
    <Inner top={310}>
      <Kicker text="BỊ RÚT RUỘT" color={C.red} />
      <Card from={6} style={{ width: 560, opacity: 1 - shrink * 0.4 }}>
        <div style={{ fontFamily: jbm, fontSize: 30, color: C.dim }}>
          theme block
        </div>
        <div
          style={{
            fontFamily: jbm,
            fontSize: 30,
            color: C.dim,
            marginTop: 12,
            lineHeight: 1.4,
          }}
        >
          {"// app lo schema... app tắt"}
        </div>
      </Card>
      <div style={{ display: "flex", alignItems: "center", gap: 34 }}>
        <div
          style={{
            fontFamily: jbm,
            fontSize: 340,
            fontWeight: 800,
            lineHeight: 1,
            color: C.red,
            textShadow: `0 0 60px ${C.red}88`,
          }}
        >
          {n}
        </div>
        <div style={{ fontSize: 40, fontWeight: 700, color: C.dim, width: 260 }}>
          Product schema ship ra
        </div>
      </div>
    </Inner>
  );
};

// 5 MERCHANT: offer fills fields
const S5: React.FC = () => {
  const f = useCurrentFrame();
  const rows = ["hasMerchantReturnPolicy", "shippingDetails", "itemCondition"];
  return (
    <Inner top={300}>
      <Kicker text="MERCHANT LISTING" color={C.green} />
      <Card from={8} style={{ width: 760 }}>
        <div style={{ fontFamily: jbm, fontSize: 32, color: C.cyan }}>
          {'"offers": {'}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, margin: "18px 0 6px 26px" }}>
          {rows.map((r, i) => {
            const on = progressAt(f, 26 + i * 12, 12);
            return (
              <div
                key={r}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  opacity: 0.4 + on * 0.6,
                }}
              >
                <span style={{ color: on > 0.5 ? C.green : C.dim, fontSize: 34 }}>
                  {on > 0.5 ? "✓" : "○"}
                </span>
                <span style={{ fontFamily: jbm, fontSize: 30, color: C.fg }}>{r}</span>
              </div>
            );
          })}
        </div>
        <div style={{ fontFamily: jbm, fontSize: 32, color: C.cyan }}>{"}"}</div>
      </Card>
      <Rise from={64}>
        <div
          style={{
            fontSize: 34,
            fontWeight: 700,
            color: C.green,
            border: `1px solid ${C.green}`,
            borderRadius: 14,
            padding: "12px 24px",
          }}
        >
          khớp Merchant Center
        </div>
      </Rise>
    </Inner>
  );
};

// 6 MYSTERY: source has Product, test shows only Org, big ?
const S6: React.FC = () => {
  const f = useCurrentFrame();
  const q = progressAt(f, 40, 14);
  return (
    <Inner top={300}>
      <Kicker text="KỲ LẠ" color={C.amber} />
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <Card from={8} color={C.green} style={{ width: 360, height: 300 }}>
          <div style={{ fontFamily: jbm, fontSize: 30, color: C.dim }}>SOURCE</div>
          <div style={{ marginTop: 30, display: "flex", flexDirection: "column", gap: 16 }}>
            {["Organization", "Product"].map((t) => (
              <div key={t} style={{ fontSize: 34, color: C.green, display: "flex", gap: 12 }}>
                <span>✓</span>
                <span style={{ fontFamily: jbm }}>{t}</span>
              </div>
            ))}
          </div>
        </Card>
        <div
          style={{
            fontSize: 130,
            fontWeight: 900,
            color: C.amber,
            opacity: q,
            scale: String(0.7 + q * 0.3),
            textShadow: `0 0 40px ${C.amber}77`,
          }}
        >
          ?
        </div>
        <Card from={16} color={C.red} style={{ width: 360, height: 300 }}>
          <div style={{ fontFamily: jbm, fontSize: 30, color: C.dim }}>TEST</div>
          <div style={{ marginTop: 30, display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ fontSize: 34, color: C.green, display: "flex", gap: 12 }}>
              <span>✓</span>
              <span style={{ fontFamily: jbm }}>Organization</span>
            </div>
            <div style={{ fontSize: 34, color: C.red, display: "flex", gap: 12 }}>
              <span>✕</span>
              <span style={{ fontFamily: jbm }}>Product</span>
            </div>
          </div>
        </Card>
      </div>
    </Inner>
  );
};

// 7 WRONG TURNS: cache + review crossed out
const S7: React.FC = () => {
  const items = ["CACHE", "REVIEW"];
  return (
    <Inner top={330}>
      <Kicker text="ĐI SAI HƯỚNG" color={C.red} />
      <div style={{ display: "flex", gap: 30, marginTop: 10 }}>
        {items.map((t, i) => (
          <Card key={t} from={12 + i * 10} style={{ width: 340, height: 220, position: "relative" }}>
            <div style={{ fontSize: 30, color: C.dim }}>tưởng do</div>
            <div style={{ position: "relative", marginTop: 20, width: 280 }}>
              <div style={{ fontSize: 68, fontWeight: 800, color: C.fg }}>{t}</div>
              <XStrike from={30 + i * 14} w={280} />
            </div>
            <div style={{ fontSize: 40, fontWeight: 800, color: C.red, marginTop: 26 }}>
              Sai
            </div>
          </Card>
        ))}
      </div>
    </Inner>
  );
};

// 8 BREAKTHROUGH: byte ruler
const S8: React.FC = () => {
  const f = useCurrentFrame();
  const grow = progressAt(f, 30, 26);
  return (
    <Inner top={290}>
      <Kicker text="BƯỚC NGOẶT" color={C.cyan} />
      <div style={{ display: "flex", gap: 34, marginTop: 6 }}>
        <div style={{ position: "relative", width: 120 }}>
          <div
            style={{
              position: "absolute",
              left: 54,
              top: 0,
              width: 12,
              height: 760 * grow,
              background: "linear-gradient(#22d3ee, #ef4444)",
              borderRadius: 8,
            }}
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: 760, width: 560 }}>
          <Rise from={20}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ fontSize: 40, fontWeight: 800, color: C.green }}>
                Organization
              </div>
              <div style={{ fontFamily: jbm, fontSize: 28, color: C.green }}>~26KB · THẤY</div>
            </div>
          </Rise>
          <Rise from={40}>
            <div
              style={{
                background: `${C.red}22`,
                border: `2px solid ${C.red}`,
                borderRadius: 18,
                padding: "22px 26px",
              }}
            >
              <div style={{ fontSize: 46, fontWeight: 900, color: C.red }}>APP VIDEO</div>
              <div style={{ fontFamily: jbm, fontSize: 60, fontWeight: 800, color: C.red }}>
                2 MB
              </div>
              <div style={{ fontSize: 28, color: C.dim }}>nhét vào head</div>
            </div>
          </Rise>
          <Rise from={64}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ fontSize: 40, fontWeight: 800, color: C.red }}>Product schema</div>
              <div style={{ fontFamily: jbm, fontSize: 28, color: C.red }}>
                ~2.7MB · BỊ CHÔN
              </div>
            </div>
          </Rise>
        </div>
      </div>
    </Inner>
  );
};

// 9 FIX: move block up
const S9: React.FC = () => {
  const f = useCurrentFrame();
  const up = progressAt(f, 20, 30);
  const check = progressAt(f, 58, 12);
  return (
    <Inner top={320}>
      <Kicker text="ĐƯA LÊN HEAD" color={C.green} />
      <div style={{ position: "relative", width: 620, height: 460 }}>
        <div
          style={{
            position: "absolute",
            top: 8,
            left: 0,
            width: 600,
            height: 70,
            border: `1px dashed ${C.dim}`,
            borderRadius: 14,
            display: "flex",
            alignItems: "center",
            paddingLeft: 22,
            fontFamily: jbm,
            fontSize: 30,
            color: C.dim,
          }}
        >
          {"<head>"}
        </div>
        <div
          style={{
            position: "absolute",
            top: 90 + (1 - up) * 300,
            left: 30,
            width: 540,
            background: C.card,
            border: `2px solid ${C.green}`,
            borderRadius: 18,
            padding: "20px 26px",
            boxShadow: `0 0 30px ${C.green}44`,
          }}
        >
          <div style={{ fontFamily: jbm, fontSize: 34, fontWeight: 800, color: C.green }}>
            Product schema
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            top: 300,
            left: 0,
            width: 600,
            textAlign: "center",
            opacity: check,
            fontSize: 44,
            fontWeight: 800,
            color: C.green,
          }}
        >
          ✓ Google thấy lại ngay
        </div>
      </div>
    </Inner>
  );
};

// 10 FAQ timeline
const S10: React.FC = () => {
  const f = useCurrentFrame();
  const nodes = [
    { d: "2023", t: "siết gov + health", c: C.amber },
    { d: "05/2026", t: "bỏ khỏi Search", c: C.red },
    { d: "06/2026", t: "gỡ khỏi test", c: C.red },
  ];
  const line = progressAt(f, 24, 26);
  return (
    <Inner top={330}>
      <Kicker text="FAQ SCHEMA" color={C.amber} />
      <div style={{ position: "relative", width: 900, marginTop: 30 }}>
        <div
          style={{
            position: "absolute",
            top: 30,
            left: 20,
            height: 6,
            width: 820 * line,
            background: C.dim,
            borderRadius: 4,
          }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", width: 860 }}>
          {nodes.map((n, i) => {
            const o = progressAt(f, 30 + i * 12, 12);
            return (
              <div
                key={n.d}
                style={{
                  width: 250,
                  opacity: o,
                  translate: `0px ${(1 - o) * 22}px`,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: "50%",
                    background: n.c,
                    boxShadow: `0 0 18px ${n.c}`,
                  }}
                />
                <div style={{ fontFamily: jbm, fontSize: 46, fontWeight: 800, color: n.c }}>
                  {n.d}
                </div>
                <div style={{ fontSize: 28, color: C.dim, textAlign: "center", lineHeight: 1.3 }}>
                  {n.t}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Inner>
  );
};

// 11 still for AI: FAQ -> 3 AIs
const S11: React.FC = () => {
  const f = useCurrentFrame();
  const ais = ["ChatGPT", "Perplexity", "Gemini"];
  return (
    <Inner top={320}>
      <Kicker text="AI VẪN ĐỌC" color={C.cyan} />
      <Rise from={8}>
        <div
          style={{
            fontSize: 44,
            fontWeight: 800,
            color: C.amber,
            border: `2px solid ${C.amber}`,
            borderRadius: 16,
            padding: "12px 28px",
            marginBottom: 14,
          }}
        >
          FAQ
        </div>
      </Rise>
      <div style={{ display: "flex", gap: 20 }}>
        {ais.map((a, i) => {
          const o = progressAt(f, 26 + i * 12, 12);
          return (
            <div
              key={a}
              style={{
                opacity: o,
                translate: `0px ${(1 - o) * 20}px`,
                width: 270,
                background: C.card,
                border: `1px solid ${C.cyan}`,
                borderRadius: 18,
                padding: "24px 18px",
                textAlign: "center",
                boxShadow: `0 0 24px ${C.cyan}22`,
              }}
            >
              <div style={{ fontSize: 40 }}>🤖</div>
              <div style={{ fontSize: 32, fontWeight: 700, marginTop: 8 }}>{a}</div>
            </div>
          );
        })}
      </div>
      <Rise from={70}>
        <div style={{ fontFamily: jbm, fontSize: 34, fontWeight: 800, color: C.green }}>
          GEO
        </div>
      </Rise>
    </Inner>
  );
};

// 12 Product vs Merchant
const S12: React.FC = () => {
  return (
    <Inner top={310}>
      <Kicker text="2 LOẠI KHÁC NHAU" color={C.cyan} />
      <div style={{ display: "flex", gap: 24 }}>
        <Card from={10} color={C.amber} style={{ width: 400, height: 320 }}>
          <div style={{ fontSize: 32, fontWeight: 800, color: C.amber }}>Product snippet</div>
          <div style={{ fontSize: 52, marginTop: 18 }}>★★★★★</div>
          <div style={{ fontSize: 30, color: C.dim, marginTop: 18 }}>cần review</div>
        </Card>
        <Card from={20} color={C.green} style={{ width: 400, height: 320 }}>
          <div style={{ fontSize: 32, fontWeight: 800, color: C.green }}>Merchant listing</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 18 }}>
            {["giá", "ship", "return"].map((t) => (
              <div key={t} style={{ fontSize: 32, display: "flex", gap: 12 }}>
                <span style={{ color: C.green }}>✓</span>
                <span>{t}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </Inner>
  );
};

// 13 collection carousel
const S13: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <Inner top={320}>
      <Kicker text="ITEMLIST" color={C.cyan} />
      <Rise from={6}>
        <div style={{ fontSize: 34, fontWeight: 700, color: C.dim }}>
          Trang collection
        </div>
      </Rise>
      <div style={{ display: "flex", gap: 16 }}>
        {[0, 1, 2, 3].map((i) => {
          const o = progressAt(f, 20 + i * 8, 12);
          return (
            <div
              key={i}
              style={{
                opacity: o,
                translate: `${(1 - o) * 30}px 0px`,
                width: 190,
                height: 230,
                background: C.card,
                border: `1px solid ${C.cyan}`,
                borderRadius: 16,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 60,
                boxShadow: `0 0 20px ${C.cyan}22`,
              }}
            >
              🛍️
            </div>
          );
        })}
      </div>
      <Rise from={60}>
        <div style={{ display: "flex", gap: 16 }}>
          <span style={{ fontSize: 30, fontWeight: 700, color: C.green, border: `1px solid ${C.green}`, borderRadius: 12, padding: "8px 18px" }}>
            top-level = carousel
          </span>
          <span style={{ fontSize: 30, fontWeight: 700, color: C.cyan, border: `1px solid ${C.cyan}`, borderRadius: 12, padding: "8px 18px" }}>
            AI hiểu cả nhóm
          </span>
        </div>
      </Rise>
    </Inner>
  );
};

// 14 result before/after
const S14: React.FC = () => {
  const f = useCurrentFrame();
  const rows = ["schema", "merchant", "carousel", "AI search"];
  return (
    <Inner top={300}>
      <Kicker text="SAU KHI FIX" color={C.green} />
      <div style={{ display: "flex", flexDirection: "column", gap: 14, width: 720 }}>
        {rows.map((r, i) => {
          const on = progressAt(f, 22 + i * 10, 12);
          return (
            <div
              key={r}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: C.card,
                border: `1px solid ${on > 0.5 ? C.green : C.border}`,
                borderRadius: 16,
                padding: "18px 26px",
                opacity: progressAt(f, 14 + i * 8, 10),
              }}
            >
              <span style={{ fontSize: 34, fontWeight: 700 }}>{r}</span>
              <span style={{ display: "flex", gap: 22, alignItems: "center" }}>
                <span style={{ fontSize: 32, color: C.red, opacity: 0.5 }}>✕</span>
                <span style={{ fontSize: 30, color: C.dim }}>→</span>
                <span style={{ fontSize: 38, color: on > 0.5 ? C.green : C.dim }}>✓</span>
              </span>
            </div>
          );
        })}
      </div>
    </Inner>
  );
};

// 15 CTA kit
const S15: React.FC = () => {
  const f = useCurrentFrame();
  const feats = ["audit schema", "tối ưu collection", "chuẩn GEO", "blog SEO"];
  return (
    <Inner top={290}>
      <Kicker text="OPEN SOURCE" color={C.green} />
      <Head from={6} size={62}>
        Claude Shopify Growth
      </Head>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 14, width: 820 }}>
        {feats.map((t, i) => {
          const o = progressAt(f, 24 + i * 9, 12);
          return (
            <div
              key={t}
              style={{
                opacity: o,
                translate: `0px ${(1 - o) * 18}px`,
                fontSize: 34,
                fontWeight: 700,
                color: C.cyan,
                background: C.card,
                border: `1px solid ${C.cyan}`,
                borderRadius: 14,
                padding: "14px 22px",
              }}
            >
              {t}
            </div>
          );
        })}
      </div>
      <Rise from={70}>
        <div style={{ fontFamily: jbm, fontSize: 30, color: C.dim, marginTop: 8 }}>
          github.com/chanktb/claude-shopify-growth
        </div>
      </Rise>
    </Inner>
  );
};

// 16 outro CTA
const S16: React.FC = () => {
  return (
    <Inner top={360}>
      <Kicker text="STORE SHOPIFY?" color={C.cyan} />
      <Head from={8} size={72}>
        Đang rối schema
        <br />
        cho store?
      </Head>
      <Rise from={30}>
        <div
          style={{
            fontSize: 40,
            fontWeight: 800,
            color: C.green,
            border: `2px solid ${C.green}`,
            borderRadius: 16,
            padding: "16px 30px",
            marginTop: 10,
            boxShadow: `0 0 26px ${C.green}44`,
          }}
        >
          Link ở dưới
        </div>
      </Rise>
    </Inner>
  );
};

const BODIES: Record<string, React.ReactNode> = {
  "1": <S1 />,
  "2": <S2 />,
  "3": <S3 />,
  "4": <S4 />,
  "5": <S5 />,
  "6": <S6 />,
  "7": <S7 />,
  "8": <S8 />,
  "9": <S9 />,
  "10": <S10 />,
  "11": <S11 />,
  "12": <S12 />,
  "13": <S13 />,
  "14": <S14 />,
  "15": <S15 />,
  "16": <S16 />,
};

export const ShopifySchema2Shop: React.FC = () => {
  let from = 0;
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      {SCENES.map((scene) => {
        const el = (
          <Sequence
            key={scene.id}
            from={from}
            durationInFrames={scene.durationInFrames}
            premountFor={45}
          >
            <Shell>{BODIES[scene.id]}</Shell>
            <KaraokeNeon words={scene.words} fontFamily={bvp} kw={C.cyan} />
            <Audio src={staticFile(scene.audio)} />
          </Sequence>
        );
        from += scene.durationInFrames;
        return el;
      })}
    </AbsoluteFill>
  );
};
