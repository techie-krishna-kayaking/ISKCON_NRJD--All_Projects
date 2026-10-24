# Japa Tool — Web Assets

This is the static web root used by the Node server and Capacitor Android build.

- `index.html` — group chanting session
- `stopwatch.html` — round/lap stopwatch
- `counter.html` — mantra counters
- `manifest.json`, `sw.js` — installable/offline PWA support
- `image-list.json`, `narashima-image-list.json` — generated slideshow indexes
- `NRJD_Pics/`, `NarashimaDev_pics/` — optional slideshow image folders

Edit the relevant page or source assets here. After changing image files, run `npm run gen` from `android_app` so the image lists stay in sync; use `npx cap sync android` before building the APK.
