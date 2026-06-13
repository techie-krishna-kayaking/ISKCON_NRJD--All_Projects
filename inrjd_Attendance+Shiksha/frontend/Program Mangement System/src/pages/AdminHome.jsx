import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import toast from "react-hot-toast";
import PendingDeactivations from "../components/PendingDeactivations";

const css = `
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=DM+Sans:wght@300;400;500;600;700&display=swap');

/* ══ ROOT ══════════════════════════════════════════════════════════ */
.adh { min-height:100%; background:#f4ede4; font-family:'DM Sans',sans-serif; }

/* ══ HERO ══════════════════════════════════════════════════════════ */
.adh-hero {
  background:linear-gradient(135deg,#0d0300 0%,#2a0e00 20%,#5a2400 55%,#8b4000 80%,#b86000 100%);
  padding:36px 0 0; position:relative; overflow:hidden;
}
.adh-hero::before {
  content:''; position:absolute; inset:0;
  background:radial-gradient(ellipse at 75% 40%, rgba(200,120,0,0.14) 0%, transparent 55%),
             radial-gradient(ellipse at 20% 80%, rgba(80,20,0,0.2) 0%, transparent 50%);
  pointer-events:none;
}
.adh-inner { max-width:1300px; margin:0 auto; padding:0 28px; position:relative; z-index:1; }
.adh-hero-row { display:flex; align-items:flex-start; justify-content:space-between; gap:20px; flex-wrap:wrap; margin-bottom:32px; }

.adh-eyebrow { font-family:'Cinzel',serif; font-size:0.6rem; font-weight:700; color:rgba(200,150,60,0.85); letter-spacing:0.24em; text-transform:uppercase; margin-bottom:10px; display:flex; align-items:center; gap:8px; }
.adh-eyebrow::before,.adh-eyebrow::after { content:''; width:24px; height:1px; background:rgba(200,150,60,0.4); }
.adh-name { font-family:'Cinzel',serif; font-size:clamp(1.6rem,3vw,2.4rem); font-weight:700; color:#fff; margin:0 0 8px; line-height:1.2; }
.adh-name em { color:#f5c842; font-style:normal; }
.adh-sub  { color:rgba(255,210,140,0.6); font-size:0.88rem; max-width:420px; line-height:1.7; margin:0; }

.adh-btns { display:flex; gap:8px; flex-wrap:wrap; padding-top:4px; }
.adh-btn  { display:flex; align-items:center; gap:6px; padding:9px 16px; border-radius:9px; border:none; cursor:pointer; font-family:'DM Sans',sans-serif; font-size:0.82rem; font-weight:700; transition:all 0.15s; }
.adh-btn-gold   { background:rgba(245,200,66,0.18); color:#f5c842; border:1.5px solid rgba(245,200,66,0.3); }
.adh-btn-gold:hover { background:rgba(245,200,66,0.28); }
.adh-btn-ghost  { background:rgba(255,255,255,0.1); color:rgba(255,255,255,0.82); border:1.5px solid rgba(255,255,255,0.18); }
.adh-btn-ghost:hover { background:rgba(255,255,255,0.18); }

/* Hero strip */
.adh-strip { display:grid; grid-template-columns:repeat(6,1fr); border-top:1px solid rgba(255,255,255,0.08); margin:0 -28px; }
.adh-si { padding:16px 20px; border-right:1px solid rgba(255,255,255,0.07); position:relative; }
.adh-si:last-child { border-right:none; }
.adh-si::before { content:''; position:absolute; top:0; left:0; right:0; height:2px; }
.adh-si-0::before{background:linear-gradient(90deg,#f5c842,transparent);}
.adh-si-1::before{background:linear-gradient(90deg,#4ade80,transparent);}
.adh-si-2::before{background:linear-gradient(90deg,#a78bfa,transparent);}
.adh-si-3::before{background:linear-gradient(90deg,#38bdf8,transparent);}
.adh-si-4::before{background:linear-gradient(90deg,#fb923c,transparent);}
.adh-si-5::before{background:linear-gradient(90deg,#f87171,transparent);}
.adh-si-val { font-family:'Cinzel',serif; font-size:1.4rem; font-weight:700; color:#fff; line-height:1; margin-bottom:3px; }
.adh-si-lbl { font-size:0.6rem; font-weight:600; color:rgba(255,210,150,0.5); text-transform:uppercase; letter-spacing:0.1em; }

/* ══ BODY ══════════════════════════════════════════════════════════ */
.adh-body { max-width:1300px; margin:0 auto; padding:24px 28px 60px; }

/* ══ SECTION HEADER ════════════════════════════════════════════════ */
.adh-sec { display:flex; align-items:center; justify-content:space-between; margin:28px 0 14px; }
.adh-sec-title {
  font-family:'Cinzel',serif; font-size:0.65rem; font-weight:700;
  color:#7a4a10; letter-spacing:0.2em; text-transform:uppercase;
  display:flex; align-items:center; gap:10px;
}
.adh-sec-title::before { content:''; width:18px; height:2px; background:linear-gradient(90deg,#c8903c,rgba(200,140,40,0.2)); border-radius:1px; }
.adh-sec-badge { font-size:0.64rem; font-weight:700; padding:2px 8px; border-radius:20px; }
.adh-badge-red  { background:rgba(220,38,38,0.1); color:#b91c1c; border:1px solid rgba(220,38,38,0.18); }
.adh-badge-gold { background:rgba(200,140,40,0.1); color:#7a4a00; border:1px solid rgba(200,140,40,0.18); }
.adh-badge-grn  { background:rgba(22,163,74,0.1);  color:#15803d; border:1px solid rgba(22,163,74,0.18); }

/* ══ CARDS ══════════════════════════════════════════════════════════ */
.adh-card {
  background:#fff; border:1px solid rgba(200,140,40,0.14);
  border-radius:16px; overflow:hidden;
  box-shadow:0 2px 12px rgba(61,23,0,0.05);
}
.adh-card-hd {
  padding:12px 18px; border-bottom:1px solid rgba(200,140,40,0.1);
  background:linear-gradient(to right,rgba(200,140,40,0.06),transparent);
  display:flex; align-items:center; justify-content:space-between;
}
.adh-card-title { font-family:'Cinzel',serif; font-size:0.68rem; font-weight:700; color:#5c3a14; letter-spacing:0.12em; text-transform:uppercase; display:flex; align-items:center; gap:6px; }
.adh-card-body  { padding:16px 18px; }

/* ══ GRIDS ══════════════════════════════════════════════════════════ */
.adh-g2  { display:grid; grid-template-columns:1fr 1fr;   gap:16px; margin-bottom:16px; }
.adh-g3  { display:grid; grid-template-columns:1fr 1fr 1fr; gap:16px; margin-bottom:16px; }
.adh-g4  { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; margin-bottom:16px; }
.adh-g32 { display:grid; grid-template-columns:2fr 1fr; gap:16px; margin-bottom:16px; }
.adh-gf  { margin-bottom:16px; }

/* ══ METRIC CARDS ══════════════════════════════════════════════════ */
.adh-metric {
  background:#fff; border:1px solid rgba(200,140,40,0.14); border-radius:14px;
  padding:16px 18px; position:relative; overflow:hidden;
  box-shadow:0 2px 8px rgba(61,23,0,0.04); transition:all 0.18s;
}
.adh-metric:hover { box-shadow:0 5px 18px rgba(61,23,0,0.09); transform:translateY(-2px); }
.adh-metric::before { content:''; position:absolute; top:0; left:0; right:0; height:3px; }
.adh-m-gold::before   { background:linear-gradient(90deg,#c8903c,#f5c842); }
.adh-m-green::before  { background:linear-gradient(90deg,#16a34a,#4ade80); }
.adh-m-purple::before { background:linear-gradient(90deg,#7c3aed,#a78bfa); }
.adh-m-blue::before   { background:linear-gradient(90deg,#0284c7,#38bdf8); }
.adh-m-red::before    { background:linear-gradient(90deg,#dc2626,#f87171); }
.adh-m-teal::before   { background:linear-gradient(90deg,#0891b2,#22d3ee); }
.adh-metric-ico { width:34px; height:34px; border-radius:9px; display:flex; align-items:center; justify-content:center; margin-bottom:10px; }
.adh-metric-val { font-family:'Cinzel',serif; font-size:1.7rem; font-weight:700; color:#2d1200; line-height:1; margin-bottom:3px; }
.adh-metric-lbl { font-size:0.68rem; font-weight:600; color:#8b6840; text-transform:uppercase; letter-spacing:0.06em; }
.adh-metric-sub { font-size:0.68rem; color:#a08060; margin-top:3px; }

/* ══ HEALTH BARS ═══════════════════════════════════════════════════ */
.adh-health-item { display:flex; align-items:center; gap:10px; padding:9px 0; border-bottom:1px solid rgba(200,140,40,0.07); }
.adh-health-item:last-child { border-bottom:none; }
.adh-h-ico { width:28px; height:28px; border-radius:7px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.adh-h-g { background:rgba(22,163,74,0.1);  color:#15803d; }
.adh-h-y { background:rgba(251,191,36,0.1); color:#92400e; }
.adh-h-r { background:rgba(220,38,38,0.08); color:#991b1b; }
.adh-h-lbl  { font-size:0.78rem; font-weight:600; color:#3d1800; flex:1; }
.adh-h-sub  { font-size:0.65rem; color:#a08060; }
.adh-h-bar  { width:80px; height:5px; background:rgba(200,140,40,0.1); border-radius:3px; overflow:hidden; flex-shrink:0; }
.adh-h-fill { height:100%; border-radius:3px; }
.adh-fill-g { background:linear-gradient(90deg,#16a34a,#4ade80); }
.adh-fill-y { background:linear-gradient(90deg,#d97706,#fbbf24); }
.adh-fill-r { background:linear-gradient(90deg,#dc2626,#f87171); }
.adh-fill-b { background:linear-gradient(90deg,#0284c7,#38bdf8); }
.adh-fill-p { background:linear-gradient(90deg,#7c3aed,#a78bfa); }
.adh-h-count { font-family:'Cinzel',serif; font-size:1rem; font-weight:700; color:#2d1200; width:28px; text-align:right; flex-shrink:0; }

/* ══ BAR CHARTS ════════════════════════════════════════════════════ */
.adh-bar-list { display:flex; flex-direction:column; gap:8px; }
.adh-bar-row  { display:flex; align-items:center; gap:8px; }
.adh-bar-lbl  { font-size:0.74rem; color:#5c3a14; width:100px; flex-shrink:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-weight:500; }
.adh-bar-track { flex:1; height:7px; background:rgba(200,140,40,0.1); border-radius:4px; overflow:hidden; }
.adh-bar-fill  { height:100%; border-radius:4px; transition:width 0.5s ease; }
.adh-bar-cnt   { font-size:0.7rem; font-weight:700; color:#5c3a14; width:22px; text-align:right; flex-shrink:0; }

/* ══ TREND SPARKLINE ════════════════════════════════════════════════ */
.adh-trend { display:flex; align-items:flex-end; gap:5px; height:68px; }
.adh-trend-col { flex:1; display:flex; flex-direction:column; align-items:center; gap:3px; }
.adh-trend-bar { width:100%; border-radius:3px 3px 0 0; min-height:3px; }
.adh-trend-lbl { font-size:0.55rem; color:#a08060; white-space:nowrap; }

/* ══ SYSTEM HEALTH ═════════════════════════════════════════════════ */
.adh-health-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; }
.adh-hc {
  padding:12px 14px; border-radius:12px; border:1px solid transparent;
  display:flex; align-items:flex-start; gap:10px;
}
.adh-hc-ok  { background:rgba(22,163,74,0.06);  border-color:rgba(22,163,74,0.15); }
.adh-hc-warn{ background:rgba(251,191,36,0.07); border-color:rgba(251,191,36,0.2); }
.adh-hc-err { background:rgba(220,38,38,0.06);  border-color:rgba(220,38,38,0.15); }
.adh-hc-ico { width:24px; height:24px; border-radius:6px; display:flex; align-items:center; justify-content:center; flex-shrink:0; margin-top:1px; }
.adh-hc-ok-ico   { background:rgba(22,163,74,0.12);  color:#15803d; }
.adh-hc-warn-ico { background:rgba(251,191,36,0.14); color:#92400e; }
.adh-hc-err-ico  { background:rgba(220,38,38,0.1);   color:#991b1b; }
.adh-hc-title { font-size:0.76rem; font-weight:700; color:#2d1200; margin-bottom:2px; }
.adh-hc-val   { font-size:0.7rem; color:#5c3a14; line-height:1.5; }

/* ══ TABLES ════════════════════════════════════════════════════════ */
.adh-tbl { width:100%; border-collapse:collapse; }
.adh-th  { padding:9px 12px; text-align:left; font-family:'Cinzel',serif; font-size:0.57rem; font-weight:700; color:#7a4a10; letter-spacing:0.14em; text-transform:uppercase; border-bottom:1.5px solid rgba(200,140,40,0.15); background:rgba(200,140,40,0.04); white-space:nowrap; }
.adh-tr  { border-bottom:1px solid rgba(200,140,40,0.07); transition:background 0.12s; }
.adh-tr:last-child { border-bottom:none; }
.adh-tr:hover { background:rgba(200,140,40,0.03); }
.adh-td  { padding:10px 12px; font-size:0.8rem; color:#3d1800; vertical-align:middle; }
.adh-key { font-family:'Cinzel',serif; font-size:0.73rem; font-weight:700; background:rgba(200,140,40,0.1); border:1px solid rgba(200,140,40,0.22); color:#7a3200; padding:2px 8px; border-radius:20px; white-space:nowrap; }
.adh-av  { width:28px; height:28px; border-radius:7px; background:linear-gradient(135deg,#c47a00,#7a3a00); display:flex; align-items:center; justify-content:center; font-family:'Cinzel',serif; font-size:0.6rem; font-weight:700; color:#fff; flex-shrink:0; }
.adh-pct { font-size:0.68rem; font-weight:700; padding:2px 8px; border-radius:20px; }
.adh-pct-g { background:rgba(22,163,74,0.1);  color:#15803d; }
.adh-pct-y { background:rgba(251,191,36,0.1); color:#92400e; }
.adh-pct-r { background:rgba(220,38,38,0.08); color:#991b1b; }
.adh-status-pill { font-size:0.65rem; font-weight:700; padding:2px 8px; border-radius:20px; }
.adh-sp-overdue   { background:rgba(220,38,38,0.1);  color:#b91c1c; }
.adh-sp-at-risk   { background:rgba(251,191,36,0.1); color:#92400e; }
.adh-sp-no-hist   { background:rgba(100,100,100,0.08); color:#6b7280; }
.adh-sp-healthy   { background:rgba(22,163,74,0.1);  color:#15803d; }

/* ══ RISK ITEM ════════════════════════════════════════════════════ */
.adh-risk-item { display:flex; align-items:center; gap:10px; padding:9px 0; border-bottom:1px solid rgba(200,140,40,0.07); }
.adh-risk-item:last-child { border-bottom:none; }
.adh-risk-pulse { width:7px; height:7px; border-radius:50%; flex-shrink:0; }
.adh-rp-r { background:#dc2626; animation:adhPulse 2s ease-in-out infinite; }
.adh-rp-y { background:#d97706; animation:adhPulse 2.5s ease-in-out infinite; }
.adh-rp-g { background:#6b7280; }
@keyframes adhPulse { 0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(220,38,38,0.4)} 50%{opacity:0.5;box-shadow:0 0 0 4px rgba(220,38,38,0)} }

/* ══ RECENT ════════════════════════════════════════════════════════ */
.adh-rec-item { display:flex; align-items:center; gap:10px; padding:8px 0; border-bottom:1px solid rgba(200,140,40,0.07); }
.adh-rec-item:last-child { border-bottom:none; }
.adh-rec-dot  { width:6px; height:6px; border-radius:50%; background:#c8903c; flex-shrink:0; }
.adh-rec-key  { font-family:'Cinzel',serif; font-size:0.73rem; font-weight:700; color:#2d1200; width:66px; flex-shrink:0; }
.adh-rec-host { font-size:0.74rem; color:#5c3a14; flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.adh-rec-type { font-size:0.63rem; color:#8b6840; background:rgba(200,140,40,0.08); padding:1px 6px; border-radius:20px; flex-shrink:0; }
.adh-rec-date { font-size:0.68rem; color:#a08060; flex-shrink:0; }

/* ══ ANNOUNCEMENT ═══════════════════════════════════════════════════ */
.adh-ann-form { padding:14px 18px; border-bottom:1px solid rgba(200,140,40,0.1); background:rgba(253,248,240,0.6); display:flex; flex-direction:column; gap:10px; }
.adh-ann-inp { padding:10px 14px; border:1.5px solid rgba(200,140,40,0.22); border-radius:10px; background:#fff; color:#2d1200; font-family:'DM Sans',sans-serif; font-size:0.875rem; outline:none; width:100%; box-sizing:border-box; transition:border-color 0.15s; }
.adh-ann-inp:focus { border-color:#c8903c; box-shadow:0 0 0 3px rgba(200,140,40,0.1); }
.adh-ann-inp::placeholder { color:#b09070; }
.adh-ann-row { display:flex; gap:8px; align-items:center; }
.adh-ann-sel { padding:9px 12px; border:1.5px solid rgba(200,140,40,0.22); border-radius:9px; background:#fff; color:#2d1200; font-family:'DM Sans',sans-serif; font-size:0.82rem; outline:none; cursor:pointer; flex-shrink:0; }
.adh-ann-sel:focus { border-color:#c8903c; }
.adh-ann-btn { padding:9px 16px; border:none; border-radius:9px; background:linear-gradient(135deg,#7a3200,#b85000); color:#fff; font-family:'DM Sans',sans-serif; font-size:0.82rem; font-weight:700; cursor:pointer; display:flex; align-items:center; gap:5px; transition:all 0.15s; flex-shrink:0; }
.adh-ann-btn:hover:not(:disabled) { background:linear-gradient(135deg,#8d3a00,#d06000); transform:translateY(-1px); }
.adh-ann-btn:disabled { opacity:0.5; cursor:not-allowed; transform:none; }
.adh-ann-list { max-height:260px; overflow-y:auto; }
.adh-ann-item { display:flex; align-items:flex-start; gap:10px; padding:10px 18px; border-bottom:1px solid rgba(200,140,40,0.07); transition:background 0.12s; }
.adh-ann-item:last-child { border-bottom:none; }
.adh-ann-item.inactive { opacity:0.45; }
.adh-ann-pri { width:7px; height:7px; border-radius:50%; flex-shrink:0; margin-top:6px; }
.adh-pri-high   { background:#dc2626; }
.adh-pri-medium { background:#d97706; }
.adh-pri-info   { background:#c8903c; }
.adh-ann-text { flex:1; font-size:0.8rem; color:#2d1200; line-height:1.5; }
.adh-ann-meta { font-size:0.65rem; color:#a08060; margin-top:2px; }
.adh-ann-acts { display:flex; gap:4px; flex-shrink:0; }
.adh-icon-btn { width:24px; height:24px; border:none; border-radius:6px; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all 0.14s; }
.adh-ib-eye { background:rgba(22,163,74,0.1); color:#15803d; }
.adh-ib-eye.off { background:rgba(100,100,100,0.08); color:#6b7280; }
.adh-ib-del { background:rgba(220,38,38,0.08); color:#dc2626; }
.adh-ib-del:hover { background:rgba(220,38,38,0.16); }
.adh-ib-eye:hover { background:rgba(22,163,74,0.18); }

/* ══ SPIN/SKEL ═════════════════════════════════════════════════════ */
.adh-skel { background:linear-gradient(90deg,rgba(200,140,40,0.07) 25%,rgba(200,140,40,0.14) 50%,rgba(200,140,40,0.07) 75%); background-size:200% 100%; animation:adhSkel 1.4s infinite; border-radius:7px; }
@keyframes adhSkel { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
.adh-spin { width:12px; height:12px; border-radius:50%; border:2px solid rgba(255,255,255,0.3); border-top-color:#fff; animation:adhSpin 0.7s linear infinite; }
@keyframes adhSpin { to{transform:rotate(360deg);} }

/* ══ EMPTY ══════════════════════════════════════════════════════════ */
.adh-empty { padding:20px; text-align:center; }
.adh-empty-ico { width:32px; height:32px; margin:0 auto 8px; color:#c4a880; opacity:0.6; }
.adh-empty-txt { font-size:0.76rem; color:#a08060; font-family:'Cinzel',serif; }

/* ══ RESPONSIVE ════════════════════════════════════════════════════ */
@media(max-width:1100px){ .adh-strip{grid-template-columns:repeat(3,1fr);} .adh-g4{grid-template-columns:repeat(2,1fr);} .adh-health-grid{grid-template-columns:repeat(2,1fr);} }
@media(max-width:860px) { .adh-g2,.adh-g32{grid-template-columns:1fr;} .adh-g3{grid-template-columns:1fr 1fr;} }
@media(max-width:600px) { .adh-strip{grid-template-columns:repeat(2,1fr);} .adh-g3,.adh-g4{grid-template-columns:1fr;} .adh-health-grid{grid-template-columns:1fr;} .adh-body{padding:16px 14px 60px;} .adh-inner{padding:0 14px;} }
`;

