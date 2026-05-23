import { useTranslation } from "react-i18next";
import { I18N_KEYS } from "../i18n/key";
import { RiImageFill, RiUserFill } from "react-icons/ri";

export default function SearchModeSwitch({
    mode,
    theme,
    onModeChange,
    className = "",
}) {

    const { t, i18n } = useTranslation();

    const isAccountMode = mode === "account";

    const activeBg = isAccountMode ? "bg-accent-500" : "bg-secondary-600";
    const softBg = isAccountMode ? "bg-accent-200" : "bg-secondary-400";
    const outline = isAccountMode ? "outline-accent-500" : "outline-secondary-700";

    return (
        <div
            className={`
                relative grid h-10 w-[5.75rem] grid-cols-2 rounded-full
                p-1 shadow-sm outline-1 transition-colors duration-200
                ${softBg} ${outline} ${className}
            `}
        >
            <span
                className={`
                    pointer-events-none absolute left-1 top-1 h-8 w-10 rounded-full
                    shadow-sm transition-all duration-200 ease-out
                    ${activeBg}
                    ${isAccountMode ? "translate-x-0" : "translate-x-10"}
                `}
            />

            <button
                type="button"
                title={t(I18N_KEYS.MIXED_SEARCH.COMMON.mixedSearch_searchBarSwitchLabel_accMode)}
                onClick={() => onModeChange?.("account")}
                className={`
                    relative z-10 flex h-8 w-10 items-center justify-center rounded-full
                    transition-colors duration-200
                    ${isAccountMode ? "text-accent-800" : "text-secondary-700 hover:text-secondary-950"}
                `}
            >
                <RiUserFill size={18} />
            </button>

            <button
                type="button"
                title={t(I18N_KEYS.MIXED_SEARCH.COMMON.mixedSearch_searchBarSwitchLabel_postMode)}
                onClick={() => onModeChange?.("post")}
                className={`
                    relative z-10 flex h-8 w-10 items-center justify-center rounded-full 
                    transition-colors duration-200
                    ${!isAccountMode ? "text-secondary-950" : "text-accent-400 hover:text-accent-800"}
                `}
            >
                <RiImageFill size={18} />
            </button>
        </div>
    );
}