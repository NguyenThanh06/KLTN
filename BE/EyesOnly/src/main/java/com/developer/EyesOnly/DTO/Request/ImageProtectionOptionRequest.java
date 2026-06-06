package com.developer.EyesOnly.DTO.Request;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ImageProtectionOptionRequest {

    /*
     * Mức nhiễu ảnh.
     * FE gửi field này trong settings.noiseLevel.
     */
    private Integer noiseLevel;

    /*
     * Mức phủ màu.
     * Nếu colorCoverage = 5 thì BE random opacity từ 5% đến 15%.
     * Nếu colorCoverage = 20 thì BE random opacity từ 20% đến 30%.
     */
    private Integer colorCoverage;

    /*
     * Chế độ màu:
     * - static: dùng staticColor
     * - dynamic: mỗi frame chọn một màu ngẫu nhiên
     */
    private String noiseColorMode;

    /*
     * Màu tĩnh FE gửi lên.
     * Ví dụ: "#888888"
     */
    private String staticColor;

    /*
     * Số frame của kteo.
     * Chỉ cho phép: 1, 12, 30, 60.
     * Tất cả đều được ghép thành video dài 1 giây.
     */
    private Integer frameCount;

    /*
     * Tên preset FE gửi lên.
     * BE có thể không cần dùng, nhưng giữ lại để nhận request không lỗi.
     */
    private String preset;

    /*
     * Nếu sau này FE muốn bật watermark từ option thì dùng field này.
     */
    private Boolean useWatermark;

    /*
     * Hai field dưới đây giữ lại để tương thích code cũ.
     * Nếu chỗ nào cũ còn gửi colorOverlayLevel/noiseColor thì BE vẫn đọc được.
     */
    private Integer colorOverlayLevel;
    private String noiseColor;
}