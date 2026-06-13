# NRJD Workspace - Unified Project README

## Overview

This workspace contains multiple NRJD-related applications and utilities across web apps, Google Apps Script projects, OCR tools, and OMR processing.

A separate README has been created for each project-relevant subfolder (excluding dependency/system folders such as `node_modules`, `.git`, and virtual environments).

<p align="center">
  <b>Created by Krishna Kayaking</b>
</p>

<p align="center">
  Made with ❤️ using Node.js, Express, React, Vite, Python, Flask, Google Apps Script, Docker, and Capacitor.
</p>

## Tech Stack Logos

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python" />
  <img src="https://img.shields.io/badge/Flask-000000?style=for-the-badge&logo=flask&logoColor=white" alt="Flask" />
  <img src="https://img.shields.io/badge/Google_Apps_Script-4285F4?style=for-the-badge&logo=google-apps-script&logoColor=white" alt="Google Apps Script" />
  <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
  <img src="https://img.shields.io/badge/Capacitor-119EFF?style=for-the-badge&logo=capacitor&logoColor=white" alt="Capacitor" />
</p>

### 📫 Let's Connect

<p align="center">
  <a href="https://www.linkedin.com/in/krishnakayaking/"><img src="https://img.shields.io/badge/LinkedIn-Krishna_Kayaking-0A66C2?style=flat-square&logo=linkedin" /></a>&nbsp;
  <a href="https://www.youtube.com/@TechieKrishnaKayaking"><img src="https://img.shields.io/badge/YouTube-Techie_Krishna_Kayaking-FF0000?style=flat-square&logo=youtube" /></a>&nbsp;
  <a href="https://www.techiekrishnakayaking.com/"><img src="https://img.shields.io/badge/Website-techiekrishnakayaking.com-000?style=flat-square&logo=google-chrome&logoColor=white" /></a>&nbsp;
  <a href="https://topmate.io/techie_krishna_kayaking"><img src="https://img.shields.io/badge/Topmate-Book_a_Session-FFCA28?style=flat-square&logo=bookstack&logoColor=black" /></a>&nbsp;
  <a href="https://www.instagram.com/techiekrishnakayaking/"><img src="https://img.shields.io/badge/Instagram-techiekrishnakayaking-E4405F?style=flat-square&logo=instagram&logoColor=white" /></a>&nbsp;
  <a href="https://play.google.com/store/apps/details?id=co.diaz.ycvkc&hl=en_IN"><img src="https://img.shields.io/badge/Play_Store-Download_App-414141?style=flat-square&logo=google-play&logoColor=white" /></a>
</p>

<p align="center">
  If you're working on <b>data platforms, analytics, BI, or AI-assisted QA</b> and care about <b>quality engineering at scale</b>, feel free to connect or open a discussion on any repo here.
</p>

---

<p align="center">
  <img src="https://komarev.com/ghpvc/?username=techiekrishnakayaking&style=flat-square&color=blue" alt="Profile views" />
</p>

## Top-Level Projects

1. `inrjd_AnandBazaar`
- Full-stack project with Node.js backend and Vite frontend.
- Existing project README: `inrjd_AnandBazaar/README.md`

2. `inrjd_Attendance+Shiksha`
- Attendance and Shiksha application with backend plus Program Management frontend.
- Existing project README: `inrjd_Attendance+Shiksha/README.md`

3. `inrjd_GAS_Prjs`
- Collection of Google Apps Script projects.
- Includes attendance/shiksha, morning announcement, nandotsav planning, and purushotam month modules.

4. `inrjd_japa_session_tool_web-apk`
- Web APK and static web tooling for Japa session workflows.
- Existing project README: `inrjd_japa_session_tool_web-apk/README.md`

5. `inrjd_jbss-dress`
- Python/Flask-based project with image/data resources.
- Existing project README: `inrjd_jbss-dress/README.md`

6. `inrjd_Nandotsav`
- Node.js event management application with routes/controllers/views.

7. `inrjd-OMR`
- OMR processing project with source code, school datasets, and tests.
- Existing project README: `inrjd-OMR/readme.md`

8. `Inrjd_OCR`
- OCR experiments and legacy/current OCR implementations.

## Unified Folder Map (Project-Relevant)

The following map includes all project-relevant folders documented with local README files.

```text
Inrjd_OCR/
  OCR-old/
    Hand-written-equation-detection/
    OCR_HandWritten_Form/
    ocr-python/
  ocr2-working-jun-2024/
    img/
    pdf/

inrjd-OMR/
  school/
    HRNPS/
    MAVK/
    NCS/
    PIS/
    SLIPS/
    SVVK/
    TGEIPS/
    VLSIPS/
    VPA/
    VSIPS/
    zz-pdf/
  src/
    assets/
  test/
    end-to-end/
  typings/
    cv2/
    numpy/

inrjd_AnandBazaar/
  backend/
    config/
    controllers/
    logs/
    middleware/
    models/
    routes/
    seeds/
    services/
    uploads/
    utils/
  frontend/
    public/
    src/
  lord_image/

inrjd_Attendance+Shiksha/
  backend/
    config/
    controllers/
    jobs/
    middleware/
    models/
    routes/
    utils/
  frontend/
    Program Mangement System/

inrjd_GAS_Prjs/
  inrjd_GAS_MorningAnnouncement/
  inrjd_GAS_attendance+Shiksha/
    1new_program/
    2attendance/
    3shiksha/
    unified/
  inrjd_GAS_nandotsavPlanning/
  inrjd_GAS_purushotam_month/
    pdfs/
    req/

inrjd_Nandotsav/
  config/
  controllers/
  partials/
  public/
    CSS/
    image/
    js/
  routes/
  services/
  views/

inrjd_japa_session_tool_web-apk/
  public/
    NRJD_Pics/

inrjd_jbss-dress/
  data/
  images/
  lord_photos/
  static/
```

## How To Use This Documentation

1. Start at each top-level project README for project-specific setup.
2. Use subfolder README files for folder responsibilities and maintenance notes.
3. Update local README files whenever folder usage or ownership changes.

## Notes

- This unified README was created as a central index for the entire workspace.
- Folder-level README creation was automated for consistency and completeness.
