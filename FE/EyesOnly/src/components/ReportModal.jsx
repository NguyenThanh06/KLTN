import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { I18N_KEYS } from "../i18n/key";

import { ChevronDown, X } from "lucide-react";

import Button from "./Button";

const POST_REPORT_REASONS = [
    {
        value: "uncomf",
        label: I18N_KEYS.POST_DETAIL.HANDLE.POST_REPORT.postDetail_handleReport_reportModalReasonLable_step1_uncomf,
    },
    {
        value: "adult",
        label: I18N_KEYS.POST_DETAIL.HANDLE.POST_REPORT.postDetail_handleReport_reportModalReasonLable_step1_adult,
    },
    {
        value: "gore",
        label: I18N_KEYS.POST_DETAIL.HANDLE.POST_REPORT.postDetail_handleReport_reportModalReasonLable_step1_gore,
    },
    {
        value: "minor",
        label: I18N_KEYS.POST_DETAIL.HANDLE.POST_REPORT.postDetail_handleReport_reportModalReasonLable_step1_minor,
    },
    {
        value: "hate",
        label: I18N_KEYS.POST_DETAIL.HANDLE.POST_REPORT.postDetail_handleReport_reportModalReasonLable_step1_hate,
    },
    {
        value: "copyr",
        label: I18N_KEYS.POST_DETAIL.HANDLE.POST_REPORT.postDetail_handleReport_reportModalReasonLable_step1_copyr,
    },
    {
        value: "ai",
        label: I18N_KEYS.POST_DETAIL.HANDLE.POST_REPORT.postDetail_handleReport_reportModalReasonLable_step1_ai,
    },
    {
        value: "tag",
        label: I18N_KEYS.POST_DETAIL.HANDLE.POST_REPORT.postDetail_handleReport_reportModalReasonLable_step1_tag,
    },
    {
        value: "spam",
        label: I18N_KEYS.POST_DETAIL.HANDLE.POST_REPORT.postDetail_handleReport_reportModalReasonLable_step1_spam,
    },
    {
        value: "other",
        label: I18N_KEYS.POST_DETAIL.HANDLE.POST_REPORT.postDetail_handleReport_reportModalReasonLable_step1_other,
    },
];

const USER_REPORT_REASONS = [
    {
        value: "FAKE",
        label: I18N_KEYS.USER_DETAIL.HANDLE.USER_REPORT.userDetail_handleReport_reportModalReasonLable_step1_fake,
    },
    {
        value: "HARASS",
        label: I18N_KEYS.USER_DETAIL.HANDLE.USER_REPORT.userDetail_handleReport_reportModalReasonLable_step1_harass,
    },
    {
        value: "BADPROF",
        label: I18N_KEYS.USER_DETAIL.HANDLE.USER_REPORT.userDetail_handleReport_reportModalReasonLable_step1_badprof,
    },
    {
        value: "BADAVT",
        label: I18N_KEYS.USER_DETAIL.HANDLE.USER_REPORT.userDetail_handleReport_reportModalReasonLable_step1_badavt,
    },
    {
        value: "SPAM",
        label: I18N_KEYS.USER_DETAIL.HANDLE.USER_REPORT.userDetail_handleReport_reportModalReasonLable_step1_spam,
    },
    {
        value: "SCAM",
        label: I18N_KEYS.USER_DETAIL.HANDLE.USER_REPORT.userDetail_handleReport_reportModalReasonLable_step1_scam,
    },
    {
        value: "OTHER",
        label: I18N_KEYS.USER_DETAIL.HANDLE.USER_REPORT.userDetail_handleReport_reportModalReasonLable_step1_other,
    },
];

const getReasonLabel = (targetType, reasonValue) => {
    return getReportReasons(targetType).find((item) => item.value === reasonValue)?.label || "";
};

const getReportReasons = (targetType) => {
    return targetType === "user" ? USER_REPORT_REASONS : POST_REPORT_REASONS;
};

