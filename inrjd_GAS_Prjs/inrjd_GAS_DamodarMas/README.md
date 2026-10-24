# Damodar Mas Daily Report

A mobile-friendly Apps Script form for recording Damodar programs, paired with a filtered reporting dashboard.

## Use the app

- Open the web-app URL for the daily report form.
- Choose **Admin dashboard** or open the URL with `?page=dashboard`, then enter the dashboard code configured in `Code.gs`.
- Filter by area, sub-area, program type, and conducted-by. Review lamp, people, and program totals; area/type pies; and daily/cumulative trends.

## Spreadsheet

Submissions are written to the `DM_2026` tab of the configured spreadsheet. The form and dashboard use these columns:

`DATE`, `AREA`, `SUB-AREA`, `TIME`, `HOST`, `CUNDUCTED_BY`, `TYPE_OF_PROGRAM`, `PEOPLE_COUNT`, `LAMP_COUNT`, `DATE_TIME`, `PREACHING_WING`

The existing `CUNDUCTED_BY` spelling is supported. If the sheet header is corrected, keep the script mapping in sync.

## Deploy

1. Confirm `SPREADSHEET_ID` and `DM_2026` in `Code.gs`.
2. Ensure all 11 headers are present in the correct sheet and authorize Sheets access.
3. Save, then deploy a **new version** of the Apps Script web app.
4. Use the deployment’s `/exec` URL; the form and dashboard links are generated from that URL.

The dashboard code is a simple gate, not a substitute for Google account/deployment access controls. Restrict deployment access to the intended audience.
