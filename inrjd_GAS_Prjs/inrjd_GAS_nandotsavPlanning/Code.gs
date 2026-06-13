/**
 * Nandotsav Planning - Google Apps Script Web App
 * Reads school data from linked Google Sheet and allows field-level editing.
 */

// ─── CONFIG ─────────────────────────────────────────────────────────────────
const SHEET_ID = 'YOUR_GOOGLE_SHEET_ID_HERE'; // Replace with your Google Sheet ID
const SHEET_NAME = 'Sheet1'; // Replace with your sheet/tab name

// Column mapping (1-indexed)
const COL = {
  SNO: 1,
  SCHOOL: 2,
  CONTACT_NAME: 3,
  CONTACT_NUMBER: 4,
  LOCATION: 5,
  INITIAL_VISIT_DATE: 6,
  COMMENTS: 7,
  PRELIMS_DATE: 8,
  VOLUNTEERS: 9,
  UPDATED_AT: 10,
  IP_ADDRESS: 11,
  BROWSER_INFO: 12,
  DEVICE_INFO: 13
};

// ─── WEB APP ENTRY ──────────────────────────────────────────────────────────
function doGet(e) {
  const template = HtmlService.createTemplateFromFile('index');
  template.scriptUrl = ScriptApp.getService().getUrl() || '';

  return template
    .evaluate()
    .setTitle('Nandotsav 2026 - School Planning')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function getScriptUrl() {
  return ScriptApp.getService().getUrl();
}

// ─── DATA FUNCTIONS ─────────────────────────────────────────────────────────

/**
 * Returns all school records from the sheet.
 */
function getSchoolData() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME);
  const data = sheet.getDataRange().getValues();

  // Skip header row
  const records = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row[COL.SCHOOL - 1]) continue; // Skip empty rows

    records.push({
      rowIndex: i + 1, // 1-indexed row in sheet (for updates)
      sno: row[COL.SNO - 1],
      school: row[COL.SCHOOL - 1],
      contactName: row[COL.CONTACT_NAME - 1],
      contactNumber: String(row[COL.CONTACT_NUMBER - 1]),
      location: row[COL.LOCATION - 1],
      initialVisitDate: formatDate(row[COL.INITIAL_VISIT_DATE - 1]),
      comments: row[COL.COMMENTS - 1] || '',
      prelimsDate: formatDate(row[COL.PRELIMS_DATE - 1]),
      volunteers: row[COL.VOLUNTEERS - 1] || '',
      updatedAt: formatTimestamp(row[COL.UPDATED_AT - 1]),
      ipAddress: row[COL.IP_ADDRESS - 1] || '',
      browserInfo: row[COL.BROWSER_INFO - 1] || '',
      deviceInfo: row[COL.DEVICE_INFO - 1] || ''
    });
  }

  return records;
}

/**
 * Updates editable fields for a specific row.
 * @param {number} rowIndex - The sheet row number (1-indexed)
 * @param {object} updates - { initialVisitDate, comments, prelimsDate, volunteers }
 */
function updateSchoolRecord(rowIndex, updates) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME);

  if (updates.initialVisitDate !== undefined) {
    const dateVal = updates.initialVisitDate ? new Date(updates.initialVisitDate) : '';
    sheet.getRange(rowIndex, COL.INITIAL_VISIT_DATE).setValue(dateVal);
  }
  if (updates.comments !== undefined) {
    const commentRange = sheet.getRange(rowIndex, COL.COMMENTS);
    const newComment = String(updates.comments || '').trim();

    // Keep full comment history and always prepend latest updates.
    if (newComment) {
      const existingComments = String(commentRange.getValue() || '').trim();
      const stampedComment = buildStampedComment_(newComment);
      const mergedComments = existingComments
        ? stampedComment + '\n' + existingComments
        : stampedComment;
      commentRange.setValue(mergedComments);
    }
  }
  if (updates.prelimsDate !== undefined) {
    const dateVal = updates.prelimsDate ? new Date(updates.prelimsDate) : '';
    sheet.getRange(rowIndex, COL.PRELIMS_DATE).setValue(dateVal);
  }
  if (updates.volunteers !== undefined) {
    sheet.getRange(rowIndex, COL.VOLUNTEERS).setValue(updates.volunteers);
  }

  // Tracking columns (auto-populated)
  sheet.getRange(rowIndex, COL.UPDATED_AT).setValue(new Date());
  if (updates.ipAddress) {
    sheet.getRange(rowIndex, COL.IP_ADDRESS).setValue(updates.ipAddress);
  }
  if (updates.browserInfo) {
    sheet.getRange(rowIndex, COL.BROWSER_INFO).setValue(updates.browserInfo);
  }
  if (updates.deviceInfo) {
    sheet.getRange(rowIndex, COL.DEVICE_INFO).setValue(updates.deviceInfo);
  }

  return { success: true };
}

// ─── HELPERS ────────────────────────────────────────────────────────────────

function formatTimestamp(value) {
  if (!value) return '';
  if (value instanceof Date) {
    const d = value.getDate().toString().padStart(2, '0');
    const m = (value.getMonth() + 1).toString().padStart(2, '0');
    const y = value.getFullYear();
    const h = value.getHours().toString().padStart(2, '0');
    const min = value.getMinutes().toString().padStart(2, '0');
    return d + '/' + m + '/' + y + ' ' + h + ':' + min;
  }
  return String(value);
}

function formatDate(value) {
  if (!value) return '';
  if (value instanceof Date) {
    const d = value.getDate().toString().padStart(2, '0');
    const m = (value.getMonth() + 1).toString().padStart(2, '0');
    const y = value.getFullYear();
    return y + '-' + m + '-' + d;
  }
  return String(value);
}

function buildStampedComment_(comment) {
  const tz = Session.getScriptTimeZone() || 'Asia/Kolkata';
  const timestamp = Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd-HHmmss');
  return timestamp + ' - ' + comment;
}
