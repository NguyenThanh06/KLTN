package com.developer.EyesOnly.Repository;

import com.developer.EyesOnly.Entity.Account;
import com.developer.EyesOnly.Entity.ChanAccount;
import com.developer.EyesOnly.Entity.ChanAccountId;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ChanAccountRepository extends JpaRepository<ChanAccount, ChanAccountId> {

    boolean existsByAccountBiChan_AccountIDAndAccountChan_AccountID(
            Long accountBiChanId,
            Long accountChanId
    );
    void deleteByAccountBiChan_AccountIDAndAccountChan_AccountID(
            Long accountBiChanId,
            Long accountChanId
    );
    @Query("""
        SELECT ca.accountBiChan
        FROM ChanAccount ca
        WHERE ca.accountChan.accountID = :accountChanId
        ORDER BY ca.accountBiChan.accountID DESC
    """)
    Page<Account> findBlockedAccountsByAccountChanId(
            @Param("accountChanId") Long accountChanId,
            Pageable pageable
    );
    @Modifying
    @Query("""
        DELETE FROM ChanAccount ca
        WHERE ca.accountBiChan.accountID IN :accountIds
           OR ca.accountChan.accountID IN :accountIds
    """)
    void deleteByAccountIds(@Param("accountIds") List<Long> accountIds);
    // hàm kiểm tra xem acc đang xem với acc được xem có chnaj nhau hay không
    @Query("""
    SELECT COUNT(ca) > 0
    FROM ChanAccount ca
    WHERE 
        (
            ca.accountChan.accountID = :accountA
            AND ca.accountBiChan.accountID = :accountB
        )
        OR
        (
            ca.accountChan.accountID = :accountB
            AND ca.accountBiChan.accountID = :accountA
        )
""")
    boolean existsBlockRelationBetweenTwoAccounts(
            @Param("accountA") Long accountA,
            @Param("accountB") Long accountB
    );

    /*
     * Kiểm tra account hiện tại có đang chặn account khác hay không.
     *
     * blockerAccountId:
     * - ID của người chặn.
     *
     * blockedAccountId:
     * - ID của người bị chặn.
     */
    boolean existsByAccountChan_AccountIDAndAccountBiChan_AccountID(
            Long blockerAccountId,
            Long blockedAccountId
    );

    /*
     * Lấy danh sách các account mà người dùng hiện tại đã chặn.
     *
     * Nếu keyword rỗng:
     * - trả toàn bộ danh sách đã chặn.
     *
     * Nếu keyword có dữ liệu:
     * - lọc theo tên hiển thị hoặc username.
     */
    @Query(
            value = """
                SELECT ca.accountBiChan
                FROM ChanAccount ca
                WHERE ca.accountChan.accountID = :currentAccountId
                  AND (
                        :keyword = ''
                        OR LOWER(ca.accountBiChan.tenHienThi)
                            LIKE LOWER(CONCAT('%', :keyword, '%'))
                        OR LOWER(ca.accountBiChan.username)
                            LIKE LOWER(CONCAT('%', :keyword, '%'))
                  )
                ORDER BY LOWER(ca.accountBiChan.username) ASC
            """,
            countQuery = """
                SELECT COUNT(ca)
                FROM ChanAccount ca
                WHERE ca.accountChan.accountID = :currentAccountId
                  AND (
                        :keyword = ''
                        OR LOWER(ca.accountBiChan.tenHienThi)
                            LIKE LOWER(CONCAT('%', :keyword, '%'))
                        OR LOWER(ca.accountBiChan.username)
                            LIKE LOWER(CONCAT('%', :keyword, '%'))
                  )
            """
    )
    Page<Account> searchBlockedAccounts(
            @Param("currentAccountId") Long currentAccountId,
            @Param("keyword") String keyword,
            Pageable pageable
    );
}