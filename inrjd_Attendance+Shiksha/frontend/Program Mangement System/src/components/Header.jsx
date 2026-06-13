import { useState, useRef, useEffect, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import toast from "react-hot-toast";

// ─── Your organisation's external website URL ─────────────────
const ORG_WEBSITE = "https://your-organisation-website.com"; // ← same as Home.jsx

const css = `
/* ══ Header shell ══════════════════════════════════════════════ */
.hdr {
  position: sticky; top: 0; z-index: 200;
  background: linear-gradient(135deg, #2a0f00 0%, #541f00 35%, #7d3000 65%, #a84200 100%);
}
.hdr::after {
  content: ''; display: block; height: 2px;
  background: linear-gradient(90deg,
    transparent 0%,
    rgba(200,140,40,0.5) 20%,
    rgba(255,210,80,0.75) 50%,
    rgba(200,140,40,0.5) 80%,
    transparent 100%);
}
.hdr-inner {
  max-width: 1300px; margin: 0 auto; padding: 0 20px;
  display: flex; align-items: center; justify-content: space-between;
  height: 62px; gap: 12px;
}

/* ══ Brand ═════════════════════════════════════════════════════ */
.hdr-brand {
  display: flex; align-items: center; gap: 9px;
  text-decoration: none; flex-shrink: 0; min-width: 0;
}
.hdr-lotus {
  width: 36px; height: 36px; flex-shrink: 0;
  background: rgba(255,255,255,0.1);
  border: 1px solid rgba(200,140,40,0.35);
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  font-size: 1.1rem;
  transition: background 0.18s;
}
.hdr-brand:hover .hdr-lotus { background: rgba(255,255,255,0.2); }
.hdr-name {
  font-family: 'Cinzel', serif;
  font-size: 1.05rem; font-weight: 700;
  color: #fff; letter-spacing: 0.04em;
  white-space: nowrap;
}
.hdr-tagline { font-size: 0.62rem; color: rgba(255,220,150,0.65); letter-spacing: 0.04em; }

/* ══ Desktop Nav ════════════════════════════════════════════════ */
.hdr-nav { display: none; align-items: center; gap: 1px; }
.hdr-nav-link {
  padding: 6px 13px; border-radius: 7px;
  font-size: 0.84rem; font-weight: 600;
  color: rgba(255,255,255,0.72);
  text-decoration: none; transition: all 0.15s; white-space: nowrap;
}
.hdr-nav-link:hover { color: #fff; background: rgba(255,255,255,0.1); }
.hdr-nav-link.active { color: #fff; background: rgba(200,140,40,0.28); }

/* ══ Right cluster ══════════════════════════════════════════════ */
.hdr-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }

/* ── Visit Website pill (home page only) ── */
.hdr-visit {
  display: none;
  align-items: center; gap: 6px;
  padding: 6px 14px;
  background: rgba(255,255,255,0.1);
  border: 1px solid rgba(200,140,40,0.4);
  border-radius: 20px;
  color: rgba(255,230,160,0.9);
  font-size: 0.78rem; font-weight: 600;
  text-decoration: none; white-space: nowrap;
  transition: all 0.18s;
  letter-spacing: 0.02em;
}
.hdr-visit:hover {
  background: rgba(255,255,255,0.2);
  border-color: rgba(200,140,40,0.7);
  color: #fff;
}

/* ── Notification bell ── */
.nb-wrap { position: relative; }
.nb-btn {
  width: 36px; height: 36px;
  background: rgba(255,255,255,0.09);
  border: 1px solid rgba(200,140,40,0.2);
  border-radius: 9px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; color: rgba(255,255,255,0.82);
  transition: all 0.15s;
}
.nb-btn:hover { background: rgba(255,255,255,0.18); border-color: rgba(200,140,40,0.45); }
.nb-badge {
  position: absolute; top: -5px; right: -5px;
  background: #e11d48; color: #fff;
  font-size: 0.58rem; font-weight: 800;
  min-width: 16px; height: 16px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center; padding: 0 3px;
  border: 2px solid #2a0f00;
  animation: nbPulse 2s ease-in-out infinite;
}
@keyframes nbPulse {
  0%,100% { box-shadow: 0 0 0 0 rgba(225,29,72,0.5); }
  50%      { box-shadow: 0 0 0 4px rgba(225,29,72,0); }
}

/* ── Notification dropdown ── */
.nb-drop {
  position: absolute; top: calc(100% + 10px); right: 0;
  width: 370px; max-height: 480px;
  background: var(--cream); display: flex; flex-direction: column;
  border: 1px solid rgba(200,140,40,0.2);
  border-top: 3px solid #c8903c;
  border-radius: 14px;
  box-shadow: 0 16px 52px rgba(42,15,0,0.22), 0 4px 12px rgba(42,15,0,0.1);
  z-index: 300; overflow: hidden;
  animation: dropIn 0.2s cubic-bezier(0.22,1,0.36,1) both;
}
@keyframes dropIn {
  from { opacity: 0; transform: translateY(-8px); }
  to   { opacity: 1; transform: translateY(0); }
}
.nb-drop-hd {
  padding: 13px 16px; border-bottom: 1px solid rgba(200,140,40,0.12);
  background: rgba(200,140,40,0.05);
  display: flex; align-items: center; justify-content: space-between;
  flex-shrink: 0;
}
.nb-drop-title { font-family: 'Cinzel', serif; font-size: 0.84rem; color: var(--text-dark); font-weight: 600; }
.nb-drop-count {
  font-size: 0.7rem; font-weight: 700;
  background: rgba(225,29,72,0.1); color: #be123c;
  padding: 2px 9px; border-radius: 20px;
}
.nb-drop-body { overflow-y: auto; flex: 1; }
.nb-empty {
  padding: 32px 16px; text-align: center;
  color: var(--text-muted); font-size: 0.84rem;
}
.nb-empty-icon { font-size: 1.8rem; display: block; margin-bottom: 8px; opacity: 0.6; }

/* Notification items */
.nb-item { padding: 13px 16px; border-bottom: 1px solid rgba(200,140,40,0.08); }
.nb-item:last-child { border-bottom: none; }
.nb-item-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; margin-bottom: 5px; }
.nb-item-name { font-weight: 700; font-size: 0.875rem; color: var(--text-dark); }
.nb-item-meta { font-size: 0.72rem; color: var(--text-muted); margin-top: 2px; }
.nb-item-reason {
  font-size: 0.76rem; color: var(--text-mid); font-style: italic;
  margin-bottom: 9px; padding-left: 10px;
  border-left: 2px solid rgba(200,140,40,0.3);
}
.nb-btns { display: flex; gap: 7px; }
.nb-approve, .nb-reject {
  flex: 1; padding: 6px 10px;
  font-size: 0.76rem; font-weight: 700;
  border: none; border-radius: 6px; cursor: pointer;
  transition: opacity 0.15s, transform 0.1s;
  display: flex; align-items: center; justify-content: center; gap: 4px;
}
.nb-approve { background: linear-gradient(135deg,#16a34a,#15803d); color: #fff; }
.nb-reject  { background: linear-gradient(135deg,#dc2626,#b91c1c); color: #fff; }
.nb-approve:hover:not(:disabled), .nb-reject:hover:not(:disabled) { opacity: 0.88; }
.nb-approve:disabled, .nb-reject:disabled { opacity: 0.5; cursor: not-allowed; }

/* ── Real-time indicator (dot in header) ── */
.rt-dot {
  width: 7px; height: 7px; border-radius: 50%;
  background: #22c55e;
  position: absolute; bottom: 3px; right: 3px;
  border: 1.5px solid #2a0f00;
}

/* ══ Avatar + user dropdown ═════════════════════════════════════ */
.av-wrap { position: relative; }
.av-btn {
  display: flex; align-items: center; gap: 7px;
  background: rgba(255,255,255,0.09);
  border: 1px solid rgba(200,140,40,0.22);
  border-radius: 9px; padding: 5px 10px 5px 5px;
  cursor: pointer; transition: all 0.15s;
}
.av-btn:hover { background: rgba(255,255,255,0.18); border-color: rgba(200,140,40,0.5); }
.av-circle {
  width: 28px; height: 28px;
  background: linear-gradient(135deg,#c47a00,#7a3a00);
  border-radius: 7px;
  display: flex; align-items: center; justify-content: center;
  font-family: 'Cinzel', serif; font-size: 0.65rem; font-weight: 700; color: #fff;
}
.av-circle-super { background: linear-gradient(135deg,#7c3aed,#4c1d95); }
.av-label { text-align: left; }
.av-name { font-size: 0.8rem; font-weight: 600; color: #fff; max-width: 90px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.av-role { font-size: 0.6rem; color: rgba(255,210,140,0.65); }
.av-chev { color: rgba(255,255,255,0.55); transition: transform 0.2s; }
.av-btn[data-open="true"] .av-chev { transform: rotate(180deg); }

.av-drop {
  position: absolute; top: calc(100% + 10px); right: 0;
  min-width: 215px;
  background: var(--cream);
  border: 1px solid rgba(200,140,40,0.2);
  border-top: 3px solid #c8903c;
  border-radius: 14px;
  box-shadow: 0 12px 40px rgba(42,15,0,0.18);
  z-index: 300; overflow: hidden;
  animation: dropIn 0.18s cubic-bezier(0.22,1,0.36,1) both;
}
.av-drop-info {
  padding: 13px 14px; border-bottom: 1px solid rgba(200,140,40,0.1);
  background: rgba(200,140,40,0.04);
}
.av-drop-name { font-family: 'Cinzel', serif; font-size: 0.88rem; font-weight: 600; color: var(--text-dark); }
.av-drop-email { font-size: 0.7rem; color: var(--text-muted); margin-top: 2px; }
.av-drop-badge {
  display: inline-flex; margin-top: 6px;
  font-size: 0.62rem; font-weight: 700;
  padding: 2px 8px; border-radius: 20px;
  text-transform: uppercase; letter-spacing: 0.06em;
}
.av-drop-link {
  display: flex; align-items: center; gap: 9px;
  padding: 9px 14px; text-decoration: none;
  font-size: 0.84rem; font-weight: 500;
  color: var(--text-mid); transition: all 0.13s;
}
.av-drop-link:hover { background: rgba(200,140,40,0.07); color: var(--text-dark); }
.av-drop-link svg { color: var(--text-muted); flex-shrink: 0; }
.av-drop-link:hover svg { color: #c8903c; }
.av-drop-sep { height: 1px; background: rgba(200,140,40,0.1); margin: 3px 0; }
.av-drop-logout {
  display: flex; align-items: center; gap: 9px;
  width: 100%; padding: 9px 14px;
  font-size: 0.84rem; font-weight: 500;
  background: none; border: none; cursor: pointer;
  color: #b91c1c; transition: all 0.13s;
}
.av-drop-logout:hover { background: rgba(185,28,28,0.07); }

/* ══ Hamburger + mobile nav ═════════════════════════════════════ */
.hdr-ham {
  display: flex; width: 36px; height: 36px;
  background: rgba(255,255,255,0.09);
  border: 1px solid rgba(200,140,40,0.18);
  border-radius: 9px;
  align-items: center; justify-content: center;
  cursor: pointer; color: #fff; transition: background 0.15s;
}
.hdr-ham:hover { background: rgba(255,255,255,0.2); }
.mob-nav {
  background: rgba(38,14,0,0.97); backdrop-filter: blur(8px);
  border-top: 1px solid rgba(200,140,40,0.12);
  padding: 10px 14px 14px;
}
.mob-nav-link {
  display: block; padding: 9px 13px;
  border-radius: 7px; text-decoration: none;
  font-size: 0.88rem; font-weight: 600;
  color: rgba(255,255,255,0.72);
  transition: all 0.13s; margin-bottom: 2px;
}
.mob-nav-link:hover, .mob-nav-link.active {
  color: #fff; background: rgba(200,140,40,0.22);
}
.mob-nav-sep { height: 1px; background: rgba(200,140,40,0.12); margin: 6px 0; }
.mob-logout {
  display: block; width: 100%; text-align: left;
  padding: 9px 13px; border-radius: 7px;
  background: none; border: none; cursor: pointer;
  font-size: 0.88rem; font-weight: 600;
  color: rgba(255,110,90,0.85); transition: all 0.13s;
}
.mob-logout:hover { background: rgba(220,38,38,0.13); color: #fca5a5; }

/* ══ Responsive ═════════════════════════════════════════════════ */
@media(min-width: 640px) {
  .hdr-tagline-wrap { display: block; }
  .hdr-visit { display: flex; }
}
@media(min-width: 1024px) {
  .hdr-nav  { display: flex; }
  .hdr-ham  { display: none; }
}
`;

// ─── Nav items per role ────────────────────────────────────────
const AdminNav = [
  { label: "Dashboard", path: "/admin/dashboard" },
  { label: "Members", path: "/admin/users" },
  { label: "Create Owner", path: "/admin/create-owner" },
  { label: "Create Admin", path: "/admin/create-admin" },
];
const OwnerNav = [
  { label: "Dashboard", path: "/owner/dashboard" },
  { label: "Profile", path: "/owner/profile" },
];

// ─── Tiny SVG helpers ─────────────────────────────────────────
const I = ({ d, size = 15 }) => (
  <svg
    width={size}
    height={size}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
);

export default function Header() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === "/";

  const [dropOpen, setDropOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pendingReqs, setPendingReqs] = useState([]);
  const [acting, setActing] = useState(null); // requestId being processed
  const [rtConnected, setRtConnected] = useState(false); // SSE connected?

  const dropRef = useRef(null);
  const notifRef = useRef(null);
  const esRef = useRef(null); // EventSource ref

  const navItems = isAdmin ? AdminNav : OwnerNav;
  const isActive = (p) => location.pathname === p;
  const initials =
    user?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?";

  // ── Fetch pending list from REST (used on mount + after actions) ──
  const fetchPending = useCallback(async () => {
    if (!user?.isSuperAdmin) return;
    try {
      const res = await api.get("/admin/deactivation-requests/pending");
      setPendingReqs(res.data.requests || []);
    } catch {
      /* silent */
    }
  }, [user]);

  // ── SSE real-time connection ────────────────────────────────────
  useEffect(() => {
    if (!user?.isSuperAdmin) return;

    // Initial fetch
    fetchPending();

    // Open SSE stream — token is passed as query param since
    // EventSource doesn't support custom headers
    const token = localStorage.getItem("pms_token");
    const url = `${
      import.meta.env.VITE_API_URL || ""
    }/notifications/stream?token=${token}`;

    const es = new EventSource(url);
    esRef.current = es;

    es.addEventListener("connected", () => {
      setRtConnected(true);
      console.log("📡 Real-time notifications connected");
    });

    es.addEventListener("new-deactivation-request", () => {
      // A new request came in — re-fetch the full list
      fetchPending();
    });

    es.addEventListener("request-resolved", () => {
      fetchPending();
    });

    es.onerror = () => {
      setRtConnected(false);
      // EventSource auto-reconnects — no need to do anything here
    };

    return () => {
      es.close();
      esRef.current = null;
      setRtConnected(false);
    };
  }, [user, fetchPending]);

  // Note: SSE uses query param token — auth middleware must support this.
  // In middleware/auth.js protect(), add:
  //   const token = req.headers.authorization?.split(" ")[1] || req.query.token;

  // ── Close dropdowns on outside click ─────────────────────────
  useEffect(() => {
    const h = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target))
        setDropOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target))
        setNotifOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleApprove = async (requestId) => {
    setActing(requestId);
    try {
      const r = await api.post(
        `/admin/deactivation-requests/${requestId}/approve`
      );
      toast.success(r.data.message);
      await fetchPending();
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed.");
    } finally {
      setActing(null);
    }
  };

  const handleReject = async (requestId) => {
    setActing(requestId);
    try {
      const r = await api.post(
        `/admin/deactivation-requests/${requestId}/reject`
      );
      toast.success(r.data.message);
      await fetchPending();
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
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  // Google user check — hide "Change Password" for Google sign-in accounts
  const isGoogleUser = user?.provider === "google";

  return (
    <>
      <style>{css}</style>
      <header className="hdr">
        <div className="hdr-inner">
          {/* ── Brand ── */}
          <Link
            className="hdr-brand"
            to={
              isAdmin
                ? "/admin/dashboard"
                : isAuthenticated
                ? "/owner/dashboard"
                : "/"
            }
          >
            <img
              src="https://yt3.googleusercontent.com/ytc/AIdro_mb_Unondx6U0D2Z14u0r1FP5zl2GScqBIOo2K8lYiBbDU=s900-c-k-c0x00ffffff-no-rj"
              alt="lotus"
              style={{
                width: "24px",
                height: "24px",
                borderRadius: "50%",
                objectFit: "cover",
              }}
            />
            <div>
              <div className="hdr-name">ISKCON NRJD</div>
              <div className="hdr-tagline">Program Management Portal</div>
            </div>
          </Link>

          {/* ── Desktop Nav (authenticated only) ── */}
          {isAuthenticated && (
            <nav className="hdr-nav">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`hdr-nav-link${
                    isActive(item.path) ? " active" : ""
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          )}

          {/* ── Right cluster ── */}
          <div className="hdr-right">
            {/* Visit Our Website — only visible on the home page */}
            {isHome && (
              <a
                href={ORG_WEBSITE}
                target="_blank"
                rel="noopener noreferrer"
                className="hdr-visit"
              >
                <svg
                  width={12}
                  height={12}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253M3 12a8.959 8.959 0 00.284 2.253"
                  />
                </svg>
                Visit Website
              </a>
            )}

            {/* ── Notification Bell (SuperAdmin only) ── */}
            {user?.isSuperAdmin && (
              <div className="nb-wrap" ref={notifRef}>
                <button
                  className="nb-btn"
                  title={`Deactivation Requests${rtConnected ? " · Live" : ""}`}
                  onClick={() => {
                    setNotifOpen((p) => !p);
                    setDropOpen(false);
                  }}
                >
                  <svg
                    width={17}
                    height={17}
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
                  {rtConnected && <span className="rt-dot" title="Live" />}
                </button>

                {notifOpen && (
                  <div className="nb-drop">
                    <div className="nb-drop-hd">
                      <span className="nb-drop-title">
                        🔔 Deactivation Requests
                      </span>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        {rtConnected && (
                          <span
                            style={{
                              fontSize: "0.63rem",
                              color: "#16a34a",
                              fontWeight: 700,
                            }}
                          >
                            ● Live
                          </span>
                        )}
                        {pendingReqs.length > 0 && (
                          <span className="nb-drop-count">
                            {pendingReqs.length} pending
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="nb-drop-body">
                      {pendingReqs.length === 0 ? (
                        <div className="nb-empty">
                          <span className="nb-empty-icon">✅</span>
                          All clear — no pending requests
                        </div>
                      ) : (
                        pendingReqs.map((req) => (
                          <div key={req._id} className="nb-item">
                            <div className="nb-item-row">
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

            {/* ── Avatar / user dropdown ── */}
            {isAuthenticated ? (
              <div className="av-wrap" ref={dropRef}>
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
                  <div className="av-label">
                    <div className="av-name">{user?.name?.split(" ")[0]}</div>
                    <div className="av-role">
                      {user?.isSuperAdmin ? "SuperAdmin" : user?.role}
                    </div>
                  </div>
                  <svg
                    className="av-chev"
                    width={13}
                    height={13}
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
                    <div className="av-drop-info">
                      <div className="av-drop-name">{user?.name}</div>
                      <div className="av-drop-email">{user?.email}</div>
                      <span
                        className={`av-drop-badge ${
                          user?.isSuperAdmin || user?.role === "admin"
                            ? "badge-admin"
                            : "badge-owner"
                        }`}
                      >
                        {user?.isSuperAdmin ? "⭐ SuperAdmin" : user?.role}
                      </span>
                    </div>

                    <Link
                      to={isAdmin ? "/admin/dashboard" : "/owner/dashboard"}
                      className="av-drop-link"
                      onClick={() => setDropOpen(false)}
                    >
                      <I d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zm0 9.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zm9.75-9.75A2.25 2.25 0 0115.75 3.75H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zm0 9.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                      Dashboard
                    </Link>

                    {/* Change Password — hidden for Google users since they manage password via Google */}
                    {!isGoogleUser && (
                      <Link
                        to="/change-password"
                        className="av-drop-link"
                        onClick={() => setDropOpen(false)}
                      >
                        <I d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                        Change Password
                      </Link>
                    )}

                    {isGoogleUser && (
                      <div
                        style={{
                          padding: "7px 14px 3px",
                          fontSize: "0.7rem",
                          color: "var(--text-muted)",
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                        }}
                      >
                        <svg width={11} height={11} viewBox="0 0 24 24">
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

                    <div className="av-drop-sep" />

                    <button className="av-drop-logout" onClick={handleLogout}>
                      <I d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                style={{
                  padding: "7px 16px",
                  background: "rgba(255,255,255,0.12)",
                  border: "1px solid rgba(200,140,40,0.4)",
                  borderRadius: "8px",
                  color: "#fff",
                  fontFamily: "'Cinzel', serif",
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  letterSpacing: "0.04em",
                  textDecoration: "none",
                  transition: "all 0.15s",
                }}
              >
                Sign In
              </Link>
            )}

            {/* ── Hamburger ── */}
            {isAuthenticated && (
              <button
                className="hdr-ham"
                onClick={() => setMobileOpen((p) => !p)}
              >
                <svg
                  width={17}
                  height={17}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  {mobileOpen ? (
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
            )}
          </div>
        </div>

        {/* ── Mobile Nav ── */}
        {isAuthenticated && mobileOpen && (
          <nav className="mob-nav">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`mob-nav-link${
                  isActive(item.path) ? " active" : ""
                }`}
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <div className="mob-nav-sep" />
            {!isGoogleUser && (
              <Link
                to="/change-password"
                className="mob-nav-link"
                onClick={() => setMobileOpen(false)}
              >
                🔑 Change Password
              </Link>
            )}
            <button className="mob-logout" onClick={handleLogout}>
              Logout
            </button>
          </nav>
        )}
      </header>
    </>
  );
}


