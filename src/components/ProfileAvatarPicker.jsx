import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { I18N_KEYS } from "../i18n/key";

import { Camera } from "lucide-react";
import { RiResetLeftLine } from "react-icons/ri";

import Button from "./Button";
import FieldErrorBubble from "./FieldErrorBubble";

const ACCEPTED_AVATAR_TYPES = [
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/bmp",
    "image/webp",
];

const AVATAR_TYPE_ERROR = I18N_KEYS.PROFILE.HANDLE.EDIT_PROFILE.profile_handleEditProfile_helper_error_typeMismatchAvatar;

export default function ProfileAvatarPicker({
    avatar,
    displayName,
    onRandomAvatar,
    onFileSelect,
    className = "",
}) {

    const { t } = useTranslation();

    const fileInputRef = useRef(null);
    const [localError, setLocalError] = useState("");

    const handleOpenFilePicker = () => {
        fileInputRef.current?.click();
    };

    const clearError = () => {
        setLocalError("");
    };

    const handleRandomAvatar = () => {
        clearError();
        onRandomAvatar?.();
    };

    const handleFileChange = (event) => {
        const file = event.target.files?.[0];

        event.target.value = "";

        if (!file) return;

        if (!ACCEPTED_AVATAR_TYPES.includes(file.type)) {
            setLocalError(AVATAR_TYPE_ERROR);
            return;
        }

        clearError();
        onFileSelect?.(file);
    };

    return (
        <div
            className={`
                relative flex flex-col items-center justify-center gap-4 text-center
                ${className}
            `}
        >
            <div className="rounded-full bg-main-bg p-2 shadow-sm">
                <img
                    src={avatar}
                    alt={displayName || "Avatar"}
                    className="h-28 w-28 rounded-full object-cover"
                />
            </div>

            <input
                ref={fileInputRef}
                type="file"
                accept=".png,.jpg,.jpeg,.bmp,.webp,image/png,image/jpeg,image/bmp,image/webp"
                className="hidden"
                onChange={handleFileChange}
            />

            <div className="flex w-full max-w-xs flex-col gap-3">
                <Button
                    type="button"
                    variant="outline"
                    size="large"
                    className="flex items-center justify-center gap-2 rounded-full"
                    onClick={handleRandomAvatar}
                >
                    <RiResetLeftLine size={16} />
                    {t(I18N_KEYS.PROFILE.COMMON.profile_editTabButton_resetAvatar)}
                </Button>

                <Button
                    type="button"
                    variant="primary"
                    size="large"
                    className="flex items-center justify-center gap-2 rounded-full"
                    onClick={handleOpenFilePicker}
                >
                    <Camera size={16} />
                    {t(I18N_KEYS.PROFILE.COMMON.profile_editTabButton_uploadAvatar)}
                </Button>
            </div>

            {localError && (
                <FieldErrorBubble
                    message={localError}
                    className="!top-full !right-4 !mt-2"
                />
            )}
        </div>
    );
}