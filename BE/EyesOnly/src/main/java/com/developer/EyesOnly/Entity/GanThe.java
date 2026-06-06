package com.developer.EyesOnly.Entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "GanThe")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GanThe {

    @EmbeddedId
    @Builder.Default
    private GanTheId id = new GanTheId();

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("postID")
    @JoinColumn(name = "PostID")
    private Post post;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("tenTag")
    @JoinColumn(name = "TenTag")
    private Tag tag;
}
