function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

const APP_PIN = '108';
// Paste the Google Sheet ID here. If left unchanged, the script falls back to the active spreadsheet.
const SPREADSHEET_ID = 'PASTE_GOOGLE_SHEET_ID_HERE';

const CONFIG = {
  APP_PIN: APP_PIN,
  VOLUNTEER_SHEET_NAME: 'volunteers',
  MASTER_SHEET_NAME: 'MASTER SPOC List',
  VOLUNTEER_ALIASES: [
    'NAME',
    'Volunteer Name',
    'Volunteer',
    'Volunteer Name*',
    'Name'
  ],
  GROUP_ALIASES: [
    'GROUP',
    'Group',
    'Service Group',
    'Department',
    'Seva Group',
    'Team'
  ],
  PHONE_ALIASES: [
    'PHNO',
    'Phone',
    'Phone Number',
    'Mobile',
    'Mobile Number',
    'Contact Number'
  ],
  DATE_ALIASES: [
    'DATE',
    'Date',
    'Volunteer Date',
    'Allocated Date'
  ],
  TIME_ALIASES: [
    'TIME',
    'Time',
    'Availability',
    'Available Time',
    'Slot',
    'Time Slot'
  ],
  TAG_ALIASES: [
    'TAG',
    'Tag',
    'Tag Received',
    'Tag Status',
    'Attendance',
    'Status'
  ],
  TAG_TIMESTAMP_ALIASES: [
    'TAG TIME',
    'Tag Time',
    'Tag Timestamp',
    'Received Time',
    'Tag Received Time',
    'Attendance Time',
    'Timestamp',
    'Updated At'
  ],
  OPERATOR_ALIASES: [
    'UPDATED BY',
    'Updated By',
    'Operator',
    'Entered By',
    'Entry By'
  ]
};

function doGet() {
  return HtmlService
    .createTemplateFromFile('Index')
    .evaluate()
    .setTitle('ISKCON NRJD - Janmashtami 2026 Volunteer Tag Management')
    .setSandboxMode(HtmlService.SandboxMode.IFRAME);
}

function validatePin(pin) {
  return String(pin || '').trim() === APP_PIN;
}

function getApplicationConfig() {
  return {
    appPin: APP_PIN,
    spreadsheetId: SPREADSHEET_ID,
    volunteerSheetName: CONFIG.VOLUNTEER_SHEET_NAME,
    masterSheetName: CONFIG.MASTER_SHEET_NAME,
    ok: true
  };
}

function getTargetSpreadsheet() {
  if (SPREADSHEET_ID && SPREADSHEET_ID !== 'PASTE_GOOGLE_SHEET_ID_HERE') {
    try {
      return SpreadsheetApp.openById(SPREADSHEET_ID);
    } catch (error) {
      console.warn('Could not open spreadsheet by configured ID. Falling back to active spreadsheet.', error);
    }
  }

  return SpreadsheetApp.getActiveSpreadsheet();
}

function validateSpreadsheetStructure() {
  const ss = getTargetSpreadsheet();
  if (!ss) {
    return {
      ok: false,
      message: 'No active spreadsheet found.'
    };
  }

  const checks = [];

  const volunteerSheet = getSheetByName(CONFIG.VOLUNTEER_SHEET_NAME);
  if (!volunteerSheet) {
    checks.push('❌ Volunteer sheet could not be found. Expected: ' + CONFIG.VOLUNTEER_SHEET_NAME);
    return { ok: false, checks: checks, message: 'Volunteer sheet missing.' };
  }
  checks.push('✅ Volunteer sheet found: ' + volunteerSheet.getName());

  const masterSheet = getSheetByName(CONFIG.MASTER_SHEET_NAME);
  if (masterSheet) {
    checks.push('✅ Master sheet found: ' + masterSheet.getName());
  } else {
    checks.push('⚠ Master sheet not found; duplicate SPOC metadata will be limited to volunteer data.');
  }

  const values = volunteerSheet.getDataRange().getValues();
  if (!values || values.length < 2) {
    checks.push('❌ Volunteer sheet has no header row or data rows.');
    return { ok: false, checks: checks, message: 'Volunteer data missing.' };
  }

  const headers = values[0].map(function (cell) {
    return String(cell || '').trim();
  });

  const nameIndex = findColumn(headers, CONFIG.VOLUNTEER_ALIASES);
  const phoneIndex = findColumn(headers, CONFIG.PHONE_ALIASES);
  const groupIndex = findColumn(headers, CONFIG.GROUP_ALIASES);
  const dateIndex = findColumn(headers, CONFIG.DATE_ALIASES);
  const timeIndex = findColumn(headers, CONFIG.TIME_ALIASES);
  const tagIndex = findColumn(headers, CONFIG.TAG_ALIASES);

  if (nameIndex === -1) {
    checks.push('❌ Name column could not be identified. Expected one of: ' + CONFIG.VOLUNTEER_ALIASES.join(', '));
  } else {
    checks.push('✅ Name column found: ' + headers[nameIndex]);
  }

  if (phoneIndex === -1) {
    checks.push('⚠ Phone column could not be identified. Search by phone may be limited.');
  } else {
    checks.push('✅ Phone column found: ' + headers[phoneIndex]);
  }

  if (groupIndex === -1) {
    checks.push('⚠ Group column could not be identified.');
  } else {
    checks.push('✅ Group column found: ' + headers[groupIndex]);
  }

  if (dateIndex === -1) {
    checks.push('⚠ Date column not found; date filters may be limited.');
  } else {
    checks.push('✅ Date column found: ' + headers[dateIndex]);
  }

  if (timeIndex === -1) {
    checks.push('⚠ Time/availability column not found.');
  } else {
    checks.push('✅ Time/availability column found: ' + headers[timeIndex]);
  }

  if (tagIndex === -1) {
    checks.push('❌ Tag column could not be identified. This is required for live tag recording.');
  } else {
    checks.push('✅ Tag column found: ' + headers[tagIndex]);
  }

  return {
    ok: nameIndex !== -1 && tagIndex !== -1,
    checks: checks,
    sheetName: volunteerSheet.getName(),
    headers: headers
  };
}

