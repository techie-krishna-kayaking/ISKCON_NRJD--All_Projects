import { useState, useEffect, useRef } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";

const css = `
.cfg-page { min-height:100vh; background:#f5efe6; font-family:'DM Sans',sans-serif; padding-bottom:60px; }

.cfg-banner {
  background:linear-gradient(135deg,#2d1100 0%,#5c2500 35%,#8b3a00 70%,#b84800 100%);
  padding:28px 0 24px; margin-bottom:32px; position:relative; overflow:hidden;
}
.cfg-banner::after { content:''; position:absolute; bottom:0; left:0; right:0; height:2px; background:linear-gradient(90deg,transparent,rgba(200,150,60,0.8),transparent); }
.cfg-banner-inner { max-width:1020px; margin:0 auto; padding:0 24px; position:relative; z-index:1; }
.cfg-eyebrow { font-family:'Cinzel',serif; font-size:0.62rem; font-weight:700; color:rgba(200,150,60,0.85); letter-spacing:0.22em; text-transform:uppercase; margin-bottom:8px; display:flex; align-items:center; gap:8px; }
.cfg-eyebrow::before,.cfg-eyebrow::after { content:''; flex:1; max-width:36px; height:1px; background:rgba(200,150,60,0.35); }
.cfg-banner-title { font-family:'Cinzel',serif; font-size:clamp(1.3rem,3vw,1.9rem); color:#fff; margin:0 0 5px; font-weight:700; }
.cfg-banner-sub   { color:rgba(255,215,150,0.7); font-size:0.875rem; margin:0; }

.cfg-body  { max-width:1020px; margin:0 auto; padding:0 24px; }
.cfg-shell { display:grid; grid-template-columns:230px 1fr; gap:20px; align-items:start; }

/* Sidebar */
.cfg-sidebar { background:#fff; border:1px solid rgba(200,140,40,0.18); border-radius:16px; overflow:hidden; box-shadow:0 2px 14px rgba(61,23,0,0.06); position:sticky; top:20px; }
.cfg-sidebar-hd { background:linear-gradient(to right,rgba(200,140,40,0.09),rgba(200,140,40,0.04)); border-bottom:1.5px solid rgba(200,140,40,0.15); padding:13px 16px; font-family:'Cinzel',serif; font-size:0.65rem; font-weight:700; color:#7a4a10; letter-spacing:0.15em; text-transform:uppercase; }

.cfg-type-btn { width:100%; display:flex; align-items:center; gap:10px; padding:11px 14px; border:none; background:transparent; cursor:pointer; text-align:left; transition:all 0.14s; border-left:3px solid transparent; border-bottom:1px solid rgba(200,140,40,0.07); }
.cfg-type-btn:last-child { border-bottom:none; }
.cfg-type-btn:hover  { background:rgba(200,140,40,0.05); }
.cfg-type-btn.active { background:rgba(200,140,40,0.08); border-left-color:#c8903c; }
.cfg-type-ico  { width:30px; height:30px; border-radius:8px; background:rgba(200,140,40,0.1); display:flex; align-items:center; justify-content:center; flex-shrink:0; color:#7a4a10; transition:background 0.14s; }
.cfg-type-btn.active .cfg-type-ico { background:rgba(200,140,40,0.18); }
.cfg-type-label { font-size:0.84rem; font-weight:600; color:#3d1800; flex:1; }
.cfg-type-count { font-size:0.62rem; font-weight:700; background:rgba(200,140,40,0.1); color:#7a4a00; padding:2px 7px; border-radius:12px; border:1px solid rgba(200,140,40,0.18); flex-shrink:0; }
.cfg-type-btn.active .cfg-type-count { background:rgba(200,140,40,0.2); border-color:rgba(200,140,40,0.35); }

/* Panel */
.cfg-panel { background:#fff; border:1px solid rgba(200,140,40,0.18); border-radius:16px; overflow:hidden; box-shadow:0 2px 14px rgba(61,23,0,0.06); }
.cfg-panel-hd { background:linear-gradient(to right,rgba(200,140,40,0.09),rgba(200,140,40,0.04)); border-bottom:1.5px solid rgba(200,140,40,0.15); padding:16px 22px; display:flex; align-items:center; justify-content:space-between; }
.cfg-panel-left { display:flex; align-items:center; gap:12px; }
.cfg-panel-ico   { width:36px; height:36px; border-radius:10px; background:rgba(200,140,40,0.12); display:flex; align-items:center; justify-content:center; flex-shrink:0; color:#7a4a10; }
.cfg-panel-title { font-family:'Cinzel',serif; font-size:0.88rem; font-weight:700; color:#3d1800; margin:0; }
.cfg-panel-sub   { font-size:0.74rem; color:#8b6840; margin:2px 0 0; }
.cfg-total { font-size:0.7rem; font-weight:700; color:#7a4a00; background:rgba(200,140,40,0.1); border:1px solid rgba(200,140,40,0.2); padding:3px 10px; border-radius:20px; }

/* Add bar */
.cfg-add-bar { display:flex; gap:10px; padding:16px 22px; border-bottom:1px solid rgba(200,140,40,0.1); background:rgba(253,248,240,0.5); }
.cfg-add-input { flex:1; padding:10px 14px; border:1.5px solid rgba(200,140,40,0.25); border-radius:10px; background:#fff; color:#2d1200; font-family:'DM Sans',sans-serif; font-size:0.875rem; outline:none; transition:border-color 0.15s,box-shadow 0.15s; }
.cfg-add-input:focus { border-color:#c8903c; box-shadow:0 0 0 3px rgba(200,140,40,0.1); }
.cfg-add-input::placeholder { color:#b09070; }
.cfg-add-btn { padding:10px 18px; border:none; border-radius:10px; background:linear-gradient(135deg,#7a3200,#b85000); color:#fff; font-family:'DM Sans',sans-serif; font-size:0.875rem; font-weight:700; cursor:pointer; transition:all 0.15s; white-space:nowrap; display:flex; align-items:center; gap:6px; flex-shrink:0; }
.cfg-add-btn:hover:not(:disabled) { background:linear-gradient(135deg,#8d3a00,#d06000); transform:translateY(-1px); }
.cfg-add-btn:disabled { opacity:0.5; cursor:not-allowed; transform:none; }

/* List */
.cfg-list { padding:8px 22px 16px; min-height:140px; }
.cfg-empty-state { padding:40px 0; text-align:center; }
.cfg-empty-ico  { width:40px; height:40px; margin:0 auto 10px; color:#c4a880; opacity:0.7; }
.cfg-empty-text { font-family:'Cinzel',serif; font-size:0.78rem; color:#b09070; letter-spacing:0.04em; }

.cfg-item { display:flex; align-items:center; justify-content:space-between; padding:10px 12px; border-radius:9px; margin-bottom:3px; border:1px solid transparent; transition:all 0.14s; gap:10px; }
.cfg-item:hover { background:rgba(200,140,40,0.05); border-color:rgba(200,140,40,0.15); }
.cfg-item-left  { display:flex; align-items:center; gap:8px; flex:1; }
.cfg-item-dot   { width:6px; height:6px; border-radius:50%; background:#c8903c; flex-shrink:0; opacity:0.7; }
.cfg-item-text  { font-size:0.875rem; font-weight:500; color:#2d1200; }
.cfg-item-del   { width:28px; height:28px; border:none; border-radius:7px; background:transparent; color:#b09070; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all 0.14s; flex-shrink:0; opacity:0; }
.cfg-item:hover .cfg-item-del { opacity:1; }
.cfg-item-del:hover { background:rgba(220,38,38,0.1); color:#dc2626; }

/* Spinner */
.cfg-spin { width:13px; height:13px; border-radius:50%; border:2px solid rgba(255,255,255,0.35); border-top-color:#fff; animation:cfgSpin 0.7s linear infinite; }
@keyframes cfgSpin { to{transform:rotate(360deg);} }

@media(max-width:680px) { .cfg-shell{grid-template-columns:1fr;} .cfg-sidebar{position:static;} }
`;

