const CONFIG = {
  // TODO: Replace with your Google Sheet ID before deployment.
  SHEET_ID: "1yzEVh3I6D_iWA6GfmzB1lIs3vzP1HX4HXJ7zRVwokas",
  SHEET_NAMES: ["finalists", "fancydress"],
  MAIN_USER_CODE: "108", // Change this when needed.
  SEARCHABLE_COLUMNS: [
    "SchoolCode",
    "SchoolName",
    "Group",
    "COMPETITION",
    "RANK",
    "NAME",
    "CLASS",
    "SECTION",
    "PHNO",
    "COUPON",
    "SCORE",
    "TIMESTAMP",
    "ATTENDANCE",
  ],
  PERFORMANCE_QUEUE_COLUMN: "SCORE",
  EVENT_BUTTONS: [
    { key: "G1-Coloring", label: "G1-Coloring", match: ["g1-coloring", "g1 coloring"] },
    { key: "G1-FancyDress", label: "G1-fancy dress", match: ["g1-fancy dress", "g1 fancy dress", "g1-fancydress"] },
    { key: "G2-Coloring", label: "G2-coloring", match: ["g2-coloring", "g2 coloring"] },
    { key: "G2-FancyDress", label: "G2-fancy dress", match: ["g2-fancy dress", "g2 fancy dress", "g2-fancydress"] },
    { key: "G3-Painting", label: "G3-painting", match: ["g3-painting", "g3 painting"] },
    { key: "G3-Music", label: "G3-music", match: ["g3-music", "g3 music"] },
    { key: "G4-Quiz", label: "G4-Quiz", match: ["g4-quiz", "g4 quiz"] },
  ],
  USER_AUTO_REFRESH_SECONDS: 10,
};

const COLUMN_ALIASES = {
  SCHOOLCODE: ["SCHOOLCODE", "CODE", "SCHOOL_CODE"],
  SCHOOLNAME: ["SCHOOLNAME", "SCHOOL", "SCHOOL_NAME"],
  PHNO: ["PHNO", "PHONE", "MOBILE", "PHONE_NUMBER"],
  NAME: ["NAME", "STUDENTNAME", "STUDENT_NAME"],
  CLASS: ["CLASS", "STD", "GRADE"],
  SECTION: ["SECTION", "SEC"],
};

