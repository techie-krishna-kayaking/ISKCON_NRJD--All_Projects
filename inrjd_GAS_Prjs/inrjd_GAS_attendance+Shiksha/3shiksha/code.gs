// Code.gs — Updated: submitShikshaData now writes to tab5 (SCD2), not tab6
const SPREADSHEET_ID = '1WVeDZ9cofYHn51Q-0mbKzliDlrMQaNMLq-PHQhkkm9E'; // <-- replace with real id
const BIO_SHEET_NAME = 'tab5';   // master / bio sheet where we keep active rows
const PROGRAM_SHEET_NAME = 'tab2';
/* NOTE: We no longer use tab6 for shiksha submissions per your instruction.
   If you still want a separate audit sheet, we can also append there in addition,
   but current request is to store submissions in tab5 using ACTIVE_FLG SCD2. */

function doGet() {
  return HtmlService.createHtmlOutputFromFile('index')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/* ---------- Helpers ---------- */
function _getSheetHeaders(ss, sheetName) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return { sheet: null, headers: [], headersLower: [] };
  var lastCol = Math.max(1, sheet.getLastColumn());
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function (h) { return (h === null || typeof h === 'undefined') ? '' : h.toString().trim(); });
  var headersLower = headers.map(function (h) { return (h || '').toString().trim().toLowerCase(); });
  return { sheet: sheet, headers: headers, headersLower: headersLower };
}

function _findHeaderIndex(headersLower, candidates) {
  if (!headersLower || !Array.isArray(candidates)) return -1;
  for (var i = 0; i < candidates.length; i++) {
    var c = (candidates[i] || '').toString().trim().toLowerCase();
    if (!c) continue;
    var idx = headersLower.indexOf(c);
    if (idx !== -1) return idx;
  }
  return -1;
}

function _mapRowToHeaders(headers, row) {
  var out = {};
  for (var i = 0; i < headers.length; i++) {
    var hdr = (headers[i] || '').toString();
    out[hdr] = (row && row[i] !== undefined && row[i] !== null) ? row[i].toString() : '';
  }
  return out;
}

/* ---------- Search / validate functions (kept) ---------- */
function findShikshaByQuery(query) {
  query = (query || '').toString().trim();
  if (!query) return { matches: [], queryType: 'none' };

  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var bioMeta = _getSheetHeaders(ss, BIO_SHEET_NAME);
  var bioSheet = bioMeta.sheet;
  if (!bioSheet) return { matches: [], queryType: 'none' };

  var lastRow = bioSheet.getLastRow();
  if (lastRow < 2) return { matches: [], queryType: 'none' };

  var headers = bioMeta.headers;
  var headersLower = bioMeta.headersLower;
  var lastCol = headers.length;

  var idxShiksha = _findHeaderIndex(headersLower, ['shiksha_code','siksha code','shiksha code','shiksha','siksha_code']);
  var idxAadhar  = _findHeaderIndex(headersLower, ['aadhar','aadhaar','aadhar_no','aadhar number','aadhaar_no','aadhaar number']);
  var idxProgram = _findHeaderIndex(headersLower, ['program_key','program key','program','programid','program id','program_id']);
  var idxActive  = _findHeaderIndex(headersLower, ['active_flg','active_flag','active','active flag']);
  var idxName    = _findHeaderIndex(headersLower, ['name','fname','devotee_name','full_name']);

  var data = bioSheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  var qUpper = query.toUpperCase();

  // -------- Tab2 program key validation --------
  var tab2Sheet = ss.getSheetByName(PROGRAM_SHEET_NAME);
  var validNames = [];
  if (tab2Sheet && idxProgram >= 0) {
    var tab2Headers = tab2Sheet.getRange(1, 1, 1, tab2Sheet.getLastColumn()).getValues()[0];
    var programColIndex = tab2Headers.findIndex(h => (h || '').toString().trim().toUpperCase() === qUpper);
    if (programColIndex >= 0) {
      var colValues = tab2Sheet.getRange(2, programColIndex + 1, tab2Sheet.getLastRow() - 1).getValues();
      colValues.forEach(row => {
        var n = (row[0] || '').toString().trim();
        if (n) validNames.push(n.toUpperCase());
      });
    }
  }

  // -------- 1) Search by Shiksha Code (bottom-up; prefer active 'Y') --------
  if (idxShiksha >= 0) {
    for (var r = data.length - 1; r >= 0; r--) {
      var row = data[r];
      var codeVal = (row[idxShiksha] || '').toString().trim();
      if (!codeVal) continue;
      if (codeVal === query) {
        if (idxActive >= 0) {
          var av = (row[idxActive] || '').toString().trim().toUpperCase();
          if (av === 'Y') return { matches: [{ rowIndex: r + 2, mapped: _mapRowToHeaders(headers, row) }], queryType: 'shiksha' };
        } else return { matches: [{ rowIndex: r + 2, mapped: _mapRowToHeaders(headers, row) }], queryType: 'shiksha' };
      }
    }
  }

  // -------- 2) Search by Aadhar (bottom-up; prefer active 'Y') --------
  if (idxAadhar >= 0) {
    for (var r2 = data.length - 1; r2 >= 0; r2--) {
      var row2 = data[r2];
      var aVal = (row2[idxAadhar] || '').toString().trim();
      if (!aVal) continue;
      if (aVal === query) {
        if (idxActive >= 0) {
          var av2 = (row2[idxActive] || '').toString().trim().toUpperCase();
          if (av2 === 'Y') return { matches: [{ rowIndex: r2 + 2, mapped: _mapRowToHeaders(headers, row2) }], queryType: 'aadhar' };
        } else return { matches: [{ rowIndex: r2 + 2, mapped: _mapRowToHeaders(headers, row2) }], queryType: 'aadhar' };
      }
    }
  }

  // -------- 3) Search by Program Key (validate names in tab2) --------
  if (idxProgram >= 0) {
    var matches = [];
    for (var r3 = 0; r3 < data.length; r3++) {
      var row3 = data[r3];
      var pVal = (row3[idxProgram] || '').toString().trim().toUpperCase();
      var nameVal = (row3[idxName] || '').toString().trim().toUpperCase();
      if (!pVal || !nameVal) continue;

      if (pVal === qUpper) {
        // only include if name exists under that program key in tab2
        if (validNames.length === 0 || validNames.includes(nameVal)) {
          if (idxActive >= 0) {
            var av3 = (row3[idxActive] || '').toString().trim().toUpperCase();
            if (av3 === 'Y') matches.push({ rowIndex: r3 + 2, mapped: _mapRowToHeaders(headers, row3) });
          } else {
            matches.push({ rowIndex: r3 + 2, mapped: _mapRowToHeaders(headers, row3) });
          }
        }
      }
    }
    return { matches: matches, queryType: 'program' };
  }

  return { matches: [], queryType: 'none' };
}


