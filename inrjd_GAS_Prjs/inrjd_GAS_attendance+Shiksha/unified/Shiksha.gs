// ===== File: Shiksha.gs =====
// Responsibility: Shiksha participant biodata (tab5) — search, validate,
//                 generate codes, submit bio forms and shiksha certification forms.
//                 Uses SCD2 pattern (ACTIVE_FLG) for row versioning.

/**
 * Searches tab5 for records matching a query (shiksha code, aadhar, or program key).
 * Returns active ('Y') records, searching bottom-up for most recent.
 * @param {string} query
 * @return {{matches: Object[], queryType: string}}
 */
function findShikshaByQuery(query) {
  query = (query || '').toString().trim();
  if (!query) return { matches: [], queryType: 'none' };

  var bioMeta = getHeaderMap_(getSheet_(SHEET_NAMES.PARTICIPANTS));
  var bioSheet = getSheet_(SHEET_NAMES.PARTICIPANTS);
  if (!bioSheet) return { matches: [], queryType: 'none' };

  var lastRow = bioSheet.getLastRow();
  if (lastRow < 2) return { matches: [], queryType: 'none' };

  var headers = bioMeta.headers;
  var headersLower = bioMeta.headersLower;
  var lastCol = headers.length;

  var idxShiksha = findHeaderIndex_(headersLower, ['shiksha_code', 'siksha code', 'shiksha code', 'shiksha', 'siksha_code']);
  var idxAadhar  = findHeaderIndex_(headersLower, ['aadhar', 'aadhaar', 'aadhar_no', 'aadhar number', 'aadhaar_no']);
  var idxProgram = findHeaderIndex_(headersLower, ['program_key', 'program key', 'program', 'programid', 'program_id']);
  var idxActive  = findHeaderIndex_(headersLower, ['active_flg', 'active_flag', 'active', 'active flag']);
  var idxName    = findHeaderIndex_(headersLower, ['name', 'fname', 'devotee_name', 'full_name']);

  var data = bioSheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  var qUpper = query.toUpperCase();

  var validNames = getProgramDevoteeNames(qUpper).map(function(n) { return n.toUpperCase(); });

  // 1) Search by Shiksha Code (bottom-up; prefer active 'Y')
  if (idxShiksha >= 0) {
    for (var r = data.length - 1; r >= 0; r--) {
      var codeVal = (data[r][idxShiksha] || '').toString().trim();
      if (codeVal === query) {
        if (idxActive >= 0) {
          var av = (data[r][idxActive] || '').toString().trim().toUpperCase();
          if (av === 'Y') return { matches: [{ rowIndex: r + 2, mapped: mapRowToHeaders_(headers, data[r]) }], queryType: 'shiksha' };
        } else {
          return { matches: [{ rowIndex: r + 2, mapped: mapRowToHeaders_(headers, data[r]) }], queryType: 'shiksha' };
        }
      }
    }
  }

  // 2) Search by Aadhar (bottom-up; prefer active 'Y')
  if (idxAadhar >= 0) {
    for (var r2 = data.length - 1; r2 >= 0; r2--) {
      var aVal = (data[r2][idxAadhar] || '').toString().trim();
      if (aVal === query) {
        if (idxActive >= 0) {
          var av2 = (data[r2][idxActive] || '').toString().trim().toUpperCase();
          if (av2 === 'Y') return { matches: [{ rowIndex: r2 + 2, mapped: mapRowToHeaders_(headers, data[r2]) }], queryType: 'aadhar' };
        } else {
          return { matches: [{ rowIndex: r2 + 2, mapped: mapRowToHeaders_(headers, data[r2]) }], queryType: 'aadhar' };
        }
      }
    }
  }

  // 3) Search by Program Key (validate names in tab2)
  if (idxProgram >= 0) {
    var matches = [];
    for (var r3 = 0; r3 < data.length; r3++) {
      var pVal = (data[r3][idxProgram] || '').toString().trim().toUpperCase();
      var nameVal = (data[r3][idxName] || '').toString().trim().toUpperCase();
      if (!pVal || !nameVal) continue;

      if (pVal === qUpper) {
        if (validNames.length === 0 || validNames.indexOf(nameVal) !== -1) {
          if (idxActive >= 0) {
            var av3 = (data[r3][idxActive] || '').toString().trim().toUpperCase();
            if (av3 === 'Y') matches.push({ rowIndex: r3 + 2, mapped: mapRowToHeaders_(headers, data[r3]) });
          } else {
            matches.push({ rowIndex: r3 + 2, mapped: mapRowToHeaders_(headers, data[r3]) });
          }
        }
      }
    }
    return { matches: matches, queryType: 'program' };
  }

  return { matches: [], queryType: 'none' };
}

