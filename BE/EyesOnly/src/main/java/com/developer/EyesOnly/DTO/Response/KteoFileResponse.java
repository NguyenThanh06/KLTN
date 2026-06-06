package com.developer.EyesOnly.DTO.Response;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KteoFileResponse {
    private Long fileID;
    private String link;
    private Integer width;
    private Integer height;
    private Integer thuTu;
    private String verifyKey;
}