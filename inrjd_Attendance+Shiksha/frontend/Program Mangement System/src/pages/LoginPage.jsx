import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { API_URL } from "../config/api";
import toast from "react-hot-toast";

const css = `
:root{
  --bg-1:#f6f2ea;
  --bg-2:#efe6d8;
  --bg-3:#fbf9f5;
  --card:rgba(255,255,255,0.78);
  --card-strong:rgba(255,255,255,0.9);
  --border:rgba(17,24,39,0.08);
  --border-strong:rgba(200,154,60,0.26);
  --text-dark:#16202a;
  --text-mid:#44505d;
  --text-muted:#6b7280;
  --accent:#b8893a;
  --accent-2:#8f6424;
  --accent-soft:rgba(184,137,58,0.12);
  --shadow:0 24px 70px rgba(17,24,39,0.12);
  --shadow-soft:0 10px 30px rgba(17,24,39,0.08);
}

.login-page{
  min-height:calc(100vh - 72px);
  display:flex;
  align-items:center;
  justify-content:center;
  padding:56px 20px;
  position:relative;
  overflow:hidden;
  background:
    radial-gradient(circle at 15% 12%, rgba(184,137,58,0.14) 0%, transparent 26%),
    radial-gradient(circle at 88% 18%, rgba(17,24,39,0.06) 0%, transparent 24%),
    radial-gradient(circle at 70% 82%, rgba(184,137,58,0.10) 0%, transparent 28%),
    linear-gradient(135deg, var(--bg-1) 0%, var(--bg-3) 45%, var(--bg-2) 100%);
}

.login-page::before{
  content:'';
  position:absolute;
  inset:0;
  background:
    linear-gradient(115deg, rgba(255,255,255,0.16) 0%, transparent 35%, transparent 65%, rgba(255,255,255,0.08) 100%);
  pointer-events:none;
}

.login-page::after{
  content:'';
  position:absolute;
  inset:-80px;
  background:
    radial-gradient(circle at 20% 25%, rgba(184,137,58,0.08) 0, transparent 18%),
    radial-gradient(circle at 80% 30%, rgba(17,24,39,0.04) 0, transparent 16%),
    radial-gradient(circle at 55% 78%, rgba(184,137,58,0.06) 0, transparent 20%);
  filter:blur(10px);
  pointer-events:none;
}

.login-orb1,
.login-orb2{
  position:fixed;
  border-radius:50%;
  pointer-events:none;
  filter:blur(2px);
}

.login-orb1{
  top:-180px;
  right:-140px;
  width:560px;
  height:560px;
  background:radial-gradient(circle, rgba(184,137,58,0.16) 0%, rgba(184,137,58,0.05) 34%, transparent 72%);
  animation:floatA 18s ease-in-out infinite;
}

.login-orb2{
  bottom:-170px;
  left:-150px;
  width:520px;
  height:520px;
  background:radial-gradient(circle, rgba(17,24,39,0.08) 0%, rgba(17,24,39,0.03) 36%, transparent 74%);
  animation:floatB 20s ease-in-out infinite;
}

.login-inner{
  width:100%;
  max-width:460px;
  position:relative;
  z-index:2;
  animation:slideUp 0.6s cubic-bezier(0.22,1,0.36,1) both;
}

.login-logo-wrap{
  text-align:center;
  margin-bottom:28px;
}

.login-logo-icon{
  position:relative;
  width:84px;
  height:84px;
  border-radius:50%;
  display:inline-flex;
  align-items:center;
  justify-content:center;
  margin-bottom:16px;

  background:linear-gradient(145deg, rgba(255,255,255,0.95), rgba(245,240,231,0.9));
  box-shadow:
    0 18px 40px rgba(17,24,39,0.10),
    inset 0 1px 0 rgba(255,255,255,0.9);

  backdrop-filter:blur(12px);
  -webkit-backdrop-filter:blur(12px);

  overflow:hidden;
  z-index:1;
}

/* 🌈 Animated gradient ring */
.login-logo-icon::before{
  content:'';
  position:absolute;
  inset:-3px; /* thickness of ring */
  border-radius:50%;
  background:conic-gradient(
    from 0deg,
    #d4a24c,
    #f3d27a,
    #b8893a,
    #f3d27a,
    #d4a24c
  );
  animation:spinRing 6s linear infinite;
  z-index:-2;
}

/* 💎 inner mask (creates border effect) */
.login-logo-icon::after{
  content:'';
  position:absolute;
  inset:3px;
  border-radius:50%;
  background:inherit;
  z-index:-1;
}

/* ✨ Glow effect */
.login-logo-icon{
  box-shadow:
    0 18px 40px rgba(17,24,39,0.12),
    0 0 20px rgba(212,162,76,0.25),
    0 0 40px rgba(212,162,76,0.18),
    inset 0 1px 0 rgba(255,255,255,0.9);
}

/* 🔁 Animation */
@keyframes spinRing{
  from{ transform:rotate(0deg); }
  to{ transform:rotate(360deg); }
}

.login-logo-icon span{
  font-size:2.2rem;
  filter:drop-shadow(0 2px 10px rgba(184,137,58,0.28));
}

.login-logo-icon{
  transition: transform 0.35s ease, box-shadow 0.35s ease;
}

.login-logo-icon:hover{
  transform:scale(1.08);
  box-shadow:
    0 25px 60px rgba(17,24,39,0.18),
    0 0 30px rgba(212,162,76,0.35),
    0 0 60px rgba(212,162,76,0.25);
}

.login-title{
  font-family:'Cinzel',serif;
  font-size:2.05rem;
  color:var(--text-dark);
  margin-bottom:6px;
  letter-spacing:0.03em;
  font-weight:700;
}

.login-sub{
  font-size:0.92rem;
  color:var(--text-mid);
}

.login-card{
  background:linear-gradient(180deg, rgba(255,255,255,0.88), rgba(255,255,255,0.76));
  border:1px solid var(--border);
  border-top:3px solid var(--accent);
  border-radius:30px;
  padding:38px 36px 32px;
  box-shadow:var(--shadow);
  backdrop-filter:blur(18px);
  -webkit-backdrop-filter:blur(18px);
  position:relative;
  overflow:hidden;
}

.login-card::before{
  content:'';
  position:absolute;
  inset:0;
  background:
    linear-gradient(180deg, rgba(255,255,255,0.24) 0%, transparent 22%),
    radial-gradient(circle at top right, rgba(184,137,58,0.08) 0, transparent 26%);
  pointer-events:none;
}

.login-card > *{
  position:relative;
  z-index:1;
}

.login-fields{
  display:flex;
  flex-direction:column;
  gap:18px;
}

.login-fields > *:nth-child(1){animation:slideUp 0.5s cubic-bezier(0.22,1,0.36,1) 0.14s both;}
.login-fields > *:nth-child(2){animation:slideUp 0.5s cubic-bezier(0.22,1,0.36,1) 0.20s both;}
.login-fields > *:nth-child(3){animation:slideUp 0.5s cubic-bezier(0.22,1,0.36,1) 0.26s both;}
.login-fields > *:nth-child(4){animation:slideUp 0.5s cubic-bezier(0.22,1,0.36,1) 0.32s both;}

.field-lbl{
  display:block;
  font-size:0.77rem;
  font-weight:700;
  color:var(--text-mid);
  letter-spacing:0.09em;
  text-transform:uppercase;
  margin-bottom:8px;
}

.field-wrap{
  position:relative;
}

.field-input{
  width:100%;
  box-sizing:border-box;
  padding:13px 44px 13px 42px;
  border:1.5px solid rgba(17,24,39,0.10);
  border-radius:16px;
  background:rgba(255,255,255,0.76);
  color:var(--text-dark);
  font-size:0.95rem;
  font-family:'DM Sans',sans-serif;
  outline:none;
  transition:all 0.22s ease;
  box-shadow:inset 0 1px 0 rgba(255,255,255,0.75);
}

.field-input::placeholder{
  color:#9aa3af;
}

.field-input:hover{
  border-color:rgba(184,137,58,0.28);
  background:rgba(255,255,255,0.86);
}

.field-input:focus{
  border-color:rgba(184,137,58,0.8);
  background:#fff;
  box-shadow:
    0 0 0 4px rgba(184,137,58,0.13),
    0 12px 28px rgba(17,24,39,0.06);
}

.field-input:disabled{
  opacity:0.55;
  cursor:not-allowed;
}

.field-icon-l{
  position:absolute;
  left:13px;
  top:50%;
  transform:translateY(-50%);
  width:18px;
  height:18px;
  color:rgba(107,114,128,0.92);
  pointer-events:none;
  transition:color 0.2s ease;
}

.field-wrap:focus-within .field-icon-l{
  color:var(--accent);
}

.field-icon-r{
  position:absolute;
  right:11px;
  top:50%;
  transform:translateY(-50%);
  background:rgba(255,255,255,0.75);
  border:1px solid rgba(17,24,39,0.08);
  padding:6px;
  cursor:pointer;
  color:var(--text-muted);
  display:flex;
  align-items:center;
  border-radius:12px;
  transition:all 0.18s ease;
  box-shadow:0 8px 18px rgba(17,24,39,0.05);
}

.field-icon-r:hover{
  color:var(--accent-2);
  background:#fff;
  transform:translateY(-50%) scale(1.03);
}

.forgot-link{
  font-size:0.84rem;
  font-weight:700;
  color:var(--accent-2);
  text-decoration:none;
  transition:all 0.18s ease;
}

.forgot-link:hover{
  color:var(--accent);
  text-decoration:underline;
  text-underline-offset:3px;
}

.btn-login{
  width:100%;
  padding:14px 24px;
  background:linear-gradient(135deg, var(--accent) 0%, var(--accent-2) 100%);
  color:#fff;
  font-family:'Cinzel',serif;
  font-size:0.96rem;
  font-weight:700;
  letter-spacing:0.08em;
  border:none;
  border-radius:16px;
  cursor:pointer;
  display:flex;
  align-items:center;
  justify-content:center;
  gap:8px;
  box-shadow:
    0 16px 30px rgba(143,100,36,0.26),
    inset 0 1px 0 rgba(255,255,255,0.22);
  transition:all 0.2s ease;
  position:relative;
  overflow:hidden;
  margin-top:2px;
}

.btn-login::before{
  content:'';
  position:absolute;
  inset:0;
  background:linear-gradient(120deg, rgba(255,255,255,0.18), transparent 36%, transparent 66%, rgba(255,255,255,0.12));
  transform:translateX(-100%);
  transition:transform 0.45s ease;
}

.btn-login:hover:not(:disabled){
  transform:translateY(-2px);
  box-shadow:
    0 20px 36px rgba(143,100,36,0.32),
    inset 0 1px 0 rgba(255,255,255,0.28);
}

.btn-login:hover:not(:disabled)::before{
  transform:translateX(100%);
}

.btn-login:active:not(:disabled){
  transform:translateY(0);
}

.btn-login:disabled{
  opacity:0.68;
  cursor:not-allowed;
  transform:none;
}

.btn-google{
  width:100%;
  padding:12px 24px;
  background:rgba(255,255,255,0.84);
  border:1.5px solid rgba(17,24,39,0.10);
  border-radius:16px;
  font-family:'DM Sans',sans-serif;
  font-size:0.95rem;
  font-weight:700;
  color:var(--text-mid);
  cursor:pointer;
  display:flex;
  align-items:center;
  justify-content:center;
  gap:10px;
  transition:all 0.2s ease;
  box-shadow:0 10px 24px rgba(17,24,39,0.06);
}

.login-logo-img{
  width:100%;
  height:100%;
  object-fit:cover;
  border-radius:50%;   /* match container */
}

.btn-google:hover:not(:disabled){
  border-color:rgba(184,137,58,0.34);
  background:#fff;
  box-shadow:0 14px 30px rgba(17,24,39,0.08);
  transform:translateY(-1px);
}

.btn-google:disabled{
  opacity:0.6;
  cursor:not-allowed;
}

.divider{
  display:flex;
  align-items:center;
  gap:14px;
  margin:22px 0;
}

.div-line{
  flex:1;
  height:1px;
  background:linear-gradient(to right, transparent, rgba(17,24,39,0.14), transparent);
}

.div-text{
  color:var(--text-muted);
  font-size:0.8rem;
  font-weight:600;
  white-space:nowrap;
  letter-spacing:0.04em;
}

.login-info{
  margin-top:18px;
  padding:13px 15px;
  background:rgba(184,137,58,0.08);
  border:1px solid rgba(184,137,58,0.18);
  border-radius:16px;
  display:flex;
  align-items:flex-start;
  gap:9px;
}

.login-info p{
  font-size:0.8rem;
  color:var(--text-mid);
  line-height:1.6;
}

.spinner,
.spinner-dark{
  width:16px;
  height:16px;
  border-radius:50%;
  display:inline-block;
  border:2px solid currentColor;
  border-right-color:transparent;
  animation:spin 0.8s linear infinite;
}

.spinner{ color:#fff; }
.spinner-dark{ color:var(--text-mid); }

@keyframes spin{
  to{transform:rotate(360deg);}
}

@keyframes floatA{
  0%,100%{transform:translate3d(0,0,0) scale(1);}
  50%{transform:translate3d(-22px,18px,0) scale(1.04);}
}

@keyframes floatB{
  0%,100%{transform:translate3d(0,0,0) scale(1);}
  50%{transform:translate3d(22px,-16px,0) scale(1.05);}
}

@keyframes slideUp{
  from{opacity:0;transform:translateY(16px);}
  to{opacity:1;transform:translateY(0);}
}

@keyframes popIn{
  from{opacity:0;transform:scale(0.88);}
  to{opacity:1;transform:scale(1);}
}

@media (max-width:480px){
  .login-card{
    padding:28px 20px 24px;
    border-radius:24px;
  }

  .login-title{
    font-size:1.7rem;
  }

  .login-logo-icon{
    width:74px;
    height:74px;
    border-radius:22px;
  }

  .field-input{
    padding:12px 42px 12px 40px;
  }
}

@media (prefers-reduced-motion: reduce){
  .login-inner,
  .login-orb1,
  .login-orb2,
  .login-fields > *,
  .login-logo-icon{
    animation:none !important;
  }

  .btn-login,
  .btn-google,
  .field-input,
  .field-icon-r{
    transition:none !important;
  }
}
`;

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPass] = useState("");
  const [showPw, setShow] = useState(false);
  const [loading, setLoad] = useState(false);
  const [googleLoad, setGL] = useState(false);

  const { loginWithCredentials, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const err = searchParams.get("error");
    if (err) toast.error(decodeURIComponent(err).replace(/_/g, " "));
  }, [searchParams]);

  useEffect(() => {
    if (user)
      navigate(
        user.role === "admin" ? "/admin/dashboard" : "/owner/dashboard",
        { replace: true }
      );
  }, [isAuthenticated, user, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Email is required.");
      return;
    }
    if (!password.trim()) {
      toast.error("Password is required.");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      toast.error("Enter a valid email address.");
      return;
    }
    setLoad(true);
    try {
      const u = await loginWithCredentials(email.trim(), password);
      toast.success(`Welcome back, ${u.name}! 🪷`);
      navigate(u.role === "admin" ? "/admin/dashboard" : "/owner/dashboard");
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Login failed. Please try again."
      );
    } finally {
      setLoad(false);
    }
  };

  const handleGoogle = () => {
    setGL(true);
    window.location.href = `${API_URL}/auth/google`;
  };

  return (
    <>
      <style>{css}</style>
      <div className="login-page">
        <div className="login-orb1" />
        <div className="login-orb2" />
        <div className="login-inner">
          {/* Logo */}
          <div className="login-logo-wrap">
            <div
              style={{
                animation:
                  "popIn 0.65s cubic-bezier(0.34,1.56,0.64,1) 0.1s both",
                display: "inline-block",
              }}
            >
              <div className="login-logo-icon">
                <img
                  src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTxJT4BKULUJSpcQpWK36BDiGSngwpHHIVWWw&s"
                  alt="Logo"
                  className="login-logo-img"
                />
              </div>
            </div>
            <h1 className="login-title">Sadhna Yana</h1>
            <p className="login-sub">Sign in to your workspace</p>
            <p className="login-mantra">✦ Hare Krishna ✦</p>
          </div>

          {/* Card */}
          <div className="login-card">
            <form onSubmit={handleLogin}>
              <div className="login-fields">
                {/* Email */}
                <div>
                  <label className="field-lbl">Email Address</label>
                  <div className="field-wrap">
                    <svg
                      className="field-icon-l"
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
                      placeholder="you@organization.com"
                      className="field-input"
                      autoComplete="email"
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="field-lbl">Password</label>
                  <div className="field-wrap">
                    <svg
                      className="field-icon-l"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                      />
                    </svg>
                    <input
                      type={showPw ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPass(e.target.value)}
                      placeholder="••••••••"
                      className="field-input"
                      autoComplete="current-password"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShow((p) => !p)}
                      className="field-icon-r"
                    >
                      <svg
                        width={18}
                        height={18}
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

                {/* Forgot */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    marginTop: "-6px",
                  }}
                >
                  <Link to="/forgot-password" className="forgot-link">
                    Forgot Password?
                  </Link>
                </div>

                {/* Submit */}
                <button type="submit" disabled={loading} className="btn-login">
                  {loading ? (
                    <>
                      <span className="spinner" /> Entering...
                    </>
                  ) : (
                    "Enter the Portal"
                  )}
                </button>
              </div>
            </form>

            <div className="divider">
              <div className="div-line" />
              <span className="div-text">or continue with</span>
              <div className="div-line" />
            </div>

            <button
              onClick={handleGoogle}
              disabled={googleLoad || loading}
              className="btn-google"
            >
              {googleLoad ? (
                <span className="spinner-dark" />
              ) : (
                <svg width={20} height={20} viewBox="0 0 24 24">
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
              )}
              Continue with Google
            </button>

            <div className="login-info">
              <span style={{ fontSize: "1rem", flexShrink: 0 }}>🔒</span>
              <p>
                Access is restricted to authorized devotees only. Contact your
                administrator to receive an invitation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
