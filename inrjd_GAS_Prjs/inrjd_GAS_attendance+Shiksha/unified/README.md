# NRJD Unified GAS Project

Unified Google Apps Script project combining Program Management, Attendance Tracking, Shiksha Certification, and Analytics Dashboards for ISKCON NRJD.

## What It Does

### 1. Program Management (`?page=program`)
- Create new programs with metadata (area, sub-area, frequency, type, language, day/time, virtual flag).
- Auto-generates unique program keys from owner prefix + incrementing number.
- Populates form dropdowns from the Config sheet.
- Saves program to tab1 and devotees to tab2 using row format: ProgramKey, ShikshaCode, Name.

### 2. Attendance Portal (`?page=attendance`)
- **Login** — authenticates program owners against the `cred` sheet. Super users are redirected to the Admin dashboard.
- **Owner Dashboard** — after login, owners see summary cards (total programs, active count, total members, avg attendance %), a pie chart of members by program type, a horizontal bar chart of members by shiksha level (filtered by BV Leader from tab5 matching the logged-in owner, with `ACTIVE_FLG='Y'`), and a programs table with per-program member count and attendance stats.
- **Needs Attention Center** — owner dashboard now shows programs with no attendance history, stale attendance (>10 days), and pending recommendation counts.
- **Add Program** — owners can add new programs directly from their dashboard via the ➕ Add Program button. The inline form uses the same celestial blue theme (Cinzel/Jost fonts, sky-blue inputs, grouped sections for Location, Program Details, Schedule, Participants). The program owner is auto-set to the logged-in user; all config dropdowns (area, frequency, type, language, etc.) are loaded from the Config sheet.
- **Attendance Recording** — select a program → see devotee table with Present/Absent radios → enter date + host name → submit. Uses upsert: one row per (PROGRAM KEY, DEVOTEE) with running TOTAL_SESSIONS, ATTENDED, PERCENTAGE, LAST_ATT_DATE, HOST_NAME, BV_CHAPTER, LAST_UPDATED.
- **Smart Certify Button** — each devotee row has a 📜 Certify button. A single server call (`prepareCertifyUrl`) performs the lookup, caches prefill data, and returns the full URL — eliminating the previous 3-nested-call chain:
  - **If found in tab5** → opens the Shiksha form with all fields pre-filled (shiksha code, name, current level, etc.) and auto-selects the next certification level.
  - **If not found** → opens the Bio-data form with name, program key, and BV leader pre-filled so the user only needs to complete the remaining fields.
- **Integrated Shiksha Hub** — certify and shiksha are now opened inside the same owner portal via embedded module view (no separate app hopping for the main flow).
- **Add Devotee** — for eligible program types, dynamically add new devotees.
- **Tab5 Member Profile Management** — owners can open member profiles (active tab5 rows for their programs), review details, and submit profile updates (phone, email, city, address, language). Updates follow SCD2 behavior (`ACTIVE_FLG` previous row → `N`, new row inserted as `Y`).
- **Owner Recommendation Submission** — owners can see open super-admin campaigns and submit/modify recommendations per member.

### 3. Shiksha Portal (`?page=shiksha`)
- Search participants by shiksha code, Aadhar, or program key.
- Submit bio-data forms (name, contact, DOB, address, initiated name, etc.).
- Submit shiksha certification forms with level progression.
- **Prefill support** — when opened from the Certify button, the form auto-populates with the devotee's existing data (shiksha mode) or name/program key/BV leader (biodata mode) via server-side `CacheService` token passing.
- Auto-generates shiksha codes from Aadhar prefix + DOB.
- SCD2 pattern — new submissions mark previous rows `ACTIVE_FLG='N'` and insert a new active row.

### 4. Super Admin Dashboard (`?page=admin`)
- **Login gate** — only users in the `SUPER_USERS` array can access.
- **Dashboard page** with:
  - Quick stats bar (active programs, total devotees, program owners, avg attendance, submissions).
  - Key metrics cards (8 cards: active/disabled programs, overdue programs, total owners, etc.).
  - System health panel (operational status, orphan devotees, incomplete programs).
  - Data quality panel (missing phone/email counts with visual bars).
  - Devotee health breakdown: Active (≥80%), Moderate (40–79%), Inactive (<40%).
  - Attendance ops: total submissions, programs not marked, repeated absentees.
  - Google Charts: members by program type (donut), programs by area (donut), programs per owner (bar).
- **Shiksha Analytics page** with:
  - Stats cards (total/active participants, certifications issued, total programs/owners).
  - Participant level distribution (horizontal bars by shiksha level).
  - Level progression funnel (highest → lowest).
  - Certifications by level (horizontal bars).
  - Certification summary (donut chart).