// ── SVGs ─────────────────────────────────────────────────────────────
const I = (p) => (
  <svg
    width={p.s || 14}
    height={p.s || 14}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={p.w || 2}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d={p.d} />
  </svg>
);
const IcoProg = () => (
  <I d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
);
const IcoUsers = () => (
  <I d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
);
const IcoChart = () => (
  <I d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
);
const IcoWarn = () => (
  <I d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
);
const IcoCheck = () => (
  <I d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
);
const IcoBell = () => (
  <I d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
);
const IcoPlus = () => <I d="M12 4.5v15m7.5-7.5h-15" w={2.5} s={13} />;
const IcoTrash = () => (
  <I
    d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
    s={12}
  />
);
const IcoEye = () => (
  <I
    d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178zM15 12a3 3 0 11-6 0 3 3 0 016 0z"
    s={12}
  />
);
const IcoEyeOff = () => (
  <I
    d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
    s={12}
  />
);
const IcoShield = () => (
  <I d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
);
const IcoClock = () => <I d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />;
const IcoServer = () => (
  <I d="M5.25 14.25h13.5m-13.5 0a3 3 0 01-3-3m3 3a3 3 0 100 6h13.5a3 3 0 100-6m-16.5-3a3 3 0 013-3h13.5a3 3 0 013 3m-19.5 0a4.5 4.5 0 01.9-2.7L5.737 5.1a3.375 3.375 0 012.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 01.9 2.7m0 0a3 3 0 01-3 3m0 3h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008zm-3 6h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008z" />
);

