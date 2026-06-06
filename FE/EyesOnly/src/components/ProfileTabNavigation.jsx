import { useTranslation } from "react-i18next";
import { I18N_KEYS } from "../i18n/key";
import { motion } from "framer-motion";
import { Ban, KeyRound, PencilLine, UserLock } from "lucide-react";

const PROFILE_TABS = [
    {
        key: "edit",
        label: I18N_KEYS.PROFILE.COMMON.profile_profileTabNavigationLabel_edit,
        Icon: PencilLine,
    },
    {
        key: "password",
        label: I18N_KEYS.PROFILE.COMMON.profile_profileTabNavigationLabel_password,
        Icon: KeyRound,
    },
    {
        key: "disabled",
        label: I18N_KEYS.PROFILE.COMMON.profile_profileTabNavigationLabel_disabled,
        Icon: UserLock,
    },
    {
        key: "blocking",
        label: I18N_KEYS.PROFILE.COMMON.profile_profileTabNavigationLabel_blocking,
        Icon: Ban,
    },
];

export default function ProfileTabNavigation({
    activeTab,
    onTabChange,
    className = "",
}) {

    const { t, i18n } = useTranslation();

    return (
        <div
            className={`
                grid grid-cols-4 gap-2 rounded-4xl bg-main-bg px-2 pt-2
                sm:gap-4 sm:px-4 sm:pt-4
                ${className}
            `}
        >
            {PROFILE_TABS.map((tab) => {
                const isActive = activeTab === tab.key;
                const Icon = tab.Icon;

                return (
                    <motion.button
                        key={tab.key}
                        type="button"
                        layout
                        onClick={() => onTabChange?.(tab.key)}
                        className={`
                            group relative flex min-w-0 flex-col items-center gap-2 rounded-4xl px-1 pb-5 pt-2
                            font-ui text-[0.68rem] font-bold transition-colors sm:px-3 sm:text-xs
                            ${isActive ? "text-primary-500" : "text-text-shade-300 hover:text-main-text"}
                        `}
                    >
                        {isActive && (
                            <motion.span
                                layoutId="profile-active-tab-bridge"
                                className="
                                    absolute bottom-0 left-1/2 h-7 w-12 -translate-x-1/2 translate-y-3
                                    rounded-t-full bg-main-bg border-t
                                "
                                transition={{
                                    type: "spring",
                                    stiffness: 360,
                                    damping: 32,
                                }}
                            />
                        )}

                        <span
                            className={`
                                relative z-10 flex h-12 w-12 items-center justify-center rounded-full border transition-all
                                sm:h-16 sm:w-16
                                ${
                                    isActive
                                        ? "border-primary-500 bg-bg-shade-50 shadow-sm"
                                        : "border-bg-shade-200 bg-bg-shade-50 group-hover:bg-bg-shade-100"
                                }
                            `}
                        >
                            <Icon size={26} strokeWidth={isActive ? 2.4 : 2} />
                        </span>

                        <span className="relative z-10 line-clamp-2 max-w-20 text-center leading-tight sm:max-w-28">
                            {t(tab.label)}
                        </span>
                    </motion.button>
                );
            })}
        </div>
    );
}