/**
 * importExcel.js — Import attendance-db.xlsx into MongoDB
 *
 * Sheets mapped:
 *   Config  → Config collection (area, subArea, frequency, programType, language, day)
 *   cred    → User collection (owner accounts)
 *   tab1    → Program collection
 *   tab2    → Devotee + ProgramNamesOnly collections
 *   tab3    → Attendance collection (raw attendance rows)
 *   tab4    → AttendanceSummary collection
 *   tab5    → Participant collection (shiksha biodata)
 *   tab6    → Certification + Course collections
 */

require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const mongoose = require("mongoose");
const XLSX = require("xlsx");
const bcrypt = require("bcryptjs");
const path = require("path");

const User = require("../models/User");
const Config = require("../models/Config");
const Program = require("../models/Program");
const Devotee = require("../models/Devotee");
const ProgramNamesOnly = require("../models/ProgramNamesOnly");
const Attendance = require("../models/Attendance");
const AttendanceSummary = require("../models/AttendanceSummary");
const Participant = require("../models/Participant");
const Course = require("../models/Course");
const Certification = require("../models/Certification");

const XLSX_PATH = path.resolve(__dirname, "../../attendance-db.xlsx");

// ── helpers ──────────────────────────────────────────────────────
function s(v) { return v != null ? String(v).trim() : ""; }
function parseDate(v) {
  if (!v) return null;
  if (v instanceof Date) return v;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

const LEVEL_NORM = {
  "shraddhavan": "Shraddhavan",
  "krishna sevak": "Krishna Sevak",
  "krishna sadhak": "Krishna Sadhak",
  "srila prabhupada ashraya": "Srila Prabhupada Ashraya",
  "sp ashraya": "Srila Prabhupada Ashraya",
  "srila guru charana ashraya": "Srila Guru Charana Ashraya",
  "guru ashraya": "Srila Guru Charana Ashraya",
  "none": "None",
  "": "None",
};
function normLevel(v) {
  const k = s(v).toLowerCase();
  return LEVEL_NORM[k] || "None";
}

// ── MAIN ─────────────────────────────────────────────────────────
async function main() {
  console.log("⏳ Connecting to MongoDB…");
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ Connected");

  const wb = XLSX.readFile(XLSX_PATH);
  function sheet(name) {
    const ws = wb.Sheets[name];
    if (!ws) { console.warn(`⚠️  Sheet "${name}" not found`); return []; }
    return XLSX.utils.sheet_to_json(ws, { defval: "" });
  }

  // Keep reference to superadmin for createdBy
  const superAdmin = await User.findOne({ isSuperAdmin: true });
  const adminId = superAdmin?._id || null;

  // ═══════════════════════════════════════════════════════════════
  // 1. CONFIG
  // ═══════════════════════════════════════════════════════════════
  console.log("\n── Importing Config ──");
  const cfgRows = sheet("Config");
  const configMap = { area: new Set(), subArea: new Set(), frequency: new Set(), programType: new Set(), language: new Set(), day: new Set() };
  for (const r of cfgRows) {
    if (s(r.AREA)) configMap.area.add(s(r.AREA));
    if (s(r.SUB_AREA)) configMap.subArea.add(s(r.SUB_AREA));
    if (s(r.FREQUENCY)) configMap.frequency.add(s(r.FREQUENCY));
    if (s(r.TYPE_OF_PROGRAM)) configMap.programType.add(s(r.TYPE_OF_PROGRAM));
    if (s(r.LANGUAGE)) configMap.language.add(s(r.LANGUAGE));
    if (s(r.DAY)) configMap.day.add(s(r.DAY));
  }
  for (const [type, valSet] of Object.entries(configMap)) {
    const vals = [...valSet];
    if (!vals.length) continue;
    await Config.findOneAndUpdate({ type }, { type, values: vals }, { upsert: true });
    console.log(`  ${type}: ${vals.length} values`);
  }

  // ═══════════════════════════════════════════════════════════════
  // 2. USERS (owners from cred sheet + Config OWNER columns)
  // ═══════════════════════════════════════════════════════════════
  console.log("\n── Importing Users (owners) ──");
  const credRows = sheet("cred");
  // Build owner label map from Config sheet
  const ownerLabelMap = {};
  for (const r of cfgRows) {
    const val = s(r.OWNER_VALUE);
    const label = s(r.OWNER_LABEL);
    if (val) ownerLabelMap[val] = label || val;
  }

  const userMap = {}; // OWNER_VALUE → User._id
  // Keep superadmin mapped too
  if (superAdmin) userMap["__superadmin__"] = superAdmin._id;

  for (const cr of credRows) {
    const ownerId = s(cr.id);
    if (!ownerId) continue;
    const name = ownerLabelMap[ownerId] || ownerId;
    const email = `${ownerId.toLowerCase()}@nrjd.local`;
    const pass = s(cr.pass) || "NRJD@default";

    let user = await User.findOne({ email });
    if (!user) {
      const hash = await bcrypt.hash(pass, 12);
      user = await User.create({
        name,
        email,
        role: "owner",
        provider: "local",
        passwordHash: hash,
        isActive: true,
        mustChangePassword: true,
        programKeyPrefix: ownerId.substring(0, 5).toUpperCase(),
        createdBy: adminId,
      });
    }
    userMap[ownerId] = user._id;
  }
  console.log(`  ${Object.keys(userMap).length - (superAdmin ? 1 : 0)} owner accounts`);

  // ═══════════════════════════════════════════════════════════════
  // 3. PROGRAMS (tab1)
  // ═══════════════════════════════════════════════════════════════
  console.log("\n── Importing Programs (tab1) ──");
  const tab1Rows = sheet("tab1");
  const programMap = {}; // programKey → Program._id
  let progCount = 0;

  for (const r of tab1Rows) {
    const pk = s(r["PROGRAM KEY"]);
    if (!pk) continue;

    const ownerCode = s(r.PROGRAM_OWNER);
    const ownerId = userMap[ownerCode] || adminId;

    const existing = await Program.findOne({ programKey: pk });
    if (existing) {
      programMap[pk] = existing._id;
      continue;
    }

    try {
      const prog = await Program.create({
        programKey: pk,
        area: s(r.AREA) || "UNKNOWN",
        subArea: s(r.SUB_AREA) || "UNKNOWN",
        frequency: s(r.FREQUENCY) || "Weekly",
        programType: s(r.TYPE_OF_PROGRAM) || "BV",
        language: s(r.LANGUAGE) || "ENGLISH",
        programOwner: ownerId,
        isVirtual: s(r.VIRTUAL).toLowerCase() === "yes",
        startDate: parseDate(r.PROGRAM_START_DATE) || new Date("2024-01-01"),
        day: s(r.DAY) || "SATURDAY",
        time: s(r.TIME) || "TBD",
        actFlag: s(r.ACT_FLG).toUpperCase() === "YES" ? "active" : "inactive",
        promoted: s(r.PROMOTED),
        createdBy: adminId,
      });
      programMap[pk] = prog._id;
      progCount++;
    } catch (e) {
      console.warn(`  ⚠️  Program ${pk}: ${e.message}`);
    }
  }
  console.log(`  ${progCount} programs created`);

  // ═══════════════════════════════════════════════════════════════
  // 4. DEVOTEES + ProgramNamesOnly (tab2)
  // ═══════════════════════════════════════════════════════════════
  console.log("\n── Importing Devotees (tab2) ──");
  const ws2 = wb.Sheets["tab2"];
  if (ws2) {
    const raw2 = XLSX.utils.sheet_to_json(ws2, { header: 1, defval: "" });
    const headers2 = raw2[0] || [];
    let devCount = 0;

    for (let col = 0; col < headers2.length; col++) {
      const pk = s(headers2[col]);
      if (!pk) continue;
      const progId = programMap[pk];
      if (!progId) continue;

      const names = [];
      for (let row = 1; row < raw2.length; row++) {
        const nm = s(raw2[row][col]);
        if (nm) names.push(nm);
      }

      // Create Devotees
      for (const nm of names) {
        const exists = await Devotee.findOne({ program: progId, name: nm });
        if (!exists) {
          await Devotee.create({ program: progId, name: nm });
          devCount++;
        }
      }

      // ProgramNamesOnly
      if (names.length) {
        await ProgramNamesOnly.findOneAndUpdate(
          { program: progId },
          { program: progId, names },
          { upsert: true }
        );
      }
    }
    console.log(`  ${devCount} devotees created`);
  }

  // ═══════════════════════════════════════════════════════════════
  // 5. ATTENDANCE (tab3) — bulk insert in batches
  // ═══════════════════════════════════════════════════════════════
  console.log("\n── Importing Attendance (tab3) — this may take a moment ──");
  const tab3Rows = sheet("tab3");
  let attBatch = [];
  let attCount = 0;

  for (const r of tab3Rows) {
    const pk = s(r["PROGRAM KEY"]);
    if (!pk) continue;
    const progId = programMap[pk];
    if (!progId) continue;
    const devName = s(r.DEVOTEE);
    if (!devName) continue;
    const dt = parseDate(r.DATE);
    if (!dt) continue;

    const ownerCode = s(r.PROGRAM_OWNER);
    attBatch.push({
      program: progId,
      programKey: pk,
      area: s(r.AREA),
      subArea: s(r.SUB_AREA),
      frequency: s(r.FREQUENCY),
      programType: s(r.TYPE_OF_PROGRAM),
      language: s(r.LANGUAGE),
      programOwner: userMap[ownerCode] || adminId,
      chapter: s(r.CHAPTER),
      hostName: s(r.HOST) || "Unknown",
      devoteeName: devName,
      date: dt,
      status: s(r.ATTENDANCE).toLowerCase() === "present" ? "present" : "absent",
    });

    if (attBatch.length >= 500) {
      await Attendance.insertMany(attBatch, { ordered: false }).catch(() => {});
      attCount += attBatch.length;
      attBatch = [];
      if (attCount % 5000 === 0) process.stdout.write(`  ${attCount}…`);
    }
  }
  if (attBatch.length) {
    await Attendance.insertMany(attBatch, { ordered: false }).catch(() => {});
    attCount += attBatch.length;
  }
  console.log(`\n  ${attCount} attendance records`);

  // ═══════════════════════════════════════════════════════════════
  // 6. ATTENDANCE SUMMARY (tab4) — columns are misaligned vs header
  //    Actual data layout: ProgramKey, Area, SubArea, Freq, Type, Lang, Owner, DevoteeName, TotalSessions, Attended, Pct
  // ═══════════════════════════════════════════════════════════════
  console.log("\n── Importing AttendanceSummary (tab4) ──");
  const ws4 = wb.Sheets["tab4"];
  let sumCount = 0;
  if (ws4) {
    const raw4 = XLSX.utils.sheet_to_json(ws4, { header: 1, defval: "" });
    for (let i = 1; i < raw4.length; i++) {
      const row = raw4[i];
      const pk = s(row[0]);
      if (!pk) continue;
      const progId = programMap[pk];
      if (!progId) continue;
      const devName = s(row[7]); // column 7 = devotee name
      if (!devName) continue;

      const ownerCode = s(row[6]);
      const total = Number(row[8]) || 0;
      const attended = Number(row[9]) || 0;
      const pct = total > 0 ? Math.round((attended / total) * 100) : 0;

      try {
        await AttendanceSummary.findOneAndUpdate(
          { program: progId, devoteeName: devName },
          {
            program: progId,
            programKey: pk,
            area: s(row[1]),
            subArea: s(row[2]),
            frequency: s(row[3]),
            programType: s(row[4]),
            language: s(row[5]),
            programOwner: userMap[ownerCode] || adminId,
            devoteeName: devName,
            totalSessions: total,
            attended,
            percentage: pct,
          },
          { upsert: true }
        );
        sumCount++;
      } catch (e) { /* skip duplicates */ }
    }
  }
  console.log(`  ${sumCount} summary records`);

  // ═══════════════════════════════════════════════════════════════
  // 7. PARTICIPANTS (tab5) — shiksha biodata
  // ═══════════════════════════════════════════════════════════════
  console.log("\n── Importing Participants (tab5) ──");
  const tab5Rows = sheet("tab5");
  let partCount = 0;

  for (const r of tab5Rows) {
    const name = s(r.NAME);
    if (!name) continue;
    const activeFlg = s(r.ACTIVE_FLG).toUpperCase();
    if (activeFlg === "N") continue; // only import active rows

    const shikshaCode = s(r["SIKSHA CODE"]) || undefined;
    const pk = s(r["PROGRAM KEY"]);
    const ownerCode = s(r["BV LEADER"]);
    const level = normLevel(r["SIKSHA STATUS"]);
    const gender = s(r.SEX);
    let genderNorm = "";
    if (gender) {
      const gl = gender.toLowerCase();
      if (gl === "m" || gl === "male") genderNorm = "Male";
      else if (gl === "f" || gl === "female") genderNorm = "Female";
      else genderNorm = "Other";
    }

    // Skip if shikshaCode already exists
    if (shikshaCode) {
      const exists = await Participant.findOne({ shikshaCode });
      if (exists) continue;
    }

    try {
      await Participant.create({
        name,
        shikshaCode: shikshaCode || undefined,
        programKey: pk,
        aadharNumber: s(r.AADHAR_NO),
        bvLeader: ownerCode,
        gender: genderNorm,
        email: s(r["EMAIL ID"]).toLowerCase(),
        contactNumber: s(r["CONTACT NUMBER"]),
        dob: parseDate(r["DATE OF BIRTH"]),
        address: s(r["CONTACT ADDRESS"]),
        language: s(r["PREFERRED LANGUAGE OF COMM"]),
        currentLevel: level,
        activeFlag: true,
        programOwner: userMap[ownerCode] || adminId,
        createdBy: adminId,
      });
      partCount++;
    } catch (e) {
      // Duplicate shikshaCode or other validation error — skip
      if (!e.message.includes("duplicate")) {
        console.warn(`  ⚠️  Participant ${name}: ${e.message.substring(0, 80)}`);
      }
    }
  }
  console.log(`  ${partCount} participants created`);

  // ═══════════════════════════════════════════════════════════════
  // 8. COURSES + CERTIFICATIONS (tab6)
  // ═══════════════════════════════════════════════════════════════
  console.log("\n── Importing Certifications (tab6) ──");
  const tab6Rows = sheet("tab6");

  // Ensure one Course per level
  const courseMap = {}; // level → Course._id
  const levels = ["Shraddhavan", "Krishna Sevak", "Krishna Sadhak", "Srila Prabhupada Ashraya", "Srila Guru Charana Ashraya"];
  for (const lvl of levels) {
    let c = await Course.findOne({ name: `${lvl} Course` });
    if (!c) {
      c = await Course.create({ name: `${lvl} Course`, level: lvl, createdBy: adminId });
    }
    courseMap[lvl] = c._id;
  }

  let certCount = 0;
  for (const r of tab6Rows) {
    const shikshaCode = s(r["SIKSHA CODE"]);
    const name = s(r.NAME);
    if (!shikshaCode || !name) continue;

    const proposedRaw = s(r["PROPOSED LEVEL"]);
    const proposed = normLevel(proposedRaw);
    if (proposed === "None") continue;

    const currentRaw = s(r["CURRENT LEVEL"]);
    const current = normLevel(currentRaw);

    const courseId = courseMap[proposed];
    if (!courseId) continue;

    // Find participant
    let participant = await Participant.findOne({ shikshaCode });
    if (!participant) {
      // Try by name + programKey
      const pk = s(r["PROGRAM KEY"]);
      participant = await Participant.findOne({ name: { $regex: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }, programKey: pk });
    }
    if (!participant) continue;

    const certDate = parseDate(r.DATE) || new Date();

    try {
      await Certification.create({
        participant: participant._id,
        course: courseId,
        certificationLevel: proposed,
        certificationDate: certDate,
        recommendedBy: s(r.RECOMENDEDBY),
        currentLevelBefore: current,
        newLevelAfter: proposed,
        chanting: s(r.CHANTING),
        books: s(r["SP BOOKS"]),
        commitments: s(r.COMMITMENTS),
        seva: s(r.SEVA),
        declarationAccepted: true,
        createdBy: adminId,
      });
      certCount++;

      // Update participant's current level if certification promotes them
      const levelIdx = levels.indexOf(proposed);
      const currentIdx = levels.indexOf(participant.currentLevel);
      if (levelIdx > currentIdx) {
        participant.currentLevel = proposed;
        await participant.save();
      }
    } catch (e) {
      // skip
    }
  }
  console.log(`  ${certCount} certifications created`);

  // ═══════════════════════════════════════════════════════════════
  // DONE
  // ═══════════════════════════════════════════════════════════════
  console.log("\n🎉 Import complete!");
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Import failed:", err);
  process.exit(1);
});
