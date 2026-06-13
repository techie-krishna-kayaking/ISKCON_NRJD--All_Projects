import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

const css = `
/* ══ MARQUEE ══════════════════════════════════════════════════════ */
.oap-marquee-wrap {
  background:linear-gradient(135deg,#1e0a00,#3d1800);
  border-bottom:2px solid rgba(200,140,40,0.3);
  padding:10px 0; overflow:hidden; position:relative;
}
.oap-marquee-inner {
  display:flex; align-items:center; gap:0;
  animation:marqueeScroll 28s linear infinite;
  white-space:nowrap;
}
.oap-marquee-wrap:hover .oap-marquee-inner { animation-play-state:paused; }
@keyframes marqueeScroll {
  0%   { transform: translateX(100vw); }
  100% { transform: translateX(-100%); }
}
.oap-marquee-item {
  display:inline-flex; align-items:center; gap:10px;
  padding:0 36px;
  font-family:'DM Sans',sans-serif; font-size:0.8rem; font-weight:500;
  color:rgba(255,215,150,0.85); white-space:nowrap;
}
.oap-marquee-item::after { content:'✦'; color:rgba(200,140,40,0.5); padding-left:36px; }
.oap-marquee-priority-high { color:#fca5a5; }
.oap-marquee-dot { width:6px; height:6px; border-radius:50%; flex-shrink:0; }
.oap-marquee-loading { padding:10px 24px; font-size:0.78rem; color:rgba(200,150,60,0.6); font-family:'DM Sans',sans-serif; }

/* ══ ALERT PANEL ══════════════════════════════════════════════════ */
.oap-panel {
  background:#fff; border:1px solid rgba(200,140,40,0.18);
  border-radius:16px; overflow:hidden;
  box-shadow:0 2px 14px rgba(61,23,0,0.06);
  margin-bottom:20px;
}
.oap-panel-hd {
  background:linear-gradient(to right,rgba(200,140,40,0.09),rgba(200,140,40,0.04));
  border-bottom:1.5px solid rgba(200,140,40,0.15);
  padding:14px 20px; display:flex; align-items:center; justify-content:space-between;
}
.oap-panel-title { font-family:'Cinzel',serif; font-size:0.7rem; font-weight:700; color:#5c3a14; letter-spacing:0.12em; text-transform:uppercase; display:flex; align-items:center; gap:8px; }
.oap-count-badge { display:inline-flex; align-items:center; justify-content:center; min-width:20px; height:20px; border-radius:10px; font-size:0.64rem; font-weight:800; padding:0 6px; }
.oap-count-red  { background:rgba(220,38,38,0.12); color:#b91c1c; border:1px solid rgba(220,38,38,0.2); }
.oap-count-gold { background:rgba(200,140,40,0.12); color:#7a4a00; border:1px solid rgba(200,140,40,0.2); }
.oap-panel-toggle { font-size:0.76rem; font-weight:600; color:#c8903c; background:none; border:none; cursor:pointer; transition:color 0.15s; }
.oap-panel-toggle:hover { color:#7a3200; }

/* Alert items */
.oap-list { }
.oap-item {
  display:flex; align-items:flex-start; gap:12px;
  padding:12px 20px; border-bottom:1px solid rgba(200,140,40,0.07);
  transition:background 0.12s;
}
.oap-item:last-child { border-bottom:none; }
.oap-item:hover { background:rgba(200,140,40,0.03); }
.oap-item-dismissed { opacity:0.4; }
.oap-item-ico {
  width:32px; height:32px; border-radius:9px; flex-shrink:0;
  display:flex; align-items:center; justify-content:center; margin-top:1px;
}
.oap-ico-red    { background:rgba(220,38,38,0.1);  color:#dc2626; }
.oap-ico-yellow { background:rgba(251,191,36,0.1); color:#d97706; }
.oap-ico-green  { background:rgba(22,163,74,0.1);  color:#16a34a; }
.oap-item-body { flex:1; min-width:0; }
.oap-item-msg   { font-size:0.82rem; font-weight:500; color:#2d1200; line-height:1.5; margin-bottom:4px; }
.oap-item-meta  { display:flex; flex-wrap:wrap; gap:8px; align-items:center; }
.oap-item-chip  { font-size:0.65rem; font-weight:700; padding:1px 7px; border-radius:20px; text-transform:uppercase; letter-spacing:0.05em; }
.oap-chip-key   { background:rgba(200,140,40,0.1); color:#7a4a00; font-family:'Cinzel',serif; }
.oap-chip-type  { background:rgba(100,80,40,0.08); color:#5c3a14; }
.oap-chip-freq  { background:rgba(124,58,237,0.08); color:#5b21b6; }
.oap-item-action { font-size:0.72rem; font-weight:700; color:#c8903c; cursor:pointer; background:none; border:none; padding:0; transition:color 0.15s; flex-shrink:0; white-space:nowrap; }
.oap-item-action:hover { color:#7a3200; }
.oap-dismiss { width:20px; height:20px; border:none; border-radius:5px; background:transparent; color:#b09070; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all 0.14s; flex-shrink:0; }
.oap-dismiss:hover { background:rgba(220,38,38,0.08); color:#dc2626; }

/* Priority labels */
.oap-section-lbl {
  padding:8px 20px 4px; font-family:'Cinzel',serif; font-size:0.58rem; font-weight:700;
  letter-spacing:0.18em; text-transform:uppercase; color:#a08060;
  background:rgba(200,140,40,0.03); border-bottom:1px solid rgba(200,140,40,0.06);
}

/* Empty */
.oap-empty { padding:28px 20px; text-align:center; }
.oap-empty-ico  { width:36px; height:36px; margin:0 auto 10px; color:#c4a880; opacity:0.6; }
.oap-empty-text { font-size:0.78rem; color:#a08060; font-family:'Cinzel',serif; }

/* Skeleton */
.oap-skel { background:linear-gradient(90deg,rgba(200,140,40,0.07) 25%,rgba(200,140,40,0.14) 50%,rgba(200,140,40,0.07) 75%); background-size:200% 100%; animation:oapShimmer 1.4s infinite; border-radius:6px; }
@keyframes oapShimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
`;

