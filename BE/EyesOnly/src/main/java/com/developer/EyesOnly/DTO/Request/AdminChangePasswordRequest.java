package com.developer.EyesOnly.DTO.Request;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminChangePasswordRequest {

    /*
     * Mật khẩu cũ admin nhập.
     */
    private String oldPassword;

    /*
     * Mật khẩu mới admin muốn đổi.
     */
    private String newPassword;

    /*
     * Nhập lại mật khẩu mới để xác nhận.
     */
    private String confirmPassword;
}