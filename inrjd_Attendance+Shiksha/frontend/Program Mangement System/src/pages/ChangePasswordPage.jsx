import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import toast from "react-hot-toast";

// ────────────────────────────────────────────────────────────────
// KEY FIXES vs old version:
//  1. After success, calls updateAuth(token, user) instead of logout()
//     → mustChangePassword becomes false in-memory immediately
//     → auth guard stops redirecting here → no loop
//  2. Works for BOTH cases:
//     a) Owner/Admin logging in with temp password (mustChangePassword=true)
//        → no current password required
//     b) Normal user changing their own password
//        → current password required
// ────────────────────────────────────────────────────────────────

const css = `
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap');

.cp-page { padding: 0 0 56px; font-family: 'DM Sans', sans-serif; }

.cp-banner {
  background: linear-gradient(135deg, #3d1700, #6b3000, #9d3e00);
  padding: 36px 24px; margin-bottom: 36px; position: relative; overflow: hidden;
}
.cp-banner::before {
  content: '🔑'; position: absolute; right: 32px; top: 50%;
  transform: translateY(-50%); font-size: 8rem; opacity: 0.07; pointer-events: none;
}
.cp-banner::after {
  content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 2px;
  background: linear-gradient(90deg, transparent, rgba(200,140,40,0.8), transparent);
}
.cp-banner-inner { max-width: 520px; margin: 0 auto; position: relative; z-index: 1; }
.cp-eyebrow {
  font-family: 'Cinzel', serif; font-size: 0.68rem; color: rgba(200,140,40,0.85);
  letter-spacing: 0.15em; text-transform: uppercase; margin-bottom: 8px;
}
.cp-title {
  font-family: 'Cinzel', serif; font-size: clamp(1.5rem, 3vw, 2.2rem);
  color: #fff; margin: 0 0 6px; font-weight: 700;
}
.cp-sub { color: rgba(255, 220, 160, 0.7); font-size: 0.875rem; margin: 0; line-height: 1.6; }

.cp-container { max-width: 520px; margin: 0 auto; padding: 0 24px; }

.cp-alert-warn {
  display: flex; align-items: flex-start; gap: 10px;
  background: rgba(251,191,36,0.1); border: 1px solid rgba(251,191,36,0.3);
  border-radius: 12px; padding: 12px 16px; margin-bottom: 20px;
  font-size: 0.82rem; color: #92400e; line-height: 1.6;
}

.cp-card {
  background: #fff; border: 1px solid rgba(200,140,40,0.18);
  border-top: 3px solid #c8903c; border-radius: 16px;
  box-shadow: 0 2px 14px rgba(61,23,0,0.06); overflow: hidden;
}
.cp-card-body { padding: 28px; }

.cp-form { display: flex; flex-direction: column; gap: 20px; }
.cp-form-group { display: flex; flex-direction: column; gap: 6px; }
.cp-label { font-size: 0.78rem; font-weight: 600; color: #5c3a14; letter-spacing: 0.03em; }

.cp-input-wrap { position: relative; }
.cp-input {
  width: 100%; box-sizing: border-box;
  padding: 11px 42px 11px 14px;
  border: 1.5px solid rgba(200,140,40,0.22); border-radius: 10px;
  background: #fdf8f0; color: #2d1200;
  font-family: 'DM Sans', sans-serif; font-size: 0.9rem;
  outline: none; transition: border-color 0.15s, box-shadow 0.15s;
}
.cp-input:focus { border-color: #c8903c; box-shadow: 0 0 0 3px rgba(200,140,40,0.12); }
.cp-input::placeholder { color: #b09070; }
.cp-input:disabled { background: rgba(200,140,40,0.05); color: #8b6840; cursor: not-allowed; }
.cp-input-plain {
  width: 100%; box-sizing: border-box;
  padding: 11px 14px;
  border: 1.5px solid rgba(200,140,40,0.22); border-radius: 10px;
  background: #fdf8f0; color: #2d1200;
  font-family: 'DM Sans', sans-serif; font-size: 0.9rem;
  outline: none; transition: border-color 0.15s, box-shadow 0.15s;
}
.cp-input-plain:focus { border-color: #c8903c; box-shadow: 0 0 0 3px rgba(200,140,40,0.12); }
.cp-input-plain::placeholder { color: #b09070; }
.cp-input-plain:disabled { background: rgba(200,140,40,0.05); color: #8b6840; cursor: not-allowed; }

.cp-eye-btn {
  position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
  background: none; border: none; cursor: pointer; color: #a08060;
  display: flex; align-items: center; justify-content: center;
  transition: color 0.15s; padding: 0;
}
.cp-eye-btn:hover { color: #c8903c; }

.cp-strength-bar { display: flex; gap: 5px; margin-top: 6px; }
.cp-strength-seg { flex: 1; height: 4px; border-radius: 2px; background: rgba(200,140,40,0.12); transition: background 0.2s; }
.cp-strength-seg.filled { background: #c8903c; }
.cp-strength-text { font-size: 0.72rem; color: #8b6840; margin-top: 4px; }

.cp-btn-row { display: flex; gap: 12px; margin-top: 4px; }
.cp-btn-primary {
  flex: 1; padding: 12px 20px;
  background: linear-gradient(135deg, #7a3200, #b85000);
  color: #fff; border: none; border-radius: 10px;
  font-family: 'DM Sans', sans-serif; font-size: 0.9rem; font-weight: 700;
  cursor: pointer; transition: all 0.18s;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  box-shadow: 0 2px 10px rgba(120,50,0,0.2);
}
.cp-btn-primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #8d3a00, #d06000); transform: translateY(-1px);
}
.cp-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
.cp-btn-secondary {
  flex: 1; padding: 12px 20px;
  background: #fff; color: #5c3a14;
  border: 1.5px solid rgba(200,140,40,0.3); border-radius: 10px;
  font-family: 'DM Sans', sans-serif; font-size: 0.9rem; font-weight: 600;
  cursor: pointer; transition: all 0.18s;
}
.cp-btn-secondary:hover:not(:disabled) {
  background: rgba(200,140,40,0.06); border-color: rgba(200,140,40,0.5);
}
.cp-btn-secondary:disabled { opacity: 0.5; cursor: not-allowed; }

.cp-spinner {
  width: 15px; height: 15px; border-radius: 50%;
  border: 2px solid rgba(255,255,255,0.35); border-top-color: #fff;
  animation: cpSpin 0.7s linear infinite; flex-shrink: 0;
}
@keyframes cpSpin { to { transform: rotate(360deg); } }

@media(max-width:600px){
  .cp-container { padding: 0 14px; }
  .cp-card-body { padding: 20px; }
  .cp-btn-row { flex-direction: column; }
}
`;

