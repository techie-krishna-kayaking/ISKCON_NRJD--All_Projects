import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import toast from "react-hot-toast";
import TodayProgramsSection from "../components/TodayProgramsSection";
import WeeklyScheduleChart from "../components/WeeklyScheduleChart";

// ════════════════════════════════════════════════════════════════
// DESIGN TOKENS
// ════════════════════════════════════════════════════════════════
const C = {
  gold: "#c8903c",
  goldLight: "#f5c842",
  cream: "#fdf8f0",
  dark: "#2d1200",
  mid: "#5c3a14",
  muted: "#8b6840",
  light: "#a08060",
  green: "#16a34a",
  greenLight: "#4ade80",
  amber: "#d97706",
  amberLight: "#fbbf24",
  red: "#dc2626",
  redLight: "#f87171",
  blue: "#0284c7",
  blueLight: "#38bdf8",
  purple: "#7c3aed",
  purpleLight: "#a78bfa",
  teal: "#0891b2",
  tealLight: "#22d3ee",
};
const PALETTE = [
  C.gold,
  C.green,
  C.blue,
  C.purple,
  C.red,
  C.teal,
  C.amber,
  "#db2777",
  "#059669",
  "#9333ea",
];
function pctColor(p) {
  return p >= 80 ? C.green : p >= 40 ? C.amber : C.red;
}
function pctCls(p) {
  return p >= 80 ? "g" : p >= 40 ? "y" : "r";
}
function fmtDate(d) {
  if (!d) return "Never";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
function fmtShort(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}
function ini(n) {
  return (n || "?")
    .split(" ")
    .map((x) => x[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ════════════════════════════════════════════════════════════════
// TOOLTIP HOOK
// ════════════════════════════════════════════════════════════════
function useTooltip() {
  const [tip, setTip] = useState({ visible: false, x: 0, y: 0, content: null });
  const show = (e, content) =>
    setTip({ visible: true, x: e.clientX + 12, y: e.clientY - 28, content });
  const move = (e, content) =>
    setTip((p) => ({
      ...p,
      x: e.clientX + 12,
      y: e.clientY - 28,
      content: content || p.content,
    }));
  const hide = () => setTip((p) => ({ ...p, visible: false }));
  return { tip, show, move, hide };
}

// ════════════════════════════════════════════════════════════════
// TOOLTIP COMPONENT
// ════════════════════════════════════════════════════════════════
function Tooltip({ tip }) {
  if (!tip.visible || !tip.content) return null;
  return (
    <div
      style={{
        position: "fixed",
        left: tip.x,
        top: tip.y,
        zIndex: 9999,
        pointerEvents: "none",
        background: "rgba(20,6,0,0.92)",
        backdropFilter: "blur(8px)",
        border: "1px solid rgba(200,140,40,0.3)",
        borderRadius: 10,
        padding: "9px 13px",
        minWidth: 140,
        maxWidth: 220,
        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
        fontFamily: "'DM Sans',sans-serif",
      }}
    >
      {tip.content}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// CHART: DONUT with hover tooltips
// ════════════════════════════════════════════════════════════════
function DonutChart({ slices = [], size = 140, label = "", onSliceClick }) {
  const [hovered, setHovered] = useState(-1);
  const { tip, show, move, hide } = useTooltip();

  // Filter out zero-value slices — they produce degenerate SVG arcs
  const validSlices = slices.filter((s) => (s.value || 0) > 0);
  const total = validSlices.reduce((s, d) => s + (d.value || 0), 0);

  if (!total)
    return (
      <div
        style={{
          width: size,
          height: size,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: C.muted,
          fontSize: "0.72rem",
          flexDirection: "column",
          gap: 4,
          textAlign: "center",
        }}
      >
        <span style={{ fontSize: "1.2rem", opacity: 0.4 }}>○</span>
        <span>No data</span>
      </div>
    );

  const cx = size / 2,
    cy = size / 2,
    r = (size - 12) / 2,
    ir = r * 0.58;

  // Single slice — draw as full ring (two 180° arcs to avoid degenerate case)
  if (validSlices.length === 1) {
    const s = validSlices[0];
    const color = s.color || PALETTE[0];
    return (
      <>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          style={{ overflow: "visible", cursor: "pointer" }}
        >
          {/* Full outer ring */}
          <circle cx={cx} cy={cy} r={r} fill={color} opacity={0.85} />
          {/* Inner hole */}
          <circle cx={cx} cy={cy} r={ir} fill="#fff" />
          <text
            x={cx}
            y={cy - 6}
            textAnchor="middle"
            style={{
              fontFamily: "'Cinzel',serif",
              fontWeight: 700,
              fontSize: size * 0.14,
              fill: C.dark,
            }}
          >
            {total}
          </text>
          <text
            x={cx}
            y={cy + 10}
            textAnchor="middle"
            style={{ fontSize: size * 0.08, fill: C.muted }}
          >
            {label}
          </text>
        </svg>
        <Tooltip tip={tip} />
      </>
    );
  }

  let angle = -90;
  const arcs = validSlices.map((s, i) => {
    const sweep = (s.value / total) * 360;
    // Clamp sweep to avoid degenerate arcs (min 0.5°, max 359.5°)
    const safeSweep = Math.max(0.5, Math.min(359.5, sweep));
    const s1 = (angle * Math.PI) / 180,
      s2 = ((angle + safeSweep) * Math.PI) / 180;
    const x1 = cx + r * Math.cos(s1),
      y1 = cy + r * Math.sin(s1);
    const x2 = cx + r * Math.cos(s2),
      y2 = cy + r * Math.sin(s2);
    const ix1 = cx + ir * Math.cos(s2),
      iy1 = cy + ir * Math.sin(s2);
    const ix2 = cx + ir * Math.cos(s1),
      iy2 = cy + ir * Math.sin(s1);
    const lg = safeSweep > 180 ? 1 : 0;
    const d = `M ${x1} ${y1} A ${r} ${r} 0 ${lg} 1 ${x2} ${y2} L ${ix1} ${iy1} A ${ir} ${ir} 0 ${lg} 0 ${ix2} ${iy2} Z`;
    angle += sweep;
    return {
      d,
      color: s.color || PALETTE[i % PALETTE.length],
      label: s.label,
      value: s.value,
      extra: s.extra,
      p: Math.round((s.value / total) * 100),
      i,
    };
  });
  return (
    <>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ overflow: "visible", cursor: "pointer" }}
      >
        {arcs.map((a, i) => (
          <path
            key={i}
            d={a.d}
            fill={a.color}
            stroke="#fff"
            strokeWidth={hovered === i ? 3 : 1.5}
            transform={
              hovered === i
                ? `translate(${Math.cos(
                    (((-90 +
                      a.p / 2 +
                      arcs.slice(0, i).reduce((s, x) => s + x.p, 0)) *
                      Math.PI) /
                      180) *
                      3
                  )} ${Math.sin(
                    (((-90 +
                      a.p / 2 +
                      arcs.slice(0, i).reduce((s, x) => s + x.p, 0)) *
                      Math.PI) /
                      180) *
                      3
                  )})`
                : ""
            }
            opacity={hovered !== -1 && hovered !== i ? 0.6 : 1}
            style={{ transition: "opacity 0.2s, stroke-width 0.15s" }}
            onMouseEnter={(e) => {
              setHovered(i);
              show(
                e,
                <div>
                  <div
                    style={{
                      fontFamily: "'Cinzel',serif",
                      fontWeight: 700,
                      color: a.color,
                      marginBottom: 4,
                      fontSize: "0.8rem",
                    }}
                  >
                    {a.label}
                  </div>
                  <div
                    style={{
                      color: "rgba(255,220,160,0.9)",
                      fontSize: "0.76rem",
                    }}
                  >
                    Count: <strong style={{ color: "#fff" }}>{a.value}</strong>
                  </div>
                  <div
                    style={{
                      color: "rgba(255,220,160,0.9)",
                      fontSize: "0.76rem",
                    }}
                  >
                    Share: <strong style={{ color: "#fff" }}>{a.p}%</strong>
                  </div>
                  {a.extra &&
                    Object.entries(a.extra).map(([k, v]) => (
                      <div
                        key={k}
                        style={{
                          color: "rgba(255,220,160,0.8)",
                          fontSize: "0.72rem",
                        }}
                      >
                        {k}: <strong style={{ color: "#fff" }}>{v}</strong>
                      </div>
                    ))}
                </div>
              );
            }}
            onMouseMove={(e) => move(e)}
            onMouseLeave={() => {
              setHovered(-1);
              hide();
            }}
            onClick={() => onSliceClick && onSliceClick(a)}
          />
        ))}
        <text
          x={cx}
          y={cy - 6}
          textAnchor="middle"
          style={{
            fontFamily: "'Cinzel',serif",
            fontWeight: 700,
            fontSize: size * 0.14,
            fill: C.dark,
          }}
        >
          {total}
        </text>
        <text
          x={cx}
          y={cy + 10}
          textAnchor="middle"
          style={{ fontSize: size * 0.08, fill: C.muted }}
        >
          {label}
        </text>
      </svg>
      <Tooltip tip={tip} />
    </>
  );
}

// ════════════════════════════════════════════════════════════════
// CHART: VERTICAL BAR with hover
// ════════════════════════════════════════════════════════════════
function VBarChart({
  data = [],
  height = 100,
  showValues = true,
  colorFn,
  onBarClick,
}) {
  const { tip, show, move, hide } = useTooltip();
  const [hovered, setHovered] = useState(-1);
  if (!data.length)
    return (
      <div
        style={{
          textAlign: "center",
          color: C.muted,
          fontSize: "0.76rem",
          padding: "20px 0",
        }}
      >
        No data
      </div>
    );
  const max = Math.max(...data.map((d) => d.value || 0), 1);
  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: 3,
          height: height + 32,
          width: "100%",
          paddingTop: 16,
        }}
      >
        {data.map((d, i) => {
          const h = Math.max(4, ((d.value || 0) / max) * height);
          const color = colorFn ? colorFn(d, i) : PALETTE[i % PALETTE.length];
          const isH = hovered === i;
          return (
            <div
              key={i}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 0,
                cursor: onBarClick ? "pointer" : "default",
              }}
              onClick={() => onBarClick && onBarClick(d)}
            >
              {showValues && (
                <span
                  style={{
                    fontSize: "0.6rem",
                    fontWeight: 700,
                    color: isH ? C.dark : C.light,
                    marginBottom: 2,
                    lineHeight: 1,
                  }}
                >
                  {d.value}
                </span>
              )}
              <div
                style={{
                  width: "100%",
                  height,
                  display: "flex",
                  alignItems: "flex-end",
                }}
              >
                <div
                  style={{
                    width: "100%",
                    height: h,
                    background: isH ? color : `${color}cc`,
                    borderRadius: "4px 4px 0 0",
                    transition: "height 0.4s ease,opacity 0.15s",
                    boxShadow: isH ? `0 -2px 8px ${color}60` : "none",
                  }}
                  onMouseEnter={(e) => {
                    setHovered(i);
                    show(
                      e,
                      <div>
                        <div
                          style={{
                            fontFamily: "'Cinzel',serif",
                            fontWeight: 700,
                            color: color,
                            marginBottom: 4,
                            fontSize: "0.8rem",
                          }}
                        >
                          {d.label}
                        </div>
                        <div
                          style={{
                            color: "rgba(255,220,160,0.9)",
                            fontSize: "0.76rem",
                          }}
                        >
                          Count:{" "}
                          <strong style={{ color: "#fff" }}>{d.value}</strong>
                        </div>
                        {d.pct !== undefined && (
                          <div
                            style={{
                              color: "rgba(255,220,160,0.9)",
                              fontSize: "0.76rem",
                            }}
                          >
                            Rate:{" "}
                            <strong style={{ color: "#fff" }}>{d.pct}%</strong>
                          </div>
                        )}
                        {d.extra &&
                          Object.entries(d.extra).map(([k, v]) => (
                            <div
                              key={k}
                              style={{
                                color: "rgba(255,220,160,0.8)",
                                fontSize: "0.72rem",
                              }}
                            >
                              {k}:{" "}
                              <strong style={{ color: "#fff" }}>{v}</strong>
                            </div>
                          ))}
                      </div>
                    );
                  }}
                  onMouseMove={(e) => move(e)}
                  onMouseLeave={() => {
                    setHovered(-1);
                    hide();
                  }}
                />
              </div>
              <span
                style={{
                  fontSize: "0.58rem",
                  color: isH ? C.dark : C.muted,
                  textAlign: "center",
                  maxWidth: 36,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  marginTop: 3,
                  lineHeight: 1,
                }}
                title={d.label}
              >
                {d.label}
              </span>
            </div>
          );
        })}
      </div>
      <Tooltip tip={tip} />
    </>
  );
}

// ════════════════════════════════════════════════════════════════
// CHART: STACKED BAR
// ════════════════════════════════════════════════════════════════
function StackedBarChart({ data = [], height = 80, onBarClick }) {
  const { tip, show, move, hide } = useTooltip();
  const [hovered, setHovered] = useState(-1);
  if (!data.length) return null;
  const max = Math.max(
    ...data.map((d) => (d.present || 0) + (d.absent || 0)),
    1
  );
  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: 3,
          height: height + 28,
          width: "100%",
          paddingTop: 12,
        }}
      >
        {data.map((d, i) => {
          const total = (d.present || 0) + (d.absent || 0);
          const hp = (d.present / max) * height;
          const ha = (d.absent / max) * height;
          const isH = hovered === i;
          return (
            <div
              key={i}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 0,
                cursor: onBarClick ? "pointer" : "default",
              }}
              onClick={() => onBarClick && onBarClick(d)}
              onMouseEnter={(e) => {
                setHovered(i);
                show(
                  e,
                  <div>
                    <div
                      style={{
                        fontFamily: "'Cinzel',serif",
                        fontWeight: 700,
                        color: C.goldLight,
                        marginBottom: 4,
                        fontSize: "0.78rem",
                      }}
                    >
                      {d.label}
                    </div>
                    <div style={{ color: "#4ade80", fontSize: "0.74rem" }}>
                      Present:{" "}
                      <strong style={{ color: "#fff" }}>{d.present}</strong>
                    </div>
                    <div style={{ color: "#f87171", fontSize: "0.74rem" }}>
                      Absent:{" "}
                      <strong style={{ color: "#fff" }}>{d.absent}</strong>
                    </div>
                    <div
                      style={{
                        color: "rgba(255,220,160,0.8)",
                        fontSize: "0.72rem",
                      }}
                    >
                      Total: <strong style={{ color: "#fff" }}>{total}</strong>
                    </div>
                    {total > 0 && (
                      <div
                        style={{
                          color: "rgba(255,220,160,0.8)",
                          fontSize: "0.72rem",
                        }}
                      >
                        Rate:{" "}
                        <strong style={{ color: "#fff" }}>
                          {Math.round((d.present / total) * 100)}%
                        </strong>
                      </div>
                    )}
                  </div>
                );
              }}
              onMouseMove={(e) => move(e)}
              onMouseLeave={() => {
                setHovered(-1);
                hide();
              }}
            >
              <div
                style={{
                  width: "100%",
                  height,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-end",
                  opacity: isH ? 1 : 0.82,
                  transition: "opacity 0.15s",
                }}
              >
                <div
                  style={{
                    width: "100%",
                    height: Math.max(2, hp),
                    background: C.green,
                    borderRadius: "0",
                  }}
                />
                <div
                  style={{
                    width: "100%",
                    height: Math.max(0, ha),
                    background: C.red,
                    borderRadius: "0 0 3px 3px",
                  }}
                />
              </div>
              <span
                style={{
                  fontSize: "0.56rem",
                  color: isH ? C.dark : C.muted,
                  textAlign: "center",
                  maxWidth: 34,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  marginTop: 3,
                }}
              >
                {d.label}
              </span>
            </div>
          );
        })}
      </div>
      <Tooltip tip={tip} />
    </>
  );
}

// ════════════════════════════════════════════════════════════════
// CHART: LINE + BAR combo — bars=present count, line=attendance%
// ════════════════════════════════════════════════════════════════
function LineBarCombo({
  data = [],
  height = 100,
  barColor,
  lineColor = "#f5c842",
}) {
  const { tip, show, move, hide } = useTooltip();
  const [hovered, setHovered] = useState(-1);
  if (data.length < 2)
    return (
      <div
        style={{
          textAlign: "center",
          color: C.muted,
          fontSize: "0.76rem",
          padding: "20px 0",
        }}
      >
        Not enough session data.
      </div>
    );

  const w = 320,
    h = height;
  const n = data.length;
  const gap = 3;
  const barW = Math.max(6, Math.floor(w / n) - gap);
  const maxPresent = Math.max(...data.map((d) => d.present || 0), 1);

  // Each bar is uniformly spaced
  const barX = (i) => Math.floor((i / n) * w) + gap / 2;

  // Line uses center of each bar
  const linePts = data.map((d, i) => [
    barX(i) + barW / 2,
    h - ((d.pct || 0) / 100) * h,
  ]);
  const polyline = linePts.map((p) => p.join(",")).join(" ");
  const areaPath = `M ${linePts[0][0]} ${h} ${linePts
    .map((p) => `L ${p[0]} ${p[1]}`)
    .join(" ")} L ${linePts[linePts.length - 1][0]} ${h} Z`;

  const bColor = barColor || C.blue;
  const gradId = `lbgrad_${Math.random().toString(36).slice(2, 7)}`;

  return (
    <>
      <svg
        width="100%"
        height={h + 28}
        viewBox={`0 0 ${w} ${h + 28}`}
        style={{ overflow: "visible" }}
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={lineColor} stopOpacity={0.15} />
            <stop offset="100%" stopColor={lineColor} stopOpacity={0.01} />
          </linearGradient>
          <linearGradient id={`${gradId}b`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={bColor} stopOpacity={0.95} />
            <stop offset="100%" stopColor={bColor} stopOpacity={0.5} />
          </linearGradient>
        </defs>

        {/* Area fill under line */}
        <path d={areaPath} fill={`url(#${gradId})`} />

        {/* Bars — height based on present count */}
        {data.map((d, i) => {
          const bh = Math.max(3, ((d.present || 0) / maxPresent) * (h * 0.85));
          const bx = barX(i);
          const by = h - bh;
          const isH = hovered === i;
          return (
            <g key={i}>
              <rect
                x={bx}
                y={by}
                width={barW}
                height={bh}
                fill={isH ? `url(#${gradId}b)` : bColor}
                opacity={isH ? 1 : 0.55}
                rx={3}
                style={{ transition: "opacity 0.15s" }}
              />
              {/* Wide invisible hover target covering full height */}
              <rect
                x={bx - 2}
                y={0}
                width={barW + 4}
                height={h}
                fill="transparent"
                style={{ cursor: "crosshair" }}
                onMouseEnter={(e) => {
                  setHovered(i);
                  show(
                    e,
                    <div>
                      <div
                        style={{
                          fontFamily: "'Cinzel',serif",
                          fontWeight: 700,
                          color: lineColor,
                          marginBottom: 4,
                          fontSize: "0.78rem",
                        }}
                      >
                        {d.date || d.label || `Session ${i + 1}`}
                      </div>
                      <div style={{ color: "#4ade80", fontSize: "0.74rem" }}>
                        Present:{" "}
                        <strong style={{ color: "#fff" }}>{d.present}</strong>
                      </div>
                      <div style={{ color: "#f87171", fontSize: "0.74rem" }}>
                        Absent:{" "}
                        <strong style={{ color: "#fff" }}>{d.absent}</strong>
                      </div>
                      <div
                        style={{
                          color: "rgba(255,220,160,0.9)",
                          fontSize: "0.74rem",
                        }}
                      >
                        Total:{" "}
                        <strong style={{ color: "#fff" }}>{d.total}</strong>
                      </div>
                      <div
                        style={{
                          color: "rgba(255,220,160,0.9)",
                          fontSize: "0.74rem",
                        }}
                      >
                        Rate:{" "}
                        <strong style={{ color: "#fff" }}>{d.pct}%</strong>
                      </div>
                    </div>
                  );
                }}
                onMouseMove={(e) => move(e)}
                onMouseLeave={() => {
                  setHovered(-1);
                  hide();
                }}
              />
            </g>
          );
        })}

        {/* Line on top */}
        <polyline
          points={polyline}
          fill="none"
          stroke={lineColor}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ pointerEvents: "none" }}
        />

        {/* Dots on line */}
        {linePts.map((p, i) => (
          <circle
            key={i}
            cx={p[0]}
            cy={p[1]}
            r={hovered === i ? 4.5 : 3}
            fill={lineColor}
            stroke="#fff"
            strokeWidth={1.5}
            style={{ transition: "r 0.15s", pointerEvents: "none" }}
          />
        ))}

        {/* X-axis labels */}
        {data.map((d, i) => (
          <text
            key={i}
            x={barX(i) + barW / 2}
            y={h + 18}
            textAnchor="middle"
            style={{
              fontSize: 9,
              fill: C.light,
              fontFamily: "'DM Sans',sans-serif",
            }}
          >
            {(d.date || d.label || "").slice(-5)}
          </text>
        ))}
      </svg>
      <Tooltip tip={tip} />
    </>
  );
}

