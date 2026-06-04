import { useTranslation } from "react-i18next";
import { I18N_KEYS } from "../i18n/key";

import { Search, User } from "lucide-react";


export default function SearchHintState({
    mode,
}) {
    const { t } = useTranslation();

    const isAccountMode = mode === "account";

    return (
        <div className="rounded-4xl bg-bg-shade-200/20 px-5 py-14 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-main-bg shadow-sm">
                {isAccountMode ? (
                    <User size={24} className="text-text-shade-400" />
                ) : (
                    <Search size={24} className="text-text-shade-400" />
                )}
            </div>

            <p className="mt-5 font-heading text-2xl font-bold text-main-text">
                {isAccountMode
                    ? t(I18N_KEYS.MIXED_SEARCH.COMMON.mixedSearch_searchHintStateText_accMode_text1)
                    : t(I18N_KEYS.MIXED_SEARCH.COMMON.mixedSearch_searchHintStateText_postMode_text1)}
            </p>

            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-text-shade-400">
                {t(I18N_KEYS.MIXED_SEARCH.COMMON.mixedSearch_searchHintStateText_accMode_text2)}
            </p>
        </div>
    );
}