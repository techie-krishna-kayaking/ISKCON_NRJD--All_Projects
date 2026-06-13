// ===== File: Attendance.gs =====
// Responsibility: All attendance logic — recording, upsert, and lookups.
//                 Attendance is stored directly in the 'attendance' sheet (one row per
//                 program-devotee pair with running totals). No raw event sheet (tab3) needed.

/**
 * Records attendance for all attendees of a program session.
 * For each attendee, upserts their row in the 'attendance' sheet:
 *   - If row exists: TOTAL_SESSIONS += 1, ATTENDED += (1 if present), recompute PERCENTAGE.
 *   - If row does not exist: create it with initial values.
 * Idempotent per unique (programKey + devotee) pair — never duplicates rows.
 *
 * @param {string} programKey
 * @param {string[]} attendees - List of devotee names.
 * @param {string[]} attendanceStatus - Corresponding 'present'/'absent' for each.
 * @param {string} date - Attendance date (unused for storage, kept for logging).
 * @param {string} hostName - Host name (logged only).
 * @param {string} selectedDropdownValue - BV chapter or empty (logged only).
 */
function recordAttendance(programKey, attendees, attendanceStatus, date, hostName, selectedDropdownValue) {
  var startTime = new Date();
  logInfo_('Attendance.record',
    'Recording for ' + programKey + ', ' + attendees.length + ' attendees, date=' + date);

  var sheet = getSheet_(SHEET_NAMES.ATTENDANCE);
  if (!sheet) {
    logError_('Attendance.record', 'attendance sheet not found');
    return;
  }

  // Get program metadata from tab1
  var programDetails = getProgramByKey(programKey);
  if (!programDetails) {
    logWarn_('Attendance.record', 'Program not found: ' + programKey);
    return;
  }

  // Ensure header row exists
  var lastRow = sheet.getLastRow();
  if (lastRow < 1) {
    sheet.appendRow(ATTENDANCE_HEADERS);
    lastRow = 1;
  }

  // Read all existing data once (batch read)
  var existingData = [];
  var numCols = ATTENDANCE_HEADERS.length;
  if (lastRow > 1) {
    existingData = sheet.getRange(2, 1, lastRow - 1, numCols).getValues();
  }

  // Build lookup index: "PROGRAM_KEY|DEVOTEE" → row index (0-based in existingData)
  var lookup = {};
  for (var r = 0; r < existingData.length; r++) {
    var key = existingData[r][ATT_COLS.PROGRAM_KEY] + '|' + existingData[r][ATT_COLS.DEVOTEE];
    lookup[key] = r;
  }

  // Track rows to update in-place and new rows to append
  var updates = [];   // [{sheetRow: 1-based, values: [...]}]
  var newRows = [];

  for (var j = 0; j < attendees.length; j++) {
    var devotee = attendees[j];
    var isPresent = (attendanceStatus[j] === 'present') ? 1 : 0;
    var compositeKey = programKey + '|' + devotee;

    if (lookup.hasOwnProperty(compositeKey)) {
      // UPDATE existing row
      var idx = lookup[compositeKey];
      var row = existingData[idx];
      var totalSessions = (Number(row[ATT_COLS.TOTAL_SESSIONS]) || 0) + 1;
      var attended      = (Number(row[ATT_COLS.ATTENDED]) || 0) + isPresent;
      var percentage    = totalSessions === 0 ? 0 : Math.round((attended / totalSessions) * 100);

      var updatedRow = [
        programKey,
        programDetails[TAB1_COLS.AREA],
        programDetails[TAB1_COLS.SUB_AREA],
        programDetails[TAB1_COLS.FREQUENCY],
        programDetails[TAB1_COLS.TYPE_OF_PROGRAM],
        programDetails[TAB1_COLS.LANGUAGE],
        programDetails[TAB1_COLS.PROGRAM_OWNER],
        devotee,
        totalSessions,
        attended,
        percentage + '%'
      ];

      updates.push({ sheetRow: idx + 2, values: updatedRow }); // +2 = 1-based + header
    } else {
      // INSERT new row
      var pct = isPresent ? '100%' : '0%';
      newRows.push([
        programKey,
        programDetails[TAB1_COLS.AREA],
        programDetails[TAB1_COLS.SUB_AREA],
        programDetails[TAB1_COLS.FREQUENCY],
        programDetails[TAB1_COLS.TYPE_OF_PROGRAM],
        programDetails[TAB1_COLS.LANGUAGE],
        programDetails[TAB1_COLS.PROGRAM_OWNER],
        devotee,
        1,
        isPresent,
        pct
      ]);
    }
  }

  // Apply updates (batch per row — can't batch non-contiguous rows)
  updates.forEach(function(u) {
    sheet.getRange(u.sheetRow, 1, 1, u.values.length).setValues([u.values]);
  });

  // Append new rows in one batch
  if (newRows.length > 0) {
    var appendStart = sheet.getLastRow() + 1;
    sheet.getRange(appendStart, 1, newRows.length, newRows[0].length).setValues(newRows);
  }

  var elapsed = ((new Date() - startTime) / 1000).toFixed(1);
  logInfo_('Attendance.record',
    'Done. Updated ' + updates.length + ' rows, appended ' + newRows.length +
    ' new rows. Time: ' + elapsed + 's');
}

/**
 * Returns attendance summary rows for a given program key.
 * @param {string} programKey
 * @return {Object[]} Array of {devotee, totalSessions, attended, percentage}.
 */
function getAttendanceSummary(programKey) {
  var sheet = getSheet_(SHEET_NAMES.ATTENDANCE);
  if (!sheet) return [];
  var data = getAllData_(sheet);
  var results = [];
  for (var i = 1; i < data.length; i++) {
    if (data[i][ATT_COLS.PROGRAM_KEY] === programKey) {
      results.push({
        devotee:       data[i][ATT_COLS.DEVOTEE],
        totalSessions: data[i][ATT_COLS.TOTAL_SESSIONS],
        attended:      data[i][ATT_COLS.ATTENDED],
        percentage:    data[i][ATT_COLS.PERCENTAGE]
      });
    }
  }
  return results;
}

/**
 * Returns attendance summary for a specific devotee across all programs.
 * @param {string} devoteeName
 * @return {Object[]} Array of {programKey, totalSessions, attended, percentage}.
 */
function getDevoteeAttendance(devoteeName) {
  var sheet = getSheet_(SHEET_NAMES.ATTENDANCE);
  if (!sheet) return [];
  var data = getAllData_(sheet);
  var upper = devoteeName.toString().trim().toUpperCase();
  var results = [];
  for (var i = 1; i < data.length; i++) {
    if (data[i][ATT_COLS.DEVOTEE] && data[i][ATT_COLS.DEVOTEE].toString().trim().toUpperCase() === upper) {
      results.push({
        programKey:    data[i][ATT_COLS.PROGRAM_KEY],
        totalSessions: data[i][ATT_COLS.TOTAL_SESSIONS],
        attended:      data[i][ATT_COLS.ATTENDED],
        percentage:    data[i][ATT_COLS.PERCENTAGE]
      });
    }
  }
  return results;
}

/**
 * Stub: Export per-devotee summary to a separate sheet.
 * TODO: Implement custom export logic as needed.
 * @param {string} [targetSheetName] - Name of the export sheet.
 */
function exportPerDevoteeSummary(targetSheetName) {
  targetSheetName = targetSheetName || 'DevoteeSummaryExport';
  logInfo_('Attendance.export', 'TODO: Export to sheet "' + targetSheetName + '"');
  SpreadsheetApp.getUi().alert('Export feature coming soon. Check Logs sheet for details.');
}
