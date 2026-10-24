# Janmashtami Seva — Volunteer Tag Desk

An Apps Script web app for finding volunteers, recording tag handover, and reviewing duplicate or overlapping allocations.

## Main workflows

- Search volunteers by name or phone, with partial matching and phone normalization.
- Filter the volunteer list and view tag status and summary counts.
- Mark a tag as received; the server rechecks the record and uses a lock to reduce duplicate updates.
- Review possible duplicate allocations and related SPOC information.

## Project files

- `Code.gs` — spreadsheet access, search, validation, and tag updates
- `Index.html` — app shell
- `Styles.html`, `JavaScript.html` — interface styles and client behavior
- `INRJD Janmashatami 2026 Service Allocation.xlsx` — reference workbook

## Configure and deploy

1. In `Code.gs`, replace the spreadsheet ID placeholder with the ID of the live Google Sheet.
2. Confirm the `volunteers` and `MASTER SPOC List` tabs exist and have compatible headers. The app supports several header aliases.
3. Run `validateSpreadsheetStructure()` in the Apps Script editor and resolve any reported sheet/header issues.
4. Save and authorize Sheets access, then deploy as a **Web app** with access appropriate for the volunteer desk.
5. Test volunteer search and a tag update against a test row before live use.

Volunteer names, phone numbers, and allocations are personal data. Keep access restricted and do not include live records or access codes in documentation.
