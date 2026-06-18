# 🛕 INRJD Unified Attendance + Shiksha

A simple Google Apps Script web app for:
- ✅ Program management
- ✅ Attendance tracking
- ✅ Shiksha and biodata workflow
- ✅ Owner dashboard + Super Admin dashboard

Built for Google Sheets + Google Apps Script (no external backend).

---

## 🌟 Project Logo

🛕 ISKCON NRJD  |  📘 Shiksha  |  📝 Attendance  |  📊 Analytics

---

## 🚀 What This Project Does

### 1) Program Management
- Create and manage programs
- Auto-generate Program Keys
- Store all programs in tab1

### 2) Attendance Tracking
- Owners mark present/absent per devotee
- Attendance metrics are updated directly in tab2 snapshot columns

### 3) Shiksha + Biodata
- Shiksha form and biodata form are integrated
- Certify flow checks existing member data and routes correctly
- tab3 stores Shiksha member records with SCD2 behavior

### 4) Dashboards
- Owner dashboard for program-level tracking
- Super Admin dashboard for org-level analytics

---

## 🧱 Technical Architecture

### Stack
- Google Apps Script (server logic)
- HTML Service (web pages)
- Google Sheets (data store)
- Google Charts (visualization)

### Core Runtime Flow
1. Web app receives request through doGet
2. Route by page parameter
3. HTML page calls Apps Script functions using google.script.run
4. Apps Script reads/writes Google Sheets
5. UI refreshes cards, tables, and charts

### Key Design Choice
This project runs in 3-tab data mode:
- tab1 = Programs
- tab2 = Members + Attendance Snapshot
- tab3 = Shiksha Members (SCD2)

Support tabs still used by app runtime:
- Config
- cred
- Logs

---

## 📄 Google Sheet Structure

## tab1: All Programs
Purpose: Master list of programs.

Recommended columns:
1. PROGRAM KEY
2. AREA
3. SUB_AREA
4. FREQUENCY
5. TYPE_OF_PROGRAM
6. LANGUAGE
7. PROGRAM_OWNER
8. VIRTUAL
9. PROGRAM_START_DATE
10. DAY
11. TIME
12. ACT_FLG
13. PROMOTED
14. COMMENT

---

## tab2: All Members + Attendance Snapshot
Purpose: One row per member per program.

Current schema:
1. ProgramKey
2. ShikshaCode
3. Name
4. TotalSessions
5. Attended
6. AttendancePct
7. LastAttDate
8. LastStatus
9. UpdatedAt

Notes:
- New members begin with temporary ShikshaCode:
  temp_PROGRAMKEY_001
- After first valid biodata submission, real Shiksha code is generated and synced into tab2
- Attendance values are snapshot aggregates, not raw event history

---

## tab3: Shiksha Members (SCD2)
Purpose: Shiksha and biodata records with versioning.

SCD2 logic:
- Old row becomes ACTIVE_FLG = N
- New updated row is inserted with ACTIVE_FLG = Y

Typical columns include:
- SIKSHA CODE
- AADHAR_NO
- NAME
- BV LEADER
- PROGRAM KEY
- SIKSHA STATUS
- ACTIVE_FLG
- and other biodata/form fields

---

## 🔐 Authentication and Roles

- cred tab stores login users
- loginWithRole decides owner vs admin
- Admin users are routed to Super Admin dashboard

---

## 🔁 Certify Flow (Important)

When user clicks Certify:
1. System tries to identify member using tab2 (ProgramKey + ShikshaCode + Name)
2. If member exists in tab3 active profile:
   - Open Shiksha form prefilled
3. If member profile is missing:
   - Open biodata form prefilled with available basics
4. After biodata submit:
   - Generate real Shiksha code
   - Sync real code back into tab2

---

## ⚡ Why Web App Can Feel Slow

Google Apps Script + Google Sheets is simple, but can become slow at scale.

Common reasons:
- Large sheet sizes (many rows/columns)
- Too many read/write calls per request
- Frequent full-sheet scans
- Repeated chart redraws with heavy payloads

Practical speed tips:
1. Prefer batch read and batch write
2. Avoid row-by-row setValue in loops when possible
3. Keep only needed columns in active tabs
4. Archive old rows if sheets become very large
5. Reduce duplicate dashboard calls from frontend
6. Reuse computed data in memory inside one request

---

## 🛠 Deployment Steps

1. Open Apps Script project
2. Verify Spreadsheet ID in Config file
3. Ensure tabs exist with expected headers
4. Deploy as Web App
5. Set access and execute-as options properly
6. Test owner login and admin login flows

---

## 🧪 Quick Validation Checklist

- ✅ Program creation writes to tab1 and tab2
- ✅ Attendance updates tab2 totals and percentage
- ✅ Certify opens correct form
- ✅ Biodata submit updates tab3 (SCD2) and tab2 ShikshaCode sync
- ✅ Owner dashboard loads without errors
- ✅ Super Admin dashboard loads without errors

---

## 🚨 Troubleshooting

Issue: Login works but dashboard not loading
- Check cred tab user entries
- Check browser console for script errors
- Check Logs tab

Issue: Certify opens wrong form
- Verify member row in tab2
- Verify active row in tab3 (ACTIVE_FLG = Y)

Issue: Attendance counts look wrong
- Verify tab2 duplicate member rows for same ProgramKey
- Ensure names are normalized and consistent

Issue: Slow page response
- Reduce sheet size
- Reduce unnecessary sheet reads
- Inspect functions doing full tab scans

---

## 📌 Summary

This project is optimized for practical operations with:
- Simple 3-tab data model
- Clear attendance snapshot logic
- Shiksha SCD2 reliability
- Apps Script friendly architecture

If the team follows the tab schemas and naming consistently, this setup is stable and easy to maintain. 🙏
