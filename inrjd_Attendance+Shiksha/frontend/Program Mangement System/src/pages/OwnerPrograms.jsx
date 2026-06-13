import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import toast from "react-hot-toast";

const css = `
.op-page { min-height:100vh; background:#f5efe6; font-family:'DM Sans',sans-serif; padding-bottom:60px; }

.op-banner {
  background:linear-gradient(135deg,#3d1700 0%,#762e00 50%,#9d3e00 100%);
  padding:32px 0 28px; margin-bottom:28px; position:relative; overflow:hidden;
}
.op-banner::before { content:''; position:absolute; right:-20px; top:-20px; width:200px; height:200px; border-radius:50%; background:rgba(255,255,255,0.04); pointer-events:none; }
.op-banner::after  { content:''; position:absolute; bottom:0; left:0; right:0; height:2px; background:linear-gradient(90deg,transparent,rgba(200,150,60,0.8),transparent); }
.op-banner-inner   { max-width:1240px; margin:0 auto; padding:0 24px; position:relative; z-index:1; display:flex; align-items:flex-end; justify-content:space-between; gap:20px; flex-wrap:wrap; }
.op-eyebrow  { font-family:'Cinzel',serif; font-size:0.62rem; color:rgba(200,150,60,0.85); letter-spacing:0.18em; text-transform:uppercase; margin-bottom:6px; }
.op-title    { font-family:'Cinzel',serif; font-size:clamp(1.4rem,3vw,2rem); color:#fff; margin:0 0 4px; font-weight:700; }
.op-sub      { color:rgba(255,220,160,0.7); font-size:0.875rem; margin:0; }
.op-add-btn  {
  display:flex; align-items:center; gap:7px; padding:10px 18px;
  background:rgba(255,255,255,0.12); color:#fff;
  border:1.5px solid rgba(255,255,255,0.25); border-radius:10px;
  font-family:'DM Sans',sans-serif; font-size:0.84rem; font-weight:600;
  cursor:pointer; text-decoration:none; transition:all 0.15s; flex-shrink:0;
}
.op-add-btn:hover { background:rgba(255,255,255,0.22); }

.op-body { max-width:1240px; margin:0 auto; padding:0 24px; }

/* Toolbar */
.op-toolbar { display:flex; flex-wrap:wrap; gap:10px; align-items:center; margin-bottom:16px; }
.op-search-wrap { position:relative; flex:1; min-width:200px; }
.op-search-ico  { position:absolute; left:12px; top:50%; transform:translateY(-50%); color:#a08060; pointer-events:none; }
.op-search  { width:100%; box-sizing:border-box; padding:10px 14px 10px 36px; border:1.5px solid rgba(200,140,40,0.22); border-radius:10px; background:#fff; color:#2d1200; font-family:'DM Sans',sans-serif; font-size:0.875rem; outline:none; transition:border-color 0.15s; }
.op-search:focus { border-color:#c8903c; box-shadow:0 0 0 3px rgba(200,140,40,0.1); }
.op-filter  { padding:10px 14px; border:1.5px solid rgba(200,140,40,0.22); border-radius:10px; background:#fff; color:#2d1200; font-family:'DM Sans',sans-serif; font-size:0.875rem; outline:none; cursor:pointer; min-width:140px; }
.op-filter:focus { border-color:#c8903c; }

/* Table */
.op-card { background:#fff; border:1px solid rgba(200,140,40,0.18); border-top:3px solid #c8903c; border-radius:16px; overflow:hidden; box-shadow:0 2px 16px rgba(61,23,0,0.07); }
.op-table-scroll { overflow-x:auto; }
.op-table { width:100%; border-collapse:collapse; min-width:960px; }
.op-thead-row { background:linear-gradient(to right,rgba(200,140,40,0.09),rgba(200,140,40,0.04)); border-bottom:1.5px solid rgba(200,140,40,0.18); }
.op-th { padding:11px 14px; text-align:left; font-family:'Cinzel',serif; font-size:0.58rem; font-weight:700; color:#7a4a10; letter-spacing:0.14em; text-transform:uppercase; white-space:nowrap; }
.op-th-right { text-align:right; }
.op-tr { border-bottom:1px solid rgba(200,140,40,0.07); transition:background 0.12s; }
.op-tr:last-child { border-bottom:none; }
.op-tr:hover { background:rgba(200,140,40,0.03); }
.op-tr-inactive { opacity:0.6; }
.op-td { padding:12px 14px; font-size:0.82rem; color:#3d1800; vertical-align:middle; }
.op-td-right { text-align:right; }

/* Key badge */
.op-key-badge { font-family:'Cinzel',serif; font-size:0.76rem; font-weight:700; background:linear-gradient(135deg,rgba(200,140,40,0.12),rgba(200,140,40,0.06)); border:1px solid rgba(200,140,40,0.25); color:#7a3200; padding:4px 10px; border-radius:20px; white-space:nowrap; }

/* Badges */
.op-badge { display:inline-block; padding:3px 9px; border-radius:20px; font-size:0.68rem; font-weight:700; letter-spacing:0.04em; }
.op-badge-active   { background:rgba(22,163,74,0.1);   color:#15803d; border:1px solid rgba(22,163,74,0.2); }
.op-badge-inactive { background:rgba(100,100,100,0.08); color:#6b7280; border:1px solid rgba(100,100,100,0.15); }
.op-badge-virtual  { background:rgba(124,58,237,0.1);  color:#6d28d9; border:1px solid rgba(124,58,237,0.2); }
.op-badge-physical { background:rgba(14,116,144,0.1);  color:#0e7490; border:1px solid rgba(14,116,144,0.2); }
.op-badge-promoted { background:rgba(245,158,11,0.1); color:#92400e; border:1px solid rgba(245,158,11,0.2); }

/* Action buttons */
.op-action-group { display:flex; align-items:center; justify-content:flex-end; gap:6px; }
.op-btn {
  display:inline-flex; align-items:center; gap:5px; padding:6px 11px;
  border:none; border-radius:8px; font-family:'DM Sans',sans-serif;
  font-size:0.76rem; font-weight:700; cursor:pointer; transition:all 0.15s; white-space:nowrap;
}
.op-btn-att { background:linear-gradient(135deg,#7a3200,#b85000); color:#fff; }
.op-btn-att:hover:not(:disabled) { background:linear-gradient(135deg,#8d3a00,#d06000); transform:translateY(-1px); }
.op-btn-att:disabled { opacity:0.4; cursor:not-allowed; transform:none; }
.op-btn-disable { background:rgba(220,38,38,0.08); color:#b91c1c; border:1px solid rgba(220,38,38,0.2); }
.op-btn-disable:hover { background:rgba(220,38,38,0.15); }
.op-btn-enable  { background:rgba(22,163,74,0.08);  color:#15803d; border:1px solid rgba(22,163,74,0.2); }
.op-btn-enable:hover  { background:rgba(22,163,74,0.15); }

/* Confirm modal */
.op-overlay { position:fixed; inset:0; z-index:400; background:rgba(30,10,0,0.55); backdrop-filter:blur(4px); display:flex; align-items:center; justify-content:center; padding:20px; }
.op-modal { background:#fff; width:100%; max-width:420px; border-radius:16px; overflow:hidden; border:1px solid rgba(200,140,40,0.2); box-shadow:0 20px 60px rgba(61,23,0,0.22); animation:opIn 0.2s cubic-bezier(0.22,1,0.36,1) both; }
@keyframes opIn { from{opacity:0;transform:translateY(12px) scale(0.97)} to{opacity:1;transform:none} }
.op-modal-hd { background:linear-gradient(135deg,#3d1700,#7a3200); padding:16px 20px; display:flex; align-items:center; justify-content:space-between; }
.op-modal-title { font-family:'Cinzel',serif; font-size:0.92rem; font-weight:700; color:#fff; margin:0; }
.op-modal-close { width:28px; height:28px; background:rgba(255,255,255,0.1); border:none; border-radius:7px; display:flex; align-items:center; justify-content:center; cursor:pointer; color:rgba(255,255,255,0.75); transition:background 0.15s; }
.op-modal-close:hover { background:rgba(255,255,255,0.2); }
.op-modal-body { padding:20px; }
.op-modal-alert { display:flex; gap:12px; padding:12px 14px; border-radius:10px; margin-bottom:18px; font-size:0.82rem; line-height:1.6; }
.op-modal-alert-red   { background:rgba(220,38,38,0.07); border:1px solid rgba(220,38,38,0.2); color:#991b1b; }
.op-modal-alert-green { background:rgba(22,163,74,0.07);  border:1px solid rgba(22,163,74,0.2);  color:#166534; }
.op-modal-foot { display:flex; gap:10px; }
.op-modal-cancel { flex:1; padding:10px; background:#fff; color:#5c3a14; border:1.5px solid rgba(200,140,40,0.3); border-radius:9px; font-family:'DM Sans',sans-serif; font-size:0.875rem; font-weight:600; cursor:pointer; transition:all 0.15s; }
.op-modal-cancel:hover { background:rgba(200,140,40,0.05); }
.op-modal-confirm { flex:1; padding:10px; border:none; border-radius:9px; font-family:'DM Sans',sans-serif; font-size:0.875rem; font-weight:700; color:#fff; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:7px; transition:all 0.15s; }
.op-modal-confirm-red   { background:linear-gradient(135deg,#dc2626,#b91c1c); }
.op-modal-confirm-green { background:linear-gradient(135deg,#16a34a,#15803d); }
.op-modal-confirm:hover:not(:disabled) { opacity:0.88; transform:translateY(-1px); }
.op-modal-confirm:disabled { opacity:0.5; cursor:not-allowed; transform:none; }
.op-spin { width:13px; height:13px; border-radius:50%; border:2px solid rgba(255,255,255,0.35); border-top-color:#fff; animation:opSpin 0.7s linear infinite; }
@keyframes opSpin { to{transform:rotate(360deg);} }

/* Skeleton / Empty */
.op-skel { background:linear-gradient(90deg,rgba(200,140,40,0.07) 25%,rgba(200,140,40,0.14) 50%,rgba(200,140,40,0.07) 75%); background-size:200% 100%; animation:opSkelAni 1.4s infinite; border-radius:6px; }
@keyframes opSkelAni { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
.op-empty { padding:52px 24px; text-align:center; }
.op-empty-ico  { width:44px; height:44px; margin:0 auto 12px; color:#c4a880; opacity:0.6; }
.op-empty-title { font-family:'Cinzel',serif; font-size:0.96rem; color:#3d1800; margin-bottom:6px; }
.op-empty-sub   { font-size:0.84rem; color:#8b6840; }
.op-footer { padding:10px 16px; border-top:1px solid rgba(200,140,40,0.1); background:rgba(200,140,40,0.03); font-size:0.75rem; color:#a08060; }
.op-footer strong { color:#5c3a14; }

@media(max-width:640px) { .op-toolbar{flex-direction:column;} .op-search{min-width:unset;} }
`;

