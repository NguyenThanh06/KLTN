package com.developer.EyesOnly.Service;


import com.developer.EyesOnly.DTO.Request.AccountCreationRequest;
import com.developer.EyesOnly.DTO.Request.ChangePasswordRequest;
import com.developer.EyesOnly.DTO.Request.ForgotPasswordRequest;
import com.developer.EyesOnly.DTO.Request.ResetPasswordRequest;
import com.developer.EyesOnly.DTO.Response.AccountResponse;
import com.developer.EyesOnly.Entity.Account;
import com.developer.EyesOnly.Exception.AppException;
import com.developer.EyesOnly.Exception.ErrorCode;
import com.developer.EyesOnly.Mapper.AccountMapper;
import com.developer.EyesOnly.Repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ThreadLocalRandom;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class AccountService {
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private AccountMapper accountMapper;
    @Autowired
    @Lazy
    private AuthenticationService authenticationService; // Đảm bảo đã Autowired
    private final JavaMailSender mailSender;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    private static final int RESEND_OTP_SECONDS = 60;
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();private final ConcurrentHashMap<Long, PendingChangePassword> changePasswordCache = new ConcurrentHashMap<>();
    // Lưu trữ: Key = Email, Value = Đối tượng chứa OTP và thời gian
    private final ConcurrentHashMap<String, PendingRegistration> otpCache = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, PendingChangePassword> resetPasswordCache = new ConcurrentHashMap<>();
    private static final int EXPIRE_MINUTES = 5;
    public AccountService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }
    private static final Pattern EMAIL_PATTERN = Pattern.compile(
            "^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9-]+(?:\\.[A-Za-z0-9-]+)+$"
    );
    private static final Pattern USERNAME_PATTERN = Pattern.compile(
            "^[a-z0-9_]+$"
    );
    private String validateEmail(String rawEmail) {
        if (rawEmail == null || rawEmail.trim().isEmpty()) {
            throw new AppException(ErrorCode.NULL_EMAIL);
        }

        String email = rawEmail.trim().toLowerCase(Locale.ROOT);

        if (email.length() > 100) {
            throw new AppException(ErrorCode.EMAIL_TOO_LONG);
        }

        if (!EMAIL_PATTERN.matcher(email).matches()) {
            throw new AppException(ErrorCode.EMAIL_NOT_AN_EMAIL);
        }

        if (userRepository.existsByEmail(email)) {
            throw new AppException(ErrorCode.EMAIL_EXIST);
        }

        return email;
    }
    private String validateTenHienThi(String rawTenHienThi) {
        if (rawTenHienThi == null) {
            return null;
        }

        if (rawTenHienThi.length() > 30) {
            throw new AppException(ErrorCode.TENHIENTHI_TOO_LONG);
        }

        String tenHienThi = rawTenHienThi.trim();

        return tenHienThi.isEmpty() ? null : tenHienThi;
    }
    private String validateUsername(String rawUsername) {
        if (rawUsername == null || rawUsername.isBlank()) {
            throw new AppException(ErrorCode.NULL_USERNAME);
        }

        if (rawUsername.length() > 20) {
            throw new AppException(ErrorCode.USERNAME_TOO_LONG);
        }

        if (!USERNAME_PATTERN.matcher(rawUsername).matches()) {
            throw new AppException(ErrorCode.USERNAME_NOT_AN_USERNAME);
        }

        if (userRepository.existsByUsername(rawUsername)) {
            throw new AppException(ErrorCode.USERNAME_EXIST);
        }

        return rawUsername;
    }
    private String validatePassword(String password) {
        if (password == null || password.isEmpty()) {
            throw new AppException(ErrorCode.NULL_PASSWORD);
        }

        if (password.length() < 6) {
            throw new AppException(ErrorCode.PASSWORD_TOO_SHORT);
        }

        if (password.length() > 32) {
            throw new AppException(ErrorCode.PASSWORD_TOO_LONG);
        }

        return password;
    }
    public void sendOtp(String email) {
        // 1. Tạo mã 6 số
        String otp = String.format("%06d", new Random().nextInt(999999));

        otpCache.put(email, new PendingRegistration(otp, LocalDateTime.now().plusMinutes(EXPIRE_MINUTES)));
        // 3. Gửi mail
        SimpleMailMessage    message = new SimpleMailMessage();
        message.setTo(email);
        message.setSubject("Mã xác thực OTP");
        message.setText("Mã của bạn là: " + otp + ". Hiệu lực trong 5 phút.");
        mailSender.send(message);

        System.out.println("OTP gửi tới " + email + " là: " + otp); // Log để debug
    }

    public boolean verifyOtp(String email, String rawOtp) {
        PendingRegistration details = otpCache.get(email);

        if (details == null) return false;

        // Kiểm tra hết hạn
        if (LocalDateTime.now().isAfter(details.getExpiryTime())) {
            otpCache.remove(email);
            return false;
        }

        System.out.println("rawOTP " + rawOtp + " otp : " + details.getHashedOtp()); // Log để debug
        if (rawOtp.equals(details.getHashedOtp())) {
            otpCache.remove(email); // Xác thực xong thì xóa ngay

            return true;
        }

        return false;
    }
    //5 avt mặc định
    private static final List<String> DEFAULT_AVATARS = List.of(
            "/defaultAvatar/default_avatar_1.svg",
            "/defaultAvatar/default_avatar_2.svg",
            "/defaultAvatar/default_avatar_3.svg",
            "/defaultAvatar/default_avatar_4.svg",
            "/defaultAvatar/default_avatar_5.svg"
    );
    // hàm random avt
    private String randomDefaultAvatar() {
        int index = ThreadLocalRandom.current().nextInt(DEFAULT_AVATARS.size());
        return DEFAULT_AVATARS.get(index);
    }
    // Trong AccountService
    public AccountResponse requestRegistration(AccountCreationRequest request) {
        String email = validateEmail(request.getEmail());
        String tenHienThi = validateTenHienThi(request.getTenHienThi());
        String username = validateUsername(request.getUsername());
        String password = validatePassword(request.getPassword());
        //Kiểm tra tính tồn tại của email
        if(userRepository.existsByEmail(request.getEmail())) {
            throw new AppException(ErrorCode.EMAIL_EXIST);
        }
        //Kiểm tra tính tồn tại của Username
        if(userRepository.existsByUsername(request.getUsername()))
            throw new AppException(ErrorCode.USERNAME_EXIST);
        // Gửi OTP qua mail
//        sendOtp(request.getEmail());
        Account account = accountMapper.toAccount(request);
        account.setPassword(passwordEncoder.encode(request.getPassword()));
        account.setDaXacThuc(false);
        account.setNgayTaoTaiKhoan(LocalDate.now());
        account.setBiKhoa(false);
        //Nếu để tróng tên hiển thị thì tên hiển thị sẽ là username luôn
        if(tenHienThi == null)
            account.setTenHienThi(request.getUsername());
        if (request.getAvatar() == null || request.getAvatar().isBlank()) {
            account.setAvatar(randomDefaultAvatar());
        }
        return accountMapper.toAccountResponse(userRepository.save(account));
    }
    // Trong AccountService
    public AccountResponse verifyAndCreateAccount(String email,String otp) {
        System.out.println("OTP gửi tới " + email + " là: " + otp); // Log để deb
        if(otp==null)
            throw new AppException(ErrorCode.NULL_VERIFY_CODE);
        if (!verifyOtp(email,otp)) {
            throw new AppException(ErrorCode.VERIFY_CODE_WRONG);
        }
        Account account = userRepository.findByEmail(email);
        if (account == null) throw new AppException(ErrorCode.USER_NOT_EXISTED);
        var token = authenticationService.generateToken(account.getEmail(), account.getAccountID());
        account.setDaXacThuc(true);
        accountMapper.toAccountResponse(userRepository.save(account));
        AccountResponse response = accountMapper.toAccountResponse(account);
        response.setToken(token);

        return response;
    }

    public List<Account> getUsers(){
        return  userRepository.findAll();
    }
    public void requestChangePassword(Long currentUserId, ChangePasswordRequest request) {

        Account account = userRepository.findById(currentUserId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        if (request.getOldPassword() == null || request.getOldPassword().isBlank()) {
            throw new AppException(ErrorCode.CURRENTPASSWORD_NULL);
        }

        if (request.getNewPassword() == null || request.getNewPassword().isBlank()) {
            throw new AppException(ErrorCode.NEWPASSWORD_NULL);
        }

        if (request.getConfirmNewPassword() == null || request.getConfirmNewPassword().isBlank()) {
            throw new AppException(ErrorCode.CONFIRMPASSWORD_NULL);
        }

        if (!passwordEncoder.matches(request.getOldPassword(), account.getPassword())) {
            throw new AppException(ErrorCode.CURRENTPASSWORD_WRONG);
        }

        if (request.getNewPassword().length() > 32) {
            throw new AppException(ErrorCode.NEWPASSWORD_TOO_LONG);
        }

        if (request.getNewPassword().length() < 6) {
            throw new AppException(ErrorCode.NEWPASSWORD_TOO_SHORT);
        }

        if (!request.getNewPassword().equals(request.getConfirmNewPassword())) {
            throw new AppException(ErrorCode.CONFIRMPASSWORD_MISMATCH);
        }

        LocalDateTime now = LocalDateTime.now();
        PendingChangePassword newPendingChange;

        synchronized (changePasswordCache) {
            PendingChangePassword currentPendingChange = changePasswordCache.get(currentUserId);

            // Kiểm tra người dùng có đang trong thời gian chờ gửi lại OTP không
            if (currentPendingChange != null
                    && currentPendingChange.getNextResendTime() != null
                    && now.isBefore(currentPendingChange.getNextResendTime())) {

                long remainingSeconds = Duration.between(
                        now,
                        currentPendingChange.getNextResendTime()
                ).getSeconds() + 1;

                throw new AppException(
                        ErrorCode.OTP_NOT_EXPIRED
                        // Nếu ErrorCode của bạn hỗ trợ truyền thêm dữ liệu,
                        // có thể trả remainingSeconds về FE để hiển thị đếm ngược.
                );
            }

            String otp = String.format("%06d", SECURE_RANDOM.nextInt(1_000_000));
            String hashedNewPassword = passwordEncoder.encode(request.getNewPassword());

            newPendingChange = PendingChangePassword.builder()
                    .otp(otp)
                    .hashedNewPassword(hashedNewPassword)
                    .expiryTime(now.plusMinutes(EXPIRE_MINUTES))
                    .nextResendTime(now.plusSeconds(RESEND_OTP_SECONDS))
                    .build();

            changePasswordCache.put(currentUserId, newPendingChange);
        }

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(account.getEmail());
        message.setSubject("Mã xác nhận đổi mật khẩu");
        message.setText(
                "Mã xác nhận đổi mật khẩu của bạn là: "
                        + newPendingChange.getOtp()
                        + ". Mã có hiệu lực trong "
                        + EXPIRE_MINUTES
                        + " phút."
        );

        try {
            mailSender.send(message);
        } catch (Exception exception) {
            /*
             * Mail gửi lỗi thì xóa OTP vừa tạo,
             * để người dùng được phép gửi lại ngay.
             */
            synchronized (changePasswordCache) {
                if (changePasswordCache.get(currentUserId) == newPendingChange) {
                    changePasswordCache.remove(currentUserId);
                }
            }
        }

        System.out.println(
                "OTP đổi mật khẩu gửi tới "
                        + account.getEmail()
                        + " là: "
                        + newPendingChange.getOtp()
        );
    }
    public void confirmChangePassword(Long currentUserId, String otp) {

        if (otp == null || otp.isBlank()) {
            throw new AppException(ErrorCode.NULL_VERIFY_CODE);
        }

        PendingChangePassword pending = changePasswordCache.get(currentUserId);

        if (pending == null) {
            throw new AppException(ErrorCode.CHANGE_PASSWORD_REQUEST_NOT_FOUND);
        }

        if (LocalDateTime.now().isAfter(pending.getExpiryTime())) {
            changePasswordCache.remove(currentUserId);
            throw new AppException(ErrorCode.CHANGE_PASSWORD_OTP_EXPIRED);
        }

        if (!otp.equals(pending.getOtp())) {
            throw new AppException(ErrorCode.CHANGE_PASSWORD_OTP_WRONG);
        }

        Account account = userRepository.findById(currentUserId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        account.setPassword(pending.getHashedNewPassword());

        userRepository.save(account);

        changePasswordCache.remove(currentUserId);
    }
    public void requestResetPassword(ForgotPasswordRequest request) {

        if (request.getEmail() == null || request.getEmail().isBlank()) {
            throw new AppException(ErrorCode.EMAIL_NULL);
        }

        String email = request.getEmail().trim();
        if (email.length() > 100) {
            throw new AppException(ErrorCode.EMAIL_TOO_LONG);
        }

        if (!EMAIL_PATTERN.matcher(email).matches()) {
            throw new AppException(ErrorCode.EMAIL_NOT_AN_EMAIL);
        }
        Account account = userRepository.findByEmail(email);

        if (account == null) {
            throw new AppException(ErrorCode.EMAIL_NOT_EXISTED);
        }

        String otp = String.format("%06d", new Random().nextInt(1_000_000));

        resetPasswordCache.put(
                email,
                PendingChangePassword.builder()
                        .otp(otp)
                        .expiryTime(LocalDateTime.now().plusMinutes(EXPIRE_MINUTES))
                        .build()
        );

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email);
        message.setSubject("Mã xác thực cấp lại mật khẩu");
        message.setText("Mã xác thực cấp lại mật khẩu của bạn là: " + otp
                + ". Mã có hiệu lực trong " + EXPIRE_MINUTES + " phút.");

        mailSender.send(message);

        System.out.println("OTP cấp lại mật khẩu gửi tới " + email + " là: " + otp);
    }
    public void resetPassword(ResetPasswordRequest request) {

        if (request.getEmail() == null || request.getEmail().isBlank()) {
            throw new AppException(ErrorCode.EMAIL_NULL);
        }

        if (request.getOtp() == null || request.getOtp().isBlank()) {
            throw new AppException(ErrorCode.NULL_RESET_PASSWORD_OTP);
        }

        String email = request.getEmail().trim();
        if (email.length() > 100) {
            throw new AppException(ErrorCode.EMAIL_TOO_LONG);
        }

        if (!EMAIL_PATTERN.matcher(email).matches()) {
            throw new AppException(ErrorCode.EMAIL_NOT_AN_EMAIL);
        }
        PendingChangePassword pending = resetPasswordCache.get(email);

        if (pending == null) {
            throw new AppException(ErrorCode.RESET_PASSWORD_REQUEST_NOT_FOUND);
        }

        if (LocalDateTime.now().isAfter(pending.getExpiryTime())) {
            resetPasswordCache.remove(email);
            throw new AppException(ErrorCode.RESET_PASSWORD_OTP_EXPIRED);
        }

        if (!request.getOtp().equals(pending.getOtp())) {
            throw new AppException(ErrorCode.WRONG_RESET_PASSWORD_OTP);
        }

        Account account = userRepository.findByEmail(email);

        if (account == null) {
            throw new AppException(ErrorCode.EMAIL_NOT_EXISTED);
        }

        String newRawPassword = generateRandomPassword(8);

        String hashedPassword = passwordEncoder.encode(newRawPassword);

        account.setPassword(hashedPassword);

        userRepository.save(account);

        resetPasswordCache.remove(email);

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email);
        message.setSubject("Cấp lại mật khẩu thành công");
        message.setText("Chúng tôi đã cấp lại mật khẩu cho bạn. "
                + "Mật khẩu mới là " + newRawPassword
                + ", vui lòng đăng nhập và đổi lại mật khẩu.");

        mailSender.send(message);

        System.out.println("Mật khẩu mới của " + email + " là: " + newRawPassword);
    }
    private String generateRandomPassword(int length) {
        String characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
                + "abcdefghijklmnopqrstuvwxyz"
                + "0123456789";

        Random random = new Random();

        StringBuilder password = new StringBuilder();

        for (int i = 0; i < length; i++) {
            int index = random.nextInt(characters.length());
            password.append(characters.charAt(index));
        }

        return password.toString();
    }
    public AccountResponse disableMyAccount(Long currentUserId) {

        Account account = userRepository.findById(currentUserId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        account.setDaVoHieuHoa(true);
        account.setNgayVoHieuHoa(LocalDate.now());

        Account savedAccount = userRepository.save(account);

        return accountMapper.toAccountResponse(savedAccount);
    }
    public AccountResponse enableMyAccount(Long currentUserId) {

        Account account = userRepository.findById(currentUserId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        account.setDaVoHieuHoa(false);
        account.setNgayVoHieuHoa(null);

        Account savedAccount = userRepository.save(account);

        return accountMapper.toAccountResponse(savedAccount);
    }
}
