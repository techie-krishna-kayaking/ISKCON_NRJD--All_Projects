/**
 * Auth — password hashing, session tokens, login/logout.
 *
 * Since GAS web apps have no server-side sessions, admin auth uses
 * a UUID token stored in ScriptProperties with a 24-hour expiry.
 * The token is passed by the client as the first argument to every
 * admin-only server function.
 */

function hashPassword(password) {
  var digest = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    password,
    Utilities.Charset.UTF_8
  );
  return digest.map(function(b) {
    return ('0' + (b & 0xFF).toString(16)).slice(-2);
  }).join('');
}

function isAdminToken(token) {
  if (!token) return false;
  var props = PropertiesService.getScriptProperties();
  var stored  = props.getProperty('ADMIN_TOKEN');
  var expires = parseInt(props.getProperty('ADMIN_TOKEN_EXPIRES') || '0', 10);
  return token === stored && Date.now() < expires;
}

// ── Public server functions (callable via google.script.run) ─────

function login(password) {
  var props = PropertiesService.getScriptProperties();
  var storedHash = props.getProperty('ADMIN_PASSWORD_HASH');

  // Auto-initialize on first login if setup() was not run
  if (!storedHash) {
    storedHash = hashPassword('108');
    props.setProperty('ADMIN_PASSWORD_HASH', storedHash);
  }

  if (hashPassword(password) !== storedHash) {
    return { error: 'Invalid credentials' };
  }

  var token = Utilities.getUuid();
  props.setProperty('ADMIN_TOKEN', token);
  props.setProperty('ADMIN_TOKEN_EXPIRES', String(Date.now() + 24 * 60 * 60 * 1000));

  return {
    success: true,
    token: token,
    sharedToken: props.getProperty('SHARED_VIEW_TOKEN')
  };
}

function logout(adminToken) {
  if (isAdminToken(adminToken)) {
    var props = PropertiesService.getScriptProperties();
    props.deleteProperty('ADMIN_TOKEN');
    props.deleteProperty('ADMIN_TOKEN_EXPIRES');
  }
  return { success: true };
}

function getAuthStatus(adminToken) {
  var authenticated = isAdminToken(adminToken);
  var sharedToken = authenticated
    ? PropertiesService.getScriptProperties().getProperty('SHARED_VIEW_TOKEN')
    : null;
  return { authenticated: authenticated, sharedToken: sharedToken };
}

function changePassword(adminToken, newPassword) {
  if (!isAdminToken(adminToken)) return { error: 'Unauthorized' };
  if (!newPassword || newPassword.length < 4) return { error: 'Password must be at least 4 characters' };
  PropertiesService.getScriptProperties().setProperty('ADMIN_PASSWORD_HASH', hashPassword(newPassword));
  return { success: true };
}

function validateSharedToken(token) {
  var stored = PropertiesService.getScriptProperties().getProperty('SHARED_VIEW_TOKEN');
  return { valid: token === stored };
}

function regenerateSharedToken(adminToken) {
  if (!isAdminToken(adminToken)) return { error: 'Unauthorized' };
  var newToken = Utilities.getUuid();
  PropertiesService.getScriptProperties().setProperty('SHARED_VIEW_TOKEN', newToken);
  return { success: true, sharedToken: newToken };
}