function getRecordForRowIndex(rowIndex) {
  rowIndex = Number(rowIndex) || 0;
  if (rowIndex < 2) return null;
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var meta = _getSheetHeaders(ss, BIO_SHEET_NAME);
  var sheet = meta.sheet;
  if (!sheet) return null;
  var lastCol = meta.headers.length || 1;
  var lastRow = sheet.getLastRow();
  if (rowIndex > lastRow) return null;
  var row = sheet.getRange(rowIndex, 1, 1, lastCol).getValues()[0];
  return _mapRowToHeaders(meta.headers, row);
}

function validateProgramKey(programKey) {
  if (!programKey) return false;
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(PROGRAM_SHEET_NAME);
  if (!sheet) return false;
  var firstRow = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  return firstRow.indexOf(programKey) !== -1;
}

function validateShikshaCode(shikshaCode, aadhar) {
  var res = findShikshaByQuery((shikshaCode || '').toString().trim());
  if (res && res.matches && res.matches.length) {
    var mapped = res.matches[0].mapped;
    function pick() {
      for (var i=0;i<arguments.length;i++){
        var key = arguments[i];
        if (!key) continue;
        if (mapped.hasOwnProperty(key)) return mapped[key] || '';
        if (mapped.hasOwnProperty(key.toUpperCase())) return mapped[key.toUpperCase()] || '';
        if (mapped.hasOwnProperty(key.toLowerCase())) return mapped[key.toLowerCase()] || '';
      }
      return '';
    }
    var name = pick('NAME','Name','name','fname','Devotee Name');
    var current = pick('SIKSHA STATUS','siksha status','siksha_status','current_level','SIKSHA_STATUS');
    return { valid: true, name: name, current_level: current };
  }
  var res2 = findShikshaByQuery((aadhar || '').toString().trim());
  if (res2 && res2.matches && res2.matches.length) {
    var mapped2 = res2.matches[0].mapped;
    function pick2(){ for (var i=0;i<arguments.length;i++){ var k=arguments[i]; if (!k) continue; if (mapped2.hasOwnProperty(k)) return mapped2[k]||''; if (mapped2.hasOwnProperty(k.toUpperCase())) return mapped2[k.toUpperCase()]||''; if (mapped2.hasOwnProperty(k.toLowerCase())) return mapped2[k.toLowerCase()]||'';} return '';}
    var name2 = pick2('NAME','Name','name','fname','Devotee Name');
    var current2 = pick2('SIKSHA STATUS','siksha status','siksha_status','current_level','SIKSHA_STATUS');
    return { valid: true, name: name2, current_level: current2 };
  }
  return { valid: false, name: '', current_level: '' };
}

