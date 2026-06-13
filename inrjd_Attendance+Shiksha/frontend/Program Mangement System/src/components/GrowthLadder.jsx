import { useMemo } from "react";

const STAGES = [
  { level: "None", label: "New Participant", color: "#64748b", bg: "#f1f5f9" },
  { level: "Shraddhavan", label: "Shraddhavan", color: "#3b82f6", bg: "#dbeafe" },
  { level: "Krishna Sevak", label: "Krishna Sevak", color: "#8b5cf6", bg: "#ede9fe" },
  { level: "Krishna Sadhak", label: "Krishna Sadhak", color: "#f59e0b", bg: "#fef3c7" },
  { level: "Srila Prabhupada Ashraya", label: "SP Ashraya", color: "#ef4444", bg: "#fee2e2" },
  { level: "Srila Guru Charana Ashraya", label: "Guru Charana Ashraya", color: "#10b981", bg: "#d1fae5" },
];

export default function GrowthLadder({ currentLevel = "None", certifications = [] }) {
  const currentIdx = useMemo(() => {
    const idx = STAGES.findIndex((s) => s.level === currentLevel);
    return idx >= 0 ? idx : 0;
  }, [currentLevel]);

  // Find certification date for each level
  const levelDates = useMemo(() => {
    const map = {};
    certifications.forEach((c) => {
      if (!map[c.newLevelAfter || c.certificationLevel]) {
        map[c.newLevelAfter || c.certificationLevel] = c.certificationDate;
      }
    });
    return map;
  }, [certifications]);

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "";

  return (
    <div style={{ padding: "0" }}>
      <style>{`
        .gl-container { position: relative; display: flex; flex-direction: column-reverse; gap: 0; max-width: 700px; margin: 0 auto; }
        .gl-stage { position: relative; display: flex; align-items: stretch; min-height: 62px; transition: all .3s ease; }
        .gl-bar { flex: 1; border-radius: 10px; padding: 14px 18px; display: flex; align-items: center; justify-content: space-between; position: relative; overflow: hidden; transition: all .3s ease; }
        .gl-bar.reached { box-shadow: 0 4px 14px rgba(0,0,0,.1); }
        .gl-bar.current { box-shadow: 0 6px 24px rgba(0,0,0,.15); transform: scale(1.03); }
        .gl-bar.future { opacity: .45; }
        .gl-number { position: absolute; left: -44px; top: 50%; transform: translateY(-50%); width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: .85rem; color: #fff; }
        .gl-label { font-weight: 700; font-size: .95rem; }
        .gl-date { font-size: .78rem; opacity: .8; }
        .gl-badge { font-size: .68rem; font-weight: 700; padding: 2px 10px; border-radius: 20px; color: #fff; }
        .gl-arrow { position: absolute; right: -30px; top: 0; bottom: 0; display: flex; align-items: center; }
        .gl-arrow svg { width: 22px; height: 22px; }
        @media(max-width:600px) { .gl-number { left: -36px; width: 28px; height: 28px; font-size: .75rem; } .gl-bar { padding: 10px 14px; } .gl-label { font-size: .85rem; } }
      `}</style>

      <div className="gl-container" style={{ paddingLeft: 50 }}>
        {STAGES.map((stage, idx) => {
          const isReached = idx <= currentIdx;
          const isCurrent = idx === currentIdx;
          const isFuture = idx > currentIdx;
          const date = levelDates[stage.level];
          // Each bar gets progressively wider to create staircase effect
          const widthPct = 50 + (idx / (STAGES.length - 1)) * 50;

          return (
            <div key={stage.level} className="gl-stage" style={{ marginBottom: idx < STAGES.length - 1 ? 6 : 0 }}>
              <div className="gl-number" style={{ background: isReached ? stage.color : "#cbd5e1" }}>
                {idx === 0 ? "—" : `0${idx}`}
              </div>
              <div
                className={`gl-bar ${isReached ? "reached" : ""} ${isCurrent ? "current" : ""} ${isFuture ? "future" : ""}`}
                style={{
                  background: isReached
                    ? `linear-gradient(135deg, ${stage.color}22, ${stage.bg})`
                    : "#f8fafc",
                  borderLeft: `4px solid ${isReached ? stage.color : "#e2e8f0"}`,
                  width: `${widthPct}%`,
                }}
              >
                <div>
                  <div className="gl-label" style={{ color: isReached ? stage.color : "#94a3b8" }}>
                    {stage.label}
                  </div>
                  {date && (
                    <div className="gl-date" style={{ color: stage.color }}>
                      Achieved: {fmtDate(date)}
                    </div>
                  )}
                </div>
                {isCurrent && (
                  <span className="gl-badge" style={{ background: stage.color }}>
                    CURRENT
                  </span>
                )}
                {isReached && !isCurrent && idx > 0 && (
                  <span className="gl-badge" style={{ background: stage.color, opacity: .7 }}>
                    ✓
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Upward arrow at top */}
      <div style={{ textAlign: "center", marginTop: 10 }}>
        <svg width="40" height="40" viewBox="0 0 40 40" style={{ opacity: .25 }}>
          <polygon points="20,4 36,28 4,28" fill="#10b981" />
        </svg>
      </div>
    </div>
  );
}
