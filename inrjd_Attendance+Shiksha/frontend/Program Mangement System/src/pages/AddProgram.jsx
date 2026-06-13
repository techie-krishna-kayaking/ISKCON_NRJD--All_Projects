import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import toast from "react-hot-toast";

const css = `
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap');

.ap-page { min-height:100vh; background:#f5efe6; font-family:'DM Sans',sans-serif; padding-bottom:60px; }

/* ── Banner ── */
.ap-banner {
  background: linear-gradient(135deg, #2d1100 0%, #5c2500 35%, #8b3a00 70%, #b84800 100%);
  padding: 28px 0 24px; margin-bottom: 32px; position: relative; overflow: hidden;
}
.ap-banner::after {
  content:''; position:absolute; bottom:0; left:0; right:0; height:2px;
  background:linear-gradient(90deg,transparent,rgba(200,150,60,0.8),transparent);
}
.ap-banner-inner { max-width:860px; margin:0 auto; padding:0 24px; position:relative; z-index:1; }
.ap-eyebrow {
  font-family:'Cinzel',serif; font-size:0.62rem; font-weight:700;
  color:rgba(200,150,60,0.85); letter-spacing:0.22em; text-transform:uppercase;
  margin-bottom:8px; display:flex; align-items:center; gap:8px;
}
.ap-eyebrow::before,.ap-eyebrow::after { content:''; flex:1; max-width:36px; height:1px; background:rgba(200,150,60,0.35); }
.ap-banner-title { font-family:'Cinzel',serif; font-size:clamp(1.3rem,3vw,1.9rem); color:#fff; margin:0 0 5px; font-weight:700; }
.ap-banner-sub   { color:rgba(255,215,150,0.7); font-size:0.875rem; margin:0; }

/* ── Wrap ── */
.ap-wrap { max-width:860px; margin:0 auto; padding:0 24px; }

/* ── Section card ── */
.ap-section {
  background:#fff; border:1px solid rgba(200,140,40,0.18); border-radius:16px;
  overflow:hidden; margin-bottom:20px; box-shadow:0 2px 14px rgba(61,23,0,0.06);
}
.ap-section-hd {
  background:linear-gradient(to right,rgba(200,140,40,0.09),rgba(200,140,40,0.04));
  border-bottom:1.5px solid rgba(200,140,40,0.15);
  padding:14px 22px; display:flex; align-items:center; gap:10px;
}
.ap-section-icon {
  width:32px; height:32px; border-radius:9px; flex-shrink:0;
  background:rgba(200,140,40,0.12); display:flex; align-items:center; justify-content:center; font-size:0.95rem;
}
.ap-section-title { font-family:'Cinzel',serif; font-size:0.78rem; font-weight:700; color:#5c3a14; letter-spacing:0.1em; text-transform:uppercase; margin:0; }
.ap-section-body  { padding:22px; }

/* ── Grid ── */
.ap-grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:18px; }
.ap-grid-3 { display:grid; grid-template-columns:1fr 1fr 1fr; gap:18px; }

/* ── Field ── */
.ap-field { display:flex; flex-direction:column; gap:5px; }
.ap-label { font-size:0.76rem; font-weight:600; color:#5c3a14; letter-spacing:0.03em; }
.ap-label-req { color:#c8903c; margin-left:3px; font-size:0.7rem; }
.ap-input, .ap-select {
  padding:10px 14px; border:1.5px solid rgba(200,140,40,0.22); border-radius:10px;
  background:#fdf8f0; color:#2d1200; font-family:'DM Sans',sans-serif; font-size:0.875rem;
  outline:none; transition:border-color 0.15s,box-shadow 0.15s; width:100%; box-sizing:border-box;
}
.ap-input:focus,.ap-select:focus { border-color:#c8903c; box-shadow:0 0 0 3px rgba(200,140,40,0.12); }
.ap-select {
  cursor:pointer; appearance:none;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23a08060' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
  background-repeat:no-repeat; background-position:right 12px center; padding-right:36px;
}
.ap-input::placeholder { color:#b09070; }
.ap-input:disabled,.ap-select:disabled { background:rgba(200,140,40,0.05); color:#8b6840; cursor:not-allowed; }
.ap-field-err { font-size:0.72rem; color:#dc2626; margin-top:2px; }

/* ── Radio ── */
.ap-radio-group { display:flex; gap:12px; padding:2px 0; }
.ap-radio-label {
  display:flex; align-items:center; gap:7px; cursor:pointer;
  font-size:0.875rem; color:#3d1800; font-weight:500;
  padding:9px 16px; border:1.5px solid rgba(200,140,40,0.22); border-radius:10px;
  background:#fdf8f0; transition:all 0.15s; user-select:none;
}
.ap-radio-label.selected { border-color:#c8903c; background:rgba(200,140,40,0.08); color:#7a3200; }
.ap-radio-label input[type="radio"] { accent-color:#c8903c; width:14px; height:14px; }

/* ────────────────────────────────────────────────────────────────
   DEVOTEE SECTION — Accordion / Badge design
   ──────────────────────────────────────────────────────────────── */

/* Collapsed badges row */
.ap-dev-badges {
  display:flex; flex-wrap:wrap; gap:8px; margin-bottom:14px;
}
.ap-dev-badge {
  display:inline-flex; align-items:center; gap:6px;
  background:linear-gradient(135deg,rgba(200,140,40,0.12),rgba(200,140,40,0.07));
  border:1.5px solid rgba(200,140,40,0.28); border-radius:24px;
  padding:6px 10px 6px 12px;
  font-size:0.8rem; font-weight:600; color:#5c3a14;
  cursor:pointer; transition:all 0.15s;
  max-width:200px;
}
.ap-dev-badge:hover { border-color:#c8903c; background:rgba(200,140,40,0.15); }
.ap-dev-badge-avatar {
  width:22px; height:22px; border-radius:50%; flex-shrink:0;
  background:linear-gradient(135deg,#c47a00,#7a3a00);
  display:flex; align-items:center; justify-content:center;
  font-size:0.6rem; font-weight:700; color:#fff;
}
.ap-dev-badge-name {
  flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;
}
.ap-dev-badge-edit {
  width:18px; height:18px; border:none; border-radius:50%; background:rgba(200,140,40,0.15);
  color:#8b6840; cursor:pointer; display:flex; align-items:center; justify-content:center;
  transition:all 0.12s; flex-shrink:0; padding:0;
}
.ap-dev-badge-edit:hover { background:rgba(200,140,40,0.3); color:#5c3a14; }
.ap-dev-badge-del {
  width:18px; height:18px; border:none; border-radius:50%; background:rgba(220,38,38,0.1);
  color:#dc2626; cursor:pointer; display:flex; align-items:center; justify-content:center;
  transition:all 0.12s; flex-shrink:0; padding:0;
}
.ap-dev-badge-del:hover { background:rgba(220,38,38,0.2); }

/* Expanded devotee form */
.ap-dev-form {
  border:1.5px solid rgba(200,140,40,0.25); border-radius:12px;
  background:rgba(253,248,240,0.8);
  overflow:hidden; transition:all 0.2s;
}
.ap-dev-form-hd {
  display:flex; align-items:center; justify-content:space-between;
  padding:10px 14px;
  background:rgba(200,140,40,0.07); border-bottom:1px solid rgba(200,140,40,0.12);
}
.ap-dev-form-label {
  font-family:'Cinzel',serif; font-size:0.68rem; font-weight:700;
  color:#7a4a10; letter-spacing:0.1em; text-transform:uppercase;
}
.ap-dev-form-body { padding:14px; }
.ap-dev-grid { display:grid; grid-template-columns:1.4fr 1fr 1fr; gap:12px; }

/* Add devotee button */
.ap-add-devotee {
  display:flex; align-items:center; justify-content:center; gap:8px;
  padding:10px 18px; margin-top:12px;
  border:1.5px dashed rgba(200,140,40,0.35); border-radius:10px;
  background:transparent; cursor:pointer; width:100%;
  font-family:'DM Sans',sans-serif; font-size:0.85rem; font-weight:600; color:#8b6840;
  transition:all 0.15s;
}
.ap-add-devotee:hover { border-color:#c8903c; color:#5c3a14; background:rgba(200,140,40,0.05); }

/* Error alert */
.ap-dev-error {
  background:rgba(220,38,38,0.07); border:1px solid rgba(220,38,38,0.2);
  border-radius:8px; padding:8px 12px; margin-bottom:12px;
  font-size:0.8rem; color:#dc2626;
}

/* ── Submit ── */
.ap-submit-row { display:flex; gap:12px; align-items:center; padding:22px 0 0; }
.ap-submit {
  flex:1; padding:13px 24px; background:linear-gradient(135deg,#7a3200,#b85000);
  color:#fff; border:none; border-radius:12px; font-family:'Cinzel',serif;
  font-size:0.9rem; font-weight:700; letter-spacing:0.05em; cursor:pointer;
  display:flex; align-items:center; justify-content:center; gap:10px;
  transition:all 0.2s; box-shadow:0 3px 14px rgba(120,50,0,0.25);
}
.ap-submit:hover:not(:disabled) { background:linear-gradient(135deg,#8d3a00,#d06000); transform:translateY(-1px); }
.ap-submit:disabled { opacity:0.6; cursor:not-allowed; transform:none; }
.ap-reset {
  padding:13px 20px; background:#fff; color:#5c3a14;
  border:1.5px solid rgba(200,140,40,0.3); border-radius:12px;
  font-family:'DM Sans',sans-serif; font-size:0.875rem; font-weight:600;
  cursor:pointer; transition:all 0.15s;
}
.ap-reset:hover { background:rgba(200,140,40,0.06); border-color:rgba(200,140,40,0.5); }
.ap-spin {
  width:16px; height:16px; border-radius:50%; flex-shrink:0;
  border:2px solid rgba(255,255,255,0.35); border-top-color:#fff;
  animation:apSpin 0.7s linear infinite;
}
@keyframes apSpin { to { transform:rotate(360deg); } }

/* ── Responsive ── */
@media (max-width:700px) {
  .ap-grid-3 { grid-template-columns:1fr 1fr; }
  .ap-dev-grid { grid-template-columns:1fr; }
}
@media (max-width:500px) {
  .ap-grid-2,.ap-grid-3 { grid-template-columns:1fr; }
  .ap-radio-group { flex-direction:column; }
}
`;

