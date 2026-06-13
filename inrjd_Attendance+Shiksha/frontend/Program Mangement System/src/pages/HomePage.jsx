import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import image1 from "../assets/1.jpeg";
import image2 from "../assets/2.jpeg";
import image3 from "../assets/3.jpeg";
import image4 from "../assets/4.jpeg";
import image5 from "../assets/5.jpeg";

// ─────────────────────────────────────────────────────────────────────
const SLIDESHOW_IMAGES = [
  { src: image1 },
  { src: image2 },
  { src: image3 },
  { src: image4 },
];

const SHRINE_IMAGE = { src: image5, alt: "Krishna" };
const ORG_WEBSITE = "https://www.iskconnrjd.com/";

const MAHAMANTRA =
  "✦  Hare Krishna  Hare Krishna  Krishna Krishna  Hare Hare  ✦  Hare Rama  Hare Rama  Rama Rama  Hare Hare ✦  ";
const MANTRA_TRACK = MAHAMANTRA.repeat(2);

// ── Petal system ────────────────────────────────────────────────────
const PC = [
  "#e8976a",
  "#f5c050",
  "#f0c890",
  "#c8853a",
  "#d4a870",
  "#f7e8d0",
  "#e8b070",
  "#fce8c0",
];
const PETALS = [
  {
    l: "3%",
    sz: 13,
    dur: "9.2s",
    dl: "0s",
    sw: "55px",
    rt: "310deg",
    ci: 0,
    t: 0,
  },
  {
    l: "8%",
    sz: 9,
    dur: "7.8s",
    dl: "1.8s",
    sw: "-35px",
    rt: "280deg",
    ci: 1,
    t: 1,
  },
  {
    l: "16%",
    sz: 11,
    dur: "10.5s",
    dl: "0.6s",
    sw: "70px",
    rt: "400deg",
    ci: 5,
    t: 2,
  },
  {
    l: "24%",
    sz: 9,
    dur: "8.4s",
    dl: "3.1s",
    sw: "-50px",
    rt: "340deg",
    ci: 3,
    t: 0,
  },
  {
    l: "31%",
    sz: 12,
    dur: "11.2s",
    dl: "1.4s",
    sw: "40px",
    rt: "290deg",
    ci: 4,
    t: 1,
  },
  {
    l: "38%",
    sz: 8,
    dur: "7.1s",
    dl: "4.5s",
    sw: "-60px",
    rt: "360deg",
    ci: 0,
    t: 2,
  },
  {
    l: "46%",
    sz: 10,
    dur: "9.8s",
    dl: "2.3s",
    sw: "65px",
    rt: "420deg",
    ci: 6,
    t: 0,
  },
  {
    l: "54%",
    sz: 13,
    dur: "8.7s",
    dl: "0.9s",
    sw: "-45px",
    rt: "300deg",
    ci: 2,
    t: 1,
  },
  {
    l: "62%",
    sz: 9,
    dur: "10.1s",
    dl: "3.8s",
    sw: "50px",
    rt: "350deg",
    ci: 7,
    t: 2,
  },
  {
    l: "69%",
    sz: 8,
    dur: "7.6s",
    dl: "1.2s",
    sw: "-70px",
    rt: "380deg",
    ci: 3,
    t: 0,
  },
  {
    l: "76%",
    sz: 11,
    dur: "11.5s",
    dl: "4.9s",
    sw: "35px",
    rt: "260deg",
    ci: 1,
    t: 1,
  },
  {
    l: "84%",
    sz: 8,
    dur: "8.3s",
    dl: "2.7s",
    sw: "-55px",
    rt: "320deg",
    ci: 5,
    t: 2,
  },
  {
    l: "91%",
    sz: 12,
    dur: "9.6s",
    dl: "0.3s",
    sw: "45px",
    rt: "410deg",
    ci: 6,
    t: 0,
  },
  {
    l: "97%",
    sz: 9,
    dur: "7.4s",
    dl: "5.1s",
    sw: "-40px",
    rt: "270deg",
    ci: 2,
    t: 1,
  },
  {
    l: "12%",
    sz: 10,
    dur: "10.8s",
    dl: "6.2s",
    sw: "60px",
    rt: "330deg",
    ci: 7,
    t: 2,
  },
  {
    l: "28%",
    sz: 8,
    dur: "8.9s",
    dl: "7.4s",
    sw: "-65px",
    rt: "390deg",
    ci: 0,
    t: 0,
  },
  {
    l: "57%",
    sz: 13,
    dur: "9.3s",
    dl: "3.5s",
    sw: "75px",
    rt: "280deg",
    ci: 4,
    t: 1,
  },
  {
    l: "73%",
    sz: 7,
    dur: "11.8s",
    dl: "8.1s",
    sw: "-30px",
    rt: "450deg",
    ci: 1,
    t: 2,
  },
  {
    l: "88%",
    sz: 11,
    dur: "7.9s",
    dl: "1.6s",
    sw: "55px",
    rt: "340deg",
    ci: 3,
    t: 0,
  },
  {
    l: "43%",
    sz: 9,
    dur: "10.4s",
    dl: "9.3s",
    sw: "-48px",
    rt: "370deg",
    ci: 6,
    t: 1,
  },
];

function PetalSVG({ type, color, size }) {
  if (type === 0)
    return (
      <svg
        width={size}
        height={Math.round(size * 1.5)}
        viewBox="0 0 14 20"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M7,0 C11,4 13,10 10,16 C9,19 5,19 4,16 C1,10 3,4 7,0Z"
          fill={color}
          opacity="0.87"
        />
        <path
          d="M7,2 C8.5,7 9,12 7.5,17"
          stroke="rgba(255,255,255,0.25)"
          strokeWidth="0.7"
          fill="none"
        />
      </svg>
    );
  if (type === 1)
    return (
      <svg
        width={Math.round(size * 0.65)}
        height={Math.round(size * 1.7)}
        viewBox="0 0 10 26"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M5,0 C8,4 9,14 6,22 C5.5,24.5 5,25 5,25 C5,25 4.5,24.5 4,22 C1,14 2,4 5,0Z"
          fill={color}
          opacity="0.83"
        />
        <path
          d="M5,2 L5,23"
          stroke="rgba(255,255,255,0.2)"
          strokeWidth="0.6"
          fill="none"
        />
      </svg>
    );
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 14 14"
      xmlns="http://www.w3.org/2000/svg"
    >
      <ellipse cx="7" cy="7.5" rx="5.5" ry="6" fill={color} opacity="0.88" />
    </svg>
  );
}

// ── Shrine ornament components ──────────────────────────────────────
function Lotus({ cx, cy, r1 = 12, r2 = 8 }) {
  return (
    <g>
      {Array.from({ length: 8 }, (_, j) => (
        <ellipse
          key={j}
          cx={cx}
          cy={cy - r1}
          rx="4.5"
          ry={r1}
          fill={j % 2 === 0 ? "#f0c8a0" : "#e8976a"}
          transform={`rotate(${j * 45} ${cx} ${cy})`}
          opacity="0.88"
        />
      ))}
      {Array.from({ length: 6 }, (_, j) => (
        <ellipse
          key={j}
          cx={cx}
          cy={cy - r2}
          rx="3"
          ry={r2}
          fill="#f7e8c8"
          transform={`rotate(${j * 60 + 30} ${cx} ${cy})`}
          opacity="0.92"
        />
      ))}
      <circle cx={cx} cy={cy} r="7" fill="#c8853a" />
      <circle cx={cx} cy={cy} r="4.5" fill="#f5d070" />
    </g>
  );
}

// ── Counting animation hook ─────────────────────────────────────────
function useCountUp(target, duration = 2000, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime = null;
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(ease * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return count;
}

// ── Intersection observer hook ──────────────────────────────────────
function useInView(threshold = 0.2) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setInView(true);
      },
      { threshold }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView];
}

