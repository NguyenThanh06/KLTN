import { Trans, useTranslation } from "react-i18next";
import { I18N_KEYS } from "../i18n/key";

const numberFormatter = new Intl.NumberFormat("en-US");

export default function SearchResultSummary({
    mode,
    keyword = "",
    totalResults = 0,
}) {
    const { t } = useTranslation();

    const trimmedKeyword = keyword?.trim();

    const titleKey = mode === "post"
        ? I18N_KEYS.MIXED_SEARCH.COMMON.mixedSearch_searchResultSummaryTitle_postMode_withoutKey
        : I18N_KEYS.MIXED_SEARCH.COMMON.mixedSearch_searchResultSummaryTitle_accMode_withoutKey;

    const titleWithKeywordKey = mode === "post"
        ? I18N_KEYS.MIXED_SEARCH.COMMON.mixedSearch_searchResultSummaryTitle_postMode_withKey
        : I18N_KEYS.MIXED_SEARCH.COMMON.mixedSearch_searchResultSummaryTitle_accMode_withKey;

    return (
        <div className="border-b border-primary pb-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <h2 className="max-w-3xl wrap-break-word font-heading text-xl font-bold leading-snug text-main-text sm:text-2xl">
                    {trimmedKeyword ? (
                        <Trans
                            i18nKey={titleWithKeywordKey}
                            values={{ keyword: trimmedKeyword }}
                            components={{
                                keyword: (
                                    <span className="text-primary-700" />
                                ),
                            }}
                        />
                    ) : (
                        t(titleKey)
                    )}
                </h2>

                <p className="shrink-0 font-ui text-lg font-bold text-primary-700 sm:text-xl">
                    {numberFormatter.format(Number(totalResults || 0))}
                </p>
            </div>
        </div>
    );
}