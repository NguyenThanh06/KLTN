package com.developer.EyesOnly.Service;

import com.developer.EyesOnly.Entity.Account;
import com.developer.EyesOnly.Repository.BaoCaoUserRepository;
import com.developer.EyesOnly.Repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AccountReportModerationService {

    private final BaoCaoUserRepository baoCaoUserRepository;
    private final UserRepository userRepository;

    private static final long MIN_REPORTS_TO_LOCK = 25L;

    @Transactional
    public void autoLockReportedAccounts() {

        List<Account> accounts =
                baoCaoUserRepository.findAccountsHavingUniqueReporterGreaterThanOrEqual(MIN_REPORTS_TO_LOCK);

        if (accounts.isEmpty()) {
            System.out.println("Không có tài khoản nào đủ số lượng báo cáo để khóa.");
            return;
        }

        List<Long> accountIds = accounts.stream()
                .map(Account::getAccountID)
                .toList();

        userRepository.lockAccountsByIds(accountIds);

        for (Account account : accounts) {
            System.out.println(
                    "[" + LocalDateTime.now() + "] SUCCESS: Đã khóa tài khoản "
                            + account.getUsername()
                            + ". Lý do: Số lượng báo cáo >= "
                            + MIN_REPORTS_TO_LOCK
            );
        }

        System.out.println("Đã khóa " + accountIds.size() + " tài khoản bị báo cáo nhiều.");
    }
}