package com.developer.EyesOnly.Service;

import com.developer.EyesOnly.DTO.Response.FollowAccountItemResponse;
import com.developer.EyesOnly.DTO.Response.FollowAccountListResponse;
import com.developer.EyesOnly.DTO.Response.FollowAccountResponse;
import com.developer.EyesOnly.Entity.Account;
import com.developer.EyesOnly.Entity.TheoDoiAccount;
import com.developer.EyesOnly.Entity.TheoDoiAccountId;
import com.developer.EyesOnly.Exception.AppException;
import com.developer.EyesOnly.Exception.ErrorCode;
import com.developer.EyesOnly.Repository.TheoDoiAccountRepository;
import com.developer.EyesOnly.Repository.UserRepository;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import org.springframework.data.domain.Pageable;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FollowAccountService {

    private final UserRepository userRepository;
    private final TheoDoiAccountRepository theoDoiAccountRepository;
    private final ThongBaoService thongBaoService;
    @Transactional
    public FollowAccountResponse followAccount(Long currentAccountId, Long targetAccountId) {

        if (currentAccountId.equals(targetAccountId)) {
            throw new RuntimeException("Không thể tự theo dõi chính mình");
        }

        Account currentAccount = userRepository.findById(currentAccountId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        Account targetAccount = userRepository.findById(targetAccountId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        boolean daTheoDoi =
                theoDoiAccountRepository
                        .existsByAccountDuocTheoDoi_AccountIDAndAccountTheoDoi_AccountID(
                                targetAccountId,
                                currentAccountId
                        );

        if (!daTheoDoi) {
            TheoDoiAccountId id = new TheoDoiAccountId(
                    targetAccountId,
                    currentAccountId
            );

            TheoDoiAccount theoDoiAccount = new TheoDoiAccount();
            theoDoiAccount.setId(id);
            theoDoiAccount.setAccountDuocTheoDoi(targetAccount);
            theoDoiAccount.setAccountTheoDoi(currentAccount);

            theoDoiAccountRepository.save(theoDoiAccount);


            daTheoDoi = true;
        }
//sau khi lưu comment thì gửi thông báo đến chủ bài post
        thongBaoService.createNotification(
                targetAccountId,
                currentAccount.getTenHienThi(),
                "/user/" + currentAccountId,
                0
        );
        Long soNguoiTheoDoi =
                theoDoiAccountRepository.countByAccountDuocTheoDoi_AccountID(targetAccountId);

        Long soNguoiDangTheoDoi =
                theoDoiAccountRepository.countByAccountTheoDoi_AccountID(currentAccountId);

        return FollowAccountResponse.builder()
                .targetAccountId(targetAccountId)
                .daTheoDoi(daTheoDoi)
                .soNguoiTheoDoi(soNguoiTheoDoi)
                .soNguoiDangTheoDoi(soNguoiDangTheoDoi)
                .message("Theo dõi thành công")
                .build();
    }

    @Transactional
    public FollowAccountResponse unfollowAccount(Long currentAccountId, Long targetAccountId) {

        if (currentAccountId.equals(targetAccountId)) {
            throw new RuntimeException("Không thể bỏ theo dõi chính mình");
        }

        userRepository.findById(currentAccountId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        userRepository.findById(targetAccountId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        boolean daTheoDoi =
                theoDoiAccountRepository
                        .existsByAccountDuocTheoDoi_AccountIDAndAccountTheoDoi_AccountID(
                                targetAccountId,
                                currentAccountId
                        );

        if (daTheoDoi) {
            theoDoiAccountRepository
                    .deleteByAccountDuocTheoDoi_AccountIDAndAccountTheoDoi_AccountID(
                            targetAccountId,
                            currentAccountId
                    );

            daTheoDoi = false;
        }

        Long soNguoiTheoDoi =
                theoDoiAccountRepository.countByAccountDuocTheoDoi_AccountID(targetAccountId);

        Long soNguoiDangTheoDoi =
                theoDoiAccountRepository.countByAccountTheoDoi_AccountID(currentAccountId);

        return FollowAccountResponse.builder()
                .targetAccountId(targetAccountId)
                .daTheoDoi(daTheoDoi)
                .soNguoiTheoDoi(soNguoiTheoDoi)
                .soNguoiDangTheoDoi(soNguoiDangTheoDoi)
                .message("Bỏ theo dõi thành công")
                .build();
    }
    @Transactional(readOnly = true)
    public FollowAccountListResponse getFollowers(
            Long currentAccountId,
            Long targetAccountId,
            int page,
            int size
    ) {
        Account targetAccount = userRepository.findById(targetAccountId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        Pageable pageable = createPageable(page, size);

        Page<Account> followerPage =
                theoDoiAccountRepository.findFollowersByAccountId(targetAccountId, pageable);

        List<FollowAccountItemResponse> content = followerPage.getContent()
                .stream()
                .map(account -> toFollowAccountItem(account, currentAccountId))
                .toList();

        String message = null;

        if (followerPage.isEmpty()) {
            message = "Chưa ai theo dõi " + targetAccount.getTenHienThi() + " cả";
        }

        return FollowAccountListResponse.builder()
                .accountID(targetAccount.getAccountID())
                .tenHienThi(targetAccount.getTenHienThi())
                .message(message)
                .content(content)
                .page(followerPage.getNumber())
                .size(followerPage.getSize())
                .totalElements(followerPage.getTotalElements())
                .totalPages(followerPage.getTotalPages())
                .first(followerPage.isFirst())
                .last(followerPage.isLast())
                .build();
    }

    @Transactional(readOnly = true)
    public FollowAccountListResponse getFollowing(
            Long currentAccountId,
            Long targetAccountId,
            int page,
            int size
    ) {
        Account targetAccount = userRepository.findById(targetAccountId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        Pageable pageable = createPageable(page, size);

        Page<Account> followingPage =
                theoDoiAccountRepository.findFollowingByAccountId(targetAccountId, pageable);

        List<FollowAccountItemResponse> content = followingPage.getContent()
                .stream()
                .map(account -> toFollowAccountItem(account, currentAccountId))
                .toList();

        String message = null;

        if (followingPage.isEmpty()) {
            message = targetAccount.getTenHienThi() + " chưa theo dõi ai cả";
        }

        return FollowAccountListResponse.builder()
                .accountID(targetAccount.getAccountID())
                .tenHienThi(targetAccount.getTenHienThi())
                .message(message)
                .content(content)
                .page(followingPage.getNumber())
                .size(followingPage.getSize())
                .totalElements(followingPage.getTotalElements())
                .totalPages(followingPage.getTotalPages())
                .first(followingPage.isFirst())
                .last(followingPage.isLast())
                .build();
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

    private FollowAccountItemResponse toFollowAccountItem(
            Account account,
            Long currentAccountId
    ) {
        boolean daTheoDoi = false;

        if (currentAccountId != null && !currentAccountId.equals(account.getAccountID())) {
            daTheoDoi =
                    theoDoiAccountRepository
                            .existsByAccountDuocTheoDoi_AccountIDAndAccountTheoDoi_AccountID(
                                    account.getAccountID(),
                                    currentAccountId
                            );
        }

        return FollowAccountItemResponse.builder()
                .accountID(account.getAccountID())
                .username(account.getUsername())
                .tenHienThi(account.getTenHienThi())
                .avatar(account.getAvatar())
                .tieuSu(account.getTieuSu())
                .daTheoDoi(daTheoDoi)
                .build();
    }
}