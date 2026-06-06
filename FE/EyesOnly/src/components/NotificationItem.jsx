import { Trans, useTranslation } from "react-i18next";
import { I18N_KEYS } from "../i18n/key";
import { Link } from "react-router-dom";

import { HiUserPlus, HiMiniChatBubbleLeftEllipsis, HiMiniChatBubbleLeftRight  } from "react-icons/hi2";
import { FaHeartCrack } from "react-icons/fa6";

const RELATIVE_TIME_UNITS = [
    { unit: "year", seconds: 60 * 60 * 24 * 365 },
    { unit: "month", seconds: 60 * 60 * 24 * 30 },
    { unit: "week", seconds: 60 * 60 * 24 * 7 },
    { unit: "day", seconds: 60 * 60 * 24 },
    { unit: "hour", seconds: 60 * 60 },
    { unit: "minute", seconds: 60 },
];

function getRelativeNotificationTime(isoTime) {
    if (!isoTime) {
        return {
            type: "recent",
            key: I18N_KEYS.COMMON.common_notificationRelativeTime_recent,
        };
    }

    const date = new Date(isoTime);

    if (Number.isNaN(date.getTime())) {
        return {
            type: "recent",
            key: I18N_KEYS.COMMON.common_notificationRelativeTime_recent,
        };
    }

    const now = new Date();
    const diffInSeconds = Math.floor((date.getTime() - now.getTime()) / 1000);
    const absDiffInSeconds = Math.abs(diffInSeconds);

    const matchedUnit = RELATIVE_TIME_UNITS.find(
        (item) => absDiffInSeconds >= item.seconds
    );

    if (!matchedUnit) {
        return {
            type: "recent",
            key: I18N_KEYS.COMMON.common_notificationRelativeTime_recent,
        };
    }

    const value = Math.round(diffInSeconds / matchedUnit.seconds);

    return {
        type: "relative",
        value,
        unit: matchedUnit.unit,
    };
}


const MAX_NOTICE_CONTENT_LENGTH = 20;

const NOTIFICATION_TYPE = {
    "0": "theoDoi",
    "1": "cmt",
    "2": "cmtRep",
    "3": "baoCao",
};

const NOTIFICATION_CONFIG = {
    theoDoi: {
        emptyContent: I18N_KEYS.COMMON.common_notificationAltText_typeTheoDoi,
        icon: <HiUserPlus />,
        titleKey: I18N_KEYS.COMMON.common_notificationTitle_typeTheoDoi,
        descKey: I18N_KEYS.COMMON.common_notificationDesc_typeTheoDoi,
    },
    cmt: {
        emptyContent: I18N_KEYS.COMMON.common_notificationAltText_typeCmt,
        icon: <HiMiniChatBubbleLeftEllipsis />,
        titleKey: I18N_KEYS.COMMON.common_notificationTitle_typeCmt,
        descKey: I18N_KEYS.COMMON.common_notificationDesc_typeCmt,
    },
    cmtRep: {
        emptyContent: I18N_KEYS.COMMON.common_notificationAltText_typeCmtRep,
        icon: <HiMiniChatBubbleLeftRight />,
        titleKey: I18N_KEYS.COMMON.common_notificationTitle_typeCmtRep,
        descKey: I18N_KEYS.COMMON.common_notificationDesc_typeCmtRep,
    },
    baoCao: {
        emptyContent: I18N_KEYS.COMMON.common_notificationAltText_typeBaoCao,
        icon: <FaHeartCrack />,
        titleKey: I18N_KEYS.COMMON.common_notificationTitle_typeBaoCao,
        descKey: I18N_KEYS.COMMON.common_notificationDesc_typeBaoCao,
    },
};

function getDisplayNoiDung(noiDung, notificationType, t) {
    const rawContent = typeof noiDung === "string" ? noiDung.trim() : "";
    const emptyContentKey = NOTIFICATION_CONFIG[notificationType]?.emptyContent;

    if (!rawContent) {
        return t(emptyContentKey, { defaultValue: "???" });
    }

    if (rawContent.length > MAX_NOTICE_CONTENT_LENGTH) {
        return `${rawContent.slice(0, MAX_NOTICE_CONTENT_LENGTH)}...`;
    }

    return rawContent;
}


export default function NotificationItem({ 
    loaiThongBao,       //0-3
    noiDung,
    thoiDiemThongBao, 
    daDoc,
    link,
    onOpen,
}) {

    const { t, i18n } = useTranslation();

    const notificationType = NOTIFICATION_TYPE[String(loaiThongBao)] || "cmt";
    const notificationConfig = NOTIFICATION_CONFIG[notificationType];
    const displayNoiDung = getDisplayNoiDung(noiDung, notificationType, t);
    const relativeTimeInfo = getRelativeNotificationTime(thoiDiemThongBao);

    const displayTime =
        relativeTimeInfo.type === "recent"
            ? t(relativeTimeInfo.key)
            : new Intl.RelativeTimeFormat(i18n.language, {
                numeric: "auto",
            }).format(relativeTimeInfo.value, relativeTimeInfo.unit);

    return (
        <Link to={link} onClick={onOpen} className="flex items-start gap-3 p-3 my-2 bg-main-bg hover:bg-primary-100 rounded-xl cursor-pointer transition-colors ">
            {/* Icon lớn bên trái */}
            <div className="shrink-0 w-10 h-10 bg-primary-200 rounded-full flex items-center justify-center text-primary-600 text-lg">
                {notificationConfig.icon}
            </div>

            {/* Nội dung ở giữa */}
            <div className="grow min-w-0">
                <div className="space-y-1">
                    <h4 className={`text-sm font-semibold truncate leading-tight ${daDoc ? 'text-main-text' : 'text-sub-text'}`}>
                        {t(notificationConfig.titleKey)}
                    </h4>

                    <span className="block text-[10px] leading-none text-gray-400/70 whitespace-nowrap">
                        {displayTime}
                    </span>
                </div>

                <p className="mt-2 text-xs text-text-shade-600 leading-relaxed ">
                    <Trans
                        i18nKey={notificationConfig.descKey}
                        values={{ noiDung: displayNoiDung }}
                        components={{
                            bold: <span className="font-semibold text-main-text" />,
                        }}
                    />
                </p>
            </div>

            {/* Trạng thái chưa đọc bên phải */}
                <div className="shrink-0 mt-1.5">
                    {daDoc? 
                        (
                            <></>
                        ):
                        (
                            <div className="w-1.5 h-1.5 bg-accent-500 rounded-full"></div>
                        )
                    }
                </div>
        </Link>
    );
}
