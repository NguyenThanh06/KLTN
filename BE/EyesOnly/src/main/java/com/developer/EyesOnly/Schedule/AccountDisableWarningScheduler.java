package com.developer.EyesOnly.Schedule;

import com.developer.EyesOnly.Entity.Account;
import com.developer.EyesOnly.Repository.UserRepository;
import com.developer.EyesOnly.Service.AccountDisableService;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

@Component
@RequiredArgsConstructor
public class AccountDisableWarningScheduler {

    private final UserRepository userRepository;
    private final JavaMailSender mailSender;
    private final AccountDisableService accountDisableService;
    /**
     * Chạy mỗi ngày lúc 08:00 sáng.
     */
    @Scheduled(cron = "0 0 8 * * *", zone = "Asia/Ho_Chi_Minh")
    public void sendDisableAccountWarningEmail() {

        accountDisableService.sendWarningEmailForAccountsDisabled23Days();
    }
}