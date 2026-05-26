const LANGUAGE_LOCALE_MAP = {
    vi: "vi-VN",
    en: "en-US",
    ja: "ja-JP",
    es: "es-ES",
};

export const getLocaleFromLanguage = (language) => {
    if (!language) return "vi-VN";

    const normalizedLanguage = language.split("-")[0];

    return LANGUAGE_LOCALE_MAP[normalizedLanguage] || "vi-VN";
};

const isValidDate = (date) => {
    return date instanceof Date && !Number.isNaN(date.getTime());
};

export const formatDateTimeByLanguage = (dateValue, language) => {
    if (!dateValue) return null;

    const date = new Date(dateValue);
    if (!isValidDate(date)) return null;

    const locale = getLocaleFromLanguage(language);

    return new Intl.DateTimeFormat(locale, {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(date);
};

export const formatDateByLanguage = (dateValue, language) => {
    if (!dateValue) return null;

    const date = new Date(dateValue);
    if (!isValidDate(date)) return null;

    const locale = getLocaleFromLanguage(language);

    return new Intl.DateTimeFormat(locale, {
        dateStyle: "medium",
    }).format(date);
};