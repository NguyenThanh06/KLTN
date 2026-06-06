package com.developer.EyesOnly.DTO.Response;

import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CommentResponse {

    private Long commentID;
    private String noiDung;
    private LocalDateTime thoiGianDang;

    /*
     * Thông tin người viết comment.
     * FE dùng để hiển thị avatar, tên, username
     * và kiểm tra quyền xóa comment.
     */
    private Long accountID;
    private String username;
    private String tenHienThi;
    private String avatar;

    /*
     * Thông tin reply.
     */
    private Long parentID;
    private String tenNguoiDuocTraLoi;
    private int soLuongTraLoi;

    /*
     * Thông tin like comment.
     */
    private Long luotThich;
    private Boolean daThich;
}