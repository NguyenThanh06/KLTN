package com.developer.EyesOnly.Entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.util.List;

@Entity
@Table(name = "Account")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Account {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long accountID;

    @Column(unique = true, length = 100)
    private String email;

    @Column(length = 70)
    private String password;

    @Column(unique = true, length = 20)
    private String username;

    @Column(length = 30)
    private String tenHienThi;

    private LocalDate ngayTaoTaiKhoan;
    private String tieuSu;
    private String avatar;
    private Boolean daVoHieuHoa;
    private LocalDate ngayVoHieuHoa;
    private LocalDate ngayDoiTenGanNhat;
    private Boolean biKhoa;
    private Boolean daXacThuc;
    @OneToMany(mappedBy = "tacGia")
    private List<Post> posts;
}
