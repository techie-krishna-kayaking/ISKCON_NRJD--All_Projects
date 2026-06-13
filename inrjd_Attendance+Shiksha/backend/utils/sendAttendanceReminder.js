/**
 * sendAttendanceReminder.js
 * ─────────────────────────────────────────────────────────────────────
 * Standalone email utility for attendance reminder notifications.
 * Kept separate from the main sendEmail.js so reminder email logic
 * can be updated independently without touching auth/account emails.
 *
 * Uses the same nodemailer transporter pattern as the rest of the app.
 *
 * Folder: backend/utils/sendAttendanceReminder.js
 */

const nodemailer = require("nodemailer");

// ── Transporter (reuses same env vars as main sendEmail.js) ──────────
const createTransporter = () =>
  nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_PORT === "465",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

// ── Helpers ───────────────────────────────────────────────────────────
function fmtDate(d) {
  if (!d) return "Never recorded";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function urgencyColor(daysOverdue, threshold) {
  if (!threshold) return "#dc2626";
  if (daysOverdue >= threshold.red) return "#dc2626";
  if (daysOverdue >= threshold.yellow) return "#d97706";
  return "#16a34a";
}

function urgencyLabel(daysOverdue, threshold) {
  if (!threshold) return "CRITICAL";
  if (daysOverdue >= threshold.red) return "OVERDUE — ACTION REQUIRED";
  if (daysOverdue >= threshold.yellow) return "DUE SOON";
  return "REMINDER";
}

// ── Threshold map (mirrors backend alertController) ───────────────────
const THRESHOLDS = {
  daily: { yellow: 5, red: 7 },
  weekly: { yellow: 7, red: 14 },
  "bi-weekly": { yellow: 14, red: 21 },
  biweekly: { yellow: 14, red: 21 },
  fortnightly: { yellow: 14, red: 21 },
  monthly: { yellow: 30, red: 45 },
};
function getThreshold(frequency) {
  if (!frequency) return { yellow: 7, red: 14 };
  return (
    THRESHOLDS[frequency.toLowerCase().replace(/\s+/g, "")] || {
      yellow: 7,
      red: 14,
    }
  );
}

// ── HTML Email Template ───────────────────────────────────────────────
function reminderTemplate({
  toName,
  programKey,
  programType,
  frequency,
  daysOverdue,
  lastDate,
}) {
  const t = getThreshold(frequency);
  const color = urgencyColor(daysOverdue, t);
  const label = urgencyLabel(daysOverdue, t);
  const isOverdue = daysOverdue >= t.red;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Attendance Reminder — ${programKey}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      background: #f5efe6;
      padding: 32px 16px;
      color: #2d1200;
    }
    .shell {
      max-width: 560px;
      margin: 0 auto;
      background: #fff;
      border-radius: 18px;
      overflow: hidden;
      box-shadow: 0 4px 24px rgba(61,23,0,0.12);
    }
    .header {
      background: linear-gradient(135deg, #2d1100 0%, #7a3200 60%, #b85000 100%);
      padding: 32px 32px 24px;
      text-align: center;
      position: relative;
    }
    .header-line {
      height: 3px;
      background: ${color};
      margin-bottom: 20px;
      border-radius: 2px;
    }
    .header-badge {
      display: inline-block;
      background: ${color};
      color: #fff;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      padding: 4px 14px;
      border-radius: 20px;
      margin-bottom: 14px;
    }
    .header-org {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: rgba(200,150,60,0.8);
      margin-bottom: 6px;
    }
    .header-title {
      font-size: 22px;
      font-weight: 700;
      color: #fff;
      line-height: 1.3;
    }
    .body { padding: 28px 32px; }
    .greeting {
      font-size: 15px;
      color: #3d1800;
      margin-bottom: 16px;
      line-height: 1.6;
    }
    .program-card {
      background: #fdf8f0;
      border: 1.5px solid rgba(200,140,40,0.25);
      border-left: 4px solid ${color};
      border-radius: 12px;
      padding: 18px 20px;
      margin-bottom: 20px;
    }
    .program-key {
      font-size: 20px;
      font-weight: 700;
      color: #2d1200;
      font-family: Georgia, serif;
      margin-bottom: 12px;
    }
    .program-row {
      display: flex;
      justify-content: space-between;
      font-size: 13px;
      padding: 6px 0;
      border-bottom: 1px solid rgba(200,140,40,0.1);
      color: #5c3a14;
    }
    .program-row:last-child { border-bottom: none; }
    .program-row-label { font-weight: 600; color: #8b6840; }
    .days-chip {
      display: inline-block;
      background: ${
        isOverdue ? "rgba(220,38,38,0.1)" : "rgba(251,191,36,0.12)"
      };
      color: ${color};
      border: 1px solid ${color}40;
      padding: 3px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 800;
    }
    .cta-wrap { text-align: center; margin: 24px 0; }
    .cta-btn {
      display: inline-block;
      background: linear-gradient(135deg, #7a3200, #b85000);
      color: #fff;
      text-decoration: none;
      font-size: 14px;
      font-weight: 700;
      padding: 13px 32px;
      border-radius: 10px;
      letter-spacing: 0.04em;
    }
    .note {
      background: rgba(200,140,40,0.06);
      border-left: 3px solid rgba(200,140,40,0.35);
      border-radius: 0 8px 8px 0;
      padding: 12px 16px;
      font-size: 12.5px;
      color: #6b4520;
      line-height: 1.6;
      margin-bottom: 24px;
    }
    .footer {
      background: linear-gradient(135deg, #1e0a00, #3d1800);
      padding: 18px 32px;
      text-align: center;
    }
    .footer-text { font-size: 11px; color: rgba(200,150,60,0.55); line-height: 1.7; }
    .footer-sanskrit { font-size: 13px; color: rgba(200,150,60,0.4); margin-top: 6px; }
  </style>
</head>
<body>
  <div class="shell">

    <!-- Header -->
    <div class="header">
      <div class="header-line"></div>
      <div class="header-badge">${label}</div>
      <div class="header-org">Aaradhana Member Portal</div>
      <div class="header-title">Attendance Reminder</div>
    </div>

    <!-- Body -->
    <div class="body">
      <p class="greeting">
        Hare Krishna, <strong>${toName}</strong>,<br/>
        This is a reminder that attendance for one of your programs has ${
          isOverdue
            ? "exceeded the expected marking schedule"
            : "not been marked recently"
        }.
      </p>

      <!-- Program card -->
      <div class="program-card">
        <div class="program-key">${programKey}</div>
        <div class="program-row">
          <span class="program-row-label">Program Type</span>
          <span>${programType || "—"}</span>
        </div>
        <div class="program-row">
          <span class="program-row-label">Frequency</span>
          <span>${frequency || "—"}</span>
        </div>
        <div class="program-row">
          <span class="program-row-label">Last Session</span>
          <span>${fmtDate(lastDate)}</span>
        </div>
        <div class="program-row">
          <span class="program-row-label">Days Since</span>
          <span class="days-chip">${
            daysOverdue === null || daysOverdue === Infinity
              ? "Never"
              : `${daysOverdue} days`
          }</span>
        </div>
        <div class="program-row">
          <span class="program-row-label">Threshold</span>
          <span style="color: #8b6840; font-size:12px;">Yellow after ${
            t.yellow
          }d · Red after ${t.red}d</span>
        </div>
      </div>

      <!-- Note -->
      <div class="note">
        ${
          isOverdue
            ? `⚠️ This program is <strong>overdue</strong> for attendance marking. Regular attendance tracking helps ensure accurate records and devotee engagement insights.`
            : `📋 Please mark attendance at your earliest convenience to keep records up to date and ensure proper tracking of devotee participation.`
        }
      </div>

      <!-- CTA -->
      <div class="cta-wrap">
        <a href="${process.env.FRONTEND_URL}/owner/attendance" class="cta-btn">
          Mark Attendance Now
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <div class="footer-text">
        This is an automated reminder from the Aaradhana Member Portal.<br/>
        You are receiving this because you are listed as the owner of ${programKey}.
      </div>
      <div class="footer-sanskrit">ॐ सर्वे भवन्तु सुखिनः</div>
    </div>

  </div>
</body>
</html>
  `.trim();
}

// ── Main function ─────────────────────────────────────────────────────
const sendAttendanceReminderEmail = async ({
  toEmail,
  toName,
  programKey,
  programType,
  frequency,
  daysOverdue,
  lastDate,
}) => {
  try {
    const transporter = createTransporter();
    const t = getThreshold(frequency);
    const isOverdue = daysOverdue >= t.red;
    const subject = isOverdue
      ? `🔴 Action Required: Attendance overdue for ${programKey}`
      : `📋 Reminder: Mark attendance for ${programKey}`;

    await transporter.sendMail({
      from: `"Aaradhana Portal" <${
        process.env.EMAIL_FROM || process.env.EMAIL_USER
      }>`,
      to: toEmail,
      subject,
      html: reminderTemplate({
        toName,
        programKey,
        programType,
        frequency,
        daysOverdue,
        lastDate,
      }),
    });

    console.log(
      `[AttendanceReminder] Email sent → ${toEmail} for ${programKey}`
    );
  } catch (err) {
    console.error(`[AttendanceReminder] Failed → ${toEmail}:`, err.message);
    throw err; // rethrow so scheduler can catch and log
  }
};

module.exports = { sendAttendanceReminderEmail };
