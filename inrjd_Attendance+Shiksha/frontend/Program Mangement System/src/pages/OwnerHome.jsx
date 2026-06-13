import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import toast from "react-hot-toast";
import {
  AnnouncementMarquee,
  OwnerAlertPanel,
} from "../components/OwnerAlertPanel";
import TodayProgramsSection from "../components/TodayProgramsSection";
import WeeklyScheduleChart from "../components/WeeklyScheduleChart";

const css = `
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=DM+Sans:wght@300;400;500;600;700&display=swap');

.oh-root { min-height:100%; background:#f5efe6; font-family:'DM Sans',sans-serif; }

/* ══ HERO ══════════════════════════════════════════════════════════ */
.oh-hero {
  background:linear-gradient(135deg,#1e0800 0%,#4a1800 35%,#7a3200 70%,#a84800 100%);
  padding:40px 0 0; position:relative; overflow:hidden;
}
.oh-hero::before {
  content:''; position:absolute; inset:0;
  background:url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.025'%3E%3Ccircle cx='40' cy='40' r='30'/%3E%3Ccircle cx='40' cy='40' r='15'/%3E%3C/g%3E%3C/svg%3E");
  pointer-events:none;
}
.oh-inner { max-width:1200px; margin:0 auto; padding:0 32px; position:relative; z-index:1; }
.oh-hero-top { display:flex; align-items:flex-start; justify-content:space-between; gap:24px; flex-wrap:wrap; margin-bottom:40px; }
.oh-hero-greeting { flex:1; min-width:260px; }
.oh-hero-eyebrow {
  font-family:'Cinzel',serif; font-size:0.62rem; font-weight:700;
  color:rgba(200,150,60,0.85); letter-spacing:0.22em; text-transform:uppercase;
  margin-bottom:12px; display:flex; align-items:center; gap:8px;
}
.oh-hero-eyebrow::before,.oh-hero-eyebrow::after { content:''; width:30px; height:1px; background:rgba(200,150,60,0.4); }
.oh-hero-name { font-family:'Cinzel',serif; font-size:clamp(1.8rem,4vw,2.8rem); font-weight:700; color:#fff; margin:0 0 10px; line-height:1.15; }
.oh-hero-name span { color:#f5c842; }
.oh-hero-sub { color:rgba(255,215,150,0.65); font-size:0.95rem; line-height:1.7; max-width:460px; }

.oh-hero-actions { display:flex; gap:10px; flex-wrap:wrap; align-items:flex-start; padding-top:4px; }
.oh-hero-btn { display:flex; align-items:center; gap:8px; padding:10px 18px; border-radius:10px; border:none; cursor:pointer; font-family:'DM Sans',sans-serif; font-size:0.84rem; font-weight:700; text-decoration:none; transition:all 0.18s; flex-shrink:0; }
.oh-hero-btn-primary  { background:rgba(245,200,66,0.18); color:#f5c842; border:1.5px solid rgba(245,200,66,0.35); backdrop-filter:blur(4px); }
.oh-hero-btn-primary:hover  { background:rgba(245,200,66,0.28); }
.oh-hero-btn-secondary { background:rgba(255,255,255,0.1); color:rgba(255,255,255,0.85); border:1.5px solid rgba(255,255,255,0.2); backdrop-filter:blur(4px); }
.oh-hero-btn-secondary:hover { background:rgba(255,255,255,0.18); }

.oh-hero-strip { display:grid; grid-template-columns:repeat(4,1fr); border-top:1px solid rgba(255,255,255,0.1); margin:0 -32px; }
.oh-strip-stat { padding:20px 24px; border-right:1px solid rgba(255,255,255,0.08); position:relative; }
.oh-strip-stat:last-child { border-right:none; }
.oh-strip-stat::before { content:''; position:absolute; top:0; left:0; right:0; height:2px; }
.oh-strip-0::before { background:linear-gradient(90deg,#f5c842,transparent); }
.oh-strip-1::before { background:linear-gradient(90deg,#4ade80,transparent); }
.oh-strip-2::before { background:linear-gradient(90deg,#a78bfa,transparent); }
.oh-strip-3::before { background:linear-gradient(90deg,#f87171,transparent); }
.oh-strip-val { font-family:'Cinzel',serif; font-size:1.9rem; font-weight:700; color:#fff; line-height:1; margin-bottom:4px; }
.oh-strip-lbl { font-size:0.7rem; font-weight:600; color:rgba(255,215,150,0.55); text-transform:uppercase; letter-spacing:0.1em; }

/* ══ BODY ══════════════════════════════════════════════════════════ */
.oh-body { max-width:1200px; margin:0 auto; padding:28px 32px 60px; }

/* ══ ALERT ═════════════════════════════════════════════════════════ */
.oh-alert { display:flex; align-items:flex-start; gap:14px; background:#fff; border:1px solid rgba(220,38,38,0.2); border-left:4px solid #dc2626; border-radius:14px; padding:16px 20px; margin-bottom:24px; box-shadow:0 2px 12px rgba(220,38,38,0.08); }
.oh-alert-ico { width:36px; height:36px; border-radius:10px; background:rgba(220,38,38,0.1); display:flex; align-items:center; justify-content:center; flex-shrink:0; color:#dc2626; }
.oh-alert-title { font-weight:700; font-size:0.875rem; color:#991b1b; margin-bottom:3px; }
.oh-alert-sub   { font-size:0.8rem; color:#b91c1c; line-height:1.5; }

/* ══ SECTION HEADER ════════════════════════════════════════════════ */
.oh-section-hd { display:flex; align-items:center; justify-content:space-between; margin-bottom:14px; }
.oh-section-title {
  font-family:'Cinzel',serif; font-size:0.7rem; font-weight:700;
  color:#7a4a10; letter-spacing:0.18em; text-transform:uppercase;
  display:flex; align-items:center; gap:8px;
}
.oh-section-title::before { content:''; width:16px; height:2px; background:linear-gradient(90deg,#c8903c,transparent); border-radius:1px; }
.oh-see-all { font-size:0.76rem; font-weight:600; color:#c8903c; text-decoration:none; transition:color 0.15s; cursor:pointer; background:none; border:none; }
.oh-see-all:hover { color:#7a3200; }

/* ══ CARDS ══════════════════════════════════════════════════════════ */
.oh-card { background:#fff; border:1px solid rgba(200,140,40,0.15); border-radius:16px; overflow:hidden; box-shadow:0 2px 12px rgba(61,23,0,0.05); }
.oh-card-hd { padding:14px 20px; border-bottom:1px solid rgba(200,140,40,0.1); background:linear-gradient(to right,rgba(200,140,40,0.05),transparent); display:flex; align-items:center; justify-content:space-between; }
.oh-card-title { font-family:'Cinzel',serif; font-size:0.7rem; font-weight:700; color:#5c3a14; letter-spacing:0.12em; text-transform:uppercase; }
.oh-card-body  { padding:18px 20px; }

/* ══ GRIDS ══════════════════════════════════════════════════════════ */
.oh-row-3 { display:grid; grid-template-columns:1fr 1fr 1fr; gap:18px; margin-bottom:20px; }
.oh-row-2 { display:grid; grid-template-columns:1.4fr 1fr; gap:18px; margin-bottom:20px; }
.oh-row-full { margin-bottom:20px; }

/* ══ HEALTH ════════════════════════════════════════════════════════ */
.oh-health-item { display:flex; align-items:center; gap:12px; padding:10px 0; border-bottom:1px solid rgba(200,140,40,0.07); }
.oh-health-item:last-child { border-bottom:none; }
.oh-health-icon { width:32px; height:32px; border-radius:8px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.oh-health-info { flex:1; }
.oh-health-lbl  { font-size:0.8rem; font-weight:600; color:#3d1800; margin-bottom:4px; }
.oh-health-bar-wrap { height:5px; background:rgba(200,140,40,0.1); border-radius:3px; overflow:hidden; }
.oh-health-bar      { height:100%; border-radius:3px; transition:width 0.6s ease; }
.oh-health-count { font-family:'Cinzel',serif; font-size:1.1rem; font-weight:700; color:#2d1200; flex-shrink:0; width:28px; text-align:right; }
.oh-health-pct { font-size:0.68rem; color:#8b6840; }

/* ══ TOP PROGRAMS ══════════════════════════════════════════════════ */
.oh-top-item { display:flex; align-items:center; gap:12px; padding:11px 0; border-bottom:1px solid rgba(200,140,40,0.07); cursor:pointer; transition:all 0.15s; }
.oh-top-item:last-child { border-bottom:none; }
.oh-top-item:hover { padding-left:4px; }
.oh-top-rank { width:24px; height:24px; border-radius:6px; flex-shrink:0; background:linear-gradient(135deg,#c47a00,#7a3a00); display:flex; align-items:center; justify-content:center; font-size:0.65rem; font-weight:700; color:#fff; font-family:'Cinzel',serif; }
.oh-top-key  { font-family:'Cinzel',serif; font-size:0.8rem; font-weight:700; color:#2d1200; flex:1; }
.oh-top-prog-bar  { flex:1.2; height:5px; background:rgba(200,140,40,0.1); border-radius:3px; overflow:hidden; }
.oh-top-prog-fill { height:100%; border-radius:3px; }
.oh-top-pct  { font-size:0.72rem; font-weight:700; padding:2px 9px; border-radius:20px; flex-shrink:0; width:42px; text-align:center; }

/* ══ RISK LIST ═════════════════════════════════════════════════════ */
.oh-risk-item { display:flex; align-items:center; gap:10px; padding:10px 0; border-bottom:1px solid rgba(200,140,40,0.07); }
.oh-risk-item:last-child { border-bottom:none; }
.oh-risk-pulse { width:8px; height:8px; border-radius:50%; background:#dc2626; animation:riskPulse 2s ease-in-out infinite; flex-shrink:0; }
@keyframes riskPulse { 0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(220,38,38,0.4)} 50%{opacity:0.6;box-shadow:0 0 0 4px rgba(220,38,38,0)} }
.oh-risk-key { font-family:'Cinzel',serif; font-size:0.8rem; font-weight:700; color:#2d1200; flex:1; }
.oh-risk-pct { font-size:0.72rem; font-weight:700; color:#b91c1c; background:rgba(220,38,38,0.08); padding:2px 9px; border-radius:20px; }

/* ══ TREND ═════════════════════════════════════════════════════════ */
.oh-trend { display:flex; align-items:flex-end; gap:6px; height:72px; }
.oh-trend-col { flex:1; display:flex; flex-direction:column; align-items:center; gap:4px; }
.oh-trend-bar { width:100%; border-radius:3px 3px 0 0; min-height:3px; transition:height 0.5s ease; }
.oh-trend-lbl { font-size:0.56rem; color:#a08060; text-align:center; white-space:nowrap; }

/* ══ RECENT SESSIONS ═══════════════════════════════════════════════ */
.oh-recent-item { display:flex; align-items:center; gap:12px; padding:10px 0; border-bottom:1px solid rgba(200,140,40,0.07); }
.oh-recent-item:last-child { border-bottom:none; }
.oh-recent-key  { font-family:'Cinzel',serif; font-size:0.78rem; font-weight:700; color:#2d1200; width:72px; flex-shrink:0; }
.oh-recent-host { font-size:0.78rem; color:#5c3a14; flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.oh-recent-date { font-size:0.7rem; color:#a08060; flex-shrink:0; }
.oh-recent-dot  { width:7px; height:7px; border-radius:50%; background:#c8903c; flex-shrink:0; }

/* ══ PER-PROGRAM CARDS ═════════════════════════════════════════════ */
.oh-prog-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(220px,1fr)); gap:14px; }
.oh-prog-card { border:1px solid rgba(200,140,40,0.15); border-radius:14px; padding:16px; background:#fdf8f0; cursor:pointer; transition:all 0.18s; position:relative; overflow:hidden; }
.oh-prog-card::before { content:''; position:absolute; top:0; left:0; right:0; height:3px; }
.oh-prog-card-good::before { background:linear-gradient(90deg,#16a34a,#4ade80); }
.oh-prog-card-fair::before { background:linear-gradient(90deg,#d97706,#fbbf24); }
.oh-prog-card-low::before  { background:linear-gradient(90deg,#dc2626,#f87171); }
.oh-prog-card:hover { transform:translateY(-3px); box-shadow:0 8px 24px rgba(61,23,0,0.1); border-color:rgba(200,140,40,0.35); }
.oh-prog-card-key  { font-family:'Cinzel',serif; font-size:0.84rem; font-weight:700; color:#2d1200; margin-bottom:10px; }
.oh-prog-mini-bars { display:flex; align-items:flex-end; gap:3px; height:28px; margin-bottom:8px; }
.oh-prog-mini-bar  { flex:1; border-radius:2px 2px 0 0; min-height:2px; }
.oh-prog-foot { display:flex; align-items:center; justify-content:space-between; }
.oh-prog-foot-date { font-size:0.68rem; color:#a08060; }
.oh-prog-foot-pct  { font-size:0.72rem; font-weight:700; padding:2px 8px; border-radius:20px; }

/* ══ COLOURS ════════════════════════════════════════════════════════ */
.c-good { color:#15803d; } .c-fair { color:#92400e; } .c-low { color:#991b1b; }
.bg-good { background:rgba(22,163,74,0.1); } .bg-fair { background:rgba(251,191,36,0.1); } .bg-low { background:rgba(220,38,38,0.08); }
.fill-good { background:linear-gradient(90deg,#16a34a,#4ade80); }
.fill-fair { background:linear-gradient(90deg,#d97706,#fbbf24); }
.fill-low  { background:linear-gradient(90deg,#dc2626,#f87171); }

/* ══ SKELETON ═══════════════════════════════════════════════════════ */
.oh-skel { background:linear-gradient(90deg,rgba(200,140,40,0.07) 25%,rgba(200,140,40,0.14) 50%,rgba(200,140,40,0.07) 75%); background-size:200% 100%; animation:ohSkel 1.4s infinite; border-radius:8px; }
@keyframes ohSkel { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

/* ══ EMPTY ══════════════════════════════════════════════════════════ */
.oh-empty { text-align:center; padding:24px 16px; }
.oh-empty-ico  { width:36px; height:36px; margin:0 auto 10px; color:#c4a880; opacity:0.6; }
.oh-empty-text { font-size:0.78rem; color:#a08060; font-family:'Cinzel',serif; letter-spacing:0.04em; }

/* ══ RESPONSIVE ════════════════════════════════════════════════════ */
@media(max-width:1100px){ .oh-strip-stat{padding:16px;} .oh-strip-val{font-size:1.5rem;} }
@media(max-width:960px) { .oh-hero-strip{grid-template-columns:repeat(2,1fr);} .oh-row-3{grid-template-columns:1fr 1fr;} }
@media(max-width:720px) { .oh-row-2{grid-template-columns:1fr;} .oh-row-3{grid-template-columns:1fr;} }
@media(max-width:560px) { .oh-hero-strip{grid-template-columns:1fr 1fr;} .oh-body{padding:20px 16px 60px;} .oh-inner{padding:0 16px;} }
@media(max-width:400px) { .oh-hero-strip{grid-template-columns:1fr;} }
`;

