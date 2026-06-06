package com.developer.EyesOnly.Controller;

import com.developer.EyesOnly.DTO.Request.AdminPostSearchRequest;
import com.developer.EyesOnly.DTO.Request.ApiResponse;
import com.developer.EyesOnly.DTO.Request.XemXetBaoCaoRequest;
import com.developer.EyesOnly.DTO.Response.AdminPostDetailResponse;
import com.developer.EyesOnly.DTO.Response.AdminPostSearchResponse;
import com.developer.EyesOnly.Exception.AppException;
import com.developer.EyesOnly.Exception.ErrorCode;
import com.developer.EyesOnly.Service.AdminPostService;
import com.developer.EyesOnly.Service.XemXetBaoCaoService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/admin/posts")
@RequiredArgsConstructor
public class AdminPostController {

    private final AdminPostService adminPostService;
    private final XemXetBaoCaoService xemXetBaoCaoService;
    /*
     * API tìm kiếm Post cho admin.
     *
     * Ví dụ:
     * POST /admin/posts/search?page=0&size=6
     */
    @PostMapping("/search")
    public ApiResponse<AdminPostSearchResponse> searchPosts(
            Principal principal,
            @RequestBody(required = false) AdminPostSearchRequest request,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "6") int size
    ) {
        /*
         * Với token admin, JwtFilter đã set:
         * principal.getName() = adminID
         *
         * Ở chức năng này chưa cần dùng adminID,
         * nhưng vẫn nhận Principal để đảm bảo đây là API cần đăng nhập admin.
         */
        String adminID = principal.getName();

        return ApiResponse.<AdminPostSearchResponse>builder()
                .result(adminPostService.searchPosts(request, page, size))
                .build();
    }
    //hàm lấy về chi tiết 1 post của admin
    @GetMapping("/{postId}")
    public ApiResponse<AdminPostDetailResponse> getPostDetail(
            Principal principal,
            @PathVariable Long postId,
            @RequestParam(defaultValue = "0") int commentPage,
            @RequestParam(defaultValue = "6") int commentSize,
            @RequestParam(defaultValue = "0") int reportPage,
            @RequestParam(defaultValue = "6") int reportSize
    ) {
        String adminID = principal.getName();

        return ApiResponse.<AdminPostDetailResponse>builder()
                .result(adminPostService.getPostDetail(
                        postId,
                        commentPage,
                        commentSize,
                        reportPage,
                        reportSize
                ))
                .build();
    }
    @PutMapping("/{postId}/change_status")
    public ApiResponse<String> xemxetbaoCao(
            Principal principal,
            @PathVariable Long postId,
            @RequestBody XemXetBaoCaoRequest request
    ) {
        String adminID = principal.getName();

        return ApiResponse.<String>builder()
                .result(xemXetBaoCaoService.xemxetbaoCao(postId, request))
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