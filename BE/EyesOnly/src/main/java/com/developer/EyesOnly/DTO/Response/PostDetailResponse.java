package com.developer.EyesOnly.DTO.Response;



import lombok.*;

import java.time.LocalDateTime;
import java.util.Date;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PostDetailResponse {

    private Long postID;
    private String tieuDe;
    private String moTa;
    private LocalDateTime ngayDang;
    private Boolean dynamicWM;

    private Long tacGia;
    private String usernameTacGia;
    private String tenTacGia;
    private String avatarTacGia;

    private Long luotXem;
    private Long luotThich;
    private Boolean daThich;
    private Boolean daLuu;
    private Boolean daTheoDoiTacGia;

    private Boolean sanPhamAI;
    private Byte hanCheHienThi;
    private Boolean choPhepComment;
    private Boolean daXemXetBaoCao;
    private Boolean congKhai;
    private List<String> lstGanThe;
    private List<KteoFileResponse> lstKTEOFile;
}
