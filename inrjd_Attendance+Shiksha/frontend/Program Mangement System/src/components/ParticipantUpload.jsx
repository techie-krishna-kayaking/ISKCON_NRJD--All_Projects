import { useState, useRef, useCallback } from "react";
import toast from "react-hot-toast";

const NOISE_EXACT = new Set([
  // UI chrome
  "participants",
  "you",
  "host",
  "co-host",
  "cohost",
  "me",
  "guest",
  "guests",
  "waiting room",
  "waiting",
  "everyone",
  "all",
  "muted",
  "unmuted",
  "on",
  "off",
  "more",
  "less",
  "admit",
  "remove",
  "pin",
  "spotlight",
  "mute",
  "unmute",
  "rename",
  "lower hand",
  "raise hand",
  "video",
  "audio",
  "chat",
  "reactions",
  "screen share",
  "recording",
  "leave",
  "end",
  "close",
  "minimize",
  "maximize",
  "search",
  "invite",
  "manage",
  "security",
  "polls",
  "q&a",
  "whiteboard",
  "breakout rooms",
  "settings",
  "captions",
  "live transcript",
  "report",
  // Meeting app UI
  "zoom",
  "google meet",
  "webex",
  "teams",
  "skype",
  "goto",
  "bluejeans",
  "join",
  "start",
  "stop",
  "pause",
  "resume",
  "share",
  "view",
  "list",
  "grid",
  "speaker",
  "gallery",
  "thumbnail",
  "follow host",
  "exit full screen",
  "full screen",
  "in meeting",
  "out of meeting",
  "admitted",
  "denied",
  // Status words
  "present",
  "absent",
  "online",
  "offline",
  "connecting",
  "disconnected",
  "reconnecting",
  "poor connection",
  "low bandwidth",
  "hand raised",
  // Numbers/generics
  "0",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
]);

const NOISE_PATTERNS = [
  /^\d+$/, // pure numbers
  /^\d{1,2}:\d{2}(:\d{2})?(\s*(am|pm))?$/i, // timestamps
  /^[\d\s\(\)\-\+]+$/, // phone numbers
  /\S+@\S+\.\S+/, // emails
  /^https?:\/\//i, // URLs
  /^\(.+\)$/, // just "(something)"
  /^[^a-zA-Z]+$/, // no letters at all
  /^\s*\d+\s*(participant|people|member)/i, // "12 participants"
  /^(participant|people|member|attendee)s?\s*\(\d+\)/i,
  /^(host|co-?host|presenter|panelist|moderator)\s*$/i,
  /^\p{Emoji}+$/u, // emoji-only
  /^.{1}$/, // single character
  /^.{40,}$/, // too long (UI labels)
];

// Zoom appends "(Host)", "(me)", "(Co-host)" — strip these
function stripZoomSuffixes(name) {
  return name
    .replace(/\s*\(host\)/gi, "")
    .replace(/\s*\(co-?host\)/gi, "")
    .replace(/\s*\(me\)\s*$/gi, "")
    .replace(/\s*\(you\)\s*$/gi, "")
    .replace(/\s*\(guest\)\s*$/gi, "")
    .replace(/\s*\(waiting\)\s*$/gi, "")
    .replace(/\s*\(presenter\)\s*$/gi, "")
    .replace(/\s*\(panelist\)\s*$/gi, "")
    .replace(/\s*\(muted\)\s*$/gi, "")
    .replace(/\s*\(unmuted\)\s*$/gi, "")
    .replace(/\([\d]+\)\s*$/, "") // trailing count like "(5)"
    .trim();
}

function isNoiseLine(raw) {
  const lower = raw.toLowerCase().trim();
  if (!lower || lower.length < 2) return true;
  if (NOISE_EXACT.has(lower)) return true;
  for (const pat of NOISE_PATTERNS) {
    if (pat.test(raw.trim())) return true;
  }
  // Looks like a UI label: all caps, short
  if (/^[A-Z\s]{2,15}$/.test(raw.trim()) && raw.trim().split(" ").length <= 2) {
    const words = raw.trim().toLowerCase().split(/\s+/);
    if (words.every((w) => NOISE_EXACT.has(w))) return true;
  }
  return false;
}