// SVG icon components
const IcoLocation = () => (
  <svg
    width={16}
    height={16}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={1.8}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
    />
  </svg>
);
const IcoMap = () => (
  <svg
    width={16}
    height={16}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={1.8}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z"
    />
  </svg>
);
const IcoRefresh = () => (
  <svg
    width={16}
    height={16}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={1.8}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
    />
  </svg>
);
const IcoGrid = () => (
  <svg
    width={16}
    height={16}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={1.8}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
    />
  </svg>
);
const IcoLang = () => (
  <svg
    width={16}
    height={16}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={1.8}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 01-3.827-5.802"
    />
  </svg>
);
const IcoCalendar = () => (
  <svg
    width={16}
    height={16}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={1.8}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
    />
  </svg>
);
const IcoUsers = () => (
  <svg
    width={16}
    height={16}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={1.8}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
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
const IcoTrash = () => (
  <svg
    width={14}
    height={14}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
    />
  </svg>
);

const TYPES = [
  { key: "area", label: "Area", Icon: IcoLocation },
  { key: "subArea", label: "Sub Area", Icon: IcoMap },
  { key: "frequency", label: "Frequency", Icon: IcoRefresh },
  { key: "programType", label: "Program Type", Icon: IcoGrid },
  { key: "language", label: "Language", Icon: IcoLang },
  { key: "day", label: "Day", Icon: IcoCalendar },
  { key: "bvChapters", label: "BV Chapters", Icon: IcoUsers },
];

export default function AdminConfig() {
  const [configs, setConfigs] = useState(
    Object.fromEntries(TYPES.map((t) => [t.key, []]))
  );
  const [active, setActive] = useState("area");
  const [input, setInput] = useState("");
  const [adding, setAdding] = useState(false);
  const [loading, setLoading] = useState(true);
  const inputRef = useRef(null);

  useEffect(() => {
    api
      .get("/config")
      .then((r) => setConfigs(r.data))
      .catch(() => toast.error("Failed to load config."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setInput("");
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [active]);

  const currentType = TYPES.find((t) => t.key === active);
  const currentVals = configs[active] || [];

  const handleAdd = async () => {
    const val = input.trim();
    if (!val) return;
    setAdding(true);
    try {
      const res = await api.post(`/config/${active}/add`, { value: val });
      setConfigs((p) => ({ ...p, [active]: res.data.values }));
      setInput("");
      toast.success(`"${val}" added.`);
      inputRef.current?.focus();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add.");
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (value) => {
    try {
      const res = await api.delete(`/config/${active}/remove`, {
        data: { value },
      });
      setConfigs((p) => ({ ...p, [active]: res.data.values }));
      toast.success(`"${value}" removed.`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to remove.");
    }
  };

  const { Icon: PanelIcon } = currentType || {};

  return (
    <>
      <style>{css}</style>
      <div className="cfg-page">
        <div className="cfg-banner">
          <div className="cfg-banner-inner">
            <div className="cfg-eyebrow">Admin</div>
            <h1 className="cfg-banner-title">Manage Config</h1>
            <p className="cfg-banner-sub">
              Control all dropdown options used across program forms.
            </p>
          </div>
        </div>

        <div className="cfg-body">
          <div className="cfg-shell">
            {/* Sidebar */}
            <div className="cfg-sidebar">
              <div className="cfg-sidebar-hd">Dropdown Types</div>
              {TYPES.map(({ key, label, Icon }) => (
                <button
                  key={key}
                  className={`cfg-type-btn${active === key ? " active" : ""}`}
                  onClick={() => setActive(key)}
                >
                  <span className="cfg-type-ico">
                    <Icon />
                  </span>
                  <span className="cfg-type-label">{label}</span>
                  <span className="cfg-type-count">
                    {configs[key]?.length || 0}
                  </span>
                </button>
              ))}
            </div>

            {/* Panel */}
            <div className="cfg-panel">
              <div className="cfg-panel-hd">
                <div className="cfg-panel-left">
                  <div className="cfg-panel-ico">
                    {PanelIcon && <PanelIcon />}
                  </div>
                  <div>
                    <p className="cfg-panel-title">{currentType?.label}</p>
                    <p className="cfg-panel-sub">
                      {currentType?.key === "bvChapters"
                        ? "BhaktiVriksha chapter names shown in attendance dropdown"
                        : `Manage options for the ${currentType?.label} dropdown`}
                    </p>
                  </div>
                </div>
                <span className="cfg-total">
                  {currentVals.length} option
                  {currentVals.length !== 1 ? "s" : ""}
                </span>
              </div>

              <div className="cfg-add-bar">
                <input
                  ref={inputRef}
                  type="text"
                  className="cfg-add-input"
                  placeholder={`Type a new ${currentType?.label} and press Enter…`}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                  disabled={adding}
                />
                <button
                  className="cfg-add-btn"
                  onClick={handleAdd}
                  disabled={adding || !input.trim()}
                >
                  {adding ? <span className="cfg-spin" /> : <IcoPlus />}
                  {adding ? "Adding…" : "Add"}
                </button>
              </div>

              <div className="cfg-list">
                {loading ? (
                  <div className="cfg-empty-state">
                    <div
                      className="cfg-empty-ico"
                      style={{ width: 40, height: 40, margin: "0 auto 10px" }}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.5}
                        width={40}
                        height={40}
                        style={{ color: "#c4a880", opacity: 0.6 }}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <p className="cfg-empty-text">Loading…</p>
                  </div>
                ) : currentVals.length === 0 ? (
                  <div className="cfg-empty-state">
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        margin: "0 auto 10px",
                        color: "#c4a880",
                        opacity: 0.6,
                      }}
                    >
                      {PanelIcon && <PanelIcon />}
                    </div>
                    <p className="cfg-empty-text">
                      No {currentType?.label} options yet.
                      <br />
                      Add your first one above.
                    </p>
                  </div>
                ) : (
                  currentVals.map((v, i) => (
                    <div className="cfg-item" key={`${v}-${i}`}>
                      <div className="cfg-item-left">
                        <span className="cfg-item-dot" />
                        <span className="cfg-item-text">{v}</span>
                      </div>
                      <button
                        className="cfg-item-del"
                        title={`Remove "${v}"`}
                        onClick={() => handleDelete(v)}
                      >
                        <IcoTrash />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
