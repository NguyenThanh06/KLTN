package com.developer.EyesOnly.Controller;

import com.developer.EyesOnly.DTO.Request.*;
import com.developer.EyesOnly.DTO.Response.AccountResponse;
import com.developer.EyesOnly.DTO.Response.AuthenticationRespone;
import com.developer.EyesOnly.DTO.Response.IntrospectRespone;
import com.developer.EyesOnly.Exception.AppException;
import com.developer.EyesOnly.Exception.ErrorCode;
import com.developer.EyesOnly.Service.AccountService;
import com.developer.EyesOnly.Service.AuthenticationService;
import com.nimbusds.jose.JOSEException;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.text.ParseException;
@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AuthenticationController {
    @Autowired
    AuthenticationService authenticationService;
    @Autowired
    AccountService accountService;
    @PostMapping("/token")
    ApiResponse<AuthenticationRespone> authenticated(@RequestBody AuthenticationRequest request){
        AuthenticationRespone result =  authenticationService.authenticate(request);
        return ApiResponse.<AuthenticationRespone>builder()
                .result(result)
                .build();
    }
    // BƯỚC 2: Xác thực OTP và tạo tài khoản vào Database
    @PostMapping("/verify-otp")
    public ApiResponse<AccountResponse> verifyAndRegister(@RequestBody OtpRequest otpRequest) throws ParseException, JOSEException {

        if (otpRequest.getEmail() == null) {
            throw new AppException(ErrorCode.EMAIL_NULL);
        }
        System.out.println("OTP gửi tới " + otpRequest.getEmail() + " là: " + otpRequest.getOtp()); // Log để debug
        ApiResponse<AccountResponse> apiResponse = new ApiResponse<>();
        apiResponse.setResult(accountService.verifyAndCreateAccount(otpRequest
                .getEmail(),otpRequest.getOtp()));

        return apiResponse;
    }
    @PostMapping("/introspect")
    ApiResponse<IntrospectRespone> authenticate(@RequestBody IntrospectRequest request) throws ParseException, JOSEException {
        var result = authenticationService.introspectRespone(request);
        return ApiResponse.<IntrospectRespone>builder().result(result).build();
    }
    @PostMapping("/password/forgot")
    public ApiResponse<String> requestResetPassword(
            @RequestBody ForgotPasswordRequest request
    ) {
        accountService.requestResetPassword(request);

        return ApiResponse.<String>builder()
                .result("Mã xác thực đã được gửi đến email")
                .build();
    }

    @PostMapping("/password/reset")
    public ApiResponse<String> resetPassword(
            @RequestBody ResetPasswordRequest request
    ) {
        accountService.resetPassword(request);

        return ApiResponse.<String>builder()
                .result("Đã cấp lại mật khẩu thành công! Vui lòng kiểm tra email")
                .build();
    }
    @PostMapping("/send-verify-otp")
    public ApiResponse<String> sendVerifyOtp(
            @RequestParam String email
    ) {

        accountService.sendOtp(email);

        return ApiResponse.<String>builder()
                .result("Đã gửi OTP")
                .build();
    }
}
