package com.developer.EyesOnly.DTO.Response;

import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ThongBaoResponse {
    private Long thongBaoID;
    private String noiDung;
    private String link;
    private LocalDateTime thoiDiemThongBao;
    private Boolean daDoc;
    private Integer loaiThongBao;
}