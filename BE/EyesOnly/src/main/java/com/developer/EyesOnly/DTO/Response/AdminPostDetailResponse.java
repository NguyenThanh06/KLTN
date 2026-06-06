package com.developer.EyesOnly.DTO.Response;

import lombok.*;

import java.time.LocalDateTime;
import java.util.Date;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminPostDetailResponse {

    private Long postID;

    private String tieuDe;
    private String moTa;

    private LocalDateTime ngayDang;

    private Long tacGiaID;
    private String usernameTacGia;
    private String tenTacGia;
    private String avatarTacGia;

    private Long luotXem;
    private Long luotThich;

    private Boolean sanPhamAI;
    private Boolean congKhai;

    /*
     * Trạng thái hạn chế hiển thị của Post.
     * Ví dụ:
     * 0 = bình thường
     * 1 = hạn chế 18+
     * 99 = tạm ẩn
     */
    private Byte hanCheHienThi;

    /*
     * Admin đã xem xét báo cáo của bài này chưa.
     */
    private Boolean daXemXetBaoCao;

    private List<KteoFileResponse> files;

    private List<String> tags;

    /*
     * Danh sách comment của post.
     * Admin xem tổng quan nên có thể lấy toàn bộ hoặc giới hạn tùy bạn.
     */
    private PageResponse<AdminCommentResponse> comments;

    /*
     * Danh sách báo cáo mà post này nhận được.
     */
    private PageResponse<AdminBaoCaoPostResponse> baoCaos;
}