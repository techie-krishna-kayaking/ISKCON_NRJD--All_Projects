// ===== File: Workflow.gs =====
// Responsibility: Integrated workflow helpers for owner attention center,
//                 member profile updates from tab5, shiksha campaign push,
//                 recommendation lifecycle, and certificate print payloads.

var WORKFLOW_SHEETS = {
  CAMPAIGNS: 'shiksha_campaigns',
  RECOMMENDATIONS: 'shiksha_recommendations'
};

var CAMPAIGN_HEADERS = [
  'CAMPAIGN_ID',
  'SHIKSHA_DATE',
  'TARGET_LEVEL',
  'MESSAGE',
  'STATUS',
  'REQUESTED_BY',
  'REQUESTED_AT',
  'UPDATED_AT'
];

var RECOMMENDATION_HEADERS = [
  'REC_ID',
  'CAMPAIGN_ID',
  'PROGRAM_OWNER',
  'PROGRAM_KEY',
  'MEMBER_NAME',
  'SHIKSHA_CODE',
  'CURRENT_LEVEL',
  'RECOMMENDED_LEVEL',
  'REMARKS',
  'STATUS',
  'EVALUATED_BY',
  'EVALUATED_AT',
  'CEREMONY_DATE',
  'CERTIFICATE_NO',
  'ADMIN_NOTES',
  'CREATED_AT',
  'UPDATED_AT'
];

function _ensureWorkflowSheet_(sheetName, headers) {
  var ss = getSpreadsheet_();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    return sheet;
  }

  var existingHeaders = sheet.getRange(1, 1, 1, Math.max(1, sheet.getLastColumn())).getValues()[0]
    .map(function(h) { return (h || '').toString().trim(); });

  if (existingHeaders.length < headers.length) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    return sheet;
  }

  var changed = false;
  for (var i = 0; i < headers.length; i++) {
    if ((existingHeaders[i] || '') !== headers[i]) {
      changed = true;
      break;
    }
  }

  if (changed) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }

  return sheet;
}

function _nowIso_() {
  return new Date().toISOString();
}

function _normalizeUpper_(val) {
  return (val || '').toString().trim().toUpperCase();
}

function _ownerProgramKeys_(ownerId) {
  var ownerUpper = _normalizeUpper_(ownerId);
  var programs = _getAllPrograms();
  var keys = {};

  for (var i = 0; i < programs.length; i++) {
    var row = programs[i];
    if (_normalizeUpper_(row[TAB1_COLS.PROGRAM_OWNER]) !== ownerUpper) continue;
    var key = (row[TAB1_COLS.PROGRAM_KEY] || '').toString().trim();
    if (!key) continue;
    keys[key] = {
      programKey: key,
      area: row[TAB1_COLS.AREA] || '',
      subArea: row[TAB1_COLS.SUB_AREA] || '',
      type: row[TAB1_COLS.TYPE_OF_PROGRAM] || '',
      day: row[TAB1_COLS.DAY] || '',
      time: row[TAB1_COLS.TIME] || '',
      active: ['YES', 'Y'].indexOf(_normalizeUpper_(row[TAB1_COLS.ACT_FLG])) !== -1
    };
  }

  return keys;
}

