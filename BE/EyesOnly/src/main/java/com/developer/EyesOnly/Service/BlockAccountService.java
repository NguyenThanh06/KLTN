package com.developer.EyesOnly.Service;

import com.developer.EyesOnly.DTO.Response.BlockAccountResponse;
import com.developer.EyesOnly.DTO.Response.BlockedAccountItemResponse;
import com.developer.EyesOnly.DTO.Response.BlockedAccountListResponse;
import com.developer.EyesOnly.Entity.Account;
import com.developer.EyesOnly.Entity.ChanAccount;
import com.developer.EyesOnly.Entity.ChanAccountId;
import com.developer.EyesOnly.Exception.AppException;
import com.developer.EyesOnly.Exception.ErrorCode;
import com.developer.EyesOnly.Repository.ChanAccountRepository;
import com.developer.EyesOnly.Repository.LuuPostRepository;
import com.developer.EyesOnly.Repository.TheoDoiAccountRepository;
import com.developer.EyesOnly.Repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BlockAccountService {

    private final UserRepository userRepository;
    private final ChanAccountRepository chanAccountRepository;
    private final TheoDoiAccountRepository theoDoiAccountRepository;
    private final LuuPostRepository luuPostRepository;

    @Transactional
    public BlockAccountResponse blockAccount(Long currentAccountId, Long targetAccountId) {

        if (currentAccountId.equals(targetAccountId)) {
            throw new RuntimeException("Không thể tự chặn chính mình");
        }

        Account currentAccount = userRepository.findById(currentAccountId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        Account targetAccount = userRepository.findById(targetAccountId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        boolean daChan =
                chanAccountRepository.existsByAccountBiChan_AccountIDAndAccountChan_AccountID(
                        targetAccountId,
                        currentAccountId
                );

        if (!daChan) {
            ChanAccountId id = new ChanAccountId(currentAccountId, targetAccountId);

            ChanAccount chanAccount = ChanAccount.builder()
                    .id(id)
                    .accountChan(currentAccount)
                    .accountBiChan(targetAccount)
                    .build();

            chanAccountRepository.save(chanAccount);

            daChan = true;
        }

        /*
         * Khi chặn thì xóa liên kết theo dõi giữa 2 account theo cả 2 chiều.
         */
        theoDoiAccountRepository.deleteFollowRelationBetweenTwoAccounts(
                currentAccountId,
                targetAccountId
        );

        /*
         * Khi chặn thì xóa liên kết lưu post giữa 2 account.
         * Ví dụ:
         * - A đã lưu bài của B
         * - B đã lưu bài của A
         */
        luuPostRepository.deleteSavedPostsBetweenTwoAccounts(
                currentAccountId,
                targetAccountId
        );

        return BlockAccountResponse.builder()
                .targetAccountId(targetAccountId)
                .daChan(daChan)
                .message("Chặn Account thành công")
                .build();
    }

    @Transactional
    public BlockAccountResponse unblockAccount(Long currentAccountId, Long targetAccountId) {

        if (currentAccountId.equals(targetAccountId)) {
            throw new RuntimeException("Không thể bỏ chặn chính mình");
        }

        userRepository.findById(currentAccountId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        userRepository.findById(targetAccountId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        boolean daChan =
                chanAccountRepository.existsByAccountBiChan_AccountIDAndAccountChan_AccountID(
                        targetAccountId,
                        currentAccountId
                );

        if (daChan) {
            chanAccountRepository.deleteByAccountBiChan_AccountIDAndAccountChan_AccountID(
                    targetAccountId,
                    currentAccountId
            );

            daChan = false;
        }

        return BlockAccountResponse.builder()
                .targetAccountId(targetAccountId)
                .daChan(daChan)
                .message("Bỏ chặn Account thành công")
                .build();
    }

    @Transactional(readOnly = true)
    public BlockedAccountListResponse getBlockedAccounts(
            Long currentAccountId,
            int page,
            int size
    ) {
        userRepository.findById(currentAccountId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        Pageable pageable = createPageable(page, size);

        Page<Account> blockedPage =
                chanAccountRepository.findBlockedAccountsByAccountChanId(
                        currentAccountId,
                        pageable
                );

        List<BlockedAccountItemResponse> content = blockedPage.getContent()
                .stream()
                .map(this::toBlockedAccountItemResponse)
                .toList();

        String message = null;

        if (blockedPage.isEmpty()) {
            message = "Bạn chưa chặn Account nào";
        }

        return BlockedAccountListResponse.builder()
                .message(message)
                .content(content)
                .page(blockedPage.getNumber())
                .size(blockedPage.getSize())
                .totalElements(blockedPage.getTotalElements())
                .totalPages(blockedPage.getTotalPages())
                .first(blockedPage.isFirst())
                .last(blockedPage.isLast())
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

    private BlockedAccountItemResponse toBlockedAccountItemResponse(Account account) {
        return BlockedAccountItemResponse.builder()
                .accountID(account.getAccountID())
                .username(account.getUsername())
                .tenHienThi(account.getTenHienThi())
                .avatar(account.getAvatar())
                .tieuSu(account.getTieuSu())
                .build();
    }
}