import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { I18N_KEYS } from "../i18n/key";
import { AnimatePresence, motion } from "framer-motion";

import { useErrorHandler } from "../hooks/useErrorHandler";

import PageContainer from "../components/PageContainer";
import SectionContainer from "../components/SectionContainer";
import StepIndicator from "../components/StepIndicator";
import StepNavigation from "../components/StepNavigation";
import Input from "../components/Input";
import SingleImageUploader from "../components/SingleImageUploader";
import VerifyKTEOFilePicker from "../components/VerifyKTEOFilePicker";

import { MOCK_POST_DATA_1 } from "../data/Post/mockPost1";
import { MOCK_POST_DATA_2 } from "../data/Post/mockPost2";

const VERIFY_STEPS = [
    { number: 1, label: I18N_KEYS.VERIFY.COMMON.verify_stepIndicatorLabel_step1 },
    { number: 2, label: I18N_KEYS.VERIFY.COMMON.verify_stepIndicatorLabel_step2 },
];

const MOCK_POSTS = [MOCK_POST_DATA_1, MOCK_POST_DATA_2];

const stepVariants = {
    initial: {
        opacity: 0,
        x: 36,
        filter: "blur(4px)",
    },
    animate: {
        opacity: 1,
        x: 0,
        filter: "blur(0px)",
    },
    exit: {
        opacity: 0,
        x: -36,
        filter: "blur(4px)",
    },
};

