import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { I18N_KEYS } from "../i18n/key";

import Button from "./Button";
import PostDetailMediaViewer from "./PostDetailMediaViewer";

export default function PostEditMediaPreview({
    post,
    dynamicWM = false,
    watermarkText = "EyesOnly",
    isAlertActive,
    visitorIP,
    clearAlert,
}) {
    const { t } = useTranslation();
    
    const mediaSectionRef = useRef(null);
    const [isShowingAllMedia, setIsShowingAllMedia] = useState(false);

    const files = Array.isArray(post?.lstKTEOFile) ? post.lstKTEOFile : [];
    const visibleFiles = isShowingAllMedia ? files : files.slice(0, 1);

    const handleShowAllMedia = () => {
        setIsShowingAllMedia(true);
    };

    const handleCollapseMedia = () => {
        setIsShowingAllMedia(false);

        window.requestAnimationFrame(() => {
            const top = mediaSectionRef.current?.getBoundingClientRect().top || 0;

            window.scrollTo({
                top: window.scrollY + top - 96,
                behavior: "smooth",
            });
        });
    };

    if (files.length === 0) {
        return (
            <div className="rounded-4xl bg-bg-shade-50 px-6 py-10 text-center">
                <p className="font-heading text-lg font-semibold text-main-text">
                    {t(I18N_KEYS.POST_EDIT.COMMON.postEdit_postEditMediaPreviewText_noFile1)}
                </p>
                <p className="mt-2 font-body text-sm text-text-shade-300">
                    {t(I18N_KEYS.POST_EDIT.COMMON.postEdit_postEditMediaPreviewText_noFile2)}
                </p>
            </div>
        );
    }

    return (
        <div ref={mediaSectionRef} className="flex min-w-0 flex-col gap-5">
            <div className="relative overflow-visible rounded-4xl">
                <PostDetailMediaViewer
                    files={visibleFiles}
                    dynamicWM = {dynamicWM}
                    watermarkText= {watermarkText}
                    isAlertActive={isAlertActive}
                    visitorIP={visitorIP}
                    clearAlert={clearAlert}
                />

                {!isShowingAllMedia && files.length > 1 && (
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex justify-center bg-gradient-to-t from-main-bg via-main-bg/90 to-transparent px-4 pb-5 pt-24">
                        <Button
                            type="button"
                            variant="primary"
                            className="pointer-events-auto interaction-pop rounded-full px-7 shadow-sm"
                            onClick={handleShowAllMedia}
                        >
                            {t(I18N_KEYS.POST_EDIT.COMMON.postEdit_postEditMediaPreviewButton_showAll)}
                        </Button>
                    </div>
                )}
            </div>

            {isShowingAllMedia && files.length > 1 && (
                <div className="flex justify-center">
                    <Button
                        type="button"
                        variant="outline"
                        className="interaction-pop rounded-full px-7"
                        onClick={handleCollapseMedia}
                    >
                        {t(I18N_KEYS.POST_EDIT.COMMON.postEdit_postEditMediaPreviewButton_collapse)}
                    </Button>
                </div>
            )}
        </div>
    );
}