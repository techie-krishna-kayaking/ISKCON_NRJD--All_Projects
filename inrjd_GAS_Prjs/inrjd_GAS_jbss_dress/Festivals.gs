/**
 * Festivals — CRUD for the "Festivals" Sheet.
 * Columns: date | festival_name | type | dress_comment
 */

/**
 * Return all festivals, optionally filtered by year prefix (YYYY) or month prefix (YYYY-MM).
 */
function getFestivals(year) {
  return { festivals: _readFestivals(year) };
}

/** Used by Calendar.gs — returns an array (not wrapped in an object). */
function getFestivalsForMonth(month) {
  return _readFestivals(month);
}

function _readFestivals(prefix) {
  var ss = getSpreadsheet();
  var festSheet = ss.getSheetByName('Festivals');
  var festivals = [];

  if (festSheet.getLastRow() > 1) {
    var data = festSheet.getRange(2, 1, festSheet.getLastRow() - 1, 4).getValues();
    data.forEach(function(row) {
      var date = String(row[0]);
      if (date && (!prefix || date.startsWith(prefix))) {
        festivals.push({
          date:          date,
          name:          String(row[1]),
          type:          String(row[2]),
          dress_comment: String(row[3])
        });
      }
    });
  }

  return festivals;
}

/**
 * Upload/replace all festivals from a CSV string (admin only).
 * Expected columns: date, festival_name, dress_comment
 * The "type" column is optional — auto-detected from the festival name.
 */
function uploadFestivals(adminToken, csvContent) {
  if (!isAdminToken(adminToken)) return { error: 'Unauthorized' };

  var rows = parseCsv(csvContent);
  if (rows.length < 2) return { error: 'CSV is empty or invalid' };

  var headers  = rows[0].map(function(h) { return h.trim().toLowerCase(); });
  var dateCol   = headers.indexOf('date');
  var nameCol   = headers.indexOf('festival_name') >= 0 ? headers.indexOf('festival_name') : headers.indexOf('name');
  var commentCol = headers.indexOf('dress_comment') >= 0 ? headers.indexOf('dress_comment') : headers.indexOf('comment');
  var typeCol   = headers.indexOf('type');

  if (dateCol < 0) return { error: 'CSV must have a "date" column' };

  var festivalRows = [];
  for (var i = 1; i < rows.length; i++) {
    var row  = rows[i];
    var date = (row[dateCol] || '').trim();
    if (!date) continue;

    var name    = nameCol >= 0    ? (row[nameCol]    || '').trim() : '';
    var comment = commentCol >= 0 ? (row[commentCol] || '').trim() : '';
    var explicit = typeCol >= 0   ? (row[typeCol]    || '').trim().toLowerCase() : '';
    var type = (['amavasya','purnima','festival'].indexOf(explicit) >= 0)
      ? explicit
      : detectFestivalType(name);

    festivalRows.push([date, name, type, comment]);
  }

  writeFestivalsToSheet(festivalRows);
  return { success: true, count: festivalRows.length };
}

/** Write festival rows to the Sheet (replaces all existing data). Internal use. */
function writeFestivalsToSheet(rows) {
  var ss = getSpreadsheet();
  var festSheet = ss.getSheetByName('Festivals');

  if (festSheet.getLastRow() > 1) {
    festSheet.getRange(2, 1, festSheet.getLastRow() - 1, 4).clearContent();
  }
  if (rows.length > 0) {
    festSheet.getRange(2, 1, rows.length, 4).setValues(rows);
  }
}

function detectFestivalType(name) {
  var lower = name.toLowerCase();
  if (lower.indexOf('amavasya') >= 0 || lower.indexOf('amavasy') >= 0 || lower.indexOf('amavas') >= 0) return 'amavasya';
  if (lower.indexOf('purnima') >= 0  || lower.indexOf('poornima') >= 0) return 'purnima';
  return 'festival';
}

/** Minimal CSV parser — handles quoted fields. */
function parseCsv(text) {
  var lines = text.split(/\r?\n/);
  var result = [];
  lines.forEach(function(line) {
    if (!line.trim()) return;
    var row = [], cur = '', inQ = false;
    for (var i = 0; i < line.length; i++) {
      var ch = line[i];
      if (ch === '"')       { inQ = !inQ; }
      else if (ch === ',' && !inQ) { row.push(cur); cur = ''; }
      else                  { cur += ch; }
    }
    row.push(cur);
    result.push(row);
  });
  return result;
}
