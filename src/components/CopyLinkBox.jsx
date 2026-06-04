import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { I18N_KEYS } from "../i18n/key";
import { formatDateByLanguage } from "../utils/dateFormat";
import { Check, Copy } from "lucide-react";


export default function CopyLinkBox({
    value,
    expiresAt,
    addHelperError,
    className = "",
}) {

    const { t, i18n } = useTranslation();

    const expiresAtText =
        formatDateByLanguage(expiresAt, i18n.language) ||
        t(I18N_KEYS.COMMON.common_dateFormat_unknownTime);

    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!copied) return;

        const timeoutID = setTimeout(() => {
            setCopied(false);
        }, 1600);

        return () => clearTimeout(timeoutID);
    }, [copied]);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            addHelperError?.({
                id: Date.now(),
                code: I18N_KEYS.VERIFY_RESULT.COMMON.verifyResult_helper_success_copyLink,
            });
        } catch (error) {
            addHelperError?.({
                id: Date.now(),
                code: I18N_KEYS.VERIFY_RESULT.COMMON.verifyResult_helper_error_copyLink,
            });
        }
    };

    return (
        <div className={`mx-auto mt-6 w-full max-w-4xl ${className}`}>
            <div className="mx-auto max-w-2xl rounded-4xl bg-main-bg/50 p-6 shadow-sm">
                <label
                    htmlFor="verify-share-link"
                    className="mb-2 block font-heading text-sm font-medium text-text-shade-500"
                >
                    {t(I18N_KEYS.VERIFY_RESULT.COMMON.verifyResult_copyLinkBoxLabel_shareLink)}
                </label>

                <div className="flex items-center gap-3">
                    <input
                        id="verify-share-link"
                        value={value}
                        readOnly
                        onFocus={(e) => e.target.select()}
                        className="
                            min-w-0 flex-1 rounded-full bg-bg-shade-50 px-4 py-2 font-ui text-sm text-main-text
                            outline-1 -outline-offset-1 outline-bg-shade-300 transition-all
                            focus:outline-2 focus:-outline-offset-2 focus:outline-primary-600
                        "
                    />

                    <button
                        type="button"
                        title={copied ? t(I18N_KEYS.VERIFY_RESULT.COMMON.verifyResult_copyLinkBoxIconLabel_copiedLink) : t(I18N_KEYS.VERIFY_RESULT.COMMON.verifyResult_copyLinkBoxIconLabel_copyLink)}
                        onClick={handleCopy}
                        className={`
                            interaction-pop inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full
                            shadow-sm transition-colors
                            ${
                                copied
                                    ? "bg-primary text-main-text hover:bg-primary-700"
                                    : "bg-bg-shade-50 text-main-text hover:bg-bg-shade-100"
                            }
                        `}
                    >
                        {copied ? <Check size={18} /> : <Copy size={18} />}
                    </button>
                </div>

                <p className="mt-2 px-1 font-body text-xs italic text-text-shade-300">
                    {t(I18N_KEYS.VERIFY_RESULT.COMMON.verifyResult_copyLinkBoxHelper_expireAt, {date: expiresAtText})}
                </p>
            </div>
        </div>
    );
}