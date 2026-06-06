import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { I18N_KEYS } from "../i18n/key";
import { Ban, Flag, PencilLine, Settings, X } from "lucide-react";

const MenuButton = ({ icon, children, danger = false, onClick }) => (
    <button
        type="button"
        className={`
            interaction-pop flex w-full items-center gap-3 rounded-3xl px-5 py-3.5 text-left font-ui text-sm font-bold
            ${
                danger
                    ? "text-accent-700 hover:bg-accent-100"
                    : "text-main-text hover:bg-bg-shade-100"
            }
        `}
        onClick={onClick}
    >
        {icon}
        <span>{children}</span>
    </button>
);

export default function UserActionMenuModal({
    isOpen,
    isCurrentAccount = false,
    onClose,
    onEditProfile,
    onOpenSettings,
    onBlock,
    onReport,
}) {
    const { t, i18n } = useTranslation();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-main-text/40 px-4 py-6 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 10 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="relative w-full max-w-md overflow-hidden rounded-4xl bg-main-bg p-6 shadow-xl sm:p-7"
            >
                <button
                    type="button"
                    className="interaction-pop absolute right-5 top-5 rounded-full bg-bg-shade-50 p-2 text-main-text hover:bg-bg-shade-100"
                    onClick={onClose}
                >
                    <X size={18} />
                </button>

                <div className="mb-5 pr-12">
                    <h2 className="font-heading text-xl font-bold text-main-text">
                        {t(I18N_KEYS.USER_DETAIL.COMMON.userDetail_userActionMenuModalTitle)}
                    </h2>

                    <p className="mt-1.5 font-body text-sm leading-6 text-text-shade-400">
                        {t(I18N_KEYS.USER_DETAIL.COMMON.userDetail_userActionMenuModalDesc)}
                    </p>
                </div>

                <div className="space-y-2 rounded-4xl bg-bg-shade-50/50 p-3">
                    {isCurrentAccount ? (
                        <>
                            <MenuButton
                                icon={<PencilLine size={18} />}
                                onClick={onEditProfile}
                            >
                                {t(I18N_KEYS.USER_DETAIL.COMMON.userDetail_userActionMenuModalButton_profileEdit)}
                            </MenuButton>

                            <MenuButton
                                icon={<Settings size={18} />}
                                onClick={onOpenSettings}
                            >
                                {t(I18N_KEYS.USER_DETAIL.COMMON.userDetail_userActionMenuModalButton_profileSetting)}
                            </MenuButton>
                        </>
                    ) : (
                        <>
                            <MenuButton
                                icon={<Ban size={18} />}
                                danger
                                onClick={onBlock}
                            >
                                {t(I18N_KEYS.USER_DETAIL.COMMON.userDetail_userActionMenuModalButton_block)}
                            </MenuButton>

                            <MenuButton
                                icon={<Flag size={18} />}
                                onClick={onReport}
                            >
                                {t(I18N_KEYS.USER_DETAIL.COMMON.userDetail_userActionMenuModalButton_report)}
                            </MenuButton>
                        </>
                    )}
                </div>
            </motion.div>
        </div>
    );
}