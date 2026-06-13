import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import toast from "react-hot-toast";

const css = `
.auth-page{
  min-height:calc(100vh - 72px);display:flex;align-items:center;justify-content:center;
  padding:48px 20px;position:relative;overflow:hidden;
  background:linear-gradient(160deg,var(--cream) 0%,var(--cream-warm) 50%,var(--s-50) 100%);
}
.auth-orb1{position:fixed;top:-120px;right:-120px;width:440px;height:440px;border-radius:50%;background:radial-gradient(circle,rgba(232,101,10,0.14) 0%,transparent 70%);pointer-events:none;animation:floatA 14s ease-in-out infinite;}
.auth-orb2{position:fixed;bottom:-100px;left:-100px;width:380px;height:380px;border-radius:50%;background:radial-gradient(circle,rgba(200,150,60,0.12) 0%,transparent 70%);pointer-events:none;animation:floatB 17s ease-in-out infinite;}
.auth-om{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);font-size:50vw;color:rgba(200,150,60,0.025);font-family:serif;line-height:1;pointer-events:none;user-select:none;}

.auth-inner{width:100%;max-width:440px;position:relative;z-index:2;animation:slideUp 0.5s cubic-bezier(0.22,1,0.36,1) both;}
.auth-logo-wrap{text-align:center;margin-bottom:28px;}
.auth-logo-icon{
  width:70px;height:70px;
  background:linear-gradient(135deg,var(--s-500),var(--s-700));
  border-radius:20px;display:inline-flex;align-items:center;justify-content:center;
  box-shadow:var(--shadow-saff);margin-bottom:14px;
  animation:popIn 0.65s cubic-bezier(0.34,1.56,0.64,1) 0.1s both;
  border:2px solid rgba(200,150,60,0.3);
}
.auth-title{font-family:'Cinzel',serif;font-size:1.9rem;color:var(--text-dark);margin-bottom:6px;}
.auth-sub{font-size:0.875rem;color:var(--text-light);}

.auth-form{display:flex;flex-direction:column;gap:18px;}
.auth-link{text-align:center;font-size:0.875rem;color:var(--text-muted);font-weight:500;}
.auth-link a{color:var(--s-600);font-weight:600;text-decoration:none;}
.auth-link a:hover{text-decoration:underline;}

.success-ring{
  width:68px;height:68px;border-radius:50%;
  background:linear-gradient(135deg,rgba(34,197,94,0.15),rgba(34,197,94,0.05));
  border:2px solid rgba(34,197,94,0.3);
  display:flex;align-items:center;justify-content:center;margin:0 auto 16px;
}
`;

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoad] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Please enter your email.");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      toast.error("Enter a valid email.");
      return;
    }
    setLoad(true);
    try {
      await api.post("/auth/forgot-password", { email: email.trim() });
    } catch (_) {
      /* Always succeed for security */
    } finally {
      setLoad(false);
      setSent(true);
    }
  };

  return (
    <>
      <style>{css}</style>
      <div className="auth-page">
        <div className="auth-orb1" />
        <div className="auth-orb2" />
        <div className="auth-om"></div>
        <div className="auth-inner">
          <div className="auth-logo-wrap">
            <div className="auth-logo-icon">
              <span style={{ fontSize: "2rem" }}>📧</span>
            </div>
            <h1 className="auth-title">Forgot Password</h1>
            <p className="auth-sub">
              We shall send you a path back to your account.
            </p>
          </div>
          <div className="card card-accent">
            <div className="card-body-lg">
              {sent ? (
                <div style={{ textAlign: "center", padding: "8px 0" }}>
                  <div className="success-ring">
                    <span style={{ fontSize: "1.8rem" }}>✅</span>
                  </div>
                  <h2
                    style={{
                      fontFamily: "'Cinzel',serif",
                      fontSize: "1.3rem",
                      color: "var(--text-dark)",
                      marginBottom: 10,
                    }}
                  >
                    Check Your Inbox
                  </h2>
                  <p
                    style={{
                      fontSize: "0.875rem",
                      color: "var(--text-mid)",
                      lineHeight: 1.7,
                      marginBottom: 24,
                    }}
                  >
                    If an account exists for <strong>{email}</strong>, a reset
                    link has been sent. The link expires in 15 minutes.
                  </p>
                  <Link to="/login" className="btn btn-primary btn-full">
                    Return to Login
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="auth-form">
                  <div className="form-group">
                    <label className="label">Email Address</label>
                    <div className="input-wrap">
                      <svg
                        className="input-icon-left"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                        />
                      </svg>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="input has-icon-left"
                        disabled={loading}
                        autoFocus
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="btn btn-primary btn-full"
                    disabled={loading}
                  >
                    {loading && <span className="spinner" />} Send Reset Link
                  </button>
                  <div className="auth-link">
                    <Link to="/login">← Back to Login</Link>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [newPw, setNewPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoad] = useState(false);
  const [done, setDone] = useState(false);

  const strength = [newPw.length >= 8, /[A-Z]/.test(newPw), /\d/.test(newPw)];

  if (!token)
    return (
      <>
        <style>{css}</style>
        <div className="auth-page">
          <div className="auth-inner">
            <div className="card card-accent">
              <div className="card-body-lg" style={{ textAlign: "center" }}>
                <span
                  style={{
                    fontSize: "2.5rem",
                    display: "block",
                    marginBottom: 12,
                  }}
                >
                  ⚠️
                </span>
                <h2
                  style={{
                    fontFamily: "'Cinzel',serif",
                    fontSize: "1.3rem",
                    color: "var(--text-dark)",
                    marginBottom: 10,
                  }}
                >
                  Invalid Link
                </h2>
                <p
                  style={{
                    fontSize: "0.875rem",
                    color: "var(--text-mid)",
                    marginBottom: 24,
                  }}
                >
                  This reset link is missing or invalid. Please request a new
                  one.
                </p>
                <Link
                  to="/forgot-password"
                  className="btn btn-primary btn-full"
                >
                  Request New Link
                </Link>
              </div>
            </div>
          </div>
        </div>
      </>
    );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newPw || newPw.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    if (newPw !== confirm) {
      toast.error("Passwords do not match.");
      return;
    }
    setLoad(true);
    try {
      await api.post("/auth/reset-password", { token, newPassword: newPw });
      setDone(true);
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Reset failed. Link may have expired."
      );
    } finally {
      setLoad(false);
    }
  };

  return (
    <>
      <style>{css}</style>
      <div className="auth-page">
        <div className="auth-orb1" />
        <div className="auth-orb2" />
        <div className="auth-om"></div>
        <div className="auth-inner">
          <div className="auth-logo-wrap">
            <div className="auth-logo-icon">
              <span style={{ fontSize: "2rem" }}>🔑</span>
            </div>
            <h1 className="auth-title">Set New Password</h1>
            <p className="auth-sub">
              Choose a strong, sacred password for your account.
            </p>
          </div>
          <div className="card card-accent">
            <div className="card-body-lg">
              {done ? (
                <div style={{ textAlign: "center", padding: "8px 0" }}>
                  <div className="success-ring">
                    <span style={{ fontSize: "1.8rem" }}>🪷</span>
                  </div>
                  <h2
                    style={{
                      fontFamily: "'Cinzel',serif",
                      fontSize: "1.3rem",
                      color: "var(--text-dark)",
                      marginBottom: 10,
                    }}
                  >
                    Password Updated!
                  </h2>
                  <p
                    style={{
                      fontSize: "0.875rem",
                      color: "var(--text-mid)",
                      lineHeight: 1.7,
                      marginBottom: 24,
                    }}
                  >
                    Your password has been reset. You may now enter the portal
                    with your new credentials.
                  </p>
                  <button
                    className="btn btn-primary btn-full"
                    onClick={() => navigate("/login")}
                  >
                    Go to Login
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="auth-form">
                  <div className="form-group">
                    <label className="label">New Password</label>
                    <div className="input-wrap">
                      <input
                        type={show ? "text" : "password"}
                        value={newPw}
                        onChange={(e) => setNewPw(e.target.value)}
                        placeholder="Minimum 8 characters"
                        className="input has-icon-right"
                        disabled={loading}
                        autoFocus
                      />
                      <button
                        type="button"
                        className="input-icon-right"
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
                    {newPw && (
                      <div className="strength-bar">
                        {strength.map((ok, i) => (
                          <div
                            key={i}
                            className={`strength-segment ${ok ? "filled" : ""}`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="form-group">
                    <label className="label">Confirm Password</label>
                    <input
                      type={show ? "text" : "password"}
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      placeholder="Re-enter password"
                      className="input"
                      disabled={loading}
                    />
                  </div>
                  <button
                    type="submit"
                    className="btn btn-primary btn-full"
                    disabled={loading}
                  >
                    {loading && <span className="spinner" />} Reset Password
                  </button>
                  <div className="auth-link">
                    <Link to="/login">← Back to Login</Link>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
