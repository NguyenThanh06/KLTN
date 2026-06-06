package com.developer.EyesOnly.Repository;

import com.developer.EyesOnly.Entity.LuuPost;
import com.developer.EyesOnly.Entity.LuuPostId;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;


@Repository
public interface LuuPostRepository
        extends JpaRepository<LuuPost, LuuPostId> {

    Page<LuuPost> findByAccount_AccountIDOrderByNgayLuuDesc(
            Long accountId,
            Pageable pageable
    );
    @Modifying
    @Query("""
    DELETE FROM LuuPost lp
    WHERE lp.post.postID IN :postIds
       OR lp.account.accountID IN :accountIds
""")
    void deleteByPostIdsOrAccountIds(
            @Param("postIds") List<Long> postIds,
            @Param("accountIds") List<Long> accountIds
    );
// hàm xóa lưu post 2 chiều
    @Modifying
    @Query("""
    DELETE FROM LuuPost lp
    WHERE 
        (
            lp.account.accountID = :accountA
            AND lp.post.tacGia.accountID = :accountB
        )
        OR
        (
            lp.account.accountID = :accountB
            AND lp.post.tacGia.accountID = :accountA
        )
""")
    void deleteSavedPostsBetweenTwoAccounts(
            @Param("accountA") Long accountA,
            @Param("accountB") Long accountB
    );
}