package com.developer.EyesOnly.DTO.Response;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VerifyResultPostResponse {

    /*
     * ID bài viết gốc chứa tệp KTEO đã được xác thực.
     */
    private Long postID;

    /*
     * Tiêu đề tác phẩm.
     */
    private String tieuDe;

    /*
     * Mô tả tác phẩm.
     */
    private String moTa;
}