// ════════════════════════════════════════════════════════════════
// CHART: AREA CHART (cumulative)
// ════════════════════════════════════════════════════════════════
function AreaChart({ data = [], height = 70, color = C.gold }) {
  const { tip, show, move, hide } = useTooltip();
  const [hovered, setHovered] = useState(-1);
  if (data.length < 2) return null;
  const vals = data.map((d) => d.value || d.cumPresent || 0);
  const max = Math.max(...vals, 1);
  const w = 320,
    h = height;
  const pts = data.map((d, i) => [
    (i / (data.length - 1)) * w,
    h - (vals[i] / max) * h,
  ]);
  const poly = pts.map((p) => p.join(",")).join(" ");
  const area = `M ${pts[0][0]} ${h} ${pts
    .map((p) => `L ${p[0]} ${p[1]}`)
    .join(" ")} L ${pts[pts.length - 1][0]} ${h} Z`;
  return (
    <>
      <svg
        width="100%"
        height={h + 20}
        viewBox={`0 0 ${w} ${h + 20}`}
        style={{ overflow: "visible" }}
      >
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#areaGrad)" />
        <polyline
          points={poly}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {pts.map((p, i) => (
          <circle
            key={i}
            cx={p[0]}
            cy={p[1]}
            r={hovered === i ? 4 : 0}
            fill={color}
            style={{ transition: "r 0.15s" }}
          />
        ))}
        {data.map((d, i) => (
          <rect
            key={i}
            x={(i / (data.length - 1)) * w - 10}
            y={0}
            width={20}
            height={h}
            fill="transparent"
            onMouseEnter={(e) => {
              setHovered(i);
              show(
                e,
                <div>
                  <div
                    style={{
                      fontFamily: "'Cinzel',serif",
                      fontWeight: 700,
                      color: color,
                      marginBottom: 4,
                      fontSize: "0.78rem",
                    }}
                  >
                    {d.label}
                  </div>
                  <div
                    style={{
                      color: "rgba(255,220,160,0.9)",
                      fontSize: "0.74rem",
                    }}
                  >
                    Cumulative:{" "}
                    <strong style={{ color: "#fff" }}>
                      {d.cumPresent || d.value}
                    </strong>
                  </div>
                  {d.pct !== undefined && (
                    <div
                      style={{
                        color: "rgba(255,220,160,0.9)",
                        fontSize: "0.74rem",
                      }}
                    >
                      Month %:{" "}
                      <strong style={{ color: "#fff" }}>{d.pct}%</strong>
                    </div>
                  )}
                </div>
              );
            }}
            onMouseMove={(e) => move(e)}
            onMouseLeave={() => {
              setHovered(-1);
              hide();
            }}
          />
        ))}
        {data
          .filter((_, i) => i % Math.ceil(data.length / 6) === 0)
          .map((d, i, arr) => {
            const realI = data.indexOf(d);
            return (
              <text
                key={i}
                x={(realI / (data.length - 1)) * w}
                y={h + 16}
                textAnchor="middle"
                style={{ fontSize: 9, fill: C.light }}
              >
                {d.label?.split(" ")[0]}
              </text>
            );
          })}
      </svg>
      <Tooltip tip={tip} />
    </>
  );
}

// ════════════════════════════════════════════════════════════════
// CHART: SPARKLINE (inline mini)
// ════════════════════════════════════════════════════════════════
function Sparkline({ data = [], width = 72, height = 24, color = C.gold }) {
  if (!data.length)
    return <span style={{ fontSize: "0.64rem", color: C.muted }}>—</span>;
  const max = Math.max(...data, 1);
  const pts = data
    .map(
      (v, i) =>
        `${(i / Math.max(data.length - 1, 1)) * width},${
          height - (v / max) * height
        }`
    )
    .join(" ");
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ overflow: "visible" }}
    >
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {data.length > 0 &&
        (() => {
          const lx = width,
            ly = height - (data[data.length - 1] / max) * height;
          return <circle cx={lx} cy={ly} r={2.5} fill={color} />;
        })()}
    </svg>
  );
}

// ════════════════════════════════════════════════════════════════
// CHART: RADAR
// ════════════════════════════════════════════════════════════════
function RadarChart({ metrics = [], size = 120 }) {
  if (!metrics.length) return null;
  const n = metrics.length,
    cx = size / 2,
    cy = size / 2,
    r = (size - 24) / 2;
  const angles = metrics.map((_, i) => (i / n) * 2 * Math.PI - Math.PI / 2);
  const pts = metrics.map((m, i) => [
    cx + r * (m.value / 100) * Math.cos(angles[i]),
    cy + r * (m.value / 100) * Math.sin(angles[i]),
  ]);
  const polygon = pts.map((p) => p.join(",")).join(" ");
  const gridPts = (scale) =>
    metrics
      .map((_, i) => [
        cx + r * scale * Math.cos(angles[i]),
        cy + r * scale * Math.sin(angles[i]),
      ])
      .map((p) => p.join(","))
      .join(" ");
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {[0.25, 0.5, 0.75, 1].map((s) => (
        <polygon
          key={s}
          points={gridPts(s)}
          fill="none"
          stroke="rgba(200,140,40,0.15)"
          strokeWidth={1}
        />
      ))}
      {metrics.map((_, i) => (
        <line
          key={i}
          x1={cx}
          y1={cy}
          x2={cx + r * Math.cos(angles[i])}
          y2={cy + r * Math.sin(angles[i])}
          stroke="rgba(200,140,40,0.1)"
          strokeWidth={1}
        />
      ))}
      <polygon
        points={polygon}
        fill={`${C.gold}30`}
        stroke={C.gold}
        strokeWidth={2}
      />
      {pts.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r={3} fill={C.gold}>
          <title>
            {metrics[i].label}: {metrics[i].value}%
          </title>
        </circle>
      ))}
      {metrics.map((m, i) => {
        const lx = cx + (r + 12) * Math.cos(angles[i]),
          ly = cy + (r + 12) * Math.sin(angles[i]);
        return (
          <text
            key={i}
            x={lx}
            y={ly}
            textAnchor="middle"
            dominantBaseline="middle"
            style={{
              fontSize: 8,
              fill: C.muted,
              fontFamily: "'DM Sans',sans-serif",
            }}
          >
            {m.label}
          </text>
        );
      })}
    </svg>
  );
}

// ════════════════════════════════════════════════════════════════
// CHART: FREQUENCY LINE — attendance trend per frequency group
// ════════════════════════════════════════════════════════════════
// ════════════════════════════════════════════════════════════════
// CHART: FREQUENCY LINE — real per-frequency monthly attendance lines
// Each frequency group gets its own line from actual monthly breakdown
// ════════════════════════════════════════════════════════════════
function FrequencyLineChart({ byFrequency = [] }) {
  const { tip, show, move, hide } = useTooltip();
  const [activeFreq, setActiveFreq] = useState(null);

  const freqColors = {
    daily: C.teal,
    weekly: C.blue,
    biweekly: C.purple,
    fortnightly: C.purple,
    monthly: C.amber,
  };
  const getFreqColor = (f) =>
    freqColors[(f || "").toLowerCase().replace(/[\s-]/g, "")] || C.gold;

  // Build a unified month axis from all frequency monthlyPoints
  const allLabels = [
    ...new Set(
      byFrequency.flatMap((fr) => (fr.monthlyPoints || []).map((m) => m.label))
    ),
  ].sort();

  const hasData = byFrequency.some((fr) => (fr.monthlyPoints || []).length > 0);

  if (!byFrequency.length || !hasData)
    return (
      <div
        style={{
          textAlign: "center",
          color: C.muted,
          fontSize: "0.76rem",
          padding: "28px 0",
        }}
      >
        No frequency data available yet. Mark attendance to see trends.
      </div>
    );

  const w = 340,
    h = 110;
  const padL = 28,
    padB = 22,
    padT = 12,
    padR = 8;
  const iw = w - padL - padR,
    ih = h - padT - padB;
  const n = allLabels.length;

  return (
    <>
      {/* Legend / filter toggles */}
      <div
        style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}
      >
        {byFrequency.map((fr, i) => {
          const color = getFreqColor(fr.frequency);
          const isActive = !activeFreq || activeFreq === fr.frequency;
          const hasMonthly = (fr.monthlyPoints || []).length > 0;
          return (
            <button
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "5px 12px",
                borderRadius: 20,
                border: `1.5px solid ${color}${isActive ? "80" : "30"}`,
                background: isActive ? `${color}18` : "rgba(200,140,40,0.04)",
                color: isActive ? color : C.muted,
                fontSize: "0.72rem",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.15s",
                opacity: hasMonthly ? 1 : 0.45,
              }}
              onClick={() =>
                setActiveFreq((prev) =>
                  prev === fr.frequency ? null : fr.frequency
                )
              }
            >
              <svg width={20} height={2} style={{ flexShrink: 0 }}>
                <line
                  x1={0}
                  y1={1}
                  x2={20}
                  y2={1}
                  stroke={color}
                  strokeWidth={2}
                  strokeDasharray={
                    fr.frequency?.toLowerCase() === "daily" ? "none" : "none"
                  }
                />
              </svg>
              {fr.frequency}
              <span style={{ fontFamily: "'Cinzel',serif", fontWeight: 700 }}>
                {fr.pct}%
              </span>
              {!hasMonthly && (
                <span style={{ fontSize: "0.6rem", color: C.muted }}>
                  (no data)
                </span>
              )}
            </button>
          );
        })}
      </div>

      <svg
        width="100%"
        height={h + padB + 8}
        viewBox={`0 0 ${w} ${h + padB + 8}`}
        style={{ overflow: "visible" }}
      >
        {/* Y-axis grid + labels */}
        {[0, 25, 50, 75, 100].map((yv) => {
          const y = padT + (1 - yv / 100) * ih;
          return (
            <g key={yv}>
              <line
                x1={padL}
                y1={y}
                x2={padL + iw}
                y2={y}
                stroke="rgba(200,140,40,0.1)"
                strokeWidth={1}
                strokeDasharray="4,3"
              />
              <text
                x={padL - 4}
                y={y + 3}
                textAnchor="end"
                style={{
                  fontSize: 8,
                  fill: C.light,
                  fontFamily: "'DM Sans',sans-serif",
                }}
              >
                {yv}%
              </text>
            </g>
          );
        })}

        {/* Axes */}
        <line
          x1={padL}
          y1={padT}
          x2={padL}
          y2={padT + ih}
          stroke="rgba(200,140,40,0.2)"
          strokeWidth={1}
        />
        <line
          x1={padL}
          y1={padT + ih}
          x2={padL + iw}
          y2={padT + ih}
          stroke="rgba(200,140,40,0.2)"
          strokeWidth={1}
        />

        {/* One line per frequency */}
        {byFrequency.map((fr, fi) => {
          if (activeFreq && activeFreq !== fr.frequency) return null;
          const pts = fr.monthlyPoints || [];
          if (!pts.length) return null;
          const color = getFreqColor(fr.frequency);

          // Map each point to (x,y) using unified label axis
          const coords = pts.map((m) => {
            const xi = allLabels.indexOf(m.label);
            const x = padL + (xi / Math.max(n - 1, 1)) * iw;
            const y = padT + (1 - m.pct / 100) * ih;
            return { x, y, ...m };
          });

          if (coords.length < 1) return null;
          const polyline = coords.map((c) => `${c.x},${c.y}`).join(" ");

          // Area fill
          const area =
            coords.length >= 2
              ? `M ${coords[0].x} ${padT + ih} ${coords
                  .map((c) => `L ${c.x} ${c.y}`)
                  .join(" ")} L ${coords[coords.length - 1].x} ${padT + ih} Z`
              : null;

          return (
            <g key={fi}>
              {area && <path d={area} fill={color} fillOpacity={0.08} />}
              {coords.length >= 2 && (
                <polyline
                  points={polyline}
                  fill="none"
                  stroke={color}
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
              {coords.map((c, ci) => (
                <circle
                  key={ci}
                  cx={c.x}
                  cy={c.y}
                  r={4}
                  fill={color}
                  stroke="#fff"
                  strokeWidth={1.5}
                  style={{ cursor: "crosshair" }}
                  onMouseEnter={(e) =>
                    show(
                      e,
                      <div>
                        <div
                          style={{
                            fontFamily: "'Cinzel',serif",
                            fontWeight: 700,
                            color,
                            marginBottom: 4,
                            fontSize: "0.8rem",
                          }}
                        >
                          {fr.frequency}
                        </div>
                        <div
                          style={{
                            color: "rgba(255,220,160,0.9)",
                            fontSize: "0.74rem",
                          }}
                        >
                          Month:{" "}
                          <strong style={{ color: "#fff" }}>{c.label}</strong>
                        </div>
                        <div style={{ color: "#4ade80", fontSize: "0.74rem" }}>
                          Present:{" "}
                          <strong style={{ color: "#fff" }}>{c.present}</strong>
                        </div>
                        <div
                          style={{
                            color: "rgba(255,220,160,0.9)",
                            fontSize: "0.74rem",
                          }}
                        >
                          Total:{" "}
                          <strong style={{ color: "#fff" }}>{c.total}</strong>
                        </div>
                        <div
                          style={{
                            color: "rgba(255,220,160,0.9)",
                            fontSize: "0.74rem",
                          }}
                        >
                          Att%:{" "}
                          <strong style={{ color: "#fff" }}>{c.pct}%</strong>
                        </div>
                        <div
                          style={{
                            color: "rgba(255,220,160,0.8)",
                            fontSize: "0.72rem",
                          }}
                        >
                          Programs:{" "}
                          <strong style={{ color: "#fff" }}>
                            {fr.programCount}
                          </strong>
                        </div>
                      </div>
                    )
                  }
                  onMouseMove={(e) => move(e)}
                  onMouseLeave={() => hide()}
                />
              ))}
              {/* Value label on last point */}
              {coords.length > 0 && (
                <text
                  x={coords[coords.length - 1].x + 5}
                  y={coords[coords.length - 1].y + 3}
                  style={{
                    fontSize: 9,
                    fill: color,
                    fontWeight: 700,
                    fontFamily: "'DM Sans',sans-serif",
                  }}
                >
                  {coords[coords.length - 1].pct}%
                </text>
              )}
            </g>
          );
        })}

        {/* X-axis labels — show every 2nd label to avoid crowding */}
        {allLabels.map((lbl, i) => {
          if (n > 8 && i % 2 !== 0) return null;
          const x = padL + (i / Math.max(n - 1, 1)) * iw;
          return (
            <text
              key={i}
              x={x}
              y={padT + ih + 16}
              textAnchor="middle"
              style={{
                fontSize: 8,
                fill: C.light,
                fontFamily: "'DM Sans',sans-serif",
              }}
            >
              {lbl.split(" ")[0]}
            </text>
          );
        })}
      </svg>
      <Tooltip tip={tip} />
    </>
  );
}

