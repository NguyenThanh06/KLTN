package com.developer.EyesOnly.DTO.Request;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminUserSearchRequest {

    /*
     * Account ID admin nhập vào ô tìm kiếm.
     * Nếu null thì không lọc theo AccountID.
     */
    private Long accountId;

    /*
     * Trạng thái khóa:
     * ALL = toàn bộ
     * LOCKED = đã bị khóa
     * UNLOCKED = không bị khóa
     */
    private String lockStatus;
}