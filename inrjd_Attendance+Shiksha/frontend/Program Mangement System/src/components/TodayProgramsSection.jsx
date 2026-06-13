import { useNavigate } from "react-router-dom";

const css = `
.tps-wrap { margin-bottom: 20px; }
.tps-hd {
  display:flex; align-items:center; justify-content:space-between; margin-bottom:12px;
}
.tps-title {
  font-family:'Cinzel',serif; font-size:0.68rem; font-weight:700;
  color:#7a4a10; letter-spacing:0.18em; text-transform:uppercase;
  display:flex; align-items:center; gap:8px;
}
.tps-title::before { content:''; width:14px; height:2px; background:linear-gradient(90deg,#c8903c,rgba(200,140,40,0.2)); border-radius:1px; }
.tps-count { font-size:0.68rem; font-weight:700; background:rgba(200,140,40,0.1); color:#7a4a00; padding:2px 9px; border-radius:20px; }

.tps-empty {
  padding:20px; background:#fff; border:1px solid rgba(200,140,40,0.14);
  border-radius:14px; text-align:center; color:#a08060; font-family:'Cinzel',serif; font-size:0.78rem;
  letter-spacing:0.04em;
}

.tps-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(260px,1fr)); gap:14px; }

.tps-card {
  background:#fff; border-radius:16px; overflow:hidden;
  border:1px solid; cursor:pointer; transition:all 0.2s;
  box-shadow:0 2px 10px rgba(61,23,0,0.05);
  position:relative;
}
.tps-card:hover { transform:translateY(-3px); box-shadow:0 10px 28px rgba(61,23,0,0.12); }
.tps-card.marked   { border-color:rgba(22,163,74,0.25); }
.tps-card.unmarked { border-color:rgba(220,38,38,0.25); }
.tps-card.daily    { border-color:rgba(200,140,40,0.3); }

/* Top strip */
.tps-strip { height:4px; }
.tps-strip.marked   { background:linear-gradient(90deg,#16a34a,#4ade80); }
.tps-strip.unmarked { background:linear-gradient(90deg,#dc2626,#f87171); }
.tps-strip.daily    { background:linear-gradient(90deg,#c8903c,#f5c842); }

.tps-inner { padding:16px; }

/* Header row */
.tps-hrow { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:12px; }
.tps-key  { font-family:'Cinzel',serif; font-size:1rem; font-weight:700; color:#2d1200; }
.tps-status-pill {
  font-size:0.62rem; font-weight:800; padding:3px 10px; border-radius:20px;
  display:flex; align-items:center; gap:4px; text-transform:uppercase; letter-spacing:0.06em;
  flex-shrink:0;
}
.tps-status-pill.marked   { background:rgba(22,163,74,0.12);  color:#15803d; }
.tps-status-pill.unmarked { background:rgba(220,38,38,0.1);   color:#b91c1c; }
.tps-status-pill.daily    { background:rgba(200,140,40,0.12); color:#7a4a00; }
.tps-status-dot { width:6px; height:6px; border-radius:50%; flex-shrink:0; }
.tps-status-dot.marked   { background:#16a34a; }
.tps-status-dot.unmarked { background:#dc2626; animation:tdsPulse 1.8s ease-in-out infinite; }
.tps-status-dot.daily    { background:#c8903c; }
@keyframes tdsPulse { 0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(220,38,38,0.5)} 50%{opacity:0.7;box-shadow:0 0 0 4px rgba(220,38,38,0)} }

/* Info grid */
.tps-info { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:12px; }
.tps-info-item { display:flex; align-items:center; gap:6px; }
.tps-info-ico  { font-size:0.85rem; flex-shrink:0; }
.tps-info-text { font-size:0.74rem; color:#5c3a14; font-weight:500; }
.tps-info-sub  { font-size:0.65rem; color:#a08060; }

/* Progress bar */
.tps-prog-wrap { margin-bottom:12px; }
.tps-prog-lbl { display:flex; justify-content:space-between; margin-bottom:4px; }
.tps-prog-lbl span { font-size:0.66rem; color:#8b6840; font-weight:500; }
.tps-prog-lbl strong { font-size:0.7rem; font-weight:700; }
.tps-prog-track { height:5px; background:rgba(200,140,40,0.1); border-radius:3px; overflow:hidden; }
.tps-prog-fill  { height:100%; border-radius:3px; transition:width 0.5s ease; }

/* Tags row */
.tps-tags { display:flex; flex-wrap:wrap; gap:5px; margin-bottom:12px; }
.tps-tag  { font-size:0.64rem; font-weight:600; padding:2px 8px; border-radius:20px; }
.tps-tag-type  { background:rgba(124,58,237,0.1); color:#6d28d9; }
.tps-tag-freq  { background:rgba(2,132,199,0.1);  color:#0369a1; }
.tps-tag-lang  { background:rgba(5,150,105,0.1);  color:#065f46; }
.tps-tag-virt  { background:rgba(99,102,241,0.1); color:#4338ca; }
.tps-tag-area  { background:rgba(200,140,40,0.1); color:#7a4a00; }

/* CTA button */
.tps-cta {
  width:100%; padding:9px; border:none; border-radius:10px;
  font-family:'DM Sans',sans-serif; font-size:0.82rem; font-weight:700;
  cursor:pointer; transition:all 0.15s; display:flex; align-items:center; justify-content:center; gap:6px;
}
.tps-cta.marked   { background:rgba(22,163,74,0.08);  color:#15803d; }
.tps-cta.unmarked { background:linear-gradient(135deg,#dc2626,#b91c1c); color:#fff; }
.tps-cta.daily    { background:linear-gradient(135deg,#7a3200,#c8903c); color:#fff; }
.tps-cta:hover { opacity:0.88; transform:translateY(-1px); }

@media(max-width:600px){ .tps-grid{grid-template-columns:1fr;} .tps-info{grid-template-columns:1fr;} }
`;

