import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { I18N_KEYS } from "../i18n/key";
import { useAuth } from "../context/AuthContext";
import { useErrorHandler } from "../hooks/useErrorHandler";
import {
    clearSearchHistory,
    getSearchHistory,
    removeSearchHistoryItem,
    saveSearchHistory,
} from "../utils/searchHistory";

import PageContainer from "../components/PageContainer";
import MixedSearchBar from "../components/MixedSearchBar";
import PostSearchFilters from "../components/PostSearchFilters";
import SearchResultSummary from "../components/SearchResultSummary";
import SearchEmptyState from "../components/SearchEmptyState";
import PostSearchSkeleton from "../components/PostSearchSkeleton";
import UserSearchSkeleton from "../components/UserSearchSkeleton";
import PostGrid from "../components/PostGrid";
import UserGrid from "../components/UserGrid";
import SearchHintState from "../components/SearchHintState";


import { MOCK_POST_DATA_1 } from "../data/Post/mockPost1";
import { MOCK_POST_DATA_2 } from "../data/Post/mockPost2";
import { MOCK_USER_DATA_1 } from "../data/User/mockUser1";
import { MOCK_USER_DATA_2 } from "../data/User/mockUser2";
import { MOCK_USER_DATA_3 } from "../data/User/mockUser3";

const SEARCH_MODE = {
    POST: "post",
    ACCOUNT: "account",
};

const MODE_THEME = {
    post: {
        palette: "secondary",
        panel: "bg-secondary-100",
        filterPanel: "bg-secondary-300",
        softPanel: "bg-secondary-500",
        border: "border-secondary-300",
        text: "text-secondary-900",
        button: "secondary",
    },
    account: {
        palette: "accent",
        panel: "bg-accent-50",
        filterPanel: "bg-accent-200",
        softPanel: "bg-accent-500",
        border: "border-accent-300",
        text: "text-accent-900",
        button: "accent",
    },
};

const POST_PAGE_SIZE = 18;
const ACCOUNT_PAGE_SIZE = 12;

const DEFAULT_SEARCH_STATE = {
    mode: SEARCH_MODE.POST,
    keyword: "",
    page: 1,
    postSearchType: "tag_relative",
    includeAi: true,
    sort: "newest",
};

/*
 * Mấy tên param ni gom riêng để sau này đổi khớp backend cho dễ.
 */
const URL_PARAMS = {
    MODE: "mode",
    KEYWORD: "keyword",
    PAGE: "page",
    PAGE_SIZE: "pageSize",
    POST_SEARCH_TYPE: "postSearchType",
    INCLUDE_AI: "includeAi",
    SORT: "sort",
};

const normalizeMode = (value) => {
    if (value === SEARCH_MODE.ACCOUNT) return SEARCH_MODE.ACCOUNT;
    return SEARCH_MODE.POST;
};

const normalizePage = (value) => {
    const page = Number(value);
    if (!Number.isFinite(page) || page < 1) return 1;
    return Math.floor(page);
};

const normalizeBoolean = (value, fallback = true) => {
    if (value === "true") return true;
    if (value === "false") return false;
    return fallback;
};

const getDefaultPageSize = (mode) => {
    return mode === SEARCH_MODE.POST ? POST_PAGE_SIZE : ACCOUNT_PAGE_SIZE;
};

const getSearchPlaceholder = (mode) => {
    return mode === SEARCH_MODE.POST
        ? I18N_KEYS.MIXED_SEARCH.COMMON.mixedSearch_searchBarPlaceholder_postMode
        : I18N_KEYS.MIXED_SEARCH.COMMON.mixedSearch_searchBarPlaceholder_accMode;
};

const createMockPosts = ({ page, pageSize }) => {
    return Array.from({ length: pageSize }, (_, index) => {
        const sourcePost = index % 2 === 0 ? MOCK_POST_DATA_1 : MOCK_POST_DATA_2;

        return {
            ...sourcePost,
            postID: `mixed-search-post-${page}-${index + 1}`,
        };
    });
};

const createMockAccounts = ({ page, pageSize }) => {
    const sourceAccounts = [
        MOCK_USER_DATA_1,
        MOCK_USER_DATA_2,
        MOCK_USER_DATA_3,
    ];

    return Array.from({ length: pageSize }, (_, index) => {
        const sourceAccount = sourceAccounts[index % sourceAccounts.length];

        return {
            ...sourceAccount,
            accountID: `mixed-search-account-${page}-${index + 1}`,
            username: `${sourceAccount.username}`,
        };
    });
};












