package com.developer.EyesOnly.DTO.Request;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminPostSearchRequest {
    /*
     * Post ID admin nhập ở ô tìm kiếm.
     * Nếu null thì không lọc theo PostID.
     */
    private Long postId;

    /*
     * Chế độ hiển thị:
     * ALL = toàn bộ
     * HIDDEN = đã tạm ẩn
     * NOT_HIDDEN = không tạm ẩn
     */
    private String hanCheHienThi;
}
