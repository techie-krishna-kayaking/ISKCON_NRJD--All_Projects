# inrjd_GAS_Prjs

## Overview

This folder is the central workspace for multiple Google Apps Script projects used for NRJD workflows.
It contains independent apps plus one modular attendance and shiksha system.

## Maintainer

- Name: Krishna Kayaking

## Projects In This Folder

1. inrjd_GAS_MorningAnnouncement
- Purpose: Morning announcement web app and script automation.
- Key files: Code.gs, index.html, data.html, scripts.html, styles.html.

2. inrjd_GAS_attendance+Shiksha
- Purpose: Attendance and Shiksha workflows with both split modules and unified implementation.
- Includes module 1new_program for new program entry flow.
- Includes module 2attendance for attendance flow.
- Includes module 3shiksha for shiksha flow.
- Includes module unified as the combined production-ready modular GAS app.
- Key support files: attendance-db.xlsx, build_attendance_sheet.py, req.txt.

3. inrjd_GAS_nandotsavPlanning
- Purpose: Nandotsav planning app and rules interface.
- Key files: Code.gs, index.html, rules.html, scripts.html, styles.html.

4. inrjd_GAS_purushotam_month
- Purpose: Purushotam month multilingual content and publishing.
- Key files: Code.gs, index.html, data_en.html, data_hi.html, data_kn.html, data_tl.html, scripts.html, styles.html.

## Folder Structure

```text
inrjd_GAS_Prjs/
	inrjd_GAS_MorningAnnouncement/
	inrjd_GAS_attendance+Shiksha/
		1new_program/
		2attendance/
		3shiksha/
		unified/
	inrjd_GAS_nandotsavPlanning/
	inrjd_GAS_purushotam_month/
```

## Common Tech Stack

- Google Apps Script (.gs)
- HTML/CSS/JavaScript for GAS web UI
- Python utility scripts (attendance sheet preparation)
- Spreadsheet-driven data workflows (Excel/Sheets)

## Recommended Workflow

1. Build and test feature changes inside the project-specific folder.
2. Keep UI changes in HTML files and business logic in .gs files.
3. For attendance+shiksha, finalize shared logic in the unified module after validating split modules.
4. Keep supporting data files updated and versioned with related script changes.

## Quick Navigation

- [Morning Announcement](inrjd_GAS_MorningAnnouncement/README.md)
- [Attendance + Shiksha](inrjd_GAS_attendance+Shiksha/README.md)
- [Nandotsav Planning](inrjd_GAS_nandotsavPlanning/README.md)
- [Purushotam Month](inrjd_GAS_purushotam_month/README.md)

## Notes

- This README is intended to act as the index for all GAS projects under this folder.
- Keep each subproject README updated with deployment steps, owners, and config details.