const getReportText = (targetType, key) => {
    const userText = {
        stepTitle0: I18N_KEYS.USER_DETAIL.HANDLE.USER_REPORT.userDetail_handleReport_reportModalTitle_step0,
        stepTitle1: I18N_KEYS.USER_DETAIL.HANDLE.USER_REPORT.userDetail_handleReport_reportModalTitle_step1,
        stepTitle2: I18N_KEYS.USER_DETAIL.HANDLE.USER_REPORT.userDetail_handleReport_reportModalTitle_step2,
        stepInfo: I18N_KEYS.USER_DETAIL.HANDLE.USER_REPORT.userDetail_handleReport_reportModalInfo_step,
        step0Desc: I18N_KEYS.USER_DETAIL.HANDLE.USER_REPORT.userDetail_handleReport_reportModalDesc_step0,
        step0Subtext: I18N_KEYS.USER_DETAIL.HANDLE.USER_REPORT.userDetail_handleReport_reportModalSubtext_step0,
        step1Desc: I18N_KEYS.USER_DETAIL.HANDLE.USER_REPORT.userDetail_handleReport_reportModalDesc_step1,
        chooseReason: I18N_KEYS.USER_DETAIL.HANDLE.USER_REPORT.userDetail_handleReport_reportModalReasonLable_step1_chooseReason,
        step1Subtext: I18N_KEYS.USER_DETAIL.HANDLE.USER_REPORT.userDetail_handleReport_reportModalSubtext_step1,
        step2Desc: I18N_KEYS.USER_DETAIL.HANDLE.USER_REPORT.userDetail_handleReport_reportModalDesc_step2,
        textareaPlaceholder: I18N_KEYS.USER_DETAIL.HANDLE.USER_REPORT.userDetail_handleReport_reportModalPlaceholder_step2,
        buttonBack: I18N_KEYS.USER_DETAIL.HANDLE.USER_REPORT.userDetail_handleReport_reportModalButton_back,
        buttonNext: I18N_KEYS.USER_DETAIL.HANDLE.USER_REPORT.userDetail_handleReport_reportModalButton_next,
        buttonSend: I18N_KEYS.USER_DETAIL.HANDLE.USER_REPORT.userDetail_handleReport_reportModalButton_send,
        buttonLoading: I18N_KEYS.USER_DETAIL.HANDLE.USER_REPORT.userDetail_handleReport_reportModalButton_loading,
    };

    if (targetType === "user") {
        return userText[key];
    }

    const postText = {
        stepTitle0:
            I18N_KEYS.POST_DETAIL.HANDLE.POST_REPORT
                .postDetail_handleReport_reportModalTitle_step0,
        stepTitle1:
            I18N_KEYS.POST_DETAIL.HANDLE.POST_REPORT
                .postDetail_handleReport_reportModalTitle_step1,
        stepTitle2:
            I18N_KEYS.POST_DETAIL.HANDLE.POST_REPORT
                .postDetail_handleReport_reportModalTitle_step2,
        stepInfo:
            I18N_KEYS.POST_DETAIL.HANDLE.POST_REPORT
                .postDetail_handleReport_reportModalInfo_step,
        step0Desc:
            I18N_KEYS.POST_DETAIL.HANDLE.POST_REPORT
                .postDetail_handleReport_reportModalDesc_step0,
        step0Subtext:
            I18N_KEYS.POST_DETAIL.HANDLE.POST_REPORT
                .postDetail_handleReport_reportModalSubtext_step0,
        step1Desc:
            I18N_KEYS.POST_DETAIL.HANDLE.POST_REPORT
                .postDetail_handleReport_reportModalDesc_step1,
        chooseReason:
            I18N_KEYS.POST_DETAIL.HANDLE.POST_REPORT
                .postDetail_handleReport_reportModalReasonLable_step1_chooseReason,
        step1Subtext:
            I18N_KEYS.POST_DETAIL.HANDLE.POST_REPORT
                .postDetail_handleReport_reportModalSubtext_step1,
        step2Desc:
            I18N_KEYS.POST_DETAIL.HANDLE.POST_REPORT
                .postDetail_handleReport_reportModalDesc_step2,
        textareaPlaceholder: I18N_KEYS.POST_DETAIL.HANDLE.POST_REPORT
                .postDetail_handleReport_reportModalPlaceholder_step2,
        buttonBack:
            I18N_KEYS.POST_DETAIL.HANDLE.POST_REPORT
                .postDetail_handleReport_reportModalButton_back,
        buttonNext:
            I18N_KEYS.POST_DETAIL.HANDLE.POST_REPORT
                .postDetail_handleReport_reportModalButton_next,
        buttonSend:
            I18N_KEYS.POST_DETAIL.HANDLE.POST_REPORT
                .postDetail_handleReport_reportModalButton_send,
        buttonLoading:
            I18N_KEYS.POST_DETAIL.HANDLE.POST_REPORT
                .postDetail_handleReport_reportModalButton_loading,
    };

    return postText[key];
};

