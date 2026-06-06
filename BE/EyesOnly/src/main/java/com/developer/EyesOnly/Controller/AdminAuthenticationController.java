package com.developer.EyesOnly.Controller;

import com.developer.EyesOnly.DTO.Request.AdminLoginRequest;
import com.developer.EyesOnly.DTO.Request.ApiResponse;
import com.developer.EyesOnly.DTO.Response.AdminLoginResponse;
import com.developer.EyesOnly.Service.AdminAuthenticationService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/admin/auth")
@RequiredArgsConstructor
public class AdminAuthenticationController {

    private final AdminAuthenticationService adminAuthenticationService;

    @PostMapping("/login")
    public ApiResponse<AdminLoginResponse> login(
            @RequestBody AdminLoginRequest request
    ) {
        return ApiResponse.<AdminLoginResponse>builder()
                .result(adminAuthenticationService.login(request))
                .build();
    }
}