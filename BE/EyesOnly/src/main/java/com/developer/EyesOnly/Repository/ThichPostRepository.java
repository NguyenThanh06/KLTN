package com.developer.EyesOnly.Repository;

import com.developer.EyesOnly.Entity.Post;
import com.developer.EyesOnly.Entity.ThichPost;
import com.developer.EyesOnly.Entity.ThichPostId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ThichPostRepository extends JpaRepository<ThichPost, ThichPostId> {
    // Đếm số lượt thích của post
    Long countByPost(Post post);

    // Kiểm tra user đã thích post chưa
    Boolean existsByPost_PostIDAndAccount_AccountID(
            Long postId,
            Long accountId
    );
    @Query("""
        SELECT tp.post.postID, COUNT(tp)
        FROM ThichPost tp
        WHERE tp.post.postID IN :postIds
        GROUP BY tp.post.postID
    """)
    List<Object[]> countLikesByPostIds(@Param("postIds") List<Long> postIds);

    @Query("""
        SELECT tp.post.postID
        FROM ThichPost tp
        WHERE tp.account.accountID = :accountId
        AND tp.post.postID IN :postIds
    """)
    List<Long> findLikedPostIdsByAccount(
            @Param("accountId") Long accountId,
            @Param("postIds") List<Long> postIds
    );
    @Modifying
    @Query("""
    DELETE FROM ThichPost tp
    WHERE tp.post.postID IN :postIds
       OR tp.account.accountID IN :accountIds
""")
    void deleteByPostIdsOrAccountIds(
            @Param("postIds") List<Long> postIds,
            @Param("accountIds") List<Long> accountIds
    );
    // xem thử account đang xem có thích post đó chưa
    @Query("""
        SELECT tp.post.postID
        FROM ThichPost tp
        WHERE tp.account.accountID = :accountId
          AND tp.post.postID IN :postIds
    """)
    List<Long> findLikedPostIdsByAccountIdAndPostIds(
            @Param("accountId") Long accountId,
            @Param("postIds") List<Long> postIds
    );
}
