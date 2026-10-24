# ISKCON NRJD Apps

Community tools for event operations, preaching, volunteer service, prayer, and devotee education. Each folder is a separate project; check its guide before editing or deploying.

## Active projects

| Project | What it does |
| --- | --- |
| [Nandotsava 2026](./inrjd_GAS_2026_Nandotsava/README.md) | Participant check-in, attendance, and event dashboards |
| [Nandotsav Planning](./inrjd_GAS_nandotsavPlanning/README.md) | School outreach and program/class follow-up |
| [Prayer app launcher](./inrjd_GAS_Combined_Static_launcher/README.md) | Prayer, arati, shlokas, and Purushotam Month Apps Script pages |
| [Damodar Mas](./inrjd_GAS_DamodarMas/README.md) | Daily Damodar program reports and filtered dashboard |
| [Preaching dashboard](./inrjd_GAS_Database_chart_dashboard/README.md) | Preaching totals and stage-wise charts from a Google Sheet |
| [Janmashtami seva](./inrjd_GAS_Janmashtami_Seva_Prasadam/README.md) | Volunteer search, tag status, and allocation review |
| [JBSS Dress Search](./inrjd_GAS_jbss_dress/README.md) | Dress calendar, festival planning, and image browsing |
| [Japa Session Tool for Android](./inrjd_GAS_Combined_Static_launcher/android_app/README.md) | Offline-capable timer, stopwatch, and mantra counters |
| [Attendance + Shiksha archive](./inrjd_GAS_attendance+Shiksha/README.md) | Notes on the historical implementation snapshots |

## Archived projects

Older versions are retained for reference; they are not necessarily the active deployment source.

- [Archive index](./archive/README.md)
- [Morning Announcement (legacy)](./archive/inrjd_GAS_MorningAnnouncement/README.md)
- [Purushotam Month (legacy)](./archive/inrjd_GAS_purushotam_month/README.md)
- [Picnic registration (legacy)](./archive/inrjd_GAS_Forms/Picnic/README.md)

## Working safely

1. Make changes in the project folder that owns the feature.
2. Check its data source, sheet names, and deployment settings before testing.
3. Keep credentials and private participant data out of source control and documentation.
4. Save and test the Apps Script project, then deploy a **new version** to publish changes.
5. Treat archived folders and spreadsheet exports as references unless confirmed otherwise.
