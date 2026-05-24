import React from "react";
import { useTranslation } from "react-i18next";
import { I18N_KEYS } from "../i18n/key";
import { FaQuestionCircle } from "react-icons/fa";
import FieldErrorBubble from "./FieldErrorBubble";

export default function RadioGroupField({
    label,
    helperText = "",
    moreInfo = "",
    addHelperError,

    value,
    onChange,
    options = [],
    disabled = false,

    errorType = "",
    errorMessage = "",
    errorEmpty = I18N_KEYS.GLOBAL_ERROR.ERROR_handleInputEmpty,
    onClearError,

    className = "",
}) {
    const { t } = useTranslation();

    const getErrorMessage = (type) => {
        switch (type) {
            case "empty":
                return errorEmpty;
            default:
                return "";
        }
    };

    const displayedError =
        errorMessage ||
        getErrorMessage(errorType);

    const renderText = (text) => {
        if (!text) return "";
        return Array.isArray(text) ? t(...text) : t(text);
    };

    const handleMoreInfoClick = () => {
        if (!moreInfo || typeof addHelperError !== "function") return;

        addHelperError({
            id: Date.now(),
            code: moreInfo,
        });
    };

    const handleChange = (nextValue) => {
        if (disabled) return;

        onChange(nextValue);
        if (onClearError) onClearError();
    };

    return (
        <div className={`relative ${className}`}>
            {label && (
                <div className="mb-2 flex items-center gap-2">
                    <p
                        className={`
                            font-heading text-sm font-medium transition-colors
                            ${disabled ? "text-text-shade-200" : "text-text-shade-300"}
                        `}
                    >
                        {renderText(label)}
                    </p>

                    {moreInfo && (
                        <button
                            type="button"
                            onClick={handleMoreInfoClick}
                            className="text-text-shade-200 transition-colors hover:text-text-shade-300"
                        >
                            <FaQuestionCircle className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>
            )}

            <div
                className={`
                    flex flex-wrap gap-2 rounded-3xl
                    ${displayedError ? "outline-2 outline-accent-500 outline-offset-4" : ""}
                `}
            >
                {options.map((option) => {
                    const isActive = value === option.value;

                    return (
                        <button
                            key={option.value}
                            type="button"
                            disabled={disabled}
                            onClick={() => handleChange(option.value)}
                            className={`
                                rounded-full px-4 py-2 text-sm font-ui transition-all
                                border outline-none
                                ${
                                    disabled
                                        ? "cursor-not-allowed opacity-40 active:scale-100"
                                        : "active:scale-95"
                                }
                                ${
                                    isActive
                                        ? "bg-primary text-main-text border-primary"
                                        : "bg-main-bg text-main-text border-bg-shade-300"
                                }
                                ${
                                    !disabled && isActive
                                        ? "hover:bg-primary-700"
                                        : ""
                                }
                                ${
                                    !disabled && !isActive
                                        ? "hover:bg-bg-shade-100"
                                        : ""
                                }
                            `}
                        >
                            {renderText(option.label)}
                        </button>
                    );
                })}
            </div>

            {helperText && !displayedError && (
                <p className="mt-1.5 px-1 text-xs text-text-shade-200 italic font-body leading-relaxed">
                    {renderText(helperText)}
                </p>
            )}

            {displayedError && <FieldErrorBubble message={displayedError} />}
        </div>
    );
}