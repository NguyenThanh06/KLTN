package com.developer.EyesOnly.DTO.Response;

import lombok.*;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminUserItemResponse {

    private Long accountID;

    private String username;
    private String tenHienThi;
    private String email;
    private String avatar;
    private String tieuSu;

    private LocalDate ngayTaoTaiKhoan;

    private Boolean biKhoa;
    private Boolean daVoHieuHoa;
    private Boolean daXacThuc;

    private Long soNguoiTheoDoi;
    private Long soNguoiDangTheoDoi;
}