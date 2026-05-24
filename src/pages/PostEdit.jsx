import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaTrashAlt } from "react-icons/fa";

import { useAuth } from "../context/AuthContext";
import { useErrorHandler } from "../hooks/useErrorHandler";

import PageContainer from "../components/PageContainer";
import SectionContainer from "../components/SectionContainer";
import Input from "../components/Input";
import TextAreaInput from "../components/TextAreaInput";
import TagInput from "../components/TagInput";
import RadioGroupField from "../components/RadioGroupField";
import Button from "../components/Button";
import PostEditMediaPreview from "../components/PostEditMediaPreview";

import { CONTACT_EMAIL } from "../constants/settings";
import { I18N_KEYS } from "../i18n/key";
import { MOCK_POST_DATA_1 } from "../data/Post/mockPost1";
import { t } from "i18next";

const getCurrentUserID = (user) => {
    return user?.id ?? user?.accountID ?? user?.userID ?? "";
};

const normalizeBoolean = (value) => {
    if (value === true || value === "true") return true;
    if (value === false || value === "false") return false;
    return Boolean(value);
};

const isReviewedReport = (value) => {
    if (value === true || value === "true") return true;
    if (value === false || value === "false") return false;
    return Boolean(value);
};

const normalizeTags = (tags) => {
    if (!Array.isArray(tags)) return [];

    return tags
        .map((tag) => String(tag || "").trim())
        .filter(Boolean);
};

const mapPostToForm = (post) => {
    return {
        title: post?.tieuDe || "",
        description: post?.moTa || "",
        tags: normalizeTags(post?.lstGanThe),
        visibility: String(post?.hanCheHienThi ?? "1"),
        dynamicWatermark: normalizeBoolean(post?.dynamicWM),
        isAIGenerated: normalizeBoolean(post?.sanPhamAI),
        allowComment: normalizeBoolean(post?.choPhepComment),
        isPublic: normalizeBoolean(post?.congKhai),
    };
};

const normalizeFormForCompare = (form) => {
    return {
        title: String(form.title || "").trim(),
        description: String(form.description || "").trim(),
        tags: normalizeTags(form.tags),
        visibility: String(form.visibility || ""),
        dynamicWatermark: Boolean(form.dynamicWatermark),
        isAIGenerated: Boolean(form.isAIGenerated),
        allowComment: Boolean(form.allowComment),
        isPublic: Boolean(form.isPublic),
    };
};

const createDeleteConfirmCode = () => {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";

    for (let index = 0; index < 5; index += 1) {
        code += characters[Math.floor(Math.random() * characters.length)];
    }

    return code;
};

