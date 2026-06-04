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

    // Dùng cho variant="sideButton"
    sideButtonConfig = null,
    disableNavigate = false,
}) {
    const { t } = useTranslation();

    const displayName =
        author?.tenHienThi || author?.username || "Người dùng cute hột mít";
    const username = author?.username ? `@${author.username}` : "@nguoidung";
    const avatar = author?.avatar || "/defaultAvatar/default_avatar_1.svg";
    const bio = author?.tieuSu?.trim();

    const isSimpleVariant = variant === "simple";
    const shouldShowBio = variant === "bio";
    const shouldShowFollowButton = variant === "follow" && !isCurrentUserAuthor;
    const shouldShowSideButton = variant === "sideButton" && sideButtonConfig;

    const shouldDisableNavigate =
        disableNavigate || (shouldShowSideButton && author?.isBlocked);

    const handleNavigateAuthor = () => {
        if (shouldDisableNavigate) return;
        onNavigateAuthor?.();
    };

    const renderAuthorMainInfo = () => {
        return (
            <button
                type="button"
                disabled={shouldDisableNavigate}
                className={`
                    interaction-pop flex min-w-0 flex-1 items-center gap-3 text-left transition-all
                    ${isSimpleVariant ? "rounded-3xl p-2" : "rounded-[1.35rem] p-1"}
                    ${
                        shouldDisableNavigate
                            ? "cursor-default opacity-90"
                            : "cursor-pointer hover:bg-bg-shade-50"
                    }
                `}
                onClick={handleNavigateAuthor}
            >
                <div
                    className={`
                        shrink-0 overflow-hidden rounded-full bg-bg-shade-100 shadow-sm
                        ${isSimpleVariant ? "h-12 w-12" : "h-11 w-11"}
                    `}
                >
                    <img
                        src={avatar}
                        alt=""
                        className="h-full w-full object-cover"
                    />
                </div>

                <div className="min-w-0">
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <p className="truncate font-ui text-sm font-bold text-main-text">
                            {displayName}
                        </p>

                        {shouldShowSideButton && sideButtonConfig.badgeText && (
                            <span
                                className={`
                                    rounded-full px-2.5 py-0.5 font-ui text-[0.68rem] font-bold
                                    ${
                                        sideButtonConfig.badgeTone === "active"
                                            ? "bg-accent-200 text-main-text"
                                            : "bg-bg-shade-100 text-text-shade-300"
                                    }
                                `}
                            >
                                {t(sideButtonConfig.badgeText)}
                            </span>
                        )}
                    </div>

                    <p className="truncate text-xs text-text-shade-400">
                        {username}
                    </p>
                </div>
            </button>
        );
    };

    return (
        <div
            className={`
                flex h-full flex-col bg-main-bg shadow-sm
                ${isSimpleVariant ? "rounded-3xl p-2" : "rounded-[1.75rem] p-3"}
            `}
        >
            {shouldShowSideButton ? (
                <div className="flex w-full items-center gap-3">
                    {renderAuthorMainInfo()}

                    <Button
                        type="button"
                        variant={sideButtonConfig.variant || "primary"}
                        className={`
                            shrink-0 rounded-full px-3 sm:px-4
                            ${sideButtonConfig.className || ""}
                        `}
                        disabled={sideButtonConfig.disabled}
                        onClick={sideButtonConfig.onClick}
                    >
                        {t(sideButtonConfig.disabled && sideButtonConfig.loadingText
                            ? sideButtonConfig.loadingText
                            : sideButtonConfig.text)}
                    </Button>
                </div>
            ) : (
                renderAuthorMainInfo()
            )}

            {shouldShowBio && (
                <div className="mt-3 min-h-[5.5rem] rounded-[1.35rem] bg-bg-shade-200/25 px-4 py-3">
                    <p
                        className={`
                            line-clamp-4 text-sm leading-5 text-text-shade-400
                            ${bio ? "" : "text-text-shade-300"}
                        `}
                    >
                        {bio || ""}
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
                        ? t(
                              I18N_KEYS.POST_DETAIL.COMMON
                                  .postDetail_postAuthorCardButton_loading
                          )
                        : isFollowingAuthor
                          ? t(
                                I18N_KEYS.POST_DETAIL.COMMON
                                    .postDetail_postAuthorCardButton_unfollow
                            )
                          : t(
                                I18N_KEYS.POST_DETAIL.COMMON
                                    .postDetail_postAuthorCardButton_follow
                            )}
                </Button>
            )}
        </div>
    );
}