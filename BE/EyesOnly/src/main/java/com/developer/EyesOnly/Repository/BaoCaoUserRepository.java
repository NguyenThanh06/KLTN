package com.developer.EyesOnly.Repository;

import com.developer.EyesOnly.Entity.Account;
import com.developer.EyesOnly.Entity.BaoCaoUser;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface BaoCaoUserRepository extends JpaRepository<BaoCaoUser, Long> {
    boolean existsByAccount_AccountIDAndNguoiBaoCao_AccountID(
            Long targetAccountId,
            Long reporterAccountId
    );

    @Query("""
        SELECT b.account
        FROM BaoCaoUser b
        WHERE b.account.biKhoa = false OR b.account.biKhoa IS NULL
        GROUP BY b.account
        HAVING COUNT(DISTINCT b.nguoiBaoCao.accountID) >= :minReports
    """)
    List<Account> findAccountsHavingUniqueReporterGreaterThanOrEqual(
            @Param("minReports") Long minReports
    );
    // hàm lấy veef danh sách báo caos user của một account
    @EntityGraph(attributePaths = {
            "nguoiBaoCao"
    })
    @Query("""
        SELECT b
        FROM BaoCaoUser b
        WHERE b.account.accountID = :accountId
    """)
    Page<BaoCaoUser> findReportsByAccountIdForAdmin(
            @Param("accountId") Long accountId,
            Pageable pageable
    );
}