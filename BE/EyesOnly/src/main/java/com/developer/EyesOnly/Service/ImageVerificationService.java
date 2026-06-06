package com.developer.EyesOnly.Service;

import com.developer.EyesOnly.DTO.Response.VerifyOriginalImageResponse;
import com.developer.EyesOnly.DTO.Response.VerifyResultKteoFileResponse;
import com.developer.EyesOnly.DTO.Response.VerifyResultPostResponse;
import com.developer.EyesOnly.DTO.Response.VerifyResultResponse;
import com.developer.EyesOnly.Entity.KTEOFile;
import com.developer.EyesOnly.Entity.Post;
import com.developer.EyesOnly.Entity.VerifyThanhCong;
import com.developer.EyesOnly.Exception.AppException;
import com.developer.EyesOnly.Exception.ErrorCode;
import com.developer.EyesOnly.Repository.KTEOFileRepository;
import com.developer.EyesOnly.Repository.VerifyThanhCongRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.time.ZoneId;

@Service
@RequiredArgsConstructor
public class ImageVerificationService {

    private final KTEOFileRepository kteoFileRepository;
    private final VerifyThanhCongRepository verifyThanhCongRepository;
    private final FileProtectionService fileProtectionService;
    /*
     * Lưu thời gian xác thực theo múi giờ Việt Nam.
     */
    private static final ZoneId VIETNAM_ZONE =
            ZoneId.of("Asia/Ho_Chi_Minh");
    /**
     * Kiểm tra ảnh người dùng tải lên có khớp với ảnh gốc
     * dùng để tạo ra KTEOFile đã chọn hay không.
     */
    /**
     * Xác thực ảnh người dùng cung cấp với một KTEOFile.
     *
     * Luồng xử lý:
     * - Tìm KTEOFile cần xác thực.
     * - Kiểm tra ảnh tải lên với width, height và verifyKey đã lưu.
     * - Nếu không khớp: không lưu database, trả verified = false.
     * - Nếu khớp: tạo một dòng VerifyThanhCong và trả verifyID.
     */
    @Transactional
    public VerifyOriginalImageResponse verifyAndSaveResult(
            Long fileId,
            MultipartFile image
    ) {
        /*
         * Tìm tệp KTEO mà người dùng muốn kiểm tra.
         */
        KTEOFile kteoFile = kteoFileRepository.findById(fileId)
                .orElseThrow(() ->
                        new AppException(ErrorCode.KTEO_FILE_NOT_FOUND)
                );

        /*
         * Kiểm tra ảnh tải lên có đúng là ảnh gốc
         * dùng để tạo ra KTEOFile này hay không.
         */
        boolean verified =
                fileProtectionService.verifyOriginalImage(
                        image,
                        kteoFile.getWidth(),
                        kteoFile.getHeight(),
                        kteoFile.getVerifyKey()
                );

        /*
         * Nếu xác thực thất bại:
         * - Không insert dòng nào vào VerifyThanhCong.
         * - Trả trạng thái false cho FE hiển thị kết quả thất bại.
         */
        if (!verified) {
            return VerifyOriginalImageResponse.builder()
                    .verified(false)
                    .verifyID(null)
                    .build();
        }

        /*
         * Nếu xác thực thành công:
         * - Lưu thông tin KTEOFile đã được xác thực.
         * - Lưu thời điểm xác thực.
         */
        VerifyThanhCong verifyResult =
                VerifyThanhCong.builder()
                        .kteoFile(kteoFile)
                        .ngayXacThuc(
                                LocalDateTime.now(VIETNAM_ZONE)
                        )
                        .build();

        VerifyThanhCong savedResult =
                verifyThanhCongRepository.save(verifyResult);

        /*
         * Sau khi save, VerifyID đã được database sinh ra.
         * Trả ID này về FE để điều hướng sang trang kết quả xác thực.
         */
        return VerifyOriginalImageResponse.builder()
                .verified(true)
                .verifyID(savedResult.getVerifyID())
                .build();
    }
    /*
     * Kết quả xác thực được hiển thị công khai trong 7 ngày.
     *
     * Nếu sau này nghiệp vụ thay đổi,
     * chỉ cần sửa giá trị này hoặc chuyển sang application.properties.
     */
    private static final long VERIFY_RESULT_VALID_DAYS = 7L;

    /**
     * Lấy chi tiết một kết quả xác thực thành công theo verifyID.
     *
     * API sử dụng:
     * GET /verify/{verifyID}
     *
     * @param verifyID ID được lấy từ URL trang kết quả xác thực
     *
     * @return dữ liệu đầy đủ để FE hiển thị:
     * - thời gian xác thực
     * - thời điểm hết hiệu lực
     * - bài viết gốc
     * - tệp KTEO đã được xác thực
     */
    @Transactional(readOnly = true)
    public VerifyResultResponse getVerifyResult(Long verifyID) {

        /*
         * Tìm kết quả xác thực và lấy kèm KTEOFile + Post.
         *
         * Nếu verifyID không tồn tại,
         * trả lỗi để FE hiển thị trạng thái không tìm thấy kết quả.
         */
        VerifyThanhCong verifyResult =
                verifyThanhCongRepository
                        .findVerifyResultDetailById(verifyID)
                        .orElseThrow(() ->
                                new AppException(
                                        ErrorCode.VERIFY_RESULT_NOT_FOUND
                                )
                        );

        KTEOFile kteoFile = verifyResult.getKteoFile();

        if (kteoFile == null || kteoFile.getPost() == null) {
            /*
             * Trường hợp này không nên xảy ra nếu database có foreign key đúng.
             * Tuy nhiên vẫn kiểm tra để tránh backend bị NullPointerException.
             */
            throw new AppException(
                    ErrorCode.VERIFY_RESULT_NOT_FOUND
            );
        }

        Post post = kteoFile.getPost();

        LocalDateTime ngayXacThuc =
                verifyResult.getNgayXacThuc();

        LocalDateTime expiresAt =
                ngayXacThuc.plusDays(VERIFY_RESULT_VALID_DAYS);

        /*
         * Map thông tin bài viết gốc.
         */
        VerifyResultPostResponse postResponse =
                VerifyResultPostResponse.builder()
                        .postID(post.getPostID())
                        .tieuDe(post.getTieuDe())
                        .moTa(post.getMoTa())
                        .build();

        /*
         * Map thông tin tệp KTEO đã được xác thực.
         *
         * Không trả verifyKey ra FE,
         * vì verifyKey chỉ nên được backend dùng để đối chiếu ảnh.
         */
        VerifyResultKteoFileResponse kteoFileResponse =
                VerifyResultKteoFileResponse.builder()
                        .fileID(kteoFile.getFileID())
                        .link(kteoFile.getLink())
                        .width(kteoFile.getWidth())
                        .height(kteoFile.getHeight())
                        .postID(post.getPostID())
                        .build();

        /*
         * Trả toàn bộ dữ liệu cho trang /verify/{verifyID}.
         */
        return VerifyResultResponse.builder()
                .verifyID(verifyResult.getVerifyID())
                .postID(post.getPostID())
                .kteoFileID(kteoFile.getFileID())
                .ngayXacThuc(ngayXacThuc)
                .expiresAt(expiresAt)
                .post(postResponse)
                .kteoFile(kteoFileResponse)
                .build();
    }
}