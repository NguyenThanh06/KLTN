package com.developer.EyesOnly.DTO.Request;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class    ImageProtectionOptionRequest {
    private Integer frameCount;

    private Integer noiseLevel;

    private Integer colorCoverage;

    private String noiseMode;
}