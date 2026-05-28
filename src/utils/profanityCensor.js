import { PROFANITY_DICTIONARY } from "../constants/profanityDictionary";

const escapeRegExp = (text) => {
    return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const hasCjkLikeCharacter = (text) => {
    return /[\u3040-\u30ff\u3400-\u9fff\uf900-\ufaff\uac00-\ud7af]/u.test(text);
};

const getAllBlockedWords = () => {
    return [...new Set(
        Object.values(PROFANITY_DICTIONARY)
            .flat()
            .filter(Boolean)
            .map((word) => word.trim())
            .filter(Boolean)
    )].sort((a, b) => b.length - a.length);
};

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
        const shouldMatchDirectly = hasCjkLikeCharacter(word);

        const regex = shouldMatchDirectly
            ? new RegExp(`(${escapedWord})`, "gu")
            : new RegExp(
                `(^|[^\\p{L}\\p{N}_])(${escapedWord})(?=$|[^\\p{L}\\p{N}_])`,
                "giu"
            );

        nextText = nextText.replace(regex, (...args) => {
            censored = true;

            if (shouldMatchDirectly) {
                return "***";
            }

            const prefix = args[1];
            return `${prefix}***`;
        });
    });

    return {
        text: nextText,
        censored,
    };
};