package com.developer.EyesOnly.Controller;

import com.developer.EyesOnly.DTO.Request.ApiResponse;
import com.developer.EyesOnly.DTO.Request.ChangePasswordRequest;
import com.developer.EyesOnly.DTO.Request.ConfirmChangePasswordRequest;
import com.developer.EyesOnly.DTO.Response.AccountResponse;
import com.developer.EyesOnly.Exception.AppException;
import com.developer.EyesOnly.Exception.ErrorCode;
import com.developer.EyesOnly.Service.AccountService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/account-setting")
@RequiredArgsConstructor
public class AccountSettingController {

    private final AccountService accountService;

    @PostMapping("/change-password")
    public ApiResponse<String> requestChangePassword(
            Principal principal,
            @RequestBody ChangePasswordRequest request
    ) {
        System.out.println("Principal = " + principal);
        System.out.println("Principal name = " + principal.getName());

        System.out.println("Old password = " + request.getOldPassword());
        System.out.println("New password = " + request.getNewPassword());
        System.out.println("Confirm password = " + request.getConfirmNewPassword());
        Long currentUserId = getCurrentAccountId(principal);
        accountService.requestChangePassword(currentUserId, request);
        return ApiResponse.<String>builder()
                .result("Mã xác nhận đã được gửi đến email đã đăng ký")
                .build();
    }

    @PostMapping("/change-password/confirm")
    public ApiResponse<String> confirmChangePassword(
            Principal principal,
            @RequestBody ConfirmChangePasswordRequest request
    ) {

        Long currentUserId = getCurrentAccountId(principal);
        accountService.confirmChangePassword(currentUserId, request.getOtp());

        return ApiResponse.<String>builder()
                .result("Đổi mật khẩu thành công, vui lòng đăng nhập lại")
                .build();
    }
    @PutMapping("/disable")
    public ApiResponse<AccountResponse> disableMyAccount(
            Principal principal
    ) {
        Long currentUserId = getCurrentAccountId(principal);

        AccountResponse response = accountService.disableMyAccount(currentUserId);

        return ApiResponse.<AccountResponse>builder()
                .result(response)
                .build();
    }

    @PutMapping("/enable")
    public ApiResponse<AccountResponse> enableMyAccount(
            Principal principal
    ) {
        Long currentAccountId = getCurrentAccountId(principal);

        AccountResponse response = accountService.enableMyAccount(currentAccountId);

        return ApiResponse.<AccountResponse>builder()
                .result(response)
                .build();
    }
    /*
     * Lấy accountID của user đang đăng nhập từ token.
     */
    private Long getCurrentAccountId(Principal principal) {
        if (principal == null || principal.getName() == null) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }

        try {
            return Long.valueOf(principal.getName());
        } catch (NumberFormatException exception) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }
    }
}