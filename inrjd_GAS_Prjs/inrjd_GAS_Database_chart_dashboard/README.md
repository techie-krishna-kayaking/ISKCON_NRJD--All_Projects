# NRJD Preaching Dashboard

A Google Apps Script dashboard that summarizes preaching records from a Google Sheet and visualizes stage totals by category and gender.

## Data expected

`Code.gs` reads the `Dashboards` tab and expects the headers `CAT`, `Gender`, `6C`, `Program`, `Source`, and `Numbers`. Rows may contain multiple semicolon-separated program/source/number entries; the script expands these into chartable records.

## Run and deploy

1. Check `SHEET_ID` and `SHEET_NAME` in `Code.gs`.
2. Confirm the `Dashboards` sheet has the required headers and representative data.
3. Save the Apps Script project, authorize Sheets access, and deploy it as a **Web app**.
4. Open the deployment URL and confirm the totals and stage charts match the source sheet.

`index.html` renders the dashboard; `Code.gs` provides `getDashboardData()`. This app reads the sheet for display and does not provide a data-entry workflow.
