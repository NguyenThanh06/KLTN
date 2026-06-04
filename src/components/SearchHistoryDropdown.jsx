import { useTranslation } from "react-i18next";
import { I18N_KEYS } from "../i18n/key";
import { Clock, Image, User, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export default function SearchHistoryDropdown({
    isOpen,
    history = [],
    onSelectHistory,
    onRemoveHistory,
    onClearHistory,
}) {

    const { t, i18n } = useTranslation();

    const visibleHistory = history.slice(0, 6);

    return (
        <AnimatePresence>
            {isOpen && visibleHistory.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.98 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    className="
                        w-full rounded-[1.75rem] bg-main-bg p-2 shadow-sm
                        outline-1 outline-bg-shade-100
                    "
                >
                    <div className="flex items-center justify-between px-3 py-2">
                        <div className="flex items-center gap-2 font-ui text-sm font-bold text-main-text">
                            <Clock size={16} className="text-text-shade-400" />
                            {t(I18N_KEYS.MIXED_SEARCH.COMMON.mixedSearch_searchHistoryDropdownTitle)}
                        </div>

                        <button
                            type="button"
                            className="
                                rounded-full px-3 py-1 font-ui text-xs font-bold text-text-shade-400
                                transition-colors hover:bg-bg-shade-50 hover:text-main-text
                            "
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={onClearHistory}
                        >
                            {t(I18N_KEYS.MIXED_SEARCH.COMMON.mixedSearch_searchHistoryDropdownButton_deleteAll)}
                        </button>
                    </div>

                    <div className="mt-1 flex flex-col gap-1">
                        {visibleHistory.map((historyItem) => {
                            const isPostMode = historyItem.mode === "post";
                            const ModeIcon = isPostMode ? Image : User;
                            const modeLabel = isPostMode ? t(I18N_KEYS.MIXED_SEARCH.COMMON.mixedSearch_searchHistoryDropdownLabel_postMode) : t(I18N_KEYS.MIXED_SEARCH.COMMON.mixedSearch_searchHistoryDropdownLabel_accMode);

                            return (
                                <div
                                    key={`${historyItem.mode}-${historyItem.keyword}`}
                                    className="
                                        group flex items-center gap-2 rounded-[1.35rem]
                                        hover:bg-bg-shade-50
                                    "
                                >
                                    <button
                                        type="button"
                                        className="
                                            flex min-w-0 flex-1 items-center gap-3 rounded-[1.35rem]
                                            px-3 py-2.5 text-left
                                        "
                                        onMouseDown={(event) => event.preventDefault()}
                                        onClick={() => onSelectHistory?.(historyItem)}
                                    >
                                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-bg-shade-100 text-text-shade-400">
                                            <ModeIcon size={15} />
                                        </span>

                                        <span className="min-w-0 flex-1">
                                            <span className="block truncate font-ui text-sm font-bold text-main-text">
                                                {historyItem.keyword}
                                            </span>

                                            <span className="block text-xs text-text-shade-400">
                                                {modeLabel}
                                            </span>
                                        </span>
                                    </button>

                                    <button
                                        type="button"
                                        className="
                                            mr-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full
                                            text-text-shade-300 opacity-100 transition-colors
                                            hover:bg-main-bg hover:text-main-text
                                            sm:opacity-0 sm:group-hover:opacity-100
                                        "
                                        onMouseDown={(event) => event.preventDefault()}
                                        onClick={() => onRemoveHistory?.(historyItem)}
                                    >
                                        <X size={15} />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}