# 🔔 Japa Session Tool

<p align="center">
  <img src="https://img.shields.io/badge/Hare_Krishna-🙏-orange?style=for-the-badge" alt="Hare Krishna"/>
  <img src="https://img.shields.io/badge/Made_with-❤️-red?style=for-the-badge" alt="Made with Love"/>
  <img src="https://img.shields.io/badge/Platform-Web_%7C_Android-blue?style=for-the-badge" alt="Platform"/>
  <img src="https://img.shields.io/badge/Offline-Ready-green?style=for-the-badge" alt="Offline Ready"/>
  <img src="https://img.shields.io/badge/Version-2.1-purple?style=for-the-badge" alt="Version"/>
</p>

<p align="center">
  <em>A distraction-free chanting session tool designed for screen-sharing over Google Meet & individual Japa tracking</em>
</p>

---

## 📥 Download APK

<p align="center">
  <a href="https://github.com/techie-krishna-kayaking/ISKCON_NRJD--All_Projects/releases/latest">
    <img src="https://img.shields.io/badge/📱_Download_APK-Latest-brightgreen?style=for-the-badge&logo=android" alt="Download APK"/>
  </a>
</p>

**Latest Build:** Available in [GitHub Releases](https://github.com/techie-krishna-kayaking/ISKCON_NRJD--All_Projects/releases/latest)

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
- 🕐 **Device Time Display** — Always visible date/time on all pages
- ▶️ **Enhanced Play Button** — Large, prominent, highly visible orange button with smooth animations

### ⏱️ Japa Stopwatch Mode
- 📿 **Lap-based Stopwatch** — Track time per round of chanting
- 🏷️ **Japa 1, Japa 2, Japa 3...** — Each lap labelled as a Japa round
- 🖼️ **Large Photo Slideshow** — Jagannath photos displayed prominently in contained box
- 🕉️ **Mantra Display** — Hare Krishna Maha-mantra always visible
- 🏆 **Fastest / Slowest** — Highlights your best and slowest rounds
- ⏸️ **Pause & Resume** — Pause anytime, resume without losing data
- 📊 **Total & Per-lap times** — See individual round time + cumulative total
- ⌨️ **Shortcuts** — Space (start/pause), L (lap), R (reset), F (fullscreen)
- 🎨 **Clean Left-aligned Layout** — Logo and title positioned on the left, controls on right

### 📿 Dual Counter Mode
- 🔢 **Two counters** — Hare Krishna counter + Narasimha Dev counter
- 🧮 **108 bead logic** — Bead display runs 000 to 107; on next count, rounds increase by 1 and beads reset to 000
- 🧵 **Round tracking** — Shows completed rounds (multiples of 108) and total japa count
- 🦁 **Narasimha mantra display** — Sanskrit + transliteration shown in Narasimha mode
- 🖼️ **Dedicated slideshows** — Hare Krishna uses `NRJD_Pics`, Narasimha uses `NarashimaDev_pics`
- 💾 **Persistent state** — Counter values are saved locally and restored on reopen
- 🕐 **Live Date/Time** — Always-visible device time in top bar

### 🎨 UI/UX Enhancements
- ✅ **Consistent Navigation** — STOPWATCH | SESSION | COUNTER order across all pages
- ✅ **Responsive Layout** — Works seamlessly on mobile, tablet, and desktop
- ✅ **Beautiful Design** — Warm saffron-cream color palette inspired by ISKCON branding
- ✅ **Glass-morphism Effects** — Modern frosted glass aesthetic with backdrop blur
- ✅ **Optimized Visibility** — All buttons and controls clearly visible and easily tappable
- ✅ **Fixed Bottom Navigation** — Always accessible at-a-glance page switcher
- ✅ **Smooth Animations** — Fade-in effects and transitions for polished feel

## 🚀 Quick Start (Web)

```bash
npm install   # one-time setup
node server.js
```

Open **http://localhost:3000** in Chrome 🌐

| Page | URL | Purpose |
|------|-----|---------|
| Group Session | `http://localhost:3000` | Screen-sharing ready japa timer with animated mantra |
| Japa Stopwatch | `http://localhost:3000/stopwatch.html` | Track individual japa round times with slideshow |
| Japa Counter | `http://localhost:3000/counter.html` | 108-bead counter for multiple japa modes |

## 📱 Android APK Installation

### Option 1: Download from GitHub Releases (Recommended)
1. Visit [GitHub Releases](https://github.com/techie-krishna-kayaking/ISKCON_NRJD--All_Projects/releases/latest)
2. Download the latest `app-debug.apk`
3. Transfer to your Android device
4. Open file manager, tap APK to install
5. Grant permissions when prompted
6. Launch from home screen

### Option 2: Build Manually
```bash
npm install
node gen.js                    # generate image-list.json
npx cap sync android           # sync web assets to Android
cd android && ./gradlew assembleDebug
```

APK output: `android/app/build/outputs/apk/debug/app-debug.apk`

### Option 3: Automatic GitHub Actions Build
Simply push to `main` branch → APK builds automatically and is available in the Actions artifacts within minutes!

## 🎨 Latest UI/UX Enhancements (v2.1)

### ✨ What's New
- **Play Button Visibility** ✅ — Enhanced play button on Session page with prominent orange styling, large size (64-76px), and smooth shadow effects
- **Device Time Display** 🕐 — Real-time date/time visible on all pages (MM/DD HH:MM format, updates every 30 seconds)
- **Improved Navigation** 📱 — Consistent STOPWATCH | SESSION | COUNTER layout using CSS Grid for perfect alignment
- **Left-aligned Branding** 🎯 — Logo and page titles positioned on the left side for better visual hierarchy
- **Larger Stopwatch Images** 🖼️ — Deity images now 220-380px (42vh) for better visibility
- **Glass-morphism UI** 💎 — Frosted glass effects with backdrop blur for modern aesthetic
- **Responsive Controls** 🎛️ — All buttons optimized for mobile tap targets and desktop mouse interaction
- **Smooth Animations** ✨ — Fade-in effects and transitions for polished feel

### 🔧 Technical Improvements
- Fixed bottom padding on Session page to prevent control cutoff
- Optimized CSS Grid layout for consistent cross-browser rendering
- Enhanced button shadows and glow effects for depth perception
- Improved flex-wrap handling to keep controls on single line
- Full viewport utilization with proper safe area insets

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

## 🛠️ Tech Stack

- **Frontend:** HTML5, CSS3, JavaScript (Vanilla)
- **Backend:** Node.js + Express
- **Mobile:** Capacitor 6.0.3 (Web → Android bridge)
- **Build:** GitHub Actions CI/CD
- **Fonts:** Cinzel (Sacred), Nunito (UI), Noto Serif Devanagari (Sanskrit)
- **Architecture:** Responsive PWA with offline-first capability

## 📋 Requirements

- **Web:** Chrome, Firefox, Safari, Edge (any modern browser)
- **Mobile:** Android 9+ (for APK)
- **Development:** Node.js 18+, npm 9+, Java 21 (for Android builds)

---

## 👨‍💻 Made by Krishna (Krsnarupa Gaura Das)

<p align="center">
  <a href="https://www.linkedin.com/in/krishnakayaking/"><img src="https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn"/></a>
  <a href="https://www.youtube.com/@TechieKrishnaKayaking"><img src="https://img.shields.io/badge/YouTube-FF0000?style=for-the-badge&logo=youtube&logoColor=white" alt="YouTube"/></a>
  <a href="https://www.instagram.com/techiekrishnakayaking/"><img src="https://img.shields.io/badge/Instagram-E4405F?style=for-the-badge&logo=instagram&logoColor=white" alt="Instagram"/></a>
  <a href="https://www.techiekrishnakayaking.com/"><img src="https://img.shields.io/badge/Website-4285F4?style=for-the-badge&logo=google-chrome&logoColor=white" alt="Website"/></a>
  <a href="https://topmate.io/techie_krishna_kayaking"><img src="https://img.shields.io/badge/Topmate-00C853?style=for-the-badge&logo=bookstack&logoColor=white" alt="Topmate"/></a>
</p>

---

## 📝 Changelog

### v2.1 (Latest)
- ✅ Enhanced play button visibility with prominent styling
- ✅ Added device time display to all pages (MM/DD HH:MM format)
- ✅ Improved navigation layout consistency (CSS Grid)
- ✅ Left-aligned branding on all pages
- ✅ Larger stopwatch image slides (42vh)
- ✅ Fixed bottom padding on Session page
- ✅ Optimized button sizing and spacing

### v2.0
- Added Japa Stopwatch Mode with lap tracking
- Added Dual Counter Mode with 108-bead logic
- Implemented glass-morphism UI design
- Added persistent state management

### v1.0
- Initial release with Group Session Mode
- Screen-sharing optimized for Google Meet
- Temple bell sound with configurable settings

---

## 📄 License

This project is open-source. Feel free to fork, modify, and use for personal or community purposes.

---

<p align="center">
  <strong>🙏 Hare Krishna 🙏</strong>
  <br/>
  <em>May this tool help devotees chant the holy names with focus and devotion</em>
</p>