package com.developer.EyesOnly.Repository;

import com.developer.EyesOnly.Entity.Account;
import com.developer.EyesOnly.Entity.TheoDoiAccount;
import com.developer.EyesOnly.Entity.TheoDoiAccountId;
import org.springframework.data.domain.Page;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import org.springframework.data.domain.Pageable;
import java.util.List;

public interface TheoDoiAccountRepository
        extends JpaRepository<TheoDoiAccount, TheoDoiAccountId> {

    // số follower
    Long countByAccountDuocTheoDoi_AccountID(Long accountId);

    // số following
    Long countByAccountTheoDoi_AccountID(Long accountId);

    // đã follow chưa
    boolean existsByAccountDuocTheoDoi_AccountIDAndAccountTheoDoi_AccountID(
            Long accountDuocTheoDoi,
            Long accountTheoDoi
    );
    boolean existsByAccountTheoDoi_AccountIDAndAccountDuocTheoDoi_AccountID(
            Long followerAccountId,
            Long followedAccountId
    );
    // Danh sách người đang theo dõi accountId
    @Query("""
        SELECT td.accountTheoDoi
        FROM TheoDoiAccount td
        WHERE td.accountDuocTheoDoi.accountID = :accountId
        ORDER BY td.accountTheoDoi.accountID DESC
    """)
    Page<Account> findFollowersByAccountId(
            @Param("accountId") Long accountId,
            Pageable pageable
    );

    // Danh sách account mà accountId đang theo dõi
    @Query("""
        SELECT td.accountDuocTheoDoi
        FROM TheoDoiAccount td
        WHERE td.accountTheoDoi.accountID = :accountId
        ORDER BY td.accountDuocTheoDoi.accountID DESC
    """)
    Page<Account> findFollowingByAccountId(
            @Param("accountId") Long accountId,
            Pageable pageable
    );
    // xóa khi bỏ theo dõi
    void deleteByAccountDuocTheoDoi_AccountIDAndAccountTheoDoi_AccountID(
            Long accountDuocTheoDoi,
            Long accountTheoDoi
    );
    @Modifying
    @Query("""
    DELETE FROM TheoDoiAccount td
    WHERE td.accountDuocTheoDoi.accountID IN :accountIds
       OR td.accountTheoDoi.accountID IN :accountIds
""")
    void deleteByAccountIds(@Param("accountIds") List<Long> accountIds);
//hàm xóa theo dõi 2 chiều
    @Modifying
    @Query("""
    DELETE FROM TheoDoiAccount td
    WHERE 
        (
            td.accountDuocTheoDoi.accountID = :accountA
            AND td.accountTheoDoi.accountID = :accountB
        )
        OR
        (
            td.accountDuocTheoDoi.accountID = :accountB
            AND td.accountTheoDoi.accountID = :accountA
        )
""")
    void deleteFollowRelationBetweenTwoAccounts(
            @Param("accountA") Long accountA,
            @Param("accountB") Long accountB
    );

    /*
     * Lấy danh sách Account mà targetAccount đang theo dõi.
     *
     * Ví dụ:
     * targetAccountId = 59
     * -> lấy những Account được Account 59 theo dõi.
     *
     * keyword rỗng:
     * -> hiển thị toàn bộ danh sách.
     */
    @Query(
            value = """
                SELECT td.accountDuocTheoDoi
                FROM TheoDoiAccount td
                WHERE td.accountTheoDoi.accountID = :targetAccountId
                  AND (
                        :keyword = ''
                        OR LOWER(COALESCE(td.accountDuocTheoDoi.tenHienThi, ''))
                            LIKE LOWER(CONCAT('%', :keyword, '%'))
                        OR LOWER(td.accountDuocTheoDoi.username)
                            LIKE LOWER(CONCAT('%', :keyword, '%'))
                  )
                ORDER BY LOWER(td.accountDuocTheoDoi.username) ASC
            """,
            countQuery = """
                SELECT COUNT(td)
                FROM TheoDoiAccount td
                WHERE td.accountTheoDoi.accountID = :targetAccountId
                  AND (
                        :keyword = ''
                        OR LOWER(COALESCE(td.accountDuocTheoDoi.tenHienThi, ''))
                            LIKE LOWER(CONCAT('%', :keyword, '%'))
                        OR LOWER(td.accountDuocTheoDoi.username)
                            LIKE LOWER(CONCAT('%', :keyword, '%'))
                  )
            """
    )
    Page<Account> searchFollowingAccounts(
            @Param("targetAccountId") Long targetAccountId,
            @Param("keyword") String keyword,
            Pageable pageable
    );

    /*
     * Lấy danh sách Account đang theo dõi targetAccount.
     *
     * Ví dụ:
     * targetAccountId = 59
     * -> lấy những Account đang theo dõi Account 59.
     */
    @Query(
            value = """
                SELECT td.accountTheoDoi
                FROM TheoDoiAccount td
                WHERE td.accountDuocTheoDoi.accountID = :targetAccountId
                  AND (
                        :keyword = ''
                        OR LOWER(COALESCE(td.accountTheoDoi.tenHienThi, ''))
                            LIKE LOWER(CONCAT('%', :keyword, '%'))
                        OR LOWER(td.accountTheoDoi.username)
                            LIKE LOWER(CONCAT('%', :keyword, '%'))
                  )
                ORDER BY LOWER(td.accountTheoDoi.username) ASC
            """,
            countQuery = """
                SELECT COUNT(td)
                FROM TheoDoiAccount td
                WHERE td.accountDuocTheoDoi.accountID = :targetAccountId
                  AND (
                        :keyword = ''
                        OR LOWER(COALESCE(td.accountTheoDoi.tenHienThi, ''))
                            LIKE LOWER(CONCAT('%', :keyword, '%'))
                        OR LOWER(td.accountTheoDoi.username)
                            LIKE LOWER(CONCAT('%', :keyword, '%'))
                  )
            """
    )
    Page<Account> searchFollowerAccounts(
            @Param("targetAccountId") Long targetAccountId,
            @Param("keyword") String keyword,
            Pageable pageable
    );
}