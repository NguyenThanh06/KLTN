package com.developer.EyesOnly.DTO.Response;

import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminCommentResponse {

    private Long commentID;

    private String noiDung;
    private LocalDateTime thoiGianDang;

    private Long nguoiVietID;
    private String usernameNguoiViet;
    private String tenHienThiNguoiViet;
    private String avatarNguoiViet;

    /*
     * Nếu là reply thì có parentCommentID.
     * Nếu là comment gốc thì null.
     */
    private Long parentCommentID;
}