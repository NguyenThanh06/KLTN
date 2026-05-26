import React from "react";
import { useTranslation } from "react-i18next";
import { I18N_KEYS } from "../i18n/key";

import Button from "./Button";

export default function StepNavigation({
    currentStep,
    totalSteps = 2,
    onBack,
    onNext,
    isLoading = false,
    isNextDisabled = false,

    backText = I18N_KEYS.POST_CREATE.COMMON.postCreate_stepNavigation_back,
    nextText = I18N_KEYS.POST_CREATE.COMMON.postCreate_stepNavigation_next,
    submitText = I18N_KEYS.POST_CREATE.COMMON.postCreate_stepNavigation_createPost,
    loadingText = I18N_KEYS.POST_CREATE.COMMON.postCreate_stepNavigation_loading,

    nextButtonVariant = "primary",
    backButtonVariant = "outline",
}) {
    const { t } = useTranslation();

    const renderText = (value) => {
        if (!value) return "";
        return Array.isArray(value) ? t(...value) : t(value);
    };

    const buttonText =
        currentStep >= totalSteps ? renderText(submitText) : renderText(nextText);

    return (
        <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            {currentStep > 1 && (
                <Button
                    type="button"
                    variant={backButtonVariant}
                    onClick={onBack}
                    disabled={isLoading}
                    className="rounded-full"
                >
                    {renderText(backText)}
                </Button>
            )}

            <Button
                type="button"
                variant={nextButtonVariant}
                onClick={onNext}
                disabled={isLoading || isNextDisabled}
                className="rounded-full"
            >
                {isLoading ? renderText(loadingText) : buttonText}
            </Button>
        </div>
    );
}