// helpers
function pctCls(p) {
  if (p === null || p === undefined) return "r";
  return p >= 80 ? "g" : p >= 40 ? "y" : "r";
}
function fmtDate(d) {
  if (!d) return "Never";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
function fmtShort(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}
function ini(name) {
  return (
    name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?"
  );
}
const BAR_COLORS = [
  "adh-fill-b",
  "adh-fill-p",
  "adh-fill-g",
  "adh-fill-y",
  "adh-fill-r",
  "adh-fill-b",
];

// skeleton
const Skel = () => (
  <>
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(6,1fr)",
        borderTop: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      {[...Array(6)].map((_, i) => (
        <div key={i} style={{ padding: "16px 20px" }}>
          <div
            className="adh-skel"
            style={{ height: 28, width: "50%", marginBottom: 8 }}
          />
          <div className="adh-skel" style={{ height: 10, width: "70%" }} />
        </div>
      ))}
    </div>
    <div style={{ padding: "24px 28px" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4,1fr)",
          gap: 14,
          marginBottom: 20,
        }}
      >
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="adh-skel"
            style={{ height: 90, borderRadius: 14 }}
          />
        ))}
      </div>
      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}
      >
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="adh-skel"
            style={{ height: 180, borderRadius: 16 }}
          />
        ))}
      </div>
    </div>
  </>
);