function getSheetByName(name) {
  const ss = getTargetSpreadsheet();
  if (!ss) {
    return null;
  }

  if (!name) {
    return null;
  }

  const exact = ss.getSheetByName(name);
  if (exact) {
    return exact;
  }

  const lookup = normalizeText(name);
  const sheets = ss.getSheets();
  for (let i = 0; i < sheets.length; i += 1) {
    if (normalizeText(sheets[i].getName()) === lookup) {
      return sheets[i];
    }
  }

  return null;
}

function normalizeText(value) {
  if (value === null || value === undefined) {
    return '';
  }
  return String(value)
    .normalize('NFKC')
    .replace(/\u200B|\u200C|\u200D|\uFEFF/g, '')
    .replace(/[\r\n]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function normalizeName(value) {
  const base = normalizeText(value)
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return base;
}

function normalizePhone(value) {
  if (value === null || value === undefined) {
    return '';
  }
  const digits = String(value).replace(/\D+/g, '');
  if (!digits) {
    return '';
  }
  return digits;
}

function findColumn(headers, aliases) {
  if (!headers || !headers.length) {
    return -1;
  }

  const normalized = headers.map(function (header) {
    return normalizeText(String(header || ''));
  });

  for (let i = 0; i < aliases.length; i += 1) {
    const alias = normalizeText(aliases[i]);
    const targetIndex = normalized.indexOf(alias);
    if (targetIndex !== -1) {
      return targetIndex;
    }
  }

  for (let i = 0; i < normalized.length; i += 1) {
    for (let j = 0; j < aliases.length; j += 1) {
      const alias = normalizeText(aliases[j]);
      if (normalized[i] && normalized[i].indexOf(alias) !== -1) {
        return i;
      }
    }
  }

  return -1;
}

function getHeaderMap(headers) {
  const map = {
    name: findColumn(headers, CONFIG.VOLUNTEER_ALIASES),
    group: findColumn(headers, CONFIG.GROUP_ALIASES),
    phone: findColumn(headers, CONFIG.PHONE_ALIASES),
    date: findColumn(headers, CONFIG.DATE_ALIASES),
    time: findColumn(headers, CONFIG.TIME_ALIASES),
    tag: findColumn(headers, CONFIG.TAG_ALIASES),
    tagTime: findColumn(headers, CONFIG.TAG_TIMESTAMP_ALIASES),
    operator: findColumn(headers, CONFIG.OPERATOR_ALIASES)
  };
  return map;
}

function readVolunteerSheetData() {
  const ss = getTargetSpreadsheet();
  if (!ss) {
    throw new Error('No spreadsheet is available. Please set SPREADSHEET_ID or use the active spreadsheet.');
  }

  const sheet = getSheetByName(CONFIG.VOLUNTEER_SHEET_NAME);
  if (!sheet) {
    throw new Error('Volunteer sheet not found: ' + CONFIG.VOLUNTEER_SHEET_NAME);
  }

  const values = sheet.getDataRange().getValues();
  if (!values || values.length < 2) {
    return {
      sheet: sheet,
      headers: [],
      rows: []
    };
  }

  const headers = values[0].map(function (cell) {
    return String(cell || '').trim();
  });
  const headerMap = getHeaderMap(headers);
  const rows = [];

  for (let i = 1; i < values.length; i += 1) {
    const row = values[i];
    if (!row || row.every(function (cell) { return String(cell || '').trim() === ''; })) {
      continue;
    }

    rows.push({
      rowIndex: i + 1,
      recordId: 'row:' + (i + 1),
      name: getCellValue(row, headerMap.name),
      group: getCellValue(row, headerMap.group),
      phone: getCellValue(row, headerMap.phone),
      date: getCellValue(row, headerMap.date),
      time: getCellValue(row, headerMap.time),
      tag: getCellValue(row, headerMap.tag),
      tagTime: getCellValue(row, headerMap.tagTime),
      operator: getCellValue(row, headerMap.operator),
      rawRow: row
    });
  }

  return {
    sheet: sheet,
    headers: headers,
    headerMap: headerMap,
    rows: rows
  };
}

function getCellValue(row, index) {
  if (index === undefined || index === null || index < 0 || !row || index >= row.length) {
    return '';
  }
  const value = row[index];
  return value === undefined || value === null ? '' : value;
}

function isTagReceived(value) {
  if (value === true || value === 1) {
    return true;
  }

  const raw = String(value || '').trim().toLowerCase();
  if (!raw) {
    return false;
  }

  if (raw === 'true' || raw === '1' || raw === 'yes' || raw === 'y') {
    return true;
  }

  if (raw.indexOf('received') !== -1 || raw.indexOf('yes') !== -1 || raw.indexOf('true') !== -1) {
    return true;
  }

  return false;
}

function tagStatusLabel(value) {
  return isTagReceived(value) ? '✅ Tag Already Received' : '☐ Tag Received';
}

function searchVolunteers(query, filters) {
  const data = readVolunteerSheetData();
  const allRows = data.rows || [];
  const q = normalizeText(query || '');
  const dateFilter = filters && filters.dateFilter ? String(filters.dateFilter) : 'ALL';

  const results = allRows.filter(function (volunteer) {
    if (dateFilter !== 'ALL') {
      const volunteerDate = normalizeText(volunteer.date || '');
      if (volunteerDate && volunteerDate !== normalizeText(dateFilter)) {
        return false;
      }
      if (!volunteerDate && dateFilter !== 'ALL') {
        return false;
      }
    }

    if (!q) {
      return true;
    }

    const nameValue = normalizeName(volunteer.name || '');
    const phoneValue = normalizePhone(volunteer.phone || '');
    const queryPhoneValue = normalizePhone(query || '');

    const nameMatch = nameValue.indexOf(normalizeName(query)) !== -1;
    const phoneMatch = !!queryPhoneValue && phoneValue.indexOf(queryPhoneValue) !== -1;
    const directMatch = nameMatch || phoneMatch;

    return directMatch;
  });

  const normalizedResults = results.map(function (volunteer) {
    return {
      recordId: volunteer.recordId,
      name: volunteer.name || 'Unknown',
      group: volunteer.group || 'N/A',
      phone: volunteer.phone || 'N/A',
      date: volunteer.date || 'N/A',
      time: volunteer.time || 'N/A',
      tagReceived: isTagReceived(volunteer.tag),
      tagStatusText: tagStatusLabel(volunteer.tag),
      rowIndex: volunteer.rowIndex
    };
  });

  const dateOptions = collectDateOptions(allRows);

  return {
    ok: true,
    total: normalizedResults.length,
    items: normalizedResults,
    dateOptions: dateOptions
  };
}

function collectDateOptions(rows) {
  const values = {};
  (rows || []).forEach(function (row) {
    const dateText = String(row.date || '').trim();
    if (dateText) {
      values[normalizeText(dateText)] = dateText;
    }
  });
  return Object.keys(values).map(function (key) {
    return values[key];
  });
}

function getVolunteerById(id) {
  const rowNumber = Number(String(id || '').replace(/^row:/, ''));
  if (!rowNumber) {
    return { ok: false, message: 'Invalid volunteer identifier.' };
  }

  const data = readVolunteerSheetData();
  const found = (data.rows || []).find(function (row) {
    return row.rowIndex === rowNumber;
  });

  if (!found) {
    return { ok: false, message: 'Volunteer record was not found in the current sheet.' };
  }

  return {
    ok: true,
    volunteer: {
      recordId: found.recordId,
      name: found.name || 'Unknown',
      group: found.group || 'N/A',
      phone: found.phone || 'N/A',
      date: found.date || 'N/A',
      time: found.time || 'N/A',
      tagReceived: isTagReceived(found.tag),
      tagStatusText: tagStatusLabel(found.tag),
      rowIndex: found.rowIndex
    }
  };
}

function markTagReceived(id) {
  const lock = LockService.getScriptLock();
  const lockAcquired = lock.tryLock(10000);

  if (!lockAcquired) {
    return {
      ok: false,
      code: 'LOCK_TIMEOUT',
      message: 'Another tag update is in progress. Please try again in a moment.'
    };
  }

  try {
    const rowNumber = Number(String(id || '').replace(/^row:/, ''));
    if (!rowNumber) {
      return {
        ok: false,
        code: 'INVALID_ID',
        message: 'Invalid volunteer identifier.'
      };
    }

    const sheet = getSheetByName(CONFIG.VOLUNTEER_SHEET_NAME);
    if (!sheet) {
      return {
        ok: false,
        code: 'SHEET_NOT_FOUND',
        message: 'Volunteer sheet could not be found.'
      };
    }

    const data = readVolunteerSheetData();
    const rows = data.rows || [];
    const found = rows.find(function (row) {
      return row.rowIndex === rowNumber;
    });

    if (!found) {
      return {
        ok: false,
        code: 'RECORD_NOT_FOUND',
        message: 'Volunteer record no longer exists in the sheet.'
      };
    }

    const currentTag = found.tag;
    if (isTagReceived(currentTag)) {
      return {
        ok: false,
        code: 'ALREADY_RECEIVED',
        message: 'Tag Already Received',
        volunteer: {
          recordId: found.recordId,
          name: found.name,
          date: found.date,
          time: found.time,
          group: found.group,
          phone: found.phone
        }
      };
    }

    const headers = data.headers || [];
    const headerMap = data.headerMap || {};

    const tagIndex = headerMap.tag;
    if (tagIndex === undefined || tagIndex < 0) {
      return {
        ok: false,
        code: 'TAG_COLUMN_MISSING',
        message: 'The volunteer sheet is missing the tag column required for tag recording.'
      };
    }

    sheet.getRange(rowNumber, tagIndex + 1).setValue('TRUE');

    const timestampIndex = headerMap.tagTime;
    if (timestampIndex !== undefined && timestampIndex >= 0) {
      sheet.getRange(rowNumber, timestampIndex + 1).setValue(new Date());
    }

    const operatorIndex = headerMap.operator;
    if (operatorIndex !== undefined && operatorIndex >= 0) {
      const operatorName = Session.getActiveUser() && Session.getActiveUser().getEmail()
        ? Session.getActiveUser().getEmail()
        : 'Google Apps Script Web App';
      sheet.getRange(rowNumber, operatorIndex + 1).setValue(operatorName);
    }

    return {
      ok: true,
      code: 'UPDATED',
      message: 'Tag recorded successfully',
      volunteer: {
        recordId: found.recordId,
        name: found.name || 'Unknown',
        group: found.group || 'N/A',
        phone: found.phone || 'N/A',
        date: found.date || 'N/A',
        time: found.time || 'N/A',
        rowIndex: found.rowIndex,
        tagReceived: true,
        tagStatusText: '✅ Tag Already Received'
      }
    };
  } catch (error) {
    console.error('markTagReceived failed:', error);
    return {
      ok: false,
      code: 'SERVER_ERROR',
      message: 'Unable to update the volunteer tag. Please try again.'
    };
  } finally {
    lock.releaseLock();
  }
}

function getTagStatistics() {
  const data = readVolunteerSheetData();
  const rows = data.rows || [];

  let total = 0;
  let tagReceived = 0;
  let tagPending = 0;

  rows.forEach(function (row) {
    total += 1;
    if (isTagReceived(row.tag)) {
      tagReceived += 1;
    } else {
      tagPending += 1;
    }
  });

  const duplicates = getDuplicateVolunteerReport();

  return {
    ok: true,
    totalVolunteers: total,
    tagReceived: tagReceived,
    tagPending: tagPending,
    multipleActivityVolunteers: duplicates.summary ? duplicates.summary.totalGroups : 0
  };
}

function getMasterSpocIndex() {
  const sheet = getSheetByName(CONFIG.MASTER_SHEET_NAME);
  if (!sheet) {
    return {};
  }

  const raw = sheet.getDataRange().getValues();
  const map = {};

  for (let r = 0; r < raw.length; r += 1) {
    const row = raw[r];
    if (!row || row.every(function (cell) { return String(cell || '').trim() === ''; })) {
      continue;
    }

    const departmentName = String(row[0] || '').trim();
    const primarySpoc = String(row[1] || '').trim();
    const secondarySpoc = String(row[2] || '').trim();

    if (!departmentName) {
      continue;
    }

    map[normalizeText(departmentName)] = {
      primarySpoc: primarySpoc || '',
      secondarySpoc: secondarySpoc || ''
    };
  }

  return map;
}

function resolveSpocForGroup(groupName, masterMap) {
  if (!groupName) {
    return { primarySpoc: '', secondarySpoc: '' };
  }

  const normalized = normalizeText(groupName);
  const direct = masterMap[normalized];
  if (direct) {
    return direct;
  }

  for (const key in masterMap) {
    if (key && (key.indexOf(normalized) !== -1 || normalized.indexOf(key) !== -1)) {
      return masterMap[key];
    }
  }

  return { primarySpoc: '', secondarySpoc: '' };
}

function getDuplicateVolunteerReport(query) {
  const data = readVolunteerSheetData();
  const rows = data.rows || [];
  const masterMap = getMasterSpocIndex();
  const searchText = normalizeText(query || '');

  const groupedByPhone = {};
  const groupedByName = {};

  rows.forEach(function (row) {
    const normalizedPhone = normalizePhone(row.phone || '');
    const normalizedName = normalizeName(row.name || '');

    if (normalizedPhone) {
      const key = normalizedPhone;
      if (!groupedByPhone[key]) {
        groupedByPhone[key] = [];
      }
      groupedByPhone[key].push(row);
    } else if (normalizedName) {
      if (!groupedByName[normalizedName]) {
        groupedByName[normalizedName] = [];
      }
      groupedByName[normalizedName].push(row);
    }
  });

  const duplicateGroups = [];
  const seen = {};

  Object.keys(groupedByPhone).forEach(function (phoneKey) {
    const records = groupedByPhone[phoneKey];
    if (records.length > 1) {
      const key = 'phone:' + phoneKey;
      seen[key] = true;
      duplicateGroups.push({
        key: key,
        reason: 'Same phone number',
        records: records
      });
    }
  });

  Object.keys(groupedByName).forEach(function (nameKey) {
    const records = groupedByName[nameKey];
    if (records.length > 1) {
      const hasPhoneMatch = records.some(function (record) { return !!normalizePhone(record.phone || ''); });
      if (!hasPhoneMatch) {
        const key = 'name:' + nameKey;
        if (!seen[key]) {
          seen[key] = true;
          duplicateGroups.push({
            key: key,
            reason: 'Same normalized name without phone',
            records: records
          });
        }
      }
    }
  });

  const people = duplicateGroups.map(function (group) {
    const activities = [];
    const itemLookup = {};

    group.records.forEach(function (record) {
      const groupKey = normalizeText(record.group || '') + '|' + normalizeText(record.date || '') + '|' + normalizeText(record.time || '');
      if (!itemLookup[groupKey]) {
        itemLookup[groupKey] = true;
        const spocInfo = resolveSpocForGroup(record.group || '', masterMap);
        activities.push({
          activity: record.group || 'N/A',
          date: record.date || 'N/A',
          time: record.time || 'N/A',
          primarySpoc: spocInfo.primarySpoc,
          secondarySpoc: spocInfo.secondarySpoc
        });
      }
    });

    const first = group.records[0];
    const phone = normalizePhone(first.phone || '') ? first.phone : '';
    const name = first.name || 'Unknown';

    return {
      name: name,
      phone: phone,
      activities: activities,
      duplicateCount: activities.length,
      reason: group.reason,
      primarySpoc: activities[0] ? activities[0].primarySpoc : '',
      secondarySpoc: activities[0] ? activities[0].secondarySpoc : ''
    };
  });

  const filtered = searchText
    ? people.filter(function (person) {
        const haystack = [
          person.name,
          person.phone,
          person.primarySpoc,
          person.secondarySpoc,
          (person.activities || []).map(function (item) { return item.activity; }).join(' '),
          (person.activities || []).map(function (item) { return item.date; }).join(' ')
        ].join(' ').toLowerCase();
        return haystack.indexOf(searchText) !== -1;
      })
    : people;

  return {
    ok: true,
    total: filtered.length,
    summary: {
      totalGroups: filtered.length,
      totalVolunteerRecords: rows.length
    },
    people: filtered
  };
}

function searchDuplicateVolunteers(query) {
  return getDuplicateVolunteerReport(query);
}
