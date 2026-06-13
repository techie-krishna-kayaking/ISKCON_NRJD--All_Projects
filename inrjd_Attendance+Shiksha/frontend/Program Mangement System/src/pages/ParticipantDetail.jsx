import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../config/api";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import GrowthLadder from "../components/GrowthLadder";

const LEVELS = [
  "None", "Shraddhavan", "Krishna Sevak", "Krishna Sadhak",
  "Srila Prabhupada Ashraya", "Srila Guru Charana Ashraya",
];

const levelColor = (lvl) => {
  const map = {
    None: "#94a3b8", Shraddhavan: "#3b82f6", "Krishna Sevak": "#8b5cf6",
    "Krishna Sadhak": "#f59e0b", "Srila Prabhupada Ashraya": "#ef4444",
    "Srila Guru Charana Ashraya": "#10b981",
  };
  return map[lvl] || "#94a3b8";
};

const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

export default function ParticipantDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("profile");
  const [courses, setCourses] = useState([]);
  const [levelConfig, setLevelConfig] = useState({ levelData: {}, nextLevelMap: {} });
  const [showGrowthForm, setShowGrowthForm] = useState(false);
  const [showCertForm, setShowCertForm] = useState(false);
  const [gpForm, setGpForm] = useState({ goalTitle: "", description: "", targetLevel: "Shraddhavan", targetDate: "", status: "active" });
  const [certForm, setCertForm] = useState({
    courseId: "", certificationLevel: "", certificationDate: "", recommendedBy: "", filledBy: "",
    chanting: "", books: "", commitments: "", seva: "",
    aCode: "", bCode: "", cCode: "", dCode: "", eCode: "", fCode: "",
    declarationAccepted: false,
  });
  const [submitting, setSubmitting] = useState(false);

  const api = axios.create({
    baseURL: API_URL,
    headers: { Authorization: `Bearer ${localStorage.getItem("pms_token")}` },
  });

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const [detailRes, coursesRes, levelRes] = await Promise.all([
        api.get(`/participants/${id}`),
        api.get("/courses", { params: { active: true } }),
        api.get("/shiksha-analytics/level-data"),
      ]);
      setData(detailRes.data);
      setCourses(coursesRes.data.courses);
      setLevelConfig(levelRes.data);
    } catch (err) {
      toast.error("Failed to load participant details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDetail(); }, [id]);

  const handleGrowthPlan = async (e) => {
    e.preventDefault();
    if (!gpForm.goalTitle.trim()) return toast.error("Goal title is required");
    setSubmitting(true);
    try {
      await api.post("/growth-plans", { participantId: id, ...gpForm });
      toast.success("Growth plan saved");
      setShowGrowthForm(false);
      setGpForm({ goalTitle: "", description: "", targetLevel: "Shraddhavan", targetDate: "", status: "active" });
      fetchDetail();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save growth plan");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCertification = async (e) => {
    e.preventDefault();
    if (!certForm.courseId) return toast.error("Select a course");
    if (!certForm.certificationLevel) return toast.error("Select certification level");
    if (!certForm.certificationDate) return toast.error("Select date");
    setSubmitting(true);
    try {
      await api.post("/certifications", { participantId: id, ...certForm });
      toast.success("Certification issued successfully");
      setShowCertForm(false);
      setCertForm({ courseId: "", certificationLevel: "", certificationDate: "", recommendedBy: "", filledBy: "", chanting: "", books: "", commitments: "", seva: "", aCode: "", bCode: "", cCode: "", dCode: "", eCode: "", fCode: "", declarationAccepted: false });
      fetchDetail();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to issue certification");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>Loading...</div>;
  if (!data) return <div style={{ padding: 40, textAlign: "center", color: "#ef4444" }}>Participant not found</div>;

  const { participant: p, growthPlans, certifications, latestCertification } = data;

  return (
    <div style={{ padding: "24px", maxWidth: 1100, margin: "0 auto" }}>
      <style>{`
        .pd-card { background:#fff; border-radius:12px; box-shadow:0 1px 3px rgba(0,0,0,.08); padding:24px; margin-bottom:18px; }
        .pd-back { color:#6366f1; cursor:pointer; font-size:.88rem; font-weight:600; border:none; background:none; margin-bottom:12px; }
        .pd-name { font-size:1.5rem; font-weight:700; color:#1e293b; }
        .pd-badge { display:inline-block; padding:4px 12px; border-radius:20px; font-size:.8rem; font-weight:600; color:#fff; margin-left:10px; }
        .pd-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(200px,1fr)); gap:12px; margin-top:14px; }
        .pd-field label { font-size:.75rem; color:#94a3b8; font-weight:600; text-transform:uppercase; }
        .pd-field p { font-size:.92rem; color:#334155; margin:2px 0 0; }
        .pd-tabs { display:flex; gap:0; border-bottom:2px solid #e2e8f0; margin-bottom:18px; }
        .pd-tab { padding:10px 20px; cursor:pointer; font-weight:600; font-size:.9rem; color:#94a3b8; border-bottom:2px solid transparent; margin-bottom:-2px; transition:all .15s; }
        .pd-tab.active { color:#6366f1; border-bottom-color:#6366f1; }
        .pd-btn { padding:8px 18px; border:none; border-radius:8px; font-size:.88rem; cursor:pointer; font-weight:600; }
        .pd-btn-primary { background:#6366f1; color:#fff; }
        .pd-btn-primary:hover { background:#4f46e5; }
        .pd-btn-sm { padding:6px 14px; font-size:.82rem; }
        .pd-btn-secondary { background:#f1f5f9; color:#475569; }
        .pd-timeline { position:relative; padding-left:28px; }
        .pd-timeline::before { content:""; position:absolute; left:8px; top:0; bottom:0; width:2px; background:#e2e8f0; }
        .pd-tl-item { position:relative; margin-bottom:18px; }
        .pd-tl-dot { position:absolute; left:-24px; top:4px; width:12px; height:12px; border-radius:50%; border:2px solid #fff; }
        .pd-tl-card { background:#f8fafc; border-radius:10px; padding:14px 16px; }
        .pd-tl-title { font-weight:600; color:#1e293b; font-size:.92rem; }
        .pd-tl-sub { font-size:.8rem; color:#94a3b8; margin-top:2px; }
        .pd-tl-detail { font-size:.82rem; color:#475569; margin-top:6px; }
        .pd-modal-bg { position:fixed; inset:0; background:rgba(0,0,0,.35); display:flex; align-items:center; justify-content:center; z-index:100; }
        .pd-modal { background:#fff; border-radius:14px; padding:28px; width:600px; max-width:95vw; max-height:85vh; overflow-y:auto; }
        .pd-form-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
        .pd-fg { display:flex; flex-direction:column; gap:4px; }
        .pd-fg label { font-size:.82rem; font-weight:600; color:#475569; }
        .pd-fg.full { grid-column:1/-1; }
        .pd-input,.pd-select { padding:8px 12px; border:1px solid #e2e8f0; border-radius:8px; font-size:.88rem; outline:none; }
        .pd-input:focus,.pd-select:focus { border-color:#6366f1; }
        .pd-gp-card { background:#f0fdf4; border-radius:10px; padding:14px; margin-bottom:10px; border-left:4px solid #22c55e; }
        .pd-gp-card.on-hold { background:#fffbeb; border-left-color:#f59e0b; }
        .pd-gp-card.completed { background:#f0f9ff; border-left-color:#3b82f6; }
        .pd-gp-card.cancelled { background:#fef2f2; border-left-color:#ef4444; }
        .pd-latest { background:linear-gradient(135deg,#ede9fe,#e0e7ff); border-radius:12px; padding:18px; margin-bottom:18px; }
      `}</style>

      <button className="pd-back" onClick={() => navigate(-1)}>&larr; Back to Participants</button>

      {/* Profile Card */}
      <div className="pd-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }}>
          <div>
            <span className="pd-name">{p.name}</span>
            <span className="pd-badge" style={{ background: levelColor(p.currentLevel) }}>{p.currentLevel}</span>
            {!p.activeFlag && <span className="pd-badge" style={{ background: "#ef4444", marginLeft: 6 }}>Inactive</span>}
          </div>
          {p.shikshaCode && <span style={{ fontSize: ".95rem", color: "#6366f1", fontWeight: 700 }}>{p.shikshaCode}</span>}
        </div>
        <div className="pd-grid">
          <div className="pd-field"><label>Program Key</label><p>{p.programKey || "—"}</p></div>
          <div className="pd-field"><label>BV Leader</label><p>{p.bvLeader || "—"}</p></div>
          <div className="pd-field"><label>Gender</label><p>{p.gender || "—"}</p></div>
          <div className="pd-field"><label>Email</label><p>{p.email || "—"}</p></div>
          <div className="pd-field"><label>Contact</label><p>{p.contactNumber || "—"}</p></div>
          <div className="pd-field"><label>DOB</label><p>{fmtDate(p.dob)}</p></div>
          <div className="pd-field"><label>Language</label><p>{p.language || "—"}</p></div>
          <div className="pd-field"><label>Aadhar</label><p>{p.aadharNumber || "—"}</p></div>
          <div className="pd-field" style={{ gridColumn: "1/-1" }}><label>Address</label><p>{p.address || "—"}</p></div>
        </div>
      </div>

      {/* Tabs */}
      <div className="pd-tabs">
        {["profile", "ladder", "growth", "certifications"].map((t) => (
          <div key={t} className={`pd-tab ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>
            {t === "profile" ? "Overview" : t === "ladder" ? "Growth Ladder" : t === "growth" ? "Growth Plan" : "Certifications"}
          </div>
        ))}
      </div>

      {/* Overview Tab */}
      {tab === "profile" && (
        <div>
          {latestCertification && (
            <div className="pd-latest">
              <div style={{ fontSize: ".78rem", fontWeight: 600, color: "#6366f1", textTransform: "uppercase", marginBottom: 6 }}>Latest Certification</div>
              <div style={{ fontWeight: 700, fontSize: "1.1rem", color: "#1e293b" }}>{latestCertification.certificationLevel}</div>
              <div style={{ fontSize: ".85rem", color: "#475569", marginTop: 4 }}>
                Course: {latestCertification.course?.name || "—"} &bull; {fmtDate(latestCertification.certificationDate)}
              </div>
              {latestCertification.recommendedBy && <div style={{ fontSize: ".82rem", color: "#94a3b8", marginTop: 2 }}>Recommended by: {latestCertification.recommendedBy}</div>}
            </div>
          )}
          <div className="pd-card">
            <h3 style={{ margin: "0 0 12px", color: "#1e293b" }}>Quick Summary</h3>
            <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
              <div><span style={{ fontSize: "1.4rem", fontWeight: 700, color: "#6366f1" }}>{certifications.length}</span><br /><span style={{ fontSize: ".8rem", color: "#94a3b8" }}>Total Certifications</span></div>
              <div><span style={{ fontSize: "1.4rem", fontWeight: 700, color: "#22c55e" }}>{growthPlans.filter((g) => g.status === "active").length}</span><br /><span style={{ fontSize: ".8rem", color: "#94a3b8" }}>Active Growth Plans</span></div>
              <div><span style={{ fontSize: "1.4rem", fontWeight: 700, color: "#f59e0b" }}>{growthPlans.filter((g) => g.status === "completed").length}</span><br /><span style={{ fontSize: ".8rem", color: "#94a3b8" }}>Completed Plans</span></div>
              {p.addedAt && <div><span style={{ fontSize: "1.4rem", fontWeight: 700, color: "#8b5cf6" }}>{Math.round((new Date() - new Date(p.addedAt)) / (1000*60*60*24))}</span><br /><span style={{ fontSize: ".8rem", color: "#94a3b8" }}>Days Since Added</span></div>}
            </div>
          </div>
        </div>
      )}

      {/* Growth Ladder Tab */}
      {tab === "ladder" && (
        <div className="pd-card">
          <h3 style={{ margin: "0 0 18px", color: "#1e293b" }}>Spiritual Growth Ladder</h3>
          <GrowthLadder currentLevel={p.currentLevel} certifications={certifications} />
          {/* Level requirements for next level */}
          {(() => {
            const nextKey = levelConfig.nextLevelMap[(p.currentLevel || "none").toLowerCase()];
            const nextData = nextKey ? levelConfig.levelData[nextKey] : null;
            if (!nextData) return <div style={{ marginTop: 18, textAlign: "center", color: "#22c55e", fontWeight: 600 }}>Highest level achieved!</div>;
            return (
              <div style={{ marginTop: 24, background: "#f8fafc", borderRadius: 10, padding: 18 }}>
                <h4 style={{ color: "#6366f1", margin: "0 0 10px" }}>Requirements for Next Level: {nextKey}</h4>
                {nextData.chanting?.length > 0 && (
                  <div style={{ marginBottom: 8 }}>
                    <strong style={{ color: "#475569", fontSize: ".85rem" }}>Chanting:</strong>
                    <ul style={{ margin: "4px 0 0 18px", color: "#334155", fontSize: ".85rem" }}>
                      {nextData.chanting.map((c, i) => <li key={i}>{c}</li>)}
                    </ul>
                  </div>
                )}
                {nextData.books?.length > 0 && (
                  <div style={{ marginBottom: 8 }}>
                    <strong style={{ color: "#475569", fontSize: ".85rem" }}>Books to Complete:</strong>
                    <ul style={{ margin: "4px 0 0 18px", color: "#334155", fontSize: ".85rem" }}>
                      {nextData.books.map((b, i) => <li key={i}>{b}</li>)}
                    </ul>
                  </div>
                )}
                {nextData.commitments?.length > 0 && (
                  <div>
                    <strong style={{ color: "#475569", fontSize: ".85rem" }}>Commitments:</strong>
                    <ul style={{ margin: "4px 0 0 18px", color: "#334155", fontSize: ".85rem" }}>
                      {nextData.commitments.map((c, i) => <li key={i}>{c}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* Growth Plan Tab */}
      {tab === "growth" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h3 style={{ margin: 0, color: "#1e293b" }}>Growth Plans</h3>
            <button className="pd-btn pd-btn-primary pd-btn-sm" onClick={() => setShowGrowthForm(true)}>+ Add Growth Plan</button>
          </div>
          {growthPlans.length === 0 ? (
            <div className="pd-card" style={{ textAlign: "center", color: "#94a3b8" }}>No growth plans yet. Add one to start tracking spiritual progress.</div>
          ) : (
            growthPlans.map((g) => (
              <div key={g._id} className={`pd-gp-card ${g.status}`}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: 600, color: "#1e293b" }}>{g.goalTitle}</span>
                  <span style={{ fontSize: ".78rem", fontWeight: 600, textTransform: "uppercase", color: g.status === "active" ? "#22c55e" : g.status === "completed" ? "#3b82f6" : "#94a3b8" }}>{g.status}</span>
                </div>
                {g.description && <p style={{ fontSize: ".85rem", color: "#475569", margin: "6px 0 0" }}>{g.description}</p>}
                <div style={{ fontSize: ".8rem", color: "#94a3b8", marginTop: 6 }}>
                  Target: {g.targetLevel} {g.targetDate ? `by ${fmtDate(g.targetDate)}` : ""}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Certifications Tab */}
      {tab === "certifications" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h3 style={{ margin: 0, color: "#1e293b" }}>Certification History</h3>
            <button className="pd-btn pd-btn-primary pd-btn-sm" onClick={() => setShowCertForm(true)}>+ Issue Certification</button>
          </div>
          {certifications.length === 0 ? (
            <div className="pd-card" style={{ textAlign: "center", color: "#94a3b8" }}>No certifications yet.</div>
          ) : (
            <div className="pd-timeline">
              {certifications.map((c, i) => (
                <div key={c._id} className="pd-tl-item">
                  <div className="pd-tl-dot" style={{ background: levelColor(c.certificationLevel) }} />
                  <div className="pd-tl-card">
                    <div className="pd-tl-title">
                      {c.certificationLevel}
                      {i === 0 && <span style={{ fontSize: ".72rem", background: "#6366f1", color: "#fff", padding: "2px 8px", borderRadius: 10, marginLeft: 8 }}>Latest</span>}
                    </div>
                    <div className="pd-tl-sub">{c.course?.name || "—"} &bull; {fmtDate(c.certificationDate)}</div>
                    <div className="pd-tl-detail">
                      <strong>{c.currentLevelBefore}</strong> &rarr; <strong>{c.newLevelAfter}</strong>
                      {c.recommendedBy && <> &bull; Recommended by: {c.recommendedBy}</>}
                      {c.filledBy && <> &bull; Filled by: {c.filledBy}</>}
                    </div>
                    {(c.chanting || c.books || c.commitments || c.seva) && (
                      <div style={{ fontSize: ".8rem", color: "#64748b", marginTop: 6, display: "flex", gap: 14, flexWrap: "wrap" }}>
                        {c.chanting && <span>Chanting: {c.chanting}</span>}
                        {c.books && <span>Books: {c.books}</span>}
                        {c.commitments && <span>Commitments: {c.commitments}</span>}
                        {c.seva && <span>Seva: {c.seva}</span>}
                      </div>
                    )}
                    {(c.aCode || c.bCode || c.cCode || c.dCode || c.eCode || c.fCode) && (
                      <div style={{ fontSize: ".78rem", color: "#94a3b8", marginTop: 4 }}>
                        Codes: {[c.aCode, c.bCode, c.cCode, c.dCode, c.eCode, c.fCode].filter(Boolean).join(" / ")}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Growth Plan Modal */}
      {showGrowthForm && (
        <div className="pd-modal-bg" onClick={() => setShowGrowthForm(false)}>
          <div className="pd-modal" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginBottom: 16, color: "#1e293b" }}>Add Growth Plan</h2>
            <form onSubmit={handleGrowthPlan}>
              <div className="pd-form-grid">
                <div className="pd-fg full">
                  <label>Goal Title *</label>
                  <input className="pd-input" value={gpForm.goalTitle} onChange={(e) => setGpForm({ ...gpForm, goalTitle: e.target.value })} required />
                </div>
                <div className="pd-fg full">
                  <label>Description</label>
                  <textarea className="pd-input" rows={3} value={gpForm.description} onChange={(e) => setGpForm({ ...gpForm, description: e.target.value })} />
                </div>
                <div className="pd-fg">
                  <label>Target Level</label>
                  <select className="pd-select" value={gpForm.targetLevel} onChange={(e) => setGpForm({ ...gpForm, targetLevel: e.target.value })}>
                    {LEVELS.filter((l) => l !== "None").map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div className="pd-fg">
                  <label>Target Date</label>
                  <input className="pd-input" type="date" value={gpForm.targetDate} onChange={(e) => setGpForm({ ...gpForm, targetDate: e.target.value })} />
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 18, justifyContent: "flex-end" }}>
                <button type="button" className="pd-btn pd-btn-secondary" onClick={() => setShowGrowthForm(false)}>Cancel</button>
                <button type="submit" className="pd-btn pd-btn-primary" disabled={submitting}>{submitting ? "Saving..." : "Save"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Certification Modal */}
      {showCertForm && (
        <div className="pd-modal-bg" onClick={() => setShowCertForm(false)}>
          <div className="pd-modal" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginBottom: 16, color: "#1e293b" }}>Issue Certification</h2>
            <form onSubmit={handleCertification}>
              <div className="pd-form-grid">
                <div className="pd-fg">
                  <label>Course *</label>
                  <select className="pd-select" value={certForm.courseId} onChange={(e) => {
                    const c = courses.find((x) => x._id === e.target.value);
                    setCertForm({ ...certForm, courseId: e.target.value, certificationLevel: c?.level || "" });
                  }} required>
                    <option value="">Select Course</option>
                    {courses.map((c) => <option key={c._id} value={c._id}>{c.name} ({c.level})</option>)}
                  </select>
                </div>
                <div className="pd-fg">
                  <label>Certification Level *</label>
                  <select className="pd-select" value={certForm.certificationLevel} onChange={(e) => setCertForm({ ...certForm, certificationLevel: e.target.value })} required>
                    <option value="">Select Level</option>
                    {LEVELS.filter((l) => l !== "None").map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div className="pd-fg">
                  <label>Certification Date *</label>
                  <input className="pd-input" type="date" value={certForm.certificationDate} onChange={(e) => setCertForm({ ...certForm, certificationDate: e.target.value })} required />
                </div>
                <div className="pd-fg">
                  <label>Recommended By</label>
                  <input className="pd-input" value={certForm.recommendedBy} onChange={(e) => setCertForm({ ...certForm, recommendedBy: e.target.value })} />
                </div>
                <div className="pd-fg">
                  <label>Filled By</label>
                  <input className="pd-input" value={certForm.filledBy} onChange={(e) => setCertForm({ ...certForm, filledBy: e.target.value })} />
                </div>
                <div className="pd-fg">
                  <label>Chanting</label>
                  <input className="pd-input" value={certForm.chanting} onChange={(e) => setCertForm({ ...certForm, chanting: e.target.value })} />
                </div>
                <div className="pd-fg">
                  <label>Books Finished</label>
                  <input className="pd-input" value={certForm.books} onChange={(e) => setCertForm({ ...certForm, books: e.target.value })} />
                </div>
                <div className="pd-fg">
                  <label>Commitments</label>
                  <input className="pd-input" value={certForm.commitments} onChange={(e) => setCertForm({ ...certForm, commitments: e.target.value })} />
                </div>
                <div className="pd-fg">
                  <label>Seva</label>
                  <input className="pd-input" value={certForm.seva} onChange={(e) => setCertForm({ ...certForm, seva: e.target.value })} />
                </div>
                <div className="pd-fg">
                  <label>A Code</label>
                  <input className="pd-input" value={certForm.aCode} onChange={(e) => setCertForm({ ...certForm, aCode: e.target.value })} />
                </div>
                <div className="pd-fg">
                  <label>B Code</label>
                  <input className="pd-input" value={certForm.bCode} onChange={(e) => setCertForm({ ...certForm, bCode: e.target.value })} />
                </div>
                <div className="pd-fg">
                  <label>C Code</label>
                  <input className="pd-input" value={certForm.cCode} onChange={(e) => setCertForm({ ...certForm, cCode: e.target.value })} />
                </div>
                <div className="pd-fg">
                  <label>D Code</label>
                  <input className="pd-input" value={certForm.dCode} onChange={(e) => setCertForm({ ...certForm, dCode: e.target.value })} />
                </div>
                <div className="pd-fg">
                  <label>E Code</label>
                  <input className="pd-input" value={certForm.eCode} onChange={(e) => setCertForm({ ...certForm, eCode: e.target.value })} />
                </div>
                <div className="pd-fg">
                  <label>F Code</label>
                  <input className="pd-input" value={certForm.fCode} onChange={(e) => setCertForm({ ...certForm, fCode: e.target.value })} />
                </div>
                <div className="pd-fg full" style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <input type="checkbox" checked={certForm.declarationAccepted} onChange={(e) => setCertForm({ ...certForm, declarationAccepted: e.target.checked })} id="decl" />
                  <label htmlFor="decl" style={{ fontSize: ".85rem" }}>I declare that all the information provided is accurate</label>
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 18, justifyContent: "flex-end" }}>
                <button type="button" className="pd-btn pd-btn-secondary" onClick={() => setShowCertForm(false)}>Cancel</button>
                <button type="submit" className="pd-btn pd-btn-primary" disabled={submitting}>{submitting ? "Issuing..." : "Issue Certification"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
