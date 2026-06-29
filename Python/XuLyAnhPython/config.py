from pathlib import Path

INPUT_DIR = Path("./input")
OUTPUT_DIR = Path("./output")

INPUT_DIR.mkdir(exist_ok=True)
OUTPUT_DIR.mkdir(exist_ok=True)

MAX_FILE_SIZE_MB = 15

VIDEO_FPS = 60
VIDEO_DURATION_SEC = 1

ALLOWED_FRAME_COUNTS = {1, 12, 30, 60}

ENABLE_GLOBAL_NOISE = True
ENABLE_EDGE_JITTER = False