const CONFIG = {
  SHEET_ID: "1yzEVh3I6D_iWA6GfmzB1lIs3vzP1HX4HXJ7zRVwokas",
  SHEET_NAMES: ["Top3", "fancydress", "Music"],
  MAIN_SHEET: "Top3",
  MAIN_USER_CODE: "108",
  TEAM_EVENT_KEYS: ["QUIZ", "MUSIC"],
  DESK_AUTO_REFRESH_SECONDS: 5,
};

const COLUMN_ALIASES = {
  SCHOOL_CODE: ["SCHOOLCODE", "SCHOOL_CODE", "CODE"],
  SCHOOL_NAME: ["SCHOOLNAME", "SCHOOL_NAME", "SCHOOL"],
  GROUP: ["GROUP"],
  COMPETITION: ["COMPETITION"],
  RANK: ["RANK"],
  STUDENT_NAME: ["STUDENTNAME", "STUDENT_NAME", "NAME"],
  CLASS: ["CLASS", "STD", "GRADE"],
  SEC: ["SEC", "SECTION"],
  PHONE_NO: ["PHONENO", "PHNO", "PHONE", "MOBILE"],
  TOKEN: ["TOKEN", "COUPON"],
  ATTENDANCE1: ["ATTENDANCE1", "TIMESTAMP"],
  ATTENDANCE2: ["ATTENDANCE2", "ATTENDANCE"],
};

