package com.developer.EyesOnly.Repository;

import com.developer.EyesOnly.DTO.Response.PostSummaryProjection;
import com.developer.EyesOnly.Entity.Post;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.Set;

@Repository
public interface PostRepository extends JpaRepository<Post, Long> {
    //hàm xử lý tìm kiếm post
    @Query("""
    SELECT p.postID
    FROM Post p
    WHERE p.congKhai = true
      AND p.hanCheHienThi != 99

      AND (
            :includeAI = true
            OR p.sanPhamAI = false
            OR p.sanPhamAI IS NULL
      )

      AND (
            :currentUserId IS NULL
            OR NOT EXISTS (
                SELECT ca
                FROM ChanAccount ca
                WHERE 
                    (
                        ca.accountChan.accountID = :currentUserId
                        AND ca.accountBiChan.accountID = p.tacGia.accountID
                    )
                    OR
                    (
                        ca.accountBiChan.accountID = :currentUserId
                        AND ca.accountChan.accountID = p.tacGia.accountID
                    )
            )
      )

      AND (
            :keywordBlank = true

            OR (
                :keywordCompareType = 'TAG_RELATIVE'
                AND EXISTS (
                    SELECT gt
                    FROM GanThe gt
                    WHERE gt.post.postID = p.postID
                      AND LOWER(gt.tag.tenTag) LIKE LOWER(CONCAT('%', :keyword, '%'))
                )
            )

            OR (
                :keywordCompareType = 'TAG_EXACT'
                AND EXISTS (
                    SELECT gt
                    FROM GanThe gt
                    WHERE gt.post.postID = p.postID
                      AND LOWER(gt.tag.tenTag) = LOWER(:keyword)
                )
            )

            OR (
                :keywordCompareType = 'TITLE_DESCRIPTION'
                AND (
                    LOWER(p.tieuDe) LIKE LOWER(CONCAT('%', :keyword, '%'))
                    OR LOWER(p.moTa) LIKE LOWER(CONCAT('%', :keyword, '%'))
                )
            )

            OR (
                :keywordCompareType = 'ALL'
                AND (
                    LOWER(p.tieuDe) LIKE LOWER(CONCAT('%', :keyword, '%'))
                    OR LOWER(p.moTa) LIKE LOWER(CONCAT('%', :keyword, '%'))
                    OR EXISTS (
                        SELECT gt
                        FROM GanThe gt
                        WHERE gt.post.postID = p.postID
                          AND LOWER(gt.tag.tenTag) LIKE LOWER(CONCAT('%', :keyword, '%'))
                    )
                )
            )
      )
""")
    Page<Long> searchPublicPostIds(
            @Param("keyword") String keyword,
            @Param("keywordBlank") boolean keywordBlank,
            @Param("keywordCompareType") String keywordCompareType,
            @Param("includeAI") boolean includeAI,
            @Param("currentUserId") Long currentUserId,
            Pageable pageable
    );
    /*
     * Lấy ID các Post công khai theo thứ tự ngẫu nhiên.
     *
     * - Không lấy Post tạm ẩn.
     * - Nếu user đã đăng nhập, không lấy Post của account bị chặn hai chiều.
     * - ORDER BY FUNCTION('NEWID') tương ứng với ORDER BY NEWID() của SQL Server.
     */
    @Query(
            value = """
            SELECT p.postID
            FROM Post p
            WHERE p.congKhai = true
              AND p.hanCheHienThi <> 99
              AND (
                    :currentUserId IS NULL
                    OR NOT EXISTS (
                        SELECT ca
                        FROM ChanAccount ca
                        WHERE (
                                ca.accountChan.accountID = :currentUserId
                                AND ca.accountBiChan.accountID = p.tacGia.accountID
                              )
                           OR (
                                ca.accountChan.accountID = p.tacGia.accountID
                                AND ca.accountBiChan.accountID = :currentUserId
                              )
                    )
              )
            ORDER BY FUNCTION('NEWID')
        """,
            countQuery = """
            SELECT COUNT(p)
            FROM Post p
            WHERE p.congKhai = true
              AND p.hanCheHienThi <> 99
              AND (
                    :currentUserId IS NULL
                    OR NOT EXISTS (
                        SELECT ca
                        FROM ChanAccount ca
                        WHERE (
                                ca.accountChan.accountID = :currentUserId
                                AND ca.accountBiChan.accountID = p.tacGia.accountID
                              )
                           OR (
                                ca.accountChan.accountID = p.tacGia.accountID
                                AND ca.accountBiChan.accountID = :currentUserId
                              )
                    )
              )
        """
    )
    Page<Long> findRandomPublicPostIds(
            @Param("currentUserId") Long currentUserId,
            Pageable pageable
    );
    // hàm lấy về post và không lấy những post của account mà người dùng đã chặn  và ngược lại
    @Query(
            value = """
            SELECT p.postID
            FROM Post p
            WHERE p.congKhai = true
              AND p.hanCheHienThi <> 99
              AND (
                    :currentUserId IS NULL
                    OR NOT EXISTS (
                        SELECT ca
                        FROM ChanAccount ca
                        WHERE (
                                ca.accountChan.accountID = :currentUserId
                                AND ca.accountBiChan.accountID = p.tacGia.accountID
                              )
                           OR (
                                ca.accountChan.accountID = p.tacGia.accountID
                                AND ca.accountBiChan.accountID = :currentUserId
                              )
                    )
              )
            ORDER BY p.ngayDang DESC
        """,
            countQuery = """
            SELECT COUNT(p)
            FROM Post p
            WHERE p.congKhai = true
              AND p.hanCheHienThi <> 99
              AND (
                    :currentUserId IS NULL
                    OR NOT EXISTS (
                        SELECT ca
                        FROM ChanAccount ca
                        WHERE (
                                ca.accountChan.accountID = :currentUserId
                                AND ca.accountBiChan.accountID = p.tacGia.accountID
                              )
                           OR (
                                ca.accountChan.accountID = p.tacGia.accountID
                                AND ca.accountBiChan.accountID = :currentUserId
                              )
                    )
              )
        """
    )
    Page<Long> findPublicPostIds(
            @Param("currentUserId") Long currentUserId,
            Pageable pageable
    );
    //hàm lấy về ds post
    @EntityGraph(attributePaths = {
            "files",
            "tacGia"
    })
    @Query("""
        SELECT DISTINCT p
        FROM Post p
        WHERE p.postID IN :postIds
    """)
    List<Post> findPostsWithFilesAndAuthorByIds(
            @Param("postIds") List<Long> postIds
    );
    @Modifying
    @Query("""
UPDATE Post p
SET p.hanCheHienThi = :hiddenValue
WHERE p.postID IN :postIds
""")
    void hidePosts(
            @Param("postIds") List<Long> postIds,
            @Param("hiddenValue") Byte hiddenValue
    );

