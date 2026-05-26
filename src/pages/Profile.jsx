import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa6";
import { CiCircleCheck, CiCircleMore } from "react-icons/ci";

import { useAuth } from "../context/AuthContext";
import { useErrorHandler } from "../hooks/useErrorHandler";
import { useTranslation } from "react-i18next";
import { I18N_KEYS } from "../i18n/key";

import PageContainer from "../components/PageContainer";
import SectionContainer from "../components/SectionContainer";
import AvatarGradientPanel from "../components/AvatarGradientPanel";
import ProfileTabNavigation from "../components/ProfileTabNavigation";
import ProfileAvatarPicker from "../components/ProfileAvatarPicker";
import PostAuthorCard from "../components/PostAuthorCard";
import Input from "../components/Input";
import TextAreaInput from "../components/TextAreaInput";
import Button from "../components/Button";

import { MOCK_USER_DATA_1 } from "../data/User/mockUser1";
import { MOCK_USER_DATA_2 } from "../data/User/mockUser2";
import { MOCK_USER_DATA_3 } from "../data/User/mockUser3";

const VALID_TABS = ["edit", "password", "disabled", "blocking"];
const DEFAULT_TAB = "edit";

const TAB_PANEL_SLIDE_DISTANCE = 26;
const TAB_PANEL_SHADOW_SPACE = 10

const getInactivePanelX = (tab, activeTab) => {
    return getTabIndex(tab) < getTabIndex(activeTab)
        ? -TAB_PANEL_SLIDE_DISTANCE
        : TAB_PANEL_SLIDE_DISTANCE;
};

const DEFAULT_AVATAR_COUNT = 5;
const NAME_CHANGE_COOLDOWN_DAYS = 7;
const ACCOUNT_DELETE_DAYS = 30;
const BLOCKING_PAGE_SIZE = 5;
const OTP_RESEND_SECONDS = 60;
const MS_PER_DAY = 1000 * 60 * 60 * 24;

const MOCK_USERS = [
    MOCK_USER_DATA_1,
    MOCK_USER_DATA_2,
    MOCK_USER_DATA_3,
];

const getValidTab = (tab) => {
    return VALID_TABS.includes(tab) ? tab : DEFAULT_TAB;
};

const getTabIndex = (tab) => VALID_TABS.indexOf(tab);

const getAccountID = (account) => {
    return String(account?.accountID ?? account?.id ?? account?.userID ?? "");
};

const getDisplayName = (account) => {
    return account?.tenHienThi || account?.username || "Người dùng";
};

const getMockProfileByAuthUser = (authUser) => {
    const authUserID = getAccountID(authUser);

    const matchedMockUser =
        MOCK_USERS.find((mockUser) => getAccountID(mockUser) === authUserID) ||
        MOCK_USER_DATA_3;

    return {
        ...matchedMockUser,
        ...authUser,
    };
};

const getMockBlockedUsers = (currentAccount) => {
    const currentAccountID = getAccountID(currentAccount);

    return MOCK_USERS
        .filter((account) => getAccountID(account) !== currentAccountID)
        .map((account) => ({
            ...account,
            blockRelationshipID: `mock-block-${account.accountID}`,
            isBlocked: true,
        }));
};

const getDefaultAvatar = () => {
    const randomIndex = Math.floor(Math.random() * DEFAULT_AVATAR_COUNT) + 1;
    return `/defaultAvatar/default_avatar_${randomIndex}.svg`;
};

const normalizeBioInput = (value = "") => {
    return value
        .replace(/\r\n/g, "\n")
        .replace(/\n{2,}/g, "\n\n")
        .slice(0, 255);
};

const normalizeBioForSave = (value = "") => {
    return normalizeBioInput(value).trim();
};

const toProfileForm = (profile) => {
    return {
        displayName: profile?.tenHienThi || "",
        bio: profile?.tieuSu || "",
        avatar: profile?.avatar || "/defaultAvatar/default_avatar_1.svg",
    };
};

const getRemainingNameChangeDays = (lastChangedAt) => {
    if (!lastChangedAt) return 0;

    const lastChangedDate = new Date(lastChangedAt);

    if (Number.isNaN(lastChangedDate.getTime())) return 0;

    const passedMs = Math.max(0, Date.now() - lastChangedDate.getTime());
    const remainingMs = NAME_CHANGE_COOLDOWN_DAYS * MS_PER_DAY - passedMs;

    return Math.max(0, Math.ceil(remainingMs / MS_PER_DAY));
};

const getDisabledDays = (disabledAt) => {
    if (!disabledAt) return 0;

    const disabledDate = new Date(disabledAt);

    if (Number.isNaN(disabledDate.getTime())) return 0;

    return Math.max(0, Math.floor((Date.now() - disabledDate.getTime()) / MS_PER_DAY));
};

const getPaginationItems = (currentPage, totalPages) => {
    if (totalPages <= 1) return [];

    const pageSet = new Set();

    for (let page = 1; page <= Math.min(3, totalPages); page++) {
        pageSet.add(page);
    }

    for (let page = Math.max(totalPages - 2, 1); page <= totalPages; page++) {
        pageSet.add(page);
    }

    for (
        let page = Math.max(currentPage - 2, 1);
        page <= Math.min(currentPage + 2, totalPages);
        page++
    ) {
        pageSet.add(page);
    }

    const sortedPages = [...pageSet].sort((a, b) => a - b);
    const items = [];

    sortedPages.forEach((page, index) => {
        const previousPage = sortedPages[index - 1];

        if (index > 0 && page - previousPage > 1) {
            items.push(`ellipsis-${previousPage}-${page}`);
        }

        items.push(page);
    });

    return items;
};

function BlockingPagination({
    currentPage,
    totalPages,
    onPageChange,
}) {
    const paginationItems = useMemo(
        () => getPaginationItems(currentPage, totalPages),
        [currentPage, totalPages]
    );

    if (totalPages <= 1) return null;

    return (
        <div className="mt-6 flex w-full items-center justify-center">
            <div className="flex max-w-full items-center justify-center gap-1.5 overflow-x-auto px-2 py-1 sm:gap-3">
                {currentPage > 1 && (
                    <Button
                        type="button"
                        variant="primary"
                        onClick={() => onPageChange(currentPage - 1)}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-primary-600 sm:h-10 sm:w-10"
                    >
                        <FaChevronLeft size={15} />
                    </Button>
                )}

                <div className="flex items-center justify-center gap-1.5 sm:gap-3">
                    {paginationItems.map((item) => {
                        if (typeof item === "string") {
                            return (
                                <div
                                    key={item}
                                    className="flex h-8 min-w-5 shrink-0 items-center justify-center text-xs text-text-shade-400 sm:h-10 sm:min-w-8 sm:text-sm"
                                >
                                    ...
                                </div>
                            );
                        }

                        const isActive = item === currentPage;

                        return (
                            <Button
                                key={item}
                                type="button"
                                variant={isActive ? "primary" : "outline"}
                                onClick={() => onPageChange(item)}
                                className={`
                                    flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs
                                    sm:h-10 sm:w-10 sm:text-sm
                                    ${isActive ? "border border-primary-600" : ""}
                                `}
                            >
                                {item}
                            </Button>
                        );
                    })}
                </div>

                {currentPage < totalPages && (
                    <Button
                        type="button"
                        variant="primary"
                        onClick={() => onPageChange(currentPage + 1)}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-primary-600 sm:h-10 sm:w-10"
                    >
                        <FaChevronRight size={15} />
                    </Button>
                )}
            </div>
        </div>
    );
}