function doGet() {
  return HtmlService.createHtmlOutputFromFile("Index")
    .setTitle("Nandotsava 2026 Desk App")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function getBootstrapData() {
  return {
    autoRefreshSeconds: CONFIG.DESK_AUTO_REFRESH_SECONDS,
  };
}

function verifyMainUserCode(code) {
  return String(code || "").trim() === CONFIG.MAIN_USER_CODE;
}

function getFilterOptions() {
  const allRows = getAllRows_();

  return {
    schoolCodes: uniqueSorted_(allRows.map((r) => r.schoolCode).filter(Boolean)),
    schoolNames: uniqueSorted_(allRows.map((r) => r.schoolName).filter(Boolean)),
    groups: uniqueSorted_(allRows.map((r) => r.group).filter(Boolean)),
    competitions: uniqueSorted_(allRows.map((r) => r.competition).filter(Boolean)),
    deskGroups: uniqueSorted_(allRows.map((r) => r.group).filter(Boolean)),
    deskCompetitions: uniqueSorted_(allRows.map((r) => r.competition).filter(Boolean)),
    deskEvents: buildDeskEventOptions_(allRows),
  };
}

function searchParticipants(payload) {
  const safePayload = payload || {};
  const query = normalizeText_(safePayload.query);
  const filterSchoolCode = normalizeText_(safePayload.schoolCode);
  const filterSchoolName = normalizeText_(safePayload.schoolName);
  const filterGroup = normalizeText_(safePayload.group);
  const filterCompetition = normalizeText_(safePayload.competition);

  const rows = getAllRows_().filter((row) => {
    if (filterSchoolCode && !normalizeText_(row.schoolCode).includes(filterSchoolCode)) return false;
    if (filterSchoolName && !normalizeText_(row.schoolName).includes(filterSchoolName)) return false;
    if (filterGroup && normalizeText_(row.group) !== filterGroup) return false;
    if (filterCompetition && normalizeText_(row.competition) !== filterCompetition) return false;

    if (!query) return true;

    const studentMatch = normalizeText_(row.studentName).includes(query);
    const phoneMatch = normalizeText_(row.phoneNo).includes(query);
    return studentMatch || phoneMatch;
  });

  const results = rows.map((row) => ({
    sheetName: row.sheetName,
    rowNumber: row.rowNumber,
    schoolCode: row.schoolCode,
    schoolName: row.schoolName,
    group: row.group,
    competition: row.competition,
    rank: row.rank,
    studentName: row.studentName,
    className: row.className,
    sec: row.sec,
    phoneNo: row.phoneNo,
    token: row.token,
    attendance1: row.attendance1,
    attendance2: row.attendance2,
    canGenerateToken: !row.token && !row.attendance1,
  }));

  return {
    results,
    totalMatched: rows.length,
  };
}

function getMainDeskStats() {
  const rows = getAllRows_();
  const overallTotal = rows.length;
  const overallFootfall = rows.filter((r) => hasFootfall_(r)).length;

  const categoryBuckets = {
    fancyDress: { name: "Fancy Dress", total: 0, footfall: 0 },
    music: { name: "Music", total: 0, footfall: 0 },
    quiz: { name: "Quiz", total: 0, footfall: 0 },
    coloring: { name: "Coloring", total: 0, footfall: 0 },
  };

  const eventMap = {};
  const schoolMap = {};

  rows.forEach((r) => {
    const eventName = (toSafeString_(r.group) || "NA") + "-" + (toSafeString_(r.competition) || "NA");
    const schoolName = (toSafeString_(r.schoolName) || "Unknown") + " (" + (toSafeString_(r.schoolCode) || "NA") + ")";
    const isFootfall = hasFootfall_(r);
    const normalizedCompetition = normalizeText_(r.competition);

    if (!eventMap[eventName]) {
      eventMap[eventName] = { name: eventName, total: 0, footfall: 0 };
    }
    if (!schoolMap[schoolName]) {
      schoolMap[schoolName] = { name: schoolName, total: 0, footfall: 0 };
    }

    eventMap[eventName].total += 1;
    schoolMap[schoolName].total += 1;

    if (isFootfall) {
      eventMap[eventName].footfall += 1;
      schoolMap[schoolName].footfall += 1;
    }

    if (normalizedCompetition.includes("fancy")) {
      categoryBuckets.fancyDress.total += 1;
      if (isFootfall) categoryBuckets.fancyDress.footfall += 1;
    }
    if (normalizedCompetition.includes("music")) {
      categoryBuckets.music.total += 1;
      if (isFootfall) categoryBuckets.music.footfall += 1;
    }
    if (normalizedCompetition.includes("quiz")) {
      categoryBuckets.quiz.total += 1;
      if (isFootfall) categoryBuckets.quiz.footfall += 1;
    }
    if (normalizedCompetition.includes("color")) {
      categoryBuckets.coloring.total += 1;
      if (isFootfall) categoryBuckets.coloring.footfall += 1;
    }
  });

  const eventWise = Object.keys(eventMap)
    .map((k) => eventMap[k])
    .sort((a, b) => b.footfall - a.footfall || b.total - a.total || a.name.localeCompare(b.name));

  const schoolWise = Object.keys(schoolMap)
    .map((k) => schoolMap[k])
    .sort((a, b) => b.footfall - a.footfall || b.total - a.total || a.name.localeCompare(b.name));

  return {
    overall: {
      total: overallTotal,
      footfall: overallFootfall,
      percentage: overallTotal ? Math.round((overallFootfall / overallTotal) * 100) : 0,
    },
    categoryTotals: {
      fancyDress: addPercentage_(categoryBuckets.fancyDress),
      music: addPercentage_(categoryBuckets.music),
      quiz: addPercentage_(categoryBuckets.quiz),
      coloring: addPercentage_(categoryBuckets.coloring),
    },
    eventWise,
    schoolWise,
  };
}

function generateTokenForStudent(payload) {
  const safePayload = payload || {};
  const sheetName = String(safePayload.sheetName || "").trim();
  const rowNumber = Number(safePayload.rowNumber);
  const normalizedSheetName = normalizeText_(sheetName);

  if (!sheetName || !rowNumber) {
    return { ok: false, message: "Sheet name and row number are required." };
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    const allRows = getAllRows_();
    const targetRow = allRows.find((r) => r.sheetName === sheetName && r.rowNumber === rowNumber);
    if (!targetRow) {
      return { ok: false, message: "Target row not found." };
    }

    if (targetRow.token || targetRow.attendance1) {
      return { ok: false, message: "Token already generated for this participant." };
    }

    const attendance1Time = formatNow_();

    // Music sheet: one token per school, shared by all rows of that school.
    if (normalizedSheetName === normalizeText_("Music")) {
      const schoolKey = normalizeText_(targetRow.schoolCode || targetRow.schoolName);
      if (!schoolKey) {
        return { ok: false, message: "SchoolCode/SchoolName is required for Music token generation." };
      }

      const targets = allRows.filter((r) => {
        return (
          normalizeText_(r.sheetName) === normalizedSheetName &&
          normalizeText_(r.schoolCode || r.schoolName) === schoolKey
        );
      });

      const alreadyGenerated = targets.find((r) => r.token || r.attendance1);
      if (alreadyGenerated) {
        return {
          ok: false,
          message: "Music token already generated for this school: " + (alreadyGenerated.token || ""),
        };
      }

      const musicRows = allRows.filter((r) => normalizeText_(r.sheetName) === normalizedSheetName);
      const token = buildNextMusicToken_(musicRows);

      writeTokenAndAttendance1_(targets, token, attendance1Time);

      return {
        ok: true,
        message: "Music school token generated for " + targets.length + " students.",
        token,
        attendance1: attendance1Time,
        updatedRows: targets.length,
      };
    }

    // Fancy dress sheet: token format <group>_F_### and row-wise generation.
    if (normalizedSheetName === normalizeText_("fancydress")) {
      const groupToken = extractGroupToken_(targetRow.group);
      if (!groupToken) {
        return { ok: false, message: "Invalid group format. Expected values like G1, G2, G3, G4." };
      }

      const fancyRows = allRows.filter((r) => normalizeText_(r.sheetName) === normalizedSheetName);
      const token = buildNextTokenWithPrefix_(groupToken.toUpperCase() + "_F_", fancyRows);
      const targets = [targetRow];

      writeTokenAndAttendance1_(targets, token, attendance1Time);

      return {
        ok: true,
        message: "Fancy dress token generated successfully.",
        token,
        attendance1: attendance1Time,
        updatedRows: 1,
      };
    }

    const groupToken = extractGroupToken_(targetRow.group);
    if (!groupToken) {
      return { ok: false, message: "Invalid group format. Expected values like G1, G2, G3, G4." };
    }

    const competitionInitial = getCompetitionInitial_(targetRow.competition);
    if (!competitionInitial) {
      return { ok: false, message: "Competition value is missing." };
    }

    const isTeamEvent = isTeamEvent_(targetRow.competition);
    const token = buildNextTokenWithPrefix_(
      groupToken.toUpperCase() + "_" + competitionInitial.toUpperCase() + "_",
      allRows
    );

    let targets = [targetRow];
    if (isTeamEvent) {
      targets = allRows.filter((r) => {
        return (
          normalizeText_(r.schoolCode) === normalizeText_(targetRow.schoolCode) &&
          normalizeText_(r.group) === normalizeText_(targetRow.group) &&
          normalizeText_(r.competition) === normalizeText_(targetRow.competition)
        );
      });

      const existingTeamToken = targets.find((r) => r.token);
      if (existingTeamToken) {
        return {
          ok: false,
          message: "Team token already generated for this school and event: " + existingTeamToken.token,
        };
      }
    }

    const writeInfo = buildSheetWriteInfo_(targets);
    const ss = getSpreadsheet_();
    writeTokenAndAttendance1_(targets, token, attendance1Time);

    return {
      ok: true,
      message: isTeamEvent
        ? "Team token generated for " + targets.length + " students."
        : "Token generated successfully.",
      token,
      attendance1: attendance1Time,
      updatedRows: targets.length,
    };
  } catch (err) {
    return { ok: false, message: "Failed to generate token: " + err.message };
  } finally {
    lock.releaseLock();
  }
}

function writeTokenAndAttendance1_(targets, token, attendance1Time) {
  const writeInfo = buildSheetWriteInfo_(targets);
  const ss = getSpreadsheet_();

  Object.keys(writeInfo).forEach((name) => {
    const info = writeInfo[name];
    const sheet = ss.getSheetByName(name);
    if (!sheet || !info.rows.length) return;

    const headers = getHeaders_(sheet);
    const idxToken = findHeaderIndexByCanonical_(headers, "TOKEN");
    const idxAttendance1 = findHeaderIndexByCanonical_(headers, "ATTENDANCE1");
    if (idxToken < 0 || idxAttendance1 < 0) {
      throw new Error("TOKEN or ATTENDANCE1 column missing in sheet: " + name);
    }

    info.rows.forEach((rowNum) => {
      const current = sheet.getRange(rowNum, 1, 1, headers.length).getValues()[0];
      if (String(current[idxToken] || "").trim() || String(current[idxAttendance1] || "").trim()) {
        throw new Error("Token already exists for row " + rowNum + " in sheet " + name + ".");
      }

      sheet.getRange(rowNum, idxToken + 1).setValue(token);
      sheet.getRange(rowNum, idxAttendance1 + 1).setValue(attendance1Time);
    });
  });
}

function getCompetitionDeskRows(payload) {
  const safePayload = payload || {};
  const selectedEventKey = normalizeText_(safePayload.eventKey);
  const parsedEvent = parseDeskEventKey_(selectedEventKey);
  const filterGroup = parsedEvent.group;
  const filterCompetition = parsedEvent.competition;
  const searchName = normalizeText_(safePayload.studentName);

  const rows = getAllRows_()
    .filter((r) => r.token && r.attendance1)
    .filter((r) => {
      if (filterGroup && normalizeText_(r.group) !== filterGroup) return false;
      if (filterCompetition && normalizeText_(r.competition) !== filterCompetition) return false;
      if (searchName && !normalizeText_(r.studentName).includes(searchName)) return false;
      return true;
    })
    .sort((a, b) => compareTimestampAsc_(a.attendance1, b.attendance1));

  const pending = [];
  const completed = [];

  rows.forEach((r) => {
    const dto = {
      sheetName: r.sheetName,
      rowNumber: r.rowNumber,
      schoolCode: r.schoolCode,
      schoolName: r.schoolName,
      group: r.group,
      competition: r.competition,
      studentName: r.studentName,
      className: r.className,
      sec: r.sec,
      phoneNo: r.phoneNo,
      token: r.token,
      attendance1: r.attendance1,
      attendance2: r.attendance2,
      canMarkAttendance: !r.attendance2,
    };

    if (r.attendance2) {
      completed.push(dto);
    } else {
      pending.push(dto);
    }
  });

  return {
    pending,
    completed,
    total: rows.length,
  };
}

function buildDeskEventOptions_(rows) {
  const map = {};

  rows.forEach((r) => {
    const group = toSafeString_(r.group);
    const competition = toSafeString_(r.competition);
    if (!group || !competition) return;

    const key = normalizeText_(group) + "||" + normalizeText_(competition);
    if (map[key]) return;

    map[key] = {
      key,
      label: group + "-" + competition,
      group,
      competition,
    };
  });

  return Object.keys(map)
    .map((k) => map[k])
    .sort((a, b) => {
      const ga = extractGroupOrder_(a.group);
      const gb = extractGroupOrder_(b.group);
      if (ga !== gb) return ga - gb;
      return a.competition.localeCompare(b.competition, undefined, { sensitivity: "base" });
    });
}

function parseDeskEventKey_(eventKey) {
  const txt = String(eventKey || "");
  const parts = txt.split("||");
  if (parts.length !== 2) {
    return { group: "", competition: "" };
  }
  return {
    group: normalizeText_(parts[0]),
    competition: normalizeText_(parts[1]),
  };
}

function extractGroupOrder_(groupText) {
  const m = String(groupText || "")
    .trim()
    .toUpperCase()
    .match(/G\s*([0-9]+)/);
  if (!m) return Number.MAX_SAFE_INTEGER;
  const n = parseInt(m[1], 10);
  return isNaN(n) ? Number.MAX_SAFE_INTEGER : n;
}

function markAttendance2(payload) {
  const safePayload = payload || {};
  const sheetName = String(safePayload.sheetName || "").trim();
  const rowNumber = Number(safePayload.rowNumber);

  if (!sheetName || !rowNumber) {
    return { ok: false, message: "Sheet name and row number are required." };
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    const ss = getSpreadsheet_();
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) return { ok: false, message: "Invalid sheet name." };

    const headers = getHeaders_(sheet);
    const idxAttendance1 = findHeaderIndexByCanonical_(headers, "ATTENDANCE1");
    const idxAttendance2 = findHeaderIndexByCanonical_(headers, "ATTENDANCE2");

    if (idxAttendance1 < 0 || idxAttendance2 < 0) {
      return { ok: false, message: "ATTENDANCE1 or ATTENDANCE2 column missing." };
    }

    const rowVals = sheet.getRange(rowNumber, 1, 1, headers.length).getValues()[0];
    const attendance1 = String(rowVals[idxAttendance1] || "").trim();
    const attendance2 = String(rowVals[idxAttendance2] || "").trim();

    if (!attendance1) {
      return { ok: false, message: "Token has not been generated yet for this participant." };
    }

    if (attendance2) {
      return { ok: false, message: "Attendance already marked." };
    }

    const nowText = formatNow_();
    sheet.getRange(rowNumber, idxAttendance2 + 1).setValue(nowText);

    return {
      ok: true,
      message: "Attendance marked.",
      attendance2: nowText,
    };
  } catch (err) {
    return { ok: false, message: "Failed to mark attendance: " + err.message };
  } finally {
    lock.releaseLock();
  }
}

