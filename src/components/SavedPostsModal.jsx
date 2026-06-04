import { useTranslation } from "react-i18next";
import { I18N_KEYS } from "../i18n/key";
import { motion } from "framer-motion";
import { X } from "lucide-react";

import PostGrid from "./PostGrid";

export default function SavedPostsModal({
    isOpen,
    posts = [],
    isInitialLoading = false,
    hasMore = false,
    isLoadingMore = false,
    isUnder18,
    isAlertActive,
    visitorIP,
    clearAlert,
    onLoadMore,
    onClose,
}) {
    const { t, i18n } = useTranslation();
    
    if (!isOpen) return null;

    const shouldShowEmpty = !isInitialLoading && posts.length === 0;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-main-text/40 px-3 py-5 backdrop-blur-sm sm:px-5">
            <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 10 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="
                    flex max-h-[86vh] w-full max-w-6xl flex-col overflow-hidden rounded-4xl
                    bg-main-bg shadow-xl
                "
            >
                <div className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-bg-shade-100 bg-main-bg/95 px-5 py-4 backdrop-blur-md sm:px-7 sm:py-5">
                    <div>
                        <p className="font-ui text-xs font-bold uppercase tracking-widest text-text-shade-400">
                            {t(I18N_KEYS.USER_DETAIL.COMMON.userDetail_savedPostsModalTitle_personalLibrary)}
                        </p>

                        <h2 className="mt-1 font-heading text-2xl font-bold text-main-text sm:text-3xl">
                            {t(I18N_KEYS.USER_DETAIL.COMMON.userDetail_savedPostsModalTitle_savedPost)}
                        </h2>
                    </div>

                    <button
                        type="button"
                        className="interaction-pop rounded-full bg-bg-shade-50 p-2.5 text-main-text hover:bg-bg-shade-100"
                        onClick={onClose}
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6 pt-2 sm:px-6 lg:px-8">
                    {isInitialLoading ? (
                        <div className="grid gap-6 py-8 sm:grid-cols-2 xl:grid-cols-3">
                            {Array.from({ length: 6 }).map((_, index) => (
                                <div key={index} className="space-y-3">
                                    <div className="aspect-[4/5] animate-pulse rounded-3xl bg-bg-shade-100" />
                                    <div className="h-4 w-3/4 animate-pulse rounded-full bg-bg-shade-100" />
                                    <div className="h-8 w-1/2 animate-pulse rounded-full bg-bg-shade-100" />
                                </div>
                            ))}
                        </div>
                    ) : shouldShowEmpty ? (
                        <div className="flex min-h-80 items-center justify-center rounded-4xl bg-bg-shade-50 px-6 py-16 text-center">
                            <p className="font-ui text-sm font-bold text-text-shade-400">
                                {t(I18N_KEYS.USER_DETAIL.COMMON.userDetail_savedPostsModalText_noSavedPost)}
                            </p>
                        </div>
                    ) : (
                        <>
                            <PostGrid
                                posts={posts}
                                isUnder18={isUnder18}
                                isAlertActive={isAlertActive}
                                visitorIP={visitorIP}
                                clearAlert={clearAlert}
                                enableInfiniteScroll={hasMore}
                                onLoadMore={onLoadMore}
                                showPagination={false}
                                showAuthorInfo={true}
                                viewerIsAuthor={false}
                                showEditButton={false}
                            />

                            {!hasMore && isLoadingMore && (
                                <div className="flex h-12 items-center justify-center">
                                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-main-text/20 border-t-main-text" />
                                </div>
                            )}
                        </>
                    )}
                </div>
            </motion.div>
        </div>
    );
}