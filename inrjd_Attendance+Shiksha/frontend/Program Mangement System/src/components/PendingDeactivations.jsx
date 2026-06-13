import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import toast from "react-hot-toast";

// ════════════════════════════════════════════════════════════════
// COMPONENT: PendingDeactivations
// Usage: Place near top of ManageUsers.jsx (or AdminHome) — will
//        auto-hide when there are no pending items.
//
// Required backend endpoints:
//   GET  /auth/pending-actions        → { pendingDeactivations: [...] }
//   POST /auth/review-deactivation    → { userId, action: "approve"|"reject" }
//
// Required User model fields:
//   pendingApproval: Boolean (default false)
//   deactivatedAt:   Date
//   deactivatedBy:   ObjectId ref User
//   deactivationReason: String
//
// When admin calls POST /admin/users/:id/request-deactivation,
// your backend should set:
//   user.isActive         = false;          // mark deactivated
//   user.pendingApproval  = true;           // superadmin review required
//   user.deactivatedAt    = new Date();
//   user.deactivatedBy    = req.user._id;
//   user.deactivationReason = reason || "";
// ════════════════════════════════════════════════════════════════

const css = `
/* ── Pending Deactivations Banner + Modal ─────────────────────── */
.pd-banner {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 20px;
  background: linear-gradient(135deg, #7a1e00 0%, #a83200 60%, #c8500a 100%);
  border-radius: 14px;
  margin-bottom: 18px;
  box-shadow: 0 4px 18px rgba(168, 50, 0, 0.28);
  cursor: pointer;
  border: 1.5px solid rgba(255, 180, 100, 0.25);
  transition: all 0.18s;
  width: 100%;
}
.pd-banner:hover { transform: translateY(-2px); box-shadow: 0 8px 26px rgba(168,50,0,0.38); }
.pd-banner-icon  { font-size: 1.5rem; flex-shrink: 0; animation: pd-pulse 2s ease-in-out infinite; }
@keyframes pd-pulse { 0%,100%{opacity:1} 50%{opacity:0.6} }
.pd-banner-body  { flex: 1; }
.pd-banner-title { font-family:'Cinzel',serif; font-size:0.88rem; font-weight:700; color:#fff; margin-bottom:2px; }
.pd-banner-sub   { font-size:0.72rem; color:rgba(255,220,160,0.8); }
.pd-banner-badge {
  background: rgba(255,255,255,0.2);
  border: 1.5px solid rgba(255,255,255,0.35);
  color: #fff;
  font-family:'Cinzel',serif;
  font-size:1.1rem;
  font-weight:700;
  padding:4px 14px;
  border-radius:20px;
  flex-shrink:0;
}
.pd-banner-cta   { font-size:0.76rem; color:rgba(255,220,160,0.9); font-weight:600; flex-shrink:0; }

/* ── Modal overlay ── */
.pd-overlay {
  position: fixed; inset: 0; z-index: 600;
  background: rgba(10,4,0,0.72);
  backdrop-filter: blur(6px);
  display: flex; align-items: flex-start; justify-content: center;
  padding: 32px 16px;
  overflow-y: auto;
}
.pd-modal {
  width: 100%; max-width: 640px;
  background: #fff;
  border-radius: 18px;
  overflow: hidden;
  box-shadow: 0 24px 80px rgba(0,0,0,0.4);
  animation: pd-slide 0.28s cubic-bezier(0.22,1,0.36,1) both;
}
@keyframes pd-slide { from{transform:translateY(-24px);opacity:0} to{transform:translateY(0);opacity:1} }

.pd-modal-hd {
  padding: 20px 24px;
  background: linear-gradient(135deg, #1e0a00, #5c2000);
  display: flex; align-items: center; justify-content: space-between;
}
.pd-modal-title { font-family:'Cinzel',serif; font-size:1rem; font-weight:700; color:#fff; margin:0; }
.pd-modal-sub   { font-size:0.72rem; color:rgba(255,210,140,0.7); margin:3px 0 0; }
.pd-modal-close {
  width:32px; height:32px; border:none; border-radius:8px;
  background:rgba(255,255,255,0.1); color:rgba(255,255,255,0.8);
  cursor:pointer; font-size:1.1rem; display:flex; align-items:center; justify-content:center;
  transition:all 0.15s;
}
.pd-modal-close:hover { background:rgba(255,255,255,0.2); color:#fff; }

.pd-modal-body  { padding: 20px 24px; }

/* ── Individual request card ── */
.pd-req {
  border: 1.5px solid rgba(200,140,40,0.18);
  border-radius: 13px;
  overflow: hidden;
  margin-bottom: 14px;
}
.pd-req:last-child { margin-bottom: 0; }
.pd-req-hd {
  padding: 14px 16px;
  background: linear-gradient(to right, rgba(220,38,38,0.06), transparent);
  border-bottom: 1px solid rgba(200,140,40,0.12);
  display: flex; align-items: flex-start; gap: 12px;
}
.pd-avatar {
  width: 40px; height: 40px; border-radius: 10px;
  background: linear-gradient(135deg, #b82000, #7a1e00);
  color: #fff; font-family:'Cinzel',serif; font-weight:700; font-size:0.84rem;
  display:flex; align-items:center; justify-content:center; flex-shrink:0;
}
.pd-user-name   { font-family:'Cinzel',serif; font-size:0.88rem; font-weight:700; color:#2d1200; margin-bottom:2px; }
.pd-user-email  { font-size:0.7rem; color:#8b6840; }
.pd-user-meta   { font-size:0.68rem; color:#a08060; margin-top:4px; }

.pd-req-body    { padding: 12px 16px; }
.pd-reason {
  font-size: 0.76rem; color: #3d1800;
  background: rgba(220,38,38,0.05);
  border-left: 3px solid rgba(220,38,38,0.4);
  border-radius: 0 8px 8px 0;
  padding: 8px 12px;
  margin-bottom: 12px;
  font-style: italic;
}
.pd-reason-label { font-size:0.6rem; font-weight:700; color:#8b6840; text-transform:uppercase; letter-spacing:0.1em; margin-bottom:3px; }

.pd-req-actions { display:flex; gap:10px; }
.pd-btn-approve {
  flex:1; padding:10px; border-radius:9px; border:none;
  background: linear-gradient(135deg, #15803d, #16a34a);
  color:#fff; font-family:'DM Sans',sans-serif; font-size:0.8rem; font-weight:700;
  cursor:pointer; transition:all 0.15s;
}
.pd-btn-approve:hover { opacity:0.88; transform:translateY(-1px); }
.pd-btn-approve:disabled { opacity:0.5; cursor:not-allowed; transform:none; }
.pd-btn-reject {
  flex:1; padding:10px; border-radius:9px;
  border: 1.5px solid rgba(200,140,40,0.3);
  background: rgba(200,140,40,0.06);
  color:#7a3200; font-family:'DM Sans',sans-serif; font-size:0.8rem; font-weight:700;
  cursor:pointer; transition:all 0.15s;
}
.pd-btn-reject:hover { background:rgba(200,140,40,0.12); }
.pd-btn-reject:disabled { opacity:0.5; cursor:not-allowed; }

.pd-empty {
  text-align:center; padding:32px 0;
  font-family:'Cinzel',serif; font-size:0.84rem; color:#8b6840;
}
.pd-empty-ico { font-size:2rem; margin-bottom:8px; opacity:0.5; }

/* ── Skeleton ── */
.pd-sk { background:linear-gradient(90deg,rgba(200,140,40,0.07) 25%,rgba(200,140,40,0.14) 50%,rgba(200,140,40,0.07) 75%); background-size:200% 100%; animation:pd-sk 1.4s infinite; border-radius:8px; }
@keyframes pd-sk { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

@media(max-width:600px){
  .pd-req-actions { flex-direction:column; }
  .pd-modal { border-radius:14px; }
  .pd-overlay { padding:16px 10px; }
}
`;