const renderReportText = (t, value) => {
    if (!value) return "";
    return typeof value === "string" && value.includes("_") ? t(value) : value;
};

export default function ReportModal({
    isOpen,
    targetType = "post",
    targetName = "",
    onClose,
    onSubmit,
}) {
    const { t } = useTranslation();
    const [step, setStep] = useState(0);
    const [direction, setDirection] = useState(1);
    const [reason, setReason] = useState("");
    const [description, setDescription] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isReasonDropdownOpen, setIsReasonDropdownOpen] = useState(false);
    const reportReasons = getReportReasons(targetType);

    const stepTitle = useMemo(() => {
        if (step === 0) {
            return renderReportText(t, getReportText(targetType, "stepTitle0"));
        }

        if (step === 1) {
            return renderReportText(t, getReportText(targetType, "stepTitle1"));
        }

        return renderReportText(t, getReportText(targetType, "stepTitle2"));
    }, [step, targetType, t]);

    useEffect(() => {
        if (!isOpen) {
            const resetTimer = window.setTimeout(() => {
                setStep(0);
                setDirection(1);
                setReason("");
                setDescription("");
                setIsSubmitting(false);
                setIsReasonDropdownOpen(false);
            }, 0);

            return () => window.clearTimeout(resetTimer);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleGoNext = () => {
        if (step >= 2) return;

        setDirection(1);
        setStep((prev) => prev + 1);
    };

    const handleGoBack = () => {
        if (step <= 0) return;

        setDirection(-1);
        setStep((prev) => prev - 1);
    };

    const handleSubmit = async () => {
        if (!reason || !description.trim() || isSubmitting) return;

        setIsSubmitting(true);

        try {
            await onSubmit?.({
                targetType,
                reason,
                description: description.trim(),
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-main-text/30 px-4 py-6 backdrop-blur-sm pb-28 pt-6">
            <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 10 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="relative w-full max-w-xl overflow-hidden rounded-4xl bg-main-bg p-5 shadow-xl sm:p-6"
            >
                <button
                    type="button"
                    className="interaction-pop absolute right-4 top-4 rounded-full bg-bg-shade-50 p-2 text-main-text hover:bg-bg-shade-100"
                    onClick={onClose}
                >
                    <X size={18} />
                </button>

                <div className="mb-5 pr-10">
                    <p className="mb-2 font-ui text-xs font-bold text-text-shade-400">
                        {renderReportText(t, getReportText(targetType, "stepInfo"))} {step + 1}/3
                    </p>

                    <h2 className="font-ui text-xl font-bold text-main-text">
                        {stepTitle}
                    </h2>
                </div>

                <div className={`min-h-[230px] ${step === 1 ? "overflow-visible" : "overflow-hidden"}`}>
                    <AnimatePresence mode="wait" custom={direction}>
                        <motion.div
                            key={step}
                            custom={direction}
                            initial={{
                                x: direction > 0 ? 40 : -40,
                                opacity: 0,
                            }}
                            animate={{
                                x: 0,
                                opacity: 1,
                            }}
                            exit={{
                                x: direction > 0 ? -40 : 40,
                                opacity: 0,
                            }}
                            transition={{
                                duration: 0.22,
                                ease: "easeOut",
                            }}
                        >
                            {step === 0 && (
                                <div className="rounded-4xl bg-bg-shade-50 p-5 text-sm leading-7 text-main-text">
                                    <p>
                                        {renderReportText(t, getReportText(targetType, "step0Desc"))}
                                    </p>

                                    {targetName && (
                                        <p className="mt-4 rounded-3xl bg-main-bg px-4 py-3 font-ui text-xs font-bold text-text-shade-500">
                                            {renderReportText(t, getReportText(targetType, "step0Subtext"))} {targetName}
                                        </p>
                                    )}
                                </div>
                            )}

                            {step === 1 && (
                                <div className={isReasonDropdownOpen ? "pb-48" : ""}>
                                    <span className="mb-2 block font-ui text-sm font-bold text-main-text">
                                        {renderReportText(t, getReportText(targetType, "step1Desc"))}
                                    </span>

                                    <div className="relative">
                                        <button
                                            type="button"
                                            className={`
                                                flex w-full items-center justify-between gap-3 rounded-3xl border bg-main-bg px-4 py-3 text-left text-sm outline-none
                                                ${reason ? "border-primary" : "border-bg-shade-100"}
                                            `}
                                            onClick={() => setIsReasonDropdownOpen((prev) => !prev)}
                                        >
                                            <span className={reason ? "text-main-text" : "text-text-shade-400"}>
                                                {reason
                                                    ? renderReportText(t, getReasonLabel(targetType, reason))
                                                    : renderReportText(t, getReportText(targetType, "chooseReason"))}
                                            </span>

                                            <ChevronDown
                                                size={18}
                                                className={`
                                                    mr-1 shrink-0 text-text-shade-400 transition-transform
                                                    ${isReasonDropdownOpen ? "rotate-180" : ""}
                                                `}
                                            />
                                        </button>

                                        {isReasonDropdownOpen && (
                                            <div className="absolute left-0 right-0 top-full z-30 mt-2 max-h-64 overflow-y-auto rounded-4xl bg-main-bg p-2 shadow-xl">
                                                {reportReasons.map((item) => (
                                                    <button
                                                        key={item.value}
                                                        type="button"
                                                        className={`
                                                            interaction-pop w-full rounded-3xl px-4 py-3 text-left font-ui text-sm text-main-text font-bold
                                                            ${
                                                                reason === item.value
                                                                    ? "bg-primary hover:bg-primary-400"
                                                                    : "hover:bg-primary-200"
                                                            }
                                                        `}
                                                        onClick={() => {
                                                            setReason(item.value);
                                                            setIsReasonDropdownOpen(false);
                                                        }}
                                                    >
                                                        {renderReportText(t, item.label)}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {!reason && (
                                        <p className="mt-2 text-xs text-text-shade-400">
                                            {renderReportText(t, getReportText(targetType, "step1Subtext"))}
                                        </p>
                                    )}
                                </div>
                            )}

                            {step === 2 && (
                                <label className="block">
                                    
                                    <span className="mb-2 block font-ui text-sm font-bold text-main-text">
                                        {renderReportText(t, getReportText(targetType, "step2Desc"))}
                                    </span>

                                    <textarea
                                        value={description}
                                        maxLength={500}
                                        onChange={(event) => setDescription(event.target.value)}
                                        placeholder={renderReportText(t, getReportText(targetType, "textareaPlaceholder"))}
                                        className="min-h-37.5 w-full resize-none rounded-4xl border border-bg-shade-100 bg-main-bg px-4 py-3 text-sm leading-6 text-main-text outline-none focus:border-primary"
                                    />

                                    <p className="mt-2 text-right font-ui text-xs text-text-shade-400">
                                        {description.length}/500
                                    </p>

                                    
                                </label>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    {step > 0 && (
                        <Button
                            type="button"
                            variant="outline"
                            className="interaction-pop rounded-full"
                            onClick={handleGoBack}
                        >
                            {renderReportText(t, getReportText(targetType, "buttonBack"))}
                        </Button>
                    )}

                    {step < 2 ? (
                        <Button
                            type="button"
                            variant="primary"
                            className="interaction-pop rounded-full"
                            disabled={step === 1 && !reason}
                            onClick={handleGoNext}
                        >
                            {renderReportText(t, getReportText(targetType, "buttonNext"))}
                        </Button>
                    ) : (
                        <Button
                            type="button"
                            variant="primary"
                            className="interaction-pop rounded-full"
                            disabled={!reason || !description.trim() || isSubmitting}
                            onClick={handleSubmit}
                        >
                            {isSubmitting
                                ? renderReportText(t, getReportText(targetType, "buttonLoading"))
                                : renderReportText(t, getReportText(targetType, "buttonSend"))}
                        </Button>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
