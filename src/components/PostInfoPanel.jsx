import { useTranslation } from "react-i18next";
import { I18N_KEYS } from "../i18n/key";
import { formatDateByLanguage } from "../utils/dateFormat";

import {
    CalendarDays,
    Edit3,
    Eye,
    Heart,
    MessageCircle,
    WandSparkles,
} from "lucide-react";

const getDateLocale = (language) => {
    if (language?.startsWith("vi")) return "vi-VN";
    if (language?.startsWith("en")) return "en-US";
    if (language?.startsWith("ja")) return "ja-JP";
    if (language?.startsWith("es")) return "es-ES";

    return "vi-VN";
};

const formatNumber = (value, language) => {
    return new Intl.NumberFormat(getDateLocale(language)).format(Number(value || 0));
};

const getRestrictionLabel = (hanCheHienThi) => {
    if (Number(hanCheHienThi) === 1) return "Nội dung 18+";
    if (Number(hanCheHienThi) === 2) return "Nội dung bạo lực / máu me";

    return "";
};

export default function PostInfoPanel({
    post,
    likeMoodText,
    commentCount = 0,
    language = "vi",
    isCurrentUserAuthor = false,
    onEditPost,
    onTagClick,
}) {
    const { t, i18n } = useTranslation();

    const createdDateAtText =
            formatDateByLanguage(post?.ngayDang, i18n.language) ||
            t(I18N_KEYS.COMMON.common_dateFormat_unknownTime);

    const restrictionLabel = getRestrictionLabel(post?.hanCheHienThi);

    return (
        <div className="flex flex-col gap-3 rounded-[1.75rem] bg-main-bg p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2 rounded-full bg-bg-shade-50 px-3 py-2 font-ui text-xs font-bold text-text-shade-500">
                    <CalendarDays size={15} className="shrink-0" />
                    <span className="truncate">
                        {createdDateAtText}
                    </span>
                </div>

                {isCurrentUserAuthor && (
                    <button
                        type="button"
                        className="interaction-pop rounded-full bg-bg-shade-50 p-2 text-main-text hover:bg-primary hover:text-main-bg"
                        onClick={onEditPost}
                        title={t(I18N_KEYS.POST_DETAIL.COMMON.postDetail_postInfoPanelIconLable_editPost)}
                    >
                        <Edit3 size={17} />
                    </button>
                )}
            </div>

            <div className="space-y-2">
                <h1 className="text-xl font-bold leading-snug text-main-text sm:text-2xl">
                    {post?.tieuDe || t(I18N_KEYS.POST_DETAIL.COMMON.postDetail_postInfoPanelTitle_titleAlt)}
                </h1>

                {post?.moTa && (
                    <p className="whitespace-pre-line text-sm leading-6 text-text-shade-500">
                        {post.moTa}
                    </p>
                )}
            </div>

            {!!post?.lstGanThe?.length && (
                <div className="flex flex-wrap gap-2">
                    {post.lstGanThe.map((tag) => (
                        <button
                            key={tag}
                            type="button"
                            className="interaction-pop rounded-full bg-secondary px-3 py-1 font-ui text-xs font-bold text-main-text cursor-pointer hover:bg-secondary-600"
                            onClick={() => onTagClick?.(tag)}
                        >
                            #{tag}
                        </button>
                    ))}
                </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <SmallInfoPill
                        icon={<Eye size={15} />}
                        text={formatNumber(post?.luotXem, language)}
                    />

                    <SmallInfoPill
                        icon={<Heart size={15} />}
                        text={t(likeMoodText)}
                        className="max-w-full sm:max-w-60"
                    />
                </div>

                <SmallInfoPill
                    icon={<MessageCircle size={15} />}
                    text={formatNumber(commentCount, language)}
                />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
                {post?.sanPhamAI ? (
                    <SmallInfoPill
                        icon={<WandSparkles size={15} />}
                        text={t(I18N_KEYS.POST_DETAIL.COMMON.postDetail_postInfoPanelText_sanPhamAI)}
                    />
                ) : (
                    <span />
                )}

                {restrictionLabel && (
                    <span className="rounded-full bg-accent-200 px-3 py-1 font-ui text-xs font-bold text-main-text">
                        {restrictionLabel}
                    </span>
                )}
            </div>
        </div>
    );
}

function SmallInfoPill({ icon, text, className = "" }) {
    return (
        <div
            className={`
                flex min-w-0 items-center gap-1.5 rounded-full bg-bg-shade-50 px-3 py-1.5 font-ui text-xs font-bold text-main-text
                ${className}
            `}
        >
            <span className="shrink-0">
                {icon}
            </span>

            <span className="truncate">
                {text}
            </span>
        </div>
    );
}
