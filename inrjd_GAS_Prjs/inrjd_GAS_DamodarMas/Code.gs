/*
function doGet() {
  return HtmlService.createHtmlOutputFromFile('formstopped.html');
}



// FORM STOPPED
function doGet() {
  return HtmlService.createHtmlOutputFromFile('formstopped.html');
}

-----------------------
*/
// FORM SUBMISSION
function doGet() {
  return HtmlService.createHtmlOutputFromFile('form.html');
}

function submitData(formData) {
  const sheet = SpreadsheetApp.openById('10W0a-IZPOT-UZxdm-xDf8O708kut34-z8ZDXmFeiVZw').getActiveSheet();
  sheet.appendRow([
    new Date(formData.date),
    formData.area,
    formData.subArea,
    formData.time,
    formData.host,
    formData.conductedBy,
    formData.typeOfProgram,
    Number(formData.peopleCount),
    Number(formData.lampCount),
    new Date(),
  ]);
}
