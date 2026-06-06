package com.developer.EyesOnly.Service;

import com.developer.EyesOnly.DTO.Request.AdminUserSearchRequest;
import com.developer.EyesOnly.DTO.Response.*;
import com.developer.EyesOnly.Entity.*;
import com.developer.EyesOnly.Repository.BaoCaoUserRepository;
import com.developer.EyesOnly.Repository.PostRepository;
import com.developer.EyesOnly.Repository.TheoDoiAccountRepository;
import com.developer.EyesOnly.Repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class AdminUserService {

    private final UserRepository userRepository;
    private final TheoDoiAccountRepository theoDoiAccountRepository;
    private final PostRepository postRepository;
    private final BaoCaoUserRepository baoCaoUserRepository;
    @Transactional(readOnly = true)
    public AdminUserSearchResponse searchUsers(
            AdminUserSearchRequest request,
            int page,
            int size
    ) {
        Pageable pageable = createPageable(page, size);

        Long accountId = request == null ? null : request.getAccountId();

        String lockStatus = request == null ? null : request.getLockStatus();

        if (lockStatus == null || lockStatus.trim().isEmpty()) {
            lockStatus = "ALL";
        } else {
            lockStatus = lockStatus.trim().toUpperCase();
        }

        if (!isValidLockStatus(lockStatus)) {
            lockStatus = "ALL";
        }

        Page<Account> accountPage = userRepository.searchAdminUsers(
                accountId,
                lockStatus,
                pageable
        );

        List<AdminUserItemResponse> content = accountPage.getContent()
                .stream()
                .map(this::toAdminUserItemResponse)
                .toList();

        String message = null;

        if (accountPage.isEmpty()) {
            message = "Không tìm thấy kết quả phù hợp";
        }

        return AdminUserSearchResponse.builder()
                .message(message)
                .content(content)
                .page(accountPage.getNumber())
                .size(accountPage.getSize())
                .totalElements(accountPage.getTotalElements())
                .totalPages(accountPage.getTotalPages())
                .first(accountPage.isFirst())
                .last(accountPage.isLast())
                .build();
    }

    /*
     * Tạo phân trang.
     * Use case yêu cầu mỗi lần lấy 6 account.
     * Sắp xếp theo Username tăng dần.
     */
    private Pageable createPageable(int page, int size) {
        if (page < 0) {
            page = 0;
        }

        if (size <= 0) {
            size = 6;
        }

        if (size > 30) {
            size = 30;
        }

        return PageRequest.of(
                page,
                size,
                Sort.by(Sort.Direction.ASC, "username")
        );
    }

    private boolean isValidLockStatus(String lockStatus) {
        return lockStatus.equals("ALL")
                || lockStatus.equals("LOCKED")
                || lockStatus.equals("UNLOCKED");
    }

    private AdminUserItemResponse toAdminUserItemResponse(Account account) {
        Long soNguoiTheoDoi =
                theoDoiAccountRepository.countByAccountDuocTheoDoi_AccountID(
                        account.getAccountID()
                );

        Long soNguoiDangTheoDoi =
                theoDoiAccountRepository.countByAccountTheoDoi_AccountID(
                        account.getAccountID()
                );

        return AdminUserItemResponse.builder()
                .accountID(account.getAccountID())
                .username(account.getUsername())
                .tenHienThi(account.getTenHienThi())
                .email(account.getEmail())
                .avatar(account.getAvatar())
                .tieuSu(account.getTieuSu())
                .ngayTaoTaiKhoan(account.getNgayTaoTaiKhoan())
                .biKhoa(account.getBiKhoa())
                .daVoHieuHoa(account.getDaVoHieuHoa())
                .daXacThuc(account.getDaXacThuc())
                .soNguoiTheoDoi(soNguoiTheoDoi)
                .soNguoiDangTheoDoi(soNguoiDangTheoDoi)
                .build();
    }

    @Transactional(readOnly = true)
    public AdminUserDetailResponse getUserDetail(
            Long accountId,
            int postPage,
            int postSize,
            int reportPage,
            int reportSize
    ) {
        Account account = userRepository.findById(accountId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Account"));

        Long soNguoiTheoDoi =
                theoDoiAccountRepository.countByAccountDuocTheoDoi_AccountID(accountId);

        Long soNguoiDangTheoDoi =
                theoDoiAccountRepository.countByAccountTheoDoi_AccountID(accountId);

        PageResponse<AdminPostItemResponse> thuVienTacPham =
                getPostLibraryOfAccount(accountId, postPage, postSize);

        PageResponse<AdminBaoCaoUserResponse> baoCaos =
                getReportPageOfAccount(accountId, reportPage, reportSize);

        return AdminUserDetailResponse.builder()
                .accountID(account.getAccountID())
                .username(account.getUsername())
                .tenHienThi(account.getTenHienThi())
                .avatar(account.getAvatar())
                .tieuSu(account.getTieuSu())
                .soNguoiTheoDoi(soNguoiTheoDoi)
                .soNguoiDangTheoDoi(soNguoiDangTheoDoi)
                .ngayThamGia(account.getNgayTaoTaiKhoan())
                .email(account.getEmail())
                .daVoHieuHoa(account.getDaVoHieuHoa())
                .ngayVoHieuHoa(
                        Boolean.TRUE.equals(account.getDaVoHieuHoa())
                                ? account.getNgayVoHieuHoa()
                                : null
                )
                .daXacThuc(account.getDaXacThuc())
                .biKhoa(account.getBiKhoa())
                .thuVienTacPham(thuVienTacPham)
                .baoCaos(baoCaos)
                .build();
    }

    /*
     * Lấy thư viện tác phẩm của Account dưới dạng phân trang.
     */
    private PageResponse<AdminPostItemResponse> getPostLibraryOfAccount(
            Long accountId,
            int postPage,
            int postSize
    ) {
        Pageable pageable = createPostPageable(postPage, postSize);

        Page<Long> postIdPage =
                postRepository.findAdminPostIdsByAccountId(accountId, pageable);

        List<Long> postIds = postIdPage.getContent();

        if (postIds.isEmpty()) {
            return new PageResponse<>(
                    List.of(),
                    postIdPage.getNumber(),
                    postIdPage.getSize(),
                    postIdPage.getTotalElements(),
                    postIdPage.getTotalPages(),
                    postIdPage.isFirst(),
                    postIdPage.isLast()
            );
        }

        List<Post> posts =
                postRepository.findPostsWithFilesAndAuthorByIds(postIds);

        Map<Long, Post> postMap = new HashMap<>();

        for (Post post : posts) {
            postMap.put(post.getPostID(), post);
        }

        List<AdminPostItemResponse> content = postIds.stream()
                .map(postMap::get)
                .filter(Objects::nonNull)
                .map(this::toAdminPostItemResponse)
                .toList();

        return new PageResponse<>(
                content,
                postIdPage.getNumber(),
                postIdPage.getSize(),
                postIdPage.getTotalElements(),
                postIdPage.getTotalPages(),
                postIdPage.isFirst(),
                postIdPage.isLast()
        );
    }

    /*
     * Lấy danh sách báo cáo mà Account này đã nhận dưới dạng phân trang.
     */
    private PageResponse<AdminBaoCaoUserResponse> getReportPageOfAccount(
            Long accountId,
            int reportPage,
            int reportSize
    ) {
        Pageable pageable = createReportPageable(reportPage, reportSize);

        Page<BaoCaoUser> reportPageResult =
                baoCaoUserRepository.findReportsByAccountIdForAdmin(
                        accountId,
                        pageable
                );

        List<AdminBaoCaoUserResponse> content =
                reportPageResult.getContent()
                        .stream()
                        .map(this::toAdminBaoCaoUserResponse)
                        .toList();

        return new PageResponse<>(
                content,
                reportPageResult.getNumber(),
                reportPageResult.getSize(),
                reportPageResult.getTotalElements(),
                reportPageResult.getTotalPages(),
                reportPageResult.isFirst(),
                reportPageResult.isLast()
        );
    }

    /*
     * Phân trang thư viện tác phẩm.
     * Sắp xếp theo ngày đăng mới nhất.
     */
    private Pageable createPostPageable(int page, int size) {
        if (page < 0) {
            page = 0;
        }

        if (size <= 0) {
            size = 6;
        }

        if (size > 30) {
            size = 30;
        }

        return PageRequest.of(
                page,
                size,
                Sort.by(Sort.Direction.DESC, "ngayDang")
        );
    }

    /*
     * Phân trang danh sách báo cáo.
     * Sắp xếp báo cáo mới nhất lên đầu.
     */
    private Pageable createReportPageable(int page, int size) {
        if (page < 0) {
            page = 0;
        }

        if (size <= 0) {
            size = 6;
        }

        if (size > 30) {
            size = 30;
        }

        return PageRequest.of(
                page,
                size,
                Sort.by(Sort.Direction.DESC, "ngayBaoCao")
        );
    }

    /*
     * Mapper Post sang DTO item cho admin.
     */
    private AdminPostItemResponse toAdminPostItemResponse(Post post) {
        return AdminPostItemResponse.builder()
                .postID(post.getPostID())
                .tieuDe(post.getTieuDe())
                .moTa(post.getMoTa())
                .ngayDang(post.getNgayDang())
                .tacGiaID(post.getTacGia() == null ? null : post.getTacGia().getAccountID())
                .usernameTacGia(post.getTacGia() == null ? null : post.getTacGia().getUsername())
                .tenHienThiTacGia(post.getTacGia() == null ? null : post.getTacGia().getTenHienThi())
                .avatarTacGia(post.getTacGia() == null ? null : post.getTacGia().getAvatar())
                .luotXem(post.getLuotXem())
                .sanPhamAI(post.getSanPhamAI())
                .hanCheHienThi(post.getHanCheHienThi())
                .hanCheHienThiText(DisplayRestriction.getDisplayNameByValue(post.getHanCheHienThi()))
                .congKhai(post.getCongKhai())
                .files(toKteoFileResponses(post.getFiles()))
                .build();
    }

    /*
     * Mapper KTEOFile sang DTO.
     */
    private List<KteoFileResponse> toKteoFileResponses(List<KTEOFile> files) {
        if (files == null) {
            return List.of();
        }

        return files.stream()
                .sorted(Comparator.comparing(
                        KTEOFile::getThuTu,
                        Comparator.nullsLast(Integer::compareTo)
                ))
                .map(file -> KteoFileResponse.builder()
                        .fileID(file.getFileID())
                        .link(file.getLink())
                        .width(file.getWidth())
                        .height(file.getHeight())
                        .thuTu(file.getThuTu())
                        .verifyKey(file.getVerifyKey())
                        .build())
                .toList();
    }

    /*
     * Mapper báo cáo user sang DTO cho admin.
     */
    private AdminBaoCaoUserResponse toAdminBaoCaoUserResponse(BaoCaoUser baoCaoUser) {

        Account nguoiBaoCao = baoCaoUser.getNguoiBaoCao();

        return AdminBaoCaoUserResponse.builder()
                .baoCaoUID(baoCaoUser.getBaoCaoUID())
                .ngayBaoCao(baoCaoUser.getNgayBaoCao())
                .mucBaoCao(baoCaoUser.getMucBaoCao())
                .noiDungBaoCao(baoCaoUser.getNoiDungBaoCao())
                .nguoiBaoCaoID(nguoiBaoCao == null ? null : nguoiBaoCao.getAccountID())
                .usernameNguoiBaoCao(nguoiBaoCao == null ? null : nguoiBaoCao.getUsername())
                .tenHienThiNguoiBaoCao(nguoiBaoCao == null ? null : nguoiBaoCao.getTenHienThi())
                .build();
    }
    //Hàm khóa hoặc mở khóa tài khoản
    @Transactional
    public String unlockUser(Long accountId) {

        Account account = userRepository.findById(accountId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Account"));

        /*
         * Nếu tài khoản đã không bị khóa rồi thì không cần thay đổi.
         */
        if (!Boolean.TRUE.equals(account.getBiKhoa())) {
            return "Tài khoản này hiện không bị khóa";
        }

        /*
         * Mở khóa tài khoản:
         * Bị khóa = false
         */
        account.setBiKhoa(false);

        userRepository.save(account);

        return "Mở khóa tài khoản thành công";
    }
}