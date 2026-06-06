import { useTranslation } from "react-i18next";
import { I18N_KEYS } from "../i18n/key";
import { formatDateByLanguage } from "../utils/dateFormat";

import { CalendarDays, Mail, ShieldAlert } from "lucide-react";
import Button from "./Button";

const formatNumber = (value = 0) => {
    return new Intl.NumberFormat("vi-VN").format(Number(value || 0));
};


const getDisabledDayCount = (disabledDate) => {
    if (!disabledDate) return null;

    const date = new Date(disabledDate);
    if (Number.isNaN(date.getTime())) return null;

    const diff = Date.now() - date.getTime();
    const days = Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));

    return days;
};

export default function UserProfileContent({
    account,
    isCurrentAccount = false,
    isAuthenticated = false,
    isFollowingAccount = false,
    isFollowLoading = false,
    onToggleFollow,
    onOpenFollowers,
    onOpenFollowing,
    onOpenSavedPosts,
}) {
    const { t, i18n } = useTranslation();

    const joinedDateAtText =
            formatDateByLanguage(account?.ngayThamGia || account?.ngayTaoTaiKhoan, i18n.language) ||
            t(I18N_KEYS.COMMON.common_dateFormat_unknownTime);

    const displayName =
        account?.tenHienThi || account?.username || "Người dùng cute hột mít";

    const username = account?.username ? `@${account.username}` : "@nguoidung";
    const avatar = account?.avatar || "/defaultAvatar/default_avatar_1.svg";
    const bio = account?.tieuSu?.trim();
    const followerCount = Number(account?.soNguoiTheoDoi || 0);
    const followingCount = Number(account?.soNguoiDangTheoDoi || 0);
    const disabledDayCount = getDisabledDayCount(account?.ngayVoHieuHoa);

    return (
        <div className="grid gap-5 md:grid-cols-[8rem_minmax(0,1fr)] md:items-start lg:grid-cols-[9rem_minmax(0,1fr)]">
            <div className="flex justify-center md:justify-center">
                <div className="h-28 w-28 overflow-hidden rounded-full bg-bg-shade-100 shadow-sm ring-4 ring-bg-shade-50 sm:h-32 sm:w-32 lg:h-36 lg:w-36">
                    <img
                        src={avatar}
                        alt=""
                        className="h-full w-full object-cover"
                    />
                </div>
            </div>

            <div className="flex min-w-0 w-full flex-col items-center space-y-3 text-center md:items-start md:text-left">
                <div className="min-w-0 w-full">
                    <h2 className="truncate font-heading text-2xl font-bold text-main-text sm:text-3xl">
                        {displayName}
                    </h2>

                    <p className="mt-0.5 truncate font-ui text-sm text-text-shade-600">
                        {username}
                    </p>
                </div>

                <div className="flex w-full flex-wrap items-center justify-center gap-2 font-ui text-xs text-text-shade-400 md:justify-start">
                    {isCurrentAccount && account?.email && (
                        <div className="flex max-w-full items-center gap-2 rounded-full bg-bg-shade-50 px-3 py-1.5">
                            <Mail size={16} className="shrink-0" />
                            <span className="truncate">{account.email}</span>
                        </div>
                    )}

                    <div className="flex max-w-full items-center gap-2 rounded-full bg-bg-shade-50 px-3 py-1.5">
                        <CalendarDays size={16} className="shrink-0" />
                        <span>
                            {t(I18N_KEYS.USER_DETAIL.COMMON.userDetail_userProfileContentText_joinedSince, {ngayTaoTaiKhoan: joinedDateAtText})}
                        </span>
                    </div>
                </div>

                {bio && (
                    <p
                        className={`
                            w-full max-w-sm rounded-3xl bg-bg-shade-50 px-4 py-3 font-body text-sm leading-6
                            ${bio ? "text-main-text" : "text-text-shade-300"}
                        `}
                    >
                        {bio || ""}
                    </p>
                )}

                <div className="flex w-full flex-wrap items-center justify-center gap-1.5 font-ui text-sm text-main-text md:justify-start">
                    <button
                        type="button"
                        className="interaction-pop rounded-full px-2 py-1 font-bold hover:bg-bg-shade-50"
                        onClick={onOpenFollowers}
                    >
                        {t(I18N_KEYS.USER_DETAIL.COMMON.userDetail_userProfileContentText_follower, {followerCount: formatNumber(followerCount)})}
                    </button>

                    <span className="text-text-shade-300">•</span>

                    <button
                        type="button"
                        className="interaction-pop rounded-full px-2 py-1 font-bold hover:bg-bg-shade-50"
                        onClick={onOpenFollowing}
                    >
                        {t(I18N_KEYS.USER_DETAIL.COMMON.userDetail_userProfileContentText_following, {followingCount: formatNumber(followingCount)})}
                    </button>
                </div>

                {isCurrentAccount && account?.daVoHieuHoa && (
                    <div className="flex items-start gap-3 rounded-4xl bg-accent-100 border-2 border-accent-300 px-5 py-4 text-left text-sm text-main-text">
                        <ShieldAlert
                            size={20}
                            className="mt-0.5 shrink-0 text-accent-700"
                        />

                        <p className="font-ui font-bold leading-6 text-accent-700">
                            {disabledDayCount === null
                                ? t(I18N_KEYS.USER_DETAIL.COMMON.userDetail_userProfileContentText_disabledDayCountAlt)
                                : t(I18N_KEYS.USER_DETAIL.COMMON.userDetail_userProfileContentText_disabledDayCount, {disabledDayCount: disabledDayCount})
                            }
                        </p>
                    </div>
                )}

                {isCurrentAccount ? (
                    <div className="flex h-10 w-full justify-center md:justify-start">
                        <Button
                            type="button"
                            variant="outline"
                            className="interaction-pop h-10 min-w-44 rounded-full px-7 py-0"
                            onClick={onOpenSavedPosts}
                        >
                            {t(I18N_KEYS.USER_DETAIL.COMMON.userDetail_userProfileContentButton_seeSavedPost)}
                        </Button>
                    </div>
                ) : (
                    <div className="flex h-10 w-full justify-center md:justify-start">
                        <Button
                            type="button"
                            variant={isFollowingAccount ? "outline" : "primary"}
                            className="interaction-pop h-10 min-w-36 rounded-full px-7 py-0"
                            disabled={isFollowLoading}
                            onClick={onToggleFollow}
                        >
                            {isFollowLoading
                                ? t(I18N_KEYS.USER_DETAIL.COMMON.userDetail_userProfileContentButton_loading)
                                : isFollowingAccount && isAuthenticated
                                ? t(I18N_KEYS.USER_DETAIL.COMMON.userDetail_userProfileContentButton_unfollow)
                                : t(I18N_KEYS.USER_DETAIL.COMMON.userDetail_userProfileContentButton_follow)
                            }
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
