// ===== File: Dashboard.gs =====
// Responsibility: Backend data aggregation for Owner Dashboard & Super Admin Dashboard.
//                 Reads from tab1 (programs), tab2 (member + attendance snapshot),
//                 tab3 (participants/shiksha), and optional tab6 (certifications).

/**
 * Super user IDs — owners in this list see the Super Admin dashboard.
 * Add column C = 'admin' in cred sheet as alternative.
 * @const {string[]}
 */
var SUPER_USERS = ['VNP','LRM'];

/**
 * Shiksha level hierarchy (lowest → highest) used for funnel chart ordering.
 * @const {string[]}
 */
var SHIKSHA_LEVELS = [
  'None',
  'Shraddhavan',
  'Krishna Sevak',
  'Krishna Sadhak',
  'Srila Prabhupada Ashraya',
  'Srila Guru Charana Ashraya'
];

// ────────────────────────────────────────────────────────────────
//  OWNER DASHBOARD
// ────────────────────────────────────────────────────────────────

/**
 * Returns dashboard data for a specific program owner.
 * @param {string} ownerId
 * @return {Object}
 */
function getOwnerDashboard(ownerId) {
  var programs = _getAllPrograms();
  var attData  = _getAllAttendance();
  var partData = _getAllParticipants();
  var attention = getOwnerAttention(ownerId);
  var ownerRecommendations = getOwnerRecommendations(ownerId);

  // Filter owner's programs
  var ownerPrograms = programs.filter(function(p) { return p[TAB1_COLS.PROGRAM_OWNER] === ownerId; });
  var activePrograms = ownerPrograms.filter(function(p) {
    var flag = (p[TAB1_COLS.ACT_FLG] || '').toString().trim().toUpperCase();
    return flag === 'YES' || flag === 'Y';
  });

  // Program keys for this owner
  var ownerKeys = {};
  ownerPrograms.forEach(function(p) { ownerKeys[p[TAB1_COLS.PROGRAM_KEY]] = true; });

  // Count devotees per program from tab2 (row schema)
  var devCountByProgram = {};
  var totalDevotees = 0;
  var uniqueDevotees = {};
  ownerPrograms.forEach(function(p) {
    var pk = p[TAB1_COLS.PROGRAM_KEY];
    var rows = getTab2RowsForProgram(pk);
    devCountByProgram[pk] = rows.length;
    totalDevotees += rows.length;
    rows.forEach(function(r) { uniqueDevotees[r.name.toUpperCase()] = true; });
  });

  // Attendance stats for owner's programs
  var attByProgram = {};
  var totalSessions = 0, totalAttended = 0, attRows = 0;
  for (var a = 0; a < attData.length; a++) {
    var row = attData[a];
    var pk2 = row[ATT_COLS.PROGRAM_KEY];
    if (!ownerKeys[pk2]) continue;
    var ts = Number(row[ATT_COLS.TOTAL_SESSIONS]) || 0;
    var at = Number(row[ATT_COLS.ATTENDED]) || 0;
    totalSessions += ts;
    totalAttended += at;
    attRows++;
    if (!attByProgram[pk2]) attByProgram[pk2] = { sessions: 0, attended: 0, rows: 0 };
    attByProgram[pk2].sessions += ts;
    attByProgram[pk2].attended += at;
    attByProgram[pk2].rows++;
  }
  var avgAttendance = totalSessions > 0 ? Math.round((totalAttended / totalSessions) * 100) : 0;

  // Members by program type
  var membersByType = {};
  ownerPrograms.forEach(function(p) {
    var type = (p[TAB1_COLS.TYPE_OF_PROGRAM] || 'Unknown').toString().trim();
    var pk3 = p[TAB1_COLS.PROGRAM_KEY];
    var cnt2 = devCountByProgram[pk3] || 0;
    membersByType[type] = (membersByType[type] || 0) + cnt2;
  });

  // Shiksha level distribution for owner's devotees — filter by BV_LEADER
  var levelDist = {};
  SHIKSHA_LEVELS.forEach(function(l) { levelDist[l] = 0; });
  var partHeaders = partData.headers || [];
  var partRows    = partData.rows || [];
  var idxActive2  = _findIdx(partHeaders, ['active_flg', 'active_flag', 'active']);
  var idxName2    = _findIdx(partHeaders, ['name', 'fname', 'devotee_name', 'full_name']);
  var idxLevel2   = _findIdx(partHeaders, ['siksha status', 'siksha_status', 'shiksha_status', 'shiksha status']);
  var idxBVLeader = _findIdx(partHeaders, ['bv leader', 'bv_leader', 'bvleader', 'bv']);

  for (var p2 = 0; p2 < partRows.length; p2++) {
    var pr = partRows[p2];
    if (idxActive2 >= 0 && (pr[idxActive2] || '').toString().trim().toUpperCase() !== 'Y') continue;
    var bvLeader = idxBVLeader >= 0 ? (pr[idxBVLeader] || '').toString().trim().toUpperCase() : '';
    if (!bvLeader || bvLeader !== ownerId.toUpperCase()) continue;
    var level = idxLevel2 >= 0 ? (pr[idxLevel2] || 'None').toString().trim() : 'None';
    if (!level) level = 'None';
    levelDist[level] = (levelDist[level] || 0) + 1;
  }

  // Program list with stats
  var programList = ownerPrograms.map(function(p) {
    var pk4 = p[TAB1_COLS.PROGRAM_KEY];
    var att = attByProgram[pk4] || { sessions: 0, attended: 0, rows: 0 };
    var pct = att.sessions > 0 ? Math.round((att.attended / att.sessions) * 100) : 0;
    return {
      programKey:    pk4,
      area:          p[TAB1_COLS.AREA],
      subArea:       p[TAB1_COLS.SUB_AREA],
      type:          p[TAB1_COLS.TYPE_OF_PROGRAM],
      frequency:     p[TAB1_COLS.FREQUENCY],
      day:           p[TAB1_COLS.DAY],
      time:          p[TAB1_COLS.TIME],
      actFlag:       p[TAB1_COLS.ACT_FLG],
      members:       devCountByProgram[pk4] || 0,
      avgAttendance: pct + '%'
    };
  });

  return {
    summary: {
      totalPrograms:    ownerPrograms.length,
      activePrograms:   activePrograms.length,
      totalDevotees:    totalDevotees,
      uniqueDevotees:   Object.keys(uniqueDevotees).length,
      avgAttendance:    avgAttendance
    },
    membersByType:  membersByType,
    levelDist:      levelDist,
    programs:       programList,
    attention:      attention,
    recommendations: ownerRecommendations
  };
}

