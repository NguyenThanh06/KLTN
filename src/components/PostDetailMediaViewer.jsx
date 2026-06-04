import PostDetailMediaCanvas from "./PostDetailMediaCanvas";
import { useTranslation } from "react-i18next";
import { I18N_KEYS } from "../i18n/key";

export default function PostDetailMediaViewer({
    files = [],
    isAlertActive,
    visitorIP,
    clearAlert,
    dynamicWM = false,
    watermarkText = "EyesOnly",
    className = "",
    itemClassName = "",
}) {
    const { t } = useTranslation();

    if (!files.length) {
        return (
            <div className="rounded-4xl bg-bg-shade-50 px-6 py-10 text-center">
                <p className="font-ui text-sm text-text-shade-400">
                    {t(I18N_KEYS.POST_DETAIL.COMMON.postDetail_postDetailMediaViewerText_noFile)}
                </p>
            </div>
        );
    }

    return (
        <div className={`flex w-full flex-col gap-5 ${className}`}>
            {files.map((file, index) => (
                <div
                    key={file?.fileID || file?.link || index}
                    className={itemClassName}
                >
                    <PostDetailMediaCanvas
                        file={file}
                        isAlertActive={isAlertActive}
                        visitorIP={visitorIP}
                        clearAlert={clearAlert}
                        dynamicWM={dynamicWM}
                        watermarkText={watermarkText}
                    />
                </div>
            ))}
        </div>
    );
}