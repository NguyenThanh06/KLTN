package com.developer.EyesOnly.Repository;

import com.developer.EyesOnly.Entity.Comment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CommentRepository extends JpaRepository<Comment, Long> {
    // Lấy danh sách bình luận của một bài viết, sắp xếp mới nhất lên đầu
    /*
     * Lấy comment gốc của post, có phân trang.
     */
    @EntityGraph(attributePaths = {"nguoiViet"})
    Page<Comment> findAllByPostPostIDAndParentIsNull(
            Long postId,
            Pageable pageable
    );

    /*
     * Lấy reply của một comment cha, có phân trang.
     */
    @EntityGraph(attributePaths = {"nguoiViet", "parent", "parent.nguoiViet"})
    Page<Comment> findAllByParent_CommentID(
            Long parentId,
            Pageable pageable
    );

    /*
     * Đếm số reply của một comment.
     */
    long countByParent_CommentID(Long parentId);
    // tìm các reply của comment cha
    List<Comment> findByParent_CommentID(Long commentId);
    @Query("""
    SELECT c.commentID
    FROM Comment c
    WHERE c.post.postID IN :postIds
       OR c.nguoiViet.accountID IN :accountIds
       OR c.parent.commentID IN (
            SELECT c2.commentID
            FROM Comment c2
            WHERE c2.nguoiViet.accountID IN :accountIds
       )
""")
    List<Long> findCommentIdsRelatedToDeletingAccounts(
            @Param("postIds") List<Long> postIds,
            @Param("accountIds") List<Long> accountIds
    );

    @Modifying
    @Query("""
    DELETE FROM Comment c
    WHERE c.commentID IN :commentIds
""")
    void deleteByCommentIds(@Param("commentIds") List<Long> commentIds);
    // lấy về danh sách comment có phân trang cho admin
    @EntityGraph(attributePaths = {
            "nguoiViet",
            "parent"
    })
    @Query("""
    SELECT c
    FROM Comment c
    WHERE c.post.postID = :postId
""")
    Page<Comment> findAllCommentsByPostIdForAdmin(
            @Param("postId") Long postId,
            Pageable pageable
    );
}
