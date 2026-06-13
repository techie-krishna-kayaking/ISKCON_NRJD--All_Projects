import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import toast from "react-hot-toast";

const css = `
.owner-page{padding:36px 0 56px;}

/* Welcome banner */
.owner-banner{
  background:linear-gradient(135deg,#3d1700 0%,#762e00 50%,#9d3e00 100%);
  padding:36px 24px;margin-bottom:36px;position:relative;overflow:hidden;
}
.owner-banner::before{
  content:'🪷';position:absolute;right:32px;top:50%;transform:translateY(-50%);
  font-size:8rem;opacity:0.08;line-height:1;pointer-events:none;
}
.owner-banner::after{content:'';position:absolute;bottom:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,var(--g-400),transparent);}
.owner-banner-inner{max-width:1240px;margin:0 auto;position:relative;z-index:1;}
.owner-banner-eyebrow{font-family:'Cinzel',serif;font-size:0.68rem;color:var(--g-300);letter-spacing:0.15em;text-transform:uppercase;margin-bottom:8px;}
.owner-banner-title{font-family:'Cinzel',serif;font-size:clamp(1.5rem,3vw,2.2rem);color:#fff;margin-bottom:6px;}
.owner-banner-sub{color:rgba(255,220,160,0.7);font-size:0.9rem;}

.owner-body{max-width:1240px;margin:0 auto;padding:0 24px;}
.owner-grid{display:grid;grid-template-columns:280px 1fr;gap:24px;}

/* Sidebar */
.owner-sidebar{display:flex;flex-direction:column;gap:16px;}
.profile-card{
  background:var(--cream-card);border:1px solid rgba(200,150,60,0.2);
  border-radius:var(--r-xl);overflow:hidden;box-shadow:var(--shadow-md);
}
.profile-banner-strip{
  height:90px;
  background:linear-gradient(135deg,var(--s-600),var(--s-500),var(--g-500));
  position:relative;overflow:hidden;
}
.profile-banner-strip::before{content:'ॐ';position:absolute;right:12px;bottom:-10px;font-size:4.5rem;color:rgba(255,255,255,0.07);font-family:serif;line-height:1;}
.profile-av-wrap{
  margin:-32px 0 0 20px;
  width:64px;height:64px;border-radius:var(--r-lg);
  background:linear-gradient(135deg,var(--s-500),var(--s-700));
  border:3px solid var(--cream);
  display:flex;align-items:center;justify-content:center;
  color:#fff;font-family:'Cinzel',serif;font-size:1.2rem;font-weight:600;
  box-shadow:var(--shadow-md);position:relative;z-index:1;
}
.profile-info{padding:12px 20px 20px;}
.profile-name{font-family:'Cinzel',serif;font-size:1rem;color:var(--text-dark);margin-top:4px;margin-bottom:2px;}
.profile-email{font-size:0.78rem;color:var(--text-muted);margin-bottom:10px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.profile-badges{display:flex;gap:6px;flex-wrap:wrap;}

/* Sidebar nav */
.side-nav{background:var(--cream-card);border:1px solid rgba(200,150,60,0.2);border-radius:var(--r-xl);padding:12px;box-shadow:var(--shadow-sm);}
.side-nav-item{
  display:flex;align-items:center;gap:10px;
  padding:11px 14px;border-radius:var(--r-md);
  font-size:0.875rem;font-weight:600;color:var(--text-mid);
  text-decoration:none;transition:all 0.15s;
}
.side-nav-item:hover{background:var(--s-50);color:var(--s-600);}
.side-nav-item.active{background:var(--s-50);color:var(--s-600);border-left:3px solid var(--s-500);padding-left:11px;}
.side-nav-icon{font-size:1.1rem;}

/* Main content */
.owner-main{display:flex;flex-direction:column;gap:22px;}

/* Program placeholder */
.prog-empty{
  text-align:center;padding:52px 24px;
  background:var(--cream-card);border:2px dashed rgba(200,150,60,0.25);
  border-radius:var(--r-xl);
}
.prog-empty-icon{font-size:3rem;margin-bottom:14px;display:block;}
.prog-empty-title{font-family:'Cinzel',serif;font-size:1.1rem;color:var(--text-dark);margin-bottom:8px;}
.prog-empty-sub{font-size:0.875rem;color:var(--text-muted);max-width:300px;margin:0 auto;line-height:1.65;}

/* Info rows */
.info-row{display:flex;align-items:center;gap:12px;padding:13px 0;border-bottom:1px solid var(--sl-100);}
.info-row:last-child{border-bottom:none;}
.info-label{font-size:0.78rem;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.04em;width:120px;flex-shrink:0;}
.info-value{font-size:0.9rem;color:var(--text-dark);font-weight:500;}

/* ── Program Key Prefix section ── */
.prefix-current-box {
  display:flex; align-items:center; gap:14px;
  padding:14px 16px; background:rgba(200,140,40,0.06);
  border:1.5px solid rgba(200,140,40,0.2); border-radius:12px; margin-bottom:18px;
}
.prefix-badge-box {
  font-family:'Cinzel',serif; font-size:1.3rem; font-weight:700; color:#7a3200;
  background:rgba(200,140,40,0.14); border:2px solid rgba(200,140,40,0.28);
  border-radius:9px; width:58px; height:46px;
  display:flex; align-items:center; justify-content:center; flex-shrink:0;
  letter-spacing:0.1em;
}
.prefix-badge-empty { color:#c4a880; font-size:0.65rem; font-weight:600; letter-spacing:0.06em; }
.prefix-info-title { font-size:0.875rem; font-weight:700; color:var(--text-dark); margin:0 0 3px; }
.prefix-info-sub   { font-size:0.76rem; color:var(--text-muted); margin:0; line-height:1.5; }
.prefix-input-row  { display:flex; gap:10px; margin-bottom:10px; }
.prefix-input {
  flex:1; padding:10px 14px;
  border:1.5px solid rgba(200,140,40,0.25); border-radius:10px;
  background:#fdf8f0; color:#2d1200;
  font-family:'Cinzel',serif; font-size:1rem; font-weight:700;
  letter-spacing:0.12em; text-transform:uppercase;
  outline:none; transition:border-color 0.15s, box-shadow 0.15s;
}
.prefix-input:focus { border-color:#c8903c; box-shadow:0 0 0 3px rgba(200,140,40,0.12); }
.prefix-input::placeholder { font-family:'DM Sans',sans-serif; font-size:0.85rem; letter-spacing:0; font-weight:400; color:#b09070; text-transform:none; }
.prefix-save-btn {
  padding:10px 20px; border:none; border-radius:10px;
  background:linear-gradient(135deg,#7a3200,#b85000); color:#fff;
  font-family:'DM Sans',sans-serif; font-size:0.875rem; font-weight:700;
  cursor:pointer; transition:all 0.15s; display:flex; align-items:center; gap:7px; flex-shrink:0;
}
.prefix-save-btn:hover:not(:disabled) { background:linear-gradient(135deg,#8d3a00,#d06000); transform:translateY(-1px); }
.prefix-save-btn:disabled { opacity:0.5; cursor:not-allowed; transform:none; }
.prefix-hint {
  font-size:0.75rem; color:var(--text-muted); line-height:1.65;
  padding:10px 14px; background:rgba(200,140,40,0.05); border-radius:8px;
  border-left:3px solid rgba(200,140,40,0.3);
}
.prefix-spin {
  width:13px; height:13px; border-radius:50%; flex-shrink:0;
  border:2px solid rgba(255,255,255,0.35); border-top-color:#fff;
  animation:prefixSpin 0.7s linear infinite;
}
@keyframes prefixSpin { to { transform:rotate(360deg); } }

@media(max-width:860px){.owner-grid{grid-template-columns:1fr;}.owner-sidebar{order:1;}}
`;

