import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { I18N_KEYS } from "../i18n/key";
import { Search } from "lucide-react";
import Button from "./Button";
import SearchModeSwitch from "./SearchModeSwitch";
import SearchHistoryDropdown from "./SearchHistoryDropdown";

export default function MixedSearchBar({
    mode,
    value,
    placeholder,
    theme,
    searchHistory = [],
    onChange,
    onSubmit,
    onModeChange,
    onSelectHistory,
    onRemoveHistory,
    onClearHistory,
}) {

    const { t, i18n } = useTranslation();

    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const blurTimerRef = useRef(null);

    const openHistory = () => {
        if (blurTimerRef.current) {
            clearTimeout(blurTimerRef.current);
        }

        setIsHistoryOpen(true);
    };

    const closeHistoryLater = () => {
        blurTimerRef.current = setTimeout(() => {
            setIsHistoryOpen(false);
        }, 120);
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        setIsHistoryOpen(false);
        onSubmit?.();
    };

    const handleSelectHistory = (historyItem) => {
        setIsHistoryOpen(false);
        onSelectHistory?.(historyItem);
    };

    return (
        <form
            className="mx-auto w-full max-w-3xl"
            onSubmit={handleSubmit}
        >
            <div className="flex w-full flex-col items-center gap-3">
                <div
                    className="
                        flex w-full min-w-0 items-center gap-3 rounded-full bg-main-bg
                        px-4 py-3 shadow-sm outline-1 outline-bg-shade-100
                    "
                    onFocus={openHistory}
                    onBlur={closeHistoryLater}
                >
                    <Search size={20} className="shrink-0 text-text-shade-300" />

                    <input
                        type="search"
                        value={value}
                        placeholder={t(placeholder)}
                        onChange={(event) => onChange?.(event.target.value)}
                        className="
                            min-w-0 flex-1 bg-transparent font-ui text-sm text-main-text outline-none
                            placeholder:text-text-shade-300
                            [&::-webkit-search-cancel-button]:appearance-none
                            [&::-webkit-search-decoration]:appearance-none
                        "
                    />

                    <SearchModeSwitch
                        mode={mode}
                        theme={theme}
                        onModeChange={onModeChange}
                        className="shrink-0"
                    />
                </div>

                <SearchHistoryDropdown
                    isOpen={isHistoryOpen}
                    history={searchHistory}
                    onSelectHistory={handleSelectHistory}
                    onRemoveHistory={onRemoveHistory}
                    onClearHistory={onClearHistory}
                />

                <Button
                    type="submit"
                    variant={theme?.button || "outline"}
                    className="
                        interaction-pop w-full rounded-full px-8
                        sm:w-auto sm:min-w-48
                    "
                >
                    {t(I18N_KEYS.MIXED_SEARCH.COMMON.mixedSearch_searchBarButton_search)}
                </Button>
            </div>
        </form>
    );
}