/**
 * Retrieves a single record from tab5 by row index.
 * @param {number} rowIndex - 1-based row number.
 * @return {Object|null}
 */
function getRecordForRowIndex(rowIndex) {
  rowIndex = Number(rowIndex) || 0;
  if (rowIndex < 2) return null;
  var meta = getHeaderMap_(getSheet_(SHEET_NAMES.PARTICIPANTS));
  var sheet = getSheet_(SHEET_NAMES.PARTICIPANTS);
  if (!sheet) return null;
  var lastCol = meta.headers.length || 1;
  var lastRow = sheet.getLastRow();
  if (rowIndex > lastRow) return null;
  var row = sheet.getRange(rowIndex, 1, 1, lastCol).getValues()[0];
  return mapRowToHeaders_(meta.headers, row);
}

/**
 * Validates a program key exists in tab2 header row.
 * @param {string} programKey
 * @return {boolean}
 */
function validateProgramKey(programKey) {
  return isValidProgramKey((programKey || '').toString().trim());
}

/**
 * Validates a shiksha code or aadhar by searching tab5.
 * @param {string} shikshaCode
 * @param {string} aadhar
 * @return {{valid: boolean, name: string, current_level: string}}
 */
function validateShikshaCode(shikshaCode, aadhar) {
  var res = findShikshaByQuery((shikshaCode || '').toString().trim());
  if (res && res.matches && res.matches.length) {
    var mapped = res.matches[0].mapped;
    var name = pickFromMapped_(mapped, ['NAME', 'Name', 'name', 'fname', 'Devotee Name']);
    var current = pickFromMapped_(mapped, ['SIKSHA STATUS', 'siksha status', 'siksha_status', 'current_level']);
    return { valid: true, name: name, current_level: current };
  }
  var res2 = findShikshaByQuery((aadhar || '').toString().trim());
  if (res2 && res2.matches && res2.matches.length) {
    var mapped2 = res2.matches[0].mapped;
    var name2 = pickFromMapped_(mapped2, ['NAME', 'Name', 'name', 'fname', 'Devotee Name']);
    var current2 = pickFromMapped_(mapped2, ['SIKSHA STATUS', 'siksha status', 'siksha_status', 'current_level']);
    return { valid: true, name: name2, current_level: current2 };
  }
  return { valid: false, name: '', current_level: '' };
}

/**
 * Picks a value from a mapped row object by trying multiple key names.
 * @param {Object} mapped
 * @param {string[]} keys
 * @return {string}
 * @private
 */
function pickFromMapped_(mapped, keys) {
  for (var i = 0; i < keys.length; i++) {
    if (mapped.hasOwnProperty(keys[i]) && mapped[keys[i]]) return mapped[keys[i]];
    if (mapped.hasOwnProperty(keys[i].toUpperCase()) && mapped[keys[i].toUpperCase()]) return mapped[keys[i].toUpperCase()];
    if (mapped.hasOwnProperty(keys[i].toLowerCase()) && mapped[keys[i].toLowerCase()]) return mapped[keys[i].toLowerCase()];
  }
  return '';
}

/**
 * Generates a shiksha code from aadhar (first 4 chars) + DOB (ddmmyyyy).
 * @param {Object} bioformData
 * @return {string}
 */
