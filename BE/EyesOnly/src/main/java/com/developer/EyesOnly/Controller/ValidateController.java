package com.developer.EyesOnly.Controller;

import com.developer.EyesOnly.DTO.Request.ApiResponse;
import com.developer.EyesOnly.DTO.Request.VerifyResetPasswordEmailRequest;
import com.developer.EyesOnly.Service.ValidateService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/valiate")
public class ValidateController{
    @Autowired
    ValidateService resetPasswordService;
/*
 * Kiểm tra email có hợp lệ để tiến hành cấp lại mật khẩu hay không.
 *
 * POST /auth/reset-password/verify-email
 *
 * Request:
 * {
 *     "email": "example@gmail.com"
 * }
 */
    @PostMapping("/reset-password/verify-email")
    public ApiResponse<Void> verifyEmailResetPassword(
            @Valid @RequestBody VerifyResetPasswordEmailRequest request
    ) {
        resetPasswordService.verifyEmailResetPassword(request);

        return ApiResponse.<Void>builder()
                .message("Email hợp lệ")
                .build();
    }
}
