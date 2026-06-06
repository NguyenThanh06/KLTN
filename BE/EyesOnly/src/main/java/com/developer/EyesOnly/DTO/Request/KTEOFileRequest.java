package com.developer.EyesOnly.DTO.Request;

import lombok.Data;

@Data
public class KTEOFileRequest {

    private String link;        // path hoặc tên file
    private Integer width;
    private Integer height;
    private Integer thuTu;
    private String verifyKey;
}
