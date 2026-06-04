import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { I18N_KEYS } from "../i18n/key";
import { notificationApi } from "../api/notificationApi";
import NotificationItem from "./NotificationItem";

import { GoBellFill } from "react-icons/go";

const PAGE_SIZE = 10;

export default function NotificationDropdown({
    isOpen,
    isExiting,
    onToggle,
}) {
    const { t } = useTranslation();
    const scrollBoxRef = useRef(null);

    const [allNotices, setAllNotices] = useState([]);
    const [page, setPage] = useState(0);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [hasLoaded, setHasLoaded] = useState(false);

    const hasUnreadNotice = useMemo(() => {
        return allNotices.some((notice) => !notice.daDoc);
    }, [allNotices]);

    const normalizeNotice = (notice, index) => ({
        id: notice.id ?? notice.thongBaoID ?? notice.thongBaoId ?? notice.notificationId ?? `${Date.now()}-${index}`,
        loaiThongBao: String(notice.loaiThongBao ?? ""),
        noiDung: notice.noiDung,
        thoiDiemThongBao: notice.thoiDiemThongBao,
        daDoc: Boolean(notice.daDoc),
        link: notice.link || "#",
    });

    const loadMoreNotices = useCallback(async ({ reset = false } = {}) => {
        if (isLoadingMore || (!reset && !hasMore)) return;

        try {
            setIsLoadingMore(true);

            const nextPage = reset ? 0 : page;
            const response = await notificationApi.getMyNotifications({
                page: nextPage,
                size: PAGE_SIZE,
            });

            const responseData = response.data?.result ?? response.data ?? {};
            const newNoticesRaw = responseData?.content ?? [];
            const newNotices = newNoticesRaw.map(normalizeNotice);

            setAllNotices((prevNotices) =>
                reset ? newNotices : [...prevNotices, ...newNotices]
            );
            setPage(nextPage + 1);
            setHasMore(!responseData?.last && newNotices.length >= PAGE_SIZE);
            setHasLoaded(true);
        } catch (error) {
            console.error("Khong tai them thong bao duoc:", error);
            setHasMore(false);
            setHasLoaded(true);
        } finally {
            setIsLoadingMore(false);
        }
    }, [hasMore, isLoadingMore, page]);

    useEffect(() => {
        if (!isOpen || hasLoaded) return;

        const loadTimer = window.setTimeout(() => {
            loadMoreNotices({ reset: true });
        }, 0);

        return () => window.clearTimeout(loadTimer);
    }, [hasLoaded, isOpen, loadMoreNotices]);

    const handleNoticeOpen = async (noticeID) => {
        const targetNotice = allNotices.find((notice) => notice.id === noticeID);

        if (!targetNotice || targetNotice.daDoc) return;

        setAllNotices((prevNotices) =>
            prevNotices.map((notice) =>
                notice.id === noticeID
                    ? { ...notice, daDoc: true }
                    : notice
            )
        );

        try {
            await notificationApi.markAsRead(noticeID);
        } catch (error) {
            console.error("Khong danh dau thong bao da doc duoc:", error);
        }
    };

    const handleScroll = () => {
        const scrollBox = scrollBoxRef.current;
        if (!scrollBox) return;

        const distanceToBottom =
            scrollBox.scrollHeight - scrollBox.scrollTop - scrollBox.clientHeight;

        if (distanceToBottom <= 24) {
            loadMoreNotices();
        }
    };

    return (
        <div className="relative">
            <button
                type="button"
                onClick={onToggle}
                className="relative w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-95 bg-transparent text-main-text hover:bg-bg-shade-100"
            >
                <GoBellFill className="text-sub-text text-xl" />
                {hasUnreadNotice && (
                    <span className="absolute top-2 right-2 w-2 h-2 bg-accent-500 border-2 border-main-bg rounded-full"></span>
                )}
            </button>

            {isOpen && (
                <div
                    className={`absolute right-0 mt-3 w-[min(20rem,calc(100vw-4.5rem))] bg-main-bg shadow-2xl rounded-2xl overflow-hidden z-50 ${
                        isExiting ? "animate-popup-exit" : "animate-popup-appear"
                    }`}
                >
                    <div className="p-4 border-b border-text-shade-200 flex justify-between items-center">
                        <p className="font-bold text-main-text font-ui text-sm">
                            {t(I18N_KEYS.COMMON.common_headerTitle_notifications)}
                        </p>
                    </div>

                    <div
                        ref={scrollBoxRef}
                        onScroll={handleScroll}
                        className="max-h-[calc(100vh-15rem)] overflow-y-auto custom-scrollbar px-2 py-2"
                    >
                        {allNotices.length === 0 ? (
                            <div className="py-10 text-center text-xs text-main-text">
                                {t(I18N_KEYS.COMMON.common_headerDesc_noNotifications)}
                            </div>
                        ) : (
                            allNotices.map((notice) => (
                                <NotificationItem
                                    key={notice.id}
                                    loaiThongBao={notice.loaiThongBao}
                                    noiDung={notice.noiDung}
                                    thoiDiemThongBao={notice.thoiDiemThongBao}
                                    daDoc={notice.daDoc}
                                    link={notice.link}
                                    onOpen={() => handleNoticeOpen(notice.id)}
                                />
                            ))
                        )}

                        {isLoadingMore && (
                            <div className="py-3 text-center text-xs text-sub-text font-ui">
                                {t(I18N_KEYS.COMMON.common_headerDesc_loadingNotifications)}
                            </div>
                        )}

                        {!hasMore && allNotices.length > 0 && (
                            <div className="py-3 text-center text-xs text-sub-text font-ui">
                                {t(I18N_KEYS.COMMON.common_headerDesc_noMoreNotifications)}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