// SVG icons
const IcoWarn = () => (
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
      d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
    />
  </svg>
);
const IcoInfo = () => (
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
      d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
    />
  </svg>
);
const IcoX = () => (
  <svg
    width={10}
    height={10}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={3}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);
const IcoArrow = () => (
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
      d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
    />
  </svg>
);
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
const IcoBell = () => (
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
      d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
    />
  </svg>
);

function icoForPriority(priority, color) {
  if (priority === "high") return <IcoWarn />;
  if (priority === "medium") return <IcoWarn />;
  return <IcoInfo />;
}

// ─────────────────────────────────────────────────────────────────────
// MARQUEE COMPONENT
// ─────────────────────────────────────────────────────────────────────
export function AnnouncementMarquee() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/announcements")
      .then((r) => setItems(r.data.announcements || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="oap-marquee-wrap">
        <div className="oap-marquee-loading">Loading announcements…</div>
      </div>
    );
  if (!items.length) return null;

  return (
    <>
      <style>{css}</style>
      <div className="oap-marquee-wrap">
        <div className="oap-marquee-inner">
          {/* Duplicate for seamless loop */}
          {[...items, ...items].map((item, i) => (
            <span
              key={`${item._id}-${i}`}
              className={`oap-marquee-item${
                item.priority === "high" ? " oap-marquee-priority-high" : ""
              }`}
            >
              <span
                className="oap-marquee-dot"
                style={{
                  background:
                    item.priority === "high"
                      ? "#f87171"
                      : item.priority === "medium"
                      ? "#fbbf24"
                      : "#c8903c",
                }}
              />
              {item.text}
            </span>
          ))}
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────
// ALERT PANEL COMPONENT
// ─────────────────────────────────────────────────────────────────────
export function OwnerAlertPanel() {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(new Set());
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    api
      .get("/alerts/owner")
      .then((r) => setAlerts(r.data.alerts || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const visible = alerts.filter((a) => !dismissed.has(a.id));
  const highCount = visible.filter((a) => a.priority === "high").length;

  const grouped = {
    high: visible.filter((a) => a.priority === "high"),
    medium: visible.filter((a) => a.priority === "medium"),
    info: visible.filter((a) => a.priority === "info"),
  };

  const icoClass = {
    red: "oap-ico-red",
    yellow: "oap-ico-yellow",
    green: "oap-ico-green",
  };

  if (!loading && visible.length === 0)
    return (
      <>
        <style>{css}</style>
        <div className="oap-panel">
          <div className="oap-panel-hd">
            <span className="oap-panel-title">
              <IcoBell /> Alerts
            </span>
          </div>
          <div className="oap-empty">
            <div className="oap-empty-ico">
              <IcoCheck />
            </div>
            <p className="oap-empty-text">All clear — no active alerts</p>
          </div>
        </div>
      </>
    );

  return (
    <>
      <style>{css}</style>
      <div className="oap-panel">
        <div className="oap-panel-hd">
          <span className="oap-panel-title">
            <IcoBell /> Alerts
            {!loading && highCount > 0 && (
              <span className="oap-count-badge oap-count-red">
                {highCount} high
              </span>
            )}
            {!loading && visible.length > 0 && (
              <span className="oap-count-badge oap-count-gold">
                {visible.length} total
              </span>
            )}
          </span>
          <button
            className="oap-panel-toggle"
            onClick={() => setExpanded((p) => !p)}
          >
            {expanded ? "Collapse" : "Expand"}
          </button>
        </div>

        {expanded && (
          <div className="oap-list">
            {loading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="oap-item">
                  <div
                    className="oap-skel"
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 9,
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div
                      className="oap-skel"
                      style={{ height: 12, width: "80%", marginBottom: 8 }}
                    />
                    <div
                      className="oap-skel"
                      style={{ height: 10, width: "50%" }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <>
                {["high", "medium", "info"].map((priority) => {
                  const items = grouped[priority];
                  if (!items.length) return null;
                  return (
                    <div key={priority}>
                      <div className="oap-section-lbl">
                        {priority === "high"
                          ? "High Priority"
                          : priority === "medium"
                          ? "Attention Needed"
                          : "Informational"}
                      </div>
                      {items.map((alert) => (
                        <div key={alert.id} className="oap-item">
                          <div
                            className={`oap-item-ico ${
                              icoClass[alert.color] || "oap-ico-yellow"
                            }`}
                          >
                            {icoForPriority(alert.priority, alert.color)}
                          </div>
                          <div className="oap-item-body">
                            <div className="oap-item-msg">{alert.message}</div>
                            <div className="oap-item-meta">
                              <span className="oap-item-chip oap-chip-key">
                                {alert.programKey}
                              </span>
                              <span className="oap-item-chip oap-chip-type">
                                {alert.programType}
                              </span>
                              <span className="oap-item-chip oap-chip-freq">
                                {alert.frequency}
                              </span>
                              {alert.action && (
                                <button
                                  className="oap-item-action"
                                  onClick={() =>
                                    alert.programId &&
                                    navigate(
                                      `/owner/attendance/${alert.programId}`
                                    )
                                  }
                                >
                                  {alert.action} <IcoArrow />
                                </button>
                              )}
                            </div>
                          </div>
                          <button
                            className="oap-dismiss"
                            title="Dismiss (until next refresh)"
                            onClick={() =>
                              setDismissed((p) => new Set([...p, alert.id]))
                            }
                          >
                            <IcoX />
                          </button>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────
// NOTIFICATION BELL (for AppShell topbar)
// Returns { count, hasHigh } for bell badge
// ─────────────────────────────────────────────────────────────────────
export function useOwnerAlerts() {
  const [count, setCount] = useState(0);
  const [hasHigh, setHasHigh] = useState(false);

  useEffect(() => {
    api
      .get("/alerts/owner")
      .then((r) => {
        const a = r.data.alerts || [];
        setCount(a.length);
        setHasHigh(a.some((x) => x.priority === "high"));
      })
      .catch(() => {});
  }, []);

  return { count, hasHigh };
}
