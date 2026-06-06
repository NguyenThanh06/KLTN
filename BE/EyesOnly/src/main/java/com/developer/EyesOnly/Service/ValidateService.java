package com.developer.EyesOnly.Service;

import com.developer.EyesOnly.DTO.Request.CheckSignupEmailRequest;
import com.developer.EyesOnly.DTO.Request.VerifyResetPasswordEmailRequest;
import com.developer.EyesOnly.Entity.Account;
import com.developer.EyesOnly.Exception.AppException;
import com.developer.EyesOnly.Exception.ErrorCode;
import com.developer.EyesOnly.Repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class ValidateService {
    private final UserRepository userRepository;
    private static final Pattern EMAIL_PATTERN = Pattern.compile(
            "^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9-]+(?:\\.[A-Za-z0-9-]+)+$"
    );

    private String validateAvailableSignupEmail(String rawEmail) {
        if (rawEmail == null || rawEmail.isBlank()) {
            throw new AppException(ErrorCode.NULL_EMAIL);
        }

        String email = rawEmail.trim().toLowerCase();

        if (email.length() > 100) {
            throw new AppException(ErrorCode.EMAIL_TOO_LONG);
        }

        if (!EMAIL_PATTERN.matcher(email).matches()) {
            throw new AppException(ErrorCode.EMAIL_NOT_AN_EMAIL);
        }

        if (userRepository.findByEmail(email) != null) {
            throw new AppException(ErrorCode.EMAIL_EXIST);
        }

        return email;
    }
    public void checkSignupEmail(CheckSignupEmailRequest request) {
        validateAvailableSignupEmail(request.getEmail());
    }
    /*
     * Kiểm tra email trước khi gửi OTP cấp lại mật khẩu.
     *
     * Việc kiểm tra null và sai định dạng đã được xử lý bởi
     * annotation validation trong VerifyResetPasswordEmailRequest.
     *
     * Hàm này chỉ cần kiểm tra email có tồn tại trong hệ thống hay không.
     */
    @Transactional(readOnly = true)
    public void verifyEmailResetPassword(
            VerifyResetPasswordEmailRequest request
    ) {
        String normalizedEmail = request.getEmail()
                .trim()
                .toLowerCase();

        boolean emailExists =
                userRepository.existsByEmail(normalizedEmail);

        if (!emailExists) {
            throw new AppException(ErrorCode.EMAIL_NOT_EXIST);
        }
        Account account = userRepository.findByEmail(request.getEmail());

        if (account == null) {
            throw new AppException(ErrorCode.EMAIL_NOT_EXISTED);
        }
    }
}
