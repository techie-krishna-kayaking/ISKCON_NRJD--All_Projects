const express = require("express");
const router = express.Router();
const { protect, superAdminOnly } = require("../middleware/auth");
const { addClient, removeClient } = require("../utils/sseClients");

router.get("/stream", protect, superAdminOnly, (req, res) => {
  // SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no"); // Disable nginx buffering if behind proxy
  res.flushHeaders();

  // Register this client
  addClient(res);

  // Send a heartbeat immediately so the browser knows it's connected
  res.write(`event: connected\ndata: ${JSON.stringify({ ok: true })}\n\n`);

  // Keep-alive ping every 25s to prevent proxy timeouts
  const ping = setInterval(() => {
    try {
      res.write(": ping\n\n");
    } catch {
      clearInterval(ping);
    }
  }, 25000);

  // Clean up when client closes the tab / navigates away
  req.on("close", () => {
    clearInterval(ping);
    removeClient(res);
  });
});

module.exports = router;
