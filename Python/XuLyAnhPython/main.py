from pathlib import Path
from image_processor import process_image
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import JSONResponse, Response
from PIL import Image
import io, uuid, tempfile, subprocess, os

app = FastAPI()

PREVIEW_MAX_EDGE = 720

def resize_for_preview(
    img: Image.Image,
    max_edge: int = PREVIEW_MAX_EDGE
) -> Image.Image:
    width, height = img.size

    longest_edge = max(width, height)

    if longest_edge <= max_edge:
        return img

    scale = max_edge / longest_edge

    new_width = max(2, int(width * scale))
    new_height = max(2, int(height * scale))

    return img.resize(
        (new_width, new_height),
        Image.Resampling.LANCZOS
    )

async def create_protected_video(
    file: UploadFile,
    frame_count: int,
    noise_level: int,
    color_coverage: int,
    noise_mode: str,
    is_preview: bool
):
    img = Image.open(io.BytesIO(await file.read()))

    if is_preview:
        img = resize_for_preview(img)

    fd, out = tempfile.mkstemp(suffix=".webm")
    os.close(fd)

    try:
        process_image(
            img=img,
            noise_level=noise_level,
            is_gray_noise=noise_mode,
            overlay_level=color_coverage,
            frame_count=frame_count,
            out_path=out,
        )

        with open(out, "rb") as fp:
            data = fp.read()

        return Response(
            content=data,
            media_type="video/webm"
        )

    finally:
        if os.path.exists(out):
            os.remove(out)

@app.post("/protect")
async def protect(
    file: UploadFile = File(...),
    frameCount: int = Form(1),
    noiseLevel: int = Form(0),
    colorCoverage: int = Form(0),
    noiseMode: str = Form("color")
):
    return await create_protected_video(
        file=file,
        frame_count=frameCount,
        noise_level=noiseLevel,
        color_coverage=colorCoverage,
        noise_mode=noiseMode,
        is_preview=False
    )

@app.post("/protect-preview")
async def protect_preview(
    file: UploadFile = File(...),
    frameCount: int = Form(1),
    noiseLevel: int = Form(0),
    colorCoverage: int = Form(0),
    noiseMode: str = Form("color")
):
    print(f"Received file: {file.filename}")
    return await create_protected_video(
        file=file,
        frame_count=frameCount,
        noise_level=noiseLevel,
        color_coverage=colorCoverage,
        noise_mode=noiseMode,
        is_preview=True
    )