import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from '../context/AuthContext';
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { I18N_KEYS } from "../i18n/key";
import { useErrorHandler } from '../hooks/useErrorHandler';
import { AnimatePresence, motion } from "framer-motion";

import { postApi } from "../api/postApi";
import PageContainer from '../components/PageContainer';
import Input from "../components/Input";
import SectionContainer from "../components/SectionContainer";
import TextAreaInput from "../components/TextAreaInput";
import TagInput from "../components/TagInput";
import RadioGroupField from "../components/RadioGroupField";
import StepIndicator from "../components/StepIndicator";
import StepNavigation from "../components/StepNavigation";
import PostCreateNotice from "../components/PostCreateNotice";
import PostFileUploader from "../components/PostFileUploader";
import ProtectionImageStrip from "../components/ProtectionImageStrip";
import ProtectionControls, {
    DEFAULT_PROTECTION_SETTINGS,
} from "../components/ProtectionControls";
import ProtectionPreviewCanvas from "../components/ProtectionPreviewCanvas";
import ToggleField from "../components/ToggleField";

export default function PostCreate({
    setGlobalModal,
    addHelperError,
    setHelperFocusState,
    triggerMascotMood,
    isUnder18,
    isAlertActive,
    visitorIP,
    clearAlert,
}) {
    const navigate = useNavigate();
    const { handleError } = useErrorHandler();
    const { t, i18n } = useTranslation();
    const location = useLocation();
    const { loading, user, isAuthenticated, logout } = useAuth();

    const [currentStep, setCurrentStep] = useState(1);

    const [files, setFiles] = useState([]);
    const [isFileProcessing, setIsFileProcessing] = useState(false);

    const [postForm, setPostForm] = useState({
        title: "",
        description: "",
        tags: [],
        visibility: "0",
        dynamicWatermark: true,
        isAIGenerated: false,
        allowComment: true,
        isPublic: true,
    });

    const [fieldErrors, setFieldErrors] = useState({
        files: "",
        tags: "",
        visibility: "",
    });

    const [applyToAll, setApplyToAll] = useState(true);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [globalProtectionSettings, setGlobalProtectionSettings] = useState(
        DEFAULT_PROTECTION_SETTINGS
    );
    const [imageProtectionSettings, setImageProtectionSettings] = useState({});

    const [isVerifyingInformation, setIsVerifyingInformation] = useState(false);
    const [previewImageUrl, setPreviewImageUrl] = useState("");
    const [previewVideoUrl, setPreviewVideoUrl] = useState("");
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);
    const [isCreatingPost, setIsCreatingPost] = useState(false);

    const selectedFile = files[selectedImageIndex];

    const openDisabledAccountModal = useCallback(() => {
        setGlobalModal?.({
            isOpen: true,
            type: "two-buttons",
            title: I18N_KEYS.POST_CREATE.HANDLE.AUTHENTICATION_CHECK.postCreate_authCheck_modalTitle_disabledAccount,
            description: I18N_KEYS.POST_CREATE.HANDLE.AUTHENTICATION_CHECK.postCreate_authCheck_modalDesc_disabledAccount,
            primaryBtnText: I18N_KEYS.POST_CREATE.HANDLE.AUTHENTICATION_CHECK.postCreate_authCheck_modalButton_toProfile,
            secondaryBtnText: I18N_KEYS.POST_CREATE.HANDLE.AUTHENTICATION_CHECK.postCreate_authCheck_modalButton_close,
            onPrimaryAction: () => {
                setGlobalModal?.({ isOpen: false });
                navigate("/profile?tab=disabled");
            },
            onSecondaryAction: () => {
                setGlobalModal?.({ isOpen: false });
            },
        });
    }, [navigate, setGlobalModal]);

    //-----------------------------Kiểm tra đăng nhập với Vô hiệu hóa trước--------------------------
    useEffect(() => {
        if (loading) return;

        const destinationPath = `${location.pathname}${location.search || ""}`;

        if (!isAuthenticated) {
            navigate(`/login?redirect=${encodeURIComponent(destinationPath)}`, {
                replace: true,
            });
            return;
        }

        if (user?.daVoHieuHoa === true) {
            setGlobalModal?.({
                isOpen: true,
                type: "two-buttons",
                title: I18N_KEYS.POST_CREATE.HANDLE.AUTHENTICATION_CHECK.postCreate_authCheck_modalTitle_disabledAccount,
                description: I18N_KEYS.POST_CREATE.HANDLE.AUTHENTICATION_CHECK.postCreate_authCheck_modalDesc_disabledAccount,
                primaryBtnText: I18N_KEYS.POST_CREATE.HANDLE.AUTHENTICATION_CHECK.postCreate_authCheck_modalButton_toProfile,
                secondaryBtnText: I18N_KEYS.POST_CREATE.HANDLE.AUTHENTICATION_CHECK.postCreate_authCheck_modalButton_close,
                onPrimaryAction: () => {
                    setGlobalModal?.({ isOpen: false });
                    navigate("/profile?tab=disabled");
                },
                onSecondaryAction: () => {
                    setGlobalModal?.({ isOpen: false });
                },
            });

            navigate("/", { replace: true });
        }
    }, [
        isAuthenticated,
        user?.daVoHieuHoa,
        location.pathname,
        location.search,
        navigate,
        setGlobalModal,
    ]);

    ///----------------- Hàm linh tinh không cần quan tâm-----------------------

    const currentProtectionSettings = useMemo(() => {
        if (applyToAll) return globalProtectionSettings;

        if (!selectedFile) return DEFAULT_PROTECTION_SETTINGS;

        return (
            imageProtectionSettings[selectedFile.id] ||
            DEFAULT_PROTECTION_SETTINGS
        );
    }, [
        applyToAll,
        globalProtectionSettings,
        imageProtectionSettings,
        selectedFile,
    ]);

    useEffect(() => {
        return () => {
            files.forEach((item) => URL.revokeObjectURL(item.url));
        };
    }, []);

    useEffect(() => {
        if (selectedImageIndex > files.length - 1) {
            setSelectedImageIndex(Math.max(files.length - 1, 0));
        }
    }, [files.length, selectedImageIndex]);

    const updatePostForm = (patch) => {
        setPostForm((prev) => ({
            ...prev,
            ...patch,
        }));
    };

    const updateProtectionSettings = (nextSettings) => {
        if (applyToAll) {
            setGlobalProtectionSettings(nextSettings);
            return;
        }

        if (!selectedFile) return;

        setImageProtectionSettings((prev) => ({
            ...prev,
            [selectedFile.id]: nextSettings,
        }));
    };

    const clearFieldError = (name) => {
        setFieldErrors((prev) => ({
            ...prev,
            [name]: "",
        }));
    };

    const handleApplyToAllChange = (nextValue) => {
        setApplyToAll(nextValue);

        if (!nextValue) {
            setGlobalModal?.({
                isOpen: true,
                type: "one-button",
                title: I18N_KEYS.POST_CREATE.HANDLE.APPLY_TO_ALL_CHANGE.postCreate_handleApplyToAllChange_modalTitle_applyToAllChange,
                description:
                    I18N_KEYS.POST_CREATE.HANDLE.APPLY_TO_ALL_CHANGE.postCreate_handleApplyToAllChange_modalDesc_applyToAllChange,
                primaryBtnText: I18N_KEYS.POST_CREATE.HANDLE.APPLY_TO_ALL_CHANGE.postCreate_handleApplyToAllChange_modalButton_applyToAllChange,
                onPrimaryAction: () => {
                    setGlobalModal?.({ isOpen: false });
                },
            });
        }
    };

    const validateInformationBeforeNext = () => {
        const nextErrors = {
            files: "",
            tags: "",
            visibility: "",
        };

        if (files.length === 0) {
            nextErrors.files = "empty";
        }

        if (postForm.tags.length === 0) {
            nextErrors.tags = "empty";
        }

        if (!postForm.visibility) {
            nextErrors.visibility = "empty";
        }

        setFieldErrors(nextErrors);

        return !nextErrors.files && !nextErrors.tags && !nextErrors.visibility;
    };

    ///----------------- HẾT Hàm linh tinh không cần quan tâm-----------------------




    //---------------------- Hàm kiểm tra Thành nên đổi đồ ---------------------------------

    //-------------Hàm lẻ Step 1-------------------
    //Check tiêu đề
    const handleVerifyTieuDePostCreate = async (e) => {
        try {
            //TODO: Gọi API verify tiêu đề ở đây, nhớ dùng postForm.title nhé
            //await api.verifyTieuDePostCreate({tieuDe: postForm.title});
            return true;
        } catch (error) {
            const errorData = error.response?.data;
            const result = handleError(errorData);
            if (result && !result.handled) {
                switch (result.code) {
                    //Kịch bản tiêu đề quá dài (quá 50 ký twuj)
                    case "TIEUDE_TOO_LONG":
                        addHelperError({
                            id: Date.now(),
                            code: I18N_KEYS.POST_CREATE.HANDLE.VERIFY_INFORMATION.postCreate_handleVerifyInformation_helper_error_tieuDeTooLong,
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
            //TODO: Gọi API verify mô tả ở đây, nhớ dùng postForm.description nhé
            //await api.verifyMoTaPostCreate({moTa: postForm.description});
            return true;
        } catch (error) {
            const errorData = error.response?.data;
            const result = handleError(errorData);
            if (result && !result.handled) {
                switch (result.code) {
                    //Kịch bản mô tả quá dài (quá 255 ký twuj)
                    case "MOTA_TOO_LONG":
                        addHelperError({
                            id: Date.now(),
                            code: I18N_KEYS.POST_CREATE.HANDLE.VERIFY_INFORMATION.postCreate_handleVerifyInformation_helper_error_moTaTooLong,
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
                switch (result.code) {
                    //Kịch bản ds thẻ là rỗng
                    case "TAG_NULL":
                        addHelperError({
                            id: Date.now(),
                            code: I18N_KEYS.POST_CREATE.HANDLE.VERIFY_INFORMATION.postCreate_handleVerifyInformation_helper_error_tagNull,
                        })
                        return false;
                    //Kịch bản ds thẻ quá 10 thẻ
                    case "TAG_RANGE_OVERFLOW":
                        addHelperError({
                            id: Date.now(),
                            code: I18N_KEYS.POST_CREATE.HANDLE.VERIFY_INFORMATION.postCreate_handleVerifyInformation_helper_error_tagRangeOverflow,
                        })
                        return false;
                    //Kịch bản có thẻ dài hơn 50 ký tự
                    case "TAG_TOO_LONG":
                        addHelperError({
                            id: Date.now(),
                            code: I18N_KEYS.POST_CREATE.HANDLE.VERIFY_INFORMATION.postCreate_handleVerifyInformation_helper_error_tagTooLong,
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

    //Check ds hình ảnh
    const handleVerifyLstFilesPostCreate = async (e) => {
        try {
            //await api.verifyLstFilesPostCreate({lstFiles: files});
            return true;
        } catch (error) {
            const errorData = error.response?.data;
            const result = handleError(errorData);
            if (result && !result.handled) {
                switch (result.code) {
                    //Kịch bản không có ảnh mô hết
                    case "FILE_NULL":
                        addHelperError({
                            id: Date.now(),
                            code: I18N_KEYS.POST_CREATE.HANDLE.VERIFY_INFORMATION.postCreate_handleVerifyInformation_helper_error_fileNull,
                        })
                        return false;
                    //Kịch bản có ảnh sai định dạng
                    case "FILE_WRONG_TYPE":
                        addHelperError({
                            id: Date.now(),
                            code: I18N_KEYS.POST_CREATE.HANDLE.VERIFY_INFORMATION.postCreate_handleVerifyInformation_helper_error_fileWrongType,
                        })
                        return false;
                    //Kịch bản có file quá 15MB
                    case "FILE_RANGE_OVERFLOW":
                        addHelperError({
                            id: Date.now(),
                            code: I18N_KEYS.POST_CREATE.HANDLE.VERIFY_INFORMATION.postCreate_handleVerifyInformation_helper_error_fileRangeOverflow,
                        })
                        return false;
                    //Kịch bản quá 10 file
                    case "FILE_TOO_MANY":
                        addHelperError({
                            id: Date.now(),
                            code: I18N_KEYS.POST_CREATE.HANDLE.VERIFY_INFORMATION.postCreate_handleVerifyInformation_helper_error_fileTooMany,
                        })
                        return false;
                    //Kịch bản tổng dung lượng quá 100MB
                    case "FILE_TOTAL_RANGE_OVERFLOW":
                        addHelperError({
                            id: Date.now(),
                            code: I18N_KEYS.POST_CREATE.HANDLE.VERIFY_INFORMATION.postCreatepostCreate_handleVerifyInformation_helper_error_fileTotalRangeOverflow_handleVerifyInformation_helper_error_tieuDeTooLong,
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
                switch (result.code) {
                    //Kịch bản không chọn chi
                    case "SANPHAMAI_NULL":
                        addHelperError({
                            id: Date.now(),
                            code: I18N_KEYS.POST_CREATE.HANDLE.VERIFY_INFORMATION.postCreate_handleVerifyInformation_helper_error_sanPhamAINull,
                        })
                        return false;
                    //Kịch bản chọn tầm bậy cái không có
                    case "SANPHAMAI_WRONG_TYPE":
                        addHelperError({
                            id: Date.now(),
                            code: I18N_KEYS.POST_CREATE.HANDLE.VERIFY_INFORMATION.postCreate_handleVerifyInformation_helper_error_sanPhamAIWrongType,
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
                switch (result.code) {
                    //Kịch bản không chọn chi
                    case "HANCHEHIENTHI_NULL":
                        addHelperError({
                            id: Date.now(),
                            code: I18N_KEYS.POST_CREATE.HANDLE.VERIFY_INFORMATION.postCreate_handleVerifyInformation_helper_error_hanCheHienThiNull,
                        })
                        return false;
                    //Kịch bản chọn tầm bậy cái không có
                    case "HANCHEHIENTHI_WRONG_TYPE":
                        addHelperError({
                            id: Date.now(),
                            code: I18N_KEYS.POST_CREATE.HANDLE.VERIFY_INFORMATION.postCreate_handleVerifyInformation_helper_error_hanCheHienThiWrongType,
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
    //-------------HẾT Hàm lẻ Step 1---------------


    //Hàm kiểm tra step 1 (nhập thông tin đồ rứa)
    const handleVerifyInformation = async () => {
        if (!validateInformationBeforeNext()) return;

        //Cái ni để ý là đg kiểm tra, đừng có chọt lung tung
        setIsVerifyingInformation(true);

        const results = await Promise.all([
            handleVerifyTieuDePostCreate(),
            handleVerifyMoTaPostCreate(),
            handleVerifyLstGanThePostCreate(),
            handleVerifyLstFilesPostCreate(),
            handleVerifySanPhamAIPostCreate(),
            handleVerifyHanCheHienThiPostCreate(),
        ]);
        const isAllValid = results.every(result => result === true);
        if (isAllValid) {
            try {
                setCurrentStep(2);
            } catch (error) {
                const errorData = error.response?.data;
                const result = handleError(errorData);

                if (result && !result.handled) {
                    switch (result.code) {
                        case "ACCOUNT_DISABLED":
                            openDisabledAccountModal();
                            navigate("/", { replace: true });
                            break;
                        default:
                            addHelperError({
                                id: Date.now(),
                                code: I18N_KEYS.GLOBAL_ERROR.ERROR_unknownError,
                            })
                            break;
                    }
                }
            } finally {
                setIsVerifyingInformation(false);
            }
        };
    };

    //Hàm ni là reset lại mấy lựa chọn bảo vệ về mức ổn định
    const resetProtectionSettingsToDefault = () => {
        setApplyToAll(true);
        setGlobalProtectionSettings(DEFAULT_PROTECTION_SETTINGS);
        setImageProtectionSettings({});
    };


    //Hàm ni là lấy lại kteo file từ backend với setting bảo vệ tương ứng
    const handleRefreshPreview = async () => {
        try {
            setIsPreviewLoading(true);

            //Cái setting ni là hn gồm có cái "value" là gồm 
            // noiseLevel (độ nhiễu), 
            // colorCoverage (độ phủ màu), 
            // noiseColorMode (màu nhiễu): "dynamic" hoặc "static", 
            // staticColor (màu của màu nhiễu tĩnh): "#mã hex màu", 
            // frameCount (số frame): 1/12/30/60, 
            // preset (mẫu có sẵn, nếu tự chỉnh thì hn là "custom", ni thành k càn qtam mô)

            /*
            * TODO:
            * const response = await api.refreshProtectionPreview({
            *     file: selectedFile?.file,
            *     settings: currentProtectionSettings,
            * });
            *
            * Nếu backend trả video:
            * setPreviewVideoUrl(response.data.previewVideoUrl);
            * setPreviewImageUrl("");
            *
            * Nếu backend trả ảnh: (Ri cho có thôi chơ không có vụ trả ảnh mô hế, hiển thị bn làm full 100% video)
            * setPreviewImageUrl(response.data.previewImageUrl);
            * setPreviewVideoUrl("");
            */

        } catch (error) {
            const errorData = error.response?.data;
            const result = handleError(errorData);

            if (result && !result.handled) {
                switch (result.code) {
                    //Ni bn k bt có lỗi chi luôn, để đại cái lỗi lạ đc hế, để cho hn dễ cho Thành, cứ lỗi chi thì thành thả lỗi dưới ni r bn reset hn về mặc định cho
                    case "PROTECTION_WEIRD_PROP":
                        resetProtectionSettingsToDefault();
                        setGlobalModal?.({
                            isOpen: true,
                            type: "one-button",
                            title: I18N_KEYS.POST_CREATE.HANDLE.REFRESH_PREVIEW.postCreate_handleRefreshPreview_modalTitle_error_protectionWeirdProp,
                            description: I18N_KEYS.POST_CREATE.HANDLE.REFRESH_PREVIEW.postCreate_handleRefreshPreview_modalDesc_error_protectionWeirdProp,
                            primaryBtnText: I18N_KEYS.POST_CREATE.HANDLE.REFRESH_PREVIEW.postCreate_handleRefreshPreview_modalButton_error_protectionWeirdProp,
                            onPrimaryAction: () => {
                                setGlobalModal?.({ isOpen: false });
                            },
                        });
                        break;
                    default:
                        addHelperError({
                            id: Date.now(),
                            code: I18N_KEYS.GLOBAL_ERROR.ERROR_unknownError,
                        })
                        break;
                }
            }
        } finally {
            setIsPreviewLoading(false);
        }
    };


    const normalizeProtectionSettings = (settings = DEFAULT_PROTECTION_SETTINGS) => {
        const noiseColorMode =
            settings.noiseColorMode === "static" ? "static" : "dynamic";

        return {
            noiseLevel: Number(settings.noiseLevel ?? 20),
            colorCoverage: Number(settings.colorCoverage ?? 5),
            noiseColorMode,
            staticColor: /^#[0-9a-fA-F]{6}$/.test(settings.staticColor || "")
                ? settings.staticColor
                : "#888888",
            frameCount: Number(settings.frameCount ?? 12),
            preset: settings.preset || "custom",
        };
    };
    //Hàm kiểm tra lựa chọn bảo vệ tranh ở step 2
    const handleVerifyProtectionChoices = async () => {
        setIsCreatingPost(true);
        //TODO: Ở bước này là bước cuối cùng trước khi tạo post, nên sẽ kiểm tra tất cả một lần nữa từ đầu đến cuối, nếu có lỗi gì sẽ trả về hết, không cần phải chọt từng cái như ở step 1 nữa, mà chỉ cần hiện lỗi rồi cho người dùng tự chỉnh sửa, sau đó mới cho họ bấm tạo post, chứ đừng có chọt lung tung như ở step 1 nhé, vì bước này là bước cuối cùng rồi, nếu có lỗi thì cũng chỉ có thể là lỗi do người dùng chọn lựa bảo vệ không hợp lý thôi, nên cứ check đại hết một lượt đi rồi báo lỗi một lần cho người dùng chỉnh sửa nhé, đỡ phải chọt lung tung nhiều lần
        //Chừ kiểm tra lại cái ở step 1 lỡ có chi đổi này
        const results = await Promise.all([
            handleVerifyTieuDePostCreate(),
            handleVerifyMoTaPostCreate(),
            handleVerifyLstGanThePostCreate(),
            handleVerifyLstFilesPostCreate(),
            handleVerifySanPhamAIPostCreate(),
            handleVerifyHanCheHienThiPostCreate(),
        ]);
        const isAllValid = results.every(result => result === true);
        if (!isAllValid) {
            setIsCreatingPost(false);
            setCurrentStep(1);
            return;
        }
        else { //Ni là cái form ok rồi
            try {

                //Ni bn tách mỗi lựa chọn bảo vệ ứng đúng với file chơ k phụ thuộc vô chắc "thứ tự"
                const protectionPayload = files.map((item) => {
                    const rawSettings = applyToAll
                        ? globalProtectionSettings
                        : imageProtectionSettings[item.id] || DEFAULT_PROTECTION_SETTINGS;

                    return {
                        fileId: item.id,
                        fileName: item.file.name,
                        settings: normalizeProtectionSettings(rawSettings),
                    };
                });

                const requestPayload = {
                    tieuDe: postForm.title,
                    moTa: postForm.description,
                    lstGanThe: postForm.tags,
                    sanPhamAI: postForm.isAIGenerated,
                    hanCheHienThi: Number(postForm.visibility),
                    dynamicWM: postForm.dynamicWatermark,
                    choPhepComment: postForm.allowComment,
                    congKhai: postForm.isPublic,

                    applyToAll,
                    globalProtectionSettings: normalizeProtectionSettings(globalProtectionSettings),
                    protectionPayload,
                };

                const formData = new FormData();

                formData.append("request", JSON.stringify(requestPayload));

                files.forEach((item) => {
                    formData.append("images", item.file);
                });

                const response = await postApi.createPost(formData);

                const createdPostID = response.data?.result;

                addHelperError({
                    id: Date.now(),
                    code: I18N_KEYS.POST_CREATE.HANDLE.VERIFY_PROTECTION_CHOICES.postCreate_handleVerifyProtectionChoices_helper_success_createPost,
                });

                navigate(`/post/${createdPostID}`);
            } catch (error) {
                const errorData = error.response?.data;
                const result = handleError(errorData);

                if (result && !result.handled) {
                    switch (result.code) {
                        case "ACCOUNT_DISABLED":
                            openDisabledAccountModal();
                            navigate("/", { replace: true });
                            break;
                        case "PROTECTION_WEIRD_PROP":
                            resetProtectionSettingsToDefault();
                            setGlobalModal?.({
                                isOpen: true,
                                type: "one-button",
                                title: I18N_KEYS.POST_CREATE.HANDLE.VERIFY_PROTECTION_CHOICES.postCreate_handleVerifyProtectionChoices_modalTitle_error_protectionWeirdProp,
                                description: I18N_KEYS.POST_CREATE.HANDLE.VERIFY_PROTECTION_CHOICES.postCreate_handleVerifyProtectionChoices_modalDesc_error_protectionWeirdProp,
                                primaryBtnText: I18N_KEYS.POST_CREATE.HANDLE.VERIFY_PROTECTION_CHOICES.postCreate_handleVerifyProtectionChoices_modalButton_error_protectionWeirdProp,
                                onPrimaryAction: () => {
                                    setGlobalModal?.({ isOpen: false });
                                },
                            });
                            break;
                        default:
                            addHelperError({
                                id: Date.now(),
                                code: I18N_KEYS.GLOBAL_ERROR.ERROR_unknownError,
                            })
                            break;
                    }
                }
            } finally {
                setIsCreatingPost(false);
            }
        }
    };



    //----------------------Lại là hàm linh tinh-----------------------
    const handleNext = () => {
        if (currentStep === 1) {
            handleVerifyInformation();
            return;
        }

        handleVerifyProtectionChoices();
    };

    const handleBack = () => {
        if (currentStep === 2) {
            setCurrentStep(1);
        }
    };

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
    //----------------------HẾT lại là hàm linh tinh-----------------------
















    if (loading || !isAuthenticated || user?.daVoHieuHoa === true) {
        return null;
    }
    return (
        <PageContainer setHelperFocusState={setHelperFocusState}>
            <SectionContainer
                title={I18N_KEYS.POST_CREATE.COMMON.postCreate_sectionContainerTitle}
                description={I18N_KEYS.POST_CREATE.COMMON.postCreate_sectionContainerDesc}
            >
                <StepIndicator currentStep={currentStep} />

                <AnimatePresence mode="wait">
                    {currentStep === 1 && (
                        <motion.div
                            key="post-create-step-1"
                            variants={stepVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            transition={{ duration: 0.28, ease: "easeInOut" }}
                            className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]"
                        >
                            <PostFileUploader
                                files={files}
                                setFiles={setFiles}
                                onProcessingChange={setIsFileProcessing}
                                errorType={fieldErrors.files}
                                errorEmpty={I18N_KEYS.POST_CREATE.HANDLE.VERIFY_INFORMATION.postCreate_handleVerifyInformation_helper_error_fileNull}
                                errorTypeFile={I18N_KEYS.POST_CREATE.HANDLE.VERIFY_INFORMATION.postCreate_handleVerifyInformation_helper_error_fileWrongType}
                                errorRangeOverflow={I18N_KEYS.POST_CREATE.HANDLE.VERIFY_INFORMATION.postCreate_handleVerifyInformation_helper_error_fileRangeOverflow}
                                errorTooMany={I18N_KEYS.POST_CREATE.HANDLE.VERIFY_INFORMATION.postCreate_handleVerifyInformation_helper_error_fileTooMany}
                                errorTotalRangeOverflow={I18N_KEYS.POST_CREATE.HANDLE.VERIFY_INFORMATION.postCreate_handleVerifyInformation_helper_error_fileTotalRangeOverflow}
                                onClearError={() => clearFieldError("files")}
                            />

                            <div className="space-y-6">
                                <Input
                                    id="post-title"
                                    label={I18N_KEYS.POST_CREATE.COMMON.postCreate_formLabel_tieuDe}
                                    optional
                                    maxLength={50}
                                    value={postForm.title}
                                    onChange={(e) => updatePostForm({ title: e.target.value })}
                                    placeholder={I18N_KEYS.POST_CREATE.COMMON.postCreate_formPlaceholder_tieuDe}
                                    triggerMascotMood={triggerMascotMood}
                                />

                                <TextAreaInput
                                    id="post-description"
                                    label={I18N_KEYS.POST_CREATE.COMMON.postCreate_formLabel_moTa}
                                    optional
                                    maxLength={255}
                                    value={postForm.description}
                                    onChange={(e) => updatePostForm({ description: e.target.value })}
                                    placeholder={I18N_KEYS.POST_CREATE.COMMON.postCreate_formPlaceholder_moTa}
                                    triggerMascotMood={triggerMascotMood}
                                />

                                <div className="h-2" />

                                <TagInput
                                    tags={postForm.tags}
                                    setTags={(nextTags) => {
                                        if (typeof nextTags === "function") {
                                            updatePostForm({
                                                tags: nextTags(postForm.tags),
                                            });
                                        } else {
                                            updatePostForm({ tags: nextTags });
                                        }
                                    }}
                                    errorType={fieldErrors.tags}
                                    errorEmpty={I18N_KEYS.POST_CREATE.HANDLE.VERIFY_INFORMATION.postCreate_handleVerifyInformation_helper_error_tagNull}
                                    errorRangeOverflow={I18N_KEYS.POST_CREATE.HANDLE.VERIFY_INFORMATION.postCreate_handleVerifyInformation_helper_error_tagRangeOverflow}
                                    errorTooLong={I18N_KEYS.POST_CREATE.HANDLE.VERIFY_INFORMATION.postCreate_handleVerifyInformation_helper_error_tagTooLong}
                                    onClearError={() => clearFieldError("tags")}
                                    triggerMascotMood={triggerMascotMood}
                                />

                                <RadioGroupField
                                    label={I18N_KEYS.POST_CREATE.COMMON.postCreate_formLabel_hanCheHienThi}
                                    value={postForm.visibility}
                                    moreInfo={I18N_KEYS.POST_CREATE.COMMON.postCreate_formMoreInfo_hanCheHienThi}
                                    addHelperError={addHelperError}
                                    errorType={fieldErrors.visibility}
                                    errorEmpty={I18N_KEYS.POST_CREATE.HANDLE.VERIFY_INFORMATION.postCreate_handleVerifyInformation_helper_error_hanCheHienThiNull}
                                    onClearError={() => clearFieldError("visibility")}
                                    onChange={(visibility) => updatePostForm({ visibility })}
                                    options={[
                                        {
                                            label: I18N_KEYS.POST_CREATE.COMMON.postCreate_formRadioLabel_hanCheHienThi_all,
                                            value: "0",
                                        },
                                        {
                                            label: I18N_KEYS.POST_CREATE.COMMON.postCreate_formRadioLabel_hanCheHienThi_r18,
                                            value: "1",
                                        },
                                        {
                                            label: I18N_KEYS.POST_CREATE.COMMON.postCreate_formRadioLabel_hanCheHienThi_r18g,
                                            value: "2",
                                        },
                                    ]}
                                />

                                <RadioGroupField
                                    label={I18N_KEYS.POST_CREATE.COMMON.postCreate_formLabel_dynamicWM}
                                    value={postForm.dynamicWatermark ? "yes" : "no"}
                                    moreInfo={I18N_KEYS.POST_CREATE.COMMON.postCreate_formMoreInfo_dynamicWM}
                                    addHelperError={addHelperError}
                                    onChange={(value) =>
                                        updatePostForm({ dynamicWatermark: value === "yes" })
                                    }
                                    options={[
                                        { label: I18N_KEYS.POST_CREATE.COMMON.postCreate_formRadioLabel_dynamicWM_yes, value: "yes" },
                                        { label: I18N_KEYS.POST_CREATE.COMMON.postCreate_formRadioLabel_dynamicWM_no, value: "no" },
                                    ]}
                                />

                                <RadioGroupField
                                    label={I18N_KEYS.POST_CREATE.COMMON.postCreate_formLabel_sanPhamAI}
                                    value={postForm.isAIGenerated ? "yes" : "no"}
                                    moreInfo={I18N_KEYS.POST_CREATE.COMMON.postCreate_formMoreInfo_sanPhamAI}
                                    addHelperError={addHelperError}
                                    errorType={fieldErrors.isAIGenerated}
                                    errorEmpty={I18N_KEYS.POST_CREATE.HANDLE.VERIFY_INFORMATION.postCreate_handleVerifyInformation_helper_error_sanPhamAINull}
                                    onClearError={() => clearFieldError("isAIGenerated")}
                                    onChange={(value) =>
                                        updatePostForm({ isAIGenerated: value === "yes" })
                                    }
                                    options={[
                                        { label: I18N_KEYS.POST_CREATE.COMMON.postCreate_formRadioLabel_sanPhamAI_yes, value: "yes" },
                                        { label: I18N_KEYS.POST_CREATE.COMMON.postCreate_formRadioLabel_sanPhamAI_no, value: "no" },
                                    ]}
                                />

                                <RadioGroupField
                                    label={I18N_KEYS.POST_CREATE.COMMON.postCreate_formLabel_choPhepComment}
                                    value={postForm.allowComment ? "yes" : "no"}
                                    onChange={(value) =>
                                        updatePostForm({ allowComment: value === "yes" })
                                    }
                                    options={[
                                        { label: I18N_KEYS.POST_CREATE.COMMON.postCreate_formRadioLabel_choPhepComment_yes, value: "yes" },
                                        { label: I18N_KEYS.POST_CREATE.COMMON.postCreate_formRadioLabel_choPhepComment_no, value: "no" },
                                    ]}
                                />

                                <RadioGroupField
                                    label={I18N_KEYS.POST_CREATE.COMMON.postCreate_formLabel_congKhai}
                                    value={postForm.isPublic ? "yes" : "no"}
                                    onChange={(value) =>
                                        updatePostForm({ isPublic: value === "yes" })
                                    }
                                    options={[
                                        { label: I18N_KEYS.POST_CREATE.COMMON.postCreate_formRadioLabel_congKhai_yes, value: "yes" },
                                        { label: I18N_KEYS.POST_CREATE.COMMON.postCreate_formRadioLabel_congKhai_no, value: "no" },
                                    ]}
                                />

                                <PostCreateNotice>
                                    {t(I18N_KEYS.POST_CREATE.COMMON.postCreate_notice_step1)}
                                </PostCreateNotice>
                            </div>
                        </motion.div>
                    )}

                    {currentStep === 2 && (
                        <motion.div
                            key="post-create-step-2"
                            variants={stepVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            transition={{ duration: 0.28, ease: "easeInOut" }}
                            className="space-y-7"
                        >
                            <ProtectionImageStrip
                                files={files}
                                selectedIndex={selectedImageIndex}
                                onSelect={setSelectedImageIndex}
                            />

                            <div className="flex justify-end">
                                <ToggleField
                                    label={I18N_KEYS.POST_CREATE.COMMON.postCreate_toggleFieldLabel_applyToAll}
                                    checked={applyToAll}
                                    onChange={handleApplyToAllChange}
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-7 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
                                <ProtectionControls
                                    value={currentProtectionSettings}
                                    onChange={updateProtectionSettings}
                                    onRefreshPreview={handleRefreshPreview}
                                    isPreviewLoading={isPreviewLoading}
                                />

                                <ProtectionPreviewCanvas
                                    selectedFile={selectedFile}
                                    previewImageUrl={previewImageUrl}
                                    previewVideoUrl={previewVideoUrl}
                                    isLoading={isPreviewLoading}
                                    dynamicWM={postForm.dynamicWatermark}
                                    watermarkText={`@${user?.username || "preview"} · EyesOnly`}
                                />
                            </div>

                            <p className="rounded-full bg-bg-shade-50 px-5 py-3 text-center font-body text-sm text-text-shade-300">
                                {t(I18N_KEYS.POST_CREATE.COMMON.postCreate_notice_step2)}
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>

                <StepNavigation
                    currentStep={currentStep}
                    onBack={handleBack}
                    onNext={handleNext}
                    isLoading={isVerifyingInformation || isCreatingPost}
                    isNextDisabled={
                        currentStep === 1 &&
                        (isFileProcessing || isVerifyingInformation)
                    }
                />
            </SectionContainer>
        </PageContainer>
    );
}
