import numpy as np


def compute_dominant_color(img):
    quantized = img >> 5

    idx = (
        (quantized[:, :, 0] << 6)
        + (quantized[:, :, 1] << 3)
        + quantized[:, :, 2]
    )

    idx = idx.flatten()

    hist = np.bincount(
        idx,
        minlength=512
    )

    best = np.argmax(hist)

    r = (best >> 6) & 7
    g = (best >> 3) & 7
    b = best & 7

    return np.array([
        r * 32 + 16,
        g * 32 + 16,
        b * 32 + 16
    ], dtype=np.uint8)