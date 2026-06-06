package com.developer.EyesOnly.Controller;

import com.developer.EyesOnly.DTO.Request.ApiResponse;
import com.developer.EyesOnly.DTO.Request.CreateAdminRequest;
import com.developer.EyesOnly.DTO.Request.UpdateAdminRoleRequest;
import com.developer.EyesOnly.DTO.Response.AdminStaffListResponse;
import com.developer.EyesOnly.Service.AdminStaffService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/admin/staff")
@RequiredArgsConstructor
public class AdminStaffController {

    private final AdminStaffService adminStaffService;

    /*
     * API lấy danh sách nhân sự admin.
     *
     * Ví dụ:
     * GET /admin/staff?page=0&size=6
     */
    @GetMapping
    public ApiResponse<AdminStaffListResponse> getStaffList(
            Principal principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "6") int size
    ) {
        /*
         * Với token admin, JwtFilter đã set:
         * principal.getName() = adminID
         */
        String currentAdminID = principal.getName();

        return ApiResponse.<AdminStaffListResponse>builder()
                .result(adminStaffService.getStaffList(
                        currentAdminID,
                        page,
                        size
                ))
                .build();
    }
    /*
     * API tạo tài khoản admin mới.
     *
     * Ví dụ:
     * POST /admin/staff
     */
    @PostMapping
    public ApiResponse<String> createAdmin(
            Principal principal,
            @RequestBody CreateAdminRequest  request
    ) {
        /*
         * Với token admin, JwtFilter của bạn đang set:
         * principal.getName() = adminID
         */
        String currentAdminID = principal.getName();

        return ApiResponse.<String>builder()
                .result(adminStaffService.createAdmin(
                        currentAdminID,
                        request
                ))
                .build();
    }
    //Thay đổi role của admin
    @PatchMapping("/{adminID}/role")
    public ApiResponse<String> updateStaffRole(
            Principal principal,
            @PathVariable String adminID,
            @RequestBody UpdateAdminRoleRequest request
    ) {
        /*
         * Admin đang đăng nhập.
         */
        String currentAdminID = principal.getName();

        return ApiResponse.<String>builder()
                .result(adminStaffService.updateStaffRole(
                        currentAdminID,
                        adminID,
                        request
                ))
                .build();
    }
}