import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const css = `
.ap-page { padding: 32px 28px; max-width: 900px; margin: 0 auto; }

/* Banner */
.ap-banner {
  background: linear-gradient(135deg, #2d1100 0%, #5c2500 40%, #8b3a00 80%, #b04800 100%);
  border-radius: 16px; padding: 28px 28px; margin-bottom: 28px;
  display: flex; align-items: center; gap: 18px; overflow: hidden; position: relative;
}
.ap-banner::after {
  content: '🪷'; position: absolute; right: 24px; top: 50%; transform: translateY(-50%);
  font-size: 5rem; opacity: 0.06; pointer-events: none; line-height: 1;
}
.ap-avatar {
  width: 60px; height: 60px; border-radius: 14px; flex-shrink: 0;
  background: rgba(255,255,255,0.15); border: 2px solid rgba(200,140,40,0.35);
  display: flex; align-items: center; justify-content: center;
  font-family: 'Cinzel', serif; font-size: 1.2rem; font-weight: 700; color: #fff;
}
.ap-avatar-super { background: rgba(124,58,237,0.3); border-color: rgba(124,58,237,0.5); }
.ap-banner-info h1 {
  font-family: 'Cinzel', serif; font-size: 1.3rem; font-weight: 700; color: #fff; margin-bottom: 4px;
}
.ap-banner-info p { font-size: 0.82rem; color: rgba(255,210,140,0.75); }
.ap-badges { display: flex; gap: 6px; margin-top: 8px; flex-wrap: wrap; }
.ap-badge {
  font-size: 0.62rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;
  padding: 3px 9px; border-radius: 20px;
}
.ap-badge-super { background: rgba(124,58,237,0.25); color: #c4b5fd; border: 1px solid rgba(124,58,237,0.3); }
.ap-badge-role  { background: rgba(200,140,40,0.25); color: #fcd34d; border: 1px solid rgba(200,140,40,0.3); }
.ap-badge-google { background: rgba(255,255,255,0.12); color: rgba(255,255,255,0.7); border: 1px solid rgba(255,255,255,0.15); }

/* Section */
.ap-section { margin-bottom: 24px; }
.ap-section-title {
  font-family: 'Cinzel', serif; font-size: 0.65rem; font-weight: 700;
  letter-spacing: 0.2em; text-transform: uppercase; color: #8b6840;
  margin-bottom: 12px; padding-left: 2px;
  display: flex; align-items: center; gap: 8px;
}
.ap-section-title::after {
  content: ''; flex: 1; height: 1px; background: rgba(200,140,40,0.15);
}

/* Info grid */
.ap-info-grid {
  background: #fff; border-radius: 12px;
  border: 1px solid rgba(200,140,40,0.14);
  overflow: hidden;
}
.ap-info-row {
  display: flex; align-items: center; padding: 12px 16px;
  border-bottom: 1px solid rgba(200,140,40,0.07);
}
.ap-info-row:last-child { border-bottom: none; }
.ap-info-label { width: 130px; flex-shrink: 0; font-size: 0.75rem; color: #8b6840; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; }
.ap-info-value { font-size: 0.875rem; color: #2d1200; font-weight: 500; }

/* Action cards */
.ap-actions { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; }
.ap-action {
  display: flex; align-items: center; gap: 12px;
  padding: 14px 16px;
  background: #fff; border-radius: 12px;
  border: 1px solid rgba(200,140,40,0.14);
  text-decoration: none; cursor: pointer;
  transition: all 0.15s;
  box-shadow: 0 1px 4px rgba(61,23,0,0.04);
}
.ap-action:hover {
  border-color: rgba(200,140,40,0.35);
  box-shadow: 0 4px 16px rgba(61,23,0,0.09);
  transform: translateY(-1px);
}
.ap-action-icon {
  width: 38px; height: 38px; border-radius: 10px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center; font-size: 1rem;
}
.ap-action-label { font-size: 0.84rem; font-weight: 600; color: #3d1800; }
.ap-action-sub { font-size: 0.7rem; color: #8b6840; margin-top: 2px; }
.ap-action-arr { margin-left: auto; color: #c8b090; flex-shrink: 0; }
.ap-action:hover .ap-action-arr { color: #c8903c; }

/* Danger zone */
.ap-danger {
  background: rgba(254,242,242,0.8); border: 1px solid rgba(220,38,38,0.14);
  border-radius: 12px; padding: 14px 16px;
  display: flex; align-items: center; gap: 12px;
  cursor: pointer; transition: all 0.15s;
  width: 100%; text-align: left;
}
.ap-danger:hover { background: rgba(254,226,226,0.9); border-color: rgba(220,38,38,0.3); }
.ap-danger-icon { width: 38px; height: 38px; border-radius: 10px; background: rgba(220,38,38,0.1); display: flex; align-items: center; justify-content: center; font-size: 1rem; flex-shrink: 0; }
.ap-danger-label { font-size: 0.84rem; font-weight: 600; color: #b91c1c; }
.ap-danger-sub { font-size: 0.7rem; color: #ef4444; margin-top: 2px; }
`;

