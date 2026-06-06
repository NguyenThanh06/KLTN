package com.developer.EyesOnly.Service;

import com.developer.EyesOnly.DTO.Request.ImageProtectionOptionRequest;
import com.developer.EyesOnly.Exception.AppException;
import lombok.AllArgsConstructor;
import lombok.Data;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.*;
import java.nio.file.*;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.*;
import java.util.concurrent.ThreadLocalRandom;
@Service
public class FileProtectionService {

    @Value("${app.storage.post-directory:uploads/posts}")
    private String postStorageDirectory;

    @Value("${app.ffmpeg.path:ffmpeg}")
    private String ffmpegPath;
    /*
     * Các số frame hợp lệ từ giao diện.
     * Tất cả kteo đều dài 1 giây, chỉ khác số frame trong 1 giây.
     */
    private static final Set<Integer> ALLOWED_FRAME_COUNTS = Set.of(1, 12, 30, 60);

    /*
     * Nếu FE không gửi colorCoverage thì mặc định phủ màu từ 5% đến 15%.
     */
    private static final int DEFAULT_COLOR_COVERAGE_PERCENT = 5;

    /*
     * Mỗi frame random opacity trong khoảng:
     * colorCoverage -> colorCoverage + 10
     */
    private static final int COLOR_COVERAGE_RANDOM_RANGE = 10;
    /*
     * Kích thước cơ sở để xác định số cột và số hàng của lưới xác thực.
     *
     * Ví dụ:
     * - width = 816  -> floor(816 / 25) = 32 cột.
     * - height = 1456 -> floor(1456 / 25) = 58 hàng.
     *
     * Dòng đầu của verifyKey khi đó sẽ là:
     * 32 58
     */
    private static final int VERIFY_GRID_CELL_BASE_SIZE = 25;

    /*
     * Bước gom nhóm màu khi tìm màu đại diện trong một ô lưới.
     *
     * Ảnh thực tế thường có rất nhiều sắc độ gần nhau.
     * Nếu đếm riêng từng mã RGB tuyệt đối thì màu đại diện có thể không ổn định.
     *
     * Với bước 16, các màu gần nhau được gom về cùng nhóm,
     * sau đó hệ thống lấy màu trung bình của nhóm xuất hiện nhiều nhất.
     *
     * Giá trị này phải giữ cố định cho dữ liệu đã lưu,
     * vì thay đổi thuật toán sẽ làm các verifyKey cũ không còn khớp.
     */
    private static final int COLOR_BUCKET_STEP = 16;
    /*
     * Kích thước tối đa của cạnh dài trong video preview.
     *
     * Chỉ áp dụng cho API xem trước.
     * Khi tạo KTEO thật, hệ thống vẫn xử lý ảnh gốc đầy đủ kích thước.
     */
    private static final int PREVIEW_MAX_EDGE = 480;
    /**
     * Kết quả sau khi bảo vệ 1 file ảnh
     */
    @Data
    @AllArgsConstructor
    public static class ProtectedFileResult {
        private String relativePath;
        private int width;
        private int height;
        private String verifyKey;
    }
    /**
     * Dữ liệu thống kê một nhóm màu gần nhau trong một ô lưới.
     *
     * Mỗi nhóm lưu:
     * - Số pixel thuộc nhóm.
     * - Tổng R, G, B thật của các pixel trong nhóm.
     *
     * Sau khi tìm được nhóm xuất hiện nhiều nhất,
     * hệ thống lấy trung bình R/G/B của nhóm đó làm màu đại diện.
     */
    @Data
    private static class ColorBucket {
        private long count;
        private long totalRed;
        private long totalGreen;
        private long totalBlue;

        /**
         * Thêm một pixel vào nhóm màu hiện tại.
         */
        public void addPixel(Color color) {
            count++;
            totalRed += color.getRed();
            totalGreen += color.getGreen();
            totalBlue += color.getBlue();
        }

