package com.developer.EyesOnly.DTO.Response;

import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BaoCaoUserResponse {
    private Long baoCaoUID;
    private Long accountID;
    private String username;
    private String tenHienThi;
    private String mucBaoCao;
    private String noiDungBaoCao;
    private LocalDateTime ngayBaoCao;
    private String message;
}