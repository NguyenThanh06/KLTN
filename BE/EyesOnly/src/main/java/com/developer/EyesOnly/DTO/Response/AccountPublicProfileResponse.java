package com.developer.EyesOnly.DTO.Response;

import lombok.*;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AccountPublicProfileResponse {
    private Long accountID;

    private String username;
    private String tenHienThi;
    private String avatar;
    private String tieuSu;

    private Long soNguoiTheoDoi;
    private Long soNguoiDangTheoDoi;

    private LocalDate ngayThamGia;

    // Người đang đăng nhập có đang theo dõi account này không
    private Boolean daTheoDoi;

    private PageResponse<PostResponse> thuVienTacPham;
}