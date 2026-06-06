package com.developer.EyesOnly.Entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "BaoCaoUser")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BaoCaoUser {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long baoCaoUID;
    // acc bị báo cáo
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "AccountID", nullable = false)
    private Account account;

    // Account gửi báo cáo
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "NguoiBaoCaoID")
    private Account nguoiBaoCao;

    private LocalDateTime ngayBaoCao;

    @Column(length = 10, nullable = false)
    private String mucBaoCao;

    @Column(length = 50)
    private String noiDungBaoCao;
}