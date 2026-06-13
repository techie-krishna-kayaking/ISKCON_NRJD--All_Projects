import { useState } from "react";

// ── Premium Day Colors ────────────────────────────────────────────────
const DAY_COLORS = {
  Monday: {
    bg: "#1e3a5f",
    bar: "linear-gradient(180deg,#3b82f6,#1d4ed8)",
    label: "#93c5fd",
  },
  Tuesday: {
    bg: "#1a3a2e",
    bar: "linear-gradient(180deg,#10b981,#059669)",
    label: "#6ee7b7",
  },
  Wednesday: {
    bg: "#3b1f5e",
    bar: "linear-gradient(180deg,#8b5cf6,#6d28d9)",
    label: "#c4b5fd",
  },
  Thursday: {
    bg: "#3d2000",
    bar: "linear-gradient(180deg,#f59e0b,#d97706)",
    label: "#fde68a",
  },
  Friday: {
    bg: "#1e3a2f",
    bar: "linear-gradient(180deg,#14b8a6,#0f766e)",
    label: "#99f6e4",
  },
  Saturday: {
    bg: "#3a1a2e",
    bar: "linear-gradient(180deg,#ec4899,#be185d)",
    label: "#f9a8d4",
  },
  Sunday: {
    bg: "#3a1a1a",
    bar: "linear-gradient(180deg,#ef4444,#b91c1c)",
    label: "#fca5a5",
  },
};

const PROG_PALETTE = [
  "#f59e0b",
  "#3b82f6",
  "#10b981",
  "#8b5cf6",
  "#ef4444",
  "#14b8a6",
  "#ec4899",
  "#06b6d4",
  "#84cc16",
  "#f97316",
  "#a78bfa",
  "#34d399",
  "#fbbf24",
  "#60a5fa",
  "#fb7185",
];

const css = `
.wsc-wrap {
  background:#fff; border:1px solid rgba(200,140,40,0.14);
  border-radius:16px; overflow:hidden;
  box-shadow:0 2px 12px rgba(61,23,0,0.05);
}
.wsc-hd {
  padding:13px 20px; border-bottom:1px solid rgba(200,140,40,0.1);
  background:linear-gradient(to right,rgba(200,140,40,0.06),transparent);
  display:flex; align-items:center; justify-content:space-between;
}
.wsc-title { font-family:'Cinzel',serif; font-size:0.68rem; font-weight:700; color:#5c3a14; letter-spacing:0.12em; text-transform:uppercase; }
.wsc-meta  { font-size:0.64rem; color:#a08060; }
.wsc-body  { padding:16px 20px; }

/* Chart */
.wsc-chart { display:grid; grid-template-columns:repeat(7,1fr); gap:8px; height:160px; align-items:flex-end; margin-bottom:10px; }
.wsc-col   { display:flex; flex-direction:column; align-items:center; gap:4px; height:100%; justify-content:flex-end; }
.wsc-bars  { width:100%; display:flex; flex-direction:column-reverse; align-items:center; position:relative; }
.wsc-seg   { width:100%; cursor:pointer; transition:all 0.18s; position:relative; min-height:4px; }
.wsc-seg:first-child { border-radius:0 0 4px 4px; }
.wsc-seg:last-child  { border-radius:4px 4px 0 0; }
.wsc-seg:only-child  { border-radius:4px; }
.wsc-seg:hover       { filter:brightness(1.2); transform:scaleX(1.06); z-index:2; }
.wsc-day-lbl { font-size:0.6rem; font-weight:700; letter-spacing:0.08em; text-align:center; margin-top:4px; }
.wsc-count-lbl { font-family:'Cinzel',serif; font-size:0.65rem; font-weight:700; color:#2d1200; }
.wsc-today-ring { outline:2px solid rgba(200,140,40,0.5); outline-offset:2px; border-radius:5px; }

/* Today badge */
.wsc-today-badge {
  font-size:0.52rem; font-weight:800; padding:1px 5px; border-radius:10px;
  background:rgba(200,140,40,0.15); color:#c8903c; letter-spacing:0.06em; text-transform:uppercase;
}

/* Tooltip */
.wsc-tooltip {
  position:fixed; z-index:9999; pointer-events:none;
  background:rgba(20,6,0,0.94); backdrop-filter:blur(8px);
  border:1px solid rgba(200,140,40,0.3); border-radius:12px;
  padding:12px 14px; min-width:180px; max-width:240px;
  box-shadow:0 12px 40px rgba(0,0,0,0.4);
  font-family:'DM Sans',sans-serif;
}

/* Legend */
.wsc-legend { display:flex; flex-wrap:wrap; gap:6px; margin-top:12px; padding-top:10px; border-top:1px solid rgba(200,140,40,0.08); }
.wsc-leg-item { display:flex; align-items:center; gap:4px; font-size:0.68rem; color:#5c3a14; font-weight:500; }
.wsc-leg-dot  { width:9px; height:9px; border-radius:50%; flex-shrink:0; }

/* Schedule list */
.wsc-sched-list { margin-top:12px; display:grid; grid-template-columns:repeat(auto-fill,minmax(160px,1fr)); gap:8px; }
.wsc-sched-day  { padding:10px 12px; border-radius:10px; border:1px solid rgba(200,140,40,0.1); }
.wsc-sched-dname{ font-family:'Cinzel',serif; font-size:0.64rem; font-weight:700; margin-bottom:6px; letter-spacing:0.1em; text-transform:uppercase; }
.wsc-sched-prog { display:flex; align-items:center; gap:6px; padding:3px 0; font-size:0.7rem; color:#3d1800; }
.wsc-sched-time { font-size:0.64rem; color:#a08060; }

@media(max-width:600px){.wsc-chart{gap:4px;height:120px;}}
`;