/* ---------- Generate Shiksha Code ---------- */
function generateShikshaCode(bioformData) {
  if (!bioformData) return "ERROR_NO_DATA";

  var name = (bioformData.aadhar || "").toString().trim();
  var dob = (bioformData.dob || "").toString().trim(); // yyyy‑mm‑dd

  if (!name || !dob) return "ERROR_MISSING_FIELDS";

  // first 4 characters from name
  var prefix = name.substring(0, 4).toUpperCase();

  // convert DOB yyyy-mm-dd → ddmmyyyy
  var parts = dob.split("-");
  if (parts.length !== 3) return "ERROR_INVALID_DOB";

  var dobFormatted = parts[2] + parts[1] + parts[0];

  return prefix + dobFormatted; // XXXXddmmyyyy
}





/* ---------- submitBioForm (unchanged core behavior) ---------- */
function submitBioForm(bioformData) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var meta = _getSheetHeaders(ss, BIO_SHEET_NAME);
  var sheet = meta.sheet;
  if (!sheet) return "ERROR: biodata sheet (tab5) not found";

  var headers = meta.headers;
  var headersLower = meta.headersLower;
  var lastCol = headers.length;

  var newRow = new Array(lastCol).fill('');

  function idx(cands){ return _findHeaderIndex(headersLower, cands); }

  var idxShiksha = idx(['shiksha_code','siksha code','shiksha code','shiksha','siksha_code']);
  var idxAadhar = idx(['aadhar','aadhaar','aadhar_no','aadhar number']);
  var idxName = idx(['name','devotee_name','fname','full_name']);
  var idxInit = idx(['initiated name','initiated_name','initiatedname','initiated']);
  var idxBV = idx(['bv leader','bv_leader','bvleader']);
  var idxProgram = idx(['program_key','program key','program','programid']);
  var idxSex = idx(['sex','gender']);
  var idxContact = idx(['contact number','contact_number','contactnumber','contact']);
  var idxEmail = idx(['email','email id','email_id']);
  var idxDob = idx(['date of birth','dob','date_of_birth']);
  var idxAddress = idx(['contact address','contact_address','address']);
  var idxCountry = idx(['country']);
  var idxCity = idx(['city']);
  var idxLang = idx(['preferred language of comm','preferred language','language','preferred_language']);
  var idxSub = idx(['sub-area','sub area','subarea']);
  var idxSikshaStatus = idx(['siksha status','siksha_status']);
  // var idxComments = idx(['comments','comment']);
  var idxUserAgent = idx(['user agent','user_agent','user-agent']);
  var idxPlatform  = idx(['platform']);
  var idxScreen    = idx(['screen size','screen_size','screen size']);
  var idxIp        = idx(['ip address','ip_address','ip']);

  var idxActive = idx(['active_flg','active_flag','active','active flag']);

  // SCD2: set previous matching rows ACTIVE = 'N' when name + aadhar matches
  var lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    var allData = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
    for (var i = 0; i < allData.length; i++) {
      var row = allData[i];
      var aVal = (idxAadhar >= 0 && row[idxAadhar] !== undefined && row[idxAadhar] !== null) ? row[idxAadhar].toString().trim() : '';
      var nVal = (idxName >= 0 && row[idxName] !== undefined && row[idxName] !== null) ? row[idxName].toString().trim() : '';
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
  // if (idxComments >= 0) newRow[idxComments] = bioformData.comments || '';
  if (idxUserAgent >= 0) newRow[idxUserAgent] = bioformData.USER_AGENT || '';
  if (idxPlatform >= 0)  newRow[idxPlatform]  = bioformData.PLATFORM || '';
  if (idxScreen >= 0)    newRow[idxScreen]    = bioformData.SCREEN_SIZE || '';
  if (idxIp >= 0)        newRow[idxIp]        = bioformData.IP_ADDRESS || '';
  if (idxActive >= 0) newRow[idxActive] = 'Y';

  sheet.appendRow(newRow);
  return "Form submitted successfully! Generated Shiksha Code: " + newShikshaCode;
}

