package com.developer.EyesOnly.Service;

import com.developer.EyesOnly.DTO.Request.ImageProtectionOptionRequest;
import com.developer.EyesOnly.Exception.AppException;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
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
@RequiredArgsConstructor
public class FileProtectionService {
    private final PythonProtectionService pythonProtectionService;
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

            BufferedImage originalImage =
                    normalizeOriginalImageForKteo(uploadedImage);
            int width = originalImage.getWidth();
            int height = originalImage.getHeight();
            String verifyKey =
                    generateVerifyKey(originalImage);


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

            // Kêu python
            byte[] webmData =
                    pythonProtectionService.protect(
                            multipartFile,
                            option
                    );

            String baseFileName =
                    "file-" + orderIndex + "-" + UUID.randomUUID();

            Path webmOutputPath =
                    postDir.resolve(baseFileName + ".webm");

            Files.write(webmOutputPath, webmData);

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
     * Tạo video preview bảo vệ ảnh và trả về byte[]. Lần ni kêu python
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
        return pythonProtectionService.preview(
                multipartFile,
                option
        );
    }

}