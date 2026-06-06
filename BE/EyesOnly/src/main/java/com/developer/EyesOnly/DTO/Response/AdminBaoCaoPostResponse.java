package com.developer.EyesOnly.DTO.Response;

import com.developer.EyesOnly.Enum.ReportType;
import lombok.*;

import java.util.Date;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminBaoCaoPostResponse {

    private Long baoCaoID;

    private Date ngayBaoCao;

    private String mucBaoCao;

    private String noiDungBaoCao;

    private Byte hanCheHienThiGoc;
    private String hanCheHienThiText;
    /*
     * Nếu bạn đã thêm chống spam báo cáo post bằng NguoiBaoCaoID
     * thì trả thêm người báo cáo.
     */
    private Long nguoiBaoCaoID;
    private String usernameNguoiBaoCao;
    private String tenHienThiNguoiBaoCao;
}