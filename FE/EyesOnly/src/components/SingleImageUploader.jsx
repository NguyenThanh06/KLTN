import React, { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { I18N_KEYS } from "../i18n/key";
import Button from "./Button";
import FieldErrorBubble from "./FieldErrorBubble";

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/bmp"];

const createFileItem = (file) => ({
    id: `${file.name}-${file.size}-${file.lastModified}-${crypto.randomUUID()}`,
    file,
    url: URL.createObjectURL(file),
});

export default function SingleImageUploader({
    files,
    setFiles,
    maxFileSizeMB = 15,
    onProcessingChange,

    errorType = "",
    errorMessage = "",
    errorEmpty = I18N_KEYS.GLOBAL_ERROR.ERROR_handleInputEmpty,
    errorTypeFile = I18N_KEYS.GLOBAL_ERROR.errorTypeFile,
    errorRangeOverflow = I18N_KEYS.GLOBAL_ERROR.errorRangeOverflow,
    errorTooMany = I18N_KEYS.GLOBAL_ERROR.errorTooMany,

    onClearError,
    className = "",
}) {
    const { t } = useTranslation();

    const fileInputRef = useRef(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const [localErrorType, setLocalErrorType] = useState("");

    const selectedFile = files?.[0];
    const isFull = Boolean(selectedFile);

    const getErrorMessage = (type) => {
        switch (type) {
            case "empty":
                return errorEmpty;
            case "type":
                return errorTypeFile;
            case "rangeOverflow":
                return errorRangeOverflow;
            case "tooMany":
                return errorTooMany;
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
        onClearError?.();
    };

    const replaceFile = (file) => {
        setFiles((prev) => {
            prev.forEach((item) => URL.revokeObjectURL(item.url));
            return [createFileItem(file)];
        });
    };

    const validateAndSetFile = async (fileList) => {
        try {
            onProcessingChange?.(true);
            clearError();

            const incomingFiles = Array.from(fileList || []);
            if (incomingFiles.length === 0) return;

            if (incomingFiles.length > 1) {
                setLocalErrorType("tooMany");
                return;
            }

            const file = incomingFiles[0];

            if (!ACCEPTED_TYPES.includes(file.type)) {
                setLocalErrorType("type");
                return;
            }

            if (file.size > maxFileSizeMB * 1024 * 1024) {
                setLocalErrorType("rangeOverflow");
                return;
            }

            replaceFile(file);
        } finally {
            onProcessingChange?.(false);
        }
    };

    const handleRemove = () => {
        setFiles((prev) => {
            prev.forEach((item) => URL.revokeObjectURL(item.url));
            return [];
        });
        clearError();
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragOver(false);
        validateAndSetFile(e.dataTransfer.files);
    };

    return (
        <div className={`relative ${className}`}>
            <div
                onDrop={handleDrop}
                onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                className={`
                    relative min-h-96 rounded-4xl bg-bg-shade-50 p-4
                    outline-2 outline-bg-shade-300 transition-all duration-200
                    ${isDragOver ? "scale-[1.02] outline-dashed outline-primary-600" : "outline-solid"}
                    ${displayedError ? "outline-accent-500" : ""}
                `}
            >
                <span
                    className={`
                        absolute bottom-4 right-5 z-10 rounded-full bg-main-bg px-3 py-1 font-ui text-xs shadow-sm
                        ${isFull ? "text-accent" : "text-text-shade-300"}
                    `}
                >
                    {files.length}/1
                </span>

                {!selectedFile ? (
                    <div className="flex h-80 flex-col items-center justify-center text-center">
                        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full border-2 border-main-text text-2xl text-main-text">
                            ↑
                        </div>

                        <p className="max-w-xs font-ui text-base leading-relaxed text-main-text">
                            {t(I18N_KEYS.VERIFY.COMMON.verify_singleImageUploaderText_text1)}
                        </p>

                        <p className="mt-5 max-w-sm font-body text-sm leading-relaxed text-text-shade-300">
                            {t(I18N_KEYS.VERIFY.COMMON.verify_singleImageUploaderText_text2)}
                        </p>
                    </div>
                ) : (
                    <div className="relative aspect-square overflow-hidden rounded-3xl bg-main-bg outline-1 outline-bg-shade-300">
                        <img
                            src={selectedFile.url}
                            alt={selectedFile.file.name}
                            className="h-full w-full object-cover"
                            draggable={false}
                        />

                        <button
                            type="button"
                            onClick={handleRemove}
                            className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-main-bg text-main-text shadow-sm transition-all hover:bg-accent-200"
                        >
                            ×
                        </button>

                        <div className="absolute inset-x-0 bottom-0 bg-main-bg/80 px-3 py-2">
                            <p className="truncate font-ui text-xs text-main-text">
                                {selectedFile.file.name}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            <div className="mt-5">
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".png,.jpg,.jpeg,.bmp"
                    className="hidden"
                    onChange={(e) => {
                        validateAndSetFile(e.target.files);
                        e.target.value = "";
                    }}
                />

                <Button
                    type="button"
                    size="full"
                    variant="secondary"
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-full"
                >
                    {selectedFile ? t(I18N_KEYS.VERIFY.COMMON.verify_singleImageUploaderButton_changeImage) : t(I18N_KEYS.VERIFY.COMMON.verify_singleImageUploaderButton_upload)}
                </Button>
            </div>

            {displayedError && (
                <FieldErrorBubble
                    message={displayedError}
                    className="!top-8 !right-4 !mt-0"
                />
            )}
        </div>
    );
}