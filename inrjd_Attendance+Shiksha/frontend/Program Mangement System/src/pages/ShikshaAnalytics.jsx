import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { API_URL } from "../config/api";
import toast from "react-hot-toast";

const LEVEL_COLORS = {
  None: "#94a3b8",
  Shraddhavan: "#3b82f6",
  "Krishna Sevak": "#8b5cf6",
  "Krishna Sadhak": "#f59e0b",
  "Srila Prabhupada Ashraya": "#ef4444",
  "Srila Guru Charana Ashraya": "#10b981",
};

// Simple bar chart (horizontal)
function HBar({ data, maxVal, colorFn }) {
  if (!data || !data.length) return <div style={{ color: "#94a3b8", fontSize: ".85rem" }}>No data</div>;
  const mx = maxVal || Math.max(...data.map((d) => d.value), 1);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {data.map((d, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 160, fontSize: ".82rem", color: "#475569", fontWeight: 600, textAlign: "right", flexShrink: 0 }}>{d.label}</div>
          <div style={{ flex: 1, background: "#f1f5f9", borderRadius: 6, height: 26, overflow: "hidden" }}>
            <div style={{
              width: `${Math.max((d.value / mx) * 100, 2)}%`,
              height: "100%",
              background: colorFn ? colorFn(d.label) : `linear-gradient(90deg, #6366f1, #8b5cf6)`,
              borderRadius: 6,
              display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 8,
              fontSize: ".75rem", fontWeight: 700, color: "#fff",
              transition: "width .5s ease",
            }}>
              {d.value}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Simple vertical bar chart
function VBar({ data, height = 200, colorFn }) {
  if (!data || !data.length) return <div style={{ color: "#94a3b8", fontSize: ".85rem" }}>No data</div>;
  const mx = Math.max(...data.map((d) => d.value), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height, paddingTop: 10 }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: "100%" }}>
          <div style={{ fontSize: ".7rem", fontWeight: 700, color: "#475569", marginBottom: 4 }}>{d.value}</div>
          <div style={{
            width: "100%",
            maxWidth: 40,
            height: `${Math.max((d.value / mx) * 100, 4)}%`,
            background: colorFn ? colorFn(d.label, i) : `linear-gradient(180deg, #6366f1, #818cf8)`,
            borderRadius: "6px 6px 0 0",
            transition: "height .5s ease",
          }} />
          <div style={{ fontSize: ".65rem", color: "#94a3b8", marginTop: 4, textAlign: "center", lineHeight: 1.2, maxWidth: 50, wordBreak: "break-word" }}>{d.label}</div>
        </div>
      ))}
    </div>
  );
}

// Funnel / pyramid chart
function FunnelChart({ data }) {
  if (!data || !data.length) return null;
  const mx = Math.max(...data.map((d) => d.count), 1);
  return (
    <div style={{ display: "flex", flexDirection: "column-reverse", alignItems: "center", gap: 4 }}>
      {data.map((d, i) => {
        const widthPct = Math.max((d.count / mx) * 100, 20);
        const color = LEVEL_COLORS[d.level] || "#94a3b8";
        return (
          <div key={i} style={{
            width: `${widthPct}%`,
            background: `linear-gradient(90deg, ${color}33, ${color}22)`,
            borderLeft: `4px solid ${color}`,
            borderRadius: 8,
            padding: "10px 14px",
            display: "flex", justifyContent: "space-between", alignItems: "center",
            transition: "width .5s ease",
          }}>
            <span style={{ fontWeight: 600, fontSize: ".85rem", color }}>{d.level}</span>
            <span style={{ fontWeight: 800, fontSize: "1rem", color }}>{d.count}</span>
          </div>
        );
      })}
    </div>
  );
}

