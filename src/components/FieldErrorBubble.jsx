import React from "react";
import { useTranslation } from "react-i18next";

export default function FieldErrorBubble({
    message,
    isClosing = false,
    className = "",
}) {
    const { t } = useTranslation();

    if (!message) return null;

    return (
        <div
            className={`
                absolute top-full right-0 mt-4 mr-2 z-50 pointer-events-none
                ${isClosing ? "animate-popup-exit" : "animate-popup-appear-and-float"}
                ${className}
            `}
        >
            <div className="absolute -top-2 right-6 w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-b-10 border-accent"></div>

            <div className="bg-accent-200 text-main-text px-4 py-1.5 rounded-4xl border-2 border-accent text-xs shadow-[3px_3px_0px_0px] shadow-accent max-w-44 sm:max-w-60">
                <span className="block wrap-break-words italic leading-relaxed font-body">
                    {Array.isArray(message) ? t(...message) : t(message)}
                </span>
            </div>
        </div>
    );
}