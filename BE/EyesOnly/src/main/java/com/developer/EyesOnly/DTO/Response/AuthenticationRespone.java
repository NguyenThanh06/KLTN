package com.developer.EyesOnly.DTO.Response;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AuthenticationRespone {
    private String token;
    private Long accountID;
    private String username;
    private String tenHienThi;
    private String avatar;
    private boolean authenticated;
    private boolean daVoHieuHoa;
    private boolean biKhoa;
}