        /**
         * Chuyển nhóm màu thành mã hex đại diện.
         *
         * Ví dụ:
         * R = 128, G = 132, B = 139
         * -> "80848B"
         */
        public String toRepresentativeHexColor() {
            if (count <= 0) {
                return "000000";
            }

            int red = (int) Math.round((double) totalRed / count);
            int green = (int) Math.round((double) totalGreen / count);
            int blue = (int) Math.round((double) totalBlue / count);

            return String.format(
                    "%02X%02X%02X",
                    red,
                    green,
                    blue
            );
        }
    }
    /**
     * Hàm chính xử lý một ảnh thành tệp KTEO.
     *
     * Luồng xử lý:
     * - Đọc ảnh gốc người dùng tải lên.
     * - Chuẩn hóa ảnh về RGB giống dữ liệu dùng để sinh frame KTEO.
     * - Tạo verifyKey từ ảnh gốc đã chuẩn hóa, trước khi tạo bất kỳ frame nào.
     * - Sinh các frame bảo vệ có nhiễu / phủ màu / watermark.
     * - Ghép frame thành video WebM dài 1 giây.
     * - Đổi đuôi tệp thành .kteo.
     * - Trả về đường dẫn, kích thước và verifyKey để PostService lưu vào KTEOFile.
     */
    public ProtectedFileResult protectAndSaveImageAsKteo(
            MultipartFile multipartFile,
            ImageProtectionOptionRequest option,
            Long postId,
            int orderIndex
    ) {
        Path tempFramesDir = null;

        try {
            BufferedImage uploadedImage =
                    ImageIO.read(multipartFile.getInputStream());

            if (uploadedImage == null) {
                throw new AppException(
                        "Không thể đọc dữ liệu ảnh từ tệp "
                                + multipartFile.getOriginalFilename()
                );
            }

            /*
             * Chuẩn hóa ảnh về TYPE_INT_RGB.
             *
             * Điều này đặc biệt quan trọng nếu ảnh PNG có vùng trong suốt.
             * File KTEO hiện tại của bạn cũng được sinh từ frame TYPE_INT_RGB,
             * nên verifyKey cần dựa trên cùng nội dung hình ảnh thực sự được xử lý.
             */
            BufferedImage originalImage =
                    normalizeOriginalImageForKteo(uploadedImage);

            int width = originalImage.getWidth();
            int height = originalImage.getHeight();

            /*
             * Tạo verifyKey từ ảnh gốc ngay trước khi tạo KTEO.
             *
             * verifyKey không được tính từ video sau khi đã thêm nhiễu,
             * vì mục tiêu của khóa là đối chiếu lại với ảnh gốc người dùng cung cấp.
             */
            String verifyKey = generateVerifyKey(originalImage);

            /*
             * Tạo thư mục lưu các tệp của Post.
             */
            Path postDir = Paths.get(
                    postStorageDirectory,
                    "post-" + postId
            );

            Files.createDirectories(postDir);

            /*
             * Tạo thư mục tạm để chứa các frame PNG của riêng ảnh hiện tại.
             */
            tempFramesDir = postDir.resolve(
                    "temp-frames-" + UUID.randomUUID()
            );

            Files.createDirectories(tempFramesDir);

            int frameCount = resolveFrameCount(option);
            int noiseLevel = resolveNoiseLevel(option);
            int colorCoverage = resolveColorCoverage(option);
            String noiseColorMode = resolveNoiseColorMode(option);
            String staticColor = resolveStaticColor(option);

            boolean useWatermark =
                    option != null
                            && Boolean.TRUE.equals(option.getUseWatermark());

            /*
             * Sinh từng frame bảo vệ từ ảnh gốc.
             */
            for (int frameIndex = 0;
                 frameIndex < frameCount;
                 frameIndex++) {

                BufferedImage frameImage = generateProtectedFrame(
                        originalImage,
                        noiseLevel,
                        colorCoverage,
                        noiseColorMode,
                        staticColor,
                        useWatermark,
                        frameIndex
                );

                File frameFile = tempFramesDir
                        .resolve(String.format("frame-%03d.png", frameIndex))
                        .toFile();

                ImageIO.write(frameImage, "png", frameFile);
            }

            /*
             * Trước tiên tạo video WebM chuẩn để FFmpeg xử lý ổn định.
             */
            String baseFileName =
                    "file-" + orderIndex + "-" + UUID.randomUUID();

            Path webmOutputPath =
                    postDir.resolve(baseFileName + ".webm");

            createVideoFromFrames(
                    tempFramesDir,
                    webmOutputPath,
                    frameCount
            );

            /*
             * Đổi đuôi .webm sang .kteo theo định dạng riêng của hệ thống.
             *
             * Bản chất dữ liệu bên trong vẫn là video WebM.
             */
            Path kteoPath =
                    postDir.resolve(baseFileName + ".kteo");

            Files.move(
                    webmOutputPath,
                    kteoPath,
                    StandardCopyOption.REPLACE_EXISTING
            );

            /*
             * Đường dẫn tương đối để lưu vào database.
             */
            String relativePath = Paths
                    .get(
                            "post-" + postId,
                            kteoPath.getFileName().toString()
                    )
                    .toString()
                    .replace("\\", "/");

            return new ProtectedFileResult(
                    relativePath,
                    width,
                    height,
                    verifyKey
            );

        } catch (IOException exception) {
            throw new AppException(
                    "Lỗi khi xử lý tệp ảnh: " + exception.getMessage()
            );

        } finally {
            /*
             * Dọn frame tạm ngay cả khi FFmpeg hoặc bước lưu tệp gặp lỗi.
             */
            if (tempFramesDir != null) {
                try {
                    deleteDirectoryRecursively(tempFramesDir);
                } catch (IOException exception) {
                    System.err.println(
                            "Không thể xóa thư mục frame tạm: "
                                    + tempFramesDir
                    );
                }
            }
        }
    }
    /**
     * Chuẩn hóa ảnh tải lên thành ảnh RGB dùng chung cho:
     * - Việc tạo verifyKey.
     * - Việc sinh các frame KTEO.
     *
     * Lý do:
     * - Ảnh PNG có thể có kênh alpha trong suốt.
     * - Frame video hiện tại của hệ thống dùng TYPE_INT_RGB.
     * - Việc chuẩn hóa giúp verifyKey phản ánh đúng hình ảnh
     *   đã được dùng để tạo ra tệp KTEO.
     */
    private BufferedImage normalizeOriginalImageForKteo(
            BufferedImage sourceImage
    ) {
        BufferedImage normalizedImage = new BufferedImage(
                sourceImage.getWidth(),
                sourceImage.getHeight(),
                BufferedImage.TYPE_INT_RGB
        );

        Graphics2D graphics = normalizedImage.createGraphics();

        try {
            /*
             * Với vùng ảnh trong suốt, dùng nền đen vì frame TYPE_INT_RGB
             * ban đầu cũng không có kênh trong suốt.
             */
            graphics.setColor(Color.BLACK);
            graphics.fillRect(
                    0,
                    0,
                    normalizedImage.getWidth(),
                    normalizedImage.getHeight()
            );

            graphics.drawImage(sourceImage, 0, 0, null);
        } finally {
            graphics.dispose();
        }

        return normalizedImage;
    }
    /**
     * Tạo verifyKey cho ảnh gốc dựa trên kích thước thực tế của ảnh.
     *
     * Quy tắc xác định lưới:
     * - Số cột = floor(width / 25).
     * - Số hàng = floor(height / 25).
     *
     * Ví dụ ảnh 816 x 1456:
     * - Số cột = floor(816 / 25) = 32.
     * - Số hàng = floor(1456 / 25) = 58.
     *
     * VerifyKey gồm hai dòng:
     * - Dòng 1: "<số cột> <số hàng>".
     * - Dòng 2: các mã màu đại diện của từng ô,
     *   theo thứ tự trái sang phải, trên xuống dưới.
     */
    private String generateVerifyKey(BufferedImage originalImage) {
        if (originalImage == null) {
            throw new AppException(
                    "Không thể tạo VerifyKey vì ảnh gốc không tồn tại"
            );
        }

        int width = originalImage.getWidth();
        int height = originalImage.getHeight();

        if (width <= 0 || height <= 0) {
            throw new AppException(
                    "Không thể tạo VerifyKey từ ảnh có kích thước không hợp lệ"
            );
        }

        /*
         * Với ảnh nhỏ hơn 25px, vẫn tạo ít nhất một ô
         * để hệ thống không sinh ra lưới 0 x 0.
         */
        int columnCount = Math.max(
                1,
                width / VERIFY_GRID_CELL_BASE_SIZE
        );

        int rowCount = Math.max(
                1,
                height / VERIFY_GRID_CELL_BASE_SIZE
        );

        return generateVerifyKeyByGrid(
                originalImage,
                columnCount,
                rowCount
        );
    }
    /**
     * Tạo verifyKey từ ảnh với số cột và số hàng đã biết trước.
     *
     * Hàm này được dùng cho hai trường hợp:
     * - Khi đăng tải ảnh: số cột và số hàng được tính từ kích thước ảnh.
     * - Khi xác thực ảnh: số cột và số hàng được đọc từ verifyKey đã lưu.
     *
     * Phần pixel dư không bị bỏ qua.
     * Ranh giới của mỗi ô được tính tỷ lệ theo toàn bộ kích thước ảnh,
     * để mọi pixel đều tham gia tạo khóa.
     */
    private String generateVerifyKeyByGrid(
            BufferedImage image,
            int columnCount,
            int rowCount
    ) {
        if (columnCount <= 0 || rowCount <= 0) {
            throw new AppException(
                    "Số cột hoặc số hàng của VerifyKey không hợp lệ"
            );
        }

        int width = image.getWidth();
        int height = image.getHeight();

        StringJoiner colorLine = new StringJoiner(" ");

        /*
         * Duyệt từ trên xuống dưới.
         */
        for (int row = 0; row < rowCount; row++) {
            int startY = row * height / rowCount;
            int endY = (row + 1) * height / rowCount;

            /*
             * Trong từng hàng, duyệt từ trái sang phải.
             */
            for (int column = 0; column < columnCount; column++) {
                int startX = column * width / columnCount;
                int endX = (column + 1) * width / columnCount;

                String representativeColor =
                        findRepresentativeColorHexInCell(
                                image,
                                startX,
                                startY,
                                endX,
                                endY
                        );

                colorLine.add(representativeColor);
            }
        }

        /*
         * Dùng "\n" cố định thay vì System.lineSeparator().
         *
         * Như vậy VerifyKey lưu trong database luôn có cùng định dạng,
         * dù backend chạy trên Windows hay Linux.
         */
        return columnCount
                + " "
                + rowCount
                + "\n"
                + colorLine;
    }
    /**
     * Tìm mã màu đại diện của một ô trong lưới xác thực.
     *
     * Cách xử lý:
     * - Duyệt toàn bộ pixel trong ô.
     * - Gom các màu gần nhau vào cùng một nhóm màu.
     * - Chọn nhóm có số pixel nhiều nhất.
     * - Lấy màu trung bình của nhóm đó làm màu đại diện.
     *
     * Cách này phù hợp hơn việc đếm tuyệt đối từng RGB riêng lẻ,
     * vì ảnh thực tế thường có nhiều sắc độ rất gần nhau.
     */
    private String findRepresentativeColorHexInCell(
            BufferedImage image,
            int startX,
            int startY,
            int endX,
            int endY
    ) {
        Map<Integer, ColorBucket> colorBuckets = new HashMap<>();

        for (int y = startY; y < endY; y++) {
            for (int x = startX; x < endX; x++) {
                int rgb = image.getRGB(x, y) & 0x00FFFFFF;
                Color pixelColor = new Color(rgb);

                int bucketKey = createColorBucketKey(pixelColor);

                ColorBucket bucket = colorBuckets.computeIfAbsent(
                        bucketKey,
                        ignored -> new ColorBucket()
                );

                bucket.addPixel(pixelColor);
            }
        }

        if (colorBuckets.isEmpty()) {
            return "000000";
        }

        ColorBucket dominantBucket = null;
        int dominantBucketKey = Integer.MAX_VALUE;

        for (Map.Entry<Integer, ColorBucket> entry : colorBuckets.entrySet()) {
            ColorBucket currentBucket = entry.getValue();

            /*
             * Chọn nhóm màu xuất hiện nhiều nhất.
             *
             * Nếu hai nhóm có cùng số pixel:
             * - chọn nhóm có key nhỏ hơn;
             * - giúp kết quả luôn ổn định với cùng một ảnh.
             */
            if (dominantBucket == null
                    || currentBucket.getCount() > dominantBucket.getCount()
                    || (
                    currentBucket.getCount() == dominantBucket.getCount()
                            && entry.getKey() < dominantBucketKey
            )) {
                dominantBucket = currentBucket;
                dominantBucketKey = entry.getKey();
            }
        }

        return dominantBucket.toRepresentativeHexColor();
    }
    /**
     * Phủ một lớp màu lên ảnh bằng chế độ hòa trộn Soft Light.
     *
     * opacity nằm trong khoảng 0.0 đến 1.0.
     */
    private void applySoftLightOverlay(
            BufferedImage image,
            Color overlayColor,
            float opacity
    ) {
        int width = image.getWidth();
        int height = image.getHeight();

        float safeOpacity = Math.max(0f, Math.min(1f, opacity));

        for (int y = 0; y < height; y++) {
            for (int x = 0; x < width; x++) {
                int rgb = image.getRGB(x, y);

                Color baseColor = new Color(rgb);

                int r = softLightChannel(
                        baseColor.getRed(),
                        overlayColor.getRed(),
                        safeOpacity
                );

                int g = softLightChannel(
                        baseColor.getGreen(),
                        overlayColor.getGreen(),
                        safeOpacity
                );

                int b = softLightChannel(
                        baseColor.getBlue(),
                        overlayColor.getBlue(),
                        safeOpacity
                );

                image.setRGB(x, y, new Color(r, g, b).getRGB());
            }
        }
    }
    /**
     * Gom các màu gần nhau vào cùng một nhóm.
     *
     * Ví dụ với COLOR_BUCKET_STEP = 16:
     * - Các giá trị R từ 128 đến 143 cùng thuộc một nhóm R.
     * - Tương tự với G và B.
     *
     * Kết quả là các pixel có sắc độ gần nhau
     * được xem là cùng một vùng màu đại diện.
     */
    private int createColorBucketKey(Color color) {
        int redBucket = color.getRed() / COLOR_BUCKET_STEP;
        int greenBucket = color.getGreen() / COLOR_BUCKET_STEP;
        int blueBucket = color.getBlue() / COLOR_BUCKET_STEP;

        return (redBucket << 16)
                | (greenBucket << 8)
                | blueBucket;
    }
    /**
     * Tính Soft Light cho một kênh màu R/G/B.
     *
     * baseValue:
     * - màu gốc của ảnh
     *
     * overlayValue:
     * - màu của lớp phủ
     *
     * opacity:
     * - độ mạnh của lớp phủ
     */
    private int softLightChannel(
            int baseValue,
            int overlayValue,
            float opacity
    ) {
        double base = baseValue / 255.0;
        double overlay = overlayValue / 255.0;

        double blended;

        if (overlay <= 0.5) {
            blended = base - (1.0 - 2.0 * overlay) * base * (1.0 - base);
        } else {
            blended = base + (2.0 * overlay - 1.0) * (softLightD(base) - base);
        }

        double mixed = base * (1.0 - opacity) + blended * opacity;

        return clamp((int) Math.round(mixed * 255.0));
    }

