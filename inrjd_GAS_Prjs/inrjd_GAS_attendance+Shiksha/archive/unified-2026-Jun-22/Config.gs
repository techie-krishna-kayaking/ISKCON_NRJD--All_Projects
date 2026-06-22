/**
 * Application constants and sheet schemas.
 */
var APP_CONFIG = {
  SPREADSHEET_ID: '1ptCjbfwu_rrtwMKf4sE3QIVc8Z-Og47BmQ9_KJcGRaY',
  SHEETS: {
    CONFIG: 'Config',
    CRED: 'cred',
    TAB1: 'tab1',
    TAB2: 'tab2',
    TAB3: 'tab3',
    LOGS: 'Logs'
  },
  CACHE: {
    SESSION_PREFIX: 'sess_',
    PREFILL_PREFIX: 'prefill_',
    SESSION_TTL_SEC: 6 * 60 * 60,
    PREFILL_TTL_SEC: 10 * 60
  },
  ROLES: {
    OWNER: 'owner',
    ADMIN: 'admin'
  }
};

var SHEET_HEADERS = {
  Config: [
    'key',
    'value',
    'description'
  ],
  cred: [
    'id',
    'password',
    'role',
    'active_flg',
    'created_on',
    'updated_on'
  ],
  tab1: [
    'program_key',
    'program_name',
    'program_owner',
    'zone',
    'sub_area',
    'city',
    'day',
    'time',
    'frequency',
    'type_of_program',
    'language',
    'virtual',
    'program_start_date',
    'active_flg',
    'created_on',
    'created_by',
    'updated_on',
    'updated_by'
  ],
  tab2: [
    'program_key',
    'devotee_name',
    'shiksha_code',
    'gender',
    'attendance_status',
    'last_attendance_date',
    'quick_notes',
    'active_member_flg',
    'updated_on',
    'updated_by'
  ],
  tab3: [
    'shiksha_code',
    'aadhar',
    'devotee_name',
    'program_key',
    'country',
    'city',
    'preferred_language_of_comm',
    'sub_area',
    'gender',
    'dob',
    'phone',
    'email',
    'address',
    'association_rating',
    'books_rating',
    'chanting_frequency',
    'diet_prasadam',
    'ekadesi_following',
    'family_support',
    'chanting_min_one_round_flg',
    'sp_books_hk_challenge_flg',
    'commitment_one_round_flg',
    'seva',
    'recommended_by',
    'form_filled_by',
    'comments',
    'form_filled_date',
    'user_agent',
    'platform',
    'screen_size',
    'ip_address',
    'shiksha_status',
    'shiksha_level',
    'assessment_score',
    'remarks',
    'active_flg',
    'effective_from',
    'effective_to',
    'created_on',
    'created_by'
  ],
  Logs: [
    'timestamp',
    'actor_id',
    'actor_role',
    'action_type',
    'target_entity',
    'target_key',
    'result',
    'message',
    'payload_json'
  ]
};
