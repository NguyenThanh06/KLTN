import React from "react";
import { useTranslation } from "react-i18next";
import { I18N_KEYS } from "../i18n/key";

const DEFAULT_STEPS = [
    { number: 1, label: I18N_KEYS.POST_CREATE.COMMON.postCreate_stepIndicatorLabel_step1 },
    { number: 2, label: I18N_KEYS.POST_CREATE.COMMON.postCreate_stepIndicatorLabel_step2 },
];

export default function StepIndicator({
    currentStep,
    steps = DEFAULT_STEPS,
    stepText = I18N_KEYS.POST_CREATE.COMMON.postCreate_stepIndicatorText_step,
}) {
    const { t } = useTranslation();

    const renderText = (value) => {
        if (!value) return "";
        return Array.isArray(value) ? t(...value) : t(value);
    };

    return (
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
                {steps.map((step, index) => {
                    const isActive = currentStep === step.number;
                    const isDone = currentStep > step.number;
                    const isLast = index === steps.length - 1;

                    return (
                        <div key={step.number} className="flex items-center gap-2">
                            <div
                                className={`
                                    flex h-9 w-9 items-center justify-center rounded-full font-ui text-sm font-semibold
                                    ${
                                        isActive || isDone
                                            ? "bg-primary text-main-text"
                                            : "bg-bg-shade-50 text-text-shade-300"
                                    }
                                `}
                            >
                                {step.number}
                            </div>

                            <span
                                className={`
                                    hidden sm:inline font-ui text-sm
                                    ${isActive ? "text-main-text" : "text-text-shade-300"}
                                `}
                            >
                                {renderText(step.label)}
                            </span>

                            {!isLast && (
                                <span className="h-px w-8 bg-bg-shade-300 sm:w-12" />
                            )}
                        </div>
                    );
                })}
            </div>

            <p className="font-ui text-xs text-text-shade-300">
                {`${renderText(stepText)} ${currentStep}/${steps.length}`}
            </p>
        </div>
    );
}