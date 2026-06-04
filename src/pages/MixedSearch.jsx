import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

import { I18N_KEYS } from "../i18n/key";
import { useAuth } from "../context/AuthContext";
import { useErrorHandler } from "../hooks/useErrorHandler";
import { postApi } from "../api/postApi";
import { profileApi } from "../api/profileApi";
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

const POST_SEARCH_TYPE_TO_API = {
    tag_relative: "TAG_RELATIVE",
    tag_exact: "TAG_EXACT",
    title_description: "TITLE_DESCRIPTION",
    all: "ALL",
};

const POST_SORT_TO_API = {
    newest: "NEWEST",
    oldest: "OLDEST",
    most_viewed: "MOST_VIEWED",
};

const DEFAULT_SEARCH_STATE = {
    mode: SEARCH_MODE.POST,
    keyword: "",
    page: 1,
    postSearchType: "all",
    includeAi: false,
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


export default function MixedSearch({
    setGlobalModal,
    addHelperError,
    setHelperFocusState,
    isUnder18,
    isAlertActive,
    visitorIP,
    clearAlert,
}) {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();

    const { user: authAccount, isAuthenticated } = useAuth();
    const { handleError } = useErrorHandler(setGlobalModal, addHelperError);

    const lastSearchKeyRef = useRef("");    
    const postSearchRequestIDRef = useRef(0);
    const searchState = useMemo(() => {
        const currentSearchParams = new URLSearchParams(location.search);
        const mode = normalizeMode(currentSearchParams.get(URL_PARAMS.MODE));
        const pageSize = mode === SEARCH_MODE.POST
            ? POST_PAGE_SIZE
            : Number(currentSearchParams.get(URL_PARAMS.PAGE_SIZE)) || getDefaultPageSize(mode);

        return {
            mode,
            keyword: currentSearchParams.get(URL_PARAMS.KEYWORD) || DEFAULT_SEARCH_STATE.keyword,
            page: normalizePage(currentSearchParams.get(URL_PARAMS.PAGE)),
            pageSize,
            postSearchType:
                currentSearchParams.get(URL_PARAMS.POST_SEARCH_TYPE) ||
                DEFAULT_SEARCH_STATE.postSearchType,
            includeAi: normalizeBoolean(
                currentSearchParams.get(URL_PARAMS.INCLUDE_AI),
                DEFAULT_SEARCH_STATE.includeAi
            ),
            sort: currentSearchParams.get(URL_PARAMS.SORT) || DEFAULT_SEARCH_STATE.sort,
        };
    }, [location.search]);

    const [searchInput, setSearchInput] = useState(searchState.keyword);

    const [foundPosts, setFoundPosts] = useState([]);
    const [foundAccounts, setFoundAccounts] = useState([]);

    const [postTotalResults, setPostTotalResults] = useState(0);
    const [accountTotalResults, setAccountTotalResults] = useState(0);

    const [isSearchingPosts, setIsSearchingPosts] = useState(false);
    const [isSearchingAccounts, setIsSearchingAccounts] = useState(false);
    const [searchSubmitTick, setSearchSubmitTick] = useState(0);

    const [searchHistory, setSearchHistory] = useState(() => getSearchHistory());

    useEffect(() => {
        const syncInputTimer = window.setTimeout(() => {
            setSearchInput(searchState.keyword);
        }, 0);

        return () => window.clearTimeout(syncInputTimer);
    }, [searchState.keyword]);

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
            return false;
        }

        setSearchParams(nextParams);
        return true;
    }, [searchState, searchParams, setSearchParams]);

    const handleSubmitSearch = () => {
        const trimmedKeyword = searchInput.trim();

        saveSearchHistory({
            keyword: trimmedKeyword,
            mode: searchState.mode,
        });

        setSearchHistory(getSearchHistory());

        const didUpdateParams = updateSearchParams({
            keyword: trimmedKeyword,
            page: 1,
        });

        if (!didUpdateParams) {
            setSearchSubmitTick((prev) => prev + 1);
        }
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
            rawSearch: location.search,
            submitTick: searchSubmitTick,
        });
    }, [
        location.search,
        searchSubmitTick,
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

    //----------Phần backend cần quan tâm-----------

    const fetchPostSearchResults = useCallback(async () => { // Hàm tìm Post
        const requestID = postSearchRequestIDRef.current + 1;
        postSearchRequestIDRef.current = requestID;

        setIsSearchingPosts(true);
        try {
            const response = await postApi.searchPosts({
                keyword: searchState.keyword.trim(),
                keywordCompareType:
                    POST_SEARCH_TYPE_TO_API[searchState.postSearchType] ||
                    POST_SEARCH_TYPE_TO_API.tag_relative,
                includeAI: Boolean(searchState.includeAi),
                sortBy: POST_SORT_TO_API[searchState.sort] || POST_SORT_TO_API.newest,
                page: Math.max(Number(searchState.page || 1) - 1, 0),
            });
            const pageData = response.data?.result || response.data;

            if (postSearchRequestIDRef.current !== requestID) {
                return;
            }

            setFoundPosts(pageData?.content || []);
            setPostTotalResults(Number(pageData?.totalElements || 0));
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
            if (postSearchRequestIDRef.current === requestID) {
                setIsSearchingPosts(false);
            }
        }
    }, [
        addHelperError,
        handleError,
        searchState.keyword,
        searchState.page,
        searchState.postSearchType,
        searchState.includeAi,
        searchState.sort,
    ]);

    const fetchAccountSearchResults = useCallback(async () => { // Hàm tìm Account
        setIsSearchingAccounts(true);

        try {
            const response = await profileApi.searchAccounts({
                keyword: searchState.keyword.trim(),
                page: Math.max(Number(searchState.page || 1) - 1, 0),
                size: searchState.pageSize,
            });
            const pageData = response.data?.result || response.data;

            setFoundAccounts(pageData?.content || []);
            setAccountTotalResults(Number(pageData?.totalElements || 0));
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
            const clearAccountResultsTimer = window.setTimeout(() => {
                setFoundAccounts([]);
                setAccountTotalResults(0);
            }, 0);

            return () => window.clearTimeout(clearAccountResultsTimer);
        }

        const searchRequestKey = getSearchRequestKey();

        if (lastSearchKeyRef.current === searchRequestKey) {
            return;
        }

        lastSearchKeyRef.current = searchRequestKey;

        const searchTimer = window.setTimeout(() => {
            if (searchState.mode === SEARCH_MODE.POST) {
                fetchPostSearchResults();
                return;
            }

            fetchAccountSearchResults();
        }, 0);

        return () => window.clearTimeout(searchTimer);
    }, [
        searchState.mode,
        searchState.keyword,
        searchSubmitTick,
        location.search,
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
                        <PostSearchSkeleton count={POST_PAGE_SIZE} />
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
                            const accountProfileID =
                                account?.accountID ||
                                account?.id ||
                                account?.userID ||
                                account?.idAccount ||
                                account?.accountUsername ||
                                account?.username ||
                                account?.usernameAccount;

                            navigate(`/user/${accountProfileID}`);
                        }}
                    />
                )}
            </div>
        </PageContainer>
    );
}