function submitShikshaData(formData) {
  formData = formData || {};
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var meta = _getSheetHeaders(ss, BIO_SHEET_NAME);
  var sheet = meta.sheet;
  if (!sheet) return "ERROR: biodata sheet (tab5) not found";

  var headers = meta.headers;
  var headersLower = meta.headersLower;
  var lastCol = headers.length;

  // header index helper
  function idx(cands){ return _findHeaderIndex(headersLower, cands); }

  // find common header indices (based on the column list you provided)
  var idxShiksha = idx(['shiksha_code','siksha code','shiksha code','shiksha','siksha_code']);
  var idxAadhar = idx(['aadhar_no','aadhar_no','aadhar','aadhaar','aadhar number','aadhar_no']);
  var idxName = idx(['name','devotee_name','fname','full_name']);
  var idxInit = idx(['initiated name','initiated_name','initiatedname','initiated']);
  var idxBV = idx(['bv leader','bv_leader','bvleader']);
  var idxProgram = idx(['program_key','program key','program','programid','program id']);
  var idxSex = idx(['sex','gender']);
  var idxContact = idx(['contact number','contact_number','contactnumber','contact']);
  var idxEmail = idx(['email id','email','email_id','emailid']);
  var idxDob = idx(['date of birth','dob','date_of_birth']);
  var idxAddress = idx(['contact address','contact_address','address']);
  var idxCountry = idx(['country']);
  var idxCity = idx(['city']);
  var idxLang = idx(['preferred language of comm','preferred language','language','preferred_language']);
  var idxSub = idx(['sub-area','sub area','subarea']);
  var idxSikshaStatus = idx(['siksha status','siksha_status','siksha status']);
  var idxDate = idx(['date']);
  var idxA = idx(['a (association)','a','a (association)','A (Association)']);
  var idxB = idx(['b (books)','b','b (books)']);
  var idxC = idx(['c (chanting)','c','c (chanting)']);
  var idxD = idx(['d (diet)','d','d (diet)']);
  var idxE = idx(['e (ekadesi)','e','e (ekadesi)']);
  var idxF = idx(['f (family)','f','f (family)']);
  var idxChanting = idx(['chanting']);
  var idxSpBooks = idx(['sp books','sp_books','spbooks','sp books']);
  var idxCommit = idx(['commitments','commitment']);
  var idxSeva = idx(['seva']);
  var idxRecommendedBy = idx(['recommended by','recommended_by','recommendedby']);
  var idxFilledBy = idx(['form filled by','form_filled_by','form filled by','filled by','filled_by']);
  // var idxComments = idx(['comments','comment']);
  var idxUserAgent = idx(['user agent','user_agent','user-agent']);
  var idxPlatform = idx(['platform']);
  var idxScreen = idx(['screen size','screen_size','screen size']);
  var idxIp = idx(['ip address','ip_address','ip']);

  var idxActive = idx(['active_flg','active_flag','active','active flag']);

  // Ensure ACTIVE_FLG column exists (if not, create it at end)
  if (idxActive === -1) {
    sheet.getRange(1, lastCol + 1).setValue('ACTIVE_FLG');
    idxActive = lastCol;
    lastCol++;
  }

  // Read all existing rows once
  var lastRow = sheet.getLastRow();
  var allData = [];
  if (lastRow > 1) {
    allData = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  }

  // 1) SCD2: Mark previous active rows (same SHIKSHA_CODE OR same AADHAR) as 'N'
  var inShiksha = (formData.SHIKSHA_CODE || '').toString().trim();
  var inAadhar = (formData.AADHAR || '').toString().trim();

  for (var i = 0; i < allData.length; i++) {
    var row = allData[i];
    var existingShiksha = (idxShiksha >= 0 && row[idxShiksha] !== undefined && row[idxShiksha] !== null) ? row[idxShiksha].toString().trim() : '';
    var existingAadhar  = (idxAadhar  >= 0 && row[idxAadhar]  !== undefined && row[idxAadhar]  !== null) ? row[idxAadhar].toString().trim() : '';
    var existingActive  = (idxActive  >= 0 && row[idxActive]  !== undefined && row[idxActive]  !== null) ? row[idxActive].toString().trim().toUpperCase() : '';

    if (existingActive === 'Y' && ( (inShiksha && existingShiksha === inShiksha) || (inAadhar && existingAadhar === inAadhar) ) ) {
      // set that previous row's ACTIVE_FLG to 'N'
      sheet.getRange(i + 2, idxActive + 1).setValue('N');
    }
  }

  // 2) Build newRow matching headers length
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
  if (idxRecommendedBy >= 0) newRow[idxRecommendedBy] = formData.RECOMMENDED_BY || '';
  if (idxFilledBy >= 0) newRow[idxFilledBy] = formData.FILLED_BY || '';
  // if (idxComments >= 0) newRow[idxComments] = formData.COMMENTS || '';
  if (idxUserAgent >= 0) newRow[idxUserAgent] = formData.USER_AGENT || '';
  if (idxPlatform >= 0) newRow[idxPlatform] = formData.PLATFORM || '';
  if (idxScreen >= 0) newRow[idxScreen] = formData.SCREEN_SIZE || '';
  if (idxIp >= 0) newRow[idxIp] = formData.IP_ADDRESS || '';

  // Set ACTIVE_FLG = 'Y'
  if (idxActive >= 0) newRow[idxActive] = 'Y';

  // Append to tab5
  sheet.appendRow(newRow);

  return "Data submitted✅, Hare Krishna!!!😊";
}