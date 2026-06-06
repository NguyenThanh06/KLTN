package com.developer.EyesOnly.Entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "ThongBao")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ThongBao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long thongBaoID;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "AccountID", nullable = false)
    private Account account;

    @Column(columnDefinition = "NVARCHAR(255)", nullable = false)
    private String noiDung;

    @Column(length = 255)
    private String link;

    private LocalDateTime thoiDiemThongBao;

    private Boolean daDoc;

    private Integer loaiThongBao;
}