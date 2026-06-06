package com.developer.EyesOnly.DTO.Request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VerifyResetPasswordEmailRequest {

    /*
     * Nếu email null, rỗng hoặc chỉ chứa khoảng trắng:
     * GlobalExceptionHandler sẽ lấy message "EMAIL_NULL"
     * rồi chuyển thành ErrorCode.EMAIL_NULL.
     */
    @NotBlank(message = "EMAIL_NULL")

    /*
     * Nếu email không đúng định dạng:
     * GlobalExceptionHandler sẽ chuyển thành ErrorCode.EMAIL_NOT_AN_EMAIL.
     */
    @Email(message = "EMAIL_NOT_AN_EMAIL")
    private String email;
}