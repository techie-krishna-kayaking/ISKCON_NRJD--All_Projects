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
const https = require("https");
const fs = require("fs");
const path = require("path");

/* ─────────────────────────────────────────────────────────────
   GAS PROXY — fetch GAS URLs server-side, strip iframe-blocking headers
   so they can be embedded in iframes without X-Frame-Options issues
───────────────────────────────────────────────────────────── */
const GAS_URLS = {
  prayers:    "https://script.google.com/macros/s/AKfycbwx9Gdxw9GshzqyojCrlPLaF-AClhjqdj_SaN5ZxhZn_jQWoMoJjRkB-UdmXX0o7k99Tg/exec",
  attendance: "https://script.google.com/macros/s/AKfycbzI_UTo16Sovo1bGKQDy1LOviEKrQNOkhkHa5jQK25dgMYaK3U3xGaUkNJQw3KRVL1W/exec",
};

function proxyGAS(targetUrl, res, hops) {
  if (hops > 8) { res.writeHead(502); res.end("Too many redirects"); return; }
  const parsed = new URL(targetUrl);
  const mod = parsed.protocol === "https:" ? https : http;
  const opts = {
    hostname: parsed.hostname,
    path: parsed.pathname + parsed.search,
    headers: {
      "User-Agent": "Mozilla/5.0 (Linux; Android 11; Pixel) AppleWebKit/537.36 Chrome/109 Mobile Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,*/*;q=0.9",
      "Accept-Language": "en-US,en;q=0.9",
    },
  };
  mod.get(opts, (up) => {
    if (up.statusCode >= 300 && up.statusCode < 400 && up.headers.location) {
      up.resume();
      const next = up.headers.location.startsWith("http")
        ? up.headers.location
        : new URL(up.headers.location, targetUrl).href;
      return proxyGAS(next, res, hops + 1);
    }
    const hdrs = {};
    for (const [k, v] of Object.entries(up.headers)) {
      const lk = k.toLowerCase();
      if (lk === "x-frame-options") continue;
      if (lk === "content-security-policy") continue;
      if (lk === "transfer-encoding") continue;
      if (lk === "content-length") continue; // we may modify body
      hdrs[k] = v;
    }
    const isHtml = (up.headers["content-type"] || "").includes("text/html");
    if (isHtml) {
      // Collect full response; inject base href + MutationObserver to fix relative URLs
      // and rewrite GAS's inner sandboxFrame through our proxy
      const baseTag = `<base href="https://script.google.com/">`;
      const observe = `<script>(function(){` +
        `var _orig=window.location.protocol+'//'+window.location.host;` +
        `var _ob=new MutationObserver(function(ms){` +
        `ms.forEach(function(m){m.addedNodes.forEach(function(n){` +
        `if(n.nodeName==='IFRAME'&&n.src&&n.src.includes('googleusercontent.com')){` +
        `n.src=_orig+'/proxy/gas-inner?url='+encodeURIComponent(n.src);}` +
        `});});});` +
        `_ob.observe(document,{childList:true,subtree:true});` +
        `})();</script>`;
      const chunks = [];
      up.on("data", (c) => chunks.push(c));
      up.on("end", () => {
        let html = Buffer.concat(chunks).toString("utf8");
        if (html.includes("<head>")) {
          html = html.replace("<head>", "<head>" + baseTag + observe);
        } else if (html.includes("</head>")) {
          html = html.replace("</head>", baseTag + observe + "</head>");
        } else {
          html = baseTag + observe + html;
        }
        res.writeHead(up.statusCode, { ...hdrs, "content-type": "text/html; charset=utf-8" });
        res.end(html);
      });
    } else {
      res.writeHead(up.statusCode, hdrs);
      up.pipe(res);
    }
  }).on("error", (e) => { res.writeHead(502); res.end("Proxy error: " + e.message); });
}

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

  /* ── GAS Proxy — serve GAS pages without iframe-blocking headers ── */
  if (rawUrl.startsWith("/proxy/")) {
    const key = rawUrl.replace("/proxy/", "").split("/")[0];
    // Inner GAS sandbox frame (script.googleusercontent.com)
    if (key === "gas-inner") {
      const innerUrl = new URL(req.url, "http://localhost").searchParams.get("url");
      if (!innerUrl || !innerUrl.includes("googleusercontent.com")) {
        res.writeHead(403); res.end("Forbidden"); return;
      }
      return proxyGAS(decodeURIComponent(innerUrl), res, 0);
    }
    const gasUrl = GAS_URLS[key];
    if (!gasUrl) { res.writeHead(404); res.end("Unknown proxy route"); return; }
    return proxyGAS(gasUrl, res, 0);
  }

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
