package com.developer.EyesOnly.Controller;

import com.developer.EyesOnly.DTO.Request.ApiResponse;
import com.developer.EyesOnly.Exception.AppException;
import com.developer.EyesOnly.Exception.ErrorCode;
import com.developer.EyesOnly.Service.PostService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/comment")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173", allowedHeaders = "*")
public class CommentController {
    private final PostService postService;
    @PostMapping("/{commentId}/like")
    public ApiResponse<String> likePost(@PathVariable Long commentId, Principal principal) {
        Long accountId = getCurrentAccountId(principal);
        postService.toggleLikeComment(commentId, accountId);
        return ApiResponse.<String>builder().result("Thành công").build();
    }
    // DELETE COMMENT
    @DeleteMapping("/delete/{commentId}")
    public ApiResponse<String> deleteComment(
            @PathVariable Long commentId,
            Principal principal
    ) {

        Long accountId = getCurrentAccountId(principal);

        return ApiResponse.<String>builder()
                .result(
                        postService.deleteComment(commentId, accountId)
                )
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
