/**
 * Google Apps Script entry point for NRJD preaching dashboard.
 *
 * Optional: set SHEET_ID if this script is standalone and not bound to a sheet.
 * If left blank, it uses the active spreadsheet.
 */
const SHEET_ID = '';
const SHEET_NAME = '';

function doGet() {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('NRJD Preaching Dashboard')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function getDashboardData() {
  const sheet = getDataSheet_();
  const values = sheet.getDataRange().getDisplayValues();

  if (!values || values.length < 2) {
    return {
      totals: {
        overall: 0,
        records: 0,
      },
      stageOrder: getDefaultStageOrder_(),
      combos: [],
      generatedAt: new Date().toISOString(),
    };
  }

  const headers = values[0].map(function(h) {
    return String(h || '').trim();
  });

  const idx = {
    cat: headers.indexOf('CAT'),
    gender: headers.indexOf('Gender'),
    c6: headers.indexOf('6C'),
    program: headers.indexOf('Program'),
    source: headers.indexOf('Source'),
    numbers: headers.indexOf('Numbers'),
  };

  validateHeaders_(idx, headers);

  const combosMap = {};
  const stageOrderSet = {};
  let overallTotal = 0;
  let nonEmptyRows = 0;

  for (let r = 1; r < values.length; r += 1) {
    const row = values[r];
    const cat = readCell_(row, idx.cat);
    const gender = readCell_(row, idx.gender);
    const stage = normalizeStage_(readCell_(row, idx.c6));
    const rawProgram = readCell_(row, idx.program);
    const rawSource = readCell_(row, idx.source);
    const rawNumbers = readCell_(row, idx.numbers);

    const entries = expandRowEntries_(rawProgram, rawSource, rawNumbers);
    const rowTotal = entries.reduce(function(sum, entry) {
      return sum + entry.number;
    }, 0);

    if (!cat && !gender && !stage && !rawProgram && !rawSource && rowTotal === 0) {
      continue;
    }

    nonEmptyRows += entries.length;
    stageOrderSet[stage] = true;

    const key = [cat || 'Unknown', gender || 'Unknown'].join('||');
    if (!combosMap[key]) {
      combosMap[key] = {
        cat: cat || 'Unknown',
        gender: gender || 'Unknown',
        label: [cat || 'Unknown', gender || 'Unknown'].join(' - '),
        total: 0,
        stages: {},
      };
    }

    const combo = combosMap[key];
    combo.total += rowTotal;
    overallTotal += rowTotal;

    if (!combo.stages[stage]) {
      combo.stages[stage] = {
        stage: stage,
        total: 0,
        rows: [],
      };
    }

    const stageObj = combo.stages[stage];
    stageObj.total += rowTotal;
    entries.forEach(function(entry) {
      stageObj.rows.push({
        program: entry.program,
        source: entry.source,
        number: entry.number,
      });
    });
  }

  const stageOrder = Object.keys(stageOrderSet).sort(compareStages_);
  const finalStageOrder = stageOrder.length ? stageOrder : getDefaultStageOrder_();

  const combos = Object.keys(combosMap)
    .map(function(key) {
      const combo = combosMap[key];
      const stageList = finalStageOrder.map(function(stageName) {
        if (combo.stages[stageName]) {
          return combo.stages[stageName];
        }
        return {
          stage: stageName,
          total: 0,
          rows: [],
        };
      });

      return {
        cat: combo.cat,
        gender: combo.gender,
        label: combo.label,
        total: combo.total,
        stages: stageList,
      };
    })
    .sort(compareCombos_);

  return {
    totals: {
      overall: overallTotal,
      records: nonEmptyRows,
    },
    stageOrder: finalStageOrder,
    combos: combos,
    generatedAt: new Date().toISOString(),
  };
}

function getDataSheet_() {
  if (SHEET_ID) {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    if (SHEET_NAME) {
      const explicit = ss.getSheetByName(SHEET_NAME);
      if (explicit) {
        return explicit;
      }
    }
    return ss.getSheets()[0];
  }

  const active = SpreadsheetApp.getActiveSpreadsheet();
  if (!active) {
    throw new Error('No active spreadsheet found. Set SHEET_ID in Code.gs for standalone web app use.');
  }

  if (SHEET_NAME) {
    const named = active.getSheetByName(SHEET_NAME);
    if (named) {
      return named;
    }
  }

  return active.getSheets()[0];
}

function validateHeaders_(idx, headers) {
  const missing = [];

  if (idx.cat === -1) missing.push('CAT');
  if (idx.gender === -1) missing.push('Gender');
  if (idx.c6 === -1) missing.push('6C');
  if (idx.program === -1) missing.push('Program');
  if (idx.source === -1) missing.push('Source');
  if (idx.numbers === -1) missing.push('Numbers');

  if (missing.length) {
    throw new Error(
      'Missing required columns: ' + missing.join(', ') +
      '. Found headers: ' + headers.join(', ')
    );
  }
}

function readCell_(row, index) {
  if (index < 0 || index >= row.length) return '';
  return String(row[index] || '').trim();
}

function normalizeStage_(value) {
  if (!value) return 'Unknown Stage';
  return String(value).replace(/\s+/g, ' ').trim();
}

function parseNumber_(value) {
  const clean = String(value || '').replace(/,/g, '').trim();
  if (!clean) return 0;
  const num = Number(clean);
  return Number.isFinite(num) ? num : 0;
}

function expandRowEntries_(programValue, sourceValue, numbersValue) {
  const programs = splitSemicolonValues_(programValue);
  const sources = splitSemicolonValues_(sourceValue);
  const numbers = splitSemicolonValues_(numbersValue);

  const count = Math.max(programs.length, sources.length, numbers.length, 1);
  const entries = [];

  for (let i = 0; i < count; i += 1) {
    const program = pickIndexedValue_(programs, i) || 'Not Specified';
    const source = pickIndexedValue_(sources, i) || 'Not Specified';
    const number = parseNumber_(pickIndexedValue_(numbers, i));
    entries.push({
      program: program,
      source: source,
      number: number,
    });
  }

  return entries;
}

function splitSemicolonValues_(value) {
  const raw = String(value || '').trim();
  if (!raw) return [];
  return raw
    .split(';')
    .map(function(part) {
      return String(part || '').trim();
    })
    .filter(function(part) {
      return part !== '';
    });
}

function pickIndexedValue_(arr, index) {
  if (!arr || !arr.length) return '';
  if (index < arr.length) return arr[index];
  if (arr.length === 1) return arr[0];
  return '';
}

function compareStages_(a, b) {
  const aNum = extractStageNumber_(a);
  const bNum = extractStageNumber_(b);
  if (aNum !== bNum) return aNum - bNum;
  return a.localeCompare(b);
}

function extractStageNumber_(stage) {
  const match = String(stage).match(/^(\d+)/);
  return match ? Number(match[1]) : 999;
}

function compareCombos_(a, b) {
  const catOrder = {
    Youth: 1,
    Adult: 2,
    Children: 3,
  };
  const genderOrder = {
    Male: 1,
    Female: 2,
    All: 3,
  };

  const aCatRank = catOrder[a.cat] || 99;
  const bCatRank = catOrder[b.cat] || 99;
  if (aCatRank !== bCatRank) return aCatRank - bCatRank;

  const aGenderRank = genderOrder[a.gender] || 99;
  const bGenderRank = genderOrder[b.gender] || 99;
  if (aGenderRank !== bGenderRank) return aGenderRank - bGenderRank;

  return a.label.localeCompare(b.label);
}

function getDefaultStageOrder_() {
  return [
    '1Contact',
    '2Cultivate',
    '3Congregate',
    '4Commitment',
    '5Certification',
    '6Complete Perfection',
  ];
}
