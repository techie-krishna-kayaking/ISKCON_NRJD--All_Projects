#!/usr/bin/env python3
"""ISKCON NRJD numbered video merger.

This tool merges numbered videos from input/ in ascending numeric order:
1.mp4, 2.mp4, 3.mp4, ...

Default behavior is high-quality 2K re-encode for reliable output across
mixed source files. Optional stream-copy mode can be enabled explicitly.
"""

from __future__ import annotations

import argparse
import os
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

VIDEO_REGEX = re.compile(r"^(\d+)\.mp4$", re.IGNORECASE)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Merge numbered MP4 videos from input folder into one output video."
    )
    parser.add_argument(
        "--input-dir",
        default="input",
        help="Folder containing numbered videos like 1.mp4, 2.mp4, ...",
    )
    parser.add_argument(
        "--output-dir",
        default="output",
        help="Folder where merged output video will be saved.",
    )
    parser.add_argument(
        "--output-name",
        default="merged_full_video_2k.mp4",
        help="Output filename.",
    )
    parser.add_argument(
        "--crf",
        type=int,
        default=16,
        help="CRF for fallback re-encode. Lower is higher quality (typical: 14-18).",
    )
    parser.add_argument(
        "--preset",
        default="slow",
        choices=["veryslow", "slower", "slow", "medium", "fast"],
        help="x264 preset for fallback re-encode.",
    )
    parser.add_argument(
        "--try-stream-copy",
        action="store_true",
        help=(
            "Try lossless stream-copy first. If it fails or output duration looks "
            "incomplete, the tool automatically falls back to 2K re-encode."
        ),
    )
    return parser.parse_args()


def ensure_ffmpeg() -> None:
    ffmpeg = shutil.which("ffmpeg")
    if ffmpeg is None:
        raise RuntimeError(
            "ffmpeg is not installed or not in PATH. Install ffmpeg first."
        )


def find_numbered_videos(input_dir: Path) -> list[Path]:
    if not input_dir.exists():
        raise FileNotFoundError(f"Input directory does not exist: {input_dir}")

    numbered: list[tuple[int, Path]] = []
    for item in input_dir.iterdir():
        if not item.is_file():
            continue
        match = VIDEO_REGEX.match(item.name)
        if not match:
            continue
        numbered.append((int(match.group(1)), item))

    if not numbered:
        raise FileNotFoundError(
            "No numbered MP4 videos found. Expected files like 1.mp4, 2.mp4, 3.mp4..."
        )

    numbered.sort(key=lambda x: x[0])

    expected = list(range(numbered[0][0], numbered[-1][0] + 1))
    found = [n for n, _ in numbered]
    if found != expected:
        missing = sorted(set(expected) - set(found))
        raise ValueError(
            "Numbering has gaps. Please keep continuous numbering. "
            f"Missing: {', '.join(str(m) for m in missing)}"
        )

    return [path for _, path in numbered]


def build_concat_file(video_files: list[Path], concat_file: Path) -> None:
    lines = [f"file '{video.resolve().as_posix()}'" for video in video_files]
    concat_file.write_text("\n".join(lines) + "\n", encoding="utf-8")


def run_cmd(cmd: list[str]) -> subprocess.CompletedProcess[str]:
    return subprocess.run(cmd, capture_output=True, text=True)


def ffprobe_duration_seconds(video_path: Path) -> float:
    cmd = [
        "ffprobe",
        "-v",
        "error",
        "-show_entries",
        "format=duration",
        "-of",
        "default=noprint_wrappers=1:nokey=1",
        str(video_path),
    ]
    result = run_cmd(cmd)
    if result.returncode != 0:
        raise RuntimeError(f"ffprobe failed for {video_path}: {result.stderr.strip()}")

    try:
        return float(result.stdout.strip())
    except ValueError as exc:
        raise RuntimeError(
            f"Could not parse duration from ffprobe for {video_path}: {result.stdout!r}"
        ) from exc


def try_stream_copy(concat_file: Path, output_path: Path) -> bool:
    cmd = [
        "ffmpeg",
        "-hide_banner",
        "-y",
        "-f",
        "concat",
        "-safe",
        "0",
        "-i",
        str(concat_file),
        "-c",
        "copy",
        str(output_path),
    ]
    result = run_cmd(cmd)

    if result.returncode == 0:
        print("Stream-copy merge succeeded (lossless quality).")
        return True

    print("Stream-copy merge failed. Switching to high-quality 2K re-encode...")
    print(result.stderr.strip())
    return False


