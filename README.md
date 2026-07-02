# NRJD Workspace - Unified Project Catalog

## Overview

This repository is the master workspace for NRJD projects. It contains web apps, mobile tooling, Google Apps Script solutions, media automation, OCR/OMR utilities, and event-management systems.

The workspace intentionally keeps all organization projects in one place, while selected projects can also live in separate shareable repositories.

Current split model:

- Main workspace repo: ISKCON_NRJD--All_Projects
- Shareable standalone repo: inrjd_VideoEditingTool (linked here as a git submodule)

## Tech Stack Overview

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python" />
  <img src="https://img.shields.io/badge/Flask-000000?style=for-the-badge&logo=flask&logoColor=white" alt="Flask" />
  <img src="https://img.shields.io/badge/Google_Apps_Script-4285F4?style=for-the-badge&logo=google-apps-script&logoColor=white" alt="Google Apps Script" />
  <img src="https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/FFmpeg-007808?style=for-the-badge&logo=ffmpeg&logoColor=white" alt="FFmpeg" />
  <img src="https://img.shields.io/badge/OpenCV-5C3EE8?style=for-the-badge&logo=opencv&logoColor=white" alt="OpenCV" />
  <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
  <img src="https://img.shields.io/badge/Capacitor-119EFF?style=for-the-badge&logo=capacitor&logoColor=white" alt="Capacitor" />
</p>

## Top-Level Projects

| Project | Type | Primary Purpose | Stack | Main README |
|---|---|---|---|---|
| inrjd_AnandBazaar | Full-stack web app | Catering/order/stock/invoice management | Node.js, Express, React, Vite, MongoDB | inrjd_AnandBazaar/README.md |
| inrjd_Attendance+Shiksha | Full-stack web app | Attendance + Shiksha progression portal | Node.js, Express, React, Vite, MongoDB | inrjd_Attendance+Shiksha/README.md |
| inrjd_GAS_Prjs | GAS collection | Announcement, attendance, planning, multilingual apps | Google Apps Script, HTML, JS | inrjd_GAS_Prjs/README.md |
| inrjd_japa_session_tool_web-apk | Web + Android tool | Japa timer/counter for sessions and sharing | Node.js, static web, Capacitor | inrjd_japa_session_tool_web-apk/README.md |
| inrjd_jbss-dress | Python web app | Dress calendar and visual search | Python, Flask, CLIP, OpenCV | inrjd_jbss-dress/README.md |
| inrjd_Nandotsav | Node.js app | Event management platform | Node.js, Express | inrjd_Nandotsav/README.md |
| Inrjd_OCR | OCR workspace | Legacy and working OCR experiments | Python, OCR toolchain | Inrjd_OCR/README.md |
| inrjd_VideoEditingTool | Python CLI media tool | Organize, review, render devotional media | Python, FFmpeg, Typer, Rich | inrjd_VideoEditingTool/README.md |
| inrjd-OMR | OMR utility | OMR sheet processing and scoring | Python, OpenCV | inrjd-OMR/readme.md |

## Detailed Subproject and Subfolder Index

## 1) inrjd_AnandBazaar

Primary docs:

- inrjd_AnandBazaar/README.md
- inrjd_AnandBazaar/backend/README.md
- inrjd_AnandBazaar/frontend/README.md

Subfolders:

- backend/config: app/db/auth configuration
- backend/controllers: request handlers
- backend/middleware: auth/error/validation middleware
- backend/models: schema/data models
- backend/routes: API routes
- backend/services: business workflows
- backend/seeds: seed data scripts
- backend/uploads: uploaded media/files
- backend/utils: helpers/utilities
- backend/logs: backend runtime logs
- frontend/public: static assets
- frontend/src: React app source
- lord_image: devotional image resources

## 2) inrjd_Attendance+Shiksha

Primary docs:

- inrjd_Attendance+Shiksha/README.md
- inrjd_Attendance+Shiksha/backend/README.md
- inrjd_Attendance+Shiksha/frontend/README.md
- inrjd_Attendance+Shiksha/frontend/Program Mangement System/README.md

Subfolders:

- backend/config: JWT/OAuth/app configuration
- backend/controllers: auth/admin/attendance/shiksha/analytics handlers
- backend/jobs: scheduled jobs
- backend/middleware: auth and request middleware
- backend/models: data schemas
- backend/routes: API endpoints
- backend/utils: helper utilities (email, OCR, etc.)
- frontend/Program Mangement System: dedicated PM frontend module

## 3) inrjd_GAS_Prjs