function generateShikshaCode(bioformData) {
  if (!bioformData) return 'ERROR_NO_DATA';
  var aadhar = (bioformData.aadhar || '').toString().trim().replace(/\s+/g, '');
  var dob    = (bioformData.dob    || '').toString().trim();
  if (!aadhar || !dob) return 'ERROR_MISSING_FIELDS';
  // Last 4 characters of Aadhar number
  var suffix4 = aadhar.slice(-4).toUpperCase();
  // DOB is expected as YYYY-MM-DD; extract dd and mm
  var parts = dob.split('-');
  if (parts.length !== 3) return 'ERROR_INVALID_DOB';
  var dd = parts[2].padStart(2, '0');
  var mm = parts[1].padStart(2, '0');
  return suffix4 + dd + mm;
}

/**
 * Submits a bio-data form to tab5 with SCD2 (marks previous matching rows inactive).
 * @param {Object} bioformData
 * @return {string}
 */
function submitBioForm(bioformData) {
  var sheet = getSheet_(SHEET_NAMES.PARTICIPANTS);
  if (!sheet) return 'ERROR: biodata sheet (tab5) not found';

  var meta = getHeaderMap_(sheet);
  var headers = meta.headers;
  var headersLower = meta.headersLower;
  var lastCol = headers.length;

  function idx(cands) { return findHeaderIndex_(headersLower, cands); }

  var idxShiksha = idx(['shiksha_code', 'siksha code', 'shiksha code', 'shiksha', 'siksha_code']);
  var idxAadhar  = idx(['aadhar', 'aadhaar', 'aadhar_no', 'aadhar number']);
  var idxName    = idx(['name', 'devotee_name', 'fname', 'full_name']);
  var idxInit    = idx(['initiated name', 'initiated_name', 'initiatedname', 'initiated']);
  var idxBV      = idx(['bv leader', 'bv_leader', 'bvleader']);
  var idxProgram = idx(['program_key', 'program key', 'program', 'programid']);
  var idxSex     = idx(['sex', 'gender']);
  var idxContact = idx(['contact number', 'contact_number', 'contactnumber', 'contact']);
  var idxEmail   = idx(['email', 'email id', 'email_id']);
  var idxDob     = idx(['date of birth', 'dob', 'date_of_birth']);
  var idxAddress = idx(['contact address', 'contact_address', 'address']);
  var idxCountry = idx(['country']);
  var idxCity    = idx(['city']);
  var idxLang    = idx(['preferred language of comm', 'preferred language', 'language', 'preferred_language']);
  var idxSub     = idx(['sub-area', 'sub area', 'subarea']);
  var idxSikshaStatus = idx(['siksha status', 'siksha_status']);
  var idxUserAgent    = idx(['user agent', 'user_agent', 'user-agent']);
  var idxPlatform     = idx(['platform']);
  var idxScreen       = idx(['screen size', 'screen_size']);
  var idxIp           = idx(['ip address', 'ip_address', 'ip']);
  var idxActive       = idx(['active_flg', 'active_flag', 'active', 'active flag']);

  // SCD2: set previous matching rows ACTIVE = 'N'
  var lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    var allData = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
    for (var i = 0; i < allData.length; i++) {
      var aVal = (idxAadhar >= 0 && allData[i][idxAadhar] != null) ? allData[i][idxAadhar].toString().trim() : '';
      var nVal = (idxName >= 0 && allData[i][idxName] != null) ? allData[i][idxName].toString().trim() : '';
      if (aVal && nVal && aVal === (bioformData.aadhar || '').toString().trim() && nVal === (bioformData.fname || '').toString().trim()) {
        if (idxActive >= 0) {
          sheet.getRange(i + 2, idxActive + 1).setValue('N');
        } else {
          sheet.getRange(1, lastCol + 1).setValue('ACTIVE_FLG');
          sheet.getRange(i + 2, lastCol + 1).setValue('N');
          idxActive = lastCol;
          lastCol++;
        }
      }
    }
  }

  var newShikshaCode = generateShikshaCode(bioformData);
  var newRow = new Array(lastCol).fill('');

  if (idxShiksha >= 0) newRow[idxShiksha] = newShikshaCode;
  if (idxAadhar >= 0) newRow[idxAadhar] = bioformData.aadhar || '';
  if (idxName >= 0) newRow[idxName] = bioformData.fname || '';
  if (idxInit >= 0) newRow[idxInit] = bioformData.initiatedName || '';
  if (idxBV >= 0) newRow[idxBV] = bioformData.bvLeader || '';
  if (idxProgram >= 0) newRow[idxProgram] = bioformData.programKey || '';
  if (idxSex >= 0) newRow[idxSex] = bioformData.sex || '';
  if (idxContact >= 0) newRow[idxContact] = bioformData.contactNumber || '';
  if (idxEmail >= 0) newRow[idxEmail] = bioformData.email || '';
  if (idxDob >= 0) newRow[idxDob] = bioformData.dob || '';
  if (idxAddress >= 0) newRow[idxAddress] = bioformData.contactAddress || '';
  if (idxCountry >= 0) newRow[idxCountry] = bioformData.country || '';
  if (idxCity >= 0) newRow[idxCity] = bioformData.city || '';
  if (idxLang >= 0) newRow[idxLang] = bioformData.language || '';
  if (idxSub >= 0) newRow[idxSub] = bioformData.subArea || '';
  if (idxSikshaStatus >= 0) newRow[idxSikshaStatus] = bioformData.sikshaStatus || '';
  if (idxUserAgent >= 0) newRow[idxUserAgent] = bioformData.USER_AGENT || '';
  if (idxPlatform >= 0) newRow[idxPlatform] = bioformData.PLATFORM || '';
  if (idxScreen >= 0) newRow[idxScreen] = bioformData.SCREEN_SIZE || '';
  if (idxIp >= 0) newRow[idxIp] = bioformData.IP_ADDRESS || '';
  if (idxActive >= 0) newRow[idxActive] = 'Y';

  sheet.appendRow(newRow);
  updateTab2ShikshaCode(bioformData.programKey || '', bioformData.fname || '', newShikshaCode);
  logInfo_('Shiksha.submitBioForm', 'Bio-data submitted for ' + (bioformData.fname || 'unknown'));
  return 'Form submitted successfully! Generated Shiksha Code: ' + newShikshaCode;
}

