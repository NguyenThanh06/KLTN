package com.developer.EyesOnly.Controller;

import com.developer.EyesOnly.DTO.Request.ApiResponse;
import com.developer.EyesOnly.DTO.Request.UpdateProfileRequest;
import com.developer.EyesOnly.DTO.Response.AccountPublicProfileResponse;
import com.developer.EyesOnly.DTO.Response.MyProfileResponse;
import com.developer.EyesOnly.DTO.Response.ProfileResponse;
import com.developer.EyesOnly.Exception.AppException;
import com.developer.EyesOnly.Exception.ErrorCode;
import com.developer.EyesOnly.Service.ProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.security.Principal;

@RestController
@RequestMapping("/profile")
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileService profileService;
    @GetMapping("/me")
    public ApiResponse<MyProfileResponse> getMyProfile(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "6") int size,
            Principal principal
    ) {
        Long currentAccountId = getCurrentAccountId(principal);
        return ApiResponse.<MyProfileResponse>builder()
                .result(profileService.getMyProfile(currentAccountId, page, size))
                .build();
    }
    @GetMapping("/info")
    public ApiResponse<ProfileResponse> getMyProfileInf(
            Principal principal
    ) {
        Long currentAccountId = getCurrentAccountId(principal);
        return ApiResponse.<ProfileResponse>builder()
                .result(profileService.getMyProfile(currentAccountId))
                .build();
    }
    //http://localhost:8080/profile/59?page=0&size=6
    @GetMapping("/{accountId:\\d+}")
    public ApiResponse<AccountPublicProfileResponse> getPublicProfile(
            Principal principal,
            @PathVariable Long accountId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "6") int size
    ) {
        Long currentAccountId = null;

        if (principal != null) {
            currentAccountId = Long.valueOf(principal.getName());
        }

        return ApiResponse.<AccountPublicProfileResponse>builder()
                .result(profileService.getPublicProfile(
                        currentAccountId,
                        accountId,
                        page,
                        size
                ))
                .build();
    }
    /*
     * API cập nhật profile của người dùng đang đăng nhập.
     *
     * PUT /profile/me
     *
     * multipart/form-data gồm:
     * - tenHienThi: String, optional
     * - tieuSu: String, optional
     * - avatarPreset: String, optional
     * - avatar: MultipartFile, optional
     */
    @PutMapping(
            value = "/me",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ApiResponse<ProfileResponse> updateMyProfile(
            Principal principal,
            @RequestParam(value = "tenHienThi", required = false) String tenHienThi,
            @RequestParam(value = "tieuSu", required = false) String tieuSu,
            @RequestParam(value = "avatarPreset", required = false) String avatarPreset,
            @RequestPart(value = "avatar", required = false) MultipartFile avatar
    ) {
        Long currentAccountId = getCurrentAccountId(principal);

        UpdateProfileRequest request = UpdateProfileRequest.builder()
                .tenHienThi(tenHienThi)
                .tieuSu(tieuSu)
                .avatarPreset(avatarPreset)
                .build();

        return ApiResponse.<ProfileResponse>builder()
                .result(profileService.updateMyProfile(
                        currentAccountId,
                        request,
                        avatar
                ))
                .message("Lưu thay đổi thành công")
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