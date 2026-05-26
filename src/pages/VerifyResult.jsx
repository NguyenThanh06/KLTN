import React, { useMemo } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { I18N_KEYS } from "../i18n/key";

import PageContainer from "../components/PageContainer";
import SectionContainer from "../components/SectionContainer";
import VerifyCertificateCard from "../components/VerifyCertificateCard";
import CopyLinkBox from "../components/CopyLinkBox";

import { MOCK_POST_DATA_1 } from "../data/Post/mockPost1";
import { MOCK_POST_DATA_2 } from "../data/Post/mockPost2";
import { MOCK_VERIFY_DATA_1 } from "../data/Verify/mockVerify1";
import { MOCK_KTEOFILE_DATA_1 } from "../data/KTEOFile/mockKTEOFile1";
import { MOCK_KTEOFILE_DATA_2 } from "../data/KTEOFile/mockKTEOFile2";
import { MOCK_KTEOFILE_DATA_3 } from "../data/KTEOFile/mockKTEOFile3";

const MOCK_POSTS = [MOCK_POST_DATA_1, MOCK_POST_DATA_2];
const MOCK_VERIFY_RESULTS = [MOCK_VERIFY_DATA_1];
const MOCK_KTEO_FILES = [
    MOCK_KTEOFILE_DATA_1,
    MOCK_KTEOFILE_DATA_2,
    MOCK_KTEOFILE_DATA_3,
];

const VERIFY_VALID_DAYS = 7;

const addDays = (dateValue, days) => {
    const date = new Date(dateValue);
    date.setDate(date.getDate() + days);
    return date;
};

const findPostByKTEOFileID = (kteoFileID) => {
    return MOCK_POSTS.find((post) =>
        post.lstKTEOFile?.some((file) => file.fileID === kteoFileID)
    );
};

const findKTEOFileInPost = (post, kteoFileID) => {
    return post?.lstKTEOFile?.find((file) => file.fileID === kteoFileID);
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
    const verifyData = useMemo(() => {
        return MOCK_VERIFY_RESULTS.find((item) => item.verifyID === verifyID);
    }, [verifyID]);



    //------------------- HẾT Phần backend cần quan tâm---------------------

    const certificateData = useMemo(() => {
        if (!verifyData) return null;

        const expiresAt = addDays(verifyData.ngayXacThuc, VERIFY_VALID_DAYS);
        const isExpired = Date.now() > expiresAt.getTime();

        const fileFromMock = MOCK_KTEO_FILES.find(
            (file) => file.fileID === verifyData.kteoFileID
        );

        const postFromFileList =
            findPostByKTEOFileID(verifyData.kteoFileID) ||
            MOCK_POSTS.find((post) => post.postID === fileFromMock?.postID);

        const kteoFile =
            findKTEOFileInPost(postFromFileList, verifyData.kteoFileID) ||
            fileFromMock;

        return {
            expiresAt,
            isExpired,
            post: postFromFileList,
            kteoFile,
        };
    }, [verifyData]);

    const shareLink =
        typeof window !== "undefined"
            ? window.location.href
            : `/verify/${verifyID}`;








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