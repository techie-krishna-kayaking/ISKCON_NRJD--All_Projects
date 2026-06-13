import { useState, useEffect, useCallback } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";

// ════════════════════════════════════════════════════════════════
// ADMIN MESSAGES PAGE
// Route: /admin/messages
// Shows all owner messages with reply, close, delete actions
// ════════════════════════════════════════════════════════════════

const css = `
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=DM+Sans:wght@300;400;500;600;700&display=swap');

.am { min-height:100%; background:#f4ede4; font-family:'DM Sans',sans-serif; }

/* ── Banner ── */
.am-hero {
  background:linear-gradient(135deg,#0d0300 0%,#2a0e00 20%,#5a2400 55%,#8b4000 80%,#b86000 100%);
  padding:30px 0 0; position:relative; overflow:hidden;
}
.am-hero::before {
  content:''; position:absolute; inset:0;
  background:radial-gradient(ellipse at 70% 50%,rgba(200,120,0,0.12) 0%,transparent 55%);
  pointer-events:none;
}
.am-inner { max-width:1100px; margin:0 auto; padding:0 28px; position:relative; z-index:1; }
.am-ey { font-family:'Cinzel',serif; font-size:0.6rem; font-weight:700; color:rgba(200,150,60,0.85); letter-spacing:0.24em; text-transform:uppercase; margin-bottom:8px; display:flex; align-items:center; gap:8px; }
.am-ey::before,.am-ey::after { content:''; width:20px; height:1px; background:rgba(200,150,60,0.4); }
.am-title { font-family:'Cinzel',serif; font-size:clamp(1.4rem,3vw,2rem); font-weight:700; color:#fff; margin:0 0 6px; }
.am-title em { color:#f5c842; font-style:normal; }
.am-sub   { color:rgba(255,210,140,0.6); font-size:0.85rem; margin:0 0 28px; }

/* Stats strip */
.am-strip { display:grid; grid-template-columns:repeat(4,1fr); border-top:1px solid rgba(255,255,255,0.08); margin:0 -28px; }
.am-si { padding:14px 20px; border-right:1px solid rgba(255,255,255,0.07); position:relative; }
.am-si:last-child { border-right:none; }
.am-si::before { content:''; position:absolute; top:0; left:0; right:0; height:2px; }
.am-s0::before{background:linear-gradient(90deg,#f87171,transparent);}
.am-s1::before{background:linear-gradient(90deg,#f5c842,transparent);}
.am-s2::before{background:linear-gradient(90deg,#4ade80,transparent);}
.am-s3::before{background:linear-gradient(90deg,#a78bfa,transparent);}
.am-sv { font-family:'Cinzel',serif; font-size:1.3rem; font-weight:700; color:#fff; line-height:1; margin-bottom:2px; }
.am-sl { font-size:0.58rem; font-weight:600; color:rgba(255,210,150,0.5); text-transform:uppercase; letter-spacing:0.1em; }

/* ── Body ── */
.am-body { max-width:1100px; margin:0 auto; padding:22px 28px 60px; }

/* ── Filters ── */
.am-filters { display:flex; gap:8px; flex-wrap:wrap; align-items:center; margin-bottom:18px; }
.am-ftab {
  padding:7px 16px; border-radius:20px; cursor:pointer; font-size:0.78rem; font-weight:700;
  border:1.5px solid; transition:all 0.14s;
}
.am-ftab.active  { background:rgba(200,140,40,0.12); border-color:#c8903c; color:#3d1800; }
.am-ftab.inactive{ background:transparent; border-color:rgba(200,140,40,0.2); color:#8b6840; }
.am-ftab.inactive:hover { background:rgba(200,140,40,0.06); border-color:rgba(200,140,40,0.35); }

/* ── Message list ── */
.am-list { display:flex; flex-direction:column; gap:10px; }
.am-card {
  background:#fff; border:1.5px solid rgba(200,140,40,0.15); border-radius:16px;
  overflow:hidden; box-shadow:0 2px 10px rgba(61,23,0,0.05); transition:all 0.18s;
}
.am-card:hover { box-shadow:0 5px 18px rgba(61,23,0,0.1); }
.am-card.unread  { border-left:4px solid #dc2626; }
.am-card.read    { border-left:4px solid #d97706; }
.am-card.replied { border-left:4px solid #16a34a; }
.am-card.closed  { border-left:4px solid #6b7280; opacity:0.7; }

.am-card-hd {
  padding:13px 18px; cursor:pointer; display:flex; align-items:flex-start; gap:13px;
  border-bottom:1px solid transparent; transition:border-color 0.14s;
}
.am-card.expanded .am-card-hd { border-bottom-color:rgba(200,140,40,0.1); background:rgba(200,140,40,0.03); }

.am-av { width:36px; height:36px; border-radius:9px; background:linear-gradient(135deg,#c47a00,#7a3a00); display:flex; align-items:center; justify-content:center; font-family:'Cinzel',serif; font-size:0.72rem; font-weight:700; color:#fff; flex-shrink:0; }
.am-from  { flex:1; min-width:0; }
.am-from-name  { font-weight:700; font-size:0.86rem; color:#2d1200; }
.am-from-email { font-size:0.68rem; color:#a08060; }
.am-from-meta  { font-size:0.68rem; color:#a08060; margin-top:2px; display:flex; gap:8px; flex-wrap:wrap; }

.am-cat-badge { font-size:0.64rem; font-weight:700; padding:2px 8px; border-radius:20px; flex-shrink:0; }
.am-cat-Question   { background:rgba(2,132,199,0.1);  color:#0c4a6e; border:1px solid rgba(2,132,199,0.2); }
.am-cat-Feedback   { background:rgba(22,163,74,0.1);  color:#15803d; border:1px solid rgba(22,163,74,0.2); }
.am-cat-Bug\ Report{ background:rgba(220,38,38,0.08); color:#b91c1c; border:1px solid rgba(220,38,38,0.2); }
.am-cat-Other      { background:rgba(107,114,128,0.08);color:#6b7280; border:1px solid rgba(107,114,128,0.2); }

.am-status-pill { font-size:0.62rem; font-weight:700; padding:2px 8px; border-radius:20px; flex-shrink:0; }
.am-sp-unread  { background:rgba(220,38,38,0.1);  color:#b91c1c; border:1px solid rgba(220,38,38,0.2); }
.am-sp-read    { background:rgba(251,191,36,0.1); color:#92400e; border:1px solid rgba(251,191,36,0.25); }
.am-sp-replied { background:rgba(22,163,74,0.1);  color:#15803d; border:1px solid rgba(22,163,74,0.2); }
.am-sp-closed  { background:rgba(107,114,128,0.08);color:#6b7280; border:1px solid rgba(107,114,128,0.2); }

/* ── Card body (expanded) ── */
.am-card-body { padding:16px 18px; display:flex; flex-direction:column; gap:14px; }

.am-msg-bubble {
  padding:13px 16px; border-radius:12px;
  background:rgba(200,140,40,0.05); border:1px solid rgba(200,140,40,0.12);
  font-size:0.83rem; color:#2d1200; line-height:1.75; white-space:pre-wrap;
}
.am-reply-bubble {
  padding:13px 16px; border-radius:12px;
  background:rgba(22,163,74,0.05); border:1px solid rgba(22,163,74,0.15);
  font-size:0.83rem; color:#1a3d1a; line-height:1.75; white-space:pre-wrap;
}
.am-reply-meta { font-size:0.67rem; color:#6b8cae; margin-top:5px; }

/* Reply form */
.am-reply-form { display:flex; flex-direction:column; gap:8px; }
.am-reply-ta {
  padding:11px 14px; border:1.5px solid rgba(200,140,40,0.22); border-radius:11px;
  background:#fff; color:#2d1200; font-family:'DM Sans',sans-serif; font-size:0.83rem;
  outline:none; resize:vertical; min-height:80px; transition:border-color 0.15s; line-height:1.6;
}
.am-reply-ta:focus { border-color:#c8903c; box-shadow:0 0 0 3px rgba(200,140,40,0.1); }

.am-actions { display:flex; gap:8px; flex-wrap:wrap; }
.am-btn-reply {
  padding:8px 16px; border-radius:9px; border:none;
  background:linear-gradient(135deg,#15803d,#16a34a); color:#fff;
  font-family:'DM Sans',sans-serif; font-size:0.78rem; font-weight:700;
  cursor:pointer; transition:all 0.14s; display:flex; align-items:center; gap:5px;
}
.am-btn-reply:hover:not(:disabled) { opacity:0.88; transform:translateY(-1px); }
.am-btn-reply:disabled { opacity:0.5; cursor:not-allowed; }
.am-btn-close {
  padding:8px 16px; border-radius:9px;
  border:1.5px solid rgba(107,114,128,0.3); background:rgba(107,114,128,0.06);
  color:#6b7280; font-family:'DM Sans',sans-serif; font-size:0.78rem; font-weight:700;
  cursor:pointer; transition:all 0.14s;
}
.am-btn-close:hover { background:rgba(107,114,128,0.12); }
.am-btn-del {
  padding:8px 16px; border-radius:9px;
  border:1.5px solid rgba(220,38,38,0.2); background:rgba(220,38,38,0.05);
  color:#b91c1c; font-family:'DM Sans',sans-serif; font-size:0.78rem; font-weight:700;
  cursor:pointer; transition:all 0.14s; margin-left:auto;
}
.am-btn-del:hover { background:rgba(220,38,38,0.1); }

/* Skel */
.am-skel { background:linear-gradient(90deg,rgba(200,140,40,0.07) 25%,rgba(200,140,40,0.14) 50%,rgba(200,140,40,0.07) 75%); background-size:200% 100%; animation:amSk 1.4s infinite; border-radius:10px; }
@keyframes amSk { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

/* spin */
.am-spin { width:12px; height:12px; border-radius:50%; border:2px solid rgba(255,255,255,0.3); border-top-color:#fff; animation:amSpin 0.7s linear infinite; }
@keyframes amSpin { to{transform:rotate(360deg)} }

/* Empty */
.am-empty { text-align:center; padding:48px 24px; }
.am-empty-ico { font-size:2.5rem; margin-bottom:10px; opacity:0.5; }
.am-empty-txt { font-family:'Cinzel',serif; font-size:0.86rem; color:#a08060; }

@media(max-width:860px){ .am-strip{grid-template-columns:repeat(2,1fr);} }
@media(max-width:600px){ .am-body{padding:16px 14px 60px;} .am-inner{padding:0 14px;} .am-filters{gap:5px;} }
`;

