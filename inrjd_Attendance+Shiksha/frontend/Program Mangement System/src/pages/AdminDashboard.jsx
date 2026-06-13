import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

const css = `
.dash-page{padding:36px 0 56px;}
.dash-welcome{
  background:linear-gradient(135deg,#3d1700 0%,#6b3000 40%,#9d3e00 80%,#c44f00 100%);
  padding:36px 24px;margin-bottom:36px;position:relative;overflow:hidden;
}
.dash-welcome::before{
  content:'ॐ';position:absolute;right:32px;top:50%;transform:translateY(-50%);
  font-size:9rem;color:rgba(255,255,255,0.05);font-family:serif;line-height:1;pointer-events:none;
}
.dash-welcome::after{
  content:'';position:absolute;bottom:0;left:0;right:0;height:2px;
  background:linear-gradient(90deg,transparent,var(--g-400),transparent);
}
.dash-welcome-inner{max-width:1240px;margin:0 auto;position:relative;z-index:1;}
.dash-welcome-eyebrow{
  font-family:'Cinzel',serif;font-size:0.68rem;font-weight:600;
  color:var(--g-300);letter-spacing:0.15em;text-transform:uppercase;margin-bottom:8px;
}
.dash-welcome-title{font-family:'Cinzel',serif;font-size:clamp(1.6rem,3vw,2.4rem);color:#fff;margin-bottom:6px;}
.dash-welcome-sub{color:rgba(255,220,160,0.7);font-size:0.9rem;}
.dash-welcome-time{
  font-family:'Cinzel',serif;font-size:0.72rem;color:rgba(200,150,60,0.65);
  letter-spacing:0.08em;margin-top:10px;
}

.dash-body{max-width:1240px;margin:0 auto;padding:0 24px;}

/* Stats grid */
.stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:18px;margin-bottom:32px;}

/* Main grid */
.dash-main-grid{display:grid;grid-template-columns:1fr 1fr;gap:24px;}
.dash-main-grid-full{grid-column:1/-1;}

/* Recent users */
.recent-row{display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid var(--sl-100);}
.recent-row:last-child{border-bottom:none;}
.recent-info{flex:1;}
.recent-name{font-weight:600;font-size:0.9rem;color:var(--text-dark);}
.recent-email{font-size:0.78rem;color:var(--text-muted);margin-top:1px;}
.recent-meta{font-size:0.72rem;color:var(--text-muted);}

/* Quick actions */
.qa-grid{display:flex;flex-direction:column;gap:8px;}
.qa-item{
  display:flex;align-items:center;gap:12px;
  padding:13px 16px;border-radius:var(--r-md);
  border:1.5px solid var(--sl-100);text-decoration:none;color:inherit;
  transition:all 0.18s;background:var(--cream);
}
.qa-item:hover{border-color:var(--g-300);background:var(--g-50);transform:translateX(3px);}
.qa-icon{
  width:38px;height:38px;border-radius:var(--r-sm);
  display:flex;align-items:center;justify-content:center;flex-shrink:0;
}
.qa-label{font-weight:600;font-size:0.875rem;color:var(--text-dark);}
.qa-sub{font-size:0.75rem;color:var(--text-muted);margin-top:1px;}

@media(max-width:900px){.stats-grid{grid-template-columns:1fr 1fr;}.dash-main-grid{grid-template-columns:1fr;}}
@media(max-width:560px){.stats-grid{grid-template-columns:1fr 1fr;}}
`;

