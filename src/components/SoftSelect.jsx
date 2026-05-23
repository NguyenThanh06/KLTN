import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { I18N_KEYS } from "../i18n/key";

import { ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export default function SoftSelect({
    label,
    value,
    options = [],
    onChange,
    className = "",
}) {
    const { t } = useTranslation();

    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef(null);

    const selectedOption = options.find((option) => option.value === value);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!wrapperRef.current) return;
            if (!wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <div ref={wrapperRef} className={`relative ${className}`}>
            {label && (
                <span className="mb-2 block font-ui text-sm font-bold text-main-text">
                    {t(label)}
                </span>
            )}

            <button
                type="button"
                className={`
                    flex w-full min-w-52 items-center justify-between gap-3 rounded-full
                    border border-bg-shade-100 bg-main-bg px-4 py-2.5
                    text-left font-ui text-sm text-main-text shadow-sm outline-none
                    transition-all hover:bg-bg-shade-50
                    ${isOpen ? "border-primary-500" : ""}
                `}
                onClick={() => setIsOpen((prev) => !prev)}
            >
                <span className="truncate">
                    {t(selectedOption?.label || I18N_KEYS.COMMON.common_select_option_chooseOne)}
                </span>

                <ChevronDown
                    size={18}
                    className={`
                        shrink-0 text-text-shade-400 transition-transform
                        ${isOpen ? "rotate-180" : ""}
                    `}
                />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.98 }}
                        transition={{ duration: 0.18, ease: "easeOut" }}
                        className="
                            absolute left-0 right-0 top-full z-30 mt-2 max-h-72 overflow-y-auto
                            rounded-4xl bg-main-bg p-2 shadow-xl
                        "
                    >
                        {options.map((option) => {
                            const isSelected = option.value === value;

                            return (
                                <button
                                    key={option.value}
                                    type="button"
                                    className={`
                                        interaction-pop w-full rounded-3xl px-4 py-3 text-left
                                        font-ui text-sm font-bold text-main-text transition-colors
                                        ${
                                            isSelected
                                                ? "bg-primary-500 hover:bg-primary-400"
                                                : "hover:bg-primary-200"
                                        }
                                    `}
                                    onClick={() => {
                                        onChange?.(option.value);
                                        setIsOpen(false);
                                    }}
                                >
                                    {t(option.label)}
                                </button>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}