function getOwnerAttention(ownerId) {
  var programMap = _ownerProgramKeys_(ownerId);
  var programKeys = Object.keys(programMap);
  if (!programKeys.length) {
    return {
      programsNeedingAttendance: [],
      stalePrograms: []
    };
  }

  var attSheet = getSheet_(SHEET_NAMES.ATTENDANCE);
  if (!attSheet) {
    return {
      programsNeedingAttendance: programKeys.map(function(pk) { return programMap[pk]; }),
      stalePrograms: []
    };
  }

  var data = getAllData_(attSheet);
  if (data.length < 2) {
    return {
      programsNeedingAttendance: programKeys.map(function(pk) { return programMap[pk]; }),
      stalePrograms: []
    };
  }

  var headerMeta = getHeaderMap_(attSheet);
  var h = headerMeta.headersLower;
  var idxProgram = findHeaderIndex_(h, ['program key', 'program_key', 'program']);
  var idxDate = findHeaderIndex_(h, ['last_att_date', 'last attendance date', 'date']);

  var latestByProgram = {};
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var pk = idxProgram >= 0 ? (row[idxProgram] || '').toString().trim() : (row[ATT_COLS.PROGRAM_KEY] || '').toString().trim();
    if (!programMap[pk]) continue;
    var dtVal = idxDate >= 0 ? row[idxDate] : '';
    var dt = parseDate_(dtVal);
    if (!latestByProgram[pk] || (dt && latestByProgram[pk] < dt)) {
      latestByProgram[pk] = dt || latestByProgram[pk] || null;
    }
  }

  var today = new Date();
  var staleCutoffMs = 10 * 24 * 60 * 60 * 1000;
  var programsNeedingAttendance = [];
  var stalePrograms = [];

  programKeys.forEach(function(pk) {
    var info = programMap[pk];
    if (!info.active) return;

    var d = latestByProgram[pk];
    if (!d) {
      programsNeedingAttendance.push(info);
      return;
    }

    var delta = today.getTime() - d.getTime();
    if (delta > staleCutoffMs) {
      stalePrograms.push({
        programKey: pk,
        lastAttendanceDate: formatDateISO_(d),
        daysSinceLastMarked: Math.floor(delta / (24 * 60 * 60 * 1000)),
        day: info.day,
        time: info.time,
        area: info.area,
        subArea: info.subArea
      });
    }
  });

  return {
    programsNeedingAttendance: programsNeedingAttendance,
    stalePrograms: stalePrograms
  };
}

function getOwnerMemberProfiles(ownerId) {
  var programMap = _ownerProgramKeys_(ownerId);
  var allowedKeys = Object.keys(programMap);
  if (!allowedKeys.length) return [];

  var sheet = getSheet_(SHEET_NAMES.PARTICIPANTS);
  if (!sheet) return [];

  var data = getAllData_(sheet);
  if (data.length < 2) return [];

  var meta = getHeaderMap_(sheet);
  var headers = meta.headers;
  var headersLower = meta.headersLower;
  var idxProgram = findHeaderIndex_(headersLower, ['program_key', 'program key', 'program']);
  var idxActive = findHeaderIndex_(headersLower, ['active_flg', 'active_flag', 'active']);
  var idxName = findHeaderIndex_(headersLower, ['name', 'fname', 'devotee_name', 'full_name']);
  var idxLevel = findHeaderIndex_(headersLower, ['siksha status', 'siksha_status', 'shiksha_status']);
  var idxShiksha = findHeaderIndex_(headersLower, ['shiksha_code', 'siksha code', 'shiksha code']);
  var idxBv = findHeaderIndex_(headersLower, ['bv leader', 'bv_leader', 'bvleader']);
  var idxPhone = findHeaderIndex_(headersLower, ['contact number', 'contact_number', 'contact', 'phone']);
  var idxEmail = findHeaderIndex_(headersLower, ['email', 'email id', 'email_id']);
  var idxCity = findHeaderIndex_(headersLower, ['city']);

  var latestByProgramAndName = {};

  for (var i = data.length - 1; i >= 1; i--) {
    var row = data[i];
    var pk = idxProgram >= 0 ? (row[idxProgram] || '').toString().trim() : '';
    if (!programMap[pk]) continue;

    if (idxActive >= 0 && _normalizeUpper_(row[idxActive]) !== 'Y') continue;

    var name = idxName >= 0 ? (row[idxName] || '').toString().trim() : '';
    if (!name) continue;

    var key = pk + '|' + _normalizeUpper_(name);
    if (latestByProgramAndName[key]) continue;

    latestByProgramAndName[key] = {
      rowIndex: i + 1,
      programKey: pk,
      memberName: name,
      shikshaCode: idxShiksha >= 0 ? (row[idxShiksha] || '').toString().trim() : '',
      currentLevel: idxLevel >= 0 ? (row[idxLevel] || '').toString().trim() : '',
      bvLeader: idxBv >= 0 ? (row[idxBv] || '').toString().trim() : '',
      contactNumber: idxPhone >= 0 ? (row[idxPhone] || '').toString().trim() : '',
      email: idxEmail >= 0 ? (row[idxEmail] || '').toString().trim() : '',
      city: idxCity >= 0 ? (row[idxCity] || '').toString().trim() : '',
      raw: mapRowToHeaders_(headers, row)
    };
  }

  return Object.keys(latestByProgramAndName)
    .map(function(k) { return latestByProgramAndName[k]; })
    .sort(function(a, b) {
      if (a.programKey === b.programKey) return a.memberName.localeCompare(b.memberName);
      return a.programKey.localeCompare(b.programKey);
    });
}

