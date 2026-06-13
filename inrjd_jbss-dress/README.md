# JBSS Dress Search & Calendar

A dress management tool for tracking lord's dress collection. Features AI-powered visual search (CLIP model), a monthly calendar for dress assignments, festival/purnima/amavasya tracking, and lord photo galleries.

---

## Table of Contents

- [Quick Start](#quick-start)
- [Features](#features)
- [User Roles](#user-roles)
- [Running the App](#running-the-app)
  - [Option 1: Quick Start Script](#option-1-quick-start-script)
  - [Option 2: Manual Setup](#option-2-manual-setup)
  - [Option 3: Docker](#option-3-docker)
- [First Run](#first-run)
- [Admin Guide](#admin-guide)
  - [Login](#login)
  - [Calendar View](#calendar-view)
  - [Dress Assignment (Drag & Drop)](#dress-assignment-drag--drop)
  - [Lord Photos](#lord-photos)
  - [Gallery & Search](#gallery--search)
  - [Sharing with Normal Users](#sharing-with-normal-users)
- [Normal User Guide](#normal-user-guide)
- [Data Files Reference](#data-files-reference)
  - [Festivals CSV](#festivals-csv-datafestivalscsv)
  - [Admin Config](#admin-config-dataconfigjson)
  - [Calendar Assignments](#calendar-assignments-datacalendarjson)
  - [Lord Photos Mapping](#lord-photos-mapping-datalord_photos_mapjson)
- [Changing Admin Password](#changing-admin-password)
- [Production Deployment](#production-deployment)
- [Project Structure](#project-structure)
- [Troubleshooting](#troubleshooting)

---

## Quick Start

```bash
chmod +x run.sh
./run.sh
```

Open http://localhost:5000 in your browser. That's it.

---

## Features

| Feature | Admin | Normal User |
|---------|-------|-------------|
| Monthly calendar with dress thumbnails | Yes | Yes |
| Festival badges, Purnima/Amavasya moon icons | Yes | Yes |
| Hover tooltip showing festival/purnima/amavasya info | Yes | Yes |
| Search by color, design, date, festival | Yes | Yes |
| AI-powered dress gallery (CLIP search) | Yes | Yes |
| Click dress to see lord's photos | Yes | Yes |
| Drag & drop dress assignment to dates | Yes | No |
| Dress palette with hover-to-zoom preview | Yes | No |
| Upload lord photos | Yes | No |
| Upload festival CSV | Yes | No |

---

## User Roles

### Admin User
- Logs in with username and password
- Full access: calendar, gallery, dress assignment, photo uploads
- Can share a read-only link with normal users

### Normal User
- No login required
- Accesses the app via a shared link (e.g., `http://yourserver:5000/view/abc123-def456-...`)
- Read-only: can view calendar, search dresses, view lord photos
- Cannot assign dresses or upload photos

---

## Running the App

### Option 1: Quick Start Script

```bash
# Clone or copy the project
cd jbss-dress

# Run (creates venv, installs dependencies, starts server)
chmod +x run.sh
./run.sh
```

### Option 2: Manual Setup

```bash
# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the server
python app.py
```

The server starts at http://localhost:5000

### Option 3: Docker

```bash
# Build the image (downloads ~900MB CLIP model during build)
docker build -t jbss-dress .

# Run the container
docker run -p 5000:5000 \
  -v $(pwd)/images:/app/images \
  -v $(pwd)/lord_photos:/app/lord_photos \
  -v $(pwd)/data:/app/data \
  jbss-dress
```

**Volume mounts explained:**
- `images/` — your dress images
- `lord_photos/` — lord's photos wearing the dresses
- `data/` — calendar data, festivals CSV, config (persists across container restarts)

---

## First Run

On the very first run, the app automatically:

1. Creates the `data/` directory
2. Creates the `lord_photos/` directory
3. Generates `data/config.json` with:
   - Default admin username: **admin**
   - Default admin password: **admin123**
   - A random shared view token (UUID)
   - A random Flask secret key
4. Loads `data/festivals.csv` (if present)
5. Loads the CLIP model (~900MB, downloaded once and cached)
6. Builds image embeddings (cached in `embeddings_cache.npz`)

**Console output on first run:**
```
==================================================
  First run - admin account created!
  Username: admin
  Password: admin123
  Shared view link: /view/a1b2c3d4-e5f6-7890-abcd-ef1234567890
  CHANGE THE PASSWORD after first login!
==================================================
```

**Save the shared view link** — you'll give this to normal users.

---

## Admin Guide

### Login

1. Go to http://localhost:5000/login
2. Enter username: `admin`, password: `admin123`
3. You'll be redirected to the Calendar view

### Calendar View

- Shows a monthly grid with 7 columns (Sun-Sat)
- Each day cell shows:
  - Date number
  - Moon icons: full moon for Purnima, new moon for Amavasya
  - Festival name badges (gold colored)
  - Dress comment from CSV (blue italic text)
  - Dress thumbnail (if a dress is assigned to that date)
- **Hover tooltip**: Hover over any calendar cell to see a popup with festival, purnima, amavasya, and dress info for that date. This works even when a dress photo covers the cell.
- Click a dress thumbnail to see lord's photos for that dress
- Use **< >** arrows to navigate months
- Use the **search bar** to filter by color, design, date, or festival name

### Dress Assignment (Drag & Drop)

1. Click the **"Dress Assignment"** tab in the navigation bar
2. You'll see a split view: calendar on the left, dress palette on the right
3. **Dress palette sidebar:**
   - 3-column grid of dress thumbnails
   - **Hover to zoom**: hover over any dress thumbnail and it enlarges to 2.2x for clear identification — works well on phone too
   - Filter input at top to narrow down dresses by name/color
4. **To assign a dress:**
   - **Desktop:** Drag a dress thumbnail from the right panel and drop it on a calendar date
   - **Mobile:** Tap a dress to select it (yellow border), then tap a calendar date
5. **To remove an assignment:** Hover over the dress in the calendar cell and click the **X** button
6. **Hover tooltip on cells:** Hover over any cell to see festival/purnima/amavasya info even after a dress is assigned

### Lord Photos

1. Click any dress thumbnail in the calendar to open the lord photo modal
2. **Upload:** Click the "Upload Lord Photo" button at the bottom of the modal
3. **Delete:** Hover over a lord photo and click the **X** button
4. Lord photos are stored in the `lord_photos/` directory
5. The mapping (which photo belongs to which dress) is in `data/lord_photos_map.json`

### Gallery & Search

1. Click the **"Gallery"** tab to access the AI-powered dress search
2. Type any query: "pink", "fire design", "dark blue with gold", "peacock pattern"
3. The CLIP model searches by visual similarity + design tags + filename matching
4. Click any dress card to open the lightbox viewer
5. Use arrow keys or click arrows to navigate between dresses

### Sharing with Normal Users

1. After logging in, click **"Share Link"** in the top navigation bar
2. The link is copied to your clipboard
3. Send this link to normal users (WhatsApp, email, etc.)
4. The link looks like: `http://yourserver:5000/view/a1b2c3d4-e5f6-7890-abcd-ef1234567890`

---

## Normal User Guide

1. Open the shared link you received from the admin
2. You'll see the **Calendar** with all dress assignments and festivals
3. **Hover over any date** to see festival/purnima/amavasya info in a popup tooltip
4. Click on any dress thumbnail to see lord's photos for that dress
5. Use the **search bar** to find dresses by:
   - Color: "pink", "blue", "gold"
   - Design: "fire", "peacock", "floral"
   - Date: "2026-04-18"
   - Festival: "Diwali", "Holi"
6. Click the **"Gallery"** tab to browse and search all dresses with AI

---

## Data Files Reference

All data files are in the `data/` directory.

### Festivals CSV (`data/festivals.csv`)

This is the main file you'll edit to add festivals, purnima, and amavasya dates.

**Format:**
```
date,festival_name,dress_comment
```

**Columns:**

| Column | Format | Required | Description |
|--------|--------|----------|-------------|
| `date` | `YYYY-MM-DD` | Yes | Date of the festival/event |
| `festival_name` | Text | Yes | Name of the festival or event |
| `dress_comment` | Text | No | Optional note about the dress for that day |

**How the type is auto-detected from `festival_name`:**

| If festival_name contains... | Calendar shows |
|------------------------------|----------------|
| "Purnima" or "Poornima" | Full moon icon |
| "Amavasya" or "Amavas" | New/dark moon icon |
| Anything else | Festival name badge (gold text) |

**Example CSV:**
```csv
date,festival_name,dress_comment
2026-01-13,Lohri,
2026-01-14,Makar Sankranti / Pongal,festive dress
2026-01-14,Purnima,
2026-01-29,Amavasya,
2026-03-14,Holi,colorful dress
2026-04-02,Ram Navami,yellow dress
2026-10-21,Diwali,gold or red dress
2026-10-21,Amavasya,
```

**Notes:**
- A date can have multiple entries (e.g., Diwali and Amavasya on the same day)
- The `dress_comment` column is optional — leave it empty if no comment needed
- You can edit this file directly, or upload a new CSV from the admin UI via `POST /api/festivals/upload`
- After editing the file manually, restart the app to reload it

### Admin Config (`data/config.json`)

Auto-generated on first run. Contains admin credentials and app secrets.

```json
{
  "admin_username": "admin",
  "admin_password_hash": "$2b$12$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012",
  "shared_view_token": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "secret_key": "f9e8d7c6-b5a4-3210-fedc-ba9876543210"
}
```

| Field | Description |
|-------|-------------|
| `admin_username` | Admin login username (default: `admin`) |
| `admin_password_hash` | Bcrypt-hashed password (never store plain text!) |
| `shared_view_token` | UUID that forms the normal user's access link |
| `secret_key` | Flask session encryption key (keep secret!) |

**Do not share this file.** It contains hashed credentials and session secrets.

### Calendar Assignments (`data/calendar.json`)

Stores which dress is assigned to which date. Managed entirely through the admin UI.

```json
{
  "2026-04-18": {
    "dress": "pink.jpg"
  },
  "2026-04-19": {
    "dress": "gold.jpg"
  },
  "2026-10-21": {
    "dress": "red-gold.jpg"
  }
}
```

- Keys are dates in `YYYY-MM-DD` format
- Each date has at most one dress
- This file is updated automatically when you drag & drop dresses in the admin UI
- You can also edit it manually (restart not required — it's read on every request)

### Lord Photos Mapping (`data/lord_photos_map.json`)

Maps dress images to their lord photos.

```json
{
  "pink.jpg": ["pink_lord_photo1.jpg", "pink_lord_photo2.jpg"],
  "gold.jpg": ["gold_darshan_jan2026.jpg"],
  "blue.jpg": []
}
```

- Keys are dress filenames (matching files in `images/`)
- Values are arrays of lord photo filenames (stored in `lord_photos/`)
- Updated automatically when you upload/delete lord photos through the UI
- Lord photo files are auto-prefixed with the dress name to avoid filename collisions

---

## Changing Admin Password

### Method 1: Via API (while logged in)

```bash
curl -X POST http://localhost:5000/api/auth/change-password \
  -H "Content-Type: application/json" \
  -d '{"new_password": "YourNewSecurePassword"}' \
  --cookie "session=<your-session-cookie>"
```

### Method 2: Edit config.json directly

1. Generate a bcrypt hash:
```bash
python3 -c "import bcrypt; print(bcrypt.hashpw(b'YourNewSecurePassword', bcrypt.gensalt()).decode())"
```

2. Edit `data/config.json` and replace the `admin_password_hash` value with the output:
```json
{
  "admin_username": "admin",
  "admin_password_hash": "$2b$12$<paste-the-new-hash-here>",
  ...
}
```

3. Restart the app.

### Changing the shared view link

Edit `data/config.json` and change the `shared_view_token` value. This immediately invalidates the old link. Share the new link with normal users:
```
http://yourserver:5000/view/<new-token-value>
```

---

## Production Deployment

### Using Docker (recommended)

```bash
# Build
docker build -t jbss-dress .

# Run with persistent data
docker run -d \
  --name jbss-dress \
  --restart unless-stopped \
  -p 5000:5000 \
  -v /path/to/your/images:/app/images \
  -v /path/to/your/lord_photos:/app/lord_photos \
  -v /path/to/your/data:/app/data \
  jbss-dress
```

### Using Gunicorn (without Docker)

```bash
source venv/bin/activate
gunicorn -c gunicorn_config.py app:app
```

Gunicorn config (`gunicorn_config.py`):
- Binds to `0.0.0.0:5000`
- 1 worker (CLIP model uses ~1GB RAM per worker)
- 4 threads
- 120-second timeout (for model loading on startup)

### Behind Nginx (recommended for production)

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    client_max_body_size 20M;  # For lord photo uploads

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Production Checklist

- [ ] Change the default admin password (see [Changing Admin Password](#changing-admin-password))
- [ ] Place your dress images in `images/`
- [ ] Create your `data/festivals.csv` with the correct dates
- [ ] Note down the shared view link from the first-run console output
- [ ] Set up Nginx or a reverse proxy with HTTPS
- [ ] Mount `data/`, `images/`, and `lord_photos/` as persistent volumes (Docker)

---

## UI Features

### Light Warm Theme
The app uses a warm cream/gold color palette instead of a dark theme, making dress colors appear true-to-life and easier to distinguish.

### Calendar Hover Tooltips
Hovering over any calendar cell shows a popup tooltip with:
- Dress name (if assigned)
- Festival name (if any)
- Purnima (full moon) / Amavasya (new moon) indicators
- Dress comments from the CSV

This works in both the Calendar view and the Dress Assignment view, for both admin and normal users.

### Dress Palette Hover-to-Zoom
In the Dress Assignment sidebar, hovering over any dress thumbnail enlarges it to 2.2x its original size. This makes it easy to identify dresses before dragging them, especially on smaller screens or phones.

---

## Project Structure

```
jbss-dress/
├── app.py                      # Flask backend (all API endpoints)
├── requirements.txt            # Python dependencies
├── run.sh                      # Quick start script
├── Dockerfile                  # Docker container definition
├── gunicorn_config.py          # Production server config
│
├── data/                       # All persistent data (auto-created)
│   ├── config.json             # Admin credentials & shared token
│   ├── calendar.json           # Dress-to-date assignments
│   ├── lord_photos_map.json    # Lord photo mappings
│   └── festivals.csv           # Festival dates & dress comments
│
├── images/                     # Dress images (45 JPEGs)
│   ├── pink.jpg
│   ├── gold.jpg
│   ├── dark-blue.jpg
│   └── ...
│
├── lord_photos/                # Lord's photos (uploaded via UI)
│   ├── pink_lord1.jpg
│   └── ...
│
├── static/                     # Frontend files
│   ├── index.html              # Main HTML (SPA with multiple views)
│   ├── app.js                  # Router + gallery module
│   ├── calendar.js             # Calendar rendering + hover tooltips
│   ├── admin.js                # Drag-and-drop + hover-to-zoom palette
│   ├── auth.js                 # Login handling
│   └── style.css               # All styles (warm light theme)
│
├── embeddings_cache.npz        # CLIP image embeddings (auto-generated)
├── crop_embeddings_cache.npz   # Multi-crop embeddings (auto-generated)
└── tags_cache_v2.json          # Design tag cache (auto-generated)
```

---

## API Endpoints

### Authentication
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/login` | None | Login with `{username, password}` |
| POST | `/api/auth/logout` | Admin | Clear session |
| GET | `/api/auth/status` | None | Check if logged in |
| POST | `/api/auth/change-password` | Admin | Change password `{new_password}` |

### Calendar
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/calendar?month=2026-04` | None | Get assignments + festivals for month |
| POST | `/api/calendar/assign` | Admin | Assign dress `{date, dress}` |
| DELETE | `/api/calendar/assign?date=2026-04-18` | Admin | Remove assignment |
| GET | `/api/calendar/search?q=pink&month=2026-04` | None | Search calendar |

### Festivals
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/festivals?year=2026` | None | Get all festivals |
| POST | `/api/festivals/upload` | Admin | Upload new CSV file |

### Lord Photos
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/lord-photos/<dress>` | None | List lord photos for dress |
| POST | `/api/lord-photos/<dress>` | Admin | Upload lord photo (multipart) |
| DELETE | `/api/lord-photos/<dress>/<photo>` | Admin | Remove lord photo |

### Gallery & Search
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/images` | None | List all dress images |
| GET | `/api/search?q=pink&top_k=45` | None | AI-powered search |
| GET | `/api/tags` | None | Debug: show detected design tags |

### Shared View
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/view/<token>` | Token | Read-only calendar for normal users |
| GET | `/api/shared/validate/<token>` | None | Validate shared token |

---

## Troubleshooting

**App takes a long time to start**
- First run downloads the CLIP model (~900MB). Subsequent runs use the cached model.
- Building image embeddings takes 1-2 minutes on first run. Cached after that.

**"Invalid link" when opening shared view**
- The shared token in the URL doesn't match `data/config.json`. Check the token value.

**Dresses not showing in calendar**
- Dresses must first be assigned via the Dress Assignment tab (admin only).

**CSS/JS changes not appearing after update**
- The app uses cache-busting query params (e.g., `style.css?v=4`). If you manually update static files, increment the version number in `static/index.html` to force browsers to reload.
- Alternatively, do a hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows).

**Festival CSV not loading**
- Make sure the file is at `data/festivals.csv` (not `data/festival.csv`)
- Check the header row is exactly: `date,festival_name,dress_comment`
- Dates must be in `YYYY-MM-DD` format
- Restart the app after manually editing the CSV

**Festival hover tooltip not showing**
- The tooltip appears as a dark popup above the calendar cell on hover. It only shows on dates that have festival/purnima/amavasya entries in the CSV.
- Make sure the `data/festivals.csv` file has entries for the month you're viewing.

**Embedding cache issues after adding/removing images**
- Delete `embeddings_cache.npz`, `crop_embeddings_cache.npz`, and `tags_cache_v2.json`
- Restart the app — they'll be rebuilt automatically

**Docker: changes to images not reflected**
- Make sure you mounted the `images/` directory as a volume
- Delete the cache files and restart the container
