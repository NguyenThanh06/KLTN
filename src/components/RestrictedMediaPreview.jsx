import { useTranslation } from "react-i18next";
import { I18N_KEYS } from "../i18n/key";

import Button from "./Button";
import CatSentinel from "./CatSentinel";
import PostDetailMediaCanvas from "./PostDetailMediaCanvas";
import { HiMiniShieldExclamation } from "react-icons/hi2";

export default function RestrictedMediaPreview({
    file,
    canReveal,
    isAlertActive,
    visitorIP,
    clearAlert,
    onReveal,
    dynamicWM = false,
    watermarkText = "EyesOnly",
}) {

    const { t, i18n } = useTranslation();

    return (
        <div className="relative overflow-hidden rounded-4xl bg-bg-shade-50 shadow-sm">
            <div className="pointer-events-none select-none">
                <PostDetailMediaCanvas
                    file={file}
                    isAlertActive={false}
                    visitorIP={visitorIP}
                    clearAlert={clearAlert}
                    canvasClassName="blur-2xl scale-95 brightness-75"
                    dynamicWM={dynamicWM}
                    watermarkText={watermarkText}
                />
            </div>

            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-5 bg-main-text/70 px-6 text-center">
                <HiMiniShieldExclamation className="text-6xl text-main-bg drop-shadow-sm" />

                <div className="flex max-w-md flex-col items-center gap-2">
                    <p className="font-ui text-base font-bold text-main-bg sm:text-lg">
                        {t(I18N_KEYS.POST_DETAIL.COMMON.postDetail_restrictedMediaPreviewText_text1)}
                    </p>

                    <p className="text-sm leading-6 text-bg-shade-100">
                        {t(I18N_KEYS.POST_DETAIL.COMMON.postDetail_restrictedMediaPreviewText_text2)}
                    </p>
                </div>

                {canReveal ? (
                    <Button
                        type="button"
                        variant="primary"
                        className="interaction-pop rounded-full px-6 shadow-sm"
                        onClick={onReveal}
                    >
                        {t(I18N_KEYS.POST_DETAIL.COMMON.postDetail_restrictedMediaPreviewButton_show)}
                    </Button>
                ) : (
                    <p className="max-w-sm rounded-full bg-main-bg/90 px-4 py-2 font-ui text-xs font-bold text-text-shade-500 shadow-sm">
                        {t(I18N_KEYS.POST_DETAIL.COMMON.postDetail_restrictedMediaPreviewText_text3)}
                    </p>
                )}
            </div>

            {isAlertActive && (
                <div
                    className="no-select absolute inset-0 z-20"
                    onMouseDown={(event) => event.preventDefault()}
                    onDragStart={(event) => event.preventDefault()}
                >
                    <div className="absolute inset-0 bg-main-text/70" />

                    <div className="relative z-10 h-full w-full">
                        <CatSentinel
                            visitorIP={visitorIP}
                            isAlertActive={isAlertActive}
                            onCardResolved={clearAlert}
                            variant="card"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}