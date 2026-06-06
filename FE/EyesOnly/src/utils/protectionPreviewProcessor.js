/*
 * Xử lý preview bảo vệ ảnh ngay trên Frontend.
 *
 * Thuật toán được viết tương ứng với FileProtectionService ở Backend:
 * - Chuẩn hóa ảnh sang nền RGB.
 * - Phủ màu Soft Light.
 * - Random opacity theo từng frame.
 * - Thêm nhiễu theo block 2x2.
 * - Sinh 1 / 12 / 30 / 60 frame cho chu kỳ phát 1 giây.
 *
 * Lưu ý:
 * - Preview chỉ xử lý ở kích thước hiển thị tối đa 512px để tránh lag trình duyệt.
 * - Khi đăng bài, Backend vẫn xử lý ảnh gốc đầy đủ độ phân giải.
 */

const ALLOWED_FRAME_COUNTS = new Set([1, 12, 30, 60]);

const DEFAULT_COLOR_COVERAGE_PERCENT = 5;
const COLOR_COVERAGE_RANDOM_RANGE = 10;

/*
 * Khung preview của bạn đang max-h-128, tương đương khoảng 512px.
 * Không nên xử lý ảnh gốc 2000 - 4000px trực tiếp ở FE với 60 frame,
 * vì trình duyệt sẽ rất dễ bị khựng.
 */
const MAX_PREVIEW_EDGE = 512;

const DEFAULT_STATIC_COLOR = "#888888";
const DEFAULT_FALLBACK_OVERLAY_COLOR = [128, 80, 180];

const clamp = (value, min = 0, max = 255) =>
    Math.max(min, Math.min(max, value));

const toFiniteNumber = (value, fallback) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const randomBetween = (min, max) =>
    min + Math.floor(Math.random() * (max - min + 1));

/*
 * Chuẩn hóa setting trước khi xử lý preview.
 *
 * Logic này tương ứng với các hàm resolve... ở Backend:
 * - frameCount sai thì đưa về 12.
 * - noiseLevel giới hạn 0 - 100.
 * - colorCoverage giới hạn 0 - 90.
 * - mode sai thì đưa về dynamic.
 */
export function normalizeProtectionPreviewSettings(settings = {}) {
    const rawFrameCount = Math.round(
        toFiniteNumber(settings.frameCount, 12)
    );

    const frameCount = ALLOWED_FRAME_COUNTS.has(rawFrameCount)
        ? rawFrameCount
        : 12;

    const noiseLevel = clamp(
        Math.round(toFiniteNumber(settings.noiseLevel, 20)),
        0,
        100
    );

    const colorCoverage = clamp(
        Math.round(
            toFiniteNumber(
                settings.colorCoverage,
                DEFAULT_COLOR_COVERAGE_PERCENT
            )
        ),
        0,
        90
    );

    const noiseColorMode =
        settings.noiseColorMode === "static"
            ? "static"
            : "dynamic";

    const staticColor =
        /^#[0-9a-fA-F]{6}$/.test(settings.staticColor || "")
            ? settings.staticColor
            : DEFAULT_STATIC_COLOR;

    return {
        noiseLevel,
        colorCoverage,
        noiseColorMode,
        staticColor,
        frameCount,
    };
}

/*
 * Đọc mã màu dạng #RRGGBB.
 *
 * Backend của bạn dùng màu fallback tím nhạt khi mã màu sai,
 * nên FE cũng giữ hành vi đó.
 */
function parseHexColor(hex) {
    if (!/^#[0-9a-fA-F]{6}$/.test(hex || "")) {
        return DEFAULT_FALLBACK_OVERLAY_COLOR;
    }

    return [
        Number.parseInt(hex.slice(1, 3), 16),
        Number.parseInt(hex.slice(3, 5), 16),
        Number.parseInt(hex.slice(5, 7), 16),
    ];
}

/*
 * Tạo màu động cho từng frame.
 *
 * Tương ứng với createDynamicOverlayColor() ở Backend:
 * - RGB ban đầu nằm trong khoảng 40 - 215.
 * - Có thêm biến thiên nhẹ theo frameIndex.
 */
function createDynamicOverlayColor(frameIndex) {
    const r = 40 + randomBetween(0, 175);
    const g = 40 + randomBetween(0, 175);
    const b = 40 + randomBetween(0, 175);

    const shift = frameIndex % 24;

    return [
        clamp(r + shift),
        clamp(g + Math.floor(shift / 2)),
        clamp(b + Math.floor(shift / 3)),
    ];
}