// ════════════════════════════════════════════════════════════════
// CHART: ADVANCED PROGRAM TYPE BUBBLE ANALYSIS
// Shows each program type as a bubble: size=devotees, x=sessions, y=attendance%
// ════════════════════════════════════════════════════════════════
function ProgramTypeBubble({ byProgram = [], onClick }) {
  const { tip, show, move, hide } = useTooltip();
  const [hovered, setHovered] = useState(-1);

  // Group by program type
  const typeMap = {};
  byProgram.forEach((p) => {
    const t = p.programType || "Unknown";
    if (!typeMap[t])
      typeMap[t] = {
        type: t,
        programs: [],
        totalDev: 0,
        totalPct: 0,
        totalSessions: 0,
      };
    typeMap[t].programs.push(p);
    typeMap[t].totalDev += p.devoteeCount || 0;
    typeMap[t].totalPct += p.attendance_pct || 0;
    typeMap[t].totalSessions += p.sessionCount || 0;
  });
  const typeData = Object.values(typeMap).map((t, i) => ({
    ...t,
    avgPct: t.programs.length ? Math.round(t.totalPct / t.programs.length) : 0,
    color: PALETTE[i % PALETTE.length],
    programCount: t.programs.length,
  }));

  if (!typeData.length)
    return (
      <div
        style={{
          textAlign: "center",
          color: C.muted,
          fontSize: "0.76rem",
          padding: "20px 0",
        }}
      >
        No data.
      </div>
    );

  const maxDev = Math.max(...typeData.map((t) => t.totalDev), 1);
  const maxSess = Math.max(...typeData.map((t) => t.totalSessions), 1);
  const w = 300,
    h = 140;
  const padL = 30,
    padB = 20,
    padT = 10,
    padR = 10;
  const iw = w - padL - padR,
    ih = h - padT - padB;

  return (
    <>
      <svg
        width="100%"
        height={h + 24}
        viewBox={`0 0 ${w} ${h + 24}`}
        style={{ overflow: "visible" }}
      >
        {/* Axes */}
        <line
          x1={padL}
          y1={padT}
          x2={padL}
          y2={padT + ih}
          stroke="rgba(200,140,40,0.2)"
          strokeWidth={1}
        />
        <line
          x1={padL}
          y1={padT + ih}
          x2={padL + iw}
          y2={padT + ih}
          stroke="rgba(200,140,40,0.2)"
          strokeWidth={1}
        />
        <text
          x={padL - 4}
          y={padT + 4}
          textAnchor="end"
          style={{ fontSize: 7, fill: C.light }}
        >
          100%
        </text>
        <text
          x={padL - 4}
          y={padT + ih / 2 + 3}
          textAnchor="end"
          style={{ fontSize: 7, fill: C.light }}
        >
          50%
        </text>
        <text
          x={padL - 4}
          y={padT + ih + 3}
          textAnchor="end"
          style={{ fontSize: 7, fill: C.light }}
        >
          0%
        </text>
        <text
          x={padL + iw / 2}
          y={padT + ih + 22}
          textAnchor="middle"
          style={{ fontSize: 8, fill: C.light }}
        >
          ← Sessions →
        </text>

        {/* Grid */}
        {[25, 50, 75].map((g) => (
          <line
            key={g}
            x1={padL}
            y1={padT + (1 - g / 100) * ih}
            x2={padL + iw}
            y2={padT + (1 - g / 100) * ih}
            stroke="rgba(200,140,40,0.07)"
            strokeWidth={1}
            strokeDasharray="3,3"
          />
        ))}

        {/* Bubbles */}
        {typeData.map((t, i) => {
          const cx = padL + (t.totalSessions / maxSess) * iw;
          const cy = padT + (1 - t.avgPct / 100) * ih;
          const r = Math.max(8, Math.min(26, 8 + (t.totalDev / maxDev) * 18));
          const isH = hovered === i;
          return (
            <g
              key={i}
              style={{ cursor: "pointer" }}
              onMouseEnter={(e) => {
                setHovered(i);
                show(
                  e,
                  <div>
                    <div
                      style={{
                        fontFamily: "'Cinzel',serif",
                        fontWeight: 700,
                        color: t.color,
                        marginBottom: 4,
                        fontSize: "0.78rem",
                      }}
                    >
                      {t.type}
                    </div>
                    <div
                      style={{
                        color: "rgba(255,220,160,0.9)",
                        fontSize: "0.72rem",
                      }}
                    >
                      Programs:{" "}
                      <strong style={{ color: "#fff" }}>
                        {t.programCount}
                      </strong>
                    </div>
                    <div
                      style={{
                        color: "rgba(255,220,160,0.9)",
                        fontSize: "0.72rem",
                      }}
                    >
                      Devotees:{" "}
                      <strong style={{ color: "#fff" }}>{t.totalDev}</strong>
                    </div>
                    <div
                      style={{
                        color: "rgba(255,220,160,0.9)",
                        fontSize: "0.72rem",
                      }}
                    >
                      Avg Att%:{" "}
                      <strong style={{ color: "#fff" }}>{t.avgPct}%</strong>
                    </div>
                    <div
                      style={{
                        color: "rgba(255,220,160,0.9)",
                        fontSize: "0.72rem",
                      }}
                    >
                      Sessions:{" "}
                      <strong style={{ color: "#fff" }}>
                        {t.totalSessions}
                      </strong>
                    </div>
                  </div>
                );
              }}
              onMouseMove={(e) => move(e)}
              onMouseLeave={() => {
                setHovered(-1);
                hide();
              }}
              onClick={() => onClick && onClick(t.type)}
            >
              <circle
                cx={cx}
                cy={cy}
                r={r}
                fill={t.color}
                fillOpacity={isH ? 0.9 : 0.55}
                stroke={t.color}
                strokeWidth={isH ? 2 : 1}
                style={{ transition: "all 0.18s" }}
              />
              <text
                x={cx}
                y={cy + 3}
                textAnchor="middle"
                style={{
                  fontSize: Math.max(7, Math.min(10, r * 0.7)),
                  fill: "#fff",
                  fontWeight: 700,
                  pointerEvents: "none",
                }}
              >
                {t.type.slice(0, 4)}
              </text>
            </g>
          );
        })}
      </svg>
      {/* Legend */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
        {typeData.map((t, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              cursor: "pointer",
            }}
            onClick={() => onClick && onClick(t.type)}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: t.color,
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: "0.66rem", color: C.mid }}>
              {t.type}:{" "}
              <strong style={{ color: "#2d1200" }}>{t.avgPct}%</strong>
            </span>
          </div>
        ))}
      </div>
      <Tooltip tip={tip} />
    </>
  );
}
const css = `
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=DM+Sans:wght@300;400;500;600;700&display=swap');

*, *::before, *::after { box-sizing: border-box; }
.oa { min-height:100%; background:#f4ede4; font-family:'DM Sans',sans-serif; }

/* ── Banner ── */
.oa-banner {
  background:linear-gradient(135deg,#0d0300 0%,#2a0e00 20%,#5a2400 55%,#8b4000 80%,#b86000 100%);
  padding:28px 0 0; position:relative; overflow:hidden;
}
.oa-banner::before {
  content:''; position:absolute; inset:0;
  background:radial-gradient(ellipse at 70% 40%,rgba(200,120,0,0.15) 0%,transparent 55%),
             radial-gradient(ellipse at 20% 80%,rgba(80,20,0,0.2) 0%,transparent 50%);
  pointer-events:none;
}
.oa-in { max-width:1320px; margin:0 auto; padding:0 24px; position:relative; z-index:1; }
.oa-br { display:flex; align-items:flex-start; justify-content:space-between; gap:16px; flex-wrap:wrap; margin-bottom:20px; }
.oa-ey { font-family:'Cinzel',serif; font-size:0.6rem; font-weight:700; color:rgba(200,150,60,0.85); letter-spacing:0.24em; text-transform:uppercase; margin-bottom:8px; display:flex; align-items:center; gap:8px; }
.oa-ey::before,.oa-ey::after { content:''; width:22px; height:1px; background:rgba(200,150,60,0.4); }
.oa-tt { font-family:'Cinzel',serif; font-size:clamp(1.4rem,3vw,2rem); font-weight:700; color:#fff; margin:0 0 5px; line-height:1.2; }
.oa-tt em { color:#f5c842; font-style:normal; }
.oa-sb { color:rgba(255,210,140,0.6); font-size:0.85rem; margin:0; }

/* Strip */
.oa-strip { display:grid; grid-template-columns:repeat(4,1fr); border-top:1px solid rgba(255,255,255,0.08); margin:0 -24px; }
.oa-si { padding:13px 18px; border-right:1px solid rgba(255,255,255,0.07); position:relative; }
.oa-si:last-child { border-right:none; }
.oa-si::before { content:''; position:absolute; top:0; left:0; right:0; height:2px; }
.oa-s0::before{background:linear-gradient(90deg,#f5c842,transparent);}
.oa-s1::before{background:linear-gradient(90deg,#4ade80,transparent);}
.oa-s2::before{background:linear-gradient(90deg,#a78bfa,transparent);}
.oa-s3::before{background:linear-gradient(90deg,#f87171,transparent);}
.oa-sv { font-family:'Cinzel',serif; font-size:1.3rem; font-weight:700; color:#fff; line-height:1; margin-bottom:2px; }
.oa-sl { font-size:0.58rem; font-weight:600; color:rgba(255,210,150,0.5); text-transform:uppercase; letter-spacing:0.1em; }

/* ── Today programs bar ── */
.oa-today { background:linear-gradient(to right,rgba(200,140,40,0.12),rgba(200,140,40,0.06)); border-bottom:2px solid rgba(200,140,40,0.2); padding:10px 24px; }
.oa-today-inner { max-width:1320px; margin:0 auto; display:flex; align-items:center; gap:12px; flex-wrap:wrap; }
.oa-today-lbl { font-family:'Cinzel',serif; font-size:0.65rem; font-weight:700; color:#7a4a10; letter-spacing:0.12em; text-transform:uppercase; flex-shrink:0; }
.oa-today-chip {
  display:flex; align-items:center; gap:7px; padding:5px 12px;
  border-radius:20px; border:1.5px solid; font-size:0.78rem; font-weight:600;
  cursor:pointer; transition:all 0.15s;
}
.oa-today-chip.marked   { background:rgba(22,163,74,0.1);  border-color:rgba(22,163,74,0.3);  color:#15803d; }
.oa-today-chip.unmarked { background:rgba(220,38,38,0.08); border-color:rgba(220,38,38,0.25); color:#b91c1c; }
.oa-today-chip.daily    { background:rgba(200,140,40,0.1); border-color:rgba(200,140,40,0.3); color:#7a3200; }
.oa-today-dot { width:7px; height:7px; border-radius:50%; flex-shrink:0; }
.oa-today-dot.marked   { background:#16a34a; }
.oa-today-dot.unmarked { background:#dc2626; animation:pulse 1.5s ease-in-out infinite; }
.oa-today-dot.daily    { background:#c8903c; }
@keyframes pulse { 0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(220,38,38,0.4)} 50%{opacity:0.6;box-shadow:0 0 0 4px rgba(220,38,38,0)} }

/* ── Filter bar ── */
.oa-fb { background:#fff; border-bottom:1px solid rgba(200,140,40,0.14); padding:10px 24px; position:sticky; top:0; z-index:100; box-shadow:0 2px 12px rgba(61,23,0,0.07); }
.oa-fb-in { max-width:1320px; margin:0 auto; display:flex; flex-wrap:wrap; gap:6px; align-items:center; }
.oa-sel {
  padding:7px 11px; border:1.5px solid rgba(200,140,40,0.2); border-radius:9px;
  background:#fdf8f0; color:#2d1200; font-family:'DM Sans',sans-serif; font-size:0.78rem;
  outline:none; cursor:pointer; transition:border-color 0.15s;
}
.oa-sel:focus { border-color:#c8903c; box-shadow:0 0 0 3px rgba(200,140,40,0.1); }
.oa-sel.active { border-color:#c8903c; background:rgba(200,140,40,0.08); font-weight:600; }
.oa-date { padding:7px 11px; border:1.5px solid rgba(200,140,40,0.2); border-radius:9px; background:#fdf8f0; color:#2d1200; font-family:'DM Sans',sans-serif; font-size:0.78rem; outline:none; transition:border-color 0.15s; }
.oa-date:focus { border-color:#c8903c; }
.oa-sep { width:1px; height:22px; background:rgba(200,140,40,0.2); flex-shrink:0; }
.oa-clear { padding:7px 13px; border:1.5px solid rgba(220,38,38,0.2); border-radius:9px; background:rgba(220,38,38,0.05); color:#b91c1c; font-family:'DM Sans',sans-serif; font-size:0.78rem; font-weight:600; cursor:pointer; transition:all 0.15s; }
.oa-clear:hover { background:rgba(220,38,38,0.1); }

/* ── Body ── */
.oa-body { max-width:1320px; margin:0 auto; padding:20px 24px 60px; }

/* ── Section ── */
.oa-sec { display:flex; align-items:center; justify-content:space-between; margin:24px 0 12px; }
.oa-sec-t { font-family:'Cinzel',serif; font-size:0.63rem; font-weight:700; color:#7a4a10; letter-spacing:0.2em; text-transform:uppercase; display:flex; align-items:center; gap:9px; }
.oa-sec-t::before { content:''; width:14px; height:2px; background:linear-gradient(90deg,#c8903c,rgba(200,140,40,0.2)); border-radius:1px; }

/* ── Card ── */
.oa-card { background:#fff; border:1px solid rgba(200,140,40,0.13); border-radius:14px; overflow:hidden; box-shadow:0 2px 10px rgba(61,23,0,0.05); }
.oa-ch { padding:11px 16px; border-bottom:1px solid rgba(200,140,40,0.1); background:linear-gradient(to right,rgba(200,140,40,0.06),transparent); display:flex; align-items:center; justify-content:space-between; }
.oa-ct { font-family:'Cinzel',serif; font-size:0.64rem; font-weight:700; color:#5c3a14; letter-spacing:0.12em; text-transform:uppercase; }
.oa-cb { padding:14px 16px; }

/* ── Metrics ── */
.oa-m4 { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:14px; }
.oa-m6 { display:grid; grid-template-columns:repeat(6,1fr); gap:10px; margin-bottom:14px; }
.oa-metric { background:#fff; border:1px solid rgba(200,140,40,0.13); border-radius:12px; padding:13px 14px; position:relative; overflow:hidden; box-shadow:0 1px 6px rgba(61,23,0,0.04); transition:all 0.18s; cursor:pointer; }
.oa-metric:hover { transform:translateY(-2px); box-shadow:0 5px 18px rgba(61,23,0,0.1); }
.oa-metric::before { content:''; position:absolute; top:0; left:0; right:0; height:3px; }
.om0::before{background:linear-gradient(90deg,#c8903c,#f5c842);} .om1::before{background:linear-gradient(90deg,#16a34a,#4ade80);}
.om2::before{background:linear-gradient(90deg,#7c3aed,#a78bfa);} .om3::before{background:linear-gradient(90deg,#0284c7,#38bdf8);}
.om4::before{background:linear-gradient(90deg,#6b7280,#9ca3af);} .om5::before{background:linear-gradient(90deg,#dc2626,#f87171);}
.om6::before{background:linear-gradient(90deg,#d97706,#fbbf24);} .om7::before{background:linear-gradient(90deg,#0891b2,#22d3ee);}
.om8::before{background:linear-gradient(90deg,#f5c842,#c8903c);} .om9::before{background:linear-gradient(90deg,#dc2626,#d97706);}
.om10::before{background:linear-gradient(90deg,#059669,#34d399);} .om11::before{background:linear-gradient(90deg,#7c3aed,#c026d3);}
.oa-m-ico { width:30px; height:30px; border-radius:8px; display:flex; align-items:center; justify-content:center; margin-bottom:7px; }
.oa-m-val { font-family:'Cinzel',serif; font-size:1.4rem; font-weight:700; color:#2d1200; line-height:1; margin-bottom:2px; }
.oa-m-lbl { font-size:0.62rem; font-weight:600; color:#8b6840; text-transform:uppercase; letter-spacing:0.06em; }
.oa-m-sub { font-size:0.62rem; color:#a08060; margin-top:2px; }

/* ── Grids ── */
.g2  { display:grid; grid-template-columns:1fr 1fr;     gap:14px; margin-bottom:14px; }
.g3  { display:grid; grid-template-columns:1fr 1fr 1fr;  gap:14px; margin-bottom:14px; }
.g21 { display:grid; grid-template-columns:2fr 1fr;     gap:14px; margin-bottom:14px; }
.g12 { display:grid; grid-template-columns:1fr 2fr;     gap:14px; margin-bottom:14px; }
.g13 { display:grid; grid-template-columns:1fr 3fr;     gap:14px; margin-bottom:14px; }
.gf  { margin-bottom:14px; }

/* ── Table ── */
.oa-tbl { width:100%; border-collapse:collapse; }
.oa-th { padding:8px 11px; text-align:left; font-family:'Cinzel',serif; font-size:0.56rem; font-weight:700; color:#7a4a10; letter-spacing:0.14em; text-transform:uppercase; border-bottom:1.5px solid rgba(200,140,40,0.15); background:rgba(200,140,40,0.04); white-space:nowrap; }
.oa-tr { border-bottom:1px solid rgba(200,140,40,0.07); transition:background 0.12s; cursor:pointer; }
.oa-tr:last-child { border-bottom:none; }
.oa-tr:hover { background:rgba(200,140,40,0.04); }
.oa-td { padding:9px 11px; font-size:0.78rem; color:#3d1800; vertical-align:middle; }
.oa-kp { font-family:'Cinzel',serif; font-size:0.7rem; font-weight:700; background:rgba(200,140,40,0.1); border:1px solid rgba(200,140,40,0.22); color:#7a3200; padding:2px 8px; border-radius:20px; white-space:nowrap; }
.oa-pct { font-size:0.67rem; font-weight:700; padding:2px 8px; border-radius:20px; }
.oa-pg { background:rgba(22,163,74,0.1);  color:#15803d; }
.oa-py { background:rgba(251,191,36,0.1); color:#92400e; }
.oa-pr { background:rgba(220,38,38,0.08); color:#991b1b; }

/* ── Health cards ── */
.oa-hg { display:grid; grid-template-columns:repeat(auto-fill,minmax(230px,1fr)); gap:10px; }
.oa-hc { border-radius:12px; padding:13px 15px; border-left:4px solid; cursor:pointer; transition:all 0.18s; }
.oa-hc:hover { transform:translateY(-2px); box-shadow:0 6px 18px rgba(61,23,0,0.1); }
.oa-hc-H { background:rgba(22,163,74,0.05);  border-color:#16a34a; }
.oa-hc-W { background:rgba(251,191,36,0.06); border-color:#d97706; }
.oa-hc-R { background:rgba(234,88,12,0.06);  border-color:#ea580c; }
.oa-hc-C { background:rgba(220,38,38,0.06);  border-color:#dc2626; }
.oa-hk { font-family:'Cinzel',serif; font-size:0.8rem; font-weight:700; color:#2d1200; margin-bottom:5px; display:flex; align-items:center; justify-content:space-between; }

/* ── Health badge ── */
.hb { font-size:0.65rem; font-weight:700; padding:2px 8px; border-radius:20px; }
.hb-H { background:rgba(22,163,74,0.1);  color:#15803d; border:1px solid rgba(22,163,74,0.2); }
.hb-W { background:rgba(251,191,36,0.1); color:#92400e; border:1px solid rgba(251,191,36,0.2); }
.hb-R { background:rgba(234,88,12,0.1);  color:#c2410c; border:1px solid rgba(234,88,12,0.2); }
.hb-C { background:rgba(220,38,38,0.1);  color:#b91c1c; border:1px solid rgba(220,38,38,0.2); }

/* ── Trend direction ── */
.td-i { color:#16a34a; font-size:0.7rem; font-weight:700; }
.td-d { color:#dc2626; font-size:0.7rem; font-weight:700; }
.td-s { color:#8b6840; font-size:0.7rem; }

/* ── Legend ── */
.oa-leg { display:flex; flex-direction:column; gap:6px; }
.oa-li  { display:flex; align-items:center; gap:7px; cursor:pointer; padding:4px 6px; border-radius:7px; transition:background 0.12s; }
.oa-li:hover { background:rgba(200,140,40,0.07); }
.oa-ld  { width:10px; height:10px; border-radius:50%; flex-shrink:0; }
.oa-ll  { font-size:0.72rem; color:#3d1800; flex:1; font-weight:500; }
.oa-lv  { font-size:0.72rem; font-weight:700; color:#2d1200; }
.oa-lp  { font-size:0.65rem; color:#a08060; width:28px; text-align:right; }

/* ── Insight ── */
.oa-insight { background:linear-gradient(135deg,#1e0a00,#3d1800); border-radius:14px; padding:18px 22px; margin-bottom:14px; }
.oa-it { font-family:'Cinzel',serif; font-size:0.68rem; font-weight:700; color:rgba(200,150,60,0.9); letter-spacing:0.14em; text-transform:uppercase; margin-bottom:12px; }
.oa-ii { display:flex; align-items:flex-start; gap:9px; padding:9px 12px; border-radius:9px; border:1px solid rgba(255,255,255,0.07); background:rgba(255,255,255,0.05); margin-bottom:6px; }
.oa-ii:last-child { margin-bottom:0; }
.oa-ii-ico { width:22px; height:22px; border-radius:5px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.oa-ii-txt { font-size:0.76rem; color:rgba(255,220,160,0.85); line-height:1.5; }
.oa-ii-txt strong { color:#f5c842; }

/* ── Drilldown ── */
.oa-ov { position:fixed; inset:0; z-index:500; background:rgba(10,4,0,0.7); backdrop-filter:blur(6px); display:flex; align-items:flex-start; justify-content:flex-end; }
.oa-pan { width:500px; max-width:95vw; height:100vh; overflow-y:auto; background:#fff; box-shadow:-20px 0 60px rgba(61,23,0,0.2); animation:panIn 0.28s cubic-bezier(0.22,1,0.36,1) both; }
@keyframes panIn { from{transform:translateX(100%)} to{transform:translateX(0)} }
.oa-ph { background:linear-gradient(135deg,#1e0a00,#5c2700); padding:18px 22px; position:sticky; top:0; z-index:10; display:flex; align-items:center; justify-content:space-between; }
.oa-pt { font-family:'Cinzel',serif; font-size:0.95rem; font-weight:700; color:#fff; }
.oa-pc { width:30px; height:30px; border:none; border-radius:7px; background:rgba(255,255,255,0.1); color:rgba(255,255,255,0.7); cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all 0.15s; }
.oa-pc:hover { background:rgba(255,255,255,0.2); color:#fff; }

/* ── Skel ── */
.sk { background:linear-gradient(90deg,rgba(200,140,40,0.07) 25%,rgba(200,140,40,0.14) 50%,rgba(200,140,40,0.07) 75%); background-size:200% 100%; animation:skAni 1.4s infinite; border-radius:7px; }
@keyframes skAni { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
.sp { width:12px; height:12px; border-radius:50%; border:2px solid rgba(255,255,255,0.3); border-top-color:#fff; animation:spAni 0.7s linear infinite; }
@keyframes spAni { to{transform:rotate(360deg)} }

.oa-bubble-legend { display:flex; flex-wrap:wrap; gap:6px; margin-top:8px; }

/* ── Responsive ── */
@media(max-width:1100px){
  .oa-m6{grid-template-columns:repeat(3,1fr);}
  .oa-strip{grid-template-columns:repeat(2,1fr);}
  .oa-m4{grid-template-columns:repeat(3,1fr);}
}
@media(max-width:860px){
  .oa-m4{grid-template-columns:repeat(2,1fr);}
  .g2,.g21,.g12,.g3{grid-template-columns:1fr;}
  .oa-m6{grid-template-columns:repeat(2,1fr);}
  .oa-fb-in{gap:6px;}
  .oa-hg{grid-template-columns:repeat(auto-fill,minmax(180px,1fr));}
  .oa-pan{width:100vw;max-width:100vw;}
}
@media(max-width:600px){
  .oa-m4{grid-template-columns:1fr 1fr;}
  .oa-m6{grid-template-columns:1fr 1fr;}
  .oa-body{padding:14px 12px 60px;}
  .oa-in{padding:0 12px;}
  .oa-fb{padding:8px 12px;}
  .oa-strip{grid-template-columns:1fr 1fr;}
  .oa-tbl{font-size:0.7rem;}
  .oa-th,.oa-td{padding:6px 8px;}
  .oa-sel,.oa-date{font-size:0.72rem;padding:6px 8px;}
  .oa-sv{font-size:1rem;}
}

/* ── Owner Devotee Search ── */
.oa-dsearch-box{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:10px;}
.oa-dsearch-inp{flex:1;min-width:200px;padding:11px 16px;border:2px solid rgba(200,140,40,0.25);border-radius:12px;background:#fff;color:#2d1200;font-family:'DM Sans',sans-serif;font-size:0.88rem;outline:none;transition:border-color 0.15s;}
.oa-dsearch-inp:focus{border-color:#c8903c;box-shadow:0 0 0 3px rgba(200,140,40,0.1);}
.oa-dsearch-go{padding:11px 22px;border-radius:12px;border:none;background:linear-gradient(135deg,#7a3200,#c8903c);color:#fff;font-family:'DM Sans',sans-serif;font-size:0.86rem;font-weight:700;cursor:pointer;transition:all 0.15s;white-space:nowrap;}
.oa-dsearch-go:hover{opacity:0.88;}
.oa-dsearch-go:disabled{opacity:0.5;cursor:not-allowed;}
.oa-dsug{position:absolute;top:100%;left:0;right:0;z-index:300;background:#fff;border:1.5px solid rgba(200,140,40,0.25);border-radius:0 0 12px 12px;box-shadow:0 8px 24px rgba(61,23,0,0.14);overflow:hidden;margin-top:2px;}
.oa-dsug-item{padding:9px 16px;cursor:pointer;font-size:0.84rem;color:#2d1200;border-bottom:1px solid rgba(200,140,40,0.07);transition:background 0.12s;display:flex;align-items:center;gap:8px;}
.oa-dsug-item:hover{background:rgba(200,140,40,0.07);}
.oa-dres{background:#fff;border:1.5px solid rgba(200,140,40,0.15);border-radius:14px;overflow:hidden;margin-bottom:14px;box-shadow:0 3px 14px rgba(61,23,0,0.07);}
.oa-dres-hd{padding:14px 18px;border-bottom:1px solid rgba(200,140,40,0.1);background:linear-gradient(to right,rgba(200,140,40,0.08),transparent);display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:10px;}
.oa-dres-body{display:grid;grid-template-columns:1fr 1fr;}
.oa-dres-left{padding:14px 18px;border-right:1px solid rgba(200,140,40,0.1);}
.oa-dres-right{padding:14px 18px;}
.oa-dses-row{display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid rgba(200,140,40,0.06);font-size:0.74rem;}
.oa-dses-row:last-child{border-bottom:none;}
.oa-dses-p{width:8px;height:8px;border-radius:50%;background:#16a34a;flex-shrink:0;}
.oa-dses-a{width:8px;height:8px;border-radius:50%;background:#dc2626;flex-shrink:0;}
.oa-dbadge{padding:4px 12px;border-radius:20px;font-size:0.72rem;font-weight:700;}
.oa-dbadge-act{background:rgba(22,163,74,0.12);color:#15803d;border:1px solid rgba(22,163,74,0.25);}
.oa-dbadge-mod{background:rgba(217,119,6,0.12);color:#92400e;border:1px solid rgba(217,119,6,0.25);}
.oa-dbadge-irr{background:rgba(220,38,38,0.1);color:#b91c1c;border:1px solid rgba(220,38,38,0.2);}
@media(max-width:700px){
  .oa-dres-body{grid-template-columns:1fr;}
  .oa-dres-left{border-right:none;border-bottom:1px solid rgba(200,140,40,0.1);}
  .oa-dsearch-box{flex-direction:column;}
  .oa-dsearch-go{width:100%;}
}
`;

