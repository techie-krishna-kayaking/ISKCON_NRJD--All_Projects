// ===== File: Devotees.gs =====
// Responsibility: Devotee and program-participation lookups from tab2,
//                 adding new devotees to programs.

var TAB2_HEADERS = ['ProgramKey', 'ShikshaCode', 'Name'];

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
  var sheet = getSheet_(SHEET_NAMES.DEVOTEES);
  if (!sheet) return null;
  ensureTab2RowSchema_(sheet);

  var cleanProgramKey = (programKey || '').toString().trim();
  var cleanName = parseTab2DevoteeCell_(devoteeName).name;
  if (!cleanProgramKey || !cleanName) return null;

  var tempCode = generateTempShikshaCode_(sheet, cleanProgramKey);
  sheet.appendRow([cleanProgramKey, tempCode, cleanName]);

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
    var name = (data[row][2] || '').toString().trim().toUpperCase();
    if (!name) continue;
    if (name === searchName) {
      var pk = (data[row][0] || '').toString().trim();
      if (pk) programKeys[pk] = true;
    }
  }
  return Object.keys(programKeys);
}

/**
 * Returns normalized tab2 rows for a program.
 * @param {string} programKey
 * @return {Array<{programKey:string, shikshaCode:string, name:string, rowNumber:number}>}
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
    var pk = (data[r][0] || '').toString().trim();
    var sc = (data[r][1] || '').toString().trim();
    var parsed = parseTab2DevoteeCell_(data[r][2]);
    if (!pk || !parsed.name) continue;
    if (pk.toUpperCase() !== keyUpper) continue;
    out.push({ programKey: pk, shikshaCode: sc, name: parsed.name, rowNumber: r + 1 });
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
    var pk = (data[r][0] || '').toString().trim();
    var sc = (data[r][1] || '').toString().trim();
    var nm = parseTab2DevoteeCell_(data[r][2]).name;
    if (!pk || !nm) continue;
    if (pk.toUpperCase() !== keyUpper) continue;
    if (nm.toUpperCase() !== nameUpper) continue;

    if (!sc || isTempTab2Code_(sc, key)) {
      sheet.getRange(r + 1, 2).setValue(code);
      return true;
    }
    if (fallbackRow === -1) fallbackRow = r + 1;
  }

  if (fallbackRow !== -1) {
    sheet.getRange(fallbackRow, 2).setValue(code);
    return true;
  }

  sheet.appendRow([key, code, name]);
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
  if (isRowSchema) return;

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
        rows.push([programKey, tempCode, parsed.name]);
      }
    }
  }

  sheet.clearContents();
  sheet.getRange(1, 1, rows.length, 3).setValues(rows);
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