function getSpreadsheet_() {
  if (!CONFIG.SHEET_ID) {
    throw new Error("Please configure SHEET_ID in Code.gs.");
  }
  return SpreadsheetApp.openById(CONFIG.SHEET_ID);
}

function getMainRows_() {
  const rows = getAllRows_();
  return rows.filter((r) => normalizeText_(r.sheetName) === normalizeText_(CONFIG.MAIN_SHEET));
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
      const rowObj = {};
      headers.forEach((header, i) => {
        rowObj[normalizeHeader_(header)] = rowValues[i];
      });

      allRows.push({
        sheetName,
        rowNumber: idx + 2,
        schoolCode: toSafeString_(getCanonicalValue_(rowObj, "SCHOOL_CODE")),
        schoolName: toSafeString_(getCanonicalValue_(rowObj, "SCHOOL_NAME")),
        group: toSafeString_(getCanonicalValue_(rowObj, "GROUP")),
        competition: toSafeString_(getCanonicalValue_(rowObj, "COMPETITION")),
        rank: toSafeString_(getCanonicalValue_(rowObj, "RANK")),
        studentName: toSafeString_(getCanonicalValue_(rowObj, "STUDENT_NAME")),
        className: toSafeString_(getCanonicalValue_(rowObj, "CLASS")),
        sec: toSafeString_(getCanonicalValue_(rowObj, "SEC")),
        phoneNo: toSafeString_(getCanonicalValue_(rowObj, "PHONE_NO")),
        token: toSafeString_(getCanonicalValue_(rowObj, "TOKEN")),
        attendance1: toSafeString_(getCanonicalValue_(rowObj, "ATTENDANCE1")),
        attendance2: toSafeString_(getCanonicalValue_(rowObj, "ATTENDANCE2")),
      });
    });
  });

  return allRows;
}