// ════════════════════════════════════════════════════════════════
// SVG ICONS
// ════════════════════════════════════════════════════════════════
const I = (p) => (
  <svg
    width={p.s || 14}
    height={p.s || 14}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={p.w || 2}
    style={{ flexShrink: 0 }}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d={p.d} />
  </svg>
);
const IProg = () => (
  <I d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
);
const IUser = () => (
  <I d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
);
const IChart = () => (
  <I d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
);
const IWarn = () => (
  <I d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
);
const ICheck = () => (
  <I d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
);
const ITrend = () => (
  <I d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
);
const IClock = () => <I d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />;
const IX = () => <I d="M6 18L18 6M6 6l12 12" w={2.5} />;
const ISpark = () => (
  <I d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
);

// ════════════════════════════════════════════════════════════════
// DRILLDOWN PANEL
// ════════════════════════════════════════════════════════════════
function DrilldownPanel({ programId, onClose, programTrends }) {
  const [dd, setDd] = useState(null);
  useEffect(() => {
    if (!programId) return;
    api
      .get(`/analytics/owner/drilldown/${programId}`)
      .then((r) => setDd(r.data))
      .catch(() => toast.error("Failed to load details."));
  }, [programId]);

  const prog = dd?.program;
  const trend = programTrends?.[programId] || [];
  const radarMetrics = prog
    ? [
        {
          label: "Attendance",
          value: dd?.summaries?.length
            ? Math.round(
                dd.summaries.reduce((s, x) => s + x.percentage, 0) /
                  dd.summaries.length
              )
            : 0,
        },
        {
          label: "Devotees",
          value: Math.min(100, (dd?.devotees?.length || 0) * 10),
        },
        {
          label: "Sessions",
          value: Math.min(100, (dd?.sessions?.length || 0) * 10),
        },
        {
          label: "Recency",
          value: dd?.sessions?.[0]
            ? Math.max(
                0,
                100 -
                  Math.floor(
                    (Date.now() - new Date(dd.sessions[0]._id)) / 864e5
                  ) *
                    5
              )
            : 0,
        },
        {
          label: "Consistency",
          value:
            trend.length >= 3
              ? Math.max(
                  0,
                  100 -
                    Math.round(
                      Math.sqrt(
                        trend.reduce(
                          (s, x, i, a) =>
                            i > 0 ? s + Math.pow(x.pct - a[i - 1].pct, 2) : 0,
                          0
                        ) / (trend.length - 1 || 1)
                      ) * 2
                    )
                )
              : 50,
        },
      ]
    : [];

  return (
    <div
      className="oa-ov"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="oa-pan">
        <div className="oa-ph">
          <div>
            <div className="oa-pt">{prog?.programKey || "Program Details"}</div>
            {prog && (
              <div
                style={{
                  fontSize: "0.7rem",
                  color: "rgba(255,210,140,0.6)",
                  marginTop: 2,
                }}
              >
                {prog.programType} · {prog.frequency} · {prog.day}
              </div>
            )}
          </div>
          <button className="oa-pc" onClick={onClose}>
            <IX />
          </button>
        </div>
        <div style={{ padding: "18px 22px" }}>
          {!dd ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[...Array(6)].map((_, i) => (
                <div key={i} className="sk" style={{ height: 14 }} />
              ))}
            </div>
          ) : (
            <>
              {/* Radar */}
              {radarMetrics.length > 0 && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    marginBottom: 20,
                  }}
                >
                  <RadarChart metrics={radarMetrics} size={130} />
                  <div>
                    {radarMetrics.map((m) => (
                      <div
                        key={m.label}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          marginBottom: 6,
                        }}
                      >
                        <span
                          style={{
                            fontSize: "0.72rem",
                            color: "#3d1800",
                            width: 90,
                            fontWeight: 500,
                          }}
                        >
                          {m.label}
                        </span>
                        <div
                          style={{
                            flex: 1,
                            height: 5,
                            background: "rgba(200,140,40,0.1)",
                            borderRadius: 3,
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              width: `${m.value}%`,
                              height: "100%",
                              background: `linear-gradient(90deg,${C.gold},${C.goldLight})`,
                              borderRadius: 3,
                            }}
                          />
                        </div>
                        <span
                          style={{
                            fontSize: "0.68rem",
                            fontWeight: 700,
                            color: "#2d1200",
                            width: 30,
                            textAlign: "right",
                          }}
                        >
                          {m.value}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Info grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 8,
                  marginBottom: 18,
                }}
              >
                {[
                  ["Area", prog.area],
                  ["Language", prog.language],
                  ["Day/Time", `${prog.day} ${prog.time}`],
                  ["Start", fmtDate(prog.startDate)],
                  ["Type", prog.programType],
                  ["Status", prog.actFlag],
                ].map(([lbl, val]) => (
                  <div
                    key={lbl}
                    style={{
                      padding: "9px 12px",
                      background: "rgba(200,140,40,0.05)",
                      borderRadius: 9,
                      border: "1px solid rgba(200,140,40,0.12)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "0.6rem",
                        fontWeight: 700,
                        color: "#a08060",
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        marginBottom: 2,
                      }}
                    >
                      {lbl}
                    </div>
                    <div
                      style={{
                        fontSize: "0.8rem",
                        fontWeight: 600,
                        color: "#2d1200",
                      }}
                    >
                      {val || "—"}
                    </div>
                  </div>
                ))}
              </div>

              {/* Line+Bar combo trend */}
              {trend.length >= 2 && (
                <div style={{ marginBottom: 20 }}>
                  <div
                    style={{
                      fontFamily: "'Cinzel',serif",
                      fontSize: "0.6rem",
                      fontWeight: 700,
                      color: "#7a4a10",
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      marginBottom: 10,
                    }}
                  >
                    Session Trend (Attendance % + Volume)
                  </div>
                  <LineBarCombo
                    data={trend}
                    height={80}
                    barColor={C.blue}
                    lineColor={C.goldLight}
                  />
                  <div
                    style={{
                      display: "flex",
                      gap: 12,
                      marginTop: 8,
                      justifyContent: "center",
                    }}
                  >
                    {[
                      { c: C.blue, l: "Sessions (bar)" },
                      { c: C.goldLight, l: "Attendance % (line)" },
                    ].map((x) => (
                      <div
                        key={x.l}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                        }}
                      >
                        <span
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: 3,
                            background: x.c,
                            flexShrink: 0,
                          }}
                        />
                        <span
                          style={{
                            fontSize: "0.68rem",
                            color: "#5c3a14",
                            fontWeight: 500,
                          }}
                        >
                          {x.l}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Devotee table */}
              {dd.summaries?.length > 0 && (
                <div style={{ marginBottom: 18 }}>
                  <div
                    style={{
                      fontFamily: "'Cinzel',serif",
                      fontSize: "0.6rem",
                      fontWeight: 700,
                      color: "#7a4a10",
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      marginBottom: 10,
                    }}
                  >
                    Devotees ({dd.summaries.length})
                  </div>
                  <div style={{ maxHeight: 220, overflowY: "auto" }}>
                    {dd.summaries.map((s, i) => (
                      <div
                        key={s.devoteeName}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          padding: "7px 0",
                          borderBottom: "1px solid rgba(200,140,40,0.07)",
                        }}
                      >
                        <div
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: 6,
                            background: `linear-gradient(135deg,${C.gold},#7a3a00)`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "0.56rem",
                            fontWeight: 700,
                            color: "#fff",
                            flexShrink: 0,
                          }}
                        >
                          {ini(s.devoteeName)}
                        </div>
                        <span
                          style={{
                            flex: 1,
                            fontSize: "0.76rem",
                            fontWeight: 500,
                            color: "#2d1200",
                          }}
                        >
                          {s.devoteeName}
                        </span>
                        <span style={{ fontSize: "0.68rem", color: C.muted }}>
                          {s.attended}/{s.totalSessions}
                        </span>
                        <span className={`oa-pct oa-p${pctCls(s.percentage)}`}>
                          {s.percentage}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent sessions */}
              {dd.sessions?.length > 0 && (
                <div>
                  <div
                    style={{
                      fontFamily: "'Cinzel',serif",
                      fontSize: "0.6rem",
                      fontWeight: 700,
                      color: "#7a4a10",
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      marginBottom: 8,
                    }}
                  >
                    Recent Sessions
                  </div>
                  {dd.sessions.slice(0, 8).map((s, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "7px 0",
                        borderBottom: "1px solid rgba(200,140,40,0.07)",
                        fontSize: "0.76rem",
                      }}
                    >
                      <span style={{ color: C.gold, flexShrink: 0 }}>✦</span>
                      <span
                        style={{
                          fontWeight: 600,
                          color: "#2d1200",
                          width: 90,
                          flexShrink: 0,
                        }}
                      >
                        {s._id}
                      </span>
                      <span
                        style={{
                          color: C.muted,
                          flex: 1,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {s.host}
                      </span>
                      <span
                        className={`oa-pct oa-p${pctCls(
                          Math.round((s.present / s.total) * 100)
                        )}`}
                      >
                        {Math.round((s.present / s.total) * 100)}%
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════
// ════════════════════════════════════════════════════════════════
// COMPONENT: ProgramTrendSelector — proper component to avoid hooks-in-IIFE
// ════════════════════════════════════════════════════════════════
// ════════════════════════════════════════════════════════════════
// COMPONENT: ATTENDANCE HEATMAP CALENDAR
// GitHub-style contribution heatmap showing attendance patterns
// over the last 90 days. Each cell = one day.
// Color intensity = how many sessions were held + attendance %
// ════════════════════════════════════════════════════════════════
function AttendanceHeatmap({
  attendanceData = [],
  byProgram = [],
  programTrends = {},
}) {
  const { tip, show, move, hide } = useTooltip();
  const [selectedDay, setSelectedDay] = useState(null);

  // Build a 90-day map from programTrends (per-session data)
  const dayMap = {};

  // Collect all session dates from programTrends
  Object.entries(programTrends).forEach(([progId, sessions]) => {
    const prog = byProgram.find((p) => p._id?.toString() === progId);
    sessions.forEach((s) => {
      const date = s.date;
      if (!dayMap[date])
        dayMap[date] = { sessions: [], totalPresent: 0, totalTotal: 0 };
      dayMap[date].sessions.push({
        programKey: prog?.programKey || "Unknown",
        present: s.present,
        absent: s.absent,
        total: s.total,
        pct: s.pct,
      });
      dayMap[date].totalPresent += s.present;
      dayMap[date].totalTotal += s.total;
    });
  });

  // Build last 90 days grid
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = [];
  for (let i = 89; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    const data = dayMap[key] || null;
    const pct = data
      ? data.totalTotal > 0
        ? Math.round((data.totalPresent / data.totalTotal) * 100)
        : 0
      : -1;
    days.push({
      date: key,
      d,
      data,
      pct,
      sessionCount: data?.sessions?.length || 0,
    });
  }

  // Color scale for cells
  const cellColor = (pct, count) => {
    if (pct < 0 || count === 0) return "rgba(200,140,40,0.07)"; // no sessions
    if (pct >= 80) return count >= 2 ? "#15803d" : "#4ade80";
    if (pct >= 60) return count >= 2 ? "#0284c7" : "#60a5fa";
    if (pct >= 40) return count >= 2 ? "#d97706" : "#fbbf24";
    return count >= 2 ? "#dc2626" : "#f87171";
  };

  // Group into weeks (columns of 7)
  const weeks = [];
  const firstDow = days[0].d.getDay();
  let week = Array(firstDow).fill(null);
  days.forEach((day) => {
    week.push(day);
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  });
  if (week.length > 0) {
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }

  const WEEK_LABELS = ["S", "M", "T", "W", "T", "F", "S"];
  const totalSessions = days.reduce((s, d) => s + d.sessionCount, 0);
  const activeDays = days.filter((d) => d.sessionCount > 0).length;
  const avgPct =
    activeDays > 0
      ? Math.round(
          days
            .filter((d) => d.pct >= 0)
            .reduce((s, d) => s + (d.pct < 0 ? 0 : d.pct), 0) /
            Math.max(activeDays, 1)
        )
      : 0;

  return (
    <div className="oa-card">
      <div className="oa-ch">
        <span className="oa-ct">Attendance Heatmap — Last 90 Days</span>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <span style={{ fontSize: "0.64rem", color: C.muted }}>
            {totalSessions} sessions · {activeDays} active days
          </span>
        </div>
      </div>
      <div className="oa-cb">
        {/* Summary stats row */}
        <div
          style={{
            display: "flex",
            gap: 10,
            marginBottom: 16,
            flexWrap: "wrap",
          }}
        >
          {[
            { l: "Sessions Held", v: totalSessions, c: C.gold },
            { l: "Active Days", v: activeDays, c: C.blue },
            { l: "Avg Attendance", v: `${avgPct}%`, c: pctColor(avgPct) },
            { l: "Programs", v: byProgram.length, c: C.purple },
          ].map((x) => (
            <div
              key={x.l}
              style={{
                flex: 1,
                minWidth: 70,
                padding: "8px 12px",
                background: "rgba(200,140,40,0.05)",
                borderRadius: 10,
                border: "1px solid rgba(200,140,40,0.1)",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontFamily: "'Cinzel',serif",
                  fontWeight: 700,
                  fontSize: "1.05rem",
                  color: x.c,
                }}
              >
                {x.v}
              </div>
              <div
                style={{
                  fontSize: "0.6rem",
                  fontWeight: 600,
                  color: C.muted,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  marginTop: 1,
                }}
              >
                {x.l}
              </div>
            </div>
          ))}
        </div>

        {/* Heatmap grid */}
        <div
          style={{
            display: "flex",
            gap: 3,
            alignItems: "flex-start",
            overflowX: "auto",
            paddingBottom: 4,
          }}
        >
          {/* Day labels */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 3,
              paddingTop: 18,
              flexShrink: 0,
            }}
          >
            {WEEK_LABELS.map((l, i) => (
              <div
                key={i}
                style={{
                  width: 11,
                  height: 11,
                  fontSize: 8,
                  color: C.light,
                  textAlign: "center",
                  lineHeight: "11px",
                }}
              >
                {l}
              </div>
            ))}
          </div>

          {/* Calendar columns */}
          {weeks.map((week, wi) => {
            const firstFull = week.find((d) => d !== null);
            const monthLbl =
              firstFull && firstFull.d.getDate() <= 7
                ? firstFull.d.toLocaleDateString("en-IN", { month: "short" })
                : "";
            return (
              <div
                key={wi}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 3,
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    height: 14,
                    fontSize: 8,
                    color: C.muted,
                    textAlign: "center",
                    lineHeight: "14px",
                    whiteSpace: "nowrap",
                  }}
                >
                  {monthLbl}
                </div>
                {week.map((day, di) => {
                  if (!day)
                    return <div key={di} style={{ width: 11, height: 11 }} />;
                  const color = cellColor(day.pct, day.sessionCount);
                  const isToday =
                    day.date === today.toISOString().split("T")[0];
                  return (
                    <div
                      key={di}
                      style={{
                        width: 11,
                        height: 11,
                        borderRadius: 2,
                        background: color,
                        cursor: day.sessionCount > 0 ? "pointer" : "default",
                        outline: isToday
                          ? `2px solid ${C.gold}`
                          : selectedDay === day.date
                          ? "2px solid #fff"
                          : "none",
                        outlineOffset: isToday ? 1 : 0,
                        transition: "transform 0.1s",
                        transform:
                          selectedDay === day.date ? "scale(1.3)" : "scale(1)",
                      }}
                      onMouseEnter={(e) => {
                        if (day.sessionCount > 0) {
                          show(
                            e,
                            <div>
                              <div
                                style={{
                                  fontFamily: "'Cinzel',serif",
                                  fontWeight: 700,
                                  color: C.goldLight,
                                  marginBottom: 5,
                                  fontSize: "0.78rem",
                                }}
                              >
                                {day.d.toLocaleDateString("en-IN", {
                                  weekday: "short",
                                  day: "numeric",
                                  month: "short",
                                })}
                              </div>
                              <div
                                style={{
                                  color: "rgba(255,220,160,0.9)",
                                  fontSize: "0.72rem",
                                  marginBottom: 4,
                                }}
                              >
                                {day.sessionCount} session
                                {day.sessionCount > 1 ? "s" : ""} · {day.pct}%
                                attendance
                              </div>
                              <div
                                style={{
                                  borderTop: "1px solid rgba(255,255,255,0.1)",
                                  paddingTop: 5,
                                }}
                              >
                                {(day.data?.sessions || []).map((s, i) => (
                                  <div
                                    key={i}
                                    style={{
                                      fontSize: "0.7rem",
                                      color: "rgba(255,220,160,0.85)",
                                      marginBottom: 2,
                                    }}
                                  >
                                    <span
                                      style={{
                                        fontFamily: "'Cinzel',serif",
                                        fontWeight: 700,
                                      }}
                                    >
                                      {s.programKey}
                                    </span>
                                    <span
                                      style={{
                                        color: "#4ade80",
                                        marginLeft: 6,
                                      }}
                                    >
                                      {s.present}✓
                                    </span>
                                    <span
                                      style={{
                                        color: "#f87171",
                                        marginLeft: 4,
                                      }}
                                    >
                                      {s.absent}✗
                                    </span>
                                    <span
                                      style={{
                                        color: C.goldLight,
                                        marginLeft: 4,
                                      }}
                                    >
                                      {s.pct}%
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        }
                      }}
                      onMouseMove={(e) => move(e)}
                      onMouseLeave={() => hide()}
                      onClick={() =>
                        setSelectedDay((prev) =>
                          prev === day.date ? null : day.date
                        )
                      }
                    />
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Color legend */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginTop: 12,
            flexWrap: "wrap",
          }}
        >
          <span style={{ fontSize: "0.64rem", color: C.muted }}>Less</span>
          {[
            { c: "rgba(200,140,40,0.07)", l: "No sessions" },
            { c: "#f87171", l: "<40%" },
            { c: "#fbbf24", l: "40–59%" },
            { c: "#60a5fa", l: "60–79%" },
            { c: "#4ade80", l: "≥80%" },
            { c: "#15803d", l: "≥80% (multi)" },
          ].map((x, i) => (
            <div
              key={i}
              style={{ display: "flex", alignItems: "center", gap: 3 }}
            >
              <div
                style={{
                  width: 11,
                  height: 11,
                  borderRadius: 2,
                  background: x.c,
                }}
              />
              <span style={{ fontSize: "0.6rem", color: C.light }}>{x.l}</span>
            </div>
          ))}
          <span style={{ fontSize: "0.64rem", color: C.muted }}>More</span>
        </div>

        {/* Selected day detail */}
        {selectedDay && dayMap[selectedDay] && (
          <div
            style={{
              marginTop: 14,
              padding: "12px 16px",
              background: "rgba(200,140,40,0.06)",
              borderRadius: 12,
              border: "1px solid rgba(200,140,40,0.15)",
            }}
          >
            <div
              style={{
                fontFamily: "'Cinzel',serif",
                fontSize: "0.72rem",
                fontWeight: 700,
                color: "#5c3a14",
                marginBottom: 10,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
              }}
            >
              {new Date(selectedDay).toLocaleDateString("en-IN", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {(dayMap[selectedDay]?.sessions || []).map((s, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "7px 10px",
                    background: "#fff",
                    borderRadius: 9,
                    border: "1px solid rgba(200,140,40,0.12)",
                  }}
                >
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      background: pctColor(s.pct),
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontFamily: "'Cinzel',serif",
                      fontSize: "0.78rem",
                      fontWeight: 700,
                      color: "#2d1200",
                      flex: 1,
                    }}
                  >
                    {s.programKey}
                  </span>
                  <span
                    style={{
                      fontSize: "0.72rem",
                      color: C.green,
                      fontWeight: 600,
                    }}
                  >
                    {s.present} present
                  </span>
                  <span
                    style={{
                      fontSize: "0.72rem",
                      color: C.red,
                      fontWeight: 600,
                    }}
                  >
                    {s.absent} absent
                  </span>
                  <span className={`oa-pct oa-p${pctCls(s.pct)}`}>
                    {s.pct}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <Tooltip tip={tip} />
    </div>
  );
}

function ProgramTrendSelector({ byProgram = [], programTrends = {}, onDrill }) {
  const [selP, setSelP] = useState(() => byProgram?.[0]?._id?.toString() || "");
  const progTrend = programTrends?.[selP] || [];
  const selectedP = byProgram?.find((p) => p._id.toString() === selP);

  if (!byProgram?.length) return null;

  return (
    <div className="gf">
      <div className="oa-card">
        <div className="oa-ch">
          <span className="oa-ct">Individual Program Session Trend</span>
          <select
            style={{
              padding: "4px 10px",
              border: "1.5px solid rgba(200,140,40,0.22)",
              borderRadius: 8,
              background: "#fdf8f0",
              color: "#2d1200",
              fontFamily: "'DM Sans',sans-serif",
              fontSize: "0.76rem",
              outline: "none",
            }}
            value={selP}
            onChange={(e) => setSelP(e.target.value)}
          >
            {byProgram.map((p) => (
              <option key={p._id.toString()} value={p._id.toString()}>
                {p.programKey} ({p.attendance_pct}%)
              </option>
            ))}
          </select>
        </div>
        <div className="oa-cb">
          {selectedP && (
            <div
              style={{
                display: "flex",
                gap: 14,
                marginBottom: 12,
                flexWrap: "wrap",
              }}
            >
              {[
                { l: "Sessions", v: selectedP.sessionCount },
                { l: "Present", v: selectedP.present },
                { l: "Absent", v: selectedP.absent },
                { l: "Avg %", v: `${selectedP.attendance_pct}%` },
                { l: "Devotees", v: selectedP.devoteeCount },
              ].map((x) => (
                <div
                  key={x.l}
                  style={{
                    flex: 1,
                    minWidth: 60,
                    padding: "7px 12px",
                    background: "rgba(200,140,40,0.05)",
                    borderRadius: 9,
                    border: "1px solid rgba(200,140,40,0.12)",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontFamily: "'Cinzel',serif",
                      fontWeight: 700,
                      fontSize: "1rem",
                      color: "#2d1200",
                    }}
                  >
                    {x.v}
                  </div>
                  <div
                    style={{
                      fontSize: "0.6rem",
                      fontWeight: 600,
                      color: "#8b6840",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                    }}
                  >
                    {x.l}
                  </div>
                </div>
              ))}
            </div>
          )}
          {progTrend.length >= 2 ? (
            <>
              <LineBarCombo
                data={progTrend}
                height={90}
                barColor={pctColor(selectedP?.attendance_pct || 0)}
                lineColor={C.goldLight}
              />
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  marginTop: 8,
                  justifyContent: "center",
                }}
              >
                {[
                  {
                    c: pctColor(selectedP?.attendance_pct || 0),
                    l: "Sessions present (bar)",
                  },
                  { c: C.goldLight, l: "Attendance % (line)" },
                ].map((x) => (
                  <div
                    key={x.l}
                    style={{ display: "flex", alignItems: "center", gap: 5 }}
                  >
                    <span
                      style={{
                        width: 9,
                        height: 9,
                        borderRadius: 3,
                        background: x.c,
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ fontSize: "0.66rem", color: "#5c3a14" }}>
                      {x.l}
                    </span>
                  </div>
                ))}
              </div>
              {onDrill && (
                <div style={{ textAlign: "right", marginTop: 8 }}>
                  <button
                    style={{
                      fontSize: "0.72rem",
                      color: C.gold,
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                    onClick={() => onDrill(selP)}
                  >
                    View full details →
                  </button>
                </div>
              )}
            </>
          ) : (
            <div
              style={{
                textAlign: "center",
                color: "#a08060",
                fontSize: "0.76rem",
                padding: "16px 0",
              }}
            >
              Mark attendance sessions to see trends.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// COMPONENT: OWNER DEVOTEE SEARCH
// Searches only this owner's program devotees (scoped to owner)
// ════════════════════════════════════════════════════════════════
function OwnerDevoteeSearch() {
  const { tip, show, move, hide } = useTooltip();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSug, setShowSug] = useState(false);
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState(null);
  const [searched, setSearched] = useState("");
  const debRef = useRef(null);

  // Debounced autocomplete
  const fetchSug = (val) => {
    if (debRef.current) clearTimeout(debRef.current);
    if (val.trim().length < 2) {
      setSuggestions([]);
      setShowSug(false);
      return;
    }
    debRef.current = setTimeout(async () => {
      try {
        const r = await api.get("/analytics/owner/devotee/suggest", {
          params: { q: val.trim() },
        });
        const s = r.data.suggestions || [];
        setSuggestions(s);
        setShowSug(s.length > 0);
      } catch {
        setSuggestions([]);
      }
    }, 300);
  };

  const handleInput = (e) => {
    setQuery(e.target.value);
    fetchSug(e.target.value);
  };

  const pickSug = (name) => {
    setQuery(name);
    setSuggestions([]);
    setShowSug(false);
    doSearch(name);
  };

  const doSearch = async (nameOverride) => {
    const name = (nameOverride || query).trim();
    if (!name || name.length < 2) return;
    setSearching(true);
    setSearched(name);
    setResults(null);
    setShowSug(false);
    try {
      const r = await api.get("/analytics/owner/devotee", { params: { name } });
      setResults(r.data.results || []);
    } catch {
      toast.error("Search failed.");
    } finally {
      setSearching(false);
    }
  };

  const badgeCls = (s) =>
    s === "Active"
      ? "oa-dbadge oa-dbadge-act"
      : s === "Moderate"
      ? "oa-dbadge oa-dbadge-mod"
      : "oa-dbadge oa-dbadge-irr";

  return (
    <div className="gf">
      <div className="oa-card">
        <div className="oa-ch">
          <span className="oa-ct">🔍 Search Your Devotees</span>
          <span style={{ fontSize: "0.66rem", color: C.muted }}>
            Autocomplete · searches your program devotees only
          </span>
        </div>
        <div className="oa-cb">
          <div style={{ position: "relative" }}>
            <div className="oa-dsearch-box">
              <div style={{ position: "relative", flex: 1 }}>
                <input
                  className="oa-dsearch-inp"
                  placeholder="Type devotee name… (min 2 characters)"
                  value={query}
                  onChange={handleInput}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      doSearch();
                      setShowSug(false);
                    }
                    if (e.key === "Escape") setShowSug(false);
                  }}
                  onFocus={() => suggestions.length > 0 && setShowSug(true)}
                  onBlur={() => setTimeout(() => setShowSug(false), 160)}
                  autoComplete="off"
                  style={{ width: "100%" }}
                />
                {showSug && suggestions.length > 0 && (
                  <div className="oa-dsug">
                    {suggestions.map((s, i) => (
                      <div
                        key={i}
                        className="oa-dsug-item"
                        onMouseDown={() => pickSug(s)}
                      >
                        <span style={{ opacity: 0.5, fontSize: "0.8rem" }}>
                          👤
                        </span>
                        {s
                          .split(new RegExp(`(${query.trim()})`, "gi"))
                          .map((part, pi) =>
                            part.toLowerCase() ===
                            query.trim().toLowerCase() ? (
                              <mark
                                key={pi}
                                style={{
                                  background: "rgba(200,140,40,0.2)",
                                  color: "#3d1800",
                                  borderRadius: 3,
                                  padding: "0 2px",
                                  fontWeight: 700,
                                }}
                              >
                                {part}
                              </mark>
                            ) : (
                              <span key={pi}>{part}</span>
                            )
                          )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button
                className="oa-dsearch-go"
                onClick={() => doSearch()}
                disabled={searching || query.trim().length < 2}
              >
                {searching ? "Searching…" : "Search →"}
              </button>
            </div>
          </div>

          {/* Results */}
          {results !== null &&
            (results.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "24px 0",
                  color: C.muted,
                  fontFamily: "'Cinzel',serif",
                  fontSize: "0.82rem",
                }}
              >
                No devotee found for "
                <strong style={{ color: C.dark }}>{searched}</strong>" in your
                programs.
              </div>
            ) : (
              <div
                style={{
                  marginTop: 14,
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                {results.map((r, ri) => (
                  <div key={ri} className="oa-dres">
                    <div className="oa-dres-hd">
                      <div>
                        <div
                          style={{
                            fontFamily: "'Cinzel',serif",
                            fontWeight: 700,
                            fontSize: "0.95rem",
                            color: "#2d1200",
                          }}
                        >
                          {r.devoteeName}
                        </div>
                        <div
                          style={{
                            fontSize: "0.72rem",
                            color: C.muted,
                            marginTop: 2,
                          }}
                        >
                          {r.programKey} · {r.area} · {r.language}
                        </div>
                        <div
                          style={{
                            display: "flex",
                            gap: 5,
                            marginTop: 6,
                            flexWrap: "wrap",
                          }}
                        >
                          {r.programType && (
                            <span
                              style={{
                                fontSize: "0.64rem",
                                padding: "2px 8px",
                                borderRadius: 20,
                                background: "rgba(124,58,237,0.1)",
                                color: "#6d28d9",
                              }}
                            >
                              {r.programType}
                            </span>
                          )}
                          {r.frequency && (
                            <span
                              style={{
                                fontSize: "0.64rem",
                                padding: "2px 8px",
                                borderRadius: 20,
                                background: "rgba(200,140,40,0.1)",
                                color: "#7a4a00",
                              }}
                            >
                              {r.frequency}
                            </span>
                          )}
                        </div>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "flex-end",
                          gap: 7,
                        }}
                      >
                        <span className={badgeCls(r.status)}>{r.status}</span>
                        <div style={{ textAlign: "right" }}>
                          <div
                            style={{
                              fontFamily: "'Cinzel',serif",
                              fontSize: "1.8rem",
                              fontWeight: 700,
                              color: pctColor(r.pct),
                              lineHeight: 1,
                            }}
                          >
                            {r.pct}%
                          </div>
                          <div style={{ fontSize: "0.62rem", color: C.muted }}>
                            attendance rate
                          </div>
                        </div>
                        {r.streak > 0 && (
                          <div
                            style={{
                              fontSize: "0.68rem",
                              fontWeight: 700,
                              color: C.green,
                            }}
                          >
                            🔥 {r.streak} streak
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="oa-dres-body">
                      {/* Left */}
                      <div className="oa-dres-left">
                        <div
                          style={{ display: "flex", gap: 14, marginBottom: 12 }}
                        >
                          {[
                            { l: "Attended", v: r.attended, c: C.green },
                            { l: "Total", v: r.total, c: C.blue },
                            { l: "Absent", v: r.total - r.attended, c: C.red },
                          ].map((x) => (
                            <div key={x.l} style={{ textAlign: "center" }}>
                              <div
                                style={{
                                  fontFamily: "'Cinzel',serif",
                                  fontWeight: 700,
                                  fontSize: "1.1rem",
                                  color: x.c,
                                }}
                              >
                                {x.v}
                              </div>
                              <div
                                style={{
                                  fontSize: "0.6rem",
                                  color: C.muted,
                                  textTransform: "uppercase",
                                  letterSpacing: "0.06em",
                                }}
                              >
                                {x.l}
                              </div>
                            </div>
                          ))}
                        </div>
                        {/* Attendance bar */}
                        <div style={{ marginBottom: 10 }}>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              marginBottom: 3,
                            }}
                          >
                            <span
                              style={{ fontSize: "0.64rem", color: C.muted }}
                            >
                              Attendance Rate
                            </span>
                            <span
                              style={{
                                fontSize: "0.68rem",
                                fontWeight: 700,
                                color: pctColor(r.pct),
                              }}
                            >
                              {r.pct}%
                            </span>
                          </div>
                          <div
                            style={{
                              height: 7,
                              background: "rgba(200,140,40,0.1)",
                              borderRadius: 4,
                              overflow: "hidden",
                            }}
                          >
                            <div
                              style={{
                                width: `${r.pct}%`,
                                height: "100%",
                                background: `linear-gradient(90deg,${pctColor(
                                  r.pct
                                )},${pctColor(r.pct)}99)`,
                                borderRadius: 4,
                                transition: "width 0.6s ease",
                              }}
                            />
                          </div>
                        </div>
                        {/* Monthly pattern */}
                        {r.monthlyBreakdown?.length > 0 && (
                          <>
                            <div
                              style={{
                                fontSize: "0.62rem",
                                fontWeight: 700,
                                color: C.muted,
                                textTransform: "uppercase",
                                letterSpacing: "0.08em",
                                marginBottom: 7,
                              }}
                            >
                              Monthly Pattern
                            </div>
                            <div
                              style={{
                                display: "flex",
                                gap: 4,
                                alignItems: "flex-end",
                                height: 46,
                              }}
                            >
                              {r.monthlyBreakdown.map((m, mi) => {
                                const maxP = Math.max(
                                  ...r.monthlyBreakdown.map(
                                    (x) => x.present + x.absent
                                  ),
                                  1
                                );
                                const h = Math.max(
                                  4,
                                  ((m.present + m.absent) / maxP) * 42
                                );
                                return (
                                  <div
                                    key={mi}
                                    style={{
                                      flex: 1,
                                      display: "flex",
                                      flexDirection: "column",
                                      alignItems: "center",
                                      gap: 2,
                                      cursor: "pointer",
                                    }}
                                    onMouseEnter={(e) =>
                                      show(
                                        e,
                                        <div>
                                          <div
                                            style={{
                                              fontFamily: "'Cinzel',serif",
                                              fontWeight: 700,
                                              color: pctColor(m.pct),
                                              marginBottom: 3,
                                              fontSize: "0.76rem",
                                            }}
                                          >
                                            {m.label}
                                          </div>
                                          <div
                                            style={{
                                              color: "#4ade80",
                                              fontSize: "0.72rem",
                                            }}
                                          >
                                            Present:{" "}
                                            <strong style={{ color: "#fff" }}>
                                              {m.present}
                                            </strong>
                                          </div>
                                          <div
                                            style={{
                                              color: "#f87171",
                                              fontSize: "0.72rem",
                                            }}
                                          >
                                            Absent:{" "}
                                            <strong style={{ color: "#fff" }}>
                                              {m.absent}
                                            </strong>
                                          </div>
                                          <div
                                            style={{
                                              color: "rgba(255,220,160,0.9)",
                                              fontSize: "0.72rem",
                                            }}
                                          >
                                            Rate:{" "}
                                            <strong
                                              style={{ color: pctColor(m.pct) }}
                                            >
                                              {m.pct}%
                                            </strong>
                                          </div>
                                        </div>
                                      )
                                    }
                                    onMouseMove={(e) => move(e)}
                                    onMouseLeave={() => hide()}
                                  >
                                    <div
                                      style={{
                                        width: "100%",
                                        height: h,
                                        background: pctColor(m.pct),
                                        borderRadius: "3px 3px 0 0",
                                        opacity: 0.8,
                                      }}
                                    />
                                    <span
                                      style={{
                                        fontSize: "0.52rem",
                                        color: C.muted,
                                      }}
                                    >
                                      {m.label.split(" ")[0]}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </>
                        )}
                      </div>

                      {/* Right */}
                      <div className="oa-dres-right">
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            marginBottom: 12,
                          }}
                        >
                          <DonutChart
                            slices={[
                              {
                                label: "Present",
                                value: r.attended,
                                color: C.green,
                              },
                              {
                                label: "Absent",
                                value: r.total - r.attended,
                                color: C.red,
                              },
                            ]}
                            size={76}
                            label="Sessions"
                          />
                          <div>
                            {[
                              { l: "Present", v: r.attended, c: C.green },
                              {
                                l: "Absent",
                                v: r.total - r.attended,
                                c: C.red,
                              },
                            ].map((x) => (
                              <div
                                key={x.l}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 6,
                                  marginBottom: 4,
                                }}
                              >
                                <span
                                  style={{
                                    width: 7,
                                    height: 7,
                                    borderRadius: "50%",
                                    background: x.c,
                                  }}
                                />
                                <span
                                  style={{
                                    fontSize: "0.72rem",
                                    color: "#3d1800",
                                  }}
                                >
                                  {x.l}: <strong>{x.v}</strong>
                                </span>
                                <span
                                  style={{
                                    fontSize: "0.64rem",
                                    color: C.muted,
                                  }}
                                >
                                  (
                                  {r.total
                                    ? Math.round((x.v / r.total) * 100)
                                    : 0}
                                  %)
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div
                          style={{
                            fontSize: "0.62rem",
                            fontWeight: 700,
                            color: C.muted,
                            textTransform: "uppercase",
                            letterSpacing: "0.08em",
                            marginBottom: 6,
                          }}
                        >
                          Last 10 Sessions
                        </div>
                        {(r.recentSessions || []).map((s, si) => (
                          <div key={si} className="oa-dses-row">
                            <span
                              className={
                                s.status === "present"
                                  ? "oa-dses-p"
                                  : "oa-dses-a"
                              }
                            />
                            <span
                              style={{
                                color: s.status === "present" ? C.green : C.red,
                                fontWeight: 600,
                                width: 50,
                                flexShrink: 0,
                                fontSize: "0.72rem",
                              }}
                            >
                              {s.status === "present" ? "Present" : "Absent"}
                            </span>
                            <span
                              style={{
                                flex: 1,
                                color: C.muted,
                                fontSize: "0.7rem",
                              }}
                            >
                              {s.date
                                ? new Date(s.date).toLocaleDateString("en-IN", {
                                    day: "numeric",
                                    month: "short",
                                    year: "2-digit",
                                  })
                                : "—"}
                            </span>
                            {s.host && (
                              <span
                                style={{
                                  fontSize: "0.64rem",
                                  color: C.light,
                                  maxWidth: 80,
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {s.host}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
        </div>
      </div>
      <Tooltip tip={tip} />
    </div>
  );
}

export default function OwnerAnalytics() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [drill, setDrill] = useState(null);

  const [filters, setFilters] = useState({
    programType: "",
    language: "",
    area: "",
    subArea: "",
    frequency: "",
    programId: "",
    startDate: "",
    endDate: "",
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v)
      );
      const r = await api.get("/analytics/owner", { params });
      setData(r.data);
    } catch {
      toast.error("Failed to load analytics.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const upd = (k, v) => setFilters((p) => ({ ...p, [k]: v }));
  const clearAll = () =>
    setFilters({
      programType: "",
      language: "",
      area: "",
      subArea: "",
      frequency: "",
      programId: "",
      startDate: "",
      endDate: "",
    });
  const hasFilter = Object.values(filters).some((v) => v);

  const f = data?.filterOptions || {};
  const s = data?.summary || {};

  // Decide selected program name for headings
  const selProgram = filters.programId
    ? (f.programs || []).find((p) => p.id.toString() === filters.programId)
    : null;

  // Insights
  const insights = [];
  if (s.bestProgram)
    insights.push({
      t: "good",
      ico: <ICheck />,
      txt: (
        <>
          Best performer: <strong>{s.bestProgram.key}</strong> —{" "}
          {s.bestProgram.pct}% with {s.bestProgram.sessions} sessions and{" "}
          {s.bestProgram.devotees} devotees.
        </>
      ),
    });
  if (s.weakestProgram)
    insights.push({
      t: "warn",
      ico: <IWarn />,
      txt: (
        <>
          Needs attention: <strong>{s.weakestProgram.key}</strong> at{" "}
          {s.weakestProgram.pct}%.
        </>
      ),
    });
  if (s.mostImproved)
    insights.push({
      t: "good",
      ico: <ITrend />,
      txt: (
        <>
          <strong>{s.mostImproved.key}</strong> improved by{" "}
          <strong>+{s.mostImproved.delta}%</strong>.
        </>
      ),
    });
  if (s.belowThreshold > 0)
    insights.push({
      t: "warn",
      ico: <IWarn />,
      txt: (
        <>
          <strong>{s.belowThreshold}</strong> program
          {s.belowThreshold > 1 ? "s" : ""} overdue for attendance.
        </>
      ),
    });
  if (data?.byFrequency?.length > 0) {
    const best = [...(data.byFrequency || [])].sort((a, b) => b.pct - a.pct)[0];
    if (best)
      insights.push({
        t: "info",
        ico: <IChart />,
        txt: (
          <>
            <strong>{best.frequency}</strong> programs lead with{" "}
            <strong>{best.pct}%</strong> avg attendance.
          </>
        ),
      });
  }
  if (data?.byLanguage?.length > 0) {
    const best = [...(data.byLanguage || [])].sort((a, b) => b.pct - a.pct)[0];
    if (best)
      insights.push({
        t: "info",
        ico: <IUser />,
        txt: (
          <>
            <strong>{best.language}</strong> has{" "}
            <strong>{best.devoteeCount}</strong> devotees and{" "}
            <strong>{best.pct}%</strong> attendance.
          </>
        ),
      });
  }

  return (
    <>
      <style>{css}</style>
      <div className="oa">
        {/* ══ BANNER ══════════════════════════════════════════════ */}
        <div className="oa-banner">
          <div className="oa-in">
            <div className="oa-br">
              <div>
                <div className="oa-ey">Owner Analytics</div>
                <h1 className="oa-tt">
                  Analytics — <em>{user?.name?.split(" ")[0]}</em>
                </h1>
                <p className="oa-sb">
                  {selProgram
                    ? `Viewing: ${selProgram.key} (${selProgram.type})`
                    : "Full program & devotee analytics dashboard."}
                </p>
              </div>
            </div>
            <div className="oa-strip">
              {[
                {
                  c: "oa-s0",
                  v: loading ? "—" : s.totalPrograms,
                  l: "Programs",
                },
                {
                  c: "oa-s1",
                  v: loading ? "—" : s.totalDevotees,
                  l: "Devotees",
                },
                {
                  c: "oa-s2",
                  v: loading ? "—" : `${s.avgAttendance || 0}%`,
                  l: "Avg Attendance",
                },
                {
                  c: "oa-s3",
                  v: loading ? "—" : data?.healthSplit?.inactive || 0,
                  l: "Devotees <40%",
                },
              ].map((x, i) => (
                <div key={i} className={`oa-si ${x.c}`}>
                  <div className="oa-sv">{x.v}</div>
                  <div className="oa-sl">{x.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ══ TODAY'S PROGRAMS ════════════════════════════════════ */}
        {!loading && data?.todayPrograms?.length > 0 && (
          <div className="oa-today">
            <div className="oa-today-inner">
              <span className="oa-today-lbl">Today</span>
              {data.todayPrograms.map((p) => (
                <div
                  key={p._id}
                  className={`oa-today-chip ${
                    p.markedToday
                      ? "marked"
                      : (p.frequency || "")
                          .toLowerCase()
                          .replace(/[\s-]/g, "") == "daily"
                      ? "daily"
                      : "unmarked"
                  }`}
                  onClick={() => navigate(`/owner/attendance/${p._id}`)}
                  title={
                    p.markedToday
                      ? "Attendance marked ✓"
                      : "Click to mark attendance"
                  }
                >
                  <span
                    className={`oa-today-dot ${
                      p.markedToday
                        ? "marked"
                        : (p.frequency || "")
                            .toLowerCase()
                            .replace(/[\s-]/g, "") == "daily"
                        ? "daily"
                        : "unmarked"
                    }`}
                  />
                  <span>{p.programKey}</span>
                  <span style={{ fontSize: "0.66rem", opacity: 0.7 }}>
                    · {p.time}
                  </span>
                  {p.markedToday && (
                    <span style={{ fontSize: "0.66rem", color: "#15803d" }}>
                      ✓
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══ FILTER BAR ══════════════════════════════════════════ */}
        <div className="oa-fb">
          <div className="oa-fb-in">
            <select
              className={`oa-sel${filters.programId ? " active" : ""}`}
              value={filters.programId}
              onChange={(e) => upd("programId", e.target.value)}
            >
              <option value="">All Programs</option>
              {(f.programs || []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.key} ({p.type})
                </option>
              ))}
            </select>
            <select
              className={`oa-sel${filters.programType ? " active" : ""}`}
              value={filters.programType}
              onChange={(e) => upd("programType", e.target.value)}
            >
              <option value="">All Types</option>
              {(f.programTypes || []).map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <select
              className={`oa-sel${filters.language ? " active" : ""}`}
              value={filters.language}
              onChange={(e) => upd("language", e.target.value)}
            >
              <option value="">All Languages</option>
              {(f.languages || []).map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
            <select
              className={`oa-sel${filters.area ? " active" : ""}`}
              value={filters.area}
              onChange={(e) => upd("area", e.target.value)}
            >
              <option value="">All Areas</option>
              {(f.areas || []).map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
            <select
              className={`oa-sel${filters.subArea ? " active" : ""}`}
              value={filters.subArea}
              onChange={(e) => upd("subArea", e.target.value)}
            >
              <option value="">All Sub-Areas</option>
              {(f.subAreas || []).map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
            <select
              className={`oa-sel${filters.frequency ? " active" : ""}`}
              value={filters.frequency}
              onChange={(e) => upd("frequency", e.target.value)}
            >
              <option value="">All Frequencies</option>
              {(f.frequencies || []).map((fr) => (
                <option key={fr} value={fr}>
                  {fr}
                </option>
              ))}
            </select>
            <span className="oa-sep" />
            <input
              type="date"
              className={`oa-date${filters.startDate ? " active" : ""}`}
              value={filters.startDate}
              onChange={(e) => upd("startDate", e.target.value)}
              title="Start date"
            />
            <span style={{ fontSize: "0.72rem", color: C.muted }}>to</span>
            <input
              type="date"
              className={`oa-date${filters.endDate ? " active" : ""}`}
              value={filters.endDate}
              onChange={(e) => upd("endDate", e.target.value)}
              title="End date"
            />
            {hasFilter && (
              <button className="oa-clear" onClick={clearAll}>
                ✕ Clear Filters
              </button>
            )}
          </div>
        </div>

        <div className="oa-body">
          {loading ? (
            <>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4,1fr)",
                  gap: 12,
                  marginBottom: 14,
                  marginTop: 4,
                }}
              >
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="sk"
                    style={{ height: 80, borderRadius: 12 }}
                  />
                ))}
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: 14,
                }}
              >
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="sk"
                    style={{ height: 200, borderRadius: 14 }}
                  />
                ))}
              </div>
            </>
          ) : (
            <>
              {/* ══ TODAY'S PROGRAMS ════════════════════════════════ */}
              {data?.todayPrograms?.length > 0 && (
                <TodayProgramsSection
                  todayPrograms={data.todayPrograms}
                  onAttendanceClick={(pid) =>
                    navigate(`/owner/attendance/${pid}`)
                  }
                />
              )}

              {/* ══ WEEKLY SCHEDULE ══════════════════════════════════ */}
              {data?.weeklySchedule?.some((d) => d.count > 0) && (
                <div style={{ marginBottom: 20 }}>
                  <div className="oa-sec">
                    <span className="oa-sec-t">Weekly Program Schedule</span>
                  </div>
                  <WeeklyScheduleChart
                    weeklySchedule={data.weeklySchedule}
                    onProgramClick={(prog) =>
                      setDrill(prog.programId?.toString())
                    }
                  />
                </div>
              )}

              {/* ══ 1. OVERVIEW — 12 metrics ════════════════════════ */}
              <div className="oa-sec">
                <span className="oa-sec-t">
                  <IChart />
                  Overview {selProgram ? `— ${selProgram.key}` : ""}
                </span>
              </div>
              <div className="oa-m4">
                {[
                  {
                    cl: "om0",
                    bg: "rgba(200,140,40,0.1)",
                    ico: <IProg />,
                    v: s.totalPrograms,
                    l: "Programs",
                    sub: `${s.activePrograms} active, ${s.inactivePrograms} inactive`,
                  },
                  {
                    cl: "om1",
                    bg: "rgba(22,163,74,0.1)",
                    ico: <IUser />,
                    v: s.totalDevotees,
                    l: "Devotees",
                    sub: `across ${s.totalPrograms} programs`,
                  },
                  {
                    cl: "om2",
                    bg: "rgba(124,58,237,0.1)",
                    ico: <IChart />,
                    v: `${s.avgAttendance || 0}%`,
                    l: "Avg Attendance",
                    sub: `${s.totalSessions || 0} total sessions`,
                  },
                  {
                    cl: "om3",
                    bg: "rgba(2,132,199,0.1)",
                    ico: <IProg />,
                    v: s.totalRecords || 0,
                    l: "Total Records",
                    sub: `${s.totalSessions || 0} sessions`,
                  },
                  {
                    cl: "om5",
                    bg: "rgba(220,38,38,0.08)",
                    ico: <IWarn />,
                    v: s.belowThreshold || 0,
                    l: "Overdue",
                    sub: `needs attention`,
                  },
                  {
                    cl: "om6",
                    bg: "rgba(217,119,6,0.1)",
                    ico: <IClock />,
                    v: s.noRecentAttendance || 0,
                    l: "No Recent Att.",
                    sub: `mark attendance`,
                  },
                  {
                    cl: "om8",
                    bg: "rgba(245,200,66,0.12)",
                    ico: <ISpark />,
                    v: s.bestProgram?.key || "—",
                    l: "Best Program",
                    sub: `${s.bestProgram?.pct || 0}% avg`,
                    fw: true,
                  },
                  {
                    cl: "om9",
                    bg: "rgba(220,38,38,0.06)",
                    ico: <IWarn />,
                    v: s.weakestProgram?.key || "—",
                    l: "Needs Work",
                    sub: `${s.weakestProgram?.pct || 0}% avg`,
                    fw: true,
                  },
                  {
                    cl: "om10",
                    bg: "rgba(5,150,105,0.1)",
                    ico: <ITrend />,
                    v: s.mostImproved?.key || "—",
                    l: "Most Improved",
                    sub: `+${s.mostImproved?.delta || 0}%`,
                    fw: true,
                  },
                  {
                    cl: "om11",
                    bg: "rgba(124,58,237,0.1)",
                    ico: <IUser />,
                    v: s.highestDevotees?.count || 0,
                    l: "Max Devotees",
                    sub: s.highestDevotees?.key || "—",
                  },
                  {
                    cl: "om4",
                    bg: "rgba(107,114,128,0.1)",
                    ico: <IProg />,
                    v: s.inactivePrograms || 0,
                    l: "Inactive",
                    sub: `programs disabled`,
                  },
                  {
                    cl: "om7",
                    bg: "rgba(8,145,178,0.1)",
                    ico: <IChart />,
                    v: data?.monthlyTrend?.length || 0,
                    l: "Months Tracked",
                    sub: `in analytics`,
                  },
                ].map((m, i) => (
                  <div
                    key={i}
                    className={`oa-metric ${m.cl}`}
                    onClick={() =>
                      m.fw &&
                      m.v !== "—" &&
                      setDrill(
                        (data?.byProgram || [])
                          .find((p) => p.programKey === m.v)
                          ?._id?.toString()
                      )
                    }
                  >
                    <div className="oa-m-ico" style={{ background: m.bg }}>
                      {m.ico}
                    </div>
                    <div
                      className="oa-m-val"
                      style={{
                        fontSize:
                          m.v && String(m.v).length > 5 ? "0.95rem" : "1.4rem",
                      }}
                    >
                      {m.v}
                    </div>
                    <div className="oa-m-lbl">{m.l}</div>
                    <div className="oa-m-sub">{m.sub}</div>
                  </div>
                ))}
              </div>

              {/* ══ 2. TRENDS ═══════════════════════════════════════ */}
              <div className="oa-sec">
                <span className="oa-sec-t">
                  <ITrend />
                  Trends
                </span>
              </div>
              <div className="g2">
                {/* Monthly line+bar attendance */}
                <div className="oa-card">
                  <div className="oa-ch">
                    <span className="oa-ct">Monthly Attendance % Trend</span>
                    {data?.monthlyTrend?.length > 0 && (
                      <span style={{ fontSize: "0.62rem", color: C.muted }}>
                        Last {data.monthlyTrend.length} months
                      </span>
                    )}
                  </div>
                  <div className="oa-cb">
                    {data?.monthlyTrend?.length >= 2 ? (
                      <>
                        <LineBarCombo
                          data={data.monthlyTrend.map((m) => ({
                            ...m,
                            value: m.pct,
                            label: m.label,
                          }))}
                          height={90}
                          barColor={C.blue}
                          lineColor={C.goldLight}
                        />
                        <div
                          style={{
                            display: "flex",
                            gap: 10,
                            marginTop: 10,
                            justifyContent: "center",
                          }}
                        >
                          {[
                            { c: C.blue, l: "Sessions (bar)" },
                            { c: C.goldLight, l: "Attendance % (line)" },
                          ].map((x) => (
                            <div
                              key={x.l}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 5,
                              }}
                            >
                              <span
                                style={{
                                  width: 9,
                                  height: 9,
                                  borderRadius: 3,
                                  background: x.c,
                                  flexShrink: 0,
                                }}
                              />
                              <span
                                style={{ fontSize: "0.66rem", color: C.mid }}
                              >
                                {x.l}
                              </span>
                            </div>
                          ))}
                        </div>
                        <div
                          style={{
                            display: "flex",
                            gap: 10,
                            marginTop: 10,
                            flexWrap: "wrap",
                          }}
                        >
                          {[
                            {
                              l: "Avg %",
                              v: `${
                                data.monthlyTrend.length
                                  ? Math.round(
                                      data.monthlyTrend.reduce(
                                        (s, m) => s + m.pct,
                                        0
                                      ) / data.monthlyTrend.length
                                    )
                                  : 0
                              }%`,
                            },
                            {
                              l: "Peak",
                              v: `${Math.max(
                                ...data.monthlyTrend.map((m) => m.pct)
                              )}%`,
                            },
                            {
                              l: "Sessions",
                              v: data.monthlyTrend.reduce(
                                (s, m) => s + (m.sessions || 0),
                                0
                              ),
                            },
                          ].map((x) => (
                            <div
                              key={x.l}
                              style={{
                                flex: 1,
                                minWidth: 60,
                                padding: "8px 10px",
                                background: "rgba(200,140,40,0.05)",
                                borderRadius: 9,
                                border: "1px solid rgba(200,140,40,0.1)",
                                textAlign: "center",
                              }}
                            >
                              <div
                                style={{
                                  fontFamily: "'Cinzel',serif",
                                  fontWeight: 700,
                                  fontSize: "0.95rem",
                                  color: "#2d1200",
                                }}
                              >
                                {x.v}
                              </div>
                              <div
                                style={{
                                  fontSize: "0.6rem",
                                  fontWeight: 600,
                                  color: C.muted,
                                  textTransform: "uppercase",
                                  letterSpacing: "0.08em",
                                }}
                              >
                                {x.l}
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div
                        style={{
                          textAlign: "center",
                          color: C.muted,
                          fontSize: "0.76rem",
                          padding: "20px 0",
                        }}
                      >
                        Not enough data for trend.
                      </div>
                    )}
                  </div>
                </div>

                {/* Cumulative area chart */}
                <div className="oa-card">
                  <div className="oa-ch">
                    <span className="oa-ct">Cumulative Attendance Growth</span>
                  </div>
                  <div className="oa-cb">
                    {data?.cumulativeData?.length >= 2 ? (
                      <>
                        <AreaChart
                          data={data.cumulativeData}
                          height={65}
                          color={C.gold}
                        />
                        <div
                          style={{
                            marginTop: 12,
                            padding: "10px 14px",
                            background: "rgba(200,140,40,0.05)",
                            borderRadius: 10,
                            border: "1px solid rgba(200,140,40,0.12)",
                            textAlign: "center",
                          }}
                        >
                          <div
                            style={{
                              fontFamily: "'Cinzel',serif",
                              fontWeight: 700,
                              fontSize: "1.3rem",
                              color: "#2d1200",
                            }}
                          >
                            {data.cumulativeData[data.cumulativeData.length - 1]
                              ?.cumPresent || 0}
                          </div>
                          <div
                            style={{
                              fontSize: "0.62rem",
                              fontWeight: 600,
                              color: C.muted,
                              textTransform: "uppercase",
                              letterSpacing: "0.08em",
                            }}
                          >
                            Total Present Records
                          </div>
                        </div>
                      </>
                    ) : (
                      <div
                        style={{
                          textAlign: "center",
                          color: C.muted,
                          fontSize: "0.76rem",
                          padding: "20px 0",
                        }}
                      >
                        No trend data yet.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Weekly trend */}
              <div className="gf">
                <div className="oa-card">
                  <div className="oa-ch">
                    <span className="oa-ct">
                      Weekly Attendance — Last 8 Weeks (Present vs Absent)
                    </span>
                  </div>
                  <div className="oa-cb">
                    {data?.weeklyData?.some((w) => w.total > 0) ? (
                      <>
                        <StackedBarChart
                          data={data.weeklyData.map((w) => ({
                            label: w.dateLabel || w.label,
                            present: w.present,
                            absent: w.absent,
                          }))}
                          height={80}
                        />
                        <div
                          style={{
                            display: "flex",
                            gap: 12,
                            marginTop: 8,
                            justifyContent: "center",
                          }}
                        >
                          {[
                            { c: C.green, l: "Present" },
                            { c: C.red, l: "Absent" },
                          ].map((x) => (
                            <div
                              key={x.l}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 5,
                              }}
                            >
                              <span
                                style={{
                                  width: 9,
                                  height: 9,
                                  borderRadius: 3,
                                  background: x.c,
                                  flexShrink: 0,
                                }}
                              />
                              <span
                                style={{ fontSize: "0.68rem", color: C.mid }}
                              >
                                {x.l}
                              </span>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div
                        style={{
                          textAlign: "center",
                          color: C.muted,
                          fontSize: "0.76rem",
                          padding: "20px 0",
                        }}
                      >
                        No weekly attendance data yet.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Per-program trend selector */}
              <ProgramTrendSelector
                byProgram={data?.byProgram}
                programTrends={data?.programTrends}
                onDrill={setDrill}
              />

              {/* ══ 3. COMPARISONS — Donut + Stacked Bar + HBar ════ */}
              <div className="oa-sec">
                <span className="oa-sec-t">
                  <IChart />
                  Comparisons
                </span>
              </div>

              {/* Present vs Absent + Status + Health donut row */}
              <div className="g3">
                {/* Present vs Absent Donut */}
                <div className="oa-card">
                  <div className="oa-ch">
                    <span className="oa-ct">Present vs Absent</span>
                  </div>
                  <div
                    className="oa-cb"
                    style={{ display: "flex", alignItems: "center", gap: 16 }}
                  >
                    <DonutChart
                      slices={[
                        {
                          label: "Present",
                          value: data?.presentVsAbsent?.present || 0,
                          color: C.green,
                          extra: {
                            "Total records": data?.presentVsAbsent?.total || 0,
                          },
                        },
                        {
                          label: "Absent",
                          value: data?.presentVsAbsent?.absent || 0,
                          color: C.red,
                        },
                      ]}
                      size={110}
                      label="Total"
                    />
                    <div className="oa-leg" style={{ flex: 1 }}>
                      {[
                        {
                          label: "Present",
                          value: data?.presentVsAbsent?.present || 0,
                          color: C.green,
                        },
                        {
                          label: "Absent",
                          value: data?.presentVsAbsent?.absent || 0,
                          color: C.red,
                        },
                      ].map((it, i) => {
                        const tot = data?.presentVsAbsent?.total || 1;
                        return (
                          <div key={i} className="oa-li">
                            <span
                              className="oa-ld"
                              style={{ background: it.color }}
                            />
                            <span className="oa-ll">{it.label}</span>
                            <span className="oa-lv">{it.value}</span>
                            <span className="oa-lp">
                              {Math.round((it.value / tot) * 100)}%
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Program Type Donut */}
                <div className="oa-card">
                  <div className="oa-ch">
                    <span className="oa-ct">Program Type Split</span>
                  </div>
                  <div
                    className="oa-cb"
                    style={{ display: "flex", alignItems: "center", gap: 16 }}
                  >
                    <DonutChart
                      slices={(data?.typeDistribution || []).map((t, i) => ({
                        label: t.type,
                        value: t.programCount,
                        color: PALETTE[i % PALETTE.length],
                        extra: { Devotees: t.devoteeCount },
                      }))}
                      size={110}
                      label="Programs"
                      onSliceClick={(sl) => upd("programType", sl.label)}
                    />
                    <div className="oa-leg" style={{ flex: 1 }}>
                      {(data?.typeDistribution || []).map((t, i) => {
                        const tot = s.totalPrograms || 1;
                        return (
                          <div
                            key={i}
                            className="oa-li"
                            onClick={() => upd("programType", t.type)}
                          >
                            <span
                              className="oa-ld"
                              style={{
                                background: PALETTE[i % PALETTE.length],
                              }}
                            />
                            <span
                              className="oa-ll"
                              style={{ fontSize: "0.66rem" }}
                            >
                              {t.type}
                            </span>
                            <span
                              className="oa-lv"
                              style={{ fontSize: "0.7rem" }}
                            >
                              {t.programCount}
                            </span>
                            <span className="oa-lp">
                              {Math.round((t.programCount / tot) * 100)}%
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Language Donut */}
                <div className="oa-card">
                  <div className="oa-ch">
                    <span className="oa-ct">Language Distribution</span>
                  </div>
                  <div
                    className="oa-cb"
                    style={{ display: "flex", alignItems: "center", gap: 16 }}
                  >
                    <DonutChart
                      slices={(data?.byLanguage || []).map((l, i) => ({
                        label: l.language,
                        value: l.devoteeCount,
                        color: PALETTE[(i + 2) % PALETTE.length],
                        extra: {
                          "Attendance %": `${l.pct}%`,
                          Programs: l.programCount,
                          Present: l.present,
                          Absent: l.absent,
                        },
                      }))}
                      size={110}
                      label="Devotees"
                      onSliceClick={(sl) => upd("language", sl.label)}
                    />
                    <div className="oa-leg" style={{ flex: 1 }}>
                      {(data?.byLanguage || []).map((l, i) => (
                        <div
                          key={i}
                          className="oa-li"
                          onClick={() => upd("language", l.language)}
                        >
                          <span
                            className="oa-ld"
                            style={{
                              background: PALETTE[(i + 2) % PALETTE.length],
                            }}
                          />
                          <span
                            className="oa-ll"
                            style={{ fontSize: "0.66rem" }}
                          >
                            {l.language}
                          </span>
                          <span
                            className="oa-lv"
                            style={{ fontSize: "0.7rem" }}
                          >
                            {l.devoteeCount}
                          </span>
                          <span
                            className={`oa-pct oa-p${pctCls(l.pct)}`}
                            style={{ fontSize: "0.62rem", marginLeft: 4 }}
                          >
                            {l.pct}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Vertical bar charts */}
              <div className="g3">
                {/* By Program — present count */}
                <div className="oa-card">
                  <div className="oa-ch">
                    <span className="oa-ct">Attendance by Program</span>
                  </div>
                  <div className="oa-cb">
                    <VBarChart
                      data={(data?.byProgram || []).slice(0, 8).map((p, i) => ({
                        label: p.programKey,
                        value: p.present || 0,
                        pct: p.attendance_pct,
                        extra: {
                          Devotees: p.devoteeCount,
                          Sessions: p.sessionCount,
                          Absent: p.absent || 0,
                        },
                      }))}
                      height={90}
                      colorFn={(d, i) => pctColor(d.pct)}
                      onBarClick={(b) => {
                        const p = (data?.byProgram || []).find(
                          (x) => x.programKey === b.label
                        );
                        p && setDrill(p._id.toString());
                      }}
                    />
                  </div>
                </div>

                {/* By Language — present count */}
                <div className="oa-card">
                  <div className="oa-ch">
                    <span className="oa-ct">Attendance by Language</span>
                  </div>
                  <div className="oa-cb">
                    <VBarChart
                      data={(data?.byLanguage || []).map((l, i) => ({
                        label: l.language,
                        value: l.present,
                        pct: l.pct,
                        extra: {
                          Devotees: l.devoteeCount,
                          Absent: l.absent,
                          Programs: l.programCount,
                        },
                      }))}
                      height={90}
                      colorFn={(_, i) => PALETTE[(i + 2) % PALETTE.length]}
                      onBarClick={(b) => upd("language", b.label)}
                    />
                  </div>
                </div>

                {/* By Area */}
                <div className="oa-card">
                  <div className="oa-ch">
                    <span className="oa-ct">Attendance by Area</span>
                  </div>
                  <div className="oa-cb">
                    <VBarChart
                      data={(data?.byArea || []).map((a, i) => ({
                        label: a.area,
                        value: a.present,
                        pct: a.pct,
                        extra: { Devotees: a.devoteeCount, Absent: a.absent },
                      }))}
                      height={90}
                      colorFn={(_, i) => PALETTE[(i + 3) % PALETTE.length]}
                      onBarClick={(b) => upd("area", b.label)}
                    />
                  </div>
                </div>
              </div>

              {/* Stacked bars — by program, by language, by area */}
              <div className="g3">
                <div className="oa-card">
                  <div className="oa-ch">
                    <span className="oa-ct">Present vs Absent by Program</span>
                  </div>
                  <div className="oa-cb">
                    <StackedBarChart
                      data={(data?.byProgram || [])
                        .slice(0, 8)
                        .map((p) => ({
                          label: p.programKey,
                          present: p.present || 0,
                          absent: p.absent || 0,
                        }))}
                      height={80}
                      onBarClick={(b) => {
                        const p = (data?.byProgram || []).find(
                          (x) => x.programKey === b.label
                        );
                        p && setDrill(p._id.toString());
                      }}
                    />
                  </div>
                </div>
                <div className="oa-card">
                  <div className="oa-ch">
                    <span className="oa-ct">Present vs Absent by Language</span>
                  </div>
                  <div className="oa-cb">
                    <StackedBarChart
                      data={(data?.byLanguage || []).map((l) => ({
                        label: l.language,
                        present: l.present,
                        absent: l.absent,
                      }))}
                      height={80}
                      onBarClick={(b) => upd("language", b.label)}
                    />
                  </div>
                </div>
                <div className="oa-card">
                  <div className="oa-ch">
                    <span className="oa-ct">Present vs Absent by Area</span>
                  </div>
                  <div className="oa-cb">
                    <StackedBarChart
                      data={(data?.byArea || []).map((a) => ({
                        label: a.area,
                        present: a.present,
                        absent: a.absent,
                      }))}
                      height={80}
                      onBarClick={(b) => upd("area", b.label)}
                    />
                  </div>
                </div>
              </div>

              {/* ══ E. FREQUENCY ANALYSIS ════════════════════════════ */}
              <div className="oa-sec">
                <span className="oa-sec-t">Frequency-Based Analysis</span>
              </div>
              <div className="g2">
                {/* Frequency bar chart */}
                <div className="oa-card">
                  <div className="oa-ch">
                    <span className="oa-ct">Attendance % by Frequency</span>
                  </div>
                  <div className="oa-cb">
                    <VBarChart
                      data={(data?.byFrequency || []).map((fr, i) => ({
                        label: fr.frequency,
                        value: fr.present,
                        pct: fr.pct,
                        extra: {
                          Programs: fr.programCount,
                          "Avg Gap": fr.avgGap !== null ? `${fr.avgGap}d` : "—",
                          Absent: fr.absent,
                        },
                      }))}
                      height={90}
                      colorFn={(d) => pctColor(d.pct)}
                      onBarClick={(b) => upd("frequency", b.label)}
                    />
                  </div>
                </div>

                {/* Frequency table */}
                <div className="oa-card">
                  <div className="oa-ch">
                    <span className="oa-ct">Frequency Summary Table</span>
                  </div>
                  <div style={{ overflowX: "auto" }}>
                    <table className="oa-tbl">
                      <thead>
                        <tr>
                          {[
                            "Frequency",
                            "Programs",
                            "Present",
                            "Absent",
                            "Att%",
                            "Avg Gap",
                          ].map((c) => (
                            <th key={c} className="oa-th">
                              {c}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {(data?.byFrequency || []).map((fr, i) => (
                          <tr
                            key={i}
                            className="oa-tr"
                            onClick={() => upd("frequency", fr.frequency)}
                          >
                            <td className="oa-td" style={{ fontWeight: 600 }}>
                              {fr.frequency}
                            </td>
                            <td
                              className="oa-td"
                              style={{
                                fontFamily: "'Cinzel',serif",
                                fontWeight: 700,
                              }}
                            >
                              {fr.programCount}
                            </td>
                            <td
                              className="oa-td"
                              style={{ color: C.green, fontWeight: 700 }}
                            >
                              {fr.present}
                            </td>
                            <td
                              className="oa-td"
                              style={{ color: C.red, fontWeight: 700 }}
                            >
                              {fr.absent}
                            </td>
                            <td className="oa-td">
                              <span className={`oa-pct oa-p${pctCls(fr.pct)}`}>
                                {fr.pct}%
                              </span>
                            </td>
                            <td
                              className="oa-td"
                              style={{
                                color:
                                  fr.avgGap !== null && fr.avgGap > 14
                                    ? C.red
                                    : C.mid,
                              }}
                            >
                              {fr.avgGap !== null ? `${fr.avgGap}d` : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* ══ 4. PROGRAM DEEP DIVE ════════════════════════════ */}
              <div className="oa-sec">
                <span className="oa-sec-t">
                  <IProg />
                  Program Deep Dive
                </span>
              </div>

              {/* Program-wise devotee count */}
              <div className="gf">
                <div className="oa-card">
                  <div className="oa-ch">
                    <span className="oa-ct">Program-wise Devotee Count</span>
                  </div>
                  <div className="oa-cb">
                    <VBarChart
                      data={(data?.byProgram || [])
                        .slice(0, 12)
                        .map((p, i) => ({
                          label: p.programKey,
                          value: p.devoteeCount,
                          extra: {
                            "Att %": `${p.attendance_pct}%`,
                            Sessions: p.sessionCount,
                            Present: p.present || 0,
                          },
                        }))}
                      height={90}
                      colorFn={(_, i) => PALETTE[i % PALETTE.length]}
                      onBarClick={(b) => {
                        const p = (data?.byProgram || []).find(
                          (x) => x.programKey === b.label
                        );
                        p && setDrill(p._id.toString());
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Ranking table */}
              <div className="gf">
                <div className="oa-card">
                  <div className="oa-ch">
                    <span className="oa-ct">
                      Program Ranking Table — Click Row to Drilldown
                    </span>
                  </div>
                  <div style={{ overflowX: "auto" }}>
                    <table className="oa-tbl" style={{ minWidth: 700 }}>
                      <thead>
                        <tr>
                          {[
                            "#",
                            "Program",
                            "Type",
                            "Freq",
                            "Area",
                            "Devotees",
                            "Sessions",
                            "Present",
                            "Absent",
                            "Att%",
                            "Trend",
                            "Last",
                            "Health",
                          ].map((c) => (
                            <th key={c} className="oa-th">
                              {c}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {(data?.programHealth || []).map((p, i) => {
                          const spkData = (
                            data?.programTrends?.[p._id.toString()] || []
                          ).map((t) => t.pct);
                          return (
                            <tr
                              key={String(p._id)}
                              className="oa-tr"
                              onClick={() => setDrill(p._id.toString())}
                            >
                              <td
                                className="oa-td"
                                style={{
                                  fontFamily: "'Cinzel',serif",
                                  fontWeight: 700,
                                  color: C.muted,
                                }}
                              >
                                {i + 1}
                              </td>
                              <td className="oa-td">
                                <span className="oa-kp">{p.programKey}</span>
                              </td>
                              <td
                                className="oa-td"
                                style={{ fontSize: "0.7rem", color: C.muted }}
                              >
                                {p.programType}
                              </td>
                              <td
                                className="oa-td"
                                style={{ fontSize: "0.7rem", color: C.muted }}
                              >
                                {p.frequency}
                              </td>
                              <td
                                className="oa-td"
                                style={{ fontSize: "0.7rem", color: C.muted }}
                              >
                                {p.area}
                              </td>
                              <td
                                className="oa-td"
                                style={{
                                  fontFamily: "'Cinzel',serif",
                                  fontWeight: 700,
                                }}
                              >
                                {p.devoteeCount}
                              </td>
                              <td
                                className="oa-td"
                                style={{
                                  fontFamily: "'Cinzel',serif",
                                  fontWeight: 700,
                                }}
                              >
                                {p.sessionCount}
                              </td>
                              <td
                                className="oa-td"
                                style={{ fontWeight: 700, color: C.green }}
                              >
                                {p.present || 0}
                              </td>
                              <td
                                className="oa-td"
                                style={{ fontWeight: 700, color: C.red }}
                              >
                                {p.absent || 0}
                              </td>
                              <td className="oa-td">
                                <span
                                  className={`oa-pct oa-p${pctCls(
                                    p.attendance_pct || 0
                                  )}`}
                                >
                                  {p.attendance_pct || 0}%
                                </span>
                              </td>
                              <td className="oa-td">
                                <Sparkline
                                  data={spkData}
                                  color={pctColor(p.attendance_pct || 0)}
                                  width={56}
                                  height={20}
                                />
                              </td>
                              <td
                                className="oa-td"
                                style={{ fontSize: "0.68rem", color: C.muted }}
                              >
                                {fmtShort(p.lastDate)}
                              </td>
                              <td className="oa-td">
                                <span
                                  className={`hb hb-${p.label?.[0] || "H"}`}
                                >
                                  {p.label}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* ══ H. PROGRAM HEALTH GRID ═══════════════════════════ */}
              <div className="oa-sec">
                <span className="oa-sec-t">
                  <IWarn />
                  Program Health &amp; Risk
                </span>
              </div>
              <div className="oa-hg">
                {(data?.programHealth || []).map((p) => {
                  const spkData = (
                    data?.programTrends?.[p._id.toString()] || []
                  ).map((t) => t.pct);
                  const trendLabel =
                    p.trendDir === "improving"
                      ? "↗ Improving"
                      : p.trendDir === "declining"
                      ? "↘ Declining"
                      : "→ Stable";
                  return (
                    <div
                      key={String(p._id)}
                      className={`oa-hc oa-hc-${p.label?.[0] || "H"}`}
                      onClick={() => setDrill(p._id.toString())}
                    >
                      <div className="oa-hk">
                        <span>{p.programKey}</span>
                        <span className={`hb hb-${p.label?.[0] || "H"}`}>
                          {p.label}
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          gap: 8,
                          alignItems: "center",
                          marginBottom: 6,
                          flexWrap: "wrap",
                        }}
                      >
                        <span
                          className={`oa-pct oa-p${pctCls(
                            p.attendance_pct || 0
                          )}`}
                        >
                          {p.attendance_pct || 0}%
                        </span>
                        <span style={{ fontSize: "0.68rem", color: C.muted }}>
                          {p.devoteeCount} devotees
                        </span>
                        <span style={{ fontSize: "0.68rem", color: C.muted }}>
                          {p.sessionCount} sessions
                        </span>
                        <span className={`td-${p.trendDir?.[0] || "s"}`}>
                          {trendLabel}
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Sparkline
                          data={spkData}
                          color={pctColor(p.attendance_pct || 0)}
                          width={70}
                          height={22}
                        />
                        <span style={{ fontSize: "0.68rem", color: C.muted }}>
                          {p.daysOverdue !== null
                            ? `${p.daysOverdue}d ago`
                            : "Never"}
                        </span>
                      </div>
                      {p.issues?.length > 0 && (
                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 3,
                            marginTop: 6,
                          }}
                        >
                          {p.issues.map((iss, i) => (
                            <span
                              key={i}
                              style={{
                                fontSize: "0.6rem",
                                background: "rgba(0,0,0,0.06)",
                                color: C.mid,
                                padding: "1px 6px",
                                borderRadius: 20,
                              }}
                            >
                              {iss}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* ══ 5. DEVOTEE INSIGHTS ══════════════════════════════ */}
              <div className="oa-sec">
                <span className="oa-sec-t">
                  <IUser />
                  Devotee Insights
                </span>
              </div>
              <div className="g3">
                {/* Top devotees */}
                <div className="oa-card">
                  <div className="oa-ch">
                    <span className="oa-ct">Most Regular</span>
                  </div>
                  <div className="oa-cb" style={{ padding: "10px 14px" }}>
                    {(data?.topDevotees || []).slice(0, 8).map((d, i) => (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 7,
                          padding: "6px 0",
                          borderBottom: "1px solid rgba(200,140,40,0.07)",
                        }}
                      >
                        <div
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: 5,
                            background: `linear-gradient(135deg,${C.gold},#7a3a00)`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "0.55rem",
                            fontWeight: 700,
                            color: "#fff",
                            flexShrink: 0,
                          }}
                        >
                          {i + 1}
                        </div>
                        <span
                          style={{
                            flex: 1,
                            fontSize: "0.76rem",
                            fontWeight: 500,
                            color: "#2d1200",
                          }}
                        >
                          {d.devoteeName}
                        </span>
                        <span
                          style={{
                            fontSize: "0.62rem",
                            color: C.muted,
                            fontFamily: "'Cinzel',serif",
                          }}
                        >
                          {d.programKey}
                        </span>
                        <span style={{ fontSize: "0.62rem", color: C.muted }}>
                          {d.attended}/{d.totalSessions}
                        </span>
                        <span className={`oa-pct oa-p${pctCls(d.percentage)}`}>
                          {d.percentage}%
                        </span>
                      </div>
                    ))}
                    {!data?.topDevotees?.length && (
                      <div
                        style={{
                          textAlign: "center",
                          padding: "14px 0",
                          color: C.muted,
                          fontSize: "0.76rem",
                        }}
                      >
                        No devotee data yet.
                      </div>
                    )}
                  </div>
                </div>

                {/* Irregular devotees */}
                <div className="oa-card">
                  <div className="oa-ch">
                    <span className="oa-ct">Irregular (Need Follow-up)</span>
                  </div>
                  <div className="oa-cb" style={{ padding: "10px 14px" }}>
                    {(data?.bottomDevotees || [])
                      .filter((d) => d.percentage < 60)
                      .slice(0, 8)
                      .map((d, i) => (
                        <div
                          key={i}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 7,
                            padding: "6px 0",
                            borderBottom: "1px solid rgba(200,140,40,0.07)",
                          }}
                        >
                          <span
                            style={{
                              width: 7,
                              height: 7,
                              borderRadius: "50%",
                              background: d.percentage < 40 ? C.red : C.amber,
                              flexShrink: 0,
                            }}
                          />
                          <span
                            style={{
                              flex: 1,
                              fontSize: "0.76rem",
                              fontWeight: 500,
                              color: "#2d1200",
                            }}
                          >
                            {d.devoteeName}
                          </span>
                          <span
                            style={{
                              fontSize: "0.62rem",
                              color: C.muted,
                              fontFamily: "'Cinzel',serif",
                            }}
                          >
                            {d.programKey}
                          </span>
                          <span style={{ fontSize: "0.62rem", color: C.muted }}>
                            {d.attended}/{d.totalSessions}
                          </span>
                          <span
                            className={`oa-pct oa-p${pctCls(d.percentage)}`}
                          >
                            {d.percentage}%
                          </span>
                        </div>
                      ))}
                    {!(data?.bottomDevotees || []).filter(
                      (d) => d.percentage < 60
                    ).length && (
                      <div
                        style={{
                          textAlign: "center",
                          padding: "14px 0",
                          color: C.green,
                          fontSize: "0.76rem",
                        }}
                      >
                        All devotees above 60% — excellent!
                      </div>
                    )}
                  </div>
                </div>

                {/* New devotees */}
                <div className="oa-card">
                  <div className="oa-ch">
                    <span className="oa-ct">New This Week</span>
                    {data?.newDevotees?.length > 0 && (
                      <span
                        style={{
                          fontSize: "0.64rem",
                          fontWeight: 700,
                          background: "rgba(2,132,199,0.1)",
                          color: C.blue,
                          padding: "2px 8px",
                          borderRadius: 20,
                        }}
                      >
                        {data.newDevotees.length}
                      </span>
                    )}
                  </div>
                  <div className="oa-cb" style={{ padding: "10px 14px" }}>
                    {(data?.newDevotees || []).length ? (
                      data.newDevotees.map((d, i) => (
                        <div
                          key={i}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 7,
                            padding: "6px 0",
                            borderBottom: "1px solid rgba(200,140,40,0.07)",
                          }}
                        >
                          <span
                            style={{
                              width: 7,
                              height: 7,
                              borderRadius: "50%",
                              background: C.blue,
                              flexShrink: 0,
                            }}
                          />
                          <span
                            style={{
                              flex: 1,
                              fontSize: "0.76rem",
                              fontWeight: 500,
                              color: "#2d1200",
                            }}
                          >
                            {d.name}
                          </span>
                          <span
                            style={{
                              fontSize: "0.62rem",
                              color: C.muted,
                              fontFamily: "'Cinzel',serif",
                            }}
                          >
                            {d.program?.programKey || "—"}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div
                        style={{
                          textAlign: "center",
                          padding: "14px 0",
                          color: C.muted,
                          fontSize: "0.76rem",
                        }}
                      >
                        No new devotees this week.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {data?.topDevotees?.length > 0 && (
                <div className="gf">
                  <div className="oa-card">
                    <div className="oa-ch">
                      <span className="oa-ct">
                        Top Devotees by Attendance % (Bar)
                      </span>
                      <span style={{ fontSize: "0.62rem", color: C.muted }}>
                        Top {Math.min(15, (data.topDevotees || []).length)} of{" "}
                        {(data.topDevotees || []).length}
                      </span>
                    </div>
                    <div className="oa-cb">
                      <VBarChart
                        data={(data.topDevotees || [])
                          .slice(0, 15)
                          .map((d) => ({
                            label: d.devoteeName.split(" ")[0],
                            value: d.percentage,
                            pct: d.percentage,
                            extra: {
                              Program: d.programKey,
                              Attended: `${d.attended}/${d.totalSessions}`,
                              "Full name": d.devoteeName,
                            },
                          }))}
                        height={90}
                        colorFn={(d) => pctColor(d.pct)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ══ NEW: MORE DONUT CHARTS ═══════════════════════════ */}
              <div className="oa-sec">
                <span className="oa-sec-t">Composition Analysis</span>
              </div>
              <div className="g3">
                {/* Devotee health donut */}
                <div className="oa-card">
                  <div className="oa-ch">
                    <span className="oa-ct">Devotee Health Split</span>
                  </div>
                  <div
                    className="oa-cb"
                    style={{ display: "flex", alignItems: "center", gap: 16 }}
                  >
                    <DonutChart
                      slices={[
                        {
                          label: "Active ≥80%",
                          value: data?.healthSplit?.active || 0,
                          color: C.green,
                          extra: { Threshold: "≥80% attendance" },
                        },
                        {
                          label: "Moderate 40–79%",
                          value: data?.healthSplit?.moderate || 0,
                          color: C.amber,
                          extra: { Threshold: "40–79% attendance" },
                        },
                        {
                          label: "Inactive <40%",
                          value: data?.healthSplit?.inactive || 0,
                          color: C.red,
                          extra: { Threshold: "<40% attendance" },
                        },
                      ]}
                      size={110}
                      label="Devotees"
                    />
                    <div className="oa-leg" style={{ flex: 1 }}>
                      {[
                        {
                          l: "Active ≥80%",
                          v: data?.healthSplit?.active || 0,
                          c: C.green,
                        },
                        {
                          l: "Moderate 40–79%",
                          v: data?.healthSplit?.moderate || 0,
                          c: C.amber,
                        },
                        {
                          l: "Inactive <40%",
                          v: data?.healthSplit?.inactive || 0,
                          c: C.red,
                        },
                      ].map((it, i) => {
                        const tot =
                          (data?.healthSplit?.active || 0) +
                            (data?.healthSplit?.moderate || 0) +
                            (data?.healthSplit?.inactive || 0) || 1;
                        return (
                          <div key={i} className="oa-li">
                            <span
                              className="oa-ld"
                              style={{ background: it.c }}
                            />
                            <span
                              className="oa-ll"
                              style={{ fontSize: "0.68rem" }}
                            >
                              {it.l}
                            </span>
                            <span className="oa-lv">{it.v}</span>
                            <span className="oa-lp">
                              {Math.round((it.v / tot) * 100)}%
                            </span>
                          </div>
                        );
                      })}
                      <div
                        style={{
                          marginTop: 8,
                          paddingTop: 8,
                          borderTop: "1px solid rgba(200,140,40,0.1)",
                          fontSize: "0.68rem",
                          color: C.muted,
                        }}
                      >
                        Total tracked:{" "}
                        {(data?.healthSplit?.active || 0) +
                          (data?.healthSplit?.moderate || 0) +
                          (data?.healthSplit?.inactive || 0)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Virtual vs In-Person donut */}
                <div className="oa-card">
                  <div className="oa-ch">
                    <span className="oa-ct">Virtual vs In-Person</span>
                  </div>
                  <div
                    className="oa-cb"
                    style={{ display: "flex", alignItems: "center", gap: 16 }}
                  >
                    {(() => {
                      const virt = data?.virtualCount || 0;
                      const inPerson = data?.inPersonCount || 0;
                      const total = virt + inPerson;
                      return (
                        <>
                          <DonutChart
                            slices={[
                              {
                                label: "In Person",
                                value: inPerson,
                                color: C.blue,
                                extra: { Programs: inPerson },
                              },
                              {
                                label: "Virtual",
                                value: virt,
                                color: C.purple,
                                extra: { Programs: virt },
                              },
                            ]}
                            size={110}
                            label="Programs"
                          />
                          <div className="oa-leg" style={{ flex: 1 }}>
                            {[
                              { l: "In Person", v: inPerson, c: C.blue },
                              { l: "Virtual", v: virt, c: C.purple },
                            ].map((it, i) => (
                              <div key={i} className="oa-li">
                                <span
                                  className="oa-ld"
                                  style={{ background: it.c }}
                                />
                                <span className="oa-ll">{it.l}</span>
                                <span className="oa-lv">{it.v}</span>
                                <span className="oa-lp">
                                  {total ? Math.round((it.v / total) * 100) : 0}
                                  %
                                </span>
                              </div>
                            ))}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* Status split donut */}
                <div className="oa-card">
                  <div className="oa-ch">
                    <span className="oa-ct">Program Status Split</span>
                  </div>
                  <div
                    className="oa-cb"
                    style={{ display: "flex", alignItems: "center", gap: 16 }}
                  >
                    {(() => {
                      // Use summary's activePrograms/inactivePrograms from summary
                      const active =
                        s.activePrograms || data?.statusSplit?.active || 0;
                      const inactive =
                        s.inactivePrograms || data?.statusSplit?.inactive || 0;
                      const tot = active + inactive || 1;
                      return (
                        <>
                          <DonutChart
                            slices={[
                              {
                                label: "Active",
                                value: active,
                                color: C.green,
                                extra: { "Active programs": active },
                              },
                              {
                                label: "Inactive",
                                value: inactive,
                                color: "#6b7280",
                                extra: { "Disabled programs": inactive },
                              },
                            ]}
                            size={110}
                            label="Programs"
                          />
                          <div className="oa-leg" style={{ flex: 1 }}>
                            {[
                              { l: "Active", v: active, c: C.green },
                              { l: "Inactive", v: inactive, c: "#6b7280" },
                            ].map((it, i) => (
                              <div key={i} className="oa-li">
                                <span
                                  className="oa-ld"
                                  style={{ background: it.c }}
                                />
                                <span className="oa-ll">{it.l}</span>
                                <span className="oa-lv">{it.v}</span>
                                <span className="oa-lp">
                                  {Math.round((it.v / tot) * 100)}%
                                </span>
                              </div>
                            ))}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* ══ NEW: PROGRAM TYPE ADVANCED ANALYSIS ═════════════ */}
              <div className="oa-sec">
                <span className="oa-sec-t">
                  <IChart />
                  Program Type Advanced Analysis
                </span>
              </div>
              <div className="g2">
                {/* Bubble chart — type vs sessions vs devotees */}
                <div className="oa-card">
                  <div className="oa-ch">
                    <span className="oa-ct">
                      Type vs Sessions vs Devotees (Bubble)
                    </span>
                    <span style={{ fontSize: "0.62rem", color: C.muted }}>
                      Bubble size = devotees · Click to filter
                    </span>
                  </div>
                  <div className="oa-cb">
                    <ProgramTypeBubble
                      byProgram={data?.byProgram || []}
                      onClick={(type) => upd("programType", type)}
                    />
                    <div
                      style={{
                        marginTop: 8,
                        display: "flex",
                        gap: 10,
                        flexWrap: "wrap",
                        fontSize: "0.66rem",
                        color: C.muted,
                      }}
                    >
                      <span>X axis: Total sessions</span>
                      <span>Y axis: Avg attendance %</span>
                      <span>Bubble size: Devotee count</span>
                    </div>
                  </div>
                </div>

                {/* Type comparison table */}
                <div className="oa-card">
                  <div className="oa-ch">
                    <span className="oa-ct">Type Performance Summary</span>
                  </div>
                  <div style={{ overflowX: "auto" }}>
                    <table className="oa-tbl">
                      <thead>
                        <tr>
                          {[
                            "Type",
                            "Programs",
                            "Devotees",
                            "Sessions",
                            "Avg%",
                            "Focus",
                          ].map((c) => (
                            <th key={c} className="oa-th">
                              {c}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          const typeMap = {};
                          (data?.byProgram || []).forEach((p) => {
                            const t = p.programType || "Unknown";
                            if (!typeMap[t])
                              typeMap[t] = {
                                type: t,
                                programs: 0,
                                devotees: 0,
                                sessions: 0,
                                pctSum: 0,
                              };
                            typeMap[t].programs++;
                            typeMap[t].devotees += p.devoteeCount || 0;
                            typeMap[t].sessions += p.sessionCount || 0;
                            typeMap[t].pctSum += p.attendance_pct || 0;
                          });
                          return Object.values(typeMap).map((t, i) => {
                            const avgPct = t.programs
                              ? Math.round(t.pctSum / t.programs)
                              : 0;
                            const focus =
                              avgPct < 40
                                ? "High"
                                : avgPct < 70
                                ? "Medium"
                                : "Low";
                            const focusColor =
                              avgPct < 40
                                ? C.red
                                : avgPct < 70
                                ? C.amber
                                : C.green;
                            return (
                              <tr
                                key={i}
                                className="oa-tr"
                                onClick={() => upd("programType", t.type)}
                              >
                                <td className="oa-td">
                                  <span
                                    style={{
                                      fontSize: "0.76rem",
                                      fontWeight: 600,
                                      color: "#2d1200",
                                    }}
                                  >
                                    {t.type}
                                  </span>
                                </td>
                                <td
                                  className="oa-td"
                                  style={{
                                    fontFamily: "'Cinzel',serif",
                                    fontWeight: 700,
                                  }}
                                >
                                  {t.programs}
                                </td>
                                <td
                                  className="oa-td"
                                  style={{
                                    fontFamily: "'Cinzel',serif",
                                    fontWeight: 700,
                                  }}
                                >
                                  {t.devotees}
                                </td>
                                <td
                                  className="oa-td"
                                  style={{
                                    fontFamily: "'Cinzel',serif",
                                    fontWeight: 700,
                                  }}
                                >
                                  {t.sessions}
                                </td>
                                <td className="oa-td">
                                  <span
                                    className={`oa-pct oa-p${pctCls(avgPct)}`}
                                  >
                                    {avgPct}%
                                  </span>
                                </td>
                                <td className="oa-td">
                                  <span
                                    style={{
                                      fontSize: "0.68rem",
                                      fontWeight: 700,
                                      color: focusColor,
                                      background: `${focusColor}18`,
                                      padding: "2px 8px",
                                      borderRadius: 20,
                                    }}
                                  >
                                    {focus}
                                  </span>
                                </td>
                              </tr>
                            );
                          });
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* ══ ATTENDANCE HEATMAP CALENDAR ══════════════════════ */}
              <div className="oa-sec">
                <span className="oa-sec-t">
                  <IChart />
                  Attendance Heatmap
                </span>
                <span style={{ fontSize: "0.62rem", color: C.muted }}>
                  Last 90 days · Hover for details
                </span>
              </div>
              <div className="gf">
                <AttendanceHeatmap
                  attendanceData={data?.recentSessions || []}
                  byProgram={data?.byProgram || []}
                  programTrends={data?.programTrends || {}}
                />
              </div>

              {/* ══ NEW: COMPARE PROGRAMS OF SAME TYPE ══════════════ */}
              {(data?.byProgram || []).length > 1 &&
                (() => {
                  // Group programs by type
                  const typeGroups = {};
                  (data?.byProgram || []).forEach((p) => {
                    const t = p.programType || "Unknown";
                    if (!typeGroups[t]) typeGroups[t] = [];
                    typeGroups[t].push(p);
                  });
                  const typesWithMultiple = Object.entries(typeGroups).filter(
                    ([, progs]) => progs.length > 1
                  );
                  if (!typesWithMultiple.length) return null;
                  return (
                    <>
                      <div className="oa-sec">
                        <span className="oa-sec-t">
                          Compare Programs by Same Type
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 16,
                          marginBottom: 14,
                        }}
                      >
                        {typesWithMultiple.map(([type, progs]) => (
                          <div key={type} className="oa-card">
                            <div className="oa-ch">
                              <span className="oa-ct">
                                {type} — {progs.length} Programs
                              </span>
                              <button
                                style={{
                                  fontSize: "0.7rem",
                                  color: C.gold,
                                  background: "none",
                                  border: "none",
                                  cursor: "pointer",
                                  fontWeight: 600,
                                }}
                                onClick={() => upd("programType", type)}
                              >
                                Filter to this type →
                              </button>
                            </div>
                            <div className="oa-cb">
                              <div
                                style={{
                                  display: "grid",
                                  gridTemplateColumns:
                                    "repeat(auto-fill,minmax(200px,1fr))",
                                  gap: 10,
                                  marginBottom: 12,
                                }}
                              >
                                {progs.map((p, i) => {
                                  const spk = (
                                    data?.programTrends?.[p._id?.toString()] ||
                                    []
                                  ).map((t) => t.pct);
                                  const trendDir =
                                    spk.length >= 3
                                      ? spk[spk.length - 1] - spk[0] > 5
                                        ? "↗"
                                        : spk[0] - spk[spk.length - 1] > 5
                                        ? "↘"
                                        : "→"
                                      : "—";
                                  return (
                                    <div
                                      key={i}
                                      style={{
                                        padding: "12px 14px",
                                        border: `1.5px solid ${
                                          PALETTE[i % PALETTE.length]
                                        }35`,
                                        borderRadius: 12,
                                        background: `${
                                          PALETTE[i % PALETTE.length]
                                        }08`,
                                        cursor: "pointer",
                                        transition: "all 0.18s",
                                      }}
                                      onClick={() =>
                                        setDrill(p._id?.toString())
                                      }
                                    >
                                      <div
                                        style={{
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "space-between",
                                          marginBottom: 6,
                                        }}
                                      >
                                        <span className="oa-kp">
                                          {p.programKey}
                                        </span>
                                        <span
                                          className={`oa-pct oa-p${pctCls(
                                            p.attendance_pct || 0
                                          )}`}
                                        >
                                          {p.attendance_pct || 0}%
                                        </span>
                                      </div>
                                      <div
                                        style={{
                                          display: "flex",
                                          gap: 8,
                                          marginBottom: 6,
                                          flexWrap: "wrap",
                                        }}
                                      >
                                        <span
                                          style={{
                                            fontSize: "0.66rem",
                                            color: C.muted,
                                          }}
                                        >
                                          {p.devoteeCount} devotees
                                        </span>
                                        <span
                                          style={{
                                            fontSize: "0.66rem",
                                            color: C.muted,
                                          }}
                                        >
                                          {p.sessionCount} sessions
                                        </span>
                                        <span
                                          style={{
                                            fontSize: "0.7rem",
                                            fontWeight: 700,
                                            color:
                                              trendDir === "↗"
                                                ? C.green
                                                : trendDir === "↘"
                                                ? C.red
                                                : C.muted,
                                          }}
                                        >
                                          {trendDir}
                                        </span>
                                      </div>
                                      <Sparkline
                                        data={spk}
                                        color={PALETTE[i % PALETTE.length]}
                                        width={80}
                                        height={22}
                                      />
                                      <div
                                        style={{
                                          display: "flex",
                                          gap: 8,
                                          marginTop: 6,
                                        }}
                                      >
                                        <span
                                          style={{
                                            fontSize: "0.65rem",
                                            color: C.green,
                                            fontWeight: 600,
                                          }}
                                        >
                                          ✓ {p.present || 0}
                                        </span>
                                        <span
                                          style={{
                                            fontSize: "0.65rem",
                                            color: C.red,
                                            fontWeight: 600,
                                          }}
                                        >
                                          ✗ {p.absent || 0}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                              {/* Stacked comparison bar */}
                              <StackedBarChart
                                data={progs.map((p) => ({
                                  label: p.programKey,
                                  present: p.present || 0,
                                  absent: p.absent || 0,
                                }))}
                                height={60}
                                onBarClick={(b) => {
                                  const p = progs.find(
                                    (x) => x.programKey === b.label
                                  );
                                  p && setDrill(p._id?.toString());
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  );
                })()}
              {insights.length > 0 && (
                <>
                  <div className="oa-sec">
                    <span className="oa-sec-t">
                      <ISpark />
                      Smart Insights
                    </span>
                  </div>
                  <div className="oa-insight">
                    <div className="oa-it">Auto-Generated Insights</div>
                    {insights.map((ins, i) => (
                      <div key={i} className="oa-ii">
                        <div
                          className="oa-ii-ico"
                          style={{
                            background:
                              ins.t === "good"
                                ? "rgba(22,163,74,0.15)"
                                : ins.t === "warn"
                                ? "rgba(220,38,38,0.15)"
                                : "rgba(200,140,40,0.15)",
                            color:
                              ins.t === "good"
                                ? "#4ade80"
                                : ins.t === "warn"
                                ? "#f87171"
                                : "#f5c842",
                          }}
                        >
                          {ins.ico}
                        </div>
                        <div className="oa-ii-txt">{ins.txt}</div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* ══ DEVOTEE SEARCH ══════════════════════════════════ */}
              <div className="oa-sec">
                <span className="oa-sec-t">
                  <IUser />
                  Devotee Search
                </span>
              </div>
              <OwnerDevoteeSearch />
            </>
          )}
        </div>

        {/* ══ DRILLDOWN PANEL ══════════════════════════════════════ */}
        {drill && (
          <DrilldownPanel
            programId={drill}
            onClose={() => setDrill(null)}
            programTrends={data?.programTrends}
          />
        )}
      </div>
    </>
  );
}
