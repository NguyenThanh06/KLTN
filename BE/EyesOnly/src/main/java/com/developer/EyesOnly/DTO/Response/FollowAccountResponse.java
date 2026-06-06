package com.developer.EyesOnly.DTO.Response;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FollowAccountResponse {
    private Long targetAccountId;
    private Boolean daTheoDoi;
    private Long soNguoiTheoDoi;
    private Long soNguoiDangTheoDoi;
    private String message;
}