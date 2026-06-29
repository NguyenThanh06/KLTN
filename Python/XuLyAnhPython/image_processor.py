import os
import shutil
import tempfile
from pathlib import Path

import cv2
import imageio.v3 as iio
import numpy as np
from PIL import Image

from config import (
    INPUT_DIR,
    OUTPUT_DIR,
    MAX_FILE_SIZE_MB,
    VIDEO_FPS,
    VIDEO_DURATION_SEC,
    ALLOWED_FRAME_COUNTS,
)

from edge_processor import build_edge_map
from noise_processor import process_frame
from overlay_processor import compute_dominant_color


def normalize_int(value, default, min_val, max_val):
    try:
        value = int(value)
    except:
        return default

    if value < min_val or value > max_val:
        return default

    return value


def normalize_bool(value):
    if isinstance(value, bool):
        return value

    if value is None:
        return True

    value = str(value).strip().lower()

    if value in ("grayscale","true", "1", "yes", "y"):
        return True

    if value in ("color","false", "0", "no", "n"):
        return False

    return True


def normalize_frame_count(value):
    try:
        value = int(value)
    except:
        return 1

    if value not in ALLOWED_FRAME_COUNTS:
        return 1

    return value


def load_image(img: Image):
    img = img.convert("RGB")

    return np.array(img, dtype=np.uint8)



def build_video_frames(processed_frames):
    result = []

    repeat = VIDEO_FPS // len(processed_frames)

    for frame in processed_frames:
        for _ in range(repeat):
            result.append(frame)

    while len(result) < VIDEO_FPS:
        result.append(processed_frames[-1])

    return np.array(result, dtype=np.uint8)


def save_kteo(frames, output_path):

    print("[8/8] Encoding video...")

    iio.imwrite(
        output_path,
        frames,
        fps=VIDEO_FPS,
        codec="libvpx-vp9",
        ffmpeg_params=[
            "-crf", "20",
            "-b:v", "0",
            "-deadline", "realtime",
            "-cpu-used", "8",
            "-pix_fmt", "yuv420p",
            "-an",
        ],
        macro_block_size=1
    )
    print(f"hi")


def process_image(
        img,
        noise_level,
        is_gray_noise,
        overlay_level,
        frame_count,
        out_path
):
    print("[1/8] Normalizing parameters...")

    noise_level = normalize_int(
        noise_level,
        0,
        0,
        100
    )

    overlay_level = normalize_int(
        overlay_level,
        0,
        0,
        100
    )

    is_gray_noise = normalize_bool(
        is_gray_noise
    )

    frame_count = normalize_frame_count(
        frame_count
    )

    print("[2/8] Loading image...")

    original = load_image(img)

    print("[3/8] Generating edge map...")

    edge_map, gx, gy = build_edge_map(
        original
    )


    print("[4/8] Computing dominant color...")

    dominant_color = compute_dominant_color(
        original
    )

    frames = []

    for i in range(frame_count):
        print(
            f"[Frame {i+1}/{frame_count}] Processing..."
        )

        frame = process_frame(
            original=original,
            edge_map=edge_map,
            gx=gx,
            gy=gy,
            dominant_color=dominant_color,
            noise_level=noise_level,
            is_gray_noise=is_gray_noise,
            overlay_level=overlay_level
        )

        frames.append(frame)

    print("[7/8] Building frame sequence...")

    video_frames = build_video_frames(frames)

    out_path

    result = save_kteo(
        video_frames,
        out_path
    )

    print("Hoàn tất:")
    print(result)