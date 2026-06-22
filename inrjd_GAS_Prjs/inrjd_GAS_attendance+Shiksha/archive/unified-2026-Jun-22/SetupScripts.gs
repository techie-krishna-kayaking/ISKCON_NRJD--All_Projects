/**
 * Setup and seeding scripts for sheet headers and sample data.
 */
var SetupScripts = (function () {
  function setupHeaders() {
    var ss = Utils.getSpreadsheet();
    var created = [];
    var updated = [];

    Object.keys(SHEET_HEADERS).forEach(function (sheetName) {
      var sheet = ss.getSheetByName(sheetName);
      if (!sheet) {
        sheet = ss.insertSheet(sheetName);
        created.push(sheetName);
      }

      var headers = SHEET_HEADERS[sheetName];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      updated.push(sheetName);
    });

    return {
      createdSheets: created,
      updatedHeaders: updated
    };
  }

  function seedDemoData() {
    setupHeaders();

    var now = Utils.nowIso();

    if (Utils.readObjects(APP_CONFIG.SHEETS.CRED).length === 0) {
      Utils.appendObject(APP_CONFIG.SHEETS.CRED, {
        id: 'owner1',
        password: 'owner123',
        role: APP_CONFIG.ROLES.OWNER,
        active_flg: 'Y',
        created_on: now,
        updated_on: now
      });
      Utils.appendObject(APP_CONFIG.SHEETS.CRED, {
        id: 'admin1',
        password: 'admin123',
        role: APP_CONFIG.ROLES.ADMIN,
        active_flg: 'Y',
        created_on: now,
        updated_on: now
      });
    }

    if (Utils.readObjects(APP_CONFIG.SHEETS.TAB1).length === 0) {
      Utils.appendObject(APP_CONFIG.SHEETS.TAB1, {
        program_key: 'PUNE01',
        program_name: 'Pune Youth Morning Satsang',
        program_owner: 'owner1',
        zone: 'West',
        sub_area: 'Pimpri',
        city: 'Pune',
        active_flg: 'Y',
        created_on: now,
        created_by: 'system',
        updated_on: now,
        updated_by: 'system'
      });
    }

    if (Utils.readObjects(APP_CONFIG.SHEETS.TAB2).length === 0) {
      Utils.appendObject(APP_CONFIG.SHEETS.TAB2, {
        program_key: 'PUNE01',
        devotee_name: 'Raghav Das',
        shiksha_code: 'temp_PUNE01_001',
        gender: 'M',
        attendance_status: 'Present',
        last_attendance_date: now,
        quick_notes: 'New member',
        active_member_flg: 'Y',
        updated_on: now,
        updated_by: 'system'
      });
      Utils.appendObject(APP_CONFIG.SHEETS.TAB2, {
        program_key: 'PUNE01',
        devotee_name: 'Gauri Devi',
        shiksha_code: 'PUNE01-S0001',
        gender: 'F',
        attendance_status: 'Absent',
        last_attendance_date: now,
        quick_notes: 'Needs follow-up',
        active_member_flg: 'Y',
        updated_on: now,
        updated_by: 'system'
      });
    }

    if (Utils.readObjects(APP_CONFIG.SHEETS.TAB3).length === 0) {
      Utils.appendObject(APP_CONFIG.SHEETS.TAB3, {
        shiksha_code: 'PUNE01-S0001',
        aadhar: '111122223333',
        devotee_name: 'Gauri Devi',
        program_key: 'PUNE01',
        gender: 'F',
        dob: '1996-09-11',
        phone: '9999999999',
        email: 'gauri@example.com',
        address: 'Pune',
        shiksha_status: 'Level 1',
        shiksha_level: 'L1',
        assessment_score: '82',
        remarks: 'Consistent',
        active_flg: 'Y',
        effective_from: now,
        effective_to: '',
        created_on: now,
        created_by: 'system'
      });
    }

    Utils.writeLog({ id: 'system', role: 'admin' }, 'SEED_DATA', 'all', 'initial', 'SUCCESS', 'Seed script completed');

    return {
      seeded: true,
      defaultUsers: [
        { id: 'owner1', password: 'owner123', role: 'owner' },
        { id: 'admin1', password: 'admin123', role: 'admin' }
      ]
    };
  }

  return {
    setupHeaders: setupHeaders,
    seedDemoData: seedDemoData
  };
})();
