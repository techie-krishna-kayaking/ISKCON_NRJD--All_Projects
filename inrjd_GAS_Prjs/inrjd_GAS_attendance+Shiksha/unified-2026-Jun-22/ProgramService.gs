/**
 * Owner program retrieval and owner dashboard summary service.
 */
var ProgramService = (function () {
  function firstValue_(row, keys) {
    var i;
    for (i = 0; i < keys.length; i++) {
      if (row[keys[i]] !== undefined && row[keys[i]] !== null && Utils.sanitizeString(row[keys[i]]) !== '') {
        return row[keys[i]];
      }
    }
    return '';
  }

  function normalizeProgramKey_(value) {
    return Utils.sanitizeString(value).toLowerCase();
  }

  function getMemberProgramKey_(member) {
    return Utils.sanitizeString(firstValue_(member, ['program_key', 'program', 'program_code', 'prg_key']));
  }

  function getMemberAttendanceStatus_(member) {
    return Utils.sanitizeString(firstValue_(member, [
      'attendance_status',
      'attendance',
      'status',
      'last_status',
      'laststatus'
    ]));
  }

  function getMemberLastAttendance_(member) {
    return Utils.sanitizeString(firstValue_(member, [
      'last_attendance_date',
      'last_att_date',
      'attendance_last_updated',
      'attendance_updated_on',
      'updated_on',
      'updated_at',
      'last_date',
      'date'
    ]));
  }

  function getProgramDay_(program) {
    return Utils.sanitizeString(firstValue_(program, [
      'program_day',
      'day',
      'weekday',
      'program_weekday',
      'program_day_of_week',
      'satsang_day'
    ]));
  }

  function getProgramTime_(program) {
    return Utils.sanitizeString(firstValue_(program, [
      'program_time',
      'time',
      'meeting_time',
      'satsang_time',
      'start_time',
      'program_start_time'
    ]));
  }

  function isActiveMember_(member) {
    var flag = Utils.sanitizeString(firstValue_(member, ['active_member_flg', 'active_flg', 'active', 'status'])).toUpperCase();
    return flag === '' || flag === 'Y' || flag === 'ACTIVE';
  }

  function getProgramByKey(programKey) {
    var pKey = normalizeProgramKey_(programKey);
    return Utils.readObjects(APP_CONFIG.SHEETS.TAB1).find(function (p) {
      return normalizeProgramKey_(p.program_key) === pKey;
    }) || null;
  }

  function enforceProgramAccess(session, programKey) {
    var program = getProgramByKey(programKey);
    if (!program) {
      throw new Error('Program not found');
    }

    if (session.role === APP_CONFIG.ROLES.OWNER) {
      var owner = Utils.sanitizeString(program.program_owner).toLowerCase();
      if (owner !== Utils.sanitizeString(session.id).toLowerCase()) {
        throw new Error('Access denied for this program');
      }
    }

    return program;
  }

  function getOwnerPrograms(sessionToken) {
    var session = AuthService.requireSession(sessionToken);
    var all = Utils.readObjects(APP_CONFIG.SHEETS.TAB1).filter(function (p) {
      return Utils.normBoolY(p.active_flg);
    });

    if (session.role === APP_CONFIG.ROLES.ADMIN) {
      return all;
    }

    return all.filter(function (p) {
      return Utils.sanitizeString(p.program_owner).toLowerCase() === Utils.sanitizeString(session.id).toLowerCase();
    });
  }

  function getOwnerDashboard(sessionToken) {
    var session = AuthService.requireSession(sessionToken);
    var programs = getOwnerPrograms(sessionToken);
    var members = Utils.readObjects(APP_CONFIG.SHEETS.TAB2).filter(function (m) {
      return isActiveMember_(m);
    });

    var programMap = {};
    programs.forEach(function (p) {
      programMap[normalizeProgramKey_(p.program_key)] = p;
    });

    var counts = {};
    members.forEach(function (m) {
      var pKeyRaw = getMemberProgramKey_(m);
      var pKey = normalizeProgramKey_(pKeyRaw);
      if (!programMap[pKey]) return;
      if (!counts[pKey]) {
        counts[pKey] = { totalMembers: 0, presentCount: 0, attendanceLastUpdated: '' };
      }
      counts[pKey].totalMembers += 1;
      var status = getMemberAttendanceStatus_(m).toLowerCase();
      if (status === 'present') {
        counts[pKey].presentCount += 1;
      }

      var lastAttendance = getMemberLastAttendance_(m);
      if (lastAttendance && (!counts[pKey].attendanceLastUpdated || String(lastAttendance) > String(counts[pKey].attendanceLastUpdated))) {
        counts[pKey].attendanceLastUpdated = lastAttendance;
      }
    });

    var rows = programs.map(function (p) {
      var pKey = normalizeProgramKey_(p.program_key);
      var c = counts[pKey] || { totalMembers: 0, presentCount: 0, attendanceLastUpdated: '' };
      return {
        programKey: Utils.sanitizeString(firstValue_(p, ['program_key', 'programkey'])),
        programName: firstValue_(p, ['program_name', 'program', 'name', 'type_of_program']),
        owner: firstValue_(p, ['program_owner', 'owner']),
        area: firstValue_(p, ['area', 'zone']),
        subArea: firstValue_(p, ['sub_area', 'subarea']),
        city: firstValue_(p, ['city']),
        typeOfProgram: firstValue_(p, ['type_of_program', 'program_type']),
        virtual: firstValue_(p, ['virtual']),
        day: getProgramDay_(p),
        time: getProgramTime_(p),
        attendanceLastUpdated: c.attendanceLastUpdated,
        totalMembers: c.totalMembers,
        presentCount: c.presentCount,
        activeFlg: firstValue_(p, ['active_flg', 'act_flg'])
      };
    });

    return {
      actor: session,
      cards: {
        totalPrograms: rows.length,
        totalMembers: rows.reduce(function (acc, r) { return acc + r.totalMembers; }, 0),
        presentToday: rows.reduce(function (acc, r) { return acc + r.presentCount; }, 0)
      },
      programs: rows
    };
  }

  function createProgramWithMembers(sessionToken, payload) {
    var session = AuthService.requireSession(sessionToken);
    if (session.role !== APP_CONFIG.ROLES.OWNER && session.role !== APP_CONFIG.ROLES.ADMIN) {
      throw new Error('Access denied');
    }

    var data = payload || {};
    var ownerId = session.role === APP_CONFIG.ROLES.OWNER
      ? session.id
      : Utils.sanitizeString(firstValue_(data, ['programOwner', 'program_owner', 'owner'])) || session.id;

    var programKey = Utils.sanitizeString(firstValue_(data, ['programKey', 'program_key'])).toUpperCase();
    if (!programKey) {
      programKey = generateProgramKey_(ownerId);
    }

    var existing = getProgramByKey(programKey);
    if (existing) {
      throw new Error('Program key already exists: ' + programKey);
    }

    var programName = Utils.sanitizeString(firstValue_(data, ['programName', 'program_name', 'typeOfProgram'])) || programKey;
    var zone = Utils.sanitizeString(firstValue_(data, ['zone', 'area']));
    var subArea = Utils.sanitizeString(firstValue_(data, ['subArea', 'sub_area']));
    var city = Utils.sanitizeString(firstValue_(data, ['city']));
    var day = Utils.sanitizeString(firstValue_(data, ['day', 'programDay', 'program_day']));
    var time = Utils.sanitizeString(firstValue_(data, ['time', 'programTime', 'program_time']));
    var frequency = Utils.sanitizeString(firstValue_(data, ['frequency']));
    var typeOfProgram = Utils.sanitizeString(firstValue_(data, ['typeOfProgram', 'type_of_program']));
    var language = Utils.sanitizeString(firstValue_(data, ['language']));
    var virtual = Utils.sanitizeString(firstValue_(data, ['virtual']));
    var programStartDate = Utils.sanitizeString(firstValue_(data, ['programStartDate', 'program_start_date']));
    var devoteesText = Utils.sanitizeString(firstValue_(data, ['devotees', 'members']));

    Utils.required(programName, 'Program name');
    Utils.required(zone, 'Area/Zone');

    var devotees = parseDevotees_(devoteesText);
    var now = Utils.nowIso();

    return Utils.withLock(function () {
      Utils.appendObject(APP_CONFIG.SHEETS.TAB1, {
        program_key: programKey,
        program_name: programName,
        area: zone,
        sub_area: subArea,
        city: city,
        frequency: frequency,
        type_of_program: typeOfProgram,
        language: language,
        program_owner: ownerId,
        virtual: virtual,
        program_start_date: programStartDate,
        day: day,
        time: time,
        active_flg: 'Y',
        act_flg: 'YES',
        created_on: now,
        created_by: session.id,
        updated_on: now,
        updated_by: session.id
      });

      devotees.forEach(function (name, idx) {
        Utils.appendObject(APP_CONFIG.SHEETS.TAB2, {
          program_key: programKey,
          programKey: programKey,
          shiksha_code: buildTempShikshaCode_(programKey, idx + 1),
          shikshaCode: buildTempShikshaCode_(programKey, idx + 1),
          devotee_name: name,
          name: name,
          total_sessions: 0,
          attended: 0,
          attendance_pct: '0%',
          last_att_date: '',
          last_status: '',
          updated_at: now,
          updated_on: now,
          updated_by: session.id
        });
      });

      Utils.writeLog(session, 'PROGRAM_CREATE', 'tab1', programKey, 'SUCCESS', 'Program created with members', {
        member_count: devotees.length
      });

      return {
        programKey: programKey,
        programName: programName,
        owner: ownerId,
        membersCreated: devotees.length
      };
    });
  }

  function parseDevotees_(text) {
    if (!text) return [];
    var split = text.split(/[,\n]/);
    var unique = {};
    var rows = [];
    split.forEach(function (raw) {
      var v = Utils.sanitizeString(raw);
      if (!v) return;
      var key = v.toLowerCase();
      if (unique[key]) return;
      unique[key] = true;
      rows.push(v);
    });
    return rows;
  }

  function generateProgramKey_(ownerId) {
    var prefix = Utils.sanitizeString(ownerId).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 3) || 'PRG';
    var rows = Utils.readObjects(APP_CONFIG.SHEETS.TAB1);
    var maxNum = 0;
    rows.forEach(function (r) {
      var code = Utils.sanitizeString(r.program_key).toUpperCase();
      if (code.indexOf(prefix) !== 0) return;
      var num = Number(code.replace(prefix, ''));
      if (!isNaN(num)) {
        maxNum = Math.max(maxNum, num);
      }
    });
    return prefix + ('000' + (maxNum + 1)).slice(-3);
  }

  function buildTempShikshaCode_(programKey, serial) {
    return 'temp_' + programKey + '_' + ('000' + serial).slice(-3);
  }

  function getProgramFormConfig(sessionToken) {
    AuthService.requireSession(sessionToken);
    var rows = Utils.readObjects(APP_CONFIG.SHEETS.CONFIG);

    var areas = uniqueStrings_(rows, ['area']);
    var frequencies = uniqueStrings_(rows, ['frequency']);
    var typesOfProgram = uniqueStrings_(rows, ['type_of_program']);
    var languages = uniqueStrings_(rows, ['language']);
    var days = uniqueStrings_(rows, ['day']);

    var subAreasByArea = {};
    rows.forEach(function (r) {
      var area = Utils.sanitizeString(firstValue_(r, ['area']));
      var subArea = Utils.sanitizeString(firstValue_(r, ['sub_area']));
      if (!area || !subArea) return;
      if (!subAreasByArea[area]) {
        subAreasByArea[area] = [];
      }
      if (subAreasByArea[area].indexOf(subArea) === -1) {
        subAreasByArea[area].push(subArea);
      }
    });

    Object.keys(subAreasByArea).forEach(function (k) {
      subAreasByArea[k].sort();
    });

    var owners = [];
    var ownerSeen = {};
    rows.forEach(function (r) {
      var value = Utils.sanitizeString(firstValue_(r, ['owner_value']));
      var label = Utils.sanitizeString(firstValue_(r, ['owner_label'])) || value;
      if (!value || ownerSeen[value]) return;
      ownerSeen[value] = true;
      owners.push({ value: value, label: label });
    });

    owners.sort(function (a, b) {
      return a.label.localeCompare(b.label);
    });

    return {
      areas: areas,
      subAreasByArea: subAreasByArea,
      frequencies: frequencies,
      typesOfProgram: typesOfProgram,
      languages: languages,
      owners: owners,
      days: days
    };
  }

  function uniqueStrings_(rows, fields) {
    var seen = {};
    rows.forEach(function (r) {
      var val = Utils.sanitizeString(firstValue_(r, fields));
      if (val) {
        seen[val] = true;
      }
    });
    return Object.keys(seen).sort();
  }

  return {
    getProgramByKey: getProgramByKey,
    enforceProgramAccess: enforceProgramAccess,
    getOwnerPrograms: getOwnerPrograms,
    getOwnerDashboard: getOwnerDashboard,
    createProgramWithMembers: createProgramWithMembers,
    getProgramFormConfig: getProgramFormConfig
  };
})();
