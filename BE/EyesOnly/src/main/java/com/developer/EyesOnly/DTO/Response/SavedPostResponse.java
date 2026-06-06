package com.developer.EyesOnly.DTO.Response;

import com.developer.EyesOnly.Entity.KTEOFile;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class SavedPostResponse {
    private Long postId;
    private String tieuDe;
    private String moTa;
    private Byte hanCheHienThi;
    private List<KTEOFile> lstKTEOFile;
    private Long accountId;
    private String tenHienThi;
    private String avatar;
    private LocalDateTime ngayLuu;
}
