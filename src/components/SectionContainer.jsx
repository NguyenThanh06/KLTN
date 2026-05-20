import React from "react";
import { useTranslation } from "react-i18next";
import { I18N_KEYS } from "../i18n/key";

export default function SectionContainer({
    title,
    description,
    headerRight,
    className = "",
    children,
}) {

    const { t } = useTranslation();

    return (
        <section
            className={`
                w-full max-w-7xl mx-auto my-8 sm:my-10 rounded-4xl
                px-4 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-10
                shadow-sm bg-main-bg
                ${className}
            `}
        >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-8 ">
                <div>
                    {title && (
                        <h1 className="font-heading text-2xl sm:text-3xl font-semibold text-main-text">
                            {t(title)}
                        </h1>
                    )}

                    {description && (
                        <p className="mt-2 max-w-2xl font-body text-sm text-text-shade-300 leading-relaxed">
                            {t(description)}
                        </p>
                    )}
                </div>

                {headerRight && <div className="shrink-0">{headerRight}</div>}
            </div>

            {children}
        </section>
    );
}