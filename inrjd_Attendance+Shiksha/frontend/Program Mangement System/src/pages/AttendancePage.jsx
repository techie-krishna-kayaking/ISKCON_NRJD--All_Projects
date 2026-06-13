import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import toast from "react-hot-toast";
import ParticipantUpload from "../components/ParticipantUpload";

const css = `
.att-page { min-height:100vh; background:#f5efe6; font-family:'DM Sans',sans-serif; padding-bottom:60px; }

/* ── Banner ── */
.att-banner {
  background:linear-gradient(135deg,#3d1700 0%,#762e00 50%,#9d3e00 100%);
  padding:28px 24px; margin-bottom:28px; position:relative; overflow:hidden;
}
.att-banner::after { content:''; position:absolute; bottom:0; left:0; right:0; height:2px; background:linear-gradient(90deg,transparent,var(--g-400),transparent); }
.att-banner-inner  { max-width:1100px; margin:0 auto; position:relative; z-index:1; }
.att-back {
  display:inline-flex; align-items:center; gap:6px; margin-bottom:14px;
  font-size:0.8rem; font-weight:600; color:rgba(255,210,140,0.75);
  background:none; border:none; cursor:pointer; padding:0; transition:color 0.15s;
}
.att-back:hover { color:rgba(255,210,140,1); }
.att-key   { font-family:'Cinzel',serif; font-size:clamp(1.5rem,3vw,2rem); color:#fff; margin:0 0 5px; font-weight:700; }
.att-meta  { color:rgba(255,220,160,0.7); font-size:0.875rem; margin:0; display:flex; flex-wrap:wrap; gap:16px; }
.att-meta-item { display:flex; align-items:center; gap:5px; }

/* ── Body ── */
.att-body { max-width:1100px; margin:0 auto; padding:0 24px; }
.att-grid { display:grid; grid-template-columns:1fr 340px; gap:20px; align-items:start; }

/* ── Session form card ── */
.att-form-card {
  background:#fff; border:1px solid rgba(200,140,40,0.18); border-radius:16px;
  overflow:hidden; box-shadow:0 2px 14px rgba(61,23,0,0.06);
  position:sticky; top:20px;
}
.att-form-hd {
  background:linear-gradient(to right,rgba(200,140,40,0.09),rgba(200,140,40,0.04));
  border-bottom:1.5px solid rgba(200,140,40,0.15); padding:14px 18px;
  font-family:'Cinzel',serif; font-size:0.72rem; font-weight:700;
  color:#5c3a14; letter-spacing:0.12em; text-transform:uppercase;
}
.att-form-body { padding:18px; display:flex; flex-direction:column; gap:14px; }
.att-label { font-size:0.76rem; font-weight:600; color:#5c3a14; display:block; margin-bottom:5px; }
.att-label-req { color:#c8903c; margin-left:3px; }
.att-input,.att-select {
  width:100%; box-sizing:border-box; padding:10px 14px;
  border:1.5px solid rgba(200,140,40,0.22); border-radius:10px;
  background:#fdf8f0; color:#2d1200;
  font-family:'DM Sans',sans-serif; font-size:0.875rem; outline:none;
  transition:border-color 0.15s,box-shadow 0.15s;
}
.att-input:focus,.att-select:focus { border-color:#c8903c; box-shadow:0 0 0 3px rgba(200,140,40,0.12); }
.att-input::placeholder { color:#b09070; }
.att-select { cursor:pointer; }

.att-submit-btn {
  width:100%; padding:12px; background:linear-gradient(135deg,#7a3200,#b85000);
  color:#fff; border:none; border-radius:10px;
  font-family:'Cinzel',serif; font-size:0.88rem; font-weight:700; letter-spacing:0.05em;
  cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px;
  transition:all 0.18s; box-shadow:0 2px 10px rgba(120,50,0,0.2);
}
.att-submit-btn:hover:not(:disabled) { background:linear-gradient(135deg,#8d3a00,#d06000); transform:translateY(-1px); }
.att-submit-btn:disabled { opacity:0.5; cursor:not-allowed; transform:none; }
.att-spin { width:15px; height:15px; border-radius:50%; border:2px solid rgba(255,255,255,0.35); border-top-color:#fff; animation:attSpin 0.7s linear infinite; flex-shrink:0; }
@keyframes attSpin { to{transform:rotate(360deg);} }

/* ── Devotees card ── */
.att-dev-card {
  background:#fff; border:1px solid rgba(200,140,40,0.18); border-radius:16px;
  overflow:hidden; box-shadow:0 2px 14px rgba(61,23,0,0.06);
}
.att-dev-hd {
  background:linear-gradient(to right,rgba(200,140,40,0.09),rgba(200,140,40,0.04));
  border-bottom:1.5px solid rgba(200,140,40,0.15); padding:14px 18px;
  display:flex; align-items:center; justify-content:space-between;
}
.att-dev-title { font-family:'Cinzel',serif; font-size:0.72rem; font-weight:700; color:#5c3a14; letter-spacing:0.12em; text-transform:uppercase; }
.att-dev-count { font-size:0.68rem; font-weight:700; background:rgba(200,140,40,0.1); color:#7a4a00; padding:2px 8px; border-radius:12px; }

.att-search-wrap { position:relative; padding:14px 18px; border-bottom:1px solid rgba(200,140,40,0.08); }
.att-search-ico  { position:absolute; left:30px; top:50%; transform:translateY(-50%); width:14px; height:14px; color:#a08060; pointer-events:none; }
.att-dev-search  { width:100%; box-sizing:border-box; padding:9px 14px 9px 34px; border:1.5px solid rgba(200,140,40,0.2); border-radius:9px; background:#fdf8f0; color:#2d1200; font-family:'DM Sans',sans-serif; font-size:0.82rem; outline:none; }
.att-dev-search:focus { border-color:#c8903c; }

/* ── Bulk mark row ── */
.att-bulk-row { display:flex; gap:8px; padding:10px 18px; border-bottom:1px solid rgba(200,140,40,0.08); }
.att-bulk-btn {
  flex:1; padding:7px 12px; border:1.5px solid rgba(200,140,40,0.25); border-radius:8px;
  font-family:'DM Sans',sans-serif; font-size:0.78rem; font-weight:700; cursor:pointer; transition:all 0.15s;
}
.att-bulk-present { background:rgba(22,163,74,0.06); color:#15803d; border-color:rgba(22,163,74,0.25); }
.att-bulk-present:hover { background:rgba(22,163,74,0.12); }
.att-bulk-absent  { background:rgba(220,38,38,0.05); color:#b91c1c; border-color:rgba(220,38,38,0.2); }
.att-bulk-absent:hover { background:rgba(220,38,38,0.1); }

/* Devotee rows */
.att-dev-row {
  display:flex; align-items:center; gap:12px;
  padding:11px 18px; border-bottom:1px solid rgba(200,140,40,0.06); transition:background 0.12s;
}
.att-dev-row:last-child { border-bottom:none; }
.att-dev-row:hover { background:rgba(200,140,40,0.03); }

.att-dev-avatar {
  width:34px; height:34px; border-radius:9px; flex-shrink:0;
  background:linear-gradient(135deg,#c47a00,#7a3a00);
  display:flex; align-items:center; justify-content:center;
  font-family:'Cinzel',serif; font-size:0.65rem; font-weight:700; color:#fff;
}
.att-dev-info { flex:1; min-width:0; }
.att-dev-name  { font-weight:600; font-size:0.84rem; color:#2d1200; }
.att-contact-row { display:flex; align-items:center; gap:5px; margin-top:3px; }
.att-contact-btn {
  width:22px; height:22px; border-radius:6px; border:none; cursor:pointer;
  display:flex; align-items:center; justify-content:center;
  text-decoration:none; transition:all 0.15s; flex-shrink:0;
}
.att-call-btn { background:rgba(22,163,74,0.1); color:#15803d; }
.att-call-btn:hover { background:rgba(22,163,74,0.2); transform:scale(1.08); }
.att-wa-btn   { background:rgba(37,211,102,0.12); color:#16a34a; }
.att-wa-btn:hover { background:rgba(37,211,102,0.22); transform:scale(1.08); }

/* Pct badge */
.att-pct { font-size:0.7rem; font-weight:700; padding:2px 8px; border-radius:20px; white-space:nowrap; }
.att-pct-good { background:rgba(22,163,74,0.1); color:#15803d; }
.att-pct-fair { background:rgba(251,191,36,0.1); color:#92400e; }
.att-pct-low  { background:rgba(220,38,38,0.08); color:#991b1b; }

/* Radio group */
.att-radio-grp { display:flex; gap:6px; flex-shrink:0; }
.att-radio-lbl {
  display:flex; align-items:center; gap:5px; cursor:pointer;
  padding:5px 10px; border-radius:7px; border:1.5px solid rgba(200,140,40,0.18);
  font-size:0.75rem; font-weight:600; transition:all 0.14s; user-select:none;
}
.att-radio-lbl input[type="radio"] { accent-color:#16a34a; width:12px; height:12px; }
.att-radio-lbl.present { border-color:rgba(22,163,74,0.3); background:rgba(22,163,74,0.06); color:#15803d; }
.att-radio-lbl.absent  { border-color:rgba(220,38,38,0.25); background:rgba(220,38,38,0.05); color:#b91c1c; }

/* ── Add Devotee modal ── */
.att-modal-overlay {
  position:fixed; inset:0; z-index:400; background:rgba(30,10,0,0.55); backdrop-filter:blur(4px);
  display:flex; align-items:center; justify-content:center; padding:20px;
}
.att-modal {
  background:#fff; width:100%; max-width:440px; border-radius:16px; overflow:hidden;
  border:1px solid rgba(200,140,40,0.2); box-shadow:0 20px 60px rgba(61,23,0,0.22);
  animation:attModalIn 0.2s cubic-bezier(0.22,1,0.36,1) both;
}
@keyframes attModalIn { from{opacity:0;transform:translateY(14px) scale(0.97)} to{opacity:1;transform:none} }
.att-modal-hd {
  background:linear-gradient(135deg,#3d1700,#7a3200); padding:16px 20px;
  display:flex; align-items:center; justify-content:space-between;
}
.att-modal-title { font-family:'Cinzel',serif; font-size:0.95rem; font-weight:700; color:#fff; margin:0; }
.att-modal-close { width:28px; height:28px; background:rgba(255,255,255,0.1); border:none; border-radius:7px; display:flex; align-items:center; justify-content:center; cursor:pointer; color:rgba(255,255,255,0.75); transition:background 0.15s; }
.att-modal-close:hover { background:rgba(255,255,255,0.2); color:#fff; }
.att-modal-body { padding:20px; display:flex; flex-direction:column; gap:12px; }
.att-modal-foot { display:flex; gap:10px; padding:0 20px 20px; }
.att-modal-cancel { flex:1; padding:10px; background:#fff; color:#5c3a14; border:1.5px solid rgba(200,140,40,0.3); border-radius:9px; font-family:'DM Sans',sans-serif; font-size:0.875rem; font-weight:600; cursor:pointer; transition:all 0.15s; }
.att-modal-cancel:hover { background:rgba(200,140,40,0.06); }
.att-modal-save  { flex:1; padding:10px; background:linear-gradient(135deg,#7a3200,#b85000); color:#fff; border:none; border-radius:9px; font-family:'DM Sans',sans-serif; font-size:0.875rem; font-weight:700; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:7px; transition:all 0.15s; }
.att-modal-save:hover:not(:disabled) { background:linear-gradient(135deg,#8d3a00,#d06000); }
.att-modal-save:disabled { opacity:0.5; cursor:not-allowed; }

/* Skeleton */
.att-skel { background:linear-gradient(90deg,rgba(200,140,40,0.07) 25%,rgba(200,140,40,0.14) 50%,rgba(200,140,40,0.07) 75%); background-size:200% 100%; animation:attShimmer 1.4s infinite; border-radius:6px; }
@keyframes attShimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

/* Mini stat row */
.att-stats-row { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; margin-bottom:20px; }
.att-mini-stat { background:var(--cream-card); border:1px solid rgba(200,140,40,0.15); border-radius:12px; padding:12px 14px; }
.att-mini-val { font-family:'Cinzel',serif; font-size:1.4rem; font-weight:700; color:#2d1200; line-height:1; margin-bottom:3px; }
.att-mini-lbl { font-size:0.68rem; font-weight:600; color:#8b6840; text-transform:uppercase; letter-spacing:0.06em; }

@media(max-width:860px) { .att-grid { grid-template-columns:1fr; } .att-form-card { position:static; } }
@media(max-width:520px) { .att-stats-row { grid-template-columns:1fr 1fr; } }
`;

