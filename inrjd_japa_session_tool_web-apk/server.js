"use strict";
/**
 * server.js — Japa Session Tool
 *
 * • Auto-detects NRJD_Pics in project root OR inside public/
 * • Writes public/image-list.json so APK builds work offline
 * • Run:               node server.js
 * • Generate list only: node server.js --gen
 */

const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
const PROJECT = __dirname; // project root (where server.js lives)
const PUBLIC = path.join(PROJECT, "public"); // webDir
const OUTJSON = path.join(PUBLIC, "image-list.json");
const OUTJSON_NARASHIMA = path.join(PUBLIC, "narashima-image-list.json");

const MIME = {
  ".html": ".html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".webmanifest": "application/manifest+json",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".ogg": "audio/ogg",
};
const CONTENT_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css",
  ".js": "application/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".webmanifest": "application/manifest+json",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".ogg": "audio/ogg",
};

/* ─────────────────────────────────────────────────────────────
   FIND NRJD_Pics  — check public/ first, then project root
───────────────────────────────────────────────────────────── */
function findImgDir() {
  const candidates = [
    path.join(PUBLIC, "NRJD_Pics"), // preferred (bundled in APK)
    path.join(PROJECT, "NRJD_Pics"), // legacy / root location
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return null;
}

function findNarashimaImgDir() {
  const candidates = [
    path.join(PUBLIC, "NarashimaDev_pics"),
    path.join(PROJECT, "NarashimaDev_pics"),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return null;
}

/* ─────────────────────────────────────────────────────────────
   LIST IMAGES in the found directory
───────────────────────────────────────────────────────────── */
function listImages(imgDir) {
  if (!imgDir) return [];
  try {
    return fs
      .readdirSync(imgDir)
      .filter((f) => /\.(jpe?g|png|webp)$/i.test(f))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  } catch {
    return [];
  }
}

/* ─────────────────────────────────────────────────────────────
   GENERATE image-list.json  → written to public/
───────────────────────────────────────────────────────────── */
function generateJson() {
  const imgDir = findImgDir();
  const files = listImages(imgDir);
  const narashimaDir = findNarashimaImgDir();
  const narashimaFiles = listImages(narashimaDir);

  const line = "─".repeat(52);
  console.log(`\n${line}`);
  console.log("  📋  Generating image-list.json");
  console.log(line);

  if (!imgDir) {
    console.log("  ⚠️   NRJD_Pics folder not found!");
    console.log(`       Create one of:`);
    console.log(
      `         ${path.join(PUBLIC, "NRJD_Pics")}   ← for APK (preferred)`
    );
    console.log(
      `         ${path.join(PROJECT, "NRJD_Pics")}   ← legacy root location`
    );
  } else {
    console.log(`  📁  Images folder : ${imgDir}`);
    console.log(`  🖼️   Images found  : ${files.length}`);
    if (files.length === 0) {
      console.log("  ⚠️   No .jpg/.png/.webp files found in that folder!");
      console.log("       Add images and run again.");
    } else {
      files.forEach((f) => console.log(`         ✓ ${f}`));
    }
  }

  console.log("\n  🦁  NarashimaDev image list");
  if (!narashimaDir) {
    console.log("  ⚠️   NarashimaDev_pics folder not found!");
    console.log(`       Create one of:`);
    console.log(
      `         ${path.join(PUBLIC, "NarashimaDev_pics")}   ← for APK (preferred)`
    );
    console.log(
      `         ${path.join(PROJECT, "NarashimaDev_pics")}   ← legacy root location`
    );
  } else {
    console.log(`  📁  Folder        : ${narashimaDir}`);
    console.log(`  🖼️   Images found  : ${narashimaFiles.length}`);
  }

  // Always write the JSON (even if empty — app needs the file to exist)
  if (!fs.existsSync(PUBLIC)) fs.mkdirSync(PUBLIC, { recursive: true });
  fs.writeFileSync(OUTJSON, JSON.stringify(files, null, 2), "utf8");
  fs.writeFileSync(
    OUTJSON_NARASHIMA,
    JSON.stringify(narashimaFiles, null, 2),
    "utf8"
  );
  console.log(`\n  ✅  Written → ${OUTJSON}`);
  console.log(`  ✅  Written → ${OUTJSON_NARASHIMA}`);
  console.log(line + "\n");

  return { imgDir, files, narashimaDir, narashimaFiles };
}

/* ─────────────────────────────────────────────────────────────
   --gen  MODE  — generate and exit
───────────────────────────────────────────────────────────── */
if (process.argv.includes("--gen") || process.argv.includes("--generate")) {
  generateJson();
  process.exit(0);
}

/* ─────────────────────────────────────────────────────────────
   SERVER START — generate first, then serve
───────────────────────────────────────────────────────────── */
const { imgDir: IMGS_DIR, narashimaDir: NARASHIMA_DIR } = generateJson();

// Ensure NRJD_Pics exists (first-time hint)
if (!IMGS_DIR) {
  fs.mkdirSync(path.join(PUBLIC, "NRJD_Pics"), { recursive: true });
}
if (!NARASHIMA_DIR) {
  fs.mkdirSync(path.join(PUBLIC, "NarashimaDev_pics"), { recursive: true });
}

const server = http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");

  const rawUrl = decodeURIComponent(req.url.split("?")[0]);

  /* ── API: list images live ─────────────────────────────── */
  if (rawUrl.startsWith("/api/images")) {
    const mode = new URL(req.url, "http://localhost").searchParams.get("type");
    const dir = mode === "nr" ? findNarashimaImgDir() : findImgDir();
    const files = listImages(dir);
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(files));
    return;
  }

  /* ── API: force regenerate JSON ────────────────────────── */
  if (rawUrl === "/api/refresh" && req.method === "POST") {
    const { files } = generateJson();
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, count: files.length }));
    return;
  }

  /* ── NRJD_Pics — serve from wherever the folder actually is ── */
  if (rawUrl.startsWith("/NRJD_Pics/")) {
    const imgName = rawUrl.replace("/NRJD_Pics/", "");
    const imgDir = findImgDir();
    if (!imgDir) {
      res.writeHead(404);
      res.end("Folder not found");
      return;
    }
    const filePath = path.join(imgDir, imgName);
    // Security: stay inside imgDir
    if (!filePath.startsWith(imgDir)) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end("Not Found");
        return;
      }
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, {
        "Content-Type": CONTENT_TYPES[ext] || "application/octet-stream",
        "Cache-Control": "public, max-age=3600",
      });
      res.end(data);
    });
    return;
  }

  if (rawUrl.startsWith("/NarashimaDev_pics/")) {
    const imgName = rawUrl.replace("/NarashimaDev_pics/", "");
    const imgDir = findNarashimaImgDir();
    if (!imgDir) {
      res.writeHead(404);
      res.end("Folder not found");
      return;
    }
    const filePath = path.join(imgDir, imgName);
    if (!filePath.startsWith(imgDir)) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end("Not Found");
        return;
      }
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, {
        "Content-Type": CONTENT_TYPES[ext] || "application/octet-stream",
        "Cache-Control": "public, max-age=3600",
      });
      res.end(data);
    });
    return;
  }

  /* ── Static files from public/ ─────────────────────────── */
  const rel = rawUrl === "/" ? "index.html" : rawUrl.replace(/^\/+/, "");
  const filePath = path.normalize(path.join(PUBLIC, rel));

  // Security: stay inside PUBLIC
  if (!filePath.startsWith(PUBLIC + path.sep) && filePath !== PUBLIC) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  let target = filePath;
  try {
    if (fs.statSync(target).isDirectory())
      target = path.join(target, "index.html");
  } catch {}

  const ext = path.extname(target).toLowerCase();
  const contentType = CONTENT_TYPES[ext] || "application/octet-stream";
  const cacheCtrl = [".html", ".json"].includes(ext)
    ? "no-cache"
    : "public, max-age=3600";

  fs.readFile(target, (err, data) => {
    if (err) {
      res.writeHead(err.code === "ENOENT" ? 404 : 500);
      res.end(err.code === "ENOENT" ? "Not Found" : "Server Error");
      return;
    }
    res.writeHead(200, {
      "Content-Type": contentType,
      "Cache-Control": cacheCtrl,
    });
    res.end(data);
  });
});

server.listen(PORT, () => {
  const line = "─".repeat(52);
  console.log(`${line}`);
  console.log(`🔔  Japa Session Tool  →  http://localhost:${PORT}`);
  console.log(`${line}`);
  console.log(`    Space/Enter  Start / Pause`);
  console.log(`    R            Reset`);
  console.log(`    N            Next participant`);
  console.log(`    S            Settings`);
  console.log(`    F            Fullscreen`);
  console.log(`${line}\n`);
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE")
    console.error(`❌  Port ${PORT} busy. Run: PORT=3000 node server.js`);
  else console.error("Server error:", err);
  process.exit(1);
});
