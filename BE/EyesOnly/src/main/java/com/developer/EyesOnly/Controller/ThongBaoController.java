package com.developer.EyesOnly.Controller;

import com.developer.EyesOnly.DTO.Request.ApiResponse;
import com.developer.EyesOnly.DTO.Response.PageResponse;
import com.developer.EyesOnly.DTO.Response.ThongBaoResponse;
import com.developer.EyesOnly.Exception.AppException;
import com.developer.EyesOnly.Exception.ErrorCode;
import com.developer.EyesOnly.Service.ThongBaoService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
public class ThongBaoController {

    private final ThongBaoService thongBaoService;
    // lấy về danh sách thông báo của acc đang đăng nhập
    @GetMapping("/me")
    public ApiResponse<PageResponse<ThongBaoResponse>> getMyNotifications(
            Principal principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Long currentAccountId = getCurrentAccountId(principal);

        return ApiResponse.<PageResponse<ThongBaoResponse>>builder()
                .result(thongBaoService.getMyNotifications(currentAccountId, page, size))
                .build();
    }
    // đếm só thông bo chưa đọc
    @GetMapping("/unread-count")
    public ApiResponse<Long> countUnreadNotifications(
            Principal principal
    ) {
        Long currentAccountId = getCurrentAccountId(principal);

        return ApiResponse.<Long>builder()
                .result(thongBaoService.countUnreadNotifications(currentAccountId))
                .build();
    }
    // kểm tra xem đọc thông báo chưa
    @PutMapping("/{thongBaoId}/read")
    public ApiResponse<String> markAsRead(
            Principal principal,
            @PathVariable Long thongBaoId
    ) {
        Long currentAccountId = getCurrentAccountId(principal);

        thongBaoService.markAsRead(currentAccountId, thongBaoId);

        return ApiResponse.<String>builder()
                .result("Đã đánh dấu thông báo là đã đọc")
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