import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { I18N_KEYS } from "../i18n/key";
import FieldErrorBubble from "./FieldErrorBubble";
import { censorProfanityText } from "../utils/profanityCensor";

export default function TextAreaInput({
    id,
    label,
    optional = false,
    placeholder,
    helperText,
    className = "",
    errorEmpty = I18N_KEYS.GLOBAL_ERROR.ERROR_handleInputEmpty,
    errorTooShort = I18N_KEYS.GLOBAL_ERROR.ERROR_handleInputTooShort,
    errorTooLong = I18N_KEYS.GLOBAL_ERROR.ERROR_handleInputTooLong,
    errorGeneric = I18N_KEYS.GLOBAL_ERROR.ERROR_handleInputInvalid,
    rows = 5,
    triggerMascotMood,
    enableProfanityFilter = true,
    ...rest
}) {
    const { t } = useTranslation();
    const [hasError, setHasError] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [isClosing, setIsClosing] = useState(false);

    const handleInvalid = (e) => {
        e.preventDefault();

        const validity = e.target.validity;

        if (validity.valueMissing) {
            setErrorMessage(errorEmpty);
        } else if (validity.tooShort) {
            setErrorMessage(errorTooShort);
        } else if (validity.tooLong) {
            setErrorMessage(errorTooLong);
        } else {
            setErrorMessage(errorGeneric);
        }

        setIsClosing(false);
        setHasError(true);
    };

    const handleInput = (e) => {
        if (hasError) {
            setIsClosing(true);

            setTimeout(() => {
                setHasError(false);
                setIsClosing(false);
            }, 200);
        }

        if (rest.onInput) rest.onInput(e);
    };

    return (
        <div className={`relative ${className}`}>
            {label && (
                <label
                    htmlFor={id}
                    className="font-heading font-medium block text-sm/6 text-text-shade-300 mb-2"
                >
                    {Array.isArray(label) ? t(...label) : t(label)}
                    {optional && (
                        <span className="text-shadow-accent-200 text-xs font-light ml-2" title="optional">
                            {t(I18N_KEYS.COMMON.common_input_label_optional)}
                        </span>
                    )}
                </label>
            )}

            <textarea
                id={id}
                rows={rows}
                {...rest}
                onInvalid={handleInvalid}
                onInput={handleInput}
                onChange={(e) => {
                    if (rest.disabled) return;

                    if (!enableProfanityFilter) {
                        rest.onChange?.(e);
                        return;
                    }

                    const result = censorProfanityText(e.target.value);

                    if (result.censored) {
                        e.target.value = result.text;
                        triggerMascotMood?.("surprised");
                    }

                    rest.onChange?.(e);
                }}
                placeholder={Array.isArray(placeholder) ? t(...placeholder) : t(placeholder)}
                className={`
                    block w-full resize-none rounded-3xl bg-bg-shade-50 px-4 py-3
                    text-base text-text-shade-900 outline-1 -outline-offset-1 outline-bg-shade-300
                    placeholder:text-text-shade-200 focus:outline-2 focus:-outline-offset-2
                    focus:outline-primary-600 font-ui sm:text-sm/6 transition-all
                    disabled:cursor-not-allowed
                    disabled:bg-bg-shade-100
                    disabled:text-text-shade-200
                    disabled:placeholder:text-text-shade-200
                    disabled:outline-bg-shade-200
                    disabled:opacity-70
                    disabled:focus:outline-bg-shade-200
                    ${hasError ? "outline-accent-500" : ""}
                `}
            />

            {helperText && !hasError && (
                <p className="mt-1.5 text-xs text-text-shade-200 italic font-body px-1">
                    {Array.isArray(helperText) ? t(...helperText) : t(helperText)}
                </p>
            )}

            {hasError && <FieldErrorBubble message={errorMessage} isClosing={isClosing} />}
        </div>
    );
}