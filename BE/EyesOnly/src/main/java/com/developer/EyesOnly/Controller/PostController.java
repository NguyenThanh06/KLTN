package com.developer.EyesOnly.Controller;

import com.developer.EyesOnly.DTO.Request.*;
import com.developer.EyesOnly.DTO.Response.*;
import com.developer.EyesOnly.Entity.Post;
import com.developer.EyesOnly.Exception.AppException;
import com.developer.EyesOnly.Exception.ErrorCode;
import com.developer.EyesOnly.Service.FileProtectionService;
import com.developer.EyesOnly.Service.PostService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import tools.jackson.databind.ObjectMapper;

import java.security.Principal;
import java.util.List;

/**
 * API đăng bài post.
 *
 * FE sẽ gửi multipart/form-data gồm:
 * - request: JSON string của CreatePostRequest
 * - images: danh sách ảnh
 */
@RestController
@RequestMapping("/posts")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173", allowedHeaders = "*")
public class PostController {

    private final PostService postService;
    private final tools.jackson.databind.ObjectMapper objectMapper;
    private final FileProtectionService fileProtectionService;
    @PostMapping(value = "/create", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<Long> createPost(
            @RequestPart("request") String requestJson,
            @RequestPart("images") MultipartFile[] images,
            Principal principal
    ) throws Exception {
        System.out.println("6/6");
        CreatePostRequest request = objectMapper.readValue(requestJson, CreatePostRequest.class);
        Long postId = postService.createPost(request, images, principal);

        return ApiResponse.<Long>builder()
                .result(postId)
                .message("Đăng Post thành công")
                .build();
    }
    @PostMapping("/{postId}/like")
    public ApiResponse<String> likePost(@PathVariable Long postId, Principal principal) {
        Long accountId = getCurrentAccountId(principal);
        postService.toggleLike(postId, accountId);
        return ApiResponse.<String>builder().result("Thành công").build();
    }
    @PostMapping("/{postId}/comments")
    public ApiResponse<CommentResponse> createComment(
            @PathVariable Long postId,
            @RequestBody CommentRequest request, // Sử dụng DTO vừa tạo
            Principal principal) {

        Long accountId = getCurrentAccountId(principal);

        return ApiResponse.<CommentResponse>builder()
                .result(postService.saveComment(postId, accountId, request))
                .build();
    }
    @GetMapping("/postDetail/{postId}")
    public ApiResponse<PostDetailResponse> getPostDetail(
            @PathVariable Long postId
    ) {

        PostDetailResponse result = postService.getPostDetail(postId);

        return ApiResponse.<PostDetailResponse>builder()
                .result(result)
                .build();
    }
    @PutMapping("/update/{postId}")
    public ApiResponse<String> updatePost(
            @PathVariable Long postId,
            @RequestBody UpdatePostRequest request,
            Principal principal
    ) {

        Long accountId = getCurrentAccountId(principal);

        return ApiResponse.<String>builder()
                .result(
                        postService.updatePost(
                                postId,
                                accountId,
                                request
                        )
                )
                .build();
    }
    @DeleteMapping("delete/{postId}")
    public  ApiResponse<String> deletePost(@PathVariable Long postId,Principal principal){
        Long accountId = getCurrentAccountId(principal);
        return ApiResponse.<String>builder()
                .result(
                        postService.deletePost(postId,accountId)
                )
                .build();
    }
    @PostMapping("/{postId}/report")
    public ApiResponse<String> reportPost(
            Principal principal,
            @PathVariable Long postId,
            @RequestBody BaoCaoPostRequest request
    ) {
        Long accountId = getCurrentAccountId(principal);

        return ApiResponse.<String>builder()
                .result(postService.reportPost(
                        accountId,
                        postId,
                        request
                ))
                .build();
    }
    @PostMapping("/{postId}/save")
    public ApiResponse<String> savepost(
            @PathVariable Long postId,
            Principal principal
    ) {

        Long accountId = getCurrentAccountId(principal);
        return ApiResponse.<String>builder()
                .result(
                        postService.toggleSavePost(postId,accountId)
                )
                .build();
    }
    @GetMapping("/saved")
    public ApiResponse<PageResponse<SavedPostResponse>> getSavedPosts(
            @RequestParam(defaultValue = "0") int page,
            Principal principal
    ) {

        Long accountId = getCurrentAccountId(principal);

        return ApiResponse.<PageResponse<SavedPostResponse>>builder()
                .result(postService.getSavedPosts(accountId, page))
                .build();
    }
    @PostMapping("/search")
    public ApiResponse<PostSearchResponse> searchPosts(
            @RequestBody PostSearchRequest request,
            @RequestParam(defaultValue = "0") int page
    ) {
        System.out.println("test");
        return ApiResponse.<PostSearchResponse>builder()
                .result(postService.searchPosts(request, page))
                .build();
    }
    @GetMapping("/{postId}/comments")
    public ApiResponse<PageResponse<CommentResponse>> getComments(
            @PathVariable Long postId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "6") int size) {
        return ApiResponse.<PageResponse<CommentResponse>>builder()
                .result(postService.getCommentsByPost(postId, page, size))
                .build();
    }
    @GetMapping("/comments/{parentId}/replies")
    public ApiResponse<PageResponse<CommentResponse>> getReplies(
            @PathVariable Long parentId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "3") int size) {
        return ApiResponse.<PageResponse<CommentResponse>>builder()
                .result(postService.getRepliesByParent(parentId, page, size))
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
    /*
     * Lấy danh sách Post liên quan dưới dạng phân trang.
     *
     * Ví dụ:
     * GET /posts/postDetail/41/related?page=0
     * GET /posts/postDetail/41/related?page=1
     */
    @GetMapping("/postDetail/{postId}/related")
    public ApiResponse<PostSearchResponse> getRelatedPosts(
            @PathVariable Long postId,
            @RequestParam(defaultValue = "0") int page
    ) {
        PostSearchResponse result =
                postService.getRelatedPosts(
                        postId,
                        page
                );

        return ApiResponse.<PostSearchResponse>builder()
                .message(
                        result.getContent().isEmpty()
                                ? "Không tìm thấy Post liên quan"
                                : "Lấy danh sách Post liên quan thành công"
                )
                .result(result)
                .build();
    }
    /**
     * Tạo video preview bảo vệ ảnh.
     *
     * FE gửi:
     * - image: file ảnh đang chọn
     * - settings: JSON của ImageProtectionOptionRequest
     *
     * BE trả:
     * - binary video/webm
     */
    @PostMapping(
            value = "/protection-preview",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE,
            produces = "video/webm"
    )
    public ResponseEntity<byte[]> createProtectionPreview(
            @RequestPart("image") MultipartFile image,
            @RequestPart("settings") String settingsJson
    ) throws Exception {

        ImageProtectionOptionRequest settings =
                objectMapper.readValue(
                        settingsJson,
                        ImageProtectionOptionRequest.class
                );

        byte[] videoBytes =
                fileProtectionService.createProtectionPreviewVideo(
                        image,
                        settings
                );

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("video/webm"))
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        "inline; filename=\"preview.webm\""
                )
                .header(
                        HttpHeaders.CACHE_CONTROL,
                        "no-store, no-cache, must-revalidate"
                )
                .contentLength(videoBytes.length)
                .body(videoBytes);
    }
}