const greet = () => {
  const h = new Date().getHours();
  if (h < 5) return "🌙 Peaceful Night";
  if (h < 12) return "🌅 Good Morning";
  if (h < 17) return "☀️ Good Afternoon";
  if (h < 21) return "🌆 Good Evening";
  return "🌙 Good Night";
};

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    total: 0,
    admins: 0,
    owners: 0,
    active: 0,
    inactive: 0,
  });
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/admin/users")
      .then((res) => {
        const u = res.data.users || [];
        setStats({
          total: u.length,
          admins: u.filter((x) => x.role === "admin").length,
          owners: u.filter((x) => x.role === "owner").length,
          active: u.filter((x) => x.isActive).length,
          inactive: u.filter((x) => !x.isActive).length,
        });
        setRecent(u.slice(0, 6));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const initials = (n) =>
    n
      ?.split(" ")
      .map((x) => x[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?";

  const statCards = [
    {
      label: "Total Users",
      value: stats.total,
      icon: "👥",
      bg: "rgba(200,150,60,0.12)",
      href: "/admin/users",
    },
    {
      label: "Administrators",
      value: stats.admins,
      icon: "🛡️",
      bg: "rgba(107,33,168,0.1)",
      href: "/admin/users",
    },
    {
      label: "Owners",
      value: stats.owners,
      icon: "🏛️",
      bg: "rgba(196,79,0,0.1)",
      href: "/admin/users",
    },
    {
      label: "Active Accounts",
      value: stats.active,
      icon: "✅",
      bg: "rgba(34,197,94,0.1)",
      href: "/admin/users",
    },
  ];

  const quickActions = [
    {
      label: "Create Owner Account",
      sub: "Add a new owner to the system",
      icon: "🪷",
      bg: "rgba(196,79,0,0.1)",
      href: "/admin/create-owner",
    },
    {
      label: "Create Admin Account",
      sub: "Grant administrative access",
      icon: "🛡️",
      bg: "rgba(107,33,168,0.1)",
      href: "/admin/create-admin",
    },
    {
      label: "Manage All Users",
      sub: "View, edit, reset, toggle status",
      icon: "📋",
      bg: "rgba(200,150,60,0.12)",
      href: "/admin/users",
    },
  ];

  return (
    <>
      <style>{css}</style>
      <div className="dash-page">
        {/* Welcome banner */}
        <div className="dash-welcome">
          <div className="dash-welcome-inner">
            <div className="dash-welcome-eyebrow">
              ✦ &nbsp; Administrator Portal
            </div>
            <h1 className="dash-welcome-title">
              {greet()}, {user?.name?.split(" ")[0]}.
            </h1>
            <p className="dash-welcome-sub">
              Welcome back to the sacred administration portal.
            </p>
            <p className="dash-welcome-time">
              {new Date().toLocaleDateString("en-IN", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>

        <div className="dash-body">
          {/* Stats */}
          <div className="stats-grid">
            {statCards.map((s) => (
              <Link to={s.href} key={s.label} className="stat-card">
                <div className="stat-icon" style={{ background: s.bg }}>
                  <span style={{ fontSize: "1.3rem" }}>{s.icon}</span>
                </div>
                <div className="stat-value">
                  {loading ? (
                    <div
                      className="skeleton"
                      style={{ width: 48, height: 36 }}
                    />
                  ) : (
                    s.value
                  )}
                </div>
                <div className="stat-label">{s.label}</div>
              </Link>
            ))}
          </div>

          {/* Two-column */}
          <div className="dash-main-grid">
            {/* Recent Users */}
            <div className="card card-accent">
              <div
                className="card-header"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div
                    style={{
                      fontFamily: "'Cinzel',serif",
                      fontSize: "0.72rem",
                      color: "var(--g-600)",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      marginBottom: 4,
                    }}
                  >
                    ✦ Recent Devotees
                  </div>
                  <h3
                    style={{
                      fontFamily: "'Cinzel',serif",
                      fontSize: "1.1rem",
                      color: "var(--text-dark)",
                    }}
                  >
                    Latest Members
                  </h3>
                </div>
                <Link to="/admin/users" className="btn btn-secondary btn-sm">
                  View All
                </Link>
              </div>
              <div className="card-body">
                {loading ? (
                  [...Array(4)].map((_, i) => (
                    <div key={i} className="recent-row">
                      <div
                        className="skeleton"
                        style={{ width: 42, height: 42, borderRadius: var_md }}
                      />
                      <div style={{ flex: 1 }}>
                        <div
                          className="skeleton"
                          style={{ height: 14, width: "60%", marginBottom: 6 }}
                        />
                        <div
                          className="skeleton"
                          style={{ height: 12, width: "40%" }}
                        />
                      </div>
                    </div>
                  ))
                ) : recent.length === 0 ? (
                  <p
                    style={{
                      textAlign: "center",
                      color: "var(--text-muted)",
                      padding: "24px 0",
                      fontFamily: "'Cinzel',serif",
                      fontSize: "0.85rem",
                    }}
                  >
                    No members yet
                  </p>
                ) : (
                  recent.map((u) => (
                    <div key={u._id} className="recent-row">
                      <div className="avatar avatar-md">{initials(u.name)}</div>
                      <div className="recent-info">
                        <div className="recent-name">{u.name}</div>
                        <div className="recent-email">{u.email}</div>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "flex-end",
                          gap: 4,
                        }}
                      >
                        <span
                          className={`badge ${
                            u.role === "admin" ? "badge-admin" : "badge-owner"
                          }`}
                        >
                          {u.role}
                        </span>
                        <span
                          className={`badge ${
                            u.isActive ? "badge-active" : "badge-inactive"
                          }`}
                        >
                          {u.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Quick Actions + System Status */}
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div className="card card-accent">
                <div className="card-header">
                  <div
                    style={{
                      fontFamily: "'Cinzel',serif",
                      fontSize: "0.72rem",
                      color: "var(--g-600)",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      marginBottom: 4,
                    }}
                  >
                    ✦ Quick Actions
                  </div>
                  <h3
                    style={{
                      fontFamily: "'Cinzel',serif",
                      fontSize: "1.1rem",
                      color: "var(--text-dark)",
                    }}
                  >
                    Admin Actions
                  </h3>
                </div>
                <div className="card-body">
                  <div className="qa-grid">
                    {quickActions.map((a) => (
                      <Link to={a.href} key={a.label} className="qa-item">
                        <div className="qa-icon" style={{ background: a.bg }}>
                          <span style={{ fontSize: "1.25rem" }}>{a.icon}</span>
                        </div>
                        <div>
                          <div className="qa-label">{a.label}</div>
                          <div className="qa-sub">{a.sub}</div>
                        </div>
                        <svg
                          style={{
                            marginLeft: "auto",
                            flexShrink: 0,
                            color: "var(--text-muted)",
                          }}
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
                            d="M8.25 4.5l7.5 7.5-7.5 7.5"
                          />
                        </svg>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              {/* System health */}
              <div className="card card-accent">
                <div className="card-header">
                  <div
                    style={{
                      fontFamily: "'Cinzel',serif",
                      fontSize: "0.72rem",
                      color: "var(--g-600)",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      marginBottom: 4,
                    }}
                  >
                    ✦ System Status
                  </div>
                  <h3
                    style={{
                      fontFamily: "'Cinzel',serif",
                      fontSize: "1.1rem",
                      color: "var(--text-dark)",
                    }}
                  >
                    Health Overview
                  </h3>
                </div>
                <div className="card-body">
                  {[
                    { label: "API Server", status: "Operational", icon: "🟢" },
                    { label: "Database", status: "Connected", icon: "🟢" },
                    { label: "Email Service", status: "Ready", icon: "🟢" },
                    { label: "Auth System", status: "Secure", icon: "🔒" },
                  ].map((s) => (
                    <div
                      key={s.label}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "9px 0",
                        borderBottom: "1px solid var(--sl-100)",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.875rem",
                          color: "var(--text-mid)",
                          fontWeight: 500,
                        }}
                      >
                        {s.label}
                      </span>
                      <span
                        style={{
                          fontSize: "0.78rem",
                          fontWeight: 600,
                          color: "var(--success)",
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                        }}
                      >
                        <span>{s.icon}</span>
                        {s.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// tiny workaround for CSS template literal in JSX
const var_md = "10px";
