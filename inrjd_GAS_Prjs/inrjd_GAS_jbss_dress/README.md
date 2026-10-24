# JBSS Dress Search

A Google Apps Script app for browsing dress images, assigning calendar dates, managing festival notes, and associating deity photos. Dress images live in Google Drive; calendar and festival records live in Google Sheets.

## Search and data

Search uses descriptive image filenames (keyword matching), not visual/AI search. Use names such as `blue-peacock.jpg` to make images easier to find.

The app creates or uses these tabs:

| Tab | Purpose |
| --- | --- |
| `Calendar` | Date-to-dress assignments |
| `Festivals` | Festival dates, types, and dress notes |
| `LordPhotosMap` | Dress-to-photo associations |

## First-time setup

1. Confirm the Drive folder ID in `Config.gs` and ensure the script owner can access it.
2. In Apps Script, run `setup()` and approve Drive/Sheets permissions. This initializes app configuration and its spreadsheet.
3. Run `importDefaultFestivals()` if the supplied festival calendar is suitable; review dates before using it.
4. Deploy as a **Web app** and set access to match your audience.
5. Change the initial admin password from the app before sharing it. Avoid publishing any password, token, or private Drive link.

Upload image files to the configured Drive folder. If shared viewers need to see images, configure Drive sharing intentionally; anyone-with-link access exposes those files to anyone who receives the link.

## Key files

`Code.gs` serves the app and setup routines. `Config.gs` stores shared settings; `Auth.gs`, `Calendar.gs`, `Festivals.gs`, `Dresses.gs`, and `LordPhotos.gs` implement app features. `index.html` contains the interface.
