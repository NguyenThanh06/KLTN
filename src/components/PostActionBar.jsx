import { useTranslation } from "react-i18next";
import { I18N_KEYS } from "../i18n/key";
import {
    Bookmark,
    Check,
    Heart,
    Share2,
} from "lucide-react";
import { FaCircleExclamation } from "react-icons/fa6";

export default function PostActionBar({
    isPostLiked = false,
    isPostSaved = false,
    isShareDone = false,
    isLikeLoading = false,
    isSaveLoading = false,
    onToggleLike,
    onToggleSave,
    onShare,
    onReport,
}) {

    const { t, i18n } = useTranslation();

    return (
        <div className="flex items-center justify-between gap-3 rounded-[1.75rem] bg-main-bg p-2 shadow-sm">
            <div className="flex items-center gap-2">
                <ActionIconButton
                    label={isPostLiked ? t(I18N_KEYS.POST_DETAIL.COMMON.postDetail_postActionBarIconLabel_unlike) : t(I18N_KEYS.POST_DETAIL.COMMON.postDetail_postActionBarIconLabel_like)}
                    active={isPostLiked}
                    disabled={isLikeLoading}
                    onClick={onToggleLike}
                >
                    <Heart
                        size={20}
                        className={isPostLiked ? "fill-current" : "text-sub-text"}
                    />
                </ActionIconButton>

                <ActionIconButton
                    label={isPostSaved ? t(I18N_KEYS.POST_DETAIL.COMMON.postDetail_postActionBarIconLabel_unsave) : t(I18N_KEYS.POST_DETAIL.COMMON.postDetail_postActionBarIconLabel_save)}
                    active={isPostSaved}
                    disabled={isSaveLoading}
                    onClick={onToggleSave}
                >
                    <Bookmark
                        size={20}
                        className={isPostSaved ? "fill-current" : "text-sub-text"}
                    />
                </ActionIconButton>

                <ActionIconButton
                    label={t(I18N_KEYS.POST_DETAIL.COMMON.postDetail_postActionBarIconLabel_copyLink)}
                    active={isShareDone}
                    onClick={onShare}
                >
                    {isShareDone ? <Check size={20} /> : <Share2 size={20} />}
                </ActionIconButton>
            </div>

            <ActionIconButton
                label={t(I18N_KEYS.POST_DETAIL.COMMON.postDetail_postActionBarIconLabel_report)}
                subtle
                onClick={onReport}
            >
                <FaCircleExclamation size={18} />
            </ActionIconButton>
            
        </div>
    );
}

function ActionIconButton({
    label,
    active = false,
    subtle = false,
    disabled = false,
    children,
    onClick,
}) {
    const activeClass = active
        ? "bg-primary text-main-bg"
        : subtle
            ? "bg-bg-shade-50 text-text-shade-400 hover:bg-bg-shade-100 hover:text-main-text"
            : "bg-bg-shade-50 text-main-text hover:bg-bg-shade-100";

    return (
        <button
            type="button"
            title={label}
            className={`
                interaction-pop rounded-full p-3 shadow-sm disabled:cursor-not-allowed disabled:opacity-60
                ${activeClass}
            `}
            disabled={disabled}
            onClick={onClick}
        >
            {children}
        </button>
    );
}