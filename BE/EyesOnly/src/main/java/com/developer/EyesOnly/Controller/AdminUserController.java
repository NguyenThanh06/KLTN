package com.developer.EyesOnly.Controller;

import com.developer.EyesOnly.DTO.Request.AdminUserSearchRequest;
import com.developer.EyesOnly.DTO.Request.ApiResponse;
import com.developer.EyesOnly.DTO.Response.AdminUserDetailResponse;
import com.developer.EyesOnly.DTO.Response.AdminUserSearchResponse;
import com.developer.EyesOnly.Service.AdminUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final AdminUserService adminUserService;

    /*
     * API tìm kiếm Account User cho admin.
     *
     * Ví dụ:
     * POST /admin/users/search?page=0&size=6
     */
    @PostMapping("/search")
    public ApiResponse<AdminUserSearchResponse> searchUsers(
            Principal principal,
            @RequestBody(required = false) AdminUserSearchRequest request,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "6") int size
    ) {
        /*
         * Với token admin, JwtFilter đã set:
         * principal.getName() = adminID.
         *
         * Hiện tại chưa dùng adminID, nhưng nhận Principal để đảm bảo API này
         * là API cần admin đăng nhập.
         */
        String adminID = principal.getName();

        return ApiResponse.<AdminUserSearchResponse>builder()
                .result(adminUserService.searchUsers(request, page, size))
                .build();
    }
    //xem chiết tiết tài khoản user của admin
    @GetMapping("/{accountId}")
    public ApiResponse<AdminUserDetailResponse> getUserDetail(
            Principal principal,
            @PathVariable Long accountId,
            @RequestParam(defaultValue = "0") int postPage,
            @RequestParam(defaultValue = "6") int postSize,
            @RequestParam(defaultValue = "0") int reportPage,
            @RequestParam(defaultValue = "6") int reportSize
    ) {
        String adminID = principal.getName();

        return ApiResponse.<AdminUserDetailResponse>builder()
                .result(adminUserService.getUserDetail(
                        accountId,
                        postPage,
                        postSize,
                        reportPage,
                        reportSize
                ))
                .build();
    }
    @PatchMapping("/{accountId}/unlock")
    public ApiResponse<String> unlockUser(
            Principal principal,
            @PathVariable Long accountId
    ) {
        String adminID = principal.getName();

        return ApiResponse.<String>builder()
                .result(adminUserService.unlockUser(accountId))
                .build();
    }
}