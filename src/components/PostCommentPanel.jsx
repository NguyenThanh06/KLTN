import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { I18N_KEYS } from "../i18n/key";

import CommentItem from "./CommentItem";

export default function PostCommentPanel({
    comments = [],
    currentUser,
    postAuthorID,
    focusedCommentID,

    hasMoreComments = false,
    isFetchingMoreComments = false,

    expandedCommentIDs,
    visibleRepliesByCommentID,
    replyCountByCommentID,
    hasMoreRepliesByCommentID,
    isFetchingRepliesByCommentID,

    onFetchNextCommentPage,
    onToggleReplies,
    onFetchNextReplyPage,
    onToggleCommentLike,
    onShareComment,
    onDeleteComment,
    onReplyComment,
    onNavigateUser,
}) {
    const { t, i18n } = useTranslation();

    const scrollRootRef = useRef(null);
    const sentinelRef = useRef(null);

    useEffect(() => {
        const scrollRoot = scrollRootRef.current;
        const sentinel = sentinelRef.current;

        if (!scrollRoot || !sentinel) return undefined;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (
                    entry.isIntersecting &&
                    hasMoreComments &&
                    !isFetchingMoreComments
                ) {
                    onFetchNextCommentPage?.();
                }
            },
            {
                root: scrollRoot,
                rootMargin: "160px 0px",
                threshold: 0.01,
            }
        );

        observer.observe(sentinel);

        return () => {
            observer.disconnect();
        };
    }, [
        hasMoreComments,
        isFetchingMoreComments,
        onFetchNextCommentPage,
    ]);

    return (
        <section className="flex min-h-0 flex-1 flex-col rounded-[1.75rem] bg-main-bg p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="font-ui text-base font-bold text-main-text">
                    {t(I18N_KEYS.POST_DETAIL.COMMON.postDetail_postCommentPanelTitle_comments)}
                </h2>

                {!!comments.length && (
                    <span className="rounded-full bg-bg-shade-50 px-3 py-1 font-ui text-xs font-bold text-text-shade-400">
                        {comments.length} {t(I18N_KEYS.POST_DETAIL.COMMON.postDetail_postCommentPanelInfo_isShowing)}
                    </span>
                )}
            </div>

            <div
                ref={scrollRootRef}
                className="flex max-h-[70vh] min-h-[260px] flex-col gap-3 overflow-y-auto pr-1"
            >
                {comments.length ? (
                    comments.map((comment) => {
                        const commentID = String(comment.commentID);

                        return (
                            <CommentItem
                                key={commentID}
                                comment={comment}
                                currentUser={currentUser}
                                postAuthorID={postAuthorID}
                                focusedCommentID={focusedCommentID}

                                isExpanded={expandedCommentIDs?.has(commentID)}
                                replies={visibleRepliesByCommentID?.[commentID] || []}
                                replyCount={replyCountByCommentID?.[commentID] || 0}
                                hasMoreReplies={Boolean(hasMoreRepliesByCommentID?.[commentID])}
                                isFetchingReplies={Boolean(isFetchingRepliesByCommentID?.[commentID])}

                                onNavigateUser={onNavigateUser}
                                onToggleLike={onToggleCommentLike}
                                onShare={onShareComment}
                                onDelete={onDeleteComment}
                                onReply={onReplyComment}
                                onToggleReplies={onToggleReplies}
                                onFetchNextReplyPage={onFetchNextReplyPage}
                            />
                        );
                    })
                ) : (
                    <div className="flex flex-1 items-center justify-center rounded-[1.5rem] bg-bg-shade-50 px-6 py-10 text-center">
                        <p className="font-ui text-sm font-bold text-text-shade-400">
                            {t(I18N_KEYS.POST_DETAIL.COMMON.postDetail_postCommentPanelText_noComment)}
                        </p>
                    </div>
                )}

                <div ref={sentinelRef} className="h-8 shrink-0" />

                {isFetchingMoreComments && (
                    <p className="py-2 text-center font-ui text-xs font-bold text-text-shade-400">
                        {t(I18N_KEYS.POST_DETAIL.COMMON.postDetail_postCommentPanelText_loadingComment)}
                    </p>
                )}

                {!hasMoreComments && comments.length > 0 && (
                    <p className="py-2 text-center font-ui text-xs font-bold text-text-shade-400">
                        {t(I18N_KEYS.POST_DETAIL.COMMON.postDetail_postCommentPanelText_noMoreComment)}
                    </p>
                )}
            </div>
        </section>
    );
}