package com.developer.EyesOnly.Service;

import com.developer.EyesOnly.DTO.Request.AccountCreationRequest;
import lombok.AllArgsConstructor;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
class PendingRegistration {
    private String hashedOtp;
    private LocalDateTime expiryTime;
}
