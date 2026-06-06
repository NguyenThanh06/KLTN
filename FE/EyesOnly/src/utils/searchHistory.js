const SEARCH_HISTORY_KEY = "mixedSearchHistory";
const MAX_SEARCH_HISTORY = 15;

const normalizeKeyword = (keyword) => {
    return String(keyword || "").trim();
};

export const getSearchHistory = () => {
    try {
        const rawHistory = localStorage.getItem(SEARCH_HISTORY_KEY);

        if (!rawHistory) {
            return [];
        }

        const parsedHistory = JSON.parse(rawHistory);

        if (!Array.isArray(parsedHistory)) {
            return [];
        }

        return parsedHistory;
    } catch {
        return [];
    }
};

export const saveSearchHistory = ({
    keyword,
    mode,
}) => {
    const normalizedKeyword = normalizeKeyword(keyword);

    if (!normalizedKeyword) {
        return;
    }

    const currentHistory = getSearchHistory();

    const nextHistoryItem = {
        keyword: normalizedKeyword,
        mode,
        searchedAt: new Date().toISOString(),
    };

    const nextHistory = [
        nextHistoryItem,
        ...currentHistory.filter((historyItem) => {
            const isSameKeyword =
                String(historyItem.keyword || "").trim().toLowerCase() ===
                normalizedKeyword.toLowerCase();

            const isSameMode = historyItem.mode === mode;

            return !(isSameKeyword && isSameMode);
        }),
    ].slice(0, MAX_SEARCH_HISTORY);

    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(nextHistory));
};

export const removeSearchHistoryItem = ({
    keyword,
    mode,
}) => {
    const normalizedKeyword = normalizeKeyword(keyword);
    const currentHistory = getSearchHistory();

    const nextHistory = currentHistory.filter((historyItem) => {
        const isSameKeyword =
            String(historyItem.keyword || "").trim().toLowerCase() ===
            normalizedKeyword.toLowerCase();

        const isSameMode = historyItem.mode === mode;

        return !(isSameKeyword && isSameMode);
    });

    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(nextHistory));
};

export const clearSearchHistory = () => {
    localStorage.removeItem(SEARCH_HISTORY_KEY);
};