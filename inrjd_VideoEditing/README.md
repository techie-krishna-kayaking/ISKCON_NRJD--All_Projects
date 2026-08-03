# ISKCON NRJD Video Editing App (Phase 1)

This phase includes two CLI flows:

- `merge` flow: reliable numbered-video merger
- `header` flow: overlay centered portrait socials header on portrait videos

## What it does

- Reads videos from `input/` folder
- Accepts only numbered files like: `1.mp4`, `2.mp4`, `3.mp4`, ...
- Merges in strict sequence order: `1 -> 2 -> 3 -> ...`
- Writes final merged file to `output/`
- Prefers highest quality:
  - By default does a **high-quality 2K render** (`2560x1440`) for reliability
  - Optional: try **lossless stream copy** first using `--try-stream-copy`

## Folder setup

Inside this project folder:

- `input/` : place your numbered videos here
- `input/header_video_flow/` : place videos for header flow here
- `output/`: merged final video is generated here
- `assets/shorts_header_socials..png` : header overlay image used by header flow

## Requirements

- Python 3.10+
- FFmpeg installed and available in PATH

macOS install FFmpeg:

```bash
brew install ffmpeg
```

## Usage

### Flow 1: Merge Flow (default)

Run from this folder:

```bash
python3 video_merge_app.py
```

### Keep Mac Awake During Merge (macOS)

Use `caffeinate` so your MacBook does not sleep while encoding:

```bash
caffeinate -dimsu python3 video_merge_app.py
```

This keeps the display/system awake only while the merge command is running.

Default output file:

- `output/merged_full_video_2k.mp4`

### Flow 2: Header Flow

This flow:

- Reads videos from `input/header_video_flow/`
- Reads header image from `assets/shorts_header_socials..png`
- Converts video to YouTube Shorts resolution (`1080x1920`)
- Scales/fits the header image to portrait frame and overlays it centered
- Optional background music mode:
  - Mutes source video audio
  - Adds bg track from `assets/bgmusic/`
  - Uses tracks in round-robin order across batch videos

Run command:

```bash
python3 video_merge_app.py --flow header
```

Keep Mac awake while running header flow:

```bash
caffeinate -dimsu python3 video_merge_app.py --flow header
```

Header flow with explicit folders/files:

```bash
python3 video_merge_app.py \
  --flow header \
  --input-dir input \
  --output-dir output \
  --assets-dir assets \
  --header-flow-folder header_video_flow \
  --header-image shorts_header_socials..png \
  --crf 16 \
  --preset slow
```

Header flow with background music (source audio muted):

```bash
python3 video_merge_app.py \
  --flow header \
  --header-add-bg-music
```

Exact command used in terminal (venv python path):

```bash
/Users/kkrishna/Downloads/pp/VSCode_Projects/ISKCON_NRJD--All_Projects/.venv/bin/python video_merge_app.py --flow header --header-add-bg-music
```

Keep Mac awake while running header + bg music flow:

```bash
caffeinate -dimsu python3 video_merge_app.py --flow header --header-add-bg-music
```

Header flow with custom bg music folder:

```bash
python3 video_merge_app.py \
  --flow header \
  --header-add-bg-music \
  --header-bg-music-dir bgmusic
```

Header flow outputs are written to:

- `output/header_video_flow/`

Output naming pattern:

- `<original_name>_shorts_header.mp4`

### Optional arguments

```bash
python3 video_merge_app.py \
  --flow merge \
  --input-dir input \
  --output-dir output \
  --output-name merged_full_video_2k.mp4 \
  --assets-dir assets \
  --header-flow-folder header_video_flow \
  --header-image shorts_header_socials..png \
  --crf 16 \
  --preset slow \
  --try-stream-copy
```

## Notes

- Keep file numbering continuous without gaps.
  - Valid: `1.mp4`, `2.mp4`, `3.mp4`
  - Invalid: `1.mp4`, `3.mp4` (missing `2.mp4`)
- For absolutely best quality with guaranteed compatibility, keep the default 2K render mode.
- If you enable `--try-stream-copy`, the tool auto-checks output duration and falls back to 2K if anything looks incomplete.
- For `--header-add-bg-music`, add at least one audio file in `assets/bgmusic/` (`.mp3`, `.wav`, `.m4a`, `.aac`, `.flac`, `.ogg`), otherwise the command exits with an error.
