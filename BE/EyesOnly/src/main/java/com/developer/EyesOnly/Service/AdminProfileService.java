package com.developer.EyesOnly.Service;

import com.developer.EyesOnly.DTO.Request.AdminChangePasswordRequest;
import com.developer.EyesOnly.DTO.Response.AdminProfileResponse;
import com.developer.EyesOnly.Entity.Admin;
import com.developer.EyesOnly.Repository.AdminRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AdminProfileService {
    private final AdminRepository adminRepository;
    private final PasswordEncoder passwordEncoder;
    /*
     * Lấy hồ sơ admin đang đăng nhập.
     *
     * adminID được lấy từ token trong controller,
     * không lấy từ URL để tránh người này xem hồ sơ người khác.
     */
    @Transactional(readOnly = true)
    public AdminProfileResponse getAdmin(String adminID) {

        Admin admin = adminRepository.findByAdminID(adminID)
                .orElseThrow(() -> new RuntimeException("Admin không tồn tại"));

        return AdminProfileResponse.builder()
                .adminName(admin.getAdminName())
                .vaiTro(admin.getVaiTro() == null ? null : admin.getVaiTro().getVaiTro())
                .build();
    }

    /*
     * Đổi mật khẩu admin đang đăng nhập.
     *
     * adminID:
     * - Lấy từ principal.getName()
     * - JwtFilter của bạn đang set principal của admin là adminID
     *
     * request:
     * - oldPassword: mật khẩu cũ
     * - newPassword: mật khẩu mới
     * - confirmNewPassword: nhập lại mật khẩu mới
     */
    @Transactional
    public String changePassword(
            String adminID,
            AdminChangePasswordRequest request
    ) {
        /*
         * Nếu request null thì coi như thiếu dữ liệu.
         */
        if (request == null) {
            throw new RuntimeException("Không được để trống Mật khẩu cũ");
        }

        /*
         * Validate mật khẩu cũ rỗng.
         */
        if (isBlank(request.getOldPassword())) {
            throw new RuntimeException("Không được để trống Mật khẩu cũ");
        }

        /*
         * Validate mật khẩu mới rỗng.
         */
        if (isBlank(request.getNewPassword())) {
            throw new RuntimeException("Không được để trống Mật khẩu mới");
        }

        /*
         * Validate nhập lại mật khẩu mới rỗng.
         */
        if (isBlank(request.getConfirmPassword())) {
            throw new RuntimeException("Không được để trống Nhập lại mật khẩu");
        }

        /*
         * Tìm admin đang đăng nhập.
         */
        Admin admin = adminRepository.findByAdminID(adminID)
                .orElseThrow(() -> new RuntimeException("Admin không tồn tại"));

        /*
         * So sánh mật khẩu cũ người dùng nhập với mật khẩu BCrypt trong DB.
         *
         * Thứ tự đúng:
         * passwordEncoder.matches(rawPassword, encodedPassword)
         */
        boolean oldPasswordMatched = passwordEncoder.matches(
                request.getOldPassword(),
                admin.getPassword()
        );

        if (!oldPasswordMatched) {
            throw new RuntimeException("Mật khẩu cũ không đúng");
        }

        /*
         * Kiểm tra nhập lại mật khẩu mới.
         */
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new RuntimeException("Nhập lại mật khẩu mới không chính xác");
        }

        /*
         * Kiểm tra mật khẩu yếu.
         */
        if (request.getNewPassword().length() < 6) {
            throw new RuntimeException("Mật khẩu yếu, vui lòng nhập mật khẩu có 6 ký tự trở lên");
        }

        /*
         * Kiểm tra mật khẩu quá dài.
         */
        if (request.getNewPassword().length() > 32) {
            throw new RuntimeException("Mật khẩu quá dài, vui lòng nhập mật khẩu có 32 ký tự trở xuống");
        }

        /*
         * Mã hóa mật khẩu mới bằng BCrypt.
         */
        String encodedNewPassword = passwordEncoder.encode(
                request.getNewPassword()
        );

        /*
         * Cập nhật mật khẩu mới vào tài khoản admin.
         */
        admin.setPassword(encodedNewPassword);

        adminRepository.save(admin);

        /*
         * BE trả thông báo thành công.
         * FE sẽ xóa adminToken và điều hướng về trang login.
         */
        return "Đổi mật khẩu thành công";
    }

    /*
     * Hàm kiểm tra chuỗi null hoặc chỉ toàn khoảng trắng.
     */
    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }
}
