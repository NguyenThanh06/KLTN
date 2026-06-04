import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { I18N_KEYS } from "../i18n/key";
import { useErrorHandler } from "../hooks/useErrorHandler";
import { postApi } from "../api/postApi";

import PageContainer from "../components/PageContainer";
import VerifyCertificateCard from "../components/VerifyCertificateCard";
import CopyLinkBox from "../components/CopyLinkBox";

const VERIFY_VALID_DAYS = 7;
const POST_UPLOAD_BASE_URL = "http://localhost:8080/uploads/posts";

const addDays = (dateValue, days) => {
    const date = new Date(dateValue);
    date.setDate(date.getDate() + days);
    return date;
};

const buildPostMediaUrl = (link = "") => {
    if (!link) return "";
    if (/^(https?:|blob:|data:)/i.test(link)) return link;

    const normalizedLink = String(link).replace(/^\/+/, "");
    if (normalizedLink.startsWith("uploads/posts/")) {
        return `http://localhost:8080/${normalizedLink}`;
    }

    return `${POST_UPLOAD_BASE_URL}/${normalizedLink}`;
};

const normalizeVerifyResult = (rawResult) => {
    if (!rawResult) return null;

    const rawKteoFile = rawResult.kteoFile || rawResult.kTEOFile || null;

    return {
        ...rawResult,
        verifyID: rawResult.verifyID ?? rawResult.verifyId,
        postID: rawResult.postID ?? rawResult.postId ?? rawResult.post?.postID ?? rawResult.post?.postId,
        kteoFileID:
            rawResult.kteoFileID ??
            rawResult.kteoFileId ??
            rawKteoFile?.fileID ??
            rawKteoFile?.fileId,
        post: rawResult.post
            ? {
                ...rawResult.post,
                postID: rawResult.post.postID ?? rawResult.post.postId,
            }
            : null,
        kteoFile: rawKteoFile
            ? {
                ...rawKteoFile,
                fileID: rawKteoFile.fileID ?? rawKteoFile.fileId ?? rawKteoFile.id,
                postID: rawKteoFile.postID ?? rawKteoFile.postId ?? rawResult.postID ?? rawResult.postId,
                link: buildPostMediaUrl(rawKteoFile.link || rawKteoFile.url || rawKteoFile.imageUrl),
            }
            : null,
    };
};

export default function VerifyResult({
    addHelperError,
    setHelperFocusState,
    isAlertActive,
    visitorIP,
    clearAlert,
}) {

    const { t } = useTranslation();

    const { verifyID } = useParams();
    const { handleError } = useErrorHandler();
    const [verifyData, setVerifyData] = useState(null);
    const [isFetchingVerifyResult, setIsFetchingVerifyResult] = useState(true);

    //-------------------Phần backend cần quan tâm---------------------
    /*
        TODO:
        1. Thay MOCK_VERIFY_RESULTS bằng API lấy kết quả xác thực theo verifyID.
           Gợi ý endpoint:
           GET /verify/{verifyID}

           Response nên có:
           {
               verifyID,
               postID,
               kteoFileID,
               ngayXacThuc,
               expiresAt,
               post: {
                   postID,
                   tieuDe,
                   moTa
               },
               kteoFile: {
                   fileID,
                   link,
                   width,
                   height,
                   postID
               }
           }


        2. Nếu backend trả đủ post + kteoFile thì frontend không cần tự join mock như bên dưới nữa.
    */
    useEffect(() => {
        const fetchVerifyResult = async () => {
            try {
                setIsFetchingVerifyResult(true);
                const response = await postApi.getVerifyResult(verifyID);
                const nextVerifyData = normalizeVerifyResult(response.data?.result || response.data);
                setVerifyData(nextVerifyData ? {
                    ...nextVerifyData,
                    checkedAt: Date.now(),
                } : null);
            } catch (error) {
                setVerifyData(null);

                const errorData = error.response?.data;
                const result = handleError(errorData);

                if (result && !result.handled) {
                    addHelperError?.({
                        id: Date.now(),
                        code: I18N_KEYS.GLOBAL_ERROR.ERROR_unknownError,
                    });
                }
            } finally {
                setIsFetchingVerifyResult(false);
            }
        };

        fetchVerifyResult();
    }, [addHelperError, handleError, verifyID]);

    //------------------- HẾT Phần backend cần quan tâm---------------------

    const certificateData = useMemo(() => {
        if (!verifyData) return null;

        const expiresAt = verifyData.expiresAt
            ? new Date(verifyData.expiresAt)
            : addDays(verifyData.ngayXacThuc, VERIFY_VALID_DAYS);
        const isExpired = Number(verifyData.checkedAt || 0) > expiresAt.getTime();

        return {
            expiresAt,
            isExpired,
            post: verifyData.post,
            kteoFile: verifyData.kteoFile,
        };
    }, [verifyData]);

    const shareLink =
        typeof window !== "undefined"
            ? window.location.href
            : `/verify/${verifyID}`;




    if (isFetchingVerifyResult) {
        return (
            <PageContainer setHelperFocusState={setHelperFocusState}>
                <div className="w-full max-w-7xl min-h-[calc(100vh-20rem)] mx-auto flex items-center justify-center px-4 py-4 sm:px-6 sm:py-5 lg:px-7 lg:py-6">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-main-text/20 border-t-main-text" />
                </div>
            </PageContainer>
        );
    }

    if (!verifyData || certificateData?.isExpired) {
        return (
            <PageContainer setHelperFocusState={setHelperFocusState}>
                <div className="w-full max-w-7xl min-h-[calc(100vh-20rem)] mx-auto flex flex-col justify-center px-4 py-4 sm:px-6 sm:py-5 lg:px-7 lg:py-6">
                    <div className="mx-auto max-w-2xl rounded-4xl bg-main-bg px-16 py-12 text-center shadow-sm">
                        <h1 className="font-heading text-2xl font-semibold text-main-text">
                            {t(I18N_KEYS.VERIFY_RESULT.COMMON.verifyResult_title_notFoundCertificate)}
                        </h1>

                        <p className="mt-3 font-body text-sm leading-relaxed text-text-shade-300">
                            {t(I18N_KEYS.VERIFY_RESULT.COMMON.verifyResult_desc_notFoundCertificate)}
                        </p>
                    </div>
                </div>
                
            </PageContainer>
        );
    }









    return (
        <PageContainer setHelperFocusState={setHelperFocusState}>
            <div className="w-full max-w-7xl mx-auto my-4 px-4 py-4 sm:my-5 sm:px-6 sm:py-5 lg:px-7 lg:py-6">
                <VerifyCertificateCard
                    verifyData={verifyData}
                    post={certificateData.post}
                    kteoFile={certificateData.kteoFile}
                    expiresAt={certificateData.expiresAt}
                    isAlertActive={isAlertActive}
                    visitorIP={visitorIP}
                    clearAlert={clearAlert}
                />

                <CopyLinkBox
                    value={shareLink}
                    expiresAt={certificateData.expiresAt}
                    addHelperError={addHelperError}
                />
            </div>
        </PageContainer>
    );
}
