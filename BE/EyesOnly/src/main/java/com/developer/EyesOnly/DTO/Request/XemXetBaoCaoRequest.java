package com.developer.EyesOnly.DTO.Request;

import com.developer.EyesOnly.Enum.ReportType;
import lombok.Data;

@Data
public class XemXetBaoCaoRequest {
    private Byte hanCheHienThi;
    private Boolean daXemXetBaoCao;
}
