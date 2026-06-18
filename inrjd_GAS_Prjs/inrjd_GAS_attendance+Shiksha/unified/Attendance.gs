// ===== File: Attendance.gs =====
// Responsibility: All attendance logic — recording, upsert, and lookups.
//                 In 3-tab mode, attendance snapshot is stored directly in tab2.

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

  var sheet = getSheet_(SHEET_NAMES.DEVOTEES);
  if (!sheet) {
    logError_('Attendance.record', 'tab2 sheet not found');
    return;
  }
  ensureTab2RowSchema_(sheet);

  var allRows = getAllData_(sheet);
  if (allRows.length < 1) {
    sheet.appendRow(TAB2_HEADERS);
    allRows = getAllData_(sheet);
  }

  var byProgramName = {};
  for (var r = 1; r < allRows.length; r++) {
    var rowPk = (allRows[r][TAB2_COLS.PROGRAM_KEY] || '').toString().trim();
    var rowName = parseTab2DevoteeCell_(allRows[r][TAB2_COLS.NAME]).name;
    if (!rowPk || !rowName) continue;
    var lk = rowPk.toUpperCase() + '|' + rowName.toUpperCase();
    byProgramName[lk] = { rowIndex: r + 1, row: allRows[r] };
  }

  var statusByName = {};
  for (var i = 0; i < attendees.length; i++) {
    var nm = parseTab2DevoteeCell_(attendees[i]).name;
    if (!nm) continue;
    statusByName[nm.toUpperCase()] = attendanceStatus[i] === 'present' ? 'present' : 'absent';
  }

  var targetRows = getTab2RowsForProgram(programKey);
  var updates = [];
  var added = 0;

  for (var j = 0; j < targetRows.length; j++) {
    var entry = targetRows[j];
    var keyUpper = entry.name.toUpperCase();
    var status = statusByName.hasOwnProperty(keyUpper) ? statusByName[keyUpper] : 'absent';
    var isPresent = status === 'present' ? 1 : 0;
    var totalSessions = (Number(entry.totalSessions) || 0) + 1;
    var attended = (Number(entry.attended) || 0) + isPresent;
    var pct = totalSessions > 0 ? Math.round((attended / totalSessions) * 100) + '%' : '0%';

    updates.push({
      rowIndex: entry.rowNumber,
      totalSessions: totalSessions,
      attended: attended,
      pct: pct,
      date: date,
      status: status,
      updatedAt: new Date().toISOString()
    });
  }

  // Add any attendee missing in tab2 program list (safety net).
  for (var k = 0; k < attendees.length; k++) {
    var cleanName = parseTab2DevoteeCell_(attendees[k]).name;
    if (!cleanName) continue;
    var mapKey = programKey.toUpperCase() + '|' + cleanName.toUpperCase();
    if (byProgramName[mapKey]) continue;

    var status2 = attendanceStatus[k] === 'present' ? 'present' : 'absent';
    var attended2 = status2 === 'present' ? 1 : 0;
    var tempCode = generateTempShikshaCode_(sheet, programKey);
    sheet.appendRow([
      programKey,
      tempCode,
      cleanName,
      1,
      attended2,
      attended2 ? '100%' : '0%',
      date,
      status2,
      new Date().toISOString()
    ]);
    added++;
  }

  updates.forEach(function(u) {
    sheet.getRange(u.rowIndex, TAB2_COLS.TOTAL_SESSIONS + 1).setValue(u.totalSessions);
    sheet.getRange(u.rowIndex, TAB2_COLS.ATTENDED + 1).setValue(u.attended);
    sheet.getRange(u.rowIndex, TAB2_COLS.PERCENTAGE + 1).setValue(u.pct);
    sheet.getRange(u.rowIndex, TAB2_COLS.LAST_ATT_DATE + 1).setValue(u.date);
    sheet.getRange(u.rowIndex, TAB2_COLS.LAST_STATUS + 1).setValue(u.status);
    sheet.getRange(u.rowIndex, TAB2_COLS.UPDATED_AT + 1).setValue(u.updatedAt);
  });

  var elapsed = ((new Date() - startTime) / 1000).toFixed(1);
  logInfo_('Attendance.record',
    'Done. Updated ' + updates.length + ' rows, appended ' + added +
    ' new rows. Time: ' + elapsed + 's');
}

/**
 * Returns attendance summary rows for a given program key.
 * @param {string} programKey
 * @return {Object[]} Array of {devotee, totalSessions, attended, percentage}.
 */
function getAttendanceSummary(programKey) {
  return getTab2RowsForProgram(programKey).map(function(r) {
    return {
      devotee: r.name,
      totalSessions: r.totalSessions,
      attended: r.attended,
      percentage: r.attendancePct || '0%'
    };
  });
}

/**
 * Returns attendance summary for a specific devotee across all programs.
 * @param {string} devoteeName
 * @return {Object[]} Array of {programKey, totalSessions, attended, percentage}.
 */
function getDevoteeAttendance(devoteeName) {
  var sheet = getSheet_(SHEET_NAMES.DEVOTEES);
  if (!sheet) return [];
  ensureTab2RowSchema_(sheet);

  var data = getAllData_(sheet);
  var upper = parseTab2DevoteeCell_(devoteeName).name.toString().trim().toUpperCase();
  var results = [];

  for (var i = 1; i < data.length; i++) {
    var nm = parseTab2DevoteeCell_(data[i][TAB2_COLS.NAME]).name;
    if (nm && nm.toString().trim().toUpperCase() === upper) {
      results.push({
        programKey:    data[i][TAB2_COLS.PROGRAM_KEY],
        totalSessions: Number(data[i][TAB2_COLS.TOTAL_SESSIONS]) || 0,
        attended:      Number(data[i][TAB2_COLS.ATTENDED]) || 0,
        percentage:    (data[i][TAB2_COLS.PERCENTAGE] || '0%').toString()
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