/**
 * Submits a shiksha certification form to tab5 with SCD2.
 * @param {Object} formData
 * @return {string}
 */
function submitShikshaData(formData) {
  formData = formData || {};
  var sheet = getSheet_(SHEET_NAMES.PARTICIPANTS);
  if (!sheet) return 'ERROR: biodata sheet (tab5) not found';

  var meta = getHeaderMap_(sheet);
  var headers = meta.headers;
  var headersLower = meta.headersLower;
  var lastCol = headers.length;

  function idx(cands) { return findHeaderIndex_(headersLower, cands); }

  var idxShiksha = idx(['shiksha_code', 'siksha code', 'shiksha code', 'shiksha', 'siksha_code']);
  var idxAadhar  = idx(['aadhar_no', 'aadhar', 'aadhaar', 'aadhar number']);
  var idxName    = idx(['name', 'devotee_name', 'fname', 'full_name']);
  var idxInit    = idx(['initiated name', 'initiated_name', 'initiatedname', 'initiated']);
  var idxBV      = idx(['bv leader', 'bv_leader', 'bvleader']);
  var idxProgram = idx(['program_key', 'program key', 'program', 'programid', 'program id']);
  var idxSex     = idx(['sex', 'gender']);
  var idxContact = idx(['contact number', 'contact_number', 'contactnumber', 'contact']);
  var idxEmail   = idx(['email id', 'email', 'email_id', 'emailid']);
  var idxDob     = idx(['date of birth', 'dob', 'date_of_birth']);
  var idxAddress = idx(['contact address', 'contact_address', 'address']);
  var idxCountry = idx(['country']);
  var idxCity    = idx(['city']);
  var idxLang    = idx(['preferred language of comm', 'preferred language', 'language', 'preferred_language']);
  var idxSub     = idx(['sub-area', 'sub area', 'subarea']);
  var idxSikshaStatus = idx(['siksha status', 'siksha_status']);
  var idxDate = idx(['date']);
  var idxA = idx(['a (association)', 'a']);
  var idxB = idx(['b (books)', 'b']);
  var idxC = idx(['c (chanting)', 'c']);
  var idxD = idx(['d (diet)', 'd']);
  var idxE = idx(['e (ekadesi)', 'e']);
  var idxF = idx(['f (family)', 'f']);
  var idxChanting    = idx(['chanting']);
  var idxSpBooks     = idx(['sp books', 'sp_books', 'spbooks']);
  var idxCommit      = idx(['commitments', 'commitment']);
  var idxSeva        = idx(['seva']);
  var idxRecommended = idx(['recommended by', 'recommended_by', 'recommendedby']);
  var idxFilledBy    = idx(['form filled by', 'form_filled_by', 'filled by', 'filled_by']);
  var idxUserAgent   = idx(['user agent', 'user_agent', 'user-agent']);
  var idxPlatform    = idx(['platform']);
  var idxScreen      = idx(['screen size', 'screen_size']);
  var idxIp          = idx(['ip address', 'ip_address', 'ip']);
  var idxActive      = idx(['active_flg', 'active_flag', 'active', 'active flag']);

  // Ensure ACTIVE_FLG column exists
  if (idxActive === -1) {
    sheet.getRange(1, lastCol + 1).setValue('ACTIVE_FLG');
    idxActive = lastCol;
    lastCol++;
  }

  // Read all existing rows once for SCD2
  var lastRow = sheet.getLastRow();
  var allData = [];
  if (lastRow > 1) {
    allData = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  }

  // SCD2: Mark previous active rows as 'N'
  var inShiksha = (formData.SHIKSHA_CODE || '').toString().trim();
  var inAadhar  = (formData.AADHAR || '').toString().trim();

  for (var i = 0; i < allData.length; i++) {
    var existingShiksha = (idxShiksha >= 0 && allData[i][idxShiksha] != null) ? allData[i][idxShiksha].toString().trim() : '';
    var existingAadhar  = (idxAadhar >= 0 && allData[i][idxAadhar] != null) ? allData[i][idxAadhar].toString().trim() : '';
    var existingActive  = (idxActive >= 0 && allData[i][idxActive] != null) ? allData[i][idxActive].toString().trim().toUpperCase() : '';

    if (existingActive === 'Y' && ((inShiksha && existingShiksha === inShiksha) || (inAadhar && existingAadhar === inAadhar))) {
      sheet.getRange(i + 2, idxActive + 1).setValue('N');
    }
  }

  // Build new row
  var newRow = new Array(lastCol).fill('');

  if (idxShiksha >= 0) newRow[idxShiksha] = formData.SHIKSHA_CODE || '';
  if (idxAadhar >= 0) newRow[idxAadhar] = formData.AADHAR || '';
  if (idxName >= 0) newRow[idxName] = formData.NAME || '';
  if (idxInit >= 0) newRow[idxInit] = formData.INITIATED_NAME || '';
  if (idxBV >= 0) newRow[idxBV] = formData.BV_LEADER || '';
  if (idxProgram >= 0) newRow[idxProgram] = formData.PROGRAM_KEY || '';
  if (idxSex >= 0) newRow[idxSex] = formData.SEX || '';
  if (idxContact >= 0) newRow[idxContact] = formData.CONTACT_NUMBER || '';
  if (idxEmail >= 0) newRow[idxEmail] = formData.EMAIL || '';
  if (idxDob >= 0) newRow[idxDob] = formData.DATE_OF_BIRTH || '';
  if (idxAddress >= 0) newRow[idxAddress] = formData.CONTACT_ADDRESS || '';
  if (idxCountry >= 0) newRow[idxCountry] = formData.COUNTRY || '';
  if (idxCity >= 0) newRow[idxCity] = formData.CITY || '';
  if (idxLang >= 0) newRow[idxLang] = formData.PREFERRED_LANGUAGE || '';
  if (idxSub >= 0) newRow[idxSub] = formData.SUB_AREA || '';
  if (idxSikshaStatus >= 0) newRow[idxSikshaStatus] = formData.CURRENT_LEVEL || '';
  if (idxDate >= 0) newRow[idxDate] = formData.DATE || '';
  if (idxA >= 0) newRow[idxA] = formData.A_CODE || '';
  if (idxB >= 0) newRow[idxB] = formData.B_CODE || '';
  if (idxC >= 0) newRow[idxC] = formData.C_CODE || '';
  if (idxD >= 0) newRow[idxD] = formData.D_CODE || '';
  if (idxE >= 0) newRow[idxE] = formData.E_CODE || '';
  if (idxF >= 0) newRow[idxF] = formData.F_CODE || '';
  if (idxChanting >= 0) newRow[idxChanting] = formData.CHANTING || '';
  if (idxSpBooks >= 0) newRow[idxSpBooks] = formData.SP_BOOKS || '';
  if (idxCommit >= 0) newRow[idxCommit] = formData.COMMITMENTS || '';
  if (idxSeva >= 0) newRow[idxSeva] = formData.SEVA || '';
  if (idxRecommended >= 0) newRow[idxRecommended] = formData.RECOMMENDED_BY || '';
  if (idxFilledBy >= 0) newRow[idxFilledBy] = formData.FILLED_BY || '';
  if (idxUserAgent >= 0) newRow[idxUserAgent] = formData.USER_AGENT || '';
  if (idxPlatform >= 0) newRow[idxPlatform] = formData.PLATFORM || '';
  if (idxScreen >= 0) newRow[idxScreen] = formData.SCREEN_SIZE || '';
  if (idxIp >= 0) newRow[idxIp] = formData.IP_ADDRESS || '';
  if (idxActive >= 0) newRow[idxActive] = 'Y';

  sheet.appendRow(newRow);
  logInfo_('Shiksha.submitShikshaData', 'Shiksha data submitted for ' + (formData.NAME || 'unknown'));
  return 'Data submitted✅, Hare Krishna!!!😊';
}

