import { useTranslation } from "react-i18next";
import { I18N_KEYS } from "../i18n/key";

export default function SearchEmptyState() {
    const { t } = useTranslation();

    return (
        <div className="rounded-4xl bg-bg-shade-200/20 px-5 py-14 text-center">
            <p className="font-heading text-2xl font-bold text-main-text">
                {t(I18N_KEYS.MIXED_SEARCH.COMMON.mixedSearch_searchEmptyStateText_text1)}
            </p>

            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-text-shade-400">
                {t(I18N_KEYS.MIXED_SEARCH.COMMON.mixedSearch_searchEmptyStateText_text2)}
            </p>
        </div>
    );
}