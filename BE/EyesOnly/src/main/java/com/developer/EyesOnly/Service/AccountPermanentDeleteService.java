package com.developer.EyesOnly.Service;

import com.developer.EyesOnly.Entity.Account;
import com.developer.EyesOnly.Entity.Tag;
import com.developer.EyesOnly.Repository.*;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AccountPermanentDeleteService {

    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final GanTheRepository ganTheRepository;
    private final TagRepository tagRepository;
    private final BaoCaoPostRepository baoCaoPostRepository;
    private final VerifyThanhCongRepository verifyThanhCongRepository;
    private final KTEOFileRepository kteoFileRepository;
    private final ThichPostRepository thichPostRepository;
    private final LuuPostRepository luuPostRepository;
    private final CommentRepository commentRepository;
    private final ThichCommentRepository thichCommentRepository;
    private final TheoDoiAccountRepository theoDoiAccountRepository;
    private final ChanAccountRepository chanAccountRepository;
    private final EntityManager entityManager;

    @Transactional
    public void permanentlyDeleteOneAccount(Long accountId, String reason) {

        Account account = userRepository.findById(accountId)
                .orElse(null);

        if (account == null) {
            return;
        }

        List<Long> accountIds = List.of(accountId);

        List<Long> postIds = postRepository.findPostIdsByTacGiaIds(accountIds);

        if (!postIds.isEmpty()) {
            /*
             * 1. Lấy tag trước để lát nữa giảm số lượng post.
             */
            List<Tag> tags = ganTheRepository.findTagsByPostIds(postIds);

            /*
             * 2. Xóa liên kết gắn thẻ.
             */
            ganTheRepository.deleteByPostIds(postIds);

            /*
             * 3. Giảm số lượng post của tag.
             */
            for (Tag tag : tags) {
                Long current = tag.getSoLuongPost() == null ? 0L : tag.getSoLuongPost();
                long newValue = current - 1;

                if (newValue < 1) {
                    tagRepository.delete(tag);
                } else {
                    tag.setSoLuongPost(newValue);
                    tagRepository.save(tag);
                }
            }

            /*
             * 4. Xóa báo cáo post.
             */
            baoCaoPostRepository.deleteByPostIds(postIds);

            /*
             * 5. Xóa verify thành công của KTEOFile.
             */
            verifyThanhCongRepository.deleteByPostIds(postIds);

            /*
             * 6. Xóa KTEOFile.
             */
            kteoFileRepository.deleteByPostIds(postIds);
        }

        /*
         * 7. Xóa thích post và lưu post.
         * Cần xóa cả:
         * - những tương tác trên post của account bị xóa
         * - những tương tác do account bị xóa tạo ra
         */
        if (!postIds.isEmpty()) {
            thichPostRepository.deleteByPostIdsOrAccountIds(postIds, accountIds);
            luuPostRepository.deleteByPostIdsOrAccountIds(postIds, accountIds);
        } else {
            thichPostRepository.deleteByPostIdsOrAccountIds(List.of(-1L), accountIds);
            luuPostRepository.deleteByPostIdsOrAccountIds(List.of(-1L), accountIds);
        }

        /*
         * 8. Tìm comment liên quan.
         */
        List<Long> commentIds;

        if (!postIds.isEmpty()) {
            commentIds = commentRepository.findCommentIdsRelatedToDeletingAccounts(postIds, accountIds);
        } else {
            commentIds = commentRepository.findCommentIdsRelatedToDeletingAccounts(List.of(-1L), accountIds);
        }

        /*
         * 9. Xóa thích comment trước.
         */
        if (!commentIds.isEmpty()) {
            thichCommentRepository.deleteByCommentIdsOrAccountIds(commentIds, accountIds);
        } else {
            thichCommentRepository.deleteByCommentIdsOrAccountIds(List.of(-1L), accountIds);
        }

        /*
         * 10. Xóa comment.
         */
        if (!commentIds.isEmpty()) {
            commentRepository.deleteByCommentIds(commentIds);
        }

        /*
         * 11. Xóa post.
         */
        if (!postIds.isEmpty()) {
            postRepository.deleteByPostIds(postIds);
        }

        /*
         * 12. Xóa quan hệ follow.
         */
        theoDoiAccountRepository.deleteByAccountIds(accountIds);

        /*
         * 13. Xóa quan hệ chặn.
         */
        chanAccountRepository.deleteByAccountIds(accountIds);

        /*
         * 14. Cuối cùng xóa account.
         */
        userRepository.delete(account);

        entityManager.flush();
        entityManager.clear();

        System.out.println(
                "[" + LocalDateTime.now() + "] SUCCESS: Đã xóa tài khoản "
                        + account.getUsername()
                        + ". Lý do: "
                        + reason
        );
    }
}