function buildSheetWriteInfo_(rows) {
  const map = {};
  rows.forEach((r) => {
    if (!map[r.sheetName]) {
      map[r.sheetName] = { rows: [] };
    }
    map[r.sheetName].rows.push(r.rowNumber);
  });
  return map;
}

function findHeaderIndexByCanonical_(headers, canonicalName) {
  const aliasKeys = COLUMN_ALIASES[canonicalName] || [canonicalName];
  for (let i = 0; i < headers.length; i++) {
    const normalized = normalizeHeader_(headers[i]);
    for (let j = 0; j < aliasKeys.length; j++) {
      if (normalized === normalizeHeader_(aliasKeys[j])) {
        return i;
      }
    }
  }
  return -1;
}

function getCanonicalValue_(rowObj, canonicalName) {
  const aliasKeys = COLUMN_ALIASES[canonicalName] || [canonicalName];
  for (let i = 0; i < aliasKeys.length; i++) {
    const key = normalizeHeader_(aliasKeys[i]);
    if (Object.prototype.hasOwnProperty.call(rowObj, key)) {
      return rowObj[key];
    }
  }
  return "";
}

function buildNextTokenWithPrefix_(prefix, rows) {
  const regex = new RegExp("^" + prefix + "(\\d+)$", "i");

  let maxNum = 0;
  rows.forEach((r) => {
    const token = String(r.token || "").trim();
    if (!token) return;
    const match = token.match(regex);
    if (!match) return;
    const n = parseInt(match[1], 10);
    if (!isNaN(n) && n > maxNum) {
      maxNum = n;
    }
  });

  const next = String(maxNum + 1).padStart(3, "0");
  return prefix + next;
}

