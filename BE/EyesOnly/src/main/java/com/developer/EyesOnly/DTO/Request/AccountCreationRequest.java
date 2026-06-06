package com.developer.EyesOnly.DTO.Request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.*;
import lombok.experimental.FieldDefaults;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AccountCreationRequest {
    // Không dùng @Column ở đây
//    @Pattern(regexp = "^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$", message = "EMAIL_VALID")
//    @NotBlank(message = "EMAIL_TRONG")
//    @Size(max = 100, message = "EMAIL_DODAI")
//    @Email(message = "Email không hợp lệ")
    String email;
//
//    @NotBlank(message = "PASSWORD_TRONG")
//    @Size(max = 32, message = "PASSWORD_DODAI")
//    @Size(min = 6, message = "PASSWORD_INVALID")
    String password;

//    @NotBlank(message = "USERNAME_TRONG")
//    @Pattern(regexp = "^[a-z0-9_]{3,20}$", message = "USERNAME_VALID")
//    @Size (max = 20, message = "USERNAME_DODAI")
    String username;
    String tenHienThi;
    LocalDate ngayTaoTaiKhoan;
    String tieuSu;
    String avatar;
    Boolean daVoHieuHoa;
    LocalDate ngayVoHieuHoa;
    LocalDate ngayDoiTenGanNhat;
    Boolean biKhoa;
    Boolean daXacThuc;
    String otp; // Quan trọng để xác thực
}