// ── Icons ─────────────────────────────────────────────────────────────
const Ico = (p) => (
  <svg
    width={p.s || 16}
    height={p.s || 16}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={1.8}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d={p.d} />
  </svg>
);
const IcoProg = () => (
  <Ico d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
);
const IcoUsers = () => (
  <Ico d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
);
const IcoChart = () => (
  <Ico d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
);
const IcoWarn = () => (
  <Ico d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
);
const IcoPlus = () => <Ico d="M12 4.5v15m7.5-7.5h-15" s={14} />;
const IcoArrow = () => <Ico d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" s={14} />;
const IcoCheck = () => (
  <Ico d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" s={14} />
);

function pctCls(p) {
  return p >= 80 ? "good" : p >= 40 ? "fair" : "low";
}
function fmtDate(d) {
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

const Skeleton = () => (
  <>
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4,1fr)",
        gap: 18,
        marginBottom: 20,
      }}
    >
      {[...Array(4)].map((_, i) => (
        <div key={i} className="oh-card" style={{ padding: 20 }}>
          <div
            className="oh-skel"
            style={{ height: 14, width: "60%", marginBottom: 12 }}
          />
          <div className="oh-skel" style={{ height: 36, width: "45%" }} />
        </div>
      ))}
    </div>
    <div className="oh-row-3">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="oh-card">
          <div className="oh-card-hd">
            <div className="oh-skel" style={{ height: 12, width: "50%" }} />
          </div>
          <div className="oh-card-body">
            {[...Array(3)].map((__, j) => (
              <div
                key={j}
                className="oh-skel"
                style={{ height: 14, marginBottom: 10 }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  </>
);

export default function OwnerHome() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const firstName = user?.name?.split(" ")[0] || "Friend";

  const [dash, setDash] = useState(null);
  const [trends, setTrends] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/dashboard/owner")
      .then(async (r) => {
        setDash(r.data);
        const map = {};
        await Promise.all(
          (r.data.topPrograms || []).map(async (p) => {
            try {
              const res = await api.get(`/attendance/history/${p.programId}`);
              map[p.programId] = (res.data.sessions || [])
                .slice(0, 8)
                .reverse()
                .map((s) => ({
                  date: s._id,
                  pct:
                    s.total > 0 ? Math.round((s.present / s.total) * 100) : 0,
                }));
            } catch {
              map[p.programId] = [];
            }
          })
        );
        setTrends(map);
      })
      .catch(() => toast.error("Failed to load dashboard."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <style>{css}</style>
      <AnnouncementMarquee />
      <div className="oh-root">
        {/* ══ HERO ══════════════════════════════════════════════════ */}
        <div className="oh-hero">
          <div className="oh-inner">
            <div className="oh-hero-top">
              <div className="oh-hero-greeting">
                <div className="oh-hero-eyebrow">Owner Portal</div>
                <h1 className="oh-hero-name">
                  Hare Krishna,
                  <br />
                  <span>{firstName}</span>
                </h1>
                <p className="oh-hero-sub">
                  Your program overview and devotee attendance at a glance.
                </p>
              </div>
              <div className="oh-hero-actions">
                <div
                  className="oh-hero-btn oh-hero-btn-primary"
                  onClick={() => navigate("/owner/programs")}
                >
                  <IcoProg />
                  My Programs
                </div>
                <div
                  className="oh-hero-btn oh-hero-btn-secondary"
                  onClick={() => navigate("/owner/add-program")}
                >
                  <IcoPlus />
                  Add Program
                </div>
              </div>
            </div>
            <OwnerAlertPanel />
            <div className="oh-hero-strip">
              {[
                {
                  cls: "oh-strip-0",
                  val: loading ? "—" : dash?.totalPrograms ?? 0,
                  lbl: "Total Programs",
                },
                {
                  cls: "oh-strip-1",
                  val: loading ? "—" : dash?.totalDevotees ?? 0,
                  lbl: "Unique Devotees",
                },
                {
                  cls: "oh-strip-2",
                  val: loading ? "—" : `${dash?.avgAttendance ?? 0}%`,
                  lbl: "Avg Attendance",
                },
                {
                  cls: "oh-strip-3",
                  val: loading ? "—" : dash?.inactive ?? 0,
                  lbl: "Inactive Devotees",
                },
              ].map((s, i) => (
                <div key={i} className={`oh-strip-stat ${s.cls}`}>
                  <div className="oh-strip-val">{s.val}</div>
                  <div className="oh-strip-lbl">{s.lbl}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ══ BODY ══════════════════════════════════════════════════ */}
        <div className="oh-body">
          {loading ? (
            <Skeleton />
          ) : (
            <>
              {/* Alert */}
              {dash?.showAlert && (
                <div className="oh-alert">
                  <div className="oh-alert-ico">
                    <IcoWarn />
                  </div>
                  <div>
                    <div className="oh-alert-title">Attendance Risk Alert</div>
                    <div className="oh-alert-sub">
                      {dash.inactivePct}% of devotees have attendance below 40%.
                      Review engagement.
                    </div>
                  </div>
                </div>
              )}

              {/* ══ TODAY'S PROGRAMS — BEFORE OVERVIEW ══════════════ */}
              <TodayProgramsSection
                todayPrograms={dash?.todayPrograms || []}
                onAttendanceClick={(pid) =>
                  navigate(`/owner/attendance/${pid}`)
                }
              />

              {/* ══ WEEKLY SCHEDULE GRAPH ════════════════════════════ */}
              <div className="oh-section-hd">
                <span className="oh-section-title">Weekly Schedule</span>
                <button
                  className="oh-see-all"
                  onClick={() => navigate("/owner/programs")}
                >
                  All Programs <IcoArrow />
                </button>
              </div>
              <div className="oh-row-full">
                <WeeklyScheduleChart
                  weeklySchedule={dash?.weeklySchedule || []}
                  onProgramClick={(prog) =>
                    navigate(`/owner/attendance/${prog.programId}`)
                  }
                />
              </div>

              {/* ══ OVERVIEW ═════════════════════════════════════════ */}
              <div className="oh-section-hd">
                <span className="oh-section-title">Overview</span>
              </div>
              <div className="oh-row-3">
                {/* Devotee health */}
                <div className="oh-card">
                  <div className="oh-card-hd">
                    <span className="oh-card-title">Devotee Health</span>
                  </div>
                  <div className="oh-card-body">
                    {(() => {
                      const total =
                        (dash?.active || 0) +
                          (dash?.moderate || 0) +
                          (dash?.inactive || 0) || 1;
                      return [
                        {
                          ico: <IcoCheck />,
                          lbl: "Active",
                          pct: "≥80%",
                          cnt: dash?.active || 0,
                          col: "good",
                        },
                        {
                          ico: <IcoChart />,
                          lbl: "Moderate",
                          pct: "40–79%",
                          cnt: dash?.moderate || 0,
                          col: "fair",
                        },
                        {
                          ico: <IcoWarn />,
                          lbl: "Inactive",
                          pct: "<40%",
                          cnt: dash?.inactive || 0,
                          col: "low",
                        },
                      ].map((h) => (
                        <div key={h.lbl} className="oh-health-item">
                          <div
                            className={`oh-health-icon bg-${h.col}`}
                            style={{
                              color:
                                h.col === "good"
                                  ? "#15803d"
                                  : h.col === "fair"
                                  ? "#92400e"
                                  : "#991b1b",
                            }}
                          >
                            {h.ico}
                          </div>
                          <div className="oh-health-info">
                            <div className="oh-health-lbl">
                              {h.lbl}{" "}
                              <span
                                style={{
                                  fontSize: "0.68rem",
                                  color: "#8b6840",
                                }}
                              >
                                {h.pct}
                              </span>
                            </div>
                            <div className="oh-health-bar-wrap">
                              <div
                                className={`oh-health-bar fill-${h.col}`}
                                style={{
                                  width: `${Math.round(
                                    (h.cnt / total) * 100
                                  )}%`,
                                }}
                              />
                            </div>
                          </div>
                          <div className="oh-health-count">{h.cnt}</div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>

                {/* Top 3 programs */}
                <div className="oh-card">
                  <div className="oh-card-hd">
                    <span className="oh-card-title">Top Programs</span>
                  </div>
                  <div className="oh-card-body">
                    {!dash?.topPrograms?.length ? (
                      <div className="oh-empty">
                        <div className="oh-empty-ico">
                          <IcoProg />
                        </div>
                        <p className="oh-empty-text">No attendance data yet</p>
                      </div>
                    ) : (
                      dash.topPrograms.map((p, i) => {
                        const cls = pctCls(p.avgPct);
                        return (
                          <div
                            key={p.programKey}
                            className="oh-top-item"
                            onClick={() => navigate("/owner/programs")}
                          >
                            <div className="oh-top-rank">{i + 1}</div>
                            <span className="oh-top-key">{p.programKey}</span>
                            <div className="oh-top-prog-bar">
                              <div
                                className={`oh-top-prog-fill fill-${cls}`}
                                style={{
                                  width: `${p.avgPct}%`,
                                  height: "100%",
                                  borderRadius: 3,
                                }}
                              />
                            </div>
                            <span className={`oh-top-pct c-${cls} bg-${cls}`}>
                              {p.avgPct}%
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* At-risk */}
                <div className="oh-card">
                  <div className="oh-card-hd">
                    <span className="oh-card-title">At Risk</span>
                    {dash?.atRisk?.length > 0 && (
                      <span
                        style={{
                          fontSize: "0.65rem",
                          fontWeight: 700,
                          background: "rgba(220,38,38,0.1)",
                          color: "#b91c1c",
                          padding: "2px 8px",
                          borderRadius: 20,
                        }}
                      >
                        {dash.atRisk.length} programs
                      </span>
                    )}
                  </div>
                  <div className="oh-card-body">
                    {!dash?.atRisk?.length ? (
                      <div className="oh-empty">
                        <div
                          className="oh-empty-ico"
                          style={{ color: "#16a34a", opacity: 1 }}
                        >
                          <IcoCheck />
                        </div>
                        <p
                          className="oh-empty-text"
                          style={{ color: "#15803d" }}
                        >
                          All programs healthy
                        </p>
                      </div>
                    ) : (
                      dash.atRisk.map((p) => (
                        <div key={p.programKey} className="oh-risk-item">
                          <span className="oh-risk-pulse" />
                          <span className="oh-risk-key">{p.programKey}</span>
                          <span className="oh-risk-pct">{p.avgPct}%</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* ── Row 2: trend chart | recent sessions ── */}
              <div className="oh-section-hd">
                <span className="oh-section-title">Activity</span>
                <button
                  className="oh-see-all"
                  onClick={() => navigate("/owner/programs")}
                >
                  View programs <IcoArrow />
                </button>
              </div>
              <div className="oh-row-2">
                {/* Trend chart */}
                <div className="oh-card">
                  <div className="oh-card-hd">
                    <span className="oh-card-title">Attendance Trend</span>
                    {dash?.topPrograms?.[0] && (
                      <span
                        style={{
                          fontFamily: "'Cinzel',serif",
                          fontSize: "0.65rem",
                          color: "#8b6840",
                        }}
                      >
                        {dash.topPrograms[0].programKey}
                      </span>
                    )}
                  </div>
                  <div className="oh-card-body">
                    {(() => {
                      const sessions =
                        trends[dash?.topPrograms?.[0]?.programId] || [];
                      if (!sessions.length)
                        return (
                          <div className="oh-empty">
                            <div className="oh-empty-ico">
                              <IcoChart />
                            </div>
                            <p className="oh-empty-text">
                              No session history yet
                            </p>
                          </div>
                        );
                      const max = Math.max(...sessions.map((s) => s.pct), 1);
                      return (
                        <div className="oh-trend">
                          {sessions.map((s, i) => {
                            const cls = pctCls(s.pct);
                            return (
                              <div key={i} className="oh-trend-col">
                                <div
                                  className={`oh-trend-bar fill-${cls}`}
                                  style={{
                                    height: `${Math.max(
                                      4,
                                      (s.pct / max) * 64
                                    )}px`,
                                  }}
                                />
                                <div className="oh-trend-lbl">
                                  {fmtDate(s.date)}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Recent sessions */}
                <div className="oh-card">
                  <div className="oh-card-hd">
                    <span className="oh-card-title">Recent Sessions</span>
                  </div>
                  <div className="oh-card-body">
                    {!dash?.recentSessions?.length ? (
                      <div className="oh-empty">
                        <div className="oh-empty-ico">
                          <IcoProg />
                        </div>
                        <p className="oh-empty-text">
                          No sessions recorded yet
                        </p>
                      </div>
                    ) : (
                      dash.recentSessions.map((s, i) => (
                        <div key={i} className="oh-recent-item">
                          <span className="oh-recent-dot" />
                          <span className="oh-recent-key">{s.programKey}</span>
                          <span className="oh-recent-host">{s.hostName}</span>
                          <span className="oh-recent-date">
                            {fmtDate(s.date)}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Per-program mini cards */}
              {dash?.topPrograms?.length > 0 && (
                <>
                  <div className="oh-section-hd">
                    <span className="oh-section-title">
                      Per-Program Summary
                    </span>
                  </div>
                  <div className="oh-row-full">
                    <div className="oh-prog-grid">
                      {dash.topPrograms.map((p) => {
                        const cls = pctCls(p.avgPct);
                        const trendArr = trends[p.programId] || [];
                        const lastDate = trendArr.length
                          ? trendArr[trendArr.length - 1].date
                          : null;
                        const tMax = Math.max(...trendArr.map((s) => s.pct), 1);
                        return (
                          <div
                            key={p.programKey}
                            className={`oh-prog-card oh-prog-card-${cls}`}
                            onClick={() => navigate("/owner/programs")}
                          >
                            <div className="oh-prog-card-key">
                              {p.programKey}
                            </div>
                            <div className="oh-prog-mini-bars">
                              {trendArr.length === 0 ? (
                                <span
                                  style={{
                                    fontSize: "0.65rem",
                                    color: "#a08060",
                                  }}
                                >
                                  No sessions
                                </span>
                              ) : (
                                trendArr
                                  .slice(-6)
                                  .map((s, i) => (
                                    <div
                                      key={i}
                                      className={`oh-prog-mini-bar fill-${pctCls(
                                        s.pct
                                      )}`}
                                      style={{
                                        height: `${Math.max(
                                          2,
                                          (s.pct / tMax) * 28
                                        )}px`,
                                      }}
                                    />
                                  ))
                              )}
                            </div>
                            <div className="oh-prog-foot">
                              <span className="oh-prog-foot-date">
                                {lastDate ? fmtDate(lastDate) : "No data"}
                              </span>
                              <span
                                className={`oh-prog-foot-pct c-${cls} bg-${cls}`}
                              >
                                {p.avgPct}%
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
