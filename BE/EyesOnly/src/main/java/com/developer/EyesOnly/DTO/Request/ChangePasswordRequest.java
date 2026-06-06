package com.developer.EyesOnly.DTO.Request;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChangePasswordRequest {
    private String oldPassword;
    private String newPassword;
    private String confirmNewPassword;
}