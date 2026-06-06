package com.developer.EyesOnly.Service;

import com.developer.EyesOnly.DTO.Response.AccountSearchItemResponse;
import com.developer.EyesOnly.DTO.Response.AccountSearchResponse;
import com.developer.EyesOnly.Entity.Account;
import com.developer.EyesOnly.Exception.AppException;
import com.developer.EyesOnly.Exception.ErrorCode;
import com.developer.EyesOnly.Repository.AccountChanRepository;
import com.developer.EyesOnly.Repository.ChanAccountRepository;
import com.developer.EyesOnly.Repository.TheoDoiAccountRepository;
import com.developer.EyesOnly.Repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AccountSearchService {

    private final UserRepository userRepository;
    private final TheoDoiAccountRepository theoDoiAccountRepository;
    private final ChanAccountRepository accountChanRepository;
    @Transactional(readOnly = true)
    public AccountSearchResponse searchAccounts(
            Long currentAccountId,
            String keyword,
            int page,
            int size
    ) {
        if (keyword == null || keyword.trim().isBlank()) {
            return AccountSearchResponse.builder()
                    .message("Vui lòng nhập tên hiển thị hoặc username tài khoản muốn tìm kiếm")
                    .content(List.of())
                    .page(0)
                    .size(6)
                    .totalElements(0)
                    .totalPages(0)
                    .first(true)
                    .last(true)
                    .build();
        }

        keyword = keyword.trim();

        Pageable pageable = createPageable(page, size);

        Page<Account> accountPage =
                userRepository.searchAccounts(keyword, currentAccountId, pageable);

        List<AccountSearchItemResponse> content = accountPage.getContent()
                .stream()
                .map(account -> toAccountSearchItem(account, currentAccountId))
                .toList();

        String message = null;

        if (accountPage.isEmpty()) {
            message = "Không tìm thấy người dùng phù hợp";
        }

        return AccountSearchResponse.builder()
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
     * Tìm kiếm danh sách Account mà một Account đang theo dõi.
     *
     * viewerAccountId:
     * - Người đang xem danh sách.
     * - null nếu khách chưa đăng nhập.
     *
     * targetAccountId:
     * - Chủ sở hữu của danh sách following đang được xem.
     */
    @Transactional(readOnly = true)
    public AccountSearchResponse searchFollowingAccounts(
            Long viewerAccountId,
            Long targetAccountId,
            String keyword,
            int page,
            int size
    ) {
        /*
         * Kiểm tra Account được xem có tồn tại không.
         */
        Account targetAccount = userRepository.findById(targetAccountId)
                .orElseThrow(() -> new AppException(ErrorCode.ACCOUNT_NOT_FOUND));

        /*
         * Nếu người đã đăng nhập đang bị target chặn
         * hoặc đã chặn target thì không cho xem danh sách.
         *
         * Quy tắc này đồng bộ với trang xem thông tin Account của bạn.
         */
        validateCanViewTargetAccount(viewerAccountId, targetAccountId);

        String normalizedKeyword = keyword == null
                ? ""
                : keyword.trim();

        Pageable pageable = createPageable(page, size);

        Page<Account> accountPage =
                theoDoiAccountRepository.searchFollowingAccounts(
                        targetAccountId,
                        normalizedKeyword,
                        pageable
                );

        List<AccountSearchItemResponse> content =
                accountPage.getContent()
                        .stream()
                        .map(account -> toRelationshipAccountItem(
                                account,
                                viewerAccountId,
                                false
                        ))
                        .toList();

        String message = null;

        if (accountPage.isEmpty()) {
            boolean isViewingMyself =
                    viewerAccountId != null &&
                            viewerAccountId.equals(targetAccountId);

            if (normalizedKeyword.isBlank()) {
                message = isViewingMyself
                        ? "Bạn chưa theo dõi ai cả"
                        : targetAccount.getTenHienThi() + " chưa theo dõi ai cả";
            } else {
                message = "Không tìm thấy người dùng phù hợp";
            }
        }

        return buildAccountSearchResponse(
                accountPage,
                content,
                message
        );
    }
    /*
     * Tìm kiếm danh sách Account đang theo dõi một Account.
     */
    @Transactional(readOnly = true)
    public AccountSearchResponse searchFollowerAccounts(
            Long viewerAccountId,
            Long targetAccountId,
            String keyword,
            int page,
            int size
    ) {
        Account targetAccount = userRepository.findById(targetAccountId)
                .orElseThrow(() -> new AppException(ErrorCode.ACCOUNT_NOT_FOUND));

        validateCanViewTargetAccount(viewerAccountId, targetAccountId);

        String normalizedKeyword = keyword == null
                ? ""
                : keyword.trim();

        Pageable pageable = createPageable(page, size);

        Page<Account> accountPage =
                theoDoiAccountRepository.searchFollowerAccounts(
                        targetAccountId,
                        normalizedKeyword,
                        pageable
                );

        List<AccountSearchItemResponse> content =
                accountPage.getContent()
                        .stream()
                        .map(account -> toRelationshipAccountItem(
                                account,
                                viewerAccountId,
                                false
                        ))
                        .toList();

        String message = null;

        if (accountPage.isEmpty()) {
            boolean isViewingMyself =
                    viewerAccountId != null &&
                            viewerAccountId.equals(targetAccountId);

            if (normalizedKeyword.isBlank()) {
                message = isViewingMyself
                        ? "Chưa có ai theo dõi bạn cả"
                        : "Chưa có ai theo dõi " + targetAccount.getTenHienThi() + " cả";
            } else {
                message = "Không tìm thấy người dùng phù hợp";
            }
        }

        return buildAccountSearchResponse(
                accountPage,
                content,
                message
        );
    }
    /*
     * Kiểm tra người xem có quyền xem dữ liệu của target Account hay không.
     *
     * Khách chưa đăng nhập:
     * - được xem dữ liệu công khai.
     *
     * Chính chủ:
     * - luôn được xem danh sách của mình.
     *
     * Viewer và target có quan hệ chặn hai chiều:
     * - không được xem.
     */
    private void validateCanViewTargetAccount(
            Long viewerAccountId,
            Long targetAccountId
    ) {
        if (viewerAccountId == null ||
                viewerAccountId.equals(targetAccountId)) {
            return;
        }

        boolean viewerBlockedTarget =
                accountChanRepository
                        .existsByAccountChan_AccountIDAndAccountBiChan_AccountID(
                                viewerAccountId,
                                targetAccountId
                        );

        boolean targetBlockedViewer =
                accountChanRepository
                        .existsByAccountChan_AccountIDAndAccountBiChan_AccountID(
                                targetAccountId,
                                viewerAccountId
                        );

        if (viewerBlockedTarget || targetBlockedViewer) {
            throw new AppException(ErrorCode.CANNOT_VIEW_ACCOUNT);
        }
    }
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

        return PageRequest.of(page, size);
    }

    private AccountSearchItemResponse toAccountSearchItem(
            Account account,
            Long currentAccountId
    ) {
        Long soNguoiTheoDoi =
                theoDoiAccountRepository.countByAccountDuocTheoDoi_AccountID(
                        account.getAccountID()
                );

        Boolean daTheoDoi = false;

        if (currentAccountId != null) {
            daTheoDoi =
                    theoDoiAccountRepository
                            .existsByAccountDuocTheoDoi_AccountIDAndAccountTheoDoi_AccountID(
                                    account.getAccountID(),
                                    currentAccountId
                            );
        }

        return AccountSearchItemResponse.builder()
                .accountID(account.getAccountID())
                .username(account.getUsername())
                .tenHienThi(account.getTenHienThi())
                .avatar(account.getAvatar())
                .tieuSu(account.getTieuSu())
                .soNguoiTheoDoi(soNguoiTheoDoi)
                .daTheoDoi(daTheoDoi)
                .build();
    }
    /*
     * Tìm kiếm danh sách account mà người dùng hiện tại đang theo dõi.
     *
     * Khác với tìm kiếm account công khai:
     * - keyword rỗng vẫn hợp lệ.
     * - keyword rỗng nghĩa là hiển thị toàn bộ danh sách.
     */
    @Transactional(readOnly = true)
    public AccountSearchResponse searchMyFollowingAccounts(
            Long currentAccountId,
            String keyword,
            int page,
            int size
    ) {
        requireLoggedInAccount(currentAccountId);

        String normalizedKeyword = normalizeRelationshipKeyword(keyword);

        Pageable pageable = createPageable(page, size);

        Page<Account> accountPage =
                theoDoiAccountRepository.searchFollowingAccounts(
                        currentAccountId,
                        normalizedKeyword,
                        pageable
                );

        List<AccountSearchItemResponse> content =
                accountPage.getContent()
                        .stream()
                        .map(account -> toRelationshipAccountItem(
                                account,
                                currentAccountId,
                                false
                        ))
                        .toList();

        String message = null;

        if (accountPage.isEmpty()) {
            message = normalizedKeyword.isBlank()
                    ? "Bạn chưa theo dõi ai cả"
                    : "Không tìm thấy người dùng phù hợp";
        }

        return buildAccountSearchResponse(
                accountPage,
                content,
                message
        );
    }

    /*
     * Tìm kiếm danh sách account đang theo dõi người dùng hiện tại.
     */
    @Transactional(readOnly = true)
    public AccountSearchResponse searchMyFollowerAccounts(
            Long currentAccountId,
            String keyword,
            int page,
            int size
    ) {
        requireLoggedInAccount(currentAccountId);

        String normalizedKeyword = normalizeRelationshipKeyword(keyword);

        Pageable pageable = createPageable(page, size);

        Page<Account> accountPage =
                theoDoiAccountRepository.searchFollowerAccounts(
                        currentAccountId,
                        normalizedKeyword,
                        pageable
                );

        List<AccountSearchItemResponse> content =
                accountPage.getContent()
                        .stream()
                        .map(account -> toRelationshipAccountItem(
                                account,
                                currentAccountId,
                                false
                        ))
                        .toList();

        String message = null;

        if (accountPage.isEmpty()) {
            message = normalizedKeyword.isBlank()
                    ? "Chưa có ai theo dõi bạn cả"
                    : "Không tìm thấy người dùng phù hợp";
        }

        return buildAccountSearchResponse(
                accountPage,
                content,
                message
        );
    }

    /*
     * Tìm kiếm danh sách account mà người dùng hiện tại đã chặn.
     */
    @Transactional(readOnly = true)
    public AccountSearchResponse searchMyBlockedAccounts(
            Long currentAccountId,
            String keyword,
            int page,
            int size
    ) {
        requireLoggedInAccount(currentAccountId);

        String normalizedKeyword = normalizeRelationshipKeyword(keyword);

        Pageable pageable = createPageable(page, size);

        Page<Account> accountPage =
                accountChanRepository.searchBlockedAccounts(
                        currentAccountId,
                        normalizedKeyword,
                        pageable
                );

        List<AccountSearchItemResponse> content =
                accountPage.getContent()
                        .stream()
                        .map(account -> toRelationshipAccountItem(
                                account,
                                currentAccountId,
                                true
                        ))
                        .toList();

        String message = null;

        if (accountPage.isEmpty()) {
            message = normalizedKeyword.isBlank()
                    ? "Bạn chưa chặn tài khoản nào"
                    : "Không tìm thấy người dùng phù hợp";
        }

        return buildAccountSearchResponse(
                accountPage,
                content,
                message
        );
    }
    /*
     * Các chức năng following / followers / blocked chỉ dùng cho user đã đăng nhập.
     */
    private void requireLoggedInAccount(Long currentAccountId) {
        if (currentAccountId == null) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }
    }

    /*
     * Với danh sách quan hệ, keyword rỗng là hợp lệ.
     * Keyword rỗng nghĩa là hiển thị toàn bộ danh sách.
     */
    private String normalizeRelationshipKeyword(String keyword) {
        return keyword == null ? "" : keyword.trim();
    }

    /*
     * Tạo dữ liệu account để FE hiển thị trong modal/list.
     */
    private AccountSearchItemResponse toRelationshipAccountItem(
            Account account,
            Long currentAccountId,
            boolean isBlocked
    ) {
        boolean daTheoDoi =
                theoDoiAccountRepository
                        .existsByAccountTheoDoi_AccountIDAndAccountDuocTheoDoi_AccountID(
                                currentAccountId,
                                account.getAccountID()
                        );

        return AccountSearchItemResponse.builder()
                .accountID(account.getAccountID())
                .username(account.getUsername())
                .tenHienThi(account.getTenHienThi())
                .avatar(account.getAvatar())
                .tieuSu(account.getTieuSu())
                .daTheoDoi(daTheoDoi)
                .isBlocked(isBlocked)
                .build();
    }

    /*
     * Gom phần build response phân trang để không lặp code.
     */
    private AccountSearchResponse buildAccountSearchResponse(
            Page<Account> accountPage,
            List<AccountSearchItemResponse> content,
            String message
    ) {
        return AccountSearchResponse.builder()
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
}