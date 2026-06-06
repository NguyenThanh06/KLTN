package com.developer.EyesOnly.Repository;

import com.developer.EyesOnly.Entity.ChanAccount;
import com.developer.EyesOnly.Entity.ChanAccountId;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AccountChanRepository extends JpaRepository<ChanAccount, ChanAccountId> {
    boolean existsByAccountChan_AccountIDAndAccountBiChan_AccountID(
            Long AccountChan,
            Long AccountBiChan
    );
}