export default function PostEdit({
    setGlobalModal,
    addHelperError,
    setHelperFocusState,
    triggerMascotMood,
    isAlertActive,
    visitorIP,
    clearAlert,
}) {
    const navigate = useNavigate();
    const params = useParams();

    const { handleError } = useErrorHandler();
    const { loading: authLoading, user, isAuthenticated } = useAuth();

    const postID = params.postID || params.id || "2";
    const currentUserID = getCurrentUserID(user);
    const userProfilePath = `/user?id=${currentUserID}`;

    const deleteConfirmInputRef = useRef("");

    const [post, setPost] = useState(null);
    const [originalForm, setOriginalForm] = useState(null);
    const [postForm, setPostForm] = useState(() => mapPostToForm(null));

    const [fieldErrors, setFieldErrors] = useState({
        tags: "",
        visibility: "",
    });

    const [isDirty, setIsDirty] = useState(false);

    const [isPreparingPage, setIsPreparingPage] = useState(true);
    const [isSavingPost, setIsSavingPost] = useState(false);
    const [isDeletingPost, setIsDeletingPost] = useState(false);

    const isLockedByReviewedReport = isReviewedReport(post?.daXemXetBaoCao);
    const isHiddenByAdminReview = Number(post?.hanCheHienThi) === 0;

    const updatePostForm = (patch) => {
        setIsDirty(true);

        setPostForm((prev) => ({
            ...prev,
            ...patch,
        }));
    };

    const clearFieldError = (name) => {
        setFieldErrors((prev) => ({
            ...prev,
            [name]: "",
        }));
    };

    const handleCloseGlobalModal = useCallback(() => {
        setGlobalModal?.({ isOpen: false });
    }, [setGlobalModal]);

    const handleCopyContactEmail = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(CONTACT_EMAIL);

            addHelperError?.({
                id: Date.now(),
                code: I18N_KEYS.POST_EDIT.HANDLE.FETCH_POST.postEdit_handleUpdatePost_helper_success_copyContactEmail,
            });
        } catch (error) {
            addHelperError?.({
                id: Date.now(),
                code: I18N_KEYS.POST_EDIT.HANDLE.FETCH_POST.postEdit_handleUpdatePost_helper_error_copyContactEmail,
            });
        }
    }, [addHelperError]);

    const handleOpenHiddenByAdminModal = useCallback(() => {
        setGlobalModal?.({
            isOpen: true,
            type: "one-button",
            title: I18N_KEYS.POST_EDIT.HANDLE.FETCH_POST.postEdit_handleFetchPost_modalTitle_underReviewing,
            description: I18N_KEYS.POST_EDIT.HANDLE.FETCH_POST.postEdit_handleFetchPost_modalDesc_underReviewing,
            primaryBtnText: I18N_KEYS.POST_EDIT.HANDLE.FETCH_POST.postEdit_handleFetchPost_modalButton_copyContactEmail,
            onPrimaryAction: async () => {
                await handleCopyContactEmail();
            },
        });
    }, [handleCopyContactEmail, setGlobalModal]);

    //-----------------------Phần backend cần quan tâm----------------------

                //-------------Hàm lẻ ktra mấy input-------------------
                        //Check tiêu đề
                    const handleVerifyTieuDePostCreate = async (e) => {
                        try {
                            //await api.verifyTieuDePostCreate({tieuDe: postForm.title});
                            return true;
                        } catch (error) {
                            const errorData = error.response?.data;
                            const result = handleError(errorData);
                            if (result && !result.handled) {
                                switch (result.code){
                                    //Kịch bản tiêu đề quá dài (quá 50 ký twuj)
                                    case "TIEUDE_TOO_LONG":
                                        addHelperError({
                                            id: Date.now(),
                                            code: I18N_KEYS.POST_EDIT.HANDLE.UPDATE_POST.postEdit_handleUpdatePost_helper_error_tieuDeTooLong,
                                        })
                                        return false;
                                    //Kịch bản tiêu đề bị cấm thay đổi
                                    case "TIEUDE_REPORT_REVIEWED":
                                        addHelperError({
                                            id: Date.now(),
                                            code: I18N_KEYS.POST_EDIT.HANDLE.UPDATE_POST.postEdit_handleUpdatePost_helper_error_tieuDeReportReviewed,
                                        })
                                        return false;
                                    default:
                                        addHelperError({
                                            id: Date.now(),
                                            code: I18N_KEYS.GLOBAL_ERROR.ERROR_unknownError,
                                        })
                                        return false;
                                }
                            }
                        }
                    }
        
                        //Check Mô tả
                    const handleVerifyMoTaPostCreate = async (e) => {
                        try {
                            //await api.verifyMoTaPostCreate({moTa: postForm.description});
                            return true;
                        } catch (error) {
                            const errorData = error.response?.data;
                            const result = handleError(errorData);
                            if (result && !result.handled) {
                                switch (result.code){
                                    //Kịch bản mô tả quá dài (quá 255 ký twuj)
                                    case "MOTA_TOO_LONG":
                                        addHelperError({
                                            id: Date.now(),
                                            code: I18N_KEYS.POST_EDIT.HANDLE.UPDATE_POST.postEdit_handleUpdatePost_helper_error_moTaTooLong,
                                        })
                                        return false;
                                    //Kịch bản tiêu đề bị cấm thay đổi
                                    case "MOTA_REPORT_REVIEWED":
                                        addHelperError({
                                            id: Date.now(),
                                            code: I18N_KEYS.POST_EDIT.HANDLE.UPDATE_POST.postEdit_handleUpdatePost_helper_error_moTaReportReviewed,
                                        })
                                        return false;
                                    default:
                                        addHelperError({
                                            id: Date.now(),
                                            code: I18N_KEYS.GLOBAL_ERROR.ERROR_unknownError,
                                        })
                                        return false;
                                }
                            }
                        }
                    }
        
                        //Check list Thẻ
                    const handleVerifyLstGanThePostCreate = async (e) => {
                        try {
                            //await api.verifyLstGanThePostCreate({lstGanThe: postForm.tags});
                            return true;
                        } catch (error) {
                            const errorData = error.response?.data;
                            const result = handleError(errorData);
                            if (result && !result.handled) {
                                switch (result.code){
                                    //Kịch bản ds thẻ là rỗng
                                    case "TAG_NULL":
                                        addHelperError({
                                            id: Date.now(),
                                            code: I18N_KEYS.POST_EDIT.HANDLE.UPDATE_POST.postEdit_handleUpdatePost_helper_error_tagNull,
                                        })
                                        return false;
                                    //Kịch bản ds thẻ quá 10 thẻ
                                    case "TAG_RANGE_OVERFLOW":
                                        addHelperError({
                                            id: Date.now(),
                                            code: I18N_KEYS.POST_EDIT.HANDLE.UPDATE_POST.postEdit_handleUpdatePost_helper_error_tagRangeOverflow,
                                        })
                                        return false;
                                    //Kịch bản có thẻ dài hơn 50 ký tự
                                    case "TAG_TOO_LONG":
                                        addHelperError({
                                            id: Date.now(),
                                            code: I18N_KEYS.POST_EDIT.HANDLE.UPDATE_POST.postEdit_handleUpdatePost_helper_error_tagTooLong,
                                        })
                                        return false;
                                    //Kịch bản tiêu đề bị cấm thay đổi
                                    case "TAG_REPORT_REVIEWED":
                                        addHelperError({
                                            id: Date.now(),
                                            code: I18N_KEYS.POST_EDIT.HANDLE.UPDATE_POST.postEdit_handleUpdatePost_helper_error_tagReportReviewed,
                                        })
                                        return false;
                                    default:
                                        addHelperError({
                                            id: Date.now(),
                                            code: I18N_KEYS.GLOBAL_ERROR.ERROR_unknownError,
                                        })
                                        return false;
                                }
                            }
                        }
                    }
        
        
                        //Check Sản phẩm AI
                    const handleVerifySanPhamAIPostCreate = async (e) => {
                        try {
                            //await api.verifySanPhamAIPostCreate({sanPhamAI: postForm.isAIGenerated});
                            return true;
                        } catch (error) {
                            const errorData = error.response?.data;
                            const result = handleError(errorData);
                            if (result && !result.handled) {
                                switch (result.code){
                                    //Kịch bản không chọn chi
                                    case "SANPHAMAI_NULL":
                                        addHelperError({
                                            id: Date.now(),
                                            code: I18N_KEYS.POST_EDIT.HANDLE.UPDATE_POST.postEdit_handleUpdatePost_helper_error_sanPhamAINull,
                                        })
                                        return false;
                                    //Kịch bản chọn tầm bậy cái không có
                                    case "SANPHAMAI_WRONG_TYPE":
                                        addHelperError({
                                            id: Date.now(),
                                            code: I18N_KEYS.POST_EDIT.HANDLE.UPDATE_POST.postEdit_handleUpdatePost_helper_error_sanPhamAIWrongType,
                                        })
                                        return false;
                                    //Kịch bản tiêu đề bị cấm thay đổi
                                    case "SANPHAMAI_REPORT_REVIEWED":
                                        addHelperError({
                                            id: Date.now(),
                                            code: I18N_KEYS.POST_EDIT.HANDLE.UPDATE_POST.postEdit_handleUpdatePost_helper_error_sanPhamAIReportReviewed,
                                        })
                                        return false;
                                    default:
                                        addHelperError({
                                            id: Date.now(),
                                            code: I18N_KEYS.GLOBAL_ERROR.ERROR_unknownError,
                                        })
                                        return false;
                                }
                            }
                        }
                    }
        
                        //Check Hạn chế hiển thị
                    const handleVerifyHanCheHienThiPostCreate = async (e) => {
                        try {
                            //await api.verifyHanCheHienThiPostCreate({hanCheHienThi: Number(postForm.visibility)});
                            return true;
                        } catch (error) {
                            const errorData = error.response?.data;
                            const result = handleError(errorData);
                            if (result && !result.handled) {
                                switch (result.code){
                                    //Kịch bản không chọn chi
                                    case "HANCHEHIENTHI_NULL":
                                        addHelperError({
                                            id: Date.now(),
                                            code: I18N_KEYS.POST_EDIT.HANDLE.UPDATE_POST.postEdit_handleUpdatePost_helper_error_hanCheHienThiNull,
                                        })
                                        return false;
                                    //Kịch bản chọn tầm bậy cái không có
                                    case "HANCHEHIENTHI_WRONG_TYPE":
                                        addHelperError({
                                            id: Date.now(),
                                            code: I18N_KEYS.POST_EDIT.HANDLE.UPDATE_POST.postEdit_handleUpdatePost_helper_error_hanCheHienThiWrongType,
                                        })
                                        return false;
                                    //Kịch bản tiêu đề bị cấm thay đổi
                                    case "HANCHEHIENTHI_REPORT_REVIEWED":
                                        addHelperError({
                                            id: Date.now(),
                                            code: I18N_KEYS.POST_EDIT.HANDLE.UPDATE_POST.postEdit_handleUpdatePost_helper_error_hanCheHienThiReportReviewed,
                                        })
                                        return false;
                                    default:
                                        addHelperError({
                                            id: Date.now(),
                                            code: I18N_KEYS.GLOBAL_ERROR.ERROR_unknownError,
                                        })
                                        return false;
                                }
                            }
                        }
                    }
                    //-------------HẾT Hàm lẻ---------------


    const handleUpdatePost = async (payload) => { //Chỉnh sửa post

        setIsSavingPost(true);

        const results = await Promise.all([
            handleVerifyTieuDePostCreate(),
            handleVerifyMoTaPostCreate(),
            handleVerifyLstGanThePostCreate(),
            handleVerifySanPhamAIPostCreate(),
            handleVerifyHanCheHienThiPostCreate(),
        ]);
        const isAllValid = results.every(result => result === true);

        if (isAllValid) {
            try {
                // TODO: thay bằng API cập nhật post.
                // await api.updatePost(postID, payload);

                console.log("Payload cập nhật bài viết:", payload);
                await Promise.resolve();

                return true;
            } catch (error) {
                const errorData = error.response?.data;
                const result = handleError(errorData);

                if (result && !result.handled) {
                    switch (result.code) {
                        case "NOT_AUTHOR":
                            addHelperError?.({
                                id: Date.now(),
                                code: I18N_KEYS.POST_EDIT.HANDLE.UPDATE_POST.postEdit_handleUpdatePost_helper_error_notAuthor,
                            });
                            navigate("/", { replace: true });
                            break;
                        case "UNDER_REVIEWING":
                            addHelperError?.({
                                id: Date.now(),
                                code: I18N_KEYS.POST_EDIT.HANDLE.UPDATE_POST.postEdit_handleUpdatePost_helper_success_saved,
                            });
                            navigate("/", { replace: true });
                            break;
                        default:
                            addHelperError?.({
                                id: Date.now(),
                                code: I18N_KEYS.GLOBAL_ERROR.ERROR_unknownError,
                            });
                            break;
                    }
                }

                return false;
            } finally {
                setIsSavingPost(false);
            }
        };
    };

    const handleDeletePost = async () => { // Xóa post
        try {
            setIsDeletingPost(true);

            // TODO: thay bằng API xóa post.
            // await api.deletePost(postID);

            await Promise.resolve();

            return true;
        } catch (error) {
            const errorData = error.response?.data;
            const result = handleError(errorData);

            if (result && !result.handled) {
                switch (result.code) {
                    case "NOT_AUTHOR":
                        addHelperError?.({
                            id: Date.now(),
                            code: I18N_KEYS.POST_EDIT.HANDLE.DELETE_POST.postEdit_handleDeletePost_helper_error_notAuthor,
                        });
                        navigate("/", { replace: true });
                        break;
                    default:
                        addHelperError?.({
                            id: Date.now(),
                            code: I18N_KEYS.GLOBAL_ERROR.ERROR_unknownError,
                        });
                        break;
                }
            }

            return false;
        } finally {
            setIsDeletingPost(false);
        }
    };


    useEffect(() => { 
        let isMounted = true;

        const preparePost = async () => { // Lấy thông tin post ngay mới vô
            try {
                setIsPreparingPage(true);
                // TODO: thay bằng API lấy thông tin post theo postID.
                // const response = await api.getPostForEdit(postID);
                // const fetchedPost = response.data;

                await Promise.resolve();
                const fetchedPost = MOCK_POST_DATA_1;

                if (!isMounted || !fetchedPost) return;

                const mappedForm = mapPostToForm(fetchedPost);

                setPost(fetchedPost);
                setPostForm(mappedForm);
                setOriginalForm(mappedForm);
                setIsDirty(false);
            } catch (error) {
                const errorData = error.response?.data;
                const result = handleError(errorData);

                if (result && !result.handled) {
                    switch (result.code) {
                        default:
                            addHelperError?.({
                                id: Date.now(),
                                code: I18N_KEYS.GLOBAL_ERROR.ERROR_unknownError,
                            });
                            break;
                    }
                }

                navigate("/", { replace: true });
            } finally {
                if (isMounted) {
                    setIsPreparingPage(false);
                }
            }
        };

        preparePost();

        return () => {
            isMounted = false;
        };
    }, [postID]);

    useEffect(() => {
        if (authLoading || isPreparingPage || !post) return;

        if (!isAuthenticated) {
            navigate("/", { replace: true });
            return;
        }

        if (String(currentUserID) !== String(post.tacGia)) {
            navigate("/", { replace: true });
            return;
        }

        if (Number(post.hanCheHienThi) === 0) {
            handleOpenHiddenByAdminModal();
            navigate(userProfilePath, { replace: true });
        }
    }, [
        authLoading,
        currentUserID,
        handleOpenHiddenByAdminModal,
        isAuthenticated,
        isPreparingPage,
        navigate,
        post,
        userProfilePath,
    ]);


    const validateBeforeSave = () => {
        const nextErrors = {
            tags: "",
            visibility: "",
        };

        if (postForm.tags.length === 0) {
            nextErrors.tags = "empty";
        }

        if (!postForm.visibility) {
            nextErrors.visibility = "empty";
        }

        setFieldErrors(nextErrors);

        return !nextErrors.tags && !nextErrors.visibility;
    };

    const buildUpdatePayload = () => {
        const normalizedForm = normalizeFormForCompare(postForm);

        const payload = {
            dynamicWM: normalizedForm.dynamicWatermark,
            choPhepComment: normalizedForm.allowComment,
            congKhai: normalizedForm.isPublic,
        };

        if (!isLockedByReviewedReport) {
            payload.tieuDe = normalizedForm.title;
            payload.moTa = normalizedForm.description;
            payload.lstGanThe = normalizedForm.tags;
            payload.hanCheHienThi = Number(normalizedForm.visibility);
            payload.sanPhamAI = normalizedForm.isAIGenerated;
        }

        return payload;
    };

    const handleSaveChanges = async () => {
        if (!isDirty || isSavingPost) return;

        if (!validateBeforeSave()) return;

        const payload = buildUpdatePayload();
        const isSuccess = await handleUpdatePost(payload);

        if (!isSuccess) return;

        const nextOriginalForm = {
            ...postForm,

            title: isLockedByReviewedReport ? originalForm.title : postForm.title,
            description: isLockedByReviewedReport
                ? originalForm.description
                : postForm.description,
            tags: isLockedByReviewedReport
                ? originalForm.tags
                : postForm.tags,
            visibility: isLockedByReviewedReport
                ? originalForm.visibility
                : postForm.visibility,
            isAIGenerated: isLockedByReviewedReport
                ? originalForm.isAIGenerated
                : postForm.isAIGenerated,
        };

        setOriginalForm(nextOriginalForm);

        setPost((prev) => ({
            ...prev,
            ...payload,
            tieuDe: nextOriginalForm.title,
            moTa: nextOriginalForm.description,
            hanCheHienThi: Number(nextOriginalForm.visibility),
            dynamicWM: payload.dynamicWM,
            sanPhamAI: nextOriginalForm.isAIGenerated,
            choPhepComment: payload.choPhepComment,
            congKhai: payload.congKhai,
            lstGanThe: nextOriginalForm.tags,
        }));

        addHelperError?.({
            id: Date.now(),
            code: I18N_KEYS.POST_EDIT.HANDLE.UPDATE_POST.postEdit_handleUpdatePost_helper_success_saved,
        });

        setIsDirty(false);
    };

    const openDeleteConfirmCodeModal = (confirmCode) => {
        deleteConfirmInputRef.current = "";

        setGlobalModal?.({
            isOpen: true,
            type: "input",
            title: I18N_KEYS.POST_EDIT.HANDLE.DELETE_POST.postEdit_handleDeletePost_modalTitle_deleteConfirm2,
            description: [I18N_KEYS.POST_EDIT.HANDLE.DELETE_POST.postEdit_handleDeletePost_modalDesc_deleteConfirm2, {confirmCode: confirmCode}],
            primaryBtnText: I18N_KEYS.POST_EDIT.HANDLE.DELETE_POST.postEdit_handleDeletePost_modalButton_next2,
            secondaryBtnText: I18N_KEYS.POST_EDIT.HANDLE.DELETE_POST.postEdit_handleDeletePost_modalButton_back2,
            inputProps: {
                placeholder: I18N_KEYS.POST_EDIT.HANDLE.DELETE_POST.postEdit_handleDeletePost_modalInputPlaceholder_deleteConfirm2,
                onChange: (event) => {
                    deleteConfirmInputRef.current = event.target.value;
                },
            },
            onPrimaryAction: async () => {
                const userInput = String(deleteConfirmInputRef.current || "")
                    .trim()
                    .toUpperCase();

                if (userInput !== confirmCode) {
                    addHelperError?.({
                        id: Date.now(),
                        code: I18N_KEYS.POST_EDIT.HANDLE.DELETE_POST.postEdit_handleDeletePost_helper_error_wrongCode,
                    });

                    openDeleteConfirmCodeModal(confirmCode);
                    return;
                }

                const isSuccess = await handleDeletePost();

                if (!isSuccess) return;

                setGlobalModal?.({ isOpen: false });

                addHelperError?.({
                    id: Date.now(),
                    code: I18N_KEYS.POST_EDIT.HANDLE.DELETE_POST.postEdit_handleDeletePost_helper_success_deleted,
                });

                navigate(userProfilePath, { replace: true });
            },
            onSecondaryAction: handleCloseGlobalModal,
        });
    };

    const handleOpenDeleteWarningModal = () => {
        setGlobalModal?.({
            isOpen: true,
            type: "two-buttons",
            title: I18N_KEYS.POST_EDIT.HANDLE.DELETE_POST.postEdit_handleDeletePost_modalTitle_deleteConfirm1,
            description: I18N_KEYS.POST_EDIT.HANDLE.DELETE_POST.postEdit_handleDeletePost_modalDesc_deleteConfirm1,
            primaryBtnText: I18N_KEYS.POST_EDIT.HANDLE.DELETE_POST.postEdit_handleDeletePost_modalButton_next1,
            secondaryBtnText: I18N_KEYS.POST_EDIT.HANDLE.DELETE_POST.postEdit_handleDeletePost_modalButton_back1,
            onPrimaryAction: () => {
                const confirmCode = createDeleteConfirmCode();
                openDeleteConfirmCodeModal(confirmCode);
            },
            onSecondaryAction: handleCloseGlobalModal,
        });
    };

    
                //-----------------------Hết phần backend cần quan tâm----------------------

    if (
        authLoading ||
        isPreparingPage ||
        !post ||
        !isAuthenticated ||
        String(currentUserID) !== String(post.tacGia) ||
        isHiddenByAdminReview
    ) {
        return null;
    }










    return (
        <PageContainer setHelperFocusState={setHelperFocusState}>
            <SectionContainer
                title={I18N_KEYS.POST_EDIT.COMMON.postEdit_sectionContainerTitle}
                description={I18N_KEYS.POST_EDIT.COMMON.postEdit_sectionContainerDesc}
                className="overflow-visible"
                headerRight={
                    <button
                        type="button"
                        onClick={handleOpenDeleteWarningModal}
                        disabled={isDeletingPost}
                        className="
                            inline-flex h-11 w-11 items-center justify-center rounded-full
                            bg-orange-100 text-orange-400 shadow-sm transition-all
                            hover:bg-orange-200 hover:text-orange-500 active:scale-95
                            dark:bg-orange-950 dark:text-orange-700
                            dark:hover:bg-orange-900 dark:hover:text-orange-600
                            disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100
                        "
                        aria-label={t(I18N_KEYS.POST_EDIT.COMMON.postEdit_sectionContainerButtonLabel_deletePost)}
                        title={t(I18N_KEYS.POST_EDIT.COMMON.postEdit_sectionContainerButtonLabel_deletePost)}
                    >
                        <FaTrashAlt className="h-4 w-4" />
                    </button>
                }
            >
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                    <PostEditMediaPreview
                        post={post}
                        dynamicWM = {postForm.dynamicWatermark}
                        watermarkText={`@${user?.username || "Protected"} · EyesOnly`}  
                        isAlertActive={isAlertActive}
                        visitorIP={visitorIP}
                        clearAlert={clearAlert}
                    />

                    <form
                        className="space-y-6"
                        onSubmit={(event) => {
                            event.preventDefault();
                            handleSaveChanges();
                        }}
                    >
                        {isLockedByReviewedReport && (
                            <div className="rounded-4xl bg-bg-shade-50 px-5 py-4">
                                <p className="font-heading text-sm font-semibold text-main-text">
                                    {t(I18N_KEYS.POST_EDIT.COMMON.postEdit_lockedNotice_text1)}
                                </p>
                                <p className="mt-1 font-body text-sm leading-relaxed text-text-shade-300">
                                    {t(I18N_KEYS.POST_EDIT.COMMON.postEdit_lockedNotice_text2)}
                                </p>
                            </div>
                        )}

                        <Input
                            id="post-edit-title"
                            label={I18N_KEYS.POST_EDIT.COMMON.postEdit_formLabel_tieuDe}
                            optional
                            maxLength={50}
                            value={postForm.title}
                            disabled={isLockedByReviewedReport}
                            onChange={(event) => updatePostForm({ title: event.target.value })}
                            placeholder={I18N_KEYS.POST_EDIT.COMMON.postEdit_formPlaceholder_tieuDe}
                            helperText={
                                isLockedByReviewedReport
                                    ? I18N_KEYS.POST_EDIT.COMMON.postEdit_formHelper_tieuDe
                                    : ""
                            }
                            triggerMascotMood={triggerMascotMood}
                        />

                        <TextAreaInput
                            id="post-edit-description"
                            label={I18N_KEYS.POST_EDIT.COMMON.postEdit_formLabel_moTa}
                            optional
                            maxLength={255}
                            rows={6}
                            value={postForm.description}
                            disabled={isLockedByReviewedReport}
                            onChange={(event) =>
                                updatePostForm({ description: event.target.value })
                            }
                            placeholder={I18N_KEYS.POST_EDIT.COMMON.postEdit_formPlaceholder_moTa}
                            helperText={
                                isLockedByReviewedReport
                                    ? I18N_KEYS.POST_EDIT.COMMON.postEdit_formHelper_moTa
                                    : ""
                            }
                            triggerMascotMood={triggerMascotMood}
                        />

                        <div className="h-2" />

                        <TagInput
                            tags={postForm.tags}
                            disabled={isLockedByReviewedReport}
                            setTags={(nextTags) => {
                                if (isLockedByReviewedReport) return;

                                setIsDirty(true);

                                setPostForm((prev) => ({
                                    ...prev,
                                    tags: typeof nextTags === "function"
                                        ? nextTags(prev.tags)
                                        : nextTags,
                                }));
                            }}
                            errorType={fieldErrors.tags}
                            errorEmpty={I18N_KEYS.POST_EDIT.HANDLE.UPDATE_POST.postEdit_handleUpdatePost_helper_error_tagNull}
                            errorRangeOverflow={I18N_KEYS.POST_EDIT.HANDLE.UPDATE_POST.postEdit_handleUpdatePost_helper_error_tagRangeOverflow}
                            errorTooLong={I18N_KEYS.POST_EDIT.HANDLE.UPDATE_POST.postEdit_handleUpdatePost_helper_error_tagTooLong}
                            helperText={
                                isLockedByReviewedReport
                                    ? I18N_KEYS.POST_EDIT.COMMON.postEdit_formHelper_danhSachThe
                                    : ""
                            }
                            onClearError={() => clearFieldError("tags")}
                            triggerMascotMood={triggerMascotMood}
                        />

                        <RadioGroupField
                            label={I18N_KEYS.POST_EDIT.COMMON.postEdit_formLabel_hanCheHienThi}
                            value={postForm.visibility}
                            moreInfo={I18N_KEYS.POST_EDIT.COMMON.postEdit_formMoreInfo_hanCheHienThi}
                            addHelperError={addHelperError}
                            disabled={isLockedByReviewedReport}
                            errorType={fieldErrors.visibility}
                            errorEmpty={I18N_KEYS.POST_EDIT.HANDLE.UPDATE_POST.postEdit_handleUpdatePost_helper_error_hanCheHienThiNull}
                            helperText={
                                isLockedByReviewedReport
                                    ? I18N_KEYS.POST_EDIT.COMMON.postEdit_formHelper_hanCheHienThi
                                    : ""
                            }
                            onClearError={() => clearFieldError("visibility")}
                            onChange={(visibility) => updatePostForm({ visibility })}
                            options={[
                                { label: I18N_KEYS.POST_EDIT.COMMON.postEdit_formRadioLabel_hanCheHienThi_all, value: "1" },
                                { label: I18N_KEYS.POST_EDIT.COMMON.postEdit_formRadioLabel_hanCheHienThi_r18, value: "2" },
                                { label: I18N_KEYS.POST_EDIT.COMMON.postEdit_formRadioLabel_hanCheHienThi_r18g, value: "3" },
                            ]}
                        />

                        <RadioGroupField
                            label={I18N_KEYS.POST_EDIT.COMMON.postEdit_formLabel_dynamicWM}
                            value={postForm.dynamicWatermark ? "yes" : "no"}
                            moreInfo={I18N_KEYS.POST_EDIT.COMMON.postEdit_formMoreInfo_dynamicWM}
                            addHelperError={addHelperError}
                            onChange={(value) =>
                                updatePostForm({ dynamicWatermark: value === "yes" })
                            }
                            options={[
                                { label: I18N_KEYS.POST_EDIT.COMMON.postEdit_formRadioLabel_dynamicWM_yes, value: "yes" },
                                { label: I18N_KEYS.POST_EDIT.COMMON.postEdit_formRadioLabel_dynamicWM_no, value: "no" },
                            ]}
                        />

                        <RadioGroupField
                            label={I18N_KEYS.POST_EDIT.COMMON.postEdit_formLabel_sanPhamAI}
                            value={postForm.isAIGenerated ? "yes" : "no"}
                            moreInfo={I18N_KEYS.POST_EDIT.COMMON.postEdit_formMoreInfo_sanPhamAI}
                            addHelperError={addHelperError}
                            disabled={isLockedByReviewedReport}
                            helperText={
                                isLockedByReviewedReport
                                    ? I18N_KEYS.POST_EDIT.COMMON.postEdit_formHelper_sanPhamAI
                                    : ""
                            }
                            onChange={(value) =>
                                updatePostForm({ isAIGenerated: value === "yes" })
                            }
                            options={[
                                { label: I18N_KEYS.POST_EDIT.COMMON.postEdit_formRadioLabel_sanPhamAI_yes, value: "yes" },
                                { label: I18N_KEYS.POST_EDIT.COMMON.postEdit_formRadioLabel_sanPhamAI_no, value: "no" },
                            ]}
                        />

                        <RadioGroupField
                            label={I18N_KEYS.POST_EDIT.COMMON.postEdit_formLabel_choPhepComment}
                            value={postForm.allowComment ? "yes" : "no"}
                            onChange={(value) =>
                                updatePostForm({ allowComment: value === "yes" })
                            }
                            options={[
                                { label: I18N_KEYS.POST_EDIT.COMMON.postEdit_formRadioLabel_choPhepComment_yes, value: "yes" },
                                { label: I18N_KEYS.POST_EDIT.COMMON.postEdit_formRadioLabel_choPhepComment_no, value: "no" },
                            ]}
                        />

                        <RadioGroupField
                            label={I18N_KEYS.POST_EDIT.COMMON.postEdit_formLabel_congKhai}
                            value={postForm.isPublic ? "yes" : "no"}
                            onChange={(value) =>
                                updatePostForm({ isPublic: value === "yes" })
                            }
                            options={[
                                { label: I18N_KEYS.POST_EDIT.COMMON.postEdit_formRadioLabel_congKhai_yes, value: "yes" },
                                { label: I18N_KEYS.POST_EDIT.COMMON.postEdit_formRadioLabel_congKhai_no, value: "no" },
                            ]}
                        />

                        <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                            <Button
                                type="button"
                                variant="outline"
                                size="large"
                                className="rounded-full sm:min-w-36"
                                onClick={() => navigate(-1)}
                                disabled={isSavingPost || isDeletingPost}
                            >
                                {t(I18N_KEYS.POST_EDIT.COMMON.postEdit_formButton_back)}
                            </Button>

                            <Button
                                type="submit"
                                variant="primary"
                                size="large"
                                className="rounded-full sm:min-w-44"
                                disabled={!isDirty || isSavingPost || isDeletingPost}
                            >
                                {isSavingPost ? I18N_KEYS.POST_EDIT.COMMON.postEdit_formButton_loading : I18N_KEYS.POST_EDIT.COMMON.postEdit_formButton_save}
                            </Button>
                        </div>
                    </form>
                </div>
            </SectionContainer>
        </PageContainer>
    );
}