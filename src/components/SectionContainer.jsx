import React from "react";
import { useTranslation } from "react-i18next";
import { I18N_KEYS } from "../i18n/key";

export default function SectionContainer({
    title,
    description,
    headerRight,
    compact = false,
    className = "",
    children,
}) {

    const { t } = useTranslation();
    
    const renderText = (value) => {
        if (!value) return "";
        return Array.isArray(value) ? t(...value) : t(value);
    };

    const hasHeaderText = Boolean(title || description);
    const hasHeader = Boolean(hasHeaderText || headerRight);

    return (
        <section
            className={`
                w-full max-w-7xl mx-auto rounded-4xl
                shadow-sm bg-main-bg
                ${
                    compact
                        ? "my-4 px-4 py-4 sm:my-5 sm:px-6 sm:py-5 lg:px-7 lg:py-6"
                        : "my-8 px-4 py-6 sm:my-10 sm:px-8 sm:py-8 lg:px-10 lg:py-10"
                }
                ${className}
            `}
        >
            {hasHeader && (
                <div
                    className={`
                        flex gap-4
                        ${compact ? "mb-4" : "mb-8"}
                        ${
                            hasHeaderText
                                ? "flex-col sm:flex-row sm:items-start sm:justify-between"
                                : "items-center justify-end"
                        }
                    `}
                >
                    {hasHeaderText && (
                        <div className="min-w-0">
                            {title && (
                                <h1 className="font-heading text-2xl font-semibold text-main-text sm:text-3xl">
                                    {renderText(title)}
                                </h1>
                            )}

                            {description && (
                                <p className="mt-2 max-w-2xl font-body text-sm leading-relaxed text-text-shade-300">
                                    {renderText(description)}
                                </p>
                            )}
                        </div>
                    )}

                    {headerRight && (
                        <div className="shrink-0 self-end">
                            {headerRight}
                        </div>
                    )}
                </div>
            )}

            {children}
        </section>
    );
}