function initials(name = "") {
  return (
    name
      .split(" ")
      .slice(0, 2)
      .map((w) => w[0] || "")
      .join("")
      .toUpperCase() || "?"
  );
}
function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ── Individual request card ───────────────────────────────────
function DeactivationRequest({ req, onReview }) {
  const [loading, setLoading] = useState(null); // "approve" | "reject" | null

  const handle = async (action) => {
    setLoading(action);
    try {
      const res = await api.post(
        `/admin/deactivation-requests/${req._id}/${action}`,
        {}
      );

      toast.success(res.data.message);
      onReview(req._id, action);
    } catch (err) {
      toast.error(err.response?.data?.message || "Action failed.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="pd-req">
      <div className="pd-req-hd">
        <div className="pd-avatar">{initials(req.targetUser?.name)}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="pd-user-name">{req.targetUser?.name}</div>
          <div className="pd-user-email">{req.targetUser?.email}</div>
          <div className="pd-user-meta">
            Requested {fmtDate(req.createdAt)}
            {req.requestedBy?.name && (
              <span style={{ marginLeft: 8, color: "#c8903c" }}>
                by {req.requestedBy.name}
              </span>
            )}
          </div>
        </div>
        <div
          style={{
            padding: "3px 10px",
            borderRadius: 20,
            background: "rgba(220,38,38,0.08)",
            color: "#b91c1c",
            fontSize: "0.66rem",
            fontWeight: 700,
            border: "1px solid rgba(220,38,38,0.2)",
            flexShrink: 0,
          }}
        >
          Pending Review
        </div>
      </div>

      <div className="pd-req-body">
        {req.reason ? (
          <>
            <div className="pd-reason-label">Reason given by admin</div>
            <div className="pd-reason">"{req.reason}"</div>
          </>
        ) : (
          <div
            style={{
              fontSize: "0.72rem",
              color: "#a08060",
              marginBottom: 12,
              fontStyle: "italic",
            }}
          >
            No reason provided.
          </div>
        )}

        <div className="pd-req-actions">
          <button
            className="pd-btn-approve"
            onClick={() => handle("approve")}
            disabled={!!loading}
          >
            {loading === "approve" ? "Approving…" : "✓ Approve Deactivation"}
          </button>
          <button
            className="pd-btn-reject"
            onClick={() => handle("reject")}
            disabled={!!loading}
          >
            {loading === "reject" ? "Reinstating…" : "↩ Reinstate Owner"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main exported component ───────────────────────────────────
export default function PendingDeactivations({ onCountChange }) {
  const { user: me } = useAuth();
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  // Only visible to superadmin
  const isSuperAdmin = !!me?.isSuperAdmin;

  const fetchPending = useCallback(async () => {
    if (!isSuperAdmin) return;
    try {
      const res = await api.get("/admin/deactivation-requests/pending");
      const list = res.data.requests || [];

      setPending(list);
      onCountChange?.(list.length);
    } catch {
      console.error(
        "PD API error:",
        err?.response?.status,
        err?.response?.data
      ); // ADD THIS
    } finally {
      setLoading(false);
    }
  }, [isSuperAdmin, onCountChange]);

  useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  const handleReview = (userId, action) => {
    setPending((prev) => {
      const next = prev.filter((p) => p._id !== userId);
      onCountChange?.(next.length);
      return next;
    });
    // Close modal when last item reviewed
    if (pending.length <= 1) setOpen(false);
  };

  // Don't render for non-superadmin or while loading with no data
  if (!isSuperAdmin) return null;
  if (!loading && pending.length === 0) return null;

  return (
    <>
      <style>{css}</style>

      {/* Banner */}
      <div className="pd-banner" onClick={() => setOpen(true)}>
        <span className="pd-banner-icon">⚠️</span>
        <div className="pd-banner-body">
          <div className="pd-banner-title">
            Action Required — Deactivation Requests
          </div>
          <div className="pd-banner-sub">
            {loading
              ? "Checking for pending requests…"
              : `${pending.length} owner account${
                  pending.length > 1 ? "s" : ""
                } pending your review`}
          </div>
        </div>
        {!loading && <div className="pd-banner-badge">{pending.length}</div>}
        <div className="pd-banner-cta">Review Now →</div>
      </div>

      {/* Modal */}
      {open && (
        <div
          className="pd-overlay"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div className="pd-modal">
            <div className="pd-modal-hd">
              <div>
                <p className="pd-modal-title">Deactivation Review Queue</p>
                <p className="pd-modal-sub">
                  {pending.length} request{pending.length !== 1 ? "s" : ""}{" "}
                  awaiting your decision
                </p>
              </div>
              <button className="pd-modal-close" onClick={() => setOpen(false)}>
                ✕
              </button>
            </div>
            <div className="pd-modal-body">
              {loading ? (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 10 }}
                >
                  {[...Array(2)].map((_, i) => (
                    <div key={i} className="pd-sk" style={{ height: 140 }} />
                  ))}
                </div>
              ) : pending.length === 0 ? (
                <div className="pd-empty">
                  <div className="pd-empty-ico">✅</div>
                  All caught up — no pending deactivations.
                </div>
              ) : (
                pending.map((req) => (
                  <DeactivationRequest
                    key={req._id}
                    req={req}
                    onReview={handleReview}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
