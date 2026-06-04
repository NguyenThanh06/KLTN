import { useTranslation } from "react-i18next";
import { I18N_KEYS } from "../i18n/key";
import { Check, MoreHorizontal, Share2 } from "lucide-react";

const ActionIconButton = ({
    children,
    label,
    isActive = false,
    onClick,
}) => {
    const { t, i18n } = useTranslation();

    return (
        <button
            type="button"
            title={t(label)}
            className={`
                interaction-pop inline-flex h-9 w-9 items-center justify-center rounded-full
                shadow-sm transition-colors
                ${
                    isActive
                        ? "bg-primary text-main-text hover:bg-primary-700"
                        : "bg-bg-shade-50 text-main-text hover:bg-bg-shade-100"
                }
            `}
            onClick={onClick}
        >
            {children}
        </button>
    );
};

export default function UserHeaderActions({
    isShareDone = false,
    onShare,
    onOpenMenu,
}) {
    return (
        <div className="flex items-center justify-end gap-2">
            <ActionIconButton 
                label={I18N_KEYS.USER_DETAIL.COMMON.userDetail_userHeaderActionsLabel_copyLink}
                isActive={isShareDone} 
                onClick={onShare}
            >
                {isShareDone ? <Check size={17} /> : <Share2 size={17} />}
            </ActionIconButton>

            <ActionIconButton 
                label={I18N_KEYS.USER_DETAIL.COMMON.userDetail_userHeaderActionsLabel_more}
                onClick={onOpenMenu}
            >
                <MoreHorizontal size={19} />
            </ActionIconButton>
        </div>
    );
}