package com.developer.EyesOnly.DTO.Response;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminStaffItemResponse {

    /*
     * AdminID vừa là khóa chính, vừa là tên đăng nhập của admin.
     */
    private String adminID;

    /*
     * Tên hiển thị của admin.
     */
    private String adminName;

    /*
     * ID vai trò của admin.
     * Ví dụ: 1, 2, 3...
     */
    private Integer roleID;

    /*
     * Tên vai trò.
     * Ví dụ: QuanLyNhanSu, KiemDuyetNoiDung...
     */
    private String vaiTro;
}