- **Recommendations page** with:
  - Campaign creation (push shiksha date + target level + message to all owners).
  - Recommendation stats (total/pending/approved/rejected).
  - Filterable recommendation list (by campaign, owner, level, status).
  - Evaluation actions (approve/reject/pending), ceremony date + certificate number capture, admin notes.
  - Certificate print payload generation for approved recommendations.
- Sidebar navigation between Dashboard and Shiksha Analytics, plus links to other portals.

## How It Is Implemented

### Architecture
- **Google Apps Script** web app deployed via `doGet()` router in `WebApp.gs`. Uses `createTemplateFromFile()` so URL parameters (e.g., `?certify=token&mode=shiksha`) are passed to HTML templates via `template.urlParams`. The `?page=` query parameter selects which HTML file to serve.
- **Google Sheets** as the database. All data lives in a single spreadsheet with named tabs.
- **Modular `.gs` files** — each file owns one domain (programs, attendance, shiksha, auth, dashboard). No circular dependencies; all share utilities from `Utils.gs` and constants from `Config.gs`.

### Data Model (Sheets)

| Tab | Purpose | Key Columns |
|-----|---------|-------------|
| `Config` | Dropdown values for forms | One column per dropdown |
| `cred` | Login credentials | A=id, B=password |
| `tab1` | Program master data | PROGRAM_KEY, AREA, SUB_AREA, FREQUENCY, TYPE_OF_PROGRAM, LANGUAGE, PROGRAM_OWNER, VIRTUAL, PROGRAM_START_DATE, DAY, TIME, ACT_FLG, PROMOTED, COMMENT |
| `tab2` | Devotee ↔ Program mapping (row format) | ProgramKey, ShikshaCode, Name |
| `attendance` | Per-devotee attendance (upsert) | PROGRAM_KEY, AREA, SUB_AREA, FREQUENCY, TYPE_OF_PROGRAM, LANGUAGE, PROGRAM_OWNER, DEVOTEE, TOTAL_SESSIONS, ATTENDED, PERCENTAGE, LAST_ATT_DATE, HOST_NAME, BV_CHAPTER, LAST_UPDATED |
| `tab5` | Shiksha participant biodata (SCD2) | SHIKSHA_CODE, AADHAR, NAME, PROGRAM_KEY, SIKSHA_STATUS, ACTIVE_FLG, … |
| `tab6` | Certifications | Level, dates, etc. |
| `shiksha_campaigns` | Super-admin push campaigns | CAMPAIGN_ID, SHIKSHA_DATE, TARGET_LEVEL, STATUS, REQUESTED_BY, ... |
| `shiksha_recommendations` | Owner recommendations and admin evaluation | REC_ID, CAMPAIGN_ID, PROGRAM_OWNER, MEMBER_NAME, RECOMMENDED_LEVEL, STATUS, CEREMONY_DATE, CERTIFICATE_NO, ... |
| `Logs` | Auto-created logging | Timestamp, Module, Level, Message |

### Key Patterns

- **Upsert attendance** — `recordAttendance()` reads all rows in batch, builds a composite-key lookup (`PROGRAM_KEY|DEVOTEE`), then either updates in-place or appends new rows. No raw event sheet needed.
- **SCD2 (Slowly Changing Dimension)** — `submitBioForm()` / `submitShikshaData()` mark previous matching rows `ACTIVE_FLG='N'` before inserting a new active row.
- **Role-based routing** — `loginWithRole()` returns `{status, role}`. Super users (defined in `SUPER_USERS` array in `Dashboard.gs`) get `role='admin'` and are redirected to `?page=admin`. Regular owners stay on the attendance portal with their dashboard.
- **Dashboard aggregation** — `getSuperAdminDashboard()` and `getOwnerDashboard()` in `Dashboard.gs` batch-read all tabs once, then compute metrics in memory (no per-row sheet calls). Cross-references programs → devotees → attendance → participants → certifications.
- **Google Charts** — loaded via `https://www.gstatic.com/charts/loader.js`. Donut charts (PieChart with `pieHole: 0.4`), column charts, and bar charts rendered client-side from data returned by GAS backend.
- **Header-agnostic lookups** — `findHeaderIndex_()` tries multiple candidate column names (case-insensitive), making the code resilient to minor header naming differences.
- **Batch reads** — `getAllData_()` reads the entire sheet once; `getHeaderMap_()` caches header positions. No cell-by-cell reads.
- **Logging** — `logInfo_()`, `logWarn_()`, `logError_()` write to both `Logger` and a `Logs` sheet for audit.
- **Cross-page data passing** — `prepareCertifyUrl()` consolidates lookup + cache storage + URL building into a single server call. It uses `CacheService.getScriptCache()` with a UUID token (5-min expiry). The Shiksha page retrieves the prefill data via `getCertifyPrefill(token)` on load, enabling seamless Certify → Shiksha/Biodata transitions without URL param limitations.

