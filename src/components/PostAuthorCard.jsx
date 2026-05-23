import { useTranslation } from "react-i18next";
import { I18N_KEYS } from "../i18n/key";

import Button from "./Button";

export default function PostAuthorCard({
    author,
    variant = "follow",
    isCurrentUserAuthor = false,
    isFollowingAuthor = false,
    isFollowLoading = false,
    onNavigateAuthor,
    onToggleFollow,
}) {
    const { t } = useTranslation();

    const displayName = author?.tenHienThi || author?.username || "Người dùng cute hột mít";
    const username = author?.username ? `@${author.username}` : "@nguoidung";
    const avatar = author?.avatar || "/defaultAvatar/default_avatar_1.svg";
    const bio = author?.tieuSu?.trim();

    const shouldShowBio = variant === "bio";
    const shouldShowFollowButton = variant === "follow" && !isCurrentUserAuthor;

    return (
        <div className="flex h-full flex-col rounded-[1.75rem] bg-main-bg p-3 shadow-sm">
            <button
                type="button"
                className="
                    interaction-pop flex w-full cursor-pointer items-center gap-3
                    rounded-[1.35rem] p-1 text-left hover:bg-bg-shade-50
                "
                onClick={onNavigateAuthor}
            >
                <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-bg-shade-100 shadow-sm">
                    <img
                        src={avatar}
                        alt=""
                        className="h-full w-full object-cover"
                    />
                </div>

                <div className="min-w-0">
                    <p className="truncate font-ui text-sm font-bold text-main-text">
                        {displayName}
                    </p>

                    <p className="truncate text-xs text-text-shade-400">
                        {username}
                    </p>
                </div>
            </button>

            {shouldShowBio && (
                <div className="mt-3 min-h-[5.5rem] rounded-[1.35rem] bg-bg-shade-200/25 px-4 py-3">
                    <p
                        className={`
                            line-clamp-4 text-sm leading-5 text-text-shade-400
                            ${bio ? "" : "text-text-shade-300"}
                        `}
                    >
                        {bio || "Người dùng này chưa viết tiểu sử."}
                    </p>
                </div>
            )}

            {shouldShowFollowButton && (
                <Button
                    type="button"
                    variant={isFollowingAuthor ? "outline" : "primary"}
                    size="full"
                    className="interaction-pop mt-3 rounded-full"
                    disabled={isFollowLoading}
                    onClick={onToggleFollow}
                >
                    {isFollowLoading
                        ? t(I18N_KEYS.POST_DETAIL.COMMON.postDetail_postAuthorCardButton_loading)
                        : isFollowingAuthor
                            ? t(I18N_KEYS.POST_DETAIL.COMMON.postDetail_postAuthorCardButton_unfollow)
                            : t(I18N_KEYS.POST_DETAIL.COMMON.postDetail_postAuthorCardButton_follow)}
                </Button>
            )}
        </div>
    );
}