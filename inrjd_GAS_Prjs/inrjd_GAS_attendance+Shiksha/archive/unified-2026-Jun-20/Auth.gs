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

  var rec = getCredUserRecord_(id);
  if (!rec.found) return 'User not found';
  if (rec.password !== pass) return 'Incorrect password';
  return 'success';
}

/**
 * Returns one user record from cred sheet.
 * Expected columns: A=id, B=password, C=role.
 * @param {string} id
 * @return {{found:boolean,id:string,password:string,role:string}}
 */
function getCredUserRecord_(id) {
  var out = { found: false, id: '', password: '', role: 'owner' };
  var userId = (id || '').toString().trim();
  if (!userId) return out;

  var sheet = getSheet_(SHEET_NAMES.CRED);
  if (!sheet) return out;

  var data = getAllData_(sheet);
  if (data.length < 2) return out;

  var userUpper = userId.toUpperCase();
  for (var i = 1; i < data.length; i++) {
    var rowId = (data[i][0] || '').toString().trim();
    if (!rowId || rowId.toUpperCase() !== userUpper) continue;
    out.found = true;
    out.id = rowId;
    out.password = (data[i][1] || '').toString();
    var role = (data[i][2] || '').toString().trim().toLowerCase();
    out.role = role === 'admin' ? 'admin' : 'owner';
    return out;
  }
  return out;
}

/**
 * Returns effective role for a user.
 * cred.role='admin' is the only source of admin role.
 * @param {string} id
 * @return {'admin'|'owner'}
 */
function getUserRole(id) {
  var rec = getCredUserRecord_(id);
  if (rec.found && rec.role === 'admin') return 'admin';
  return 'owner';
}

/**
 * @param {string} id
 * @return {boolean}
 */
function isAdminUser(id) {
  return getUserRole(id) === 'admin';
}

/**
 * Returns true when the actor can manage data owned by ownerId.
 * Admins can manage any owner. Owners can manage their own rows only.
 * @param {string} actorId
 * @param {string} ownerId
 * @return {boolean}
 */
function canManageOwnerData(actorId, ownerId) {
  var actor = (actorId || '').toString().trim();
  var owner = (ownerId || '').toString().trim();
  if (!actor || !owner) return false;
  if (isAdminUser(actor)) return true;
  return actor.toUpperCase() === owner.toUpperCase();
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
  if (result === 'success') role = getUserRole(id);
  return { status: result, role: role };
}

/**
 * Creates a short-lived one-time token for admin page auto-login handoff.
 * @param {string} userId
 * @return {string}
 */
function createAdminLaunchToken(userId) {
  if (!userId || !isAdminUser(userId)) {
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
    if (!userId || !isAdminUser(userId)) {
      return { ok: false, userId: '' };
    }
    return { ok: true, userId: userId };
  } catch (e) {
    return { ok: false, userId: '' };
  }
}
