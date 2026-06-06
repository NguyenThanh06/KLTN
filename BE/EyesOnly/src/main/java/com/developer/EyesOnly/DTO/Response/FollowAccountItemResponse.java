package com.developer.EyesOnly.DTO.Response;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FollowAccountItemResponse {
    private Long accountID;
    private String username;
    private String tenHienThi;
    private String avatar;
    private String tieuSu;

    // Người đang đăng nhập có đang theo dõi account này không
    private Boolean daTheoDoi;
}