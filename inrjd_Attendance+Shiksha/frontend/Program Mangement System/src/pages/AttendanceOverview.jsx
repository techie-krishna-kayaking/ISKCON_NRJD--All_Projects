import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import toast from "react-hot-toast";

const css = `
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=DM+Sans:wght@300;400;500;600;700&display=swap');

.ao-page { min-height:100vh; background:#f5efe6; font-family:'DM Sans',sans-serif; padding-bottom:60px; }

/* ── Banner ── */
.ao-banner {
  background:linear-gradient(135deg,#1e0a00 0%,#4a1a00 35%,#7a3200 70%,#a84800 100%);
  padding:32px 0 0; position:relative; overflow:hidden;
}
.ao-banner::before {
  content:''; position:absolute; inset:0;
  background:url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.025'%3E%3Ccircle cx='30' cy='30' r='20'/%3E%3C/g%3E%3C/svg%3E");
  pointer-events:none;
}
.ao-banner-inner { max-width:1100px; margin:0 auto; padding:0 28px; position:relative; z-index:1; }
.ao-eyebrow { font-family:'Cinzel',serif; font-size:0.62rem; font-weight:700; color:rgba(200,150,60,0.85); letter-spacing:0.22em; text-transform:uppercase; margin-bottom:10px; display:flex; align-items:center; gap:8px; }
.ao-eyebrow::before,.ao-eyebrow::after { content:''; width:30px; height:1px; background:rgba(200,150,60,0.4); }
.ao-banner-title { font-family:'Cinzel',serif; font-size:clamp(1.6rem,3.5vw,2.2rem); color:#fff; margin:0 0 8px; font-weight:700; }
.ao-banner-sub   { color:rgba(255,215,150,0.65); font-size:0.9rem; margin:0 0 28px; }

/* Banner stat strip */
.ao-strip { display:grid; grid-template-columns:repeat(4,1fr); border-top:1px solid rgba(255,255,255,0.1); margin:0 -28px; }
.ao-strip-item { padding:16px 20px; border-right:1px solid rgba(255,255,255,0.08); }
.ao-strip-item:last-child { border-right:none; }
.ao-strip-val { font-family:'Cinzel',serif; font-size:1.5rem; font-weight:700; color:#fff; line-height:1; margin-bottom:3px; }
.ao-strip-lbl { font-size:0.66rem; font-weight:600; color:rgba(255,215,150,0.5); text-transform:uppercase; letter-spacing:0.1em; }

/* ── Body ── */
.ao-body { max-width:1100px; margin:0 auto; padding:24px 28px 60px; }

/* ── Toolbar ── */
.ao-toolbar { display:flex; flex-wrap:wrap; gap:10px; align-items:center; margin-bottom:20px; }
.ao-filter-btn {
  display:flex; align-items:center; gap:6px;
  padding:8px 16px; border-radius:24px; cursor:pointer; transition:all 0.15s;
  font-size:0.8rem; font-weight:600; border:1.5px solid transparent;
}
.ao-filter-btn.all     { background:#fff; color:#5c3a14; border-color:rgba(200,140,40,0.25); }
.ao-filter-btn.all:hover,.ao-filter-btn.all.sel { background:rgba(200,140,40,0.1); border-color:#c8903c; }
.ao-filter-btn.red     { background:rgba(220,38,38,0.07);  color:#b91c1c; border-color:rgba(220,38,38,0.2); }
.ao-filter-btn.red.sel { background:rgba(220,38,38,0.15); border-color:#dc2626; }
.ao-filter-btn.yellow  { background:rgba(251,191,36,0.08); color:#92400e; border-color:rgba(251,191,36,0.25); }
.ao-filter-btn.yellow.sel { background:rgba(251,191,36,0.16); border-color:#d97706; }
.ao-filter-btn.green   { background:rgba(22,163,74,0.07); color:#15803d; border-color:rgba(22,163,74,0.2); }
.ao-filter-btn.green.sel { background:rgba(22,163,74,0.14); border-color:#16a34a; }
.ao-filter-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
.ao-filter-dot.red    { background:#dc2626; }
.ao-filter-dot.yellow { background:#d97706; }
.ao-filter-dot.green  { background:#16a34a; }

/* ── Program cards grid ── */
.ao-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(340px,1fr)); gap:16px; }

/* ── Program card ── */
.ao-card {
  background:#fff; border-radius:16px; overflow:hidden;
  border:1px solid rgba(200,140,40,0.14);
  box-shadow:0 2px 12px rgba(61,23,0,0.06);
  transition:all 0.2s; cursor:pointer; position:relative;
}
.ao-card:hover { transform:translateY(-3px); box-shadow:0 8px 28px rgba(61,23,0,0.12); border-color:rgba(200,140,40,0.35); }
.ao-card-top { height:4px; }
.ao-card-top-red    { background:linear-gradient(90deg,#dc2626,#f87171); }
.ao-card-top-yellow { background:linear-gradient(90deg,#d97706,#fbbf24); }
.ao-card-top-green  { background:linear-gradient(90deg,#16a34a,#4ade80); }

.ao-card-body { padding:18px 20px 0; }
.ao-card-head { display:flex; align-items:flex-start; justify-content:space-between; gap:10px; margin-bottom:14px; }
.ao-key { font-family:'Cinzel',serif; font-size:0.9rem; font-weight:700; color:#2d1200; }
.ao-type { font-size:0.72rem; color:#8b6840; margin-top:2px; }

/* Status pill */
.ao-status { display:flex; align-items:center; gap:5px; padding:4px 10px; border-radius:20px; font-size:0.72rem; font-weight:700; flex-shrink:0; }
.ao-status-red    { background:rgba(220,38,38,0.1);  color:#b91c1c; }
.ao-status-yellow { background:rgba(251,191,36,0.1); color:#92400e; }
.ao-status-green  { background:rgba(22,163,74,0.1);  color:#15803d; }
.ao-status-dot { width:6px; height:6px; border-radius:50%; flex-shrink:0; }
.ao-status-dot-red    { background:#dc2626; animation:aoPulse 1.8s ease-in-out infinite; }
.ao-status-dot-yellow { background:#d97706; animation:aoPulse 2.5s ease-in-out infinite; }
.ao-status-dot-green  { background:#16a34a; }
@keyframes aoPulse { 0%,100%{opacity:1} 50%{opacity:0.45} }

/* Meta row */
.ao-meta { display:flex; flex-wrap:wrap; gap:10px; margin-bottom:14px; }
.ao-meta-item { display:flex; align-items:center; gap:5px; font-size:0.75rem; color:#7a5a30; }
.ao-meta-ico  { color:#a08060; }

/* Days indicator */
.ao-days-bar { margin-bottom:14px; }
.ao-days-label { display:flex; justify-content:space-between; font-size:0.7rem; color:#8b6840; margin-bottom:5px; }
.ao-days-track { height:5px; background:rgba(200,140,40,0.1); border-radius:3px; overflow:hidden; }
.ao-days-fill { height:100%; border-radius:3px; transition:width 0.5s ease; }
.ao-days-fill-red    { background:linear-gradient(90deg,#dc2626,#f87171); }
.ao-days-fill-yellow { background:linear-gradient(90deg,#d97706,#fbbf24); }
.ao-days-fill-green  { background:linear-gradient(90deg,#16a34a,#4ade80); }

/* Stats row */
.ao-card-stats { display:grid; grid-template-columns:1fr 1fr 1fr; border-top:1px solid rgba(200,140,40,0.08); }
.ao-stat-cell { padding:10px 12px; text-align:center; border-right:1px solid rgba(200,140,40,0.08); }
.ao-stat-cell:last-child { border-right:none; }
.ao-stat-val { font-family:'Cinzel',serif; font-size:1rem; font-weight:700; color:#2d1200; }
.ao-stat-lbl { font-size:0.6rem; font-weight:600; color:#a08060; text-transform:uppercase; letter-spacing:0.06em; margin-top:1px; }

/* Mark button */
.ao-card-foot { padding:12px 20px; }
.ao-mark-btn {
  width:100%; padding:10px; border:none; border-radius:10px;
  background:linear-gradient(135deg,#7a3200,#b85000); color:#fff;
  font-family:'DM Sans',sans-serif; font-size:0.84rem; font-weight:700;
  cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px;
  transition:all 0.18s; letter-spacing:0.02em;
}
.ao-mark-btn:hover { background:linear-gradient(135deg,#8d3a00,#d06000); transform:translateY(-1px); }

/* Skeleton */
.ao-skel { background:linear-gradient(90deg,rgba(200,140,40,0.07) 25%,rgba(200,140,40,0.14) 50%,rgba(200,140,40,0.07) 75%); background-size:200% 100%; animation:aoShimmer 1.4s infinite; border-radius:8px; }
@keyframes aoShimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

/* Empty */
.ao-empty { text-align:center; padding:60px 24px; }
.ao-empty-ico  { width:52px; height:52px; margin:0 auto 14px; color:#c4a880; opacity:0.6; }
.ao-empty-title { font-family:'Cinzel',serif; font-size:1rem; color:#3d1800; margin-bottom:8px; }
.ao-empty-sub   { font-size:0.875rem; color:#8b6840; }

/* Responsive */
@media(max-width:800px)  { .ao-strip { grid-template-columns:repeat(2,1fr); } }
@media(max-width:560px)  { .ao-grid  { grid-template-columns:1fr; } .ao-body { padding:20px 16px 60px; } .ao-banner-inner { padding:0 16px; } }
`;

