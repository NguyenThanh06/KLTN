package com.developer.EyesOnly.DTO.Response;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class PythonProtectResponse {
    private byte[] webmBytes;
    private String verifyKey;
    private int width;
    private int height;
}
