// ===== File: Programs.gs =====
// Responsibility: Program metadata lookups from tab1, program creation,
//                 key generation, and Config sheet reading.

/**
 * Looks up program metadata from tab1 by PROGRAM KEY.
 * @param {string} programKey
 * @return {Array<*>|null} The full row array, or null if not found.
 */
function getProgramByKey(programKey) {
  var sheet = getSheet_(SHEET_NAMES.PROGRAMS);
  if (!sheet) return null;
  var data = getAllData_(sheet);
  for (var i = 1; i < data.length; i++) {
    if (data[i][TAB1_COLS.PROGRAM_KEY] === programKey) {
      return data[i];
    }
  }
  return null;
}

/**
 * Validates that a PROGRAM KEY exists in tab1.
 * @param {string} programKey
 * @return {boolean}
 */
function isValidProgramKey(programKey) {
  return getProgramByKey(programKey) !== null;
}

/**
 * Returns all programs for a given program owner (used by attendance portal login).
 * @param {string} ownerId - The program owner ID (matches column 6 of tab1).
 * @return {Object[]} Array of program metadata objects.
 */
function getPrograms(ownerId) {
  var sheet = getSheet_(SHEET_NAMES.PROGRAMS);
  if (!sheet) return [];
  var data = getAllData_(sheet);
  var programs = [];

  for (var i = 1; i < data.length; i++) {
    if (data[i][TAB1_COLS.PROGRAM_OWNER] === ownerId) {
      var programStartDate = data[i][TAB1_COLS.PROGRAM_START_DATE]
        ? new Date(data[i][TAB1_COLS.PROGRAM_START_DATE]).toLocaleDateString()
        : 'N/A';
      programs.push({
        programKey:       data[i][TAB1_COLS.PROGRAM_KEY],
        area:             data[i][TAB1_COLS.AREA],
        subArea:          data[i][TAB1_COLS.SUB_AREA],
        owner:            data[i][TAB1_COLS.PROGRAM_OWNER],
        frequency:        data[i][TAB1_COLS.FREQUENCY],
        typeOfProgram:    data[i][TAB1_COLS.TYPE_OF_PROGRAM],
        language:         data[i][TAB1_COLS.LANGUAGE],
        virtual:          data[i][TAB1_COLS.VIRTUAL],
        programStartDate: programStartDate,
        day:              data[i][TAB1_COLS.DAY],
        time:             data[i][TAB1_COLS.TIME],
        actFlag:          data[i][TAB1_COLS.ACT_FLG],
        promoted:         data[i][TAB1_COLS.PROMOTED]
      });
    }
  }
  return programs;
}

/**
 * Generates a unique program key from owner prefix + incrementing number.
 * @param {string} programOwner
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - tab1 sheet.
 * @return {string}
 */
function generateProgramKey_(programOwner, sheet) {
  var keys = sheet.getRange('A:A').getValues();
  var count = 1;

  keys.forEach(function(key) {
    var val = key[0];
    if (val && val.toString().startsWith(programOwner)) {
      var numStr = val.toString().replace(programOwner, '');
      var num = parseInt(numStr, 10);
      if (!isNaN(num) && num >= count) {
        count = num + 1;
      }
    }
  });

  return programOwner + count.toString().padStart(3, '0');
}

/**
 * Submits a new program from the New Program form.
 * Writes to tab1 (program metadata) and tab2 (devotees mapping).
 * @param {Object} formData - Form fields from the HTML form.
 * @return {string} Success message.
 */
function submitForm(formData) {
  var ss = getSpreadsheet_();
  var sheet1 = ss.getSheetByName(SHEET_NAMES.PROGRAMS);
  var programOwner = formData.programOwner;
  var key = generateProgramKey_(programOwner, sheet1);

  sheet1.appendRow([
    key,
    formData.area,
    formData.subArea,
    formData.frequency,
    formData.typeOfProgram,
    formData.language,
    formData.programOwner,
    formData.virtual === 'Yes' ? 'Yes' : 'No',
    formData.programStartDate,
    formData.day,
    formData.time,
    'YES'  // ACT_FLG
  ]);

  // Save devotees to tab2
  saveDevoteesToSheet2_(ss, key, formData.devotees);

  logInfo_('Programs.submitForm', 'New program created: ' + key);
  return 'Form submitted successfully!\nContact DB Admin for any changes';
}

/**
 * Saves devotees list to tab2 row schema: ProgramKey, ShikshaCode, Name.
 * @param {GoogleAppsScript.Spreadsheet.Spreadsheet} ss
 * @param {string} key - Program key.
 * @param {string} devotees - Comma-separated devotee names.
 * @private
 */
function saveDevoteesToSheet2_(ss, key, devotees) {
  var sheet2 = ss.getSheetByName(SHEET_NAMES.DEVOTEES);
  if (!sheet2) return;

  ensureTab2RowSchema_(sheet2);

  if (!devotees || devotees.trim() === '') return;

  var devList = devotees
    .split(',')
    .map(function(n) { return parseTab2DevoteeCell_(n).name; })
    .filter(function(n) { return n !== ''; });

  for (var i = 0; i < devList.length; i++) {
    var tempCode = generateTempShikshaCode_(sheet2, key);
    sheet2.appendRow([key, tempCode, devList[i]]);
  }
}

/**
 * Reads Config sheet and returns all configuration dropdown values.
 * Used by the New Program form to populate dropdowns.
 * @return {Object} Config values keyed by column header.
 */
function getConfigValues() {
  var configSheet = getSheet_(SHEET_NAMES.CONFIG);
  if (!configSheet) return {};
  var data = configSheet.getDataRange().getValues();
  var headers = data.shift();

  var config = {};
  headers.forEach(function(header, index) {
    config[header] = data
      .map(function(row) { return row[index]; })
      .filter(function(v) { return v && v.toString().trim() !== ''; });
  });

  return config;
}

/**
 * Returns attendees and program type for a selected program.
 * Used by the attendance form to render the attendance table.
 * @param {string} programKey
 * @return {{attendees: string[], programType: string}}
 */
function getAttendeesAndProgramType(programKey) {
  var programDetails = getProgramByKey(programKey);
  var programType = programDetails ? programDetails[TAB1_COLS.TYPE_OF_PROGRAM] : '';

  var attendees = getAttendees(programKey);

  return {
    attendees: attendees,
    programType: programType
  };
}
