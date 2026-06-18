// ===== File: Devotees.gs =====
// Responsibility: Devotee and program-participation lookups from tab2,
//                 adding new devotees to programs.

/**
 * Fetches all devotee names for a given program key from tab2.
 * Tab2 is wide format: row 1 = program keys, rows 2+ = devotee names per column.
 * @param {string} programKey
 * @return {string[]} Array of devotee names.
 */
function getAttendees(programKey) {
  var rows = getTab2RowsForProgram(programKey);
  return rows.map(function(r) {
    if (r.shikshaCode) return r.name + ' | ' + r.shikshaCode;
    return r.name;
  });
}

/**
 * Validates that a devotee name exists under a specific program in tab2.
 * @param {string} programKey
 * @param {string} devoteeName
 * @return {boolean}
 */
function isValidDevotee(programKey, devoteeName) {
  var attendees = getProgramDevoteeNames(programKey);
  var upper = devoteeName.toString().trim().toUpperCase();
  return attendees.some(function(a) {
    return a.toString().trim().toUpperCase() === upper;
  });
}

/**
 * Adds a new devotee to a program column in tab2.
 * Finds the first empty cell in that program's column and writes the name.
 * @param {string} programKey
 * @param {string} devoteeName
 * @return {string|null} The added name, or null if program not found.
 */
function addDevotee(programKey, devoteeName) {
  var ownerId = arguments.length > 2 ? (arguments[2] || '').toString().trim() : '';
  var sheet = getSheet_(SHEET_NAMES.DEVOTEES);
  if (!sheet) return null;
  ensureTab2RowSchema_(sheet);

  var cleanProgramKey = (programKey || '').toString().trim();
  var cleanName = parseTab2DevoteeCell_(devoteeName).name;
  if (!cleanProgramKey || !cleanName) return null;

  if (ownerId) {
    var program = getProgramByKey(cleanProgramKey);
    if (!program) throw new Error('Program not found.');
    var owner = (program[TAB1_COLS.PROGRAM_OWNER] || '').toString().trim();
    if (owner.toUpperCase() !== ownerId.toUpperCase()) {
      throw new Error('You are not allowed to add members to this program.');
    }
  }

  var tempCode = generateTempShikshaCode_(sheet, cleanProgramKey);
  sheet.appendRow([
    cleanProgramKey,
    tempCode,
    cleanName,
    0,
    0,
    '0%',
    '',
    '',
    _nowIsoForTab2_()
  ]);

  logInfo_('Devotees.addDevotee', 'Added "' + cleanName + '" to program ' + cleanProgramKey + ' with temp code ' + tempCode);
  return cleanName;
}

/**
 * Gets all program keys a devotee belongs to.
 * Searches all columns of tab2 for the devotee name.
 * @param {string} devoteeName
 * @return {string[]} Array of program keys.
 */
function getProgramsForDevotee(devoteeName) {
  var sheet = getSheet_(SHEET_NAMES.DEVOTEES);
  if (!sheet) return [];
  ensureTab2RowSchema_(sheet);

  var data = getAllData_(sheet);
  if (data.length < 2) return [];

  var searchName = (devoteeName || '').toString().trim().toUpperCase();
  var programKeys = {};

  for (var row = 1; row < data.length; row++) {
    var name = (data[row][TAB2_COLS.NAME] || '').toString().trim().toUpperCase();
    if (!name) continue;
    if (name === searchName) {
      var pk = (data[row][TAB2_COLS.PROGRAM_KEY] || '').toString().trim();
      if (pk) programKeys[pk] = true;
    }
  }
  return Object.keys(programKeys);
}

/**
 * Returns normalized tab2 rows for a program.
 * @param {string} programKey
 * @return {Array<{programKey:string, shikshaCode:string, name:string, totalSessions:number, attended:number, attendancePct:string, lastAttDate:string, lastStatus:string, updatedAt:string, rowNumber:number}>}
 */
