// ===== File: WebApp.gs =====
// Responsibility: Web app entry points (doGet) for serving HTML pages.
//                 Routes requests based on a 'page' query parameter.
//
// Usage:
//   Deploy as web app. Access URLs:
//     ?page=program    → New Program form
//     ?page=attendance → Attendance portal (login + record)
//     ?page=shiksha    → Shiksha / Bio-data forms
//     ?page=admin      → Super Admin dashboard
//     (default)        → Attendance portal

/**
 * Web app entry point. Routes to the correct HTML page based on ?page= parameter.
 * @param {Object} e - Event object with queryString and parameters.
 * @return {GoogleAppsScript.HTML.HtmlOutput}
 */
function doGet(e) {
  var page = (e && e.parameter && e.parameter.page) ? e.parameter.page.toLowerCase() : 'attendance';

  var fileName;
  var title;

  switch (page) {
    case 'program':
      fileName = 'NewProgramPage';
      title = 'INRJD New Program Form';
      break;
    case 'shiksha':
      fileName = 'ShikshaPage';
      title = 'ISKCON NRJD — Shiksha Portal';
      break;
    case 'admin':
      fileName = 'SuperAdminPage';
      title = 'INRJD — Super Admin Portal';
      break;
    case 'attendance':
    default:
      fileName = 'AttendancePage';
      title = 'INRJD — Attendance Portal';
      break;
  }

  var template = HtmlService.createTemplateFromFile(fileName);
  template.urlParams = e && e.parameter ? e.parameter : {};

  return template.evaluate()
    .setTitle(title)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/**
 * Returns the deployed web app URL.
 * Used by frontend to construct links to other pages (e.g., Certify → Shiksha).
 * @return {string}
 */
function getWebAppUrl() {
  return ScriptApp.getService().getUrl();
}
