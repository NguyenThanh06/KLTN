package com.developer.EyesOnly.Service;

import com.developer.EyesOnly.Entity.Account;
import com.developer.EyesOnly.Repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AccountDisableService {

    private final UserRepository userRepository;
    private final JavaMailSender mailSender;

    public void sendWarningEmailForAccountsDisabled23Days() {

        LocalDate warningDate = LocalDate.now().minusDays(23);

        List<Account> accounts =
                userRepository.findByDaVoHieuHoaTrueAndNgayVoHieuHoa(warningDate);

        for (Account account : accounts) {
            LocalDate ngayXoaVinhVien = account.getNgayVoHieuHoa().plusDays(30);
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(account.getEmail());
            message.setSubject("Cảnh báo tài khoản sắp bị xóa vĩnh viễn");
            message.setText(
                    "Tài khoản của bạn sẽ bị xóa vĩnh viễn vào: "+ngayXoaVinhVien +"(Năm/Tháng/Ngày)"
                            + ". Hãy tắt vô hiệu hóa tài khoản nếu bạn muốn giữ lại tài khoản "
                            + "và các tác phẩm của mình."
            );

            mailSender.send(message);
        }

        System.out.println("Đã gửi cảnh báo cho " + accounts.size() + " tài khoản.");
    }
}