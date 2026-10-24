# NRJD Prayer App Launcher

A single Apps Script web app that brings the NRJD prayer and devotional tools together:

- **Home** — app launcher
- **Morning prayers** — `?page=morning`
- **Purushotam Month** — `?page=purushotam&lang=en|hi|kn|tl`
- **Arati plates** — `?page=arati`
- **Shlokas** — `?page=shlokas`

The default route opens `home.html`. `Code.gs` routes each page and builds internal links from the deployed web-app URL. Shared content, scripts, and styles are in the `data_*`, `scripts_*`, and `styles_*` HTML files.

## Deploy

1. Add all root-level `.gs` and `.html` files to the same Apps Script project.
2. Save, deploy as a **Web app**, and set access for the intended audience.
3. Test the home page and each `?page=` route from the deployed `/exec` URL.

The companion Android/PWA project is in [`android_app`](./android_app/README.md); it is a separate build and deployment.
