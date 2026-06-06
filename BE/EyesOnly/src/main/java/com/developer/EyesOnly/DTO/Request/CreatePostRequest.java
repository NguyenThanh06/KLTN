package com.developer.EyesOnly.DTO.Request;

import lombok.*;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreatePostRequest {

    private String tieuDe;

    private String moTa;

    private List<String> lstGanThe;

    private Boolean sanPhamAI;

    private Byte hanCheHienThi;

    private Boolean dynamicWM;

    private Boolean choPhepComment;

    private Boolean congKhai;

    /*
     * true: tất cả ảnh dùng chung globalProtectionSettings.
     * false: mỗi ảnh dùng setting riêng trong protectionPayload.
     */
    private Boolean applyToAll;

    /*
     * Setting bảo vệ dùng chung cho tất cả ảnh.
     * FE gửi field này khi applyToAll = true.
     */
    private ImageProtectionOptionRequest globalProtectionSettings;

    /*
     * Danh sách setting riêng từng ảnh.
     * Thứ tự item trong list này nên khớp với thứ tự MultipartFile[] images.
     */
    private List<FileProtectionPayloadRequest> protectionPayload;
}