function getTab2RowsForProgram(programKey) {
  var sheet = getSheet_(SHEET_NAMES.DEVOTEES);
  if (!sheet) return [];
  ensureTab2RowSchema_(sheet);

  var data = getAllData_(sheet);
  if (data.length < 2) return [];

  var out = [];
  var keyUpper = (programKey || '').toString().trim().toUpperCase();
  for (var r = 1; r < data.length; r++) {
    var pk = (data[r][TAB2_COLS.PROGRAM_KEY] || '').toString().trim();
    var sc = (data[r][TAB2_COLS.SHIKSHA_CODE] || '').toString().trim();
    var parsed = parseTab2DevoteeCell_(data[r][TAB2_COLS.NAME]);
    if (!pk || !parsed.name) continue;
    if (pk.toUpperCase() !== keyUpper) continue;
    out.push({
      programKey: pk,
      shikshaCode: sc,
      name: parsed.name,
      totalSessions: Number(data[r][TAB2_COLS.TOTAL_SESSIONS]) || 0,
      attended: Number(data[r][TAB2_COLS.ATTENDED]) || 0,
      attendancePct: (data[r][TAB2_COLS.PERCENTAGE] || '').toString().trim(),
      lastAttDate: (data[r][TAB2_COLS.LAST_ATT_DATE] || '').toString().trim(),
      lastStatus: (data[r][TAB2_COLS.LAST_STATUS] || '').toString().trim(),
      updatedAt: (data[r][TAB2_COLS.UPDATED_AT] || '').toString().trim(),
      rowNumber: r + 1
    });
  }
  return out;
}

/**
 * Returns clean devotee names for a program from tab2.
 * @param {string} programKey
 * @return {string[]}
 */
function getProgramDevoteeNames(programKey) {
  return getTab2RowsForProgram(programKey).map(function(r) { return r.name; });
}

/**
 * Updates tab2 shiksha code for a devotee-program row after biodata submission.
 * If matching row does not exist, appends a new one.
 * @param {string} programKey
 * @param {string} devoteeName
 * @param {string} shikshaCode
 * @return {boolean}
 */
function updateTab2ShikshaCode(programKey, devoteeName, shikshaCode) {
  var sheet = getSheet_(SHEET_NAMES.DEVOTEES);
  if (!sheet) return false;
  ensureTab2RowSchema_(sheet);

  var key = (programKey || '').toString().trim();
  var name = parseTab2DevoteeCell_(devoteeName).name;
  var code = (shikshaCode || '').toString().trim();
  if (!key || !name || !code) return false;

  var data = getAllData_(sheet);
  var nameUpper = name.toUpperCase();
  var keyUpper = key.toUpperCase();

  // Prefer latest row where code is temp or blank.
  var fallbackRow = -1;
  for (var r = data.length - 1; r >= 1; r--) {
    var pk = (data[r][TAB2_COLS.PROGRAM_KEY] || '').toString().trim();
    var sc = (data[r][TAB2_COLS.SHIKSHA_CODE] || '').toString().trim();
    var nm = parseTab2DevoteeCell_(data[r][TAB2_COLS.NAME]).name;
    if (!pk || !nm) continue;
    if (pk.toUpperCase() !== keyUpper) continue;
    if (nm.toUpperCase() !== nameUpper) continue;

    if (!sc || isTempTab2Code_(sc, key)) {
      sheet.getRange(r + 1, 2).setValue(code);
      sheet.getRange(r + 1, TAB2_COLS.UPDATED_AT + 1).setValue(_nowIsoForTab2_());
      return true;
    }
    if (fallbackRow === -1) fallbackRow = r + 1;
  }

  if (fallbackRow !== -1) {
    sheet.getRange(fallbackRow, 2).setValue(code);
    sheet.getRange(fallbackRow, TAB2_COLS.UPDATED_AT + 1).setValue(_nowIsoForTab2_());
    return true;
  }

  sheet.appendRow([key, code, name, 0, 0, '0%', '', '', _nowIsoForTab2_()]);
  return true;
}

/**
 * Ensures tab2 is in row schema. Migrates from wide schema if needed.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet
 * @private
 */
function ensureTab2RowSchema_(sheet) {
  var data = getAllData_(sheet);
  if (data.length === 0) {
    sheet.appendRow(TAB2_HEADERS);
    return;
  }

  var header = data[0].map(function(h) { return (h || '').toString().trim().toLowerCase(); });
  var isRowSchema = header[0] === 'programkey' && header[1] === 'shikshacode' && header[2] === 'name';
  if (isRowSchema) {
    // Ensure attendance snapshot columns exist.
    for (var i = 0; i < TAB2_HEADERS.length; i++) {
      sheet.getRange(1, i + 1).setValue(TAB2_HEADERS[i]);
    }
    return;
  }

  migrateTab2WideToRows_(sheet, data);
}