def merge_with_2k_reencode(
    videos: list[Path],
    output_path: Path,
    crf: int,
    preset: str,
) -> None:
    # 2K target is 2560x1440. This scales up/down and letterboxes while
    # preserving source aspect ratio.
    vf = (
        "scale=2560:1440:force_original_aspect_ratio=decrease,"
        "pad=2560:1440:(ow-iw)/2:(oh-ih)/2,"
        "format=yuv420p"
    )

    cmd = ["ffmpeg", "-hide_banner", "-y"]
    for video in videos:
        cmd.extend(["-i", str(video)])

    chain_parts: list[str] = []
    concat_inputs: list[str] = []
    for idx in range(len(videos)):
        chain_parts.append(
            f"[{idx}:v]{vf},setsar=1[v{idx}]"
        )
        chain_parts.append(
            ""
            f"[{idx}:a]aformat=sample_fmts=fltp:sample_rates=48000:"
            f"channel_layouts=stereo,aresample=async=1:first_pts=0[a{idx}]"
        )
        concat_inputs.append(f"[v{idx}][a{idx}]")

    chain_parts.append(
        f"{''.join(concat_inputs)}concat=n={len(videos)}:v=1:a=1[vout][aout]"
    )
    filter_complex = ";".join(chain_parts)

    cmd.extend(
        [
            "-filter_complex",
            filter_complex,
            "-map",
            "[vout]",
            "-map",
            "[aout]",
            "-c:v",
            "libx264",
            "-preset",
            preset,
            "-crf",
            str(crf),
            "-c:a",
            "aac",
            "-b:a",
            "320k",
            "-movflags",
            "+faststart",
            str(output_path),
        ]
    )

    result = run_cmd(cmd)
    if result.returncode != 0:
        raise RuntimeError(
            "2K re-encode merge failed.\n\n"
            f"Command: {' '.join(cmd)}\n\n"
            f"Error:\n{result.stderr}"
        )


def main() -> int:
    args = parse_args()
    input_dir = Path(args.input_dir)
    output_dir = Path(args.output_dir)
    output_path = output_dir / args.output_name
    lock_path = output_dir / ".merge.lock"
    temp_output_path = output_dir / f".{args.output_name}.tmp.mp4"

    lock_fd: int | None = None
    lock_acquired = False

    try:
        ensure_ffmpeg()
        output_dir.mkdir(parents=True, exist_ok=True)

        try:
            lock_fd = os.open(str(lock_path), os.O_CREAT | os.O_EXCL | os.O_WRONLY)
            os.write(lock_fd, str(os.getpid()).encode("utf-8"))
            lock_acquired = True
        except FileExistsError as exc:
            raise RuntimeError(
                "Another merge is already running (lock file exists). "
                "Please wait for it to finish or delete output/.merge.lock if stale."
            ) from exc

        videos = find_numbered_videos(input_dir)
        expected_duration = sum(ffprobe_duration_seconds(video) for video in videos)
        print(f"Found {len(videos)} videos. Merging in order:")
        for video in videos:
            print(f" - {video.name}")

        with tempfile.TemporaryDirectory(prefix="nrjd_merge_") as temp_dir:
            concat_file = Path(temp_dir) / "concat_list.txt"
            build_concat_file(videos, concat_file)

            used_stream_copy = False
            if args.try_stream_copy:
                used_stream_copy = try_stream_copy(concat_file, temp_output_path)

            if used_stream_copy:
                actual_duration = ffprobe_duration_seconds(temp_output_path)
                # If stream-copy result is unexpectedly shorter, switch to
                # deterministic re-encode to avoid missing segments.
                if actual_duration + 2.0 < expected_duration:
                    print(
                        "Stream-copy output duration is shorter than expected. "
                        "Re-rendering in 2K mode for reliability..."
                    )
                    merge_with_2k_reencode(
                        videos=videos,
                        output_path=temp_output_path,
                        crf=args.crf,
                        preset=args.preset,
                    )
            else:
                merge_with_2k_reencode(
                    videos=videos,
                    output_path=temp_output_path,
                    crf=args.crf,
                    preset=args.preset,
                )

        os.replace(temp_output_path, output_path)

        if output_path.exists():
            print(f"Merged video created successfully: {output_path}")
        else:
            raise RuntimeError("Merge process finished, but output file was not created.")

        return 0

    except Exception as exc:  # noqa: BLE001
        print(f"Error: {exc}", file=sys.stderr)
        return 1
    finally:
        if lock_fd is not None:
            os.close(lock_fd)
        if lock_acquired and lock_path.exists():
            lock_path.unlink()
        if temp_output_path.exists():
            temp_output_path.unlink()


if __name__ == "__main__":
    raise SystemExit(main())
