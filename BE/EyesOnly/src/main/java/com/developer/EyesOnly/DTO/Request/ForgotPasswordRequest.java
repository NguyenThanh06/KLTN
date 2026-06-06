package com.developer.EyesOnly.DTO.Request;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ForgotPasswordRequest {
    private String email;
}