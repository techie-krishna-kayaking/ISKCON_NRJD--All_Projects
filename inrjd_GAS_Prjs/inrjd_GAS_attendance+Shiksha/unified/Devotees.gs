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
  var sheet = getSheet_(SHEET_NAMES.DEVOTEES);
  if (!sheet) return [];
  var data = getAllData_(sheet);
  if (data.length < 1) return [];

  var attendees = [];
  var programIndex = data[0].indexOf(programKey);

  if (programIndex > -1) {
    for (var i = 1; i < data.length; i++) {
      if (data[i][programIndex]) {
        attendees.push(data[i][programIndex].toString());
      }
    }
  }
  return attendees;
}

/**
 * Validates that a devotee name exists under a specific program in tab2.
 * @param {string} programKey
 * @param {string} devoteeName
 * @return {boolean}
 */
function isValidDevotee(programKey, devoteeName) {
  var attendees = getAttendees(programKey);
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
  var data = getAllData_(sheet);
  var programIndex = data[0].indexOf(programKey);

  if (programIndex > -1) {
    // Find first empty slot in this column
    for (var i = 1; i < data.length; i++) {
      if (!data[i][programIndex]) {
        sheet.getRange(i + 1, programIndex + 1).setValue(devoteeName);
        logInfo_('Devotees.addDevotee', 'Added "' + devoteeName + '" to program ' + programKey);
        return devoteeName;
      }
    }
    // All rows filled — append to new row
    var newRow = new Array(programIndex).fill('');
    newRow.push(devoteeName);
    sheet.appendRow(newRow);
    logInfo_('Devotees.addDevotee', 'Appended "' + devoteeName + '" to program ' + programKey);
    return devoteeName;
  }
  return null;
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
  var data = getAllData_(sheet);
  if (data.length < 2) return [];

  var programKeys = [];
  var searchName = devoteeName.toString().trim().toUpperCase();

  for (var col = 0; col < data[0].length; col++) {
    var pKey = data[0][col];
    if (!pKey) continue;
    for (var row = 1; row < data.length; row++) {
      if (data[row][col] && data[row][col].toString().trim().toUpperCase() === searchName) {
        programKeys.push(pKey.toString());
        break;
      }
    }
  }
  return programKeys;
}