function doGet() {
  return HtmlService.createHtmlOutputFromFile("Index")
    .setTitle("Nandotsava 2026 Desk App")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function getBootstrapData() {
  return {
    searchableColumns: CONFIG.SEARCHABLE_COLUMNS,
    events: CONFIG.EVENT_BUTTONS,
    autoRefreshSeconds: CONFIG.USER_AUTO_REFRESH_SECONDS,
    performanceQueueColumn: CONFIG.PERFORMANCE_QUEUE_COLUMN,
  };
}

function verifyMainUserCode(code) {
  return String(code || "").trim() === CONFIG.MAIN_USER_CODE;
}

function searchParticipants(payload) {
  const safePayload = payload || {};
  const query = normalizeText_(safePayload.query);
  const selectedColumn = String(safePayload.column || "ALL").trim();
  const limit = Math.max(1, Math.min(Number(safePayload.limit) || 100, 300));

  const filters = {
    schoolCode: normalizeText_(safePayload.schoolCode),
    schoolName: normalizeText_(safePayload.schoolName),
    competition: normalizeText_(safePayload.competition),
  };

  const rows = getAllRows_();
  const filteredRows = rows.filter((row) => {
    if (filters.schoolCode && !normalizeText_(row.schoolCode).includes(filters.schoolCode)) return false;
    if (filters.schoolName && !normalizeText_(row.schoolName).includes(filters.schoolName)) return false;
    if (filters.competition && !normalizeText_(row.competition).includes(filters.competition)) return false;

    if (!query) return true;

    if (selectedColumn !== "ALL") {
      const rawVal = getColumnValueByName_(row, selectedColumn);
      return normalizeText_(rawVal).includes(query);
    }

    return CONFIG.SEARCHABLE_COLUMNS.some((col) => normalizeText_(getColumnValueByName_(row, col)).includes(query));
  });

  const suggestions = buildSuggestions_(filteredRows, selectedColumn, query);

  const results = filteredRows.slice(0, limit).map((row) => ({
    sheetName: row.sheetName,
    rowNumber: row.rowNumber,
    schoolCode: row.schoolCode,
    schoolName: row.schoolName,
    group: row.group,
    competition: row.competition,
    rank: row.rank,
    name: row.name,
    className: row.className,
    section: row.section,
    phno: row.phno,
    coupon: row.coupon,
    score: row.score,
    timestamp: row.timestamp,
    attendance: row.attendance,
    canSaveCoupon: !row.coupon && !row.timestamp,
  }));

  return {
    results,
    suggestions,
    totalMatched: filteredRows.length,
  };
}

function saveCouponAndTimestamp(payload) {
  const safePayload = payload || {};
  const sheetName = String(safePayload.sheetName || "").trim();
  const rowNumber = Number(safePayload.rowNumber);
  const coupon = String(safePayload.coupon || "").trim();

  if (!sheetName || !rowNumber || !coupon) {
    return { ok: false, message: "Sheet, row, and coupon are required." };
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const ss = getSpreadsheet_();
    const targetSheet = ss.getSheetByName(sheetName);
    if (!targetSheet) return { ok: false, message: "Invalid sheet name." };

    const headers = getHeaders_(targetSheet);
    const idxCoupon = findHeaderIndex_(headers, "COUPON");
    const idxTimestamp = findHeaderIndex_(headers, "TIMESTAMP");

    if (idxCoupon < 0 || idxTimestamp < 0) {
      return { ok: false, message: "COUPON or TIMESTAMP column missing in sheet." };
    }

    const rowVals = targetSheet.getRange(rowNumber, 1, 1, headers.length).getValues()[0];
    const existingCoupon = String(rowVals[idxCoupon] || "").trim();
    const existingTimestamp = String(rowVals[idxTimestamp] || "").trim();

    if (existingCoupon || existingTimestamp) {
      return { ok: false, message: "Already saved for this participant. Overwrite is not allowed." };
    }

    const duplicateCouponInfo = findDuplicateValueAcrossSheets_("COUPON", coupon);
    if (duplicateCouponInfo.found) {
      return { ok: false, message: "Coupon already exists. Please enter a unique coupon." };
    }

    const nowText = formatNow_();
    const duplicateTimestampInfo = findDuplicateValueAcrossSheets_("TIMESTAMP", nowText);
    if (duplicateTimestampInfo.found) {
      return { ok: false, message: "Timestamp conflict detected. Please try again." };
    }

    targetSheet.getRange(rowNumber, idxCoupon + 1).setValue(coupon);
    targetSheet.getRange(rowNumber, idxTimestamp + 1).setValue(nowText);

    return {
      ok: true,
      message: "Coupon and timestamp saved.",
      timestamp: nowText,
      stats: getDashboardStats_(),
    };
  } catch (err) {
    return { ok: false, message: "Failed to save: " + err.message };
  } finally {
    lock.releaseLock();
  }
}

function getDashboardStats() {
  return getDashboardStats_();
}

function getEventParticipants(eventKey) {
  const event = CONFIG.EVENT_BUTTONS.find((e) => e.key === eventKey);
  if (!event) return { participants: [] };

  const parsed = parseEventKey_(event.key);

  const rows = getAllRows_()
    .filter((row) => row.timestamp)
    .filter((row) => {
      const groupMatches = parsed.groupToken
        ? extractGroupToken_(row.group) === parsed.groupToken
        : true;

      const competitionMatches = parsed.competitionToken
        ? normalizeEventCompetition_(row.competition).includes(parsed.competitionToken)
        : true;

      if (groupMatches && competitionMatches) {
        return true;
      }

      // Fallback to legacy match list for any custom competition spellings.
      const comp = normalizeText_(row.competition);
      return event.match.some((m) => comp.includes(normalizeText_(m)));
    })
    .sort((a, b) => {
      const aDone = !!a.attendance;
      const bDone = !!b.attendance;

      // Keep pending performers on top and move completed performers to the bottom.
      if (aDone !== bDone) return aDone ? 1 : -1;

      return compareTimestampAsc_(a.timestamp, b.timestamp);
    });

  const participants = rows.map((row) => ({
    sheetName: row.sheetName,
    rowNumber: row.rowNumber,
    name: row.name,
    schoolName: row.schoolName,
    schoolCode: row.schoolCode,
    className: row.className,
    section: row.section,
    competition: row.competition,
    coupon: row.coupon,
    timestamp: row.timestamp,
    attendance: row.attendance,
    queue: row.score,
    canMarkAttendance: !row.attendance,
  }));

  return { participants };
}

function markAttendance(payload) {
  const safePayload = payload || {};
  const sheetName = String(safePayload.sheetName || "").trim();
  const rowNumber = Number(safePayload.rowNumber);
  const queue = String(safePayload.queue || "").trim();

  if (!sheetName || !rowNumber) {
    return { ok: false, message: "Sheet and row are required." };
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const ss = getSpreadsheet_();
    const targetSheet = ss.getSheetByName(sheetName);
    if (!targetSheet) return { ok: false, message: "Invalid sheet name." };

    const headers = getHeaders_(targetSheet);
    const idxTimestamp = findHeaderIndex_(headers, "TIMESTAMP");
    const idxAttendance = findHeaderIndex_(headers, "ATTENDANCE");
    const idxQueue = findHeaderIndex_(headers, CONFIG.PERFORMANCE_QUEUE_COLUMN);

    if (idxTimestamp < 0 || idxAttendance < 0) {
      return { ok: false, message: "TIMESTAMP or ATTENDANCE column missing in sheet." };
    }

    const rowVals = targetSheet.getRange(rowNumber, 1, 1, headers.length).getValues()[0];
    const existingTimestamp = String(rowVals[idxTimestamp] || "").trim();
    const existingAttendance = String(rowVals[idxAttendance] || "").trim();

    if (!existingTimestamp) {
      return { ok: false, message: "Participant has not checked in at MAIN USER desk yet." };
    }

    if (existingAttendance) {
      return { ok: false, message: "Attendance already marked. Overwrite is not allowed." };
    }

    if (idxQueue >= 0 && queue && String(rowVals[idxQueue] || "").trim()) {
      return { ok: false, message: "Performance queue already filled. Overwrite is not allowed." };
    }

    const attendanceTime = formatNow_();
    const duplicateAttendanceTimestamp = findDuplicateValueAcrossSheets_("ATTENDANCE", attendanceTime);
    if (duplicateAttendanceTimestamp.found) {
      return { ok: false, message: "Attendance timestamp conflict detected. Please try again." };
    }

    targetSheet.getRange(rowNumber, idxAttendance + 1).setValue(attendanceTime);
    if (idxQueue >= 0 && queue) {
      targetSheet.getRange(rowNumber, idxQueue + 1).setValue(queue);
    }

    return { ok: true, message: "Attendance marked.", attendanceTime };
  } catch (err) {
    return { ok: false, message: "Failed to mark attendance: " + err.message };
  } finally {
    lock.releaseLock();
  }
}

function getFilterOptions() {
  const rows = getAllRows_();
  return {
    schoolCodes: uniqueSorted_(rows.map((r) => r.schoolCode).filter(Boolean)),
    schoolNames: uniqueSorted_(rows.map((r) => r.schoolName).filter(Boolean)),
    competitions: uniqueSorted_(rows.map((r) => r.competition).filter(Boolean)),
  };
}

function getSpreadsheet_() {
  if (!CONFIG.SHEET_ID || CONFIG.SHEET_ID === "PASTE_YOUR_GOOGLE_SHEET_ID_HERE") {
    throw new Error("Please set CONFIG.SHEET_ID in Code.gs before deployment.");
  }
  return SpreadsheetApp.openById(CONFIG.SHEET_ID);
}

function getHeaders_(sheet) {
  return sheet
    .getRange(1, 1, 1, sheet.getLastColumn())
    .getValues()[0]
    .map((h) => String(h || "").trim());
}

function getAllRows_() {
  const ss = getSpreadsheet_();
  const allRows = [];

  CONFIG.SHEET_NAMES.forEach((sheetName) => {
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) return;

    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();
    if (lastRow < 2 || lastCol < 1) return;

    const headers = getHeaders_(sheet);
    const values = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();

    values.forEach((rowValues, idx) => {
      const obj = {};
      headers.forEach((h, i) => {
        obj[normalizeHeader_(h)] = rowValues[i];
      });

      allRows.push({
        sheetName,
        rowNumber: idx + 2,
        data: obj,
        schoolCode: toSafeString_(getAliasValue_(obj, "SCHOOLCODE")),
        schoolName: toSafeString_(getAliasValue_(obj, "SCHOOLNAME")),
        group: toSafeString_(obj["GROUP"]),
        competition: toSafeString_(obj["COMPETITION"]),
        rank: toSafeString_(obj["RANK"]),
        name: toSafeString_(getAliasValue_(obj, "NAME")),
        className: toSafeString_(getAliasValue_(obj, "CLASS")),
        section: toSafeString_(getAliasValue_(obj, "SECTION")),
        phno: toSafeString_(getAliasValue_(obj, "PHNO")),
        coupon: toSafeString_(obj["COUPON"]),
        score: toSafeString_(obj[normalizeHeader_(CONFIG.PERFORMANCE_QUEUE_COLUMN)]),
        timestamp: toSafeString_(obj["TIMESTAMP"]),
        attendance: toSafeString_(obj["ATTENDANCE"]),
      });
    });
  });

  return allRows;
}

