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
  const mainRows = getMainRows_();
  const allRows = getAllRows_();

  return {
    schoolCodes: uniqueSorted_(mainRows.map((r) => r.schoolCode).filter(Boolean)),
    schoolNames: uniqueSorted_(mainRows.map((r) => r.schoolName).filter(Boolean)),
    groups: uniqueSorted_(mainRows.map((r) => r.group).filter(Boolean)),
    competitions: uniqueSorted_(mainRows.map((r) => r.competition).filter(Boolean)),
    deskGroups: uniqueSorted_(allRows.map((r) => r.group).filter(Boolean)),
    deskCompetitions: uniqueSorted_(allRows.map((r) => r.competition).filter(Boolean)),
  };
}

function searchParticipants(payload) {
  const safePayload = payload || {};
  const query = normalizeText_(safePayload.query);
  const filterSchoolCode = normalizeText_(safePayload.schoolCode);
  const filterSchoolName = normalizeText_(safePayload.schoolName);
  const filterGroup = normalizeText_(safePayload.group);
  const filterCompetition = normalizeText_(safePayload.competition);

  const rows = getMainRows_().filter((row) => {
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

function generateTokenForStudent(payload) {
  const safePayload = payload || {};
  const sheetName = String(safePayload.sheetName || "").trim();
  const rowNumber = Number(safePayload.rowNumber);

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

    const groupToken = extractGroupToken_(targetRow.group);
    if (!groupToken) {
      return { ok: false, message: "Invalid group format. Expected values like G1, G2, G3, G4." };
    }

    const competitionInitial = getCompetitionInitial_(targetRow.competition);
    if (!competitionInitial) {
      return { ok: false, message: "Competition value is missing." };
    }

    const isTeamEvent = isTeamEvent_(targetRow.competition);
    const token = buildNextToken_(groupToken, competitionInitial, allRows);
    const attendance1Time = formatNow_();

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

function getCompetitionDeskRows(payload) {
  const safePayload = payload || {};
  const filterGroup = normalizeText_(safePayload.group);
  const filterCompetition = normalizeText_(safePayload.competition);
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

function buildNextToken_(groupToken, competitionInitial, rows) {
  const prefix = groupToken.toUpperCase() + "_" + competitionInitial.toUpperCase() + "_";
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
