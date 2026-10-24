const SPREADSHEET_ID = '10W0a-IZPOT-UZxdm-xDf8O708kut34-z8ZDXmFeiVZw';
const DATA_SHEET_NAME = 'DM_2026';
const DASHBOARD_ADMIN_CODE = '108';

function doGet(e) {
  const isDashboard = e && e.parameter && e.parameter.page === 'dashboard';
  let output;
  try {
    const template = HtmlService.createTemplateFromFile(isDashboard ? 'dashboard' : 'form');
    template.webAppUrl = ScriptApp.getService().getUrl();
    output = template.evaluate();
  } catch (error) {
    if (!isDashboard) {
      throw error;
    }
    const message = error && error.message ? error.message : String(error);
    output = HtmlService.createHtmlOutput(
      '<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1">' +
      '<style>body{margin:0;padding:24px;font:16px Arial,sans-serif;background:#fff8e9;color:#3c2821}' +
      'main{max-width:640px;margin:10vh auto;padding:24px;border:1px solid #ead9bd;border-radius:16px;' +
      'background:#fffdf7;box-shadow:0 8px 24px #523b261a}h1{color:#571b12;font-size:22px}' +
      'p{line-height:1.6}code{overflow-wrap:anywhere}</style></head><body><main>' +
      '<h1>Dashboard page could not be opened</h1>' +
      '<p>Make sure <code>dashboard.html</code> exists in this Apps Script project, then save and deploy a new version.</p>' +
      '<p>Apps Script error: <code>' + escapeHtml_(message) + '</code></p>' +
      '</main></body></html>'
    );
  }

  return output
    .setTitle(isDashboard ? 'Damodar Program Dashboard' : 'Damodar Program Daily Report')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function getDashboardData(adminCode, filters) {
  if (String(adminCode == null ? '' : adminCode) !== DASHBOARD_ADMIN_CODE) {
    throw new Error('Incorrect admin code.');
  }

  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = spreadsheet.getSheetByName(DATA_SHEET_NAME);
  if (!sheet) {
    throw new Error('The DM_2026 sheet could not be found. Please contact the administrator.');
  }

  const lastRow = sheet.getLastRow();
  if (lastRow < 1) {
    throw new Error('The DM_2026 sheet does not contain a header row.');
  }

  const values = sheet.getRange(1, 1, lastRow, sheet.getLastColumn()).getValues();
  const headers = values[0].map(function (header) {
    return String(header).trim().toUpperCase();
  });
  const column = function (name) {
    const index = headers.indexOf(name);
    if (index < 0) {
      throw new Error('The DM_2026 sheet is missing the ' + name + ' column.');
    }
    return index;
  };
  const dateColumn = column('DATE');
  const areaColumn = column('AREA');
  const subAreaColumn = column('SUB-AREA');
  const typeColumn = column('TYPE_OF_PROGRAM');
  const conductedByColumn = headers.indexOf('CONDUCTED_BY') >= 0
    ? headers.indexOf('CONDUCTED_BY')
    : column('CUNDUCTED_BY');
  const peopleColumn = column('PEOPLE_COUNT');
  const lampColumn = column('LAMP_COUNT');
  const timezone = spreadsheet.getSpreadsheetTimeZone();
  const records = [];
  const options = { areas: {}, subAreas: {}, types: {}, conductedBy: {} };

  values.slice(1).forEach(function (row) {
    const dateValue = row[dateColumn];
    if (!(dateValue instanceof Date) || isNaN(dateValue.getTime())) {
      return;
    }

    const record = {
      date: Utilities.formatDate(dateValue, timezone, 'yyyy-MM-dd'),
      area: dashboardText_(row[areaColumn]),
      subArea: dashboardText_(row[subAreaColumn]),
      type: dashboardText_(row[typeColumn]),
      conductedBy: dashboardText_(row[conductedByColumn]),
      people: dashboardNumber_(row[peopleColumn]),
      lamps: dashboardNumber_(row[lampColumn])
    };
    records.push(record);
    addDashboardOption_(options.areas, record.area);
    addDashboardOption_(options.subAreas, record.subArea);
    addDashboardOption_(options.types, record.type);
    addDashboardOption_(options.conductedBy, record.conductedBy);
  });

  const selectedFilters = filters || {};
  const matches = records.filter(function (record) {
    return (!selectedFilters.area || selectedFilters.area === record.area) &&
      (!selectedFilters.subArea || selectedFilters.subArea === record.subArea) &&
      (!selectedFilters.type || selectedFilters.type === record.type) &&
      (!selectedFilters.conductedBy || selectedFilters.conductedBy === record.conductedBy);
  });

  const areaTotals = {};
  const typeTotals = {};
  const dailyTotals = {};
  let totalPeople = 0;
  let totalLamps = 0;
  matches.forEach(function (record) {
    totalPeople += record.people;
    totalLamps += record.lamps;
    if (!areaTotals[record.area]) {
      areaTotals[record.area] = { lamps: 0, people: 0 };
    }
    areaTotals[record.area].lamps += record.lamps;
    areaTotals[record.area].people += record.people;
    typeTotals[record.type] = (typeTotals[record.type] || 0) + 1;
    if (!dailyTotals[record.date]) {
      dailyTotals[record.date] = { programs: 0, lamps: 0, people: 0 };
    }
    dailyTotals[record.date].programs += 1;
    dailyTotals[record.date].lamps += record.lamps;
    dailyTotals[record.date].people += record.people;
  });

  const dailyMetric = ['programs', 'lamps', 'people'].indexOf(selectedFilters.metric) >= 0
    ? selectedFilters.metric
    : 'programs';
  let cumulative = 0;
  const daily = Object.keys(dailyTotals).sort().map(function (date) {
    const amount = dailyTotals[date][dailyMetric];
    cumulative += amount;
    return { date: date, daily: amount, cumulative: cumulative };
  });

  return {
    totals: { lamps: totalLamps, people: totalPeople, programs: matches.length },
    areaLamps: dashboardChartRows_(areaTotals, 'lamps'),
    areaPeople: dashboardChartRows_(areaTotals, 'people'),
    programTypes: Object.keys(typeTotals).sort().map(function (label) {
      return { label: label || 'Not specified', value: typeTotals[label] };
    }),
    daily: daily,
    dailyMetric: dailyMetric,
    options: {
      areas: Object.keys(options.areas).sort(),
      subAreas: Object.keys(options.subAreas).sort(),
      types: Object.keys(options.types).sort(),
      conductedBy: Object.keys(options.conductedBy).sort()
    }
  };
}

function submitData(formData) {
  if (!formData || typeof formData !== 'object') {
    throw new Error('Please complete the form and try again.');
  }

  const dateText = requiredText_(formData.date, 'Date');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateText)) {
    throw new Error('Please enter a valid program date.');
  }

  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = spreadsheet.getSheetByName(DATA_SHEET_NAME);
  if (!sheet) {
    throw new Error('The DM_2026 sheet could not be found. Please contact the administrator.');
  }

  const programDate = Utilities.parseDate(
    dateText,
    spreadsheet.getSpreadsheetTimeZone(),
    'yyyy-MM-dd'
  );
  if (
    Utilities.formatDate(programDate, spreadsheet.getSpreadsheetTimeZone(), 'yyyy-MM-dd') !==
    dateText
  ) {
    throw new Error('Please enter a valid program date.');
  }
  const peopleCount = nonNegativeInteger_(formData.peopleCount, 'Devotee count');
  const lampCount = nonNegativeInteger_(formData.lampCount, 'Lamp count');
  const time = requiredText_(formData.time, 'Time');
  const timeParts = /^(\d{2}):(\d{2})$/.exec(time);
  if (!timeParts || Number(timeParts[1]) > 23 || Number(timeParts[2]) > 59) {
    throw new Error('Please enter a valid program time.');
  }

  const row = [
    programDate,
    safeCellText_(requiredText_(formData.area, 'Area')),
    safeCellText_(requiredText_(formData.subArea, 'Sub-area')),
    time,
    safeCellText_(requiredText_(formData.host, 'Host')),
    safeCellText_(requiredText_(formData.conductedBy, 'Conducted by')),
    safeCellText_(requiredText_(formData.typeOfProgram, 'Type of program')),
    peopleCount,
    lampCount,
    new Date(),
    safeCellText_(requiredText_(formData.preachingWing, 'Preaching wing'))
  ];

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) {
    throw new Error('The form is busy right now. Please wait a moment and submit again.');
  }

  try {
    sheet.appendRow(row);
    return { message: 'Your Damodar program report has been recorded.' };
  } finally {
    lock.releaseLock();
  }
}

function requiredText_(value, label) {
  const text = String(value == null ? '' : value).trim();
  if (!text) {
    throw new Error(label + ' is required.');
  }
  return text;
}

function nonNegativeInteger_(value, label) {
  const text = String(value == null ? '' : value).trim();
  if (!/^\d+$/.test(text)) {
    throw new Error(label + ' must be a whole number of zero or more.');
  }
  const number = Number(text);
  if (!Number.isSafeInteger(number)) {
    throw new Error(label + ' is too large.');
  }
  return number;
}

function safeCellText_(value) {
  return /^[=+\-@]/.test(value) ? "'" + value : value;
}

function escapeHtml_(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function dashboardText_(value) {
  return String(value == null ? '' : value).trim();
}

function dashboardNumber_(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : 0;
}

function addDashboardOption_(options, value) {
  if (value) {
    options[value] = true;
  }
}

function dashboardChartRows_(totals, metric) {
  return Object.keys(totals).sort().map(function (label) {
    return { label: label || 'Not specified', value: totals[label][metric] };
  }).filter(function (item) {
    return item.value > 0;
  });
}
