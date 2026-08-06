/**
 * JBSS Dress Search — Google Apps Script Version
 * Serves the web app HTML page.
 */

function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('JBSS Dress Search')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// ─────────────────────────────────────────────────────────────────
// ONE-TIME SETUP — run this ONCE from the Apps Script editor
// before deploying the web app for the first time.
// ─────────────────────────────────────────────────────────────────
function setup() {
  initConfig();
  var props = PropertiesService.getScriptProperties();
  Logger.log('=== JBSS Dress Setup Complete ===');
  Logger.log('Admin password          : 108');
  Logger.log('Shared view token      : ' + props.getProperty('SHARED_VIEW_TOKEN'));
  Logger.log('Spreadsheet ID         : ' + props.getProperty('SPREADSHEET_ID'));
  Logger.log('Lord Photos Folder ID  : ' + props.getProperty('LORD_PHOTOS_FOLDER_ID'));
  Logger.log('=================================');
  Logger.log('Next steps:');
  Logger.log('1. Run importDefaultFestivals() to load the 2026 festival calendar.');
  Logger.log('2. Deploy → New deployment → Web app.');
  Logger.log('3. Open the web app URL and login with admin / admin123.');
}

/** * Force-reset the admin password to 108. Run this once from the editor if login fails.
 */
function resetAdminPassword() {
  PropertiesService.getScriptProperties()
    .setProperty('ADMIN_PASSWORD_HASH', hashPassword('108'));
  Logger.log('Admin password reset to: 108');
}

/** * Run once after setup() to pre-load the 2026 Hindu festival calendar.
 */
function importDefaultFestivals() {
  var rows = [
    ['2026-01-13','Lohri','festival',''],
    ['2026-01-14','Makar Sankranti / Pongal','festival',''],
    ['2026-01-14','Purnima','purnima',''],
    ['2026-01-29','Amavasya','amavasya',''],
    ['2026-02-12','Purnima','purnima',''],
    ['2026-02-27','Amavasya','amavasya',''],
    ['2026-03-03','Maha Shivaratri','festival',''],
    ['2026-03-14','Holi','festival','colorful dress'],
    ['2026-03-14','Purnima','purnima',''],
    ['2026-03-29','Amavasya','amavasya',''],
    ['2026-03-30','Ugadi / Gudi Padwa','festival',''],
    ['2026-04-02','Ram Navami','festival',''],
    ['2026-04-12','Purnima','purnima',''],
    ['2026-04-27','Amavasya','amavasya',''],
    ['2026-05-12','Purnima','purnima',''],
    ['2026-05-12','Buddha Purnima','festival',''],
    ['2026-05-27','Amavasya','amavasya',''],
    ['2026-06-10','Purnima','purnima',''],
    ['2026-06-25','Amavasya','amavasya',''],
    ['2026-07-07','Rath Yatra','festival',''],
    ['2026-07-10','Guru Purnima','purnima',''],
    ['2026-07-25','Amavasya','amavasya',''],
    ['2026-08-08','Raksha Bandhan','festival',''],
    ['2026-08-08','Purnima','purnima',''],
    ['2026-08-14','Janmashtami','festival',''],
    ['2026-08-23','Amavasya','amavasya',''],
    ['2026-09-07','Purnima','purnima',''],
    ['2026-09-22','Amavasya','amavasya',''],
    ['2026-10-02','Navratri Begins','festival',''],
    ['2026-10-06','Purnima','purnima',''],
    ['2026-10-12','Dussehra','festival',''],
    ['2026-10-21','Diwali','festival',''],
    ['2026-10-21','Amavasya','amavasya',''],
    ['2026-11-05','Purnima','purnima',''],
    ['2026-11-20','Amavasya','amavasya',''],
    ['2026-12-04','Purnima','purnima',''],
    ['2026-12-20','Amavasya','amavasya',''],
    ['2026-12-25','Christmas','festival','']
  ];
  writeFestivalsToSheet(rows);
  Logger.log('Imported ' + rows.length + ' festival entries.');
}
