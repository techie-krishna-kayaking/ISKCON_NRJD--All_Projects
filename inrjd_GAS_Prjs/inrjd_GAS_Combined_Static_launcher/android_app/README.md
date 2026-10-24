# Japa Session Tool — Web and Android

A devotional timer and chanting companion with group-session, stopwatch, and 108-bead counter modes. The web app is served locally by Node.js; Capacitor packages the `public/` site as an Android app.

## Run locally

Requirements: Node.js 18 or newer and npm.

```sh
npm install
npm run dev
```

Open `http://localhost:3000`. The main session is at `/`, the stopwatch at `/stopwatch.html`, and the counters at `/counter.html`.

## Build Android

Place slideshow images in `public/NRJD_Pics/` and, if used, `public/NarashimaDev_pics/`. Generate the image lists and sync the web assets:

```sh
npm run gen
npx cap sync android
```

Build a debug APK with Android Studio or from Windows:

```powershell
cd android
.\gradlew.bat assembleDebug
```

The APK is produced under `android/app/build/outputs/apk/`. The GitHub Actions workflow in `.github/workflows/build-apk.yml` can also build the Android project when its configured trigger runs.

## Project map

- `server.js` — local static web server and image-list generation
- `gen.js` — creates image-list JSON for the slideshows
- `public/` — web app pages, PWA files, and bundled images
- `android/` — Capacitor Android project
- `capacitor.config.json` — app identity and runtime configuration

For offline/PWA testing, use a local server rather than opening the HTML files directly. Review the configured remote server URL and Android signing settings before producing a release build.