// ─────────────────────────────────────────────────────────────────────
export default function AdminHome() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const firstName = user?.name?.split(" ")[0] || "Admin";

  const [d, setD] = useState(null);
  const [loading, setLoading] = useState(true);
  const [anns, setAnns] = useState([]);
  const [annL, setAnnL] = useState(true);
  const [annTxt, setAnnTxt] = useState("");
  const [annPri, setAnnPri] = useState("info");
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    api
      .get("/dashboard/admin")
      .then((r) => setD(r.data))
      .catch(() => toast.error("Failed to load dashboard."))
      .finally(() => setLoading(false));
    api
      .get("/announcements/all")
      .then((r) => setAnns(r.data.announcements || []))
      .catch(() => {})
      .finally(() => setAnnL(false));
  }, []);

  const postAnn = async () => {
    if (!annTxt.trim()) {
      toast.error("Text required.");
      return;
    }
    setPosting(true);
    try {
      const res = await api.post("/announcements", {
        text: annTxt.trim(),
        priority: annPri,
      });
      setAnns((p) => [res.data.announcement, ...p]);
      setAnnTxt("");
      toast.success("Published.");
    } catch {
      toast.error("Failed.");
    } finally {
      setPosting(false);
    }
  };
  const toggleAnn = async (id) => {
    try {
      const r = await api.patch(`/announcements/${id}/toggle`);
      setAnns((p) => p.map((a) => (a._id === id ? r.data.announcement : a)));
    } catch {
      toast.error("Failed.");
    }
  };
  const delAnn = async (id) => {
    try {
      await api.delete(`/announcements/${id}`);
      setAnns((p) => p.filter((a) => a._id !== id));
      toast.success("Deleted.");
    } catch {
      toast.error("Failed.");
    }
  };

  const hr = new Date().getHours();
  const greet =
    hr < 12 ? "Good morning" : hr < 17 ? "Good afternoon" : "Good evening";
  const sh = d?.systemHealth;

  return (
    <>
      <style>{css}</style>
      <div className="adh">
        {/* ══ HERO ══════════════════════════════════════════════════ */}
        <div className="adh-hero">
          <div className="adh-inner">
            <div className="adh-hero-row">
              <div>
                <div className="adh-eyebrow">
                  {user?.isSuperAdmin ? "Super Admin" : "Admin"} Portal
                </div>
                <h1 className="adh-name">
                  {greet}, <em>{firstName}</em>
                  {user?.isSuperAdmin ? " ⭐" : ""}
                </h1>
                <p className="adh-sub">
                  Live system analytics. All data is computed in real-time.
                </p>
              </div>
              <div className="adh-btns">
                <div
                  className="adh-btn adh-btn-gold"
                  onClick={() => navigate("/admin/create-owner")}
                >
                  <IcoUsers />
                  Create Owner
                </div>
                <div
                  className="adh-btn adh-btn-ghost"
                  onClick={() => navigate("/admin/users")}
                >
                  <IcoUsers />
                  Manage Users
                </div>
                <div
                  className="adh-btn adh-btn-ghost"
                  onClick={() => navigate("/admin/config")}
                >
                  <IcoServer />
                  Config
                </div>
              </div>
            </div>
            <div className="adh-strip">
              {[
                {
                  c: "adh-si-0",
                  v: loading ? "—" : d?.totalPrograms,
                  l: "Active Programs",
                },
                {
                  c: "adh-si-1",
                  v: loading ? "—" : d?.totalDevotees,
                  l: "Total Devotees",
                },
                {
                  c: "adh-si-2",
                  v: loading ? "—" : d?.totalOwners,
                  l: "Program Owners",
                },
                {
                  c: "adh-si-3",
                  v: loading ? "—" : d?.monthSessions,
                  l: "Sessions / Month",
                },
                {
                  c: "adh-si-4",
                  v: loading ? "—" : `${d?.avgAttendance ?? 0}%`,
                  l: "Avg Attendance",
                },
                {
                  c: "adh-si-5",
                  v: loading ? "—" : d?.submissionsToday,
                  l: "Submissions Today",
                },
              ].map((s, i) => (
                <div key={i} className={`adh-si ${s.c}`}>
                  <div className="adh-si-val">{s.v}</div>
                  <div className="adh-si-lbl">{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="adh-body">
          {/* ══ SUPERADMIN: PENDING DEACTIVATION BANNER ═══════════
              Renders automatically only for superadmin.
              Appears immediately on dashboard load — no need to
              check notifications separately.
              Auto-hides when queue is empty.                     */}
          {user?.isSuperAdmin && <PendingDeactivations />}

          {loading ? (
            <Skel />
          ) : (
            <>
              {/* ══ KEY METRICS ═══════════════════════════════════════ */}
              <div className="adh-sec">
                <span className="adh-sec-title">Key Metrics</span>
              </div>
              <div className="adh-g4">
                {[
                  {
                    col: "adh-m-gold",
                    bg: "rgba(200,140,40,0.1)",
                    ico: <IcoProg />,
                    val: d?.totalPrograms,
                    lbl: "Active Programs",
                    sub: `${d?.disabledPrograms || 0} disabled`,
                  },
                  {
                    col: "adh-m-green",
                    bg: "rgba(22,163,74,0.1)",
                    ico: <IcoUsers />,
                    val: d?.totalDevotees,
                    lbl: "Total Devotees",
                    sub: `+${d?.newDevoteesWeek || 0} this week`,
                  },
                  {
                    col: "adh-m-purple",
                    bg: "rgba(124,58,237,0.1)",
                    ico: <IcoUsers />,
                    val: d?.totalOwners,
                    lbl: "Active Owners",
                    sub: `${
                      d?.ownerCounts?.needsAttention || 0
                    } need attention`,
                  },
                  {
                    col: "adh-m-blue",
                    bg: "rgba(2,132,199,0.1)",
                    ico: <IcoChart />,
                    val: d?.submissionsWeek,
                    lbl: "Submissions / Week",
                    sub: `${d?.submissionsToday || 0} today`,
                  },
                  {
                    col: "adh-m-teal",
                    bg: "rgba(8,145,178,0.1)",
                    ico: <IcoProg />,
                    val: `${d?.avgAttendance ?? 0}%`,
                    lbl: "Avg Attendance",
                    sub: `${d?.totalSummaryRecords || 0} records`,
                  },
                  {
                    col: "adh-m-red",
                    bg: "rgba(220,38,38,0.08)",
                    ico: <IcoWarn />,
                    val: d?.programCounts?.overdue || 0,
                    lbl: "Overdue Programs",
                    sub: `${d?.programCounts?.noHistory || 0} no history`,
                  },
                  {
                    col: "adh-m-gold",
                    bg: "rgba(200,140,40,0.1)",
                    ico: <IcoClock />,
                    val: d?.programCounts?.newThisWeek || 0,
                    lbl: "New This Week",
                    sub: `${d?.programCounts?.recentDisabled || 0} disabled`,
                  },
                  {
                    col: "adh-m-green",
                    bg: "rgba(22,163,74,0.1)",
                    ico: <IcoUsers />,
                    val: d?.devoteeCounts?.newThisWeek || 0,
                    lbl: "New Devotees",
                    sub: `${d?.devoteeCounts?.missingContact || 0} no contact`,
                  },
                ].map((m, i) => (
                  <div key={i} className={`adh-metric ${m.col}`}>
                    <div
                      className="adh-metric-ico"
                      style={{ background: m.bg, color: "inherit" }}
                    >
                      {m.ico}
                    </div>
                    <div className="adh-metric-val">{m.val}</div>
                    <div className="adh-metric-lbl">{m.lbl}</div>
                    <div className="adh-metric-sub">{m.sub}</div>
                  </div>
                ))}
              </div>

              {/* ══ SYSTEM HEALTH ═════════════════════════════════════ */}
              <div className="adh-sec">
                <span className="adh-sec-title">
                  <IcoShield />
                  System Health
                </span>
                {sh?.orphanDevotees > 0 ||
                sh?.duplicateConfigs?.length > 0 ||
                sh?.missingConfigs?.length > 0 ? (
                  <span className="adh-sec-badge adh-badge-red">
                    Issues Detected
                  </span>
                ) : (
                  <span className="adh-sec-badge adh-badge-grn">
                    All Healthy
                  </span>
                )}
              </div>
              <div className="adh-g2">
                <div className="adh-card">
                  <div className="adh-card-hd">
                    <span className="adh-card-title">
                      <IcoServer />
                      Operational Status
                    </span>
                  </div>
                  <div className="adh-card-body">
                    <div className="adh-health-grid">
                      {[
                        {
                          state: "ok",
                          title: "Database",
                          val:
                            sh?.dbStatus === "connected"
                              ? "Connected — Operational"
                              : "Disconnected",
                        },
                        {
                          state: sh?.lastAttendanceSubmission ? "ok" : "warn",
                          title: "Last Attendance",
                          val: fmtDate(sh?.lastAttendanceSubmission),
                        },
                        {
                          state: sh?.lastReminderSent ? "ok" : "warn",
                          title: "Last Reminder Sent",
                          val: sh?.lastReminderSent
                            ? fmtDate(sh.lastReminderSent)
                            : "Never run",
                        },
                        {
                          state: sh?.totalRemindersSent > 0 ? "ok" : "warn",
                          title: "Total Reminders Sent",
                          val: `${sh?.totalRemindersSent || 0} total`,
                        },
                        {
                          state: sh?.orphanDevotees > 0 ? "err" : "ok",
                          title: "Orphan Devotees",
                          val:
                            sh?.orphanDevotees > 0
                              ? `${sh.orphanDevotees} orphan records found`
                              : "None — Clean",
                        },
                        {
                          state: sh?.incompleteSetupCount > 0 ? "warn" : "ok",
                          title: "Incomplete Programs",
                          val:
                            sh?.incompleteSetupCount > 0
                              ? `${sh.incompleteSetupCount} programs incomplete`
                              : "All complete",
                        },
                      ].map((hc, i) => (
                        <div key={i} className={`adh-hc adh-hc-${hc.state}`}>
                          <div className={`adh-hc-ico adh-hc-${hc.state}-ico`}>
                            {hc.state === "ok" ? <IcoCheck /> : <IcoWarn />}
                          </div>
                          <div>
                            <div className="adh-hc-title">{hc.title}</div>
                            <div className="adh-hc-val">{hc.val}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="adh-card">
                  <div className="adh-card-hd">
                    <span className="adh-card-title">
                      <IcoWarn />
                      Config Warnings
                    </span>
                  </div>
                  <div className="adh-card-body">
                    {sh?.missingConfigs?.length > 0 && (
                      <div style={{ marginBottom: 14 }}>
                        <div
                          style={{
                            fontSize: "0.72rem",
                            fontWeight: 700,
                            color: "#b91c1c",
                            marginBottom: 6,
                          }}
                        >
                          Missing Config Types
                        </div>
                        {sh.missingConfigs.map((c) => (
                          <div
                            key={c}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 7,
                              padding: "5px 0",
                              borderBottom: "1px solid rgba(200,140,40,0.07)",
                            }}
                          >
                            <span
                              style={{
                                width: 6,
                                height: 6,
                                borderRadius: "50%",
                                background: "#dc2626",
                                flexShrink: 0,
                              }}
                            />
                            <span
                              style={{
                                fontSize: "0.78rem",
                                color: "#3d1800",
                                fontWeight: 600,
                              }}
                            >
                              {c}
                            </span>
                            <span
                              style={{
                                fontSize: "0.68rem",
                                color: "#b91c1c",
                                marginLeft: "auto",
                              }}
                            >
                              Empty
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    {sh?.duplicateConfigs?.length > 0 && (
                      <div style={{ marginBottom: 14 }}>
                        <div
                          style={{
                            fontSize: "0.72rem",
                            fontWeight: 700,
                            color: "#92400e",
                            marginBottom: 6,
                          }}
                        >
                          Duplicate Config Values
                        </div>
                        {sh.duplicateConfigs.map((c) => (
                          <div
                            key={c}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 7,
                              padding: "5px 0",
                              borderBottom: "1px solid rgba(200,140,40,0.07)",
                            }}
                          >
                            <span
                              style={{
                                width: 6,
                                height: 6,
                                borderRadius: "50%",
                                background: "#d97706",
                                flexShrink: 0,
                              }}
                            />
                            <span
                              style={{
                                fontSize: "0.78rem",
                                color: "#3d1800",
                                fontWeight: 600,
                              }}
                            >
                              {c}
                            </span>
                            <span
                              style={{
                                fontSize: "0.68rem",
                                color: "#d97706",
                                marginLeft: "auto",
                              }}
                            >
                              Has duplicates
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    {!sh?.missingConfigs?.length &&
                      !sh?.duplicateConfigs?.length && (
                        <div className="adh-empty">
                          <div className="adh-empty-ico">
                            <IcoCheck />
                          </div>
                          <p
                            className="adh-empty-txt"
                            style={{ color: "#15803d" }}
                          >
                            All config clean
                          </p>
                        </div>
                      )}
                    <div
                      style={{
                        marginTop: 12,
                        padding: "10px 12px",
                        background: "rgba(200,140,40,0.05)",
                        borderRadius: 10,
                        border: "1px solid rgba(200,140,40,0.1)",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "0.7rem",
                          fontWeight: 700,
                          color: "#7a4a00",
                          marginBottom: 4,
                        }}
                      >
                        Devotee Data Quality
                      </div>
                      {[
                        {
                          lbl: "Missing Phone",
                          cnt: d?.devoteeCounts?.missingPhone || 0,
                          max: d?.totalDevotees || 1,
                        },
                        {
                          lbl: "Missing Email",
                          cnt: d?.devoteeCounts?.missingEmail || 0,
                          max: d?.totalDevotees || 1,
                        },
                      ].map((q) => (
                        <div
                          key={q.lbl}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            marginTop: 6,
                          }}
                        >
                          <span
                            style={{
                              fontSize: "0.7rem",
                              color: "#5c3a14",
                              width: 90,
                              flexShrink: 0,
                            }}
                          >
                            {q.lbl}
                          </span>
                          <div
                            style={{
                              flex: 1,
                              height: 5,
                              background: "rgba(200,140,40,0.1)",
                              borderRadius: 3,
                              overflow: "hidden",
                            }}
                          >
                            <div
                              className="adh-fill-r"
                              style={{
                                height: "100%",
                                borderRadius: 3,
                                width: `${Math.min(
                                  100,
                                  Math.round((q.cnt / q.max) * 100)
                                )}%`,
                              }}
                            />
                          </div>
                          <span
                            style={{
                              fontSize: "0.7rem",
                              fontWeight: 700,
                              color: "#b91c1c",
                              width: 20,
                              textAlign: "right",
                            }}
                          >
                            {q.cnt}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* ══ DEVOTEE HEALTH + ATTENDANCE OPS ══════════════════ */}
              <div className="adh-sec">
                <span className="adh-sec-title">
                  Devotee Health &amp; Attendance Ops
                </span>
              </div>
              <div className="adh-g3">
                <div className="adh-card">
                  <div className="adh-card-hd">
                    <span className="adh-card-title">
                      <IcoUsers />
                      Devotee Health
                    </span>
                  </div>
                  <div className="adh-card-body">
                    {[
                      {
                        ico: <IcoCheck />,
                        cls: "adh-h-g",
                        fill: "adh-fill-g",
                        lbl: "Active",
                        sub: "≥80%",
                        cnt: d?.health?.active || 0,
                      },
                      {
                        ico: <IcoChart />,
                        cls: "adh-h-y",
                        fill: "adh-fill-y",
                        lbl: "Moderate",
                        sub: "40–79%",
                        cnt: d?.health?.moderate || 0,
                      },
                      {
                        ico: <IcoWarn />,
                        cls: "adh-h-r",
                        fill: "adh-fill-r",
                        lbl: "Inactive",
                        sub: "<40%",
                        cnt: d?.health?.inactive || 0,
                      },
                    ].map((h) => {
                      const tot = d?.totalSummaryRecords || 1;
                      return (
                        <div key={h.lbl} className="adh-health-item">
                          <div className={`adh-h-ico ${h.cls}`}>{h.ico}</div>
                          <div style={{ flex: 1 }}>
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                marginBottom: 3,
                              }}
                            >
                              <span className="adh-h-lbl">
                                {h.lbl}{" "}
                                <span className="adh-h-sub">{h.sub}</span>
                              </span>
                            </div>
                            <div className="adh-h-bar">
                              <div
                                className={`adh-h-fill ${h.fill}`}
                                style={{
                                  width: `${Math.round((h.cnt / tot) * 100)}%`,
                                }}
                              />
                            </div>
                          </div>
                          <span className="adh-h-count">{h.cnt}</span>
                        </div>
                      );
                    })}
                    <div
                      style={{
                        marginTop: 14,
                        borderTop: "1px solid rgba(200,140,40,0.08)",
                        paddingTop: 10,
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <span style={{ fontSize: "0.72rem", color: "#8b6840" }}>
                        System avg
                      </span>
                      <span
                        style={{
                          fontFamily: "'Cinzel',serif",
                          fontSize: "1.1rem",
                          fontWeight: 700,
                          color: "#2d1200",
                        }}
                      >
                        {d?.avgAttendance}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="adh-card">
                  <div className="adh-card-hd">
                    <span className="adh-card-title">
                      <IcoProg />
                      Attendance Ops
                    </span>
                  </div>
                  <div className="adh-card-body">
                    {[
                      {
                        lbl: "Submissions Today",
                        val: d?.attendanceOps?.submissionsToday || 0,
                        state: "ok",
                      },
                      {
                        lbl: "Submissions This Week",
                        val: d?.attendanceOps?.submissionsWeek || 0,
                        state: "ok",
                      },
                      {
                        lbl: "Programs Not Marked This Week",
                        val: d?.attendanceOps?.notMarkedThisWeek || 0,
                        state:
                          d?.attendanceOps?.notMarkedThisWeek > 0
                            ? "err"
                            : "ok",
                      },
                      {
                        lbl: "Repeated Absentees",
                        val: d?.attendanceOps?.repeatedAbsentees || 0,
                        state:
                          d?.attendanceOps?.repeatedAbsentees > 0
                            ? "warn"
                            : "ok",
                      },
                      {
                        lbl: "BV Missing Chapter",
                        val: d?.attendanceOps?.bvMissingChapter || 0,
                        state:
                          d?.attendanceOps?.bvMissingChapter > 0
                            ? "warn"
                            : "ok",
                      },
                      {
                        lbl: "Host Name Missing",
                        val: d?.attendanceOps?.hostMissing || 0,
                        state:
                          d?.attendanceOps?.hostMissing > 0 ? "warn" : "ok",
                      },
                    ].map((op) => (
                      <div
                        key={op.lbl}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "7px 0",
                          borderBottom: "1px solid rgba(200,140,40,0.07)",
                        }}
                      >
                        <div
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            flexShrink: 0,
                            background:
                              op.state === "ok"
                                ? "#16a34a"
                                : op.state === "warn"
                                ? "#d97706"
                                : "#dc2626",
                          }}
                        />
                        <span
                          style={{
                            flex: 1,
                            fontSize: "0.76rem",
                            color: "#3d1800",
                            fontWeight: 500,
                          }}
                        >
                          {op.lbl}
                        </span>
                        <span
                          style={{
                            fontFamily: "'Cinzel',serif",
                            fontSize: "0.9rem",
                            fontWeight: 700,
                            color:
                              op.state === "ok"
                                ? "#2d1200"
                                : op.state === "warn"
                                ? "#92400e"
                                : "#b91c1c",
                          }}
                        >
                          {op.val}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="adh-card">
                  <div className="adh-card-hd">
                    <span className="adh-card-title">
                      <IcoChart />
                      Last 7 Days
                    </span>
                  </div>
                  <div className="adh-card-body">
                    {d?.last7Days?.length
                      ? (() => {
                          const max = Math.max(
                            ...d.last7Days.map((x) => x.count),
                            1
                          );
                          return (
                            <div className="adh-trend">
                              {d.last7Days.map((day, i) => (
                                <div key={i} className="adh-trend-col">
                                  <div
                                    style={{
                                      fontFamily: "'Cinzel',serif",
                                      fontSize: "0.6rem",
                                      fontWeight: 700,
                                      color: "#5c3a14",
                                    }}
                                  >
                                    {day.count}
                                  </div>
                                  <div
                                    className="adh-trend-bar adh-fill-b"
                                    style={{
                                      height: `${Math.max(
                                        4,
                                        (day.count / max) * 56
                                      )}px`,
                                    }}
                                  />
                                  <div className="adh-trend-lbl">
                                    {day.label}
                                  </div>
                                </div>
                              ))}
                            </div>
                          );
                        })()
                      : null}
                    <div
                      style={{
                        marginTop: 16,
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 8,
                      }}
                    >
                      {[
                        { lbl: "This Week", val: d?.submissionsWeek || 0 },
                        { lbl: "This Month", val: d?.monthSessions || 0 },
                      ].map((s) => (
                        <div
                          key={s.lbl}
                          style={{
                            flex: 1,
                            minWidth: 80,
                            padding: "10px",
                            background: "rgba(200,140,40,0.05)",
                            borderRadius: 10,
                            border: "1px solid rgba(200,140,40,0.12)",
                            textAlign: "center",
                          }}
                        >
                          <div
                            style={{
                              fontFamily: "'Cinzel',serif",
                              fontSize: "1.3rem",
                              fontWeight: 700,
                              color: "#2d1200",
                            }}
                          >
                            {s.val}
                          </div>
                          <div
                            style={{
                              fontSize: "0.66rem",
                              fontWeight: 600,
                              color: "#8b6840",
                              textTransform: "uppercase",
                              letterSpacing: "0.06em",
                            }}
                          >
                            {s.lbl}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* ══ PROGRAM OVERSIGHT ════════════════════════════════ */}
              <div className="adh-sec">
                <span className="adh-sec-title">
                  <IcoProg />
                  Program Oversight
                </span>
                {(d?.programCounts?.overdue || 0) +
                  (d?.programCounts?.noHistory || 0) >
                0 ? (
                  <span className="adh-sec-badge adh-badge-red">
                    {(d?.programCounts?.overdue || 0) +
                      (d?.programCounts?.noHistory || 0)}{" "}
                    need attention
                  </span>
                ) : (
                  <span className="adh-sec-badge adh-badge-grn">
                    All healthy
                  </span>
                )}
              </div>
              <div className="adh-g3">
                <div className="adh-card">
                  <div className="adh-card-hd">
                    <span className="adh-card-title">Programs by Status</span>
                  </div>
                  <div className="adh-card-body">
                    {[
                      {
                        lbl: "Active & Healthy",
                        cnt:
                          d?.totalPrograms -
                          (d?.programCounts?.overdue || 0) -
                          (d?.programCounts?.atRisk || 0) -
                          (d?.programCounts?.noHistory || 0),
                        col: "#15803d",
                        bg: "rgba(22,163,74,0.1)",
                      },
                      {
                        lbl: "At Risk",
                        cnt: d?.programCounts?.atRisk || 0,
                        col: "#92400e",
                        bg: "rgba(251,191,36,0.1)",
                      },
                      {
                        lbl: "Overdue",
                        cnt: d?.programCounts?.overdue || 0,
                        col: "#b91c1c",
                        bg: "rgba(220,38,38,0.08)",
                      },
                      {
                        lbl: "No History",
                        cnt: d?.programCounts?.noHistory || 0,
                        col: "#6b7280",
                        bg: "rgba(100,100,100,0.08)",
                      },
                      {
                        lbl: "New This Week",
                        cnt: d?.programCounts?.newThisWeek || 0,
                        col: "#0284c7",
                        bg: "rgba(2,132,199,0.1)",
                      },
                      {
                        lbl: "Recently Disabled",
                        cnt: d?.programCounts?.recentDisabled || 0,
                        col: "#7c3aed",
                        bg: "rgba(124,58,237,0.1)",
                      },
                    ].map((s) => (
                      <div
                        key={s.lbl}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "7px 0",
                          borderBottom: "1px solid rgba(200,140,40,0.07)",
                        }}
                      >
                        <div
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 7,
                            background: s.bg,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <span
                            style={{
                              fontFamily: "'Cinzel',serif",
                              fontSize: "0.72rem",
                              fontWeight: 700,
                              color: s.col,
                            }}
                          >
                            {s.cnt}
                          </span>
                        </div>
                        <span
                          style={{
                            flex: 1,
                            fontSize: "0.76rem",
                            color: "#3d1800",
                            fontWeight: 500,
                          }}
                        >
                          {s.lbl}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="adh-card">
                  <div className="adh-card-hd">
                    <span className="adh-card-title">Programs by Type</span>
                  </div>
                  <div className="adh-card-body">
                    {d?.byType?.length ? (
                      (() => {
                        const max = Math.max(
                          ...d.byType.map((t) => t.count),
                          1
                        );
                        return (
                          <div className="adh-bar-list">
                            {d.byType.map((t, i) => (
                              <div key={t._id} className="adh-bar-row">
                                <span className="adh-bar-lbl" title={t._id}>
                                  {t._id || "Unknown"}
                                </span>
                                <div className="adh-bar-track">
                                  <div
                                    className={`adh-bar-fill ${
                                      BAR_COLORS[i % BAR_COLORS.length]
                                    }`}
                                    style={{
                                      width: `${Math.round(
                                        (t.count / max) * 100
                                      )}%`,
                                    }}
                                  />
                                </div>
                                <span className="adh-bar-cnt">{t.count}</span>
                              </div>
                            ))}
                          </div>
                        );
                      })()
                    ) : (
                      <div className="adh-empty">
                        <p className="adh-empty-txt">No data</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="adh-card">
                  <div className="adh-card-hd">
                    <span className="adh-card-title">
                      By Frequency &amp; Area
                    </span>
                  </div>
                  <div className="adh-card-body">
                    <div
                      style={{
                        fontSize: "0.66rem",
                        fontWeight: 700,
                        color: "#a08060",
                        textTransform: "uppercase",
                        letterSpacing: "0.12em",
                        marginBottom: 8,
                      }}
                    >
                      Frequency
                    </div>
                    {d?.byFreq?.map((f, i) => (
                      <div
                        key={f._id}
                        className="adh-bar-row"
                        style={{ marginBottom: 6 }}
                      >
                        <span className="adh-bar-lbl">
                          {f._id || "Unknown"}
                        </span>
                        <div className="adh-bar-track">
                          <div
                            className={`adh-bar-fill ${
                              BAR_COLORS[(i + 1) % BAR_COLORS.length]
                            }`}
                            style={{
                              width: `${Math.round(
                                (f.count /
                                  Math.max(
                                    ...(d?.byFreq || []).map((x) => x.count),
                                    1
                                  )) *
                                  100
                              )}%`,
                            }}
                          />
                        </div>
                        <span className="adh-bar-cnt">{f.count}</span>
                      </div>
                    ))}
                    <div
                      style={{
                        fontSize: "0.66rem",
                        fontWeight: 700,
                        color: "#a08060",
                        textTransform: "uppercase",
                        letterSpacing: "0.12em",
                        marginTop: 14,
                        marginBottom: 8,
                      }}
                    >
                      Top Areas
                    </div>
                    {d?.byArea?.slice(0, 4).map((a, i) => (
                      <div
                        key={a._id}
                        className="adh-bar-row"
                        style={{ marginBottom: 6 }}
                      >
                        <span className="adh-bar-lbl">
                          {a._id || "Unknown"}
                        </span>
                        <div className="adh-bar-track">
                          <div
                            className={`adh-bar-fill ${
                              BAR_COLORS[(i + 2) % BAR_COLORS.length]
                            }`}
                            style={{
                              width: `${Math.round(
                                (a.count /
                                  Math.max(
                                    ...(d?.byArea || []).map((x) => x.count),
                                    1
                                  )) *
                                  100
                              )}%`,
                            }}
                          />
                        </div>
                        <span className="adh-bar-cnt">{a.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* At-risk programs table */}
              {d?.atRiskPrograms?.length > 0 && (
                <div className="adh-g32">
                  <div className="adh-card">
                    <div className="adh-card-hd">
                      <span className="adh-card-title">
                        <IcoWarn />
                        Programs Needing Attention
                      </span>
                      <span className="adh-sec-badge adh-badge-red">
                        {d.atRiskPrograms.length}
                      </span>
                    </div>
                    <div style={{ overflowX: "auto" }}>
                      <table className="adh-tbl" style={{ minWidth: 520 }}>
                        <thead>
                          <tr>
                            {[
                              "Program",
                              "Type",
                              "Freq.",
                              "Area",
                              "Owner",
                              "Days",
                              "Status",
                            ].map((c) => (
                              <th key={c} className="adh-th">
                                {c}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {d.atRiskPrograms.map((p) => (
                            <tr key={String(p.programId)} className="adh-tr">
                              <td className="adh-td">
                                <span className="adh-key">{p.programKey}</span>
                              </td>
                              <td
                                className="adh-td"
                                style={{
                                  fontSize: "0.72rem",
                                  color: "#8b6840",
                                }}
                              >
                                {p.programType}
                              </td>
                              <td
                                className="adh-td"
                                style={{
                                  fontSize: "0.72rem",
                                  color: "#8b6840",
                                }}
                              >
                                {p.frequency}
                              </td>
                              <td
                                className="adh-td"
                                style={{
                                  fontSize: "0.72rem",
                                  color: "#8b6840",
                                }}
                              >
                                {p.area}
                              </td>
                              <td
                                className="adh-td"
                                style={{
                                  fontSize: "0.72rem",
                                  color: "#5c3a14",
                                }}
                              >
                                {p.ownerName}
                              </td>
                              <td
                                className="adh-td"
                                style={{
                                  fontFamily: "'Cinzel',serif",
                                  fontWeight: 700,
                                  fontSize: "0.84rem",
                                  color:
                                    p.days === null ? "#6b7280" : "#b91c1c",
                                }}
                              >
                                {p.days === null ? "Never" : `${p.days}d`}
                              </td>
                              <td className="adh-td">
                                <span
                                  className={`adh-status-pill adh-sp-${p.status
                                    .replace("-", "")
                                    .replace(" ", "")}`}
                                >
                                  {p.status === "no-history"
                                    ? "No History"
                                    : p.status === "at-risk"
                                    ? "At Risk"
                                    : p.status === "overdue"
                                    ? "Overdue"
                                    : "Healthy"}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="adh-card">
                    <div className="adh-card-hd">
                      <span className="adh-card-title">Top Programs</span>
                    </div>
                    <div
                      className="adh-card-body"
                      style={{ padding: "10px 14px" }}
                    >
                      {d?.topPrograms?.map((p, i) => (
                        <div
                          key={String(p._id)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            padding: "9px 0",
                            borderBottom: "1px solid rgba(200,140,40,0.07)",
                          }}
                        >
                          <div
                            style={{
                              width: 20,
                              height: 20,
                              borderRadius: 5,
                              background:
                                "linear-gradient(135deg,#c47a00,#7a3a00)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "0.58rem",
                              fontWeight: 700,
                              color: "#fff",
                              fontFamily: "'Cinzel',serif",
                              flexShrink: 0,
                            }}
                          >
                            {i + 1}
                          </div>
                          <span
                            style={{
                              fontFamily: "'Cinzel',serif",
                              fontSize: "0.76rem",
                              fontWeight: 700,
                              color: "#2d1200",
                              flex: 1,
                            }}
                          >
                            {p.programKey}
                          </span>
                          <span
                            style={{ fontSize: "0.68rem", color: "#8b6840" }}
                          >
                            {p.programType}
                          </span>
                          <span
                            className={`adh-pct adh-pct-${pctCls(
                              Math.round(p.avgPct)
                            )}`}
                          >
                            {Math.round(p.avgPct)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ══ OWNER OVERSIGHT ══════════════════════════════════ */}
              <div className="adh-sec">
                <span className="adh-sec-title">
                  <IcoUsers />
                  Owner Oversight
                </span>
                {d?.ownerCounts?.needsAttention > 0 && (
                  <span className="adh-sec-badge adh-badge-red">
                    {d.ownerCounts.needsAttention} need attention
                  </span>
                )}
              </div>
              <div className="adh-gf">
                <div className="adh-card">
                  <div className="adh-card-hd">
                    <span className="adh-card-title">Owner Activity Table</span>
                  </div>
                  <div style={{ overflowX: "auto" }}>
                    <table className="adh-tbl" style={{ minWidth: 700 }}>
                      <thead>
                        <tr>
                          {[
                            "Owner",
                            "Programs",
                            "Active",
                            "Avg Att.",
                            "Last Session",
                            "Overdue",
                            "Reminders",
                            "Status",
                          ].map((c) => (
                            <th key={c} className="adh-th">
                              {c}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {d?.ownerActivity?.map((o) => (
                          <tr key={String(o.ownerId)} className="adh-tr">
                            <td className="adh-td">
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 8,
                                }}
                              >
                                <div className="adh-av">{ini(o.ownerName)}</div>
                                <div>
                                  <div
                                    style={{
                                      fontWeight: 600,
                                      fontSize: "0.8rem",
                                      color: "#2d1200",
                                    }}
                                  >
                                    {o.ownerName}
                                  </div>
                                  <div
                                    style={{
                                      fontSize: "0.68rem",
                                      color: "#a08060",
                                    }}
                                  >
                                    {o.ownerEmail}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="adh-td">
                              <span
                                style={{
                                  fontFamily: "'Cinzel',serif",
                                  fontWeight: 700,
                                }}
                              >
                                {o.programCount}
                              </span>
                            </td>
                            <td className="adh-td">
                              <span
                                style={{
                                  fontFamily: "'Cinzel',serif",
                                  fontWeight: 700,
                                  color: "#15803d",
                                }}
                              >
                                {o.activeCount}
                              </span>
                            </td>
                            <td className="adh-td">
                              {o.avgAttendance !== null ? (
                                <span
                                  className={`adh-pct adh-pct-${pctCls(
                                    o.avgAttendance
                                  )}`}
                                >
                                  {o.avgAttendance}%
                                </span>
                              ) : (
                                <span
                                  style={{
                                    color: "#a08060",
                                    fontSize: "0.74rem",
                                  }}
                                >
                                  —
                                </span>
                              )}
                            </td>
                            <td className="adh-td">
                              <span
                                style={{
                                  fontSize: "0.72rem",
                                  color: "#a08060",
                                }}
                              >
                                {fmtShort(o.lastSession)}
                              </span>
                            </td>
                            <td className="adh-td">
                              <span
                                style={{
                                  fontFamily: "'Cinzel',serif",
                                  fontWeight: 700,
                                  color:
                                    o.overdueCount > 0 ? "#b91c1c" : "#15803d",
                                }}
                              >
                                {o.overdueCount}
                              </span>
                            </td>
                            <td className="adh-td">
                              <span
                                style={{
                                  fontSize: "0.76rem",
                                  color: "#5c3a14",
                                }}
                              >
                                {o.reminderCount}
                              </span>
                            </td>
                            <td className="adh-td">
                              {o.needsAttention ? (
                                <span className="adh-status-pill adh-sp-at-risk">
                                  Needs Attention
                                </span>
                              ) : (
                                <span className="adh-status-pill adh-sp-healthy">
                                  Active
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* ══ MONTHLY TREND + RECENT + ANNOUNCEMENTS ═══════════ */}
              <div className="adh-sec">
                <span className="adh-sec-title">
                  Activity &amp; Communications
                </span>
              </div>
              <div className="adh-g3">
                <div className="adh-card">
                  <div className="adh-card-hd">
                    <span className="adh-card-title">
                      <IcoChart />
                      Monthly Trend
                    </span>
                  </div>
                  <div className="adh-card-body">
                    {d?.monthlyTrend?.length ? (
                      (() => {
                        const max = Math.max(
                          ...d.monthlyTrend.map((m) => m.pct),
                          1
                        );
                        return (
                          <div className="adh-trend">
                            {d.monthlyTrend.map((m, i) => {
                              const cls = pctCls(m.pct);
                              return (
                                <div key={i} className="adh-trend-col">
                                  <div
                                    style={{
                                      fontSize: "0.58rem",
                                      fontWeight: 700,
                                      color: "#5c3a14",
                                    }}
                                  >
                                    {m.pct}%
                                  </div>
                                  <div
                                    className="adh-trend-bar"
                                    style={{
                                      height: `${Math.max(
                                        4,
                                        (m.pct / max) * 56
                                      )}px`,
                                      background:
                                        cls === "g"
                                          ? "linear-gradient(180deg,#16a34a,#4ade80)"
                                          : cls === "y"
                                          ? "linear-gradient(180deg,#d97706,#fbbf24)"
                                          : "linear-gradient(180deg,#dc2626,#f87171)",
                                    }}
                                  />
                                  <div className="adh-trend-lbl">
                                    {m.label.split(" ")[0]}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()
                    ) : (
                      <div className="adh-empty">
                        <div className="adh-empty-ico">
                          <IcoChart />
                        </div>
                        <p className="adh-empty-txt">No trend yet</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="adh-card">
                  <div className="adh-card-hd">
                    <span className="adh-card-title">Recent Sessions</span>
                  </div>
                  <div className="adh-card-body">
                    {d?.recentSessions?.length ? (
                      d.recentSessions.map((s, i) => (
                        <div key={i} className="adh-rec-item">
                          <span className="adh-rec-dot" />
                          <span className="adh-rec-key">{s.programKey}</span>
                          <span className="adh-rec-host">{s.hostName}</span>
                          <span className="adh-rec-type">{s.programType}</span>
                          <span className="adh-rec-date">
                            {fmtShort(s.date)}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="adh-empty">
                        <div className="adh-empty-ico">
                          <IcoProg />
                        </div>
                        <p className="adh-empty-txt">No sessions yet</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="adh-card">
                  <div className="adh-card-hd">
                    <span className="adh-card-title">
                      <IcoBell />
                      Announcements
                    </span>
                    <span style={{ fontSize: "0.64rem", color: "#8b6840" }}>
                      {anns.filter((a) => a.isActive).length} active
                    </span>
                  </div>
                  <div className="adh-ann-form">
                    <input
                      className="adh-ann-inp"
                      placeholder="Type announcement…"
                      value={annTxt}
                      onChange={(e) => setAnnTxt(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && postAnn()}
                      disabled={posting}
                    />
                    <div className="adh-ann-row">
                      <select
                        className="adh-ann-sel"
                        value={annPri}
                        onChange={(e) => setAnnPri(e.target.value)}
                      >
                        <option value="info">Info</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                      <button
                        className="adh-ann-btn"
                        onClick={postAnn}
                        disabled={posting || !annTxt.trim()}
                      >
                        {posting ? <span className="adh-spin" /> : <IcoPlus />}
                        {posting ? "Publishing…" : "Publish"}
                      </button>
                    </div>
                  </div>
                  <div className="adh-ann-list">
                    {annL ? (
                      [...Array(3)].map((_, i) => (
                        <div
                          key={i}
                          style={{
                            display: "flex",
                            gap: 10,
                            padding: "10px 18px",
                            borderBottom: "1px solid rgba(200,140,40,0.07)",
                          }}
                        >
                          <div
                            className="adh-skel"
                            style={{
                              width: 7,
                              height: 7,
                              borderRadius: "50%",
                              flexShrink: 0,
                              marginTop: 6,
                            }}
                          />
                          <div style={{ flex: 1 }}>
                            <div
                              className="adh-skel"
                              style={{
                                height: 11,
                                width: "90%",
                                marginBottom: 5,
                              }}
                            />
                            <div
                              className="adh-skel"
                              style={{ height: 9, width: "55%" }}
                            />
                          </div>
                        </div>
                      ))
                    ) : !anns.length ? (
                      <div className="adh-empty">
                        <div className="adh-empty-ico">
                          <IcoBell />
                        </div>
                        <p className="adh-empty-txt">No announcements</p>
                      </div>
                    ) : (
                      anns.slice(0, 8).map((a) => (
                        <div
                          key={a._id}
                          className={`adh-ann-item${
                            !a.isActive ? " inactive" : ""
                          }`}
                        >
                          <span
                            className={`adh-ann-pri adh-pri-${a.priority}`}
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div className="adh-ann-text">{a.text}</div>
                            <div className="adh-ann-meta">
                              {a.priority.toUpperCase()} ·{" "}
                              {fmtDate(a.createdAt)} ·{" "}
                              {a.isActive ? "Active" : "Hidden"}
                            </div>
                          </div>
                          <div className="adh-ann-acts">
                            <button
                              className={`adh-icon-btn adh-ib-eye${
                                !a.isActive ? " off" : ""
                              }`}
                              onClick={() => toggleAnn(a._id)}
                              title={a.isActive ? "Hide" : "Show"}
                            >
                              {a.isActive ? <IcoEye /> : <IcoEyeOff />}
                            </button>
                            <button
                              className="adh-icon-btn adh-ib-del"
                              onClick={() => delAnn(a._id)}
                              title="Delete"
                            >
                              <IcoTrash />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
