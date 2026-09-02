# ISKCON NRJD — Janmashtami 2026 Volunteer Tag & Allocation Web App

This project contains a Google Apps Script web app designed for the volunteer tag counter and duplicate allocation review workflow used for Janmashtami 2026.

## Actual workbook mapping discovered

The Excel workbook in this project is:

- INRJD Janmashatami 2026 Service Allocation.xlsx

The Google Sheets version should preserve the same sheet names and data structure. The workbook currently contains these real sheets:

### 1) MASTER SPOC List
This sheet is used for high-level service/dept grouping and SPOC metadata.

Observed structure from the workbook:

- Column A: Department / Service / Activity / Team name
- Column B: Primary SPOC
- Column C: Secondary SPOC
- Column D: Volunteer/team list or notes
- Column E: Team Size
- Some date columns follow: 03 Sept, 04 Sept, 05 Sept

### 2) volunteers
This is the live volunteer allocation sheet used by the tag counter.

Observed columns from the workbook:

- Column A: NAME
- Column B: GROUP
- Column C: PHNO
- Column D: DATE
- Column E: TIME
- Column F: TAG
- Column G: PRASADM

This is the primary operational sheet for the web app.

## Project files

The Apps Script project includes:

- Code.gs
- Index.html
- Styles.html
- JavaScript.html
- README.md

## Apps Script architecture

The app is built as a Google Apps Script web app using:

- HtmlService for the UI
- SpreadsheetApp for sheet access
- LockService for safe concurrent tag updates
- google.script.run for client-server interaction

## Security

The required PIN is hard-coded as:

- 108

The app reveals no spreadsheet data until the correct PIN is entered.

## Business features included

- PIN login screen
- Mobile-first volunteer tag counter interface
- Search by volunteer name or phone number
- Partial name and partial phone matching
- Phone normalization for matching common variants such as +91, spaces, etc.
- Tag received check with server-side re-check before update
- Lock-based duplicate prevention against concurrent tag updates
- Duplicate allocation issue detection grouped by normalized phone or name
- Multiple activity alert section with group, date, time, and SPOC metadata
- Live stats for total volunteers, tag received, tag pending, and duplicate activity count

## Deployment instructions

1. Open the Google Sheet that matches the workbook structure.
2. In Google Sheets, go to Extensions → Apps Script.
3. Create a new Apps Script project or replace the default files.
4. Paste the contents of the files in this folder into the Apps Script project:
   - Code.gs
   - Index.html
   - Styles.html
   - JavaScript.html
5. Save the project.
6. Review the authorization prompt and approve the required permissions.
7. In Apps Script, go to Deploy → New deployment.
8. Select Web app.
9. Set Execute as: Me.
10. Set Who has access: Anyone with the link or Only myself depending on your deployment policy.
11. Click Deploy.
12. Copy the generated Web App URL and open it in a browser.

## Required permissions

The script will need access to:

- the active Google Sheet
- script runtime permissions for reading and writing spreadsheet data
- the user session for a safe display of the app and tag updates

## Quick test flow

1. Open the web app and enter 108.
2. Search for a volunteer name or phone number.
3. Confirm the volunteer details render correctly.
4. Click the tag checkbox.
5. The sheet should update immediately with TRUE in the TAG column.
6. Search again and confirm the UI shows a received state.
7. Try a second update to verify that the server rejects duplicate tagging.
8. Visit the Allocation Issues tab to review duplicate volunteers.

## Troubleshooting

### Sheet name mismatch

If the Google Sheet has a differently named volunteer sheet, update the constant in Code.gs:

- CONFIG.VOLUNTEER_SHEET_NAME

### Missing tag column

Run:

- validateSpreadsheetStructure()

This checks for volunteer, name, phone, tag, and master sheet presence.

### Existing workbook structure preserved

This app does not add, delete, rename, reorder, or rebuild the workbook. It only updates the exact record and tag columns needed for operational tagging.

## Notes

- The app uses the Google Sheet as the source of truth.
- It does not hard-code volunteer data.
- It uses a safe row-level check with LockService to prevent concurrent duplicate updates.
- Where matching columns are found, it uses the actual workbook headers instead of assuming fixed column numbers.
