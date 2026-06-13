const express = require("express");
const router = express.Router();
const {
  sendMessage,
  getMyMessages,
  ownerReadReply,
  getOwnerUnreadCount,
  listMessages,
  markRead,
  replyMessage,
  closeMessage,
  deleteMessage,
  getUnreadCount,
} = require("../controllers/messageController");
const { protect } = require("../middleware/auth");

const adminOnly = (req, res, next) =>
  req.user?.role === "admin"
    ? next()
    : res.status(403).json({ message: "Admin only." });

router.use(protect);

// ── Owner ──────────────────────────────────────────────────────
router.post("/", sendMessage);
router.get("/mine", getMyMessages);
router.get("/my-unread-count", getOwnerUnreadCount); // NEW
router.patch("/:id/owner-read", ownerReadReply); // NEW

// ── Admin ──────────────────────────────────────────────────────
router.get("/", adminOnly, listMessages);
router.get("/unread-count", adminOnly, getUnreadCount);
router.patch("/:id/read", adminOnly, markRead);
router.post("/:id/reply", adminOnly, replyMessage);
router.patch("/:id/close", adminOnly, closeMessage);
router.delete("/:id", adminOnly, deleteMessage);

module.exports = router;

// ── In server.js add: ──────────────────────────────────────────
// const messageRoutes = require("./routes/messageRoutes");
// app.use("/messages", messageRoutes);

//Sadhna Yana
