package com.developer.EyesOnly.DTO.Response;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminLoginResponse {

    private String adminID;
    private String adminName;

    private Integer roleID;
    private String vaiTro;

    private String token;
}