/**
 * Combined certify handler: decides mode from tab2 shiksha code, stores prefill, returns URL.
 *
 * Routing rules (based on tab2 for this devotee+program):
 *   - Real shiksha code (not temp_*)  → mode = 'shiksha'  → open shiksha certification form directly.
 *   - temp_* code OR no code at all   → mode = 'biodata'  → open bio-data form first; after the code
 *     is generated there, ShikshaPage transitions automatically to the shiksha form.
 *
 * @param {string} devoteeName
 * @param {string} programKey
 * @return {{url: string, mode: string}}
 */
function prepareCertifyUrl(devoteeName, programKey) {
  var parsedInput = parseDevoteeRef_(devoteeName);
  var normalizedName = parsedInput.name || (devoteeName || '').toString().trim();

  // ── Step 1: determine effective shiksha code from tab2 (most reliable source) ──
  var tab2Code = extractShikshaCodeFromTab2_(programKey, normalizedName);
  var effectiveCode = parsedInput.shikshaCode || tab2Code;

  // ── Step 2: decide mode ──
  var isTemp = !effectiveCode || isTempTab2Code_(effectiveCode, programKey);

  var mode, prefillData;

  if (!isTemp) {
    // Real code → look up tab5 for rich prefill, go straight to shiksha form.
    var lookup = lookupDevoteeForCertify(devoteeName, programKey);
    if (lookup.found && lookup.mapped) {
      mode = 'shiksha';
      prefillData = { mapped: lookup.mapped };
    } else {
      // Real code but no tab5 row yet — still open shiksha form with minimal prefill.
      mode = 'shiksha';
      var prog = getProgramByKey(programKey);
      prefillData = {
        mapped: null,
        shikshaCode: effectiveCode,
        name: normalizedName,
        programKey: programKey,
        programOwner: prog ? (prog[TAB1_COLS.PROGRAM_OWNER] || '').toString().trim() : ''
      };
    }
  } else {
    // temp_ or no code → go to bio-data form first.
    mode = 'biodata';
    var prog2 = getProgramByKey(programKey);
    prefillData = {
      name: normalizedName,
      programKey: programKey,
      programOwner: prog2 ? (prog2[TAB1_COLS.PROGRAM_OWNER] || '').toString().trim() : '',
      subArea: ''
    };
  }

  var token = storeCertifyPrefill(prefillData);
  var baseUrl = ScriptApp.getService().getUrl();
  return {
    url: baseUrl + '?page=shiksha&certify=' + token + '&mode=' + mode,
    mode: mode
  };
}

