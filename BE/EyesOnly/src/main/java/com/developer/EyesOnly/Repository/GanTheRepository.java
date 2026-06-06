package com.developer.EyesOnly.Repository;

import com.developer.EyesOnly.Entity.GanThe;
import com.developer.EyesOnly.Entity.GanTheId;
import com.developer.EyesOnly.Entity.Tag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface GanTheRepository extends JpaRepository<GanThe, GanTheId> {
    List<GanThe> findByPost_PostID(Long postId);

    @Query("""
SELECT DISTINCT gt.tag
FROM GanThe gt
WHERE gt.post.postID = :postId
""")
    List<Tag> findTagsByPostId(Long postId);
    @Modifying
    @Query("""
        DELETE FROM GanThe gt
        WHERE gt.post.postID IN :postIds
    """)
    void deleteByPostIds(@Param("postIds") List<Long> postIds);
    @Query("""
        SELECT gt.tag
        FROM GanThe gt
        WHERE gt.post.postID IN :postIds
    """)
    List<Tag> findTagsByPostIds(@Param("postIds") List<Long> postIds);

    /*
     * Lấy danh sách tên tag của một Post.
     *
     * Backend tự lấy tag từ postID đang xem,
     * không nhận danh sách tag do FE gửi lên,
     * tránh trường hợp người dùng sửa request bằng DevTools.
     */
    @Query("""
    SELECT LOWER(gt.tag.tenTag)
    FROM GanThe gt
    WHERE gt.post.postID = :postId
""")
    List<String> findTagNamesByPostId(
            @Param("postId") Long postId
    );
}