const Arr = () => (
  <svg
    width={14}
    height={14}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
    className="ap-action-arr"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
    />
  </svg>
);

const GoogleIcon = () => (
  <svg width={12} height={12} viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
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
);

export default function AdminProfile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const initials =
    user?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?";
  const isGoogleUser = user?.provider === "google";

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const mgmtActions = [
    {
      icon: "👥",
      label: "Manage Members",
      sub: "View, activate, deactivate",
      to: "/admin/users",
      bg: "rgba(200,140,40,0.1)",
    },
    {
      icon: "➕",
      label: "Create Owner",
      sub: "Add a new owner account",
      to: "/admin/create-owner",
      bg: "rgba(22,163,74,0.1)",
    },
    {
      icon: "🔧",
      label: "Create Admin",
      sub: "Add a new admin account",
      to: "/admin/create-admin",
      bg: "rgba(124,58,237,0.1)",
    },
  ];

  const settingsActions = [
    !isGoogleUser && {
      icon: "🔑",
      label: "Change Password",
      sub: "Update your account password",
      to: "/change-password",
      bg: "rgba(200,140,40,0.1)",
    },
  ].filter(Boolean);

  return (
    <>
      <style>{css}</style>
      <div className="ap-page">
        {/* Banner */}
        <div className="ap-banner">
          <div
            className={`ap-avatar${
              user?.isSuperAdmin ? " ap-avatar-super" : ""
            }`}
          >
            {user?.isSuperAdmin ? "⭐" : initials}
          </div>
          <div className="ap-banner-info">
            <h1>{user?.name}</h1>
            <p>{user?.email}</p>
            <div className="ap-badges">
              {user?.isSuperAdmin && (
                <span className="ap-badge ap-badge-super">⭐ SuperAdmin</span>
              )}
              <span className="ap-badge ap-badge-role">{user?.role}</span>
              {isGoogleUser && (
                <span
                  className="ap-badge ap-badge-google"
                  style={{ display: "flex", alignItems: "center", gap: 4 }}
                >
                  <GoogleIcon /> Google Account
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Account Info */}
        <div className="ap-section">
          <div className="ap-section-title">Account Details</div>
          <div className="ap-info-grid">
            <div className="ap-info-row">
              <span className="ap-info-label">Full Name</span>
              <span className="ap-info-value">{user?.name}</span>
            </div>
            <div className="ap-info-row">
              <span className="ap-info-label">Email</span>
              <span className="ap-info-value">{user?.email}</span>
            </div>
            <div className="ap-info-row">
              <span className="ap-info-label">Role</span>
              <span
                className="ap-info-value"
                style={{ textTransform: "capitalize" }}
              >
                {user?.isSuperAdmin ? "SuperAdmin" : user?.role}
              </span>
            </div>
            <div className="ap-info-row">
              <span className="ap-info-label">Sign-in</span>
              <span
                className="ap-info-value"
                style={{ display: "flex", alignItems: "center", gap: 6 }}
              >
                {isGoogleUser ? (
                  <>
                    <GoogleIcon /> Google
                  </>
                ) : (
                  "📧 Email & Password"
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Management */}
        <div className="ap-section">
          <div className="ap-section-title">Management</div>
          <div className="ap-actions">
            {mgmtActions.map(({ icon, label, sub, to, bg }) => (
              <Link key={to} to={to} className="ap-action">
                <div className="ap-action-icon" style={{ background: bg }}>
                  {icon}
                </div>
                <div>
                  <div className="ap-action-label">{label}</div>
                  <div className="ap-action-sub">{sub}</div>
                </div>
                <Arr />
              </Link>
            ))}
          </div>
        </div>

        {/* Settings */}
        {settingsActions.length > 0 && (
          <div className="ap-section">
            <div className="ap-section-title">Settings</div>
            <div className="ap-actions">
              {settingsActions.map(({ icon, label, sub, to, bg }) => (
                <Link key={to} to={to} className="ap-action">
                  <div className="ap-action-icon" style={{ background: bg }}>
                    {icon}
                  </div>
                  <div>
                    <div className="ap-action-label">{label}</div>
                    <div className="ap-action-sub">{sub}</div>
                  </div>
                  <Arr />
                </Link>
              ))}
            </div>
          </div>
        )}

        {isGoogleUser && (
          <div className="ap-section">
            <div className="ap-section-title">Password</div>
            <div
              style={{
                background: "rgba(200,140,40,0.06)",
                border: "1px solid rgba(200,140,40,0.14)",
                borderRadius: 12,
                padding: "14px 16px",
                fontSize: "0.82rem",
                color: "#6b4520",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <GoogleIcon />
              Your account uses Google Sign-In. To change your password, visit
              your Google account settings at{" "}
              <strong>myaccount.google.com</strong>
            </div>
          </div>
        )}

        {/* Logout */}
        <div className="ap-section">
          <div className="ap-section-title">Session</div>
          <button className="ap-danger" onClick={handleLogout}>
            <div className="ap-danger-icon">🚪</div>
            <div>
              <div className="ap-danger-label">Logout</div>
              <div className="ap-danger-sub">End your current session</div>
            </div>
          </button>
        </div>
      </div>
    </>
  );
}
