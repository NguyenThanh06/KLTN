package com.developer.EyesOnly.Entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "Admin")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Admin {

    /*
     * AdminID vừa là khóa chính, vừa là tên đăng nhập.
     * Ví dụ: admin01, hr_manager01...
     */
    @Id
    @Column(name = "AdminID", length = 30)
    private String adminID;

    /*
     * Mật khẩu đã mã hóa BCrypt.
     */
    @Column(name = "Password", length = 70, nullable = false)
    private String password;

    /*
     * Tên hiển thị của admin.
     */
    @Column(name = "AdminName", length = 20, nullable = false)
    private String adminName;

    /*
     * Vai trò của admin.
     * Ví dụ:
     * 1 = quản trị hệ thống
     * 2 = kiểm duyệt nội dung
     * 3 = quản lý nhân sự
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "VaiTro")
    private Role vaiTro;
}