Primary docs:

- inrjd_GAS_Prjs/README.md
- inrjd_GAS_Prjs/inrjd_GAS_nandotsavPlanning/README.md
- inrjd_GAS_Prjs/inrjd_GAS_static_WebApps/inrjd_GAS_MorningAnnouncement/README.md
- inrjd_GAS_Prjs/inrjd_GAS_static_WebApps/inrjd_GAS_purushotam_month/README.md

Key subprojects:

- inrjd_GAS_attendance+Shiksha
  - archived unified versions under archive/*
  - includes modular attendance and shiksha logic
- inrjd_GAS_nandotsavPlanning
  - GAS planning UI and rule pages
- inrjd_GAS_static_WebApps/inrjd_GAS_MorningAnnouncement
  - static GAS webapp for announcements
- inrjd_GAS_static_WebApps/inrjd_GAS_combined_launcher
  - Android wrapper and public assets
- inrjd_GAS_static_WebApps/inrjd_GAS_purushotam_month
  - multilingual/static content with pdfs and req subfolders

## 4) inrjd_japa_session_tool_web-apk

Primary docs:

- inrjd_japa_session_tool_web-apk/README.md
- inrjd_japa_session_tool_web-apk/public/README.md
- inrjd_japa_session_tool_web-apk/public/NRJD_Pics/README.md
- inrjd_japa_session_tool_web-apk/android/app/src/main/assets/public/README.md

Subfolders:

- public: web pages and assets for japa session experience
- public/NRJD_Pics: slideshow image assets
- android: Capacitor Android wrapper build

## 5) inrjd_jbss-dress

Primary docs:

- inrjd_jbss-dress/README.md
- inrjd_jbss-dress/data/README.md
- inrjd_jbss-dress/images/README.md
- inrjd_jbss-dress/lord_photos/README.md
- inrjd_jbss-dress/static/README.md

Subfolders:

- data: calendars, mappings, configs
- images: dress image dataset
- lord_photos: temple/lord photos
- static: frontend static resources

## 6) inrjd_Nandotsav

Primary docs:

- inrjd_Nandotsav/README.md
- inrjd_Nandotsav/config/README.md
- inrjd_Nandotsav/controllers/README.md
- inrjd_Nandotsav/routes/README.md
- inrjd_Nandotsav/services/README.md
- inrjd_Nandotsav/views/README.md
- inrjd_Nandotsav/partials/README.md
- inrjd_Nandotsav/public/README.md

Subfolders:

- config: app configuration
- controllers: controller layer
- routes: route definitions
- services: service/business layer
- views: templates
- partials: shared view fragments
- public/CSS, public/js, public/image: static UI assets

## 7) Inrjd_OCR

Primary docs:

- Inrjd_OCR/README.md
- Inrjd_OCR/OCR-old/README.md
- Inrjd_OCR/OCR-old/Hand-written-equation-detection/README.md
- Inrjd_OCR/OCR-old/OCR_HandWritten_Form/README.md
- Inrjd_OCR/OCR-old/ocr-python/README.md
- Inrjd_OCR/ocr2-working-jun-2024/README.md
- Inrjd_OCR/ocr2-working-jun-2024/img/README.md
- Inrjd_OCR/ocr2-working-jun-2024/pdf/README.md

Subfolders:

- OCR-old: legacy OCR experiments and prototypes
- ocr2-working-jun-2024: newer working OCR flow with image/pdf sample buckets

## 8) inrjd_VideoEditingTool

Primary docs:

- inrjd_VideoEditingTool/README.md
- inrjd_VideoEditingTool/docs/README.md

Subfolders:

- src: Python CLI engines and domain modules
- config: application and logging config
- docs: usage and examples
- input: source event media structure
- output: logs, reports, outputs, failed jobs, thumbnails
- tests: pytest coverage

Repository mode:

- This folder is linked in this workspace as a submodule and also maintained as an independent shareable repository.

## 9) inrjd-OMR

Primary docs:

- inrjd-OMR/readme.md
- inrjd-OMR/src/README.md
- inrjd-OMR/src/assets/README.md
- inrjd-OMR/test/README.md
- inrjd-OMR/test/end-to-end/readme.md
- inrjd-OMR/test/end-to-end/rearrangement/readme.md
- inrjd-OMR/typings/README.md
- inrjd-OMR/typings/cv2/README.md
- inrjd-OMR/typings/numpy/readme.md

Subfolders:

- src: core OMR source code
- src/assets: static templates/manual assets
- test/end-to-end: E2E validation scenarios
- typings/cv2 and typings/numpy: typing stubs/support files

## Setup and Run Guide (Quick Commands)

Commands below are based on each project README and common project conventions.

### Node.js full-stack apps

Use for:

- inrjd_AnandBazaar
- inrjd_Attendance+Shiksha
- inrjd_Nandotsav

```bash
cd <project>/backend
npm install
npm start

cd ../frontend
npm install
npm run dev
```

### Google Apps Script projects

Use for:

- inrjd_GAS_Prjs/*

Deployment flow:

1. Open Google Apps Script editor
2. Paste/update Code.gs and linked HTML files
3. Deploy as Web App
4. Share deployed URL

### Python apps and tools

Use for:

- inrjd_jbss-dress
- inrjd_VideoEditingTool
- inrjd-OMR
- Inrjd_OCR (as applicable)

```bash
cd <project>
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Then run project-specific entrypoint from its README, for example:

- python app.py
- python main.py --help
- python3 src/main.py

### Japa web + APK tool

```bash
cd inrjd_japa_session_tool_web-apk
npm install
node server.js
```

## Workspace Navigation Tips

1. Start with the top-level README of the project you need.
2. Follow that project's subfolder README files for module ownership and responsibilities.
3. Ignore dependency/system folders while reading docs (node_modules, .git, .venv, venv, __pycache__).

## Notes

- This README is the central index for all project-owned docs in this workspace.
- Project details are sourced from subproject README files and local folder structure.

---

<p align="center">
  <b>Created by Krishna Kayaking</b>
</p>

<p align="center">
  <a href="https://www.linkedin.com/in/krishnakayaking/"><img src="https://img.shields.io/badge/LinkedIn-Krishna_Kayaking-0A66C2?style=flat-square&logo=linkedin" /></a>&nbsp;
  <a href="https://www.youtube.com/@TechieKrishnaKayaking"><img src="https://img.shields.io/badge/YouTube-Techie_Krishna_Kayaking-FF0000?style=flat-square&logo=youtube" /></a>&nbsp;
  <a href="https://www.techiekrishnakayaking.com/"><img src="https://img.shields.io/badge/Website-techiekrishnakayaking.com-000?style=flat-square&logo=google-chrome&logoColor=white" /></a>&nbsp;
  <a href="https://topmate.io/techie_krishna_kayaking"><img src="https://img.shields.io/badge/Topmate-Book_a_Session-FFCA28?style=flat-square&logo=bookstack&logoColor=black" /></a>&nbsp;
  <a href="https://www.instagram.com/techiekrishnakayaking/"><img src="https://img.shields.io/badge/Instagram-techiekrishnakayaking-E4405F?style=flat-square&logo=instagram&logoColor=white" /></a>&nbsp;
  <a href="https://play.google.com/store/apps/details?id=co.diaz.ycvkc&hl=en_IN"><img src="https://img.shields.io/badge/Play_Store-Download_App-414141?style=flat-square&logo=google-play&logoColor=white" /></a>
</p>


---

## Project Footer

<p align="center">
  <img src="https://img.shields.io/badge/License-MIT-22C55E?style=for-the-badge&logo=open-source-initiative&logoColor=white" />
</p>

<p align="center">
  <strong>License details:</strong><br/>
  MIT License. See LICENSE for complete terms.
</p>

<p align="center">
  <strong>Developed by ISKCON NRJD Tech Team & Tested by ISKCON NRJD Media team.</strong>
</p>

<p align="center">
  <a href="https://www.iskconnrjd.com/"><img src="https://img.shields.io/badge/Website-ISKCON_NRJD-0F766E?style=for-the-badge&logo=google-chrome&logoColor=white" /></a>&nbsp;
  <a href="https://www.instagram.com/iskconbangalorenrjd/"><img src="https://img.shields.io/badge/Instagram-ISKCON_Bangalore_NRJD-E4405F?style=for-the-badge&logo=instagram&logoColor=white" /></a>&nbsp;
  <a href="https://www.youtube.com/channel/UCmoGsHHJiAhRql3mKJnX_bw"><img src="https://img.shields.io/badge/YouTube-ISKCON_NRJD-FF0000?style=for-the-badge&logo=youtube&logoColor=white" /></a>&nbsp;
  <a href="https://www.facebook.com/ISKCONBANGALORENRJD/"><img src="https://img.shields.io/badge/Facebook-ISKCON_Bangalore_NRJD-1877F2?style=for-the-badge&logo=facebook&logoColor=white" /></a>
</p>