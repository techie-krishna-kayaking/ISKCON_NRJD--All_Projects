const cron = require("node-cron");
const Program = require("../models/Program");
const Attendance = require("../models/Attendance");
const ReminderLog = require("../models/Reminderlog");
const User = require("../models/User");
const {
  sendAttendanceReminderEmail,
} = require("../utils/sendAttendanceReminder");

const THRESHOLDS = {
  daily: { yellow: 5, red: 7, reminderAt: 5 },
  weekly: { yellow: 7, red: 14, reminderAt: 8 },
  "bi-weekly": { yellow: 14, red: 21, reminderAt: 15 },
  biweekly: { yellow: 14, red: 21, reminderAt: 15 },
  fortnightly: { yellow: 14, red: 21, reminderAt: 15 },
  monthly: { yellow: 30, red: 45, reminderAt: 32 },
  default: { yellow: 7, red: 14, reminderAt: 8 },
};

function daysSince(date) {
  if (!date) return Infinity;
  return Math.floor((Date.now() - new Date(date)) / (1000 * 60 * 60 * 24));
}

function getThreshold(frequency) {
  if (!frequency) return THRESHOLDS.default;
  return (
    THRESHOLDS[frequency.toLowerCase().replace(/\s+/g, "")] ||
    THRESHOLDS.default
  );
}

async function runReminderCheck() {
  try {
    console.log("[AlertScheduler] Running attendance reminder check...");

    const programs = await Program.find({ actFlag: "active" })
      .populate("programOwner", "name email")
      .lean();

    let sent = 0;

    for (const prog of programs) {
      const owner = prog.programOwner;
      if (!owner?.email) continue;

      const lastAtt = await Attendance.findOne({ program: prog._id })
        .sort({ date: -1 })
        .select("date")
        .lean();
      const lastDate = lastAtt?.date || null;
      const days = daysSince(lastDate);
      const t = getThreshold(prog.frequency);

      // Only send reminder if overdue threshold crossed
      if (days < t.reminderAt) continue;

      // Check if we already sent a reminder recently (within the reminder window)
      const log = await ReminderLog.findOne({ program: prog._id });
      if (log) {
        const daysSinceLastReminder = daysSince(log.lastSentAt);
        // Don't send again within the same threshold window
        if (daysSinceLastReminder < t.reminderAt) continue;
      }

      // Send reminder email (fire and forget)
      sendAttendanceReminderEmail({
        toEmail: owner.email,
        toName: owner.name,
        programKey: prog.programKey,
        programType: prog.programType,
        frequency: prog.frequency,
        daysOverdue: days,
        lastDate,
      }).catch((err) =>
        console.error(
          `[AlertScheduler] Email error for ${prog.programKey}:`,
          err.message
        )
      );

      // Upsert reminder log
      await ReminderLog.findOneAndUpdate(
        { program: prog._id },
        {
          program: prog._id,
          programKey: prog.programKey,
          lastSentAt: new Date(),
          alertType: "OVERDUE_ATTENDANCE",
          $inc: { sentCount: 1 },
        },
        { upsert: true }
      );

      sent++;
      console.log(
        `[AlertScheduler] Reminder sent → ${prog.programKey} (${days} days overdue)`
      );
    }

    console.log(`[AlertScheduler] Check complete. ${sent} reminder(s) sent.`);
  } catch (err) {
    console.error("[AlertScheduler] Error:", err.message);
  }
}

// Run every day at 9:00 AM
function initScheduler() {
  // cron.schedule("* * * * *", runReminderCheck);
  cron.schedule("0 9 * * *", runReminderCheck, {
    timezone: "Asia/Kolkata",
  });
  console.log("[AlertScheduler] Reminder job scheduled — daily at 9:00 AM IST");
}

module.exports = { initScheduler, runReminderCheck };