function pctColor(p) {
  return p >= 80 ? "#16a34a" : p >= 40 ? "#d97706" : "#dc2626";
}
function pctGrad(p) {
  return p >= 80
    ? "linear-gradient(90deg,#16a34a,#4ade80)"
    : p >= 40
    ? "linear-gradient(90deg,#d97706,#fbbf24)"
    : "linear-gradient(90deg,#dc2626,#f87171)";
}
function fmtDate(d) {
  if (!d) return "Never";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

export default function TodayProgramsSection({
  todayPrograms = [],
  onAttendanceClick,
}) {
  const navigate = useNavigate();

  const getVariant = (p) => {
    if (p.markedToday) return "marked";
    const freq = (p.frequency || "").toLowerCase().replace(/[\s-]/g, "");
    if (freq === "daily") return "daily";
    return "unmarked";
  };

  return (
    <>
      <style>{css}</style>
      <div className="tps-wrap">
        <div className="tps-hd">
          <span className="tps-title">Today's Programs</span>
          {todayPrograms.length > 0 && (
            <span className="tps-count">
              {todayPrograms.filter((p) => p.markedToday).length}/
              {todayPrograms.length} marked
            </span>
          )}
        </div>

        {todayPrograms.length === 0 ? (
          <div className="tps-empty">🙏 No programs scheduled for today</div>
        ) : (
          <div className="tps-grid">
            {todayPrograms.map((p) => {
              const variant = getVariant(p);
              const pct = p.avgAttendance || 0;
              // Support both dashboard (programId field) and analytics (only _id from spread)
              const pid = p.programId || p._id;
              return (
                <div key={String(pid)} className={`tps-card ${variant}`}>
                  <div className={`tps-strip ${variant}`} />
                  <div className="tps-inner">
                    {/* Header */}
                    <div className="tps-hrow">
                      <div className="tps-key">{p.programKey}</div>
                      <span className={`tps-status-pill ${variant}`}>
                        <span className={`tps-status-dot ${variant}`} />
                        {variant === "marked"
                          ? "Marked"
                          : variant === "daily"
                          ? "Daily"
                          : "Not Marked"}
                      </span>
                    </div>

                    {/* Info grid */}
                    <div className="tps-info">
                      {p.time && (
                        <div className="tps-info-item">
                          <span className="tps-info-ico">⏰</span>
                          <div>
                            <div className="tps-info-text">{p.time}</div>
                            <div className="tps-info-sub">Time</div>
                          </div>
                        </div>
                      )}
                      {p.area && (
                        <div className="tps-info-item">
                          <span className="tps-info-ico">📍</span>
                          <div>
                            <div className="tps-info-text">{p.area}</div>
                            <div className="tps-info-sub">Area</div>
                          </div>
                        </div>
                      )}
                      <div className="tps-info-item">
                        <span className="tps-info-ico">👥</span>
                        <div>
                          <div className="tps-info-text">{p.devoteeCount}</div>
                          <div className="tps-info-sub">Devotees</div>
                        </div>
                      </div>
                      <div className="tps-info-item">
                        <span className="tps-info-ico">📅</span>
                        <div>
                          <div className="tps-info-text">
                            {fmtDate(p.lastSession)}
                          </div>
                          <div className="tps-info-sub">Last Session</div>
                        </div>
                      </div>
                    </div>

                    {/* Attendance progress */}
                    <div className="tps-prog-wrap">
                      <div className="tps-prog-lbl">
                        <span>Avg Attendance</span>
                        <strong style={{ color: pctColor(pct) }}>{pct}%</strong>
                      </div>
                      <div className="tps-prog-track">
                        <div
                          className="tps-prog-fill"
                          style={{ width: `${pct}%`, background: pctGrad(pct) }}
                        />
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="tps-tags">
                      {p.programType && (
                        <span className="tps-tag tps-tag-type">
                          {p.programType}
                        </span>
                      )}
                      {p.frequency && (
                        <span className="tps-tag tps-tag-freq">
                          {p.frequency}
                        </span>
                      )}
                      {p.language && (
                        <span className="tps-tag tps-tag-lang">
                          {p.language}
                        </span>
                      )}
                      {p.isVirtual && (
                        <span className="tps-tag tps-tag-virt">🌐 Virtual</span>
                      )}
                      {p.subArea && (
                        <span className="tps-tag tps-tag-area">
                          {p.subArea}
                        </span>
                      )}
                    </div>

                    {/* CTA */}
                    <button
                      className={`tps-cta ${variant}`}
                      onClick={() =>
                        onAttendanceClick
                          ? onAttendanceClick(pid)
                          : navigate(`/owner/attendance/${pid}`)
                      }
                    >
                      {variant === "marked" ? (
                        <>✅ View Attendance</>
                      ) : (
                        <>Mark Attendance →</>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
