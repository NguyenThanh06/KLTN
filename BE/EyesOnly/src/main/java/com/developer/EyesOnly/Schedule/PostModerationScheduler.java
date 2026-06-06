package com.developer.EyesOnly.Schedule;

import com.developer.EyesOnly.Entity.DisplayRestriction;
import com.developer.EyesOnly.Repository.BaoCaoPostRepository;
import com.developer.EyesOnly.Repository.PostRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class PostModerationScheduler {

    private final BaoCaoPostRepository baoCaoPostRepository;

    private final PostRepository postRepository;

    @Scheduled(cron = "0 0 * * * *", zone = "Asia/Ho_Chi_Minh")
    @Transactional
    public void autoHideReportedPosts() {

        List<Long> postIds =
                baoCaoPostRepository
                        .findPostIdsHavingUniqueReportsGreaterThanOrEqual(25L);

        if (postIds.isEmpty()) {
            return;
        }
        postRepository.hidePosts(
                postIds,
                DisplayRestriction.TEMP_HIDDEN.getValue()
        );

        System.out.println(
                "Đã tạm ẩn " + postIds.size() + " bài viết"
        );
    }
}