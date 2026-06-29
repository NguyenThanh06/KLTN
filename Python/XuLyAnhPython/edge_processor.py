import cv2
import numpy as np


def build_edge_map(img):
    gray = cv2.cvtColor(
        img,
        cv2.COLOR_RGB2GRAY
    )

    gray = cv2.GaussianBlur(
        gray,
        (3, 3),
        0
    )

    edge = cv2.Canny(
        gray,
        80,
        160
    )

    kernel = np.ones(
        (3, 3),
        np.uint8
    )

    edge = cv2.morphologyEx(
        edge,
        cv2.MORPH_CLOSE,
        kernel
    )

    gx = cv2.Sobel(
        gray,
        cv2.CV_32F,
        1,
        0,
        ksize=3
    )

    gy = cv2.Sobel(
        gray,
        cv2.CV_32F,
        0,
        1,
        ksize=3
    )

    return (
        (edge > 0).astype(np.uint8),
        gx,
        gy
    )