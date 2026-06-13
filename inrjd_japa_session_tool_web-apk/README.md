# 🔔 Japa Session Tool

<p align="center">
  <img src="https://img.shields.io/badge/Hare_Krishna-🙏-orange?style=for-the-badge" alt="Hare Krishna"/>
  <img src="https://img.shields.io/badge/Made_with-❤️-red?style=for-the-badge" alt="Made with Love"/>
  <img src="https://img.shields.io/badge/Platform-Web_%7C_Android-blue?style=for-the-badge" alt="Platform"/>
  <img src="https://img.shields.io/badge/Offline-Ready-green?style=for-the-badge" alt="Offline Ready"/>
</p>

<p align="center">
  <em>A distraction-free chanting session tool designed for screen-sharing over Google Meet & individual Japa tracking</em>
</p>

---

## ✨ Features

### 🎯 Group Session Mode (Main Page)
- 🖼️ **Slideshow** — Auto-rotating Jagannath images with Ken Burns effect (configurable interval)
- 📿 **Animated Mantra** — Word-by-word bounce highlighting in English, Hindi & Kannada
- ⏱️ **Configurable Timer** — 1 min to 30 min presets + custom duration
- 🔔 **Temple Bell** — Real temple bell sound (plays 3× on timer completion)
- 🔁 **Auto-restart** — Timer automatically resets and starts after bell
- 🎛️ **Controls** — Start, Pause, Reset, Next (bell + reset), Fullscreen, Settings
- ⚙️ **Settings Panel** — Timer duration, slide interval, bell on/off, warning colours
- 📱 **PWA** — Works offline after first load
- ⌨️ **Keyboard Shortcuts** — Full control without touching the mouse

### ⏱️ Japa Stopwatch Mode (NEW)
- 📿 **Lap-based Stopwatch** — Track time per round of chanting
- 🏷️ **Japa 1, Japa 2, Japa 3...** — Each lap labelled as a Japa round
- 🖼️ **Photo Slideshow** — Jagannath photos displayed in a contained box above the timer
- 🕉️ **Mantra Display** — Hare Krishna Maha-mantra always visible
- 🏆 **Fastest / Slowest** — Highlights your best and slowest rounds
- ⏸️ **Pause & Resume** — Pause anytime, resume without losing data
- 📊 **Total & Per-lap times** — See individual round time + cumulative total
- ⌨️ **Shortcuts** — Space (start/pause), L (lap), R (reset), F (fullscreen)

## 🚀 Quick Start (Web)

```bash
npm install   # one-time setup
node server.js
```

Open **http://localhost:3000** in Chrome 🌐

| Page | URL |
|------|-----|
| Group Session | `http://localhost:3000` |
| Japa Stopwatch | `http://localhost:3000/stopwatch.html` |

## 🖼️ Adding Images

Place `.jpg`, `.jpeg`, or `.png` files in the `public/NRJD_Pics/` folder. They will be auto-detected on server start.

## 📱 Android APK Build

### Automatic (GitHub Actions)
Push to `main` branch → APK is built automatically and uploaded as an artifact.

### Manual
```bash
npm install
node gen.js                    # generate image-list.json
npx cap sync android           # sync web assets to Android
cd android && ./gradlew assembleDebug
```

APK output: `android/app/build/outputs/apk/debug/app-debug.apk`

## ⌨️ Keyboard Shortcuts

### Group Session
| Key | Action |
|-----|--------|
| `Space` / `Enter` | ▶️ Start / ⏸ Pause timer |
| `R` | 🔄 Reset timer |
| `N` | ⏭️ Next (play bell + reset) |
| `S` | ⚙️ Open settings |
| `F` | 🖥️ Toggle fullscreen |

### Japa Stopwatch
| Key | Action |
|-----|--------|
| `Space` / `Enter` | ▶️ Start / ⏸ Pause |
| `L` | 📿 Record Lap (Japa round) |
| `R` | 🔄 Reset (when paused) |
| `F` | 🖥️ Toggle fullscreen |

## 💡 Screen Sharing Tips

1. 🌐 Open in Chrome, press `F` for fullscreen
2. 📺 In Google Meet, share the Chrome **tab** (not window) for best quality
3. ⌨️ Use keyboard shortcuts to control without showing UI

---

## 👨‍💻 Made by Krishna

<p align="center">
  <a href="https://www.linkedin.com/in/krishnakayaking/"><img src="https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn"/></a>
  <a href="https://www.youtube.com/@TechieKrishnaKayaking"><img src="https://img.shields.io/badge/YouTube-FF0000?style=for-the-badge&logo=youtube&logoColor=white" alt="YouTube"/></a>
  <a href="https://www.instagram.com/techiekrishnakayaking/"><img src="https://img.shields.io/badge/Instagram-E4405F?style=for-the-badge&logo=instagram&logoColor=white" alt="Instagram"/></a>
  <a href="https://www.techiekrishnakayaking.com/"><img src="https://img.shields.io/badge/Website-4285F4?style=for-the-badge&logo=google-chrome&logoColor=white" alt="Website"/></a>
  <a href="https://topmate.io/techie_krishna_kayaking"><img src="https://img.shields.io/badge/Topmate-00C853?style=for-the-badge&logo=bookstack&logoColor=white" alt="Topmate"/></a>
  <a href="https://play.google.com/store/apps/details?id=co.diaz.ycvkc&hl=en_IN"><img src="https://img.shields.io/badge/Google_Play-414141?style=for-the-badge&logo=google-play&logoColor=white" alt="Google Play"/></a>
</p>

<p align="center">🙏 Hare Krishna 🙏</p>