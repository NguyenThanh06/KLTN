import React from "react";
import { useTranslation } from "react-i18next";
import { I18N_KEYS } from "../i18n/key";
import { Link } from "react-router-dom";

import { FaArrowRight } from "react-icons/fa6";

const PostSectionContainer = ({
    title,
    description,
    children,
    showMore = "",
    className = "",
}) => {
    const { t } = useTranslation();

    const renderText = (value) => {
        if (!value) return "";
        return Array.isArray(value) ? t(...value) : t(value);
    };

    return (
        <section
            className={`mx-auto mb-28 max-w-7xl px-4 sm:mb-40 sm:px-6 lg:px-8 ${className}`}
        >
            <div className="mb-10 border-b border-secondary-700 pb-4">
                <h2 className="font-heading text-2xl font-black uppercase tracking-tight text-main-text sm:text-3xl">
                    {renderText(title)}
                </h2>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    {description && (
                        <p className="mt-2 font-ui text-sm font-medium tracking-wide text-text-shade-400">
                            {renderText(description)}
                        </p>
                    )}

                    {showMore && (
                        <Link
                            to={showMore}
                            className="interaction-pop inline-flex items-center self-start rounded-full px-3 py-1 font-ui text-sm font-light text-text-shade-400 hover:bg-bg-shade-50 hover:underline hover:underline-offset-2 sm:self-auto"
                        >
                            {t(I18N_KEYS.HOME.COMMON.home_postSection_button_showMore)}
                            <FaArrowRight className="ml-2 text-xs" />
                        </Link>
                    )}
                </div>
            </div>

            <div className="relative">
                {children}
            </div>
        </section>
    );
};

export default PostSectionContainer;