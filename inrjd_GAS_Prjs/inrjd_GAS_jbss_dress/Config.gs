/**
 * Config — PropertiesService setup & shared helpers.
 */

var DRESS_FOLDER_ID = '1-rOC-hRYOfiMmnmOR2QbRE9POvTQNnlM';

/**
 * Initialize all configuration. Safe to run multiple times — skips steps already done.
 */
function initConfig() {
  var props = PropertiesService.getScriptProperties();

  // Store dress folder ID
  if (!props.getProperty('DRESS_FOLDER_ID')) {
    props.setProperty('DRESS_FOLDER_ID', DRESS_FOLDER_ID);
  }

  if (!props.getProperty('ADMIN_PASSWORD_HASH')) {
    props.setProperty('ADMIN_PASSWORD_HASH', hashPassword('108'));
  }

  // Shared read-only view token (permanent)
  if (!props.getProperty('SHARED_VIEW_TOKEN')) {
    props.setProperty('SHARED_VIEW_TOKEN', Utilities.getUuid());
  }

  // Create the main Google Sheet (Calendar, Festivals, LordPhotosMap)
  if (!props.getProperty('SPREADSHEET_ID')) {
    var ss = SpreadsheetApp.create('JBSS Dress Calendar');
    props.setProperty('SPREADSHEET_ID', ss.getId());
    initSpreadsheet(ss);
    Logger.log('Created spreadsheet: ' + ss.getUrl());
  }

  // Create lord_photos subfolder inside the dress Drive folder
  if (!props.getProperty('LORD_PHOTOS_FOLDER_ID')) {
    var folderId = props.getProperty('DRESS_FOLDER_ID') || DRESS_FOLDER_ID;
    var dressFolder = DriveApp.getFolderById(folderId);
    var lordFolder;
    var existing = dressFolder.getFoldersByName('lord_photos');
    if (existing.hasNext()) {
      lordFolder = existing.next();
    } else {
      lordFolder = dressFolder.createFolder('lord_photos');
    }
    props.setProperty('LORD_PHOTOS_FOLDER_ID', lordFolder.getId());
    Logger.log('Lord photos folder: ' + lordFolder.getUrl());
  }
}

function initSpreadsheet(ss) {
  var calSheet = ss.getActiveSheet();
  calSheet.setName('Calendar');
  calSheet.getRange(1, 1, 1, 3).setValues([['date', 'dress_filename', 'drive_file_id']]);
  calSheet.setFrozenRows(1);

  var festSheet = ss.insertSheet('Festivals');
  festSheet.getRange(1, 1, 1, 4).setValues([['date', 'festival_name', 'type', 'dress_comment']]);
  festSheet.setFrozenRows(1);

  var lordSheet = ss.insertSheet('LordPhotosMap');
  lordSheet.getRange(1, 1, 1, 2).setValues([['dress_filename', 'photo_ids_json']]);
  lordSheet.setFrozenRows(1);
}

function getSpreadsheet() {
  var ssId = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (!ssId) throw new Error('Spreadsheet not initialized — run setup() from the editor first.');
  return SpreadsheetApp.openById(ssId);
}
