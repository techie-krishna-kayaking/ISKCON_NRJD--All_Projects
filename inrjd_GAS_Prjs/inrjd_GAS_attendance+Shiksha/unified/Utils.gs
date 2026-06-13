// ===== File: Utils.gs =====
// Responsibility: Shared helpers — spreadsheet access, header mapping, date parsing,
//                 logging, and reusable utility functions used across all modules.

/**
 * Returns a cached reference to the main spreadsheet.
 * Avoids repeated openById calls.
 * @return {GoogleAppsScript.Spreadsheet.Spreadsheet}
 */
function getSpreadsheet_() {
  if (!getSpreadsheet_._cache) {
    getSpreadsheet_._cache = SpreadsheetApp.openById(CONFIG_SPREADSHEET_ID);
  }
  return getSpreadsheet_._cache;
}

/**
 * Returns a sheet by name from the main spreadsheet.
 * @param {string} name - Sheet name (use SHEET_NAMES constants).
 * @return {GoogleAppsScript.Spreadsheet.Sheet|null}
 */
function getSheet_(name) {
  return getSpreadsheet_().getSheetByName(name);
}

/**
 * Reads all data from a sheet as a 2D array (including headers).
 * Uses batch getValues() for performance.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet
 * @return {Array<Array<*>>}
 */
function getAllData_(sheet) {
  if (!sheet) return [];
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow < 1 || lastCol < 1) return [];
  return sheet.getRange(1, 1, lastRow, lastCol).getValues();
}

/**
 * Builds a header-to-index map from a sheet's first row.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet
 * @return {{headers: string[], headersLower: string[], map: Object<string, number>}}
 */
function getHeaderMap_(sheet) {
  if (!sheet) return { headers: [], headersLower: [], map: {} };
  var lastCol = Math.max(1, sheet.getLastColumn());
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0]
    .map(function(h) { return (h === null || h === undefined) ? '' : h.toString().trim(); });
  var headersLower = headers.map(function(h) { return h.toLowerCase(); });
  var map = {};
  headers.forEach(function(h, i) { map[h] = i; });
  return { headers: headers, headersLower: headersLower, map: map };
}

/**
 * Finds a header index by trying multiple candidate names (case-insensitive).
 * @param {string[]} headersLower - Lowercased header array.
 * @param {string[]} candidates - Possible header names to search for.
 * @return {number} Index or -1 if not found.
 */
function findHeaderIndex_(headersLower, candidates) {
  if (!headersLower || !Array.isArray(candidates)) return -1;
  for (var i = 0; i < candidates.length; i++) {
    var c = (candidates[i] || '').toString().trim().toLowerCase();
    if (!c) continue;
    var idx = headersLower.indexOf(c);
    if (idx !== -1) return idx;
  }
  return -1;
}

/**
 * Maps a data row to an object using the headers array.
 * @param {string[]} headers
 * @param {Array<*>} row
 * @return {Object<string, string>}
 */
function mapRowToHeaders_(headers, row) {
  var out = {};
  for (var i = 0; i < headers.length; i++) {
    var hdr = (headers[i] || '').toString();
    out[hdr] = (row && row[i] !== undefined && row[i] !== null) ? row[i].toString() : '';
  }
  return out;
}

/**
 * Parses various date formats to a Date object, returns null on failure.
 * @param {*} val
 * @return {Date|null}
 */
function parseDate_(val) {
  if (!val) return null;
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
  var s = val.toString().trim();
  var d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Formats a Date to 'YYYY-MM-DD' string.
 * @param {Date} d
 * @return {string}
 */
function formatDateISO_(d) {
  if (!d || isNaN(d.getTime())) return '';
  var y = d.getFullYear();
  var m = ('0' + (d.getMonth() + 1)).slice(-2);
  var day = ('0' + d.getDate()).slice(-2);
  return y + '-' + m + '-' + day;
}

// ────────────────────────────────────────
// LOGGING
// ────────────────────────────────────────

/**
 * Logs a message to Apps Script Logger and optionally to a "Logs" sheet.
 * @param {string} level - 'INFO', 'WARN', 'ERROR'.
 * @param {string} source - Module/function name.
 * @param {string} message
 */
function nrjdLog_(level, source, message) {
  var ts = new Date().toISOString();
  var logLine = '[' + ts + '] [' + level + '] [' + source + '] ' + message;
  Logger.log(logLine);

  // Append to Logs sheet (create if missing)
  try {
    var ss = getSpreadsheet_();
    var logSheet = ss.getSheetByName(SHEET_NAMES.LOGS);
    if (!logSheet) {
      logSheet = ss.insertSheet(SHEET_NAMES.LOGS);
      logSheet.appendRow(['TIMESTAMP', 'LEVEL', 'SOURCE', 'MESSAGE']);
    }
    logSheet.appendRow([ts, level, source, message]);
  } catch (e) {
    // Silently fail — don't break the main flow for logging.
    Logger.log('Logging to sheet failed: ' + e.message);
  }
}

/**
 * Convenience: info-level log.
 * @param {string} source
 * @param {string} message
 */
function logInfo_(source, message) {
  nrjdLog_('INFO', source, message);
}

/**
 * Convenience: warning-level log.
 * @param {string} source
 * @param {string} message
 */
function logWarn_(source, message) {
  nrjdLog_('WARN', source, message);
}

/**
 * Convenience: error-level log.
 * @param {string} source
 * @param {string} message
 */
function logError_(source, message) {
  nrjdLog_('ERROR', source, message);
}
