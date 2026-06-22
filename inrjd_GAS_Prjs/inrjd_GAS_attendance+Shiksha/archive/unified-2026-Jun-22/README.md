# Unified Temple Program and Shiksha Web App (Google Apps Script)

This folder contains a production-grade single-deployment Google Apps Script web app for owner/admin role-based dashboards with attendance, biodata, shiksha SCD2, and admin analytics.

## Files (Full File-by-File Code)

1. `appsscript.json`: GAS manifest for V8 runtime and web app behavior.
2. `Config.gs`: environment constants, spreadsheet ID, sheet names, and schema headers.
3. `Utils.gs`: utility functions for validation, sheet object mapping, lock handling, cache helpers, and audit logging.
4. `AuthService.gs`: unified login, cache-backed session lifecycle, role enforcement.
5. `ProgramService.gs`: owner program scope enforcement and owner dashboard cards.
6. `AttendanceService.gs`: attendance listing, certify smart-routing, prefill token generation and retrieval.
7. `DevoteeService.gs`: biodata handling, temp-to-real shiksha code conversion, shiksha SCD2 upsert with lock.
8. `AdminService.gs`: admin analytics cards, grouped drill-down aggregations, filterable rows.
9. `SetupScripts.gs`: one-click header setup for all sheets and demo seed data.
10. `Code.gs`: `doGet`, template include helper, and all client-callable API wrapper functions.
11. `App.html`: single-page responsive UI for login, owner dashboard, attendance, biodata/shiksha forms, admin analytics.

## Header Row Setup Script

Run in Apps Script editor:

1. `apiSetupHeaders()` from `Code.gs` wrapper, or directly `SetupScripts.setupHeaders()`
2. This creates/updates sheets and headers for:
   - Config
   - cred
   - tab1
   - tab2
   - tab3
   - Logs

## Seed Sample Data Script

Run in Apps Script editor:

1. `apiSeedDemoData()` from `Code.gs` wrapper, or directly `SetupScripts.seedDemoData()`
2. Default demo credentials inserted if empty:
   - owner: `owner1` / `owner123`
   - admin: `admin1` / `admin123`
3. Inserts one demo program, two members (one temp code, one real code), and one active tab3 record.

## Deployment Steps

1. Open https://script.google.com and create a new Apps Script project.
2. Copy all files from this folder into the project (matching file names).
3. Confirm spreadsheet ID in `Config.gs` is:
   - `1WVeDZ9cofYHn51Q-0mbKzliDlrMQaNMLq-PHQhkkm9E`
4. Run `apiSetupHeaders()` once.
5. Run `apiSeedDemoData()` once.
6. Click Deploy > New deployment > Web app.
7. Execute as: `User deploying the web app`.
8. Who has access: set according to your org policy (for internal apps, domain users).
9. Deploy and open deployment URL.

## Post-Deploy Test Checklist

1. Login as owner and verify owner dashboard only shows owned programs.
2. Open attendance for owned program and verify member list appears.
3. Click Certify for member with temp code and verify biodata form opens first.
4. Submit biodata and verify real shiksha code gets generated and shiksha form opens.
5. Submit shiksha and verify tab3 old active row is set to `N` and new active row is `Y`.
6. Login as admin and verify admin dashboard shows cards and drill-down filters.
7. Apply filter combinations (owner/program/location/gender/status) and verify table and groups update.
8. Confirm `Logs` sheet receives entries for login/logout/certify/biodata/shiksha/seed actions.
9. Let prefill token expire and verify fallback context still loads a usable form.
10. Run concurrent shiksha submissions and verify lock-based SCD2 integrity.

## Acceptance Criteria Mapping

1. One login handles owner and admin:
   - `AuthService.login` + `App.html` unified login form and role branch.
2. Owner sees only owned programs and related members:
   - `ProgramService.getOwnerPrograms`, `ProgramService.enforceProgramAccess`, `AttendanceService.getAttendanceMembers`.
3. Admin sees all data and insights with drill-downs:
   - `AdminService.getAdminDashboard` and admin UI in `App.html`.
4. Certify routing temp vs real:
   - `AttendanceService.getCertifyRoute` with temp regex routing.
5. Prefill reliability with token + fallback:
   - `AttendanceService.getPrefillData` + client fallback handling in `App.html`.
6. No external API dependency for metadata:
   - all metadata generated server-side in GAS (`Utils.nowIso`, session actor fields).
7. Stability under concurrency:
   - lock-protected writes in `DevoteeService.submitBiodata` and `DevoteeService.submitShiksha`.

## Notes

1. For production hardening, replace plain-text password matching with hashed passwords and compare server-side hashes.
2. For larger datasets, move frequent aggregates to cached snapshots or precomputed sheets.
3. If you need strict session revocation across deployments, persist session registry in a dedicated sheet instead of cache-only sessions.
