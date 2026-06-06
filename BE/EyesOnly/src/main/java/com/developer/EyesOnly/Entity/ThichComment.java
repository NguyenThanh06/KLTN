package com.developer.EyesOnly.Entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "ThichComment")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ThichComment {
    @EmbeddedId
    private ThichCommentId id;

    @ManyToOne
    @MapsId("commentId")
    @JoinColumn(name = "CommentID")
    private Comment comment;

    @ManyToOne
    @MapsId("accountId")
    @JoinColumn(name = "AccountThich")
    private Account account;
}
