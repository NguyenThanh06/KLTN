import React from "react";
import { useTranslation } from "react-i18next";
import { I18N_KEYS } from "../i18n/key";

import Button from "./Button";

export default function StepNavigation({
    currentStep,
    onBack,
    onNext,
    isLoading = false,
    isNextDisabled = false,
}) {

    const { t } = useTranslation();

    const nextText = currentStep === 2 ? t(I18N_KEYS.POST_CREATE.COMMON.postCreate_stepNavigation_createPost) : t(I18N_KEYS.POST_CREATE.COMMON.postCreate_stepNavigation_next);

    return (
        <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            {currentStep > 1 && (
                <Button
                    type="button"
                    variant="outline"
                    onClick={onBack}
                    disabled={isLoading}
                    className="rounded-full"
                >
                    {t(I18N_KEYS.POST_CREATE.COMMON.postCreate_stepNavigation_back)}
                </Button>
            )}

            <Button
                type="button"
                variant="primary"
                onClick={onNext}
                disabled={isLoading || isNextDisabled}
                className="rounded-full"
            >
                {isLoading ? t(I18N_KEYS.POST_CREATE.COMMON.postCreate_stepNavigation_loading) : nextText}
            </Button>
        </div>
    );
}