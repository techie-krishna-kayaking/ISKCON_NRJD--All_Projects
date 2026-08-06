/**
 * Calendar — read/write dress assignments stored in the "Calendar" Sheet.
 * Columns: date (YYYY-MM-DD) | dress_filename | drive_file_id
 */

/** Google Sheets may auto-parse "2026-08-20" strings into Date objects; convert back. */
function _toDateStr(val) {
  if (val instanceof Date) {
    var y = val.getFullYear();
    var m = String(val.getMonth() + 1).padStart(2, '0');
    var d = String(val.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + d;
  }
  return String(val);
}

/**
 * Return calendar assignments and festivals for a given month (YYYY-MM).
 * Pass an empty string to return all data.
 */
function getCalendar(month) {
  var ss, calSheet;
  try {
    ss = getSpreadsheet();
    calSheet = ss.getSheetByName('Calendar');
  } catch(e) {
    return { assignments: {}, festivals: [] };
  }
  var assignments = {};

  if (calSheet.getLastRow() > 1) {
    var data = calSheet.getRange(2, 1, calSheet.getLastRow() - 1, 3).getValues();
    data.forEach(function(row) {
      var date = _toDateStr(row[0]);
      if (date && (!month || date.startsWith(month))) {
        assignments[date] = {
          dress:       String(row[1]),
          driveFileId: String(row[2])
        };
      }
    });
  }

  return {
    assignments: assignments,
    festivals: getFestivalsForMonth(month)
  };
}

/**
 * Assign a dress to a date. Updates an existing row or appends a new one.
 */
function assignDress(adminToken, date, dressFilename, driveFileId) {
  if (!isAdminToken(adminToken)) return { error: 'Unauthorized' };
  if (!date || !dressFilename)   return { error: 'date and dress are required' };

  var ss = getSpreadsheet();
  var calSheet = ss.getSheetByName('Calendar');

  if (calSheet.getLastRow() > 1) {
    var data = calSheet.getRange(2, 1, calSheet.getLastRow() - 1, 1).getValues();
    for (var i = 0; i < data.length; i++) {
      if (_toDateStr(data[i][0]) === date) {
        calSheet.getRange(i + 2, 1, 1, 3).setValues([[date, dressFilename, driveFileId || '']]);
        return { success: true };
      }
    }
  }

  calSheet.appendRow([date, dressFilename, driveFileId || '']);
  return { success: true };
}

/**
 * Remove the dress assignment for a given date.
 */
function unassignDress(adminToken, date) {
  if (!isAdminToken(adminToken)) return { error: 'Unauthorized' };

  var ss = getSpreadsheet();
  var calSheet = ss.getSheetByName('Calendar');

  if (calSheet.getLastRow() > 1) {
    var data = calSheet.getRange(2, 1, calSheet.getLastRow() - 1, 1).getValues();
    for (var i = data.length - 1; i >= 0; i--) {
      if (_toDateStr(data[i][0]) === date) {
        calSheet.deleteRow(i + 2);
        return { success: true };
      }
    }
  }

  return { success: true };
}
