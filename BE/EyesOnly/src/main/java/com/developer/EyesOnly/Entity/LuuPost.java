package com.developer.EyesOnly.Entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "LuuPost")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LuuPost {

    @EmbeddedId
    private LuuPostId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("postId")
    @JoinColumn(name = "PostID")
    private Post post;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("accountId")
    @JoinColumn(name = "AccountLuu")
    private Account account;

    private LocalDateTime ngayLuu;
}