function updateOwnerMemberProfile(ownerId, payload) {
  payload = payload || {};
  var rowIndex = Number(payload.rowIndex) || 0;
  if (rowIndex < 2) throw new Error('Invalid row index.');

  var programMap = _ownerProgramKeys_(ownerId);

  var sheet = getSheet_(SHEET_NAMES.PARTICIPANTS);
  if (!sheet) throw new Error('Participants sheet not found.');

  var meta = getHeaderMap_(sheet);
  var headers = meta.headers;
  var headersLower = meta.headersLower;
  var lastCol = headers.length;

  if (rowIndex > sheet.getLastRow()) throw new Error('Row does not exist.');

  var oldRow = sheet.getRange(rowIndex, 1, 1, lastCol).getValues()[0];

  var idxProgram = findHeaderIndex_(headersLower, ['program_key', 'program key', 'program']);
  var idxActive = findHeaderIndex_(headersLower, ['active_flg', 'active_flag', 'active']);
  var idxPhone = findHeaderIndex_(headersLower, ['contact number', 'contact_number', 'contact', 'phone']);
  var idxEmail = findHeaderIndex_(headersLower, ['email', 'email id', 'email_id']);
  var idxCity = findHeaderIndex_(headersLower, ['city']);
  var idxAddress = findHeaderIndex_(headersLower, ['contact address', 'contact_address', 'address']);
  var idxLang = findHeaderIndex_(headersLower, ['preferred language of comm', 'preferred language', 'language', 'preferred_language']);
  var idxUpdated = findHeaderIndex_(headersLower, ['updated_at', 'last_updated']);

  var pk = idxProgram >= 0 ? (oldRow[idxProgram] || '').toString().trim() : '';
  if (!programMap[pk]) throw new Error('You are not allowed to update this member profile.');

  if (idxActive === -1) {
    sheet.getRange(1, lastCol + 1).setValue('ACTIVE_FLG');
    idxActive = lastCol;
    lastCol++;
    oldRow.push('Y');
  }

  var newRow = oldRow.slice(0, lastCol);
  if (idxPhone >= 0 && payload.contactNumber !== undefined) newRow[idxPhone] = payload.contactNumber;
  if (idxEmail >= 0 && payload.email !== undefined) newRow[idxEmail] = payload.email;
  if (idxCity >= 0 && payload.city !== undefined) newRow[idxCity] = payload.city;
  if (idxAddress >= 0 && payload.contactAddress !== undefined) newRow[idxAddress] = payload.contactAddress;
  if (idxLang >= 0 && payload.language !== undefined) newRow[idxLang] = payload.language;
  if (idxUpdated >= 0) newRow[idxUpdated] = _nowIso_();
  newRow[idxActive] = 'Y';

  sheet.getRange(rowIndex, idxActive + 1).setValue('N');
  sheet.appendRow(newRow);

  logInfo_('Workflow.updateOwnerMemberProfile', 'Owner ' + ownerId + ' updated row ' + rowIndex);
  return { success: true, message: 'Member profile updated successfully.' };
}

function createShikshaCampaign(adminId, formData) {
  if (!isSuperUser(adminId)) throw new Error('Only super admin can create campaigns.');

  formData = formData || {};
  var shikshaDate = (formData.shikshaDate || '').toString().trim();
  var targetLevel = (formData.targetLevel || '').toString().trim();
  var message = (formData.message || '').toString().trim();

  if (!shikshaDate) throw new Error('Shiksha date is required.');
  if (!targetLevel) throw new Error('Target level is required.');

  var sheet = _ensureWorkflowSheet_(WORKFLOW_SHEETS.CAMPAIGNS, CAMPAIGN_HEADERS);
  var now = _nowIso_();
  var campaignId = 'CMP-' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd-HHmmss') + '-' + Math.floor(Math.random() * 900 + 100);

  sheet.appendRow([
    campaignId,
    shikshaDate,
    targetLevel,
    message,
    'OPEN',
    adminId,
    now,
    now
  ]);

  return { success: true, campaignId: campaignId };
}