/**
 * Looks up a devotee by name and program key in tab5.
 * Used by the Certify button to decide: open Shiksha form (exists) or Biodata form (new).
 * @param {string} devoteeName
 * @param {string} programKey
 * @return {{found: boolean, mapped: Object|null, programOwner: string, devoteeName: string, shikshaCode: string}}
 */
function lookupDevoteeForCertify(devoteeName, programKey) {
  var parsedInput = parseDevoteeRef_(devoteeName);
  var normalizedName = parsedInput.name || (devoteeName || '').toString().trim();
  var result = {
    found: false,
    mapped: null,
    programOwner: '',
    devoteeName: normalizedName,
    shikshaCode: parsedInput.shikshaCode || ''
  };

  // Get program owner from tab1
  var prog = getProgramByKey(programKey);
  if (prog) {
    result.programOwner = (prog[TAB1_COLS.PROGRAM_OWNER] || '').toString().trim();
  }

  // Resolve best shiksha code hint from input string / tab2 and try direct tab5 lookup.
  var hintFromTab2 = extractShikshaCodeFromTab2_(programKey, normalizedName);
  var candidateCodes = [];
  if (parsedInput.shikshaCode) candidateCodes.push(parsedInput.shikshaCode);
  if (hintFromTab2 && candidateCodes.indexOf(hintFromTab2) === -1) candidateCodes.push(hintFromTab2);

  for (var c = 0; c < candidateCodes.length; c++) {
    var code = candidateCodes[c];
    var hit = findShikshaByQuery(code);
    if (hit && hit.matches && hit.matches.length) {
      result.found = true;
      result.mapped = hit.matches[0].mapped || null;
      result.shikshaCode = code;
      return result;
    }
  }

  if (!normalizedName) return result;

  var sheet = getSheet_(SHEET_NAMES.PARTICIPANTS);
  if (!sheet) return result;

  var meta = getHeaderMap_(sheet);
  var headers = meta.headers;
  var headersLower = meta.headersLower;
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return result;

  var idxName   = findHeaderIndex_(headersLower, ['name', 'fname', 'devotee_name', 'full_name']);
  var idxPK     = findHeaderIndex_(headersLower, ['program_key', 'program key', 'program', 'programid']);
  var idxActive = findHeaderIndex_(headersLower, ['active_flg', 'active_flag', 'active', 'active flag']);

  var data = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
  var nameUpper = normalizedName.toString().trim().toUpperCase();

  // Search bottom-up for most recent active row
  for (var r = data.length - 1; r >= 0; r--) {
    var rowName = (data[r][idxName] || '').toString().trim().toUpperCase();
    if (rowName !== nameUpper) continue;
    if (idxActive >= 0) {
      var av = (data[r][idxActive] || '').toString().trim().toUpperCase();
      if (av !== 'Y') continue;
    }
    // Optional: also match program key if present
    if (idxPK >= 0) {
      var rowPK = (data[r][idxPK] || '').toString().trim().toUpperCase();
      if (rowPK && rowPK === programKey.toUpperCase()) {
        result.found = true;
        result.mapped = mapRowToHeaders_(headers, data[r]);
        return result;
      }
    }
  }

  // If no exact program match, try name-only match (active row)
  for (var r2 = data.length - 1; r2 >= 0; r2--) {
    var rowName2 = (data[r2][idxName] || '').toString().trim().toUpperCase();
    if (rowName2 !== nameUpper) continue;
    if (idxActive >= 0) {
      var av2 = (data[r2][idxActive] || '').toString().trim().toUpperCase();
      if (av2 !== 'Y') continue;
    }
    result.found = true;
    result.mapped = mapRowToHeaders_(headers, data[r2]);
    return result;
  }

  return result;
}

