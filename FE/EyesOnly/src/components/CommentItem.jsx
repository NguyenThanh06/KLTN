import { useTranslation } from "react-i18next";
import { I18N_KEYS } from "../i18n/key";
import {
    Heart,
    Reply,
    Share2,
    X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

const getAccountID = (user) => {
    if (!user) return "";
    return String(user.accountID || user.userID || user.id || user);
};

const getDisplayName = (user) => {
    if (!user || typeof user === "string" || typeof user === "number") {
        return "Bạn mèo bí ẩn";
    }

    return user.tenHienThi || user.username || "Bạn mèo bí ẩn";
};

const getUsername = (user) => {
    if (!user || typeof user === "string" || typeof user === "number") {
        return "";
    }

    return user.username ? `${user.username}` : "";
};

const getAvatar = (user) => {
    if (!user || typeof user === "string" || typeof user === "number") {
        return "/defaultAvatar/default_avatar_1.svg";
    }

    return user.avatar || "/defaultAvatar/default_avatar_1.svg";
};


const RELATIVE_TIME_UNITS = [
    { unit: "year", milliseconds: 365 * 24 * 60 * 60 * 1000 },
    { unit: "month", milliseconds: 30 * 24 * 60 * 60 * 1000 },
    { unit: "week", milliseconds: 7 * 24 * 60 * 60 * 1000 },
    { unit: "day", milliseconds: 24 * 60 * 60 * 1000 },
    { unit: "hour", milliseconds: 60 * 60 * 1000 },
    { unit: "minute", milliseconds: 60 * 1000 },
];

const getRelativeTimeInfo = (value) => {
    if (!value) {
        return {
            type: "recent",
            key: I18N_KEYS.POST_DETAIL.COMMON.postDetail_commentItemRelativeTime_recent,
        };
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return {
            type: "recent",
            key: I18N_KEYS.POST_DETAIL.COMMON.postDetail_commentItemRelativeTime_recent,
        };
    }

    const diff = date.getTime() - Date.now();
    const absDiff = Math.abs(diff);

    const matchedUnit = RELATIVE_TIME_UNITS.find(
        (item) => absDiff >= item.milliseconds
    );

    if (!matchedUnit) {
        return {
            type: "recent",
            key: I18N_KEYS.POST_DETAIL.COMMON.postDetail_commentItemRelativeTime_recent,
        };
    }

    return {
        type: "relative",
        value: Math.round(diff / matchedUnit.milliseconds),
        unit: matchedUnit.unit,
    };
};

export default function CommentItem({
    comment,
    level = 0,
    currentUser,
    postAuthorID,
    focusedCommentID,

    isExpanded = false,
    replies = [],
    replyCount = 0,
    hasMoreReplies = false,
    isFetchingReplies = false,

    onNavigateUser,
    onToggleLike,
    onShare,
    onDelete,
    onReply,
    onToggleReplies,
    onFetchNextReplyPage,
}) {
    const { t, i18n } = useTranslation();
    const commentTimeValue =
        comment.thoiGianDang || comment.ngayTao || comment.createdAt;

    const relativeTimeInfo = getRelativeTimeInfo(commentTimeValue);

    const displayRelativeTime =
        relativeTimeInfo.type === "recent"
            ? t(relativeTimeInfo.key)
            : new Intl.RelativeTimeFormat(i18n.resolvedLanguage || i18n.language, {
                numeric: "auto",
            }).format(relativeTimeInfo.value, relativeTimeInfo.unit);

    const isChild = level > 0;

    const commentID = String(comment.commentID);
    const author = comment.author || comment.nguoiVietDetail || comment.user || comment.nguoiViet;
    const authorID = getAccountID(author);
    const authorUsername = getUsername(author)
    const currentUserID = getAccountID(currentUser);

    const canDelete = Boolean(
        currentUserID &&
        (
            currentUserID === authorID ||
            currentUserID === String(postAuthorID)
        )
    );

    const isFocused = focusedCommentID && String(focusedCommentID) === commentID;
    const shouldShowReplyToggle = !isChild && replyCount > 0;

    return (
        <div className={isChild ? "ml-8 sm:ml-12" : ""}>
            <motion.article
                layout
                className={`
                    rounded-3xl p-3 shadow-sm transition
                    ${isFocused ? "bg-secondary-100" : "bg-bg-shade-50"}
                `}
            >
                <div className="flex items-start gap-3">
                    <button
                        type="button"
                        className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-main-bg shadow-sm"
                        onClick={() => onNavigateUser?.(authorID || authorUsername)}
                    >
                        <img
                            src={getAvatar(author)}
                            alt=""
                            className="h-full w-full object-cover"
                        />
                    </button>

                    <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <button
                                    type="button"
                                    className="block max-w-full truncate text-left font-ui text-sm font-bold text-main-text hover:underline"
                                    onClick={() => onNavigateUser?.(authorID || authorUsername)}
                                >
                                    {getDisplayName(author)}
                                </button>

                                {getUsername(author) && (
                                    <p className="truncate text-xs text-text-shade-400">
                                        @{authorUsername}
                                    </p>
                                )}
                            </div>

                            <span className="shrink-0 pt-0.5 text-xs text-text-shade-400">
                                {displayRelativeTime}
                            </span>
                        </div>

                        <p className="mt-2 wrap-break-word text-sm leading-6 text-main-text">
                            {comment.noiDung || comment.content}
                        </p>

                        <div className="mt-3 flex items-center justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-1">
                                <CommentActionButton
                                    onClick={() => onToggleLike?.(comment)}
                                    active={comment.isLikedByCurrentUser}
                                >
                                    <Heart
                                        size={15}
                                        className={comment.isLikedByCurrentUser ? "fill-current" : ""}
                                    />
                                    <span>{comment.likeCount || 0}</span>
                                </CommentActionButton>

                                <CommentActionButton onClick={() => onShare?.(comment)}>
                                    <Share2 size={15} />
                                    <span>{t(I18N_KEYS.POST_DETAIL.COMMON.postDetail_commentItemButton_share)}</span>
                                </CommentActionButton>

                                {!isChild && (
                                    <CommentActionButton onClick={() => onReply?.(comment)}>
                                        <Reply size={15} />
                                        <span>{t(I18N_KEYS.POST_DETAIL.COMMON.postDetail_commentItemButton_reply)}</span>
                                    </CommentActionButton>
                                )}
                            </div>

                            {canDelete && (
                                <button
                                    type="button"
                                    className="interaction-pop shrink-0 rounded-full p-1.5 text-text-shade-400 hover:bg-main-bg hover:text-main-text"
                                    onClick={() => onDelete?.(comment)}
                                    title={t(I18N_KEYS.POST_DETAIL.COMMON.postDetail_commentItemIconLabel_deleteComment)}
                                >
                                    <X size={15} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </motion.article>

            {shouldShowReplyToggle && !isExpanded && (
                <button
                    type="button"
                    className="interaction-pop ml-12 mt-2 rounded-full px-3 py-1 font-ui text-xs font-bold text-text-shade-400 hover:bg-bg-shade-50 hover:text-main-text"
                    onClick={() => onToggleReplies?.(comment)}
                >
                    {t(I18N_KEYS.POST_DETAIL.COMMON.postDetail_commentItemButton_showReplies)}
                </button>
            )}

            <AnimatePresence initial={false}>
                {!isChild && isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="overflow-hidden"
                    >
                        <div className="mt-2 flex flex-col gap-2">
                            {replies.map((reply) => (
                                <CommentItem
                                    key={reply.commentID}
                                    comment={reply}
                                    level={1}
                                    currentUser={currentUser}
                                    postAuthorID={postAuthorID}
                                    focusedCommentID={focusedCommentID}
                                    onNavigateUser={onNavigateUser}
                                    onToggleLike={onToggleLike}
                                    onShare={onShare}
                                    onDelete={onDelete}
                                />
                            ))}

                            {isFetchingReplies && (
                                <p className="ml-12 rounded-full bg-bg-shade-50 px-3 py-2 text-center font-ui text-xs text-text-shade-400">
                                    {t(I18N_KEYS.POST_DETAIL.COMMON.postDetail_commentItemText_loadingReplies)}
                                </p>
                            )}

                            <div className="ml-12 flex flex-wrap items-center gap-2">
                                {hasMoreReplies && (
                                    <button
                                        type="button"
                                        className="interaction-pop rounded-full bg-bg-shade-50 px-3 py-1 font-ui text-xs font-bold text-text-shade-400 hover:bg-bg-shade-100 hover:text-main-text"
                                        disabled={isFetchingReplies}
                                        onClick={() => onFetchNextReplyPage?.(comment)}
                                    >
                                        {t(I18N_KEYS.POST_DETAIL.COMMON.postDetail_commentItemButton_showMoreReplies)}
                                    </button>
                                )}

                                <button
                                    type="button"
                                    className="interaction-pop rounded-full px-3 py-1 font-ui text-xs font-bold text-text-shade-400 hover:bg-bg-shade-50 hover:text-main-text"
                                    onClick={() => onToggleReplies?.(comment)}
                                >
                                    {t(I18N_KEYS.POST_DETAIL.COMMON.postDetail_commentItemButton_collapseReplies)}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function CommentActionButton({
    children,
    active = false,
    onClick,
}) {
    return (
        <button
            type="button"
            className={`
                interaction-pop inline-flex items-center gap-1 rounded-full px-2 py-1 font-ui text-xs font-bold
                ${
                    active
                        ? "bg-primary text-main-bg"
                        : "text-text-shade-400 hover:bg-main-bg hover:text-main-text"
                }
            `}
            onClick={onClick}
        >
            {children}
        </button>
    );
}
