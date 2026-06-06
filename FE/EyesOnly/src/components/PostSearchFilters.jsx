import { useTranslation } from "react-i18next";
import { I18N_KEYS } from "../i18n/key";

import { Check } from "lucide-react";
import { FiTarget } from "react-icons/fi";
import { WandSparkles } from "lucide-react";
import { MdOutlineSort } from "react-icons/md";

import SoftSelect from "./SoftSelect";

export const POST_SEARCH_TYPE_OPTIONS = [
    { value: "tag_relative", label: I18N_KEYS.MIXED_SEARCH.COMMON.mixedSearch_searchFilterSelect_compareType_tagRelative },
    { value: "tag_exact", label: I18N_KEYS.MIXED_SEARCH.COMMON.mixedSearch_searchFilterSelect_compareType_tagExact },
    { value: "title_description", label: I18N_KEYS.MIXED_SEARCH.COMMON.mixedSearch_searchFilterSelect_compareType_titleDesc },
    { value: "all", label: I18N_KEYS.MIXED_SEARCH.COMMON.mixedSearch_searchFilterSelect_compareType_all },
];

export const POST_SORT_OPTIONS = [
    { value: "newest", label: I18N_KEYS.MIXED_SEARCH.COMMON.mixedSearch_searchFilterSelect_sort_newest },
    { value: "oldest", label: I18N_KEYS.MIXED_SEARCH.COMMON.mixedSearch_searchFilterSelect_sort_oldest },
    { value: "most_viewed", label: I18N_KEYS.MIXED_SEARCH.COMMON.mixedSearch_searchFilterSelect_sort_mostViewed },
];

function FilterLabel({
    icon: Icon,
    children,
}) {
    return (
        <span className="mb-2 flex items-center gap-2 font-ui text-sm font-bold text-main-text">
            <span className="flex h-7 w-7 items-center justify-center rounded-full">
                <Icon size={15} />
            </span>
            {children}
        </span>
    );
}

export default function PostSearchFilters({
    postSearchType,
    includeAi,
    sort,
    theme,
    onPostSearchTypeChange,
    onIncludeAiChange,
    onSortChange,
}) {

    const { t } = useTranslation();

    return (
        <div
            className={`
                flex w-full flex-col gap-4 rounded-3xl p-4 shadow-sm
                sm:p-5 lg:flex-row lg:items-end lg:justify-between
                ${theme?.filterPanel || "bg-secondary-200"}
            `}
        >
            <div className="w-full lg:w-auto">
                <FilterLabel icon={FiTarget}>
                    {t(I18N_KEYS.MIXED_SEARCH.COMMON.mixedSearch_searchFilterLabel_compareType)}
                </FilterLabel>

                <SoftSelect
                    value={postSearchType}
                    options={POST_SEARCH_TYPE_OPTIONS}
                    onChange={onPostSearchTypeChange}
                    className="w-full lg:w-auto"
                />
            </div>

            <div className="flex flex-col">
                <FilterLabel icon={WandSparkles}>
                    {t(I18N_KEYS.MIXED_SEARCH.COMMON.mixedSearch_searchFilterLabel_ai)}
                </FilterLabel>

                <button
                    type="button"
                    className={`
                        interaction-pop inline-flex min-h-11 items-center justify-center gap-2
                        rounded-full px-4 py-2.5 font-ui text-sm font-bold text-main-text
                        shadow-sm transition-all
                        ${
                            includeAi
                                ? "bg-main-bg hover:bg-bg-shade-50"
                                : "border border-bg-shade-100 bg-main-bg/60 hover:bg-main-bg"
                        }
                    `}
                    onClick={() => onIncludeAiChange(!includeAi)}
                >
                    <span
                        className={`
                            flex h-5 w-5 items-center justify-center rounded-full
                            ${
                                includeAi
                                    ? "bg-secondary-500 text-main-text"
                                    : "bg-bg-shade-100 text-transparent"
                            }
                        `}
                    >
                        <Check size={13} />
                    </span>

                    <span>{includeAi ? t(I18N_KEYS.MIXED_SEARCH.COMMON.mixedSearch_searchFilterSelect_ai_include) : t(I18N_KEYS.MIXED_SEARCH.COMMON.mixedSearch_searchFilterSelect_ai_exclude)}</span>
                </button>
            </div>

            <div className="w-full lg:w-auto">
                <FilterLabel icon={MdOutlineSort}>
                    {t(I18N_KEYS.MIXED_SEARCH.COMMON.mixedSearch_searchFilterLabel_sort)}
                </FilterLabel>

                <SoftSelect
                    value={sort}
                    options={POST_SORT_OPTIONS}
                    onChange={onSortChange}
                    className="w-full lg:w-auto"
                />
            </div>
        </div>
    );
}