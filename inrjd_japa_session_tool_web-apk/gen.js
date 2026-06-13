#!/usr/bin/env node
"use strict";
/**
 * gen.js  —  Standalone image-list.json generator
 *
 * Usage:  node gen.js
 *
 * Scans for NRJD_Pics in:
 *   1. ./public/NRJD_Pics   (preferred — gets bundled in APK)
 *   2. ./NRJD_Pics           (root / legacy location)
 *
 * Writes: ./public/image-list.json
 */

const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const PUBLIC = path.join(ROOT, "public");
const OUT = path.join(PUBLIC, "image-list.json");

const IMG_CANDIDATES = [
  path.join(PUBLIC, "NRJD_Pics"),
  path.join(ROOT, "NRJD_Pics"),
];

const SEP = "═".repeat(54);

console.log(`\n${SEP}`);
console.log("  🔔  Japa Session — Image List Generator");
console.log(SEP);

/* ── Find NRJD_Pics ──────────────────────────────────────── */
let imgDir = null;
for (const c of IMG_CANDIDATES) {
  if (fs.existsSync(c)) {
    imgDir = c;
    break;
  }
}

if (!imgDir) {
  console.log("\n  ❌  NRJD_Pics folder not found anywhere!\n");
  console.log("  Create one of these folders and add your images:\n");
  IMG_CANDIDATES.forEach((c) => console.log(`     📁  ${c}`));
  console.log("\n  Then run:  node gen.js\n");
  console.log(SEP + "\n");

  // Still write empty JSON so the app doesn't 404 on it
  fs.mkdirSync(PUBLIC, { recursive: true });
  fs.writeFileSync(OUT, "[]", "utf8");
  console.log("  Written empty image-list.json (add images and re-run).\n");
  process.exit(0);
}

console.log(`\n  📁  Scanning: ${imgDir}\n`);

/* ── List images ─────────────────────────────────────────── */
let files = [];
try {
  files = fs
    .readdirSync(imgDir)
    .filter((f) => /\.(jpe?g|png|webp)$/i.test(f))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
} catch (e) {
  console.error("  ❌  Could not read folder:", e.message);
  process.exit(1);
}

if (files.length === 0) {
  console.log("  ⚠️   No images found (.jpg / .jpeg / .png / .webp)");
  console.log("       Add images to the folder and run again.\n");
} else {
  console.log(`  ✅  Found ${files.length} image(s):\n`);
  files.forEach((f, i) => {
    const num = String(i + 1).padStart(3, " ");
    const size = getSize(path.join(imgDir, f));
    console.log(`  ${num}.  ${f}  (${size})`);
  });
  console.log("");
}

/* ── Write JSON ──────────────────────────────────────────── */
fs.mkdirSync(PUBLIC, { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(files, null, 2), "utf8");
console.log(`  📄  Written → ${OUT}`);

/* ── Warn if images aren't inside public/ ───────────────── */
if (!imgDir.startsWith(PUBLIC)) {
  console.log(`\n  ⚠️   WARNING: Your NRJD_Pics is in the project root.`);
  console.log(
    `       Images WILL show in the browser (dev server serves them).`
  );
  console.log(`       But for the Android APK, images must be inside public/:`);
  console.log(`\n       Move folder:  mv NRJD_Pics public/NRJD_Pics\n`);
  console.log(`       Then run:     node gen.js\n`);
}

console.log(SEP + "\n");

/* ── Helper ──────────────────────────────────────────────── */
function getSize(filePath) {
  try {
    const bytes = fs.statSync(filePath).size;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  } catch {
    return "?";
  }
}
