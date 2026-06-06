package com.developer.EyesOnly.Controller;

import com.developer.EyesOnly.DTO.Request.ApiResponse;
import com.developer.EyesOnly.DTO.Response.VerifyOriginalImageResponse;
import com.developer.EyesOnly.DTO.Response.VerifyResultResponse;
import com.developer.EyesOnly.Service.ImageVerificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/verify")
@RequiredArgsConstructor
public class ImageVerificationController {

    private final ImageVerificationService imageVerificationService;

    /**
     * Xác thực ảnh người dùng cung cấp với một tệp KTEO.
     *
     * API:
     * POST /verify/file/{fileId}
     *
     * Content-Type:
     * multipart/form-data
     *
     * Form data:
     * image: tệp ảnh gốc người dùng cung cấp
     *
     * Nếu thành công:
     * - Lưu một dòng vào VerifyThanhCong.
     * - Trả về verifyID vừa được tạo.
     *
     * Nếu thất bại:
     * - Không lưu dòng nào.
     * - Trả verified = false và verifyID = null.
     */
    @PostMapping(
            value = "/file/{fileId}",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ApiResponse<VerifyOriginalImageResponse> verifyOriginalImage(
            @PathVariable Long fileId,
            @RequestPart("image") MultipartFile image
    ) {
        VerifyOriginalImageResponse result =
                imageVerificationService.verifyAndSaveResult(
                        fileId,
                        image
                );

        return ApiResponse.<VerifyOriginalImageResponse>builder()
                .result(result)
                .message(
                        Boolean.TRUE.equals(result.getVerified())
                                ? "Xác thực hình ảnh thành công"
                                : "Hình ảnh không khớp với bản gốc"
                )
                .build();
    }
    /**
     * API lấy thông tin của một kết quả xác thực thành công.
     *
     * FE sử dụng API này tại trang:
     * /verify/{verifyID}
     *
     * Ví dụ:
     * GET /verify/1
     */
    @GetMapping("/{verifyID}")
    public ApiResponse<VerifyResultResponse> getVerifyResult(
            @PathVariable Long verifyID
    ) {
        VerifyResultResponse result =
                imageVerificationService.getVerifyResult(verifyID);

        return ApiResponse.<VerifyResultResponse>builder()
                .message("Lấy kết quả xác thực thành công")
                .result(result)
                .build();
    }
}