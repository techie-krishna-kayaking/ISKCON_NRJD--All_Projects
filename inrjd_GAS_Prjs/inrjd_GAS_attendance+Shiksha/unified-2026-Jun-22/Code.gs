/**
 * Web app entry and client-callable API wrappers.
 */
function ensureAppConfig_() {
  var cfg = (typeof APP_CONFIG !== 'undefined' && APP_CONFIG) ? APP_CONFIG : null;
  if (cfg && cfg.SHEETS) {
    return cfg;
  }

  var props = PropertiesService.getScriptProperties();
  var configuredSpreadsheetId = props.getProperty('SPREADSHEET_ID');

  cfg = {
    SPREADSHEET_ID: configuredSpreadsheetId || '1ptCjbfwu_rrtwMKf4sE3QIVc8Z-Og47BmQ9_KJcGRaY',
    SHEETS: {
      CONFIG: 'Config',
      CRED: 'cred',
      TAB1: 'tab1',
      TAB2: 'tab2',
      TAB3: 'tab3',
      LOGS: 'Logs'
    },
    CACHE: {
      SESSION_PREFIX: 'sess_',
      PREFILL_PREFIX: 'prefill_',
      SESSION_TTL_SEC: 6 * 60 * 60,
      PREFILL_TTL_SEC: 10 * 60
    },
    ROLES: {
      OWNER: 'owner',
      ADMIN: 'admin'
    }
  };

  if (typeof APP_CONFIG !== 'undefined') {
    APP_CONFIG = cfg;
  }
  if (typeof globalThis !== 'undefined') {
    globalThis.APP_CONFIG = cfg;
  }

  return cfg;
}

function runApi_(handler) {
  ensureAppConfig_();
  return Utils.runApi(handler);
}

function doGet() {
  ensureAppConfig_();
  return HtmlService.createTemplateFromFile('App')
    .evaluate()
    .setTitle('Temple Program and Shiksha Management')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function apiLogin(userId, password) {
  return runApi_(function () {
    return AuthService.login(userId, password);
  });
}

function apiLogout(sessionToken) {
  return runApi_(function () {
    return AuthService.logout(sessionToken);
  });
}

function apiGetBootstrap(sessionToken) {
  return runApi_(function () {
    var session = AuthService.requireSession(sessionToken);
    return {
      user: session
    };
  });
}

function apiGetOwnerDashboard(sessionToken) {
  return runApi_(function () {
    return ProgramService.getOwnerDashboard(sessionToken);
  });
}

function apiGetAttendanceMembers(sessionToken, programKey) {
  return runApi_(function () {
    return AttendanceService.getAttendanceMembers(sessionToken, programKey);
  });
}

function apiUpdateAttendance(sessionToken, programKey, updates) {
  return runApi_(function () {
    return AttendanceService.updateAttendance(sessionToken, programKey, updates);
  });
}

function apiGetCertifyRoute(sessionToken, programKey, devoteeName) {
  return runApi_(function () {
    return AttendanceService.getCertifyRoute(sessionToken, programKey, devoteeName);
  });
}

function apiGetPrefillData(sessionToken, prefillToken, fallbackPayload) {
  return runApi_(function () {
    return AttendanceService.getPrefillData(sessionToken, prefillToken, fallbackPayload);
  });
}

function apiSubmitBiodata(sessionToken, payload) {
  return runApi_(function () {
    return DevoteeService.submitBiodata(sessionToken, payload);
  });
}

function apiSubmitShiksha(sessionToken, payload) {
  return runApi_(function () {
    return DevoteeService.submitShiksha(sessionToken, payload);
  });
}

function apiGetAdminDashboard(sessionToken, filters) {
  return runApi_(function () {
    return AdminService.getAdminDashboard(sessionToken, filters);
  });
}

function apiCreateProgram(sessionToken, payload) {
  return runApi_(function () {
    return ProgramService.createProgramWithMembers(sessionToken, payload);
  });
}

function apiGetProgramFormConfig(sessionToken) {
  return runApi_(function () {
    return ProgramService.getProgramFormConfig(sessionToken);
  });
}

function apiGetProgramEditData(sessionToken, programKey) {
  return runApi_(function () {
    return ProgramService.getProgramEditData(sessionToken, programKey);
  });
}

function apiUpdateProgram(sessionToken, payload) {
  return runApi_(function () {
    return ProgramService.updateProgram(sessionToken, payload);
  });
}

function apiUpdateProgramMember(sessionToken, payload) {
  return runApi_(function () {
    return ProgramService.updateProgramMember(sessionToken, payload);
  });
}

function apiDeleteProgramMember(sessionToken, programKey, rowNum) {
  return runApi_(function () {
    return ProgramService.deleteProgramMember(sessionToken, programKey, rowNum);
  });
}

function apiSetupHeaders() {
  return runApi_(function () {
    return SetupScripts.setupHeaders();
  });
}

function apiSeedDemoData() {
  return runApi_(function () {
    return SetupScripts.seedDemoData();
  });
}
