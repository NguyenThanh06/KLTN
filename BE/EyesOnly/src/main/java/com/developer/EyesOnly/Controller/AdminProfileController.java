package com.developer.EyesOnly.Controller;

import com.developer.EyesOnly.DTO.Request.AdminChangePasswordRequest;
import com.developer.EyesOnly.DTO.Request.ApiResponse;
import com.developer.EyesOnly.DTO.Response.AdminProfileResponse;
import com.developer.EyesOnly.Service.AdminProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
@RestController
@CrossOrigin(origins = "http://localhost:5173")
@RequiredArgsConstructor
@RequestMapping("admin/account")
public class AdminProfileController {
    private final AdminProfileService adminProfileService;

    /*
     * API lấy hồ sơ của admin đang đăng nhập.
     *
     * Endpoint:
     * GET /admin/account
     */
    @GetMapping("/profile")
    public ApiResponse<AdminProfileResponse> getAdminProfile(
            Principal principal
    ) {
        /*
         * Với token admin:
         * principal.getName() chính là adminID.
         *
         * Ví dụ:
         * thanhmayman
         */
        String adminID = principal.getName();

        return ApiResponse.<AdminProfileResponse>builder()
                .result(adminProfileService.getAdmin(adminID))
                .build();
    }
    /*
     * Đổi mật khẩu admin đang đăng nhập.
     *
     * Endpoint:
     * PATCH /admin/account/password
     */
    @PatchMapping("/password")
    public ApiResponse<String> changePassword(
            Principal principal,
            @RequestBody AdminChangePasswordRequest request
    ) {
        /*
         * Với admin token:
         * principal.getName() là adminID, ví dụ "thanhmayman".
         * Không ép sang Long.
         */
        String adminID = principal.getName();

        return ApiResponse.<String>builder()
                .result(adminProfileService.changePassword(
                        adminID,
                        request
                ))
                .build();
    }
}
