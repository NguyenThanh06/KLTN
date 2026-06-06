package com.developer.EyesOnly.DTO.Response;

import lombok.*;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FollowAccountListResponse {
    private Long accountID;
    private String tenHienThi;

    private String message;

    private List<FollowAccountItemResponse> content;

    private int page;
    private int size;
    private long totalElements;
    private int totalPages;
    private boolean first;
    private boolean last;
}