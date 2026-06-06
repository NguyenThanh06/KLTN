import { useMemo, useRef, useState, useEffect } from "react";
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa6';
import PostAuthorCard from "./PostAuthorCard";
import Button from "./Button";

export default function UserGrid({
    accounts = [],
    authAccount,
    isAuthenticated = false,

    showPagination = false,
    enableInfiniteScroll = false,
    currentPage = 1,
    totalPages = 1,
    onPageChange,
    onLoadMore,
    scrollOnPageChange = true,
    
    onNavigateAccount,
}) {
    const gridContainerRef = useRef(null);
    const loaderRef = useRef(null);

    const [hasMore, setHasMore] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [isSwitchingPage, setIsSwitchingPage] = useState(false);
    const [pageDirection, setPageDirection] = useState(0);
    const [displayAccounts, setDisplayAccounts] = useState(accounts);

    useEffect(() => {
        setIsSwitchingPage(true);

        const hideTimer = setTimeout(() => {
            setDisplayAccounts(accounts);

            const showTimer = setTimeout(() => {
                setIsSwitchingPage(false);
            }, 40);

            return () => clearTimeout(showTimer);
        }, 120);

        return () => clearTimeout(hideTimer);
    }, [accounts]);

    const paginationItems = useMemo(() => {
        if (!showPagination || totalPages <= 1) return [];

        const pageSet = new Set();

        for (let page = 1; page <= Math.min(3, totalPages); page++) {
            pageSet.add(page);
        }

        for (let page = Math.max(totalPages - 2, 1); page <= totalPages; page++) {
            pageSet.add(page);
        }

        for (
            let page = Math.max(currentPage - 2, 1);
            page <= Math.min(currentPage + 2, totalPages);
            page++
        ) {
            pageSet.add(page);
        }

        const sortedPages = [...pageSet].sort((a, b) => a - b);
        const items = [];

        sortedPages.forEach((page, index) => {
            const previousPage = sortedPages[index - 1];

            if (index > 0 && page - previousPage > 1) {
                items.push(`ellipsis-${previousPage}-${page}`);
            }

            items.push(page);
        });

        return items;
    }, [showPagination, totalPages, currentPage]);

    const scrollToGridTop = () => {
        if (!scrollOnPageChange) return;

        window.requestAnimationFrame(() => {
            const top = gridContainerRef.current?.getBoundingClientRect().top || 0;

            window.scrollTo({
                top: window.scrollY + top - 96,
                behavior: "smooth",
            });
        });
    };

    const handleChangePage = (nextPage) => {
        if (!onPageChange) return;
        if (nextPage < 1 || nextPage > totalPages) return;
        if (nextPage === currentPage) return;

        setPageDirection(nextPage > currentPage ? 1 : -1);
        onPageChange(nextPage);
        scrollToGridTop();
    };

    useEffect(() => {
        if (!enableInfiniteScroll || !onLoadMore || !hasMore) return;

        const observer = new IntersectionObserver(
            async (entries) => {
                const target = entries[0];

                if (target.isIntersecting && !isLoadingMore) {
                    setIsLoadingMore(true);

                    try {
                        const result = await onLoadMore();

                        if (result === false) {
                            setHasMore(false);
                        }
                    } catch (error) {
                        console.error("Lỗi khi tải thêm account:", error);
                    } finally {
                        setIsLoadingMore(false);
                    }
                }
            },
            {
                rootMargin: "200px",
            }
        );

        if (loaderRef.current) {
            observer.observe(loaderRef.current);
        }

        return () => {
            if (loaderRef.current) {
                observer.unobserve(loaderRef.current);
            }
        };
    }, [enableInfiniteScroll, onLoadMore, hasMore, isLoadingMore, displayAccounts.length]);

    useEffect(() => {
        if (accounts.length === 0) {
            setHasMore(true);
        }
    }, [accounts.length]);

    const authAccountID = authAccount?.accountID || authAccount?.id || authAccount?.idAccount;

    return (
        <div ref={gridContainerRef} className="w-full max-w-full overflow-x-hidden py-8">
            <div
                className={`
                    grid grid-cols-1 gap-y-3 gap-x-6 sm:grid-cols-2 sm:gap-x-8 sm:gap-y-4 lg:grid-cols-3 xl:grid-cols-4
                    transition-all duration-300 ease-out
                    ${isSwitchingPage ? "opacity-0" : "opacity-100"}
                    ${
                        isSwitchingPage && pageDirection > 0
                            ? "sm:translate-x-4"
                            : isSwitchingPage && pageDirection < 0
                                ? "sm:-translate-x-4"
                                : "translate-x-0"
                    }
                `}
            >
                {displayAccounts.map((account) => {
                    const accountID = account?.accountID || account?.id || account?.idAccount;
                    const isSameAccount = String(authAccountID || "") === String(accountID || "");

                    return (
                        <PostAuthorCard
                            key={accountID}
                            author={account}
                            variant="bio"
                            onNavigateAuthor={() => onNavigateAccount?.(account)}
                        />
                    );
                })}
            </div>

            {showPagination && !enableInfiniteScroll && totalPages > 1 && (
                <div className="mt-10 flex w-full items-center justify-center">
                    <div className="flex max-w-full items-center justify-center gap-1.5 overflow-x-auto px-2 py-1 sm:gap-3">
                        {currentPage > 1 && (
                            <Button
                                type="button"
                                variant="primary"
                                onClick={() => handleChangePage(currentPage - 1)}
                                className="
                                    flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-primary-600
                                    sm:h-10 sm:w-10 sm:text-sm
                                "
                            >
                                <FaChevronLeft/>
                            </Button>
                        )}

                        <div className="flex items-center justify-center gap-1.5 sm:gap-3">
                            {paginationItems.map((item) => {
                                if (typeof item === "string") {
                                    return (
                                        <div
                                            key={item}
                                            className="
                                                flex h-8 min-w-5 shrink-0 items-center justify-center
                                                text-xs text-text-shade-400 sm:h-10 sm:min-w-8 sm:text-sm
                                            "
                                        >
                                            ...
                                        </div>
                                    );
                                }

                                const isActive = item === currentPage;

                                return (
                                    <Button
                                        key={item}
                                        type="button"
                                        variant={isActive ? "primary" : "outline"}
                                        onClick={() => handleChangePage(item)}
                                        className={`
                                            flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs
                                            sm:h-10 sm:w-10 sm:text-sm
                                            ${isActive ? "border border-primary-600" : ""}
                                        `}
                                    >
                                        {item}
                                    </Button>
                                );
                            })}
                        </div>

                        {currentPage < totalPages && (
                            <Button
                                type="button"
                                variant="primary"
                                onClick={() => handleChangePage(currentPage + 1)}
                                className="
                                    flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-primary-600
                                    sm:h-10 sm:w-10 sm:text-sm
                                "
                            >
                                <FaChevronRight/>
                            </Button>
                        )}
                    </div>
                </div>
            )}

            {enableInfiniteScroll && hasMore && (
                <div ref={loaderRef} className="mt-6 flex h-10 w-full items-center justify-center">
                    {isLoadingMore && (
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-main-text/20 border-t-main-text" />
                    )}
                </div>
            )}
        </div>
    );
}