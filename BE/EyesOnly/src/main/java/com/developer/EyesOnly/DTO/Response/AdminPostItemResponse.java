package com.developer.EyesOnly.DTO.Response;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminPostItemResponse {

    private Long postID;

    private String tieuDe;
    private String moTa;

    private LocalDateTime ngayDang;

    private Long tacGiaID;
    private String usernameTacGia;
    private String tenHienThiTacGia;
    private String avatarTacGia;

    private Long luotXem;

    private Boolean sanPhamAI;
    private Byte hanCheHienThi;
    private String hanCheHienThiText;
    private Boolean congKhai;

    private List<KteoFileResponse> files;
}