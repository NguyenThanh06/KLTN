package com.developer.EyesOnly.Schedule;
import org.springframework.data.domain.PageRequest;
import com.developer.EyesOnly.Entity.Account;
import com.developer.EyesOnly.Repository.UserRepository;
import com.developer.EyesOnly.Service.AccountPermanentDeleteService;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class AccountPermanentDeleteScheduler {

    private final UserRepository userRepository;
    private final AccountPermanentDeleteService accountPermanentDeleteService;

    private static final int DELETE_BATCH_SIZE = 5;

    @Scheduled(cron = "0 0 2 * * *", zone = "Asia/Ho_Chi_Minh")
//    @Scheduled(cron = "*/30 * * * * *", zone = "Asia/Ho_Chi_Minh")
    public void deleteExpiredAccountsDaily() {

        LocalDate disabledExpiredDate = LocalDate.now().minusDays(30);
        LocalDate unverifiedExpiredDate = LocalDate.now().minusDays(3);

        List<Account> disabledAccounts =
                userRepository.findByDaVoHieuHoaTrueAndNgayVoHieuHoaLessThanEqual(
                        disabledExpiredDate,
                        PageRequest.of(0, DELETE_BATCH_SIZE)
                );

        List<Account> unverifiedAccounts =
                userRepository.findByDaXacThucFalseAndNgayTaoTaiKhoanLessThanEqual(
                        unverifiedExpiredDate,
                        PageRequest.of(0, DELETE_BATCH_SIZE)
                );

        Map<Long, String> deleteCandidates = new LinkedHashMap<>();

        for (Account account : disabledAccounts) {
            deleteCandidates.put(
                    account.getAccountID(),
                    "Trạng thái Deactivated từ ngày "
                            + account.getNgayVoHieuHoa()
                            + " (Quá 30 ngày)"
            );
        }

        for (Account account : unverifiedAccounts) {
            deleteCandidates.put(
                    account.getAccountID(),
                    "Tài khoản chưa xác thực từ ngày "
                            + account.getNgayTaoTaiKhoan()
                            + " (Quá 3 ngày)"
            );
        }

        if (deleteCandidates.isEmpty()) {
            System.out.println("Không có tài khoản quá hạn cần xóa.");
            return;
        }

        for (Map.Entry<Long, String> entry : deleteCandidates.entrySet()) {
            try {
                accountPermanentDeleteService.permanentlyDeleteOneAccount(
                        entry.getKey(),
                        entry.getValue()
                );
            } catch (Exception e) {
                System.out.println(
                        "FAILED: Không thể xóa accountID = "
                                + entry.getKey()
                                + ". Lý do: "
                                + e.getMessage()
                );
            }
        }
    }
}