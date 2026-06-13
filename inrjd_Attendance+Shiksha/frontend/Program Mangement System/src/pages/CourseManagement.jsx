import { useState, useEffect } from "react";
import axios from "axios";
import { API_URL } from "../config/api";
import toast from "react-hot-toast";

const LEVELS = [
  "Shraddhavan", "Krishna Sevak", "Krishna Sadhak",
  "Srila Prabhupada Ashraya", "Srila Guru Charana Ashraya",
];

export default function CourseManagement() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", description: "", level: "Shraddhavan", certificationEnabled: true });
  const [submitting, setSubmitting] = useState(false);

  const api = axios.create({
    baseURL: API_URL,
    headers: { Authorization: `Bearer ${localStorage.getItem("pms_token")}` },
  });

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/courses");
      setCourses(data.courses);
    } catch {
      toast.error("Failed to load courses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCourses(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("Course name is required");
    setSubmitting(true);
    try {
      if (editing) {
        await api.patch(`/courses/${editing}`, form);
        toast.success("Course updated");
      } else {
        await api.post("/courses", form);
        toast.success("Course created");
      }
      setShowForm(false);
      setEditing(null);
      setForm({ name: "", description: "", level: "Shraddhavan", certificationEnabled: true });
      fetchCourses();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save course");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (course) => {
    try {
      await api.patch(`/courses/${course._id}`, { active: !course.active });
      toast.success(`Course ${course.active ? "deactivated" : "activated"}`);
      fetchCourses();
    } catch {
      toast.error("Failed to update course");
    }
  };

  const openEdit = (c) => {
    setEditing(c._id);
    setForm({ name: c.name, description: c.description, level: c.level, certificationEnabled: c.certificationEnabled });
    setShowForm(true);
  };

  return (
    <div style={{ padding: "24px", maxWidth: 900, margin: "0 auto" }}>
      <style>{`
        .cm-card { background:#fff; border-radius:12px; box-shadow:0 1px 3px rgba(0,0,0,.08); padding:24px; }
        .cm-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; }
        .cm-title { font-size:1.5rem; font-weight:700; color:#1e293b; }
        .cm-btn { padding:8px 18px; border:none; border-radius:8px; font-size:.88rem; cursor:pointer; font-weight:600; }
        .cm-btn-primary { background:#6366f1; color:#fff; }
        .cm-btn-primary:hover { background:#4f46e5; }
        .cm-btn-secondary { background:#f1f5f9; color:#475569; }
        .cm-btn-sm { padding:5px 12px; font-size:.8rem; }
        .cm-btn-danger { background:#fef2f2; color:#ef4444; }
        .cm-table { width:100%; border-collapse:collapse; font-size:.88rem; }
        .cm-table th { text-align:left; padding:10px 12px; background:#f8fafc; color:#64748b; font-weight:600; border-bottom:2px solid #e2e8f0; }
        .cm-table td { padding:10px 12px; border-bottom:1px solid #f1f5f9; color:#334155; }
        .cm-badge { display:inline-block; padding:3px 10px; border-radius:20px; font-size:.78rem; font-weight:600; }
        .cm-modal-bg { position:fixed; inset:0; background:rgba(0,0,0,.35); display:flex; align-items:center; justify-content:center; z-index:100; }
        .cm-modal { background:#fff; border-radius:14px; padding:28px; width:460px; max-width:95vw; }
        .cm-fg { display:flex; flex-direction:column; gap:4px; margin-bottom:14px; }
        .cm-fg label { font-size:.82rem; font-weight:600; color:#475569; }
        .cm-input,.cm-select { padding:8px 12px; border:1px solid #e2e8f0; border-radius:8px; font-size:.88rem; outline:none; }
        .cm-input:focus,.cm-select:focus { border-color:#6366f1; }
        .cm-empty { text-align:center; padding:40px; color:#94a3b8; }
      `}</style>

      <div className="cm-card">
        <div className="cm-header">
          <h1 className="cm-title">Course Management</h1>
          <button className="cm-btn cm-btn-primary" onClick={() => { setEditing(null); setForm({ name: "", description: "", level: "Shraddhavan", certificationEnabled: true }); setShowForm(true); }}>+ Create Course</button>
        </div>

        {loading ? (
          <div className="cm-empty">Loading...</div>
        ) : courses.length === 0 ? (
          <div className="cm-empty">No courses yet. Create one to get started.</div>
        ) : (
          <table className="cm-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Level</th>
                <th>Certification</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((c) => (
                <tr key={c._id}>
                  <td style={{ fontWeight: 600 }}>{c.name}</td>
                  <td><span className="cm-badge" style={{ background: "#ede9fe", color: "#6366f1" }}>{c.level}</span></td>
                  <td>{c.certificationEnabled ? "Yes" : "No"}</td>
                  <td><span className="cm-badge" style={{ background: c.active ? "#f0fdf4" : "#fef2f2", color: c.active ? "#22c55e" : "#ef4444" }}>{c.active ? "Active" : "Inactive"}</span></td>
                  <td style={{ display: "flex", gap: 6 }}>
                    <button className="cm-btn cm-btn-secondary cm-btn-sm" onClick={() => openEdit(c)}>Edit</button>
                    <button className={`cm-btn cm-btn-sm ${c.active ? "cm-btn-danger" : "cm-btn-primary"}`} onClick={() => toggleActive(c)}>
                      {c.active ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showForm && (
        <div className="cm-modal-bg" onClick={() => setShowForm(false)}>
          <div className="cm-modal" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginBottom: 16, color: "#1e293b" }}>{editing ? "Edit Course" : "Create Course"}</h2>
            <form onSubmit={handleSubmit}>
              <div className="cm-fg">
                <label>Course Name *</label>
                <input className="cm-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="cm-fg">
                <label>Description</label>
                <textarea className="cm-input" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="cm-fg">
                <label>Level *</label>
                <select className="cm-select" value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}>
                  {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div className="cm-fg" style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <input type="checkbox" checked={form.certificationEnabled} onChange={(e) => setForm({ ...form, certificationEnabled: e.target.checked })} id="certEn" />
                <label htmlFor="certEn">Certification Enabled</label>
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button type="button" className="cm-btn cm-btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="cm-btn cm-btn-primary" disabled={submitting}>{submitting ? "Saving..." : editing ? "Update" : "Create"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
