package com.developer.EyesOnly.Schedule;

import com.developer.EyesOnly.Service.AccountReportModerationService;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AccountReportModerationScheduler {

    private final AccountReportModerationService accountReportModerationService;

    /**
     * Chạy mỗi ngày lúc 02:30 sáng.
     */
    @Scheduled(cron = "0 30 2 * * *", zone = "Asia/Ho_Chi_Minh")
//    @Scheduled(cron = "*/30 * * * * *", zone = "Asia/Ho_Chi_Minh")
    public void autoLockReportedAccountsDaily() {
        accountReportModerationService.autoLockReportedAccounts();
    }
}