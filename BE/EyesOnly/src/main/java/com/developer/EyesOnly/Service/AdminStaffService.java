package com.developer.EyesOnly.Service;

import com.developer.EyesOnly.DTO.Request.CreateAdminRequest;
import com.developer.EyesOnly.DTO.Request.UpdateAdminRoleRequest;
import com.developer.EyesOnly.DTO.Response.AdminStaffItemResponse;
import com.developer.EyesOnly.DTO.Response.AdminStaffListResponse;
import com.developer.EyesOnly.Entity.Admin;
import com.developer.EyesOnly.Entity.Role;
import com.developer.EyesOnly.Repository.AdminRepository;
import com.developer.EyesOnly.Repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class AdminStaffService {

    private final AdminRepository adminRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    /*
     * Lấy danh sách nhân sự admin.
     *
     * currentAdminID:
     * - Lấy từ principal.getName()
     * - JwtFilter của bạn đang set principal admin = adminID
     *
     * page:
     * - FE truyền từ 0 trở đi
     *
     * size:
     * - Mặc định 6 nhân sự / lần
     */
    @Transactional(readOnly = true)
    public AdminStaffListResponse getStaffList(
            String currentAdminID,
            int page,
            int size
    ) {
        Pageable pageable = createPageable(page, size);

        /*
         * Truy vấn danh sách admin ngoại trừ tài khoản đang đăng nhập.
         */
        Page<Admin> adminPage =
                adminRepository.findByAdminIDNot(currentAdminID, pageable);

        /*
         * Convert Entity Admin sang DTO.
         * Không trả entity trực tiếp vì entity có password.
         */
        List<AdminStaffItemResponse> content = adminPage.getContent()
                .stream()
                .map(this::toAdminStaffItemResponse)
                .toList();

        /*
         * Nếu không có admin nào ngoài tài khoản hiện tại,
         * trả message theo use case.
         */
        String message = null;

        if (adminPage.isEmpty()) {
            message = "Chưa có nhân sự nào trong hệ thống";
        }

        return AdminStaffListResponse.builder()
                .message(message)
                .content(content)
                .page(adminPage.getNumber())
                .size(adminPage.getSize())
                .totalElements(adminPage.getTotalElements())
                .totalPages(adminPage.getTotalPages())
                .first(adminPage.isFirst())
                .last(adminPage.isLast())
                .build();
    }

    /*
     * Tạo thông tin phân trang.
     *
     * Use case chưa nói sắp xếp theo gì,
     * nên mình cho sắp xếp theo AdminID tăng dần để danh sách ổn định.
     */
    private Pageable createPageable(int page, int size) {
        if (page < 0) {
            page = 0;
        }

        if (size <= 0) {
            size = 6;
        }

        /*
         * Chặn size quá lớn để tránh FE gọi quá nhiều dữ liệu một lần.
         */
        if (size > 30) {
            size = 30;
        }

        return PageRequest.of(
                page,
                size,
                Sort.by(Sort.Direction.ASC, "adminID")
        );
    }

    /*
     * Mapper Admin entity sang DTO hiển thị.
     */
    private AdminStaffItemResponse toAdminStaffItemResponse(Admin admin) {

        Role role = admin.getVaiTro();

        return AdminStaffItemResponse.builder()
                .adminID(admin.getAdminID())
                .adminName(admin.getAdminName())

                /*
                 * Nếu role null thì trả null để tránh NullPointerException.
                 */
                .roleID(role == null ? null : role.getRoleID())
                .vaiTro(role == null ? null : role.getVaiTro())

                .build();
    }

    /*
     * AdminID chỉ được chứa:
     * - chữ cái thường a-z
     * - chữ cái hoa A-Z
     * - số 0-9
     */
    private static final Pattern ADMIN_ID_PATTERN =
            Pattern.compile("^[A-Za-z0-9]+$");

    /*
     * Danh sách role được phép chọn khi tạo admin.
     *
     * Bạn chỉnh lại chuỗi trong Set này cho khớp với dữ liệu bảng Role của bạn.
     * Ví dụ nếu DB đang lưu:
     * - "QuanLyNhanSu"
     * - "KiemDuyetVien"
     * thì giữ như dưới.
     *
     * Nếu DB đang lưu tiếng Việt có dấu, mình cũng để sẵn vài trường hợp.
     */
    private static final Set<String> ALLOWED_CREATE_ROLE_NAMES = Set.of(
            "QuanLyNhanSu",
            "Quản lý nhân sự",
            "KiemDuyetVien",
            "Kiểm duyệt viên",
            "KiemDuyetNoiDung",
            "Kiểm duyệt nội dung"
    );

    /*
     * Tạo tài khoản admin mới.
     *
     * currentAdminID:
     * - Lấy từ principal.getName()
     * - Dùng để biết admin nào đang thực hiện thao tác.
     *
     * request:
     * - Dữ liệu FE gửi lên.
     */
    @Transactional
    public String createAdmin(
            String currentAdminID,
            CreateAdminRequest request
    ) {
        /*
         * Nếu request null thì coi như thiếu dữ liệu.
         */
        if (request == null) {
            throw new RuntimeException("Vui lòng không để trống thông tin tài khoản Admin");
        }

        /*
         * Validate trường AdminID rỗng.
         */
        if (isBlank(request.getAdminID())) {
            throw new RuntimeException("Vui lòng không để trống AdminID");
        }

        /*
         * Validate trường AdminName rỗng.
         */
        if (isBlank(request.getAdminName())) {
            throw new RuntimeException("Vui lòng không để trống tên Admin");
        }

        /*
         * Validate trường mật khẩu rỗng.
         */
        if (isBlank(request.getPassword())) {
            throw new RuntimeException("Vui lòng không để trống mật khẩu");
        }

        /*
         * Validate trường role rỗng.
         */
        if (request.getRoleID() == null) {
            throw new RuntimeException("Vui lòng không để trống Role");
        }

        String adminID = request.getAdminID().trim();
        String adminName = request.getAdminName().trim();
        String rawPassword = request.getPassword();

        /*
         * Kiểm tra AdminID đã tồn tại chưa.
         */
        if (adminRepository.existsByAdminID(adminID)) {
            throw new RuntimeException("AdminID đã tồn tại");
        }

        /*
         * Kiểm tra định dạng AdminID.
         */
        if (!ADMIN_ID_PATTERN.matcher(adminID).matches()) {
            throw new RuntimeException("AdminID chỉ được chứa chữ cái hoa, thường và số");
        }

        /*
         * Kiểm tra mật khẩu yếu.
         */
        if (rawPassword.length() < 6) {
            throw new RuntimeException("Mật khẩu yếu, vui lòng nhập mật khẩu có 6 ký tự trở lên");
        }

        /*
         * Kiểm tra mật khẩu quá dài.
         */
        if (rawPassword.length() > 32) {
            throw new RuntimeException("Mật khẩu quá dài, vui lòng nhập mật khẩu có 32 ký tự trở xuống");
        }

        /*
         * Tìm role theo roleID FE gửi lên.
         * Nếu không tồn tại thì có thể do FE gửi sai hoặc bị chỉnh bằng F12.
         */
        Role role = roleRepository.findById(request.getRoleID())
                .orElseThrow(() -> new RuntimeException("Vui lòng chọn lại vai trò"));

        /*
         * Kiểm tra role có nằm trong danh sách được phép tạo không.
         * Nếu user chỉnh roleID bằng F12 sang role khác thì sẽ bị chặn tại đây.
         */
        if (role.getVaiTro() == null ||
                !ALLOWED_CREATE_ROLE_NAMES.contains(role.getVaiTro())) {
            throw new RuntimeException("Vui lòng chọn lại vai trò");
        }

        /*
         * Mã hóa mật khẩu bằng BCrypt trước khi lưu.
         */
        String encodedPassword = passwordEncoder.encode(rawPassword);

        /*
         * Tạo entity Admin mới.
         * Không bao giờ lưu rawPassword trực tiếp vào DB.
         */
        Admin admin = Admin.builder()
                .adminID(adminID)
                .adminName(adminName)
                .password(encodedPassword)
                .vaiTro(role)
                .build();

        /*
         * Lưu tài khoản admin vào DB.
         */
        adminRepository.save(admin);

        return "Tạo thành công tài khoản Admin";
    }

    /*
     * Hàm nhỏ kiểm tra chuỗi null hoặc toàn khoảng trắng.
     */
    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }


    /*
     * Các tên role hợp lệ khi thay đổi vai trò nhân sự.
     *
     * Lưu ý:
     * Các chuỗi này phải khớp với dữ liệu trong bảng Role.VaiTro.
     * Nếu DB của bạn đang lưu tiếng Việt có dấu thì thêm đúng chuỗi đó vào đây.
     */
    private static final Set<String> ALLOWED_UPDATE_ROLE_NAMES = Set.of(
            "Kiểm duyệt viên",
            "Quản lý nhân sự",
            "Đã nghỉ việc"
    );
    // Thay đổi role của nhân viên trừ bản thân
    @Transactional
    public String updateStaffRole(
            String currentAdminID,
            String targetAdminID,
            UpdateAdminRoleRequest request
    ) {
        /*
         * Nếu request null hoặc roleID null,
         * có thể là FE không gửi role hoặc người dùng chỉnh request bằng F12.
         */
        if (request == null || request.getRoleID() == null) {
            throw new RuntimeException("Vui lòng chọn vai trò phù hợp");
        }

        /*
         * Không cho admin tự đổi vai trò của chính mình.
         * Tránh trường hợp tự chuyển mình thành "Đã nghỉ việc" hoặc tự hạ quyền.
         * Nếu use case của bạn cho phép tự đổi thì có thể bỏ đoạn này.
         */
        if (currentAdminID.equals(targetAdminID)) {
            throw new RuntimeException("Không thể tự thay đổi vai trò của chính mình");
        }

        /*
         * Tìm tài khoản admin cần đổi vai trò.
         */
        Admin targetAdmin = adminRepository.findById(targetAdminID)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản Admin"));

        /*
         * Tìm role theo roleID FE gửi lên.
         * Nếu không tìm thấy nghĩa là roleID sai hoặc bị chỉnh bằng F12.
         */
        Role role = roleRepository.findById(request.getRoleID())
                .orElseThrow(() -> new RuntimeException("Vui lòng chọn vai trò phù hợp"));

        /*
         * Kiểm tra role lấy từ DB có nằm trong 3 role được phép không:
         * - Kiểm duyệt viên
         * - Quản lý nhân sự
         * - Đã nghỉ việc
         */
        if (role.getVaiTro() == null ||
                !ALLOWED_UPDATE_ROLE_NAMES.contains(role.getVaiTro())) {
            throw new RuntimeException("Vui lòng chọn vai trò phù hợp");
        }

        /*
         * Cập nhật vai trò mới cho admin.
         */
        targetAdmin.setVaiTro(role);

        /*
         * Lưu thay đổi vào DB.
         */
        adminRepository.save(targetAdmin);

        return "Lưu thành công";
    }
}