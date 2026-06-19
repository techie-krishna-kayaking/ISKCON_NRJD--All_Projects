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
  var actorId = arguments.length > 1 ? (arguments[1] || '').toString().trim() : '';
  formData = formData || {};

  var ss = getSpreadsheet_();
  var sheet1 = ss.getSheetByName(SHEET_NAMES.PROGRAMS);
  if (!sheet1) throw new Error('Programs sheet not found.');

  var programOwner = (formData.programOwner || '').toString().trim();
  if (!actorId) actorId = programOwner;

  var required = [
    ['programOwner', formData.programOwner],
    ['area', formData.area],
    ['subArea', formData.subArea],
    ['frequency', formData.frequency],
    ['typeOfProgram', formData.typeOfProgram],
    ['language', formData.language],
    ['virtual', formData.virtual],
    ['programStartDate', formData.programStartDate],
    ['day', formData.day],
    ['time', formData.time],
    ['devotees', formData.devotees]
  ];
  for (var r = 0; r < required.length; r++) {
    if (!(required[r][1] || '').toString().trim()) {
      throw new Error('Missing mandatory field: ' + required[r][0]);
    }
  }

  if (!canManageOwnerData(actorId, programOwner)) {
    throw new Error('You are not allowed to create programs for this owner.');
  }

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
    'YES',
    '',
    ''
  ]);

  // Save devotees to tab2
  saveDevoteesToSheet2_(ss, key, formData.devotees);
  enforceWorkbookTextFormat_();

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
    sheet2.appendRow([key, tempCode, devList[i], 0, 0, '0%', '', '', new Date().toISOString()]);
  }
  enforceSheetTextFormat_(sheet2);
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

/**
 * Returns editable program details for a program owner.
 * Program key is returned as read-only identifier.
 * @param {string} ownerId
 * @param {string} programKey
 * @return {Object}
 */
function getOwnerProgramForEdit(ownerId, programKey) {
  ownerId = (ownerId || '').toString().trim();
  programKey = (programKey || '').toString().trim();

  var program = getProgramByKey(programKey);
  if (!program) throw new Error('Program not found.');

  var owner = (program[TAB1_COLS.PROGRAM_OWNER] || '').toString().trim();
  if (!canManageOwnerData(ownerId, owner)) {
    throw new Error('You are not allowed to edit this program.');
  }

  return {
    programKey: program[TAB1_COLS.PROGRAM_KEY] || '',
    area: program[TAB1_COLS.AREA] || '',
    subArea: program[TAB1_COLS.SUB_AREA] || '',
    frequency: program[TAB1_COLS.FREQUENCY] || '',
    typeOfProgram: program[TAB1_COLS.TYPE_OF_PROGRAM] || '',
    language: program[TAB1_COLS.LANGUAGE] || '',
    owner: owner,
    virtual: program[TAB1_COLS.VIRTUAL] || '',
    programStartDate: formatDateISO_(parseDate_(program[TAB1_COLS.PROGRAM_START_DATE])),
    day: program[TAB1_COLS.DAY] || '',
    time: program[TAB1_COLS.TIME] || '',
    actFlag: program[TAB1_COLS.ACT_FLG] || '',
    promoted: program[TAB1_COLS.PROMOTED] || '',
    comment: program[TAB1_COLS.COMMENT] || ''
  };
}

/**
 * Updates owner-editable fields of a program.
 * Program key and shiksha/member keys are immutable primary keys.
 * @param {string} ownerId
 * @param {Object} payload
 * @return {{updated:boolean, programKey:string}}
 */
function updateOwnerProgram(ownerId, payload) {
  ownerId = (ownerId || '').toString().trim();
  payload = payload || {};

  var programKey = (payload.programKey || '').toString().trim();
  if (!programKey) throw new Error('Program key is required.');

  var sheet = getSheet_(SHEET_NAMES.PROGRAMS);
  if (!sheet) throw new Error('Programs sheet not found.');
  var data = getAllData_(sheet);
  if (data.length < 2) throw new Error('No programs found.');

  var targetRow = -1;
  for (var i = 1; i < data.length; i++) {
    var pk = (data[i][TAB1_COLS.PROGRAM_KEY] || '').toString().trim();
    if (pk === programKey) {
      targetRow = i + 1;
      break;
    }
  }
  if (targetRow === -1) throw new Error('Program not found.');

  var owner = (data[targetRow - 1][TAB1_COLS.PROGRAM_OWNER] || '').toString().trim();
  if (!canManageOwnerData(ownerId, owner)) {
    throw new Error('You are not allowed to edit this program.');
  }

  var oldType = (data[targetRow - 1][TAB1_COLS.TYPE_OF_PROGRAM] || '').toString().trim();
  var oldPromoted = (data[targetRow - 1][TAB1_COLS.PROMOTED] || '').toString().trim();
  var incomingType = payload.hasOwnProperty('typeOfProgram') ? (payload.typeOfProgram || '').toString().trim() : oldType;
  var incomingPromoted = payload.hasOwnProperty('promoted') ? (payload.promoted || '').toString().trim() : oldPromoted;
  var promotionChanged = incomingType !== oldType || incomingPromoted !== oldPromoted;
  if (promotionChanged && !isAdminUser(ownerId)) {
    var comment = (payload.comment || '').toString().trim();
    if (!comment) {
      throw new Error('Comment is required when promotion/type is changed.');
    }
  }

  // Immutable / key fields are not edited.
  // TAB1_COLS.PROGRAM_KEY remains unchanged.
  // TAB1_COLS.PROGRAM_OWNER remains unchanged.

  var updates = {
    area: TAB1_COLS.AREA,
    subArea: TAB1_COLS.SUB_AREA,
    frequency: TAB1_COLS.FREQUENCY,
    typeOfProgram: TAB1_COLS.TYPE_OF_PROGRAM,
    language: TAB1_COLS.LANGUAGE,
    virtual: TAB1_COLS.VIRTUAL,
    programStartDate: TAB1_COLS.PROGRAM_START_DATE,
    day: TAB1_COLS.DAY,
    time: TAB1_COLS.TIME,
    actFlag: TAB1_COLS.ACT_FLG,
    promoted: TAB1_COLS.PROMOTED,
    comment: TAB1_COLS.COMMENT
  };

  Object.keys(updates).forEach(function(k) {
    if (!payload.hasOwnProperty(k)) return;
    var val = payload[k];
    if (k === 'programStartDate') {
      val = formatDateISO_(parseDate_(val)) || '';
    }
    if (k === 'virtual' || k === 'actFlag' || k === 'promoted') {
      val = (val || '').toString().trim();
    }
    sheet.getRange(targetRow, updates[k] + 1).setValue(val);
  });

  enforceWorkbookTextFormat_();

  logInfo_('Programs.updateOwnerProgram', 'owner=' + ownerId + ', program=' + programKey + ' updated.');
  return { updated: true, programKey: programKey };
}
