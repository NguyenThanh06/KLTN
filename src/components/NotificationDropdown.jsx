import { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { I18N_KEYS } from "../i18n/key";
import NotificationItem from "./NotificationItem";

import { GoBellFill } from "react-icons/go";

const PAGE_SIZE = 6;

// Lấy đúng dãy thông báo mẫu đang để sẵn trong Header cũ.
const INITIAL_MOCK_NOTICES = [
    {
        id: "mock-notice-1",
        loaiThongBao: "0",
        noiDung: "Con khỉ tuyệt vời",
        thoiDiemThongBao: "2026-05-13T14:30:00Z",
        daDoc: false,
        link: "/user/123",
    },
    {
        id: "mock-notice-2",
        loaiThongBao: "1",
        noiDung: "Bức tranh Huế ngày mưa tầm tã buồn rười rượi",
        thoiDiemThongBao: "2026-05-13T14:30:00Z",
        daDoc: true,
        link: "/post/123?comment=1",
    },
    {
        id: "mock-notice-3",
        loaiThongBao: "2",
        noiDung: "Hôm qua tui ăn cục cơm cá mà ngon kinh khủng hồn vía.",
        thoiDiemThongBao: "2026-05-13T14:30:00Z",
        daDoc: false,
        link: "/post/123?comment=2",
    },
    {
        id: "mock-notice-4",
        loaiThongBao: "3",
        noiDung: "Hình vẽ tầm bậy 123",
        thoiDiemThongBao: "2026-05-13T14:30:00Z",
        daDoc: true,
        link: "/post/123",
    },
];

export default function NotificationDropdown({
    isOpen,
    isExiting,
    onToggle,
}) {
    const { t } = useTranslation();
    const scrollBoxRef = useRef(null);

    const [allNotices, setAllNotices] = useState(INITIAL_MOCK_NOTICES);
    const [page, setPage] = useState(1); // mock data xem như page 0, lần tải backend đầu tiên là page 1
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    const hasUnreadNotice = useMemo(() => {
        return allNotices.some((notice) => !notice.daDoc);
    }, [allNotices]);

    const normalizeNotice = (notice, index) => ({
        id: notice.id ?? notice.thongBaoId ?? notice.notificationId ?? `${Date.now()}-${index}`,
        loaiThongBao: notice.loaiThongBao,
        noiDung: notice.noiDung,
        thoiDiemThongBao: notice.thoiDiemThongBao,
        daDoc: notice.daDoc,
        link: notice.link,
    });

    const loadMoreNotices = async () => {
        if (isLoadingMore || !hasMore) return;

        try {
            setIsLoadingMore(true);

            // TODO: trả về ds thông báo vs boolean báo xem còn sau nữa k, như dưới ni
            // {
            //   content: [{ id, loaiThongBao, noiDung, thoiDiemThongBao, daDoc, link }],
            //   hasMore: false
            // }

            // const response = await api.getDsThongBao(), {
            //     params: {
            //         page,
            //         size: PAGE_SIZE,
            //     },
            // });

            const responseData = response.data;
            const newNoticesRaw = responseData?.content ?? responseData?.data?.content ?? responseData?.data ?? [];
            const newNotices = newNoticesRaw.map(normalizeNotice);

            setAllNotices((prevNotices) => [...prevNotices, ...newNotices]);
            setPage((prevPage) => prevPage + 1);

            const isLastPage =
                responseData?.hasMore ??
                responseData?.data?.hasMore ??
                newNotices.length < PAGE_SIZE;

            if (isLastPage || newNotices.length === 0) {
                setHasMore(false);
            }
        } catch (error) {
            console.error("Không tải thêm thông báo được:", error);
            setHasMore(false);
        } finally {
            setIsLoadingMore(false);
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
