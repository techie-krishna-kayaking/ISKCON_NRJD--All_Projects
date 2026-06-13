// ════════════════════════════════════════════════════════════════
// messageController.js
// ════════════════════════════════════════════════════════════════
const Message = require("../models/message");

// ── Owner: send a message ─────────────────────────────────────
const sendMessage = async (req, res) => {
  try {
    const { category, subject, message } = req.body;
    if (!message?.trim())
      return res.status(400).json({ message: "Message text is required." });

    const msg = await Message.create({
      senderId:    req.user._id,
      senderName:  req.user.name,
      senderEmail: req.user.email,
      category:    category || "Question",
      subject:     subject?.trim() || "",
      message:     message.trim(),
    });

    res.status(201).json({ message: "Message sent successfully.", data: msg });
  } catch (err) {
    console.error("sendMessage error:", err);
    res.status(500).json({ message: "Failed to send message." });
  }
};

// ── Owner: get own message history ───────────────────────────
const getMyMessages = async (req, res) => {
  try {
    const msgs = await Message.find({ senderId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();
    res.json({ messages: msgs });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch messages." });
  }
};

// ── Admin: list all messages ──────────────────────────────────
const listMessages = async (req, res) => {
  try {
    const { status, page = 1, limit = 30 } = req.query;
    const filter = status ? { status } : {};
    const [messages, total, unreadCount] = await Promise.all([
      Message.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .populate("repliedBy", "name")
        .lean(),
      Message.countDocuments(filter),
      Message.countDocuments({ status: "unread" }),
    ]);
    res.json({ messages, total, unreadCount, page: Number(page) });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch messages." });
  }
};

// ── Admin: mark as read ───────────────────────────────────────
const markRead = async (req, res) => {
  try {
    const msg = await Message.findByIdAndUpdate(
      req.params.id,
      { status: "read", readAt: new Date() },
      { new: true }
    );
    if (!msg) return res.status(404).json({ message: "Not found." });
    res.json({ message: "Marked as read.", data: msg });
  } catch (err) {
    res.status(500).json({ message: "Failed." });
  }
};

// ── Admin: reply to message ───────────────────────────────────
const replyMessage = async (req, res) => {
  try {
    const { reply } = req.body;
    if (!reply?.trim())
      return res.status(400).json({ message: "Reply text is required." });

    const msg = await Message.findByIdAndUpdate(
      req.params.id,
      {
        reply:     reply.trim(),
        repliedAt: new Date(),
        repliedBy: req.user._id,
        status:    "replied",
      },
      { new: true }
    ).populate("repliedBy", "name");

    if (!msg) return res.status(404).json({ message: "Not found." });
    res.json({ message: "Reply sent.", data: msg });
  } catch (err) {
    res.status(500).json({ message: "Failed to send reply." });
  }
};

// ── Admin: close / reopen ─────────────────────────────────────
const closeMessage = async (req, res) => {
  try {
    const msg = await Message.findById(req.params.id);
    if (!msg) return res.status(404).json({ message: "Not found." });
    const newStatus = msg.status === "closed" ? "read" : "closed";
    msg.status = newStatus;
    await msg.save();
    res.json({ message: `Marked as ${newStatus}.`, data: msg });
  } catch (err) {
    res.status(500).json({ message: "Failed." });
  }
};

// ── Admin: delete message ─────────────────────────────────────
const deleteMessage = async (req, res) => {
  try {
    await Message.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted." });
  } catch (err) {
    res.status(500).json({ message: "Failed." });
  }
};

// ── Owner: mark admin reply as read ──────────────────────────
const ownerReadReply = async (req, res) => {
  try {
    const msg = await Message.findOne({ _id: req.params.id, senderId: req.user._id });
    if (!msg) return res.status(404).json({ message: "Not found." });
    msg.ownerReadReply = true;
    await msg.save();
    res.json({ message: "Marked as read." });
  } catch (err) {
    res.status(500).json({ message: "Failed." });
  }
};

// ── Owner: get unread reply count ─────────────────────────────
const getOwnerUnreadCount = async (req, res) => {
  try {
    const count = await Message.countDocuments({
      senderId: req.user._id,
      reply: { $ne: null },
      ownerReadReply: false,
    });
    res.json({ count });
  } catch (err) {
    res.json({ count: 0 });
  }
};

// ── Admin: unread count (for topbar badge) ────────────────────
const getUnreadCount = async (req, res) => {
  try {
    const count = await Message.countDocuments({ status: "unread" });
    res.json({ count });
  } catch (err) {
    res.json({ count: 0 });
  }
};

module.exports = {
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
};


// ════════════════════════════════════════════════════════════════
// messageRoutes.js  — add to server.js: app.use("/messages", messageRoutes)
// ════════════════════════════════════════════════════════════════
/*
const express = require("express");
const router  = express.Router();
const {
  sendMessage, getMyMessages, listMessages,
  markRead, replyMessage, closeMessage,
  deleteMessage, getUnreadCount,
} = require("../controllers/messageController");
const { protect } = require("../middleware/auth");
const adminOnly   = (req, res, next) =>
  ["admin"].includes(req.user?.role) ? next() : res.status(403).json({ message: "Admin only." });

router.use(protect);

// Owner routes
router.post  ("/",         sendMessage);
router.get   ("/mine",     getMyMessages);

// Admin routes
router.get   ("/",         adminOnly, listMessages);
router.get   ("/unread-count", adminOnly, getUnreadCount);
router.patch ("/:id/read", adminOnly, markRead);
router.post  ("/:id/reply",adminOnly, replyMessage);
router.patch ("/:id/close",adminOnly, closeMessage);
router.delete("/:id",      adminOnly, deleteMessage);

module.exports = router;
*/