/**
 * Parses a devotee reference string and tries to extract a shiksha code hint.
 * Supports values like: "Name", "Name | CODE", "Name (CODE)", "CODE - Name".
 * @param {string} raw
 * @return {{name: string, shikshaCode: string}}
 * @private
 */
function parseDevoteeRef_(raw) {
  var text = (raw || '').toString().trim();
  if (!text) return { name: '', shikshaCode: '' };

  var extractedCode = '';
  var mPipe = text.match(/\|\s*([A-Za-z0-9_-]{8,20})\s*$/);
  var mParen = text.match(/\(([A-Za-z0-9_-]{8,20})\)\s*$/);
  var mDash = text.match(/[-–]\s*([A-Za-z0-9_-]{8,20})\s*$/);

  if (mPipe && isLikelyShikshaCode_(mPipe[1])) extractedCode = mPipe[1];
  else if (mParen && isLikelyShikshaCode_(mParen[1])) extractedCode = mParen[1];
  else if (mDash && isLikelyShikshaCode_(mDash[1])) extractedCode = mDash[1];
  else {
    var allTokens = text.match(/[A-Za-z0-9_-]{8,20}/g) || [];
    for (var i = allTokens.length - 1; i >= 0; i--) {
      if (isLikelyShikshaCode_(allTokens[i])) {
        extractedCode = allTokens[i];
        break;
      }
    }
  }

  var nameOnly = text;
  if (extractedCode) {
    nameOnly = nameOnly.replace(extractedCode, '');
    nameOnly = nameOnly.replace(/[|()\[\]{}]/g, ' ');
    nameOnly = nameOnly.replace(/[-–]\s*$/, '');
    nameOnly = nameOnly.replace(/\s{2,}/g, ' ').trim();
  }

  return { name: nameOnly || text, shikshaCode: extractedCode || '' };
}