function buildSuggestions_(rows, selectedColumn, query) {
  if (!query) return [];

  const sourceValues = [];
  rows.forEach((row) => {
    if (selectedColumn !== "ALL") {
      sourceValues.push(getColumnValueByName_(row, selectedColumn));
      return;
    }

    CONFIG.SEARCHABLE_COLUMNS.forEach((col) => sourceValues.push(getColumnValueByName_(row, col)));
  });

  const normQuery = normalizeText_(query);
  const suggestions = uniqueSorted_(
    sourceValues
      .map((v) => String(v || "").trim())
      .filter(Boolean)
      .filter((v) => normalizeText_(v).includes(normQuery))
  );

  return suggestions.slice(0, 8);
}

function getColumnValueByName_(row, columnName) {
  const key = normalizeHeader_(columnName);
  const data = row.data || {};
  return toSafeString_(getAliasValue_(data, key));
}

function getAliasValue_(data, canonicalKey) {
  const key = normalizeHeader_(canonicalKey);
  const aliasKeys = COLUMN_ALIASES[key] || [key];

  for (let i = 0; i < aliasKeys.length; i++) {
    const k = normalizeHeader_(aliasKeys[i]);
    if (Object.prototype.hasOwnProperty.call(data, k)) {
      return data[k];
    }
  }

  return "";
}

