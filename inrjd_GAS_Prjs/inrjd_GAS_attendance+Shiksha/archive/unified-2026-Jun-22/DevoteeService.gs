/**
 * Biodata and shiksha SCD2 service.
 */
var DevoteeService = (function () {
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

  function isActiveMember_(member) {
    var flag = Utils.sanitizeString(firstValue_(member, ['active_member_flg', 'active_flg', 'active', 'status'])).toUpperCase();
    return flag === '' || flag === 'Y' || flag === 'ACTIVE';
  }

  function flagToYN_(value, fallback) {
    if (value === true || value === 'true' || value === 'Y' || value === 'y' || value === 1 || value === '1') {
      return 'Y';
    }
    if (value === false || value === 'false' || value === 'N' || value === 'n' || value === 0 || value === '0') {
      return 'N';
    }
    return fallback || 'N';
  }

  function getActiveShikshaByCode(shikshaCode) {
    var code = Utils.sanitizeString(shikshaCode);
    if (!code) return null;

    var rows = Utils.readObjects(APP_CONFIG.SHEETS.TAB3).filter(function (r) {
      return Utils.sanitizeString(r.shiksha_code) === code && Utils.sanitizeString(r.active_flg).toUpperCase() === 'Y';
    });

    return rows.length ? rows[rows.length - 1] : null;
  }

  function findLatestShikshaByNameAndProgram(devoteeName, programKey) {
    var dName = Utils.sanitizeString(devoteeName);
    var pKey = Utils.sanitizeString(programKey);

    var rows = Utils.readObjects(APP_CONFIG.SHEETS.TAB3).filter(function (r) {
      return Utils.sanitizeString(r.devotee_name) === dName &&
        Utils.sanitizeString(r.program_key) === pKey;
    });

    if (!rows.length) return null;

    rows.sort(function (a, b) {
      return String(a.created_on || '').localeCompare(String(b.created_on || ''));
    });

    return rows[rows.length - 1];
  }

  function submitBiodata(sessionToken, payload) {
    var session = AuthService.requireSession(sessionToken);
    var data = payload || {};

    var programKey = Utils.sanitizeString(data.programKey);
    var devoteeName = Utils.sanitizeString(data.devoteeName);
    var gender = Utils.sanitizeString(data.gender);
    var aadhar = Utils.sanitizeString(data.aadhar);

    Utils.required(programKey, 'Program key');
    Utils.required(devoteeName, 'Devotee name');

    ProgramService.enforceProgramAccess(session, programKey);

    return Utils.withLock(function () {
      var members = Utils.readObjects(APP_CONFIG.SHEETS.TAB2);
      var member = members.find(function (m) {
        return normalizeProgramKey_(memberProgramKey_(m)) === normalizeProgramKey_(programKey) &&
          memberDevoteeName_(m).toLowerCase() === devoteeName.toLowerCase() &&
          isActiveMember_(m);
      });

      if (!member) {
        throw new Error('Member not found for biodata update');
      }

      var currentCode = memberShikshaCode_(member);
      var finalCode = currentCode;
      if (Utils.isTempShikshaCode(currentCode)) {
        finalCode = generateShikshaCode_(programKey);
      }

      var now = Utils.nowIso();
      var ownerId = Utils.sanitizeString(data.owner) || Utils.sanitizeString(session.id);
      Utils.appendObject(APP_CONFIG.SHEETS.TAB3, {
        shiksha_code: finalCode,
        aadhar: aadhar,
        devotee_name: devoteeName,
        program_key: programKey,
        country: Utils.sanitizeString(data.country),
        city: Utils.sanitizeString(data.city),
        preferred_language_of_comm: Utils.sanitizeString(data.preferredLanguageOfComm),
        sub_area: Utils.sanitizeString(data.subArea),
        gender: gender,
        dob: Utils.sanitizeString(data.dob),
        phone: Utils.sanitizeString(data.phone),
        email: Utils.sanitizeString(data.email),
        address: Utils.sanitizeString(data.address),
        association_rating: Utils.sanitizeString(data.associationRating),
        books_rating: Utils.sanitizeString(data.booksRating),
        chanting_frequency: Utils.sanitizeString(data.chantingFrequency),
        diet_prasadam: Utils.sanitizeString(data.dietPrasadam),
        ekadesi_following: Utils.sanitizeString(data.ekadesiFollowing),
        family_support: Utils.sanitizeString(data.familySupport),
        chanting_min_one_round_flg: flagToYN_(data.chantingMinOneRoundFlg, 'N'),
        sp_books_hk_challenge_flg: flagToYN_(data.spBooksHkChallengeFlg, 'N'),
        commitment_one_round_flg: flagToYN_(data.commitmentOneRoundFlg, 'N'),
        seva: Utils.sanitizeString(data.seva),
        recommended_by: Utils.sanitizeString(data.recommendedBy) || ownerId,
        form_filled_by: Utils.sanitizeString(data.formFilledBy) || ownerId,
        comments: Utils.sanitizeString(data.comments),
        form_filled_date: Utils.sanitizeString(data.formFilledDate) || now,
        user_agent: Utils.sanitizeString(data.userAgent),
        platform: Utils.sanitizeString(data.platform),
        screen_size: Utils.sanitizeString(data.screenSize),
        ip_address: Utils.sanitizeString(data.ipAddress) || 'Unavailable',
        shiksha_status: 'Shraddhavan',
        shiksha_level: Utils.sanitizeString(data.shikshaLevel),
        assessment_score: Utils.sanitizeString(data.assessmentScore),
        remarks: Utils.sanitizeString(data.remarks),
        active_flg: 'Y',
        effective_from: now,
        effective_to: '',
        created_on: now,
        created_by: session.id
      });

      if (finalCode !== currentCode) {
        Utils.updateObjectAtRow(APP_CONFIG.SHEETS.TAB2, member.__rowNum, {
          shiksha_code: finalCode,
          gender: gender || firstValue_(member, ['gender', 'sex']),
          updated_on: now,
          updated_by: session.id
        });
      }

      var nextToken = AttendanceService.createPrefillToken_({
        route: 'shiksha',
        programKey: programKey,
        devoteeName: devoteeName,
        shikshaCode: finalCode,
        gender: gender,
        tab3: getActiveShikshaByCode(finalCode)
      });

      Utils.writeLog(session, 'BIODATA_SUBMIT', 'tab3', finalCode, 'SUCCESS', 'Biodata submitted', {
        program_key: programKey,
        devotee_name: devoteeName
      });

      return {
        shikshaCode: finalCode,
        nextPrefillToken: nextToken
      };
    });
  }

  function submitShiksha(sessionToken, payload) {
    var session = AuthService.requireSession(sessionToken);
    var data = payload || {};

    var shikshaCode = Utils.sanitizeString(data.shikshaCode);
    var devoteeName = Utils.sanitizeString(data.devoteeName);
    var programKey = Utils.sanitizeString(data.programKey);

    Utils.required(shikshaCode, 'Shiksha code');
    Utils.required(devoteeName, 'Devotee name');
    Utils.required(programKey, 'Program key');

    ProgramService.enforceProgramAccess(session, programKey);

    return Utils.withLock(function () {
      var now = Utils.nowIso();
      var current = getActiveShikshaByCode(shikshaCode) || {};
      deactivateActiveRows_(shikshaCode, now);

      Utils.appendObject(APP_CONFIG.SHEETS.TAB3, {
        shiksha_code: shikshaCode,
        aadhar: Utils.sanitizeString(data.aadhar) || Utils.sanitizeString(current.aadhar),
        devotee_name: devoteeName,
        program_key: programKey,
        country: Utils.sanitizeString(data.country) || Utils.sanitizeString(current.country),
        city: Utils.sanitizeString(data.city) || Utils.sanitizeString(current.city),
        preferred_language_of_comm: Utils.sanitizeString(data.preferredLanguageOfComm) || Utils.sanitizeString(current.preferred_language_of_comm),
        sub_area: Utils.sanitizeString(data.subArea) || Utils.sanitizeString(current.sub_area),
        gender: Utils.sanitizeString(data.gender) || Utils.sanitizeString(current.gender),
        dob: Utils.sanitizeString(data.dob) || Utils.sanitizeString(current.dob),
        phone: Utils.sanitizeString(data.phone) || Utils.sanitizeString(current.phone),
        email: Utils.sanitizeString(data.email) || Utils.sanitizeString(current.email),
        address: Utils.sanitizeString(data.address) || Utils.sanitizeString(current.address),
        association_rating: Utils.sanitizeString(data.associationRating) || Utils.sanitizeString(current.association_rating),
        books_rating: Utils.sanitizeString(data.booksRating) || Utils.sanitizeString(current.books_rating),
        chanting_frequency: Utils.sanitizeString(data.chantingFrequency) || Utils.sanitizeString(current.chanting_frequency),
        diet_prasadam: Utils.sanitizeString(data.dietPrasadam) || Utils.sanitizeString(current.diet_prasadam),
        ekadesi_following: Utils.sanitizeString(data.ekadesiFollowing) || Utils.sanitizeString(current.ekadesi_following),
        family_support: Utils.sanitizeString(data.familySupport) || Utils.sanitizeString(current.family_support),
        chanting_min_one_round_flg: flagToYN_(data.chantingMinOneRoundFlg, Utils.sanitizeString(current.chanting_min_one_round_flg) || 'N'),
        sp_books_hk_challenge_flg: flagToYN_(data.spBooksHkChallengeFlg, Utils.sanitizeString(current.sp_books_hk_challenge_flg) || 'N'),
        commitment_one_round_flg: flagToYN_(data.commitmentOneRoundFlg, Utils.sanitizeString(current.commitment_one_round_flg) || 'N'),
        seva: Utils.sanitizeString(data.seva) || Utils.sanitizeString(current.seva),
        recommended_by: Utils.sanitizeString(data.recommendedBy) || Utils.sanitizeString(current.recommended_by),
        form_filled_by: Utils.sanitizeString(data.formFilledBy) || Utils.sanitizeString(current.form_filled_by),
        comments: Utils.sanitizeString(data.comments) || Utils.sanitizeString(current.comments),
        form_filled_date: Utils.sanitizeString(data.formFilledDate) || Utils.sanitizeString(current.form_filled_date) || now,
        user_agent: Utils.sanitizeString(data.userAgent) || Utils.sanitizeString(current.user_agent),
        platform: Utils.sanitizeString(data.platform) || Utils.sanitizeString(current.platform),
        screen_size: Utils.sanitizeString(data.screenSize) || Utils.sanitizeString(current.screen_size),
        ip_address: Utils.sanitizeString(data.ipAddress) || Utils.sanitizeString(current.ip_address) || 'Unavailable',
        shiksha_status: Utils.sanitizeString(data.shikshaStatus),
        shiksha_level: Utils.sanitizeString(data.shikshaLevel),
        assessment_score: Utils.sanitizeString(data.assessmentScore),
        remarks: Utils.sanitizeString(data.remarks),
        active_flg: 'Y',
        effective_from: now,
        effective_to: '',
        created_on: now,
        created_by: session.id
      });

      syncTab2QuickFields_(shikshaCode, {
        gender: Utils.sanitizeString(data.gender),
        updated_on: now,
        updated_by: session.id
      });

      Utils.writeLog(session, 'SHIKSHA_SUBMIT', 'tab3', shikshaCode, 'SUCCESS', 'Shiksha saved', {
        devotee_name: devoteeName,
        program_key: programKey
      });

      return {
        shikshaCode: shikshaCode,
        savedAt: now
      };
    });
  }

  function deactivateActiveRows_(shikshaCode, effectiveTo) {
    var rows = Utils.readObjects(APP_CONFIG.SHEETS.TAB3).filter(function (r) {
      return Utils.sanitizeString(r.shiksha_code) === shikshaCode &&
        Utils.sanitizeString(r.active_flg).toUpperCase() === 'Y';
    });

    rows.forEach(function (r) {
      Utils.updateObjectAtRow(APP_CONFIG.SHEETS.TAB3, r.__rowNum, {
        active_flg: 'N',
        effective_to: effectiveTo
      });
    });
  }

  function syncTab2QuickFields_(shikshaCode, patch) {
    var rows = Utils.readObjects(APP_CONFIG.SHEETS.TAB2).filter(function (r) {
      return Utils.sanitizeString(r.shiksha_code) === shikshaCode;
    });

    rows.forEach(function (r) {
      Utils.updateObjectAtRow(APP_CONFIG.SHEETS.TAB2, r.__rowNum, patch);
    });
  }

  function generateShikshaCode_(programKey) {
    var pKey = Utils.sanitizeString(programKey).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6) || 'PRG';
    var rows = Utils.readObjects(APP_CONFIG.SHEETS.TAB3);
    var prefix = pKey + '-S';

    var maxNum = 0;
    rows.forEach(function (r) {
      var code = Utils.sanitizeString(r.shiksha_code);
      if (code.indexOf(prefix) !== 0) return;
      var n = Number(code.replace(prefix, ''));
      if (!isNaN(n)) {
        maxNum = Math.max(maxNum, n);
      }
    });

    var next = maxNum + 1;
    return prefix + ('0000' + next).slice(-4);
  }

  return {
    getActiveShikshaByCode: getActiveShikshaByCode,
    findLatestShikshaByNameAndProgram: findLatestShikshaByNameAndProgram,
    submitBiodata: submitBiodata,
    submitShiksha: submitShiksha
  };
})();
