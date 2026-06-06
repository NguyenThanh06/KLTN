package com.developer.EyesOnly.Service;

import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PendingChangePassword {
    private String otp;
    private String hashedNewPassword;
    private LocalDateTime expiryTime;
    // Thời điểm được phép gửi lại OTP
    private LocalDateTime nextResendTime;
}