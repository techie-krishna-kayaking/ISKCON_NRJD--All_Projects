/**
 * Attendance listing and certify route resolver.
 */
var AttendanceService = (function () {
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

  function memberProgramKey_(member) {
    return Utils.sanitizeString(firstValue_(member, ['program_key', 'program', 'program_code', 'prg_key']));
  }

  function memberDevoteeName_(member) {
    return Utils.sanitizeString(firstValue_(member, ['devotee_name', 'name', 'devotee']));
  }

  function memberShikshaCode_(member) {
    return Utils.sanitizeString(firstValue_(member, ['shiksha_code', 'code', 'shiksha']));
  }

  function memberGender_(member) {
    return Utils.sanitizeString(firstValue_(member, ['gender', 'sex']));
  }

  function memberAttendanceStatus_(member) {
    return Utils.sanitizeString(firstValue_(member, [
      'attendance_status',
      'attendance',
      'status',
      'last_status',
      'laststatus'
    ]));
  }

  function memberLastAttendanceDate_(member) {
    return Utils.sanitizeString(firstValue_(member, [
      'last_attendance_date',
      'last_att_date',
      'attendance_date',
      'updated_at',
      'updated_on',
      'last_date',
      'date'
    ]));
  }

  function memberQuickNotes_(member) {
    return Utils.sanitizeString(firstValue_(member, ['quick_notes', 'notes', 'remark', 'remarks']));
  }

  function isActiveMember_(member) {
    var flag = Utils.sanitizeString(firstValue_(member, ['active_member_flg', 'active_flg', 'active', 'status'])).toUpperCase();
    return flag === '' || flag === 'Y' || flag === 'ACTIVE';
  }

  function getAttendanceMembers(sessionToken, programKey) {
    var session = AuthService.requireSession(sessionToken);
    var program = ProgramService.enforceProgramAccess(session, programKey);
    if (!ProgramService.isProgramActive_(program)) {
      throw new Error('Attendance is disabled for inactive programs');
    }

    var pKey = normalizeProgramKey_(program.program_key);
    var members = Utils.readObjects(APP_CONFIG.SHEETS.TAB2)
      .filter(function (m) {
        return normalizeProgramKey_(memberProgramKey_(m)) === pKey && isActiveMember_(m);
      })
      .map(function (m) {
        return {
          programKey: memberProgramKey_(m),
          devoteeName: memberDevoteeName_(m),
          shikshaCode: memberShikshaCode_(m),
          gender: memberGender_(m),
          attendanceStatus: memberAttendanceStatus_(m),
          lastAttendanceDate: memberLastAttendanceDate_(m),
          quickNotes: memberQuickNotes_(m)
        };
      });

    return {
      program: {
        programKey: program.program_key,
        programName: firstValue_(program, ['program_name', 'program', 'name']),
        owner: program.program_owner,
        zone: program.zone,
        subArea: program.sub_area,
        city: program.city,
        activeFlg: ProgramService.isProgramActive_(program) ? 'YES' : 'NO'
      },
      members: members
    };
  }

  function getCertifyRoute(sessionToken, programKey, devoteeName) {
    var session = AuthService.requireSession(sessionToken);
    var program = ProgramService.enforceProgramAccess(session, programKey);
    if (!ProgramService.isProgramActive_(program)) {
      throw new Error('Attendance is disabled for inactive programs');
    }

    var pKey = normalizeProgramKey_(program.program_key);
    var dName = Utils.sanitizeString(devoteeName);
    Utils.required(dName, 'Devotee name');

    var member = Utils.readObjects(APP_CONFIG.SHEETS.TAB2).find(function (m) {
      return normalizeProgramKey_(memberProgramKey_(m)) === pKey &&
        memberDevoteeName_(m).toLowerCase() === dName.toLowerCase() &&
        isActiveMember_(m);
    });

    if (!member) {
      throw new Error('Member not found in selected program');
    }

    var code = memberShikshaCode_(member);
    if (!code) {
      throw new Error('Shiksha code missing for member');
    }

    var route = Utils.isTempShikshaCode(code) ? 'biodata' : 'shiksha';
    var prefill = buildPrefillContext_(route, program, member);

    if (route === 'shiksha') {
      var activeRecord = DevoteeService.getActiveShikshaByCode(code);
      if (activeRecord) {
        prefill.tab3 = activeRecord;
      } else {
        prefill.tab3 = DevoteeService.findLatestShikshaByNameAndProgram(memberDevoteeName_(member), memberProgramKey_(member));
      }
    }

    var token = createPrefillToken_(prefill);
    Utils.writeLog(session, 'CERTIFY_ROUTE', 'tab2', pKey + ':' + dName, 'SUCCESS', 'Certify route resolved', {
      route: route,
      shiksha_code: code
    });

    return {
      route: route,
      prefillToken: token,
      fallback: prefill
    };
  }

  function getPrefillData(sessionToken, prefillToken, fallbackPayload) {
    AuthService.requireSession(sessionToken);
    var token = Utils.sanitizeString(prefillToken);
    var payload = token ? Utils.getCache(APP_CONFIG.CACHE.PREFILL_PREFIX, token) : null;

    if (payload) {
      return {
        tokenExpired: false,
        payload: payload
      };
    }

    return {
      tokenExpired: true,
      payload: fallbackPayload || {}
    };
  }

  function updateAttendance(sessionToken, programKey, updates) {
    var session = AuthService.requireSession(sessionToken);
    var program = ProgramService.enforceProgramAccess(session, programKey);
    if (!ProgramService.isProgramActive_(program)) {
      throw new Error('Attendance is disabled for inactive programs');
    }

    var list = updates || [];
    if (!list.length) {
      throw new Error('No attendance updates provided');
    }

    var pKeyNorm = normalizeProgramKey_(programKey);
    var now = Utils.nowIso();
    var applied = 0;

    return Utils.withLock(function () {
      var members = Utils.readObjects(APP_CONFIG.SHEETS.TAB2);

      list.forEach(function (u) {
        var devoteeName = Utils.sanitizeString(u.devoteeName).toLowerCase();
        var status = Utils.sanitizeString(u.attendanceStatus).toLowerCase();
        if (status !== 'present' && status !== 'absent') {
          throw new Error('Attendance status must be Present or Absent');
        }

        var row = members.find(function (m) {
          return normalizeProgramKey_(memberProgramKey_(m)) === pKeyNorm &&
            memberDevoteeName_(m).toLowerCase() === devoteeName &&
            isActiveMember_(m);
        });

        if (!row) {
          throw new Error('Member not found for attendance update: ' + u.devoteeName);
        }

        var currentTotal = Number(firstValue_(row, ['total_sessions', 'totalsessions']) || 0);
        var currentAttended = Number(firstValue_(row, ['attended']) || 0);
        var nextTotal = currentTotal + 1;
        var nextAttended = currentAttended + (status === 'present' ? 1 : 0);
        var pct = nextTotal > 0 ? Math.round((nextAttended / nextTotal) * 100) + '%' : '0%';

        Utils.updateObjectAtRow(APP_CONFIG.SHEETS.TAB2, row.__rowNum, {
          attendance_status: status === 'present' ? 'Present' : 'Absent',
          last_status: status === 'present' ? 'Present' : 'Absent',
          last_attendance_date: now,
          last_att_date: now,
          total_sessions: nextTotal,
          attended: nextAttended,
          attendance_pct: pct,
          updated_at: now,
          updated_on: now,
          updated_by: session.id
        });
        applied += 1;
      });

      Utils.writeLog(session, 'ATTENDANCE_UPDATE', 'tab2', Utils.sanitizeString(programKey), 'SUCCESS', 'Attendance updated', {
        count: applied
      });

      return {
        updatedCount: applied,
        updatedAt: now
      };
    });
  }

  function createPrefillToken_(context) {
    var token = Utils.createToken();
    Utils.putCache(
      APP_CONFIG.CACHE.PREFILL_PREFIX,
      token,
      context,
      APP_CONFIG.CACHE.PREFILL_TTL_SEC
    );
    return token;
  }

  function buildPrefillContext_(route, program, member) {
    var programName = firstValue_(program, ['program_name', 'program', 'name']);
    return {
      route: route,
      programKey: memberProgramKey_(member),
      programName: programName,
      owner: program.program_owner,
      zone: program.zone,
      subArea: program.sub_area,
      city: program.city,
      devoteeName: memberDevoteeName_(member),
      shikshaCode: memberShikshaCode_(member),
      gender: memberGender_(member),
      attendanceStatus: memberAttendanceStatus_(member)
    };
  }

  return {
    getAttendanceMembers: getAttendanceMembers,
    getCertifyRoute: getCertifyRoute,
    getPrefillData: getPrefillData,
    updateAttendance: updateAttendance,
    createPrefillToken_: createPrefillToken_
  };
})();
