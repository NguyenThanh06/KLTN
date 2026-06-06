package com.developer.EyesOnly.DTO.Request;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateProfileRequest {

    /*
     * Tên hiển thị mới.
     * Nếu rỗng hoặc chỉ có khoảng trắng, BE sẽ dùng username hiện tại.
     */
    private String tenHienThi;

    /*
     * Tiểu sử mới.
     * Nếu rỗng hoặc chỉ có khoảng trắng, BE sẽ lưu null.
     */
    private String tieuSu;

    /*
     * Đường dẫn avatar mặc định do FE chọn.
     *
     * Ví dụ:
     * /defaultAvatar/default_avatar_2.svg
     *
     * Field này dùng cho nút chọn avatar ngẫu nhiên,
     * vì trường hợp đó FE không gửi MultipartFile.
     */
    private String avatarPreset;
}