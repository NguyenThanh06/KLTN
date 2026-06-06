package com.developer.EyesOnly.DTO.Response;

import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VerifyResultResponse {

    /*
     * ID kết quả xác thực thành công.
     * Giá trị này được lấy từ URL /verify/{verifyID}.
     */
    private Long verifyID;

    /*
     * Hai field đặt ở ngoài để FE truy cập nhanh
     * khi cần xử lý điều hướng hoặc liên kết.
     */
    private Long postID;
    private Long kteoFileID;

    /*
     * Thời điểm hình ảnh được xác thực thành công.
     */
    private LocalDateTime ngayXacThuc;

    /*
     * Thời điểm kết quả xác thực hết hiệu lực.
     *
     * Hiện tại được tính bằng:
     * ngayXacThuc + 7 ngày.
     */
    private LocalDateTime expiresAt;

    /*
     * Thông tin bài viết gốc.
     */
    private VerifyResultPostResponse post;

    /*
     * Thông tin tệp KTEO đã được xác thực.
     */
    private VerifyResultKteoFileResponse kteoFile;
}