package com.developer.EyesOnly.Repository;

import com.developer.EyesOnly.Entity.ThongBao;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ThongBaoRepository extends JpaRepository<ThongBao, Long> {
    /*
     * Lấy danh sách thông báo của 1 account.
     * Sắp xếp thông báo mới nhất lên đầu.
     */
    Page<ThongBao> findByAccount_AccountIDOrderByThoiDiemThongBaoDesc(
            Long accountId,
            Pageable pageable
    );
    /*
     * Đếm số thông báo chưa đọc.
     * Dùng để hiển thị số đỏ trên icon chuông thông báo.
     */
    Long countByAccount_AccountIDAndDaDocFalse(Long accountId);
    /*
     * Đánh dấu 1 thông báo là đã đọc.
     * Điều kiện accountID giúp đảm bảo người dùng chỉ được đánh dấu
     * thông báo thuộc về chính họ.
     */
    @Modifying
    @Query("""
    UPDATE ThongBao tb
    SET tb.daDoc = true
    WHERE tb.thongBaoID = :thongBaoId
      AND tb.account.accountID = :accountId
""")
    void markAsRead(
            @Param("thongBaoId") Long thongBaoId,
            @Param("accountId") Long accountId
    );
}