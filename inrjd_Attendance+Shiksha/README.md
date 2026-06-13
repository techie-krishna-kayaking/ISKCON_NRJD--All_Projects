# 🪷 ISKCON NRJD Member Portal
### ISKCON Magadi Main Road — Internal Program Management System

> A full-stack MERN application for managing spiritual programs, tracking devotee attendance, **Shiksha (spiritual education) progression**, analytics, and internal communications — built exclusively for authorised organisation members.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Repository Structure](#3-repository-structure)
4. [Environment Setup](#4-environment-setup)
5. [Authentication & Roles](#5-authentication--roles)
6. [User Flows](#6-user-flows)
   - 6.1 [Public / Landing](#61-public--landing)
   - 6.2 [SuperAdmin Flow](#62-superadmin-flow)
   - 6.3 [Admin Flow](#63-admin-flow)
   - 6.4 [Owner Flow](#64-owner-flow)
7. [Frontend Architecture](#7-frontend-architecture)
8. [Backend Architecture](#8-backend-architecture)
9. [Database Models](#9-database-models)
10. [API Reference](#10-api-reference)
11. [Key Features In Detail](#11-key-features-in-detail)
    - 11.1 [Attendance System](#111-attendance-system)
    - 11.2 [Screenshot OCR Attendance](#112-screenshot-ocr-attendance)
    - 11.3 [Analytics — Admin](#113-analytics--admin)
    - 11.4 [Analytics — Owner](#114-analytics--owner)
    - 11.5 [Shiksha Module — Spiritual Education Tracking](#115-shiksha-module--spiritual-education-tracking)
    - 11.6 [Chatbot & Messaging](#116-chatbot--messaging)
    - 11.7 [Alert System & Scheduled Reminders](#117-alert-system--scheduled-reminders)
    - 11.8 [Announcements](#118-announcements)
    - 11.9 [System Configuration Management](#119-system-configuration-management)
    - 11.10 [Deactivation Review (SSE)](#1110-deactivation-review-sse)
    - 11.11 [Landing Page](#1111-landing-page)
12. [Data Import from Google Sheets](#12-data-import-from-google-sheets)
13. [Pending: Database Architecture Migration](#13-pending-database-architecture-migration)
14. [Pending: Feature Roadmap](#14-pending-feature-roadmap)
15. [Deployment Notes](#15-deployment-notes)
16. [Bug Fixes & Patches](#16-bug-fixes--patches)

---

## 1. Project Overview

Aaradhana Member Portal is an internal-only web application for program owners affiliated with ISKCON Magadi Main Road. It is **not a public website**. Access is granted only by an admin to verified members.

The system solves four core problems:

- **Attendance Tracking** — Program owners submit attendance after each session. The system stores it, calculates percentages, and flags unhealthy programs automatically.
- **Shiksha (Spiritual Education)** — Track participants through 6 spiritual growth levels (None → Shraddhavan → Krishna Sevak → Krishna Sadhak → Srila Prabhupada Ashraya → Srila Guru Charana Ashraya), manage courses, issue certifications, and create individual growth plans.
- **Analytics & Oversight** — Admin and owner dashboards show program health, devotee activity, trends, heatmaps, shiksha progression funnels, and comparative charts across all programs.
- **Internal Communication** — Owners can message the admin directly through an in-portal chatbot, and admin can reply. No external email dependency.

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18.2 + Vite 5.1 |
| Routing | React Router v6 |
| Styling | Pure CSS-in-JS (no Tailwind, no CSS modules) |
| Auth | JWT tokens + Google OAuth 2.0 (Passport.js) |
| Backend | Node.js + Express 4.18 |
| Database | MongoDB 7.0 + Mongoose 8.0 |
| Security | Helmet (headers), express-rate-limit (100 req/min general, 10 req/15min login) |
| Real-time | Server-Sent Events (SSE) |
| OCR | Tesseract.js (browser-side, CDN) |
| Scheduling | node-cron (daily attendance reminder emails) |
| Data Import | xlsx (for legacy Google Sheets migration) |
| Fonts | Google Fonts — Cinzel, Cinzel Decorative, Crimson Pro, DM Sans, Noto Serif Devanagari |
| Toasts | react-hot-toast |
| Email | Nodemailer (password reset, welcome emails, attendance reminders) |
| Deployment | (your hosting) |

---

## 3. Repository Structure

```
Attendance+Shiksha/
├── README.md
├── attendance-db.xlsx              # Legacy data export from Google Sheets
│
├── backend/
│   ├── package.json
│   ├── server.js                   # Express entry — 18 route modules, Helmet, rate limiter, Passport
│   ├── .env                        # PORT, MONGO_URI, JWT_SECRET, OAuth, Email, FIRST_ADMIN_*
│   │
│   ├── config/
│   │   ├── db.js                   # Mongoose connection
│   │   ├── levelData.js            # Shiksha level definitions & ordering
│   │   └── passport.js             # Google OAuth strategy
│   │
│   ├── controllers/
│   │   ├── authController.js       # login, googleCallback, forgotPassword, resetPassword, changePassword
│   │   ├── adminController.js      # manage users, deactivation requests
│   │   ├── admindashboardController.js  # admin dashboard data aggregation
│   │   ├── adminAnalyticsController.js  # full system attendance analytics (admin view)
│   │   ├── ownerAnalyticsController.js  # program attendance analytics (owner view)
│   │   ├── ownerdashboardController.js  # owner dashboard data aggregation
│   │   ├── attendanceController.js # submit attendance, fetch program attendance
│   │   ├── programController.js    # CRUD programs
│   │   ├── participantController.js # CRUD shiksha participants (biodata)
│   │   ├── courseController.js     # CRUD courses (one per shiksha level)
│   │   ├── certificationController.js # issue certifications, level progression
│   │   ├── growthPlanController.js # individual participant growth plans
│   │   ├── shikshaAnalyticsController.js # shiksha analytics (level distribution, funnels, trends)
│   │   ├── alertController.js      # program health alerts (overdue, low attendance)
│   │   ├── announcementController.js # system-wide announcements
│   │   ├── configController.js     # manage dropdown config values (areas, languages, etc.)
│   │   ├── messageController.js    # owner↔admin messaging system
│   │   └── ProfileController.js    # profile view & programKeyPrefix update
│   │
│   ├── models/
│   │   ├── User.js                 # users (superadmin / admin / owner)
│   │   ├── Program.js              # spiritual programs
│   │   ├── Devotee.js              # devotees per program
│   │   ├── Attendance.js           # raw attendance rows (one per devotee per session)
│   │   ├── AttendanceSummary.js    # per-devotee aggregate summary
│   │   ├── Participant.js          # shiksha participants (biodata, level tracking)
│   │   ├── Course.js               # shiksha courses (one per level)
│   │   ├── Certification.js        # level progression certificates (append-only)
│   │   ├── GrowthPlan.js           # individual spiritual growth plans
│   │   ├── Config.js               # system config (areas, frequencies, languages, etc.)
│   │   ├── ProgramNamesOnly.js     # cached devotee name lists per program
│   │   ├── Announcement.js         # system-wide announcements with priority & expiry
│   │   ├── DeactivationRequest.js  # admin→superadmin deactivation workflow
│   │   ├── message.js              # owner→admin messages + replies
│   │   └── Reminderlog.js          # tracks when attendance reminders were sent
│   │
│   ├── routes/
│   │   ├── auth.js                 # /auth — login, OAuth, password flows
│   │   ├── admin.js                # /admin — user management, deactivation
│   │   ├── program.js              # /programs — CRUD programs
│   │   ├── attendance.js           # /attendance — submit, fetch
│   │   ├── analytics.js            # /analytics — admin & owner analytics
│   │   ├── adminAnalytics.js       # /admin-analytics
│   │   ├── dashboard.js            # /dashboard — admin & owner dashboard data
│   │   ├── participant.js          # /participants — CRUD shiksha participants
│   │   ├── course.js               # /courses — CRUD courses
│   │   ├── certification.js        # /certifications — issue & query certifications
│   │   ├── growthPlan.js           # /growth-plans — participant growth plans
│   │   ├── shikshaAnalytics.js     # /shiksha-analytics — level analytics & overview
│   │   ├── alerts.js               # /alerts — program health alerts
│   │   ├── announcements.js        # /announcements — system announcements
│   │   ├── config.js               # /config — dropdown config management
│   │   ├── messageRoutes.js        # /messages — owner↔admin messaging
│   │   ├── profile.js              # /profile — view & update profile
│   │   └── sse.js                  # /notifications — SSE stream (superadmin)
│   │
│   ├── middleware/
│   │   └── auth.js                 # JWT protect, adminOnly, ownerOnly, superAdminOnly
│   │
│   ├── jobs/
│   │   └── alertScheduler.js       # Daily 9 AM IST attendance reminder cron job
│   │
│   └── utils/
│       ├── generateToken.js        # JWT token generation
│       ├── seedAdmin.js            # Auto-seed first superadmin from env vars
│       ├── seedBvChapters.js       # Seed BV chapter config values
│       ├── sendAttendanceReminder.js # Email template for overdue reminders
│       ├── sendEmail.js            # Nodemailer wrapper
│       ├── sseClients.js           # SSE client connection manager
│       └── importExcel.js          # One-time migration script: Google Sheets → MongoDB
│
└── frontend/
    └── Program Mangement System/
        ├── package.json
        ├── vite.config.js
        ├── index.html
        ├── .env                    # VITE_API_URL=http://localhost:5009
        │
        └── src/
            ├── App.jsx             # All route definitions (25 pages)
            ├── App.css             # Global CSS variables
            ├── index.css
            ├── main.jsx
            │
            ├── api/
            │   └── axios.js        # Configured axios instance (base URL + token interceptor)
            │
            ├── config/
            │   └── api.js          # API_URL constant
            │
            ├── context/
            │   └── AuthContext.jsx  # Global auth state, login/logout/updateAuth
            │
            ├── components/
            │   ├── Appshell.jsx            # Sidebar layout (role-based nav: 12 admin / 6 owner items)
            │   ├── Header.jsx              # Public-facing top header
            │   ├── Footer.jsx              # Public-facing footer
            │   ├── Chatbot.jsx             # Floating spiritual chatbot (owner-only)
            │   ├── GrowthLadder.jsx        # Visual 6-level shiksha progression component
            │   ├── WeeklyScheduleChart.jsx # Weekly program schedule chart
            │   ├── TodayProgramsSection.jsx # Today's programs dashboard widget
            │   ├── ParticipantUpload.jsx   # Zoom/Meet OCR screenshot attendance
            │   ├── PendingDeactivations.jsx # SuperAdmin deactivation review banner
            │   ├── OwnerAlertPanel.jsx     # Owner dashboard alert system
            │   └── ProtectedRoute.jsx      # Route guard (auth + role + mustChangePassword)
            │
            └── pages/
                ├── HomePage.jsx            # Public landing page (slideshow, stats, mantra)
                ├── LoginPage.jsx           # Email/password + Google OAuth login
                ├── PasswordPages.jsx       # ForgotPasswordPage + ResetPasswordPage
                ├── ChangePasswordPage.jsx  # Post-login password change
                ├── AuthCallback.jsx        # Google OAuth redirect handler
                │
                ├── AdminHome.jsx           # Admin greeting/dashboard
                ├── AdminDashboard.jsx      # Admin stats overview
                ├── AdminAnalytics.jsx      # Full admin attendance analytics (3769 lines)
                ├── ShikshaAnalytics.jsx    # Shiksha education analytics dashboard
                ├── AdminMessages.jsx       # Admin inbox for owner messages
                ├── AdminConfig.jsx         # System config management (areas, languages, etc.)
                ├── Adminprofile.jsx        # Admin profile page
                ├── ManageUsers.jsx         # User management + deactivation
                ├── CreateUser.jsx          # Create owner or admin account
                ├── AddProgram.jsx          # Add new program
                │
                ├── ParticipantList.jsx     # Shiksha participant list (search, filter by level)
                ├── ParticipantDetail.jsx   # Participant profile + growth plan + certifications
                ├── CourseManagement.jsx    # Course CRUD (admin)
                │
                ├── OwnerHome.jsx           # Owner greeting/dashboard
                ├── OwnerDashboard.jsx      # Owner profile
                ├── OwnerPrograms.jsx       # Owner's program list
                ├── OwnerAnalytics.jsx      # Owner attendance analytics (2549 lines)
                ├── AttendancePage.jsx       # Mark attendance for a program session
                ├── AttendanceOverview.jsx   # Attendance overview across programs
                │
                └── Notfoundpage.jsx        # 404 page
```

---

## 4. Environment Setup

### Backend `.env`

```env
PORT=5009
MONGO_URI=mongodb://localhost:27017/program_management_system
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173

# First-run superadmin seed (remove after first login)
FIRST_ADMIN_NAME=INRJD TECH
FIRST_ADMIN_EMAIL=admin@nrjd.local
FIRST_ADMIN_PASSWORD=Admin@12345

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5009/auth/google/callback

# Email (Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your@gmail.com
EMAIL_PASS=your_app_password
```

### Frontend `.env`

```env
VITE_API_URL=http://localhost:5009
```

### Prerequisites

- **Node.js** ≥ 18
- **MongoDB** 7.0+ (local or Atlas)

```bash
# macOS (Homebrew)
brew tap mongodb/brew
brew install mongodb-community@7.0
brew services start mongodb-community@7.0
```

### Installation & Run

```bash
# Backend
cd backend
npm install
npm run dev       # nodemon server.js → http://localhost:5009

# Frontend (note: folder name has a typo — "Mangement")
cd frontend/Program\ Mangement\ System
npm install
npm run dev       # Vite dev server → http://localhost:5173
```

On first startup with `FIRST_ADMIN_*` env vars set, the backend auto-seeds a superadmin account. Remove those env vars after first login.

### Seeded Admin Credentials

| Field | Value |
|---|---|
| Email | `admin@nrjd.local` |
| Password | `Admin@12345` |
| Role | superadmin |

---

## 5. Authentication & Roles

The system has **three roles** with distinct permissions:

### Role Hierarchy

```
SuperAdmin  →  Can do everything Admin can + review deactivation requests
Admin       →  Can do everything Owner can + manage all owners/programs/analytics
Owner       →  Can manage their own programs, devotees, attendance, analytics
```

### Role Details

| Capability | Owner | Admin | SuperAdmin |
|---|:---:|:---:|:---:|
| View own programs | ✓ | ✓ | ✓ |
| Mark attendance | ✓ | ✓ | ✓ |
| View own analytics | ✓ | ✓ | ✓ |
| Manage participants (shiksha) | Own only | All | All |
| Issue certifications | Own only | All | All |
| Create/manage growth plans | Own only | All | All |
| View shiksha analytics | ✗ | ✓ | ✓ |
| Manage courses | ✗ | ✓ | ✓ |
| Search devotees | Own only | All | All |
| View all owners' analytics | ✗ | ✓ | ✓ |
| Create / deactivate owners | ✗ | ✓ | ✓ |
| Manage system config | ✗ | ✓ | ✓ |
| Manage announcements | ✗ | ✓ | ✓ |
| Create / deactivate admins | ✗ | ✗ | ✓ |
| Approve deactivation requests | ✗ | ✗ | ✓ |
| View admin messages | ✗ | ✓ | ✓ |
| Real-time SSE notifications | ✗ | ✗ | ✓ |

### Auth Flow

```
1. User visits /login
2a. Email/password → POST /auth/login → JWT returned → stored in localStorage as "pms_token"
2b. Google → GET /auth/google → OAuth callback → JWT returned in redirect → stored
3. JWT attached to all API calls via axios interceptor: Authorization: Bearer <token>
4. On every page load: GET /auth/me → validates token, returns user object
5. Logout: removes token from localStorage → redirects to /
```

### mustChangePassword Flow

When admin creates an owner with a **temporary password**, `mustChangePassword: true` is set. On first login:

```
login → getMe returns mustChangePassword:true
→ ProtectedRoute guard detects flag
→ Redirects to /change-password
→ Owner sets new password
→ PATCH /auth/change-password returns new JWT + user with mustChangePassword:false
→ AuthContext.updateAuth(token, user) called — no logout, no loop
→ Redirects to /owner/dashboard
```

---

## 6. User Flows

### 6.1 Public / Landing

```
Visit / (HomePage)
  ├── Sees premium landing page:
  │   ├── Full-screen slideshow with Ken Burns zoom (4 images)
  │   ├── Scrolling Hare Krishna maha-mantra ticker
  │   ├── Animated stats section (count-up on scroll)
  │   ├── About section with circular shrine image + rotating mantra ring
  │   ├── 6 Programme cards (BV, Gita, Sankirtan, Tulasi, Children, Book Reading)
  │   ├── Sanskrit verse section (SB 1.2.18)
  │   └── Login CTA strip
  │
  ├── Clicks "Member Sign In" → /login
  │   ├── Enter email + password → /admin/dashboard or /owner/dashboard
  │   └── Click "Continue with Google" → Google OAuth → same redirect
  │
  └── Forgot Password:
      /forgot-password → enter email → receives reset link (15min TTL)
      → /reset-password?token=xxx → sets new password → /login
```

### 6.2 SuperAdmin Flow

SuperAdmin has all Admin capabilities plus:

```
Login → /admin/dashboard
  │
  ├── Bell icon (top-right of AppShell) shows LIVE badge
  │   ├── SSE stream connected to /notifications/stream
  │   ├── Badge shows count of pending deactivation requests
  │   └── Dropdown shows each request:
  │       ├── Requested by [Admin name] · [time ago]
  │       ├── Target: [User name] ([role])
  │       ├── Reason: "..."
  │       ├── [✓ Approve] → deactivates user, notifies admin
  │       └── [✕ Reject] → cancels request, notifies admin
  │
  ├── ManageUsers page shows PendingDeactivations banner (same approve/reject)
  │
  └── Can create other admins (not just owners)
```

### 6.3 Admin Flow

```
Login → /admin/dashboard (AdminHome)
  │
  ├── Greeting card: "Good morning, [Name]"
  ├── Quick stats strip
  ├── PendingDeactivations banner (if superadmin)
  │
  ├── Sidebar → Analytics (/admin/analytics)
  │   ├── Hero banner with gradient + eyebrow
  │   ├── 4 KPI strip cards: programs, devotees, sessions, avg%
  │   ├── Program Health Grid — colour-coded cards for every program
  │   │   └── Click any → opens Drilldown Panel:
  │   │       ├── Full session history
  │   │       ├── Monthly trend bars
  │   │       ├── Top/bottom devotees
  │   │       └── Host frequency chart
  │   ├── Monthly Trend chart (12 months)
  │   ├── Attendance Heatmap (90 days, GitHub-style)
  │   ├── 3 Bar Charts: Day vs Programs, Area vs Programs, Area vs Devotee Count
  │   ├── Language Distribution (donut chart)
  │   ├── Overdue Programs list
  │   └── Devotee Search (global, across all owners)
  │
  ├── Sidebar → Shiksha Analytics (/admin/shiksha-analytics)
  │   ├── Summary KPIs: total/active participants, certifications, courses, growth plans
  │   ├── Level Distribution histogram (6 spiritual levels)
  │   ├── Level Progression Funnel (how many reached each stage)
  │   ├── Certifications per Month (last 12 months)
  │   ├── Certifications by Level & by Course
  │   ├── Growth Plan stats (active, completed, on-hold, cancelled)
  │   ├── Owner Insights (participants, certifications, programs per owner)
  │   ├── Recent Certifications (last 20 with level progression arrows)
  │   ├── Top 10 Participants (by certification count)
  │   └── Participants Added per Month (last 12)
  │
  ├── Sidebar → Participants (/admin/participants)
  │   ├── Searchable participant list with level filter
  │   ├── Add new participant form (name, shikshaCode, aadhar, BV leader, etc.)
  │   └── Click participant → /admin/participants/:id
  │       ├── Profile tab: biodata, GrowthLadder visual
  │       ├── Growth Plan tab: create/edit goals with target level & date
  │       └── Certifications tab: issue new certification (level, course, spiritual practice)
  │
  ├── Sidebar → Courses (/admin/courses)
  │   ├── Course list with active/inactive filter
  │   └── Create/edit courses: name, description, level, certificationEnabled
  │
  ├── Sidebar → Config (/admin/config)
  │   ├── Manage dropdown values for: area, subArea, frequency, programType, language, day, bvChapters
  │   └── Add/remove/replace values per config type
  │
  ├── Sidebar → Messages (/admin/messages)
  │   ├── Unread badge count on sidebar nav item
  │   ├── 4 filter tabs: All / Unread 🔴 / Read 🟡 / Replied 🟢
  │   ├── Each message card:
  │   │   ├── Sender name + email + time + category badge
  │   │   ├── Status pill (Unread/Read/Replied)
  │   │   ├── Click to expand → shows message body
  │   │   ├── Inline reply textarea → POST /messages/:id/reply
  │   │   ├── [Done & Delete] → permanently deletes message
  │   │   └── Auto-marks as "read" on expand
  │   └── Stats strip: Unread / Read / Replied / Closed counts
  │
  ├── Sidebar → Create Owner (/admin/create-owner)
  │   ├── Form: name, email, area, language, program key prefix
  │   ├── Set temporary password → mustChangePassword:true
  │   └── Owner receives welcome email
  │
  └── Sidebar → Manage Users (/admin/users)
      ├── List all owners with status badges
      ├── Deactivate: sets pendingApproval:true + deactivatedAt + reason
      │   └── SuperAdmin must approve before account actually locks
      └── Reactivate owners
```

### 6.4 Owner Flow

```
Login → /owner/dashboard (OwnerHome)
  │
  ├── Greeting + Today's Programs strip
  ├── Alert bell (OwnerBell) — shows if programs are overdue
  ├── Quick stats: programs, total sessions, avg%
  │
  ├── Sidebar → Your Programs (/owner/programs)
  │   ├── Cards for each owned program
  │   ├── Health badge (Healthy/Watch/Risk/Critical)
  │   └── [Mark Attendance] button → attendance page
  │
  ├── Sidebar → Attendance Overview (/owner/attendance)
  │   └── Aggregate attendance metrics across owner's programs
  │
  ├── Attendance Page (/owner/attendance/:programId)
  │   ├── All devotees pre-marked as PRESENT
  │   ├── Toggle individual devotees Present/Absent
  │   ├── [+ Add Devotee] button (if program allows)
  │   ├── [📷 Screenshot] button (virtual programs only)
  │   │   ├── Upload Zoom / Meet participants screenshot
  │   │   ├── Tesseract.js OCR reads names in-browser
  │   │   ├── Fuzzy-matches to enrolled devotees
  │   │   ├── Shows 3 sections: Matched / Not Enrolled / Absent
  │   │   ├── [+ Add] button for unmatched names → opens AddDevoteeModal
  │   │   └── [Apply Attendance] → setMarks() updates the form
  │   ├── Fill: Host Name, Date, Chapter (BV programs only)
  │   └── [Submit Attendance] → POST /attendance/submit
  │
  ├── Sidebar → Analytics (/owner/analytics)
  │   ├── Program filter, area filter, date range filter
  │   ├── KPI strip: total programs, devotees, sessions, avg%
  │   ├── Program Health cards
  │   ├── Monthly Trend chart
  │   ├── Attendance Heatmap (90 days)
  │   ├── Overdue programs
  │   └── Devotee Search (own programs only)
  │       ├── Type name → suggestions appear
  │       ├── Select → devotee profile panel:
  │       │   ├── Overall attendance %
  │       │   ├── Status badge: Active 🟢 / Moderate 🟡 / Irregular 🔴
  │       │   ├── Current streak (consecutive present)
  │       │   ├── Month-by-month bars (last 12)
  │       │   └── Last 10 sessions with dates
  │
  ├── Sidebar → Participants (/owner/participants)
  │   ├── View/manage shiksha participants for own programs
  │   ├── Add participant (biodata: name, shikshaCode, aadhar, etc.)
  │   └── Click participant → /owner/participants/:id
  │       ├── Profile tab with GrowthLadder visual
  │       ├── Growth Plan tab: create/edit spiritual growth goals
  │       └── Certifications tab: issue level progression certifications
  │
  └── Floating Chatbot (🪷 button, bottom-right)
      ├── [General Queries] → category tree
      │   ├── 7 categories: Attendance, Programs, Devotees,
      │   │   Analytics, Account, Technical, About
      │   ├── Each category → list of questions → full answer
      │   ├── 44+ Q&A pairs covering all common queries
      │   ├── Free-text search with keyword fuzzy matching
      │   └── "Ask Admin" chip on any answer
      │
      ├── [Message Admin] → form
      │   ├── Category: Question / Feedback / Bug Report / Other
      │   ├── Subject (optional) + Message (required, 2000 char)
      │   └── [Send] → POST /messages → success screen
      │
      └── [My Messages] → (shows unread badge if admin replied)
          ├── Lists all sent messages
          ├── Each expandable: shows original message + admin reply
          ├── "New Reply" badge pulsing for unread replies
          ├── On open: marks all as ownerReadReply:true
          └── Pending messages show "⏳ Admin hasn't replied yet"
```

---

## 7. Frontend Architecture

### Layout System

The app uses two distinct layout shells:

**Public layout** (Header + Footer): Used for `/`, `/login`, `/forgot-password`, `/reset-password`

**AppShell** (Sidebar + Topbar): Used for all `/admin/*` and `/owner/*` routes. Provides:
- Collapsible sidebar with role-based nav items
- Mobile overlay sidebar with hamburger
- Topbar with greeting, notification bell, avatar dropdown
- Messages badge counter on admin sidebar nav
- ChatBot mounted here for owners only: `{user?.role === "owner" && <ChatBot/>}`
- SSE stream for SuperAdmin real-time deactivation notifications

### State Management

No Redux or Zustand. All global state lives in `AuthContext`:

```js
// AuthContext provides:
{
  user,             // full user object from GET /auth/me
  token,            // JWT string
  isAuthenticated,  // boolean
  isAdmin,          // boolean (role === "admin")
  login,            // stores token, fetches user
  logout,           // clears token + user
  updateAuth,       // (token, user) → used by ChangePasswordPage to avoid logout loop
  loginWithCredentials  // email/password flow
}
```

### Route Protection

```jsx
// ProtectedRoute checks:
// 1. isAuthenticated — if not, redirect to /login
// 2. user.mustChangePassword — if true, redirect to /change-password
// 3. role match — admin routes reject owners, owner routes reject admins
```

### CSS Architecture

All CSS is written as template literal strings inside component files — **no external CSS files, no Tailwind, no CSS modules**. Each component injects its styles via `<style>{css}</style>`. CSS variables are used from a global `:root` defined in `index.css` or `App.css`.

Key CSS variables:
```css
--gold: #c8853a;       --gold-light: #e8b96a;
--cream: #fdf8f0;      --text-main: #2a1200;
--text-body: #5a3618;  --amber: #7a3800;
```

---

## 8. Backend Architecture

### Middleware Chain

```
Request
  → cors()
  → express.json()
  → morgan (logging)
  → routes
      → protect() middleware  ← verifies JWT, attaches req.user
          → adminOnly()       ← role guard for admin routes
          → ownerOnly()       ← role guard for owner routes
              → controller function
```

### Auth Middleware Note (SSE)

The SSE endpoint uses a query param token since EventSource doesn't support custom headers:

```js
// In middleware/auth.js protect():
const token = req.headers.authorization?.split(" ")[1] || req.query.token;
```

### Error Handling Pattern

All controllers follow:
```js
try {
  // ... business logic
  res.json({ ... });
} catch (err) {
  console.error("controllerName error:", err);
  res.status(500).json({ message: "Something went wrong." });
}
```

### Email System

Safe wrapper pattern to prevent crashes when email config is missing:

```js
const trySendEmail = async (fn) => {
  try { await fn(); } catch(e) { console.warn("Email failed:", e.message); }
};
const getEmailFns = () => require("../utils/email"); // lazy load
```

---

## 9. Database Models

### User.js

```js
{
  name:               String (required),
  email:              String (unique, required),
  password:           String (hashed, bcrypt),
  role:               enum ["admin", "owner"],
  isSuperAdmin:       Boolean (default: false),
  provider:           enum ["local", "google"],
  googleId:           String,

  // Program metadata (owners)
  programKeyPrefix:   String,  // e.g. "ABC" → programs named ABC-001
  area:               String,
  language:           String,

  // Auth helpers
  mustChangePassword: Boolean (default: false),
  passwordResetToken: String,
  passwordResetExpiry: Date,

  // Deactivation workflow
  isActive:           Boolean (default: true),
  pendingApproval:    Boolean (default: false),  // awaiting SuperAdmin review
  deactivatedAt:      Date,
  deactivatedBy:      ObjectId → User,
  deactivationReason: String,
}
```

### Program.js

```js
{
  owner:        ObjectId → User (required),
  name:         String,
  programKey:   String (unique, e.g. "ABC-001"),
  type:         enum ["BV","Gita Manjari","Book Reading","Tulasi Manjari","Children Program","Gita Learning Program","Other"],
  area:         String,
  subArea:      String,
  language:     String,
  day:          enum ["Monday"..."Sunday","Daily"],
  isVirtual:    Boolean (default: false),
  actFlag:      enum ["active","inactive"],
}
```

### Devotee.js

```js
{
  program:    ObjectId → Program (required),
  owner:      ObjectId → User (required),
  name:       String (required),
  phone:      String,
  createdAt:  Date,  // used for mid-program join detection
}
```

### Attendance.js (current — pending migration)

```js
// One document per devotee per session submission
{
  program:    ObjectId → Program,
  owner:      ObjectId → User,
  devotee:    ObjectId → Devotee,
  devoteeId:  ObjectId,
  date:       Date,
  present:    Boolean,
  hostName:   String,
  chapter:    String,
  submittedAt: Date,
}
```

### AttendanceSummary.js (operational table)

```js
// One document per devotee per program — aggregate
{
  program:        ObjectId → Program,
  owner:          ObjectId → User,
  devotee:        ObjectId → Devotee,
  devoteeName:    String,
  totalSessions:  Number,
  attended:       Number,
  percentage:     Number,
  lastSession:    Date,
  lastPresent:    Date,
}
```

### Message.js

```js
{
  senderId:      ObjectId → User (owner),
  senderName:    String,
  senderEmail:   String,
  category:      enum ["Question","Feedback","Bug Report","Other"],
  subject:       String (max 120),
  message:       String (required, max 2000),
  reply:         String (max 1000, set by admin),
  repliedAt:     Date,
  repliedBy:     ObjectId → User (admin),
  ownerReadReply: Boolean (default: false),  // owner has read admin's reply
  status:        enum ["unread","read","replied","closed"],
  readAt:        Date,
}
```

### Participant.js (Shiksha)

```js
{
  name:           String (required, 2-100 chars),
  shikshaCode:    String (unique, uppercase),
  programKey:     String,
  aadharNumber:   String,
  bvLeader:       String,
  gender:         enum ["Male","Female","Other"],
  email:          String,
  contactNumber:  String,
  dob:            Date,
  address:        String,
  language:       String,
  currentLevel:   enum ["None","Shraddhavan","Krishna Sevak","Krishna Sadhak",
                        "Srila Prabhupada Ashraya","Srila Guru Charana Ashraya"],
  activeFlag:     Boolean (default: true),
  addedAt:        Date,
  programOwner:   ObjectId → User,
  createdBy:      ObjectId → User,
}
// Indexes: programOwner, programKey, text(name + shikshaCode) with language_override, activeFlag
```

### Course.js

```js
{
  name:                  String (required, unique, 150 char max),
  description:           String,
  level:                 enum ["Shraddhavan","Krishna Sevak","Krishna Sadhak",
                                "Srila Prabhupada Ashraya","Srila Guru Charana Ashraya"],
  certificationEnabled:  Boolean (default: true),
  active:                Boolean (default: true),
  createdBy:             ObjectId → User,
}
```

### Certification.js (append-only)

```js
{
  participant:          ObjectId → Participant (required),
  course:              ObjectId → Course (required),
  certificationLevel:  enum (required),
  certificationDate:   Date (required),
  recommendedBy:       String,
  filledBy:            String,
  currentLevelBefore:  String,
  newLevelAfter:       String,
  // Spiritual practice fields:
  chanting:            String,
  books:               String,
  commitments:         String,
  seva:                String,
  // Level codes:
  aCode: String, bCode: String, cCode: String,
  dCode: String, eCode: String, fCode: String,
  declarationAccepted: Boolean,
  metadataJson:        Mixed,
}
// Indexes: participant+date, course, certificationLevel
```

### GrowthPlan.js

```js
{
  participant:   ObjectId → Participant (required),
  goalTitle:     String (max 200),
  description:   String,
  targetLevel:   enum (default: "Shraddhavan"),
  targetDate:    Date,
  status:        enum ["active","completed","on-hold","cancelled"],
  createdBy:     ObjectId → User,
  updatedBy:     ObjectId → User,
}
// Index: participant+status
```

### Config.js

```js
{
  type:    enum ["area","subArea","frequency","programType","language","day","bvChapters"] (unique),
  values:  [String],
}
```

### ProgramNamesOnly.js

```js
{
  program:  ObjectId → Program (unique, required),
  names:    [String],  // cached devotee name list for quick lookup
}
```

### Announcement.js

```js
{
  text:       String (required),
  isActive:   Boolean (default: true),
  priority:   enum ["high","medium","info"],
  createdBy:  ObjectId → User,
  expiresAt:  Date (optional — null = never expires),
}
```

### DeactivationRequest.js

```js
{
  targetUser:     ObjectId → User (required),
  requestedBy:    ObjectId → User (required),
  reason:         String,
  status:         enum ["pending","approved","rejected"],
  resolvedAt:     Date,
  resolutionNote: String,
}
```

### Reminderlog.js

```js
{
  program:     ObjectId → Program (unique),
  programKey:  String,
  lastSentAt:  Date (required),
  sentCount:   Number (default: 1),
  alertType:   String (default: "OVERDUE_ATTENDANCE"),
}
```

---

## 10. API Reference

### Auth Routes — `/auth`

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| POST | `/auth/login` | Public | Email/password login. Returns `{token, user}` |
| GET | `/auth/google` | Public | Redirect to Google OAuth |
| GET | `/auth/google/callback` | Public | OAuth callback, redirects with token |
| GET | `/auth/me` | Protected | Get current user object |
| POST | `/auth/forgot-password` | Public | Send reset email |
| POST | `/auth/reset-password` | Public | Reset via token. Returns `{token, user}` |
| PATCH | `/auth/change-password` | Protected | Change password. Returns `{token, user}` |

### Admin Routes — `/admin`

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| GET | `/admin/users` | Admin | List all owners |
| POST | `/admin/create-owner` | Admin | Create owner account |
| PATCH | `/admin/deactivate/:id` | Admin | Request deactivation |
| GET | `/admin/deactivation-requests/pending` | SuperAdmin | List pending requests |
| POST | `/admin/deactivation-requests/:id/approve` | SuperAdmin | Approve deactivation |
| POST | `/admin/deactivation-requests/:id/reject` | SuperAdmin | Reject request |

### Dashboard Routes — `/dashboard`

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| GET | `/dashboard/owner` | Protected | Owner dashboard data |
| GET | `/dashboard/admin` | Admin | Admin dashboard data |

### Analytics Routes — `/analytics`

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| GET | `/analytics/admin` | Admin | Full system analytics |
| GET | `/analytics/owner` | Owner | Own program analytics |
| GET | `/analytics/owner/drilldown/:programId` | Owner | Detailed program drilldown |
| GET | `/analytics/owner/devotee` | Owner | Devotee search (own programs) |
| GET | `/analytics/owner/devotee/suggest` | Owner | Devotee name autocomplete |

### Shiksha Analytics Routes — `/shiksha-analytics`

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| GET | `/shiksha-analytics/level-data` | Protected | Level configuration, ordering, next-level mapping |
| GET | `/shiksha-analytics/overview` | Admin | System-wide shiksha analytics (levels, funnels, trends) |
| GET | `/shiksha-analytics/participant/:id` | Protected | Individual participant analytics & level journey |

### Participant Routes — `/participants`

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| GET | `/participants` | Protected | List participants (search, filter by level) |
| GET | `/participants/:id` | Protected | Get participant detail |
| POST | `/participants` | Protected | Create participant (biodata) |
| PATCH | `/participants/:id` | Protected | Update participant |

### Course Routes — `/courses`

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| GET | `/courses` | Protected | List courses (filterable by active) |
| GET | `/courses/:id` | Protected | Get single course |
| POST | `/courses` | Admin | Create course |
| PATCH | `/courses/:id` | Admin | Update course |

### Certification Routes — `/certifications`

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| GET | `/certifications/levels` | Protected | Get certification level order |
| GET | `/certifications/participant/:id` | Protected | Certification history for a participant |
| GET | `/certifications/course/:id` | Protected | All certifications for a course |
| POST | `/certifications` | Protected | Issue new certification (no downgrades) |

### Growth Plan Routes — `/growth-plans`

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| GET | `/growth-plans/participant/:id` | Protected | List plans for a participant |
| POST | `/growth-plans` | Protected | Create growth plan |
| PUT | `/growth-plans/:id` | Protected | Update growth plan |

### Alert Routes — `/alerts`

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| GET | `/alerts/owner` | Protected | Owner's program health alerts |
| GET | `/alerts/overview` | Protected | Attendance overview metrics |
| GET | `/alerts/program/:id` | Protected | Health status for a single program |

### Announcement Routes — `/announcements`

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| GET | `/announcements` | Protected | Get active announcements (max 5) |
| GET | `/announcements/all` | Admin | Get all announcements (including inactive) |
| POST | `/announcements` | Admin | Create announcement |
| PATCH | `/announcements/:id/toggle` | Admin | Toggle active/inactive |
| DELETE | `/announcements/:id` | Admin | Delete announcement |

### Config Routes — `/config`

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| GET | `/config` | Protected | Get all config types |
| GET | `/config/:type` | Protected | Get specific config type values |
| POST | `/config/:type/add` | Admin | Add value to config type |
| DELETE | `/config/:type/remove` | Admin | Remove value from config type |
| PUT | `/config/:type` | Admin | Replace all values for config type |

### Profile Routes — `/profile`

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| GET | `/profile` | Protected | Get own profile |
| PATCH | `/profile` | Protected | Update programKeyPrefix |

### Message Routes — `/messages`

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| POST | `/messages` | Owner | Send message to admin |
| GET | `/messages/mine` | Owner | Get own message history |
| GET | `/messages/my-unread-count` | Owner | Count of unread admin replies |
| PATCH | `/messages/:id/owner-read` | Owner | Mark admin reply as read |
| GET | `/messages` | Admin | List all messages |
| GET | `/messages/unread-count` | Admin | Count unread messages (for badge) |
| PATCH | `/messages/:id/read` | Admin | Mark as read |
| POST | `/messages/:id/reply` | Admin | Send reply to owner |
| PATCH | `/messages/:id/close` | Admin | Toggle closed status |
| DELETE | `/messages/:id` | Admin | Delete permanently |

### SSE / Notification Routes — `/notifications`

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| GET | `/notifications/stream` | SuperAdmin | SSE stream (25s keep-alive ping) |

### Health Check

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| GET | `/health` | Public | Server health check |

---

## 11. Key Features In Detail

### 11.1 Attendance System

**Flow:** Owner selects a program → Attendance page loads → `GET /attendance/program/:programId` → returns program details + enrolled devotees → all pre-marked **present** → owner toggles absentees → fills host name + date + chapter (BV only) → `POST /attendance/submit`.

**Submit logic (current — append-only):**
1. `Attendance.insertMany()` — one row per devotee per session
2. `AttendanceSummary.deleteMany()` for this program + `AttendanceSummary.insertMany()` — rebuilds from scratch

**Percentage:** `attended / totalSessions × 100`

**Health thresholds:**
- Active 🟢 ≥ 80%
- Moderate 🟡 40–79%
- Inactive/Irregular 🔴 < 40%

**Program health labels:**
- Healthy 🟢 — recent session, good attendance
- Watch 🟡 — slightly overdue
- Risk 🟠 — significantly overdue or declining
- Critical 🔴 — no sessions or disabled

### 11.2 Screenshot OCR Attendance

For virtual (online) programs only. The `[📷 Screenshot]` button appears in the attendance page.

**Client-side only flow (no server upload):**
1. Owner uploads screenshot from Zoom or Google Meet participants panel
2. Tesseract.js loaded from CDN processes image in-browser
3. Raw OCR text cleaned: `stripZoomSuffixes` removes `(Host)`, `(me)`, etc.
4. `NOISE_EXACT` list filters UI chrome ("Participants", "Waiting Room", "Unmuted")
5. `NOISE_PATTERNS` regex filters timestamps, numbers, short fragments
6. Extracted names fuzzy-matched to enrolled devotees (>50% word overlap = matched)
7. Results shown in 3 sections: ✅ Matched / 👤 Not Enrolled / ❌ Absent
8. Owner clicks **Apply Attendance** → `setMarks(newMarks)` updates the form
9. Owner can still manually adjust before submitting

### 11.3 Analytics — Admin

`AdminAnalytics.jsx` (3769 lines) provides:

| Chart / Section | Description |
|---|---|
| KPI Strip | 4 count cards: programs, devotees, sessions, avg% |
| Program Health Grid | One card per program, colour-coded, click for drilldown |
| Drilldown Panel | Session history, monthly trend, top devotees, host chart |
| Monthly Trend | 12-month attendance % bar chart |
| Attendance Heatmap | 90-day GitHub-style calendar grid |
| 3 Bar Charts | Day vs Program Count, Area vs Programs, Area vs Devotee Count |
| Language Donut | Distribution of programs by language |
| Overdue List | Programs not updated by their scheduled frequency |
| Devotee Search | Global search across all programs — shows full devotee profile |

### 11.4 Analytics — Owner

`OwnerAnalytics.jsx` (2549 lines) — same structure as admin analytics but scoped to owner's own programs only. Includes the embedded `OwnerDevoteeSearch` component for per-owner devotee lookup with attendance history, streak, and status badge.

### 11.5 Shiksha Module — Spiritual Education Tracking

The Shiksha module tracks participants through **6 spiritual growth levels**:

```
None → Shraddhavan → Krishna Sevak → Krishna Sadhak → Srila Prabhupada Ashraya → Srila Guru Charana Ashraya
```

**Four interconnected subsystems:**

#### Participants

Each participant has a full biodata profile: name, shikshaCode (unique ID), aadhar number, BV leader, gender, contact, DOB, address, language, and currentLevel. The `ParticipantList` page supports search + filter by level. The `ParticipantDetail` page has three tabs: Profile (with the visual GrowthLadder component), Growth Plans, and Certifications.

#### Courses

One course per spiritual level. Admin creates and manages courses via `/admin/courses`. Each course has a name, description, assigned level, and can be enabled/disabled for certification.

#### Certifications (append-only)

When a participant completes a level, an owner or admin issues a certification. The system:
1. Validates the participant and course exist
2. Prevents level **downgrades** (you can only go up)
3. Records spiritual practice details: chanting, books, commitments, seva
4. Records level codes (aCode through fCode)
5. Automatically updates the participant's `currentLevel`
6. Owners can only certify their own participants; admins can certify anyone

#### Growth Plans

Individual spiritual development plans per participant. Each plan has a goal title, description, target level, target date, and status (active/completed/on-hold/cancelled). Managed inline in the ParticipantDetail page.

#### GrowthLadder Component

A visual step-ladder showing all 6 levels with the participant's current position highlighted. Certification dates are displayed next to each completed level. Colour scheme: gray (None) → blue (Shraddhavan) → purple (Krishna Sevak) → amber (Krishna Sadhak) → red (SP Ashraya) → green (Srila Guru Charana Ashraya).

#### Shiksha Analytics Dashboard

`ShikshaAnalytics.jsx` provides system-wide education metrics (admin-only):

| Chart / Section | Description |
|---|---|
| Summary KPIs | Total/active participants, certifications, courses, growth plans, programs |
| Level Distribution | Histogram of participants across 6 levels |
| Level Funnel | Progression funnel showing drop-off at each level |
| Certs by Month | Last 12 months of certification activity |
| Certs by Level | Certifications grouped by spiritual level |
| Certs by Course | Certifications grouped by course |
| Growth Plan Stats | Active / completed / on-hold / cancelled counts |
| Owner Insights | Per-owner: participants, certifications, programs |
| Recent Certifications | Last 20 certs with level progression arrows (before → after) |
| Top 10 Participants | Ranked by certification count |
| Participants Added/Month | 12-month enrolment trend |

### 11.6 Chatbot & Messaging

**ChatBot.jsx** — floating 🪷 FAB mounted in AppShell for owners.

**Two flows:**

1. **General Queries** — 44+ Q&A entries across 7 categories:

| Category | Topics Covered |
|---|---|
| Attendance | Mark attendance, screenshot OCR, bulk marking, editing, percentage, submission errors |
| Programs | BV type, all program types, virtual programs, Zoom screenshots, prefix, multiple programs, inactive, schedule day, sub-area, language |
| Devotees | Add devotee, devotee not showing, search, attendance history, streaks, WhatsApp contact |
| Analytics | View analytics, program health, monthly trend, heatmap, download/export |
| Account | Change password, forgot password, Google login, deactivated account, reminders |
| Technical | Page not loading, data not updating, session expired |
| About | Platform overview, contact admin |

Keyword fuzzy search: exact key match → tag match → partial word match.

2. **Message Admin** — Form (category + subject + message) → `POST /messages` → admin sees in `/admin/messages`.

3. **My Messages** — Owner views sent messages and admin replies. Unread replies trigger:
   - Red badge on FAB even when chatbot is closed
   - Pulsing "N new" badge on the home option
   - On open: `PATCH /messages/:id/owner-read` called → badge clears

**Sound system (Web Audio API — no dependencies):**

| Event | Sound |
|---|---|
| Open chatbot | Rising two-note chime |
| Close chatbot | Falling note |
| Send message | Double ascending chime |
| Admin reply received | Three ascending bell tones |
| Button click | Single soft click |
| Error | Low sawtooth buzz |

**Admin side:** `AdminMessages.jsx` — inbox with filter tabs, inline reply form, expand to see full message, **Done & Delete** permanently removes the thread.

### 11.7 Alert System & Scheduled Reminders

**Owner Alerts (`OwnerAlertPanel` + `alertController.js`):**

Alerts are computed in real-time based on program attendance history:

| Alert Type | Priority | Trigger |
|---|---|---|
| `ACTIVE_NO_HISTORY` | 🔴 High | Program exists but no attendance ever marked |
| `OVERDUE_ATTENDANCE` | 🔴 High | Last attendance exceeds red threshold |
| `ATTENDANCE_WARNING` | 🟡 Medium | Approaching red threshold |
| `LOW_ATTENDANCE` | 🟡 Medium | Average attendance below 40% |
| `INCOMPLETE_DEVOTEE` | ℹ️ Info | Devotees missing contact details |

**Overdue thresholds by frequency:**

| Frequency | Yellow (warning) | Red (overdue) |
|---|---|---|
| Daily | 5 days | 7 days |
| Weekly | 7 days | 14 days |
| Bi-weekly | 14 days | 21 days |
| Monthly | 30 days | 45 days |

**Scheduled Reminders (`alertScheduler.js`):**

A cron job runs daily at **9:00 AM IST** (`node-cron`). For each active program, if attendance is overdue beyond the reminder threshold, an email is sent to the program owner via Nodemailer. The `Reminderlog` model prevents duplicate sends within the same overdue window.

### 11.8 Announcements

Admin can create system-wide announcements displayed to all users. Each announcement has:
- **Priority**: high / medium / info (determines sort order)
- **Expiry**: optional date after which the announcement auto-hides
- **Active toggle**: admin can manually show/hide

Active announcements (max 5) are fetched on each page load and displayed as banners.

### 11.9 System Configuration Management

The `AdminConfig` page provides a UI for managing all dropdown values used across the system:

| Config Type | Example Values |
|---|---|
| `area` | Bangalore North, Bangalore South, ... |
| `subArea` | Jayanagar, Koramangala, ... |
| `frequency` | Daily, Weekly, Bi-weekly, Monthly |
| `programType` | BV, Gita Manjari, Tulasi Manjari, ... |
| `language` | English, Kannada, Hindi, Tamil, Telugu |
| `day` | Monday, Tuesday, ... Sunday, Daily |
| `bvChapters` | Chapter 1, Chapter 2, ... |

Admins can add, remove, or replace values per type. These values populate dropdowns in program creation, participant forms, etc.

### 11.10 Deactivation Review (SSE)

When an admin requests to deactivate an owner:
1. `User.pendingApproval = true`, `deactivatedAt`, `deactivatedBy`, `deactivationReason` set
2. SSE event `new-deactivation-request` emitted to all connected SuperAdmin clients
3. SuperAdmin sees live badge on notification bell
4. Approve → user.isActive = false, pendingApproval = false
5. Reject → pendingApproval = false, deactivatedAt cleared

`PendingDeactivations.jsx` component — auto-hidden for non-superadmin. Placed in both `AdminHome.jsx` and `ManageUsers.jsx`.

### 11.11 Landing Page

`HomePage.jsx` sections:
1. Full-screen slideshow (Ken Burns zoom, 4 images, 4.8s interval, manual arrows + dots)
2. Scrolling maha-mantra ticker (CSS animation, dark amber band)
3. Stats section (IntersectionObserver count-up animation: programs, members, areas, avg%)
4. Floral divider (custom SVG garland with marigolds, roses, jasmine, central lotus)
5. About section (circular divine shrine image with: rotating mantra ring, spinning gold conic border, orbiting diamond halo, ambient particles, floating animation, pulsing aura)
6. 6 Programme cards with colour-coded top accent bars
7. Sanskrit verse section (SB 1.2.18, giant OM watermark)
8. Login CTA strip
9. Footer (maha-mantra in Devanagari + copyright)

Falling petal system: 20 petals with 3 SVG shapes (teardrop, long leaf, oval), randomised position, duration, delay, rotation, sway — CSS animation only.

---

## 12. Data Import from Google Sheets

The project originally tracked attendance and shiksha data via Google Sheets (with Google Apps Script). A one-time migration script (`backend/utils/importExcel.js`) imports data from the exported `attendance-db.xlsx` workbook into MongoDB.

### How to Run

```bash
cd backend
node utils/importExcel.js
```

### Sheet Mapping

| Sheet | Target Collection(s) | Records |
|---|---|---|
| **Config** | `configs` | 6 config types (area, subArea, frequency, programType, language, day) + bvChapters |
| **cred** | `users` | 24 owner accounts (email, hashed password, prefix, mustChangePassword) |
| **tab1** (Programs) | `programs` | 93 programs (key, area, subArea, type, language, owner, virtual flag) |
| **tab2** (Devotees) | `devotees` + `programnamesonlies` | 1,256 devotees + 86 program name caches |
| **tab3** (Attendance) | `attendances` | ~34K attendance records (bulk insert in 500-row batches) |
| **tab4** (Summary) | `attendancesummaries` | 267 per-devotee/program aggregate summaries |
| **tab5** (Participants) | `participants` | 563 shiksha participant biodata records |
| **tab6** (Certifications) | `certifications` + `courses` | 38 certifications + 5 courses (auto-created per level) |

### Key Logic

- **Owner linking**: Matches program owners from `cred` sheet by email/prefix to the `users` collection
- **Level normalisation**: Maps shorthand level names (e.g., "sp ashrya") to canonical enum values
- **Duplicate safety**: Skips existing records on re-run (checks by unique keys)
- **Course auto-creation**: Creates one Course document per spiritual level if it doesn't exist
- **Participant currentLevel**: Updated if a certification promotes the participant

### Post-Import Database State

| Collection | Count |
|---|---|
| `users` | 25 (24 owners + 1 superadmin) |
| `configs` | 6 types |
| `programs` | 93 |
| `devotees` | 1,256 |
| `programnamesonlies` | 86 |
| `attendances` | ~34,000 |
| `attendancesummaries` | 267 |
| `participants` | 563 |
| `courses` | 5 |
| `certifications` | 38 |

---

## 13. Pending: Database Architecture Migration

> **This is the next major backend task.** No frontend changes needed. Analytics and dashboard readers are untouched. Only `attendanceController.submitAttendance` changes.

### The Problem with Current Architecture

Current system uses **SCD2 append-only** pattern:

```
Every session submission → insertMany(N rows into Attendance)
                         → deleteMany + insertMany on AttendanceSummary
```

With 50 devotees × 100 sessions = **5,000 rows** per program. With 10 programs = **50,000 rows**. Grows unboundedly. The rebuild-from-scratch pattern on every submit is increasingly slow.

### Target Architecture — Increment-Based

**Step 1: Add a lightweight `Session` collection**

```js
// models/Session.js
{
  program:      ObjectId → Program,
  owner:        ObjectId → User,
  date:         Date,
  hostName:     String,
  chapter:      String,           // BV programs
  presentCount: Number,
  absentCount:  Number,
  presentIds:   [ObjectId],       // devotee IDs who were present
  createdAt:    Date,
}
```

One document per submission. 10 programs × 100 sessions = **1,000 rows total**. Always.

**Step 2: Change `submitAttendance` — replace insertMany with $inc**

```js
// Current (REMOVE THIS):
await Attendance.insertMany(rows);
await AttendanceSummary.deleteMany({ program: programId });
await AttendanceSummary.insertMany(summaries);

// Replace with (ADD THIS):
// 1. Save the session record
await Session.create({ program, owner, date, hostName, chapter, presentCount, absentCount, presentIds });

// 2. For each devotee, increment their summary
for (const devotee of allDevotees) {
  const isNew = devotee.createdAt > sessionDate;
  if (isNew) continue;  // don't count sessions before they joined

  const wasPresent = presentIds.includes(devotee._id.toString());

  await AttendanceSummary.findOneAndUpdate(
    { program: programId, devotee: devotee._id },
    {
      $inc: {
        totalSessions: 1,
        attended: wasPresent ? 1 : 0,
      },
      $set: {
        lastSession: sessionDate,
        ...(wasPresent ? { lastPresent: sessionDate } : {}),
        devoteeName: devotee.name,
        owner: ownerId,
      },
      $setOnInsert: { program: programId, devotee: devotee._id },
    },
    { upsert: true, new: true }
  );

  // Recalculate percentage
  await AttendanceSummary.updateOne(
    { program: programId, devotee: devotee._id },
    [{ $set: { percentage: { $multiply: [{ $divide: ["$attended", "$totalSessions"] }, 100] } } }]
  );
}
```

**Step 3: New devotee mid-program rule**

```js
// Before the loop, get session date for comparison
const sessionDate = new Date(date);

// In loop:
if (new Date(devotee.createdAt) > sessionDate) {
  continue;  // this devotee wasn't part of the program at this session date
}
```

This means a devotee added in week 10 won't have 9 phantom "absent" sessions dragging their percentage down.

**Step 4: Update the drilldown API**

The `getProgramDrilldown` controller currently reads from `Attendance` for session history. Switch to read from `Session`:

```js
// Current:
const sessions = await Attendance.find({ program: id }).sort({ date: -1 }).limit(20);

// Replace with:
const sessions = await Session.find({ program: id }).sort({ date: -1 }).limit(20);
```

**Impact Assessment:**

| Component | Change needed |
|---|---|
| `attendanceController.submitAttendance` | ✅ Yes — core change |
| `getProgramDrilldown` | ✅ Yes — reads from Session not Attendance |
| `AttendanceSummary` model | ✅ Add `presentIds` tracking if needed |
| `Session` model | ✅ Create new file |
| All analytics queries (admin + owner) | ❌ No change — reads from AttendanceSummary |
| All dashboard widgets | ❌ No change |
| All frontend pages | ❌ No change |
| Program health labels | ❌ No change |
| Attendance page UI | ❌ No change |

**Migration script for existing data:**

```js
// Run once to convert existing Attendance rows into Session docs + fix Summary counts
const programs = await Program.find({});
for (const prog of programs) {
  // Group existing Attendance rows by date
  const sessions = await Attendance.aggregate([
    { $match: { program: prog._id } },
    { $group: {
      _id: "$date",
      presentIds: { $push: { $cond: ["$present", "$devotee", null] } },
      presentCount: { $sum: { $cond: ["$present", 1, 0] } },
      absentCount: { $sum: { $cond: ["$present", 0, 1] } },
      hostName: { $first: "$hostName" },
      chapter: { $first: "$chapter" },
    }}
  ]);
  // Insert Session docs
  await Session.insertMany(sessions.map(s => ({
    program: prog._id, owner: prog.owner,
    date: s._id, hostName: s.hostName, chapter: s.chapter,
    presentCount: s.presentCount, absentCount: s.absentCount,
    presentIds: s.presentIds.filter(Boolean),
  })));
}
// Then rebuild AttendanceSummary from Session docs
// (same increment loop as above, in historical order)
```

---

## 14. Pending: Feature Roadmap

These features were discussed and are ready to be built:

### Priority 1 — Smart Absence Alert System
When a devotee misses 3 consecutive sessions, an alert card appears on the owner's dashboard. The card shows the devotee's name and a pre-filled WhatsApp link. One click opens WhatsApp with a message like "Hare Krishna [Name] Prabhu, we missed you in our last session 🪷". Implementation: compare last 3 `Session.presentIds` arrays, flag devotees missing from all 3, surface in `OwnerHome.jsx` alerts panel.

### Priority 2 — Session Notes / Highlights
Add a `notes` field to the `Session` collection. After submitting attendance, owner can optionally add "Chapter 7 completed", "New guest attended" etc. These appear in the program drilldown panel and build a living program journal. Frontend: add a textarea to the post-submit confirmation screen.

### Priority 3 — Devotee Birthday Tracker
Add `birthDate` field to `Devotee` model. `OwnerHome.jsx` dashboard widget shows "🎂 3 devotees have birthdays this week" with WhatsApp links. Logic: `dayOfYear(birthDate)` within ±3 days of today. No backend API change needed — compute on existing devotee data.

### Priority 4 — Program Completion Certificate
When a devotee crosses 80% attendance in a BV or Gita program, a [Generate Certificate] button appears in their drilldown. Clicking generates a styled PDF with: devotee name, program name, completion %, host signature field, ISKCON branding. Uses the `pdf` skill. Frontend: button in `OwnerAnalytics` drilldown panel → POST `/certificates/generate` → returns PDF blob.

### Priority 5 — Attendance Trend Prediction
In the analytics drilldown panel, show a 3-session forecast bar. If monthly trend is 85% → 80% → 72%, extrapolate: "At current rate, may drop below 70% threshold in 2 sessions". Pure frontend math on `AttendanceSummary` monthly data — no new backend needed.

### Priority 6 — Quick WhatsApp Broadcast List
After attendance is submitted, show a "Copy Absentees" button. Clicking copies all absent devotees' names and WhatsApp numbers in a format ready to paste into a group message. Pure frontend, no backend needed.

---

## 15. Deployment Notes

### Backend

```bash
npm run build   # if using TypeScript transpile (not currently)
npm start       # NODE_ENV=production node server.js
```

Ensure:
- `MONGO_URI` points to production Atlas cluster
- `JWT_SECRET` is a long random string (min 32 chars)
- `CLIENT_URL` matches deployed frontend domain (for CORS + OAuth callback)
- Google OAuth callback URL updated in Google Cloud Console to production URL
- SMTP credentials valid for production email sending

### Frontend

```bash
npm run build   # outputs to dist/
```

Deploy `dist/` to Vercel, Netlify, or serve via nginx. Set:
- `VITE_API_URL` = production backend URL

### CORS Configuration (backend)

```js
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
}));
```

### MongoDB Indexes (recommended)

```js
// AttendanceSummary
{ program: 1, devotee: 1 }  // unique compound
{ owner: 1 }
{ percentage: 1 }

// Session (after migration)
{ program: 1, date: -1 }
{ owner: 1, date: -1 }

// Participant (Shiksha)
{ programOwner: 1 }
{ programKey: 1 }
{ activeFlag: 1 }
{ name: "text", shikshaCode: "text" }  // with language_override: "searchLanguage"

// Certification
{ participant: 1, certificationDate: -1 }
{ course: 1 }
{ certificationLevel: 1 }

// GrowthPlan
{ participant: 1, status: 1 }

// Message
{ status: 1, createdAt: -1 }
{ senderId: 1, createdAt: -1 }

// User
{ email: 1 }  // unique
{ role: 1, isActive: 1 }
```

---

## 16. Bug Fixes & Patches

### localStorage Token Key Mismatch

**Problem:** Four Shiksha-related pages (`ShikshaAnalytics.jsx`, `ParticipantDetail.jsx`, `CourseManagement.jsx`, `ParticipantList.jsx`) created their own axios instances using `localStorage.getItem("token")`, but the app stores the JWT as `pms_token`. Every API call from these pages sent no token → 401 Unauthorized.

**Fix:** Changed `localStorage.getItem("token")` → `localStorage.getItem("pms_token")` in all 4 files.

### Participant Model Text Index Language Conflict

**Problem:** MongoDB text indexes use a field named `language` by default for stemming. The `Participant` model has a `language` field storing values like "Tamil", "Kannada", "Hindi" — which are not valid MongoDB text search languages. This caused `insertMany` to fail with "language override unsupported".

**Fix:** Added `language_override: "searchLanguage"` to the text index definition in `Participant.js`, telling MongoDB to ignore the `language` field for text search stemming:

```js
ParticipantSchema.index(
  { name: "text", shikshaCode: "text" },
  { language_override: "searchLanguage" }
);
```

---

*Built with devotion for the seva of the devotee community. 🪷*

*Hare Krishna Hare Krishna Krishna Krishna Hare Hare*
*Hare Rama Hare Rama Rama Rama Hare Hare*
