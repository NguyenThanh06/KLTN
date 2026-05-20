import { PROFANITY_DICTIONARY } from "../constants/profanityDictionary";

const escapeRegExp = (text) => {
    return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const getAllBlockedWords = () => {
    return Object.values(PROFANITY_DICTIONARY)
        .flat()
        .filter(Boolean)
        .map((word) => word.trim())
        .filter(Boolean);
};

/*
 * Với tiếng Việt / Anh:
 * Dùng boundary tương đối để tránh censor nhầm từ nằm trong từ dài hơn.
 *
 * Ví dụ:
 * - "bad" bị censor trong "bad!"
 * - nhưng không censor trong "badge"
 *
 * Với Nhật/Hàn, boundary kiểu \b không ổn hoàn toàn,
 * nên nếu dictionary có từ Nhật/Hàn thì vẫn match trực tiếp.
 */
export const censorProfanityText = (text) => {
    if (!text) {
        return {
            text,
            censored: false,
        };
    }

    const blockedWords = getAllBlockedWords();

    if (blockedWords.length === 0) {
        return {
            text,
            censored: false,
        };
    }

    let nextText = text;
    let censored = false;

    blockedWords.forEach((word) => {
        const escapedWord = escapeRegExp(word);

        const regex = new RegExp(
            `(^|[^\\p{L}\\p{N}_])(${escapedWord})(?=$|[^\\p{L}\\p{N}_])`,
            "giu"
        );

        nextText = nextText.replace(regex, (match, prefix) => {
            censored = true;
            return `${prefix}***`;
        });
    });

    return {
        text: nextText,
        censored,
    };
};