// ── Stat card with count-up ─────────────────────────────────────────
function StatCard({
  value,
  label,
  suffix = "",
  icon,
  color,
  delay = 0,
  inView,
}) {
  const count = useCountUp(value, 1800, inView);
  return (
    <div className="stat-card" style={{ "--sc": color, "--del": `${delay}ms` }}>
      <div className="stat-card-glow" />
      <div className="stat-icon">{icon}</div>
      <div className="stat-value">
        {count}
        {suffix}
      </div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

// ── CSS ─────────────────────────────────────────────────────────────
const css = `
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Cinzel+Decorative:wght@400;700&family=Crimson+Pro:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=Noto+Serif+Devanagari:wght@400;500;600&display=swap');

:root {
  --g:         #c8853a;
  --gl:        #e8b96a;
  --gp:        #f7e8c8;
  --amb:       #7a3800;
  --ambd:      #3d1600;
  --cr:        #fdf8f0;
  --tx:        #2a1200;
  --txb:       #5a3618;
}

*,*::before,*::after { box-sizing:border-box; margin:0; padding:0; }

/* ════ BASE ════════════════════════════════════════════════════════ */
.home {
  min-height:100vh; background:var(--cr);
  overflow-x:hidden; font-family:'Crimson Pro',Georgia,serif;
}

/* ════ PETALS ══════════════════════════════════════════════════════ */
.petal-field { position:fixed; inset:0; pointer-events:none; z-index:9990; overflow:hidden; }
.petal {
  position:absolute; top:-80px; left:var(--px,50%); opacity:0; will-change:transform,opacity;
  animation:petalFall var(--pd,9s) ease-in var(--pdl,0s) infinite;
}
@keyframes petalFall {
  0%   { opacity:0; transform:translateY(0) translateX(0) rotate(0deg); }
  6%   { opacity:0.88; }
  88%  { opacity:0.65; }
  100% { opacity:0; transform:translateY(110vh) translateX(var(--psw,50px)) rotate(var(--prt,360deg)); }
}

/* ════ HERO SLIDESHOW ══════════════════════════════════════════════ */
.slide-section {
  position:relative; height:100vh; overflow:hidden; background:#0f0400;
}
.slide-section::before {
  content:''; position:absolute; top:0; left:0; right:0; height:3px; z-index:12;
  background:linear-gradient(90deg, transparent, var(--g) 15%, var(--gl) 50%, var(--g) 85%, transparent);
}
.slide-track { display:flex; height:100%; transition:transform 1.1s cubic-bezier(0.42,0,0.18,1); }
.slide { min-width:100%; height:100%; flex-shrink:0; position:relative; overflow:hidden; }
.slide img {
  width:100%; height:100%; object-fit:cover; object-position:center;
  filter:brightness(0.72) saturate(1.15);
  transform:scale(1.04); transition:transform 8s ease-out;
}
.slide.active img { transform:scale(1); }
.slide-overlay {
  position:absolute; inset:0;
  background:
    linear-gradient(180deg, rgba(8,2,0,0.35) 0%, transparent 25%, transparent 50%, rgba(8,2,0,0.82) 100%),
    radial-gradient(ellipse 80% 70% at 50% 50%, transparent 50%, rgba(4,1,0,0.3) 100%);
}

/* Hero centre content */
.hero-centre {
  position:absolute; inset:0; display:flex; align-items:center; justify-content:center;
  flex-direction:column; z-index:6; pointer-events:none;
  animation:heroCentreIn 1.2s cubic-bezier(0.22,1,0.36,1) both;
}
@keyframes heroCentreIn { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:none} }

.hero-emblem-svg {
  margin-bottom:22px;
  filter:drop-shadow(0 0 28px rgba(245,200,80,0.65));
  animation:emblemPulse 3.5s ease-in-out infinite;
}
@keyframes emblemPulse {
  0%,100%{ filter:drop-shadow(0 0 18px rgba(245,200,80,0.45)); transform:scale(1) rotate(0deg); }
  50%    { filter:drop-shadow(0 0 52px rgba(255,220,90,1)); transform:scale(1.08) rotate(1deg); }
}

.hero-om {
  font-family:'Noto Serif Devanagari',serif; font-size:clamp(2.5rem,6vw,5rem);
  color:rgba(245,210,140,0.92); letter-spacing:0.05em;
  text-shadow:0 0 60px rgba(245,190,60,0.7), 0 4px 16px rgba(0,0,0,0.6);
  line-height:1; margin-bottom:8px;
  animation:omGlow 4s ease-in-out infinite;
}
@keyframes omGlow {
  0%,100%{ text-shadow:0 0 40px rgba(245,190,60,0.5), 0 4px 16px rgba(0,0,0,0.6); }
  50%    { text-shadow:0 0 90px rgba(255,210,60,0.95), 0 0 140px rgba(255,180,40,0.4), 0 4px 16px rgba(0,0,0,0.6); }
}

.hero-title {
  font-family:'Cinzel',serif; font-size:clamp(2.2rem,5.5vw,4.2rem); font-weight:700;
  color:#fff; letter-spacing:0.18em; line-height:1.1; text-align:center;
  text-shadow:0 3px 12px rgba(0,0,0,0.6), 0 0 60px rgba(200,140,50,0.35);
  margin-bottom:12px;
}

.hero-subtitle {
  font-family:'Cinzel Decorative',serif; font-size:clamp(0.62rem,1.4vw,0.88rem);
  color:rgba(240,210,150,0.78); letter-spacing:0.32em; text-transform:uppercase;
  text-align:center; margin-bottom:32px;
}

.hero-cta-row { display:flex; gap:14px; align-items:center; pointer-events:all; }
.hero-cta-primary {
  padding:14px 36px; border-radius:40px;
  background:linear-gradient(135deg, rgba(200,133,58,0.22), rgba(200,133,58,0.12));
  border:1.5px solid rgba(200,150,70,0.55); color:rgba(255,235,175,0.97);
  font-family:'Cinzel',serif; font-size:0.8rem; font-weight:700; letter-spacing:0.1em;
  text-decoration:none; backdrop-filter:blur(12px);
  transition:all 0.25s; cursor:pointer;
}
.hero-cta-primary:hover {
  background:linear-gradient(135deg, rgba(200,133,58,0.4), rgba(200,133,58,0.25));
  border-color:rgba(220,175,80,0.85); transform:translateY(-3px);
  box-shadow:0 12px 40px rgba(180,100,20,0.35);
}
.hero-cta-secondary {
  padding:14px 36px; border-radius:40px;
  background:rgba(255,255,255,0.06);
  border:1px solid rgba(255,255,255,0.2); color:rgba(255,255,255,0.82);
  font-family:'Cinzel',serif; font-size:0.78rem; letter-spacing:0.1em;
  text-decoration:none; backdrop-filter:blur(8px); transition:all 0.22s;
}
.hero-cta-secondary:hover { background:rgba(255,255,255,0.12); transform:translateY(-3px); }

/* Slide garland bar */
.slide-garland-bar {
  position:absolute; bottom:0; left:0; right:0; height:64px; z-index:5; pointer-events:none;
}
/* Dots */
.slide-dots { position:absolute; bottom:88px; left:50%; transform:translateX(-50%); display:flex; gap:10px; z-index:8; }
.slide-dot {
  width:6px; height:6px; border-radius:50%; border:1.5px solid rgba(220,185,100,0.5);
  cursor:pointer; background:transparent; transition:all 0.3s cubic-bezier(0.34,1.56,0.64,1);
}
.slide-dot.active { background:rgba(220,185,100,0.9); border-color:rgba(220,185,100,0.9); transform:scale(1.7); box-shadow:0 0 10px rgba(220,185,100,0.6); }
/* Arrows */
.slide-arrow {
  position:absolute; top:50%; transform:translateY(-50%);
  width:48px; height:48px; border-radius:50%;
  background:rgba(10,3,0,0.3); backdrop-filter:blur(10px);
  border:1px solid rgba(200,150,60,0.35); color:rgba(255,220,140,0.9);
  cursor:pointer; display:flex; align-items:center; justify-content:center;
  z-index:8; transition:all 0.2s;
}
.slide-arrow:hover { background:rgba(110,50,0,0.5); border-color:rgba(200,150,60,0.7); transform:translateY(-50%) scale(1.1); }
.slide-arrow-left { left:24px; }
.slide-arrow-right { right:24px; }

/* ════ MANTRA TICKER ════════════════════════════════════════════════ */
.mantra-ticker {
  background:linear-gradient(135deg, #1a0700 0%, #3d1400 50%, #1a0700 100%);
  border-top:1px solid rgba(200,140,55,0.25);
  border-bottom:1px solid rgba(200,140,55,0.25);
  padding:13px 0; overflow:hidden; position:relative; z-index:10;
}
.mantra-ticker::before,.mantra-ticker::after {
  content:''; position:absolute; top:0; bottom:0; width:100px; z-index:2; pointer-events:none;
}
.mantra-ticker::before { left:0; background:linear-gradient(90deg, #1a0700, transparent); }
.mantra-ticker::after  { right:0; background:linear-gradient(270deg, #1a0700, transparent); }
.mantra-ticker-track {
  display:flex; white-space:nowrap;
  animation:tickerScroll 28s linear infinite;
}
@keyframes tickerScroll { from{transform:translateX(0)} to{transform:translateX(-50%)} }
.mantra-ticker-text {
  font-family:'Noto Serif Devanagari',serif; font-size:0.82rem; font-weight:500;
  color:rgba(210,165,80,0.88); letter-spacing:0.22em; padding-right:60px;
}
.mantra-ticker-lotus { color:rgba(200,133,58,0.6); margin:0 8px; }

/* ════ STATS SECTION ════════════════════════════════════════════════ */
.stats-section {
  background:linear-gradient(135deg, #0f0400 0%, #2d1000 40%, #4a1c00 70%, #2d1000 100%);
  padding:64px 24px; position:relative; overflow:hidden;
}
.stats-section::before {
  content:''; position:absolute; inset:0;
  background:radial-gradient(ellipse 60% 80% at 50% 50%, rgba(200,133,58,0.07) 0%, transparent 70%);
  pointer-events:none;
}
.stats-section-hd { text-align:center; margin-bottom:52px; position:relative; z-index:1; }
.stats-eyebrow {
  font-family:'Cinzel Decorative',serif; font-size:0.58rem; color:rgba(200,133,58,0.75);
  letter-spacing:0.36em; text-transform:uppercase; margin-bottom:12px;
  display:flex; align-items:center; justify-content:center; gap:14px;
}
.stats-eyebrow::before,.stats-eyebrow::after {
  content:''; width:40px; height:1px; background:rgba(200,133,58,0.35);
}
.stats-title {
  font-family:'Cinzel',serif; font-size:clamp(1.5rem,3vw,2.2rem); font-weight:700;
  color:rgba(255,245,215,0.97); letter-spacing:0.08em;
}
.stats-grid {
  display:grid; grid-template-columns:repeat(4,1fr); gap:20px;
  max-width:1000px; margin:0 auto; position:relative; z-index:1;
}
@media(max-width:860px){ .stats-grid{grid-template-columns:repeat(2,1fr);} }
@media(max-width:480px){ .stats-grid{grid-template-columns:1fr 1fr;gap:12px;} }

.stat-card {
  position:relative; padding:32px 20px; border-radius:18px; text-align:center; overflow:hidden;
  background:rgba(255,255,255,0.04);
  border:1px solid rgba(200,140,55,0.18);
  backdrop-filter:blur(8px);
  animation:statIn 0.7s cubic-bezier(0.22,1,0.36,1) var(--del,0ms) both;
  transition:all 0.25s;
}
.stat-card:hover { transform:translateY(-6px); border-color:rgba(200,140,55,0.45); background:rgba(255,255,255,0.07); }
@keyframes statIn { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
.stat-card-glow {
  position:absolute; inset:0; border-radius:18px; pointer-events:none;
  background:radial-gradient(circle at 50% 0%, rgba(200,140,55,0.12) 0%, transparent 60%);
}
.stat-icon { font-size:1.8rem; margin-bottom:12px; opacity:0.9; }
.stat-value {
  font-family:'Cinzel',serif; font-size:clamp(2rem,4vw,3rem); font-weight:700;
  color:var(--sc,#f5c842); line-height:1; margin-bottom:8px;
  text-shadow:0 0 30px color-mix(in srgb, var(--sc,#f5c842) 40%, transparent);
}
.stat-label { font-size:0.72rem; font-weight:600; color:rgba(255,210,150,0.55); letter-spacing:0.14em; text-transform:uppercase; }

/* ════ FLORAL DIVIDER ══════════════════════════════════════════════ */
.home-divider {
  display:flex; align-items:center; justify-content:center; gap:20px; padding:44px 24px 28px;
}
.home-divider::before,.home-divider::after {
  content:''; flex:1; max-width:200px; height:1px;
  background:linear-gradient(90deg, transparent, rgba(180,120,40,0.35), transparent);
}
.home-divider-lotus {
  filter:drop-shadow(0 0 10px rgba(200,140,40,0.5));
  animation:lotusPulse 3.5s ease-in-out infinite alternate; overflow:visible;
}
@keyframes lotusPulse {
  from{filter:drop-shadow(0 0 6px rgba(200,140,40,0.3));transform:scale(1);}
  to  {filter:drop-shadow(0 0 24px rgba(220,160,50,0.85));transform:scale(1.08);}
}

/* ════ ABOUT SECTION ════════════════════════════════════════════════ */
.about-section { padding:0 0 80px; background:var(--cr); position:relative; overflow:hidden; }
.about-section::before {
  content:''; position:absolute; top:-200px; right:-200px; width:600px; height:600px;
  border-radius:50%;
  background:radial-gradient(circle, rgba(200,133,58,0.05) 0%, transparent 70%);
  pointer-events:none;
}

.about-inner { max-width:1160px; margin:0 auto; padding:0 44px; }
@media(max-width:860px){ .about-inner{padding:0 24px;} }

.about-grid {
  display:grid; grid-template-columns:1fr 440px; gap:88px; align-items:center;
  padding:16px 0 60px; position:relative;
}
@media(max-width:1000px){ .about-grid{grid-template-columns:1fr 380px;gap:56px;} }
@media(max-width:860px)  { .about-grid{grid-template-columns:1fr;gap:52px;} .about-shrine-col{order:-1;} }

/* Corner clusters */
.about-corner { position:absolute; pointer-events:none; opacity:0.62; }
.about-corner-tr { top:-24px; right:-28px; }
.about-corner-bl { bottom:-24px; left:-28px; transform:scale(-1); }

.about-text-col { position:relative; padding-left:30px; }

/* Left vine */
.about-vine { position:absolute; left:0; top:0; bottom:0; width:22px; pointer-events:none; }

/* Eye-brow */
.home-eyebrow {
  display:inline-flex; align-items:center; gap:10px; margin-bottom:14px;
  font-family:'Cinzel Decorative',serif; font-size:0.56rem; font-weight:400;
  color:var(--g); letter-spacing:0.34em; text-transform:uppercase;
}
.home-eyebrow::before,.home-eyebrow::after {
  content:''; display:inline-block; width:24px; height:1px; background:var(--g); opacity:0.44;
}

.home-title {
  font-family:'Cinzel',serif; font-size:clamp(1.7rem,3vw,2.7rem);
  font-weight:700; color:var(--tx); margin-bottom:6px; line-height:1.2;
}

/* SVG underline */
.title-underline { display:block; margin-bottom:28px; overflow:visible; }

.home-lead {
  font-size:clamp(1.02rem,1.6vw,1.18rem); color:var(--txb);
  line-height:1.9; margin-bottom:18px; font-style:italic; font-weight:300;
}
.home-body { font-size:clamp(0.94rem,1.3vw,1.04rem); color:var(--txb); line-height:1.95; margin-bottom:16px; font-weight:300; }

/* Flower strip */
.about-flower-strip { display:flex; align-items:center; gap:12px; margin:2px 0 22px; opacity:0.7; }
.about-flower-strip-line { flex:1; height:1px; background:linear-gradient(90deg, rgba(200,133,58,0.3), transparent); }

/* Sanskrit block */
.mantra-block {
  position:relative; margin:6px 0 24px; padding:20px 26px 20px 30px;
  background:linear-gradient(135deg, rgba(252,244,228,0.96), rgba(249,238,215,0.9));
  border-radius:0 14px 14px 0; overflow:hidden;
}
.mantra-block::before {
  content:''; position:absolute; left:0; top:0; bottom:0; width:4px;
  background:linear-gradient(180deg, transparent, var(--g) 25%, var(--gl) 50%, var(--g) 75%, transparent);
}
.mantra-block-dev {
  font-family:'Noto Serif Devanagari',serif; font-size:clamp(1rem,1.7vw,1.25rem);
  color:var(--amb); font-weight:500; letter-spacing:0.03em; line-height:1.65; margin-bottom:7px;
}
.mantra-block-tr {
  font-family:'Crimson Pro',serif; font-size:0.82rem; font-style:italic;
  color:rgba(90,54,24,0.65); letter-spacing:0.03em;
}
.mantra-block-lotus { position:absolute; right:16px; top:50%; transform:translateY(-50%); opacity:0.1; pointer-events:none; }

/* Disclaimer */
.home-disclaimer {
  margin:10px 0 28px; border:1px solid rgba(200,140,40,0.2);
  border-left:4px solid var(--g); border-radius:0 12px 12px 0;
  background:linear-gradient(135deg, rgba(252,244,228,0.95), rgba(249,238,215,0.9));
  padding:18px 22px;
}
.home-disclaimer-lbl {
  font-family:'Cinzel',serif; font-size:0.62rem; font-weight:700;
  letter-spacing:0.22em; text-transform:uppercase; color:var(--g);
  margin-bottom:8px; display:flex; align-items:center; gap:8px;
}
.home-disclaimer p { font-size:0.88rem; color:#6b4010; line-height:1.78; font-weight:300; }

/* Visit btn */
.home-visit-btn {
  display:inline-flex; align-items:center; gap:10px; padding:13px 32px;
  background:linear-gradient(135deg, #7a3700, #b85800);
  color:#fff; border:none; border-radius:8px;
  font-family:'Cinzel',serif; font-size:0.78rem; font-weight:700; letter-spacing:0.08em;
  text-decoration:none;
  box-shadow:0 4px 24px rgba(120,54,0,0.3), inset 0 1px 0 rgba(255,200,120,0.2);
  transition:all 0.22s;
}
.home-visit-btn:hover { background:linear-gradient(135deg,#8d4000,#d06a00); transform:translateY(-2px); box-shadow:0 8px 32px rgba(120,54,0,0.42); }

/* ════ SHRINE ══════════════════════════════════════════════════════ */
.about-shrine-col { display:flex; align-items:center; justify-content:center; }
.shrine-universe { position:relative; width:440px; height:440px; display:flex; align-items:center; justify-content:center; }
@media(max-width:1000px){ .shrine-universe{width:360px;height:360px;} }
@media(max-width:500px)  { .shrine-universe{width:300px;height:300px;} }

.shrine-aura {
  position:absolute; inset:-40px; border-radius:50%; pointer-events:none;
  background:radial-gradient(ellipse at 50% 50%, rgba(255,210,80,0.2) 0%, rgba(200,133,58,0.08) 40%, transparent 68%);
  animation:auraBreath 4.5s ease-in-out infinite alternate;
}
@keyframes auraBreath { from{transform:scale(0.92);opacity:0.6;} to{transform:scale(1.08);opacity:1;} }

.shrine-mantra-svg { position:absolute; inset:0; width:100%; height:100%; animation:mantraRotate 38s linear infinite; pointer-events:none; z-index:6; }
@keyframes mantraRotate { to{transform:rotate(360deg);} }
.mantra-text-path { font-family:'Noto Serif Devanagari',serif; font-size:13.5px; fill:rgba(160,90,10,0.82); letter-spacing:1.5px; }

.shrine-orbit-svg { position:absolute; inset:0; width:100%; height:100%; pointer-events:none; z-index:4; animation:orbitSpin 22s linear infinite; }
@keyframes orbitSpin { to{transform:rotate(360deg);} }

.shrine-spin-ring {
  position:absolute; inset:62px; border-radius:50%; padding:3px;
  background:conic-gradient(
    rgba(220,170,60,0.9) 0deg, rgba(255,225,110,1) 45deg,
    rgba(200,140,45,0.5) 90deg, rgba(255,220,100,0.9) 135deg,
    rgba(200,140,45,0.4) 180deg, rgba(255,225,110,1) 225deg,
    rgba(200,140,45,0.6) 270deg, rgba(255,220,100,0.9) 315deg,
    rgba(220,170,60,0.9) 360deg);
  animation:spinRing 10s linear infinite; z-index:4;
}
@keyframes spinRing { to{transform:rotate(360deg);} }
.shrine-spin-ring::after { content:''; position:absolute; inset:3px; border-radius:50%; background:var(--cr); }

.shrine-circle {
  position:absolute; inset:72px; border-radius:50%; overflow:hidden; z-index:5;
  animation:divineFloat 5.5s ease-in-out infinite;
  box-shadow:0 0 0 2px rgba(255,220,120,0.55), 0 14px 56px rgba(80,35,0,0.45), 0 4px 20px rgba(180,110,20,0.3), inset 0 0 36px rgba(200,140,50,0.08);
}
@keyframes divineFloat { 0%,100%{transform:translateY(0) scale(1);} 40%{transform:translateY(-10px) scale(1.012);} 70%{transform:translateY(-4px) scale(1.006);} }
.shrine-image { width:100%; height:100%; object-fit:cover; object-position:center top; filter:saturate(1.1) contrast(1.04) brightness(1.04); }
.shrine-image-vignette { position:absolute; inset:0; border-radius:50%; background:radial-gradient(circle, transparent 55%, rgba(30,10,0,0.28) 100%); pointer-events:none; z-index:1; }

.shrine-particle { position:absolute; border-radius:50%; background:radial-gradient(circle, rgba(255,215,100,0.8), transparent 70%); animation:floatParticle var(--dur,4s) ease-in-out infinite; animation-delay:var(--delay,0s); pointer-events:none; z-index:7; }
@keyframes floatParticle { 0%,100%{transform:translateY(0) scale(1);opacity:0.3;} 50%{transform:translateY(-18px) scale(1.5);opacity:0.85;} }

.shrine-nameplate {
  position:absolute; bottom:-4px; left:50%; transform:translateX(-50%);
  background:linear-gradient(135deg,#2d1100,#6b3200,#9d4800);
  border:1px solid rgba(210,160,65,0.55); color:rgba(255,225,155,0.97);
  font-family:'Cinzel',serif; font-size:0.6rem; font-weight:700; letter-spacing:0.26em; text-transform:uppercase;
  padding:7px 22px; border-radius:30px; white-space:nowrap;
  box-shadow:0 4px 20px rgba(40,15,0,0.4), inset 0 1px 0 rgba(255,200,100,0.15);
  z-index:8; display:flex; align-items:center; gap:8px;
}

/* ════ PROGRAMMES SECTION ══════════════════════════════════════════ */
.programmes-section {
  background:linear-gradient(180deg, #fdf8f0 0%, #f5ebe0 100%);
  padding:80px 24px; position:relative; overflow:hidden;
}
.programmes-section::before {
  content:''; position:absolute; bottom:0; left:0; right:0; height:2px;
  background:linear-gradient(90deg, transparent, rgba(200,133,58,0.3) 50%, transparent);
}
.programmes-inner { max-width:1160px; margin:0 auto; }
.section-hd { text-align:center; margin-bottom:56px; }
.section-eyebrow {
  font-family:'Cinzel Decorative',serif; font-size:0.56rem; color:rgba(200,133,58,0.8);
  letter-spacing:0.36em; text-transform:uppercase; margin-bottom:12px;
  display:flex; align-items:center; justify-content:center; gap:16px;
}
.section-eyebrow::before,.section-eyebrow::after {
  content:''; width:36px; height:1px; background:rgba(200,133,58,0.38);
}
.section-title {
  font-family:'Cinzel',serif; font-size:clamp(1.6rem,3vw,2.4rem);
  font-weight:700; color:var(--tx); margin-bottom:12px;
}
.section-sub { font-size:1rem; color:var(--txb); font-style:italic; font-weight:300; max-width:540px; margin:0 auto; line-height:1.75; }

.prog-cards { display:grid; grid-template-columns:repeat(3,1fr); gap:22px; }
@media(max-width:900px){ .prog-cards{grid-template-columns:1fr 1fr;} }
@media(max-width:560px){ .prog-cards{grid-template-columns:1fr;} }

.prog-card {
  background:#fff; border:1px solid rgba(200,133,58,0.14); border-radius:18px;
  padding:28px 24px; position:relative; overflow:hidden;
  box-shadow:0 2px 16px rgba(61,23,0,0.05);
  transition:all 0.25s; cursor:default;
}
.prog-card:hover { transform:translateY(-6px); box-shadow:0 12px 40px rgba(61,23,0,0.12); border-color:rgba(200,133,58,0.32); }
.prog-card::before {
  content:''; position:absolute; top:0; left:0; right:0; height:3px;
  background:var(--card-accent,linear-gradient(90deg,#c8853a,#f5c842));
}
.prog-card-ico { font-size:2.2rem; margin-bottom:14px; }
.prog-card-title { font-family:'Cinzel',serif; font-size:0.94rem; font-weight:700; color:var(--tx); margin-bottom:8px; letter-spacing:0.04em; }
.prog-card-body  { font-size:0.88rem; color:var(--txb); line-height:1.78; font-weight:300; }
.prog-card-tag {
  display:inline-flex; margin-top:14px; padding:3px 10px; border-radius:20px;
  font-family:'Cinzel',serif; font-size:0.58rem; font-weight:700; letter-spacing:0.12em;
  background:rgba(200,133,58,0.1); color:#7a3800; border:1px solid rgba(200,133,58,0.2);
}

/* ════ VERSE SECTION ═══════════════════════════════════════════════ */
.verse-section {
  background:linear-gradient(135deg, #1e0900 0%, #4a1e00 30%, #6b2a00 65%, #4a1e00 85%, #1e0900 100%);
  padding:80px 24px; position:relative; overflow:hidden; text-align:center;
}
.verse-section::before {
  content:''; position:absolute; top:0; left:0; right:0; height:1px;
  background:linear-gradient(90deg, transparent, rgba(200,150,60,0.5) 50%, transparent);
}
.verse-section::after {
  content:''; position:absolute; bottom:0; left:0; right:0; height:1px;
  background:linear-gradient(90deg, transparent, rgba(200,150,60,0.5) 50%, transparent);
}
.verse-bg-om {
  position:absolute; top:50%; left:50%; transform:translate(-50%,-50%);
  font-family:'Noto Serif Devanagari',serif; font-size:min(35vw,320px);
  color:rgba(255,255,255,0.025); pointer-events:none; user-select:none;
  line-height:1;
}
.verse-inner { max-width:760px; margin:0 auto; position:relative; z-index:1; }
.verse-lotus { margin-bottom:24px; opacity:0.9; animation:lotusPulse 3.5s ease-in-out infinite alternate; }
.verse-dev {
  font-family:'Noto Serif Devanagari',serif; font-size:clamp(1.1rem,2.5vw,1.5rem);
  color:rgba(245,215,150,0.97); letter-spacing:0.04em; line-height:1.75;
  margin-bottom:16px; font-weight:500;
  text-shadow:0 0 40px rgba(220,160,50,0.35);
}
.verse-line { width:80px; height:1px; background:rgba(200,133,58,0.45); margin:0 auto 16px; }
.verse-tr {
  font-family:'Crimson Pro',serif; font-size:clamp(0.9rem,1.5vw,1.08rem);
  font-style:italic; color:rgba(220,185,120,0.75); line-height:1.75;
  max-width:560px; margin:0 auto 10px;
}
.verse-source { font-family:'Cinzel',serif; font-size:0.65rem; letter-spacing:0.2em; color:rgba(200,133,58,0.6); text-transform:uppercase; }

/* ════ SECTION SEPARATOR ═══════════════════════════════════════════ */
.section-separator { height:1px; margin:0 40px; background:linear-gradient(90deg, transparent, rgba(200,150,60,0.22) 50%, transparent); }

/* ════ LOGIN STRIP ══════════════════════════════════════════════════ */
.home-login-strip {
  background:linear-gradient(135deg, #1e0900 0%, #4a1e00 30%, #7a3200 65%, #a04800 100%);
  padding:64px 24px; text-align:center; position:relative; overflow:hidden;
}
.home-login-strip::before {
  content:''; position:absolute; top:0; left:0; right:0; height:1px;
  background:linear-gradient(90deg, transparent, rgba(200,150,60,0.55), rgba(255,210,100,0.9), rgba(200,150,60,0.55), transparent);
}
.home-login-strip::after {
  content:''; position:absolute; inset:0;
  background:radial-gradient(ellipse 55% 90% at 50% 50%, rgba(200,120,30,0.1) 0%, transparent 70%);
  pointer-events:none;
}
.login-flower-accent { position:absolute; top:50%; transform:translateY(-50%); pointer-events:none; opacity:0.28; z-index:0; }
.login-flower-accent-left { left:28px; }
.login-flower-accent-right { right:28px; transform:translateY(-50%) scaleX(-1); }

.login-strip-eyebrow {
  font-family:'Cinzel Decorative',serif; font-size:0.58rem; color:rgba(240,200,130,0.65);
  letter-spacing:0.34em; text-transform:uppercase; margin-bottom:16px; position:relative; z-index:1;
}
.login-strip-title {
  font-family:'Cinzel',serif; font-size:clamp(1.3rem,2.5vw,2rem); font-weight:700;
  color:rgba(255,240,200,0.96); margin-bottom:8px; position:relative; z-index:1;
}
.login-strip-sub {
  font-family:'Crimson Pro',serif; font-size:0.95rem; font-style:italic;
  color:rgba(220,185,130,0.65); margin-bottom:28px; position:relative; z-index:1;
}
.home-login-btn {
  display:inline-flex; align-items:center; gap:10px; padding:15px 42px;
  background:rgba(255,255,255,0.07); border:1.5px solid rgba(200,150,60,0.45);
  color:rgba(255,235,180,0.95); border-radius:8px;
  font-family:'Cinzel',serif; font-size:0.83rem; font-weight:700; letter-spacing:0.1em;
  text-decoration:none; transition:all 0.22s; position:relative; z-index:1;
  backdrop-filter:blur(8px);
}
.home-login-btn:hover { background:rgba(255,255,255,0.14); border-color:rgba(200,165,70,0.82); transform:translateY(-3px); box-shadow:0 10px 32px rgba(200,120,30,0.28); }

/* ════ FOOTER ══════════════════════════════════════════════════════ */
.home-footer {
  background:#0d0300; padding:32px 24px 28px; text-align:center;
  border-top:1px solid rgba(200,133,58,0.18);
}
.footer-mantra { font-family:'Noto Serif Devanagari',serif; font-size:0.78rem; color:rgba(200,133,58,0.55); letter-spacing:0.1em; margin-bottom:10px; }
.footer-copy   { font-size:0.7rem; color:rgba(255,255,255,0.18); letter-spacing:0.1em; }

/* ════ ENTRANCE ANIMATIONS ══════════════════════════════════════════ */
@keyframes fadeSlideUp { from{opacity:0;transform:translateY(26px);} to{opacity:1;transform:translateY(0);} }
.anim-in { animation:fadeSlideUp 0.8s cubic-bezier(0.22,1,0.36,1) both; }
.anim-d1  { animation-delay:0.08s; }
.anim-d2  { animation-delay:0.2s; }
.anim-d3  { animation-delay:0.34s; }
.anim-d4  { animation-delay:0.5s; }
.anim-d5  { animation-delay:0.64s; }

/* ════ RESPONSIVE MISC ══════════════════════════════════════════════ */
@media(max-width:600px){
  .hero-cta-row  { flex-direction:column; }
  .stats-section { padding:48px 16px; }
  .programmes-section { padding:56px 16px; }
  .verse-section { padding:56px 16px; }
}
`;

// ── Main Component ───────────────────────────────────────────────────
export default function Home() {
  const [current, setCurrent] = useState(0);
  const [statsRef, statsInView] = useInView(0.3);

  useEffect(() => {
    const t = setInterval(
      () => setCurrent((c) => (c + 1) % SLIDESHOW_IMAGES.length),
      4800
    );
    return () => clearInterval(t);
  }, []);

  const prev = () =>
    setCurrent(
      (c) => (c - 1 + SLIDESHOW_IMAGES.length) % SLIDESHOW_IMAGES.length
    );
  const next = () => setCurrent((c) => (c + 1) % SLIDESHOW_IMAGES.length);

  const CX = 210,
    CY = 210,
    R = 196;

  const PROGRAMMES = [
    {
      ico: "🪷",
      title: "Bhakti Vriksha",
      body: "Chapter-by-chapter study of Srila Prabhupada's teachings in intimate weekly circles. The seed of devotion is nurtured with systematic reading and kirtan.",
      tag: "Weekly · Small Group",
      accent: "linear-gradient(90deg,#c8853a,#f5c842)",
    },
    {
      ico: "📖",
      title: "Gita Learning",
      body: "Systematic study of the Bhagavad-gita As It Is — verse by verse, with discussion, questions and the wisdom of our acharyas made accessible to all.",
      tag: "Regular Sessions",
      accent: "linear-gradient(90deg,#7c3aed,#a78bfa)",
    },
    {
      ico: "🎶",
      title: "Sankirtan Seva",
      body: "The congregational chanting of the Holy Names of the Lord. Sri Chaitanya Mahaprabhu's sublime gift — open to all, requiring no qualification but a willing heart.",
      tag: "Hare Krishna Maha-mantra",
      accent: "linear-gradient(90deg,#0891b2,#22d3ee)",
    },
    {
      ico: "🌿",
      title: "Tulasi Seva",
      body: "Devotional service and care for Srimati Tulasi Devi — the gateway to Krishna's service. Learn the prayers, rituals and significance of this sacred programme.",
      tag: "Daily Worship",
      accent: "linear-gradient(90deg,#16a34a,#4ade80)",
    },
    {
      ico: "🎠",
      title: "Children's Programme",
      body: "Inspiring the next generation with stories of Krishna, Prahlada, Dhruva and the great devotees. Values, culture and bhakti woven into joyful learning.",
      tag: "For Young Devotees",
      accent: "linear-gradient(90deg,#db2777,#f472b6)",
    },
    {
      ico: "📜",
      title: "Book Reading",
      body: "Group reading of Srimad Bhagavatam and other Vaishnava scriptures. Each session opens new dimensions of the transcendental knowledge left by our acharyas.",
      tag: "Collective Study",
      accent: "linear-gradient(90deg,#d97706,#fbbf24)",
    },
  ];

  return (
    <>
      <style>{css}</style>
      <div className="home">
        {/* ══ FALLING PETALS ══════════════════════════════════════ */}
        <div className="petal-field" aria-hidden="true">
          {PETALS.map((p, i) => (
            <div
              key={i}
              className="petal"
              style={{
                "--px": p.l,
                "--pd": p.dur,
                "--pdl": p.dl,
                "--psw": p.sw,
                "--prt": p.rt,
              }}
            >
              <PetalSVG type={p.t} color={PC[p.ci]} size={p.sz} />
            </div>
          ))}
        </div>

        {/* ══ HERO SLIDESHOW ═══════════════════════════════════════ */}
        <section className="slide-section">
          <div
            className="slide-track"
            style={{ transform: `translateX(-${current * 100}%)` }}
          >
            {SLIDESHOW_IMAGES.map((img, i) => (
              <div key={i} className={`slide${i === current ? " active" : ""}`}>
                <img
                  src={img.src}
                  alt=""
                  loading={i === 0 ? "eager" : "lazy"}
                />
                <div className="slide-overlay" />
              </div>
            ))}
          </div>

          {/* Hero centre */}
          <div className="hero-centre">
            {/* Lotus emblem */}
            <svg
              width="72"
              height="72"
              viewBox="0 0 56 56"
              className="hero-emblem-svg"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              {Array.from({ length: 8 }, (_, j) => (
                <ellipse
                  key={j}
                  cx="28"
                  cy="13"
                  rx="5"
                  ry="13"
                  fill={
                    j % 2 === 0
                      ? "rgba(240,200,140,0.85)"
                      : "rgba(255,220,110,0.78)"
                  }
                  transform={`rotate(${j * 45} 28 28)`}
                />
              ))}
              {Array.from({ length: 6 }, (_, j) => (
                <ellipse
                  key={j}
                  cx="28"
                  cy="17"
                  rx="3.5"
                  ry="9"
                  fill="rgba(255,245,210,0.9)"
                  transform={`rotate(${j * 60 + 30} 28 28)`}
                />
              ))}
              <circle cx="28" cy="28" r="8" fill="rgba(200,133,58,0.95)" />
              <circle cx="28" cy="28" r="5" fill="rgba(245,208,112,0.98)" />
              <circle cx="28" cy="28" r="2.5" fill="rgba(255,245,185,1)" />
            </svg>

            <h1 className="hero-title">Hare Krishna</h1>
            <p className="hero-subtitle">
              ISKCON Magadi Main Road · Member Portal
            </p>

            <div className="hero-cta-row">
              <Link to="/login" className="hero-cta-primary">
                Member Sign In →
              </Link>
              <a
                href={ORG_WEBSITE}
                target="_blank"
                rel="noopener noreferrer"
                className="hero-cta-secondary"
              >
                Our Website
              </a>
            </div>
          </div>

          {/* Garland bar */}
          <div className="slide-garland-bar" aria-hidden="true">
            <svg
              width="100%"
              height="64"
              viewBox="0 0 1440 64"
              preserveAspectRatio="xMidYMid slice"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M0,48 Q180,22 360,44 Q540,62 720,44 Q900,22 1080,44 Q1260,62 1440,44"
                stroke="rgba(200,140,55,0.28)"
                strokeWidth="1.2"
                fill="none"
              />
              {[120, 240, 360, 480, 600, 720, 840, 960, 1080, 1200, 1320].map(
                (x, i) => {
                  const yb = i % 2 === 0 ? 32 : 40;
                  return (
                    <g key={i}>
                      {Array.from({ length: 8 }, (_, j) => (
                        <ellipse
                          key={j}
                          cx={x}
                          cy={yb - 6}
                          rx="2.2"
                          ry="5.5"
                          fill={
                            j % 2 === 0
                              ? "rgba(232,151,106,0.6)"
                              : "rgba(245,192,80,0.55)"
                          }
                          transform={`rotate(${j * 45} ${x} ${yb})`}
                        />
                      ))}
                      <circle
                        cx={x}
                        cy={yb}
                        r="3.5"
                        fill="rgba(200,133,58,0.65)"
                      />
                      <circle
                        cx={x}
                        cy={yb}
                        r="1.8"
                        fill="rgba(245,208,112,0.75)"
                      />
                      <path
                        d={`M${x - 8},${yb} C${x - 5},${yb - 5} ${x - 2},${
                          yb - 4
                        } ${x - 4},${yb + 2} C${x - 7},${yb + 4} ${x - 10},${
                          yb + 2
                        } ${x - 8},${yb}Z`}
                        fill="rgba(100,70,20,0.32)"
                      />
                      <path
                        d={`M${x + 8},${yb} C${x + 5},${yb - 5} ${x + 2},${
                          yb - 4
                        } ${x + 4},${yb + 2} C${x + 7},${yb + 4} ${x + 10},${
                          yb + 2
                        } ${x + 8},${yb}Z`}
                        fill="rgba(100,70,20,0.32)"
                      />
                    </g>
                  );
                }
              )}
            </svg>
          </div>

          {/* Arrows */}
          <button
            className="slide-arrow slide-arrow-left"
            onClick={prev}
            aria-label="Previous"
          >
            <svg
              width={16}
              height={16}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 19.5L8.25 12l7.5-7.5"
              />
            </svg>
          </button>
          <button
            className="slide-arrow slide-arrow-right"
            onClick={next}
            aria-label="Next"
          >
            <svg
              width={16}
              height={16}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.25 4.5l7.5 7.5-7.5 7.5"
              />
            </svg>
          </button>

          {/* Dots */}
          <div className="slide-dots">
            {SLIDESHOW_IMAGES.map((_, i) => (
              <button
                key={i}
                aria-label={`Slide ${i + 1}`}
                className={`slide-dot${i === current ? " active" : ""}`}
                onClick={() => setCurrent(i)}
              />
            ))}
          </div>
        </section>

        {/* ══ MANTRA TICKER ════════════════════════════════════════ */}
        <div className="mantra-ticker" aria-label="Hare Krishna Maha-mantra">
          <div className="mantra-ticker-track">
            {[1, 2].map((n) => (
              <span key={n} className="mantra-ticker-text">
                {MANTRA_TRACK}
              </span>
            ))}
          </div>
        </div>

        {/* ══ FLORAL DIVIDER ═══════════════════════════════════════ */}
        <div className="home-divider">
          <svg
            width="220"
            height="70"
            viewBox="0 0 220 70"
            xmlns="http://www.w3.org/2000/svg"
            className="home-divider-lotus"
            aria-hidden="true"
          >
            <path
              d="M110,35 C88,33 70,38 48,35"
              stroke="rgba(122,90,32,0.38)"
              strokeWidth="1.3"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M110,35 C132,33 150,38 172,35"
              stroke="rgba(122,90,32,0.38)"
              strokeWidth="1.3"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M48,35 C30,33 18,38 4,35"
              stroke="rgba(122,90,32,0.28)"
              strokeWidth="1"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M172,35 C190,33 202,38 216,35"
              stroke="rgba(122,90,32,0.28)"
              strokeWidth="1"
              fill="none"
              strokeLinecap="round"
            />
            {/* Jasmines */}
            {[
              [18, 35],
              [202, 35],
            ].map(([x, y], fi) => (
              <g key={fi}>
                {[0, 72, 144, 216, 288].map((a, j) => (
                  <ellipse
                    key={j}
                    cx={x}
                    cy={y - 5}
                    rx="1.8"
                    ry="4"
                    fill="#fdf8f0"
                    stroke="rgba(200,133,58,0.3)"
                    strokeWidth="0.4"
                    transform={`rotate(${a} ${x} ${y})`}
                    opacity="0.92"
                  />
                ))}
                <circle cx={x} cy={y} r="2" fill="#f5d070" />
              </g>
            ))}
            {/* Marigolds */}
            {[
              [48, 35],
              [172, 35],
            ].map(([x, y], fi) => (
              <g key={fi}>
                {Array.from({ length: 10 }, (_, j) => (
                  <ellipse
                    key={j}
                    cx={x}
                    cy={y - 8}
                    rx="3"
                    ry="7"
                    fill={j % 2 === 0 ? "#e8976a" : "#f5c050"}
                    transform={`rotate(${j * 36} ${x} ${y})`}
                    opacity="0.85"
                  />
                ))}
                <circle cx={x} cy={y} r="5" fill="#c8853a" />
                <circle cx={x} cy={y} r="3" fill="#f5d070" />
              </g>
            ))}
            {/* Roses */}
            {[
              [78, 35],
              [142, 35],
            ].map(([x, y], fi) => (
              <g key={fi}>
                {[0, 60, 120, 180, 240, 300].map((a, j) => (
                  <ellipse
                    key={j}
                    cx={x}
                    cy={y - 6}
                    rx="2.8"
                    ry="5.5"
                    fill="#c85030"
                    transform={`rotate(${a} ${x} ${y})`}
                    opacity="0.78"
                  />
                ))}
                <circle cx={x} cy={y} r="3" fill="#7a2010" />
              </g>
            ))}
            {/* Central Lotus */}
            <Lotus cx={110} cy={35} r1={13} r2={8} />
            <path
              d="M88,24 C93,17 100,20 97,28 C91,30 86,28 88,24Z"
              fill="#7a5a20"
              opacity="0.45"
            />
            <path
              d="M132,24 C127,17 120,20 123,28 C129,30 134,28 132,24Z"
              fill="#7a5a20"
              opacity="0.45"
            />
          </svg>
        </div>

        {/* ══ ABOUT ════════════════════════════════════════════════ */}
        <section className="about-section">
          <div className="about-inner">
            <div className="about-grid">
              {/* Corner ornaments */}
              <svg
                width="110"
                height="110"
                viewBox="0 0 110 110"
                xmlns="http://www.w3.org/2000/svg"
                className="about-corner about-corner-tr"
                aria-hidden="true"
              >
                <path
                  d="M65,30 C58,42 50,52 42,60"
                  stroke="rgba(122,90,32,0.35)"
                  strokeWidth="1.2"
                  fill="none"
                  strokeLinecap="round"
                />
                <path
                  d="M65,30 C72,22 82,18 90,14"
                  stroke="rgba(122,90,32,0.28)"
                  strokeWidth="1"
                  fill="none"
                  strokeLinecap="round"
                />
                <path
                  d="M42,60 C36,66 28,70 20,74"
                  stroke="rgba(122,90,32,0.25)"
                  strokeWidth="0.9"
                  fill="none"
                  strokeLinecap="round"
                />
                {Array.from({ length: 12 }, (_, j) => (
                  <ellipse
                    key={j}
                    cx="65"
                    cy={30 - 11}
                    rx="4"
                    ry="10"
                    fill={j % 2 === 0 ? "#e8976a" : "#f5c050"}
                    transform={`rotate(${j * 30} 65 30)`}
                    opacity="0.84"
                  />
                ))}
                <circle cx="65" cy="30" r="7" fill="#c8853a" />
                <circle cx="65" cy="30" r="4.5" fill="#f5d070" />
                {[0, 60, 120, 180, 240, 300].map((a, j) => (
                  <ellipse
                    key={j}
                    cx="40"
                    cy={60 - 7}
                    rx="4"
                    ry="7"
                    fill="#c85030"
                    transform={`rotate(${a} 40 60)`}
                    opacity="0.8"
                  />
                ))}
                <circle cx="40" cy="60" r="5" fill="#8a2010" />
                {[0, 72, 144, 216, 288].map((a, j) => (
                  <ellipse
                    key={j}
                    cx="88"
                    cy={14 - 5}
                    rx="2.2"
                    ry="4.5"
                    fill="#fdf8f0"
                    stroke="rgba(200,133,58,0.35)"
                    strokeWidth="0.4"
                    transform={`rotate(${a} 88 14)`}
                    opacity="0.93"
                  />
                ))}
                <circle cx="88" cy="14" r="2.8" fill="#f5d070" />
                <path
                  d="M52,18 C56,12 63,14 61,22 C55,24 50,22 52,18Z"
                  fill="#7a5a20"
                  opacity="0.5"
                />
                <path
                  d="M48,44 C42,38 46,32 52,36 C52,40 50,46 48,44Z"
                  fill="#7a5a20"
                  opacity="0.48"
                />
              </svg>

              {/* Text column */}
              <div className="about-text-col">
                {/* Left vine */}
                <svg
                  viewBox="0 0 22 500"
                  preserveAspectRatio="xMidYMid meet"
                  xmlns="http://www.w3.org/2000/svg"
                  className="about-vine"
                  aria-hidden="true"
                >
                  <path
                    d="M11,8 C9,50 13,90 11,130 C9,170 13,210 11,250 C9,290 13,330 11,370 C9,410 13,450 11,490"
                    stroke="rgba(200,133,58,0.22)"
                    strokeWidth="1.2"
                    fill="none"
                    strokeLinecap="round"
                  />
                  {[60, 160, 260, 360, 455].map((y, i) => (
                    <g key={i}>
                      {[0, 60, 120, 180, 240, 300].map((a, j) => (
                        <ellipse
                          key={j}
                          cx="11"
                          cy={y - 4}
                          rx="1.8"
                          ry="3.8"
                          fill={
                            i % 2 === 0
                              ? "rgba(200,133,58,0.38)"
                              : "rgba(232,185,106,0.35)"
                          }
                          transform={`rotate(${a} 11 ${y})`}
                        />
                      ))}
                      <circle
                        cx="11"
                        cy={y}
                        r="2.4"
                        fill="rgba(200,133,58,0.42)"
                      />
                      <circle
                        cx="11"
                        cy={y}
                        r="1.2"
                        fill="rgba(245,208,112,0.6)"
                      />
                      <path
                        d={`M11,${y - 8} C7,${y - 12} 4,${y - 8} 6,${
                          y - 4
                        } C8,${y - 2} 11,${y - 5} 11,${y - 8}Z`}
                        fill="rgba(120,85,25,0.28)"
                      />
                      <path
                        d={`M11,${y - 8} C15,${y - 12} 18,${y - 8} 16,${
                          y - 4
                        } C14,${y - 2} 11,${y - 5} 11,${y - 8}Z`}
                        fill="rgba(120,85,25,0.22)"
                      />
                    </g>
                  ))}
                </svg>

                <p className="home-eyebrow anim-in anim-d1">
                  About Our Organisation
                </p>
                <h2 className="home-title anim-in anim-d2">
                  Walking the Path of
                  <br />
                  Devotion Together
                </h2>

                {/* SVG title underline */}
                <svg
                  width="130"
                  height="16"
                  viewBox="0 0 130 16"
                  xmlns="http://www.w3.org/2000/svg"
                  className="title-underline anim-in anim-d2"
                  aria-hidden="true"
                >
                  <path
                    d="M4,10 C20,4 42,14 65,8 C88,2 110,12 126,8"
                    stroke="url(#uGrad)"
                    strokeWidth="2.8"
                    fill="none"
                    strokeLinecap="round"
                  />
                  <path
                    d="M12,13.5 C35,11 58,14 86,12.5 C102,11.8 116,13 122,12.5"
                    stroke="rgba(200,133,58,0.28)"
                    strokeWidth="0.8"
                    fill="none"
                    strokeLinecap="round"
                  />
                  <ellipse
                    cx="65"
                    cy="6"
                    rx="4"
                    ry="5.5"
                    fill="rgba(200,133,58,0.22)"
                  />
                  <ellipse
                    cx="65"
                    cy="6"
                    rx="2.2"
                    ry="3.8"
                    fill="rgba(200,133,58,0.45)"
                  />
                  <circle
                    cx="65"
                    cy="8.5"
                    r="1.4"
                    fill="rgba(200,133,58,0.7)"
                  />
                  <path
                    d="M4,8 L6,10 L4,12 L2,10Z"
                    fill="rgba(200,133,58,0.55)"
                  />
                  <path
                    d="M126,6 L128,8 L126,10 L124,8Z"
                    fill="rgba(200,133,58,0.55)"
                  />
                  <defs>
                    <linearGradient
                      id="uGrad"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="0%"
                    >
                      <stop offset="0%" stopColor="rgba(200,133,58,0.2)" />
                      <stop offset="30%" stopColor="rgba(200,133,58,0.85)" />
                      <stop offset="50%" stopColor="rgba(232,185,106,1)" />
                      <stop offset="70%" stopColor="rgba(200,133,58,0.85)" />
                      <stop offset="100%" stopColor="rgba(200,133,58,0.2)" />
                    </linearGradient>
                  </defs>
                </svg>

                <p className="home-lead anim-in anim-d3">
                  ISKCON Magadi Main Road, Bangalore popularly known as ISKCON
                  New Rajapur Jagannatha Dham temple (INRJD) is overflowing with
                  the Supreme Lord Jaganath’s mercy. It was on Akshaya tritiya
                  day of 2012 that the padukas (paraphernalia) of Rajapur’s
                  Jagannath, Subhadra and Baladev deities arrived in the INRJD,
                  Magadi road, Bangalore. Since then, there have been many
                  pastimes (lila) which Jagannath has displayed and the devotees
                  have experienced and relished.
                </p>

                {/* Flower strip */}
                <div className="about-flower-strip anim-in anim-d3">
                  <div className="about-flower-strip-line" />
                  <svg
                    width="48"
                    height="18"
                    viewBox="0 0 48 18"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    {[9, 24, 39].map((x, fi) => (
                      <g key={fi}>
                        {[0, 72, 144, 216, 288].map((a, j) => (
                          <ellipse
                            key={j}
                            cx={x}
                            cy={9 - 4}
                            rx="1.6"
                            ry="3.5"
                            fill={fi === 1 ? "#f5d070" : "#fdf8f0"}
                            stroke="rgba(200,133,58,0.3)"
                            strokeWidth="0.4"
                            transform={`rotate(${a} ${x} 9)`}
                            opacity="0.9"
                          />
                        ))}
                        <circle
                          cx={x}
                          cy="9"
                          r="2"
                          fill={fi === 1 ? "#c8853a" : "#f5d070"}
                        />
                      </g>
                    ))}
                  </svg>
                  <div
                    className="about-flower-strip-line"
                    style={{
                      background:
                        "linear-gradient(90deg, transparent, rgba(200,133,58,0.3))",
                    }}
                  />
                </div>

                {/* Sanskrit block */}
                <div className="mantra-block anim-in anim-d4">
                  <div className="mantra-block-dev">
                    न केवलं देहस्य सहायता, आत्मनः तु परा सेवा ।<br />
                    कृष्णभावनामृतस्य वितरणं, हरिनाम संकीर्तनम् ॥
                  </div>
                  <div className="mantra-block-tr">
                    Real help is not merely for the body — the highest service
                    is to the soul. By distributing Krishna consciousness and
                    chanting the holy names, living beings return to the supreme
                    abode.
                  </div>
                  <svg
                    width="60"
                    height="60"
                    viewBox="0 0 56 56"
                    className="mantra-block-lotus"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    {Array.from({ length: 8 }, (_, j) => (
                      <ellipse
                        key={j}
                        cx="28"
                        cy="13"
                        rx="5"
                        ry="13"
                        fill="rgba(200,133,58,1)"
                        transform={`rotate(${j * 45} 28 28)`}
                      />
                    ))}
                    <circle cx="28" cy="28" r="8" fill="rgba(200,133,58,1)" />
                  </svg>
                </div>

                <p className="home-body anim-in anim-d4">
                  This portal is our internal workspace — a dedicated space for
                  members to coordinate, manage programmes, and stay connected
                  in the spirit of service.
                </p>

                <div className="home-disclaimer anim-in anim-d4">
                  <div className="home-disclaimer-lbl">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="16" x2="12" y2="12" />
                      <line x1="12" y1="8" x2="12.01" y2="8" />
                    </svg>
                    Please Note
                  </div>
                  <p>
                    This is <strong>not our official public website</strong>.
                    This portal is exclusively for organisation members. If you
                    are not a member, kindly visit our official website below.
                  </p>
                </div>

                <div className="anim-in anim-d5">
                  <a
                    href={ORG_WEBSITE}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="home-visit-btn"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <line x1="2" y1="12" x2="22" y2="12" />
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                    </svg>
                    Visit Our Official Website
                  </a>
                </div>
              </div>

              {/* ── Shrine ── */}
              <div className="about-shrine-col anim-in anim-d3">
                <div className="shrine-universe">
                  <div className="shrine-aura" />

                  {/* Rotating mantra ring */}
                  <svg
                    className="shrine-mantra-svg"
                    viewBox={`0 0 ${CX * 2} ${CY * 2}`}
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <defs>
                      <path
                        id="mantraPath"
                        d={`M ${CX},${CY - R} a ${R},${R} 0 1,1 -0.001,0`}
                      />
                    </defs>
                    <circle
                      cx={CX}
                      cy={CY}
                      r={R}
                      fill="none"
                      stroke="rgba(200,140,55,0.12)"
                      strokeWidth="1"
                    />
                    <text className="mantra-text-path">
                      <textPath
                        href="#mantraPath"
                        startOffset="0%"
                        textLength={`${2 * Math.PI * R}`}
                        lengthAdjust="spacing"
                      >
                        {MANTRA_TRACK}
                      </textPath>
                    </text>
                  </svg>

                  {/* Orbit ring */}
                  <svg
                    className="shrine-orbit-svg"
                    viewBox="0 0 420 420"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <circle
                      cx="210"
                      cy="210"
                      r="168"
                      fill="none"
                      stroke="rgba(200,140,55,0.08)"
                      strokeWidth="0.8"
                      strokeDasharray="2 6"
                    />
                    {Array.from({ length: 16 }, (_, i) => {
                      const a = ((i * 22.5 - 90) * Math.PI) / 180;
                      const cx = +(210 + 168 * Math.cos(a)).toFixed(2);
                      const cy = +(210 + 168 * Math.sin(a)).toFixed(2);
                      const big = i % 4 === 0,
                        med = i % 2 === 0 && !big;
                      const s = big ? 5.5 : med ? 3.8 : 2.5;
                      return (
                        <g
                          key={i}
                          transform={`translate(${cx},${cy}) rotate(${
                            i * 22.5 + 45
                          })`}
                        >
                          <path
                            d={`M0,${-s} L${s * 0.6},0 L0,${s} L${-s * 0.6},0Z`}
                            fill={
                              big
                                ? "rgba(232,185,106,0.92)"
                                : med
                                ? "rgba(200,133,58,0.72)"
                                : "rgba(245,220,140,0.55)"
                            }
                          />
                          {big && (
                            <circle
                              cx="0"
                              cy="0"
                              r="1.4"
                              fill="rgba(255,240,180,0.9)"
                            />
                          )}
                        </g>
                      );
                    })}
                    {Array.from({ length: 8 }, (_, i) => {
                      const a = ((i * 45 - 90) * Math.PI) / 180;
                      const cx = +(210 + 130 * Math.cos(a)).toFixed(2);
                      const cy = +(210 + 130 * Math.sin(a)).toFixed(2);
                      return (
                        <g key={i} transform={`translate(${cx},${cy})`}>
                          {[0, 60, 120, 180, 240, 300].map((ang, j) => (
                            <ellipse
                              key={j}
                              cx="0"
                              cy="-3.5"
                              rx="1.2"
                              ry="3"
                              fill={
                                i % 2 === 0
                                  ? "rgba(200,133,58,0.6)"
                                  : "rgba(232,185,106,0.55)"
                              }
                              transform={`rotate(${ang})`}
                            />
                          ))}
                          <circle
                            cx="0"
                            cy="0"
                            r="1.8"
                            fill="rgba(200,133,58,0.65)"
                          />
                          <circle
                            cx="0"
                            cy="0"
                            r="0.9"
                            fill="rgba(245,208,112,0.8)"
                          />
                        </g>
                      );
                    })}
                  </svg>

                  <div className="shrine-spin-ring" />
                  <div className="shrine-circle">
                    <img
                      src={SHRINE_IMAGE.src}
                      alt={SHRINE_IMAGE.alt}
                      className="shrine-image"
                    />
                    <div className="shrine-image-vignette" />
                  </div>

                  {/* Particles */}
                  {[
                    { s: 7, top: "5%", left: "12%", dur: "4.2s", delay: "0s" },
                    {
                      s: 5,
                      top: "10%",
                      right: "14%",
                      dur: "3.8s",
                      delay: "1.3s",
                    },
                    {
                      s: 6,
                      top: "76%",
                      left: "10%",
                      dur: "5.1s",
                      delay: "0.7s",
                    },
                    {
                      s: 4,
                      top: "80%",
                      right: "12%",
                      dur: "4.5s",
                      delay: "2.1s",
                    },
                    {
                      s: 8,
                      top: "42%",
                      left: "2%",
                      dur: "6.2s",
                      delay: "1.1s",
                    },
                    {
                      s: 5,
                      top: "30%",
                      right: "3%",
                      dur: "5.6s",
                      delay: "0.4s",
                    },
                  ].map((p, i) => (
                    <div
                      key={i}
                      className="shrine-particle"
                      style={{
                        width: p.s,
                        height: p.s,
                        top: p.top,
                        ...(p.left ? { left: p.left } : {}),
                        ...(p.right ? { right: p.right } : {}),
                        "--dur": p.dur,
                        "--delay": p.delay,
                      }}
                    />
                  ))}

                  <div className="shrine-nameplate">
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      xmlns="http://www.w3.org/2000/svg"
                      aria-hidden="true"
                    >
                      <path
                        d="M6,0 L8.5,4.5 L12,6 L8.5,7.5 L6,12 L3.5,7.5 L0,6 L3.5,4.5Z"
                        fill="rgba(245,208,112,0.85)"
                      />
                      <circle
                        cx="6"
                        cy="6"
                        r="2"
                        fill="rgba(255,240,180,0.9)"
                      />
                    </svg>
                    Hare Krishna
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      xmlns="http://www.w3.org/2000/svg"
                      aria-hidden="true"
                    >
                      <path
                        d="M6,0 L8.5,4.5 L12,6 L8.5,7.5 L6,12 L3.5,7.5 L0,6 L3.5,4.5Z"
                        fill="rgba(245,208,112,0.85)"
                      />
                      <circle
                        cx="6"
                        cy="6"
                        r="2"
                        fill="rgba(255,240,180,0.9)"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══ VERSE SECTION ════════════════════════════════════════ */}
        <section className="verse-section">
          <div className="verse-bg-om" aria-hidden="true"></div>
          <div className="verse-inner">
            <svg
              width="64"
              height="64"
              viewBox="0 0 56 56"
              className="verse-lotus"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              {Array.from({ length: 8 }, (_, j) => (
                <ellipse
                  key={j}
                  cx="28"
                  cy="13"
                  rx="5"
                  ry="13"
                  fill={
                    j % 2 === 0
                      ? "rgba(240,200,140,0.82)"
                      : "rgba(255,220,110,0.75)"
                  }
                  transform={`rotate(${j * 45} 28 28)`}
                />
              ))}
              {Array.from({ length: 6 }, (_, j) => (
                <ellipse
                  key={j}
                  cx="28"
                  cy="17"
                  rx="3.5"
                  ry="9"
                  fill="rgba(255,245,210,0.88)"
                  transform={`rotate(${j * 60 + 30} 28 28)`}
                />
              ))}
              <circle cx="28" cy="28" r="8" fill="rgba(200,133,58,0.92)" />
              <circle cx="28" cy="28" r="5" fill="rgba(245,208,112,0.95)" />
              <circle cx="28" cy="28" r="2.5" fill="rgba(255,245,185,1)" />
            </svg>

            <div className="verse-dev">
              नष्टप्रायेष्वभद्रेषु नित्यं भागवतसेवया ।<br />
              भगवत्युत्तमश्लोके भक्तिर्भवति नैष्ठिकी ॥
            </div>
            <div className="verse-line" />
            <div className="verse-tr">
              By regularly hearing the Srimad-Bhagavatam and rendering service
              unto the pure devotee, all that is troublesome to the heart is
              almost completely destroyed, and loving service unto the Glorious
              Lord, who is praised with transcendental songs, is established as
              an irrevocable fact.
            </div>
            <div className="verse-source">— Srimad Bhagavatam 1.2.18</div>
          </div>
        </section>

        <div className="section-separator" />

        {/* ══ LOGIN STRIP ══════════════════════════════════════════ */}
        <div className="home-login-strip">
          {/* Left floral accent */}
          <svg
            width="80"
            height="90"
            viewBox="0 0 80 90"
            xmlns="http://www.w3.org/2000/svg"
            className="login-flower-accent login-flower-accent-left"
            aria-hidden="true"
          >
            <path
              d="M40,80 C38,60 42,40 40,20"
              stroke="rgba(200,150,60,0.4)"
              strokeWidth="1.2"
              fill="none"
            />
            <path
              d="M40,65 C30,58 22,52 18,44"
              stroke="rgba(200,150,60,0.3)"
              strokeWidth="1"
              fill="none"
            />
            <path
              d="M40,50 C50,44 56,36 58,28"
              stroke="rgba(200,150,60,0.3)"
              strokeWidth="1"
              fill="none"
            />
            {Array.from({ length: 10 }, (_, j) => (
              <ellipse
                key={j}
                cx="40"
                cy={20 - 8}
                rx="3.5"
                ry="7.5"
                fill={
                  j % 2 === 0
                    ? "rgba(232,151,106,0.85)"
                    : "rgba(245,192,80,0.8)"
                }
                transform={`rotate(${j * 36} 40 20)`}
              />
            ))}
            <circle cx="40" cy="20" r="5" fill="rgba(200,133,58,0.9)" />
            {[0, 60, 120, 180, 240, 300].map((a, j) => (
              <ellipse
                key={j}
                cx="58"
                cy={28 - 6}
                rx="3"
                ry="5.5"
                fill="rgba(200,80,48,0.78)"
                transform={`rotate(${a} 58 28)`}
              />
            ))}
            <circle cx="58" cy="28" r="3.5" fill="rgba(120,32,16,0.85)" />
            {[0, 72, 144, 216, 288].map((a, j) => (
              <ellipse
                key={j}
                cx="18"
                cy={44 - 4.5}
                rx="2"
                ry="4"
                fill="rgba(253,248,240,0.88)"
                stroke="rgba(200,133,58,0.3)"
                strokeWidth="0.4"
                transform={`rotate(${a} 18 44)`}
              />
            ))}
            <circle cx="18" cy="44" r="2.5" fill="rgba(245,208,112,0.9)" />
            <path
              d="M34,38 C28,32 32,26 38,30 C38,35 36,40 34,38Z"
              fill="rgba(100,70,20,0.45)"
            />
            <path
              d="M46,52 C52,46 56,50 52,58 C47,60 44,56 46,52Z"
              fill="rgba(100,70,20,0.42)"
            />
          </svg>
          <svg
            width="80"
            height="90"
            viewBox="0 0 80 90"
            xmlns="http://www.w3.org/2000/svg"
            className="login-flower-accent login-flower-accent-right"
            aria-hidden="true"
          >
            <path
              d="M40,80 C38,60 42,40 40,20"
              stroke="rgba(200,150,60,0.4)"
              strokeWidth="1.2"
              fill="none"
            />
            <path
              d="M40,65 C30,58 22,52 18,44"
              stroke="rgba(200,150,60,0.3)"
              strokeWidth="1"
              fill="none"
            />
            <path
              d="M40,50 C50,44 56,36 58,28"
              stroke="rgba(200,150,60,0.3)"
              strokeWidth="1"
              fill="none"
            />
            {Array.from({ length: 10 }, (_, j) => (
              <ellipse
                key={j}
                cx="40"
                cy={20 - 8}
                rx="3.5"
                ry="7.5"
                fill={
                  j % 2 === 0
                    ? "rgba(232,151,106,0.85)"
                    : "rgba(245,192,80,0.8)"
                }
                transform={`rotate(${j * 36} 40 20)`}
              />
            ))}
            <circle cx="40" cy="20" r="5" fill="rgba(200,133,58,0.9)" />
            {[0, 60, 120, 180, 240, 300].map((a, j) => (
              <ellipse
                key={j}
                cx="58"
                cy={28 - 6}
                rx="3"
                ry="5.5"
                fill="rgba(200,80,48,0.78)"
                transform={`rotate(${a} 58 28)`}
              />
            ))}
            <circle cx="58" cy="28" r="3.5" fill="rgba(120,32,16,0.85)" />
            {[0, 72, 144, 216, 288].map((a, j) => (
              <ellipse
                key={j}
                cx="18"
                cy={44 - 4.5}
                rx="2"
                ry="4"
                fill="rgba(253,248,240,0.88)"
                stroke="rgba(200,133,58,0.3)"
                strokeWidth="0.4"
                transform={`rotate(${a} 18 44)`}
              />
            ))}
            <circle cx="18" cy="44" r="2.5" fill="rgba(245,208,112,0.9)" />
            <path
              d="M34,38 C28,32 32,26 38,30 C38,35 36,40 34,38Z"
              fill="rgba(100,70,20,0.45)"
            />
          </svg>

          <div className="login-strip-eyebrow">Members Only</div>
          <h2 className="login-strip-title">Ready to Continue Your Seva?</h2>
          <p className="login-strip-sub">
            Access your programmes, mark attendance, and serve with purpose.
          </p>
          <Link to="/login" className="home-login-btn">
            <svg
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
                d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
              />
            </svg>
            Member Sign In
          </Link>
        </div>

        {/* ══ FOOTER ═══════════════════════════════════════════════ */}
        <footer className="home-footer">
          <div className="footer-mantra">
            ✦ Hare Krishna Hare Krishna Krishna Krishna Hare Hare ✦ Hare Rama
            Hare Rama Rama Rama Hare Hare ✦
          </div>
        </footer>
      </div>
    </>
  );
}
