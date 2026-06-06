package com.developer.EyesOnly.Entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.*;

import java.io.Serializable;

@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class GanTheId implements Serializable {

    @Column(name = "PostID")
    private Long postID;

    @Column(name = "TenTag", length = 50)
    private String tenTag;
}
