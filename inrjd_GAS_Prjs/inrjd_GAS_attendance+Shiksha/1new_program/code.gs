const SS_ID = "1WVeDZ9cofYHn51Q-0mbKzliDlrMQaNMLq-PHQhkkm9E"; //Spreadsheet ID

function openSidebar() {
  const html = HtmlService.createHtmlOutputFromFile('Page')
    .setTitle('Program Details')
    .setWidth(400);
  SpreadsheetApp.getUi().showSidebar(html);
}

function submitForm(formData) {
  const ss = SpreadsheetApp.openById(SS_ID);

  // MAIN PROGRAM SHEET
  const sheet1 = ss.getSheetByName("tab1");
  const programOwner = formData.programOwner;
  const key = generateKey(programOwner, sheet1);

  sheet1.appendRow([
    key,
    formData.area,
    formData.subArea,
    formData.frequency,
    formData.typeOfProgram,
    formData.language,
    formData.programOwner,
    formData.virtual === 'Yes' ? 'Yes' : 'No',
    formData.programStartDate,
    formData.day,
    formData.time,
    "YES"                                      // ACT_FLG
  ]);

  // NOW HANDLE DEVOTEES IN SHEET2
  saveDevoteesToSheet2(ss, key, formData.devotees);

  return "Form submitted successfully!\nContact DB Admin for any changes";
}

function saveDevoteesToSheet2(ss, key, devotees) {
  const sheet2 = ss.getSheetByName("tab2");

  // 1. Find the next empty column
  const lastCol = sheet2.getLastColumn();
  const newCol = lastCol + 1;

  // 2. Write program key in row 1
  sheet2.getRange(1, newCol).setValue(key);

  // 3. Process devotees list
  if (devotees && devotees.trim() !== "") {
    const devList = devotees.split(",").map(name => name.trim()).filter(n => n !== "");

    // 4. Write each devotee starting from row 2
    for (let i = 0; i < devList.length; i++) {
      sheet2.getRange(i + 2, newCol).setValue(devList[i]);
    }
  }
}



function generateKey(programOwner, sheet) {
  const keys = sheet.getRange("A:A").getValues();
  let count = 1;

  keys.forEach(key => {
    const val = key[0];
    if (val && val.startsWith(programOwner)) {
      const numStr = val.replace(programOwner, "");  // remove prefix
      const num = parseInt(numStr);

      if (!isNaN(num) && num >= count) {
        count = num + 1;
      }
    }
  });

  const countString = count.toString().padStart(3, '0');
  return programOwner + countString;  // no underscore
}


function getConfigValues() {
  const ss = SpreadsheetApp.openById(SS_ID);
  const configSheet = ss.getSheetByName("Config");

  const data = configSheet.getDataRange().getValues();
  const headers = data.shift();

  let config = {};

  headers.forEach((header, index) => {
    config[header] = data
      .map(row => row[index])
      .filter(v => v && v.toString().trim() !== "");
  });

  return config;
}

function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('Page')
    .setTitle('Program Details')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