export default function ChangePasswordPage() {
  const { user, updateAuth } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ current: "", newPass: "", confirm: "" });
  const [show, setShow] = useState(false);
  const [loading, setLoad] = useState(false);

  // true  = new owner/admin with temp password — current password NOT required
  // false = normal voluntary change — current password IS required
  const isMustChange = !!user?.mustChangePassword;
  const isGoogleUser = user?.provider === "google";

  const change = (e) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const strength = [
    form.newPass.length >= 8,
    /[A-Z]/.test(form.newPass),
    /\d/.test(form.newPass),
  ];

  // Google users can't change password here
  if (isGoogleUser) {
    return (
      <>
        <style>{css}</style>
        <div className="cp-page">
          <div className="cp-banner">
            <div className="cp-banner-inner">
              <div className="cp-eyebrow">✦ &nbsp; Account Security</div>
              <h1 className="cp-title">Change Password</h1>
            </div>
          </div>
          <div className="cp-container">
            <div className="cp-card">
              <div
                className="cp-card-body"
                style={{ textAlign: "center", padding: 40 }}
              >
                <div style={{ fontSize: "2.5rem", marginBottom: 16 }}>🔗</div>
                <p
                  style={{
                    fontFamily: "'Cinzel',serif",
                    fontSize: "1rem",
                    color: "#2d1200",
                    marginBottom: 10,
                  }}
                >
                  Google Account
                </p>
                <p
                  style={{
                    fontSize: "0.875rem",
                    color: "#8b6840",
                    lineHeight: 1.7,
                    marginBottom: 24,
                  }}
                >
                  Your account uses Google Sign-In. Password management is
                  handled by Google.
                  <br />
                  Visit <strong>myaccount.google.com</strong> to change your
                  password.
                </p>
                <button
                  className="cp-btn-secondary"
                  style={{ maxWidth: 200, margin: "0 auto" }}
                  onClick={() => navigate(-1)}
                >
                  Go Back
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!isMustChange && !form.current) {
      toast.error("Current password is required.");
      return;
    }
    if (!form.newPass || form.newPass.length < 8) {
      toast.error("New password must be at least 8 characters.");
      return;
    }
    if (form.newPass !== form.confirm) {
      toast.error("Passwords do not match.");
      return;
    }

    setLoad(true);
    try {
      const res = await api.post("/auth/change-password", {
        // Only send currentPassword when NOT in forced-change mode
        ...(isMustChange ? {} : { currentPassword: form.current }),
        newPassword: form.newPass,
      });

      // ── THE KEY FIX ──────────────────────────────────────────
      // Backend now returns { message, token, user } with mustChangePassword:false
      // Update context in-place → auth guard clears → no loop → no logout needed
      const { token: newToken, user: newUser } = res.data;
      if (newToken && newUser) {
        updateAuth(newToken, newUser);
      }
      // ─────────────────────────────────────────────────────────

      toast.success("Password changed successfully! 🪷");

      // Navigate to the correct home page based on role
      const dest =
        newUser?.role === "owner"
          ? "/owner/dashboard"
          : newUser?.role === "admin"
          ? "/admin/dashboard"
          : "/";
      navigate(dest, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to change password.");
    } finally {
      setLoad(false);
    }
  };

  return (
    <>
      <style>{css}</style>
      <div className="cp-page">
        <div className="cp-banner">
          <div className="cp-banner-inner">
            <div className="cp-eyebrow">✦ &nbsp; Account Security</div>
            <h1 className="cp-title">
              {isMustChange ? "Set Your Password" : "Change Password"}
            </h1>
            <p className="cp-sub">
              {isMustChange
                ? "An administrator has set a temporary password. Please choose a new one to continue."
                : "Update your login credentials to keep your account secure."}
            </p>
          </div>
        </div>

        <div className="cp-container">
          {isMustChange && (
            <div className="cp-alert-warn">
              <span>⚠️</span>
              <span>
                You must set a new password before you can access the system.
              </span>
            </div>
          )}

          <div className="cp-card">
            <div className="cp-card-body">
              <form onSubmit={handleSubmit} className="cp-form">
                {/* Current password — only shown for voluntary changes */}
                {!isMustChange && (
                  <div className="cp-form-group">
                    <label className="cp-label">Current Password</label>
                    <div className="cp-input-wrap">
                      <input
                        name="current"
                        type={show ? "text" : "password"}
                        value={form.current}
                        onChange={change}
                        placeholder="Your current password"
                        className="cp-input"
                        disabled={loading}
                        autoFocus
                      />
                      <button
                        type="button"
                        className="cp-eye-btn"
                        onClick={() => setShow((p) => !p)}
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
                            d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}

                {/* New password */}
                <div className="cp-form-group">
                  <label className="cp-label">New Password</label>
                  <div className="cp-input-wrap">
                    <input
                      name="newPass"
                      type={show ? "text" : "password"}
                      value={form.newPass}
                      onChange={change}
                      placeholder="Minimum 8 characters"
                      className="cp-input"
                      disabled={loading}
                      autoFocus={isMustChange}
                    />
                    <button
                      type="button"
                      className="cp-eye-btn"
                      onClick={() => setShow((p) => !p)}
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
                          d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    </button>
                  </div>
                  {form.newPass && (
                    <>
                      <div className="cp-strength-bar">
                        {strength.map((ok, i) => (
                          <div
                            key={i}
                            className={`cp-strength-seg${ok ? " filled" : ""}`}
                          />
                        ))}
                      </div>
                      <p className="cp-strength-text">
                        {strength.filter(Boolean).length}/3 —{" "}
                        {strength.filter(Boolean).length === 3
                          ? "Strong ✓"
                          : strength.filter(Boolean).length === 2
                          ? "Moderate"
                          : "Weak"}
                      </p>
                    </>
                  )}
                </div>

                {/* Confirm password */}
                <div className="cp-form-group">
                  <label className="cp-label">Confirm New Password</label>
                  <input
                    name="confirm"
                    type={show ? "text" : "password"}
                    value={form.confirm}
                    onChange={change}
                    placeholder="Re-enter new password"
                    className="cp-input-plain"
                    disabled={loading}
                  />
                  {form.confirm && form.confirm !== form.newPass && (
                    <p
                      style={{
                        fontSize: "0.72rem",
                        color: "#dc2626",
                        marginTop: 3,
                      }}
                    >
                      Passwords do not match.
                    </p>
                  )}
                </div>

                <div className="cp-btn-row">
                  {/* Cancel only for voluntary change — forced-change users have nowhere to go */}
                  {!isMustChange && (
                    <button
                      type="button"
                      className="cp-btn-secondary"
                      onClick={() => navigate(-1)}
                      disabled={loading}
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    className="cp-btn-primary"
                    disabled={loading}
                  >
                    {loading && <span className="cp-spinner" />}
                    {isMustChange
                      ? "Set Password & Continue"
                      : "Update Password"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