    @Query("""
        SELECT p.postID
        FROM Post p
        WHERE p.tacGia.accountID = :accountID
    """)
    Page<Long> findPostIdsByAccountID(
            @Param("accountID") Long accountID,
            Pageable pageable
    );

    @EntityGraph(attributePaths = {
            "files",
    })
    @Query("""
        SELECT DISTINCT p
        FROM Post p
        WHERE p.postID IN :postIds
    """)
    List<Post> findPostsWithFilesByPostIds(
            @Param("postIds") List<Long> postIds
    );

    @Query("""
    SELECT p.postID
    FROM Post p
    WHERE p.tacGia.accountID IN :accountIds
""")
    List<Long> findPostIdsByTacGiaIds(@Param("accountIds") List<Long> accountIds);

    @Modifying
    @Query("""
    DELETE FROM Post p
    WHERE p.postID IN :postIds
""")
    void deleteByPostIds(@Param("postIds") List<Long> postIds);
    //hàm tìm về nhưng post đang public và không bị hạn chế của 1 account
    @Query("""
    SELECT p.postID
    FROM Post p
    WHERE p.tacGia.accountID = :accountId
      AND p.congKhai = true
      AND p.hanCheHienThi != 99
""")
    Page<Long> findPublicPostIdsByAccountId(
            @Param("accountId") Long accountId,
            Pageable pageable
    );
    // hàm tìm post cho admin
    @Query("""
    SELECT p.postID
    FROM Post p
    WHERE 
        (
            :postId IS NULL
            OR p.postID = :postId
        )
        AND
        (
            :displayMode = 'ALL'
            OR (
                :displayMode = 'HIDDEN'
                AND p.hanCheHienThi = 99
            )
            OR (
                :displayMode = 'NOT_HIDDEN'
                AND (
                    p.hanCheHienThi IS NULL
                    OR p.hanCheHienThi <> 99
                )
            )
        )
""")
    Page<Long> searchAdminPostIds(
            @Param("postId") Long postId,
            @Param("displayMode") String displayMode,
            Pageable pageable
    );
    // xem chi tiết post của admin
    @EntityGraph(attributePaths = {
            "tacGia",
            "files"
    })
    @Query("""
    SELECT p
    FROM Post p
    WHERE p.postID = :postId
""")
    Optional<Post> findAdminPostDetailById(
            @Param("postId") Long postId
    );
    // lấy về danh sách post của một user cho admin xem được cả post công khai, không công khai, tạm ẩn.
    @Query("""
    SELECT p.postID
    FROM Post p
    WHERE p.tacGia.accountID = :accountId
""")
    Page<Long> findAdminPostIdsByAccountId(
            @Param("accountId") Long accountId,
            Pageable pageable
    );
    /*
     * Tìm các Post liên quan dưới dạng phân trang.
     *
     * Quy tắc:
     * - Không lấy lại chính Post đang xem.
     * - Chỉ lấy Post công khai.
     * - Không lấy Post đang tạm ẩn hoặc không được hiển thị.
     * - Phải có ít nhất một tag trùng với Post đang xem.
     * - Nếu user đã đăng nhập, loại các Post thuộc quan hệ chặn hai chiều.
     *
     * Sắp xếp:
     * - Nhiều tag trùng hơn đứng trước.
     * - Nếu số tag trùng bằng nhau, Post mới hơn đứng trước.
     * - Nếu vẫn bằng nhau, postID lớn hơn đứng trước để thứ tự ổn định.
     */
    @Query(
            value = """
            SELECT p.postID
            FROM Post p
            JOIN GanThe gt
                ON gt.post.postID = p.postID
            WHERE p.postID <> :currentPostId

              AND p.congKhai = true
              AND p.hanCheHienThi <> 99

              AND LOWER(gt.tag.tenTag) IN (:tagNames)

              AND (
                    :currentUserId IS NULL
                    OR NOT EXISTS (
                        SELECT ca
                        FROM ChanAccount ca
                        WHERE (
                                ca.accountChan.accountID = :currentUserId
                                AND ca.accountBiChan.accountID = p.tacGia.accountID
                              )
                           OR (
                                ca.accountChan.accountID = p.tacGia.accountID
                                AND ca.accountBiChan.accountID = :currentUserId
                              )
                    )
              )

            GROUP BY p.postID, p.ngayDang

            ORDER BY COUNT(DISTINCT gt.tag.tenTag) DESC,
                     p.ngayDang DESC,
                     p.postID DESC
        """,
            countQuery = """
            SELECT COUNT(DISTINCT p.postID)
            FROM Post p
            WHERE p.postID <> :currentPostId

              AND p.congKhai = true
              AND p.hanCheHienThi <> 99

              AND EXISTS (
                    SELECT gt
                    FROM GanThe gt
                    WHERE gt.post.postID = p.postID
                      AND LOWER(gt.tag.tenTag) IN (:tagNames)
              )

              AND (
                    :currentUserId IS NULL
                    OR NOT EXISTS (
                        SELECT ca
                        FROM ChanAccount ca
                        WHERE (
                                ca.accountChan.accountID = :currentUserId
                                AND ca.accountBiChan.accountID = p.tacGia.accountID
                              )
                           OR (
                                ca.accountChan.accountID = p.tacGia.accountID
                                AND ca.accountBiChan.accountID = :currentUserId
                              )
                    )
              )
        """
    )
    Page<Long> findRelatedPublicPostIds(
            @Param("currentPostId") Long currentPostId,
            @Param("tagNames") Set<String> tagNames,
            @Param("currentUserId") Long currentUserId,
            Pageable pageable
    );
}