const extractPostID = (value) => {
    const rawValue = value.trim();
    if (!rawValue) return "";

    const postPathMatch = rawValue.match(/\/post\/([^/?#]+)/i);
    if (postPathMatch?.[1]) return decodeURIComponent(postPathMatch[1]);

    const withoutQuery = rawValue.split(/[?#]/)[0];
    const lastSegment = withoutQuery.split("/").filter(Boolean).at(-1);

    if (lastSegment && /^\d+$/.test(lastSegment)) return lastSegment;
    if (/^\d+$/.test(rawValue)) return rawValue;

    return rawValue;
};

export default function Verify({
    addHelperError,
    setHelperFocusState,
    isAlertActive,
    visitorIP,
    clearAlert,
}) {

    const { t } = useTranslation();

    const navigate = useNavigate();
    const location = useLocation();
    const { handleError } = useErrorHandler();

    const searchParams = new URLSearchParams(location.search);
    const postIDFromQuery = searchParams.get("postID") || "";

    const [currentStep, setCurrentStep] = useState(1);
    const [postInput, setPostInput] = useState(postIDFromQuery);
    const [selectedPost, setSelectedPost] = useState(null);
    const [selectedKTEOFileID, setSelectedKTEOFileID] = useState("");
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [isFileProcessing, setIsFileProcessing] = useState(false);
    const [isFetchingPost, setIsFetchingPost] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({
        uploadedImage: "",
    });
    const [verifyFailed, setVerifyFailed] = useState(false);

    const selectedKTEOFile = useMemo(() => {
        if (!selectedPost?.lstKTEOFile?.length) return null;

        return selectedPost.lstKTEOFile.find(
            (file) => file.fileID === selectedKTEOFileID
        );
    }, [selectedPost, selectedKTEOFileID]);

    const isStep2Disabled =
        !selectedKTEOFile ||
        uploadedFiles.length === 0 ||
        isFileProcessing ||
        isVerifying;

    useEffect(() => {
        return () => {
            uploadedFiles.forEach((item) => URL.revokeObjectURL(item.url));
        };
    }, []);

    useEffect(() => {
        if (!postIDFromQuery) return;

        const foundPost = MOCK_POSTS.find(
            (post) => post.postID === extractPostID(postIDFromQuery)
        );

        if (!foundPost) return;

        setPostInput(postIDFromQuery);
        setSelectedPost(foundPost);
        setCurrentStep(2);
    }, [postIDFromQuery]);

    const clearFieldError = (fieldName) => {
        setFieldErrors((prev) => ({
            ...prev,
            [fieldName]: "",
        }));
    };

    //-------------------Phần backend cần quan tâm---------------------
    /*
        TODO:
        1. Thay MOCK_POSTS bằng API lấy bài viết theo postID.
           Gợi ý endpoint:
           GET /posts/{postID}/verify-source

           Response nên có:
           {
               postID,
               tieuDe,
               moTa,
               lstKTEOFile: [
                   { fileID, link, width, height, verifyKey, postID }
               ]
           }

        2. Khi xác thực, FE gửi FormData gồm:
           - postID
           - kteoFileID
           - uploadedImage


           Response:
           {
               isVerified: boolean, //Ni đúng thì true, sai thì false
               verifyID: string //Ni trả link verify thành công (k thành công thì chuỗi rỗng ""), kiểu như "1234", thì bn sẽ navigate tới "/verify/1234"
           }

    */
    const fetchPostForVerify = async (postID) => { // Hàm lấy post theo id
        // const response = await api.getPostForVerify(postID);
        // return response.data;

        return MOCK_POSTS.find((post) => post.postID === postID) || null;
    };

    const submitVerifyRequest = async ({ postID, kteoFileID, uploadedImage }) => { // Hàm verify
        const formData = new FormData();
        formData.append("postID", postID);
        formData.append("kteoFileID", kteoFileID);
        formData.append("uploadedImage", uploadedImage);

        // const response = await api.verifyPostImage(formData);
        // return response.data;

        //2 cái if ni bn đặt đại để test, đó thành xóa nguyên đoạn ni...
        if (kteoFileID === "2") {
            return {
                isVerified: true,
                verifyID: "1234",
            };
        }

        return {
            isVerified: false,
            verifyID: "",
        };
        // ... tới ni
    };

    //------------------------Hết phần backend cần quan tâm, dưới ni thì chủ yếu coi mã lỗi trả cho đúng thôi-------------


    const handleFindPost = async () => { // Hàm trích id xong gọi tìm post
        const postID = extractPostID(postInput);

        if (!postID) {
            addHelperError?.({
                id: Date.now(),
                code: I18N_KEYS.VERIFY.HANDLE.FIND_POST.verify_handleFindPost_helper_error_nullID,
            });
            return;
        }

        try {
            setIsFetchingPost(true);
            setVerifyFailed(false);

            const post = await fetchPostForVerify(postID);

            if (!post) {
                addHelperError?.({
                    id: Date.now(),
                    code: I18N_KEYS.VERIFY.HANDLE.FIND_POST.verify_handleFindPost_helper_error_cannotFindID,
                });
                return;
            }

            setSelectedPost(post);
            setSelectedKTEOFileID("");
            setUploadedFiles([]);
            setCurrentStep(2);
        } catch (error) {
            const errorData = error.response?.data;
            const result = handleError(errorData);

            if (result && !result.handled) {
                switch (result.code) {
                    //Kịch bản post id null
                    case "POSTID_NULL":
                        addHelperError?.({
                            id: Date.now(),
                            code: I18N_KEYS.VERIFY.HANDLE.FIND_POST.verify_handleFindPost_helper_error_nullID,
                        });
                        break;
                    //Kịch bản post id tìm không ra post
                    case "POST_NOT_FOUND":
                        addHelperError?.({
                            id: Date.now(),
                            code: I18N_KEYS.VERIFY.HANDLE.FIND_POST.verify_handleFindPost_helper_error_cannotFindID,
                        });
                        break;
                    //Kịch bản post riêng tư
                    case "POST_NOT_PUBLIC":
                        addHelperError?.({
                            id: Date.now(),
                            code: I18N_KEYS.VERIFY.HANDLE.FIND_POST.verify_handleFindPost_helper_error_privatePost,
                        });
                        break;
                    default:
                        addHelperError?.({
                            id: Date.now(),
                            code: I18N_KEYS.GLOBAL_ERROR.ERROR_unknownError,
                        });
                        break;
                }
            }
        } finally {
            setIsFetchingPost(false);
        }
    };

    const handleVerify = async () => {
        if (!selectedPost || !selectedKTEOFile) {
            addHelperError?.({
                id: Date.now(),
                code: I18N_KEYS.VERIFY.HANDLE.VERIFY.verify_handleVerify_helper_error_noKTEOFile,
            });
            return;
        }

        if (!uploadedFiles[0]) {
            setFieldErrors((prev) => ({
                ...prev,
                uploadedImage: "empty",
            }));
            return;
        }

        try {
            setIsVerifying(true);
            setVerifyFailed(false);
            clearFieldError("uploadedImage");

            const result = await submitVerifyRequest({
                postID: selectedPost.postID,
                kteoFileID: selectedKTEOFile.fileID,
                uploadedImage: uploadedFiles[0].file,
            });

            if (!result?.isVerified) {
                setVerifyFailed(true);
                return;
            }

            navigate(`/verify/${result.verifyID}`);

        } catch (error) {
            const errorData = error.response?.data;
            const result = handleError(errorData);

            if (result && !result.handled) {
                switch (result.code) {
                    //Kịch bản k chọn kteo file
                    case "NO_KTEOFILE":
                        addHelperError?.({
                            id: Date.now(),
                            code: I18N_KEYS.VERIFY.HANDLE.VERIFY.verify_handleVerify_helper_error_noKTEOFile,
                        });
                        break;
                    //Kịch bản chọn kteo file tầm bậy tìm k ra
                    case "KTEOFILE_NOT_FOUND":
                        addHelperError?.({
                            id: Date.now(),
                            code: I18N_KEYS.VERIFY.HANDLE.VERIFY.verify_handleVerify_helper_error_kteoFileNotFound,
                        });
                        break;
                    //Kịch bản k tải ảnh lên
                    case "UPLOADIMAGE_NULL":
                        addHelperError?.({
                            id: Date.now(),
                            code: I18N_KEYS.VERIFY.HANDLE.VERIFY.verify_handleVerify_helper_error_nullUploadImage,
                        });
                        break;
                    //Kịch bản tải file tầm bậy
                    case "UPLOADIMAGE_WRONG_TYPE":
                        addHelperError?.({
                            id: Date.now(),
                            code: I18N_KEYS.VERIFY.HANDLE.VERIFY.verify_handleVerify_helper_error_typeMismatchUploadImage,
                        });
                        break;
                    //Kịch bản tải ảnh quá nặng... ờ thì nếu nớ k trả cái ni cx đc, tại k đặc tả
                    case "UPLOADIMAGE_RANGE_OVERFLOW":
                        addHelperError?.({
                            id: Date.now(),
                            code: I18N_KEYS.VERIFY.HANDLE.VERIFY.verify_handleVerify_helper_error_uploadImageRangeOverflow,
                        });
                        break;
                    //Kịch bản tải nhiều hơn 1 ảnh
                    case "UPLOADIMAGE_TOO_MANY":
                        addHelperError?.({
                            id: Date.now(),
                            code: I18N_KEYS.VERIFY.HANDLE.VERIFY.verify_handleVerify_helper_error_uploadImageTooMany,
                        });
                        break;
                    default:
                        addHelperError?.({
                            id: Date.now(),
                            code: I18N_KEYS.GLOBAL_ERROR.ERROR_unknownError,
                        });
                        break;
                }
            }
        } finally {
            setIsVerifying(false);
        }
    };

    const handleNext = () => {
        if (currentStep === 1) {
            handleFindPost();
            return;
        }

        handleVerify();
    };

    const handleBack = () => {
        if (currentStep === 2) {
            setCurrentStep(1);
            setVerifyFailed(false);
        }
    };











    return (
        <PageContainer setHelperFocusState={setHelperFocusState}>
            <SectionContainer
                title={I18N_KEYS.VERIFY.COMMON.verify_sectionContainerTitle}
                description={I18N_KEYS.VERIFY.COMMON.verify_sectionContainerDesc}
            >
                <StepIndicator
                    currentStep={currentStep}
                    steps={VERIFY_STEPS}
                    stepText={I18N_KEYS.VERIFY.COMMON.verify_stepIndicatorText_step}
                />

                <AnimatePresence mode="wait">
                    {currentStep === 1 && (
                        <motion.div
                            key="verify-step-1"
                            variants={stepVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            transition={{ duration: 0.28, ease: "easeInOut" }}
                            className="mx-auto max-w-2xl"
                        >
                            <div className="rounded-4xl bg-bg-shade-50 px-5 py-6 sm:px-7 sm:py-8">
                                <Input
                                    id="verify-post-input"
                                    label={I18N_KEYS.VERIFY.COMMON.verify_formLabel_postID}
                                    placeholder={I18N_KEYS.VERIFY.COMMON.verify_formPlaceholder_postID}
                                    value={postInput}
                                    onChange={(e) => setPostInput(e.target.value)}
                                    helperText={I18N_KEYS.VERIFY.COMMON.verify_formHelper_postID}
                                    errorEmpty={I18N_KEYS.VERIFY.HANDLE.FIND_POST.verify_handleFindPost_helper_error_nullID}
                                    required
                                    enableProfanityFilter={false}
                                />
                            </div>
                        </motion.div>
                    )}

                    {currentStep === 2 && (
                        <motion.div
                            key="verify-step-2"
                            variants={stepVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            transition={{ duration: 0.28, ease: "easeInOut" }}
                            className="space-y-7"
                        >
                            {selectedPost && (
                                <div className="rounded-4xl bg-bg-shade-50 px-5 py-4">
                                    <p className="font-ui text-xs uppercase tracking-wide text-text-shade-300">
                                        {t(I18N_KEYS.VERIFY.COMMON.verify_title_verifyingPost)}
                                    </p>
                                    <h2 className="mt-1 font-heading text-xl font-semibold text-main-text">
                                        {selectedPost.tieuDe}
                                    </h2>
                                    <p className="mt-2 line-clamp-2 font-body text-sm leading-relaxed text-text-shade-300">
                                        {selectedPost.moTa}
                                    </p>
                                </div>
                            )}

                            <div className="grid grid-cols-1 gap-7 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
                                <div className="rounded-4xl bg-bg-shade-50 p-4 sm:p-5">
                                    <div className="mb-4">
                                        <h3 className="font-heading text-lg font-semibold text-main-text">
                                            {t(I18N_KEYS.VERIFY.COMMON.verify_title_chooseKTEOFile)}
                                        </h3>
                                        <p className="mt-1 font-body text-sm text-text-shade-300">
                                            {t(I18N_KEYS.VERIFY.COMMON.verify_desc_chooseKTEOFile)}
                                        </p>
                                    </div>
                                    <div className="border border-bg-shade-200 p-4 rounded-4xl">
                                        <VerifyKTEOFilePicker
                                            files={selectedPost?.lstKTEOFile || []}
                                            selectedFileID={selectedKTEOFileID}
                                            onSelect={(fileID) => {
                                                setSelectedKTEOFileID(fileID);
                                                setVerifyFailed(false);
                                            }}
                                            isAlertActive={isAlertActive}
                                            visitorIP={visitorIP}
                                            clearAlert={clearAlert}
                                        />
                                    </div>
                                </div>

                                <div className="rounded-4xl bg-bg-shade-50 p-4 sm:p-5">
                                    <div className="mb-4">
                                        <h3 className="font-heading text-lg font-semibold text-main-text">
                                            {t(I18N_KEYS.VERIFY.COMMON.verify_title_uploadFile)}
                                        </h3>
                                        <p className="mt-1 font-body text-sm text-text-shade-300">
                                            {t(I18N_KEYS.VERIFY.COMMON.verify_desc_uploadFile)}
                                        </p>
                                    </div>

                                    <SingleImageUploader
                                        files={uploadedFiles}
                                        setFiles={(nextValue) => {
                                            setUploadedFiles(nextValue);
                                            setVerifyFailed(false);
                                        }}
                                        onProcessingChange={setIsFileProcessing}
                                        errorType={fieldErrors.uploadedImage}
                                        errorEmpty={I18N_KEYS.VERIFY.HANDLE.VERIFY.verify_handleVerify_helper_error_nullUploadImage}
                                        errorTypeFile={I18N_KEYS.VERIFY.HANDLE.VERIFY.verify_handleVerify_helper_error_typeMismatchUploadImage}
                                        errorRangeOverflow={I18N_KEYS.VERIFY.HANDLE.VERIFY.verify_handleVerify_helper_error_uploadImageRangeOverflow}
                                        errorTooMany={I18N_KEYS.VERIFY.HANDLE.VERIFY.verify_handleVerify_helper_error_uploadImageTooMany}
                                        onClearError={() => clearFieldError("uploadedImage")}
                                    />
                                </div>
                            </div>

                            {verifyFailed && (
                                <div className="rounded-4xl bg-accent-200 px-5 py-4 text-center">
                                    <p className="font-heading text-base font-semibold text-main-text">
                                        {t(I18N_KEYS.VERIFY.COMMON.verify_text_verifyFailed1)}
                                    </p>
                                    <p className="mt-1 font-body text-sm leading-relaxed text-main-text">
                                        {t(I18N_KEYS.VERIFY.COMMON.verify_text_verifyFailed2)}
                                    </p>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                <StepNavigation
                    currentStep={currentStep}
                    totalSteps={VERIFY_STEPS.length}
                    onBack={handleBack}
                    onNext={handleNext}
                    isLoading={isFetchingPost || isVerifying}
                    isNextDisabled={currentStep === 2 && isStep2Disabled}
                    nextText={I18N_KEYS.VERIFY.COMMON.verify_stepNavigationButton_nextStep1}
                    submitText={I18N_KEYS.VERIFY.COMMON.verify_stepNavigationButton_nextStep2}
                    loadingText={
                        currentStep === 1
                            ? I18N_KEYS.VERIFY.COMMON.verify_stepNavigationButton_loadingStep1
                            : I18N_KEYS.VERIFY.COMMON.verify_stepNavigationButton_loadingStep2
                    }
                    backText={I18N_KEYS.VERIFY.COMMON.verify_stepNavigationButton_back}
                />
            </SectionContainer>
        </PageContainer>
    );
}