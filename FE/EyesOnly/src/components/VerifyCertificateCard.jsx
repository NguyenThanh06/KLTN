import React from "react";
import { useTranslation } from "react-i18next";
import { I18N_KEYS } from "../i18n/key";
import { formatDateTimeByLanguage } from "../utils/dateFormat";

import { Link } from "react-router-dom";
import { PiSealCheckFill } from "react-icons/pi";
import PostDetailMediaViewer from "./PostDetailMediaViewer";
import Button from "./Button";

export default function VerifyCertificateCard({
    verifyData,
    post,
    kteoFile,
    expiresAt,
    isAlertActive,
    visitorIP,
    clearAlert,
}) {
     
    const { t, i18n } = useTranslation();

    const verifiedAtText =
        formatDateTimeByLanguage(verifyData?.ngayXacThuc, i18n.language) ||
        t(I18N_KEYS.COMMON.common_dateFormat_unknownTime);

    const expiresAtText =
        formatDateTimeByLanguage(expiresAt, i18n.language) ||
        t(I18N_KEYS.COMMON.common_dateFormat_unknownTime);

    return (
        <div className="mx-auto w-full max-w-4xl rounded-4xl border-6 border-double border-sub-text bg-main-bg px-5 py-6 text-center shadow-md sm:px-8 lg:px-10">
            <img src="/icon.svg" className="h-5"/>
            
            <PiSealCheckFill className="mx-auto h-20 w-20 animate-popup-appear-and-float text-primary-500" />

            <h1 className="mt-5 font-heading text-3xl font-semibold text-sub-text sm:text-4xl uppercase">
                {t(I18N_KEYS.VERIFY_RESULT.COMMON.verifyResult_verifyCertificateCardTitle_successfulVerify)}
            </h1>

            <p className="mt-3 font-ui text-xs text-text-shade-300">
                {t(I18N_KEYS.VERIFY_RESULT.COMMON.verifyResult_verifyCertificateCardSubtext_dateVerify, {date: verifiedAtText})}
            </p>

            <div className="mt-8 grid grid-cols-1 gap-6 text-left lg:grid-cols-[minmax(0,1fr)_220px] lg:items-center">
                <div className="rounded-4xl bg-bg-shade-50 px-5 py-5">
                    <p className="font-ui text-xs uppercase tracking-wide text-text-shade-300">
                        {t(I18N_KEYS.VERIFY_RESULT.COMMON.verifyResult_verifyCertificateCardTitle_verifiedPost)}
                    </p>

                    <h2 className="mt-2 font-heading text-xl font-semibold text-main-text">
                        {post?.tieuDe || t(I18N_KEYS.VERIFY_RESULT.COMMON.verifyResult_verifyCertificateCardText_altTieudDe)}
                    </h2>

                    <p className="mt-3 line-clamp-3 font-body text-sm leading-relaxed text-text-shade-300">
                        {post?.moTa || t(I18N_KEYS.VERIFY_RESULT.COMMON.verifyResult_verifyCertificateCardText_altMoTa)}
                    </p>

                    {post?.postID && (
                        <Link
                            to={`/post/${post.postID}`}
                            className="mt-5 inline-flex "
                        >
                            <Button >
                                {t(I18N_KEYS.VERIFY_RESULT.COMMON.verifyResult_verifyCertificateCardButton_toPost)}
                            </Button>
                        </Link>
                    )}

                    <p className="mt-5 font-body text-xs leading-relaxed text-text-shade-300">
                        {t(I18N_KEYS.VERIFY_RESULT.COMMON.verifyResult_verifyCertificateCardText_expireAt, {date: expiresAtText})}
                    </p>
                </div>

                <div className="rounded-4xl bg-bg-shade-50 p-3">
                    <div className="max-h-72 overflow-hidden rounded-3xl">
                        <PostDetailMediaViewer
                            files={kteoFile ? [kteoFile] : []}
                            isAlertActive={isAlertActive}
                            visitorIP={visitorIP}
                            clearAlert={clearAlert}
                            className="gap-0"
                            itemClassName="max-h-72 overflow-hidden rounded-3xl [&_canvas]:!max-h-72 [&_canvas]:!w-full [&_canvas]:!object-contain"
                        />
                    </div>

                    <p className="mt-3 text-center font-ui text-xs text-text-shade-300">
                        {t(I18N_KEYS.VERIFY_RESULT.COMMON.verifyResult_verifyCertificateCardText_verifiedFile)}
                    </p>
                </div>
            </div>
        </div>
    );
}