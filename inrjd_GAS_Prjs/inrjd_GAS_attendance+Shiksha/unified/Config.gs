// ===== File: Config.gs =====
// Responsibility: Central configuration — spreadsheet ID, sheet names, header constants.
// All other modules import constants from here. No mutable global state.

/**
 * TODO: Replace with your actual Google Sheets spreadsheet ID.
 * @const {string}
 */
var CONFIG_SPREADSHEET_ID = '1WVeDZ9cofYHn51Q-0mbKzliDlrMQaNMLq-PHQhkkm9E';

/**
 * Sheet name constants — update if your tabs are named differently.
 * @enum {string}
 */
var SHEET_NAMES = {
  CONFIG:         'Config',
  CRED:           'cred',
  PROGRAMS:       'tab1',
  DEVOTEES:       'tab2',
  // 3-tab mode: tab2 holds member + attendance snapshot, tab3 holds shiksha SCD2.
  PARTICIPANTS:   'tab3',
  CERTIFICATIONS: 'tab6',
  LOGS:           'Logs'
};

/**
 * Column indices (0-based) for tab2 (member + attendance snapshot).
 * @enum {number}
 */
var TAB2_COLS = {
  PROGRAM_KEY:    0,
  SHIKSHA_CODE:   1,
  NAME:           2,
  TOTAL_SESSIONS: 3,
  ATTENDED:       4,
  PERCENTAGE:     5,
  LAST_ATT_DATE:  6,
  LAST_STATUS:    7,
  UPDATED_AT:     8
};

/**
 * tab2 header row values.
 * @const {string[]}
 */
var TAB2_HEADERS = [
  'ProgramKey',
  'ShikshaCode',
  'Name',
  'TotalSessions',
  'Attended',
  'AttendancePct',
  'LastAttDate',
  'LastStatus',
  'UpdatedAt'
];

/**
 * Column indices (0-based) for tab1 (Programs).
 * @enum {number}
 */
var TAB1_COLS = {
  PROGRAM_KEY:        0,
  AREA:               1,
  SUB_AREA:           2,
  FREQUENCY:          3,
  TYPE_OF_PROGRAM:    4,
  LANGUAGE:           5,
  PROGRAM_OWNER:      6,
  VIRTUAL:            7,
  PROGRAM_START_DATE: 8,
  DAY:                9,
  TIME:              10,
  ACT_FLG:           11,
  PROMOTED:          12,
  COMMENT:           13
};

/**
 * Column indices (0-based) for 'attendance' sheet (per-devotee summary).
 * @enum {number}
 */
var ATT_COLS = {
  PROGRAM_KEY:     0,
  AREA:            1,
  SUB_AREA:        2,
  FREQUENCY:       3,
  TYPE_OF_PROGRAM: 4,
  LANGUAGE:        5,
  PROGRAM_OWNER:   6,
  DEVOTEE:         7,
  TOTAL_SESSIONS:  8,
  ATTENDED:        9,
  PERCENTAGE:     10
};

/**
 * Attendance sheet header row values.
 * @const {string[]}
 */
var ATTENDANCE_HEADERS = [
  'PROGRAM KEY', 'AREA', 'SUB_AREA', 'FREQUENCY', 'TYPE_OF_PROGRAM',
  'LANGUAGE', 'PROGRAM_OWNER', 'DEVOTEE', 'TOTAL_SESSIONS', 'ATTENDED', 'PERCENTAGE'
];

/**
 * Batch size for processing large datasets.
 * @const {number}
 */
var BATCH_SIZE = 1000;
