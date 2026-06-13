// ===== File: Menu.gs =====
// Responsibility: Custom menu creation on file open, and top-level
//                 entry-point functions for menu items.

/**
 * Runs automatically when the spreadsheet is opened.
 * Creates the "NRJD Attendance" custom menu.
 */
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('NRJD Attendance')
    .addItem('Export Per-Devotee Summary', 'nrjdExportPerDevoteeSummary')
    .addSeparator()
    .addItem('Open New Program Form', 'nrjdOpenNewProgramSidebar')
    .addToUi();
}

/**
 * Menu handler: Export per-devotee summary.
 */
function nrjdExportPerDevoteeSummary() {
  exportPerDevoteeSummary();
}

/**
 * Menu handler: Opens the New Program sidebar inside the spreadsheet.
 */
function nrjdOpenNewProgramSidebar() {
  var html = HtmlService.createHtmlOutputFromFile('NewProgramPage')
    .setTitle('New Program Form')
    .setWidth(400);
  SpreadsheetApp.getUi().showSidebar(html);
}
