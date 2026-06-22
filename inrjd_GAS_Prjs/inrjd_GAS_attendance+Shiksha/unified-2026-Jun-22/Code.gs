/**
 * Web app entry and client-callable API wrappers.
 */
function doGet() {
  return HtmlService.createTemplateFromFile('App')
    .evaluate()
    .setTitle('Temple Program and Shiksha Management')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function apiLogin(userId, password) {
  return Utils.runApi(function () {
    return AuthService.login(userId, password);
  });
}

function apiLogout(sessionToken) {
  return Utils.runApi(function () {
    return AuthService.logout(sessionToken);
  });
}

function apiGetBootstrap(sessionToken) {
  return Utils.runApi(function () {
    var session = AuthService.requireSession(sessionToken);
    return {
      user: session
    };
  });
}

function apiGetOwnerDashboard(sessionToken) {
  return Utils.runApi(function () {
    return ProgramService.getOwnerDashboard(sessionToken);
  });
}

function apiGetAttendanceMembers(sessionToken, programKey) {
  return Utils.runApi(function () {
    return AttendanceService.getAttendanceMembers(sessionToken, programKey);
  });
}

function apiUpdateAttendance(sessionToken, programKey, updates) {
  return Utils.runApi(function () {
    return AttendanceService.updateAttendance(sessionToken, programKey, updates);
  });
}

function apiGetCertifyRoute(sessionToken, programKey, devoteeName) {
  return Utils.runApi(function () {
    return AttendanceService.getCertifyRoute(sessionToken, programKey, devoteeName);
  });
}

function apiGetPrefillData(sessionToken, prefillToken, fallbackPayload) {
  return Utils.runApi(function () {
    return AttendanceService.getPrefillData(sessionToken, prefillToken, fallbackPayload);
  });
}

function apiSubmitBiodata(sessionToken, payload) {
  return Utils.runApi(function () {
    return DevoteeService.submitBiodata(sessionToken, payload);
  });
}

function apiSubmitShiksha(sessionToken, payload) {
  return Utils.runApi(function () {
    return DevoteeService.submitShiksha(sessionToken, payload);
  });
}

function apiGetAdminDashboard(sessionToken, filters) {
  return Utils.runApi(function () {
    return AdminService.getAdminDashboard(sessionToken, filters);
  });
}

function apiCreateProgram(sessionToken, payload) {
  return Utils.runApi(function () {
    return ProgramService.createProgramWithMembers(sessionToken, payload);
  });
}

function apiGetProgramFormConfig(sessionToken) {
  return Utils.runApi(function () {
    return ProgramService.getProgramFormConfig(sessionToken);
  });
}

function apiSetupHeaders() {
  return Utils.runApi(function () {
    return SetupScripts.setupHeaders();
  });
}

function apiSeedDemoData() {
  return Utils.runApi(function () {
    return SetupScripts.seedDemoData();
  });
}