function getCampaigns(status) {
  var sheet = _ensureWorkflowSheet_(WORKFLOW_SHEETS.CAMPAIGNS, CAMPAIGN_HEADERS);
  var data = getAllData_(sheet);
  if (data.length < 2) return [];

  var filterStatus = _normalizeUpper_(status || '');
  var out = [];

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var rec = {
      campaignId: row[0] || '',
      shikshaDate: row[1] || '',
      targetLevel: row[2] || '',
      message: row[3] || '',
      status: row[4] || 'OPEN',
      requestedBy: row[5] || '',
      requestedAt: row[6] || '',
      updatedAt: row[7] || ''
    };
    if (filterStatus && _normalizeUpper_(rec.status) !== filterStatus) continue;
    out.push(rec);
  }

  out.sort(function(a, b) {
    return (b.requestedAt || '').toString().localeCompare((a.requestedAt || '').toString());
  });

  return out;
}

function submitOwnerRecommendation(ownerId, payload) {
  payload = payload || {};
  var campaignId = (payload.campaignId || '').toString().trim();
  var programKey = (payload.programKey || '').toString().trim();
  var memberName = (payload.memberName || '').toString().trim();
  var recommendedLevel = (payload.recommendedLevel || '').toString().trim();
  var remarks = (payload.remarks || '').toString().trim();

  if (!campaignId) throw new Error('Campaign is required.');
  if (!programKey) throw new Error('Program key is required.');
  if (!memberName) throw new Error('Member name is required.');
  if (!recommendedLevel) throw new Error('Recommended level is required.');

  var programMap = _ownerProgramKeys_(ownerId);
  if (!programMap[programKey]) {
    throw new Error('You can only recommend members from your own programs.');
  }

  var profiles = getOwnerMemberProfiles(ownerId);
  var currentLevel = 'None';
  var shikshaCode = '';
  for (var i = 0; i < profiles.length; i++) {
    if (profiles[i].programKey === programKey && _normalizeUpper_(profiles[i].memberName) === _normalizeUpper_(memberName)) {
      currentLevel = profiles[i].currentLevel || 'None';
      shikshaCode = profiles[i].shikshaCode || '';
      break;
    }
  }

  var recSheet = _ensureWorkflowSheet_(WORKFLOW_SHEETS.RECOMMENDATIONS, RECOMMENDATION_HEADERS);
  var recData = getAllData_(recSheet);
  var now = _nowIso_();

  for (var r = 1; r < recData.length; r++) {
    if (
      _normalizeUpper_(recData[r][1]) === _normalizeUpper_(campaignId) &&
      _normalizeUpper_(recData[r][2]) === _normalizeUpper_(ownerId) &&
      _normalizeUpper_(recData[r][3]) === _normalizeUpper_(programKey) &&
      _normalizeUpper_(recData[r][4]) === _normalizeUpper_(memberName)
    ) {
      recSheet.getRange(r + 1, 8).setValue(recommendedLevel);
      recSheet.getRange(r + 1, 9).setValue(remarks);
      recSheet.getRange(r + 1, 10).setValue('PENDING');
      recSheet.getRange(r + 1, 17).setValue(now);
      return { success: true, message: 'Recommendation updated.' };
    }
  }

  var recId = 'REC-' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd-HHmmss') + '-' + Math.floor(Math.random() * 900 + 100);

  recSheet.appendRow([
    recId,
    campaignId,
    ownerId,
    programKey,
    memberName,
    shikshaCode,
    currentLevel,
    recommendedLevel,
    remarks,
    'PENDING',
    '',
    '',
    '',
    '',
    '',
    now,
    now
  ]);

  return { success: true, message: 'Recommendation submitted.' };
}

function getOwnerRecommendations(ownerId) {
  var recs = getRecommendations({ ownerId: ownerId });
  return recs.rows;
}

