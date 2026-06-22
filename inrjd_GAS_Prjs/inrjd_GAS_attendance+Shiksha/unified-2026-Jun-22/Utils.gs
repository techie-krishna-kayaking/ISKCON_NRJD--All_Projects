/**
 * Generic utility helpers for validation, sheet access, caching, and logging.
 */
var Utils = (function () {
  function nowIso() {
    return new Date().toISOString();
  }

  function getSpreadsheet() {
    return SpreadsheetApp.openById(APP_CONFIG.SPREADSHEET_ID);
  }

  function getSheet(sheetName) {
    var sheet = getSpreadsheet().getSheetByName(sheetName);
    if (!sheet) {
      throw new Error('Missing sheet: ' + sheetName);
    }
    return sheet;
  }

  function sanitizeString(value) {
    if (value === null || value === undefined) return '';
    return String(value).trim();
  }

  function required(value, fieldName) {
    if (!sanitizeString(value)) {
      throw new Error(fieldName + ' is required');
    }
  }

  function isTempShikshaCode(code) {
    return /^temp_[A-Za-z0-9_-]+_\d+$/.test(sanitizeString(code));
  }

  function getSheetHeaders(sheetName) {
    var sheet = getSheet(sheetName);
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0] || [];
    return headers.map(function (h) {
      return sanitizeString(h);
    });
  }

  function readObjects(sheetName) {
    var sheet = getSheet(sheetName);
    var lastRow = sheet.getLastRow();
    var lastCol = sheet.getLastColumn();
    if (lastRow < 2 || lastCol < 1) return [];

    var headers = getSheetHeaders(sheetName);
    var rows = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();

    return rows.map(function (row, idx) {
      var obj = { __rowNum: idx + 2 };
      headers.forEach(function (h, colIdx) {
        var value = row[colIdx];
        var originalKey = h;
        var cleanHeader = sanitizeString(h);
        var lowerKey = cleanHeader.toLowerCase();
        var snakeKey = lowerKey.replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
        var camelSnakeKey = cleanHeader
          .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
          .replace(/[^A-Za-z0-9]+/g, '_')
          .toLowerCase()
          .replace(/^_+|_+$/g, '');

        obj[originalKey] = value;
        if (lowerKey && obj[lowerKey] === undefined) {
          obj[lowerKey] = value;
        }
        if (snakeKey && obj[snakeKey] === undefined) {
          obj[snakeKey] = value;
        }
        if (camelSnakeKey && obj[camelSnakeKey] === undefined) {
          obj[camelSnakeKey] = value;
        }
      });
      return obj;
    });
  }

  function resolveHeaderValue_(obj, header) {
    if (!obj) return undefined;
    if (obj[header] !== undefined) return obj[header];

    var cleanHeader = sanitizeString(header);
    var lowerKey = cleanHeader.toLowerCase();
    var snakeKey = lowerKey.replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    var camelSnakeKey = cleanHeader
      .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
      .replace(/[^A-Za-z0-9]+/g, '_')
      .toLowerCase()
      .replace(/^_+|_+$/g, '');

    if (obj[lowerKey] !== undefined) return obj[lowerKey];
    if (obj[snakeKey] !== undefined) return obj[snakeKey];
    if (obj[camelSnakeKey] !== undefined) return obj[camelSnakeKey];
    return undefined;
  }

  function appendObject(sheetName, obj) {
    var sheet = getSheet(sheetName);
    var headers = getSheetHeaders(sheetName);
    var row = headers.map(function (h) {
      var value = resolveHeaderValue_(obj, h);
      return value === undefined ? '' : value;
    });
    sheet.appendRow(row);
    return sheet.getLastRow();
  }

  function updateObjectAtRow(sheetName, rowNum, patch) {
    var sheet = getSheet(sheetName);
    var headers = getSheetHeaders(sheetName);
    var current = sheet.getRange(rowNum, 1, 1, headers.length).getValues()[0];
    var next = headers.map(function (h, idx) {
      var patchValue = resolveHeaderValue_(patch, h);
      return patchValue === undefined ? current[idx] : patchValue;
    });
    sheet.getRange(rowNum, 1, 1, headers.length).setValues([next]);
  }

  function createToken() {
    var raw = Utilities.getUuid() + ':' + new Date().getTime();
    return Utilities.base64EncodeWebSafe(raw).replace(/=+$/g, '');
  }

  function putCache(prefix, token, payload, ttlSec) {
    var cache = CacheService.getScriptCache();
    cache.put(prefix + token, JSON.stringify(payload), ttlSec);
  }

  function getCache(prefix, token) {
    var cache = CacheService.getScriptCache();
    var raw = cache.get(prefix + token);
    return raw ? JSON.parse(raw) : null;
  }

  function removeCache(prefix, token) {
    var cache = CacheService.getScriptCache();
    cache.remove(prefix + token);
  }

  function withLock(callback) {
    var lock = LockService.getScriptLock();
    lock.waitLock(30000);
    try {
      return callback();
    } finally {
      lock.releaseLock();
    }
  }

  function toMap(rows, keyField) {
    var map = {};
    rows.forEach(function (row) {
      map[sanitizeString(row[keyField])] = row;
    });
    return map;
  }

  function normBoolY(value) {
    var normalized = sanitizeString(value).toUpperCase();
    return normalized === 'Y' || normalized === '';
  }

  function incrCounter(counterMap, key) {
    var k = sanitizeString(key) || 'Unknown';
    counterMap[k] = (counterMap[k] || 0) + 1;
  }

  function writeLog(actor, actionType, targetEntity, targetKey, result, message, payload) {
    var actorId = actor && actor.id ? actor.id : 'system';
    var actorRole = actor && actor.role ? actor.role : 'system';
    appendObject(APP_CONFIG.SHEETS.LOGS, {
      timestamp: nowIso(),
      actor_id: actorId,
      actor_role: actorRole,
      action_type: actionType,
      target_entity: targetEntity,
      target_key: targetKey,
      result: result,
      message: message || '',
      payload_json: payload ? JSON.stringify(payload) : ''
    });
  }

  function publicError(error) {
    var msg = error && error.message ? error.message : 'Unexpected error';
    return { ok: false, error: msg };
  }

  function runApi(handler) {
    try {
      var data = handler();
      return { ok: true, data: data };
    } catch (error) {
      return publicError(error);
    }
  }

  return {
    nowIso: nowIso,
    getSpreadsheet: getSpreadsheet,
    getSheet: getSheet,
    sanitizeString: sanitizeString,
    required: required,
    isTempShikshaCode: isTempShikshaCode,
    getSheetHeaders: getSheetHeaders,
    readObjects: readObjects,
    appendObject: appendObject,
    updateObjectAtRow: updateObjectAtRow,
    createToken: createToken,
    putCache: putCache,
    getCache: getCache,
    removeCache: removeCache,
    withLock: withLock,
    toMap: toMap,
    normBoolY: normBoolY,
    incrCounter: incrCounter,
    writeLog: writeLog,
    runApi: runApi
  };
})();
