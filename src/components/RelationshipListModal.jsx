import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { I18N_KEYS } from "../i18n/key";
import { Search, X } from "lucide-react";

import Input from "./Input";
import PostAuthorCard from "./PostAuthorCard";

const getDisplayName = (account) => {
    return account?.tenHienThi || account?.username || "Người dùng cute hột mít";
};

export default function RelationshipListModal({
    isOpen,
    type = "followers",
    account,
    isCurrentAccount = false,
    items = [],
    keyword = "",
    isLoading = false,
    hasMore = false,
    onKeywordChange,
    onLoadMore,
    onClose,
    onNavigateUser,
}) {

    const { t, i18n } = useTranslation();

    const loaderRef = useRef(null);
    const displayName = getDisplayName(account);
    const isFollowersMode = type === "followers";

    const title = isFollowersMode ? I18N_KEYS.USER_DETAIL.COMMON.userDetail_relationshipListModalTitle_follower : I18N_KEYS.USER_DETAIL.COMMON.userDetail_relationshipListModalTitle_following;

    const emptyText = isFollowersMode
        ? isCurrentAccount
            ? I18N_KEYS.USER_DETAIL.COMMON.userDetail_relationshipListModalDesc_noFollower_userAccount
            : [I18N_KEYS.USER_DETAIL.COMMON.userDetail_relationshipListModalDesc_noFollower_otherAccount, {displayName: displayName}]
        : isCurrentAccount
          ? I18N_KEYS.USER_DETAIL.COMMON.userDetail_relationshipListModalDesc_noFollowing_userAccount
            : [I18N_KEYS.USER_DETAIL.COMMON.userDetail_relationshipListModalDesc_noFollowing_otherAccount, {displayName: displayName}];

    useEffect(() => {
        if (!isOpen || !hasMore || isLoading || !onLoadMore) return;

        const observer = new IntersectionObserver(
            (entries) => {
                const target = entries[0];

                if (target.isIntersecting) {
                    onLoadMore();
                }
            },
            {
                rootMargin: "160px",
            }
        );

        const currentLoader = loaderRef.current;

        if (currentLoader) {
            observer.observe(currentLoader);
        }

        return () => {
            if (currentLoader) {
                observer.unobserve(currentLoader);
            }
        };
    }, [hasMore, isLoading, isOpen, onLoadMore]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-main-text/40 px-4 py-6 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 10 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="relative flex max-h-[82vh] w-full max-w-lg flex-col overflow-hidden rounded-4xl bg-main-bg p-5 shadow-xl sm:p-6"
            >
                <button
                    type="button"
                    className="interaction-pop absolute right-4 top-4 rounded-full bg-bg-shade-50 p-2 text-main-text hover:bg-bg-shade-100"
                    onClick={onClose}
                >
                    <X size={18} />
                </button>

                <div className="mb-5 pr-10">
                    <p className="font-ui text-xs font-bold uppercase tracking-widest text-text-shade-400">
                        {displayName}
                    </p>

                    <h2 className="mt-1 font-heading text-2xl font-bold text-main-text">
                        {Array.isArray(title) ? t(...title) : t(title)}
                    </h2>
                </div>

                <Input
                    id={`relationship-${type}-search`}
                    type="search"
                    value={keyword}
                    placeholder={t(I18N_KEYS.USER_DETAIL.COMMON.userDetail_relationshipListModalPlaceholder_search)}
                    leftIcon={<Search size={16} />}
                    className="mb-4"
                    enableProfanityFilter={false}
                    onChange={(event) => onKeywordChange?.(event.target.value)}
                />

                <div className="min-h-0 flex-1 overflow-y-auto pr-1">
                    {!isLoading && items.length === 0 ? (
                        <div className="flex min-h-52 items-center justify-center rounded-4xl bg-bg-shade-50 px-5 py-8 text-center">
                            <p className="font-ui text-sm font-bold text-text-shade-400">
                                {Array.isArray(emptyText) ? t(...emptyText) : t(emptyText)}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {items.map((item) => (
                                <PostAuthorCard
                                    key={item.relationshipID || item.accountID}
                                    author={item}
                                    variant="simple"
                                    onNavigateAuthor={() => onNavigateUser?.(item)}
                                />
                            ))}
                        </div>
                    )}

                    {hasMore && (
                        <div
                            ref={loaderRef}
                            className="flex h-12 items-center justify-center"
                        >
                            {isLoading && (
                                <div className="h-6 w-6 animate-spin rounded-full border-2 border-main-text/20 border-t-main-text" />
                            )}
                        </div>
                    )}

                    {!hasMore && isLoading && (
                        <div className="flex h-12 items-center justify-center">
                            <div className="h-6 w-6 animate-spin rounded-full border-2 border-main-text/20 border-t-main-text" />
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}