export default function MixedSearch({
    setGlobalModal,
    addHelperError,
    setHelperFocusState,
    triggerMascotMood,
    isUnder18,
    isAlertActive,
    visitorIP,
    clearAlert,
}) {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const { user: authAccount, isAuthenticated } = useAuth();
    const { handleError } = useErrorHandler(setGlobalModal, addHelperError);

    const lastSearchKeyRef = useRef("");    

    const searchState = useMemo(() => {
        const mode = normalizeMode(searchParams.get(URL_PARAMS.MODE));
        const pageSize = Number(searchParams.get(URL_PARAMS.PAGE_SIZE)) || getDefaultPageSize(mode);

        return {
            mode,
            keyword: searchParams.get(URL_PARAMS.KEYWORD) || DEFAULT_SEARCH_STATE.keyword,
            page: normalizePage(searchParams.get(URL_PARAMS.PAGE)),
            pageSize,
            postSearchType:
                searchParams.get(URL_PARAMS.POST_SEARCH_TYPE) ||
                DEFAULT_SEARCH_STATE.postSearchType,
            includeAi: normalizeBoolean(
                searchParams.get(URL_PARAMS.INCLUDE_AI),
                DEFAULT_SEARCH_STATE.includeAi
            ),
            sort: searchParams.get(URL_PARAMS.SORT) || DEFAULT_SEARCH_STATE.sort,
        };
    }, [searchParams]);

    const [searchInput, setSearchInput] = useState(searchState.keyword);

    const [foundPosts, setFoundPosts] = useState([]);
    const [foundAccounts, setFoundAccounts] = useState([]);

    const [postTotalResults, setPostTotalResults] = useState(0);
    const [accountTotalResults, setAccountTotalResults] = useState(0);

    const [isSearchingPosts, setIsSearchingPosts] = useState(false);
    const [isSearchingAccounts, setIsSearchingAccounts] = useState(false);

    const [searchHistory, setSearchHistory] = useState([]);

    const hasSubmittedKeyword = Boolean(searchState.keyword.trim());

    const shouldShowSearchHint =
        searchState.mode === SEARCH_MODE.ACCOUNT && !hasSubmittedKeyword;

    const modeTheme = MODE_THEME[searchState.mode] || MODE_THEME.post;
    const isPostMode = searchState.mode === SEARCH_MODE.POST;
    const isLoading = isPostMode ? isSearchingPosts : isSearchingAccounts;
    const totalResults = isPostMode ? postTotalResults : accountTotalResults;
    const currentResults = isPostMode ? foundPosts : foundAccounts;
    const totalPages = Math.max(1, Math.ceil(totalResults / searchState.pageSize));

    const updateSearchParams = useCallback((nextState = {}) => {
        const nextMode = normalizeMode(nextState.mode || searchState.mode);
        const nextPageSize =
            nextState.pageSize ||
            (
                nextState.mode && nextState.mode !== searchState.mode
                    ? getDefaultPageSize(nextMode)
                    : searchState.pageSize
            );

        const mergedState = {
            ...searchState,
            ...nextState,
            mode: nextMode,
            pageSize: nextPageSize,
        };

        const nextParams = new URLSearchParams();

        nextParams.set(URL_PARAMS.MODE, mergedState.mode);
        nextParams.set(URL_PARAMS.KEYWORD, mergedState.keyword || "");
        nextParams.set(URL_PARAMS.PAGE, String(mergedState.page || 1));
        nextParams.set(URL_PARAMS.PAGE_SIZE, String(mergedState.pageSize));

        if (mergedState.mode === SEARCH_MODE.POST) {
            nextParams.set(URL_PARAMS.POST_SEARCH_TYPE, mergedState.postSearchType);
            nextParams.set(URL_PARAMS.INCLUDE_AI, String(Boolean(mergedState.includeAi)));
            nextParams.set(URL_PARAMS.SORT, mergedState.sort);
        }

        const currentParamsString = searchParams.toString();
        const nextParamsString = nextParams.toString();

        if (currentParamsString === nextParamsString) {
            return;
        }

        setSearchParams(nextParams);
    }, [searchState, searchParams, setSearchParams]);

    const handleSubmitSearch = () => {
        const trimmedKeyword = searchInput.trim();

        saveSearchHistory({
            keyword: trimmedKeyword,
            mode: searchState.mode,
        });

        setSearchHistory(getSearchHistory());

        updateSearchParams({
            keyword: trimmedKeyword,
            page: 1,
        });
    };

    const handleChangeMode = (nextMode) => {
        updateSearchParams({
            mode: nextMode,
            keyword: searchInput.trim(),
            page: 1,
            pageSize: getDefaultPageSize(nextMode),
        });
    };

    const handleChangePostSearchType = (nextPostSearchType) => {
        updateSearchParams({
            postSearchType: nextPostSearchType,
            page: 1,
        });
    };

    const handleChangeIncludeAi = (nextIncludeAi) => {
        updateSearchParams({
            includeAi: nextIncludeAi,
            page: 1,
        });
    };

    const handleChangeSort = (nextSort) => {
        updateSearchParams({
            sort: nextSort,
            page: 1,
        });
    };

    const handleChangePage = (nextPage) => {
        updateSearchParams({
            page: nextPage,
        });
    };

    const getSearchRequestKey = useCallback(() => {
        return JSON.stringify({
            mode: searchState.mode,
            keyword: searchState.keyword,
            page: searchState.page,
            pageSize: searchState.pageSize,
            postSearchType: searchState.mode === SEARCH_MODE.POST ? searchState.postSearchType : "",
            includeAi: searchState.mode === SEARCH_MODE.POST ? searchState.includeAi : "",
            sort: searchState.mode === SEARCH_MODE.POST ? searchState.sort : "",
        });
    }, [
        searchState.mode,
        searchState.keyword,
        searchState.page,
        searchState.pageSize,
        searchState.postSearchType,
        searchState.includeAi,
        searchState.sort,
    ]);


    const handleSelectSearchHistory = (historyItem) => {
    const nextKeyword = historyItem.keyword || "";
    const nextMode = historyItem.mode || SEARCH_MODE.POST;

    saveSearchHistory({
        keyword: nextKeyword,
        mode: nextMode,
    });

    setSearchInput(nextKeyword);
        setSearchHistory(getSearchHistory());

        updateSearchParams({
            mode: nextMode,
            keyword: nextKeyword,
            page: 1,
            pageSize: getDefaultPageSize(nextMode),
        });
    };

    const handleRemoveSearchHistory = (historyItem) => {
        removeSearchHistoryItem({
            keyword: historyItem.keyword,
            mode: historyItem.mode,
        });

        setSearchHistory(getSearchHistory());
    };

    const handleClearSearchHistory = () => {
        clearSearchHistory();
        setSearchHistory([]);
    };

    useEffect(() => {
        setSearchHistory(getSearchHistory());
    }, []);


    //----------Phần backend cần quan tâm-----------

    const fetchPostSearchResults = useCallback(async () => { // Hàm tìm Post
        setIsSearchingPosts(true);
        try {
            /*
             * TODO: gọi backend tìm post.
             *
             * Gợi ý params gửi backend:
             * {
             *   keyword: searchState.keyword,
             *   page: searchState.page,
             *   pageSize: searchState.pageSize,
             *   postSearchType: searchState.postSearchType,
             *   includeAi: searchState.includeAi,
             *   sort: searchState.sort,
             * }
             *
             * Gợi ý response:
             * {
             *   items: [],
             *   totalResults: 100
             * }
             */

            await Promise.resolve();

            const mockTotalResults = 126;
            const mockPosts = createMockPosts({
                page: searchState.page,
                pageSize: searchState.pageSize,
            });

            setFoundPosts(mockPosts);
            setPostTotalResults(mockTotalResults);
        } catch (error) {
            const errorData = error.response?.data || {};
            const result = handleError(errorData);

            if (result && !result.handled) {
                switch (result.code) {
                    default:
                        addHelperError?.({
                            id: Date.now(),
                            code: I18N_KEYS.GLOBAL_ERROR.ERROR_unknownError,
                        });
                        break;
                }
            }
        } finally {
            setIsSearchingPosts(false);
        }
    }, [
        addHelperError,
        handleError,
        searchState.keyword,
        searchState.page,
        searchState.pageSize,
        searchState.postSearchType,
        searchState.includeAi,
        searchState.sort,
    ]);

    const fetchAccountSearchResults = useCallback(async () => { // Hàm tìm Account
        setIsSearchingAccounts(true);

        try {
            /*
             * TODO: gọi backend tìm account.
             *
             * Gợi ý params gửi backend:
             * {
             *   keyword: searchState.keyword,
             *   page: searchState.page,
             *   pageSize: searchState.pageSize,
             * }
             *
             * Gợi ý response:
             * {
             *   items: [],
             *   totalResults: 100
             * }
             */

            await Promise.resolve();

            const mockTotalResults = 48;
            const mockAccounts = createMockAccounts({
                page: searchState.page,
                pageSize: searchState.pageSize,
            });

            setFoundAccounts(mockAccounts);
            setAccountTotalResults(mockTotalResults);
        } catch (error) {
            const errorData = error.response?.data || {};
            const result = handleError(errorData);

            if (result && !result.handled) {
                switch (result.code) {
                    default:
                        addHelperError?.({
                            id: Date.now(),
                            code: I18N_KEYS.GLOBAL_ERROR.ERROR_unknownError,
                        });
                        break;
                }
            }
        } finally {
            setIsSearchingAccounts(false);
        }
    }, [
        addHelperError,
        handleError,
        searchState.keyword,
        searchState.page,
        searchState.pageSize,
    ]);


    //----------Hết phần backend cần quan tâm-----------

    useEffect(() => {
        if (searchState.mode === SEARCH_MODE.ACCOUNT && !searchState.keyword.trim()) {
            setFoundAccounts([]);
            setAccountTotalResults(0);
            return;
        }

        const searchRequestKey = getSearchRequestKey();

        if (lastSearchKeyRef.current === searchRequestKey) {
            return;
        }

        lastSearchKeyRef.current = searchRequestKey;

        if (searchState.mode === SEARCH_MODE.POST) {
            fetchPostSearchResults();
            return;
        }

        fetchAccountSearchResults();
    }, [
        searchState.mode,
        searchState.keyword,
        getSearchRequestKey,
        fetchPostSearchResults,
        fetchAccountSearchResults,
    ]);














    return (
        <PageContainer setHelperFocusState={setHelperFocusState}>
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
                <section
                    className={`
                        flex flex-col gap-5 rounded-4xl p-4 shadow-sm sm:p-6 border-4 border-main-bg
                        ${modeTheme.panel}
                    `}
                >
                    <MixedSearchBar
                        mode={searchState.mode}
                        value={searchInput}
                        placeholder={getSearchPlaceholder(searchState.mode)}
                        theme={modeTheme}
                        searchHistory={searchHistory}
                        onChange={setSearchInput}
                        onSubmit={handleSubmitSearch}
                        onModeChange={handleChangeMode}
                        onSelectHistory={handleSelectSearchHistory}
                        onRemoveHistory={handleRemoveSearchHistory}
                        onClearHistory={handleClearSearchHistory}
                    />

                    {isPostMode && (
                        <PostSearchFilters
                            postSearchType={searchState.postSearchType}
                            includeAi={searchState.includeAi}
                            sort={searchState.sort}
                            theme={modeTheme}
                            onPostSearchTypeChange={handleChangePostSearchType}
                            onIncludeAiChange={handleChangeIncludeAi}
                            onSortChange={handleChangeSort}
                        />
                    )}
                </section>

                {!shouldShowSearchHint && (
                    <SearchResultSummary
                        mode={searchState.mode}
                        keyword={searchState.keyword}
                        totalResults={totalResults}
                    />
                )}

                {shouldShowSearchHint ? (
                    <SearchHintState mode={searchState.mode} />
                ) : isLoading ? (
                    isPostMode ? (
                        <PostSearchSkeleton count={9} />
                    ) : (
                        <UserSearchSkeleton count={8} />
                    )
                ) : currentResults.length === 0 ? (
                    <SearchEmptyState />
                ) : isPostMode ? (
                    <PostGrid
                        posts={foundPosts}
                        isUnder18={isUnder18}
                        isAlertActive={isAlertActive}
                        visitorIP={visitorIP}
                        clearAlert={clearAlert}
                        showPagination={true}
                        enableInfiniteScroll={false}
                        currentPage={searchState.page}
                        totalPages={totalPages}
                        onPageChange={handleChangePage}
                        scrollOnPageChange={true}
                    />
                ) : (
                    <UserGrid
                        accounts={foundAccounts}
                        authAccount={authAccount}
                        isAuthenticated={isAuthenticated}
                        showPagination={true}
                        enableInfiniteScroll={false}
                        currentPage={searchState.page}
                        totalPages={totalPages}
                        onPageChange={handleChangePage}
                        scrollOnPageChange={true}
                        onNavigateAccount={(account) => {
                            const accountUsername =
                                account?.accountUsername ||
                                account?.username ||
                                account?.usernameAccount;

                            navigate(`/user/${accountUsername}`);
                        }}
                    />
                )}
            </div>
        </PageContainer>
    );
}