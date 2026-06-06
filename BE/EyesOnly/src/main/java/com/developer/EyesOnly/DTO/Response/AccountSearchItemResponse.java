package com.developer.EyesOnly.DTO.Response;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AccountSearchItemResponse {
    private Long accountID;
    private String username;
    private String tenHienThi;
    private String avatar;
    private String tieuSu;

    private Long soNguoiTheoDoi;

    // Account đang đăng nhập có đang theo dõi account này không
    private Boolean daTheoDoi;
    /*
     * true nếu account này nằm trong danh sách bị người dùng hiện tại chặn.
     * FE dùng cho tab danh sách chặn.
     */
    private Boolean isBlocked;
}