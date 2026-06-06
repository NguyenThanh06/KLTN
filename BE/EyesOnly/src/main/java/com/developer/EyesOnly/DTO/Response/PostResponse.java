package com.developer.EyesOnly.DTO.Response;

import com.developer.EyesOnly.Entity.KTEOFile;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PostResponse {
    private Long postId;
    private String tieuDe;
    private String moTa;

    private String tenHienThi;
    private String avatar;
    private Long accountID;
    private List<KTEOFile> lstKTEOFile;

    private Long luotThich;
    private Boolean daThich;
    private Long luotXem;
    private Boolean sanPhamAI;
    private Byte hanCheHienThi;
}