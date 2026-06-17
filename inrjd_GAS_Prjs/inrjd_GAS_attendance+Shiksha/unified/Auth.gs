// ===== File: Auth.gs =====
// Responsibility: Credential checking for the attendance portal login.
//                 Returns role info (owner vs admin) for dashboard routing.

/**
 * Checks user credentials against the 'cred' sheet.
 * @param {string} id - User login ID.
 * @param {string} pass - User password.
 * @return {string} 'success', 'Incorrect password', or 'User not found'.
 */
function checkCredentials(id, pass) {
  var sheet = getSheet_(SHEET_NAMES.CRED);
  if (!sheet) return 'Credentials sheet not found';

  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return 'User not found';

  var data = sheet.getRange('A2:B' + lastRow).getValues();

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

/**
 * Returns login result with role info for dashboard routing.
 * @param {string} id
 * @param {string} pass
 * @return {{status: string, role: string}}
 */
function loginWithRole(id, pass) {
  var result = checkCredentials(id, pass);
  var role = 'owner';
  if (result === 'success' && isSuperUser(id)) {
    role = 'admin';
  }
  return { status: result, role: role };
}

/**
 * Creates a short-lived one-time token for admin page auto-login handoff.
 * @param {string} userId
 * @return {string}
 */
function createAdminLaunchToken(userId) {
  if (!userId || !isSuperUser(userId)) {
    throw new Error('Not allowed to create admin launch token.');
  }

  var token = Utilities.getUuid();
  var payload = JSON.stringify({ userId: userId, issuedAt: new Date().toISOString() });

  CacheService.getScriptCache().put('admin_launch_' + token, payload, 180);
  return token;
}

/**
 * Consumes a one-time admin launch token and returns login context.
 * @param {string} token
 * @return {{ok:boolean, userId:string}}
 */
function consumeAdminLaunchToken(token) {
  token = (token || '').toString().trim();
  if (!token) return { ok: false, userId: '' };

  var cache = CacheService.getScriptCache();
  var raw = cache.get('admin_launch_' + token);
  if (!raw) return { ok: false, userId: '' };

  cache.remove('admin_launch_' + token);

  try {
    var parsed = JSON.parse(raw);
    var userId = (parsed && parsed.userId) ? parsed.userId.toString().trim() : '';
    if (!userId || !isSuperUser(userId)) {
      return { ok: false, userId: '' };
    }
    return { ok: true, userId: userId };
  } catch (e) {
    return { ok: false, userId: '' };
  }
}
