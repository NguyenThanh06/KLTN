package com.developer.EyesOnly.DTO.Response;

import lombok.*;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProfileResponse {

    private Long accountID;
    private String username;
    private String tenHienThi;
    private String email;
    private String avatar;
    private String tieuSu;

    private LocalDate ngayDoiTenGanNhat;

    private Boolean daVoHieuHoa;
    private LocalDate ngayVoHieuHoa;
}