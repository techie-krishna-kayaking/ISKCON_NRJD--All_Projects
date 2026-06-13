import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import toast from "react-hot-toast";

const css = `
.cu-page{padding:36px 0 56px;}
.cu-banner{
  background:linear-gradient(135deg,#3d1700,#6b3000,#9d3e00);
  padding:36px 24px;margin-bottom:36px;position:relative;overflow:hidden;
}
.cu-banner::before{content:'✨';position:absolute;right:32px;top:50%;transform:translateY(-50%);font-size:8rem;opacity:0.07;pointer-events:none;}
.cu-banner::after{content:'';position:absolute;bottom:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,var(--g-400),transparent);}
.cu-banner-inner{max-width:500px;margin:0 auto;position:relative;z-index:1;}
.cu-banner-eyebrow{font-family:'Cinzel',serif;font-size:0.68rem;color:var(--g-300);letter-spacing:0.15em;text-transform:uppercase;margin-bottom:8px;}
.cu-banner-title{font-family:'Cinzel',serif;font-size:clamp(1.5rem,3vw,2.2rem);color:#fff;margin-bottom:4px;}
.cu-banner-sub{color:rgba(255,220,160,0.7);font-size:0.875rem;}
.cu-back{
  display:inline-flex;align-items:center;gap:6px;font-size:0.875rem;font-weight:600;
  color:rgba(255,220,160,0.7);background:none;border:none;cursor:pointer;padding:0;
  transition:color 0.15s;margin-bottom:12px;
}
.cu-back:hover{color:#fff;}
.cu-body{max-width:500px;margin:0 auto;padding:0 16px;}
.cu-role-badge{
  display:inline-flex;align-items:center;gap:8px;
  padding:7px 14px;border-radius:var(--r-md);
  font-family:'Cinzel',serif;font-size:0.8rem;font-weight:600;letter-spacing:0.04em;
  margin-bottom:24px;
}
.cu-form{display:flex;flex-direction:column;gap:20px;}
.cu-actions{display:flex;gap:12px;padding-top:8px;}
`;

