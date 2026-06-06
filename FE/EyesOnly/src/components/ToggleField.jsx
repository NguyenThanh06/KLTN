import React from "react";
import { useTranslation } from "react-i18next";
import { I18N_KEYS } from "../i18n/key";

export default function ToggleField({
    label,
    checked,
    onChange,
    className = "",
}) {

    const { t } = useTranslation();

    return (
        <button
            type="button"
            onClick={() => onChange(!checked)}
            className={`inline-flex items-center gap-3 rounded-full bg-bg-shade-50 px-4 py-2 font-ui text-sm text-main-text outline-1 outline-bg-shade-300 transition-all hover:bg-bg-shade-100 ${className}`}
        >
            <span>{t(label)}</span>

            <span
                className={`
                    relative h-6 w-11 rounded-full transition-all
                    ${checked ? "bg-primary" : "bg-bg-shade-300"}
                `}
            >
                <span
                    className={`
                        absolute top-1 h-4 w-4 rounded-full bg-main-bg transition-all
                        ${checked ? "left-6" : "left-1"}
                    `}
                />
            </span>
        </button>
    );
}