function ini(name) {
  return (
    name
      ?.split(" ")
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
function timeAgo(d) {
  const m = Math.floor((Date.now() - new Date(d)) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`;
}

const STATUS_TABS = ["all", "unread", "read", "replied"];

function MessageCard({ msg, onUpdate, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [acting, setActing] = useState(false);

  const handleExpand = async () => {
    if (!expanded && msg.status === "unread") {
      try {
        const r = await api.patch(`/messages/${msg._id}/read`);
        onUpdate(r.data.data);
      } catch {
        /* silent */
      }
    }
    setExpanded((p) => !p);
  };

  const handleReply = async () => {
    if (!replyText.trim()) {
      toast.error("Reply cannot be empty.");
      return;
    }
    setSending(true);
    try {
      const r = await api.post(`/messages/${msg._id}/reply`, {
        reply: replyText,
      });
      onUpdate(r.data.data);
      setReplyText("");
      toast.success("Reply sent!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed.");
    } finally {
      setSending(false);
    }
  };

  const handleClose = async () => {
    if (!window.confirm("Mark as done and delete this message thread?")) return;
    setActing(true);
    try {
      await api.delete(`/messages/${msg._id}`);
      onDelete(msg._id);
      toast.success("Thread closed and deleted.");
    } catch {
      toast.error("Failed.");
    } finally {
      setActing(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this message permanently?")) return;
    setActing(true);
    try {
      await api.delete(`/messages/${msg._id}`);
      onDelete(msg._id);
      toast.success("Deleted.");
    } catch {
      toast.error("Failed.");
    } finally {
      setActing(false);
    }
  };

  const catClass = `am-cat-badge am-cat-${msg.category?.replace(" ", "\\ ")}`;

  return (
    <div className={`am-card ${msg.status}${expanded ? " expanded" : ""}`}>
      {/* Header — click to expand */}
      <div className="am-card-hd" onClick={handleExpand}>
        <div className="am-av">{ini(msg.senderName)}</div>
        <div className="am-from">
          <div className="am-from-name">{msg.senderName}</div>
          <div className="am-from-email">{msg.senderEmail}</div>
          <div className="am-from-meta">
            <span>{timeAgo(msg.createdAt)}</span>
            {msg.subject && <span>· {msg.subject}</span>}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: 5,
            flexShrink: 0,
          }}
        >
          <span className={catClass}>{msg.category}</span>
          <span className={`am-status-pill am-sp-${msg.status}`}>
            {msg.status === "unread"
              ? "🔴 Unread"
              : msg.status === "read"
              ? "🟡 Read"
              : msg.status === "replied"
              ? "🟢 Replied"
              : "⬜ Closed"}
          </span>
        </div>
      </div>

      {/* Expanded body */}
      {expanded && (
        <div className="am-card-body">
          {/* Message */}
          <div>
            <div
              style={{
                fontSize: "0.66rem",
                fontWeight: 700,
                color: "#7a4a10",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                marginBottom: 6,
              }}
            >
              Message
            </div>
            <div className="am-msg-bubble">{msg.message}</div>
            <div
              style={{ fontSize: "0.66rem", color: "#a08060", marginTop: 4 }}
            >
              Sent {fmtDate(msg.createdAt)}
            </div>
          </div>

          {/* Existing reply */}
          {msg.reply && (
            <div>
              <div
                style={{
                  fontSize: "0.66rem",
                  fontWeight: 700,
                  color: "#15803d",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  marginBottom: 6,
                }}
              >
                Your Reply
              </div>
              <div className="am-reply-bubble">{msg.reply}</div>
              <div className="am-reply-meta">
                Replied by {msg.repliedBy?.name || "Admin"} ·{" "}
                {fmtDate(msg.repliedAt)}
              </div>
            </div>
          )}

          {/* Reply form — only if not closed */}
          {msg.status !== "closed" && (
            <div className="am-reply-form">
              <div
                style={{
                  fontSize: "0.66rem",
                  fontWeight: 700,
                  color: "#7a4a10",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                }}
              >
                {msg.reply ? "Update Reply" : "Reply"}
              </div>
              <textarea
                className="am-reply-ta"
                placeholder="Type your reply…"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
              />
              <div className="am-actions">
                <button
                  className="am-btn-reply"
                  onClick={handleReply}
                  disabled={sending || !replyText.trim()}
                >
                  {sending ? (
                    <>
                      <span className="am-spin" /> Sending…
                    </>
                  ) : (
                    "✓ Send Reply"
                  )}
                </button>
                <button
                  className="am-btn-close"
                  onClick={handleClose}
                  disabled={acting}
                >
                  ✓ Done & Delete
                </button>
                <button
                  className="am-btn-del"
                  onClick={handleDelete}
                  disabled={acting}
                >
                  🗑 Delete
                </button>
              </div>
            </div>
          )}

          {/* Closed — just reopen + delete */}
          {msg.status === "closed" && (
            <div className="am-actions">
              <button
                className="am-btn-close"
                onClick={handleClose}
                disabled={acting}
              >
                ↩ Reopen
              </button>
              <button
                className="am-btn-del"
                onClick={handleDelete}
                disabled={acting}
              >
                🗑 Delete
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminMessages() {
  const [msgs, setMsgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [stats, setStats] = useState({
    unread: 0,
    read: 0,
    replied: 0,
    closed: 0,
    total: 0,
  });

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    try {
      const params = activeTab !== "all" ? { status: activeTab } : {};
      const r = await api.get("/messages", { params });
      setMsgs(r.data.messages || []);

      // Compute stats from all (fetch without filter for counts)
      if (activeTab === "all") {
        const all = r.data.messages || [];
        setStats({
          total: all.length,
          unread: all.filter((m) => m.status === "unread").length,
          read: all.filter((m) => m.status === "read").length,
          replied: all.filter((m) => m.status === "replied").length,
          closed: all.filter((m) => m.status === "closed").length,
        });
      }
    } catch {
      toast.error("Failed to load messages.");
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const handleUpdate = (updated) => {
    setMsgs((p) => p.map((m) => (m._id === updated._id ? updated : m)));
  };
  const handleDelete = (id) => {
    setMsgs((p) => p.filter((m) => m._id !== id));
  };

  const filtered =
    activeTab === "all" ? msgs : msgs.filter((m) => m.status === activeTab);

  return (
    <>
      <style>{css}</style>
      <div className="am">
        {/* Hero */}
        <div className="am-hero">
          <div className="am-inner">
            <div className="am-ey">Admin Portal</div>
            <h1 className="am-title">
              Owner <em>Messages</em>
            </h1>
            <p className="am-sub">
              Queries, feedback and reports from program owners
            </p>
            <div className="am-strip">
              {[
                { c: "am-s0", v: stats.unread, l: "Unread" },
                { c: "am-s1", v: stats.read, l: "Read" },
                { c: "am-s2", v: stats.replied, l: "Replied" },
                { c: "am-s3", v: stats.closed, l: "Closed" },
              ].map((s, i) => (
                <div key={i} className={`am-si ${s.c}`}>
                  <div className="am-sv">{loading ? "—" : s.v}</div>
                  <div className="am-sl">{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="am-body">
          {/* Filter tabs */}
          <div className="am-filters">
            {STATUS_TABS.map((tab) => (
              <div
                key={tab}
                className={`am-ftab ${
                  activeTab === tab ? "active" : "inactive"
                }`}
                onClick={() => setActiveTab(tab)}
              >
                {tab === "all"
                  ? `All (${stats.total})`
                  : tab === "unread"
                  ? `🔴 Unread (${stats.unread})`
                  : tab === "read"
                  ? `🟡 Read (${stats.read})`
                  : `🟢 Replied (${stats.replied})`}
              </div>
            ))}
          </div>

          {/* List */}
          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="am-skel"
                  style={{ height: 72, borderRadius: 16 }}
                />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="am-empty">
              <div className="am-empty-ico">📭</div>
              <div className="am-empty-txt">
                {activeTab === "all"
                  ? "No messages yet"
                  : `No ${activeTab} messages`}
              </div>
            </div>
          ) : (
            <div className="am-list">
              {filtered.map((msg) => (
                <MessageCard
                  key={msg._id}
                  msg={msg}
                  onUpdate={handleUpdate}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
