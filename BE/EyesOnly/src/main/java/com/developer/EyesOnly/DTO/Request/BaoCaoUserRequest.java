package com.developer.EyesOnly.DTO.Request;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BaoCaoUserRequest {
    private String mucBaoCao;
    private String noiDungBaoCao;
}