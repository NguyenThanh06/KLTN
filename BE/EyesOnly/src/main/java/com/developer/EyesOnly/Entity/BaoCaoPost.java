package com.developer.EyesOnly.Entity;

import com.developer.EyesOnly.Enum.ReportType;
import jakarta.persistence.*;
import lombok.*;

import java.util.Date;

@Entity
@Table(name = "BaoCaoPost")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BaoCaoPost {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "BaoCaoID")
    private Long baoCaoID;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "PostID", nullable = false)
    private Post post;

    // Account gửi báo cáo
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "NguoiBaoCaoID")
    private Account nguoiBaoCao;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "NgayBaoCao", nullable = false)
    private Date ngayBaoCao;

    @Enumerated(EnumType.STRING)
    @Column(name = "MucBaoCao", nullable = false)
    private ReportType mucBaoCao;

    @Column(name = "NoiDungBaoCao", length = 100, nullable = false)
    private String noiDungBaoCao;

    @Column(name = "HanCheHienThiGoc", nullable = false)
    private Byte hanCheHienThiGoc;
}