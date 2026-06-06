package com.developer.EyesOnly.DTO.Response;

import lombok.*;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminStaffListResponse {

    /*
     * Nếu không có nhân sự nào ngoài admin đang đăng nhập,
     * message = "Chưa có nhân sự nào trong hệ thống".
     *
     * Nếu có dữ liệu thì message có thể null.
     */
    private String message;

    private List<AdminStaffItemResponse> content;

    private int page;
    private int size;

    private long totalElements;
    private int totalPages;

    private boolean first;
    private boolean last;
}