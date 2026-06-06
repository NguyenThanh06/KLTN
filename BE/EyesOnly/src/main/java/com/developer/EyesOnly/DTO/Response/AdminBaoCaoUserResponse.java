package com.developer.EyesOnly.DTO.Response;

import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminBaoCaoUserResponse {

    private Long baoCaoUID;

    private LocalDateTime ngayBaoCao;

    private String mucBaoCao;

    private String noiDungBaoCao;

    private Long nguoiBaoCaoID;
    private String usernameNguoiBaoCao;
    private String tenHienThiNguoiBaoCao;
}