function resolveOverlayColor(settings, frameIndex) {
    if (settings.noiseColorMode === "static") {
        return parseHexColor(settings.staticColor);
    }

    return createDynamicOverlayColor(frameIndex);
}

/*
 * Random opacity phủ màu cho từng frame.
 *
 * Ví dụ:
 * - colorCoverage = 5  -> random từ 5% đến 15%.
 * - colorCoverage = 20 -> random từ 20% đến 30%.
 */
function randomOverlayOpacity(colorCoverage) {
    const minPercent = clamp(colorCoverage, 0, 90);
    const maxPercent = Math.min(
        100,
        minPercent + COLOR_COVERAGE_RANDOM_RANGE
    );

    return randomBetween(minPercent, maxPercent) / 100;
}

/*
 * Hàm phụ dùng trong công thức Soft Light.
 * Công thức tương ứng với softLightD() ở Backend.
 */
function softLightD(value) {
    if (value <= 0.25) {
        return ((16 * value - 12) * value + 4) * value;
    }

    return Math.sqrt(value);
}

/*
 * Tính Soft Light cho một kênh màu R / G / B.
 * Công thức tương ứng với softLightChannel() ở Backend.
 */
function softLightChannel(baseValue, overlayValue, opacity) {
    const base = baseValue / 255;
    const overlay = overlayValue / 255;

    let blended;

    if (overlay <= 0.5) {
        blended =
            base -
            (1 - 2 * overlay) * base * (1 - base);
    } else {
        blended =
            base +
            (2 * overlay - 1) * (softLightD(base) - base);
    }

    const mixed =
        base * (1 - opacity) +
        blended * opacity;

    return clamp(Math.round(mixed * 255));
}

/*
 * Phủ lớp màu Soft Light lên toàn bộ pixel của frame.
 */
function applySoftLightOverlay(
    pixels,
    overlayColor,
    opacity
) {
    const [overlayRed, overlayGreen, overlayBlue] = overlayColor;

    for (let index = 0; index < pixels.length; index += 4) {
        pixels[index] = softLightChannel(
            pixels[index],
            overlayRed,
            opacity
        );

        pixels[index + 1] = softLightChannel(
            pixels[index + 1],
            overlayGreen,
            opacity
        );

        pixels[index + 2] = softLightChannel(
            pixels[index + 2],
            overlayBlue,
            opacity
        );

        /*
         * Preview dùng RGB tương tự BufferedImage.TYPE_INT_RGB của Backend.
         */
        pixels[index + 3] = 255;
    }
}

/*
 * Thêm nhiễu theo block 2x2.
 *
 * Logic được giữ giống Backend:
 * - intensity = noiseLevel.
 * - visibleIntensity = noiseLevel + 12, giới hạn tối đa 130.
 * - Mỗi block có offset R/G/B riêng.
 * - Có thêm biến thiên theo frame.
 * - Một số block ngẫu nhiên nhận nhiễu mạnh hơn.
 */
function applyNoise(
    pixels,
    width,
    height,
    noiseLevel,
    frameIndex
) {
    const intensity = clamp(
        Math.round(noiseLevel),
        0,
        100
    );

    if (intensity <= 0) {
        return;
    }

    const blockSize = 2;

    const visibleIntensity = Math.min(
        130,
        Math.max(8, intensity + 12)
    );

    for (let y = 0; y < height; y += blockSize) {
        for (let x = 0; x < width; x += blockSize) {
            let offsetRed =
                randomBetween(-visibleIntensity, visibleIntensity) +
                (frameIndex % 5);

            let offsetGreen =
                randomBetween(-visibleIntensity, visibleIntensity) +
                (frameIndex % 3);

            let offsetBlue =
                randomBetween(-visibleIntensity, visibleIntensity) +
                (frameIndex % 7);

            /*
             * Java đang dùng intensity / 8 với kiểu int,
             * nên FE dùng Math.floor để khớp hành vi.
             */
            const strongNoiseChance = Math.max(
                2,
                Math.floor(intensity / 8)
            );

            const isStrongNoiseBlock =
                randomBetween(0, 99) < strongNoiseChance;

            if (isStrongNoiseBlock) {
                const strongOffset = randomBetween(
                    -visibleIntensity,
                    visibleIntensity
                );

                offsetRed += strongOffset;
                offsetGreen += strongOffset;
                offsetBlue += strongOffset;
            }

            for (let blockY = 0; blockY < blockSize; blockY += 1) {
                for (let blockX = 0; blockX < blockSize; blockX += 1) {
                    const pixelX = x + blockX;
                    const pixelY = y + blockY;

                    if (pixelX >= width || pixelY >= height) {
                        continue;
                    }

                    const pixelIndex =
                        (pixelY * width + pixelX) * 4;

                    pixels[pixelIndex] = clamp(
                        pixels[pixelIndex] + offsetRed
                    );

                    pixels[pixelIndex + 1] = clamp(
                        pixels[pixelIndex + 1] + offsetGreen
                    );

                    pixels[pixelIndex + 2] = clamp(
                        pixels[pixelIndex + 2] + offsetBlue
                    );

                    pixels[pixelIndex + 3] = 255;
                }
            }
        }
    }
}

