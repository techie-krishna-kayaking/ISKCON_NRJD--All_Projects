const CONFIG = {
  SHEET_ID: "1yzEVh3I6D_iWA6GfmzB1lIs3vzP1HX4HXJ7zRVwokas",
  SHEET_NAMES: ["Top3", "fancydress", "Music"],
  MEDAL_SHEET_CANDIDATES: ["MEDALIST", "Medalist", "medalist"],
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

function getDiagnostics() {
  const allRows = getAllRows_();
  const stats = {
    totalRows: allRows.length,
    bySheet: {},
    byStatus: {
      noToken: 0,
      noAttendance1: 0,
      hasToken: 0,
      readyForEventDesk: 0,
    },
  };

  const eventDeskReady = allRows.filter((r) => r.token && r.attendance1);

  allRows.forEach((r) => {
    if (!stats.bySheet[r.sheetName]) {
      stats.bySheet[r.sheetName] = { total: 0, withToken: 0, withAttendance1: 0, ready: 0 };
    }
    stats.bySheet[r.sheetName].total += 1;

    if (r.token) {
      stats.bySheet[r.sheetName].withToken += 1;
      stats.byStatus.hasToken += 1;
    } else {
      stats.byStatus.noToken += 1;
    }

    if (r.attendance1) {
      stats.bySheet[r.sheetName].withAttendance1 += 1;
    } else {
      stats.byStatus.noAttendance1 += 1;
    }

    if (r.token && r.attendance1) {
      stats.bySheet[r.sheetName].ready += 1;
      stats.byStatus.readyForEventDesk += 1;
    }
  });

  return {
    stats,
    message:
      "Ready for Event Desk (token + attendance1): " +
      stats.byStatus.readyForEventDesk +
      " | Total rows: " +
      stats.totalRows,
  };
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
  const schoolEventMap = {};

  rows.forEach((r) => {
    const eventName = (toSafeString_(r.group) || "NA") + "-" + (toSafeString_(r.competition) || "NA");
    const schoolName = (toSafeString_(r.schoolName) || "Unknown") + " (" + (toSafeString_(r.schoolCode) || "NA") + ")";
    const isFootfall = hasFootfall_(r);
    const normalizedCompetition = normalizeText_(r.competition);
    const normalizedSheetName = normalizeText_(r.sheetName);

    if (!eventMap[eventName]) {
      eventMap[eventName] = { name: eventName, total: 0, footfall: 0 };
    }
    if (!schoolMap[schoolName]) {
      schoolMap[schoolName] = { name: schoolName, total: 0, footfall: 0, percentage: 0 };
    }

    const schoolEventKey = schoolName + "||" + eventName;
    if (!schoolEventMap[schoolEventKey]) {
      schoolEventMap[schoolEventKey] = {
        schoolName,
        eventName,
        total: 0,
        footfall: 0,
        percentage: 0,
      };
    }

    eventMap[eventName].total += 1;
    schoolMap[schoolName].total += 1;
    schoolEventMap[schoolEventKey].total += 1;

    if (isFootfall) {
      eventMap[eventName].footfall += 1;
      schoolMap[schoolName].footfall += 1;
      schoolEventMap[schoolEventKey].footfall += 1;
    }

    // Fancy dress and music sheets do not carry COMPETITION in the source workbook,
    // so category totals must be derived by sheet name for those categories.
    if (normalizedSheetName === normalizeText_("fancydress")) {
      categoryBuckets.fancyDress.total += 1;
      if (isFootfall) categoryBuckets.fancyDress.footfall += 1;
    } else if (normalizedSheetName === normalizeText_("music")) {
      categoryBuckets.music.total += 1;
      if (isFootfall) categoryBuckets.music.footfall += 1;
    } else if (normalizedCompetition.includes("quiz")) {
      categoryBuckets.quiz.total += 1;
      if (isFootfall) categoryBuckets.quiz.footfall += 1;
    } else if (normalizedCompetition.includes("color")) {
      categoryBuckets.coloring.total += 1;
      if (isFootfall) categoryBuckets.coloring.footfall += 1;
    }
  });

  const eventWise = Object.keys(eventMap)
    .map((k) => eventMap[k])
    .sort((a, b) => b.footfall - a.footfall || b.total - a.total || a.name.localeCompare(b.name));

  const schoolWise = Object.keys(schoolMap)
    .map((k) => {
      const row = schoolMap[k];
      row.percentage = row.total ? Math.round((row.footfall / row.total) * 100) : 0;
      return row;
    })
    .sort((a, b) => b.footfall - a.footfall || b.total - a.total || a.name.localeCompare(b.name));

  const schoolEventWise = Object.keys(schoolEventMap)
    .map((k) => {
      const row = schoolEventMap[k];
      row.percentage = row.total ? Math.round((row.footfall / row.total) * 100) : 0;
      return row;
    })
    .sort((a, b) => b.footfall - a.footfall || b.total - a.total || a.schoolName.localeCompare(b.schoolName));

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
    schoolEventWise,
  };
}

