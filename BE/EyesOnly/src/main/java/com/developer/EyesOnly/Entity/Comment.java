package com.developer.EyesOnly.Entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "Comment")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Comment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long commentID;

    @Column(columnDefinition = "NVARCHAR(MAX)", nullable = false)
    private String noiDung;

    private LocalDateTime thoiGianDang;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "PostID")
    private Post post;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "NguoiViet")
    private Account nguoiViet;

    // --- Xử lý ý tưởng của bạn ---

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "CommentCha") // Cột này chứa ID của bình luận gốc
    private Comment parent;

    @OneToMany(
            mappedBy = "parent",
            cascade = CascadeType.ALL,
            orphanRemoval = true,
            fetch = FetchType.LAZY
    )
    private List<Comment> replies;
}