/*
 * Đọc ảnh từ URL object của file người dùng vừa chọn.
 */
function loadImage(imageUrl) {
    return new Promise((resolve, reject) => {
        const image = new Image();

        image.decoding = "async";

        image.onload = () => resolve(image);

        image.onerror = () => {
            reject(new Error("Không thể đọc ảnh để tạo preview."));
        };

        image.src = imageUrl;
    });
}

/*
 * Chuẩn hóa ảnh cho preview:
 * - Thu nhỏ tối đa 512px để xử lý nhẹ hơn.
 * - Tô nền đen trước khi drawImage để vùng alpha được xử lý
 *   giống normalizeOriginalImageForKteo() ở Backend.
 */
function createNormalizedPreviewSource(image) {
    const originalWidth =
        image.naturalWidth || image.width;

    const originalHeight =
        image.naturalHeight || image.height;

    const scale = Math.min(
        1,
        MAX_PREVIEW_EDGE /
            Math.max(originalWidth, originalHeight)
    );

    const width = Math.max(
        1,
        Math.round(originalWidth * scale)
    );

    const height = Math.max(
        1,
        Math.round(originalHeight * scale)
    );

    const sourceCanvas = document.createElement("canvas");
    sourceCanvas.width = width;
    sourceCanvas.height = height;

    const sourceContext = sourceCanvas.getContext("2d", {
        willReadFrequently: true,
    });

    sourceContext.fillStyle = "#000000";
    sourceContext.fillRect(0, 0, width, height);
    sourceContext.drawImage(image, 0, 0, width, height);

    const sourceImageData =
        sourceContext.getImageData(0, 0, width, height);

    return {
        width,
        height,
        pixels: sourceImageData.data,
    };
}

/*
 * Cho browser có cơ hội vẽ spinner giữa các đợt xử lý frame.
 */
function yieldToBrowser() {
    return new Promise((resolve) => {
        window.requestAnimationFrame(() => resolve());
    });
}

/*
 * Tạo preview ảnh gốc chưa qua bảo vệ.
 * Dùng khi người dùng mới chọn ảnh nhưng chưa bấm xem trước.
 */
export async function buildOriginalPreviewFrame(imageUrl) {
    const image = await loadImage(imageUrl);
    const source = createNormalizedPreviewSource(image);

    return {
        width: source.width,
        height: source.height,
        frameCount: 1,
        frames: [
            new ImageData(
                new Uint8ClampedArray(source.pixels),
                source.width,
                source.height
            ),
        ],
    };
}

/*
 * Tạo danh sách frame preview bảo vệ ảnh.
 *
 * Frame được sinh theo cùng thứ tự xử lý với Backend:
 * - copy ảnh gốc;
 * - phủ Soft Light;
 * - thêm nhiễu.
 */
export async function buildProtectedPreviewFrames(
    imageUrl,
    rawSettings
) {
    const settings =
        normalizeProtectionPreviewSettings(rawSettings);

    const image = await loadImage(imageUrl);
    const source = createNormalizedPreviewSource(image);

    const frames = [];

    for (
        let frameIndex = 0;
        frameIndex < settings.frameCount;
        frameIndex += 1
    ) {
        const framePixels =
            new Uint8ClampedArray(source.pixels);

        const overlayColor =
            resolveOverlayColor(settings, frameIndex);

        const overlayOpacity =
            randomOverlayOpacity(settings.colorCoverage);

        applySoftLightOverlay(
            framePixels,
            overlayColor,
            overlayOpacity
        );

        applyNoise(
            framePixels,
            source.width,
            source.height,
            settings.noiseLevel,
            frameIndex
        );

        frames.push(
            new ImageData(
                framePixels,
                source.width,
                source.height
            )
        );

        /*
         * Với 30 hoặc 60 frame, thỉnh thoảng nhường lượt cho browser
         * để giao diện không bị đứng hoàn toàn trong lúc xử lý.
         */
        if ((frameIndex + 1) % 4 === 0) {
            await yieldToBrowser();
        }
    }

    return {
        width: source.width,
        height: source.height,
        frameCount: settings.frameCount,
        frames,
    };
}