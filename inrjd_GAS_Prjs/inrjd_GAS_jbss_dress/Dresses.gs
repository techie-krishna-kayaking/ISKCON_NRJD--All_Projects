/**
 * Dresses — list and search dress images stored in the Google Drive folder.
 * Results are cached for 1 hour via CacheService to avoid slow Drive API calls.
 */

var DRESS_CACHE_KEY = 'jbss_dress_list_v1';
var DRESS_CACHE_TTL = 3600; // seconds

/**
 * List all dress images from the Drive folder, with 1-hour caching.
 * Returns { dresses: [{filename, fileId, thumbnailUrl, fullUrl, url}] }
 */
function listDresses() {
  var cache = CacheService.getScriptCache();
  var cached = cache.get(DRESS_CACHE_KEY);
  if (cached) {
    try { return JSON.parse(cached); } catch(e) {}
  }

  var result = _fetchDressesFromDrive();
  if (!result.error) {
    try { cache.put(DRESS_CACHE_KEY, JSON.stringify(result), DRESS_CACHE_TTL); } catch(e) {}
  }
  return result;
}

function _fetchDressesFromDrive() {
  var props    = PropertiesService.getScriptProperties();
  var folderId = props.getProperty('DRESS_FOLDER_ID') || DRESS_FOLDER_ID;

  try {
    var folder = DriveApp.getFolderById(folderId);
    var files  = folder.getFiles();
    var dresses = [];

    while (files.hasNext()) {
      var file = files.next();
      if (!file.getMimeType().startsWith('image/')) continue;
      var fileId = file.getId();
      var thumb  = 'https://drive.google.com/thumbnail?id=' + fileId + '&sz=w300';
      var full   = 'https://drive.google.com/thumbnail?id=' + fileId + '&sz=w1200';
      dresses.push({
        filename:     file.getName(),
        fileId:       fileId,
        thumbnailUrl: thumb,
        fullUrl:      full,
        url:          thumb   // alias used by admin palette
      });
    }

    dresses.sort(function(a, b) { return a.filename.localeCompare(b.filename); });
    return { dresses: dresses };
  } catch(e) {
    return { error: 'Cannot access dress folder: ' + e.message };
  }
}

/**
 * Keyword search against dress filenames.
 * Returns matched dresses sorted by relevance score, or all dresses if no query.
 */
function searchDresses(query) {
  var result = listDresses();
  if (result.error) return result;

  var q = (query || '').trim().toLowerCase();
  if (!q) return result;

  var qWords = q.replace(/[-_+.]/g, ' ').split(/\s+/).filter(function(w) { return w.length > 1; });

  var scored = result.dresses.map(function(d) {
    var name  = d.filename.replace(/\.[^/.]+$/, '').toLowerCase().replace(/[-_+.]/g, ' ');
    var score = 0;
    if (name.indexOf(q) >= 0) score += 10;
    qWords.forEach(function(w) {
      if (name.indexOf(w) >= 0) score += 3;
    });
    name.split(/\s+/).forEach(function(nw) {
      qWords.forEach(function(qw) {
        if (nw.indexOf(qw) >= 0 || qw.indexOf(nw) >= 0) score += 1;
      });
    });
    return Object.assign({}, d, { score: score });
  });

  var filtered = scored.filter(function(d) { return d.score > 0; });
  filtered.sort(function(a, b) { return b.score - a.score; });

  return { dresses: filtered.length > 0 ? filtered : result.dresses, query: query };
}

/**
 * Invalidate the dress list cache. Call after uploading new dresses to Drive.
 */
function invalidateDressCache(adminToken) {
  if (!isAdminToken(adminToken)) return { error: 'Unauthorized' };
  CacheService.getScriptCache().remove(DRESS_CACHE_KEY);
  return { success: true };
}
