package com.developer.EyesOnly.DTO.Request;

import com.developer.EyesOnly.Enum.ReportType;
import lombok.Data;

@Data
public class BaoCaoPostRequest {

    private ReportType mucBaoCao;

    private String noiDungBaoCao;
}