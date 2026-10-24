/**
 * Admin analytics and drill-down data service.
 */
var AdminService = (function () {
  function getAdminDashboard(sessionToken, filters) {
    AuthService.requireRole(sessionToken, APP_CONFIG.ROLES.ADMIN);

    var filter = normalizeFilters_(filters || {});

    var programs = Utils.readObjects(APP_CONFIG.SHEETS.TAB1).filter(function (p) {
      return Utils.normBoolY(p.active_flg);
    });
    var members = Utils.readObjects(APP_CONFIG.SHEETS.TAB2).filter(function (m) {
      return Utils.normBoolY(m.active_member_flg);
    });
    var tab3Active = Utils.readObjects(APP_CONFIG.SHEETS.TAB3).filter(function (s) {
      return Utils.sanitizeString(s.active_flg).toUpperCase() === 'Y';
    });

    var programByKey = Utils.toMap(programs, 'program_key');
    var shikshaByCode = Utils.toMap(tab3Active, 'shiksha_code');

    var joinedRows = members.map(function (m) {
      var pKey = Utils.sanitizeString(m.program_key);
      var code = Utils.sanitizeString(m.shiksha_code);
      var p = programByKey[pKey] || {};
      var s = shikshaByCode[code] || {};
      return {
        programKey: pKey,
        programName: p.program_name || '',
        owner: p.program_owner || '',
        zone: p.zone || '',
        subArea: p.sub_area || '',
        city: p.city || '',
<<<<<<< HEAD
=======
        day: p.day || '',
        programType: p.type_of_program || p.program_type || '',
        updatedOn: p.updated_on || p.updated_at || p.updatedOn || '',
>>>>>>> origin/main
        devoteeName: m.devotee_name || '',
        shikshaCode: code,
        gender: m.gender || '',
        attendanceStatus: m.attendance_status || '',
        shikshaStatus: s.shiksha_status || 'Not Started',
        shikshaLevel: s.shiksha_level || '',
        activeFlg: m.active_member_flg || 'Y'
      };
    });

    var filtered = joinedRows.filter(function (r) {
      return passesFilter_(r, filter);
    });

    var membersByGender = {};
    var membersByShikshaStatus = {};
    var membersByLocation = {};
<<<<<<< HEAD
=======
    var membersByOwner = {};
    var membersByDay = {};
    var membersByProgramType = {};
>>>>>>> origin/main

    filtered.forEach(function (r) {
      Utils.incrCounter(membersByGender, r.gender || 'Unknown');
      Utils.incrCounter(membersByShikshaStatus, r.shikshaStatus || 'Unknown');
      Utils.incrCounter(membersByLocation, [r.zone || 'NA', r.subArea || 'NA', r.city || 'NA'].join(' > '));
<<<<<<< HEAD
=======
      Utils.incrCounter(membersByOwner, r.owner || 'Unknown');
      Utils.incrCounter(membersByDay, r.day || 'Unknown');
      Utils.incrCounter(membersByProgramType, r.programType || 'Unknown');
>>>>>>> origin/main
    });

    var distinctOwners = {};
    filtered.forEach(function (r) {
      distinctOwners[r.owner || 'Unknown'] = true;
    });

    var distinctPrograms = {};
    filtered.forEach(function (r) {
      distinctPrograms[r.programKey || 'Unknown'] = true;
    });

<<<<<<< HEAD
    return {
      cards: {
        totalPrograms: Object.keys(distinctPrograms).length,
        totalOwners: Object.keys(distinctOwners).length,
        totalMembers: filtered.length,
        activeMembers: filtered.filter(function (r) { return Utils.normBoolY(r.activeFlg); }).length
      },
      groups: {
=======
    var latestUpdated = '';
    filtered.forEach(function (r) {
      if (r.updatedOn && (!latestUpdated || String(r.updatedOn) > String(latestUpdated))) {
        latestUpdated = r.updatedOn;
      }
    });

    return {
      cards: {
        totalPrograms: Object.keys(distinctPrograms).length,
        totalPeople: filtered.length,
        totalOwners: Object.keys(distinctOwners).length,
        lastUpdated: latestUpdated || 'N/A'
      },
      groups: {
        membersByOwner: toKeyValueArray_(membersByOwner),
        membersByDay: toKeyValueArray_(membersByDay),
        membersByProgramType: toKeyValueArray_(membersByProgramType),
>>>>>>> origin/main
        membersByGender: toKeyValueArray_(membersByGender),
        membersByShikshaStatus: toKeyValueArray_(membersByShikshaStatus),
        membersByLocation: toKeyValueArray_(membersByLocation)
      },
      filters: {
        owners: uniqueSorted_(joinedRows, 'owner'),
        programs: uniqueSorted_(joinedRows, 'programKey'),
        zones: uniqueSorted_(joinedRows, 'zone'),
        subAreas: uniqueSorted_(joinedRows, 'subArea'),
        cities: uniqueSorted_(joinedRows, 'city'),
<<<<<<< HEAD
=======
        days: uniqueSorted_(joinedRows, 'day'),
        programTypes: uniqueSorted_(joinedRows, 'programType'),
>>>>>>> origin/main
        genders: uniqueSorted_(joinedRows, 'gender'),
        shikshaStatuses: uniqueSorted_(joinedRows, 'shikshaStatus')
      },
      rows: filtered,
      chartData: {
        byGender: toChartArray_('Gender', membersByGender),
        byStatus: toChartArray_('Shiksha Status', membersByShikshaStatus),
<<<<<<< HEAD
        byLocation: toChartArray_('Location', membersByLocation)
=======
        byLocation: toChartArray_('Location', membersByLocation),
        byOwner: toChartArray_('Owner', membersByOwner),
        byDay: toChartArray_('Day', membersByDay),
        byProgramType: toChartArray_('Program Type', membersByProgramType)
>>>>>>> origin/main
      }
    };
  }

  function normalizeFilters_(filters) {
    return {
      owner: Utils.sanitizeString(filters.owner),
      programKey: Utils.sanitizeString(filters.programKey),
      zone: Utils.sanitizeString(filters.zone),
      subArea: Utils.sanitizeString(filters.subArea),
      city: Utils.sanitizeString(filters.city),
<<<<<<< HEAD
=======
      day: Utils.sanitizeString(filters.day),
      programType: Utils.sanitizeString(filters.programType),
>>>>>>> origin/main
      gender: Utils.sanitizeString(filters.gender),
      shikshaStatus: Utils.sanitizeString(filters.shikshaStatus)
    };
  }

  function passesFilter_(row, filter) {
    return (!filter.owner || row.owner === filter.owner) &&
      (!filter.programKey || row.programKey === filter.programKey) &&
      (!filter.zone || row.zone === filter.zone) &&
      (!filter.subArea || row.subArea === filter.subArea) &&
      (!filter.city || row.city === filter.city) &&
<<<<<<< HEAD
=======
      (!filter.day || row.day === filter.day) &&
      (!filter.programType || row.programType === filter.programType) &&
>>>>>>> origin/main
      (!filter.gender || row.gender === filter.gender) &&
      (!filter.shikshaStatus || row.shikshaStatus === filter.shikshaStatus);
  }

  function toKeyValueArray_(counterMap) {
    return Object.keys(counterMap).sort().map(function (k) {
      return { key: k, value: counterMap[k] };
    });
  }

  function toChartArray_(label, counterMap) {
    var rows = [[label, 'Count']];
    Object.keys(counterMap).sort().forEach(function (k) {
      rows.push([k, counterMap[k]]);
    });
    return rows;
  }

  function uniqueSorted_(rows, field) {
    var seen = {};
    rows.forEach(function (r) {
      var v = Utils.sanitizeString(r[field]);
      if (v) seen[v] = true;
    });
    return Object.keys(seen).sort();
  }

  return {
    getAdminDashboard: getAdminDashboard
  };
})();