function getMedalDashboard(payload) {
  const safePayload = payload || {};
  const filterSchool = normalizeText_(safePayload.school || "");
  const filterEvent = normalizeText_(safePayload.event || "");
  const filterGroup = normalizeText_(safePayload.group || "");
  const filterMedalType = normalizeText_(safePayload.medalType || "");

  const allRows = getMedalRows_();
  const filteredRows = allRows.filter((r) => {
    if (filterSchool && normalizeText_(r.school) !== filterSchool) return false;
    if (filterEvent && normalizeText_(r.event) !== filterEvent) return false;
    if (filterGroup && normalizeText_(r.group) !== filterGroup) return false;
    if (filterMedalType && normalizeText_(r.medalType) !== filterMedalType) return false;
    return true;
  });

  const medalRows = filteredRows.filter((r) => isMedalWinnerRank_(r.rank));
  const medalCount = medalRows.length;

  const overall = {
    participants: filteredRows.length,
    medals: medalCount,
    medalPercentage: filteredRows.length ? Math.round((medalCount / filteredRows.length) * 100) : 0,
    gold: medalRows.filter((r) => r.medalType === "GOLD").length,
    silver: medalRows.filter((r) => r.medalType === "SILVER").length,
    bronze: medalRows.filter((r) => r.medalType === "BRONZE").length,
  };

  const schoolMap = {};
  const eventMap = {};
  const schoolEventMap = {};

  filteredRows.forEach((r) => {
    if (!schoolMap[r.school]) {
      schoolMap[r.school] = {
        school: r.school,
        participants: 0,
        medals: 0,
        gold: 0,
        silver: 0,
        bronze: 0,
        medalPercentage: 0,
        sharePercentage: 0,
      };
    }
    if (!eventMap[r.event]) {
      eventMap[r.event] = {
        event: r.event,
        participants: 0,
        medals: 0,
        gold: 0,
        silver: 0,
        bronze: 0,
        medalPercentage: 0,
      };
    }

    const schoolEventKey = r.school + "||" + r.event;
    if (!schoolEventMap[schoolEventKey]) {
      schoolEventMap[schoolEventKey] = {
        school: r.school,
        event: r.event,
        participants: 0,
        medals: 0,
        gold: 0,
        silver: 0,
        bronze: 0,
        medalPercentage: 0,
      };
    }

    schoolMap[r.school].participants += 1;
    eventMap[r.event].participants += 1;
    schoolEventMap[schoolEventKey].participants += 1;

    if (r.medalType !== "NONE") {
      schoolMap[r.school].medals += 1;
      eventMap[r.event].medals += 1;
      schoolEventMap[schoolEventKey].medals += 1;
    }

    if (r.medalType === "GOLD") {
      schoolMap[r.school].gold += 1;
      eventMap[r.event].gold += 1;
      schoolEventMap[schoolEventKey].gold += 1;
    } else if (r.medalType === "SILVER") {
      schoolMap[r.school].silver += 1;
      eventMap[r.event].silver += 1;
      schoolEventMap[schoolEventKey].silver += 1;
    } else if (r.medalType === "BRONZE") {
      schoolMap[r.school].bronze += 1;
      eventMap[r.event].bronze += 1;
      schoolEventMap[schoolEventKey].bronze += 1;
    }
  });

  const schoolWise = Object.keys(schoolMap)
    .map((k) => {
      const row = schoolMap[k];
      row.medalPercentage = row.participants ? Math.round((row.medals / row.participants) * 100) : 0;
      row.sharePercentage = overall.medals ? Math.round((row.medals / overall.medals) * 100) : 0;
      return row;
    })
    .sort((a, b) => b.medals - a.medals || b.gold - a.gold || a.school.localeCompare(b.school));

  const eventWise = Object.keys(eventMap)
    .map((k) => {
      const row = eventMap[k];
      row.medalPercentage = row.participants ? Math.round((row.medals / row.participants) * 100) : 0;
      return row;
    })
    .sort((a, b) => b.medals - a.medals || b.gold - a.gold || a.event.localeCompare(b.event));

  const schoolEventWise = Object.keys(schoolEventMap)
    .map((k) => {
      const row = schoolEventMap[k];
      row.medalPercentage = row.participants ? Math.round((row.medals / row.participants) * 100) : 0;
      return row;
    })
    .sort((a, b) => b.medals - a.medals || b.gold - a.gold || a.school.localeCompare(b.school));

  const drillDownRows = medalRows
    .map((r) => ({
      sheetName: r.sheetName,
      rowNumber: r.rowNumber,
      event: r.event,
      group: r.group,
      school: r.school,
      studentName: r.studentName,
      className: r.className,
      sec: r.sec,
      phoneNo: r.phoneNo,
      score: r.score,
      rank: r.rank,
      medalType: r.medalType,
    }))
    .sort((a, b) => {
      const ra = rankSortOrder_(a.rank);
      const rb = rankSortOrder_(b.rank);
      if (ra !== rb) return ra - rb;
      return a.school.localeCompare(b.school);
    });

  return {
    filterOptions: {
      schools: uniqueSorted_(allRows.map((r) => r.school).filter(Boolean)),
      events: uniqueSorted_(allRows.map((r) => r.event).filter(Boolean)),
      groups: uniqueSorted_(allRows.map((r) => r.group).filter(Boolean)),
      medalTypes: ["GOLD", "SILVER", "BRONZE"],
    },
    overall,
    schoolWise,
    eventWise,
    schoolEventWise,
    drillDownRows,
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
      // Lock + pre-validation in generateTokenForStudent keeps this safe.
      // Use single-call write when columns are adjacent for better performance.
      if (idxAttendance1 === idxToken + 1) {
        sheet.getRange(rowNum, idxToken + 1, 1, 2).setValues([[token, attendance1Time]]);
      } else {
        sheet.getRange(rowNum, idxToken + 1).setValue(token);
        sheet.getRange(rowNum, idxAttendance1 + 1).setValue(attendance1Time);
      }
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

  // Show students with tokens (includes attendance1, as they're written together)
  const rows = getAllRows_()
    .filter((r) => r.token)
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

function getPreachingDeskFilterOptions() {
  const rows = getAllRows_().filter((r) => !!toSafeString_(r.attendance1));
  return {
    schools: uniqueSorted_(rows.map((r) => r.schoolName).filter(Boolean)),
    groups: uniqueSorted_(rows.map((r) => r.group).filter(Boolean)),
    events: uniqueSorted_(rows.map((r) => r.competition).filter(Boolean)),
  };
}

function getPreachingDeskRows(payload) {
  const safePayload = payload || {};
  const filterSchool = normalizeText_(safePayload.school || "");
  const filterGroup = normalizeText_(safePayload.group || "");
  const filterEvent = normalizeText_(safePayload.event || "");
  const searchText = normalizeText_(safePayload.search || "");

  const preachingMap = getPreachingDeskEntryMap_();

  const rows = getAllRows_()
    .filter((r) => !!toSafeString_(r.attendance1))
    .filter((r) => {
      if (filterSchool && normalizeText_(r.schoolName) !== filterSchool) return false;
      if (filterGroup && normalizeText_(r.group) !== filterGroup) return false;
      if (filterEvent && normalizeText_(r.competition) !== filterEvent) return false;
      return true;
    })
    .sort((a, b) => compareTimestampAsc_(a.attendance1, b.attendance1));

  const toDto = (r) => {
    const participantKey = buildParticipantKey_(r.sheetName, r.rowNumber);
    const saved = preachingMap[participantKey] || {};
    return {
      participantKey,
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
      parentAltPhone: toSafeString_(saved.parentAltPhone),
      consentContactCorrect: toBoolean_(saved.consentContactCorrect),
      consentUpdates: toBoolean_(saved.consentUpdates),
      savedAt: toSafeString_(saved.savedAt),
    };
  };

  const savedRows = [];
  const pendingRows = [];

  rows.forEach((r) => {
    const dto = toDto(r);
    const isSaved = !!toSafeString_(dto.savedAt);

    if (isSaved) {
      savedRows.push(dto);
      return;
    }

    if (!searchText) {
      pendingRows.push(dto);
      return;
    }

    const byName = normalizeText_(dto.studentName).includes(searchText);
    const byPhone = normalizeText_(dto.phoneNo).includes(searchText);
    if (byName || byPhone) {
      pendingRows.push(dto);
    }
  });

  savedRows.sort((a, b) => compareTimestampAsc_(a.savedAt, b.savedAt));

  return {
    pendingRows,
    savedRows,
  };
}

function upsertPreachingDeskEntry(payload) {
  const safePayload = payload || {};
  const sheetName = String(safePayload.sheetName || "").trim();
  const rowNumber = Number(safePayload.rowNumber);
  const parentAltPhone = String(safePayload.parentAltPhone || "")
    .replace(/\D/g, "")
    .trim();
  const consentContactCorrect = !!safePayload.consentContactCorrect;
  const consentUpdates = !!safePayload.consentUpdates;

  if (!sheetName || !rowNumber) {
    return { ok: false, message: "Sheet name and row number are required." };
  }

  if (!/^\d{10}$/.test(parentAltPhone)) {
    return { ok: false, message: "Please enter phone number with exactly 10 digits." };
  }

  if (!consentContactCorrect || !consentUpdates) {
    return { ok: false, message: "please give ur concent" };
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    const allRows = getAllRows_();
    const src = allRows.find((r) => r.sheetName === sheetName && r.rowNumber === rowNumber);
    if (!src) {
      return { ok: false, message: "Source student not found." };
    }
    if (!toSafeString_(src.attendance1)) {
      return { ok: false, message: "Student has not completed Attendance1." };
    }

    const ss = getSpreadsheet_();
    const sheet = getOrCreatePreachingDeskSheet_(ss);
    const headers = getHeaders_(sheet);

    const participantKey = buildParticipantKey_(src.sheetName, src.rowNumber);
    const nowText = formatNow_();

    const dataRow = {
      ParticipantKey: participantKey,
      Sheet: src.sheetName,
      RowNumber: src.rowNumber,
      SchoolCode: src.schoolCode,
      SchoolName: src.schoolName,
      Group: src.group,
      Competition: src.competition,
      StudentName: src.studentName,
      Class: src.className,
      Sec: src.sec,
      PhoneNo: src.phoneNo,
      Token: src.token,
      Attendance1: src.attendance1,
      Attendance2: src.attendance2,
      ParentAltPhone: parentAltPhone,
      ConsentContactCorrect: consentContactCorrect ? "TRUE" : "FALSE",
      ConsentUpdates: consentUpdates ? "TRUE" : "FALSE",
      UpdatedAt: nowText,
    };

    const rowValues = headers.map((h) => {
      const key = String(h || "").trim();
      return Object.prototype.hasOwnProperty.call(dataRow, key) ? dataRow[key] : "";
    });

    const keyCol = headers.indexOf("ParticipantKey");
    if (keyCol < 0) {
      return { ok: false, message: "PreachingDesk headers are invalid." };
    }

    let targetRow = 0;
    const lastRow = sheet.getLastRow();
    if (lastRow >= 2) {
      const keys = sheet.getRange(2, keyCol + 1, lastRow - 1, 1).getValues();
      for (let i = 0; i < keys.length; i++) {
        if (toSafeString_(keys[i][0]) === participantKey) {
          targetRow = i + 2;
          break;
        }
      }
    }

    if (targetRow) {
      sheet.getRange(targetRow, 1, 1, headers.length).setValues([rowValues]);
    } else {
      sheet.getRange(sheet.getLastRow() + 1, 1, 1, headers.length).setValues([rowValues]);
    }

    return {
      ok: true,
      message: "Saved to PreachingDesk.",
      updatedAt: nowText,
    };
  } catch (err) {
    return { ok: false, message: "Failed to save PreachingDesk data: " + err.message };
  } finally {
    lock.releaseLock();
  }
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

function getOrCreatePreachingDeskSheet_(ss) {
  const sheetName = "PreachingDesk";
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }

  const headers = getPreachingDeskHeaders_();
  const currentHeaders = getHeaders_(sheet);
  const hasAnyHeader = currentHeaders.some((h) => !!toSafeString_(h));
  if (!hasAnyHeader) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    return sheet;
  }

  if (currentHeaders.length !== headers.length || currentHeaders.some((h, i) => h !== headers[i])) {
    throw new Error("PreachingDesk header mismatch. Please align row 1 with expected columns.");
  }
  return sheet;
}

function getPreachingDeskHeaders_() {
  return [
    "ParticipantKey",
    "Sheet",
    "RowNumber",
    "SchoolCode",
    "SchoolName",
    "Group",
    "Competition",
    "StudentName",
    "Class",
    "Sec",
    "PhoneNo",
    "Token",
    "Attendance1",
    "Attendance2",
    "ParentAltPhone",
    "ConsentContactCorrect",
    "ConsentUpdates",
    "UpdatedAt",
  ];
}

function getPreachingDeskEntryMap_() {
  const ss = getSpreadsheet_();
  const sheet = ss.getSheetByName("PreachingDesk");
  if (!sheet || sheet.getLastRow() < 2) return {};

  const headers = getHeaders_(sheet);
  const values = sheet.getRange(2, 1, sheet.getLastRow() - 1, headers.length).getValues();

  const idx = {
    key: headers.indexOf("ParticipantKey"),
    parentAltPhone: headers.indexOf("ParentAltPhone"),
    consentContactCorrect: headers.indexOf("ConsentContactCorrect"),
    consentUpdates: headers.indexOf("ConsentUpdates"),
    savedAt: headers.indexOf("UpdatedAt"),
  };

  if (idx.key < 0) return {};

  const map = {};
  values.forEach((r) => {
    const key = toSafeString_(r[idx.key]);
    if (!key) return;
    map[key] = {
      parentAltPhone: idx.parentAltPhone >= 0 ? r[idx.parentAltPhone] : "",
      consentContactCorrect: idx.consentContactCorrect >= 0 ? r[idx.consentContactCorrect] : false,
      consentUpdates: idx.consentUpdates >= 0 ? r[idx.consentUpdates] : false,
      savedAt: idx.savedAt >= 0 ? r[idx.savedAt] : "",
    };
  });
  return map;
}

function getMainRows_() {
  const rows = getAllRows_();
  return rows.filter((r) => normalizeText_(r.sheetName) === normalizeText_(CONFIG.MAIN_SHEET));
}

function getHeaders_(sheet) {
  const lastCol = sheet.getLastColumn();
  if (!lastCol || lastCol < 1) return [];
  return sheet
    .getRange(1, 1, 1, lastCol)
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
    const effectiveLastCol = getEffectiveLastCol_(headers);
    if (effectiveLastCol < 1) return;

    const activeHeaders = headers.slice(0, effectiveLastCol);
    // getDisplayValues returns cell text as shown — immune to date/number/custom formatting
    const values = sheet.getRange(2, 1, lastRow - 1, effectiveLastCol).getDisplayValues();

    values.forEach((rowValues, idx) => {
      const rowObj = {};
      activeHeaders.forEach((header, i) => {
        rowObj[normalizeHeader_(header)] = rowValues[i];
      });

      let groupValue = toSafeString_(getCanonicalValue_(rowObj, "GROUP"));
      // Normalize group values: handle Music as g3, extract G1/G2/G3/G4, etc.
      groupValue = normalizeGroupValue_(groupValue);

      allRows.push({
        sheetName,
        rowNumber: idx + 2,
        schoolCode: toSafeString_(getCanonicalValue_(rowObj, "SCHOOL_CODE")),
        schoolName: toSafeString_(getCanonicalValue_(rowObj, "SCHOOL_NAME")),
        group: groupValue,
        competition: getEffectiveCompetition_(sheetName, getCanonicalValue_(rowObj, "COMPETITION")),
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

function getMedalRows_() {
  const ss = getSpreadsheet_();
  const sheets = resolveMedalSheets_(ss);
  const rows = [];

  sheets.forEach((sheet) => {
    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();
    if (lastRow < 2 || lastCol < 1) return;

    const headers = getHeaders_(sheet);
    const values = sheet.getRange(2, 1, lastRow - 1, lastCol).getDisplayValues();

    values.forEach((rowVals, idx) => {
      const rowObj = {};
      headers.forEach((header, i) => {
        rowObj[normalizeMedalKey_(header)] = toSafeString_(rowVals[i]);
      });

      const event = toSafeString_(getMedalCanonicalValue_(rowObj, ["EVENT", "COMPETITION"]));
      const group = toSafeString_(normalizeGroupValue_(toSafeString_(getMedalCanonicalValue_(rowObj, ["GROUP"]))));
      const school = toSafeString_(getMedalCanonicalValue_(rowObj, ["SCHOOL", "SCHOOL NAME", "SCHOOL_NAME", "SCHOOLNAME"]));
      const studentName = toSafeString_(getMedalCanonicalValue_(rowObj, ["NAME", "STUDENT NAME", "STUDENT_NAME", "STUDENTNAME"]));
      const className = toSafeString_(getMedalCanonicalValue_(rowObj, ["CLASS", "STD", "GRADE"]));
      const sec = toSafeString_(getMedalCanonicalValue_(rowObj, ["SEC", "SECTION"]));
      const phoneNo = toSafeString_(
        getMedalCanonicalValue_(rowObj, ["PH NO", "PH_NO", "PHNO", "PHONE", "PHONE NO", "PHONE_NO", "MOBILE"])
      );
      const score = toSafeString_(getMedalCanonicalValue_(rowObj, ["SCORE", "MARKS"]));
      const rank = toSafeString_(getMedalCanonicalValue_(rowObj, ["RANK", "POSITION"]));

      if (!event && !school && !studentName) return;

      rows.push({
        sheetName: sheet.getName(),
        rowNumber: idx + 2,
        event,
        group,
        school,
        studentName,
        className,
        sec,
        phoneNo,
        score,
        rank,
        medalType: getMedalType_(rank),
      });
    });
  });

  return rows;
}

function resolveMedalSheets_(ss) {
  const allSheets = ss.getSheets();

  const candidateByName = allSheets.filter((sheet) => {
    const sheetNameKey = normalizeMedalKey_(sheet.getName());
    return CONFIG.MEDAL_SHEET_CANDIDATES.some((n) => normalizeMedalKey_(n) === sheetNameKey);
  });

  return candidateByName.filter((sheet) => isLikelyMedalSheet_(sheet));
}

function getMedalCanonicalValue_(rowObj, aliases) {
  for (let i = 0; i < aliases.length; i++) {
    const key = normalizeMedalKey_(aliases[i]);
    if (Object.prototype.hasOwnProperty.call(rowObj, key)) {
      return rowObj[key];
    }
  }
  return "";
}

function isLikelyMedalSheet_(sheet) {
  const headers = getHeaders_(sheet);
  if (!headers.length || sheet.getLastRow() < 2) return false;

  const headerSet = {};
  headers.forEach((h) => {
    headerSet[normalizeMedalKey_(h)] = true;
  });

  const hasEvent = !!(headerSet.EVENT || headerSet.COMPETITION);
  const hasSchool = !!(headerSet.SCHOOL || headerSet.SCHOOLNAME);
  const hasName = !!(headerSet.NAME || headerSet.STUDENTNAME);
  const hasRank = !!(headerSet.RANK || headerSet.POSITION);

  return hasEvent && hasSchool && hasName && hasRank;
}

function normalizeMedalKey_(val) {
  return String(val || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

function getMedalType_(rankVal) {
  const rank = parseRankNumber_(rankVal);
  if (rank === 1) return "GOLD";
  if (rank === 2) return "SILVER";
  if (rank === 3) return "BRONZE";
  return "NONE";
}

function isMedalWinnerRank_(rankVal) {
  const rank = parseRankNumber_(rankVal);
  return rank === 1 || rank === 2 || rank === 3;
}

function parseRankNumber_(rankVal) {
  const rankTxt = String(rankVal || "").trim();
  const rank = parseInt(rankTxt, 10);
  if (isNaN(rank)) return 0;
  return rank;
}

function rankSortOrder_(rankVal) {
  const rank = parseInt(String(rankVal || "").trim(), 10);
  return isNaN(rank) ? Number.MAX_SAFE_INTEGER : rank;
}

function getEffectiveLastCol_(headers) {
  for (let i = headers.length - 1; i >= 0; i--) {
    if (toSafeString_(headers[i])) return i + 1;
  }
  return 0;
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

function normalizeGroupValue_(groupVal) {
  const txt = String(groupVal || "")
    .trim()
    .toLowerCase();
  
  // Handle "Music" as g3
  if (txt.includes("music")) return "g3";
  
  // Handle Fancy Dress: extract group if present (e.g., "G1-Fancy Dress" -> "g1")
  if (txt.includes("fancy")) {
    const m = txt.match(/g\s*[\-]?\s*([0-9]+)/);
    if (m) return "g" + m[1];
    return txt;
  }
  
  // Extract group number: G1, G-1, Group 1, G 1, etc.
  const m = txt.match(/g\s*[\-]?\s*([0-9]+)/);
  if (m) return "g" + m[1];
  
  // Return as-is if no pattern matched
  return txt;
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
  if (val == null) return "";
  // Date objects (from getValues on date-formatted cells) must be formatted, not coerced
  if (val instanceof Date) {
    return isNaN(val.getTime()) ? "" : Utilities.formatDate(val, Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");
  }
  return String(val).trim();
}

function toBoolean_(val) {
  const txt = String(val == null ? "" : val).trim().toLowerCase();
  return val === true || txt === "true" || txt === "yes" || txt === "1";
}

function buildParticipantKey_(sheetName, rowNumber) {
  return String(sheetName || "") + "#" + String(rowNumber || "");
}

function getEffectiveCompetition_(sheetName, rawCompetition) {
  const comp = toSafeString_(rawCompetition);
  if (comp) return comp;

  const normalizedSheetName = normalizeText_(sheetName);
  if (normalizedSheetName === normalizeText_("fancydress")) return "FANCY DRESS";
  if (normalizedSheetName === normalizeText_("music")) return "MUSIC";
  return "";
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