    /**
     * Hàm phụ dùng trong công thức Soft Light.
     */
    private double softLightD(double value) {
        if (value <= 0.25) {
            return ((16.0 * value - 12.0) * value + 4.0) * value;
        }

        return Math.sqrt(value);
    }
    /**
     * Sinh 1 frame từ ảnh gốc.
     *
     * Các bước xử lý:
     * - Vẽ ảnh gốc vào frame.
     * - Phủ một lớp màu bằng chế độ hòa trộn Soft Light.
     * - Opacity của lớp màu được random theo từng frame.
     * - Thêm nhiễu.
     * - Vẽ watermark nếu được bật.
     */
    private BufferedImage generateProtectedFrame(
            BufferedImage original,
            int noiseLevel,
            int colorCoverage,
            String noiseColorMode,
            String staticColor,
            boolean useWatermark,
            int frameIndex
    ) {
        int width = original.getWidth();
        int height = original.getHeight();

        BufferedImage output = new BufferedImage(
                width,
                height,
                BufferedImage.TYPE_INT_RGB
        );

        Graphics2D g2d = output.createGraphics();

        try {
            /*
             * Vẽ ảnh gốc trước.
             */
            g2d.drawImage(original, 0, 0, null);

            /*
             * Chọn màu phủ cho frame hiện tại.
             *
             * Nếu static:
             * - dùng staticColor FE gửi lên.
             *
             * Nếu dynamic:
             * - mỗi frame chọn một màu khác nhau.
             */
            Color overlayColor = resolveOverlayColor(
                    noiseColorMode,
                    staticColor,
                    frameIndex
            );

            /*
             * Random opacity cho từng frame.
             *
             * Ví dụ:
             * - colorCoverage = 5  -> random 5% đến 15%
             * - colorCoverage = 20 -> random 20% đến 30%
             */
            float overlayOpacity = randomOverlayOpacity(colorCoverage);

            /*
             * Áp dụng Soft Light bằng cách xử lý từng pixel.
             * Java Graphics2D không có sẵn blend mode Soft Light,
             * nên mình tự tính màu cho từng điểm ảnh.
             */
            applySoftLightOverlay(output, overlayColor, overlayOpacity);

            /*
             * Thêm nhiễu sau khi phủ màu để mỗi frame có sai khác nhẹ.
             */
            applyNoise(output, noiseLevel, frameIndex);

            /*
             * Watermark nếu bật.
             */
            if (useWatermark) {
                drawWatermark(g2d, width, height, "EyesOnly Protected");
            }

        } finally {
            g2d.dispose();
        }

        return output;
    }

