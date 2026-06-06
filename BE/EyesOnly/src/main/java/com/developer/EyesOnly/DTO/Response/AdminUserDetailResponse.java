package com.developer.EyesOnly.DTO.Response;

import lombok.*;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminUserDetailResponse {

    private Long accountID;

    private String username;
    private String tenHienThi;
    private String avatar;
    private String tieuSu;

    private Long soNguoiTheoDoi;
    private Long soNguoiDangTheoDoi;

    private LocalDate ngayThamGia;

    private String email;

    private Boolean daVoHieuHoa;
    private LocalDate ngayVoHieuHoa;

    private Boolean daXacThuc;
    private Boolean biKhoa;

    /*
     * Thư viện tác phẩm của Account.
     * Admin xem dưới dạng phân trang.
     */
    private PageResponse<AdminPostItemResponse> thuVienTacPham;

    /*
     * Danh sách báo cáo user mà Account này đã nhận.
     * Admin xem dưới dạng phân trang.
     */
    private PageResponse<AdminBaoCaoUserResponse> baoCaos;
}