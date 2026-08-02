# ISKCON NRJD Video Editing App (Phase 1)

This phase builds a simple, reliable numbered-video merger.

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
- `output/`: merged final video is generated here

## Requirements

- Python 3.10+
- FFmpeg installed and available in PATH

macOS install FFmpeg:

```bash
brew install ffmpeg
```

## Usage

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

### Optional arguments

```bash
python3 video_merge_app.py \
  --input-dir input \
  --output-dir output \
  --output-name merged_full_video_2k.mp4 \
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
