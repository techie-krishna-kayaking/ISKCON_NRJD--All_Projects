function doGet(e) {
  const page = ((e && e.parameter && e.parameter.page) || 'home').toLowerCase();

  if (page === 'morning') {
    return renderMorningPage();
  }

  if (page === 'purushotam') {
    const requestedLang = (e && e.parameter && e.parameter.lang) || 'en';
    const lang = getAvailableLanguageOrDefault(requestedLang);
    return renderPurushotamPage(lang);
  }

  return renderHomePage();
}

function renderHomePage() {
  const template = HtmlService.createTemplateFromFile('home');
  template.morningUrl = buildAppUrl({ page: 'morning' });
  template.purushotamUrl = buildAppUrl({ page: 'purushotam' });

  return template
    .evaluate()
    .setTitle('ISKCON NRJD Prayer Apps')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function renderMorningPage() {
  const template = HtmlService.createTemplateFromFile('index_morning');
  template.homeUrl = buildAppUrl({ page: 'home' });

  return template
    .evaluate()
    .setTitle('Morning Prayers - ISKCON NRJD')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function renderPurushotamPage(lang) {
  const template = HtmlService.createTemplateFromFile('index_purushotam');
  template.language = lang;
  template.homeUrl = buildAppUrl({ page: 'home' });
  template.scriptUrl = buildAppUrl({ page: 'purushotam' });

  return template
    .evaluate()
    .setTitle('Purushotam Month')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function buildAppUrl(params) {
  const base = ScriptApp.getService().getUrl() || '';
  if (!base) {
    return '';
  }

  const query = Object.keys(params)
    .map(function (key) {
      return encodeURIComponent(key) + '=' + encodeURIComponent(params[key]);
    })
    .join('&');

  return query ? base + '?' + query : base;
}

function getAvailableLanguageOrDefault(lang) {
  const normalizedLang = (lang || 'en').toLowerCase();
  const dataTemplateName = 'data_purushotam_' + normalizedLang;

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
