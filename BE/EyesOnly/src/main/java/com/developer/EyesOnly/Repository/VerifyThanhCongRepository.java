package com.developer.EyesOnly.Repository;

import com.developer.EyesOnly.Entity.VerifyThanhCong;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface VerifyThanhCongRepository extends JpaRepository<VerifyThanhCong, Long> {

    @Modifying
    @Query("""
        DELETE FROM VerifyThanhCong v
        WHERE v.kteoFile.post.postID IN :postIds
    """)
    void deleteByPostIds(@Param("postIds") List<Long> postIds);

    @Modifying
    @Query("""
        DELETE FROM VerifyThanhCong v
        WHERE v.kteoFile.fileID IN :fileIds
    """)
    void deleteByKteoFileIds(@Param("fileIds") List<Long> fileIds);
    /*
     * Lấy kết quả xác thực thành công cùng:
     * - Tệp KTEO đã được xác thực.
     * - Bài viết gốc chứa tệp KTEO đó.
     *
     * Dùng EntityGraph để dữ liệu cần trả cho FE
     * được lấy đầy đủ ngay trong transaction hiện tại.
     */
    @EntityGraph(attributePaths = {
            "kteoFile",
            "kteoFile.post"
    })
    @Query("""
        SELECT v
        FROM VerifyThanhCong v
        WHERE v.verifyID = :verifyID
    """)
    Optional<VerifyThanhCong> findVerifyResultDetailById(
            @Param("verifyID") Long verifyID
    );
}