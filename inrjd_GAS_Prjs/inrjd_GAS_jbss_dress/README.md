# JBSS Dress Search — Google Apps Script Version

A complete conversion of the JBSS dress management app to Google Apps Script.
All dress images are stored in Google Drive. All data (calendar, festivals, lord photos mapping) is stored in a Google Sheet. No server, Docker, or Python required.

---

## What changed from the Flask version

| Feature | Flask version | GAS version |
|---|---|---|
| **AI-powered search (CLIP)** | ✅ semantic visual search | ❌ replaced with filename keyword search |
| **Calendar** | JSON file on disk | Google Sheets |
| **Festivals** | CSV file on disk | Google Sheets |
| **Lord photos** | local `/lord_photos/` folder | Google Drive subfolder |
| **Dress images** | local `/images/` folder | Google Drive folder (you own) |
| **Auth** | bcrypt + Flask session | SHA-256 password + UUID token in PropertiesService |
| **Hosting** | Docker / Python server | Google Apps Script (free, no server) |
| **Search** | CLIP neural embeddings | Filename keyword matching |

> **Note on search:** Keyword search works well when dress filenames describe the dress: `pink-swan-zari.jpg`, `red+gold-fire.jpg`, `dark-blue-peacock.jpg`. Name your files descriptively for best results.

---

## Google Drive Setup

1. Your dress images folder is already at:  
   `https://drive.google.com/drive/folders/1-rOC-hRYOfiMmnmOR2QbRE9POvTQNnlM`

2. **Share the folder** so all images load for shared-view users:  
   Right-click the folder → Share → **Anyone with the link** → **Viewer**

3. Upload all dress `.jpg`/`.png` images directly into this folder.  
   The `lord_photos` subfolder will be created automatically by `setup()`.

---

## First-Time Setup (GAS Editor)

### Step 1 — Create the Apps Script project

1. Go to [script.google.com](https://script.google.com) → **New project**
2. Name it `JBSS Dress`
3. Create the following files (Project → + → Script/HTML):

| File | Type |
|---|---|
| `Code.gs` | Script |
| `Config.gs` | Script |
| `Auth.gs` | Script |
| `Calendar.gs` | Script |
| `Festivals.gs` | Script |
| `Dresses.gs` | Script |
| `LordPhotos.gs` | Script |
| `index.html` | HTML |

4. Copy the contents of each file from this folder into the corresponding GAS file.

### Step 2 — Run `setup()`

1. In the GAS editor, select `setup` from the function dropdown.
2. Click **Run**.
3. Authorize the required permissions (Drive, Sheets, etc.) when prompted.
4. Check the **Execution log** — it will print:
   - Default admin password: `admin123`
   - Shared view token
   - Spreadsheet URL
   - Lord photos folder URL

### Step 3 — Import the festival calendar

1. Select `importDefaultFestivals` from the dropdown and click **Run**.
2. This loads all 2026 Hindu festivals (Purnima, Amavasya, Janmashtami, etc.) into the Sheet.

### Step 4 — Deploy the web app

1. Click **Deploy → New deployment**
2. Type: **Web app**
3. Execute as: **Me**
4. Who has access: **Anyone** (for shared view) or **Anyone with Google account**
5. Click **Deploy** → Copy the web app URL

### Step 5 — First login

1. Open the web app URL.
2. Log in with username `admin` and password `admin123`.
3. Go to **Change Password** in the nav bar and set a secure password.

---

## Sharing with Non-Admin Users

1. Log in as admin.
2. Click **Share Link** in the nav bar — this copies a read-only link to your clipboard.
3. Share this link with devotees. The URL looks like:
   ```
   https://script.google.com/.../exec#view/YOUR-TOKEN
   ```
4. Anyone with this link can view the calendar, browse the gallery, and see lord photos.
5. They cannot assign dresses or upload photos.

To generate a new shared link (invalidates the old one):
- There is no UI for this yet. In the GAS editor, run:
  ```javascript
  // In editor console
  regenerateSharedToken(PropertiesService.getScriptProperties().getProperty('ADMIN_TOKEN'));
  ```
  Or simply open the web app, log in, and check the `SHARED_VIEW_TOKEN` in PropertiesService.

---

## Uploading Festivals CSV

Format (same as before):
```csv
date,festival_name,dress_comment
2026-01-14,Purnima,
2026-03-14,Holi,colorful dress
2026-08-14,Janmashtami,
```

- `type` column is optional — auto-detected from the festival name.
- Go to the app → logged in as admin → **Upload Festival CSV** in the nav bar.

---

## Adding New Dresses

1. Upload new dress images directly to the Google Drive folder:  
   `https://drive.google.com/drive/folders/1-rOC-hRYOfiMmnmOR2QbRE9POvTQNnlM`
2. In the app → **Dress Assignment** view → click **↻ Refresh** to reload the dress palette (clears cache).

---

## Dress Naming Convention

Since AI search is not available, descriptive filenames help keyword search work well:

| Good filename | Why |
|---|---|
| `pink-swan-zari.jpg` | Search "pink", "swan", "zari" all work |
| `dark-blue-peacock.jpg` | Search "blue", "peacock" works |
| `red+gold-fire.jpg` | Search "red", "gold", "fire" works |
| `img001.jpg` | Only search for "img001" works ❌ |

---

## Data Files

All data is stored in a Google Sheet auto-created during `setup()`:

| Sheet | Purpose |
|---|---|
| `Calendar` | date, dress_filename, drive_file_id |
| `Festivals` | date, festival_name, type, dress_comment |
| `LordPhotosMap` | dress_filename, photo_ids_json |

You can find the spreadsheet URL in the Apps Script execution log after `setup()`.

---

## Troubleshooting

**Images not loading for shared-view users**  
→ Make sure the Drive folder is shared as "Anyone with the link → Viewer".

**"Spreadsheet not initialized" error**  
→ Run `setup()` from the GAS editor first.

**Dress palette is empty**  
→ Ensure all image files are in the top-level Drive folder (not in subfolders). Only direct children of the folder are listed. Also check the folder ID in `Config.gs`.

**Lord photos not uploading**  
→ File size limit for base64 transfer is ~3MB. Images are auto-compressed to ~1MB by the browser before sending. Very large raw files (>15MB) may still cause issues — resize them first.

**"Script timeout" errors**  
→ If you have 500+ dresses, the `listDresses()` call may be slow on first load. After the first load, results are cached for 1 hour.

---

## Project Structure

```
inrjd_GAS_jbss_dress/
  Code.gs         ← doGet, setup, importDefaultFestivals
  Config.gs       ← initConfig, getSpreadsheet
  Auth.gs         ← login, logout, token validation
  Calendar.gs     ← getCalendar, assignDress, unassignDress
  Festivals.gs    ← getFestivals, uploadFestivals
  Dresses.gs      ← listDresses, searchDresses (with Drive cache)
  LordPhotos.gs   ← getLordPhotos, uploadLordPhoto, deleteLordPhoto
  index.html      ← complete single-page web app (HTML + CSS + JS)
  README.md       ← this file
```
