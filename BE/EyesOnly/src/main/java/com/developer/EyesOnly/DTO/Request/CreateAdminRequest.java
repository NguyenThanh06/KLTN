package com.developer.EyesOnly.DTO.Request;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateAdminRequest {

    /*
     * AdminID vừa là khóa chính, vừa là tên đăng nhập.
     * Chỉ được chứa chữ cái hoa, thường và số.
     */
    private String adminID;

    /*
     * Tên hiển thị của admin.
     */
    private String adminName;

    /*
     * Mật khẩu gốc FE gửi lên.
     * BE sẽ mã hóa BCrypt trước khi lưu DB.
     */
    private String password;

    /*
     * RoleID được chọn từ giao diện.
     * Ví dụ:
     * 1 = Quản lý nhân sự
     * 2 = Kiểm duyệt viên
     */
    private Integer roleID;
}