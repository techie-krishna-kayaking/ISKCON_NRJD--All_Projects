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
