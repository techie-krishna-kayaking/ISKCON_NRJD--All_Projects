// ==================== CODE.GS ====================
// Main script file for Google Apps Script

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Form')
    .setTitle('Spiritual Picnic Registration')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function submitForm(formData) {
  try {
    var ss = SpreadsheetApp.openById("1f_MtzZ8zXS9gMS4tKJWch5EKlUDI3x7Kfxno-HipNtk");
    var sheet = ss.getSheetByName('2026-Jul-MaduraiRY');
    
    if (!sheet) {
      throw new Error('Sheet "2026-Jul-MaduraiRY" not found. Please create a sheet named "All"');
    }
    
    // Get timestamp
    var timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
    
    // Prepare row data matching YOUR column order:
    // Name, Email, WAPhno, Gender, AgeGroup, Address, ArePINCode, LocalCoordinator, 
    // EmergencyNo, ParentsNo, Concent, Policy, timestamp, device, browser, Ipadd
    var rowData = [
      formData.name || '',
      formData.email || '',
      formData.waphno || '',
      formData.gender || '',
      formData.age || '',
      formData.address || '',
      formData.pincode || '',
      formData.coordinator || '',
      formData.emergencyno || '',
      formData.policy ? 'Yes' : 'No',
      timestamp,
      formData.device || '',
      formData.browser || '',
      formData.ipadd || ''
    ];
    
    // Append the row
    sheet.appendRow(rowData);
    
    // Log for debugging
    Logger.log('Form submitted successfully');
    Logger.log('Data: ' + JSON.stringify(rowData));
    
    return {
      success: true,
      message: 'Registration submitted successfully!'
    };
    
  } catch (error) {
    Logger.log('Error in submitForm: ' + error.toString());
    return {
      success: false,
      message: 'Error: ' + error.toString()
    };
  }
}

// Test function to verify setup
function testSetup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Boys');
  
  if (!sheet) {
    Logger.log('ERROR: Sheet "All" not found!');
    return false;
  }
  
  Logger.log('Sheet "Boys" found successfully');
  Logger.log('Sheet has ' + sheet.getLastRow() + ' rows');
  return true;
}