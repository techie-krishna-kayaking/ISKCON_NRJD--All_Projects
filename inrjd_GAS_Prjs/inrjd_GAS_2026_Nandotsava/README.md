# Nandotsava 2026 Event Desk

An Apps Script web app for event-day participant lookup, token/check-in workflows, and attendance reporting.

## Main screens

- **Desk** (`Index.html`) — search participants, issue or verify tokens, and record attendance.
- **Dashboard** (`Dashboard.html`) — event, category, school, and medal summaries.
- The dashboard opens with `?page=dashboard`; the default URL opens the desk.

The app reads the configured Google Spreadsheet in `Code.gs`. The included `2026-Nandotsav-Finals.xlsx` is a local workbook/reference copy, not the live Google Sheet. The script expects participant data in `Top3`, `fancydress`, and `Music`, and searches common `MEDALIST` sheet-name variants for medal data.

## Set up and deploy

1. Open the Apps Script project and confirm the spreadsheet ID and tab names in `Code.gs`.
2. Make sure the Google Sheet has the participant headers used by the desk (school, student, group, competition, token, and attendance fields).
3. Save and authorize Spreadsheet access.
4. Deploy as a **Web app** with access limited to the event team; share the desk URL and the dashboard URL separately.
5. Test lookup and check-in using a non-critical test record before event operations.

The desk access code is configured in `Code.gs`. It is a simple gate, not strong authentication; restrict deployment access and avoid exposing participant data publicly.