/**
 * Migrates old wide tab2 to row schema:
 * row1 program keys + devotee names in columns -> ProgramKey, ShikshaCode, Name rows.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet
 * @param {Array<Array<*>>} existingData
 * @private
 */
function migrateTab2WideToRows_(sheet, existingData) {
  var rows = [TAB2_HEADERS];
  var sequenceByProgram = {};

  if (existingData && existingData.length > 0) {
    var headers = existingData[0] || [];
    for (var c = 0; c < headers.length; c++) {
      var programKey = (headers[c] || '').toString().trim();
      if (!programKey) continue;
      sequenceByProgram[programKey] = 0;
      for (var r = 1; r < existingData.length; r++) {
        var parsed = parseTab2DevoteeCell_(existingData[r][c]);
        if (!parsed.name) continue;
        sequenceByProgram[programKey]++;
        var tempCode = buildTempTab2Code_(programKey, sequenceByProgram[programKey]);
        rows.push([programKey, tempCode, parsed.name, 0, 0, '0%', '', '', _nowIsoForTab2_()]);
      }
    }
  }

  sheet.clearContents();
  sheet.getRange(1, 1, rows.length, TAB2_HEADERS.length).setValues(rows);
  logInfo_('Devotees.migrateTab2', 'Migrated tab2 to row schema with ' + (rows.length - 1) + ' rows.');
}

/**
 * Generates next temp code for a program key.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet
 * @param {string} programKey
 * @return {string}
 * @private
 */
function generateTempShikshaCode_(sheet, programKey) {
  var data = getAllData_(sheet);
  var keyUpper = programKey.toUpperCase();
  var maxSeq = 0;

  for (var r = 1; r < data.length; r++) {
    var pk = (data[r][0] || '').toString().trim();
    if (!pk || pk.toUpperCase() !== keyUpper) continue;
    var code = (data[r][1] || '').toString().trim();
    var m = code.match(new RegExp('^temp_' + programKey + '_(\\\\d{3})$', 'i'));
    if (m) {
      var seq = Number(m[1]) || 0;
      if (seq > maxSeq) maxSeq = seq;
    }
  }
  return buildTempTab2Code_(programKey, maxSeq + 1);
}

/**
 * @param {string} programKey
 * @param {number} sequence
 * @return {string}
 * @private
 */
function buildTempTab2Code_(programKey, sequence) {
  return 'temp_' + programKey + '_' + String(sequence).padStart(3, '0');
}

/**
 * @param {string} code
 * @param {string} programKey
 * @return {boolean}
 * @private
 */
function isTempTab2Code_(code, programKey) {
  code = (code || '').toString().trim();
  var key = (programKey || '').toString().trim();
  if (!code || !key) return false;
  return new RegExp('^temp_' + key + '_\\\\d{3}$', 'i').test(code);
}

/**
 * Parses tab2 name cell and strips appended code markers when present.
 * @param {*} raw
 * @return {{name:string, shikshaCode:string}}
 * @private
 */
function parseTab2DevoteeCell_(raw) {
  var text = (raw || '').toString().trim();
  if (!text) return { name: '', shikshaCode: '' };

  var code = '';
  var mPipe = text.match(/\|\s*([A-Za-z0-9_-]{8,30})\s*$/);
  var mParen = text.match(/\(([A-Za-z0-9_-]{8,30})\)\s*$/);
  if (mPipe) code = mPipe[1];
  else if (mParen) code = mParen[1];

  var name = text;
  if (code) {
    name = name.replace(code, '').replace(/[|()\[\]{}]/g, ' ');
    name = name.replace(/\s{2,}/g, ' ').trim();
  }
  return { name: name || text, shikshaCode: code || '' };
}

function _nowIsoForTab2_() {
  return new Date().toISOString();
}

/**
 * Renames a member for a program (owner-scoped).
 * Updates tab2 Name and active tab3 rows for the same program.
 * Primary keys (ProgramKey, ShikshaCode) are never changed.
 * @param {string} ownerId
 * @param {string} programKey
 * @param {string} oldName
 * @param {string} newName
 * @return {{updatedTab2:number, updatedTab3:number}}
 */
