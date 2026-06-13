import { useState, useRef, useEffect, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ChatBot from "./Chatbot";
import api from "../api/axios";
import toast from "react-hot-toast";
import { useOwnerAlerts } from "./OwnerAlertPanel";

const ORG_WEBSITE = "https://your-organisation-website.com";

// ── Sidebar nav definitions ────────────────────────────────────
const ADMIN_NAV = [
  {
    id: "dashboard",
    label: "Dashboard",
    path: "/admin/dashboard",
    icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
  },
  {
    id: "analytics",
    label: "Analytics",
    path: "/admin/analytics",
    icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
  },
  {
    id: "biodata",
    label: "Shiksha Analytics",
    path: "/admin/shiksha-analytics",
    icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
  },
  {
    id: "create-owner",
    label: "Create Owner",
    path: "/admin/create-owner",
    icon: "M18 9v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM3 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 019.374 21a12.318 12.318 0 01-6.374-1.766z",
  },
  {
    id: "config",
    label: "Config",
    path: "/admin/config",
    icon: "M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75",
  },
  {
    id: "messages",
    label: "Messages",
    path: "/admin/messages",
    icon: "M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z",
  },
  {
    id: "participants",
    label: "Participants",
    path: "/admin/participants",
    icon: "M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z",
  },
  {
    id: "courses",
    label: "Courses",
    path: "/admin/courses",
    icon: "M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342",
  },
];

const OWNER_NAV = [
  {
    id: "dashboard",
    label: "Dashboard",
    path: "/owner/dashboard",
    icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
  },
  {
    id: "add-program",
    label: "Add Program",
    path: "/owner/add-program",
    icon: "M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z",
  },
  {
    id: "programs",
    label: "Your Programs",
    path: "/owner/programs",
    icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01",
  },
  {
    id: "attendance",
    label: "Attendance Overview",
    path: "/owner/attendance",
    icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  },
  {
    id: "analytics",
    label: "Analytics",
    path: "/owner/analytics",
    icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
  },
  {
    id: "participants",
    label: "Participants",
    path: "/owner/participants",
    icon: "M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z",
  },
];

const css = `
/* ══ Shell layout ═══════════════════════════════════════════════ */
.shell {
  display: flex; height: 100vh; overflow: hidden;
  background: #f5efe6;
  font-family: 'DM Sans', 'Segoe UI', sans-serif;
}

/* ══ Sidebar ════════════════════════════════════════════════════ */
.sidebar {
  width: 230px; flex-shrink: 0;
  background: linear-gradient(180deg, #1e0a00 0%, #3d1800 40%, #5c2700 100%);
  display: flex; flex-direction: column;
  border-right: 1px solid rgba(200,140,40,0.15);
  transition: transform 0.25s cubic-bezier(0.4,0,0.2,1);
  z-index: 50;
  overflow: hidden;
}
.sidebar-brand {
  padding: 20px 16px 16px;
  border-bottom: 1px solid rgba(200,140,40,0.12);
  display: flex; align-items: center; gap: 10px;
  text-decoration: none; flex-shrink: 0;
}
.sidebar-lotus {
  width: 34px; height: 34px; flex-shrink: 0;
  background: rgba(255,255,255,0.1);
  border: 1px solid rgba(200,140,40,0.3);
  border-radius: 9px;
  display: flex; align-items: center; justify-content: center;
  font-size: 1rem;
}
.sidebar-brand-name {
  font-family: 'Cinzel', serif;
  font-size: 0.95rem; font-weight: 700;
  color: #fff; letter-spacing: 0.04em; line-height: 1.2;
}
.sidebar-brand-sub {
  font-size: 0.58rem; color: rgba(255,210,140,0.55);
  letter-spacing: 0.04em;
}

/* Nav items */
.sidebar-nav { flex: 1; padding: 14px 10px; overflow-y: auto; }
.sidebar-nav::-webkit-scrollbar { width: 3px; }
.sidebar-nav::-webkit-scrollbar-thumb { background: rgba(200,140,40,0.2); border-radius: 3px; }

.sidebar-section-label {
  font-size: 0.55rem; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase;
  color: rgba(200,140,40,0.5); padding: 0 8px; margin: 14px 0 6px;
}
.sidebar-section-label:first-child { margin-top: 0; }

.snav-item {
  display: flex; align-items: center; gap: 9px;
  padding: 9px 10px; border-radius: 9px;
  text-decoration: none; margin-bottom: 2px;
  font-size: 0.84rem; font-weight: 500;
  color: rgba(255,255,255,0.62);
  transition: all 0.15s; position: relative;
  cursor: pointer;
}
.snav-item:hover { color: #fff; background: rgba(255,255,255,0.08); }
.snav-item.active {
  color: #fff;
  background: linear-gradient(135deg, rgba(200,140,40,0.25), rgba(200,140,40,0.12));
  border: 1px solid rgba(200,140,40,0.2);
}
.snav-item.active::before {
  content: ''; position: absolute; left: 0; top: 6px; bottom: 6px;
  width: 3px; border-radius: 2px;
  background: linear-gradient(#f5c842, #c8903c);
}
.snav-icon { width: 17px; height: 17px; flex-shrink: 0; }
.snav-label { flex: 1; }
.snav-soon {
  font-size: 0.52rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase;
  background: rgba(200,140,40,0.2); color: rgba(200,140,40,0.8);
  padding: 2px 6px; border-radius: 4px;
}

/* Sidebar footer */
.sidebar-footer {
  padding: 12px 10px;
  border-top: 1px solid rgba(200,140,40,0.1);
  flex-shrink: 0;
}
.sidebar-visit {
  display: flex; align-items: center; gap: 7px;
  padding: 8px 10px; border-radius: 9px; margin-bottom: 6px;
  font-size: 0.78rem; font-weight: 500; color: rgba(255,210,140,0.6);
  text-decoration: none; transition: all 0.15s;
}
.sidebar-visit:hover { color: rgba(255,210,140,0.9); background: rgba(255,255,255,0.06); }

/* ══ Main area ══════════════════════════════════════════════════ */
.shell-main { flex: 1; display: flex; flex-direction: column; overflow: hidden; min-width: 0; }

/* ══ Top bar ════════════════════════════════════════════════════ */
.topbar {
  height: 58px; flex-shrink: 0;
  background: rgba(253,248,240,0.98); backdrop-filter: blur(8px);
  border-bottom: 1px solid rgba(200,140,40,0.14);
  display: flex; align-items: center;
  padding: 0 20px; gap: 12px;
  position: sticky; top: 0; z-index: 40;
  box-shadow: 0 1px 8px rgba(61,23,0,0.06);
}
.topbar-ham {
  display: none; width: 34px; height: 34px;
  background: transparent; border: none;
  border-radius: 8px; align-items: center; justify-content: center;
  cursor: pointer; color: #6b4520; transition: background 0.15s; flex-shrink: 0;
}
.topbar-ham:hover { background: rgba(200,140,40,0.1); }
.topbar-greeting {
  flex: 1; min-width: 0;
  font-family: 'Cinzel', serif;
  font-size: clamp(0.78rem, 2vw, 1rem);
  color: #3d1800; font-weight: 600; letter-spacing: 0.02em;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.topbar-greeting span { color: rgba(140,80,0,0.6); font-weight: 400; }
.topbar-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }

/* ── Notification bell (topbar) ── */
.nb-wrap { position: relative; }
.nb-btn {
  width: 34px; height: 34px; background: rgba(200,140,40,0.08);
  border: 1px solid rgba(200,140,40,0.18); border-radius: 9px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; color: #7a4a10; transition: all 0.15s;
}
.nb-btn:hover { background: rgba(200,140,40,0.14); border-color: rgba(200,140,40,0.35); }
.nb-badge {
  position: absolute; top: -5px; right: -5px;
  background: #e11d48; color: #fff; font-size: 0.55rem; font-weight: 800;
  min-width: 15px; height: 15px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center; padding: 0 3px;
  border: 2px solid #f5efe6;
  animation: nbPulse 2s ease-in-out infinite;
}
@keyframes nbPulse {
  0%,100% { box-shadow: 0 0 0 0 rgba(225,29,72,0.4); }
  50%      { box-shadow: 0 0 0 4px rgba(225,29,72,0); }
}
.rt-dot {
  position: absolute; bottom: 3px; right: 3px;
  width: 6px; height: 6px; border-radius: 50%;
  background: #22c55e; border: 1.5px solid #f5efe6;
}

/* Notification dropdown */
.nb-drop {
  position: absolute; top: calc(100% + 10px); right: 0;
  width: 360px;
  background: #fff;
  border: 1px solid rgba(200,140,40,0.2);
  border-top: 3px solid #c8903c;
  border-radius: 14px;
  box-shadow: 0 16px 52px rgba(42,15,0,0.18);
  z-index: 300; overflow: hidden;
  animation: dropIn 0.2s cubic-bezier(0.22,1,0.36,1) both;
}
@keyframes dropIn {
  from { opacity:0; transform:translateY(-8px); }
  to   { opacity:1; transform:translateY(0); }
}
.nb-hd {
  padding: 12px 16px; border-bottom: 1px solid rgba(200,140,40,0.1);
  background: rgba(200,140,40,0.04);
  display: flex; align-items: center; justify-content: space-between;
}
.nb-hd-title { font-family:'Cinzel',serif; font-size:0.82rem; color:#2d1200; font-weight:600; }
.nb-count { font-size:0.68rem; font-weight:700; background:rgba(225,29,72,0.1); color:#be123c; padding:2px 8px; border-radius:20px; }
.nb-body { max-height: 380px; overflow-y: auto; }
.nb-empty { padding:28px 16px; text-align:center; color:#8b6840; font-size:0.82rem; }
.nb-empty-icon { font-size:1.6rem; display:block; margin-bottom:8px; opacity:0.6; }
.nb-item { padding:12px 16px; border-bottom:1px solid rgba(200,140,40,0.06); }
.nb-item:last-child { border-bottom:none; }
.nb-item-name { font-weight:700; font-size:0.84rem; color:#2d1200; }
.nb-item-meta { font-size:0.7rem; color:#8b6840; margin-top:2px; }
.nb-item-reason { font-size:0.74rem; color:#6b4520; font-style:italic; margin:6px 0 8px; padding-left:8px; border-left:2px solid rgba(200,140,40,0.3); }
.nb-btns { display:flex; gap:7px; }
.nb-approve,.nb-reject {
  flex:1; padding:6px 0; font-size:0.74rem; font-weight:700;
  border:none; border-radius:6px; cursor:pointer; transition:opacity 0.15s;
}
.nb-approve { background:linear-gradient(135deg,#16a34a,#15803d); color:#fff; }
.nb-reject  { background:linear-gradient(135deg,#dc2626,#b91c1c); color:#fff; }
.nb-approve:hover:not(:disabled),.nb-reject:hover:not(:disabled) { opacity:0.88; }
.nb-approve:disabled,.nb-reject:disabled { opacity:0.45; cursor:not-allowed; }

/* ── Profile avatar dropdown ── */
.av-wrap { position: relative; }
.av-btn {
  display: flex; align-items: center; gap: 7px;
  background: rgba(200,140,40,0.08);
  border: 1px solid rgba(200,140,40,0.2);
  border-radius: 9px; padding: 5px 10px 5px 5px;
  cursor: pointer; transition: all 0.15s;
}
.av-btn:hover { background: rgba(200,140,40,0.14); border-color: rgba(200,140,40,0.4); }
.av-circle {
  width: 28px; height: 28px;
  background: linear-gradient(135deg,#c47a00,#7a3a00);
  border-radius: 7px;
  display: flex; align-items: center; justify-content: center;
  font-family:'Cinzel',serif; font-size:0.62rem; font-weight:700; color:#fff;
}
.av-circle-super { background: linear-gradient(135deg,#7c3aed,#4c1d95); }
.av-name { font-size:0.8rem; font-weight:600; color:#3d1800; max-width:80px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.av-role { font-size:0.6rem; color:#8b6840; }
.av-chev { color:#8b6840; transition:transform 0.2s; }
.av-btn[data-open="true"] .av-chev { transform:rotate(180deg); }

.av-drop {
  position:absolute; top:calc(100% + 8px); right:0;
  min-width:210px;
  background:#fff;
  border:1px solid rgba(200,140,40,0.2);
  border-top:3px solid #c8903c;
  border-radius:14px;
  box-shadow:0 12px 40px rgba(42,15,0,0.14);
  z-index:300; overflow:hidden;
  animation:dropIn 0.18s cubic-bezier(0.22,1,0.36,1) both;
}
.av-info {
  padding:12px 14px; border-bottom:1px solid rgba(200,140,40,0.08);
  background:rgba(200,140,40,0.04);
}
.av-info-name { font-family:'Cinzel',serif; font-size:0.86rem; font-weight:600; color:#2d1200; }
.av-info-email { font-size:0.68rem; color:#8b6840; margin-top:2px; }
.av-info-badge {
  display:inline-flex; margin-top:5px;
  font-size:0.6rem; font-weight:700; padding:2px 7px; border-radius:20px;
  text-transform:uppercase; letter-spacing:0.06em;
}
.av-link {
  display:flex; align-items:center; gap:9px;
  padding:9px 14px; text-decoration:none;
  font-size:0.82rem; font-weight:500; color:#6b4520; transition:all 0.12s;
}
.av-link:hover { background:rgba(200,140,40,0.07); color:#2d1200; }
.av-link svg { color:#8b6840; flex-shrink:0; }
.av-link:hover svg { color:#c8903c; }
.av-sep { height:1px; background:rgba(200,140,40,0.08); margin:3px 0; }
.av-logout {
  display:flex; align-items:center; gap:9px;
  width:100%; padding:9px 14px;
  font-size:0.82rem; font-weight:500;
  background:none; border:none; cursor:pointer;
  color:#b91c1c; transition:all 0.12s;
}
.av-logout:hover { background:rgba(185,28,28,0.06); }

/* ══ Content area ════════════════════════════════════════════════ */
.shell-content { flex:1; overflow-y:auto; background:#f5efe6; }
.shell-content::-webkit-scrollbar { width:5px; }
.shell-content::-webkit-scrollbar-thumb { background:rgba(200,140,40,0.2); border-radius:5px; }

/* ══ Mobile overlay sidebar ════════════════════════════════════ */
.sidebar-overlay {
  display:none; position:fixed; inset:0;
  background:rgba(30,10,0,0.5); z-index:49;
  animation:fadeIn 0.2s ease both;
}
@keyframes fadeIn { from{opacity:0} to{opacity:1} }

/* ══ Responsive ══════════════════════════════════════════════════ */
@media(max-width:900px) {
  .sidebar {
    position:fixed; top:0; left:0; bottom:0;
    transform:translateX(-100%);
  }
  .sidebar.open { transform:translateX(0); box-shadow:4px 0 30px rgba(30,10,0,0.3); }
  .sidebar-overlay { display:block; }
  .topbar-ham { display:flex; }
}
`;

// ── Icon helper ─────────────────────────────────────────────────
const Ico = ({ d, size = 17 }) => (
  <svg
    width={size}
    height={size}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
    style={{ flexShrink: 0 }}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
);

// ── Owner Alert Bell ────────────────────────────────────────────
function OwnerBell() {
  const { count, hasHigh } = useOwnerAlerts();
  const navigate = useNavigate();

  if (!count) return null;

  return (
    <button
      className="nb-btn"
      onClick={() => navigate("/owner/dashboard")}
      title={`${count} alert${count !== 1 ? "s" : ""}`}
      style={{ position: "relative" }}
    >
      <svg
        width={16}
        height={16}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
        />
      </svg>
      <span
        className="nb-badge"
        style={{ background: hasHigh ? "#dc2626" : "#d97706" }}
      >
        {count > 9 ? "9+" : count}
      </span>
    </button>
  );
}

export default function AppShell({ children }) {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sideOpen, setSideOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [pendingReqs, setPendingReqs] = useState([]);
  const [unreadMsgs, setUnreadMsgs] = useState(0);
  const [acting, setActing] = useState(null);
  const [rtConn, setRtConn] = useState(false);

  const avRef = useRef(null);
  const notifRef = useRef(null);
  const esRef = useRef(null);

  const navItems = isAdmin ? ADMIN_NAV : OWNER_NAV;
  const isActive = (p) => location.pathname === p;
  const initials =
    user?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?";
  const isGoogleUser = user?.provider === "google";

  // ── Greet ─────────────────────────────────────────────────────
  const hour = new Date().getHours();
  const greet =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  // ── SSE real-time for superadmin ──────────────────────────────
  const fetchPending = useCallback(async () => {
    if (!user?.isSuperAdmin) return;
    try {
      const res = await api.get("/admin/deactivation-requests/pending");
      setPendingReqs(res.data.requests || []);
    } catch {
      /* silent */
    }
  }, [user]);

  useEffect(() => {
    if (!user?.isSuperAdmin) return;
    fetchPending();

    const token = localStorage.getItem("pms_token");
    const apiBase = import.meta.env.VITE_API_URL || "";
    const es = new EventSource(
      `${apiBase}/notifications/stream?token=${token}`
    );
    esRef.current = es;

    es.addEventListener("connected", () => setRtConn(true));
    es.addEventListener("new-deactivation-request", () => fetchPending());
    es.addEventListener("request-resolved", () => fetchPending());
    es.onerror = () => setRtConn(false);

    return () => {
      es.close();
      esRef.current = null;
      setRtConn(false);
    };
  }, [user, fetchPending]);

  // ── Outside click close ───────────────────────────────────────
  useEffect(() => {
    const h = (e) => {
      if (avRef.current && !avRef.current.contains(e.target))
        setDropOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target))
        setNotifOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSideOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleApprove = async (id) => {
    setActing(id);
    try {
      const r = await api.post(`/admin/deactivation-requests/${id}/approve`);
      toast.success(r.data.message);
      fetchPending();
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed.");
    } finally {
      setActing(null);
    }
  };

  const handleReject = async (id) => {
    setActing(id);
    try {
      const r = await api.post(`/admin/deactivation-requests/${id}/reject`);
      toast.success(r.data.message);
      fetchPending();
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed.");
    } finally {
      setActing(null);
    }
  };

  const timeAgo = (d) => {
    const m = Math.floor((Date.now() - new Date(d)) / 60000);
    if (m < 1) return "just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    return h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`;
  };

  return (
    <>
      <style>{css}</style>
      <div className="shell">
        {/* ── Mobile overlay ── */}
        {sideOpen && (
          <div className="sidebar-overlay" onClick={() => setSideOpen(false)} />
        )}

        {/* ══ SIDEBAR ══════════════════════════════════════════════ */}
        <aside className={`sidebar${sideOpen ? " open" : ""}`}>
          <Link
            to={isAdmin ? "/admin/dashboard" : "/owner/dashboard"}
            className="sidebar-brand"
          >
            <div className="sidebar-lotus">🪷</div>
            <div>
              <div className="sidebar-brand-name">Aaradhna</div>
              <div className="sidebar-brand-sub">Member Portal</div>
            </div>
          </Link>

          <nav className="sidebar-nav">
            <div className="sidebar-section-label">Menu</div>
            {navItems.map((item) =>
              item.soon ? (
                <div
                  key={item.id}
                  className="snav-item"
                  style={{ cursor: "default", opacity: 0.55 }}
                  title="Coming soon"
                >
                  <svg
                    className="snav-icon"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.8}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d={item.icon}
                    />
                  </svg>
                  <span className="snav-label">{item.label}</span>
                  <span className="snav-soon">Soon</span>
                </div>
              ) : (
                <Link
                  key={item.id}
                  to={item.path}
                  className={`snav-item${isActive(item.path) ? " active" : ""}`}
                >
                  <svg
                    className="snav-icon"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.8}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d={item.icon}
                    />
                  </svg>
                  <span className="snav-label">{item.label}</span>
                  {item.id === "messages" && unreadMsgs > 0 && (
                    <span
                      style={{
                        background: "#dc2626",
                        color: "#fff",
                        fontSize: "0.58rem",
                        fontWeight: 700,
                        padding: "1px 6px",
                        borderRadius: 20,
                        marginLeft: 4,
                        flexShrink: 0,
                      }}
                    >
                      {unreadMsgs > 9 ? "9+" : unreadMsgs}
                    </span>
                  )}
                </Link>
              )
            )}
          </nav>

          <div className="sidebar-footer">
            <a
              href={ORG_WEBSITE}
              target="_blank"
              rel="noopener noreferrer"
              className="sidebar-visit"
            >
              <Ico
                d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253M3 12a8.959 8.959 0 00.284 2.253"
                size={14}
              />
              Visit Website
            </a>
          </div>
        </aside>

        {/* ══ MAIN ═════════════════════════════════════════════════ */}
        <div className="shell-main">
          {/* ── Top bar ── */}
          <header className="topbar">
            <button
              className="topbar-ham"
              onClick={() => setSideOpen((p) => !p)}
            >
              <svg
                width={18}
                height={18}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                {sideOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                  />
                )}
              </svg>
            </button>

            <div className="topbar-greeting">
              🙏 <span>{greet},</span> {user?.name?.split(" ")[0]}
              {user?.isSuperAdmin && " ⭐"}
            </div>

            <div className="topbar-right">
              {/* Notification bell — SuperAdmin only */}
              {user?.isSuperAdmin && (
                <div className="nb-wrap" ref={notifRef}>
                  <button
                    className="nb-btn"
                    onClick={() => {
                      setNotifOpen((p) => !p);
                      setDropOpen(false);
                    }}
                    title="Deactivation Requests"
                  >
                    <svg
                      width={16}
                      height={16}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
                      />
                    </svg>
                    {pendingReqs.length > 0 && (
                      <span className="nb-badge">
                        {pendingReqs.length > 9 ? "9+" : pendingReqs.length}
                      </span>
                    )}
                    {rtConn && <span className="rt-dot" title="Live" />}
                  </button>

                  {notifOpen && (
                    <div className="nb-drop">
                      <div className="nb-hd">
                        <span className="nb-hd-title">
                          🔔 Deactivation Requests
                        </span>
                        <div
                          style={{
                            display: "flex",
                            gap: 6,
                            alignItems: "center",
                          }}
                        >
                          {rtConn && (
                            <span
                              style={{
                                fontSize: "0.6rem",
                                color: "#16a34a",
                                fontWeight: 700,
                              }}
                            >
                              ● Live
                            </span>
                          )}
                          {pendingReqs.length > 0 && (
                            <span className="nb-count">
                              {pendingReqs.length} pending
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="nb-body">
                        {pendingReqs.length === 0 ? (
                          <div className="nb-empty">
                            <span className="nb-empty-icon">✅</span>
                            All clear — no pending requests
                          </div>
                        ) : (
                          pendingReqs.map((req) => (
                            <div key={req._id} className="nb-item">
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "flex-start",
                                  justifyContent: "space-between",
                                  gap: 8,
                                  marginBottom: 4,
                                }}
                              >
                                <div>
                                  <div className="nb-item-name">
                                    {req.targetUser?.name}
                                  </div>
                                  <div className="nb-item-meta">
                                    By {req.requestedBy?.name} ·{" "}
                                    {timeAgo(req.createdAt)}
                                  </div>
                                </div>
                                <span
                                  className={`badge ${
                                    req.targetUser?.role === "admin"
                                      ? "badge-admin"
                                      : "badge-owner"
                                  }`}
                                  style={{ flexShrink: 0 }}
                                >
                                  {req.targetUser?.role}
                                </span>
                              </div>
                              {req.reason && (
                                <div className="nb-item-reason">
                                  "{req.reason}"
                                </div>
                              )}
                              <div className="nb-btns">
                                <button
                                  className="nb-approve"
                                  disabled={acting === req._id}
                                  onClick={() => handleApprove(req._id)}
                                >
                                  {acting === req._id ? "…" : "✅ Approve"}
                                </button>
                                <button
                                  className="nb-reject"
                                  disabled={acting === req._id}
                                  onClick={() => handleReject(req._id)}
                                >
                                  {acting === req._id ? "…" : "✗ Reject"}
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {!user?.isSuperAdmin && user?.role === "owner" && <OwnerBell />}

              {/* Profile avatar */}
              <div className="av-wrap" ref={avRef}>
                <button
                  className="av-btn"
                  data-open={dropOpen}
                  onClick={() => {
                    setDropOpen((p) => !p);
                    setNotifOpen(false);
                  }}
                >
                  <div
                    className={`av-circle${
                      user?.isSuperAdmin ? " av-circle-super" : ""
                    }`}
                  >
                    {user?.isSuperAdmin ? "⭐" : initials}
                  </div>
                  <div>
                    <div className="av-name">{user?.name?.split(" ")[0]}</div>
                    <div className="av-role">
                      {user?.isSuperAdmin ? "SuperAdmin" : user?.role}
                    </div>
                  </div>
                  <svg
                    className="av-chev"
                    width={12}
                    height={12}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                    />
                  </svg>
                </button>

                {dropOpen && (
                  <div className="av-drop">
                    <div className="av-info">
                      <div className="av-info-name">{user?.name}</div>
                      <div className="av-info-email">{user?.email}</div>
                      <span
                        className={`av-info-badge ${
                          user?.isSuperAdmin || user?.role === "admin"
                            ? "badge-admin"
                            : "badge-owner"
                        }`}
                      >
                        {user?.isSuperAdmin ? "⭐ SuperAdmin" : user?.role}
                      </span>
                    </div>

                    <Link
                      to={isAdmin ? "/admin/profile" : "/owner/profile"}
                      className="av-link"
                      onClick={() => setDropOpen(false)}
                    >
                      <Ico
                        d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                        size={14}
                      />
                      Profile & Settings
                    </Link>

                    {!isGoogleUser && (
                      <Link
                        to="/change-password"
                        className="av-link"
                        onClick={() => setDropOpen(false)}
                      >
                        <Ico
                          d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                          size={14}
                        />
                        Change Password
                      </Link>
                    )}

                    {isGoogleUser && (
                      <div
                        style={{
                          padding: "6px 14px 4px",
                          fontSize: "0.67rem",
                          color: "#8b6840",
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                        }}
                      >
                        <svg width={10} height={10} viewBox="0 0 24 24">
                          <path
                            fill="#4285F4"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          />
                          <path
                            fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          />
                          <path
                            fill="#FBBC05"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          />
                          <path
                            fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          />
                        </svg>
                        Signed in with Google
                      </div>
                    )}

                    <div className="av-sep" />
                    <button className="av-logout" onClick={handleLogout}>
                      <Ico
                        d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"
                        size={14}
                      />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* ── Page content ── */}
          <main className="shell-content">{children}</main>
        </div>
      </div>
      {user?.role === "owner" && <ChatBot />}
    </>
  );
}
