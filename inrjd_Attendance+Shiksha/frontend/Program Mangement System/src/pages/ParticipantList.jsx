import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../config/api";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

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

export default function ParticipantList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    name: "", shikshaCode: "", programKey: "", aadharNumber: "",
    bvLeader: "", gender: "", email: "", contactNumber: "",
    dob: "", address: "", language: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const api = axios.create({
    baseURL: API_URL,
    headers: { Authorization: `Bearer ${localStorage.getItem("pms_token")}` },
  });

  const fetchParticipants = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (levelFilter) params.level = levelFilter;
      const { data } = await api.get("/participants", { params });
      setParticipants(data.participants);
    } catch {
      toast.error("Failed to load participants");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchParticipants(); }, [search, levelFilter]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("Name is required");
    setSubmitting(true);
    try {
      await api.post("/participants", form);
      toast.success("Participant added");
      setShowAdd(false);
      setForm({ name: "", shikshaCode: "", programKey: "", aadharNumber: "", bvLeader: "", gender: "", email: "", contactNumber: "", dob: "", address: "", language: "" });
      fetchParticipants();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add participant");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: "24px", maxWidth: 1200, margin: "0 auto" }}>
      <style>{`
        .pl-card { background: #fff; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,.08); padding: 20px; }
        .pl-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 20px; }
        .pl-title { font-size: 1.6rem; font-weight: 700; color: #1e293b; }
        .pl-filters { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
        .pl-input, .pl-select { padding: 8px 14px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: .9rem; outline: none; }
        .pl-input:focus, .pl-select:focus { border-color: #6366f1; box-shadow: 0 0 0 2px rgba(99,102,241,.15); }
        .pl-btn { padding: 8px 18px; border: none; border-radius: 8px; font-size: .9rem; cursor: pointer; font-weight: 600; }
        .pl-btn-primary { background: #6366f1; color: #fff; }
        .pl-btn-primary:hover { background: #4f46e5; }
        .pl-btn-secondary { background: #f1f5f9; color: #475569; }
        .pl-table { width: 100%; border-collapse: collapse; font-size: .88rem; }
        .pl-table th { text-align: left; padding: 10px 12px; background: #f8fafc; color: #64748b; font-weight: 600; border-bottom: 2px solid #e2e8f0; }
        .pl-table td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; color: #334155; }
        .pl-table tr:hover { background: #faf5ff; cursor: pointer; }
        .pl-badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: .78rem; font-weight: 600; color: #fff; }
        .pl-modal-bg { position: fixed; inset: 0; background: rgba(0,0,0,.35); display: flex; align-items: center; justify-content: center; z-index: 100; }
        .pl-modal { background: #fff; border-radius: 14px; padding: 28px; width: 520px; max-width: 95vw; max-height: 85vh; overflow-y: auto; }
        .pl-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .pl-form-group { display: flex; flex-direction: column; gap: 4px; }
        .pl-form-group label { font-size: .82rem; font-weight: 600; color: #475569; }
        .pl-form-group.full { grid-column: 1 / -1; }
        .pl-empty { text-align: center; padding: 40px; color: #94a3b8; }
      `}</style>

      <div className="pl-card">
        <div className="pl-header">
          <h1 className="pl-title">Participants</h1>
          <div className="pl-filters">
            <input className="pl-input" placeholder="Search name, code, phone..." value={search}
              onChange={(e) => setSearch(e.target.value)} style={{ width: 220 }} />
            <select className="pl-select" value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)}>
              <option value="">All Levels</option>
              {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
            <button className="pl-btn pl-btn-primary" onClick={() => setShowAdd(true)}>+ Add Participant</button>
          </div>
        </div>

        {loading ? (
          <div className="pl-empty">Loading...</div>
        ) : participants.length === 0 ? (
          <div className="pl-empty">No participants found</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="pl-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Shiksha Code</th>
                  <th>Contact</th>
                  <th>BV Leader</th>
                  <th>Current Level</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {participants.map((p) => (
                  <tr key={p._id} onClick={() => navigate(
                    user.role === "admin" ? `/admin/participants/${p._id}` : `/owner/participants/${p._id}`
                  )}>
                    <td style={{ fontWeight: 600 }}>{p.name}</td>
                    <td>{p.shikshaCode || "—"}</td>
                    <td>{p.contactNumber || p.email || "—"}</td>
                    <td>{p.bvLeader || "—"}</td>
                    <td>
                      <span className="pl-badge" style={{ background: levelColor(p.currentLevel) }}>
                        {p.currentLevel}
                      </span>
                    </td>
                    <td>{p.activeFlag ? "Active" : "Inactive"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAdd && (
        <div className="pl-modal-bg" onClick={() => setShowAdd(false)}>
          <div className="pl-modal" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginBottom: 16, color: "#1e293b" }}>Add Participant</h2>
            <form onSubmit={handleAdd}>
              <div className="pl-form-grid">
                <div className="pl-form-group">
                  <label>Name *</label>
                  <input className="pl-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="pl-form-group">
                  <label>Shiksha Code</label>
                  <input className="pl-input" value={form.shikshaCode} onChange={(e) => setForm({ ...form, shikshaCode: e.target.value })} />
                </div>
                <div className="pl-form-group">
                  <label>Program Key</label>
                  <input className="pl-input" value={form.programKey} onChange={(e) => setForm({ ...form, programKey: e.target.value })} />
                </div>
                <div className="pl-form-group">
                  <label>Aadhar Number</label>
                  <input className="pl-input" value={form.aadharNumber} onChange={(e) => setForm({ ...form, aadharNumber: e.target.value })} />
                </div>
                <div className="pl-form-group">
                  <label>BV Leader</label>
                  <input className="pl-input" value={form.bvLeader} onChange={(e) => setForm({ ...form, bvLeader: e.target.value })} />
                </div>
                <div className="pl-form-group">
                  <label>Gender</label>
                  <select className="pl-select" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="pl-form-group">
                  <label>Email</label>
                  <input className="pl-input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
                <div className="pl-form-group">
                  <label>Contact Number</label>
                  <input className="pl-input" value={form.contactNumber} onChange={(e) => setForm({ ...form, contactNumber: e.target.value })} />
                </div>
                <div className="pl-form-group">
                  <label>Date of Birth</label>
                  <input className="pl-input" type="date" value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} />
                </div>
                <div className="pl-form-group">
                  <label>Language</label>
                  <input className="pl-input" value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })} />
                </div>
                <div className="pl-form-group full">
                  <label>Address</label>
                  <input className="pl-input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 18, justifyContent: "flex-end" }}>
                <button type="button" className="pl-btn pl-btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
                <button type="submit" className="pl-btn pl-btn-primary" disabled={submitting}>
                  {submitting ? "Adding..." : "Add Participant"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
