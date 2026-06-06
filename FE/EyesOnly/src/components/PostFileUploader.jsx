import React, { useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { I18N_KEYS } from "../i18n/key";
import Button from "./Button";
import FieldErrorBubble from "./FieldErrorBubble";
import PostFilePreviewItem from "./PostFilePreviewItem";

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/bmp"];

const createFileItem = (file) => ({
    id: `${file.name}-${file.size}-${file.lastModified}-${crypto.randomUUID()}`,
    file,
    url: URL.createObjectURL(file),
});

export default function PostFileUploader({
    files,
    setFiles,
    maxFiles = 10,
    maxFileSizeMB = 15,
    maxTotalSizeMB = 100,
    onProcessingChange,

    errorType = "",
    errorMessage = "",
    errorEmpty = I18N_KEYS.GLOBAL_ERROR.ERROR_handleInputEmpty,
    errorTypeFile = I18N_KEYS.GLOBAL_ERROR.ERROR_handleInputWrongType,
    errorRangeOverflow = I18N_KEYS.GLOBAL_ERROR.ERROR_handleInputRangeOverflow,
    errorTooMany = I18N_KEYS.GLOBAL_ERROR.ERROR_handleInputRangeOverflow,
    errorTotalRangeOverflow = I18N_KEYS.GLOBAL_ERROR.ERROR_handleInputRangeOverflow,

    onClearError,
    className = "",
}) {
    const { t } = useTranslation();

    const fileInputRef = useRef(null);
    const dragIndexRef = useRef(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const [localError, setLocalError] = useState("");
    const [localErrorType, setLocalErrorType] = useState("");

    const isFull = files.length >= maxFiles;

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
            case "totalRangeOverflow":
                return errorTotalRangeOverflow;
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
        if (onClearError) onClearError();
    };

    const validateAndAddFiles = async (fileList) => {
        try {
            onProcessingChange?.(true);
            clearError();

            const incomingFiles = Array.from(fileList);
            if (incomingFiles.length === 0) return;

            const currentTotalSize = files.reduce((sum, item) => sum + item.file.size, 0);
            let nextTotalSize = currentTotalSize;
            const validItems = [];

            for (const file of incomingFiles) {
                if (files.length + validItems.length >= maxFiles) {
                    setLocalErrorType("tooMany");
                    break;
                }

                if (!ACCEPTED_TYPES.includes(file.type)) {
                    setLocalErrorType("type");
                    continue;
                }

                if (file.size > maxFileSizeMB * 1024 * 1024) {
                    setLocalErrorType("rangeOverflow");
                    continue;
                }

                if (nextTotalSize + file.size > maxTotalSizeMB * 1024 * 1024) {
                    setLocalErrorType("totalRangeOverflow");
                    continue;
                }

                nextTotalSize += file.size;
                validItems.push(createFileItem(file));
            }

            if (validItems.length > 0) {
                setFiles((prev) => [...prev, ...validItems]);
            }
        } finally {
            onProcessingChange?.(false);
        }
    };

    const handleRemove = (id) => {
        setFiles((prev) => {
            const removedItem = prev.find((item) => item.id === id);
            if (removedItem) URL.revokeObjectURL(removedItem.url);

            return prev.filter((item) => item.id !== id);
        });
        clearError();
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragOver(false);

        if (isFull) {
            setLocalErrorType("tooMany");
            return;
        }

        validateAndAddFiles(e.dataTransfer.files);
    };

    const handleDragStart = (index) => {
        dragIndexRef.current = index;
    };

    const handleDragEnter = (targetIndex) => {
        const fromIndex = dragIndexRef.current;

        if (fromIndex === null || fromIndex === targetIndex) return;

        setFiles((prev) => {
            const nextFiles = [...prev];
            const [draggedItem] = nextFiles.splice(fromIndex, 1);
            nextFiles.splice(targetIndex, 0, draggedItem);
            return nextFiles;
        });

        dragIndexRef.current = targetIndex;
    };

    const handleDragEnd = () => {
        dragIndexRef.current = null;
    };

    return (
        <div className={`relative ${className}`}>
            <div
                onDrop={handleDrop}
                onDragOver={(e) => {
                    e.preventDefault();
                    if (!isFull) setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                className={`
                    relative min-h-112 rounded-4xl bg-bg-shade-50 p-4
                    outline-2 outline-bg-shade-300 transition-all duration-200
                    ${isDragOver ? "scale-[1.03] outline-dashed outline-primary-600" : "outline-solid"}
                    ${displayedError ? "outline-accent-500" : ""}
                `}
            >
                <span
                    className={`
                        absolute bottom-4 right-5 z-10 rounded-full bg-main-bg px-3 py-1 font-ui text-xs shadow-sm
                        ${isFull ? "text-accent" : "text-text-shade-300"}
                    `}
                >
                    {files.length}/{maxFiles}
                </span>

                {files.length === 0 ? (
                    <div className="flex h-96 flex-col items-center justify-center text-center">
                        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full border-2 border-main-text text-2xl text-main-text">
                            ↑
                        </div>

                        <p className="max-w-xs font-ui text-base text-main-text leading-relaxed">
                            {t(I18N_KEYS.POST_CREATE.COMMON.postCreate_postFileUploaderInstruction_line1)}
                        </p>

                        <p className="mt-5 max-w-sm font-body text-sm text-text-shade-300 leading-relaxed">
                            {t(I18N_KEYS.POST_CREATE.COMMON.postCreate_postFileUploaderInstruction_line2)}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <AnimatePresence>
                            {files.map((item, index) => (
                                <PostFilePreviewItem
                                    key={item.id}
                                    item={item}
                                    index={index}
                                    onRemove={handleRemove}
                                    onDragStart={handleDragStart}
                                    onDragEnter={handleDragEnter}
                                    onDragEnd={handleDragEnd}
                                />
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            <div className="mt-5">
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".png,.jpg,.jpeg,.bmp"
                    className="hidden"
                    onChange={(e) => {
                        validateAndAddFiles(e.target.files);
                        e.target.value = "";
                    }}
                />

                <Button
                    type="button"
                    size="full"
                    variant="secondary"
                    disabled={isFull}
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-full"
                >
                    {isFull
                        ? t(I18N_KEYS.POST_CREATE.COMMON.postCreate_postFileUploaderButton_full10Files)
                        : t(I18N_KEYS.POST_CREATE.COMMON.postCreate_postFileUploaderButton_selectFile)}
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