## File Structure

| File | Responsibility |
|------|---------------|
| `Config.gs` | Spreadsheet ID, sheet names, column index constants, batch size |
| `Utils.gs` | Shared helpers — spreadsheet access, header mapping, date parsing, logging |
| `Programs.gs` | Program metadata (tab1), program creation, key generation, Config reading |
| `Devotees.gs` | Devotee/program-participation lookups (tab2), adding devotees |
| `Attendance.gs` | Attendance recording with upsert, summary lookups |
| `Auth.gs` | Credential checking + role-based login (`loginWithRole`) |
| `Shiksha.gs` | Shiksha biodata (tab5) — search, validate, SCD2 submissions, `prepareCertifyUrl()` (consolidated lookup + cache + URL), certify prefill cache |
| `Dashboard.gs` | Owner & Super Admin dashboard data aggregation, `SUPER_USERS` config |
| `Workflow.gs` | Owner attention, tab5 member profile updates, campaign push, recommendations, admin evaluation, certificate print payload |
| `Menu.gs` | Custom spreadsheet menu (`NRJD Attendance`) |
| `WebApp.gs` | `doGet()` router — serves HTML templates by `?page=` parameter, passes URL params to templates |
| `AttendancePage.html` | Attendance portal UI — login, owner dashboard with charts, inline Add Program form, attendance recording, smart Certify button |
| `NewProgramPage.html` | New Program form UI |
| `ShikshaPage.html` | Shiksha + Bio-data forms UI |
| `SuperAdminPage.html` | Super Admin portal — dashboard + shiksha analytics with sidebar navigation |

## Setup

1. Create a new Apps Script project at [script.google.com](https://script.google.com).
2. Copy each `.gs` file as a new Script file (File → New → Script).
3. Copy each `.html` file as a new HTML file (File → New → HTML).
4. In `Config.gs`, set `CONFIG_SPREADSHEET_ID` to your Google Sheets ID.
5. Verify sheet names in `SHEET_NAMES` match your actual tab names.
6. In `Dashboard.gs`, update the `SUPER_USERS` array with your admin user IDs.
7. Deploy as a web app (Deploy → New deployment → Web app).

## Web App URLs

| URL Parameter | Page | Access |
|---------------|------|--------|
| `?page=attendance` | Attendance portal (default) | All program owners |
| `?page=program` | New Program form | All users |
| `?page=shiksha` | Shiksha / Bio-data forms | All users |
| `?page=shiksha&certify=TOKEN&mode=shiksha` | Shiksha form with prefill | Via Certify button |
| `?page=shiksha&certify=TOKEN&mode=biodata` | Bio-data form with prefill | Via Certify button |
| `?page=admin` | Super Admin dashboard | Super users only |

## Key Changes from Original 3-Project Setup

- **Unified codebase** — three separate GAS projects consolidated into one with shared utilities and constants.
- **tab3 eliminated** — attendance is recorded directly into the `attendance` sheet using upsert logic. Each (PROGRAM KEY, DEVOTEE) pair has exactly one row with running totals.
- **Smart Certify button** — each devotee's 📜 Certify button now tries tab2 shiksha code first, then tab5 lookup by name: if the devotee exists, opens the Shiksha form with all data pre-filled and next level auto-selected; if not, opens the Bio-data form with name/program key/BV leader pre-filled.
- **Add Program from dashboard** — owners can create new programs directly from their dashboard without switching pages. The owner is auto-assigned.
- **Owner Dashboard** — program owners see charts and metrics immediately after login, before the programs table. The shiksha level bar chart is filtered by BV Leader from tab5 (matching the logged-in owner, active rows only) rather than by program key.
- **Unified theme** — all pages (Attendance, Shiksha, Add Program, Super Admin) share a consistent celestial blue visual identity: Cinzel + Jost fonts, sky-blue/teal/gold palette, light `#F0F7FC` background, glass-card containers, and matching input/button/fieldset styles.
- **Super Admin Dashboard** — full analytics portal with key metrics, system health, devotee health breakdown, attendance ops, shiksha level distribution, and interactive Google Charts.
- **Role-based auth** — `loginWithRole()` detects super users and routes them to the admin portal automatically.
- **Recommendation lifecycle** — super admin can push campaigns, owners submit recommendations, super admin evaluates, and approved records can be used for certificate printing.
