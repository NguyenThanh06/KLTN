package com.developer.EyesOnly.Entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "Tag")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Tag {

    @Id
    @Column(name = "TenTag", length = 50)
    private String tenTag;

    @Column(name = "SoLuongPost", nullable = false)
    private Long soLuongPost;
}
