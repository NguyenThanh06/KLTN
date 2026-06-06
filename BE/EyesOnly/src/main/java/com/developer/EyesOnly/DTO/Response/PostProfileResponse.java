package com.developer.EyesOnly.DTO.Response;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PostProfileResponse {
    private Long postID;

    private String tieuDe;
    private String moTa;
    private LocalDateTime ngayDang;

    private Long luotXem;
    private Boolean sanPhamAI;
    private Byte hanCheHienThi;
    private Boolean choPhepComment;
    private Boolean congKhai;

    private List<KteoFileResponse> lstKTEOFile;
}