// ─── Helpers ──────────────────────────────────────────────────────────
const BLANK_DEVOTEE = () => ({
  id: Date.now() + Math.random(),
  name: "",
  phone: "",
  email: "",
  collapsed: false,
});

function to12Hour(v) {
  if (!v) return "";
  const [h, m] = v.split(":").map(Number);
  const p = h >= 12 ? "PM" : "AM";
  return `${String(h % 12 || 12).padStart(2, "0")}:${String(m).padStart(
    2,
    "0"
  )} ${p}`;
}

function nameInitials(name) {
  return (
    name
      .trim()
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?"
  );
}

// ─── Devotee section ─────────────────────────────────────────────────
function DevoteeSection({ devotees, setDevotees, error }) {
  const setField = (id, field, val) =>
    setDevotees((prev) =>
      prev.map((d) => (d.id === id ? { ...d, [field]: val } : d))
    );

  const collapse = (id) =>
    setDevotees((prev) =>
      prev.map((d) => (d.id === id ? { ...d, collapsed: true } : d))
    );

  const expand = (id) =>
    setDevotees((prev) =>
      prev.map((d) => (d.id === id ? { ...d, collapsed: false } : d))
    );

  const remove = (id) => {
    if (devotees.length === 1) {
      toast.error("At least one devotee is required.");
      return;
    }
    setDevotees((prev) => prev.filter((d) => d.id !== id));
  };

  const addNew = () => {
    // Collapse all existing filled ones first
    setDevotees((prev) => [
      ...prev.map((d) => (d.name.trim() ? { ...d, collapsed: true } : d)),
      BLANK_DEVOTEE(),
    ]);
  };

  const collapsed = devotees.filter((d) => d.collapsed);
  const active = devotees.filter((d) => !d.collapsed);

  return (
    <div>
      {error && <div className="ap-dev-error">{error}</div>}

      {/* ── Collapsed badges ── */}
      {collapsed.length > 0 && (
        <div className="ap-dev-badges">
          {collapsed.map((d) => (
            <span
              className="ap-dev-badge"
              key={d.id}
              onClick={() => expand(d.id)}
              title="Click to edit"
            >
              <span className="ap-dev-badge-avatar">
                {nameInitials(d.name)}
              </span>
              <span className="ap-dev-badge-name">{d.name}</span>
              <button
                type="button"
                className="ap-dev-badge-edit"
                onClick={(e) => {
                  e.stopPropagation();
                  expand(d.id);
                }}
                title="Edit"
              >
                <svg
                  width={9}
                  height={9}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"
                  />
                </svg>
              </button>
              <button
                type="button"
                className="ap-dev-badge-del"
                onClick={(e) => {
                  e.stopPropagation();
                  remove(d.id);
                }}
                title="Remove"
              >
                <svg
                  width={9}
                  height={9}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </span>
          ))}
        </div>
      )}

      {/* ── Active (expanded) forms ── */}
      {active.map((d, i) => (
        <div className="ap-dev-form" key={d.id} style={{ marginBottom: 12 }}>
          <div className="ap-dev-form-hd">
            <span className="ap-dev-form-label">
              Devotee #{collapsed.length + i + 1}
            </span>
            <div style={{ display: "flex", gap: 6 }}>
              {/* Collapse if name is filled */}
              {d.name.trim() && (
                <button
                  type="button"
                  onClick={() => collapse(d.id)}
                  style={{
                    padding: "4px 10px",
                    border: "1px solid rgba(200,140,40,0.3)",
                    borderRadius: 6,
                    background: "transparent",
                    cursor: "pointer",
                    fontSize: "0.72rem",
                    fontWeight: 600,
                    color: "#8b6840",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    transition: "all 0.15s",
                  }}
                  title="Collapse to badge"
                >
                  <svg
                    width={11}
                    height={11}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4.5 15.75l7.5-7.5 7.5 7.5"
                    />
                  </svg>
                  Collapse
                </button>
              )}
              <button
                type="button"
                onClick={() => remove(d.id)}
                style={{
                  padding: "4px 10px",
                  border: "1px solid rgba(220,38,38,0.25)",
                  borderRadius: 6,
                  background: "transparent",
                  cursor: "pointer",
                  fontSize: "0.72rem",
                  fontWeight: 600,
                  color: "#dc2626",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  transition: "all 0.15s",
                }}
                title="Remove devotee"
              >
                <svg
                  width={11}
                  height={11}
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
                Remove
              </button>
            </div>
          </div>
          <div className="ap-dev-form-body">
            <div className="ap-dev-grid">
              <div className="ap-field">
                <label className="ap-label">
                  Name <span className="ap-label-req">*</span>
                </label>
                <input
                  type="text"
                  className="ap-input"
                  placeholder="Full name"
                  value={d.name}
                  onChange={(e) => setField(d.id, "name", e.target.value)}
                  autoFocus={i === active.length - 1}
                />
              </div>
              <div className="ap-field">
                <label className="ap-label">Phone</label>
                <input
                  type="tel"
                  className="ap-input"
                  placeholder="+91 XXXXX XXXXX"
                  value={d.phone}
                  onChange={(e) => setField(d.id, "phone", e.target.value)}
                />
              </div>
              <div className="ap-field">
                <label className="ap-label">Email</label>
                <input
                  type="email"
                  className="ap-input"
                  placeholder="email@example.com"
                  value={d.email}
                  onChange={(e) => setField(d.id, "email", e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      ))}

      <button type="button" className="ap-add-devotee" onClick={addNew}>
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
            d="M12 4.5v15m7.5-7.5h-15"
          />
        </svg>
        Add Another Devotee
        {collapsed.length > 0 && (
          <span
            style={{
              background: "rgba(200,140,40,0.15)",
              color: "#7a4a00",
              fontSize: "0.68rem",
              fontWeight: 700,
              padding: "1px 7px",
              borderRadius: 20,
              marginLeft: 4,
            }}
          >
            {collapsed.length} saved
          </span>
        )}
      </button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────
export default function AddProgram() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === "admin";

  const [configs, setConfigs] = useState({
    area: [],
    subArea: [],
    frequency: [],
    programType: [],
    language: [],
    day: [],
  });
  const [owners, setOwners] = useState([]);
  const [configLoading, setConfigLoading] = useState(true);

  const initForm = () => ({
    area: "",
    subArea: "",
    frequency: "",
    programType: "",
    language: "",
    programOwner: "",
    isVirtual: "false",
    startDate: "",
    day: "",
    time: "",
  });
  const [form, setForm] = useState(initForm());
  const [devotees, setDevotees] = useState([BLANK_DEVOTEE()]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [cfgRes, ownRes] = await Promise.all([
          api.get("/config"),
          isAdmin
            ? api.get("/programs/owners")
            : Promise.resolve({ data: { owners: [] } }),
        ]);
        setConfigs(cfgRes.data);
        setOwners(ownRes.data.owners || []);
      } catch {
        toast.error("Failed to load form options.");
      } finally {
        setConfigLoading(false);
      }
    })();
  }, [isAdmin]);

  const setField = (name, val) => {
    setForm((p) => ({ ...p, [name]: val }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: "" }));
  };

  const validate = () => {
    const e = {};
    [
      "area",
      "subArea",
      "frequency",
      "programType",
      "language",
      "startDate",
      "day",
      "time",
    ].forEach((f) => {
      if (!form[f]) e[f] = "Required.";
    });
    if (isAdmin && !form.programOwner)
      e.programOwner = "Please select an owner.";
    const allDevotees = devotees;
    if (!allDevotees.some((d) => d.name.trim()))
      e.devotees = "At least one devotee name is required.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error("Please fill all required fields.");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        ...form,
        isVirtual: form.isVirtual === "true",
        programOwner: isAdmin ? form.programOwner : undefined,
        time: to12Hour(form.time),
        devotees: devotees
          .filter((d) => d.name.trim())
          .map(({ name, phone, email }) => ({ name, phone, email })),
      };
      const res = await api.post("/programs", payload);
      toast.success(res.data.message);
      setForm(initForm());
      setDevotees([BLANK_DEVOTEE()]);
      setErrors({});
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create program.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setForm(initForm());
    setDevotees([BLANK_DEVOTEE()]);
    setErrors({});
  };

  const Sel = ({ name, label, options, required }) => (
    <div className="ap-field">
      <label className="ap-label">
        {label}
        {required && <span className="ap-label-req">*</span>}
      </label>
      <select
        className="ap-select"
        value={form[name]}
        onChange={(e) => setField(name, e.target.value)}
        disabled={configLoading}
      >
        <option value="">— Select {label} —</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      {errors[name] && <span className="ap-field-err">{errors[name]}</span>}
    </div>
  );

  return (
    <>
      <style>{css}</style>
      <div className="ap-page">
        <div className="ap-banner">
          <div className="ap-banner-inner">
            <div className="ap-eyebrow">Programs</div>
            <h1 className="ap-banner-title">Add New Program</h1>
            <p className="ap-banner-sub">
              Register a new program and add devotees.
            </p>
          </div>
        </div>

        <div className="ap-wrap">
          <form onSubmit={handleSubmit} noValidate>
            {/* Location */}
            <div className="ap-section">
              <div className="ap-section-hd">
                <div className="ap-section-icon">📍</div>
                <h2 className="ap-section-title">Location Details</h2>
              </div>
              <div className="ap-section-body">
                <div className="ap-grid-2">
                  <Sel
                    name="area"
                    label="Area"
                    options={configs.area}
                    required
                  />
                  <Sel
                    name="subArea"
                    label="Sub Area"
                    options={configs.subArea}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Program Details */}
            <div className="ap-section">
              <div className="ap-section-hd">
                <div className="ap-section-icon">📋</div>
                <h2 className="ap-section-title">Program Details</h2>
              </div>
              <div className="ap-section-body">
                <div className="ap-grid-3">
                  <Sel
                    name="frequency"
                    label="Frequency"
                    options={configs.frequency}
                    required
                  />
                  <Sel
                    name="programType"
                    label="Program Type"
                    options={configs.programType}
                    required
                  />
                  <Sel
                    name="language"
                    label="Language"
                    options={configs.language}
                    required
                  />
                </div>
                <div style={{ marginTop: 18 }}>
                  {isAdmin ? (
                    <div className="ap-field">
                      <label className="ap-label">
                        Program Owner <span className="ap-label-req">*</span>
                      </label>
                      <select
                        className="ap-select"
                        value={form.programOwner}
                        onChange={(e) =>
                          setField("programOwner", e.target.value)
                        }
                      >
                        <option value="">— Select Owner —</option>
                        {owners.map((o) => (
                          <option key={o._id} value={o._id}>
                            {o.name}
                            {o.programKeyPrefix
                              ? ` [${o.programKeyPrefix}]`
                              : ""}{" "}
                            ({o.email})
                          </option>
                        ))}
                      </select>
                      {errors.programOwner && (
                        <span className="ap-field-err">
                          {errors.programOwner}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="ap-field">
                      <label className="ap-label">Program Owner</label>
                      <input
                        className="ap-input"
                        value={`${user?.name || ""}${
                          user?.programKeyPrefix
                            ? ` [${user.programKeyPrefix}]`
                            : ""
                        }`}
                        disabled
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Schedule */}
            <div className="ap-section">
              <div className="ap-section-hd">
                <div className="ap-section-icon">📅</div>
                <h2 className="ap-section-title">Schedule</h2>
              </div>
              <div className="ap-section-body">
                <div className="ap-field" style={{ marginBottom: 18 }}>
                  <label className="ap-label">Virtual Program</label>
                  <div className="ap-radio-group">
                    {[
                      ["false", "🏛️  In Person"],
                      ["true", "💻  Virtual"],
                    ].map(([val, lbl]) => (
                      <label
                        key={val}
                        className={`ap-radio-label${
                          form.isVirtual === val ? " selected" : ""
                        }`}
                      >
                        <input
                          type="radio"
                          name="isVirtual"
                          value={val}
                          checked={form.isVirtual === val}
                          onChange={(e) =>
                            setField("isVirtual", e.target.value)
                          }
                        />
                        {lbl}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="ap-grid-3">
                  <div className="ap-field">
                    <label className="ap-label">
                      Start Date <span className="ap-label-req">*</span>
                    </label>
                    <input
                      type="date"
                      className="ap-input"
                      value={form.startDate}
                      onChange={(e) => setField("startDate", e.target.value)}
                    />
                    {errors.startDate && (
                      <span className="ap-field-err">{errors.startDate}</span>
                    )}
                  </div>
                  <Sel name="day" label="Day" options={configs.day} required />
                  <div className="ap-field">
                    <label className="ap-label">
                      Time <span className="ap-label-req">*</span>
                    </label>
                    <input
                      type="time"
                      className="ap-input"
                      value={form.time}
                      onChange={(e) => setField("time", e.target.value)}
                    />
                    {form.time && (
                      <span
                        style={{
                          fontSize: "0.72rem",
                          color: "#8b6840",
                          marginTop: 3,
                        }}
                      >
                        → {to12Hour(form.time)}
                      </span>
                    )}
                    {errors.time && (
                      <span className="ap-field-err">{errors.time}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Devotees */}
            <div className="ap-section">
              <div className="ap-section-hd">
                <div className="ap-section-icon">🙏</div>
                <h2 className="ap-section-title">Participants / Devotees</h2>
                <span
                  style={{
                    marginLeft: "auto",
                    fontFamily: "'Cinzel',serif",
                    fontSize: "0.65rem",
                    color: "#8b6840",
                  }}
                >
                  {devotees.length} total
                </span>
              </div>
              <div className="ap-section-body">
                <DevoteeSection
                  devotees={devotees}
                  setDevotees={setDevotees}
                  error={errors.devotees}
                />
              </div>
            </div>

            {/* Submit */}
            <div className="ap-submit-row">
              <button type="button" className="ap-reset" onClick={handleReset}>
                Reset
              </button>
              <button
                type="submit"
                className="ap-submit"
                disabled={loading || configLoading}
              >
                {loading && <span className="ap-spin" />}
                {loading ? "Saving…" : "🪷  Submit Program"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
