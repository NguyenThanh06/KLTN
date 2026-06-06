package com.developer.EyesOnly.DTO.Response;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BlockedAccountItemResponse {
    private Long accountID;
    private String username;
    private String tenHienThi;
    private String avatar;
    private String tieuSu;
}