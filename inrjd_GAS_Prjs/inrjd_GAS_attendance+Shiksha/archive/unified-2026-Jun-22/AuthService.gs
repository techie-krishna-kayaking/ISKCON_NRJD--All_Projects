/**
 * Authentication and session management service.
 */
var AuthService = (function () {
  function getAliasValue_(obj, aliases) {
    var i;
    for (i = 0; i < aliases.length; i++) {
      if (obj[aliases[i]] !== undefined && obj[aliases[i]] !== null) {
        return obj[aliases[i]];
      }
    }
    return '';
  }

  function normalizeCredRow_(row) {
    return {
      id: Utils.sanitizeString(getAliasValue_(row, ['id', 'ID', 'user_id', 'userId', 'userid', 'username', 'user name'])),
      password: Utils.sanitizeString(getAliasValue_(row, ['password', 'Password', 'pass', 'pwd'])),
      role: Utils.sanitizeString(getAliasValue_(row, ['role', 'Role'])).toLowerCase(),
      activeFlg: Utils.sanitizeString(getAliasValue_(row, ['active_flg', 'activeFlg', 'active', 'status'])).toUpperCase()
    };
  }

  function login(userId, password) {
    userId = Utils.sanitizeString(userId);
    password = Utils.sanitizeString(password);
    Utils.required(userId, 'User ID');
    Utils.required(password, 'Password');

    var users = Utils.readObjects(APP_CONFIG.SHEETS.CRED).map(normalizeCredRow_);
    var user = users.find(function (u) {
      var activeOk = u.activeFlg === '' || u.activeFlg === 'Y' || u.activeFlg === 'ACTIVE';
      return u.id === userId &&
        u.password === password &&
        activeOk;
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    var role = Utils.sanitizeString(user.role).toLowerCase();
    if (role !== APP_CONFIG.ROLES.OWNER && role !== APP_CONFIG.ROLES.ADMIN) {
      throw new Error('Invalid role for user');
    }

    var sessionToken = createSession({
      id: userId,
      role: role
    });

    Utils.writeLog({ id: userId, role: role }, 'LOGIN', 'cred', userId, 'SUCCESS', 'User login success');

    return {
      sessionToken: sessionToken,
      user: {
        id: userId,
        role: role
      }
    };
  }

  function createSession(user) {
    var token = Utils.createToken();
    var session = {
      id: user.id,
      role: user.role,
      loginAt: Utils.nowIso()
    };

    Utils.putCache(
      APP_CONFIG.CACHE.SESSION_PREFIX,
      token,
      session,
      APP_CONFIG.CACHE.SESSION_TTL_SEC
    );

    return token;
  }

  function getSession(sessionToken) {
    var token = Utils.sanitizeString(sessionToken);
    if (!token) return null;
    return Utils.getCache(APP_CONFIG.CACHE.SESSION_PREFIX, token);
  }

  function requireSession(sessionToken) {
    var session = getSession(sessionToken);
    if (!session) {
      throw new Error('Session expired. Please login again.');
    }
    return session;
  }

  function requireRole(sessionToken, role) {
    var session = requireSession(sessionToken);
    if (session.role !== role) {
      throw new Error('Access denied');
    }
    return session;
  }

  function logout(sessionToken) {
    var session = getSession(sessionToken);
    if (session) {
      Utils.writeLog(session, 'LOGOUT', 'session', session.id, 'SUCCESS', 'User logout');
    }
    Utils.removeCache(APP_CONFIG.CACHE.SESSION_PREFIX, Utils.sanitizeString(sessionToken));
    return { success: true };
  }

  return {
    login: login,
    getSession: getSession,
    requireSession: requireSession,
    requireRole: requireRole,
    logout: logout
  };
})();