function extractNames(rawText) {
  if (!rawText) return [];

  const lines = rawText
    .split(/\n|\r/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const names = new Set();

  for (const line of lines) {
    // Strip Zoom suffixes first
    const cleaned = stripZoomSuffixes(line);
    if (!cleaned || cleaned.length < 2) continue;
    if (isNoiseLine(cleaned)) continue;

    // A name should:
    // 1. Contain at least one letter
    // 2. Not be longer than ~35 chars
    // 3. Not start with a special char or number
    if (!/[a-zA-Z\u0900-\u097F]/.test(cleaned)) continue; // no letters (incl. Devanagari)
    if (cleaned.length > 36) continue;
    if (/^[\d\W]/.test(cleaned)) continue; // starts with digit/symbol

    // Reject if it's a sentence (contains verb-like structure)
    if (cleaned.split(/\s+/).length > 5) continue;

    // Capitalise for consistency — "RADHIKA SHARMA" → "Radhika Sharma"
    const normalised = cleaned
      .split(/\s+/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");

    names.add(normalised);
  }

  return [...names];
}

// ── Fuzzy matching — handle OCR typos, case, partial names ───────────
function normalize(s) {
  return (s || "").toLowerCase().replace(/[^a-z0-9\u0900-\u097F]/g, "");
}

function matchScore(extracted, enrolled) {
  const a = normalize(extracted);
  const b = normalize(enrolled);
  if (a === b) return 1.0;
  if (b.includes(a) || a.includes(b)) return 0.85;

  // Word-level overlap
  const aw = a.split(/\s+/).filter(Boolean);
  const bw = b.split(/\s+/).filter(Boolean);
  const overlap = aw.filter((w) => bw.includes(w)).length;
  const score = overlap / Math.max(aw.length, bw.length);
  return score;
}

function matchToEnrolled(extractedNames, enrolledDevotees) {
  const THRESHOLD = 0.5;
  const matched = []; // { extracted, enrolled, score }
  const unmatched = []; // { extracted }
  const usedEnrolled = new Set();

  for (const ext of extractedNames) {
    let best = null,
      bestScore = 0;
    for (const dev of enrolledDevotees) {
      if (usedEnrolled.has(dev.name)) continue;
      const score = matchScore(ext, dev.name);
      if (score > bestScore) {
        bestScore = score;
        best = dev;
      }
    }
    if (best && bestScore >= THRESHOLD) {
      matched.push({ extracted: ext, enrolled: best, score: bestScore });
      usedEnrolled.add(best.name);
    } else {
      unmatched.push({ extracted: ext });
    }
  }

  return { matched, unmatched };
}

// ── Styles ────────────────────────────────────────────────────────────
const css = `
/* ── Upload trigger button ── */
.pu-trigger {
  display:flex; align-items:center; gap:6px;
  padding:6px 14px; border-radius:9px;
  border:1.5px solid rgba(2,132,199,0.3);
  background:rgba(2,132,199,0.07); color:#0c4a6e;
  font-family:'DM Sans',sans-serif; font-size:0.75rem; font-weight:700;
  cursor:pointer; transition:all 0.15s; white-space:nowrap;
}
.pu-trigger:hover { background:rgba(2,132,199,0.13); border-color:rgba(2,132,199,0.5); }

/* ── Overlay + Panel ── */
.pu-overlay {
  position:fixed; inset:0; z-index:700;
  background:rgba(5,2,0,0.78); backdrop-filter:blur(7px);
  display:flex; align-items:flex-start; justify-content:center;
  padding:28px 14px; overflow-y:auto;
}
.pu-panel {
  width:100%; max-width:700px; background:#fff;
  border-radius:20px; overflow:hidden;
  box-shadow:0 32px 100px rgba(0,0,0,0.45);
  animation:puSlide 0.28s cubic-bezier(0.22,1,0.36,1) both;
}
@keyframes puSlide { from{transform:translateY(-20px);opacity:0} to{transform:translateY(0);opacity:1} }

.pu-hd {
  padding:20px 24px;
  background:linear-gradient(135deg,#0c2a4a,#0e4d7a);
  display:flex; align-items:center; gap:14px;
}
.pu-hd-ico { font-size:1.6rem; flex-shrink:0; }
.pu-hd-title { font-family:'Cinzel',serif; font-size:1rem; font-weight:700; color:#fff; margin:0 0 3px; }
.pu-hd-sub   { font-size:0.72rem; color:rgba(180,220,255,0.75); margin:0; }
.pu-hd-close {
  margin-left:auto; width:32px; height:32px; border:none; border-radius:8px;
  background:rgba(255,255,255,0.1); color:rgba(255,255,255,0.8);
  cursor:pointer; display:flex; align-items:center; justify-content:center;
  font-size:1rem; transition:all 0.15s; flex-shrink:0;
}
.pu-hd-close:hover { background:rgba(255,255,255,0.2); color:#fff; }

.pu-body { padding:22px 24px; }

/* ── Drop zone ── */
.pu-drop {
  border:2.5px dashed rgba(2,132,199,0.3); border-radius:14px;
  padding:40px 20px; text-align:center;
  background:rgba(2,132,199,0.03); cursor:pointer; transition:all 0.2s;
  position:relative;
}
.pu-drop.drag-over { border-color:#0284c7; background:rgba(2,132,199,0.08); transform:scale(1.01); }
.pu-drop-ico { font-size:2.8rem; margin-bottom:10px; }
.pu-drop-title { font-family:'Cinzel',serif; font-size:0.9rem; font-weight:700; color:#1e3a5f; margin-bottom:5px; }
.pu-drop-sub   { font-size:0.76rem; color:#6b8cae; line-height:1.6; }
.pu-drop-btn {
  margin-top:14px; padding:9px 22px; border-radius:9px; border:none;
  background:linear-gradient(135deg,#0e4d7a,#0284c7); color:#fff;
  font-family:'DM Sans',sans-serif; font-size:0.82rem; font-weight:700;
  cursor:pointer; transition:all 0.15s;
}
.pu-drop-btn:hover { opacity:0.88; }

/* Preview */
.pu-preview { margin-top:16px; border-radius:12px; overflow:hidden; border:1.5px solid rgba(2,132,199,0.2); position:relative; }
.pu-preview img { width:100%; display:block; max-height:260px; object-fit:contain; background:#f0f6ff; }
.pu-preview-clear {
  position:absolute; top:8px; right:8px; width:28px; height:28px;
  border:none; border-radius:7px; background:rgba(0,0,0,0.55); color:#fff;
  cursor:pointer; font-size:0.9rem; display:flex; align-items:center; justify-content:center;
}

/* Processing */
.pu-progress { margin-top:16px; }
.pu-progress-bar { height:6px; background:rgba(2,132,199,0.12); border-radius:3px; overflow:hidden; margin-bottom:6px; }
.pu-progress-fill { height:100%; background:linear-gradient(90deg,#0284c7,#38bdf8); border-radius:3px; transition:width 0.3s ease; }
.pu-progress-lbl { font-size:0.72rem; color:#6b8cae; text-align:center; font-family:'Cinzel',serif; }

/* Results */
.pu-results { margin-top:20px; }
.pu-result-hd { display:flex; align-items:center; justify-content:space-between; margin-bottom:12px; flex-wrap:wrap; gap:8px; }
.pu-result-title { font-family:'Cinzel',serif; font-size:0.72rem; font-weight:700; color:#1e3a5f; letter-spacing:0.12em; text-transform:uppercase; }
.pu-result-badge { font-size:0.66rem; font-weight:700; padding:2px 9px; border-radius:20px; }
.pu-rb-match { background:rgba(22,163,74,0.1); color:#15803d; border:1px solid rgba(22,163,74,0.2); }
.pu-rb-unmatch { background:rgba(220,38,38,0.08); color:#b91c1c; border:1px solid rgba(220,38,38,0.18); }
.pu-rb-absent { background:rgba(107,114,128,0.08); color:#6b7280; border:1px solid rgba(107,114,128,0.18); }

.pu-list { display:flex; flex-direction:column; gap:5px; max-height:220px; overflow-y:auto; margin-bottom:10px; }
.pu-list::-webkit-scrollbar { width:4px; }
.pu-list::-webkit-scrollbar-thumb { background:rgba(2,132,199,0.2); border-radius:2px; }

.pu-item {
  display:flex; align-items:center; gap:10px; padding:8px 12px;
  border-radius:9px; border:1px solid;
}
.pu-item-match   { background:rgba(22,163,74,0.05);  border-color:rgba(22,163,74,0.15); }
.pu-item-unmatch { background:rgba(220,38,38,0.04);  border-color:rgba(220,38,38,0.12); }
.pu-item-absent  { background:rgba(107,114,128,0.04); border-color:rgba(107,114,128,0.12); }
.pu-item-dot { width:7px; height:7px; border-radius:50%; flex-shrink:0; }
.pu-dot-g { background:#16a34a; }
.pu-dot-r { background:#dc2626; }
.pu-dot-gr{ background:#9ca3af; }
.pu-item-name { flex:1; font-size:0.8rem; font-weight:600; color:#1e3a5f; }
.pu-item-enrolled { font-size:0.68rem; color:#6b8cae; }
.pu-item-score { font-size:0.64rem; color:#9ca3af; width:36px; text-align:right; }
.pu-item-add {
  padding:3px 9px; border-radius:7px; border:1.5px solid rgba(200,140,40,0.3);
  background:rgba(200,140,40,0.07); color:#7a3200;
  font-family:'DM Sans',sans-serif; font-size:0.68rem; font-weight:700;
  cursor:pointer; transition:all 0.14s; flex-shrink:0;
}
.pu-item-add:hover { background:rgba(200,140,40,0.14); }

/* Footer actions */
.pu-footer { display:flex; gap:10px; margin-top:20px; padding-top:16px; border-top:1px solid rgba(2,132,199,0.1); }
.pu-btn-apply {
  flex:1; padding:12px; border-radius:10px; border:none;
  background:linear-gradient(135deg,#0e4d7a,#0284c7); color:#fff;
  font-family:'DM Sans',sans-serif; font-size:0.88rem; font-weight:700;
  cursor:pointer; transition:all 0.15s;
  display:flex; align-items:center; justify-content:center; gap:8px;
}
.pu-btn-apply:hover:not(:disabled) { opacity:0.88; transform:translateY(-1px); }
.pu-btn-apply:disabled { opacity:0.5; cursor:not-allowed; }
.pu-btn-cancel {
  padding:12px 20px; border-radius:10px;
  border:1.5px solid rgba(2,132,199,0.2); background:transparent; color:#1e3a5f;
  font-family:'DM Sans',sans-serif; font-size:0.86rem; font-weight:600;
  cursor:pointer; transition:all 0.14s;
}
.pu-btn-cancel:hover { background:rgba(2,132,199,0.06); }

/* Tip box */
.pu-tip {
  padding:10px 14px; border-radius:10px;
  background:rgba(2,132,199,0.06); border:1px solid rgba(2,132,199,0.18);
  margin-bottom:16px;
}
.pu-tip-title { font-size:0.68rem; font-weight:700; color:#0c4a6e; margin-bottom:4px; }
.pu-tip-text  { font-size:0.7rem;  color:#1e3a5f; line-height:1.6; }

/* Spin */
.pu-spin { width:14px; height:14px; border-radius:50%; border:2px solid rgba(255,255,255,0.3); border-top-color:#fff; animation:puSpin 0.7s linear infinite; flex-shrink:0; }
@keyframes puSpin { to{transform:rotate(360deg)} }

@media(max-width:600px){
  .pu-overlay  { padding:12px 8px; }
  .pu-panel    { border-radius:14px; }
  .pu-body     { padding:16px; }
  .pu-footer   { flex-direction:column; }
}
`;

// ── Tesseract loader ─────────────────────────────────────────────────
let tesseractReady = false;
let tesseractLoading = false;
const tesseractCallbacks = [];

function loadTesseract() {
  return new Promise((resolve, reject) => {
    if (tesseractReady && window.Tesseract) {
      resolve(window.Tesseract);
      return;
    }
    tesseractCallbacks.push({ resolve, reject });
    if (tesseractLoading) return;
    tesseractLoading = true;
    const script = document.createElement("script");
    script.src =
      "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js";
    script.onload = () => {
      tesseractReady = true;
      tesseractLoading = false;
      tesseractCallbacks.forEach((cb) => cb.resolve(window.Tesseract));
      tesseractCallbacks.length = 0;
    };
    script.onerror = () => {
      tesseractLoading = false;
      tesseractCallbacks.forEach((cb) =>
        cb.reject(new Error("Failed to load OCR library."))
      );
      tesseractCallbacks.length = 0;
    };
    document.head.appendChild(script);
  });
}

// ── Main component ───────────────────────────────────────────────────
export default function ParticipantUpload({
  devotees = [],
  marks = {},
  onApply,
  onAddDevotee,
}) {
  const [open, setOpen] = useState(false);
  const [imgSrc, setImgSrc] = useState(null);
  const [imgFile, setImgFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState(""); // "loading"|"done"|"error"|""
  const [results, setResults] = useState(null); // { matched, unmatched, absentees }
  const fileRef = useRef(null);

  const reset = () => {
    setImgSrc(null);
    setImgFile(null);
    setProgress(0);
    setStatus("");
    setResults(null);
  };

  const close = () => {
    reset();
    setOpen(false);
  };

  const processFile = useCallback(
    async (file) => {
      if (!file || !file.type.startsWith("image/")) {
        toast.error("Please upload an image file (PNG, JPG, etc.)");
        return;
      }
      const url = URL.createObjectURL(file);
      setImgSrc(url);
      setImgFile(file);
      setResults(null);
      setProgress(0);
      setStatus("loading");

      try {
        const Tesseract = await loadTesseract();
        const worker = await Tesseract.createWorker("eng", 1, {
          logger: (m) => {
            if (m.status === "recognizing text") {
              setProgress(Math.round((m.progress || 0) * 100));
            }
          },
        });

        // Higher PSM for list-style text (participants panel is a vertical list)
        await worker.setParameters({ tessedit_pageseg_mode: "6" });

        const { data } = await worker.recognize(file);
        await worker.terminate();

        const rawText = data.text || "";
        const extracted = extractNames(rawText);

        if (!extracted.length) {
          toast.error(
            "No names could be extracted. Try a clearer screenshot or better lighting."
          );
          setStatus("error");
          return;
        }

        const { matched, unmatched } = matchToEnrolled(extracted, devotees);

        // Enrolled devotees NOT found in screenshot → mark absent
        const matchedEnrolledNames = new Set(
          matched.map((m) => m.enrolled.name)
        );
        const absentees = devotees
          .filter((d) => !matchedEnrolledNames.has(d.name))
          .map((d) => ({ enrolled: d }));

        setResults({ matched, unmatched, absentees });
        setStatus("done");
        setProgress(100);
      } catch (err) {
        console.error("OCR error:", err);
        toast.error("OCR failed. Try a higher resolution screenshot.");
        setStatus("error");
      }
    },
    [devotees]
  );

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = "";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleApply = () => {
    if (!results) return;
    const newMarks = { ...marks };
    // Mark matched as present
    results.matched.forEach((m) => {
      newMarks[m.enrolled.name] = "present";
    });
    // Mark absentees as absent
    results.absentees.forEach((a) => {
      newMarks[a.enrolled.name] = "absent";
    });
    onApply(newMarks);
    toast.success(
      `Applied: ${results.matched.length} present, ${results.absentees.length} absent`
    );
    close();
  };

  return (
    <>
      <style>{css}</style>

      {/* Trigger button — inline in attendance page */}
      <button className="pu-trigger" onClick={() => setOpen(true)}>
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
            d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
          />
        </svg>
        Screenshot
      </button>

      {/* Main panel */}
      {open && (
        <div
          className="pu-overlay"
          onClick={(e) => e.target === e.currentTarget && close()}
        >
          <div className="pu-panel">
            {/* Header */}
            <div className="pu-hd">
              <span className="pu-hd-ico">📷</span>
              <div>
                <p className="pu-hd-title">
                  Import Participants via Screenshot
                </p>
                <p className="pu-hd-sub">
                  Upload your Zoom / Google Meet participants panel screenshot
                </p>
              </div>
              <button className="pu-hd-close" onClick={close}>
                ✕
              </button>
            </div>

            <div className="pu-body">
              {/* Tip */}
              {!imgSrc && (
                <div className="pu-tip">
                  <div className="pu-tip-title">📌 For best results</div>
                  <div className="pu-tip-text">
                    In <strong>Zoom</strong>: Open Participants panel → take a
                    screenshot of the full list.
                    <br />
                    In <strong>Meet</strong>: Click People → screenshot the full
                    list.
                    <br />
                    Names should be clearly visible. Avoid dark mode or very
                    small text.
                  </div>
                </div>
              )}

              {/* Drop zone */}
              {!imgSrc && (
                <div
                  className={`pu-drop${dragOver ? " drag-over" : ""}`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileRef.current?.click()}
                >
                  <div className="pu-drop-ico">🖼️</div>
                  <div className="pu-drop-title">Drop screenshot here</div>
                  <div className="pu-drop-sub">
                    PNG, JPG, WEBP accepted · Max 10 MB
                    <br />
                    Zoom or Meet participants panel screenshot
                  </div>
                  <button
                    className="pu-drop-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileRef.current?.click();
                    }}
                  >
                    Choose Image
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={handleFileChange}
                  />
                </div>
              )}

              {/* Preview */}
              {imgSrc && (
                <div className="pu-preview">
                  <img src={imgSrc} alt="Participant screenshot" />
                  {status !== "loading" && (
                    <button className="pu-preview-clear" onClick={reset}>
                      ✕
                    </button>
                  )}
                </div>
              )}

              {/* Progress */}
              {status === "loading" && (
                <div className="pu-progress">
                  <div className="pu-progress-bar">
                    <div
                      className="pu-progress-fill"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="pu-progress-lbl">
                    {progress < 20
                      ? "Loading OCR engine…"
                      : progress < 80
                      ? `Reading text… ${progress}%`
                      : "Extracting names…"}
                  </div>
                </div>
              )}

              {/* Results */}
              {status === "done" && results && (
                <div className="pu-results">
                  {/* Matched (will be marked present) */}
                  <div className="pu-result-hd">
                    <span className="pu-result-title">
                      ✅ Matched — Will Mark Present
                    </span>
                    <span className="pu-result-badge pu-rb-match">
                      {results.matched.length} matched
                    </span>
                  </div>
                  {results.matched.length === 0 ? (
                    <p
                      style={{
                        fontSize: "0.74rem",
                        color: "#6b8cae",
                        marginBottom: 12,
                      }}
                    >
                      No enrolled devotees were found in the screenshot.
                    </p>
                  ) : (
                    <div className="pu-list">
                      {results.matched.map((m, i) => (
                        <div key={i} className="pu-item pu-item-match">
                          <span className="pu-item-dot pu-dot-g" />
                          <span className="pu-item-name">
                            {m.enrolled.name}
                          </span>
                          {m.enrolled.name !== m.extracted && (
                            <span className="pu-item-enrolled">
                              OCR: "{m.extracted}"
                            </span>
                          )}
                          <span className="pu-item-score">
                            {Math.round(m.score * 100)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Not in enrolled — new names from screenshot */}
                  {results.unmatched.length > 0 && (
                    <>
                      <div className="pu-result-hd" style={{ marginTop: 14 }}>
                        <span className="pu-result-title">
                          👤 In Screenshot — Not Enrolled
                        </span>
                        <span className="pu-result-badge pu-rb-unmatch">
                          {results.unmatched.length} new
                        </span>
                      </div>
                      <div className="pu-list">
                        {results.unmatched.map((u, i) => (
                          <div key={i} className="pu-item pu-item-unmatch">
                            <span className="pu-item-dot pu-dot-r" />
                            <span className="pu-item-name">{u.extracted}</span>
                            <span
                              className="pu-item-enrolled"
                              style={{ color: "#b91c1c" }}
                            >
                              Not enrolled
                            </span>
                            {onAddDevotee && (
                              <button
                                className="pu-item-add"
                                onClick={() => {
                                  close();
                                  onAddDevotee(u.extracted);
                                }}
                              >
                                + Add
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                      <p
                        style={{
                          fontSize: "0.68rem",
                          color: "#6b8cae",
                          marginTop: 4,
                        }}
                      >
                        These names appeared in the screenshot but aren't
                        enrolled in this program. Click <strong>+ Add</strong>{" "}
                        to enrol them as a new devotee.
                      </p>
                    </>
                  )}

                  {/* Enrolled but NOT in screenshot → absent */}
                  {results.absentees.length > 0 && (
                    <>
                      <div className="pu-result-hd" style={{ marginTop: 14 }}>
                        <span className="pu-result-title">
                          ❌ Enrolled — Not in Screenshot
                        </span>
                        <span className="pu-result-badge pu-rb-absent">
                          {results.absentees.length} absent
                        </span>
                      </div>
                      <div className="pu-list">
                        {results.absentees.map((a, i) => (
                          <div key={i} className="pu-item pu-item-absent">
                            <span className="pu-item-dot pu-dot-gr" />
                            <span className="pu-item-name">
                              {a.enrolled.name}
                            </span>
                            <span
                              className="pu-item-enrolled"
                              style={{ color: "#9ca3af" }}
                            >
                              Will mark absent
                            </span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {/* Summary bar */}
                  <div
                    style={{
                      marginTop: 16,
                      padding: "10px 14px",
                      borderRadius: 10,
                      background: "rgba(2,132,199,0.06)",
                      border: "1px solid rgba(2,132,199,0.15)",
                      display: "flex",
                      gap: 20,
                      flexWrap: "wrap",
                    }}
                  >
                    {[
                      { l: "Present", v: results.matched.length, c: "#15803d" },
                      {
                        l: "Absent",
                        v: results.absentees.length,
                        c: "#b91c1c",
                      },
                      {
                        l: "Not enrolled",
                        v: results.unmatched.length,
                        c: "#6b7280",
                      },
                    ].map((s) => (
                      <div key={s.l} style={{ textAlign: "center" }}>
                        <div
                          style={{
                            fontFamily: "'Cinzel',serif",
                            fontWeight: 700,
                            fontSize: "1.2rem",
                            color: s.c,
                          }}
                        >
                          {s.v}
                        </div>
                        <div
                          style={{
                            fontSize: "0.66rem",
                            color: "#6b8cae",
                            textTransform: "uppercase",
                            letterSpacing: "0.06em",
                          }}
                        >
                          {s.l}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {status === "error" && (
                <div
                  style={{
                    marginTop: 14,
                    textAlign: "center",
                    padding: "20px 0",
                    color: "#b91c1c",
                    fontSize: "0.8rem",
                  }}
                >
                  OCR failed. Try a higher resolution or better lit screenshot.
                  <br />
                  <button
                    style={{
                      marginTop: 10,
                      padding: "7px 18px",
                      borderRadius: 8,
                      border: "1.5px solid rgba(220,38,38,0.3)",
                      background: "rgba(220,38,38,0.06)",
                      color: "#b91c1c",
                      cursor: "pointer",
                      fontFamily: "'DM Sans',sans-serif",
                      fontWeight: 700,
                    }}
                    onClick={reset}
                  >
                    Try Again
                  </button>
                </div>
              )}

              {/* Footer */}
              {status === "done" && results && (
                <div className="pu-footer">
                  <button className="pu-btn-cancel" onClick={close}>
                    Cancel
                  </button>
                  <button
                    className="pu-btn-apply"
                    onClick={handleApply}
                    disabled={
                      results.matched.length === 0 &&
                      results.absentees.length === 0
                    }
                  >
                    Apply Attendance ({results.matched.length} present ·{" "}
                    {results.absentees.length} absent)
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
