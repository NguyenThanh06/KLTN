package com.developer.EyesOnly.Entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "KTEOFile")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KTEOFile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "FileID")
    private Long fileID;

    @Column(name = "Link", length = 255, nullable = false)
    private String link;

    @Column(name = "Width", nullable = false)
    private Integer width;

    @Column(name = "Height", nullable = false)
    private Integer height;

    @Column(name = "ThuTu", nullable = false)
    private Integer thuTu;

    @Column(name = "VerifyKey", columnDefinition = "nvarchar(max)", nullable = false)
    private String verifyKey;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "PostID", nullable = false)
    @JsonIgnore
    private Post post;
}