package com.developer.EyesOnly.DTO.Request;

import jakarta.persistence.Column;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AccountUpdateRequest {
    private String email;
    private String password;
    private String username;
    private String tenHienThi;
    private LocalDate ngayTaoTaiKhoan;
    private String tieuSu;
    private String avatar;
    private Boolean daVoHieuHoa;
    private LocalDate ngayVoHieuHoa;
    private LocalDate ngayDoiTenGanNhat;
    private Boolean biKhoa;
    private Boolean daXacThuc;
}
