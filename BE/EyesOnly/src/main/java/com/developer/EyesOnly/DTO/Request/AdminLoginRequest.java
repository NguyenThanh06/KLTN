package com.developer.EyesOnly.DTO.Request;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminLoginRequest {

    /*
     * AdminID được dùng làm tên đăng nhập.
     */
    private String adminID;

    private String password;
}