package com.developer.EyesOnly.DTO.Request;

import lombok.Data;

import java.util.List;

@Data
public class UpdatePostRequest {

    private String tieuDe;

    private String moTa;

    private List<String> lstGanThe ;

    private Boolean sanPhamAI;

    private Byte hanCheHienThi;

    private Boolean congKhai;

    private Boolean dynamicWM;

    private Boolean choPhepComment;
}