// ────────────────────────────────────────────────────────────────
//  SUPER ADMIN DASHBOARD
// ────────────────────────────────────────────────────────────────

/**
 * Returns comprehensive dashboard data for the super admin.
 * @return {Object}
 */
function getSuperAdminDashboard() {
  var programs = _getAllPrograms();
  var attData  = _getAllAttendance();
  var partData = _getAllParticipants();
  var certData = _getAllCertifications();
  var recommendationSnapshot = getRecommendations({});

  // ── PROGRAMS STATS ──
  var activePrograms = programs.filter(function(p) {
    var flag = (p[TAB1_COLS.ACT_FLG] || '').toString().trim().toUpperCase();
    return flag === 'YES' || flag === 'Y';
  });

  // Unique owners
  var ownerSet = {};
  programs.forEach(function(p) {
    var o = (p[TAB1_COLS.PROGRAM_OWNER] || '').toString().trim();
    if (o) ownerSet[o] = true;
  });
  var totalOwners = Object.keys(ownerSet).length;

  // ── DEVOTEES STATS from tab2 (row schema) ──
  var allDevoteeNames = {};
  var devCountByProgram = {};
  programs.forEach(function(p) {
    var pk = (p[TAB1_COLS.PROGRAM_KEY] || '').toString().trim();
    if (!pk) return;
    var rows = getTab2RowsForProgram(pk);
    devCountByProgram[pk] = rows.length;
    rows.forEach(function(r) { allDevoteeNames[r.name.toUpperCase()] = true; });
  });
  var totalDevotees = Object.keys(allDevoteeNames).length;

  // ── ATTENDANCE STATS ──
  var totalSessions = 0, totalAttended = 0;
  var attByOwner = {};
  for (var a = 0; a < attData.length; a++) {
    var row = attData[a];
    var ts = Number(row[ATT_COLS.TOTAL_SESSIONS]) || 0;
    var at = Number(row[ATT_COLS.ATTENDED]) || 0;
    totalSessions += ts;
    totalAttended += at;
    var owner = (row[ATT_COLS.PROGRAM_OWNER] || '').toString().trim();
    if (!attByOwner[owner]) attByOwner[owner] = { sessions: 0, attended: 0 };
    attByOwner[owner].sessions += ts;
    attByOwner[owner].attended += at;
  }
  var avgAttendance = totalSessions > 0 ? Math.round((totalAttended / totalSessions) * 100) : 0;

  // Devotee health: Active (≥80%), Moderate (40-79%), Inactive (<40%)
  var devoteeHealth = { active: 0, moderate: 0, inactive: 0 };
  var devoteeAttMap = {}; // devotee → {sessions, attended}
  for (var a2 = 0; a2 < attData.length; a2++) {
    var r2 = attData[a2];
    var dev = (r2[ATT_COLS.DEVOTEE] || '').toString().trim().toUpperCase();
    if (!dev) continue;
    if (!devoteeAttMap[dev]) devoteeAttMap[dev] = { sessions: 0, attended: 0 };
    devoteeAttMap[dev].sessions += Number(r2[ATT_COLS.TOTAL_SESSIONS]) || 0;
    devoteeAttMap[dev].attended += Number(r2[ATT_COLS.ATTENDED]) || 0;
  }
  Object.keys(devoteeAttMap).forEach(function(d) {
    var pct = devoteeAttMap[d].sessions > 0
      ? (devoteeAttMap[d].attended / devoteeAttMap[d].sessions) * 100 : 0;
    if (pct >= 80) devoteeHealth.active++;
    else if (pct >= 40) devoteeHealth.moderate++;
    else devoteeHealth.inactive++;
  });

  // Overdue programs: active programs where no attendance row exists
  var programsWithAtt = {};
  attData.forEach(function(r3) { programsWithAtt[r3[ATT_COLS.PROGRAM_KEY]] = true; });
  var overduePrograms = activePrograms.filter(function(p) {
    return !programsWithAtt[p[TAB1_COLS.PROGRAM_KEY]];
  }).length;

  // Members by program type (global)
  var membersByType = {};
  programs.forEach(function(p) {
    var type = (p[TAB1_COLS.TYPE_OF_PROGRAM] || 'Unknown').toString().trim();
    var pk2 = p[TAB1_COLS.PROGRAM_KEY];
    membersByType[type] = (membersByType[type] || 0) + (devCountByProgram[pk2] || 0);
  });

  // Programs by area
  var programsByArea = {};
  programs.forEach(function(p) {
    var area = (p[TAB1_COLS.AREA] || 'Unknown').toString().trim();
    programsByArea[area] = (programsByArea[area] || 0) + 1;
  });

  // Programs per owner
  var programsPerOwner = {};
  programs.forEach(function(p) {
    var o2 = (p[TAB1_COLS.PROGRAM_OWNER] || '').toString().trim();
    if (o2) programsPerOwner[o2] = (programsPerOwner[o2] || 0) + 1;
  });

  // Attendance ops
  var repeatedAbsentees = 0;
  Object.keys(devoteeAttMap).forEach(function(d) {
    var pct2 = devoteeAttMap[d].sessions > 0
      ? (devoteeAttMap[d].attended / devoteeAttMap[d].sessions) * 100 : 0;
    if (pct2 < 30) repeatedAbsentees++;
  });

  // Programs not marked (active but no attendance rows)
  var programsNotMarked = overduePrograms;

  // ── PARTICIPANTS / SHIKSHA STATS ──
  var partHeaders = partData.headers || [];
  var partRows    = partData.rows || [];
  var idxActive   = _findIdx(partHeaders, ['active_flg', 'active_flag', 'active']);
  var idxLevel    = _findIdx(partHeaders, ['siksha status', 'siksha_status', 'shiksha_status', 'shiksha status']);
  var idxName     = _findIdx(partHeaders, ['name', 'fname', 'devotee_name', 'full_name']);
  var idxPhone    = _findIdx(partHeaders, ['contact number', 'contact_number', 'contactnumber', 'contact', 'phone']);
  var idxEmail    = _findIdx(partHeaders, ['email', 'email id', 'email_id']);

  var totalParticipants = partRows.length;
  var activeParticipants = 0;
  var levelDist = {};
  SHIKSHA_LEVELS.forEach(function(l) { levelDist[l] = 0; });
  var missingPhone = 0, missingEmail = 0;

  for (var p3 = 0; p3 < partRows.length; p3++) {
    var pr = partRows[p3];
    var isActive = idxActive >= 0 ? (pr[idxActive] || '').toString().trim().toUpperCase() === 'Y' : true;
    if (isActive) {
      activeParticipants++;
      var lvl = idxLevel >= 0 ? (pr[idxLevel] || 'None').toString().trim() : 'None';
      if (!lvl) lvl = 'None';
      levelDist[lvl] = (levelDist[lvl] || 0) + 1;

      // Data quality
      if (idxPhone >= 0) {
        var phone = (pr[idxPhone] || '').toString().trim();
        if (!phone) missingPhone++;
      }
      if (idxEmail >= 0) {
        var email = (pr[idxEmail] || '').toString().trim();
        if (!email) missingEmail++;
      }
    }
  }

  // ── CERTIFICATIONS ──
  var totalCerts = certData.length;
  var certsByLevel = {};
  SHIKSHA_LEVELS.forEach(function(l) { certsByLevel[l] = 0; });
  var certHeaders = certData.headers || [];
  var certRows    = certData.rows || [];
  var idxCertLevel = _findIdx(certHeaders, ['level', 'certification_level', 'cert_level', 'siksha status', 'siksha_status']);
  for (var c2 = 0; c2 < certRows.length; c2++) {
    var cLevel = idxCertLevel >= 0 ? (certRows[c2][idxCertLevel] || '').toString().trim() : '';
    if (cLevel && certsByLevel.hasOwnProperty(cLevel)) {
      certsByLevel[cLevel]++;
    }
  }

  return {
    keyMetrics: {
      activePrograms:    activePrograms.length,
      totalPrograms:     programs.length,
      totalDevotees:     totalDevotees,
      totalOwners:       totalOwners,
      avgAttendance:     avgAttendance,
      overduePrograms:   overduePrograms,
      totalAttRows:      attData.length
    },
    devoteeHealth: devoteeHealth,
    attendanceOps: {
      totalSubmissions:   attData.length,
      programsNotMarked:  programsNotMarked,
      repeatedAbsentees:  repeatedAbsentees
    },
    membersByType:    membersByType,
    programsByArea:   programsByArea,
    programsPerOwner: programsPerOwner,
    shiksha: {
      totalParticipants:  totalParticipants,
      activeParticipants: activeParticipants,
      certificationsIssued: certRows.length,
      levelDist:          levelDist,
      certsByLevel:       certsByLevel
    },
    dataQuality: {
      missingPhone:  missingPhone,
      missingEmail:  missingEmail,
      totalActive:   activeParticipants
    },
    recommendations: {
      total: recommendationSnapshot.stats.total,
      pending: recommendationSnapshot.stats.pending,
      approved: recommendationSnapshot.stats.approved,
      rejected: recommendationSnapshot.stats.rejected
    }
  };
}