// Programs where "Add Devotee" button is shown
const ADD_DEVOTEE_TYPES = [
  "Gita Manjari",
  "Book Reading",
  "Tulasi Manjari",
  "Children Program",
  "Gita Learning Program",
];

function pctClass(pct) {
  if (pct >= 80) return "good";
  if (pct >= 40) return "fair";
  return "low";
}
function initials(name) {
  return (
    name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?"
  );
}
function waLink(phone) {
  const clean = phone?.replace(/\D/g, "");
  if (!clean) return null;
  return `https://wa.me/${clean}`;
}
function callLink(phone) {
  const clean = phone?.replace(/\D/g, "");
  if (!clean) return null;
  return `tel:+${clean}`;
}

// ── Add Devotee Modal ─────────────────────────────────────────────────
function AddDevoteeModal({ programId, onClose, onAdded }) {
  const [form, setForm] = useState({ name: "", phone: "", email: "" });
  const [saving, setSave] = useState(false);
  const [name, setName] = useState(prefillName);

  const submit = async () => {
    if (!form.name.trim()) {
      toast.error("Name is required.");
      return;
    }
    setSave(true);
    try {
      const res = await api.post(`/attendance/add-devotee/${programId}`, form);
      toast.success(res.data.message);
      onAdded(res.data.devotee);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add devotee.");
    } finally {
      setSave(false);
    }
  };

  return (
    <div
      className="att-modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="att-modal">
        <div className="att-modal-hd">
          <p className="att-modal-title">Add Devotee</p>
          <button className="att-modal-close" onClick={onClose}>
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
          </button>
        </div>
        <div className="att-modal-body">
          {[
            ["name", "Full Name *", "text", "e.g. Radha Devi"],
            ["phone", "Phone", "tel", "+91 XXXXX XXXXX"],
            ["email", "Email", "email", "email@example.com"],
          ].map(([f, l, t, p]) => (
            <div key={f}>
              <label className="att-label">{l}</label>
              <input
                type={t}
                className="att-input"
                placeholder={p}
                value={form[f]}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, [f]: e.target.value }))
                }
              />
            </div>
          ))}
        </div>
        <div className="att-modal-foot">
          <button className="att-modal-cancel" onClick={onClose}>
            Cancel
          </button>
          <button className="att-modal-save" onClick={submit} disabled={saving}>
            {saving ? <span className="att-spin" /> : null}
            {saving ? "Adding…" : "Add Devotee"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────
export default function AttendancePage() {
  const { id: programId } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Session form
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [hostName, setHost] = useState("");
  const [chapter, setChapter] = useState("");

  // Devotee attendance state: { [devoteeName]: "present"|"absent" }
  const [marks, setMarks] = useState({});
  const [search, setSearch] = useState("");
  const [submitting, setSub] = useState(false);
  const [showAddModal, setAddModal] = useState(false);
  const [addPreFill, setAddPreFill] = useState("");

  useEffect(() => {
    api
      .get(`/attendance/program/${programId}`)
      .then((r) => {
        setData(r.data);
        // Pre-mark all as present
        const init = {};
        r.data.devotees.forEach((d) => {
          init[d.name] = "present";
        });
        setMarks(init);
      })
      .catch(() => toast.error("Failed to load attendance data."))
      .finally(() => setLoading(false));
  }, [programId]);

  const markAll = (status) => {
    const next = {};
    (data?.devotees || []).forEach((d) => {
      next[d.name] = status;
    });
    setMarks(next);
  };

  const filtered = (data?.devotees || []).filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase())
  );

  const isBV = data?.program?.programType === "BV";
  const canAddDevotee = ADD_DEVOTEE_TYPES.includes(data?.program?.programType);

  // Stats
  const presentCount = Object.values(marks).filter(
    (v) => v === "present"
  ).length;
  const absentCount = Object.values(marks).filter((v) => v === "absent").length;

  const handleSubmit = async () => {
    if (!date) {
      toast.error("Attendance date is required.");
      return;
    }
    if (!hostName.trim()) {
      toast.error("Host name is required.");
      return;
    }
    if (isBV && !chapter) {
      toast.error("BV Chapter is required.");
      return;
    }

    const records = Object.entries(marks).map(([devoteeName, status]) => ({
      devoteeName,
      status,
    }));
    if (!records.length) {
      toast.error("No devotees to submit.");
      return;
    }

    setSub(true);
    try {
      const res = await api.post("/attendance/submit", {
        programId,
        date,
        hostName,
        chapter,
        records,
      });
      toast.success(res.data.message);
      // Refresh data to update percentages
      const r = await api.get(`/attendance/program/${programId}`);
      setData(r.data);
      setHost("");
      setChapter("");
      setDate(new Date().toISOString().split("T")[0]);
      const init = {};
      r.data.devotees.forEach((d) => {
        init[d.name] = "present";
      });
      setMarks(init);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit.");
    } finally {
      setSub(false);
    }
  };

  const handleDevoteeAdded = (devotee) => {
    setData((prev) => ({ ...prev, devotees: [...prev.devotees, devotee] }));
    setMarks((prev) => ({ ...prev, [devotee.name]: "present" }));
  };

  if (loading)
    return (
      <div
        style={{
          padding: 48,
          textAlign: "center",
          color: "#8b6840",
          fontFamily: "'Cinzel',serif",
          fontSize: "0.85rem",
        }}
      >
        🪷 Loading attendance data…
      </div>
    );

  const prog = data?.program;

  return (
    <>
      <style>{css}</style>
      <div className="att-page">
        {/* Banner */}
        <div className="att-banner">
          <div className="att-banner-inner">
            <button
              className="att-back"
              onClick={() => navigate("/owner/programs")}
            >
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
              Back to Programs
            </button>
            <h1 className="att-key">{prog?.programKey}</h1>
            <p className="att-meta">
              <span className="att-meta-item">
                📍 {prog?.area} · {prog?.subArea}
              </span>
              <span className="att-meta-item">📋 {prog?.programType}</span>
              <span className="att-meta-item">🔁 {prog?.frequency}</span>
              <span className="att-meta-item">🗣️ {prog?.language}</span>
              {data?.lastSessionDate && (
                <span className="att-meta-item">
                  🕐 Last session:{" "}
                  {new Date(data.lastSessionDate).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="att-body">
          {/* Mini stats */}
          <div className="att-stats-row">
            <div className="att-mini-stat">
              <div className="att-mini-val">{data?.devotees?.length || 0}</div>
              <div className="att-mini-lbl">Total Devotees</div>
            </div>
            <div className="att-mini-stat">
              <div className="att-mini-val">{data?.totalSessions || 0}</div>
              <div className="att-mini-lbl">Total Sessions</div>
            </div>
            <div className="att-mini-stat">
              <div className="att-mini-val" style={{ color: "#15803d" }}>
                {presentCount}
              </div>
              <div className="att-mini-lbl">Marked Present</div>
            </div>
          </div>

          <div className="att-grid">
            {/* ── LEFT: Devotees table ── */}
            <div className="att-dev-card">
              <div className="att-dev-hd">
                <span className="att-dev-title">Devotees</span>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {canAddDevotee && (
                    <button
                      onClick={() => setAddModal(true)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                        padding: "5px 12px",
                        border: "1.5px solid rgba(200,140,40,0.3)",
                        borderRadius: 8,
                        background: "rgba(200,140,40,0.08)",
                        color: "#5c3a14",
                        fontFamily: "'DM Sans',sans-serif",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        cursor: "pointer",
                        transition: "all 0.15s",
                      }}
                    >
                      <svg
                        width={12}
                        height={12}
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
                      Add Devotee
                    </button>
                  )}
                  {data?.program?.isVirtual && (
                    <ParticipantUpload
                      devotees={data?.devotees || []}
                      marks={marks}
                      onApply={(newMarks) => setMarks(newMarks)}
                      onAddDevotee={(preFill) => {
                        setAddPreFill(preFill);
                        setAddModal(true);
                      }}
                    />
                  )}
                  <span className="att-dev-count">
                    {data?.devotees?.length || 0}
                  </span>
                </div>
              </div>

              {/* Search */}
              <div className="att-search-wrap">
                <svg
                  className="att-search-ico"
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
                  className="att-dev-search"
                  type="text"
                  placeholder="Search devotee…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              {/* Bulk mark */}
              <div className="att-bulk-row">
                <button
                  className="att-bulk-btn att-bulk-present"
                  onClick={() => markAll("present")}
                >
                  ✓ Mark All Present
                </button>
                <button
                  className="att-bulk-btn att-bulk-absent"
                  onClick={() => markAll("absent")}
                >
                  ✗ Mark All Absent
                </button>
              </div>

              {/* Devotee rows */}
              {filtered.length === 0 ? (
                <div
                  style={{
                    padding: "32px 18px",
                    textAlign: "center",
                    color: "#a08060",
                    fontSize: "0.82rem",
                    fontFamily: "'Cinzel',serif",
                  }}
                >
                  No devotees found.
                </div>
              ) : (
                filtered.map((d) => {
                  const summary = data?.summaryMap?.[d.name];
                  const pct = summary?.percentage ?? null;
                  const cls = pct !== null ? pctClass(pct) : null;
                  const wa = waLink(d.phone);
                  const call = callLink(d.phone);
                  const curMark = marks[d.name] || "present";
                  const addedDate = d.addedToProgram || summary?.addedToProgram;

                  return (
                    <div key={d._id} className="att-dev-row">
                      <div className="att-dev-avatar">{initials(d.name)}</div>
                      <div className="att-dev-info">
                        <div className="att-dev-name">{d.name}</div>
                        {d.phone && (
                          <div className="att-contact-row">
                            {/* Call icon */}
                            {call && (
                              <a
                                href={call}
                                className="att-contact-btn att-call-btn"
                                title={`Call ${d.phone}`}
                              >
                                <svg
                                  width={12}
                                  height={12}
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                  strokeWidth={2}
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M2.25 6.338c0-1.2.957-2.25 2.157-2.25h.5a2.25 2.25 0 012.25 2.25c0 .66.267 1.285.757 1.787l.514.516a3.75 3.75 0 01.847 3.946l-.213.64a1.5 1.5 0 00.405 1.564l2.906 2.906a1.5 1.5 0 001.564.405l.64-.213a3.75 3.75 0 013.946.847l.516.514c.502.49.757 1.127.757 1.787 0 1.2-1.05 2.157-2.25 2.157h-.5c-8.284 0-15-6.716-15-15v-.5z"
                                  />
                                </svg>
                              </a>
                            )}
                            {/* WhatsApp icon */}
                            {wa && (
                              <a
                                href={wa}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="att-contact-btn att-wa-btn"
                                title={`WhatsApp ${d.phone}`}
                              >
                                <svg
                                  width={12}
                                  height={12}
                                  viewBox="0 0 24 24"
                                  fill="currentColor"
                                >
                                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.12 1.533 5.849L.057 23.547a.5.5 0 00.609.64l5.925-1.854A11.944 11.944 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22a9.952 9.952 0 01-5.195-1.455l-.372-.221-3.86 1.208 1.16-3.744-.243-.387A9.952 9.952 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
                                </svg>
                              </a>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Attendance stats */}
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2, minWidth: 90 }}>
                        {pct !== null && (
                          <span className={`att-pct att-pct-${cls}`}>{pct}%</span>
                        )}
                        {summary && (
                          <span style={{ fontSize: "0.65rem", color: "#8a7a68", fontFamily: "'Cinzel',serif" }}>
                            {summary.attended}/{summary.totalSessions} sessions
                          </span>
                        )}
                        {addedDate && (
                          <span style={{ fontSize: "0.6rem", color: "#a09080", fontFamily: "'Cinzel',serif" }}>
                            Added {new Date(addedDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })}
                          </span>
                        )}
                      </div>

                      {/* Radio buttons */}
                      <div className="att-radio-grp">
                        <label
                          className={`att-radio-lbl${
                            curMark === "present" ? " present" : ""
                          }`}
                        >
                          <input
                            type="radio"
                            name={d.name}
                            value="present"
                            checked={curMark === "present"}
                            onChange={() =>
                              setMarks((p) => ({ ...p, [d.name]: "present" }))
                            }
                          />
                          Present
                        </label>
                        <label
                          className={`att-radio-lbl${
                            curMark === "absent" ? " absent" : ""
                          }`}
                        >
                          <input
                            type="radio"
                            name={d.name}
                            value="absent"
                            checked={curMark === "absent"}
                            onChange={() =>
                              setMarks((p) => ({ ...p, [d.name]: "absent" }))
                            }
                          />
                          Absent
                        </label>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* ── RIGHT: Session form ── */}
            <div className="att-form-card">
              <div className="att-form-hd">Session Details</div>
              <div className="att-form-body">
                <div>
                  <label className="att-label">
                    Attendance Date <span className="att-label-req">*</span>
                  </label>
                  <input
                    type="date"
                    className="att-input"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>

                <div>
                  <label className="att-label">
                    Host Name <span className="att-label-req">*</span>
                  </label>
                  <input
                    type="text"
                    className="att-input"
                    placeholder="Name of today's host"
                    value={hostName}
                    onChange={(e) => setHost(e.target.value)}
                  />
                </div>

                {isBV && (
                  <div>
                    <label className="att-label">
                      BV Chapter <span className="att-label-req">*</span>
                    </label>
                    <select
                      className="att-select"
                      value={chapter}
                      onChange={(e) => setChapter(e.target.value)}
                    >
                      <option value="">— Select Chapter —</option>
                      {(data?.bvChapters || []).map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Summary */}
                <div style={{ display: "flex", gap: 8 }}>
                  <div
                    style={{
                      flex: 1,
                      padding: "10px 14px",
                      background: "rgba(22,163,74,0.07)",
                      border: "1px solid rgba(22,163,74,0.2)",
                      borderRadius: 10,
                      textAlign: "center",
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "'Cinzel',serif",
                        fontSize: "1.3rem",
                        fontWeight: 700,
                        color: "#15803d",
                      }}
                    >
                      {presentCount}
                    </div>
                    <div
                      style={{
                        fontSize: "0.68rem",
                        color: "#15803d",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                      }}
                    >
                      Present
                    </div>
                  </div>
                  <div
                    style={{
                      flex: 1,
                      padding: "10px 14px",
                      background: "rgba(220,38,38,0.06)",
                      border: "1px solid rgba(220,38,38,0.18)",
                      borderRadius: 10,
                      textAlign: "center",
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "'Cinzel',serif",
                        fontSize: "1.3rem",
                        fontWeight: 700,
                        color: "#b91c1c",
                      }}
                    >
                      {absentCount}
                    </div>
                    <div
                      style={{
                        fontSize: "0.68rem",
                        color: "#b91c1c",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                      }}
                    >
                      Absent
                    </div>
                  </div>
                </div>

                <button
                  className="att-submit-btn"
                  onClick={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? <span className="att-spin" /> : null}
                  {submitting ? "Submitting…" : "🪷 Submit Attendance"}
                </button>

                <p
                  style={{
                    fontSize: "0.72rem",
                    color: "#a08060",
                    textAlign: "center",
                    lineHeight: 1.5,
                  }}
                >
                  Attendance is appended and cannot be edited after submission.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showAddModal && (
        <AddDevoteeModal
          programId={programId}
          prefillName={addPreFill}
          onClose={() => {
            setAddModal(false);
            setAddPreFill("");
          }}
          onAdded={handleDevoteeAdded}
        />
      )}
    </>
  );
}
