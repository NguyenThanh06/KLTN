package com.developer.EyesOnly.Repository;

import com.developer.EyesOnly.Entity.KTEOFile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
@Repository
public interface KTEOFileRepository extends JpaRepository<KTEOFile, Long> {
    List<KTEOFile> findByPost_PostID(Long postId);
    @Modifying
    @Query("""
    DELETE FROM KTEOFile f
    WHERE f.post.postID IN :postIds
""")
    void deleteByPostIds(@Param("postIds") List<Long> postIds);
}