/**
 * Checks if a user ID is a super user.
 * @param {string} userId
 * @return {boolean}
 */
function isSuperUser(userId) {
  return SUPER_USERS.indexOf(userId) !== -1;
}

// ────────────────────────────────────────────────────────────────
//  INTERNAL HELPERS
// ────────────────────────────────────────────────────────────────

/** @return {Array<Array<*>>} All program rows (no header). */
function _getAllPrograms() {
  var sheet = getSheet_(SHEET_NAMES.PROGRAMS);
  if (!sheet) return [];
  var data = getAllData_(sheet);
  return data.length > 1 ? data.slice(1) : [];
}

/** @return {Array<Array<*>>} All attendance rows (no header). */
function _getAllAttendance() {
  var sheet = getSheet_(SHEET_NAMES.DEVOTEES);
  if (!sheet) return [];
  ensureTab2RowSchema_(sheet);

  var data = getAllData_(sheet);
  if (data.length < 2) return [];

  var programs = _getAllPrograms();
  var programMap = {};
  for (var i = 0; i < programs.length; i++) {
    var p = programs[i];
    var pk = (p[TAB1_COLS.PROGRAM_KEY] || '').toString().trim();
    if (pk) programMap[pk] = p;
  }

  var rows = [];
  for (var r = 1; r < data.length; r++) {
    var row = data[r];
    var pk2 = (row[TAB2_COLS.PROGRAM_KEY] || '').toString().trim();
    var devotee = (row[TAB2_COLS.NAME] || '').toString().trim();
    if (!pk2 || !devotee) continue;

    var meta = programMap[pk2] || [];
    rows.push([
      pk2,
      meta[TAB1_COLS.AREA] || '',
      meta[TAB1_COLS.SUB_AREA] || '',
      meta[TAB1_COLS.FREQUENCY] || '',
      meta[TAB1_COLS.TYPE_OF_PROGRAM] || '',
      meta[TAB1_COLS.LANGUAGE] || '',
      meta[TAB1_COLS.PROGRAM_OWNER] || '',
      devotee,
      Number(row[TAB2_COLS.TOTAL_SESSIONS]) || 0,
      Number(row[TAB2_COLS.ATTENDED]) || 0,
      (row[TAB2_COLS.PERCENTAGE] || '0%').toString()
    ]);
  }
  return rows;
}