    /**
     * Áp nhiễu ngẫu nhiên theo block nhỏ.
     *
     * Mục tiêu:
     * - Vẫn giữ được nội dung ảnh.
     * - Mỗi frame có nhiễu khác nhau.
     * - Nhiễu đủ rõ để khi ghép video vẫn nhìn thấy biến thiên.
     */
    private void applyNoise(BufferedImage image, int noiseLevel, int frameIndex) {
        int width = image.getWidth();
        int height = image.getHeight();

        int intensity = Math.max(0, Math.min(100, noiseLevel));

        if (intensity <= 0) {
            return;
        }

        /*
         * Giữ block nhỏ để tạo cảm giác nhiễu giống hàm cũ.
         * Nếu ảnh lớn, block 2 vẫn đủ rõ.
         */
        int blockSize = 2;

        /*
         * Tăng nhẹ cường độ để tránh nhiễu bị VP9 nén mất.
         */
        int visibleIntensity = Math.min(130, Math.max(8, intensity + 12));

        for (int y = 0; y < height; y += blockSize) {
            for (int x = 0; x < width; x += blockSize) {

                int offsetR = randomBetween(-visibleIntensity, visibleIntensity);
                int offsetG = randomBetween(-visibleIntensity, visibleIntensity);
                int offsetB = randomBetween(-visibleIntensity, visibleIntensity);

                /*
                 * Biến thiên theo frame để các frame không giống nhau hoàn toàn.
                 */
                offsetR += (frameIndex % 5);
                offsetG += (frameIndex % 3);
                offsetB += (frameIndex % 7);

                /*
                 * Thỉnh thoảng tạo một block nhiễu mạnh hơn.
                 * Tỷ lệ này phụ thuộc noiseLevel nên noiseLevel thấp vẫn nhẹ,
                 * noiseLevel cao sẽ nhìn rõ hơn.
                 */
                boolean strongNoiseBlock =
                        ThreadLocalRandom.current().nextInt(100) < Math.max(2, intensity / 8);

                if (strongNoiseBlock) {
                    int strongOffset = randomBetween(-visibleIntensity, visibleIntensity);

                    offsetR += strongOffset;
                    offsetG += strongOffset;
                    offsetB += strongOffset;
                }

                for (int by = 0; by < blockSize; by++) {
                    for (int bx = 0; bx < blockSize; bx++) {
                        int px = x + bx;
                        int py = y + by;

                        if (px >= width || py >= height) {
                            continue;
                        }

                        int rgb = image.getRGB(px, py);
                        Color oldColor = new Color(rgb);

                        int r = clamp(oldColor.getRed() + offsetR);
                        int g = clamp(oldColor.getGreen() + offsetG);
                        int b = clamp(oldColor.getBlue() + offsetB);

                        image.setRGB(px, py, new Color(r, g, b).getRGB());
                    }
                }
            }
        }
    }

