import { useState, useEffect, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import toast from "react-hot-toast";
import PendingDeactivations from "../components/PendingDeactivations";

// ─────────────────────────────────────────────────────────────────────
// STYLES — zero Tailwind, pure custom CSS
// ─────────────────────────────────────────────────────────────────────
const css = `
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap');

/* ── Page ────────────────────────────────────────────────────── */
.mu-page {
  min-height: 100vh;
  background: #f5efe6;
  font-family: 'DM Sans', sans-serif;
  padding-bottom: 60px;
}

/* ── Banner ──────────────────────────────────────────────────── */
.mu-banner {
  background: linear-gradient(135deg, #2d1100 0%, #5c2500 35%, #8b3a00 70%, #b84800 100%);
  padding: 32px 0 28px;
  margin-bottom: 32px;
  position: relative;
  overflow: hidden;
}
.mu-banner::before {
  content: '';
  position: absolute; inset: 0;
  background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/svg%3E");
  pointer-events: none;
}
.mu-banner::after {
  content: '';
  position: absolute; bottom: 0; left: 0; right: 0; height: 2px;
  background: linear-gradient(90deg, transparent, rgba(200,150,60,0.8), rgba(255,220,100,0.6), rgba(200,150,60,0.8), transparent);
}
.mu-banner-body {
  max-width: 1240px;
  margin: 0 auto;
  padding: 0 24px;
  position: relative;
  z-index: 1;
}
.mu-eyebrow {
  font-family: 'Cinzel', serif;
  font-size: 0.65rem;
  font-weight: 700;
  color: rgba(200,150,60,0.85);
  letter-spacing: 0.22em;
  text-transform: uppercase;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.mu-eyebrow::before,
.mu-eyebrow::after {
  content: '';
  flex: 1;
  max-width: 40px;
  height: 1px;
  background: rgba(200,150,60,0.35);
}
.mu-banner-title {
  font-family: 'Cinzel', serif;
  font-size: clamp(1.5rem, 3.5vw, 2.2rem);
  color: #fff;
  margin: 0 0 6px;
  letter-spacing: 0.02em;
  font-weight: 700;
}
.mu-banner-sub {
  color: rgba(255,215,150,0.7);
  font-size: 0.9rem;
  margin: 0;
}

/* ── Body wrapper ────────────────────────────────────────────── */
.mu-body {
  max-width: 1240px;
  margin: 0 auto;
  padding: 0 24px;
}

/* ── Page header row ─────────────────────────────────────────── */
.mu-header-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}
.mu-header-title {
  font-family: 'Cinzel', serif;
  font-size: 1.4rem;
  font-weight: 700;
  color: #2d1200;
  margin: 0 0 4px;
}
.mu-header-sub {
  font-size: 0.85rem;
  color: #8b6840;
  margin: 0;
}
.mu-header-btns {
  display: flex;
  gap: 10px;
  flex-shrink: 0;
}

/* ── Buttons ─────────────────────────────────────────────────── */
.mu-btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  background: linear-gradient(135deg, #7a3200, #b85000);
  color: #fff;
  border: none;
  border-radius: 10px;
  font-family: 'DM Sans', sans-serif;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.18s;
  box-shadow: 0 2px 10px rgba(120,50,0,0.2);
}
.mu-btn-primary:hover {
  background: linear-gradient(135deg, #8d3a00, #d06000);
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(120,50,0,0.3);
}
.mu-btn-secondary {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  background: #fff;
  color: #5c3a14;
  border: 1.5px solid rgba(200,140,40,0.3);
  border-radius: 10px;
  font-family: 'DM Sans', sans-serif;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.18s;
}
.mu-btn-secondary:hover {
  background: rgba(200,140,40,0.06);
  border-color: rgba(200,140,40,0.5);
  color: #2d1200;
}

/* ── Filters card ────────────────────────────────────────────── */
.mu-filters {
  background: #fff;
  border: 1px solid rgba(200,140,40,0.18);
  border-radius: 14px;
  padding: 16px;
  margin-bottom: 20px;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  box-shadow: 0 1px 6px rgba(61,23,0,0.05);
}
.mu-search-wrap {
  position: relative;
  flex: 1;
  min-width: 180px;
}
.mu-search-ico {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  color: #a08060;
  pointer-events: none;
}
.mu-input {
  width: 100%;
  box-sizing: border-box;
  padding: 10px 14px 10px 38px;
  border: 1.5px solid rgba(200,140,40,0.22);
  border-radius: 10px;
  background: #fdf8f0;
  color: #2d1200;
  font-family: 'DM Sans', sans-serif;
  font-size: 0.875rem;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.mu-input:focus {
  border-color: #c8903c;
  box-shadow: 0 0 0 3px rgba(200,140,40,0.12);
}
.mu-select {
  padding: 10px 14px;
  border: 1.5px solid rgba(200,140,40,0.22);
  border-radius: 10px;
  background: #fdf8f0;
  color: #2d1200;
  font-family: 'DM Sans', sans-serif;
  font-size: 0.875rem;
  outline: none;
  cursor: pointer;
  min-width: 140px;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.mu-select:focus {
  border-color: #c8903c;
  box-shadow: 0 0 0 3px rgba(200,140,40,0.12);
}

/* ── Table card ──────────────────────────────────────────────── */
.mu-card {
  background: #fff;
  border: 1px solid rgba(200,140,40,0.18);
  border-top: 3px solid #c8903c;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 20px rgba(61,23,0,0.07), 0 1px 4px rgba(61,23,0,0.04);
}
.mu-table-scroll { overflow-x: auto; }
.mu-table { width: 100%; border-collapse: collapse; }

/* ── Table head ──────────────────────────────────────────────── */
.mu-thead-row {
  background: linear-gradient(to right, rgba(200,140,40,0.08), rgba(200,140,40,0.04));
  border-bottom: 1.5px solid rgba(200,140,40,0.18);
}
.mu-th {
  padding: 12px 16px;
  text-align: left;
  font-family: 'Cinzel', serif;
  font-size: 0.62rem;
  font-weight: 700;
  color: #7a4a10;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  white-space: nowrap;
}
.mu-th-right { text-align: right; }

/* ── Table rows ──────────────────────────────────────────────── */
.mu-tr {
  border-bottom: 1px solid rgba(200,140,40,0.07);
  transition: background 0.12s;
}
.mu-tr:last-child { border-bottom: none; }
.mu-tr:hover { background: rgba(200,140,40,0.04); }
.mu-tr-super { background: rgba(124,58,237,0.03); }
.mu-tr-super:hover { background: rgba(124,58,237,0.06); }
.mu-tr-inactive { opacity: 0.65; }
.mu-td {
  padding: 13px 16px;
  vertical-align: middle;
  font-size: 0.875rem;
  color: #3d1800;
}

/* ── User cell ───────────────────────────────────────────────── */
.mu-user-cell { display: flex; align-items: center; gap: 12px; }
.mu-avatar {
  width: 40px; height: 40px; border-radius: 11px; flex-shrink: 0;
  background: linear-gradient(135deg, #c47a00, #7a3a00);
  display: flex; align-items: center; justify-content: center;
  font-family: 'Cinzel', serif; font-size: 0.72rem; font-weight: 700; color: #fff;
}
.mu-avatar-super {
  background: linear-gradient(135deg, #7c3aed, #4c1d95);
  box-shadow: 0 0 0 2px rgba(124,58,237,0.3), 0 0 0 4px rgba(124,58,237,0.1);
}
.mu-user-name { font-weight: 600; font-size: 0.875rem; color: #2d1200; line-height: 1.3; }
.mu-user-you  { font-size: 0.72rem; font-weight: 400; color: #a08060; margin-left: 5px; }
.mu-user-email {
  font-size: 0.76rem; color: #a08060; margin-top: 2px;
  max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.mu-super-tag {
  display: inline-block; margin-top: 4px;
  font-size: 0.6rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;
  color: #6d28d9; background: rgba(124,58,237,0.1); border: 1px solid rgba(124,58,237,0.2);
  padding: 1px 7px; border-radius: 20px;
}

/* ── Badges ──────────────────────────────────────────────────── */
.mu-badge {
  display: inline-block; padding: 3px 10px; border-radius: 20px;
  font-size: 0.7rem; font-weight: 700; letter-spacing: 0.04em; text-transform: capitalize;
}
.mu-badge-admin   { background: rgba(200,140,40,0.12); color: #7a4a00; border: 1px solid rgba(200,140,40,0.25); }
.mu-badge-owner   { background: rgba(14,116,144,0.1);  color: #0e7490; border: 1px solid rgba(14,116,144,0.2); }
.mu-badge-active  { background: rgba(22,163,74,0.1);   color: #15803d; border: 1px solid rgba(22,163,74,0.2); }
.mu-badge-inactive{ background: rgba(100,100,100,0.08);color: #6b7280; border: 1px solid rgba(100,100,100,0.15); }

/* ── Provider cell ───────────────────────────────────────────── */
.mu-provider { display: flex; align-items: center; gap: 5px; font-size: 0.8rem; color: #7a5a30; }

/* ── Created cell ────────────────────────────────────────────── */
.mu-created { font-size: 0.8rem; color: #a08060; }
.mu-created-sys { font-style: italic; color: #c4a880; }

/* ── Action buttons ──────────────────────────────────────────── */
.mu-actions { display: flex; align-items: center; justify-content: flex-end; gap: 5px; }
.mu-icon-btn {
  width: 33px; height: 33px;
  display: flex; align-items: center; justify-content: center;
  border: none; border-radius: 8px; background: transparent;
  cursor: pointer; color: #a08060; transition: all 0.15s; flex-shrink: 0;
}
.mu-icon-btn:hover   { transform: scale(1.1); }
.mu-icon-btn:disabled{ opacity: 0.4; cursor: not-allowed; transform: none; }
.mu-icon-btn-pw:hover   { color: #c8903c; background: rgba(200,140,40,0.1); }
.mu-icon-btn-deact:hover{ color: #dc2626; background: rgba(220,38,38,0.09); }
.mu-icon-btn-react:hover{ color: #16a34a; background: rgba(22,163,74,0.1); }
.mu-locked-lbl {
  font-size: 0.7rem; color: #a08060; font-style: italic;
  font-family: 'Cinzel', serif; letter-spacing: 0.04em; padding: 0 6px;
}

/* ── Empty state ─────────────────────────────────────────────── */
.mu-empty-td { padding: 48px 24px; text-align: center; }
.mu-empty-icon { font-size: 2.5rem; display: block; margin-bottom: 10px; opacity: 0.5; }
.mu-empty-text { color: #a08060; font-family: 'Cinzel', serif; font-size: 0.85rem; }

/* ── Skeleton loading ────────────────────────────────────────── */
.mu-skel-wrap { display: flex; align-items: center; gap: 12px; }
.mu-skel {
  background: linear-gradient(90deg,
    rgba(200,140,40,0.07) 25%,
    rgba(200,140,40,0.14) 50%,
    rgba(200,140,40,0.07) 75%
  );
  background-size: 200% 100%;
  animation: muShimmer 1.5s infinite;
  border-radius: 6px;
}
@keyframes muShimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ── Table footer ────────────────────────────────────────────── */
.mu-tbl-footer {
  padding: 10px 16px;
  border-top: 1px solid rgba(200,140,40,0.1);
  background: rgba(200,140,40,0.03);
  font-size: 0.75rem;
  color: #a08060;
}
.mu-tbl-footer strong { color: #5c3a14; }

/* ── Modal overlay ───────────────────────────────────────────── */
.mu-overlay {
  position: fixed; inset: 0; z-index: 400;
  background: rgba(30,10,0,0.58);
  backdrop-filter: blur(5px);
  display: flex; align-items: center; justify-content: center;
  padding: 20px;
}
.mu-modal {
  background: #fff;
  width: 100%; max-width: 460px;
  border-radius: 18px; overflow: hidden;
  border: 1px solid rgba(200,140,40,0.2);
  box-shadow: 0 20px 60px rgba(61,23,0,0.25), 0 4px 16px rgba(61,23,0,0.12);
  animation: muSlideUp 0.22s cubic-bezier(0.22,1,0.36,1) both;
}
@keyframes muSlideUp {
  from { opacity: 0; transform: translateY(16px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0)   scale(1);    }
}

/* ── Modal header ────────────────────────────────────────────── */
.mu-modal-hd {
  background: linear-gradient(135deg, #3d1700, #7a3200);
  padding: 18px 20px;
  display: flex; align-items: flex-start; justify-content: space-between; gap: 12px;
}
.mu-modal-title {
  font-family: 'Cinzel', serif; font-size: 1rem; font-weight: 700; color: #fff; margin: 0 0 3px;
}
.mu-modal-sub { font-size: 0.76rem; color: rgba(255,210,150,0.75); margin: 0; }
.mu-modal-close {
  width: 30px; height: 30px; flex-shrink: 0;
  background: rgba(255,255,255,0.1); border: none; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; color: rgba(255,255,255,0.75); transition: background 0.15s;
}
.mu-modal-close:hover { background: rgba(255,255,255,0.2); color: #fff; }

/* ── Modal body ──────────────────────────────────────────────── */
.mu-modal-body { padding: 22px 20px; }

/* ── Alert banners ───────────────────────────────────────────── */
.mu-alert {
  padding: 12px 14px; border-radius: 10px;
  margin-bottom: 16px; font-size: 0.82rem; line-height: 1.6;
}
.mu-alert-warn    { background: rgba(251,191,36,0.1);  border: 1px solid rgba(251,191,36,0.3); color: #92400e; }
.mu-alert-danger  { background: rgba(220,38,38,0.07);  border: 1px solid rgba(220,38,38,0.2);  color: #991b1b; }
.mu-alert-success { background: rgba(22,163,74,0.07);  border: 1px solid rgba(22,163,74,0.2);  color: #166534; }
.mu-alert-info    {
  background: rgba(200,140,40,0.08);
  border-left: 3px solid #c8903c; border-radius: 0 8px 8px 0; color: #6b4520;
}

/* ── Option buttons (choose reset method) ────────────────────── */
.mu-choose-hint { font-size: 0.85rem; color: #5c3a14; margin: 0 0 14px; }
.mu-option-btn {
  width: 100%; display: flex; align-items: flex-start; gap: 12px;
  padding: 14px; margin-bottom: 10px; cursor: pointer; text-align: left;
  border: 1.5px solid rgba(200,140,40,0.2); border-radius: 12px;
  background: rgba(255,250,240,0.8); transition: all 0.15s;
}
.mu-option-btn:last-child { margin-bottom: 0; }
.mu-option-btn:hover {
  border-color: #c8903c; background: rgba(200,140,40,0.06); transform: translateX(2px);
}
.mu-option-ico {
  width: 40px; height: 40px; border-radius: 10px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center; font-size: 1.1rem;
}
.mu-option-ico-gold   { background: rgba(200,140,40,0.12); }
.mu-option-ico-violet { background: rgba(124,58,237,0.1); }
.mu-option-label { font-weight: 700; font-size: 0.875rem; color: #2d1200; margin: 0 0 3px; }
.mu-option-desc  { font-size: 0.75rem; color: #8b6840; line-height: 1.5; margin: 0; }

/* ── Form fields ─────────────────────────────────────────────── */
.mu-field-label { display: block; font-size: 0.78rem; font-weight: 600; color: #5c3a14; margin-bottom: 6px; }
.mu-field-opt   { font-weight: 400; color: #a08060; }
.mu-field-input {
  width: 100%; box-sizing: border-box; padding: 10px 14px;
  border: 1.5px solid rgba(200,140,40,0.25); border-radius: 10px;
  background: rgba(255,250,240,0.9); color: #2d1200;
  font-family: 'DM Sans', sans-serif; font-size: 0.9rem;
  outline: none; transition: border-color 0.15s, box-shadow 0.15s;
}
.mu-field-input:focus { border-color: #c8903c; box-shadow: 0 0 0 3px rgba(200,140,40,0.12); }
.mu-field-textarea { resize: vertical; min-height: 80px; }

/* ── Modal footer ────────────────────────────────────────────── */
.mu-modal-footer { display: flex; gap: 10px; margin-top: 18px; }
.mu-modal-cancel {
  flex: 1; padding: 11px 16px;
  background: #fff; color: #5c3a14;
  border: 1.5px solid rgba(200,140,40,0.3); border-radius: 10px;
  font-family: 'DM Sans', sans-serif; font-size: 0.875rem; font-weight: 600;
  cursor: pointer; transition: all 0.15s;
}
.mu-modal-cancel:hover { background: rgba(200,140,40,0.06); border-color: rgba(200,140,40,0.5); }
.mu-modal-action {
  flex: 1; padding: 11px 16px; border: none; border-radius: 10px;
  font-family: 'DM Sans', sans-serif; font-size: 0.875rem; font-weight: 700; color: #fff;
  cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;
  transition: opacity 0.15s, transform 0.15s;
}
.mu-modal-action:hover:not(:disabled) { opacity: 0.88; transform: translateY(-1px); }
.mu-modal-action:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
.mu-act-gold   { background: linear-gradient(135deg, #b85000, #7a3200); }
.mu-act-red    { background: linear-gradient(135deg, #dc2626, #b91c1c); }
.mu-act-green  { background: linear-gradient(135deg, #16a34a, #15803d); }
.mu-act-violet { background: linear-gradient(135deg, #7c3aed, #5b21b6); }

/* ── Spinner ─────────────────────────────────────────────────── */
.mu-spin {
  width: 15px; height: 15px; border-radius: 50%; flex-shrink: 0;
  border: 2px solid rgba(255,255,255,0.35); border-top-color: #fff;
  animation: muSpin 0.7s linear infinite;
}
@keyframes muSpin { to { transform: rotate(360deg); } }

/* ── Responsive ──────────────────────────────────────────────── */
@media (max-width: 900px)  { .mu-col-lg { display: none !important; } }
@media (max-width: 640px)  { .mu-col-md { display: none !important; } }
@media (max-width: 440px)  { .mu-col-sm { display: none !important; } }
@media (max-width: 500px)  { .mu-header-row { flex-direction: column; align-items: flex-start; } }
`;

// ─────────────────────────────────────────────────────────────────────
// ICONS
// ─────────────────────────────────────────────────────────────────────
const IcoClose = () => (
  <svg
    width={16}
    height={16}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);
const IcoKey = () => (
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
      d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
    />
  </svg>
);
const IcoDeact = () => (
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
      d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
    />
  </svg>
);
const IcoCheck = () => (
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
      d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);
const GoogleIcon = () => (
  <svg width={13} height={13} viewBox="0 0 24 24">
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

// ─────────────────────────────────────────────────────────────────────
// MODAL: Reset Password
// ─────────────────────────────────────────────────────────────────────
const ResetModal = ({ user, onClose, onDone }) => {
  const [mode, setMode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendLink = async () => {
    setLoading(true);
    try {
      await api.post(`/admin/users/${user._id}/send-reset-link`);
      toast.success(`Reset link sent to ${user.email}`);
      onDone();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send reset link.");
    } finally {
      setLoading(false);
    }
  };

  const handleSetPassword = async () => {
    if (!newPassword || newPassword.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      await api.patch(`/admin/users/${user._id}/set-password`, { newPassword });
      toast.success(
        `Password updated for ${user.name}. They'll be prompted to change it on next login.`
      );
      onDone();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to set password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="mu-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="mu-modal">
        <div className="mu-modal-hd">
          <div>
            <p className="mu-modal-title">Reset Password</p>
            <p className="mu-modal-sub">
              {user.name} · {user.email}
            </p>
          </div>
          <button className="mu-modal-close" onClick={onClose}>
            <IcoClose />
          </button>
        </div>
        <div className="mu-modal-body">
          {user.provider === "google" ? (
            <div className="mu-alert mu-alert-warn">
              ⚠️ This account uses Google Sign-In. Password management is
              handled by Google and cannot be changed here.
            </div>
          ) : !mode ? (
            <>
              <p className="mu-choose-hint">
                Choose how to reset the password:
              </p>
              <button className="mu-option-btn" onClick={() => setMode("link")}>
                <div className="mu-option-ico mu-option-ico-gold">📧</div>
                <div>
                  <p className="mu-option-label">Send Reset Link</p>
                  <p className="mu-option-desc">
                    Email a secure link. User sets their own password. Expires
                    in 15 min.
                  </p>
                </div>
              </button>
              <button
                className="mu-option-btn"
                onClick={() => setMode("direct")}
              >
                <div className="mu-option-ico mu-option-ico-violet">🔑</div>
                <div>
                  <p className="mu-option-label">Set Password Directly</p>
                  <p className="mu-option-desc">
                    You choose a temporary password. User must change it on next
                    login.
                  </p>
                </div>
              </button>
            </>
          ) : mode === "link" ? (
            <>
              <div className="mu-alert mu-alert-info">
                📨 A reset link will be emailed to <strong>{user.email}</strong>
                . The link expires in 15 minutes.
              </div>
              <div className="mu-modal-footer">
                <button className="mu-modal-cancel" onClick={() => setMode("")}>
                  ← Back
                </button>
                <button
                  className="mu-modal-action mu-act-gold"
                  onClick={handleSendLink}
                  disabled={loading}
                >
                  {loading && <span className="mu-spin" />} Send Link
                </button>
              </div>
            </>
          ) : (
            <>
              <label className="mu-field-label">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                className="mu-field-input"
                style={{ marginBottom: 12 }}
              />
              <div className="mu-alert mu-alert-warn">
                ⚠️ The user will be prompted to change this password immediately
                after their next login.
              </div>
              <div className="mu-modal-footer">
                <button className="mu-modal-cancel" onClick={() => setMode("")}>
                  ← Back
                </button>
                <button
                  className="mu-modal-action mu-act-gold"
                  onClick={handleSetPassword}
                  disabled={loading}
                >
                  {loading && <span className="mu-spin" />} Set Password
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────
// MODAL: Request Deactivation
// ─────────────────────────────────────────────────────────────────────
const RequestDeactivationModal = ({ user, onClose, onDone }) => {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await api.post(
        `/admin/users/${user._id}/request-deactivation`,
        { reason }
      );
      toast.success(res.data.message);
      onDone();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="mu-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="mu-modal">
        <div className="mu-modal-hd">
          <div>
            <p className="mu-modal-title">Request Deactivation</p>
            <p className="mu-modal-sub">
              {user.name} · {user.role}
            </p>
          </div>
          <button className="mu-modal-close" onClick={onClose}>
            <IcoClose />
          </button>
        </div>
        <div className="mu-modal-body">
          <div className="mu-alert mu-alert-warn">
            ⚠️ This request will be sent to the SuperAdmin for approval. The
            account will remain active until approved.
          </div>
          <div style={{ marginBottom: 18 }}>
            <label className="mu-field-label">
              Reason <span className="mu-field-opt">(optional)</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why should this account be deactivated?"
              rows={3}
              className="mu-field-input mu-field-textarea"
            />
          </div>
          <div className="mu-modal-footer">
            <button className="mu-modal-cancel" onClick={onClose}>
              Cancel
            </button>
            <button
              className="mu-modal-action mu-act-red"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading && <span className="mu-spin" />} Send to SuperAdmin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────
// MODAL: Reactivate (direct, no approval)
// ─────────────────────────────────────────────────────────────────────
const ReactivateModal = ({ user, onClose, onDone }) => {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await api.patch(`/admin/users/${user._id}/reactivate`);
      toast.success(res.data.message);
      onDone();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reactivate.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="mu-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="mu-modal">
        <div className="mu-modal-hd">
          <div>
            <p className="mu-modal-title">Reactivate Account</p>
            <p className="mu-modal-sub">
              {user.name} · {user.role}
            </p>
          </div>
          <button className="mu-modal-close" onClick={onClose}>
            <IcoClose />
          </button>
        </div>
        <div className="mu-modal-body">
          <div className="mu-alert mu-alert-success">
            ✅ This will restore full access for <strong>{user.name}</strong>.
            They will be notified by email.
          </div>
          <div className="mu-modal-footer">
            <button className="mu-modal-cancel" onClick={onClose}>
              Cancel
            </button>
            <button
              className="mu-modal-action mu-act-green"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading && <span className="mu-spin" />} Reactivate Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────
// MODAL: Direct Toggle — SuperAdmin only
// ─────────────────────────────────────────────────────────────────────
const DirectToggleModal = ({ user, onClose, onDone }) => {
  const [loading, setLoading] = useState(false);
  const willDeactivate = user.isActive;

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await api.patch(`/admin/users/${user._id}/direct-toggle`);
      toast.success(res.data.message);
      onDone();
    } catch (err) {
      toast.error(err.response?.data?.message || "Action failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="mu-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="mu-modal">
        <div className="mu-modal-hd">
          <div>
            <p className="mu-modal-title">
              {willDeactivate ? "Deactivate" : "Reactivate"} Account
            </p>
            <p className="mu-modal-sub">
              {user.name} · {user.role}
            </p>
          </div>
          <button className="mu-modal-close" onClick={onClose}>
            <IcoClose />
          </button>
        </div>
        <div className="mu-modal-body">
          {willDeactivate ? (
            <div className="mu-alert mu-alert-danger">
              ⚠️ This will <strong>immediately deactivate</strong> {user.name}'s
              account. They will be notified by email and will not be able to
              sign in.
            </div>
          ) : (
            <div className="mu-alert mu-alert-success">
              ✅ This will restore full access for <strong>{user.name}</strong>.
              They will be notified by email.
            </div>
          )}
          <div className="mu-modal-footer">
            <button className="mu-modal-cancel" onClick={onClose}>
              Cancel
            </button>
            <button
              className={`mu-modal-action ${
                willDeactivate ? "mu-act-red" : "mu-act-green"
              }`}
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading && <span className="mu-spin" />}
              {willDeactivate ? "Deactivate" : "Reactivate"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────
const ManageUsers = () => {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [resetTarget, setResetTarget] = useState(null);
  const [deactTarget, setDeactTarget] = useState(null);
  const [reactTarget, setReactTarget] = useState(null);
  const [directTarget, setDirectTarget] = useState(null);
  const [searchParams] = useSearchParams();

  const iAmSuperAdmin = !!me?.isSuperAdmin;

  useEffect(() => {
    setRoleFilter(searchParams.get("role") || "");
    setStatusFilter(searchParams.get("isActive") || "");
  }, [searchParams]);

  const fetchUsers = useCallback(async () => {
    try {
      const params = {};
      if (roleFilter) params.role = roleFilter;
      if (statusFilter) params.isActive = statusFilter;
      if (search) params.search = search;
      const res = await api.get("/admin/users", { params });
      setUsers(res.data.users || []);
    } catch {
      toast.error("Failed to load users.");
    } finally {
      setLoading(false);
    }
  }, [roleFilter, statusFilter, search]);

  useEffect(() => {
    const t = setTimeout(fetchUsers, 300);
    return () => clearTimeout(t);
  }, [fetchUsers]);

  const isSelf = (u) => u._id === me?._id;
  const initials = (name) =>
    name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?";

  return (
    <>
      <style>{css}</style>
      <div className="mu-page">
        {/* ── Banner ── */}
        <div className="mu-banner">
          <div className="mu-banner-body">
            <div className="mu-eyebrow">Administration</div>
            <h1 className="mu-banner-title">Manage Members</h1>
            <p className="mu-banner-sub">
              {iAmSuperAdmin
                ? "As SuperAdmin you can directly activate or deactivate any account."
                : "Deactivation requests require SuperAdmin approval. You can reactivate accounts directly."}
            </p>
          </div>
        </div>

        <div className="mu-body">
          {/* ── SuperAdmin: Pending Deactivation Review Banner ── */}
          <PendingDeactivations />

          {/* ── Header row ── */}
          <div className="mu-header-row">
            <div>
              <h2 className="mu-header-title">All Members</h2>
              <p className="mu-header-sub">
                Search, filter and manage all accounts in the system.
              </p>
            </div>
            <div className="mu-header-btns">
              <Link to="/admin/create-owner" className="mu-btn-primary">
                + Owner
              </Link>
              <Link to="/admin/create-admin" className="mu-btn-secondary">
                + Admin
              </Link>
            </div>
          </div>

          {/* ── Filters ── */}
          <div className="mu-filters">
            <div className="mu-search-wrap">
              <svg
                className="mu-search-ico"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or email…"
                className="mu-input"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="mu-select"
            >
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="owner">Owner</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="mu-select"
            >
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>

          {/* ── Table ── */}
          <div className="mu-card">
            <div className="mu-table-scroll">
              <table className="mu-table">
                <thead>
                  <tr className="mu-thead-row">
                    <th className="mu-th">Member</th>
                    <th className="mu-th mu-col-sm">Role</th>
                    <th className="mu-th mu-col-md">Provider</th>
                    <th className="mu-th mu-col-lg">Created By</th>
                    <th className="mu-th">Status</th>
                    <th className="mu-th mu-th-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={i} className="mu-tr">
                        <td colSpan={6} style={{ padding: "13px 16px" }}>
                          <div className="mu-skel-wrap">
                            <div
                              className="mu-skel"
                              style={{
                                width: 40,
                                height: 40,
                                borderRadius: 11,
                                flexShrink: 0,
                              }}
                            />
                            <div style={{ flex: 1 }}>
                              <div
                                className="mu-skel"
                                style={{
                                  height: 12,
                                  width: "30%",
                                  marginBottom: 8,
                                }}
                              />
                              <div
                                className="mu-skel"
                                style={{ height: 10, width: "45%" }}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="mu-empty-td">
                        <span className="mu-empty-icon">🔍</span>
                        <p className="mu-empty-text">
                          No members found matching your filters.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => (
                      <tr
                        key={u._id}
                        className={`mu-tr${
                          u.isSuperAdmin ? " mu-tr-super" : ""
                        }${!u.isActive ? " mu-tr-inactive" : ""}`}
                      >
                        {/* Member */}
                        <td className="mu-td">
                          <div className="mu-user-cell">
                            <div
                              className={`mu-avatar${
                                u.isSuperAdmin ? " mu-avatar-super" : ""
                              }`}
                            >
                              {u.isSuperAdmin ? "⭐" : initials(u.name)}
                            </div>
                            <div>
                              <div className="mu-user-name">
                                {u.name}
                                {isSelf(u) && (
                                  <span className="mu-user-you">(you)</span>
                                )}
                              </div>
                              <div className="mu-user-email">{u.email}</div>
                              {u.isSuperAdmin && (
                                <div className="mu-super-tag">
                                  ⭐ SuperAdmin
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Role */}
                        <td className="mu-td mu-col-sm">
                          <span
                            className={`mu-badge ${
                              u.role === "admin"
                                ? "mu-badge-admin"
                                : "mu-badge-owner"
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>

                        {/* Provider */}
                        <td className="mu-td mu-col-md">
                          <div className="mu-provider">
                            {u.provider === "google" ? (
                              <>
                                <GoogleIcon /> Google
                              </>
                            ) : (
                              <>
                                <IcoKey /> Local
                              </>
                            )}
                          </div>
                        </td>

                        {/* Created By */}
                        <td className="mu-td mu-col-lg">
                          {u.createdBy ? (
                            <span className="mu-created">
                              {u.createdBy.name}
                            </span>
                          ) : (
                            <span className="mu-created mu-created-sys">
                              System
                            </span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="mu-td">
                          <span
                            className={`mu-badge ${
                              u.isActive
                                ? "mu-badge-active"
                                : "mu-badge-inactive"
                            }`}
                          >
                            {u.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="mu-td">
                          <div className="mu-actions">
                            {u.isSuperAdmin ? (
                              <span className="mu-locked-lbl">Protected</span>
                            ) : isSelf(u) ? (
                              <span className="mu-locked-lbl">You</span>
                            ) : iAmSuperAdmin ? (
                              /* ── SuperAdmin: direct toggle, no approval ── */
                              <>
                                {u.provider === "local" && (
                                  <button
                                    className="mu-icon-btn mu-icon-btn-pw"
                                    title="Reset Password"
                                    onClick={() => setResetTarget(u)}
                                  >
                                    <IcoKey />
                                  </button>
                                )}
                                <button
                                  className={`mu-icon-btn ${
                                    u.isActive
                                      ? "mu-icon-btn-deact"
                                      : "mu-icon-btn-react"
                                  }`}
                                  title={
                                    u.isActive
                                      ? "Deactivate Account"
                                      : "Reactivate Account"
                                  }
                                  onClick={() => setDirectTarget(u)}
                                >
                                  {u.isActive ? <IcoDeact /> : <IcoCheck />}
                                </button>
                              </>
                            ) : (
                              /* ── Regular admin: request deact / direct react ── */
                              <>
                                {u.provider === "local" && (
                                  <button
                                    className="mu-icon-btn mu-icon-btn-pw"
                                    title="Reset Password"
                                    onClick={() => setResetTarget(u)}
                                  >
                                    <IcoKey />
                                  </button>
                                )}
                                {u.isActive && (
                                  <button
                                    className="mu-icon-btn mu-icon-btn-deact"
                                    title="Request Deactivation (requires SuperAdmin approval)"
                                    onClick={() => setDeactTarget(u)}
                                  >
                                    <IcoDeact />
                                  </button>
                                )}
                                {!u.isActive && (
                                  <button
                                    className="mu-icon-btn mu-icon-btn-react"
                                    title="Reactivate Account"
                                    onClick={() => setReactTarget(u)}
                                  >
                                    <IcoCheck />
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {!loading && users.length > 0 && (
              <div className="mu-tbl-footer">
                ✦ &nbsp;Showing <strong>{users.length}</strong> member
                {users.length !== 1 ? "s" : ""}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Modals ── */}
      {resetTarget && (
        <ResetModal
          user={resetTarget}
          onClose={() => setResetTarget(null)}
          onDone={() => {
            setResetTarget(null);
            fetchUsers();
          }}
        />
      )}
      {deactTarget && (
        <RequestDeactivationModal
          user={deactTarget}
          onClose={() => setDeactTarget(null)}
          onDone={() => {
            setDeactTarget(null);
            fetchUsers();
          }}
        />
      )}
      {reactTarget && (
        <ReactivateModal
          user={reactTarget}
          onClose={() => setReactTarget(null)}
          onDone={() => {
            setReactTarget(null);
            fetchUsers();
          }}
        />
      )}
      {directTarget && (
        <DirectToggleModal
          user={directTarget}
          onClose={() => setDirectTarget(null)}
          onDone={() => {
            setDirectTarget(null);
            fetchUsers();
          }}
        />
      )}
    </>
  );
};

export default ManageUsers;
