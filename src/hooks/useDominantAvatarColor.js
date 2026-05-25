import { useEffect, useState } from "react";

const FALLBACK_COLOR = {
    r: 120,
    g: 120,
    b: 120,
};

const clamp = (value, min, max) => {
    return Math.min(max, Math.max(min, value));
};

const getSaturation = (r, g, b) => {
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);

    if (max === 0) return 0;

    return (max - min) / max;
};

const getLuminance = (r, g, b) => {
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const extractDominantColor = (imageData) => {
    const buckets = new Map();
    const bucketSize = 24;
    const data = imageData.data;

    for (let index = 0; index < data.length; index += 4 * 3) {
        const r = data[index];
        const g = data[index + 1];
        const b = data[index + 2];
        const alpha = data[index + 3];

        if (alpha < 128) continue;

        const luminance = getLuminance(r, g, b);

        // Bỏ qua vùng gần trắng quá mạnh để tránh avatar nền trắng làm màu chủ đạo.
        if (luminance > 245) continue;

        const bucketR = Math.round(r / bucketSize) * bucketSize;
        const bucketG = Math.round(g / bucketSize) * bucketSize;
        const bucketB = Math.round(b / bucketSize) * bucketSize;
        const key = `${bucketR}-${bucketG}-${bucketB}`;

        const current = buckets.get(key) || {
            count: 0,
            r: 0,
            g: 0,
            b: 0,
            saturation: 0,
            luminance: 0,
        };

        current.count += 1;
        current.r += r;
        current.g += g;
        current.b += b;
        current.saturation += getSaturation(r, g, b);
        current.luminance += luminance;

        buckets.set(key, current);
    }

    if (buckets.size === 0) return FALLBACK_COLOR;

    let bestBucket = null;
    let bestScore = -Infinity;

    buckets.forEach((bucket) => {
        const avgSaturation = bucket.saturation / bucket.count;
        const avgLuminance = bucket.luminance / bucket.count;

        const luminancePenalty =
            avgLuminance < 24 || avgLuminance > 232 ? 0.72 : 1;

        const score =
            bucket.count * (1 + avgSaturation * 0.85) * luminancePenalty;

        if (score > bestScore) {
            bestScore = score;
            bestBucket = bucket;
        }
    });

    if (!bestBucket) return FALLBACK_COLOR;

    return {
        r: clamp(Math.round(bestBucket.r / bestBucket.count), 0, 255),
        g: clamp(Math.round(bestBucket.g / bestBucket.count), 0, 255),
        b: clamp(Math.round(bestBucket.b / bestBucket.count), 0, 255),
    };
};

export default function useDominantAvatarColor(avatarSrc) {
    const [color, setColor] = useState(FALLBACK_COLOR);

    useEffect(() => {
        if (!avatarSrc) {
            setColor(FALLBACK_COLOR);
            return;
        }

        let isCancelled = false;

        const image = new Image();
        image.crossOrigin = "anonymous";
        image.decoding = "async";

        image.onload = () => {
            if (isCancelled) return;

            try {
                const canvas = document.createElement("canvas");
                const size = 40;

                canvas.width = size;
                canvas.height = size;

                const context = canvas.getContext("2d", {
                    willReadFrequently: true,
                });

                if (!context) {
                    setColor(FALLBACK_COLOR);
                    return;
                }

                context.drawImage(image, 0, 0, size, size);

                const imageData = context.getImageData(0, 0, size, size);
                const dominantColor = extractDominantColor(imageData);

                setColor(dominantColor);
            } catch (error) {
                setColor(FALLBACK_COLOR);
            }
        };

        image.onerror = () => {
            if (!isCancelled) {
                setColor(FALLBACK_COLOR);
            }
        };

        image.src = avatarSrc;

        return () => {
            isCancelled = true;
            image.onload = null;
            image.onerror = null;
        };
    }, [avatarSrc]);

    return color;
}