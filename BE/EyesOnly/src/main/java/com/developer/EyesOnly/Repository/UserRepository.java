package com.developer.EyesOnly.Repository;

import com.developer.EyesOnly.Entity.Account;
import org.springframework.data.domain.Page;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<Account, Long> {
    boolean existsByEmail(String email);
    boolean existsByUsername(String username);
    Account findByEmail(String email);
    Optional<Account> findByUsername(String username);

    List<Account> findByDaVoHieuHoaTrueAndNgayVoHieuHoa(LocalDate ngayVoHieuHoa);
    List<Account> findByDaVoHieuHoaTrueAndNgayVoHieuHoaLessThanEqual(
            LocalDate date,
            Pageable pageable
    );

    List<Account> findByDaXacThucFalseAndNgayTaoTaiKhoanLessThanEqual(
            LocalDate date,
            Pageable pageable
    );
    @Query(
            value = """
            SELECT a
            FROM Account a
            LEFT JOIN TheoDoiAccount td
                ON td.accountDuocTheoDoi = a
            WHERE 
                (
                    LOWER(a.tenHienThi) LIKE LOWER(CONCAT('%', :keyword, '%'))
                    OR LOWER(a.username) LIKE LOWER(CONCAT('%', :keyword, '%'))
                )
                AND (
                    :currentAccountId IS NULL
                    OR a.accountID <> :currentAccountId
                )
                AND (
                    :currentAccountId IS NULL
                    OR NOT EXISTS (
                        SELECT ca
                        FROM ChanAccount ca
                        WHERE 
                            (
                                ca.accountChan.accountID = :currentAccountId
                                AND ca.accountBiChan.accountID = a.accountID
                            )
                            OR
                            (
                                ca.accountBiChan.accountID = :currentAccountId
                                AND ca.accountChan.accountID = a.accountID
                            )
                    )
                )
            GROUP BY a
            ORDER BY COUNT(td) DESC, a.accountID DESC
        """,
            countQuery = """
            SELECT COUNT(a)
            FROM Account a
            WHERE 
                (
                    LOWER(a.tenHienThi) LIKE LOWER(CONCAT('%', :keyword, '%'))
                    OR LOWER(a.username) LIKE LOWER(CONCAT('%', :keyword, '%'))
                )
                AND (
                    :currentAccountId IS NULL
                    OR a.accountID <> :currentAccountId
                )
                AND (
                    :currentAccountId IS NULL
                    OR NOT EXISTS (
                        SELECT ca
                        FROM ChanAccount ca
                        WHERE 
                            (
                                ca.accountChan.accountID = :currentAccountId
                                AND ca.accountBiChan.accountID = a.accountID
                            )
                            OR
                            (
                                ca.accountBiChan.accountID = :currentAccountId
                                AND ca.accountChan.accountID = a.accountID
                            )
                    )
                )
        """
    )
    Page<Account> searchAccounts(
            @Param("keyword") String keyword,
            @Param("currentAccountId") Long currentAccountId,
            Pageable pageable
    );
    // khóa acc
    @Modifying
    @Query("""
        UPDATE Account a
        SET a.biKhoa = true
        WHERE a.accountID IN :accountIds
    """)
    void lockAccountsByIds(@Param("accountIds") List<Long> accountIds);
    // hàm này để admin tìm kiếm các user và lọc theo trạng thái bị khóa
    @Query("""
    SELECT a
    FROM Account a
    WHERE 
        (
            :accountId IS NULL
            OR a.accountID = :accountId
        )
        AND
        (
            :lockStatus = 'ALL'
            OR (
                :lockStatus = 'LOCKED'
                AND a.biKhoa = true
            )
            OR (
                :lockStatus = 'UNLOCKED'
                AND (
                    a.biKhoa = false
                    OR a.biKhoa IS NULL
                )
            )
        )
""")
    Page<Account> searchAdminUsers(
            @Param("accountId") Long accountId,
            @Param("lockStatus") String lockStatus,
            Pageable pageable
    );

}
