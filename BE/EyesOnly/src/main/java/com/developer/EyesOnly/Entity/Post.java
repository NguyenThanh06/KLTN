package com.developer.EyesOnly.Entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.Date;
import java.util.List;

@Entity
@Table(name = "Post")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Post {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "PostID")
    private Long postID;

    @Column(name = "TieuDe", length = 50, nullable = false)
    private String tieuDe;

    @Column(name = "MoTa", length = 255)
    private String moTa;

    @Column(name = "NgayDang", nullable = false)
    @Temporal(TemporalType.TIMESTAMP)
    private LocalDateTime ngayDang;

    @Column(name = "DynamicWM", nullable = false)
    private Boolean dynamicWM;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "TacGia", nullable = false)
    private Account tacGia;

    @Column(name = "LuotXem", nullable = false)
    private Long luotXem;

    @Column(name = "SanPhamAI", nullable = false)
    private Boolean sanPhamAI;

    @Column(name = "HanCheHienThi", nullable = false)
    private Byte hanCheHienThi;

    @Column(name = "ChoPhepComment", nullable = false)
    private Boolean choPhepComment;

    @Column(name = "DaXemXetBaoCao", nullable = false)
    private Boolean daXemXetBaoCao;

    @Column(name = "CongKhai", nullable = false)
    private Boolean congKhai;
    @OneToMany(mappedBy = "post", fetch = FetchType.LAZY)
    @OrderBy("thuTu ASC")
    private List<KTEOFile> files;
    @OneToMany(mappedBy = "post", fetch = FetchType.LAZY)
    private List<GanThe> ganThes;
}