// SVG icons
const IcoSearch = () => (
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
      d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
    />
  </svg>
);
const IcoPlus = () => (
  <svg
    width={13}
    height={13}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2.5}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 4.5v15m7.5-7.5h-15"
    />
  </svg>
);
const IcoCheck = () => (
  <svg
    width={13}
    height={13}
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
const IcoBan = () => (
  <svg
    width={13}
    height={13}
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
const IcoAttend = () => (
  <svg
    width={13}
    height={13}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
    />
  </svg>
);
const IcoClose = () => (
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
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);
const IcoEmptyDoc = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
    />
  </svg>
);

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// Confirm toggle modal
function ToggleModal({ program, onClose, onConfirm, loading }) {
  const willDisable = program.actFlag !== "inactive";
  return (
    <div
      className="op-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="op-modal">
        <div className="op-modal-hd">
          <p className="op-modal-title">
            {willDisable ? "Disable Program" : "Enable Program"}
          </p>
          <button className="op-modal-close" onClick={onClose}>
            <IcoClose />
          </button>
        </div>
        <div className="op-modal-body">
          <div
            className={`op-modal-alert ${
              willDisable ? "op-modal-alert-red" : "op-modal-alert-green"
            }`}
          >
            {willDisable ? (
              <>
                ⚠️ Disabling <strong>{program.programKey}</strong> will mark it
                inactive and set Promoted to "Yes". Attendance cannot be
                recorded for inactive programs.
              </>
            ) : (
              <>
                ✅ Enabling <strong>{program.programKey}</strong> will mark it
                active and clear the Promoted status.
              </>
            )}
          </div>
          <div className="op-modal-foot">
            <button className="op-modal-cancel" onClick={onClose}>
              Cancel
            </button>
            <button
              className={`op-modal-confirm ${
                willDisable ? "op-modal-confirm-red" : "op-modal-confirm-green"
              }`}
              onClick={onConfirm}
              disabled={loading}
            >
              {loading ? (
                <span className="op-spin" />
              ) : willDisable ? (
                <IcoBan />
              ) : (
                <IcoCheck />
              )}
              {loading ? "Updating…" : willDisable ? "Disable" : "Enable"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OwnerPrograms() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [areaFilter, setAreaFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [flagFilter, setFlagFilter] = useState("");
  const [areas, setAreas] = useState([]);
  const [types, setTypes] = useState([]);

  const [toggleTarget, setToggleTarget] = useState(null);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    api
      .get("/config")
      .then((r) => {
        setAreas(r.data.area || []);
        setTypes(r.data.programType || []);
      })
      .catch(() => {});
  }, []);

  const fetchPrograms = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (areaFilter) params.area = areaFilter;
      if (typeFilter) params.programType = typeFilter;
      if (flagFilter) params.actFlag = flagFilter;
      if (search) params.search = search;
      const res = await api.get("/programs", { params });
      setPrograms(res.data.programs || []);
    } catch {
      toast.error("Failed to load programs.");
    } finally {
      setLoading(false);
    }
  }, [search, areaFilter, typeFilter, flagFilter]);

  useEffect(() => {
    const t = setTimeout(fetchPrograms, 300);
    return () => clearTimeout(t);
  }, [fetchPrograms]);

  const handleToggle = async () => {
    if (!toggleTarget) return;
    setToggling(true);
    try {
      const res = await api.patch(
        `/programs/${toggleTarget._id}/toggle-status`
      );
      toast.success(res.data.message);
      setPrograms((prev) =>
        prev.map((p) =>
          p._id === toggleTarget._id
            ? { ...p, actFlag: res.data.actFlag, promoted: res.data.promoted }
            : p
        )
      );
      setToggleTarget(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update status.");
    } finally {
      setToggling(false);
    }
  };

  const COLS = [
    "Program Key",
    "Area",
    "Sub Area",
    "Owner",
    "Freq.",
    "Type",
    "Language",
    "Virtual",
    "Start Date",
    "Day",
    "Time",
    "Status",
    "Promoted",
    "Actions",
  ];

  return (
    <>
      <style>{css}</style>
      <div className="op-page">
        <div className="op-banner">
          <div className="op-banner-inner">
            <div>
              <div className="op-eyebrow">Owner Portal</div>
              <h1 className="op-title">My Programs</h1>
              <p className="op-sub">
                All programs assigned to you. Click Attendance to mark sessions.
              </p>
            </div>
            <div
              className="op-add-btn"
              onClick={() => navigate("/owner/add-program")}
            >
              <IcoPlus /> Add Program
            </div>
          </div>
        </div>

        <div className="op-body">
          <div className="op-toolbar">
            <div className="op-search-wrap">
              <span className="op-search-ico">
                <IcoSearch />
              </span>
              <input
                className="op-search"
                type="text"
                placeholder="Search program key, area…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="op-filter"
              value={areaFilter}
              onChange={(e) => setAreaFilter(e.target.value)}
            >
              <option value="">All Areas</option>
              {areas.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
            <select
              className="op-filter"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="">All Types</option>
              {types.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <select
              className="op-filter"
              value={flagFilter}
              onChange={(e) => setFlagFilter(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="op-card">
            <div className="op-table-scroll">
              <table className="op-table">
                <thead>
                  <tr className="op-thead-row">
                    {COLS.map((c) => (
                      <th
                        key={c}
                        className={`op-th${
                          c === "Actions" ? " op-th-right" : ""
                        }`}
                      >
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={i} className="op-tr">
                        <td colSpan={14} className="op-td">
                          <div
                            style={{
                              display: "flex",
                              gap: 12,
                              alignItems: "center",
                            }}
                          >
                            <div
                              className="op-skel"
                              style={{
                                width: 80,
                                height: 22,
                                borderRadius: 20,
                              }}
                            />
                            <div
                              className="op-skel"
                              style={{ flex: 1, height: 12 }}
                            />
                            <div
                              className="op-skel"
                              style={{ width: 60, height: 12 }}
                            />
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : programs.length === 0 ? (
                    <tr>
                      <td colSpan={14}>
                        <div className="op-empty">
                          <div className="op-empty-ico">
                            <IcoEmptyDoc />
                          </div>
                          <div className="op-empty-title">
                            No Programs Found
                          </div>
                          <p className="op-empty-sub">
                            Adjust your filters or add a new program.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    programs.map((p) => (
                      <tr
                        key={p._id}
                        className={`op-tr${
                          p.actFlag === "inactive" ? " op-tr-inactive" : ""
                        }`}
                      >
                        <td className="op-td">
                          <span className="op-key-badge">{p.programKey}</span>
                        </td>
                        <td className="op-td">{p.area}</td>
                        <td className="op-td">{p.subArea}</td>
                        <td className="op-td">{p.programOwner?.name || "—"}</td>
                        <td className="op-td">{p.frequency}</td>
                        <td className="op-td">{p.programType}</td>
                        <td className="op-td">{p.language}</td>
                        <td className="op-td">
                          <span
                            className={`op-badge ${
                              p.isVirtual
                                ? "op-badge-virtual"
                                : "op-badge-physical"
                            }`}
                          >
                            {p.isVirtual ? "Virtual" : "In Person"}
                          </span>
                        </td>
                        <td className="op-td">{fmtDate(p.startDate)}</td>
                        <td className="op-td">{p.day}</td>
                        <td className="op-td">{p.time}</td>
                        <td className="op-td">
                          <span
                            className={`op-badge ${
                              p.actFlag === "inactive"
                                ? "op-badge-inactive"
                                : "op-badge-active"
                            }`}
                          >
                            {p.actFlag || "active"}
                          </span>
                        </td>
                        <td className="op-td">
                          {p.promoted === "Yes" ? (
                            <span className="op-badge op-badge-promoted">
                              Yes
                            </span>
                          ) : (
                            <span
                              style={{ color: "#a08060", fontSize: "0.78rem" }}
                            >
                              —
                            </span>
                          )}
                        </td>
                        <td className="op-td op-td-right">
                          <div className="op-action-group">
                            <button
                              className="op-btn op-btn-att"
                              onClick={() =>
                                navigate(`/owner/attendance/${p._id}`)
                              }
                              disabled={p.actFlag === "inactive"}
                              title={
                                p.actFlag === "inactive"
                                  ? "Program is inactive"
                                  : "Mark Attendance"
                              }
                            >
                              <IcoAttend /> Attendance
                            </button>
                            <button
                              className={`op-btn ${
                                p.actFlag === "inactive"
                                  ? "op-btn-enable"
                                  : "op-btn-disable"
                              }`}
                              onClick={() => setToggleTarget(p)}
                              title={
                                p.actFlag === "inactive"
                                  ? "Enable Program"
                                  : "Disable Program"
                              }
                            >
                              {p.actFlag === "inactive" ? (
                                <>
                                  <IcoCheck /> Enable
                                </>
                              ) : (
                                <>
                                  <IcoBan /> Disable
                                </>
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {!loading && programs.length > 0 && (
              <div className="op-footer">
                Showing <strong>{programs.length}</strong> program
                {programs.length !== 1 ? "s" : ""}
              </div>
            )}
          </div>
        </div>
      </div>

      {toggleTarget && (
        <ToggleModal
          program={toggleTarget}
          onClose={() => setToggleTarget(null)}
          onConfirm={handleToggle}
          loading={toggling}
        />
      )}
    </>
  );
}
