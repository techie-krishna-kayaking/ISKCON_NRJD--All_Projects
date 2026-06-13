function doGet(e) {

  const requestedLang = (e && e.parameter && e.parameter.lang) || "en";
  const lang = getAvailableLanguageOrDefault(requestedLang);

  const template = HtmlService.createTemplateFromFile('index');
  template.language = lang;
  template.scriptUrl = ScriptApp.getService().getUrl() || '';

  return template
    .evaluate()
    .setTitle('Puruṣottama Month')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function getScriptUrl() {
  return ScriptApp.getService().getUrl();
}

function getAvailableLanguageOrDefault(lang) {
  const normalizedLang = (lang || 'en').toLowerCase();
  const dataTemplateName = 'data_' + normalizedLang;

  if (hasHtmlFile(dataTemplateName)) {
    return normalizedLang;
  }

  return 'en';
}

function hasHtmlFile(filename) {
  try {
    HtmlService.createHtmlOutputFromFile(filename).getContent();
    return true;
  } catch (err) {
    return false;
  }
}