export default function OwnerDashboardPage() {
  const { user, refreshUser } = useAuth();
  const location = useLocation();
  const isProfile = location.pathname.includes("/profile");

  // ── Prefix state ──────────────────────────────────────────────
  const [prefix, setPrefix] = useState("");
  const [saving, setSaving] = useState(false);
  const currentPrefix = user?.programKeyPrefix || null;

  const handleSavePrefix = async () => {
    const val = prefix
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "");
    if (!val) {
      toast.error("Enter a prefix first.");
      return;
    }
    if (val.length < 1 || val.length > 5) {
      toast.error("Must be 1–5 characters.");
      return;
    }
    setSaving(true);
    try {
      const res = await api.patch("/profile", { programKeyPrefix: val });
      toast.success(res.data.message);
      await refreshUser();
      setPrefix("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  const initials =
    user?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?";
  const joinDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "—";
  const lastLogin = user?.lastLogin
    ? new Date(user.lastLogin).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

  const quickActions = [
    {
      icon: "📋",
      label: "My Programs",
      sub: "View your assigned programs",
      href: "/owner/dashboard",
      bg: "rgba(196,79,0,0.1)",
    },
    {
      icon: "👤",
      label: "My Profile",
      sub: "View and manage profile",
      href: "/owner/profile",
      bg: "rgba(200,150,60,0.12)",
    },
    {
      icon: "🔑",
      label: "Change Password",
      sub: "Update your login credentials",
      href: "/change-password",
      bg: "rgba(107,33,168,0.1)",
    },
  ];

  return (
    <>
      <style>{css}</style>
      <div className="owner-page">
        {/* Banner */}
        <div className="owner-banner">
          <div className="owner-banner-inner">
            <div className="owner-banner-eyebrow">✦ &nbsp; Owner Portal</div>
            <h1 className="owner-banner-title">
              {isProfile
                ? `Hare Krishna — ${user?.name}`
                : `Hare Krishna, ${user?.name?.split(" ")[0]}.`}
            </h1>
            <p className="owner-banner-sub">
              {isProfile
                ? "Manage your account details and settings."
                : "Welcome to your sacred dashboard space."}
            </p>
          </div>
        </div>

        <div className="owner-body">
          <div className="owner-grid">
            {/* ── Sidebar ── */}
            <aside className="owner-sidebar">
              <div className="profile-card">
                <div className="profile-banner-strip" />
                <div className="profile-av-wrap">{initials}</div>
                <div className="profile-info">
                  <div className="profile-name">{user?.name}</div>
                  <div className="profile-email">{user?.email}</div>
                  <div className="profile-badges">
                    <span className="badge badge-owner">Owner</span>
                    <span
                      className={`badge ${
                        user?.isActive !== false
                          ? "badge-active"
                          : "badge-inactive"
                      }`}
                    >
                      {user?.isActive !== false ? "Active" : "Inactive"}
                    </span>
                    <span
                      className={`badge ${
                        user?.provider === "google"
                          ? "badge-google"
                          : "badge-local"
                      }`}
                    >
                      {user?.provider}
                    </span>
                  </div>
                </div>
              </div>

              <nav className="side-nav">
                <Link
                  to="/owner/dashboard"
                  className={`side-nav-item ${!isProfile ? "active" : ""}`}
                >
                  <span className="side-nav-icon">🏛️</span>Dashboard
                </Link>
                <Link
                  to="/owner/profile"
                  className={`side-nav-item ${isProfile ? "active" : ""}`}
                >
                  <span className="side-nav-icon">👤</span>My Profile
                </Link>
                <Link to="/change-password" className="side-nav-item">
                  <span className="side-nav-icon">🔑</span>Change Password
                </Link>
              </nav>
            </aside>

            {/* ── Main ── */}
            <div className="owner-main">
              {isProfile ? (
                <>
                  {/* Personal Info */}
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
                        ✦ Account Details
                      </div>
                      <h2
                        style={{
                          fontFamily: "'Cinzel',serif",
                          fontSize: "1.2rem",
                          color: "var(--text-dark)",
                        }}
                      >
                        Personal Information
                      </h2>
                    </div>
                    <div className="card-body">
                      <div className="info-row">
                        <span className="info-label">Full Name</span>
                        <span className="info-value">{user?.name}</span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">Email</span>
                        <span className="info-value">{user?.email}</span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">Role</span>
                        <span className="badge badge-owner">Owner</span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">Auth Method</span>
                        <span
                          className={`badge ${
                            user?.provider === "google"
                              ? "badge-google"
                              : "badge-local"
                          }`}
                        >
                          {user?.provider}
                        </span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">Status</span>
                        <span
                          className={`badge ${
                            user?.isActive !== false
                              ? "badge-active"
                              : "badge-inactive"
                          }`}
                        >
                          {user?.isActive !== false ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">Joined</span>
                        <span className="info-value">{joinDate}</span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">Last Login</span>
                        <span className="info-value">{lastLogin}</span>
                      </div>
                    </div>
                  </div>

                  {/* ── Program Key Prefix ── */}
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
                        ✦ Programs
                      </div>
                      <h2
                        style={{
                          fontFamily: "'Cinzel',serif",
                          fontSize: "1.2rem",
                          color: "var(--text-dark)",
                        }}
                      >
                        Program Key Prefix
                      </h2>
                    </div>
                    <div className="card-body">
                      {/* Current prefix display */}
                      <div className="prefix-current-box">
                        <div className="prefix-badge-box">
                          {currentPrefix ? (
                            currentPrefix
                          ) : (
                            <span className="prefix-badge-empty">AUTO</span>
                          )}
                        </div>
                        <div>
                          <p className="prefix-info-title">
                            {currentPrefix
                              ? `Using prefix "${currentPrefix}"`
                              : "Using auto-generated prefix"}
                          </p>
                          <p className="prefix-info-sub">
                            {currentPrefix
                              ? `Your programs: ${currentPrefix}001, ${currentPrefix}002…`
                              : `Auto from name: "${
                                  user?.name
                                    ?.replace(/\s+/g, "")
                                    .substring(0, 3)
                                    .toUpperCase() || "???"
                                }001"…`}
                          </p>
                        </div>
                      </div>

                      {/* Update input */}
                      <p
                        style={{
                          fontSize: "0.78rem",
                          fontWeight: 600,
                          color: "var(--text-mid)",
                          marginBottom: 8,
                        }}
                      >
                        Set Custom Prefix
                      </p>
                      <div className="prefix-input-row">
                        <input
                          type="text"
                          className="prefix-input"
                          placeholder="e.g. RKS or VVS"
                          value={prefix}
                          maxLength={5}
                          onChange={(e) =>
                            setPrefix(
                              e.target.value
                                .toUpperCase()
                                .replace(/[^A-Z0-9]/g, "")
                            )
                          }
                          onKeyDown={(e) =>
                            e.key === "Enter" && handleSavePrefix()
                          }
                          disabled={saving}
                        />
                        <button
                          className="prefix-save-btn"
                          onClick={handleSavePrefix}
                          disabled={saving || !prefix.trim()}
                        >
                          {saving ? (
                            <span className="prefix-spin" />
                          ) : (
                            <svg
                              width={14}
                              height={14}
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2.5}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M4.5 12.75l6 6 9-13.5"
                              />
                            </svg>
                          )}
                          {saving ? "Saving…" : "Save"}
                        </button>
                      </div>
                      <p className="prefix-hint">
                        A short code (1–5 letters) used as prefix for all your
                        program IDs. Setting <strong>RKS</strong> means programs
                        will be <strong>RKS001</strong>, <strong>RKS002</strong>{" "}
                        etc. If not set, first 3 letters of your name are used
                        automatically.
                      </p>
                    </div>
                  </div>

                  {/* Security */}
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
                        ✦ Account Security
                      </div>
                      <h2
                        style={{
                          fontFamily: "'Cinzel',serif",
                          fontSize: "1.2rem",
                          color: "var(--text-dark)",
                        }}
                      >
                        Security Settings
                      </h2>
                    </div>
                    <div className="card-body">
                      {user?.provider === "local" ? (
                        <>
                          <p
                            style={{
                              fontSize: "0.875rem",
                              color: "var(--text-mid)",
                              lineHeight: 1.7,
                              marginBottom: 18,
                            }}
                          >
                            Your account uses email and password authentication.
                            Keep your password strong and unique.
                          </p>
                          <Link
                            to="/change-password"
                            className="btn btn-primary btn-sm"
                          >
                            🔑 &nbsp;Change Password
                          </Link>
                        </>
                      ) : (
                        <div className="alert alert-info">
                          <span>🔗</span>
                          <span>
                            Your account is linked to{" "}
                            <strong>Google Sign-In</strong>. Manage your
                            password through your Google account settings.
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                /* ── Dashboard View — completely unchanged ── */
                <>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3,1fr)",
                      gap: 16,
                    }}
                  >
                    {[
                      {
                        icon: "📋",
                        label: "My Programs",
                        value: "—",
                        bg: "rgba(196,79,0,0.1)",
                      },
                      {
                        icon: "✅",
                        label: "Active Tasks",
                        value: "—",
                        bg: "rgba(34,197,94,0.1)",
                      },
                      {
                        icon: "🗓️",
                        label: "This Month",
                        value: "—",
                        bg: "rgba(200,150,60,0.12)",
                      },
                    ].map((s) => (
                      <div key={s.label} className="stat-card">
                        <div className="stat-icon" style={{ background: s.bg }}>
                          <span style={{ fontSize: "1.25rem" }}>{s.icon}</span>
                        </div>
                        <div className="stat-value">{s.value}</div>
                        <div className="stat-label">{s.label}</div>
                      </div>
                    ))}
                  </div>

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
                          ✦ My Programs
                        </div>
                        <h2
                          style={{
                            fontFamily: "'Cinzel',serif",
                            fontSize: "1.2rem",
                            color: "var(--text-dark)",
                          }}
                        >
                          Assigned Programs
                        </h2>
                      </div>
                    </div>
                    <div className="card-body">
                      <div className="prog-empty">
                        <span className="prog-empty-icon">🌸</span>
                        <div className="prog-empty-title">No Programs Yet</div>
                        <p className="prog-empty-sub">
                          Your programs will appear here once they are assigned
                          by an administrator. The journey begins with the first
                          step.
                        </p>
                      </div>
                    </div>
                  </div>

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
                        ✦ Navigation
                      </div>
                      <h2
                        style={{
                          fontFamily: "'Cinzel',serif",
                          fontSize: "1.2rem",
                          color: "var(--text-dark)",
                        }}
                      >
                        Quick Actions
                      </h2>
                    </div>
                    <div
                      className="card-body"
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                      }}
                    >
                      {quickActions.map((a) => (
                        <Link
                          to={a.href}
                          key={a.label}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            padding: "13px 16px",
                            borderRadius: "var(--r-md)",
                            border: "1.5px solid var(--sl-100)",
                            textDecoration: "none",
                            color: "inherit",
                            transition: "all 0.18s",
                            background: "var(--cream)",
                          }}
                        >
                          <div
                            style={{
                              width: 38,
                              height: 38,
                              borderRadius: "var(--r-sm)",
                              background: a.bg,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            <span style={{ fontSize: "1.2rem" }}>{a.icon}</span>
                          </div>
                          <div>
                            <div
                              style={{
                                fontWeight: 600,
                                fontSize: "0.875rem",
                                color: "var(--text-dark)",
                              }}
                            >
                              {a.label}
                            </div>
                            <div
                              style={{
                                fontSize: "0.75rem",
                                color: "var(--text-muted)",
                                marginTop: 1,
                              }}
                            >
                              {a.sub}
                            </div>
                          </div>
                          <svg
                            style={{
                              marginLeft: "auto",
                              color: "var(--text-muted)",
                              flexShrink: 0,
                            }}
                            width={15}
                            height={15}
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
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
