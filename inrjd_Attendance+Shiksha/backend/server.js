require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const passport = require("passport");

const connectDB = require("./config/db");
const seedAdmin = require("./utils/seedAdmin");
const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");
const sseRoutes = require("./routes/sse");
const configRoutes = require("./routes/config");
const programRoutes = require("./routes/program");
const profileRoutes = require("./routes/profile");
const dashboardRoutes = require("./routes/dashboard");
const attendanceRoutes = require("./routes/attendance");
const alertRoutes = require("./routes/alerts");
const announcementRoutes = require("./routes/announcements");
const analyticsRoutes = require("./routes/analytics");
const adminAnalyticsRoutes = require("./routes/adminAnalytics");
const messageRoutes = require("./routes/messageRoutes");
const participantRoutes = require("./routes/participant");
const growthPlanRoutes = require("./routes/growthPlan");
const courseRoutes = require("./routes/course");
const certificationRoutes = require("./routes/certification");
const shikshaAnalyticsRoutes = require("./routes/shikshaAnalytics");
const { initScheduler } = require("./jobs/alertScheduler");

const app = express();

// ─── SECURITY MIDDLEWARE ───────────────────────────────────────
app.use(helmet());

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ─── RATE LIMITING ─────────────────────────────────────────────
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    message: "Too many login attempts. Please wait 15 minutes and try again.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Exclude SSE stream from general rate-limiter
// (it's a long-lived connection — limiting it would break the stream)
const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  skip: (req) => req.path.startsWith("/notifications/stream"),
});

app.use(generalLimiter);

// ─── BODY PARSING ──────────────────────────────────────────────
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));

// ─── PASSPORT ─────────────────────────────────────────────────
app.use(passport.initialize());

// ─── HEALTH CHECK ─────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ─── ROUTES ───────────────────────────────────────────────────
app.use("/auth", loginLimiter, authRoutes);
app.use("/admin", adminRoutes);
app.use("/notifications", sseRoutes); // SSE real-time stream
app.use("/config", configRoutes);
app.use("/programs", programRoutes);
app.use("/profile", profileRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/attendance", attendanceRoutes);
app.use("/alerts", alertRoutes);
app.use("/announcements", announcementRoutes);
app.use("/analytics", analyticsRoutes);
app.use("/analytics", adminAnalyticsRoutes); // GET /analytics/admin
app.use("/messages", messageRoutes);
app.use("/participants", participantRoutes);
app.use("/growth-plans", growthPlanRoutes);
app.use("/courses", courseRoutes);
app.use("/certifications", certificationRoutes);
app.use("/shiksha-analytics", shikshaAnalyticsRoutes);

// ─── 404 HANDLER ──────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: "Route not found." });
});

// ─── ERROR HANDLER ────────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Internal server error." });
});

// ─── START ────────────────────────────────────────────────────
const PORT = process.env.PORT || 5009;

connectDB().then(async () => {
  await seedAdmin();
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
  initScheduler();
});