/**
 * Returns participant data with headers.
 * @return {{headers: string[], rows: Array<Array<*>>}}
 */
function _getAllParticipants() {
  var sheet = getSheet_(SHEET_NAMES.PARTICIPANTS);
  if (!sheet) return { headers: [], rows: [] };
  var data = getAllData_(sheet);
  if (data.length < 1) return { headers: [], rows: [] };
  var headers = data[0].map(function(h) { return (h || '').toString().trim().toLowerCase(); });
  return { headers: headers, rows: data.slice(1) };
}

/**
 * Returns certification data with headers.
 * @return {{headers: string[], rows: Array<Array<*>>}}
 */
function _getAllCertifications() {
  var sheet = getSheet_(SHEET_NAMES.CERTIFICATIONS);
  if (!sheet) return { headers: [], rows: [] };
  var data = getAllData_(sheet);
  if (data.length < 1) return { headers: [], rows: [] };
  var headers = data[0].map(function(h) { return (h || '').toString().trim().toLowerCase(); });
  return { headers: headers, rows: data.slice(1) };
}

/**
 * Helper: find header index from lowercased header array.
 * @param {string[]} headers - Already lowercased headers.
 * @param {string[]} candidates
 * @return {number}
 */
function _findIdx(headers, candidates) {
  for (var i = 0; i < candidates.length; i++) {
    var idx = headers.indexOf(candidates[i].toLowerCase());
    if (idx !== -1) return idx;
  }
  return -1;
}
