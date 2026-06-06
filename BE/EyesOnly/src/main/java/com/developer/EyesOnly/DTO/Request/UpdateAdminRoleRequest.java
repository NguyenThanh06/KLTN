package com.developer.EyesOnly.DTO.Request;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateAdminRoleRequest {

    /*
     * RoleID của vai trò mới.
     *
     * Ví dụ:
     * 1 = Quản lý nhân sự
     * 2 = Kiểm duyệt viên
     * 3 = Đã nghỉ việc
     */
    private Integer roleID;
}