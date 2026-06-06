package com.developer.EyesOnly.Repository;

import com.developer.EyesOnly.Entity.Comment;
import com.developer.EyesOnly.Entity.Post;
import com.developer.EyesOnly.Entity.ThichComment;
import com.developer.EyesOnly.Entity.ThichCommentId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ThichCommentRepository extends JpaRepository<ThichComment, ThichCommentId> {
    // Đếm số lượt thích của post
    Long countByComment(Comment comment);
    /*
     * Đếm số like của một comment.
     */
    long countByComment_CommentID(Long commentId);
    // Kiểm tra user đã thích comment chưa
    Boolean existsByComment_CommentIDAndAccount_AccountID(
            Long commentId,
            Long accountId
    );

    // xóa toàn bộ like của comment
    void deleteByComment_CommentID(Long commentId);

    @Modifying
    @Query("""
    DELETE FROM ThichComment tc
    WHERE tc.comment.commentID IN :commentIds
       OR tc.account.accountID IN :accountIds
""")
    void deleteByCommentIdsOrAccountIds(
            @Param("commentIds") List<Long> commentIds,
            @Param("accountIds") List<Long> accountIds
    );

}
