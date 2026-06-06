package com.developer.EyesOnly.Entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "ThichPost")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ThichPost {
    @EmbeddedId
    private ThichPostId id;

    @ManyToOne
    @MapsId("postId")
    @JoinColumn(name = "PostID")
    private Post post;

    @ManyToOne
    @MapsId("accountId")
    @JoinColumn(name = "AccountThich")
    private Account account;
}
