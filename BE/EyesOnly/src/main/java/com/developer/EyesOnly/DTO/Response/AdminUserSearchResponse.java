package com.developer.EyesOnly.DTO.Response;

import lombok.*;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminUserSearchResponse {

    private String message;

    private List<AdminUserItemResponse> content;

    private int page;
    private int size;

    private long totalElements;
    private int totalPages;

    private boolean first;
    private boolean last;
}