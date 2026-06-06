import React from "react";
import { useTranslation } from "react-i18next";
import { I18N_KEYS } from "../i18n/key";
import PostDetailMediaViewer from "./PostDetailMediaViewer";

export default function VerifyKTEOFilePicker({
    files = [],
    selectedFileID,
    onSelect,
    isAlertActive,
    visitorIP,
    clearAlert,
}) {
    const { t, i18n } = useTranslation();

    if (!files.length) {
        return (
            <div className="rounded-4xl bg-bg-shade-50 px-6 py-10 text-center">
                <p className="font-ui text-sm text-text-shade-300">
                    {t(I18N_KEYS.VERIFY.COMMON.verify_title_verifyingPost)}
                </p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {files.map((file) => {
                const isSelected = selectedFileID === file.fileID;

                return (
                    <button
                        key={file.fileID}
                        type="button"
                        onClick={() => onSelect(file.fileID)}
                        className={`
                            group relative aspect-square overflow-hidden rounded-3xl bg-main-bg p-2.5 text-left
                            outline-2 transition-all duration-200
                            ${
                                isSelected
                                    ? "outline-primary-600 shadow-sm"
                                    : "outline-bg-shade-300 hover:-translate-y-0.5 hover:outline-primary-400"
                            }
                        `}
                    >
                        <span
                            className={`
                                absolute left-4 top-4 z-10 flex h-7 w-7 items-center justify-center rounded-full border-2 bg-main-bg
                                ${
                                    isSelected
                                        ? "border-primary-600"
                                        : "border-bg-shade-300"
                                }
                            `}
                        >
                            <span
                                className={`
                                    h-3.5 w-3.5 rounded-full transition-all
                                    ${isSelected ? "bg-primary-600" : "bg-transparent"}
                                `}
                            />
                        </span>

                        <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-3xl bg-bg-shade-50">
                            <div className="pointer-events-none flex h-full w-full items-center justify-center">
                                <PostDetailMediaViewer
                                    files={[file]}
                                    isAlertActive={isAlertActive}
                                    visitorIP={visitorIP}
                                    clearAlert={clearAlert}
                                    className="flex h-full w-full items-center justify-center gap-0"
                                    itemClassName="
                                        flex h-full w-full items-center justify-center overflow-hidden rounded-3xl
                                        [&_canvas]:!max-h-full [&_canvas]:!max-w-full
                                        [&_canvas]:!object-contain
                                    "
                                />
                            </div>
                        </div>

                        <div className="absolute inset-x-0 bottom-4 z-10 flex justify-center px-4">
                            <span
                                className={`
                                    rounded-full px-4 py-1.5 font-ui text-xs shadow-sm transition-all
                                    ${
                                        isSelected
                                            ? "bg-primary-500 text-main-text"
                                            : "bg-main-bg text-text-shade-300"
                                    }
                                `}
                            >
                                {isSelected ? t(I18N_KEYS.VERIFY.COMMON.verify_verifyKTEOFilePickerBadge_selected) : t(I18N_KEYS.VERIFY.COMMON.verify_verifyKTEOFilePickerBadge_select)}
                            </span>
                        </div>
                    </button>
                );
            })}
        </div>
    );
}