// SVG icons
const IcoCheck = () => (
  <svg
    width={14}
    height={14}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);
const IcoCalendar = () => (
  <svg
    width={13}
    height={13}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
    />
  </svg>
);
const IcoClock = () => (
  <svg
    width={13}
    height={13}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);
const IcoUsers = () => (
  <svg
    width={13}
    height={13}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
    />
  </svg>
);
const IcoRefresh = () => (
  <svg
    width={13}
    height={13}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
    />
  </svg>
);
const IcoEmpty = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
    />
  </svg>
);

function statusLabel(color, days) {
  if (color === "red") return days === null ? "No History" : `${days}d Overdue`;
  if (color === "yellow") return `${days}d — Mark Soon`;
  return days === null ? "Up to date" : `${days}d ago`;
}

function fmtDate(d) {
  if (!d) return "Never";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// Days fill % capped at 100
function daysFillPct(days, threshold) {
  if (days === null) return 100;
  return Math.min(100, Math.round((days / threshold.red) * 100));
}

export default function AttendanceOverview() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all | red | yellow | green

  useEffect(() => {
    api
      .get("/alerts/overview")
      .then((r) => setData(r.data.programs || []))
      .catch(() => toast.error("Failed to load programs."))
      .finally(() => setLoading(false));
  }, []);

  const counts = {
    all: data.length,
    red: data.filter((p) => p.color === "red").length,
    yellow: data.filter((p) => p.color === "yellow").length,
    green: data.filter((p) => p.color === "green").length,
  };

  const filtered =
    filter === "all" ? data : data.filter((p) => p.color === filter);

  return (
    <>
      <style>{css}</style>
      <div className="ao-page">
        {/* Banner */}
        <div className="ao-banner">
          <div className="ao-banner-inner">
            <div className="ao-eyebrow">Owner Portal</div>
            <h1 className="ao-banner-title">Attendance Overview</h1>
            <p className="ao-banner-sub">
              Live status of all active programs. Red programs need immediate
              attention.
            </p>
          </div>
          <div
            className="ao-strip"
            style={{ maxWidth: 1100, margin: "0 auto", padding: "0 28px" }}
          >
            {[
              {
                val: counts.all,
                lbl: "Active Programs",
                col: "rgba(255,255,255,0.15)",
              },
              {
                val: counts.red,
                lbl: "Need Attention",
                col: "rgba(220,38,38,0.25)",
              },
              {
                val: counts.yellow,
                lbl: "Mark Soon",
                col: "rgba(251,191,36,0.2)",
              },
              {
                val: counts.green,
                lbl: "Up To Date",
                col: "rgba(22,163,74,0.2)",
              },
            ].map((s, i) => (
              <div key={i} className="ao-strip-item">
                <div className="ao-strip-val">{loading ? "—" : s.val}</div>
                <div className="ao-strip-lbl">{s.lbl}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="ao-body">
          {/* Filter toolbar */}
          <div className="ao-toolbar">
            {[
              { key: "all", label: "All Programs" },
              { key: "red", label: "Overdue" },
              { key: "yellow", label: "Due Soon" },
              { key: "green", label: "Healthy" },
            ].map((f) => (
              <button
                key={f.key}
                className={`ao-filter-btn ${f.key}${
                  filter === f.key ? " sel" : ""
                }`}
                onClick={() => setFilter(f.key)}
              >
                {f.key !== "all" && (
                  <span className={`ao-filter-dot ${f.key}`} />
                )}
                {f.label}
                {!loading && (
                  <span style={{ fontWeight: 700, opacity: 0.7 }}>
                    ({counts[f.key]})
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Cards grid */}
          {loading ? (
            <div className="ao-grid">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  style={{
                    background: "#fff",
                    borderRadius: 16,
                    overflow: "hidden",
                    border: "1px solid rgba(200,140,40,0.14)",
                  }}
                >
                  <div className="ao-skel" style={{ height: 4 }} />
                  <div style={{ padding: "18px 20px" }}>
                    <div
                      className="ao-skel"
                      style={{ height: 18, width: "40%", marginBottom: 10 }}
                    />
                    <div
                      className="ao-skel"
                      style={{ height: 12, width: "70%", marginBottom: 14 }}
                    />
                    <div
                      className="ao-skel"
                      style={{ height: 5, borderRadius: 3, marginBottom: 16 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="ao-empty">
              <div className="ao-empty-ico">
                <IcoEmpty />
              </div>
              <div className="ao-empty-title">
                {filter === "all"
                  ? "No Active Programs"
                  : `No ${
                      filter === "red"
                        ? "overdue"
                        : filter === "yellow"
                        ? "due soon"
                        : "healthy"
                    } programs`}
              </div>
              <p className="ao-empty-sub">
                {filter === "all"
                  ? "Add programs to get started."
                  : "Try a different filter."}
              </p>
            </div>
          ) : (
            <div className="ao-grid">
              {filtered.map((prog) => {
                const fillPct = daysFillPct(prog.daysSince, prog.threshold);
                return (
                  <div
                    key={prog.programId}
                    className="ao-card"
                    onClick={() =>
                      navigate(`/owner/attendance/${prog.programId}`)
                    }
                  >
                    <div className={`ao-card-top ao-card-top-${prog.color}`} />
                    <div className="ao-card-body">
                      {/* Head */}
                      <div className="ao-card-head">
                        <div>
                          <div className="ao-key">{prog.programKey}</div>
                          <div className="ao-type">
                            {prog.programType} · {prog.frequency}
                          </div>
                        </div>
                        <div className={`ao-status ao-status-${prog.color}`}>
                          <span
                            className={`ao-status-dot ao-status-dot-${prog.color}`}
                          />
                          {statusLabel(prog.color, prog.daysSince)}
                        </div>
                      </div>

                      {/* Meta */}
                      <div className="ao-meta">
                        <span className="ao-meta-item">
                          <span className="ao-meta-ico">
                            <IcoCalendar />
                          </span>
                          {prog.day}
                        </span>
                        <span className="ao-meta-item">
                          <span className="ao-meta-ico">
                            <IcoClock />
                          </span>
                          {prog.time}
                        </span>
                        <span className="ao-meta-item">
                          <span className="ao-meta-ico">
                            <IcoRefresh />
                          </span>
                          {prog.frequency}
                        </span>
                        {prog.isVirtual && (
                          <span
                            className="ao-meta-item"
                            style={{
                              color: "#6d28d9",
                              fontWeight: 600,
                              fontSize: "0.7rem",
                            }}
                          >
                            Virtual
                          </span>
                        )}
                      </div>

                      {/* Last session + progress bar */}
                      <div className="ao-days-bar">
                        <div className="ao-days-label">
                          <span>Last session: {fmtDate(prog.lastDate)}</span>
                          {prog.daysSince !== null && (
                            <span
                              style={{
                                fontWeight: 600,
                                color:
                                  prog.color === "red"
                                    ? "#b91c1c"
                                    : prog.color === "yellow"
                                    ? "#92400e"
                                    : "#15803d",
                              }}
                            >
                              {prog.daysSince}d ago
                            </span>
                          )}
                        </div>
                        <div className="ao-days-track">
                          <div
                            className={`ao-days-fill ao-days-fill-${prog.color}`}
                            style={{ width: `${fillPct}%` }}
                          />
                        </div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "flex-end",
                            fontSize: "0.62rem",
                            color: "#a08060",
                            marginTop: 3,
                          }}
                        >
                          Threshold: yellow {prog.threshold.yellow}d · red{" "}
                          {prog.threshold.red}d
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="ao-card-stats">
                        <div className="ao-stat-cell">
                          <div className="ao-stat-val">{prog.devoteeCount}</div>
                          <div className="ao-stat-lbl">Devotees</div>
                        </div>
                        <div className="ao-stat-cell">
                          <div
                            className="ao-stat-val"
                            style={{
                              color:
                                prog.avgPct >= 80
                                  ? "#15803d"
                                  : prog.avgPct >= 40
                                  ? "#92400e"
                                  : "#b91c1c",
                            }}
                          >
                            {prog.avgPct}%
                          </div>
                          <div className="ao-stat-lbl">Avg Att.</div>
                        </div>
                        <div className="ao-stat-cell">
                          <div
                            className="ao-stat-val"
                            style={{ fontSize: "0.75rem", paddingTop: 2 }}
                          >
                            {prog.area}
                          </div>
                          <div className="ao-stat-lbl">Area</div>
                        </div>
                      </div>
                    </div>

                    {/* CTA */}
                    <div className="ao-card-foot">
                      <button
                        className="ao-mark-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/owner/attendance/${prog.programId}`);
                        }}
                      >
                        <IcoCheck />
                        Mark Attendance
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