    /**
     * Vẽ watermark chéo nhiều lần trên ảnh
     */
    private void drawWatermark(Graphics2D g2d, int width, int height, String text) {
        Composite oldComposite = g2d.getComposite();

        g2d.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, 0.18f));
        g2d.setColor(Color.WHITE);

        int fontSize = Math.max(18, width / 18);
        g2d.setFont(new Font("Arial", Font.BOLD, fontSize));

        int stepX = Math.max(180, width / 3);
        int stepY = Math.max(120, height / 3);

        for (int y = 40; y < height + 50; y += stepY) {
            for (int x = 20; x < width + 50; x += stepX) {
                g2d.rotate(-0.35, x, y);
                g2d.drawString(text, x, y);
                g2d.rotate(0.35, x, y);
            }
        }

        g2d.setComposite(oldComposite);
    }

    /**
     * Dùng FFmpeg để ghép chuỗi frame PNG thành video webm.
     *
     * Quy tắc:
     * - frameCount = 1  -> 1 frame trong 1 giây
     * - frameCount = 12 -> 12 frame trong 1 giây
     * - frameCount = 30 -> 30 frame trong 1 giây
     * - frameCount = 60 -> 60 frame trong 1 giây
     *
     * Như vậy tất cả file kteo đều dài 1 giây,
     * chỉ khác độ mượt do số frame khác nhau.
     */
    /**
     * Dùng FFmpeg để ghép chuỗi frame PNG thành video webm.
     *
     * Quy tắc:
     * - Mọi file kteo đều dài 1 giây.
     * - frameCount quyết định số frame trong 1 giây.
     *
     * Mình thêm cấu hình chất lượng cao để giữ lại nhiễu rõ hơn.
     * Nếu không chỉnh chất lượng, VP9 có thể nén và làm mượt các hạt nhiễu nhỏ.
     */
    private void createVideoFromFrames(
            Path tempFramesDir,
            Path webmOutputPath,
            int frameCount
    ) throws IOException {
        String fps = String.valueOf(frameCount);

        ProcessBuilder processBuilder = new ProcessBuilder(
                ffmpegPath,
                "-y",

                /*
                 * Mỗi file kteo dài 1 giây.
                 * Nếu frameCount = 12 thì 12 frame chạy trong 1 giây.
                 * Nếu frameCount = 60 thì 60 frame chạy trong 1 giây.
                 */
                "-framerate", fps,
                "-i", tempFramesDir.resolve("frame-%03d.png").toString(),
                "-t", "1",
                "-r", fps,

                /*
                 * Dùng VP9 để xuất webm.
                 */
                "-c:v", "libvpx-vp9",

                /*
                 * Giữ chất lượng cao hơn để nhiễu không bị nén mất quá nhiều.
                 * crf càng thấp thì chất lượng càng cao, file càng nặng.
                 */
                "-b:v", "0",
                "-crf", "12",

                /*
                 * Tăng khả năng giữ chi tiết nhỏ trong ảnh.
                 */
                "-deadline", "good",
                "-cpu-used", "4",

                /*
                 * Đảm bảo video không có audio.
                 */
                "-an",

                /*
                 * Định dạng pixel để browser dễ phát.
                 */
                "-pix_fmt", "yuv420p",

                webmOutputPath.toString()
        );

        processBuilder.redirectErrorStream(true);

        Process process = processBuilder.start();

        String output = readAll(process.getInputStream());

        try {
            int exitCode = process.waitFor();

            if (exitCode != 0) {
                throw new AppException("FFmpeg xử lý video thất bại: " + output);
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new AppException("Quá trình tạo video bị gián đoạn");
        }
    }
    /**
     * Parse màu hex.
     * Nếu null / sai format thì dùng màu tím nhạt mặc định.
     */
    private Color parseHexColor(String hex) {
        try {
            if (hex == null || hex.isBlank()) {
                return new Color(128, 80, 180);
            }

            String clean = hex.replace("#", "");
            if (clean.length() != 6) {
                return new Color(128, 80, 180);
            }

            int r = Integer.parseInt(clean.substring(0, 2), 16);
            int g = Integer.parseInt(clean.substring(2, 4), 16);
            int b = Integer.parseInt(clean.substring(4, 6), 16);

            return new Color(r, g, b);
        } catch (Exception e) {
            return new Color(128, 80, 180);
        }
    }

    private int randomBetween(int min, int max) {
        return min + (int) (Math.random() * (max - min + 1));
    }

    private int clamp(int value) {
        return Math.max(0, Math.min(255, value));
    }
    /**
     * Lấy số frame hợp lệ.
     *
     * FE chỉ nên gửi 1, 12, 30, 60.
     * Nếu bị sửa request bằng F12 hoặc gửi sai thì đưa về 12.
     */
    private int resolveFrameCount(ImageProtectionOptionRequest option) {
        if (option == null || option.getFrameCount() == null) {
            return 12;
        }

        int frameCount = option.getFrameCount();

        if (!ALLOWED_FRAME_COUNTS.contains(frameCount)) {
            return 12;
        }

        return frameCount;
    }

    /**
     * Lấy mức nhiễu.
     */
    private int resolveNoiseLevel(ImageProtectionOptionRequest option) {
        if (option == null || option.getNoiseLevel() == null) {
            return 20;
        }

        return Math.max(0, Math.min(100, option.getNoiseLevel()));
    }

    /**
     * Lấy mức phủ màu.
     *
     * Ưu tiên field mới colorCoverage từ FE.
     * Nếu code cũ còn gửi colorOverlayLevel thì vẫn nhận.
     */
    private int resolveColorCoverage(ImageProtectionOptionRequest option) {
        if (option == null) {
            return DEFAULT_COLOR_COVERAGE_PERCENT;
        }

        Integer colorCoverage = option.getColorCoverage();

        if (colorCoverage == null) {
            colorCoverage = option.getColorOverlayLevel();
        }

        if (colorCoverage == null) {
            return DEFAULT_COLOR_COVERAGE_PERCENT;
        }

        return Math.max(0, Math.min(90, colorCoverage));
    }

    /**
     * Lấy chế độ màu.
     */
    private String resolveNoiseColorMode(ImageProtectionOptionRequest option) {
        if (option == null || option.getNoiseColorMode() == null) {
            return "dynamic";
        }

        String mode = option.getNoiseColorMode().trim().toLowerCase();

        if (!mode.equals("static") && !mode.equals("dynamic")) {
            return "dynamic";
        }

        return mode;
    }

    /**
     * Lấy màu tĩnh.
     *
     * Ưu tiên staticColor từ FE mới.
     * Nếu code cũ còn gửi noiseColor thì vẫn nhận.
     */
    private String resolveStaticColor(ImageProtectionOptionRequest option) {
        if (option == null) {
            return null;
        }

        if (option.getStaticColor() != null && !option.getStaticColor().isBlank()) {
            return option.getStaticColor();
        }

        return option.getNoiseColor();
    }

    /**
     * Chọn màu phủ cho từng frame.
     */
    private Color resolveOverlayColor(
            String noiseColorMode,
            String staticColor,
            int frameIndex
    ) {
        if ("static".equalsIgnoreCase(noiseColorMode)) {
            return parseHexColor(staticColor);
        }

        return createDynamicOverlayColor(frameIndex);
    }

    /**
     * Tạo màu động cho từng frame.
     *
     * Màu được giới hạn trong khoảng vừa phải để không làm ảnh quá cháy màu.
     */
    private Color createDynamicOverlayColor(int frameIndex) {
        ThreadLocalRandom random = ThreadLocalRandom.current();

        int r = 40 + random.nextInt(176);
        int g = 40 + random.nextInt(176);
        int b = 40 + random.nextInt(176);

        int shift = frameIndex % 24;

        return new Color(
                clamp(r + shift),
                clamp(g + shift / 2),
                clamp(b + shift / 3)
        );
    }

    /**
     * Random opacity phủ màu cho từng frame.
     *
     * colorCoverage = 5:
     * - random từ 5% đến 15%
     *
     * colorCoverage = 20:
     * - random từ 20% đến 30%
     */
    private float randomOverlayOpacity(int colorCoverage) {
        int minPercent = Math.max(0, Math.min(90, colorCoverage));
        int maxPercent = Math.min(100, minPercent + COLOR_COVERAGE_RANDOM_RANGE);

        int opacityPercent = ThreadLocalRandom.current().nextInt(
                minPercent,
                maxPercent + 1
        );

        return opacityPercent / 100f;
    }

    private String readAll(InputStream inputStream) throws IOException {
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream))) {
            StringBuilder builder = new StringBuilder();
            String line;

            while ((line = reader.readLine()) != null) {
                builder.append(line).append(System.lineSeparator());
            }

            return builder.toString();
        }
    }

    private void deleteDirectoryRecursively(Path directory) throws IOException {
        if (!Files.exists(directory)) {
            return;
        }

        Files.walk(directory)
                .sorted((a, b) -> b.compareTo(a))
                .forEach(path -> {
                    try {
                        Files.deleteIfExists(path);
                    } catch (IOException e) {
                        throw new RuntimeException(e);
                    }
                });
    }
    /**
     * Xác thực một hình ảnh người dùng cung cấp
     * có khớp với ảnh gốc dùng để tạo ra một KTEOFile hay không.
     *
     * Công đoạn 1:
     * - So sánh width và height với dữ liệu đã lưu của KTEOFile.
     *
     * Công đoạn 2:
     * - Đọc số cột và số hàng từ verifyKey đã lưu.
     * - Tạo lại verifyKey cho ảnh cần kiểm tra theo đúng lưới đó.
     * - So sánh hai verifyKey.
     *
     * @param uploadedImage       ảnh người dùng cung cấp để xác thực
     * @param storedWidth         chiều rộng đã lưu của KTEOFile
     * @param storedHeight        chiều cao đã lưu của KTEOFile
     * @param storedVerifyKey     verifyKey đã lưu của KTEOFile
     *
     * @return true nếu ảnh xác thực khớp, false nếu không khớp
     */
    public boolean verifyOriginalImage(
            MultipartFile uploadedImage,
            int storedWidth,
            int storedHeight,
            String storedVerifyKey
    ) {
        try {
            if (uploadedImage == null || uploadedImage.isEmpty()) {
                throw new AppException(
                        "Vui lòng cung cấp hình ảnh cần xác thực"
                );
            }

            BufferedImage candidateSource =
                    ImageIO.read(uploadedImage.getInputStream());

            if (candidateSource == null) {
                throw new AppException(
                        "Không thể đọc hình ảnh cần xác thực"
                );
            }

            BufferedImage candidateImage =
                    normalizeOriginalImageForKteo(candidateSource);

            /*
             * Công đoạn thứ nhất:
             * kích thước ảnh phải trùng với kích thước đã lưu cùng KTEOFile.
             */
            if (candidateImage.getWidth() != storedWidth
                    || candidateImage.getHeight() != storedHeight) {
                return false;
            }

            /*
             * Đọc thông tin lưới từ dòng đầu của verifyKey.
             */
            int[] gridSize = readGridSizeFromVerifyKey(storedVerifyKey);

            int columnCount = gridSize[0];
            int rowCount = gridSize[1];

            /*
             * Tạo lại key theo chính lưới của KTEOFile cần xác thực.
             */
            String generatedVerifyKey =
                    generateVerifyKeyByGrid(
                            candidateImage,
                            columnCount,
                            rowCount
                    );

            /*
             * Chuẩn hóa ký tự xuống dòng để tránh khác biệt
             * giữa dữ liệu cũ dùng Windows CRLF và dữ liệu mới dùng LF.
             */
            return normalizeVerifyKey(storedVerifyKey)
                    .equals(normalizeVerifyKey(generatedVerifyKey));

        } catch (IOException exception) {
            throw new AppException(
                    "Lỗi khi đọc hình ảnh xác thực: "
                            + exception.getMessage()
            );
        }
    }
    /**
     * Đọc số cột và số hàng từ verifyKey.
     *
     * VerifyKey hợp lệ phải có:
     * - Dòng 1 gồm đúng hai số: columnCount rowCount.
     * - Dòng 2 có đúng columnCount x rowCount mã màu.
     */
    private int[] readGridSizeFromVerifyKey(String verifyKey) {
        String normalizedKey = normalizeVerifyKey(verifyKey);

        if (normalizedKey.isBlank()) {
            throw new AppException(
                    "VerifyKey của tệp KTEO không tồn tại"
            );
        }

        String[] lines = normalizedKey.split("\n");

        if (lines.length != 2) {
            throw new AppException(
                    "VerifyKey không đúng định dạng hai dòng"
            );
        }

        String[] gridValues = lines[0].trim().split("\\s+");

        if (gridValues.length != 2) {
            throw new AppException(
                    "Dòng kích thước lưới của VerifyKey không hợp lệ"
            );
        }

        try {
            int columnCount = Integer.parseInt(gridValues[0]);
            int rowCount = Integer.parseInt(gridValues[1]);

            if (columnCount <= 0 || rowCount <= 0) {
                throw new AppException(
                        "Kích thước lưới của VerifyKey không hợp lệ"
                );
            }

            String[] storedColors = lines[1].trim().isBlank()
                    ? new String[0]
                    : lines[1].trim().split("\\s+");

            int expectedColorCount = columnCount * rowCount;

            if (storedColors.length != expectedColorCount) {
                throw new AppException(
                        "Số lượng mã màu trong VerifyKey không hợp lệ"
                );
            }

            return new int[] {
                    columnCount,
                    rowCount
            };

        } catch (NumberFormatException exception) {
            throw new AppException(
                    "Không thể đọc kích thước lưới từ VerifyKey"
            );
        }
    }

    /**
     * Chuẩn hóa định dạng xuống dòng của verifyKey.
     *
     * Mục đích:
     * - Dữ liệu tạo trên Windows có thể dùng "\r\n".
     * - Dữ liệu tạo trên Linux có thể dùng "\n".
     * - Sau khi chuẩn hóa, hai key vẫn được so sánh chính xác.
     */
    private String normalizeVerifyKey(String verifyKey) {
        if (verifyKey == null) {
            return "";
        }

        return verifyKey
                .replace("\r\n", "\n")
                .replace("\r", "\n")
                .trim();
    }
    /**
     * Tạo video preview bảo vệ ảnh và trả về byte[].
     *
     * Khác với protectAndSaveImageAsKteo():
     * - Không lưu vào uploads/posts.
     * - Không tạo KTEOFile.
     * - Không tạo verifyKey để lưu DB.
     * - Không đổi đuôi thành .kteo.
     * - Chỉ tạo WebM tạm, đọc bytes rồi xóa toàn bộ file tạm.
     *
     * Mục đích:
     * - Cho FE xem trước đúng kết quả xử lý từ Backend.
     */
    public byte[] createProtectionPreviewVideo(
            MultipartFile multipartFile,
            ImageProtectionOptionRequest option
    ) {
        Path tempRootDir = null;

        try {
            BufferedImage uploadedImage =
                    ImageIO.read(multipartFile.getInputStream());

            if (uploadedImage == null) {
                throw new AppException(
                        "Không thể đọc dữ liệu ảnh từ tệp "
                                + multipartFile.getOriginalFilename()
                );
            }

            /*
             * Dùng đúng hàm chuẩn hóa ảnh như khi tạo KTEO thật.
             */
            BufferedImage originalImage =
                    normalizeOriginalImageForKteo(uploadedImage);
            /*
             * Preview không cần dùng kích thước gốc.
             * Resize trước khi sinh frame để tránh video preview quá nặng,
             * đặc biệt với ảnh dọc cao hoặc ảnh độ phân giải lớn.
             */
            BufferedImage previewImage =
                    resizeImageForPreview(originalImage);
            System.out.println(
                    "Preview original size: "
                            + originalImage.getWidth()
                            + "x"
                            + originalImage.getHeight()
            );

            System.out.println(
                    "Preview resized size: "
                            + previewImage.getWidth()
                            + "x"
                            + previewImage.getHeight()
            );
            /*
             * Tạo thư mục tạm ngoài uploads/posts.
             * Thư mục này chỉ dùng cho request preview hiện tại.
             */
            tempRootDir =
                    Files.createTempDirectory("eyesonly-preview-");

            Path tempFramesDir =
                    tempRootDir.resolve("frames");

            Files.createDirectories(tempFramesDir);

            int frameCount = resolveFrameCount(option);
            int noiseLevel = resolveNoiseLevel(option);
            int colorCoverage = resolveColorCoverage(option);
            String noiseColorMode = resolveNoiseColorMode(option);
            String staticColor = resolveStaticColor(option);

            boolean useWatermark =
                    option != null
                            && Boolean.TRUE.equals(option.getUseWatermark());

            /*
             * Sinh frame giống tạo KTEO thật.
             */
            for (int frameIndex = 0;
                 frameIndex < frameCount;
                 frameIndex++) {

                BufferedImage frameImage = generateProtectedFrame(
                        previewImage,
                        noiseLevel,
                        colorCoverage,
                        noiseColorMode,
                        staticColor,
                        useWatermark,
                        frameIndex
                );

                File frameFile = tempFramesDir
                        .resolve(String.format("frame-%03d.png", frameIndex))
                        .toFile();

                ImageIO.write(frameImage, "png", frameFile);
            }

            /*
             * Tạo WebM tạm để trả về FE.
             * Không đổi sang .kteo vì preview chỉ cần browser phát video.
             */
            Path previewVideoPath =
                    tempRootDir.resolve("preview.webm");

            createVideoFromFrames(
                    tempFramesDir,
                    previewVideoPath,
                    frameCount
            );

            /*
             * Đọc toàn bộ video thành byte[] để controller trả về.
             */
            return Files.readAllBytes(previewVideoPath);

        } catch (IOException exception) {
            throw new AppException(
                    "Lỗi khi tạo preview bảo vệ ảnh: "
                            + exception.getMessage()
            );

        } finally {
            /*
             * Xóa toàn bộ file tạm:
             * - frame PNG
             * - preview.webm
             * - thư mục tạm
             */
            if (tempRootDir != null) {
                try {
                    deleteDirectoryRecursively(tempRootDir);
                } catch (IOException exception) {
                    System.err.println(
                            "Không thể xóa thư mục preview tạm: "
                                    + tempRootDir
                    );
                }
            }
        }
    }
    /**
     * Resize ảnh dùng riêng cho preview.
     *
     * Mục đích:
     * - Tránh tạo video preview quá nặng với ảnh dọc lớn hoặc ảnh độ phân giải cao.
     * - Giữ nguyên tỷ lệ ảnh.
     * - Đảm bảo width và height là số chẵn để FFmpeg/video encoder xử lý ổn định hơn.
     *
     * Lưu ý:
     * - Hàm này chỉ dùng cho preview.
     * - Không dùng cho hàm tạo KTEO thật nếu Tan muốn KTEO giữ kích thước ảnh gốc.
     */
    private BufferedImage resizeImageForPreview(BufferedImage sourceImage) {
        int originalWidth = sourceImage.getWidth();
        int originalHeight = sourceImage.getHeight();

        int longestEdge = Math.max(originalWidth, originalHeight);

        /*
         * Nếu ảnh đã nhỏ hơn giới hạn preview thì vẫn cần đảm bảo kích thước chẵn.
         */
        if (longestEdge <= PREVIEW_MAX_EDGE) {
            int evenWidth = makeEven(originalWidth);
            int evenHeight = makeEven(originalHeight);

            if (evenWidth == originalWidth && evenHeight == originalHeight) {
                return sourceImage;
            }

            return resizeImage(
                    sourceImage,
                    evenWidth,
                    evenHeight
            );
        }

        double scale = (double) PREVIEW_MAX_EDGE / longestEdge;

        int targetWidth = makeEven(
                (int) Math.round(originalWidth * scale)
        );

        int targetHeight = makeEven(
                (int) Math.round(originalHeight * scale)
        );

        return resizeImage(
                sourceImage,
                targetWidth,
                targetHeight
        );
    }

    /**
     * Đảm bảo kích thước là số chẵn.
     *
     * Một số định dạng video/codec dễ lỗi hoặc kém ổn định
     * khi width/height là số lẻ.
     */
    private int makeEven(int value) {
        int safeValue = Math.max(2, value);

        if (safeValue % 2 == 0) {
            return safeValue;
        }

        return safeValue - 1;
    }

    /**
     * Resize BufferedImage về kích thước chỉ định.
     */
    private BufferedImage resizeImage(
            BufferedImage sourceImage,
            int targetWidth,
            int targetHeight
    ) {
        BufferedImage resizedImage = new BufferedImage(
                targetWidth,
                targetHeight,
                BufferedImage.TYPE_INT_RGB
        );

        Graphics2D graphics = resizedImage.createGraphics();

        try {
            graphics.setRenderingHint(
                    RenderingHints.KEY_INTERPOLATION,
                    RenderingHints.VALUE_INTERPOLATION_BILINEAR
            );

            graphics.setRenderingHint(
                    RenderingHints.KEY_RENDERING,
                    RenderingHints.VALUE_RENDER_QUALITY
            );

            graphics.setRenderingHint(
                    RenderingHints.KEY_ANTIALIASING,
                    RenderingHints.VALUE_ANTIALIAS_ON
            );

            graphics.drawImage(
                    sourceImage,
                    0,
                    0,
                    targetWidth,
                    targetHeight,
                    null
            );
        } finally {
            graphics.dispose();
        }

        return resizedImage;
    }
}
