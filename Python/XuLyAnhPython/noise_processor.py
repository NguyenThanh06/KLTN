import numpy as np
import cv2
from config import (
    ENABLE_GLOBAL_NOISE,
    ENABLE_EDGE_JITTER
)

def soft_light(base, blend):
    base = base.astype(np.float32) / 255.0
    blend = blend.astype(np.float32) / 255.0

    result = np.where(
        blend <= 0.5,
        base - (1.0 - 2.0 * blend) * base * (1.0 - base),
        base + (2.0 * blend - 1.0) * (
            np.sqrt(base) - base
        )
    )

    return np.clip(
        result * 255,
        0,
        255
    ).astype(np.uint8)


def apply_overlay(
        img,
        dominant_color,
        overlay_level
):
    if overlay_level <= 0:
        return img

    low = max(
        overlay_level - 15,
        0
    )

    high = max(
        overlay_level,
        0
    )

    opacity = np.random.randint(
        low,
        high + 1
    ) / 100.0

    overlay = np.zeros_like(img)
    overlay[:] = dominant_color

    soft = soft_light(
        img,
        overlay
    )

    result = (
        img.astype(np.float32)
        * (1 - opacity)
        + soft.astype(np.float32)
        * opacity
    )

    return np.clip(
        result,
        0,
        255
    ).astype(np.uint8)


def apply_global_noise(
        img,
        noise_level,
        is_gray_noise
):
    if noise_level <= 0:
        return img

    h, w = img.shape[:2]

    mask = (
        np.random.rand(h, w)
        < (noise_level / 100.0)
    )

    ys, xs = np.where(mask)

    count = len(ys)

    if count == 0:
        return img

    colors = img[ys, xs].astype(
        np.float32
    )

    if is_gray_noise:
        v = np.random.randint(
            0,
            256,
            (count, 1)
        )

        random_colors = np.repeat(
            v,
            3,
            axis=1
        ).astype(np.float32)

    else:
        random_colors = np.random.randint(
            0,
            256,
            (count, 3)
        ).astype(np.float32)

    low = int(noise_level / 10)
    high = int(noise_level * 2)

    low = np.clip(
        low,
        0,
        100
    )

    high = np.clip(
        high,
        0,
        100
    )

    if high < low:
        high = low

    c = np.random.randint(
        low,
        high + 1,
        count
    ).astype(np.float32)

    c = c[:, None] / 100.0

    result = (
        colors * (1 - c)
        + random_colors * c
    )

    img[ys, xs] = np.clip(
        result,
        0,
        255
    ).astype(np.uint8)

    return img

def apply_edge_jitter(
        img,
        edge_map,
        gx,
        gy,
        noise_level
):
    percent = noise_level // 2

    if percent <= 0:
        return img

    ys, xs = np.where(
        edge_map > 0
    )

    count = len(ys)

    if count == 0:
        return img

    keep = (
        np.random.rand(count)
        < (percent / 100.0)
    )

    ys = ys[keep]
    xs = xs[keep]

    if len(ys) == 0:
        return img

    dx = np.sign(
        gx[ys, xs]
    ).astype(np.int32)

    dy = np.sign(
        gy[ys, xs]
    ).astype(np.int32)

    ny = np.clip(
        ys + dy,
        0,
        img.shape[0] - 1
    )

    nx = np.clip(
        xs + dx,
        0,
        img.shape[1] - 1
    )

    result = img.copy()

    result[ny, nx] = img[ys, xs]

    return result


def process_2x2_blocks(
        img,
        edge_map,
        noise_level
):
    if noise_level <= 0:
        return img

    h, w = edge_map.shape

    offset_y = np.random.randint(0, 2)
    offset_x = np.random.randint(0, 2)

    start_y = offset_y
    start_x = offset_x

    usable_h = (
        (h - start_y) // 2
    ) * 2

    usable_w = (
        (w - start_x) // 2
    ) * 2

    if usable_h <= 0 or usable_w <= 0:
        return img

    end_y = start_y + usable_h
    end_x = start_x + usable_w

    edge_crop = edge_map[
        start_y:end_y,
        start_x:end_x
    ]

    img_crop = img[
        start_y:end_y,
        start_x:end_x
    ]

    bh = usable_h // 2
    bw = usable_w // 2

    edge_blocks = edge_crop.reshape(
        bh,
        2,
        bw,
        2
    ).transpose(0, 2, 1, 3)

    img_blocks = img_crop.reshape(
        bh,
        2,
        bw,
        2,
        3
    ).transpose(0, 2, 1, 3, 4)

    sums = edge_blocks.sum(
        axis=(2, 3)
    )

    valid = (
        (sums > 0)
        & (sums < 4)
    )

    if not np.any(valid):
        return img

    rotate_mask = (
        np.random.rand(bh, bw)
        < (noise_level / 100.0)
    )

    rotate_mask &= valid

    ys, xs = np.where(
        rotate_mask
    )

    for by, bx in zip(ys, xs):
        img_blocks[by, bx] = np.rot90(
            img_blocks[by, bx],
            2
        )

    blur_percent = (
        noise_level
        - round(noise_level / 2)
    )

    blur_mask = (
        np.random.rand(bh, bw)
        < (blur_percent / 100.0)
    )

    blur_mask &= valid

    ys, xs = np.where(
        blur_mask
    )

    for by, bx in zip(ys, xs):
        block = img_blocks[by, bx]
        edge = edge_blocks[by, bx]

        flat_pixels = block.reshape(
            4,
            3
        )

        flat_edge = edge.reshape(
            4
        )

        selected = np.random.randint(
            0,
            4
        )

        my_type = flat_edge[
            selected
        ]

        opposite = np.where(
            flat_edge != my_type
        )[0]

        if len(opposite) == 0:
            continue

        source = np.random.choice(
            opposite
        )

        flat_pixels[
            selected
        ] = flat_pixels[
            source
        ]

        img_blocks[
            by,
            bx
        ] = flat_pixels.reshape(
            2,
            2,
            3
        )

    img_crop[:] = (
        img_blocks
        .transpose(0, 2, 1, 3, 4)
        .reshape(
            usable_h,
            usable_w,
            3
        )
    )

    return img



def process_frame(
        original,
        edge_map,
        gx,
        gy,
        dominant_color,
        noise_level,
        is_gray_noise,
        overlay_level
):
    img = original.copy()

    img = process_2x2_blocks(
        img,
        edge_map,
        noise_level
    )
    if ENABLE_EDGE_JITTER:
        img = apply_edge_jitter(
            img,
            edge_map,
            gx,
            gy,
            noise_level
        )

    if ENABLE_GLOBAL_NOISE:
        img = apply_global_noise(
            img,
            noise_level,
            is_gray_noise
        )

    img = apply_overlay(
        img,
        dominant_color,
        overlay_level
    )

    return img