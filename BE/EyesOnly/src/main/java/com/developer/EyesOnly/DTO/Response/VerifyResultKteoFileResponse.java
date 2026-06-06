package com.developer.EyesOnly.DTO.Response;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VerifyResultKteoFileResponse {

    /*
     * ID tệp KTEO đã được xác thực thành công.
     */
    private Long fileID;

    /*
     * Đường dẫn file KTEO đã lưu trong database.
     *
     * Ví dụ:
     * post-123/file-1-abc.kteo
     */
    private String link;

    /*
     * Kích thước ảnh gốc dùng để tạo ra tệp KTEO.
     */
    private Integer width;
    private Integer height;

    /*
     * ID bài viết chứa tệp KTEO này.
     */
    private Long postID;
}