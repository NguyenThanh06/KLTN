package com.developer.EyesOnly.DTO.Response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VerifyOriginalImageResponse {

    /*
     * true:
     * - Ảnh người dùng cung cấp khớp với ảnh gốc của KTEOFile.
     *
     * false:
     * - Ảnh không khớp.
     */
    private Boolean verified;

    /*
     * Chỉ có giá trị khi verified = true.
     *
     * FE có thể dùng verifyID để điều hướng đến trang kết quả:
     * /verify/result?verifyID=...
     */
    private Long verifyID;
}
