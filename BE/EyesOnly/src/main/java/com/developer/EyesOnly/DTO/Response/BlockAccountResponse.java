package com.developer.EyesOnly.DTO.Response;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BlockAccountResponse {
    private Long targetAccountId;
    private Boolean daChan;
    private String message;
}