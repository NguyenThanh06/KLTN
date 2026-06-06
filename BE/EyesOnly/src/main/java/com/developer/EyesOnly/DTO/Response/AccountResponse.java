package com.developer.EyesOnly.DTO.Response;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AccountResponse {
    // Không dùng @Column ở đây
    @Email(message = "Email không hợp lệ")
    String email;

    @Size(min = 8, message = "PASSWORD_INVALID")
    String password;

    String username;

    String otp; // Quan trọng để xác thực
    String token;
}
