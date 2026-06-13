import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const css = `
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');

.nf-page {
  min-height: 100vh;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  padding: 40px 24px;
  background: linear-gradient(160deg, #fdf8f0 0%, #f5ebe0 60%, #eddcc8 100%);
  position: relative; overflow: hidden;
  font-family: 'DM Sans', sans-serif;
}

/* Floating background orbs */
.nf-orb {
  position: absolute; border-radius: 50%; pointer-events: none;
  background: radial-gradient(circle, rgba(200,140,40,0.09) 0%, transparent 70%);
}
.nf-orb-1 { width: 600px; height: 600px; top: -180px; right: -180px; }
.nf-orb-2 { width: 420px; height: 420px; bottom: -100px; left: -100px; }
.nf-orb-3 { width: 280px; height: 280px; top: 40%; left: 30%; opacity: 0.6; }

/* Lotus animation */
.nf-lotus {
  font-size: 4rem;
  margin-bottom: 24px;
  display: block;
  animation: nfFloat 3.5s ease-in-out infinite;
  filter: drop-shadow(0 8px 20px rgba(200,100,0,0.2));
}
@keyframes nfFloat {
  0%,100% { transform: translateY(0) rotate(-3deg); }
  50%      { transform: translateY(-12px) rotate(3deg); }
}

/* The 404 number */
.nf-code {
  font-family: 'Cinzel', serif;
  font-size: clamp(5rem, 18vw, 9rem);
  font-weight: 700;
  line-height: 1;
  background: linear-gradient(135deg, #c8903c 0%, #7a3800 40%, #c8903c 80%, #f5c842 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 8px;
  letter-spacing: -0.02em;
  position: relative;
}
.nf-code::after {
  content: '';
  position: absolute; bottom: -6px; left: 50%; transform: translateX(-50%);
  width: 60%; height: 2px;
  background: linear-gradient(90deg, transparent, rgba(200,140,40,0.4), transparent);
}

/* Headings */
.nf-title {
  font-family: 'Cinzel', serif;
  font-size: clamp(1.2rem, 3vw, 1.7rem);
  font-weight: 700; color: #2d1200;
  margin: 20px 0 10px; text-align: center;
  letter-spacing: 0.02em;
}
.nf-sub {
  font-size: clamp(0.88rem, 2vw, 1rem);
  color: #8b6840; text-align: center;
  max-width: 400px; line-height: 1.75;
  font-weight: 300; margin-bottom: 36px;
}

/* Divider */
.nf-divider {
  display: flex; align-items: center; gap: 12px;
  color: rgba(200,140,40,0.45); font-size: 1rem;
  margin-bottom: 32px;
}
.nf-divider::before, .nf-divider::after {
  content: ''; flex: 1; max-width: 60px; height: 1px;
  background: linear-gradient(90deg, transparent, rgba(200,140,40,0.3), transparent);
}

/* Action buttons */
.nf-actions { display: flex; flex-wrap: wrap; gap: 12px; justify-content: center; }

.nf-btn-primary {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 12px 26px;
  background: linear-gradient(135deg, #7a3200, #b85000);
  color: #fff; border: none; border-radius: 40px;
  font-family: 'Cinzel', serif; font-size: 0.84rem; font-weight: 700;
  letter-spacing: 0.05em; text-decoration: none; cursor: pointer;
  box-shadow: 0 4px 18px rgba(120,50,0,0.28);
  transition: all 0.2s;
}
.nf-btn-primary:hover {
  background: linear-gradient(135deg, #8d3a00, #d06000);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(120,50,0,0.32);
}

.nf-btn-secondary {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 12px 26px;
  background: rgba(255,255,255,0.7); backdrop-filter: blur(4px);
  color: #6b4520; border: 1.5px solid rgba(200,140,40,0.3);
  border-radius: 40px;
  font-family: 'Cinzel', serif; font-size: 0.84rem; font-weight: 700;
  letter-spacing: 0.05em; text-decoration: none; cursor: pointer;
  transition: all 0.2s;
}
.nf-btn-secondary:hover {
  background: rgba(255,255,255,0.95);
  border-color: rgba(200,140,40,0.55);
  transform: translateY(-2px);
  color: #3d1800;
}

/* Path display */
.nf-path {
  margin-top: 32px;
  font-size: 0.74rem; color: rgba(140,100,40,0.55);
  background: rgba(200,140,40,0.06);
  border: 1px solid rgba(200,140,40,0.12);
  padding: 6px 16px; border-radius: 20px;
  font-family: 'DM Mono', monospace;
  letter-spacing: 0.04em;
}

/* Sanskrit */
.nf-mantra {
  position: absolute; bottom: 24px;
  font-family: 'Noto Serif Devanagari', serif;
  font-size: 0.85rem; color: rgba(140,80,0,0.35);
  letter-spacing: 0.08em; text-align: center;
  pointer-events: none;
}
`;

export default function NotFoundPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();

  const homePath = isAuthenticated
    ? user?.role === "admin"
      ? "/admin/dashboard"
      : "/owner/dashboard"
    : "/";

  const homeLabel = isAuthenticated ? "Go to Dashboard" : "Go to Home";

  return (
    <>
      <style>{css}</style>
      <div className="nf-page">
        {/* Background orbs */}
        <div className="nf-orb nf-orb-1" />
        <div className="nf-orb nf-orb-2" />
        <div className="nf-orb nf-orb-3" />

        {/* Floating lotus */}
        <span className="nf-lotus">🪷</span>

        {/* 404 */}
        <div className="nf-code">404</div>

        <h1 className="nf-title">Page Not Found</h1>

        <p className="nf-sub">
          The path you sought does not exist in this portal. Perhaps it was
          moved, or never was.
        </p>

        <div className="nf-divider">✦</div>

        <div className="nf-actions">
          <button className="nf-btn-primary" onClick={() => navigate(homePath)}>
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
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            {homeLabel}
          </button>

          <button className="nf-btn-secondary" onClick={() => navigate(-1)}>
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
                d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
              />
            </svg>
            Go Back
          </button>
        </div>

        {/* Show the bad path */}
        <div className="nf-path">{location.pathname}</div>

        <p className="nf-mantra">Hare Krishna Hare Krishna Krishna Krishna | Hare Hare Hare Rama Hare Rama Rama Rama Hare Hare</p>
      </div>
    </>
  );
}
