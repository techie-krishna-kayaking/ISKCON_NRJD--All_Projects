function doGet(e) {
  const template = HtmlService.createTemplateFromFile('index');
  template.scriptUrl = ScriptApp.getService().getUrl() || '';

  return template
    .evaluate()
    .setTitle('Morning Prayers - ISKCON NRJD')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}
