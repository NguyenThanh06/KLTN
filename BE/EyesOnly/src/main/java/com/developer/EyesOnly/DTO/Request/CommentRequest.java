package com.developer.EyesOnly.DTO.Request;

import lombok.AccessLevel;
import lombok.Data;
import lombok.experimental.FieldDefaults;

@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CommentRequest {
    String noiDung;      // Nội dung bình luận
    Long parentID;       // ID của bình luận cha (null nếu là bình luận gốc)
}