// Assign consistent color per program key
const progColorMap = {};
let colorIdx = 0;
function getProgColor(key) {
  if (!progColorMap[key]) {
    progColorMap[key] = PROG_PALETTE[colorIdx % PROG_PALETTE.length];
    colorIdx++;
  }
  return progColorMap[key];
}

export default function WeeklyScheduleChart({
  weeklySchedule = [],
  onProgramClick,
}) {
  const [tip, setTip] = useState({ visible: false, x: 0, y: 0, content: null });

  if (!weeklySchedule.length) return null;

  const maxCount = Math.max(...weeklySchedule.map((d) => d.count), 1);
  const totalWeekPrograms = weeklySchedule.reduce((s, d) => s + d.count, 0);
  const uniqueProgs = [
    ...new Set(
      weeklySchedule.flatMap((d) => d.programs.map((p) => p.programKey))
    ),
  ];

  // Reset color map for consistent rendering
  const localColorMap = {};
  uniqueProgs.forEach((key, i) => {
    localColorMap[key] = PROG_PALETTE[i % PROG_PALETTE.length];
  });

  const showTip = (e, content) =>
    setTip({ visible: true, x: e.clientX + 14, y: e.clientY - 20, content });
  const hideTip = () => setTip((p) => ({ ...p, visible: false }));

  return (
    <>
      <style>{css}</style>
      <div className="wsc-wrap">
        <div className="wsc-hd">
          <span className="wsc-title">Weekly Program Schedule</span>
          <span className="wsc-meta">
            {totalWeekPrograms} programs this week
          </span>
        </div>
        <div className="wsc-body">
          {/* Stacked bar chart */}
          <div className="wsc-chart">
            {weeklySchedule.map((dayData, di) => {
              const dayColor = DAY_COLORS[dayData.day] || DAY_COLORS.Monday;
              const barHeight =
                dayData.count > 0
                  ? Math.max(24, (dayData.count / maxCount) * 130)
                  : 0;
              const segH = dayData.count > 0 ? barHeight / dayData.count : 0;

              return (
                <div key={dayData.day} className="wsc-col">
                  {dayData.count > 0 && (
                    <div className="wsc-count-lbl">{dayData.count}</div>
                  )}
                  <div
                    className={`wsc-bars${
                      dayData.isToday ? " wsc-today-ring" : ""
                    }`}
                    style={{
                      height: barHeight || 4,
                      width: "100%",
                      borderRadius: 4,
                    }}
                  >
                    {dayData.count === 0 ? (
                      <div
                        style={{
                          width: "100%",
                          height: 4,
                          background: "rgba(200,140,40,0.1)",
                          borderRadius: 4,
                        }}
                      />
                    ) : (
                      dayData.programs.map((prog, pi) => {
                        const color = localColorMap[prog.programKey];
                        return (
                          <div
                            key={pi}
                            className="wsc-seg"
                            style={{
                              height: segH,
                              background: color,
                              borderBottom:
                                pi > 0
                                  ? "1px solid rgba(255,255,255,0.15)"
                                  : undefined,
                            }}
                            onMouseEnter={(e) =>
                              showTip(
                                e,
                                <div>
                                  <div
                                    style={{
                                      fontFamily: "'Cinzel',serif",
                                      fontWeight: 700,
                                      color,
                                      fontSize: "0.82rem",
                                      marginBottom: 6,
                                    }}
                                  >
                                    {prog.programKey}
                                  </div>
                                  {prog.programType && (
                                    <div
                                      style={{
                                        color: "rgba(255,220,160,0.9)",
                                        fontSize: "0.72rem",
                                        marginBottom: 2,
                                      }}
                                    >
                                      Type:{" "}
                                      <strong style={{ color: "#fff" }}>
                                        {prog.programType}
                                      </strong>
                                    </div>
                                  )}
                                  {prog.time && (
                                    <div
                                      style={{
                                        color: "rgba(255,220,160,0.9)",
                                        fontSize: "0.72rem",
                                        marginBottom: 2,
                                      }}
                                    >
                                      ⏰ Time:{" "}
                                      <strong style={{ color: "#fff" }}>
                                        {prog.time}
                                      </strong>
                                    </div>
                                  )}
                                  {prog.area && (
                                    <div
                                      style={{
                                        color: "rgba(255,220,160,0.9)",
                                        fontSize: "0.72rem",
                                        marginBottom: 2,
                                      }}
                                    >
                                      📍 Area:{" "}
                                      <strong style={{ color: "#fff" }}>
                                        {prog.area}
                                      </strong>
                                    </div>
                                  )}
                                  {prog.frequency && (
                                    <div
                                      style={{
                                        color: "rgba(255,220,160,0.9)",
                                        fontSize: "0.72rem",
                                        marginBottom: 2,
                                      }}
                                    >
                                      🔄 {prog.frequency}
                                    </div>
                                  )}
                                  {prog.isVirtual && (
                                    <div
                                      style={{
                                        color: "rgba(164,202,255,0.9)",
                                        fontSize: "0.7rem",
                                        marginTop: 2,
                                      }}
                                    >
                                      🌐 Virtual
                                    </div>
                                  )}
                                </div>
                              )
                            }
                            onMouseMove={(e) =>
                              setTip((p) => ({
                                ...p,
                                x: e.clientX + 14,
                                y: e.clientY - 20,
                              }))
                            }
                            onMouseLeave={hideTip}
                            onClick={() =>
                              onProgramClick && onProgramClick(prog)
                            }
                          />
                        );
                      })
                    )}
                  </div>
                  <div
                    className="wsc-day-lbl"
                    style={{ color: dayColor.label }}
                  >
                    {dayData.day.slice(0, 3).toUpperCase()}
                  </div>
                  {dayData.isToday && (
                    <span className="wsc-today-badge">Today</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          {uniqueProgs.length > 0 && (
            <div className="wsc-legend">
              {uniqueProgs.map((key) => (
                <div key={key} className="wsc-leg-item">
                  <span
                    className="wsc-leg-dot"
                    style={{ background: localColorMap[key] }}
                  />
                  {key}
                </div>
              ))}
            </div>
          )}

          {/* Day-wise schedule list */}
          <div className="wsc-sched-list">
            {weeklySchedule
              .filter((d) => d.count > 0)
              .map((dayData) => {
                const dayColor = DAY_COLORS[dayData.day] || DAY_COLORS.Monday;
                return (
                  <div
                    key={dayData.day}
                    className="wsc-sched-day"
                    style={{
                      background: dayColor.bg + "22",
                      borderColor: dayColor.label + "30",
                    }}
                  >
                    <div
                      className="wsc-sched-dname"
                      style={{ color: dayColor.label }}
                    >
                      {dayData.day} {dayData.isToday && "(Today)"}
                    </div>
                    {dayData.programs.map((prog, pi) => (
                      <div
                        key={pi}
                        className="wsc-sched-prog"
                        style={{ cursor: "pointer" }}
                        onClick={() => onProgramClick && onProgramClick(prog)}
                      >
                        <span
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            background: localColorMap[prog.programKey],
                            flexShrink: 0,
                          }}
                        />
                        <span
                          style={{
                            flex: 1,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {prog.programKey}
                        </span>
                        {prog.time && (
                          <span className="wsc-sched-time">{prog.time}</span>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {tip.visible && tip.content && (
        <div className="wsc-tooltip" style={{ left: tip.x, top: tip.y }}>
          {tip.content}
        </div>
      )}
    </>
  );
}