/**
 * Reads tab2 program column and tries to extract shiksha code for a devotee.
 * @param {string} programKey
 * @param {string} devoteeName
 * @return {string}
 * @private
 */
function extractShikshaCodeFromTab2_(programKey, devoteeName) {
  programKey = (programKey || '').toString().trim();
  devoteeName = (devoteeName || '').toString().trim().toUpperCase();
  if (!programKey || !devoteeName) return '';

  var rows = getTab2RowsForProgram(programKey);
  for (var r = 0; r < rows.length; r++) {
    var row = rows[r];
    var nameUpper = (row.name || '').toString().trim().toUpperCase();
    if (!nameUpper) continue;
    if (nameUpper === devoteeName || nameUpper.indexOf(devoteeName) !== -1 || devoteeName.indexOf(nameUpper) !== -1) {
      if (row.shikshaCode) return row.shikshaCode;
    }
  }
  return '';
}

/**
 * Basic heuristic for shiksha code-like tokens.
 * @param {string} token
 * @return {boolean}
 * @private
 */
function isLikelyShikshaCode_(token) {
  token = (token || '').toString().trim();
  if (!/^[A-Za-z0-9_-]{8,20}$/.test(token)) return false;
  if (!/\d/.test(token)) return false;
  // Prevent common phone-like tokens from being mistaken as code.
  if (/^\d{10}$/.test(token)) return false;
  return true;
}

/**
 * Stores certify prefill data in CacheService so ShikshaPage can retrieve it on load.
 * @param {Object} prefillData - Data to prefill (mapped row or biodata defaults).
 * @return {string} A unique token to pass via URL.
 */
function storeCertifyPrefill(prefillData) {
  var token = Utilities.getUuid();
  var cache = CacheService.getScriptCache();
  cache.put('certify_' + token, JSON.stringify(prefillData), 300); // 5 min expiry
  return token;
}

/**
 * Retrieves and clears certify prefill data from cache.
 * @param {string} token
 * @return {Object|null}
 */
function getCertifyPrefill(token) {
  if (!token) return null;
  var cache = CacheService.getScriptCache();
  var json = cache.get('certify_' + token);
  if (!json) return null;
  cache.remove('certify_' + token);
  try { return JSON.parse(json); } catch (e) { return null; }
}
