# Nandotsav Planning

An Apps Script web app for coordinating school outreach and Nandotsav program follow-up. Teams can review school contacts, record visits and prelims dates, and maintain class follow-up plans.

## What’s inside

- `Code.gs` — web app entry point and Google Sheets read/write operations
- `index.html`, `styles.html`, `scripts.html` — responsive planning interface
- `rules.html` — planning guidance displayed in the app

The script uses the `School` tab in its configured spreadsheet and creates or uses a `ClassFollowup` tab for class-planning records. Column positions are defined in `Code.gs`; keep the sheet layout in sync with that mapping.

## Run and deploy

1. Open the Apps Script project and confirm `SHEET_ID`, `SHEET_NAME`, and access permissions in `Code.gs`.
2. Ensure the spreadsheet contains the expected school columns and the account running the app can edit it.
3. Save, authorize the required Sheets access, and deploy as a **Web app**.
4. Test reading a school record and saving a visit/follow-up update before sharing the URL.

Updates capture browser/device metadata and may also capture an IP address. Share the app and its data only with the intended team.