function buildNextMusicToken_(rows) {
  let maxNum = 0;
  rows.forEach((r) => {
    const token = String(r.token || "").trim();
    if (!token) return;

    const match = token.match(/^M_?(\d+)$/i);
    if (!match) return;

    const n = parseInt(match[1], 10);
    if (!isNaN(n) && n > maxNum) {
      maxNum = n;
    }
  });

  return "M_" + String(maxNum + 1).padStart(3, "0");
}

function isTeamEvent_(competition) {
  const key = normalizeText_(competition).replace(/[^a-z]/g, "").toUpperCase();
  return CONFIG.TEAM_EVENT_KEYS.some((x) => key === normalizeText_(x).replace(/[^a-z]/g, "").toUpperCase());
}

function getCompetitionInitial_(competition) {
  const txt = String(competition || "").trim();
  if (!txt) return "";
  const m = txt.match(/[A-Za-z]/);
  return m ? m[0].toUpperCase() : "";
}

function extractGroupToken_(groupVal) {
  const m = String(groupVal || "")
    .trim()
    .toUpperCase()
    .match(/G\s*([0-9]+)/);
  if (!m) return "";
  return "G" + m[1];
}

function compareTimestampAsc_(a, b) {
  return parseTimeMs_(a) - parseTimeMs_(b);
}

function parseTimeMs_(txt) {
  const d = new Date(txt);
  const t = d.getTime();
  if (!isNaN(t)) return t;
  return Number.MAX_SAFE_INTEGER;
}

function formatNow_() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");
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

function hasFootfall_(row) {
  return !!toSafeString_(row.token) && !!toSafeString_(row.attendance1);
}

function addPercentage_(bucket) {
  return {
    name: bucket.name,
    total: bucket.total,
    footfall: bucket.footfall,
    percentage: bucket.total ? Math.round((bucket.footfall / bucket.total) * 100) : 0,
  };
}