export default function Profile({
    setGlobalModal,
    addHelperError,
    setHelperFocusState,
    triggerMascotMood,
}) {

    const { t, i18n } = useTranslation();

    const navigate = useNavigate();
    const location = useLocation();

    const { user, login, logout, isAuthenticated, loading } = useAuth();
    const { handleError } = useErrorHandler(setGlobalModal, addHelperError);

    const searchParams = new URLSearchParams(location.search);
    const tabFromUrl = getValidTab(searchParams.get("tab"));

    const [activeTab, setActiveTab] = useState(tabFromUrl);
    const [tabDirection, setTabDirection] = useState(0);
    const fetchedProfileAccountIDRef = useRef(null);

    const tabPanelRefs = useRef({});
    const [activePanelHeight, setActivePanelHeight] = useState(null);

    const [profileData, setProfileData] = useState(null);
    const [profileForm, setProfileForm] = useState(toProfileForm(null));
    const [initialProfileForm, setInitialProfileForm] = useState(toProfileForm(null));
    const [avatarFile, setAvatarFile] = useState(null);

    const [passwordForm, setPasswordForm] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });
    const [passwordOtp, setPasswordOtp] = useState("");
    const [changePasswordOtpCooldown, setChangePasswordOtpCooldown] = useState(0);

    const [blockedUsers, setBlockedUsers] = useState([]);
    const [blockedKeyword, setBlockedKeyword] = useState("");
    const [blockingPage, setBlockingPage] = useState(1);
    const [hasFetchedBlockedUsers, setHasFetchedBlockedUsers] = useState(false);

    const [isFetchingProfile, setIsFetchingProfile] = useState(true);
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [isFetchingBlockedUsers, setIsFetchingBlockedUsers] = useState(false);
    const [isTogglingDisable, setIsTogglingDisable] = useState(false);
    const [isTogglingBlock, setIsTogglingBlock] = useState(false);

    const [shouldNudgeSaveButton, setShouldNudgeSaveButton] = useState(false);

    const passwordFormRef = useRef(passwordForm);
    const passwordOtpRef = useRef(passwordOtp);
    const changePasswordOtpCooldownRef = useRef(changePasswordOtpCooldown);


    const measureActivePanelHeight = useCallback(() => {
        const activePanelElement = tabPanelRefs.current[activeTab];

        if (!activePanelElement) return;

        const nextHeight = activePanelElement.offsetHeight;

        if (nextHeight > 0) {
            setActivePanelHeight(nextHeight);
        }
    }, [activeTab]);

    useLayoutEffect(() => {
        measureActivePanelHeight();

        const activePanelElement = tabPanelRefs.current[activeTab];

        if (!activePanelElement || typeof ResizeObserver === "undefined") return;

        const resizeObserver = new ResizeObserver(() => {
            measureActivePanelHeight();
        });

        resizeObserver.observe(activePanelElement);

        return () => {
            resizeObserver.disconnect();
        };
    }, [activeTab, measureActivePanelHeight]);

    const nameChangeRemainingDays = useMemo(
        () => getRemainingNameChangeDays(profileData?.ngayDoiTenGanNhat),
        [profileData?.ngayDoiTenGanNhat]
    );

    const isDisplayNameLocked = nameChangeRemainingDays > 0;

    const isProfileDirty = useMemo(() => {
        return (
            profileForm.displayName !== initialProfileForm.displayName ||
            profileForm.bio !== initialProfileForm.bio ||
            profileForm.avatar !== initialProfileForm.avatar
        );
    }, [profileForm, initialProfileForm]);

    const disabledDays = useMemo(
        () => getDisabledDays(profileData?.ngayVoHieuHoa),
        [profileData?.ngayVoHieuHoa]
    );

    const disabledRemainingDays = Math.max(0, ACCOUNT_DELETE_DAYS - disabledDays);
    const isAccountDisabled = Boolean(profileData?.daVoHieuHoa);

    const filteredBlockedUsers = useMemo(() => {
        const keyword = blockedKeyword.trim().toLowerCase();

        if (!keyword) return blockedUsers;

        return blockedUsers.filter((account) => {
            const displayName = getDisplayName(account).toLowerCase();
            const username = account?.username?.toLowerCase() || "";

            return displayName.includes(keyword) || username.includes(keyword);
        });
    }, [blockedUsers, blockedKeyword]);

    const totalBlockingPages = Math.max(
        1,
        Math.ceil(filteredBlockedUsers.length / BLOCKING_PAGE_SIZE)
    );

    const paginatedBlockedUsers = useMemo(() => {
        const startIndex = (blockingPage - 1) * BLOCKING_PAGE_SIZE;
        return filteredBlockedUsers.slice(startIndex, startIndex + BLOCKING_PAGE_SIZE);
    }, [filteredBlockedUsers, blockingPage]);

    const getChangePasswordResendText = useCallback(
        (seconds = changePasswordOtpCooldown) => {
            return seconds > 0 ? [I18N_KEYS.PROFILE.HANDLE.CHANGE_PASSWORD.profile_handleChangePassword_modalButton_resendOTPWithTimer, {seconds: seconds}] 
            : I18N_KEYS.PROFILE.HANDLE.CHANGE_PASSWORD.profile_handleChangePassword_modalButton_resendOTP;
        },
        [changePasswordOtpCooldown]
    );

    const closeGlobalModal = useCallback(() => {
        setGlobalModal?.((prev) => ({
            ...(prev || {}),
            isOpen: false,
        }));
    }, [setGlobalModal]);

    const addMascotMessage = useCallback(
        (message) => {
            addHelperError?.({
                id: Date.now(),
                code: message,
            });
        },
        [addHelperError]
    );

    const triggerUnsavedReminder = useCallback(() => {
        addMascotMessage(I18N_KEYS.PROFILE.HANDLE.EDIT_PROFILE.profile_handleEditProfile_helper_error_remindSave);

        setShouldNudgeSaveButton(false);

        window.requestAnimationFrame(() => {
            setShouldNudgeSaveButton(true);
        });

        window.setTimeout(() => {
            setShouldNudgeSaveButton(false);
        }, 1200);
    }, [addMascotMessage]);

    const startChangePasswordOtpCooldown = useCallback(() => {
        changePasswordOtpCooldownRef.current = OTP_RESEND_SECONDS;
        setChangePasswordOtpCooldown(OTP_RESEND_SECONDS);
    }, []);









    //-------------------Phần backend cần quan tâm---------------------
    const handleFetchProfile = useCallback(async (currentUser) => { // Hàm lấy thông tin profile của người dùng đang đăng nhập
        try {
            setIsFetchingProfile(true);

            // TODO: Thay bằng api.getMyProfile()
            // const response = await api.getMyProfile();
            // const nextProfile = response.result;

            const nextProfile = getMockProfileByAuthUser(currentUser); // Ni bn đang lấy dữ liệu giả, thành đó vứt đi
            const nextForm = toProfileForm(nextProfile);

            setProfileData(nextProfile);
            setProfileForm(nextForm);
            setInitialProfileForm(nextForm);
            setAvatarFile(null);
        } catch (error) {
            const errorData = error.response?.data;
            const result = handleError(errorData);

            if (result && !result.handled) {
                switch (result.code) {
                    // Kịch bản chưa đăng nhập thì trả 401 rồi hế
                    default:
                        addHelperError?.({
                            id: Date.now(),
                            code: I18N_KEYS.GLOBAL_ERROR.ERROR_unknownError,
                        });
                        break;
                }
            }
        } finally {
            setIsFetchingProfile(false);
        }
    }, [addHelperError, handleError]);

    const handleUpdateProfile = useCallback(async () => { // Hàm cập nhật thông tin account
        try {
            setIsSavingProfile(true);

            const nextDisplayName = isDisplayNameLocked
                ? profileData?.tenHienThi || profileData?.username || ""
                : profileForm.displayName.trim() || profileData?.username || "";

            const nextBio = normalizeBioForSave(profileForm.bio);

            // TODO: Thay bằng api.updateProfile()
            // Nếu có avatarFile thì backend nên nhận FormData:
            // formData.append("tenHienThi", nextDisplayName);
            // formData.append("tieuSu", nextBio);
            // if (avatarFile) formData.append("avatar", avatarFile);
            // const response = await api.updateProfile(formData);
            // const updatedProfile = response.result;

            const didChangeDisplayName =
                nextDisplayName !== (profileData?.tenHienThi || "");

            const updatedProfile = {
                ...profileData,
                tenHienThi: nextDisplayName,
                tieuSu: nextBio,
                avatar: profileForm.avatar,
                ngayDoiTenGanNhat: didChangeDisplayName
                    ? new Date().toISOString()
                    : profileData?.ngayDoiTenGanNhat,
            };

            const nextForm = toProfileForm(updatedProfile);

            setProfileData(updatedProfile);
            setProfileForm(nextForm);
            setInitialProfileForm(nextForm);
            setAvatarFile(null);

            login(updatedProfile);

            addMascotMessage(I18N_KEYS.PROFILE.HANDLE.EDIT_PROFILE.profile_handleEditProfile_helper_success_saved);
        } catch (error) {
            const errorData = error.response?.data;
            const result = handleError(errorData);

            if (result && !result.handled) {
                switch (result.code) {
                    // Kịch bản tên dài quá 30 ký tự
                    case "TENHIENTHI_TOO_LONG":
                        addHelperError?.({
                            id: Date.now(),
                            code: I18N_KEYS.PROFILE.HANDLE.EDIT_PROFILE.profile_handleEditProfile_helper_error_tenHienThiTooLong,
                        });
                        break;
                    // Kịch bản tên mới đổi đó mà chừ đòi đổi lại
                    case "TENHIENTHI_CHANGED_RECENTLY":
                        addHelperError?.({
                            id: Date.now(),
                            code: I18N_KEYS.PROFILE.HANDLE.EDIT_PROFILE.profile_handleEditProfile_helper_error_tenHienThiChangedRecently,
                        });
                        break;
                    // Kịch bản tiểu sử dài quá 255 ký tự
                    case "TIEUSU_TOO_LONG":
                        addHelperError?.({
                            id: Date.now(),
                            code: I18N_KEYS.PROFILE.HANDLE.EDIT_PROFILE.profile_handleEditProfile_helper_error_tieuSuTooLong,
                        });
                        break;
                    // Kịch bản avatar kph file ảnh
                    case "AVATAR_WRONG_TYPE":
                        addHelperError?.({
                            id: Date.now(),
                            code: I18N_KEYS.PROFILE.HANDLE.EDIT_PROFILE.profile_handleEditProfile_helper_error_typeMismatchAvatar,
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
            setIsSavingProfile(false);
        }
    }, [
        addMascotMessage,
        avatarFile,
        addHelperError, 
        handleError,
        isDisplayNameLocked,
        login,
        profileData,
        profileForm,
    ]);

    const handleChangePassword = useCallback(async () => { // Hàm đổi mk
        try {
            // TODO: Thay bằng api.requestChangePassword()
            // await api.requestChangePassword({
            //     currentPassword: passwordFormRef.current.currentPassword,
            //     newPassword: passwordFormRef.current.newPassword,
            //     confirmPassword: passwordFormRef.current.confirmPassword,
            // });
            // Thành nhớ là cái request bn gửi ni k đi kèm việc gửi otp hế. Ktra xong bn có gọi lại hàm gửi otp sau nơi ơ

            return true;
        } catch (error) {
            const errorData = error.response?.data;
            const result = handleError(errorData);

            if (result && !result.handled) {
                switch (result.code) {
                    // Kịch bản mk cũ null
                    case "CURRENTPASSWORD_NULL":
                        addHelperError?.({
                            id: Date.now(),
                            code: I18N_KEYS.PROFILE.HANDLE.CHANGE_PASSWORD.profile_handleChangePassword_helper_error_nullCurrentPassword,
                        });
                        break;
                    // Kịch bản mk cũ sai
                    case "CURRENTPASSWORD_WRONG":
                        addHelperError?.({
                            id: Date.now(),
                            code: I18N_KEYS.PROFILE.HANDLE.CHANGE_PASSWORD.profile_handleChangePassword_helper_error_wrongCurrentPassword,
                        });
                        break;
                    // Kịch bản mk mới null
                    case "NEWPASSWORD_NULL":
                        addHelperError?.({
                            id: Date.now(),
                            code: I18N_KEYS.PROFILE.HANDLE.CHANGE_PASSWORD.profile_handleChangePassword_helper_error_nullNewPassword,
                        });
                        break;
                    // Kịch bản mk mới dưới 6 ký tự
                    case "NEWPASSWORD_TOO_SHORT":
                        addHelperError?.({
                            id: Date.now(),
                            code: I18N_KEYS.PROFILE.HANDLE.CHANGE_PASSWORD.profile_handleChangePassword_helper_error_newPasswordTooShort,
                        });
                        break;
                    // Kịch bản mk mới trên 32 ký tự
                    case "NEWPASSWORD_TOO_LONG":
                        addHelperError?.({
                            id: Date.now(),
                            code: I18N_KEYS.PROFILE.HANDLE.CHANGE_PASSWORD.profile_handleChangePassword_helper_error_newPasswordTooLong,
                        });
                        break;
                    // Kịch bản mk nhập lại null
                    case "CONFIRMPASSWORD_NULL":
                        addHelperError?.({
                            id: Date.now(),
                            code: I18N_KEYS.PROFILE.HANDLE.CHANGE_PASSWORD.profile_handleChangePassword_helper_error_nullConfirmPassword,
                        });
                        break;
                    // Kịch bản mk nhập lại k giống mk mới
                    case "CONFIRMPASSWORD_MISMATCH":
                        addHelperError?.({
                            id: Date.now(),
                            code: I18N_KEYS.PROFILE.HANDLE.CHANGE_PASSWORD.profile_handleChangePassword_helper_error_wrongConfirmPassword,
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
            return false;
        }
    }, [addHelperError, handleError]);

    const handleResendChangePasswordOtp = useCallback(async () => { // Hàm gửi OTP để đổi mk
        try {
            // TODO: Thay bằng api.resendChangePasswordOtp()
            // await api.resendChangePasswordOtp();

            addMascotMessage(I18N_KEYS.PROFILE.HANDLE.CHANGE_PASSWORD.profile_handleChangePassword_helper_success_resendOTP);
            return true;
        } catch (error) {
            const errorData = error.response?.data;
            const result = handleError(errorData);

            if (result && !result.handled) {
                switch (result.code) {
                    // Kịch bản otp chưa hết hạn mà đòi gửi lại
                    case "OTP_NOT_EXPIRED":
                        addHelperError?.({
                            id: Date.now(),
                            code: I18N_KEYS.PROFILE.HANDLE.CHANGE_PASSWORD.profile_handleChangePassword_helper_error_otpNotExpired,
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
            return false;
        }
    }, [addMascotMessage, addHelperError, handleError]);

    const handleVerifyChangePasswordOtp = useCallback(async () => { // Hàm xác nhận otp đổi mk
        try {
            const otp = passwordOtpRef.current.trim();

            if (!otp) {
                addMascotMessage(I18N_KEYS.PROFILE.HANDLE.CHANGE_PASSWORD.profile_handleChangePassword_helper_error_nullOTP);
                return;
            }

            // TODO: Thay bằng api.verifyChangePasswordOtp()
            // await api.verifyChangePasswordOtp({ otp });

            setGlobalModal?.({
                isOpen: true,
                type: "info",
                title: I18N_KEYS.PROFILE.HANDLE.CHANGE_PASSWORD.profile_handleChangePassword_modalTitle_changedPassword,
                description: I18N_KEYS.PROFILE.HANDLE.CHANGE_PASSWORD.profile_handleChangePassword_modalDesc_changedPassword,
            });

            logout();
            navigate("/login", { replace: true });
        } catch (error) {
            const errorData = error.response?.data;
            const result = handleError(errorData);

            if (result && !result.handled) {
                switch (result.code) {
                    // Kịch bản otp null
                    case "CHANGEPASSWORD_OTP_NULL":
                        addHelperError?.({
                            id: Date.now(),
                            code: I18N_KEYS.PROFILE.HANDLE.CHANGE_PASSWORD.profile_handleChangePassword_helper_error_nullOTP,
                        });
                        break;
                    // Kịch bản otp sai (hoặc hết hạn)
                    case "CHANGEPASSWORD_OTP_WRONG":
                        addHelperError?.({
                            id: Date.now(),
                            code: I18N_KEYS.PROFILE.HANDLE.CHANGE_PASSWORD.profile_handleChangePassword_helper_error_wrongOTP,
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
        }
    }, [
        addMascotMessage,
        addHelperError, 
        handleError,
        logout,
        navigate,
        setGlobalModal,
    ]);

    const handleToggleDisableAccount = useCallback(async () => { // Hàm bật/tắt vô hiệu hóa
        try {
            setIsTogglingDisable(true);

            const nextDisabledStatus = !profileData?.daVoHieuHoa;

            // TODO: Thay bằng api.toggleDisableAccount()
            // const response = await api.toggleDisableAccount({
            //     daVoHieuHoa: nextDisabledStatus,
            // });
            // const updatedProfile = response.result;

            const updatedProfile = {
                ...profileData,
                daVoHieuHoa: nextDisabledStatus,
                ngayVoHieuHoa: nextDisabledStatus
                    ? new Date().toISOString()
                    : profileData?.ngayVoHieuHoa,
            };

            setProfileData(updatedProfile);
            login(updatedProfile);

            addMascotMessage(
                nextDisabledStatus
                    ? I18N_KEYS.PROFILE.HANDLE.DEACTIVATE_ACCOUNT.profile_handleDeactivateAccount_helper_success_deactivated
                    : I18N_KEYS.PROFILE.HANDLE.DEACTIVATE_ACCOUNT.profile_handleDeactivateAccount_helper_success_activated
            );

            closeGlobalModal();
        } catch (error) {
            const errorData = error.response?.data;
            const result = handleError(errorData);

            if (result && !result.handled) {
                switch (result.code) {
                    // TODO: Backend có mã lỗi riêng thì thêm case ở đây.
                    default:
                        addHelperError?.({
                            id: Date.now(),
                            code: I18N_KEYS.GLOBAL_ERROR.ERROR_unknownError,
                        });
                        break;
                }
            }
        } finally {
            setIsTogglingDisable(false);
        }
    }, [
        addMascotMessage,
        closeGlobalModal,
        addHelperError, 
        handleError,
        login,
        profileData,
    ]);

    const handleFetchBlockedUsers = useCallback(async () => {  // Hàm lấy ds mấy đứa bị chặn (thành nhớ là 'bị user chặn' chơ kph là 'chặn th user' mô nghe)
        try {
            setIsFetchingBlockedUsers(true);

            // TODO: Thay bằng api.getBlockedUsers({ keyword, page, size })
            // Hiện tại dùng mock và lọc/phân trang ở FE cho dễ nhìn giao diện.
            const nextBlockedUsers = getMockBlockedUsers(profileData || user);

            setBlockedUsers(nextBlockedUsers);
            setHasFetchedBlockedUsers(true);
        } catch (error) {
            const errorData = error.response?.data;
            const result = handleError(errorData);

            if (result && !result.handled) {
                switch (result.code) {
                    // TODO: Backend có mã lỗi riêng thì thêm case ở đây.
                    default:
                        addHelperError?.({
                            id: Date.now(),
                            code: I18N_KEYS.GLOBAL_ERROR.ERROR_unknownError,
                        });
                        break;
                }
            }
        } finally {
            setIsFetchingBlockedUsers(false);
        }
    }, [addHelperError, handleError, profileData, user]);

    const handleToggleBlockUser = useCallback(
        async (targetAccount) => {
            try {
                setIsTogglingBlock(true);

                const nextBlockedStatus = !targetAccount.isBlocked;

                // TODO: Thay bằng api.toggleBlockUser()
                // await api.toggleBlockUser({
                //     targetAccountID: targetAccount.accountID,
                //     isBlocked: nextBlockedStatus,
                // });

                setBlockedUsers((prev) =>
                    prev.map((account) =>
                        getAccountID(account) === getAccountID(targetAccount)
                            ? {
                                  ...account,
                                  isBlocked: nextBlockedStatus,
                              }
                            : account
                    )
                );

                addMascotMessage(
                    nextBlockedStatus
                        ? I18N_KEYS.PROFILE.HANDLE.BLOCK_ACCOUNT.profile_handleBlockAccount_helper_success_block
                        : I18N_KEYS.PROFILE.HANDLE.BLOCK_ACCOUNT.profile_handleBlockAccount_helper_success_unblock
                );

                closeGlobalModal();
            } catch (error) {
                const errorData = error.response?.data;
                const result = handleError(errorData);

                if (result && !result.handled) {
                    switch (result.code) {
                        // TODO: Backend có mã lỗi riêng thì thêm case ở đây.
                        default:
                            addHelperError?.({
                                id: Date.now(),
                                code: I18N_KEYS.GLOBAL_ERROR.ERROR_unknownError,
                            });
                            break;
                    }
                }
            } finally {
                setIsTogglingBlock(false);
            }
        },
        [addMascotMessage, closeGlobalModal, addHelperError, handleError]
    );
    //-------------------Hết phần backend cần quan tâm---------------------

    useEffect(() => {
        passwordFormRef.current = passwordForm;
    }, [passwordForm]);

    useEffect(() => {
        passwordOtpRef.current = passwordOtp;
    }, [passwordOtp]);

    useEffect(() => {
        changePasswordOtpCooldownRef.current = changePasswordOtpCooldown;
    }, [changePasswordOtpCooldown]);

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            navigate(`/login?redirect=${encodeURIComponent("/profile")}`, {
                replace: true,
            });
        }
    }, [isAuthenticated, loading, navigate]);

    useEffect(() => {
        if (loading || !isAuthenticated || !user) return;

        const currentAccountID = getAccountID(user);

        if (!currentAccountID) return;

        if (fetchedProfileAccountIDRef.current === currentAccountID) return;

        fetchedProfileAccountIDRef.current = currentAccountID;
        handleFetchProfile(user);
    }, [
        loading,
        isAuthenticated,
        user?.accountID,
        user?.id,
        user?.userID,
        handleFetchProfile,
    ]);

    useEffect(() => {
        const rawTab = new URLSearchParams(location.search).get("tab");
        const nextTab = getValidTab(rawTab);

        if (!rawTab || rawTab !== nextTab) {
            navigate(`/profile?tab=${nextTab}`, { replace: true });
            return;
        }

        if (nextTab === activeTab) return;

        if (activeTab === "edit" && isProfileDirty && nextTab !== "edit") {
            navigate(`/profile?tab=${activeTab}`, { replace: true });
            triggerUnsavedReminder();
            return;
        }

        const nextDirection = Math.sign(getTabIndex(nextTab) - getTabIndex(activeTab));

        setTabDirection(nextDirection || 1);
        setActiveTab(nextTab);
    }, [
        activeTab,
        isProfileDirty,
        location.search,
        navigate,
        triggerUnsavedReminder,
    ]);

    useEffect(() => {
        if (activeTab === "blocking" && !hasFetchedBlockedUsers) {
            handleFetchBlockedUsers();
        }
    }, [
        activeTab,
        handleFetchBlockedUsers,
        hasFetchedBlockedUsers,
    ]);

    useEffect(() => {
        setBlockingPage(1);
    }, [blockedKeyword]);

    useEffect(() => {
        if (blockingPage > totalBlockingPages) {
            setBlockingPage(totalBlockingPages);
        }
    }, [blockingPage, totalBlockingPages]);

    useEffect(() => {
        if (changePasswordOtpCooldown <= 0) return;

        const timer = window.setInterval(() => {
            setChangePasswordOtpCooldown((prev) => Math.max(prev - 1, 0));
        }, 1000);

        return () => window.clearInterval(timer);
    }, [changePasswordOtpCooldown]);

    useEffect(() => {
        if (!setGlobalModal) return;

        setGlobalModal((prev) => {
            if (!prev?.isOpen || prev.type !== "input") return prev;
            if (prev.inputProps?.name !== "otp_changePassword") return prev;

            if (prev.inputProps.value === passwordOtp) return prev;

            return {
                ...prev,
                inputProps: {
                    ...prev.inputProps,
                    value: passwordOtp,
                },
            };
        });
    }, [passwordOtp, setGlobalModal]);

    useEffect(() => {
        if (!setGlobalModal) return;

        setGlobalModal((prev) => {
            if (!prev?.isOpen || prev.type !== "input") return prev;
            if (prev.inputProps?.name !== "otp_changePassword") return prev;

            const nextText = getChangePasswordResendText();

            if (prev.inputOtherActionText === nextText) return prev;

            return {
                ...prev,
                inputOtherActionText: nextText,
            };
        });
    }, [
        changePasswordOtpCooldown,
        getChangePasswordResendText,
        setGlobalModal,
    ]);

    const handleTabChange = (nextTab) => {
        if (nextTab === activeTab) return;

        if (activeTab === "edit" && isProfileDirty) {
            triggerUnsavedReminder();
            return;
        }

        const nextDirection = Math.sign(getTabIndex(nextTab) - getTabIndex(activeTab));

        setTabDirection(nextDirection || 1);
        setActiveTab(nextTab);
        navigate(`/profile?tab=${nextTab}`);
    };

    const handleRandomAvatar = () => {
        setAvatarFile(null);

        setProfileForm((prev) => ({
            ...prev,
            avatar: getDefaultAvatar(),
        }));
    };

    const handleAvatarFileSelect = (file) => {
        setAvatarFile(file);

        const reader = new FileReader();

        reader.onload = () => {
            setProfileForm((prev) => ({
                ...prev,
                avatar: reader.result,
            }));
        };

        reader.readAsDataURL(file);
    };

    const handleProfileSubmit = async (event) => {
        event.preventDefault();

        if (!isProfileDirty || isSavingProfile) return;

        await handleUpdateProfile();
    };

    const handleOpenResetProfileModal = () => {
        if (!isProfileDirty) return;

        setGlobalModal?.({
            isOpen: true,
            type: "two-buttons",
            title: I18N_KEYS.PROFILE.HANDLE.EDIT_PROFILE.profile_handleEditProfile_modalTitle_resetAll,
            description: I18N_KEYS.PROFILE.HANDLE.EDIT_PROFILE.profile_handleEditProfile_modalDesc_resetAll,
            primaryBtnText: I18N_KEYS.PROFILE.HANDLE.EDIT_PROFILE.profile_handleEditProfile_modalButton_resetAll,
            onPrimaryAction: () => {
                setProfileForm(initialProfileForm);
                setAvatarFile(null);
                closeGlobalModal();
                addMascotMessage(I18N_KEYS.PROFILE.HANDLE.EDIT_PROFILE.profile_handleEditProfile_helper_success_ressetAll);
            },
            secondaryBtnText: I18N_KEYS.PROFILE.HANDLE.EDIT_PROFILE.profile_handleEditProfile_modalButton_back,
            onSecondaryAction: closeGlobalModal,
        });
    };

    const renderPasswordIcon = (value, isValid = value.length >= 6) => {
        if (value.length === 0) return null;

        return isValid ? (
            <span className="text-primary-500 font-bold text-xl">
                <CiCircleCheck strokeWidth={1} />
            </span>
        ) : (
            <span className="text-text-shade-200 font-bold text-xl">
                <CiCircleMore strokeWidth={1} />
            </span>
        );
    };

    const openChangePasswordOtpModal = () => {
        setPasswordOtp("");
        handleResendChangePasswordOtpWithCooldown();

        setGlobalModal?.({
            isOpen: true,
            type: "input",
            title: I18N_KEYS.PROFILE.HANDLE.CHANGE_PASSWORD.profile_handleChangePassword_modalTitle_otp,
            description: [I18N_KEYS.PROFILE.HANDLE.CHANGE_PASSWORD.profile_handleChangePassword_modalDesc_otp, {email: profileData?.email}],
            primaryBtnText: I18N_KEYS.PROFILE.HANDLE.CHANGE_PASSWORD.profile_handleChangePassword_modalButton_verifyOtp,
            primaryBtnType: "submit",
            inputProps: {
                id: "otp_changePassword",
                name: "otp_changePassword",
                placeholder: "123456",
                value: "",
                required: true,
                errorEmpty: I18N_KEYS.PROFILE.HANDLE.CHANGE_PASSWORD.profile_handleChangePassword_helper_error_nullOTP,
                onChange: (event) => setPasswordOtp(event.target.value),
            },
            onPrimaryAction: handleVerifyChangePasswordOtp,
            inputOtherActionText: getChangePasswordResendText(OTP_RESEND_SECONDS),
            onInputOtherAction: handleResendChangePasswordOtpWithCooldown,
        });
    };

    const handleResendChangePasswordOtpWithCooldown = async () => {
        if (
            changePasswordOtpCooldownRef.current > 0 ||
            isChangingPassword
        ) {
            return;
        }

        const success = await handleResendChangePasswordOtp();

        if (success) {
            startChangePasswordOtpCooldown();
        }
    };

    const handlePasswordSubmit = async (event) => {
        event.preventDefault();

        if (isChangingPassword) return;

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            addMascotMessage(I18N_KEYS.PROFILE.HANDLE.CHANGE_PASSWORD.profile_handleChangePassword_helper_error_wrongConfirmPassword);
            return;
        }

        try {
            setIsChangingPassword(true);

            const success = await handleChangePassword();

            if (success) {
                openChangePasswordOtpModal();
            }
        } finally {
            setIsChangingPassword(false);
        }
    };

    const handleOpenToggleDisableModal = () => {
        const isDisabled = Boolean(profileData?.daVoHieuHoa);

        setGlobalModal?.({
            isOpen: true,
            type: "two-buttons",
            title: isDisabled
                ? I18N_KEYS.PROFILE.HANDLE.DEACTIVATE_ACCOUNT.profile_handleDeactivateAccount_modalTitle_activated
                : I18N_KEYS.PROFILE.HANDLE.DEACTIVATE_ACCOUNT.profile_handleDeactivateAccount_modalTitle_deactivated,
            description: isDisabled
                ? I18N_KEYS.PROFILE.HANDLE.DEACTIVATE_ACCOUNT.profile_handleDeactivateAccount_modalDesc_activated
                : I18N_KEYS.PROFILE.HANDLE.DEACTIVATE_ACCOUNT.profile_handleDeactivateAccount_modalDesc_deactivated,
            primaryBtnText: isDisabled
                ? I18N_KEYS.PROFILE.HANDLE.DEACTIVATE_ACCOUNT.profile_handleDeactivateAccount_modalButton_activated
                : I18N_KEYS.PROFILE.HANDLE.DEACTIVATE_ACCOUNT.profile_handleDeactivateAccount_modalButton_deactivated,
            onPrimaryAction: handleToggleDisableAccount,
            secondaryBtnText: I18N_KEYS.PROFILE.HANDLE.DEACTIVATE_ACCOUNT.profile_handleDeactivateAccount_modalButton_back,
            onSecondaryAction: closeGlobalModal,
        });
    };

    const handleOpenToggleBlockModal = (targetAccount) => {
        const isBlocked = Boolean(targetAccount?.isBlocked);
        const displayName = getDisplayName(targetAccount);

        setGlobalModal?.({
            isOpen: true,
            type: "two-buttons",
            title: isBlocked
                ? I18N_KEYS.PROFILE.HANDLE.BLOCK_ACCOUNT.profile_handleBlockAccount_modalTitle_unblock
                : I18N_KEYS.PROFILE.HANDLE.BLOCK_ACCOUNT.profile_handleBlockAccount_modalTitle_block,
            description: isBlocked
                ? [I18N_KEYS.PROFILE.HANDLE.BLOCK_ACCOUNT.profile_handleBlockAccount_modalDesc_unblock, {displayName: displayName}]
                : [I18N_KEYS.PROFILE.HANDLE.BLOCK_ACCOUNT.profile_handleBlockAccount_modalDesc_block, {displayName: displayName}],
            primaryBtnText: isBlocked ? I18N_KEYS.PROFILE.HANDLE.BLOCK_ACCOUNT.profile_handleBlockAccount_modalButton_unblock : I18N_KEYS.PROFILE.HANDLE.BLOCK_ACCOUNT.profile_handleBlockAccount_modalButton_block,
            onPrimaryAction: () => handleToggleBlockUser(targetAccount),
            secondaryBtnText: I18N_KEYS.PROFILE.HANDLE.BLOCK_ACCOUNT.profile_handleBlockAccount_modalButton_back,
            onSecondaryAction: closeGlobalModal,
        });
    };

    const renderEditTab = () => {
        return (
            <form onSubmit={handleProfileSubmit}>
                <AvatarGradientPanel
                    avatar={profileForm.avatar}
                    className="shadow-sm"
                >
                    <div className="grid gap-8 lg:grid-cols-[260px_1fr] lg:items-start">
                        <ProfileAvatarPicker
                            avatar={profileForm.avatar}
                            displayName={profileForm.displayName || profileData?.username}
                            onRandomAvatar={handleRandomAvatar}
                            onFileSelect={handleAvatarFileSelect}
                        />

                        <div className="space-y-5 bg-main-bg p-5 rounded-3xl">
                            <Input
                                id="profile-display-name"
                                name="displayName"
                                label={I18N_KEYS.PROFILE.COMMON.profile_editTabLabel_tenHienThi}
                                optional={true}
                                value={profileForm.displayName}
                                placeholder={profileData?.username || "username"}
                                maxLength={30}
                                errorTooLong= {I18N_KEYS.PROFILE.HANDLE.EDIT_PROFILE.profile_handleEditProfile_helper_error_tenHienThiTooLong}
                                disabled={isDisplayNameLocked}
                                helperText={
                                    isDisplayNameLocked
                                        ? [I18N_KEYS.PROFILE.COMMON.profile_editTabHelper_tenHienThi, {nameChangeRemainingDays: nameChangeRemainingDays}]
                                        : ""
                                }
                                triggerMascotMood={triggerMascotMood}
                                onChange={(event) =>
                                    setProfileForm((prev) => ({
                                        ...prev,
                                        displayName: event.target.value.slice(0, 30),
                                    }))
                                }
                            />

                            <TextAreaInput
                                id="profile-bio"
                                name="bio"
                                label={I18N_KEYS.PROFILE.COMMON.profile_editTabLabel_tieuSu}
                                optional={true}
                                value={profileForm.bio}
                                placeholder={I18N_KEYS.PROFILE.COMMON.profile_editTabPlaceholder_tieuSu}
                                rows={7}
                                maxLength={255}
                                errorTooLong = {I18N_KEYS.PROFILE.HANDLE.EDIT_PROFILE.profile_handleEditProfile_helper_error_tieuSuTooLong}
                                helperText={`${profileForm.bio.length}/255`}
                                triggerMascotMood={triggerMascotMood}
                                onChange={(event) =>
                                    setProfileForm((prev) => ({
                                        ...prev,
                                        bio: normalizeBioInput(event.target.value),
                                    }))
                                }
                            />
                        </div>
                    </div>

                    <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                        <Button
                            type="button"
                            variant="outline"
                            size="large"
                            disabled={!isProfileDirty || isSavingProfile}
                            onClick={handleOpenResetProfileModal}
                        >
                            {t(I18N_KEYS.PROFILE.COMMON.profile_editTabButton_resetAll)}
                        </Button>

                        <Button
                            type="submit"
                            variant="primary"
                            size="large"
                            disabled={!isProfileDirty || isSavingProfile}
                            className={`
                                ${shouldNudgeSaveButton ? "animate-save-button-hop" : ""}
                            `}
                        >
                            {isSavingProfile ? t(I18N_KEYS.PROFILE.COMMON.profile_editTabButton_loading) : t(I18N_KEYS.PROFILE.COMMON.profile_editTabButton_save)}
                        </Button>
                    </div>
                </AvatarGradientPanel>
            </form>
        );
    };

    const renderPasswordTab = () => {
        return (
            <form
                onSubmit={handlePasswordSubmit}
                className="mx-auto max-w-2xl space-y-5 rounded-4xl bg-main-bg p-4 shadow-sm sm:p-6"
            >
                <Input
                    id="current-password"
                    name="currentPassword"
                    label={I18N_KEYS.PROFILE.COMMON.profile_passwordTabLabel_currentPassword}
                    value={passwordForm.currentPassword}
                    placeholder="••••••••"
                    type="password"
                    required
                    minLength={6}
                    maxLength={32}
                    helperText={I18N_KEYS.PROFILE.COMMON.profile_passwordTabHelper_currentPassword}
                    errorEmpty={I18N_KEYS.PROFILE.HANDLE.CHANGE_PASSWORD.profile_handleChangePassword_helper_error_nullCurrentPassword}
                    errorTooShort={I18N_KEYS.PROFILE.HANDLE.CHANGE_PASSWORD.profile_handleChangePassword_helper_error_currentPasswordTooShort}
                    errorTooLong={I18N_KEYS.PROFILE.HANDLE.CHANGE_PASSWORD.profile_handleChangePassword_helper_error_currentPasswordTooLong}
                    rightIcon={renderPasswordIcon(passwordForm.currentPassword)}
                    onChange={(event) =>
                        setPasswordForm((prev) => ({
                            ...prev,
                            currentPassword: event.target.value,
                        }))
                    }
                />

                <Input
                    id="new-password"
                    name="newPassword"
                    label={I18N_KEYS.PROFILE.COMMON.profile_passwordTabLabel_newPassword}
                    value={passwordForm.newPassword}
                    placeholder="••••••••"
                    type="password"
                    required
                    minLength={6}
                    maxLength={32}
                    helperText={I18N_KEYS.PROFILE.COMMON.profile_passwordTabHelper_newPassword}
                    errorEmpty={I18N_KEYS.PROFILE.HANDLE.CHANGE_PASSWORD.profile_handleChangePassword_helper_error_nullNewPassword}
                    errorTooShort={I18N_KEYS.PROFILE.HANDLE.CHANGE_PASSWORD.profile_handleChangePassword_helper_error_newPasswordTooShort}
                    errorTooLong={I18N_KEYS.PROFILE.HANDLE.CHANGE_PASSWORD.profile_handleChangePassword_helper_error_newPasswordTooLong}
                    rightIcon={renderPasswordIcon(passwordForm.newPassword)}
                    onChange={(event) =>
                        setPasswordForm((prev) => ({
                            ...prev,
                            newPassword: event.target.value,
                        }))
                    }
                />

                <Input
                    id="confirm-new-password"
                    name="confirmPassword"
                    label={I18N_KEYS.PROFILE.COMMON.profile_passwordTabLabel_confirmPassword}
                    value={passwordForm.confirmPassword}
                    placeholder="••••••••"
                    type="password"
                    required
                    minLength={6}
                    maxLength={32}
                    helperText={I18N_KEYS.PROFILE.COMMON.profile_passwordTabHelper_confirmPassword}
                    errorEmpty={I18N_KEYS.PROFILE.HANDLE.CHANGE_PASSWORD.profile_handleChangePassword_helper_error_nullConfirmPassword}
                    errorTooShort={I18N_KEYS.PROFILE.HANDLE.CHANGE_PASSWORD.profile_handleChangePassword_helper_error_confirmPasswordTooShort}
                    errorTooLong={I18N_KEYS.PROFILE.HANDLE.CHANGE_PASSWORD.profile_handleChangePassword_helper_error_confirmPasswordTooLong}
                    rightIcon={renderPasswordIcon(
                        passwordForm.confirmPassword,
                        passwordForm.confirmPassword.length >= 6 &&
                            passwordForm.confirmPassword === passwordForm.newPassword
                    )}
                    onChange={(event) =>
                        setPasswordForm((prev) => ({
                            ...prev,
                            confirmPassword: event.target.value,
                        }))
                    }
                />

                <div className="flex justify-end pt-2">
                    <Button
                        type="submit"
                        variant="primary"
                        size="large"
                        disabled={isChangingPassword}
                    >
                        {isChangingPassword ? t(I18N_KEYS.PROFILE.COMMON.profile_passwordTabButton_loading) : t(I18N_KEYS.PROFILE.COMMON.profile_passwordTabButton_changePassword)}
                    </Button>
                </div>
            </form>
        );
    };

    const renderDisabledTab = () => {
        return (
            <div className="mx-auto max-w-3xl rounded-4xl bg-main-bg p-5 shadow-sm sm:p-7">
                <div className="rounded-4xl bg-bg-shade-50 p-5">
                    <p className="font-heading text-xl font-semibold text-main-text">
                        {t(I18N_KEYS.PROFILE.COMMON.profile_disabledTabTitle_status)}{" "}
                        <span className="text-primary-500">
                            {isAccountDisabled
                                ? t(I18N_KEYS.PROFILE.COMMON.profile_disabledTabTitle_isDisabled, {disabledDays: disabledDays})
                                : t(I18N_KEYS.PROFILE.COMMON.profile_disabledTabTitle_isActive)}
                        </span>
                    </p>

                    <div className="mt-4 space-y-2 font-body text-sm leading-relaxed text-text-shade-300">
                        <p>
                            {t(I18N_KEYS.PROFILE.COMMON.profile_disabledTabText_text1)}
                        </p>

                        {isAccountDisabled && (
                            <p>
                                {t(I18N_KEYS.PROFILE.COMMON.profile_disabledTabText_text2, {disabledRemainingDays: disabledRemainingDays})}
                            </p>
                        )}
                    </div>
                </div>

                <div className="mt-6 flex justify-end">
                    <Button
                        type="button"
                        variant={isAccountDisabled ? "primary" : "outline"}
                        size="large"
                        disabled={isTogglingDisable}
                        onClick={handleOpenToggleDisableModal}
                    >
                        {isAccountDisabled
                            ? t(I18N_KEYS.PROFILE.COMMON.profile_disabledTabButton_activate)
                            : t(I18N_KEYS.PROFILE.COMMON.profile_disabledTabButton_deactivate)}
                    </Button>
                </div>
            </div>
        );
    };

    const renderBlockingTab = () => {
        return (
            <div className="mx-auto max-w-3xl rounded-4xl bg-main-bg p-4 shadow-sm sm:p-6">
                <Input
                    id="blocked-user-search"
                    type="search"
                    value={blockedKeyword}
                    placeholder={I18N_KEYS.PROFILE.COMMON.profile_blockingTabPlaceholder_search}
                    leftIcon={<Search size={16} />}
                    enableProfanityFilter={false}
                    className="mb-5"
                    onChange={(event) => setBlockedKeyword(event.target.value)}
                />

                {isFetchingBlockedUsers ? (
                    <div className="flex min-h-52 items-center justify-center rounded-4xl bg-bg-shade-50">
                        <div className="h-7 w-7 animate-spin rounded-full border-2 border-main-text/20 border-t-main-text" />
                    </div>
                ) : filteredBlockedUsers.length === 0 ? (
                    <div className="flex min-h-52 items-center justify-center rounded-4xl bg-bg-shade-50 px-5 py-8 text-center">
                        <p className="font-ui text-sm font-bold text-text-shade-400">
                            {blockedKeyword.trim()
                                ? t(I18N_KEYS.PROFILE.COMMON.profile_blockingTabText_noResult)
                                : t(I18N_KEYS.PROFILE.COMMON.profile_blockingTabText_noBlocked)}
                        </p>
                    </div>
                ) : (
                    <>
                        {paginatedBlockedUsers.map((account) => (
                            <PostAuthorCard
                                key={account.blockRelationshipID || account.accountID}
                                author={account}
                                variant="sideButton"
                                disableNavigate={account.isBlocked}
                                onNavigateAuthor={() => navigate(`/user/${account.username}`)}
                                sideButtonConfig={{
                                    text: account.isBlocked ? I18N_KEYS.PROFILE.COMMON.profile_blockingTabButton_unblock : I18N_KEYS.PROFILE.COMMON.profile_blockingTabButton_block,
                                    loadingText: I18N_KEYS.PROFILE.COMMON.profile_blockingTabButton_loading,
                                    variant: account.isBlocked ? "outline" : "primary",
                                    disabled: isTogglingBlock,
                                    badgeText: account.isBlocked ? I18N_KEYS.PROFILE.COMMON.profile_blockingTabBadge_isBlocked : I18N_KEYS.PROFILE.COMMON.profile_blockingTabBadge_isUnblocked,
                                    badgeTone: account.isBlocked ? "active" : "muted",
                                    onClick: () => handleOpenToggleBlockModal(account),
                                }}
                            />
                        ))}

                        <BlockingPagination
                            currentPage={blockingPage}
                            totalPages={totalBlockingPages}
                            onPageChange={setBlockingPage}
                        />
                    </>
                )}

                {isTogglingBlock && (
                    <p className="mt-4 text-center font-ui text-xs font-bold text-text-shade-300">
                        {t(I18N_KEYS.PROFILE.COMMON.profile_blockingTabText_updating)}
                    </p>
                )}
            </div>
        );
    };

    



    const renderTabPanelContent = (tab) => {
        switch (tab) {
            case "password":
                return renderPasswordTab();
            case "disabled":
                return renderDisabledTab();
            case "blocking":
                return renderBlockingTab();
            case "edit":
            default:
                return renderEditTab();
        }
    };

    const renderAnimatedTabPanels = () => {
        if (isFetchingProfile) {
            return (
                <div className="flex min-h-72 items-center justify-center rounded-4xl bg-bg-shade-50">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-main-text/20 border-t-main-text" />
                </div>
            );
        }

        return (
            <div className="rounded-4xl bg-linear-to-b via-main-bg from-main-bg to-bg-shade-100 p-3 sm:p-5 lg:p-6 border border-bg-shade-200">
                <motion.div
                    className="relative overflow-hidden px-1 pb-[18px]"
                    animate={{
                        height: activePanelHeight
                            ? activePanelHeight + TAB_PANEL_SHADOW_SPACE
                            : "auto",
                    }}
                    transition={{
                        height: {
                            duration: 0.22,
                            ease: "easeOut",
                        },
                    }}
                >
                    {VALID_TABS.map((tab) => {
                        const isActive = activeTab === tab;

                        return (
                            <motion.div
                                key={tab}
                                ref={(element) => {
                                    tabPanelRefs.current[tab] = element;
                                }}
                                initial={false}
                                animate={{
                                    opacity: isActive ? 1 : 0,
                                    x: isActive ? 0 : getInactivePanelX(tab, activeTab),
                                }}
                                transition={{
                                    opacity: {
                                        duration: 0.16,
                                        ease: "easeOut",
                                    },
                                    x: {
                                        duration: 0.22,
                                        ease: "easeOut",
                                    },
                                }}
                                className={`
                                    transform-gpu
                                    ${
                                        isActive
                                            ? "relative z-10"
                                            : "pointer-events-none absolute inset-x-0 top-0 z-0"
                                    }
                                `}
                                style={{
                                    willChange: "transform, opacity",
                                }}
                                aria-hidden={!isActive}
                            >
                                {renderTabPanelContent(tab)}
                            </motion.div>
                        );
                    })}
                </motion.div>
            </div>
        );
    };



    if (loading || !isAuthenticated) return null;












    return (
        <PageContainer setHelperFocusState={setHelperFocusState}>
            <SectionContainer title={I18N_KEYS.PROFILE.COMMON.profile_sectionContainerTitle}>
                <div className="space-y-0">
                    <ProfileTabNavigation
                        activeTab={activeTab}
                        onTabChange={handleTabChange}
                    />

                    {renderAnimatedTabPanels()}
                    
                </div>
            </SectionContainer>
        </PageContainer>
    );
}