function getRecommendations(filters) {
  filters = filters || {};
  var sheet = _ensureWorkflowSheet_(WORKFLOW_SHEETS.RECOMMENDATIONS, RECOMMENDATION_HEADERS);
  var data = getAllData_(sheet);
  if (data.length < 2) return { rows: [], stats: { total: 0, pending: 0, approved: 0, rejected: 0 } };

  var fCampaign = _normalizeUpper_(filters.campaignId || '');
  var fOwner = _normalizeUpper_(filters.ownerId || '');
  var fLevel = _normalizeUpper_(filters.recommendedLevel || '');
  var fStatus = _normalizeUpper_(filters.status || '');

  var rows = [];
  var stats = { total: 0, pending: 0, approved: 0, rejected: 0 };

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var rec = {
      recId: row[0] || '',
      campaignId: row[1] || '',
      ownerId: row[2] || '',
      programKey: row[3] || '',
      memberName: row[4] || '',
      shikshaCode: row[5] || '',
      currentLevel: row[6] || '',
      recommendedLevel: row[7] || '',
      remarks: row[8] || '',
      status: row[9] || 'PENDING',
      evaluatedBy: row[10] || '',
      evaluatedAt: row[11] || '',
      ceremonyDate: row[12] || '',
      certificateNo: row[13] || '',
      adminNotes: row[14] || '',
      createdAt: row[15] || '',
      updatedAt: row[16] || ''
    };

    if (fCampaign && _normalizeUpper_(rec.campaignId) !== fCampaign) continue;
    if (fOwner && _normalizeUpper_(rec.ownerId) !== fOwner) continue;
    if (fLevel && _normalizeUpper_(rec.recommendedLevel) !== fLevel) continue;
    if (fStatus && _normalizeUpper_(rec.status) !== fStatus) continue;

    rows.push(rec);

    stats.total++;
    var st = _normalizeUpper_(rec.status);
    if (st === 'APPROVED') stats.approved++;
    else if (st === 'REJECTED') stats.rejected++;
    else stats.pending++;
  }

  rows.sort(function(a, b) {
    return (b.createdAt || '').toString().localeCompare((a.createdAt || '').toString());
  });

  return { rows: rows, stats: stats };
}

function evaluateRecommendation(adminId, recId, decisionData) {
  if (!isSuperUser(adminId)) throw new Error('Only super admin can evaluate recommendations.');

  decisionData = decisionData || {};
  var status = _normalizeUpper_(decisionData.status || '');
  if (['APPROVED', 'REJECTED', 'PENDING'].indexOf(status) === -1) {
    throw new Error('Invalid recommendation status.');
  }

  var sheet = _ensureWorkflowSheet_(WORKFLOW_SHEETS.RECOMMENDATIONS, RECOMMENDATION_HEADERS);
  var data = getAllData_(sheet);
  var now = _nowIso_();

  for (var i = 1; i < data.length; i++) {
    if (_normalizeUpper_(data[i][0]) !== _normalizeUpper_(recId)) continue;

    sheet.getRange(i + 1, 10).setValue(status);
    sheet.getRange(i + 1, 11).setValue(adminId);
    sheet.getRange(i + 1, 12).setValue(now);
    sheet.getRange(i + 1, 13).setValue((decisionData.ceremonyDate || '').toString().trim());
    sheet.getRange(i + 1, 14).setValue((decisionData.certificateNo || '').toString().trim());
    sheet.getRange(i + 1, 15).setValue((decisionData.adminNotes || '').toString().trim());
    sheet.getRange(i + 1, 17).setValue(now);

    return { success: true, message: 'Recommendation updated.' };
  }

  throw new Error('Recommendation not found.');
}

function buildCertificatePrintData(recId) {
  var result = getRecommendations({});
  var rows = result.rows || [];
  for (var i = 0; i < rows.length; i++) {
    if (_normalizeUpper_(rows[i].recId) !== _normalizeUpper_(recId)) continue;
    if (_normalizeUpper_(rows[i].status) !== 'APPROVED') {
      throw new Error('Only approved recommendations can be printed.');
    }
    return {
      recId: rows[i].recId,
      memberName: rows[i].memberName,
      shikshaCode: rows[i].shikshaCode,
      programOwner: rows[i].ownerId,
      programKey: rows[i].programKey,
      level: rows[i].recommendedLevel,
      ceremonyDate: rows[i].ceremonyDate,
      certificateNo: rows[i].certificateNo,
      issuedOn: formatDateISO_(new Date())
    };
  }
  throw new Error('Recommendation not found.');
}
