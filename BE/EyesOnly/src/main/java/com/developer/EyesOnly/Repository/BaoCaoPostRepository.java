package com.developer.EyesOnly.Repository;

import com.developer.EyesOnly.Entity.BaoCaoPost;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface BaoCaoPostRepository
        extends JpaRepository<BaoCaoPost, Long> {
    boolean existsByPost_PostIDAndNguoiBaoCao_AccountID(
            Long postId,
            Long accountId
    );

    @Query("""
    SELECT b.post.postID
    FROM BaoCaoPost b
    WHERE b.post.hanCheHienThi <> 99
      AND b.nguoiBaoCao IS NOT NULL
    GROUP BY b.post.postID
    HAVING COUNT(DISTINCT b.nguoiBaoCao.accountID) >= :minReport
""")
    List<Long> findPostIdsHavingUniqueReportsGreaterThanOrEqual(
            @Param("minReport") Long minReport
    );
    @Modifying
    @Query("""
    DELETE FROM BaoCaoPost b
    WHERE b.post.postID IN :postIds
""")
    void deleteByPostIds(@Param("postIds") List<Long> postIds);

    // xóa báo cáo của 1 post

    @Modifying
    @Query("""
    DELETE FROM BaoCaoPost b
    WHERE b.post.postID = :postId
""")
    void deleteByPostId(@Param("postId") Long postId);
    // lấy về danh sách báo cáo của 2 post theo dạng phân trang
    @EntityGraph(attributePaths = {
            "nguoiBaoCao"
    })
    @Query("""
        SELECT b
        FROM BaoCaoPost b
        WHERE b.post.postID = :postId
    """)
    Page<BaoCaoPost> findReportsByPostIdForAdmin(
            @Param("postId") Long postId,
            Pageable pageable
    );

    @Query("""
    SELECT COUNT(DISTINCT b.nguoiBaoCao.accountID)
    FROM BaoCaoPost b
    WHERE b.post.postID = :postId
""")
    long countUniqueReportsByPostId(@Param("postId") Long postId);
}