export default function CreateUser({ mode = "owner" }) {
  const navigate = useNavigate();
  const isOwner = mode === "owner";

  const [form, setForm] = useState({
    name: "",
    email: "",
    provider: "local",
    password: "",
    confirm: "",
  });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const change = (e) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const validate = () => {
    if (!form.name.trim()) {
      toast.error("Name is required.");
      return false;
    }
    if (!form.email.trim()) {
      toast.error("Email is required.");
      return false;
    }
    if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      toast.error("Enter a valid email.");
      return false;
    }
    const needsPw = form.provider === "local" || !isOwner;
    if (needsPw && !form.password) {
      toast.error("Password is required.");
      return false;
    }
    if (needsPw && form.password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return false;
    }
    if (needsPw && form.password !== form.confirm) {
      toast.error("Passwords do not match.");
      return false;
    }
    return true;
  };

  // ── Fixed: separate API from navigation so nav error doesn't trigger toast ──
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    const needsPw = form.provider === "local" || !isOwner;
    const endpoint = isOwner ? "/admin/create-owner" : "/admin/create-admin";
    const payload = {
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      ...(isOwner ? { provider: form.provider } : {}),
      ...(needsPw ? { password: form.password } : {}),
    };

    let success = false;
    try {
      await api.post(endpoint, payload);
      success = true;
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create account.");
    } finally {
      setLoading(false);
    }

    if (success) {
      toast.success(
        `${isOwner ? "Owner" : "Admin"} account created successfully! 🪷`
      );
      navigate("/admin/users");
    }
  };

  const needsPw = form.provider === "local" || !isOwner;
  const strength = [
    form.password.length >= 8,
    /[A-Z]/.test(form.password),
    /\d/.test(form.password),
  ];

  return (
    <>
      <style>{css}</style>
      <div className="cu-page">
        <div className="cu-banner">
          <div className="cu-banner-inner">
            <button
              className="cu-back"
              onClick={() => navigate("/admin/users")}
            >
              ← Back to Directory
            </button>
            <div className="cu-banner-eyebrow">✦ &nbsp; Administration</div>
            <h1 className="cu-banner-title">
              Create {isOwner ? "Owner" : "Admin"}
            </h1>
            <p className="cu-banner-sub">
              {isOwner
                ? "Invite a new devotee to the Owner role."
                : "Grant administrative access to a trusted member."}
            </p>
          </div>
        </div>

        <div className="cu-body">
          <div className="card card-accent">
            <div className="card-body-lg">
              <div
                className="cu-role-badge"
                style={
                  isOwner
                    ? { background: "var(--s-100)", color: "var(--s-700)" }
                    : { background: "#f3e8ff", color: "#6b21a8" }
                }
              >
                <span style={{ fontSize: "1rem" }}>{isOwner ? "🪷" : "🛡️"}</span>
                {isOwner
                  ? "Owner Role — Limited Access"
                  : "Admin Role — Full System Access"}
              </div>

              <form onSubmit={handleSubmit} className="cu-form">
                <div className="form-group">
                  <label className="label">Full Name</label>
                  <input
                    name="name"
                    type="text"
                    value={form.name}
                    onChange={change}
                    placeholder="e.g. Prabhu Rajan"
                    className="input"
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label className="label">Email Address</label>
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={change}
                    placeholder="member@organization.com"
                    className="input"
                    disabled={loading}
                  />
                </div>

                {isOwner && (
                  <div className="form-group">
                    <label className="label">Login Method</label>
                    <div className="provider-toggle">
                      {[
                        { val: "local", label: "Email & Password", icon: "🔑" },
                        { val: "google", label: "Google Sign-In", icon: "G" },
                      ].map((p) => (
                        <button
                          key={p.val}
                          type="button"
                          className={`provider-btn ${
                            form.provider === p.val ? "active" : ""
                          }`}
                          onClick={() =>
                            setForm((f) => ({ ...f, provider: p.val }))
                          }
                        >
                          {p.val === "google" ? (
                            <svg width={16} height={16} viewBox="0 0 24 24">
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
                          ) : (
                            <span>🔑</span>
                          )}
                          {p.label}
                        </button>
                      ))}
                    </div>
                    {form.provider === "google" && (
                      <div
                        className="alert alert-info"
                        style={{ marginTop: 10 }}
                      >
                        <span>ℹ️</span>
                        <span style={{ fontSize: "0.8rem" }}>
                          The email above must exactly match the user's Google
                          account email.
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {needsPw && (
                  <>
                    <div className="form-group">
                      <label className="label">Password</label>
                      <div className="input-wrap">
                        <input
                          name="password"
                          type={showPass ? "text" : "password"}
                          value={form.password}
                          onChange={change}
                          placeholder="Minimum 8 characters"
                          className="input has-icon-right"
                          disabled={loading}
                        />
                        <button
                          type="button"
                          className="input-icon-right"
                          onClick={() => setShowPass((p) => !p)}
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
                      {form.password && (
                        <div className="strength-bar">
                          {strength.map((ok, i) => (
                            <div
                              key={i}
                              className={`strength-segment ${
                                ok ? "filled" : ""
                              }`}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="form-group">
                      <label className="label">Confirm Password</label>
                      <input
                        name="confirm"
                        type={showPass ? "text" : "password"}
                        value={form.confirm}
                        onChange={change}
                        placeholder="Re-enter password"
                        className="input"
                        disabled={loading}
                      />
                    </div>
                  </>
                )}

                <div className="cu-actions">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ flex: 1 }}
                    onClick={() => navigate("/admin/users")}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ flex: 1 }}
                    disabled={loading}
                  >
                    {loading && <span className="spinner" />}
                    Create {isOwner ? "Owner" : "Admin"}
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