function findHeaderIndex_(headers, headerName) {
  const target = normalizeHeader_(headerName);
  for (let i = 0; i < headers.length; i++) {
    if (normalizeHeader_(headers[i]) === target) return i;
  }
  return -1;
}

function findDuplicateValueAcrossSheets_(columnName, value) {
  const target = String(value || "").trim();
  if (!target) return { found: false };

  const normTarget = normalizeText_(target);
  const ss = getSpreadsheet_();

  for (let s = 0; s < CONFIG.SHEET_NAMES.length; s++) {
    const sheet = ss.getSheetByName(CONFIG.SHEET_NAMES[s]);
    if (!sheet || sheet.getLastRow() < 2) continue;

    const headers = getHeaders_(sheet);
    const idx = findHeaderIndex_(headers, columnName);
    if (idx < 0) continue;

    const range = sheet.getRange(2, idx + 1, sheet.getLastRow() - 1, 1).getValues();
    for (let r = 0; r < range.length; r++) {
      const cellVal = String(range[r][0] || "").trim();
      if (cellVal && normalizeText_(cellVal) === normTarget) {
        return {
          found: true,
          sheetName: sheet.getName(),
          rowNumber: r + 2,
        };
      }
    }
  }

  return { found: false };
}

function getDashboardStats_() {
  const rows = getAllRows_();
  const normalizedFinalists = normalizeText_("finalists");
  const normalizedFancyDress = normalizeText_("fancydress");

  const finalistsRows = rows.filter((r) => normalizeText_(r.sheetName) === normalizedFinalists);
  const fancyDressRows = rows.filter((r) => normalizeText_(r.sheetName) === normalizedFancyDress);

  const finalistsTotal = finalistsRows.length;
  const finalistsFootfall = finalistsRows.filter((r) => r.coupon && r.timestamp).length;

  const fancyDressTotal = fancyDressRows.length;
  const fancyDressFootfall = fancyDressRows.filter((r) => r.coupon && r.timestamp).length;

  const schoolMap = {};
  const compMap = {};

  rows.forEach((r) => {
    const schoolKey = (r.schoolName || "Unknown") + " (" + (r.schoolCode || "NA") + ")";
    const compKey = r.competition || "Unknown";

    if (!schoolMap[schoolKey]) schoolMap[schoolKey] = { total: 0, footfall: 0 };
    if (!compMap[compKey]) compMap[compKey] = { total: 0, footfall: 0 };

    schoolMap[schoolKey].total += 1;
    compMap[compKey].total += 1;

    if (r.coupon && r.timestamp) {
      schoolMap[schoolKey].footfall += 1;
      compMap[compKey].footfall += 1;
    }
  });

  const schoolWise = Object.keys(schoolMap)
    .map((name) => ({
      name,
      total: schoolMap[name].total,
      footfall: schoolMap[name].footfall,
    }))
    .sort((a, b) => b.footfall - a.footfall || a.name.localeCompare(b.name));

  const competitionWise = Object.keys(compMap)
    .map((name) => ({
      name,
      total: compMap[name].total,
      footfall: compMap[name].footfall,
    }))
    .sort((a, b) => b.footfall - a.footfall || a.name.localeCompare(b.name));

  return {
    sheetStats: {
      finalists: {
        total: finalistsTotal,
        footfall: finalistsFootfall,
        percentage: finalistsTotal ? Math.round((finalistsFootfall / finalistsTotal) * 100) : 0,
      },
      fancyDress: {
        total: fancyDressTotal,
        footfall: fancyDressFootfall,
        percentage: fancyDressTotal ? Math.round((fancyDressFootfall / fancyDressTotal) * 100) : 0,
      },
    },
    schoolWise,
    competitionWise,
  };
}

