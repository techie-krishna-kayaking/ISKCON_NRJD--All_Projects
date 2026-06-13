import { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import toast from "react-hot-toast";
import chatbotAvatar from "../assets/chatbot.png";

// ════════════════════════════════════════════════════════════════
// SPIRITUAL CHATBOT — Aaradhana Member Portal
// Two flows:
//   1. General Queries — rule-based, category tree, keyword match
//   2. Message to Admin — form → POST /messages
// ════════════════════════════════════════════════════════════════

// ── KNOWLEDGE BASE ───────────────────────────────────────────────
const KB = {
  // ── ATTENDANCE ──────────────────────────────────────────────
  "how to mark attendance": {
    answer: `To mark attendance for a session:\n\n1. Go to **Your Programs** from the sidebar\n2. Click **Mark Attendance** on any program card\n3. The attendance page opens — all devotees are pre-marked **Present** by default\n4. Toggle any devotee to **Absent** by clicking their name\n5. Fill in the **Host Name**, **Date**, and **BV Chapter** (if applicable)\n6. Click **Submit Attendance**\n\n✦ Attendance is permanent once submitted — plan carefully!`,
    tags: [
      "mark attendance",
      "how attendance",
      "submit attendance",
      "fill attendance",
    ],
  },
  "screenshot attendance": {
    answer: `For **online programs** (Zoom / Google Meet), you can import attendance via screenshot:\n\n1. In the attendance page, look for the **📷 Screenshot** button (only visible for virtual programs)\n2. Click it and upload your Zoom or Meet participants panel screenshot\n3. The system reads names using OCR and matches them to enrolled devotees\n4. Review the matches — **green = matched**, **red = not enrolled**\n5. Click **Apply Attendance** to auto-fill marks\n\n✦ You can still manually adjust after applying!`,
    tags: [
      "screenshot",
      "zoom",
      "meet",
      "online attendance",
      "virtual",
      "photo",
      "image upload",
    ],
  },
  "edit attendance": {
    answer: `Attendance records **cannot be edited** after submission — this maintains data integrity.\n\nIf you made a mistake, you can:\n- Submit a **corrected session** for the same date (the latest record is used)\n- Contact your **Admin** to manually correct records if needed\n\n✦ Always review before clicking Submit!`,
    tags: [
      "edit attendance",
      "change attendance",
      "wrong attendance",
      "mistake attendance",
      "undo",
    ],
  },
  "attendance percentage": {
    answer: `**Attendance %** is calculated as:\n\n> (Sessions attended / Total sessions) × 100\n\nStatus thresholds:\n- 🟢 **Active** — ≥ 80%\n- 🟡 **Moderate** — 40–79%\n- 🔴 **Inactive** — below 40%\n\nThe % updates automatically every time you submit attendance. You can view per-devotee % in your Analytics page.`,
    tags: [
      "attendance percentage",
      "attendance rate",
      "what is percentage",
      "calculate attendance",
    ],
  },
  "attendance not submitting": {
    answer: `If attendance won't submit, check these:\n\n1. **Host Name** is required — cannot be blank\n2. **Date** must be selected\n3. For **BV programs** — Chapter field is required\n4. Must have at least one devotee enrolled\n5. Check your internet connection\n\nIf the issue persists, try refreshing the page and re-entering. If still failing, please **message the admin**.`,
    tags: [
      "attendance not working",
      "cannot submit",
      "submission error",
      "submit failing",
      "button not working",
    ],
  },

  // ── PROGRAMS ─────────────────────────────────────────────────
  "what is bv program": {
    answer: `**BV (Bhakti Vriksha)** is a specific program type in Aaradhana where:\n\n- Attendance requires a **Chapter** field (the chapter number being studied)\n- Used for systematic study groups\n- Has its own analytics tracking\n\nWhen creating or marking attendance for a BV program, always fill the Chapter field.`,
    tags: ["bv", "bhakti vriksha", "bhaktivriksha", "bv program", "chapter"],
  },
  "program types": {
    answer: `The system supports these program types:\n\n- **BV** — Bhakti Vriksha (chapter required in attendance)\n- **Gita Manjari** — Gita study groups\n- **Book Reading** — Book study sessions\n- **Tulasi Manjari** — Tulasi program\n- **Children Program** — Programs for children\n- **Gita Learning Program** — Gita classes\n- **Other** — General programs\n\nProgram type affects which analytics are shown and whether devotees can be added during attendance.`,
    tags: [
      "program type",
      "types of programs",
      "what programs",
      "program categories",
    ],
  },
  "program key prefix": {
    answer: `**Program Key Prefix** is a short code (1–5 letters) assigned to each owner.\n\nIt's used to generate unique program keys like **ABC-001**, **ABC-002** etc.\n\nYour prefix is set by the admin when your account is created. You can see it in your **Profile** page.\n\nContact your admin if you need it changed.`,
    tags: ["program key", "prefix", "program code", "what is prefix"],
  },
  "add devotee": {
    answer: `Devotees can be added:\n\n**Method 1 — During Attendance:**\nFor certain program types (BV, Book Reading, etc.), an **+ Add Devotee** button appears in the attendance page. Click it and fill the form.\n\n**Method 2 — Via Screenshot (Online programs):**\nUpload a participant screenshot → unmatched names show a **+ Add** button.\n\n✦ Once added, a devotee is enrolled in that program permanently and will appear in all future attendance sessions.`,
    tags: ["add devotee", "new devotee", "enrol devotee", "add participant"],
  },
  "devotee not showing": {
    answer: `If a devotee isn't showing in the attendance list:\n\n1. They may not be **enrolled in this specific program**\n2. Check if you're on the correct program's attendance page\n3. Use the **Search** bar in the attendance page to search by name\n4. If they should be enrolled but aren't visible, try **Add Devotee** button or contact admin\n\n✦ Each devotee is linked to one program. The same person in two programs = two separate devotee records.`,
    tags: [
      "devotee missing",
      "not showing",
      "devotee not found",
      "where is devotee",
    ],
  },

  // ── ANALYTICS ────────────────────────────────────────────────
  "view analytics": {
    answer: `To view your analytics:\n\n1. Click **Analytics** in the sidebar\n2. Your full analytics dashboard opens with:\n   - Overall attendance % across all programs\n   - Program-wise breakdown\n   - Devotee health (Active / Moderate / Inactive)\n   - Monthly trends\n   - Attendance heatmap (last 90 days)\n\nUse the **filters** at the top to drill into specific programs, areas, languages, or date ranges.`,
    tags: [
      "analytics",
      "view analytics",
      "see analytics",
      "dashboard analytics",
      "reports",
    ],
  },
  "program health": {
    answer: `**Program Health** labels:\n\n- 🟢 **Healthy** — Recent attendance, good rates, devotees active\n- 🟡 **Watch** — Slightly overdue or attendance declining\n- 🟠 **Risk** — Significantly overdue or low attendance\n- 🔴 **Critical** — No attendance history or program disabled\n\nClick any program in the health grid to open the **drilldown panel** with full details.`,
    tags: [
      "program health",
      "healthy program",
      "risk",
      "critical",
      "watch program",
    ],
  },
  "monthly trend": {
    answer: `The **Monthly Trend** chart shows attendance % for each month over the past 12 months.\n\n- Green bars = healthy month (≥80%)\n- Yellow bars = moderate month (40–79%)\n- Red bars = low month (<40%)\n\nIf you see fewer than 2 months, it means not enough attendance has been submitted yet. Keep marking sessions monthly to build the trend.`,
    tags: ["monthly trend", "monthly chart", "trend graph", "months"],
  },
  heatmap: {
    answer: `The **Attendance Heatmap** shows the last 90 days as a GitHub-style calendar grid.\n\n- Darker green = high attendance session that day\n- Blue = moderate attendance\n- Red = low attendance that day\n- Empty = no session that day\n- 🟡 Ring = today\n\nHover over any day to see session details. Click a day to see the full breakdown.`,
    tags: ["heatmap", "calendar", "90 days", "daily attendance"],
  },

  // ── ACCOUNT ──────────────────────────────────────────────────
  "change password": {
    answer: `To change your password:\n\n1. Click your **profile avatar** (top-right corner)\n2. Select **Change Password**\n3. Enter your **current password** then your new password\n4. Click **Update Password**\n\n✦ Your new password takes effect immediately — no need to log out.\n\nIf you were given a **temporary password** by admin, you'll be taken to this page automatically on first login.`,
    tags: [
      "change password",
      "update password",
      "new password",
      "reset password",
      "password",
    ],
  },
  "forgot password": {
    answer: `If you've forgotten your password:\n\n1. Go to the **Login page**\n2. Click **Forgot Password?**\n3. Enter your registered email address\n4. Check your inbox for a reset link (valid for 15 minutes)\n5. Click the link and set a new password\n\n✦ Only for email/password accounts. Google Sign-In users should reset via Google.`,
    tags: [
      "forgot password",
      "lost password",
      "cant login",
      "cannot log in",
      "reset",
    ],
  },
  "google login": {
    answer: `If you signed up with **Google Sign-In**:\n\n- You don't have a password in our system\n- Always use the **Continue with Google** button to log in\n- Password change is not applicable — manage password at **myaccount.google.com**\n- If your Google account is locked, contact your admin to add email/password login`,
    tags: ["google", "google login", "google signin", "oauth", "sso"],
  },
  "account deactivated": {
    answer: `If your account has been deactivated:\n\n- You'll see a message "Account deactivated" on login\n- Deactivation is done by an admin and reviewed by the SuperAdmin\n- Contact your **admin** to request reactivation\n- If it was done in error, it can be reversed\n\n✦ Your data is preserved — reactivation restores full access.`,
    tags: [
      "account deactivated",
      "deactivated",
      "account disabled",
      "blocked",
      "suspended",
    ],
  },

  // ── TECHNICAL ────────────────────────────────────────────────
  "page not loading": {
    answer: `If a page won't load or shows an error:\n\n1. **Hard refresh** — Press Ctrl+Shift+R (or Cmd+Shift+R on Mac)\n2. **Clear cache** — Chrome Settings → Clear browsing data\n3. **Check internet** — Try opening another website\n4. **Try another browser** — Chrome or Edge recommended\n5. **Log out and back in** — Sometimes the session token expires\n\nIf the issue persists for more than a day, message the admin with a screenshot.`,
    tags: [
      "not loading",
      "page error",
      "blank page",
      "white screen",
      "loading forever",
      "stuck",
    ],
  },
  "data not updating": {
    answer: `If your attendance or analytics aren't reflecting recent submissions:\n\n1. Wait 1–2 minutes and **refresh the page**\n2. The heatmap and analytics update after each submission\n3. If still wrong after 5 minutes, **log out and log back in**\n4. Check if the submission actually succeeded (you'd have seen a success notification)\n\n✦ Analytics are computed in real-time — no delays beyond a page refresh.`,
    tags: [
      "data not updating",
      "attendance not showing",
      "analytics wrong",
      "not reflecting",
    ],
  },
  "session expired": {
    answer: `Your session expires after a period of inactivity for security.\n\nIf you see "Session expired" or get redirected to login:\n\n1. Simply **log in again** — your data is all saved\n2. Sessions last several days of active use\n3. Closing the browser doesn't usually expire the session\n\n✦ All attendance you submitted before the session expired is safely stored.`,
    tags: [
      "session expired",
      "logged out",
      "kicked out",
      "unauthorized",
      "401",
    ],
  },

  // ── ABOUT PLATFORM ───────────────────────────────────────────
  "about platform": {
    answer: `**Aaradhana Member Portal** is a spiritual program management system designed for:\n\n- 🪷 Managing spiritual programs (BV, Gita, etc.)\n- 📋 Tracking devotee attendance\n- 📊 Analytics and health monitoring\n- 🔔 Admin oversight and communications\n\nBuilt with love for the devotee community. Every feature is designed to make the seva of tracking easier. 🙏`,
    tags: ["about", "what is this", "what is aaradhana", "platform", "system"],
  },
  "contact admin": {
    answer: `To reach your admin:\n\n1. Use the **💬 Message Admin** option in this chatbot\n2. Fill your query and send — admin will respond within the portal\n3. Your admin's replies appear in your message history\n\nFor urgent issues, contact your admin directly outside the portal.`,
    tags: [
      "contact admin",
      "reach admin",
      "talk to admin",
      "message admin",
      "admin contact",
    ],
  },

  // ── DEVOTEE SEARCH ────────────────────────────────────────────
  "search devotee": {
    answer: `To search for a specific devotee:\n\n**From Analytics page:**\n1. Go to **Analytics** in the sidebar\n2. Scroll to the **Devotee Search** section at the bottom\n3. Type the devotee's name — suggestions appear as you type\n4. Click a suggestion to see their full attendance profile:\n   - Overall attendance %\n   - Monthly pattern bars\n   - Last 10 sessions (present/absent)\n   - Current streak\n\n✦ Search is scoped to your programs only.`,
    tags: [
      "search devotee",
      "find devotee",
      "look up devotee",
      "devotee profile",
      "devotee search",
    ],
  },
  "devotee attendance history": {
    answer: `To see a specific devotee's full history:\n\n1. Go to **Analytics** → **Devotee Search**\n2. Type their name and select\n3. You'll see:\n   - Total present / absent / total sessions\n   - Month-by-month attendance bars\n   - Status badge: Active 🟢 / Moderate 🟡 / Irregular 🔴\n   - Attendance streak (consecutive present)\n   - Last 10 sessions with dates\n\n✦ Use this to identify devotees who need follow-up.`,
    tags: [
      "devotee history",
      "attendance history",
      "devotee detail",
      "individual attendance",
    ],
  },

  // ── ONLINE / VIRTUAL ──────────────────────────────────────────
  "virtual program": {
    answer: `**Virtual/Online programs** in Aaradhana have special features:\n\n- When creating a program, check the **Virtual** option\n- In the attendance page, the **📷 Screenshot** button appears\n- Upload your Zoom/Meet participants panel screenshot to auto-fill attendance\n- System OCR reads participant names and matches to enrolled devotees\n\n✦ This saves manual marking for large online groups!\n\nFor offline programs the screenshot button is hidden — only shown when program is marked virtual.`,
    tags: [
      "virtual",
      "online program",
      "zoom",
      "meet",
      "online",
      "virtual program",
      "isVirtual",
    ],
  },
  "zoom participant list": {
    answer: `For **Zoom** screenshots:\n\n1. During the meeting, click **Participants** button (People icon)\n2. Wait for all participants to join\n3. Take a **screenshot of the full participants panel** (scroll down if needed for large groups)\n4. Upload in the chatbot's screenshot feature\n\n**Tips:**\n- Use light mode in Zoom for better OCR accuracy\n- Make sure names are fully visible, not cut off\n- If the panel shows "(Host)", "(me)" — the system removes those automatically\n\n✦ For Meet: click the People icon → screenshot the full list.`,
    tags: [
      "zoom screenshot",
      "zoom participants",
      "participant screenshot",
      "meet screenshot",
      "how to screenshot",
    ],
  },

  // ── PROGRAM MANAGEMENT ────────────────────────────────────────
  "inactive program": {
    answer: `**Inactive programs** are programs disabled by admin (actFlag = inactive).\n\n- They appear greyed out in your program list\n- Attendance cannot be submitted for inactive programs\n- They still show in analytics with a "Disabled" badge\n- Devotee data and history is preserved\n\nIf your program was incorrectly deactivated, contact your admin to reactivate it.`,
    tags: [
      "inactive",
      "disabled program",
      "program inactive",
      "deactivated program",
      "cannot mark attendance",
    ],
  },
  "program schedule day": {
    answer: `Each program is assigned a **Day** when it was created (Monday, Tuesday, etc.).\n\nThis is used for:\n- **Weekly Schedule** chart in your analytics\n- **Today's Programs** bar — shows only programs scheduled for today\n- Health monitoring — programs overdue based on their scheduled frequency\n\nFor **Daily programs** — they appear every day in the Today bar.\n\nIf the day is wrong, contact your admin to update it.`,
    tags: [
      "program day",
      "schedule",
      "weekly schedule",
      "which day",
      "program time",
      "today programs",
    ],
  },
  "multiple programs": {
    answer: `You can own multiple programs — there is no limit.\n\nEach program:\n- Has its own devotee list\n- Has its own attendance history\n- Shows separately in analytics\n- Can be filtered individually using the **Programs** filter at the top of analytics\n\n✦ Use the **Program filter** in analytics to view one program at a time.\n✦ The **Program Trend Selector** in analytics shows per-program session trend.`,
    tags: [
      "multiple programs",
      "more than one program",
      "many programs",
      "all programs",
      "how many programs",
    ],
  },
  "sub area": {
    answer: `**Sub Area** is a subdivision within an **Area** — useful for large areas with multiple zones.\n\nFor example:\n- Area: North Bangalore\n- Sub Area: Hebbal, Yelahanka, Kodigehalli\n\nSub Area is shown in program details and used in analytics filtering.\nIf your sub area is wrong, contact your admin.`,
    tags: [
      "sub area",
      "subarea",
      "area",
      "zone",
      "locality",
      "what is sub area",
    ],
  },

  // ── ATTENDANCE ADVANCED ───────────────────────────────────────
  "bulk attendance": {
    answer: `For quick bulk marking:\n\n1. All devotees are **pre-marked as Present** when the attendance page opens\n2. Use the **Mark All Absent** / **Mark All Present** buttons to toggle everyone\n3. Then individually toggle the exceptions\n\nThis is the fastest workflow:\n- If most attended → start all Present, toggle the absentees\n- If most absent → click Mark All Absent, toggle the ones who came\n\n✦ For online programs, use the **📷 Screenshot** upload to auto-fill.`,
    tags: [
      "bulk attendance",
      "mark all",
      "all present",
      "all absent",
      "quick attendance",
      "fast attendance",
    ],
  },
  "attendance streak": {
    answer: `An **Attendance Streak** counts how many consecutive sessions a devotee was present.\n\nFor example:\n- Present in last 5 sessions = 🔥 5 streak\n- One absence resets the streak to 0\n\nYou can see streaks in the **Devotee Search** section of Analytics.\n\n✦ Streaks are a great motivator — devotees with long streaks are your most committed members!`,
    tags: [
      "streak",
      "attendance streak",
      "consecutive",
      "regular attendance",
      "streak count",
    ],
  },
  "download report": {
    answer: `Currently the portal does not support direct report downloads.\n\nTo export data:\n1. Use your browser's **Print** function (Ctrl+P) → Save as PDF\n2. For the analytics dashboard, take a screenshot\n3. For devotee data, contact your admin — they may have export capabilities\n\nReport export is planned for a future update. You can request this feature via **Message Admin**.`,
    tags: ["download", "export", "report", "pdf", "excel", "csv", "print"],
  },
  "reminder notification": {
    answer: `The system sends **automated reminders** to owners when:\n- A program's attendance is overdue based on its frequency\n- Example: Weekly program not marked for 14+ days → reminder sent\n\nAs an owner you don't configure reminders — the admin/system manages this.\n\nIf you're not receiving reminders:\n- Check your registered email inbox (and spam folder)\n- Contact admin to verify your email is correct\n- Ensure your program frequency is set correctly`,
    tags: [
      "reminder",
      "notification",
      "email reminder",
      "attendance reminder",
      "not getting reminder",
    ],
  },
  "whatsapp contact": {
    answer: `The portal supports **WhatsApp quick-link** for devotees who have a phone number saved.\n\nIn the attendance page:\n- Devotees with a phone number show a **WhatsApp icon** next to their name\n- Clicking opens a WhatsApp chat to that number directly\n- Useful for following up with absent devotees\n\nIf a devotee's WhatsApp icon is missing, they don't have a phone number saved in their profile. Contact admin to update devotee details.`,
    tags: [
      "whatsapp",
      "contact devotee",
      "phone",
      "message devotee",
      "call devotee",
    ],
  },
  "language program": {
    answer: `Each program is assigned a **Language** (e.g. Kannada, English, Hindi, Tamil).\n\nLanguage is used in:\n- **Analytics** — Language Distribution donut chart\n- **Attendance by Language** bar chart\n- **Filters** — filter analytics to see only English/Hindi programs\n- **Devotee search** — language shown in devotee profile\n\nIf your program language is wrong, contact admin to correct it.\n\n✦ Language analytics help identify which language groups have higher/lower attendance.`,
    tags: [
      "language",
      "program language",
      "kannada",
      "english",
      "hindi",
      "tamil",
      "language filter",
    ],
  },
};

// ── CATEGORIES for the menu ──────────────────────────────────────
const CATEGORIES = [
  {
    id: "attendance",
    emoji: "📋",
    label: "Attendance",
    color: "#16a34a",
    bg: "rgba(22,163,74,0.08)",
    border: "rgba(22,163,74,0.2)",
    questions: [
      "how to mark attendance",
      "screenshot attendance",
      "bulk attendance",
      "edit attendance",
      "attendance percentage",
      "attendance not submitting",
    ],
  },
  {
    id: "programs",
    emoji: "🪷",
    label: "Programs",
    color: "#c8903c",
    bg: "rgba(200,140,40,0.08)",
    border: "rgba(200,140,40,0.2)",
    questions: [
      "what is bv program",
      "program types",
      "virtual program",
      "zoom participant list",
      "program key prefix",
      "multiple programs",
      "inactive program",
      "program schedule day",
      "sub area",
      "language program",
    ],
  },
  {
    id: "devotees",
    emoji: "👥",
    label: "Devotees",
    color: "#7c3aed",
    bg: "rgba(124,58,237,0.07)",
    border: "rgba(124,58,237,0.2)",
    questions: [
      "add devotee",
      "devotee not showing",
      "search devotee",
      "devotee attendance history",
      "attendance streak",
      "whatsapp contact",
    ],
  },
  {
    id: "analytics",
    emoji: "📊",
    label: "Analytics",
    color: "#0284c7",
    bg: "rgba(2,132,199,0.07)",
    border: "rgba(2,132,199,0.2)",
    questions: [
      "view analytics",
      "program health",
      "monthly trend",
      "heatmap",
      "download report",
    ],
  },
  {
    id: "account",
    emoji: "🔑",
    label: "Account",
    color: "#7c3aed",
    bg: "rgba(124,58,237,0.07)",
    border: "rgba(124,58,237,0.2)",
    questions: [
      "change password",
      "forgot password",
      "google login",
      "account deactivated",
      "reminder notification",
    ],
  },
  {
    id: "technical",
    emoji: "⚙️",
    label: "Technical",
    color: "#dc2626",
    bg: "rgba(220,38,38,0.06)",
    border: "rgba(220,38,38,0.2)",
    questions: ["page not loading", "data not updating", "session expired"],
  },
  {
    id: "about",
    emoji: "ℹ️",
    label: "About",
    color: "#0891b2",
    bg: "rgba(8,145,178,0.07)",
    border: "rgba(8,145,178,0.2)",
    questions: ["about platform", "contact admin"],
  },
];

// ── Keyword search across KB ──────────────────────────────────────
function searchKB(query) {
  if (!query?.trim()) return null;
  const q = query.toLowerCase().trim();
  // Direct key match
  if (KB[q]) return KB[q];
  // Tag match
  for (const [, entry] of Object.entries(KB)) {
    if (entry.tags.some((t) => q.includes(t) || t.includes(q))) return entry;
  }
  // Partial word match
  for (const [, entry] of Object.entries(KB)) {
    if (
      entry.tags.some((t) =>
        t.split(" ").some((w) => w.length > 3 && q.includes(w))
      )
    )
      return entry;
  }
  return null;
}

// ── Format markdown-ish answer ────────────────────────────────────
function FormatAnswer({ text }) {
  const parts = text.split("\n").map((line, i) => {
    if (!line.trim()) return <br key={i} />;
    // Bold
    const rendered = line.split(/(\*\*[^*]+\*\*)/).map((chunk, j) => {
      if (chunk.startsWith("**") && chunk.endsWith("**")) {
        return (
          <strong key={j} style={{ color: "#2d1200", fontWeight: 700 }}>
            {chunk.slice(2, -2)}
          </strong>
        );
      }
      return chunk;
    });
    // Numbered list
    if (/^\d+\./.test(line.trim())) {
      return (
        <div key={i} style={{ display: "flex", gap: 8, marginBottom: 3 }}>
          <span
            style={{
              color: "#c8903c",
              fontWeight: 700,
              flexShrink: 0,
              width: 16,
            }}
          >
            {line.match(/^\d+/)[0]}.
          </span>
          <span>
            {rendered.map((r, j) =>
              typeof r === "string" ? r.replace(/^\d+\.\s*/, "") : r
            )}
          </span>
        </div>
      );
    }
    // Bullet
    if (line.trim().startsWith("-")) {
      return (
        <div key={i} style={{ display: "flex", gap: 8, marginBottom: 3 }}>
          <span style={{ color: "#c8903c", flexShrink: 0 }}>✦</span>
          <span>
            {rendered.map((r, j) =>
              typeof r === "string" ? r.replace(/^-\s*/, "") : r
            )}
          </span>
        </div>
      );
    }
    // Blockquote
    if (line.trim().startsWith(">")) {
      return (
        <div
          key={i}
          style={{
            borderLeft: "3px solid rgba(200,140,40,0.4)",
            paddingLeft: 10,
            marginBottom: 4,
            color: "#5c3a14",
            fontStyle: "italic",
            fontSize: "0.83rem",
          }}
        >
          {rendered.map((r, j) =>
            typeof r === "string" ? r.replace(/^>\s*/, "") : r
          )}
        </div>
      );
    }
    return (
      <div key={i} style={{ marginBottom: 2 }}>
        {rendered}
      </div>
    );
  });
  return (
    <div style={{ lineHeight: 1.7, fontSize: "0.84rem", color: "#3d1800" }}>
      {parts}
    </div>
  );
}

// ── CSS ───────────────────────────────────────────────────────────
const css = `
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=DM+Sans:wght@300;400;500;600;700&display=swap');

/* ── Floating button ── */
.cb-fab {
  position: fixed; bottom: 28px; right: 28px; z-index: 800;
  width: 62px; height: 62px; border-radius: 50%;
  background: linear-gradient(135deg, #6b2a00, #c8903c);
  border: none; cursor: pointer;
  box-shadow: 0 6px 24px rgba(107,42,0,0.45), 0 2px 8px rgba(0,0,0,0.2);
  display: flex; align-items: center; justify-content: center;
  transition: all 0.22s; overflow: hidden; padding: 0;
  animation: cbFabIn 0.4s cubic-bezier(0.22,1,0.36,1);
}
.cb-fab img { width: 62px; height: 62px; object-fit: cover; border-radius: 50%; display: block; }
.cb-fab:hover { transform: scale(1.1) translateY(-2px); box-shadow: 0 10px 32px rgba(107,42,0,0.55); }
.cb-fab.open  { transform: scale(0.95); }
.cb-fab-x {
  position: fixed; bottom: 28px; right: 28px; z-index: 801;
  width: 62px; height: 62px; border-radius: 50%;
  background: rgba(30,8,0,0.75); border: none; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  color: #fff; font-size: 1.2rem; transition: all 0.18s;
  box-shadow: 0 6px 24px rgba(0,0,0,0.3);
}
.cb-fab-x:hover { background: rgba(30,8,0,0.9); transform: scale(1.05); }
@keyframes cbFabIn { from{transform:scale(0);opacity:0} to{transform:scale(1);opacity:1} }

/* Pulse ring on fab */
.cb-fab-ring {
  position: fixed; bottom: 28px; right: 28px; z-index: 799;
  width: 62px; height: 62px; border-radius: 50%;
  border: 2px solid rgba(200,140,40,0.5);
  animation: cbRing 2.5s ease-in-out infinite;
  pointer-events: none;
}
@keyframes cbRing { 0%{transform:scale(1);opacity:0.6} 70%{transform:scale(1.5);opacity:0} 100%{transform:scale(1.5);opacity:0} }

/* Welcome tooltip next to FAB */
.cb-welcome-tip {
  position: fixed; bottom: 36px; right: 102px; z-index: 799;
  background: #fff; border: 1.5px solid rgba(200,140,40,0.25);
  border-radius: 14px 14px 3px 14px;
  padding: 10px 14px; box-shadow: 0 6px 24px rgba(61,23,0,0.15);
  max-width: 200px; animation: cbTipIn 0.4s cubic-bezier(0.22,1,0.36,1) 1.2s both;
  pointer-events: none;
}
@keyframes cbTipIn { from{opacity:0;transform:translateX(12px)} to{opacity:1;transform:translateX(0)} }
.cb-welcome-tip-title { font-family:'Cinzel',serif; font-size:0.76rem; font-weight:700; color:#2d1200; margin-bottom:2px; }
.cb-welcome-tip-sub   { font-size:0.68rem; color:#8b6840; line-height:1.5; }
.cb-welcome-tip-arrow {
  position:absolute; right:-9px; bottom:16px;
  width:0; height:0;
  border-top:6px solid transparent; border-bottom:6px solid transparent;
  border-left:9px solid rgba(200,140,40,0.25);
}
.cb-welcome-tip-arrow::after {
  content:''; position:absolute; top:-5px; left:-10px;
  width:0; height:0;
  border-top:5px solid transparent; border-bottom:5px solid transparent;
  border-left:8px solid #fff;
}

/* ── Panel ── */
.cb-panel {
  position: fixed; bottom: 100px; right: 28px; z-index: 850;
  width: 390px; max-width: calc(100vw - 32px);
  height: 580px; max-height: calc(100vh - 130px);
  background: #fff;
  border-radius: 22px;
  box-shadow: 0 20px 80px rgba(61,23,0,0.22), 0 4px 20px rgba(0,0,0,0.12);
  display: flex; flex-direction: column; overflow: hidden;
  animation: cbPanelIn 0.3s cubic-bezier(0.22,1,0.36,1) both;
  border: 1.5px solid rgba(200,140,40,0.18);
}
@keyframes cbPanelIn {
  from { transform: translateY(20px) scale(0.96); opacity: 0; }
  to   { transform: translateY(0) scale(1); opacity: 1; }
}

/* ── Header ── */
.cb-hd {
  padding: 16px 18px 14px;
  background: linear-gradient(135deg, #1e0800 0%, #3d1400 45%, #6b2a00 80%, #8b4000 100%);
  flex-shrink: 0; position: relative; overflow: hidden;
}
.cb-hd::before {
  content: 'ॐ'; position: absolute; right: 16px; bottom: -8px;
  font-size: 4rem; opacity: 0.07; color: #f5c842;
  font-family: serif; pointer-events: none; line-height: 1;
}
.cb-hd-row  { display: flex; align-items: center; gap: 10px; }
.cb-hd-ico  { font-size: 1.4rem; flex-shrink: 0; }
.cb-hd-name { font-family:'Cinzel',serif; font-size:0.9rem; font-weight:700; color:#fff; margin-bottom:1px; }
.cb-hd-sub  { font-size:0.66rem; color:rgba(255,210,140,0.7); }
.cb-hd-close {
  margin-left:auto; width:28px; height:28px; border:none; border-radius:7px;
  background:rgba(255,255,255,0.1); color:rgba(255,255,255,0.8);
  cursor:pointer; display:flex; align-items:center; justify-content:center;
  font-size:0.9rem; transition:all 0.14s; flex-shrink:0;
}
.cb-hd-close:hover { background:rgba(255,255,255,0.2); color:#fff; }

/* Online dot */
.cb-online { width:7px; height:7px; border-radius:50%; background:#4ade80; box-shadow:0 0 0 2px rgba(74,222,128,0.3); flex-shrink:0; animation:cbBlink 2s ease-in-out infinite; }
@keyframes cbBlink { 0%,100%{opacity:1} 50%{opacity:0.5} }

/* ── Breadcrumb ── */
.cb-bc { padding:8px 14px; background:rgba(200,140,40,0.05); border-bottom:1px solid rgba(200,140,40,0.1); display:flex; align-items:center; gap:5px; flex-shrink:0; }
.cb-bc-item { font-size:0.66rem; color:#8b6840; cursor:pointer; transition:color 0.12s; }
.cb-bc-item:hover { color:#c8903c; }
.cb-bc-item.active { color:#3d1800; font-weight:700; cursor:default; }
.cb-bc-sep  { font-size:0.6rem; color:#c4a880; }

/* ── Messages area ── */
.cb-msgs {
  flex: 1; overflow-y: auto; padding: 14px 14px 8px;
  display: flex; flex-direction: column; gap: 10px;
}
.cb-msgs::-webkit-scrollbar { width: 3px; }
.cb-msgs::-webkit-scrollbar-thumb { background: rgba(200,140,40,0.2); border-radius:2px; }

/* Message bubbles */
.cb-msg-bot { display:flex; align-items:flex-start; gap:8px; }
.cb-msg-bot-ico { width:26px; height:26px; border-radius:8px; background:linear-gradient(135deg,#6b2a00,#c8903c); display:flex; align-items:center; justify-content:center; font-size:0.8rem; flex-shrink:0; margin-top:2px; }
.cb-bubble-bot {
  background: linear-gradient(135deg, #fdf8f0, #fdf2e4);
  border: 1px solid rgba(200,140,40,0.18);
  border-radius: 14px 14px 14px 3px;
  padding: 11px 14px; max-width: 88%;
}
.cb-bubble-user {
  background: linear-gradient(135deg, #6b2a00, #c8903c);
  border-radius: 14px 14px 3px 14px;
  padding: 10px 14px; max-width: 82%;
  color: #fff; font-size:0.84rem; line-height:1.6;
  margin-left: auto;
}

/* Typing indicator */
.cb-typing { display:flex; align-items:center; gap:4px; padding:8px 12px; }
.cb-dot { width:6px; height:6px; border-radius:50%; background:rgba(200,140,40,0.4); animation:cbDot 1.2s ease-in-out infinite; }
.cb-dot:nth-child(2) { animation-delay:0.2s; }
.cb-dot:nth-child(3) { animation-delay:0.4s; }
@keyframes cbDot { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-6px)} }

/* ── Quick reply chips ── */
.cb-chips { padding:8px 14px; display:flex; flex-wrap:wrap; gap:6px; flex-shrink:0; }
.cb-chip {
  padding:6px 12px; border-radius:20px; cursor:pointer;
  font-size:0.74rem; font-weight:600; transition:all 0.14s;
  border:1.5px solid rgba(200,140,40,0.25);
  background:rgba(200,140,40,0.06); color:#5c3a14;
  display:flex; align-items:center; gap:5px;
}
.cb-chip:hover { background:rgba(200,140,40,0.14); border-color:rgba(200,140,40,0.45); transform:translateY(-1px); }

/* ── Category grid ── */
.cb-catgrid { display:grid; grid-template-columns:1fr 1fr; gap:8px; padding:4px 0; }
.cb-catcard {
  padding:11px 13px; border-radius:12px; cursor:pointer; transition:all 0.15s;
  display:flex; align-items:center; gap:9px; border:1.5px solid;
}
.cb-catcard:hover { transform:translateY(-2px); box-shadow:0 4px 12px rgba(61,23,0,0.1); }
.cb-catcard-ico  { font-size:1.1rem; flex-shrink:0; }
.cb-catcard-lbl  { font-size:0.78rem; font-weight:700; }

/* ── Q list ── */
.cb-qlist { display:flex; flex-direction:column; gap:5px; }
.cb-qitem {
  padding:9px 13px; border-radius:10px; cursor:pointer; font-size:0.78rem; font-weight:500;
  border:1px solid rgba(200,140,40,0.15); color:#3d1800;
  background:rgba(200,140,40,0.04); transition:all 0.13s;
  display:flex; align-items:center; gap:8px;
}
.cb-qitem:hover { background:rgba(200,140,40,0.1); border-color:rgba(200,140,40,0.3); transform:translateX(2px); }
.cb-qitem-ico { color:#c8903c; flex-shrink:0; font-size:0.7rem; }

/* ── Input area ── */
.cb-input-area {
  padding:10px 12px; border-top:1px solid rgba(200,140,40,0.12);
  display:flex; gap:8px; align-items:flex-end; flex-shrink:0;
  background:rgba(253,248,240,0.6);
}
.cb-input {
  flex:1; padding:9px 13px; border:1.5px solid rgba(200,140,40,0.22); border-radius:12px;
  background:#fff; color:#2d1200; font-family:'DM Sans',sans-serif; font-size:0.82rem;
  outline:none; resize:none; transition:border-color 0.15s; line-height:1.5;
  max-height:80px; overflow-y:auto;
}
.cb-input:focus { border-color:#c8903c; box-shadow:0 0 0 3px rgba(200,140,40,0.1); }
.cb-input::placeholder { color:#b09070; }
.cb-send {
  width:36px; height:36px; border-radius:10px; border:none;
  background:linear-gradient(135deg,#6b2a00,#c8903c); color:#fff;
  cursor:pointer; display:flex; align-items:center; justify-content:center;
  transition:all 0.15s; flex-shrink:0;
}
.cb-send:hover:not(:disabled) { opacity:0.88; transform:translateY(-1px); }
.cb-send:disabled { opacity:0.4; cursor:not-allowed; }

/* ── Message form ── */
.cb-form { display:flex; flex-direction:column; gap:11px; padding:4px 0; }
.cb-form-label { font-size:0.72rem; font-weight:700; color:#5c3a14; letter-spacing:0.02em; }
.cb-form-inp {
  padding:10px 13px; border:1.5px solid rgba(200,140,40,0.22); border-radius:10px;
  background:#fff; color:#2d1200; font-family:'DM Sans',sans-serif; font-size:0.82rem;
  outline:none; width:100%; box-sizing:border-box; transition:border-color 0.15s;
}
.cb-form-inp:focus { border-color:#c8903c; }
.cb-form-inp::placeholder { color:#b09070; }
.cb-form-ta {
  padding:10px 13px; border:1.5px solid rgba(200,140,40,0.22); border-radius:10px;
  background:#fff; color:#2d1200; font-family:'DM Sans',sans-serif; font-size:0.82rem;
  outline:none; width:100%; box-sizing:border-box; resize:vertical; min-height:90px;
  max-height:140px; transition:border-color 0.15s; line-height:1.6;
}
.cb-form-ta:focus { border-color:#c8903c; }
.cb-form-sel {
  padding:9px 13px; border:1.5px solid rgba(200,140,40,0.22); border-radius:10px;
  background:#fff; color:#2d1200; font-family:'DM Sans',sans-serif; font-size:0.82rem;
  outline:none; cursor:pointer; width:100%; box-sizing:border-box;
}
.cb-form-sel:focus { border-color:#c8903c; }
.cb-form-submit {
  padding:11px; border-radius:11px; border:none;
  background:linear-gradient(135deg,#6b2a00,#c8903c); color:#fff;
  font-family:'DM Sans',sans-serif; font-size:0.86rem; font-weight:700;
  cursor:pointer; transition:all 0.15s;
  display:flex; align-items:center; justify-content:center; gap:8px;
}
.cb-form-submit:hover:not(:disabled) { opacity:0.88; transform:translateY(-1px); }
.cb-form-submit:disabled { opacity:0.5; cursor:not-allowed; transform:none; }

/* ── My Messages screen ── */
.cb-mymsg-item {
  border:1.5px solid rgba(200,140,40,0.15); border-radius:13px; overflow:hidden; margin-bottom:10px;
}
.cb-mymsg-item:last-child { margin-bottom:0; }
.cb-mymsg-item.has-reply { border-color:rgba(22,163,74,0.25); }
.cb-mymsg-item.new-reply { border-color:#16a34a; box-shadow:0 0 0 2px rgba(22,163,74,0.15); }
.cb-mymsg-hd {
  padding:10px 13px; background:rgba(200,140,40,0.04); cursor:pointer;
  display:flex; align-items:center; gap:8px; transition:background 0.12s;
}
.cb-mymsg-hd:hover { background:rgba(200,140,40,0.08); }
.cb-mymsg-cat  { font-size:0.62rem; font-weight:700; padding:2px 7px; border-radius:20px; background:rgba(2,132,199,0.1); color:#0c4a6e; }
.cb-mymsg-sub  { flex:1; font-size:0.78rem; font-weight:600; color:#2d1200; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.cb-mymsg-date { font-size:0.62rem; color:#a08060; flex-shrink:0; }
.cb-mymsg-new  { font-size:0.6rem; font-weight:700; padding:2px 7px; border-radius:20px; background:rgba(22,163,74,0.12); color:#15803d; border:1px solid rgba(22,163,74,0.2); flex-shrink:0; animation:cbNewPulse 1.5s ease-in-out infinite; }
@keyframes cbNewPulse { 0%,100%{opacity:1} 50%{opacity:0.6} }
.cb-mymsg-body { padding:12px 13px; }
.cb-mymsg-q { font-size:0.78rem; color:#3d1800; line-height:1.6; margin-bottom:10px; background:rgba(200,140,40,0.05); padding:9px 12px; border-radius:9px; white-space:pre-wrap; }
.cb-mymsg-reply-hd { display:flex; align-items:center; gap:6px; margin-bottom:6px; }
.cb-mymsg-reply-dot { width:6px; height:6px; border-radius:50%; background:#16a34a; }
.cb-mymsg-reply-lbl { font-size:0.62rem; font-weight:700; color:#15803d; text-transform:uppercase; letter-spacing:0.08em; }
.cb-mymsg-reply-who  { font-size:0.62rem; color:#a08060; }
.cb-mymsg-reply-text { font-size:0.82rem; color:#1a3d1a; line-height:1.65; background:rgba(22,163,74,0.05); padding:10px 13px; border-radius:9px; border:1px solid rgba(22,163,74,0.12); white-space:pre-wrap; }
.cb-mymsg-pending { font-size:0.74rem; color:#8b6840; font-style:italic; padding:8px 12px; background:rgba(200,140,40,0.04); border-radius:9px; }

/* FAB unread badge */
.cb-fab-badge {
  position:fixed; bottom:76px; right:24px; z-index:802;
  background:#dc2626; color:#fff; font-size:0.58rem; font-weight:800;
  min-width:18px; height:18px; border-radius:9px;
  display:flex; align-items:center; justify-content:center; padding:0 4px;
  border:2px solid #f5efe6; pointer-events:none;
  animation:cbBadgePop 0.3s cubic-bezier(0.22,1,0.36,1);
}
@keyframes cbBadgePop { from{transform:scale(0)} to{transform:scale(1)} }
.cb-success-ico { font-size:2.8rem; margin-bottom:12px; }
.cb-success-title { font-family:'Cinzel',serif; font-size:0.95rem; font-weight:700; color:#2d1200; margin-bottom:6px; }
.cb-success-sub   { font-size:0.78rem; color:#8b6840; line-height:1.7; margin-bottom:16px; }

/* ── Spin ── */
.cb-spin { width:13px; height:13px; border-radius:50%; border:2px solid rgba(255,255,255,0.3); border-top-color:#fff; animation:cbSpinA 0.7s linear infinite; flex-shrink:0; }
@keyframes cbSpinA { to{transform:rotate(360deg)} }

/* ── Home options ── */
.cb-home-opts { display:flex; flex-direction:column; gap:10px; }
.cb-home-opt {
  padding:16px 18px; border-radius:14px; cursor:pointer; transition:all 0.18s;
  display:flex; align-items:center; gap:14px; border:2px solid;
}
.cb-home-opt:hover { transform:translateY(-3px); }
.cb-home-opt-ico  { font-size:1.6rem; flex-shrink:0; }
.cb-home-opt-title { font-family:'Cinzel',serif; font-size:0.85rem; font-weight:700; margin-bottom:2px; }
.cb-home-opt-sub   { font-size:0.7rem; line-height:1.5; }

@media(max-width:480px){
  .cb-panel { bottom:80px; right:12px; width:calc(100vw - 24px); height:calc(100vh - 120px); max-height:none; }
  .cb-fab   { bottom:18px; right:18px; }
  .cb-fab-ring { bottom:18px; right:18px; }
}
`;

// ── Main Component ────────────────────────────────────────────────
// ── MyMsgItem — extracted component so useState is not called inside .map() ──
function MyMsgItem({ m }) {
  const [expanded, setExpanded] = useState(false);
  const isNewReply = m.reply && !m.ownerReadReply;
  return (
    <div
      className={`cb-mymsg-item ${m.reply ? "has-reply" : ""} ${
        isNewReply ? "new-reply" : ""
      }`}
    >
      <div className="cb-mymsg-hd" onClick={() => setExpanded((p) => !p)}>
        <span className="cb-mymsg-cat">{m.category}</span>
        <span className="cb-mymsg-sub">
          {m.subject || m.message.slice(0, 40) + "…"}
        </span>
        {isNewReply && <span className="cb-mymsg-new">🔔 New Reply</span>}
        {!isNewReply && m.reply && (
          <span
            style={{ fontSize: "0.62rem", color: "#15803d", flexShrink: 0 }}
          >
            ✓ Replied
          </span>
        )}
        {!m.reply && (
          <span
            style={{ fontSize: "0.62rem", color: "#a08060", flexShrink: 0 }}
          >
            Pending
          </span>
        )}
        <span
          style={{
            fontSize: "0.7rem",
            color: "#c4a880",
            flexShrink: 0,
            marginLeft: 4,
          }}
        >
          {expanded ? "▲" : "▼"}
        </span>
      </div>
      {expanded && (
        <div className="cb-mymsg-body">
          <div
            style={{
              fontSize: "0.62rem",
              fontWeight: 700,
              color: "#7a4a10",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: 5,
            }}
          >
            Your Message
          </div>
          <div className="cb-mymsg-q">{m.message}</div>
          {m.reply ? (
            <>
              <div className="cb-mymsg-reply-hd">
                <span className="cb-mymsg-reply-dot" />
                <span className="cb-mymsg-reply-lbl">Admin Reply</span>
                <span className="cb-mymsg-reply-who">
                  {m.repliedBy?.name || "Admin"} ·{" "}
                  {m.repliedAt
                    ? new Date(m.repliedAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })
                    : ""}
                </span>
              </div>
              <div className="cb-mymsg-reply-text">{m.reply}</div>
            </>
          ) : (
            <div className="cb-mymsg-pending">
              ⏳ Admin hasn't replied yet. Usually within 24 hours.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ChatBot() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [screen, setScreen] = useState("home"); // home | general | category | answer | message | success | mymsgs
  const [msgs, setMsgs] = useState([]);
  const [typing, setTyping] = useState(false);
  const [input, setInput] = useState("");
  const [activeCat, setActiveCat] = useState(null);
  const [currentAnswer, setCurrentAnswer] = useState(null);

  // Message form
  const [form, setForm] = useState({
    category: "Question",
    subject: "",
    message: "",
  });
  const [sending, setSending] = useState(false);

  // My messages (owner replies from admin)
  const [myMessages, setMyMessages] = useState([]);
  const [myMsgsLoading, setMyMsgsLoading] = useState(false);
  const [unreadReplies, setUnreadReplies] = useState(0);
  const [hasNewReply, setHasNewReply] = useState(false);

  const msgsEnd = useRef(null);

  // Auto-scroll
  useEffect(() => {
    msgsEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, typing]);

  // ── Sound System (Web Audio API) ─────────────────────────────
  const playSound = (type) => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      const t = ctx.currentTime;
      if (type === "open") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(523, t);
        osc.frequency.exponentialRampToValueAtTime(784, t + 0.15);
        gain.gain.setValueAtTime(0.18, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
        osc.start(t);
        osc.stop(t + 0.4);
      } else if (type === "close") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(784, t);
        osc.frequency.exponentialRampToValueAtTime(392, t + 0.2);
        gain.gain.setValueAtTime(0.12, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
        osc.start(t);
        osc.stop(t + 0.3);
      } else if (type === "send") {
        // Two note chime
        const osc2 = ctx.createOscillator();
        const g2 = ctx.createGain();
        osc2.connect(g2);
        g2.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.setValueAtTime(659, t);
        gain.gain.setValueAtTime(0.15, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
        osc.start(t);
        osc.stop(t + 0.25);
        osc2.type = "sine";
        osc2.frequency.setValueAtTime(880, t + 0.1);
        g2.gain.setValueAtTime(0.12, t + 0.1);
        g2.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
        osc2.start(t + 0.1);
        osc2.stop(t + 0.4);
        return;
      } else if (type === "reply") {
        // Three ascending chimes — spiritual bell
        [523, 659, 784].forEach((freq, i) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.connect(g);
          g.connect(ctx.destination);
          o.type = "sine";
          o.frequency.value = freq;
          const start = t + i * 0.14;
          g.gain.setValueAtTime(0.16, start);
          g.gain.exponentialRampToValueAtTime(0.001, start + 0.45);
          o.start(start);
          o.stop(start + 0.45);
        });
        return;
      } else if (type === "click") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(440, t);
        gain.gain.setValueAtTime(0.08, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
        osc.start(t);
        osc.stop(t + 0.1);
      } else if (type === "error") {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(200, t);
        osc.frequency.exponentialRampToValueAtTime(150, t + 0.2);
        gain.gain.setValueAtTime(0.1, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
        osc.start(t);
        osc.stop(t + 0.25);
      }
    } catch {
      /* AudioContext blocked */
    }
  };

  // ── Fetch unread replies on mount ─────────────────────────────
  useEffect(() => {
    api
      .get("/messages/mine")
      .then((r) => {
        const list = r.data.messages || [];
        const unread = list.filter((m) => m.reply && !m.ownerReadReply).length;
        setUnreadReplies(unread);
        if (unread > 0) setHasNewReply(true);
      })
      .catch(() => {});
  }, []);

  // Open fresh
  const handleOpen = () => {
    if (!open) {
      playSound("open");
      setScreen("home");
      setMsgs([]);
      setInput("");
      setCurrentAnswer(null);
      setActiveCat(null);
      setForm({ category: "Question", subject: "", message: "" });
    } else {
      playSound("close");
    }
    setOpen((p) => !p);
  };

  const addBotMsg = (content, delay = 600) => {
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMsgs((p) => [...p, { role: "bot", content, id: Date.now() }]);
    }, delay);
  };

  const addUserMsg = (text) => {
    setMsgs((p) => [...p, { role: "user", content: text, id: Date.now() }]);
  };

  // ── My Messages ───────────────────────────────────────────────
  const fetchMyMessages = async () => {
    setMyMsgsLoading(true);
    try {
      const r = await api.get("/messages/mine");
      const list = r.data.messages || [];
      setMyMessages(list);
      // Mark all replied messages as read by owner
      const unreadIds = list
        .filter((m) => m.reply && !m.ownerReadReply)
        .map((m) => m._id);
      if (unreadIds.length > 0) {
        await Promise.all(
          unreadIds.map((id) =>
            api.patch(`/messages/${id}/owner-read`).catch(() => {})
          )
        );
        setUnreadReplies(0);
        setHasNewReply(false);
      }
    } catch {
      /* silent */
    } finally {
      setMyMsgsLoading(false);
    }
  };

  // ── Navigation ────────────────────────────────────────────────
  const goHome = () => {
    setScreen("home");
    setCurrentAnswer(null);
    setActiveCat(null);
  };

  const goGeneral = () => {
    setScreen("general");
    setMsgs([]);
    addBotMsg(
      <div>
        <div
          style={{
            fontFamily: "'Cinzel',serif",
            fontWeight: 700,
            color: "#2d1200",
            marginBottom: 7,
            fontSize: "0.88rem",
          }}
        >
          🙏 Hare Krishna! How can I help?
        </div>
        <div
          style={{
            fontSize: "0.78rem",
            color: "#5c3a14",
            marginBottom: 10,
            lineHeight: 1.6,
          }}
        >
          Choose a category or type your question below. I'll do my best to
          guide you. 🪷
        </div>
        <div className="cb-catgrid">
          {CATEGORIES.map((c) => (
            <div
              key={c.id}
              className="cb-catcard"
              style={{ background: c.bg, borderColor: c.border }}
              onClick={() => goCategory(c)}
            >
              <span className="cb-catcard-ico">{c.emoji}</span>
              <span className="cb-catcard-lbl" style={{ color: c.color }}>
                {c.label}
              </span>
            </div>
          ))}
        </div>
      </div>,
      400
    );
  };

  const goCategory = (cat) => {
    setActiveCat(cat);
    setScreen("category");
    addUserMsg(cat.emoji + " " + cat.label);
    addBotMsg(
      <div>
        <div
          style={{
            fontFamily: "'Cinzel',serif",
            fontWeight: 700,
            color: "#2d1200",
            marginBottom: 9,
            fontSize: "0.84rem",
          }}
        >
          {cat.emoji} {cat.label} — Select a question:
        </div>
        <div className="cb-qlist">
          {cat.questions.map((qKey) => {
            const entry = KB[qKey];
            if (!entry) return null;
            const displayLabel = qKey.charAt(0).toUpperCase() + qKey.slice(1);
            return (
              <div
                key={qKey}
                className="cb-qitem"
                onClick={() => showAnswer(qKey, displayLabel)}
              >
                <span className="cb-qitem-ico">✦</span>
                {displayLabel}
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 10, fontSize: "0.72rem", color: "#a08060" }}>
          Or type your question in the box below ↓
        </div>
      </div>
    );
  };

  const showAnswer = (key, displayText) => {
    const entry = KB[key];
    if (!entry) return;
    setCurrentAnswer(entry);
    setScreen("answer");
    addUserMsg(displayText || key);
    addBotMsg(
      <div>
        <FormatAnswer text={entry.answer} />
        <div
          style={{
            marginTop: 12,
            paddingTop: 10,
            borderTop: "1px solid rgba(200,140,40,0.12)",
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          <div className="cb-chip" onClick={goHome}>
            🏠 Home
          </div>
          {activeCat && (
            <div className="cb-chip" onClick={() => goCategory(activeCat)}>
              ← {activeCat.label}
            </div>
          )}
          <div className="cb-chip" onClick={() => setScreen("message")}>
            💬 Ask Admin
          </div>
        </div>
      </div>
    );
  };

  const handleInputSend = () => {
    if (!input.trim()) return;
    const q = input.trim();
    setInput("");
    addUserMsg(q);
    const result = searchKB(q);
    if (result) {
      setCurrentAnswer(result);
      setScreen("answer");
      addBotMsg(
        <div>
          <FormatAnswer text={result.answer} />
          <div
            style={{
              marginTop: 12,
              paddingTop: 10,
              borderTop: "1px solid rgba(200,140,40,0.12)",
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            <div className="cb-chip" onClick={goHome}>
              🏠 Home
            </div>
            <div className="cb-chip" onClick={() => setScreen("message")}>
              💬 Ask Admin
            </div>
          </div>
        </div>
      );
    } else {
      addBotMsg(
        <div>
          <div
            style={{
              fontSize: "0.84rem",
              color: "#5c3a14",
              marginBottom: 10,
              lineHeight: 1.6,
            }}
          >
            🙏 I couldn't find a direct answer for that. Try:
          </div>
          <div className="cb-chips" style={{ padding: 0, marginBottom: 10 }}>
            {CATEGORIES.slice(0, 4).map((c) => (
              <div key={c.id} className="cb-chip" onClick={() => goCategory(c)}>
                {c.emoji} {c.label}
              </div>
            ))}
          </div>
          <div
            className="cb-chip"
            style={{ width: "fit-content" }}
            onClick={() => setScreen("message")}
          >
            💬 Message Admin directly
          </div>
        </div>
      );
    }
  };

  // ── Message form submit ───────────────────────────────────────
  const handleSend = async () => {
    if (!form.message.trim()) {
      playSound("error");
      toast.error("Please write your message.");
      return;
    }
    setSending(true);
    try {
      await api.post("/messages", form);
      playSound("send");
      setScreen("success");
    } catch (err) {
      playSound("error");
      toast.error(
        err.response?.data?.message || "Failed to send. Please try again."
      );
    } finally {
      setSending(false);
    }
  };

  // ── Breadcrumb ────────────────────────────────────────────────
  const breadcrumb = () => {
    const crumbs = [{ label: "Home", onClick: goHome }];
    if (screen === "general" || screen === "category" || screen === "answer") {
      crumbs.push({ label: "General", onClick: goGeneral });
    }
    if (screen === "category" || screen === "answer") {
      crumbs.push({
        label: activeCat?.label || "Category",
        onClick: activeCat ? () => goCategory(activeCat) : null,
      });
    }
    if (screen === "answer") crumbs.push({ label: "Answer" });
    if (screen === "message") crumbs.push({ label: "Message Admin" });
    if (screen === "success") crumbs.push({ label: "Sent ✓" });
    if (screen === "mymsgs") crumbs.push({ label: "My Messages" });
    return crumbs;
  };

  // ── Render ────────────────────────────────────────────────────
  const showInputBar = ["general", "category", "answer"].includes(screen);

  return (
    <>
      <style>{css}</style>

      {/* Unread reply badge on FAB */}
      {!open && unreadReplies > 0 && (
        <div className="cb-fab-badge">
          {unreadReplies > 9 ? "9+" : unreadReplies}
        </div>
      )}

      {/* Welcome tip — shows briefly before first open */}
      {!open && (
        <div className="cb-welcome-tip">
          <div className="cb-welcome-tip-title">👋 Hi, Hare Krishna!</div>
          <div className="cb-welcome-tip-sub">
            How may I assist your seva today?
          </div>
          <div className="cb-welcome-tip-arrow" />
        </div>
      )}

      {/* Pulse ring */}
      {!open && <div className="cb-fab-ring" />}

      {/* FAB — chatbot image */}
      <button
        className="cb-fab"
        onClick={handleOpen}
        title={open ? "Close" : "Help & Support"}
      >
        <img
          src={chatbotAvatar}
          alt="Aaradhana Assistant"
          onError={(e) => {
            e.target.style.display = "none";
            e.target.parentElement.innerHTML = "🪷";
          }}
        />
      </button>

      {/* X button overlay when open */}
      {open && (
        <button
          className="cb-fab-x"
          onClick={() => setOpen(false)}
          title="Close"
        >
          ✕
        </button>
      )}

      {/* Panel */}
      {open && (
        <div className="cb-panel">
          {/* Header */}
          <div className="cb-hd">
            <div className="cb-hd-row">
              <span className="cb-hd-ico">🪷</span>
              <div>
                <div className="cb-hd-name">Aaradhana Assistant</div>
                <div className="cb-hd-sub">सदा सहायक · Always Helpful</div>
              </div>
              <span className="cb-online" />
              <button className="cb-hd-close" onClick={() => setOpen(false)}>
                ✕
              </button>
            </div>
          </div>

          {/* Breadcrumb */}
          {screen !== "home" && (
            <div className="cb-bc">
              {breadcrumb().map((c, i, arr) => (
                <span
                  key={i}
                  style={{ display: "flex", alignItems: "center", gap: 5 }}
                >
                  {i > 0 && <span className="cb-bc-sep">›</span>}
                  <span
                    className={`cb-bc-item${
                      i === arr.length - 1 ? " active" : ""
                    }`}
                    onClick={c.onClick}
                  >
                    {c.label}
                  </span>
                </span>
              ))}
            </div>
          )}

          {/* Content */}
          <div className="cb-msgs">
            {/* HOME */}
            {screen === "home" && (
              <div>
                <div style={{ textAlign: "center", padding: "12px 8px 16px" }}>
                  <div style={{ fontSize: "2.2rem", marginBottom: 8 }}>🙏</div>
                  <div
                    style={{
                      fontFamily: "'Cinzel',serif",
                      fontSize: "1rem",
                      fontWeight: 700,
                      color: "#2d1200",
                      marginBottom: 5,
                    }}
                  >
                    Hare Krishna, {user?.name?.split(" ")[0] || "Prabhu"}!
                  </div>
                  <div
                    style={{
                      fontSize: "0.78rem",
                      color: "#8b6840",
                      lineHeight: 1.7,
                      maxWidth: 280,
                      margin: "0 auto",
                    }}
                  >
                    How may I assist your seva today?
                  </div>
                </div>

                <div className="cb-home-opts">
                  <div
                    className="cb-home-opt"
                    style={{
                      background:
                        "linear-gradient(135deg,rgba(200,140,40,0.06),rgba(200,140,40,0.02))",
                      borderColor: "rgba(200,140,40,0.25)",
                    }}
                    onClick={() => {
                      playSound("click");
                      goGeneral();
                    }}
                  >
                    <span className="cb-home-opt-ico">🔍</span>
                    <div>
                      <div
                        className="cb-home-opt-title"
                        style={{ color: "#3d1800" }}
                      >
                        General Queries
                      </div>
                      <div
                        className="cb-home-opt-sub"
                        style={{ color: "#8b6840" }}
                      >
                        Attendance, programs, analytics, account help and more
                      </div>
                    </div>
                  </div>

                  <div
                    className="cb-home-opt"
                    style={{
                      background:
                        "linear-gradient(135deg,rgba(2,132,199,0.06),rgba(2,132,199,0.02))",
                      borderColor: "rgba(2,132,199,0.25)",
                    }}
                    onClick={() => {
                      playSound("click");
                      setScreen("message");
                    }}
                  >
                    <span className="cb-home-opt-ico">💬</span>
                    <div>
                      <div
                        className="cb-home-opt-title"
                        style={{ color: "#0c4a6e" }}
                      >
                        Message Admin
                      </div>
                      <div
                        className="cb-home-opt-sub"
                        style={{ color: "#6b8cae" }}
                      >
                        Ask a question, give feedback, or report an issue
                      </div>
                    </div>
                  </div>

                  <div
                    className="cb-home-opt"
                    style={{
                      background:
                        "linear-gradient(135deg,rgba(22,163,74,0.06),rgba(22,163,74,0.02))",
                      borderColor:
                        unreadReplies > 0 ? "#16a34a" : "rgba(22,163,74,0.2)",
                      position: "relative",
                    }}
                    onClick={() => {
                      playSound("click");
                      setScreen("mymsgs");
                      fetchMyMessages();
                    }}
                  >
                    <span className="cb-home-opt-ico">📬</span>
                    <div style={{ flex: 1 }}>
                      <div
                        className="cb-home-opt-title"
                        style={{ color: "#15803d" }}
                      >
                        My Messages
                      </div>
                      <div
                        className="cb-home-opt-sub"
                        style={{ color: "#4a7a50" }}
                      >
                        View admin replies to your queries
                      </div>
                    </div>
                    {unreadReplies > 0 && (
                      <span
                        style={{
                          background: "#dc2626",
                          color: "#fff",
                          fontSize: "0.64rem",
                          fontWeight: 800,
                          padding: "2px 8px",
                          borderRadius: 20,
                          flexShrink: 0,
                          animation: "cbNewPulse 1.5s ease-in-out infinite",
                        }}
                      >
                        {unreadReplies} new
                      </span>
                    )}
                  </div>
                </div>

                <div
                  style={{
                    textAlign: "center",
                    marginTop: 16,
                    fontSize: "0.66rem",
                    color: "#c4a880",
                    fontFamily: "'Cinzel',serif",
                    letterSpacing: "0.1em",
                  }}
                >
                  ✦ सर्वे भवन्तु सुखिनः ✦
                </div>
              </div>
            )}

            {/* GENERAL / CATEGORY / ANSWER — chat messages */}
            {["general", "category", "answer"].includes(screen) && (
              <>
                {msgs.map((m) =>
                  m.role === "bot" ? (
                    <div key={m.id} className="cb-msg-bot">
                      <div className="cb-msg-bot-ico">🪷</div>
                      <div className="cb-bubble-bot">{m.content}</div>
                    </div>
                  ) : (
                    <div
                      key={m.id}
                      style={{ display: "flex", justifyContent: "flex-end" }}
                    >
                      <div className="cb-bubble-user">{m.content}</div>
                    </div>
                  )
                )}
                {typing && (
                  <div className="cb-msg-bot">
                    <div className="cb-msg-bot-ico">🪷</div>
                    <div className="cb-bubble-bot">
                      <div className="cb-typing">
                        <div className="cb-dot" />
                        <div className="cb-dot" />
                        <div className="cb-dot" />
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* MESSAGE ADMIN FORM */}
            {screen === "message" && (
              <div>
                <div
                  style={{
                    marginBottom: 14,
                    padding: "12px 14px",
                    background: "rgba(2,132,199,0.06)",
                    borderRadius: 12,
                    border: "1px solid rgba(2,132,199,0.18)",
                  }}
                >
                  <div
                    style={{
                      fontFamily: "'Cinzel',serif",
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      color: "#0c4a6e",
                      marginBottom: 3,
                    }}
                  >
                    💬 Message to Admin
                  </div>
                  <div
                    style={{
                      fontSize: "0.72rem",
                      color: "#1e3a5f",
                      lineHeight: 1.6,
                    }}
                  >
                    Admin will review your message and respond within the
                    portal. Check **My Messages** in chat history to see
                    replies.
                  </div>
                </div>
                <div className="cb-form">
                  <div>
                    <div className="cb-form-label">Category</div>
                    <select
                      className="cb-form-sel"
                      value={form.category}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, category: e.target.value }))
                      }
                    >
                      <option>Question</option>
                      <option>Feedback</option>
                      <option>Bug Report</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div>
                    <div className="cb-form-label">
                      Subject{" "}
                      <span style={{ fontWeight: 400, color: "#a08060" }}>
                        (optional)
                      </span>
                    </div>
                    <input
                      className="cb-form-inp"
                      placeholder="Brief subject..."
                      value={form.subject}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, subject: e.target.value }))
                      }
                      maxLength={120}
                    />
                  </div>
                  <div>
                    <div className="cb-form-label">
                      Message <span style={{ color: "#dc2626" }}>*</span>
                    </div>
                    <textarea
                      className="cb-form-ta"
                      placeholder="Write your message here..."
                      value={form.message}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, message: e.target.value }))
                      }
                      maxLength={2000}
                    />
                    <div
                      style={{
                        fontSize: "0.64rem",
                        color: "#a08060",
                        textAlign: "right",
                        marginTop: 2,
                      }}
                    >
                      {form.message.length}/2000
                    </div>
                  </div>
                  <button
                    className="cb-form-submit"
                    onClick={handleSend}
                    disabled={sending || !form.message.trim()}
                  >
                    {sending ? (
                      <>
                        <span className="cb-spin" />
                        Sending…
                      </>
                    ) : (
                      <>🙏 Send Message</>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* MY MESSAGES — admin replies */}
            {screen === "mymsgs" && (
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 14,
                    padding: "10px 12px",
                    background: "rgba(22,163,74,0.06)",
                    borderRadius: 11,
                    border: "1px solid rgba(22,163,74,0.15)",
                  }}
                >
                  <span style={{ fontSize: "1.1rem" }}>📬</span>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontFamily: "'Cinzel',serif",
                        fontSize: "0.78rem",
                        fontWeight: 700,
                        color: "#15803d",
                      }}
                    >
                      My Messages
                    </div>
                    <div style={{ fontSize: "0.68rem", color: "#4a7a50" }}>
                      Your queries and admin replies
                    </div>
                  </div>
                  <button
                    style={{
                      fontSize: "0.72rem",
                      padding: "4px 10px",
                      border: "1.5px solid rgba(22,163,74,0.25)",
                      borderRadius: 8,
                      background: "none",
                      color: "#15803d",
                      cursor: "pointer",
                      fontWeight: 700,
                    }}
                    onClick={fetchMyMessages}
                  >
                    ↻ Refresh
                  </button>
                </div>

                {myMsgsLoading ? (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "24px 0",
                      color: "#8b6840",
                      fontSize: "0.78rem",
                      fontFamily: "'Cinzel',serif",
                    }}
                  >
                    <div
                      className="cb-typing"
                      style={{ justifyContent: "center" }}
                    >
                      <div className="cb-dot" />
                      <div className="cb-dot" />
                      <div className="cb-dot" />
                    </div>
                    <div style={{ marginTop: 8 }}>Loading messages…</div>
                  </div>
                ) : myMessages.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "28px 0" }}>
                    <div
                      style={{
                        fontSize: "2rem",
                        marginBottom: 8,
                        opacity: 0.5,
                      }}
                    >
                      📭
                    </div>
                    <div
                      style={{
                        fontFamily: "'Cinzel',serif",
                        fontSize: "0.82rem",
                        color: "#8b6840",
                      }}
                    >
                      No messages yet
                    </div>
                    <div
                      style={{
                        fontSize: "0.72rem",
                        color: "#a08060",
                        marginTop: 4,
                      }}
                    >
                      Your sent messages will appear here
                    </div>
                  </div>
                ) : (
                  myMessages.map((m) => <MyMsgItem key={m._id} m={m} />)
                )}
              </div>
            )}

            {/* SUCCESS */}
            {screen === "success" && (
              <div className="cb-success">
                <div className="cb-success-ico">🪷</div>
                <div className="cb-success-title">Message Sent!</div>
                <div className="cb-success-sub">
                  Your message has been delivered to the admin.
                  <br />
                  They will respond soon. 🙏
                  <br />
                  <br />
                  <em style={{ color: "#c8903c" }}>Hare Krishna!</em>
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    justifyContent: "center",
                    flexWrap: "wrap",
                  }}
                >
                  <div
                    className="cb-chip"
                    onClick={() => {
                      playSound("click");
                      goHome();
                    }}
                  >
                    🏠 Back to Home
                  </div>
                  <div
                    className="cb-chip"
                    onClick={() => {
                      playSound("click");
                      setScreen("mymsgs");
                      fetchMyMessages();
                    }}
                  >
                    📬 My Messages
                  </div>
                  <div
                    className="cb-chip"
                    onClick={() => {
                      playSound("click");
                      goGeneral();
                    }}
                  >
                    🔍 More Help
                  </div>
                </div>
              </div>
            )}

            <div ref={msgsEnd} />
          </div>

          {/* Input bar — only for chat screens */}
          {showInputBar && (
            <div className="cb-input-area">
              <textarea
                className="cb-input"
                rows={1}
                placeholder="Type your question…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleInputSend();
                  }
                }}
              />
              <button
                className="cb-send"
                onClick={handleInputSend}
                disabled={!input.trim()}
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
                    d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
                  />
                </svg>
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
