package com.developer.EyesOnly.DTO.Response;

import lombok.*;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MyProfileResponse {
    private Long accountID;

    private String username;
    private String tenHienThi;
    private String avatar;
    private String email;
    private String tieuSu;

    private Long soNguoiTheoDoi;
    private Long soNguoiDangTheoDoi;

    private LocalDate ngayThamGia;

    private Boolean daVoHieuHoa;
    private LocalDate ngayVoHieuHoa;

    private PageResponse<PostProfileResponse> thuVienTacPham;
}