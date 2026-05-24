import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { I18N_KEYS } from "../i18n/key";
import FieldErrorBubble from "./FieldErrorBubble";
import { censorProfanityText } from "../utils/profanityCensor";

const normalizeTagValue = (value) => {
    return value
        .replaceAll("#", "")
        .replaceAll(",", "")
        .replace(/\s/g, "")
        .slice(0, 50);
};

const isSameTag = (tagA, tagB) => {
    return tagA.trim().toLowerCase() === tagB.trim().toLowerCase();
};

const censorAndNormalizeTag = ({
    value,
    enableProfanityFilter,
    triggerMascotMood,
}) => {
    const cleanedValue = normalizeTagValue(value);

    if (!enableProfanityFilter) {
        return cleanedValue;
    }

    const result = censorProfanityText(cleanedValue);

    if (result.censored) {
        triggerMascotMood?.("surprised");
    }

    return normalizeTagValue(result.text);
};

export default function TagInput({
    id = "post-tags",
    label = I18N_KEYS.POST_CREATE.COMMON.postCreate_tagInputLabel_danhSachThe,
    tags,
    setTags,
    maxTags = 10,
    required = true,
    disabled = false,
    helperText = "",

    errorType = "",
    errorMessage = "",
    errorEmpty = I18N_KEYS.GLOBAL_ERROR.ERROR_handleInputEmpty,
    errorRangeOverflow = I18N_KEYS.GLOBAL_ERROR.ERROR_handleInputRangeOverflow,
    errorTooLong = I18N_KEYS.GLOBAL_ERROR.ERROR_handleInputTooLong,

    onClearError,
    className = "",
    triggerMascotMood,
    enableProfanityFilter = true,
}) {
    const { t } = useTranslation();
    const [draftTag, setDraftTag] = useState("");
    const [localErrorType, setLocalErrorType] = useState("");

    const canAddMore = tags.length < maxTags;

    const getErrorMessage = (type) => {
        switch (type) {
            case "empty":
                return errorEmpty;
            case "rangeOverflow":
                return errorRangeOverflow;
            case "tooLong":
                return errorTooLong;
            default:
                return "";
        }
    };

    const displayedError =
        errorMessage ||
        getErrorMessage(errorType) ||
        getErrorMessage(localErrorType);

    const clearError = () => {
        setLocalErrorType("");
        if (onClearError) onClearError();
    };

    const addDraftTag = () => {
        if (disabled) return;
        if (draftTag.trim().length > 50) {
            setLocalErrorType("tooLong");
            setDraftTag("");
            return;
        }

        const nextTag = censorAndNormalizeTag({
            value: draftTag.trim(),
            enableProfanityFilter,
            triggerMascotMood,
        });

        if (!nextTag) {
            setDraftTag("");
            return;
        }

        if (!canAddMore) {
            setLocalErrorType("rangeOverflow");
            setDraftTag("");
            return;
        }

        const isDuplicated = tags.some((tag) => isSameTag(tag, nextTag));

        if (isDuplicated) {
            setDraftTag("");
            return;
        }

        setTags((prev) => [...prev, nextTag]);
        setDraftTag("");
        clearError();
    };

    const handleDraftKeyDown = (e) => {
        if (disabled) return;
        if (e.key === "," || e.key === " " || e.key === "Enter") {
            e.preventDefault();
            addDraftTag();
        }
    };

    const handleDraftChange = (e) => {
        if (disabled) return;
        const rawValue = e.target.value;
        const hasSeparator = /[,\s]/.test(rawValue);

        if (hasSeparator) {
            const rawParts = rawValue
                .split(/[,\s]+/)
                .map((part) => part.trim())
                .filter(Boolean);

            const hasTooLongTag = rawParts.some((part) => part.length > 50);

            const parts = rawParts
                .map((part) =>
                    censorAndNormalizeTag({
                        value: part,
                        enableProfanityFilter,
                        triggerMascotMood,
                    })
                )
                .filter(Boolean);

            if (parts.length === 0) {
                setDraftTag("");
                return;
            }

            let hasOverflow = false;

            setTags((prev) => {
                const nextTags = [...prev];

                for (const part of parts) {
                    if (nextTags.length >= maxTags) {
                        hasOverflow = true;
                        break;
                    }

                    const isDuplicated = nextTags.some((tag) => isSameTag(tag, part));

                    if (!isDuplicated) {
                        nextTags.push(part);
                    }
                }

                return nextTags;
            });

            setDraftTag("");

            if (hasTooLongTag) {
                setLocalErrorType("tooLong");
                return;
            }

            if (hasOverflow) {
                setLocalErrorType("rangeOverflow");
                return;
            }

            clearError();
            return;
        }

        if (rawValue.length > 50) {
            setLocalErrorType("tooLong");
            setDraftTag(normalizeTagValue(rawValue));
            return;
        }

        const nextValue = normalizeTagValue(rawValue);

        setDraftTag(nextValue);
        clearError();
    };

    const handleTagChange = (index, value) => {
        if (disabled) return;
        if (value.length > 50) {
            setLocalErrorType("tooLong");
            return;
        }

        const nextValue = censorAndNormalizeTag({
            value,
            enableProfanityFilter,
            triggerMascotMood,
        });

        setTags((prev) => {
            if (!nextValue) {
                return prev.filter((_, currentIndex) => currentIndex !== index);
            }

            const isDuplicated = prev.some((tag, currentIndex) => {
                if (currentIndex === index) return false;
                return isSameTag(tag, nextValue);
            });

            if (isDuplicated) {
                return prev.filter((_, currentIndex) => currentIndex !== index);
            }

            return prev.map((tag, currentIndex) => {
                if (currentIndex !== index) return tag;
                return nextValue;
            });
        });

        clearError();
    };

    const removeTag = (index) => {
        if (disabled) return;
        setTags((prev) => prev.filter((_, currentIndex) => currentIndex !== index));
        clearError();
    };

    return (
        <div className={`relative ${className}`}>
            {label && (
                <label
                    htmlFor={id}
                    className="font-heading font-medium block text-sm/6 text-text-shade-300 mb-2"
                >
                    {Array.isArray(label) ? t(...label) : t(label)}
                    {!required && (
                        <span className="text-shadow-accent-200 text-xs font-light ml-2" title="optional">
                            {t(I18N_KEYS.COMMON.common_input_label_optional)}
                        </span>
                    )}
                </label>
            )}

            <div
                className={`
                    relative min-h-14 w-full rounded-3xl bg-bg-shade-50 px-3 py-3
                    outline-1 -outline-offset-1 outline-bg-shade-300
                    focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-primary-600
                    transition-all
                    ${displayedError ? "outline-accent-500" : ""}
                    ${disabled ? "cursor-not-allowed bg-bg-shade-100 opacity-70": ""}
                `}
            >
                <div className="flex flex-wrap items-center gap-2 pr-12">
                    {tags.map((tag, index) => (
                        <div
                            key={`${tag}-${index}`}
                            className={`inline-flex items-center gap-1 rounded-full  px-3 py-1 text-xs font-ui font-semibold text-main-text
                                        ${disabled ? "bg-bg-shade-200" : "bg-accent-200"}
                            `}
                        >
                            <span className={ disabled ? "text-text-shade-400" : "text-accent-500"}>#</span>

                            <input
                                value={tag}
                                disabled = {disabled}
                                onChange={(e) => handleTagChange(index, e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "," || e.key === " " || e.key === "Enter") {
                                        e.preventDefault();
                                        e.currentTarget.blur();
                                    }
                                }}
                                className="w-[7ch] max-w-32 bg-transparent outline-none font-ui text-xs font-semibold text-main-text
                                            disabled:cursor-not-allowed
                                            disabled:text-text-shade-700
                                            disabled:placeholder:text-text-shade-200
                                            disabled:opacity-70"
                                style={{
                                    width: `${Math.max(tag.length, 1)}ch`,
                                }}
                            />

                            <button
                                type="button"
                                disabled = {disabled}
                                onClick={() => removeTag(index)}
                                className="ml-1 text-text-shade-400 hover:text-accent transition-colors
                                disabled:cursor-not-allowed
                                disabled:text-text-shade-700
                                disabled:placeholder:text-text-shade-200
                                disabled:opacity-70"
                            >
                                ×
                            </button>
                        </div>
                    ))}

                    {canAddMore && (
                        <input
                            id={id}
                            value={draftTag}
                            disabled = {disabled}
                            onChange={handleDraftChange}
                            onKeyDown={handleDraftKeyDown}
                            onBlur={addDraftTag}
                            placeholder={tags.length === 0 ? t(I18N_KEYS.POST_CREATE.COMMON.postCreate_tagInputPlaceholder_danhSachThe) : ""}
                            className="min-w-36 flex-1 bg-transparent outline-none text-sm text-main-text placeholder:text-text-shade-200 font-ui"
                        />
                    )}
                </div>

                <span
                    className={`
                        absolute right-4 bottom-3 text-xs font-ui
                        ${tags.length >= maxTags ? "text-accent" : "text-text-shade-200"}
                    `}
                >
                    {tags.length}/{maxTags}
                </span>
            </div>

            {helperText && !displayedError && (
                <p className="mt-1.5 px-1 text-xs text-text-shade-200 italic font-body leading-relaxed">
                    {Array.isArray(helperText) ? t(...helperText) : t(helperText)}
                </p>
            )}

            {displayedError && <FieldErrorBubble message={displayedError} />}
        </div>
    );
}