/**
 * LordPhotos — upload / list / delete photos of the Lord wearing a particular dress.
 * Photos are stored in a "lord_photos" subfolder inside the dress Drive folder.
 * The mapping (dress_filename → [file_ids]) is tracked in the LordPhotosMap Sheet.
 */

/**
 * Get all lord photos for a dress filename.
 */
function getLordPhotos(dressFilename) {
  var ss        = getSpreadsheet();
  var lordSheet = ss.getSheetByName('LordPhotosMap');
  var photos    = [];

  if (lordSheet.getLastRow() > 1) {
    var data = lordSheet.getRange(2, 1, lordSheet.getLastRow() - 1, 2).getValues();
    for (var i = 0; i < data.length; i++) {
      if (String(data[i][0]) === dressFilename) {
        var ids = [];
        try { ids = JSON.parse(String(data[i][1]) || '[]'); } catch(e) {}
        photos = ids.map(function(id) {
          return {
            fileId:   id,
            filename: id,
            url: 'https://drive.google.com/thumbnail?id=' + id + '&sz=w600'
          };
        });
        break;
      }
    }
  }

  return { dress: dressFilename, photos: photos };
}

/**
 * Upload a lord photo (base64-encoded) and link it to a dress.
 * The client must compress the image client-side before sending (max ~2 MB).
 */
function uploadLordPhoto(adminToken, dressFilename, fileBase64, fileName, mimeType) {
  if (!isAdminToken(adminToken)) return { error: 'Unauthorized' };

  var props = PropertiesService.getScriptProperties();
  var lordFolderId = props.getProperty('LORD_PHOTOS_FOLDER_ID');
  if (!lordFolderId) return { error: 'Lord photos folder not found — run setup() first.' };

  // Decode base64 and create Drive file
  var safeName = dressFilename.replace(/\.[^/.]+$/, '') + '_' + fileName;
  var blob     = Utilities.newBlob(Utilities.base64Decode(fileBase64), mimeType || 'image/jpeg', safeName);
  var folder   = DriveApp.getFolderById(lordFolderId);
  var file     = folder.createFile(blob);
  var fileId   = file.getId();

  // Update the LordPhotosMap Sheet
  var ss        = getSpreadsheet();
  var lordSheet = ss.getSheetByName('LordPhotosMap');

  if (lordSheet.getLastRow() > 1) {
    var data = lordSheet.getRange(2, 1, lordSheet.getLastRow() - 1, 2).getValues();
    for (var i = 0; i < data.length; i++) {
      if (String(data[i][0]) === dressFilename) {
        var ids = [];
        try { ids = JSON.parse(String(data[i][1]) || '[]'); } catch(e) {}
        if (ids.indexOf(fileId) < 0) ids.push(fileId);
        lordSheet.getRange(i + 2, 2).setValue(JSON.stringify(ids));
        return { success: true, fileId: fileId };
      }
    }
  }

  lordSheet.appendRow([dressFilename, JSON.stringify([fileId])]);
  return { success: true, fileId: fileId };
}

/**
 * Delete a lord photo by Drive file ID.
 */
function deleteLordPhoto(adminToken, dressFilename, photoId) {
  if (!isAdminToken(adminToken)) return { error: 'Unauthorized' };

  try { DriveApp.getFileById(photoId).setTrashed(true); } catch(e) {}

  var ss        = getSpreadsheet();
  var lordSheet = ss.getSheetByName('LordPhotosMap');

  if (lordSheet.getLastRow() > 1) {
    var data = lordSheet.getRange(2, 1, lordSheet.getLastRow() - 1, 2).getValues();
    for (var i = 0; i < data.length; i++) {
      if (String(data[i][0]) === dressFilename) {
        var ids = [];
        try { ids = JSON.parse(String(data[i][1]) || '[]'); } catch(e) {}
        ids = ids.filter(function(id) { return id !== photoId; });
        lordSheet.getRange(i + 2, 2).setValue(JSON.stringify(ids));
        break;
      }
    }
  }

  return { success: true };
}
