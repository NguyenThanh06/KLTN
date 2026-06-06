package com.developer.EyesOnly.DTO.Request;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FileProtectionPayloadRequest {

    /*
     * ID tạm do FE tạo ra.
     * BE không nhất thiết dùng field này, nhưng giữ lại để request khớp FE.
     */
    private String fileId;

    /*
     * Tên file gốc.
     * Chỉ dùng để tham khảo/debug, không nên dùng để match chính vì có thể trùng tên.
     */
    private String fileName;

    /*
     * Setting bảo vệ riêng cho file này.
     */
    private ImageProtectionOptionRequest settings;
}