// Donut
function Donut({ data, size = 160 }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  let cumulative = 0;
  const segments = data.map((d) => {
    const start = cumulative;
    cumulative += (d.value / total) * 360;
    return { ...d, start, end: cumulative };
  });
  const r = size / 2 - 10;
  const cx = size / 2;
  const cy = size / 2;
  const toRad = (deg) => (deg - 90) * (Math.PI / 180);
  const arcPath = (start, end) => {
    const s = toRad(start);
    const e = toRad(end);
    const largeArc = end - start > 180 ? 1 : 0;
    return `M ${cx + r * Math.cos(s)} ${cy + r * Math.sin(s)} A ${r} ${r} 0 ${largeArc} 1 ${cx + r * Math.cos(e)} ${cy + r * Math.sin(e)}`;
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
      <svg width={size} height={size}>
        {segments.map((seg, i) => (
          <path key={i} d={arcPath(seg.start, seg.end)} fill="none" stroke={seg.color || "#6366f1"} strokeWidth={20} />
        ))}
        <text x={cx} y={cy} textAnchor="middle" dy="6" style={{ fontSize: "1.4rem", fontWeight: 800, fill: "#1e293b" }}>{total}</text>
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {data.map((d, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: ".78rem" }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: d.color }} />
            <span style={{ color: "#475569" }}>{d.label}: <strong>{d.value}</strong></span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ShikshaAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const api = axios.create({
    baseURL: API_URL,
    headers: { Authorization: `Bearer ${localStorage.getItem("pms_token")}` },
  });

  useEffect(() => {
    (async () => {
      try {
        const { data: d } = await api.get("/shiksha-analytics/overview");
        setData(d);
      } catch {
        toast.error("Failed to load Shiksha analytics");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const levelDistData = useMemo(() => {
    if (!data) return [];
    return Object.entries(data.levelDistribution).map(([label, value]) => ({ label, value }));
  }, [data]);

  const certsByMonthData = useMemo(() => {
    if (!data) return [];
    return Object.entries(data.certsByMonth).map(([k, v]) => ({
      label: k.slice(5) + "/" + k.slice(2, 4),
      value: v,
    }));
  }, [data]);

  const addedByMonthData = useMemo(() => {
    if (!data) return [];
    return Object.entries(data.addedByMonth).map(([k, v]) => ({
      label: k.slice(5) + "/" + k.slice(2, 4),
      value: v,
    }));
  }, [data]);

  const certsByLevelData = useMemo(() => {
    if (!data) return [];
    return Object.entries(data.certsByLevel).map(([label, value]) => ({ label, value }));
  }, [data]);

  const certsByCourseData = useMemo(() => {
    if (!data) return [];
    return Object.entries(data.certsByCourse).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
  }, [data]);

  const gpDonut = useMemo(() => {
    if (!data) return [];
    const colors = { active: "#22c55e", completed: "#3b82f6", "on-hold": "#f59e0b", cancelled: "#ef4444" };
    return Object.entries(data.gpStats).filter(([, v]) => v > 0).map(([label, value]) => ({ label, value, color: colors[label] || "#94a3b8" }));
  }, [data]);

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>Loading Shiksha Analytics...</div>;
  if (!data) return <div style={{ padding: 40, textAlign: "center", color: "#ef4444" }}>Failed to load data</div>;

  const s = data.summary;

  return (
    <div style={{ padding: "24px", maxWidth: 1200, margin: "0 auto" }}>
      <style>{`
        .sa-card { background: #fff; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,.08); padding: 22px; }
        .sa-title { font-size: 1.5rem; font-weight: 700; color: #1e293b; margin-bottom: 20px; }
        .sa-grid { display: grid; gap: 16px; margin-bottom: 20px; }
        .sa-grid-4 { grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); }
        .sa-grid-2 { grid-template-columns: 1fr 1fr; }
        .sa-grid-3 { grid-template-columns: 1fr 1fr 1fr; }
        .sa-kpi { background: #fff; border-radius: 12px; padding: 18px; box-shadow: 0 1px 3px rgba(0,0,0,.08); border-left: 4px solid; }
        .sa-kpi-value { font-size: 1.8rem; font-weight: 800; }
        .sa-kpi-label { font-size: .78rem; color: #94a3b8; font-weight: 600; text-transform: uppercase; margin-top: 2px; }
        .sa-section { margin-bottom: 20px; }
        .sa-section-title { font-size: 1rem; font-weight: 700; color: #334155; margin-bottom: 12px; }
        .sa-table { width: 100%; border-collapse: collapse; font-size: .82rem; }
        .sa-table th { text-align: left; padding: 8px 10px; background: #f8fafc; color: #64748b; font-weight: 600; border-bottom: 2px solid #e2e8f0; }
        .sa-table td { padding: 8px 10px; border-bottom: 1px solid #f1f5f9; color: #334155; }
        .sa-badge { display: inline-block; padding: 2px 10px; border-radius: 20px; font-size: .72rem; font-weight: 600; color: #fff; }
        @media(max-width:768px) { .sa-grid-2, .sa-grid-3 { grid-template-columns: 1fr; } }
      `}</style>

      <h1 className="sa-title">Shiksha & Certification Analytics</h1>

      {/* KPI Cards */}
      <div className="sa-grid sa-grid-4">
        <div className="sa-kpi" style={{ borderColor: "#6366f1" }}>
          <div className="sa-kpi-value" style={{ color: "#6366f1" }}>{s.totalParticipants}</div>
          <div className="sa-kpi-label">Total Participants</div>
        </div>
        <div className="sa-kpi" style={{ borderColor: "#22c55e" }}>
          <div className="sa-kpi-value" style={{ color: "#22c55e" }}>{s.activeParticipants}</div>
          <div className="sa-kpi-label">Active Participants</div>
        </div>
        <div className="sa-kpi" style={{ borderColor: "#f59e0b" }}>
          <div className="sa-kpi-value" style={{ color: "#f59e0b" }}>{s.totalCertifications}</div>
          <div className="sa-kpi-label">Certifications Issued</div>
        </div>
        <div className="sa-kpi" style={{ borderColor: "#8b5cf6" }}>
          <div className="sa-kpi-value" style={{ color: "#8b5cf6" }}>{s.activeCourses}</div>
          <div className="sa-kpi-label">Active Courses</div>
        </div>
        <div className="sa-kpi" style={{ borderColor: "#3b82f6" }}>
          <div className="sa-kpi-value" style={{ color: "#3b82f6" }}>{s.totalGrowthPlans}</div>
          <div className="sa-kpi-label">Growth Plans</div>
        </div>
        <div className="sa-kpi" style={{ borderColor: "#ef4444" }}>
          <div className="sa-kpi-value" style={{ color: "#ef4444" }}>{s.totalPrograms}</div>
          <div className="sa-kpi-label">Total Programs</div>
        </div>
        <div className="sa-kpi" style={{ borderColor: "#10b981" }}>
          <div className="sa-kpi-value" style={{ color: "#10b981" }}>{s.totalOwners}</div>
          <div className="sa-kpi-label">Program Owners</div>
        </div>
        <div className="sa-kpi" style={{ borderColor: "#64748b" }}>
          <div className="sa-kpi-value" style={{ color: "#64748b" }}>{s.totalCourses}</div>
          <div className="sa-kpi-label">Total Courses</div>
        </div>
      </div>

      {/* Row: Level Distribution + Funnel */}
      <div className="sa-grid sa-grid-2">
        <div className="sa-card">
          <div className="sa-section-title">Participant Level Distribution</div>
          <HBar data={levelDistData} colorFn={(label) => LEVEL_COLORS[label] || "#6366f1"} />
        </div>
        <div className="sa-card">
          <div className="sa-section-title">Level Progression Funnel</div>
          <FunnelChart data={data.levelFunnel} />
        </div>
      </div>

      {/* Row: Certs by Month + Participants Added */}
      <div className="sa-grid sa-grid-2">
        <div className="sa-card">
          <div className="sa-section-title">Certifications per Month (12 mo)</div>
          <VBar data={certsByMonthData} height={180} colorFn={(_, i) => i % 2 === 0 ? "#6366f1" : "#818cf8"} />
        </div>
        <div className="sa-card">
          <div className="sa-section-title">Participants Added per Month</div>
          <VBar data={addedByMonthData} height={180} colorFn={(_, i) => i % 2 === 0 ? "#22c55e" : "#4ade80"} />
        </div>
      </div>

      {/* Row: Certs by Level + Growth Plan Status */}
      <div className="sa-grid sa-grid-2">
        <div className="sa-card">
          <div className="sa-section-title">Certifications by Level</div>
          <HBar data={certsByLevelData} colorFn={(label) => LEVEL_COLORS[label] || "#6366f1"} />
        </div>
        <div className="sa-card">
          <div className="sa-section-title">Growth Plan Status</div>
          {gpDonut.length > 0 ? <Donut data={gpDonut} /> : <div style={{ color: "#94a3b8", fontSize: ".85rem" }}>No growth plans yet</div>}
        </div>
      </div>

      {/* Row: Certs by Course */}
      {certsByCourseData.length > 0 && (
        <div className="sa-card sa-section">
          <div className="sa-section-title">Certifications by Course</div>
          <HBar data={certsByCourseData} />
        </div>
      )}

      {/* Row: Program Owner Insights + Top Participants */}
      <div className="sa-grid sa-grid-2">
        <div className="sa-card">
          <div className="sa-section-title">Program Owner Insights</div>
          <div style={{ overflowX: "auto" }}>
            <table className="sa-table">
              <thead>
                <tr>
                  <th>Owner</th>
                  <th>Programs</th>
                  <th>Participants</th>
                  <th>Certifications</th>
                </tr>
              </thead>
              <tbody>
                {data.ownerInsights.map((o, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600 }}>{o.name}</td>
                    <td>{o.programs}</td>
                    <td>{o.participants}</td>
                    <td><strong>{o.certifications}</strong></td>
                  </tr>
                ))}
                {data.ownerInsights.length === 0 && <tr><td colSpan={4} style={{ textAlign: "center", color: "#94a3b8" }}>No data</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
        <div className="sa-card">
          <div className="sa-section-title">Top Participants (Most Certifications)</div>
          <div style={{ overflowX: "auto" }}>
            <table className="sa-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Current Level</th>
                  <th>Certifications</th>
                </tr>
              </thead>
              <tbody>
                {data.topParticipants.map((p, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600 }}>{p.name}</td>
                    <td><span className="sa-badge" style={{ background: LEVEL_COLORS[p.currentLevel] || "#94a3b8" }}>{p.currentLevel}</span></td>
                    <td><strong>{p.count}</strong></td>
                  </tr>
                ))}
                {data.topParticipants.length === 0 && <tr><td colSpan={3} style={{ textAlign: "center", color: "#94a3b8" }}>No data</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Recent Certifications */}
      <div className="sa-card sa-section">
        <div className="sa-section-title">Recent Certifications</div>
        <div style={{ overflowX: "auto" }}>
          <table className="sa-table">
            <thead>
              <tr>
                <th>Participant</th>
                <th>Level</th>
                <th>Course</th>
                <th>Progression</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {data.recentCerts.map((c, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 600 }}>{c.participantName}</td>
                  <td><span className="sa-badge" style={{ background: LEVEL_COLORS[c.level] || "#6366f1" }}>{c.level}</span></td>
                  <td>{c.course}</td>
                  <td style={{ fontSize: ".8rem" }}>{c.fromLevel} &rarr; {c.toLevel}</td>
                  <td>{fmtDate(c.date)}</td>
                </tr>
              ))}
              {data.recentCerts.length === 0 && <tr><td colSpan={5} style={{ textAlign: "center", color: "#94a3b8" }}>No certifications yet</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
