package com.developer.EyesOnly.DTO.Request;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PostSearchRequest {
    private String keyword;

    // TAG_RELATIVE (tìm kiếm tương đối theo tag), TAG_EXACT(tìm kiếm tuyệt đối theo tag), TITLE_DESCRIPTION(tìm trong tiêu đề, mô tả), ALL (tìm trong thẻ, tiêu đề, mô tả)
    private String keywordCompareType;

    // true = có hiển thị AI, false = không hiển thị AI
    private Boolean includeAI;

    // NEWEST(mới nhất), OLDEST(cũ nhất), MOST_VIEWED(hot nhất)
    private String sortBy;
}