import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const css = `
.callback-page {
  min-height: calc(100vh - 72px);
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(160deg, var(--cream) 0%, var(--cream-warm) 50%, var(--s-50) 100%);
  padding: 24px;
}
.callback-card {
  background: rgba(255,253,245,0.97);
  border: 1px solid rgba(200,150,60,0.25);
  border-top: 3px solid var(--g-500);
  border-radius: var(--r-2xl);
  padding: 48px 40px;
  text-align: center;
  max-width: 360px;
  width: 100%;
  box-shadow: 0 8px 48px rgba(61,23,0,0.12), 0 2px 8px rgba(61,23,0,0.06);
  animation: slideUp 0.4s cubic-bezier(0.22,1,0.36,1) both;
}
.callback-ring-wrap {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(232,101,10,0.1), rgba(200,150,60,0.1));
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
}
.callback-ring {
  width: 38px;
  height: 38px;
  border: 3px solid rgba(200,150,60,0.2);
  border-top-color: var(--s-500);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
.callback-title {
  font-family: 'Cinzel', serif;
  font-size: 1.2rem;
  color: var(--text-dark);
  margin-bottom: 8px;
  letter-spacing: 0.03em;
}
.callback-sub {
  font-size: 0.875rem;
  color: var(--text-muted);
  line-height: 1.6;
}
.callback-dots {
  display: flex;
  gap: 6px;
  justify-content: center;
  margin-top: 20px;
}
.callback-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--g-400);
  animation: pulse 1.4s ease-in-out infinite;
}
.callback-dot:nth-child(2) { animation-delay: 0.2s; }
.callback-dot:nth-child(3) { animation-delay: 0.4s; }
`;

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const { loginWithToken } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuth = async () => {
      const token = searchParams.get("token");
      const error = searchParams.get("error");

      // Backend sent an error
      if (error) {
        toast.error(decodeURIComponent(error).replace(/_/g, " "));
        navigate("/login", { replace: true });
        return;
      }

      // No token in URL
      if (!token) {
        toast.error("Authentication failed — no token received.");
        navigate("/login", { replace: true });
        return;
      }

      try {
        const user = await loginWithToken(token);
        toast.success(`Welcome, ${user.name}! 🪷`);
        navigate(
          user.role === "admin" ? "/admin/dashboard" : "/owner/dashboard",
          { replace: true }
        );
      } catch (err) {
        console.error("OAuth callback error:", err);
        toast.error(
          err.response?.data?.message || "Login failed. Please try again."
        );
        navigate("/login", { replace: true });
      }
    };

    handleAuth();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  // intentionally empty — must run once on mount only

  return (
    <>
      <style>{css}</style>
      <div className="callback-page">
        <div className="callback-card">
          <div className="callback-ring-wrap">
            <div className="callback-ring" />
          </div>
          <h2 className="callback-title">Signing You In</h2>
          <p className="callback-sub">
            Completing Google authentication.
            <br />
            Please wait a moment.
          </p>
          <div className="callback-dots">
            <div className="callback-dot" />
            <div className="callback-dot" />
            <div className="callback-dot" />
          </div>
        </div>
      </div>
    </>
  );
};

export default AuthCallback;