function renameMemberForOwner(ownerId, programKey, oldName, newName) {
  ownerId = (ownerId || '').toString().trim();
  programKey = (programKey || '').toString().trim();
  oldName = parseTab2DevoteeCell_(oldName).name;
  newName = parseTab2DevoteeCell_(newName).name;

  if (!ownerId || !programKey || !oldName || !newName) {
    throw new Error('Missing required fields.');
  }
  if (oldName.toUpperCase() === newName.toUpperCase()) {
    return { updatedTab2: 0, updatedTab3: 0 };
  }

  var program = getProgramByKey(programKey);
  if (!program) throw new Error('Program not found.');
  if ((program[TAB1_COLS.PROGRAM_OWNER] || '').toString().trim().toUpperCase() !== ownerId.toUpperCase()) {
    throw new Error('You are not allowed to edit this program members.');
  }

  var updatedTab2 = 0;
  var tab2 = getSheet_(SHEET_NAMES.DEVOTEES);
  if (!tab2) throw new Error('tab2 not found.');
  ensureTab2RowSchema_(tab2);

  var data2 = getAllData_(tab2);
  for (var r = 1; r < data2.length; r++) {
    var pk = (data2[r][TAB2_COLS.PROGRAM_KEY] || '').toString().trim();
    var nm = parseTab2DevoteeCell_(data2[r][TAB2_COLS.NAME]).name;
    if (!pk || !nm) continue;
    if (pk.toUpperCase() !== programKey.toUpperCase()) continue;
    if (nm.toUpperCase() !== oldName.toUpperCase()) continue;

    tab2.getRange(r + 1, TAB2_COLS.NAME + 1).setValue(newName);
    tab2.getRange(r + 1, TAB2_COLS.UPDATED_AT + 1).setValue(_nowIsoForTab2_());
    updatedTab2++;
  }

  var updatedTab3 = 0;
  var tab3 = getSheet_(SHEET_NAMES.PARTICIPANTS);
  if (tab3) {
    var meta = getHeaderMap_(tab3);
    var h = meta.headersLower;
    var idxProgram = findHeaderIndex_(h, ['program key', 'program_key', 'program']);
    var idxName = findHeaderIndex_(h, ['name', 'fname', 'devotee_name', 'full_name']);
    var idxActive = findHeaderIndex_(h, ['active_flg', 'active_flag', 'active']);

    var data3 = getAllData_(tab3);
    for (var i = 1; i < data3.length; i++) {
      var row = data3[i];
      var pk3 = idxProgram >= 0 ? (row[idxProgram] || '').toString().trim() : '';
      var nm3 = idxName >= 0 ? (row[idxName] || '').toString().trim() : '';
      if (!pk3 || !nm3) continue;
      if (pk3.toUpperCase() !== programKey.toUpperCase()) continue;
      if (nm3.toUpperCase() !== oldName.toUpperCase()) continue;
      if (idxActive >= 0 && (row[idxActive] || '').toString().trim().toUpperCase() !== 'Y') continue;

      tab3.getRange(i + 1, idxName + 1).setValue(newName);
      updatedTab3++;
    }
  }

  if (!updatedTab2) throw new Error('Member not found in this program.');

  logInfo_('Devotees.renameMemberForOwner',
    'owner=' + ownerId + ', program=' + programKey + ', old=' + oldName + ', new=' + newName +
    ', tab2=' + updatedTab2 + ', tab3=' + updatedTab3);

  return { updatedTab2: updatedTab2, updatedTab3: updatedTab3 };
}

/**
 * Owner-scoped member list for a program.
 * @param {string} ownerId
 * @param {string} programKey
 * @return {Array<{programKey:string, shikshaCode:string, name:string, totalSessions:number, attended:number, attendancePct:string, lastAttDate:string, lastStatus:string, updatedAt:string, rowNumber:number}>}
 */
function getOwnerProgramMembers(ownerId, programKey) {
  ownerId = (ownerId || '').toString().trim();
  programKey = (programKey || '').toString().trim();
  if (!ownerId || !programKey) return [];

  var program = getProgramByKey(programKey);
  if (!program) throw new Error('Program not found.');
  var owner = (program[TAB1_COLS.PROGRAM_OWNER] || '').toString().trim();
  if (owner.toUpperCase() !== ownerId.toUpperCase()) {
    throw new Error('You are not allowed to view members for this program.');
  }

  return getTab2RowsForProgram(programKey);
}