function compareTimestampAsc_(a, b) {
  const ta = parseTimeMs_(a);
  const tb = parseTimeMs_(b);
  return ta - tb;
}

function parseTimeMs_(txt) {
  const d = new Date(txt);
  const t = d.getTime();
  if (!isNaN(t)) return t;
  return Number.MAX_SAFE_INTEGER;
}

function formatNow_() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss.SSS");
}

function normalizeHeader_(val) {
  return String(val || "")
    .trim()
    .replace(/\s+/g, "")
    .toUpperCase();
}

function normalizeText_(val) {
  return String(val || "")
    .trim()
    .toLowerCase();
}

function parseEventKey_(eventKey) {
  const txt = String(eventKey || "").trim();
  const parts = txt.split("-");
  const groupPart = parts[0] || "";
  const compPart = parts.slice(1).join("-");
  return {
    groupToken: normalizeText_(groupPart),
    competitionToken: normalizeEventCompetition_(compPart),
  };
}

function extractGroupToken_(groupVal) {
  const m = String(groupVal || "")
    .trim()
    .toLowerCase()
    .match(/g\s*([0-9]+)|group\s*([0-9]+)/i);

  if (!m) return "";
  const num = m[1] || m[2] || "";
  return num ? "g" + num : "";
}

function normalizeEventCompetition_(val) {
  return normalizeText_(val).replace(/[^a-z0-9]/g, "");
}

function toSafeString_(val) {
  return String(val == null ? "" : val).trim();
}

function uniqueSorted_(arr) {
  const seen = {};
  arr.forEach((x) => {
    seen[String(x)] = true;
  });
  return Object.keys(seen).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
}
