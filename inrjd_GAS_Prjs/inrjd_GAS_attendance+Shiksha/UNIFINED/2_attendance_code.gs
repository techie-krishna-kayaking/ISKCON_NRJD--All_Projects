/***** ADD YOUR SPREADSHEET ID HERE *****/
const SS_ID = "1WVeDZ9cofYHn51Q-0mbKzliDlrMQaNMLq-PHQhkkm9E"; //Spreadsheet ID

/****************************************/

function doGet() {
  return HtmlService.createHtmlOutputFromFile('index').setTitle('Login');
}

// Function to check user credentials
function checkCredentials(id, pass) {
  var sheet = SpreadsheetApp.openById(SS_ID).getSheetByName('cred');
  var data = sheet.getRange('A2:B' + sheet.getLastRow()).getValues();
  
  for (var i = 0; i < data.length; i++) {
    if (data[i][0] === id) {
      if (data[i][1] === pass) {
        return 'success';
      } else {
        return 'Incorrect password';
      }
    }
  }
  return 'User not found';
}

// Function to fetch programs related to the logged-in user
function getPrograms(id) {
  var sheet = SpreadsheetApp.openById(SS_ID).getSheetByName('tab1');
  Logger.log('Sheet Retrieved: ' + sheet.getName());

  var data = sheet.getDataRange().getValues();
  Logger.log('Fetched Data: ' + JSON.stringify(data));

  var programs = [];

  for (var i = 1; i < data.length; i++) {
    Logger.log('Processing row: ' + JSON.stringify(data[i]));
    if (data[i][6] === id) {
      var programStartDate = data[i][8] ? new Date(data[i][8]).toLocaleDateString() : 'N/A';
      programs.push({
        programKey: data[i][0],
        area: data[i][1],
        subArea: data[i][2],
        owner: data[i][6],
        frequency: data[i][3],
        typeOfProgram: data[i][4],
        language: data[i][5],
        virtual: data[i][7],
        programStartDate: programStartDate,
        day: data[i][9],
        time: data[i][10],
        actFlag: data[i][11],
        promoted: data[i][12],
      });
    }
  }

  Logger.log('Programs: ' + JSON.stringify(programs));
  return programs;
}

// Function to fetch attendees for a selected program
function getAttendees(programKey) {
  var sheet = SpreadsheetApp.openById(SS_ID).getSheetByName('tab2');
  var data = sheet.getDataRange().getValues();
  var attendees = [];

  var programIndex = data[0].indexOf(programKey);
  if (programIndex > -1) {
    for (var i = 1; i < data.length; i++) {
      if (data[i][programIndex]) {
        attendees.push(data[i][programIndex]);
      }
    }
  }
  Logger.log(attendees);
  return attendees;
}

function updateTab4Summary(programKey) {

  var ss = SpreadsheetApp.openById(SS_ID);
  var tab3 = ss.getSheetByName('tab3');
  var tab4 = ss.getSheetByName('tab4');

  var data = tab3.getDataRange().getValues();
  if (data.length <= 1) return;

  var programData = data.filter(function(row, index) {
    return index > 0 && row[0] === programKey;
  });

  if (programData.length === 0) return;

  var sessionDates = {};
  programData.forEach(function(row) {
    sessionDates[row[row.length - 2]] = true;
  });

  var totalSessions = Object.keys(sessionDates).length;

  var devoteeMap = {};

  programData.forEach(function(row) {
    var devotee = row[row.length - 3];
    var status = row[row.length - 1];

    if (!devoteeMap[devotee]) {
      devoteeMap[devotee] = 0;
    }

    if (status === 'present') {
      devoteeMap[devotee]++;
    }
  });

  var tab4Data = tab4.getDataRange().getValues();

  for (var i = tab4Data.length - 1; i > 0; i--) {
    if (tab4Data[i][0] === programKey) {
      tab4.deleteRow(i + 1);
    }
  }

  var tab1 = ss.getSheetByName('tab1');
  var tab1Data = tab1.getDataRange().getValues();
  var programDetails;

  for (var i = 1; i < tab1Data.length; i++) {
    if (tab1Data[i][0] === programKey) {
      programDetails = tab1Data[i];
      break;
    }
  }

  if (!programDetails) return;

  for (var devotee in devoteeMap) {

    var attended = devoteeMap[devotee];
    var percentage = totalSessions === 0 ? 0 :
      Math.round((attended / totalSessions) * 100);

    var rowData = [
      programKey,
      programDetails[1],
      programDetails[2],
      programDetails[3],
      programDetails[4],
      programDetails[5],
      programDetails[6],
      devotee,
      totalSessions,
      attended,
      percentage + '%'
    ];

    tab4.appendRow(rowData);
  }
}

// Function to record attendance in tab3
function recordAttendance(programKey, attendees, attendanceStatus, date, hostName, selectedDropdownValue) {
  var sheet = SpreadsheetApp.openById(SS_ID).getSheetByName('tab3');
  var lastRow = sheet.getLastRow() + 1;

  var tab1Sheet = SpreadsheetApp.openById(SS_ID).getSheetByName('tab1');
  var tab1Data = tab1Sheet.getDataRange().getValues();
  var programDetails;

  for (var i = 1; i < tab1Data.length; i++) {
    if (tab1Data[i][0] === programKey) {
      programDetails = tab1Data[i];
      break;
    }
  }

  if (programDetails) {
    for (var j = 0; j < attendees.length; j++) {
      var rowData = programDetails.slice(0, 13).concat([selectedDropdownValue, hostName, attendees[j], date, attendanceStatus[j]]);
      sheet.getRange(lastRow++, 1, 1, rowData.length).setValues([rowData]);
    }
  }
  updateTab4Summary(programKey);
}

// Function to add a new devotee to a selected program
function addDevotee(programKey, devoteeName) {
  var sheet = SpreadsheetApp.openById(SS_ID).getSheetByName('tab2');
  var data = sheet.getDataRange().getValues();
  var programIndex = data[0].indexOf(programKey);

  if (programIndex > -1) {
    for (var i = 1; i < data.length; i++) {
      if (!data[i][programIndex]) {
        sheet.getRange(i + 1, programIndex + 1).setValue(devoteeName);
        return devoteeName;
      }
    }
    sheet.appendRow(new Array(programIndex).concat([devoteeName]));
    return devoteeName;
  }
  return null;
}

// Function to fetch attendees and program type for a selected program
function getAttendeesAndProgramType(programKey) {
  var sheetTab1 = SpreadsheetApp.openById(SS_ID).getSheetByName('tab1');
  var dataTab1 = sheetTab1.getDataRange().getValues();

  var programType;
  for (var i = 1; i < dataTab1.length; i++) {
    if (dataTab1[i][0] === programKey) {
      programType = dataTab1[i][4];
      break;
    }
  }

  var sheetTab2 = SpreadsheetApp.openById(SS_ID).getSheetByName('tab2');
  var dataTab2 = sheetTab2.getDataRange().getValues();
  var attendees = [];

  var programIndex = dataTab2[0].indexOf(programKey);
  if (programIndex > -1) {
    for (var i = 1; i < dataTab2.length; i++) {
      if (dataTab2[i][programIndex]) {
        attendees.push(dataTab2[i][programIndex]);
      }
    }
  }

  return {
    attendees: attendees,
    programType: programType
  };
}