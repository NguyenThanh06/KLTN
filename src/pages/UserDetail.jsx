import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { I18N_KEYS } from "../i18n/key";
import { useAuth } from "../context/AuthContext";
import { useErrorHandler } from "../hooks/useErrorHandler";
import { profileApi } from "../api/profileApi";
import { postApi } from "../api/postApi";

import PageContainer from "../components/PageContainer";
import SectionContainer from "../components/SectionContainer";
import AvatarGradientPanel from "../components/AvatarGradientPanel";
import PostSectionContainer from "../components/PostSectionContainer";
import PostGrid from "../components/PostGrid";
import UserHeaderActions from "../components/UserHeaderActions";
import UserProfileContent from "../components/UserProfileContent";
import UserActionMenuModal from "../components/UserActionMenuModal";
import RelationshipListModal from "../components/RelationshipListModal";
import ReportModal from "../components/ReportModal";
import SavedPostsModal from "../components/SavedPostsModal";

import { MOCK_POST_DATA_1 } from "../data/Post/mockPost1";
import { MOCK_POST_DATA_2 } from "../data/Post/mockPost2";

const POST_PAGE_SIZE = 12;
const RELATIONSHIP_PAGE_SIZE = 20;

const getAccountID = (value) => {
    if (!value) return "";
    if (typeof value === "string" || typeof value === "number") {
        return String(value);
    }

    return String(value.accountID || value.accountId || value.userID || value.id || "");
};

const getUserDisplayName = (account) => {
    if (!account) return "Người dùng đáng yêu";
    return account.tenHienThi || account.username || "Người dùng đáng yêu";
};

const formatNumber = (value = 0) => {
    return new Intl.NumberFormat("vi-VN").format(Number(value || 0));
};

const buildMockAccountPosts = (accountID) => {
    const sourcePosts = [MOCK_POST_DATA_1, MOCK_POST_DATA_2];

    return Array.from({ length: 36 }, (_, index) => {
        const sourcePost = sourcePosts[index % sourcePosts.length];

        return {
            ...sourcePost,
            postID: `${sourcePost.postID}-${accountID}-${index + 1}`,
            tacGia: Number(accountID),
            tieuDe:
                index < sourcePosts.length
                    ? sourcePost.tieuDe
                    : `${sourcePost.tieuDe} #${index + 1}`,
        };
    });
};
const getPageContent = (pageData) => {
    if (Array.isArray(pageData)) return pageData;
    if (Array.isArray(pageData?.content)) return pageData.content;
    if (Array.isArray(pageData?.items)) return pageData.items;

    return [];
};









export default function UserDetail({
    setGlobalModal,
    addHelperError,
    setHelperFocusState,
    isUnder18,
    isAlertActive,
    visitorIP,
    clearAlert,
}) {

    const { t } = useTranslation();

    const { username } = useParams();
    const navigate = useNavigate();

    const { handleError } = useErrorHandler();
    const { loading: authLoading, user, isAuthenticated } = useAuth();

    const preparedPageKeyRef = useRef("");

    const currentUserID = getAccountID(user);

    const [account, setAccount] = useState(null);
    const [isPreparingPage, setIsPreparingPage] = useState(true);

    const [isShareDone, setIsShareDone] = useState(false);

    const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);

    const [isFollowingAccount, setIsFollowingAccount] = useState(false);
    const [isFollowLoading, setIsFollowLoading] = useState(false);

    const [postPage, setPostPage] = useState(1);
    const [allPosts, setAllPosts] = useState([]);

    const [relationshipModalType, setRelationshipModalType] = useState(null);
    const [relationshipKeyword, setRelationshipKeyword] = useState("");
    const [relationshipPage, setRelationshipPage] = useState(1);
    const [relationshipItems, setRelationshipItems] = useState([]);
    const [relationshipHasMore, setRelationshipHasMore] = useState(false);
    const [isRelationshipLoading, setIsRelationshipLoading] = useState(false);
    const [relationshipFollowLoadingID, setRelationshipFollowLoadingID] = useState(null);

    const [isSavedPostsModalOpen, setIsSavedPostsModalOpen] = useState(false);
    const [savedPosts, setSavedPosts] = useState([]);
    const [savedPostPage, setSavedPostPage] = useState(1);
    const [savedPostHasMore, setSavedPostHasMore] = useState(false);
    const [isSavedPostInitialLoading, setIsSavedPostInitialLoading] = useState(false);
    const [isSavedPostLoadingMore, setIsSavedPostLoadingMore] = useState(false);

    const isCurrentAccount = Boolean(
        isAuthenticated &&
            currentUserID &&
            getAccountID(account) &&
            String(currentUserID) === getAccountID(account)
    );

    const displayName = getUserDisplayName(account);

    const totalPostPages = Math.max(1, Math.ceil(allPosts.length / POST_PAGE_SIZE));

    const currentPagePosts = useMemo(() => {
        const startIndex = (postPage - 1) * POST_PAGE_SIZE;
        return allPosts.slice(startIndex, startIndex + POST_PAGE_SIZE);
    }, [allPosts, postPage]);

    const libraryTitle = isCurrentAccount
        ? I18N_KEYS.USER_DETAIL.COMMON.userDetail_postSectionContainerTitle_userAccount
        : [I18N_KEYS.USER_DETAIL.COMMON.userDetail_postSectionContainerTitle_otherAccount, {displayName: displayName}];

    const libraryDescription = [I18N_KEYS.USER_DETAIL.COMMON.userDetail_postSectionContainerDesc_totalPost, {postCount: formatNumber(allPosts.length)}];

    const handleCloseGlobalModal = useCallback(() => {
        setGlobalModal?.((prev) => ({
            ...prev,
            isOpen: false,
        }));
    }, [setGlobalModal]);

    const handleRequireLogin = useCallback(
        (description = I18N_KEYS.USER_DETAIL.HANDLE.PREPARE_PAGE.userDetail_preparePageAndRequireLogin_modalDesc_requireLogin) => {
            setGlobalModal?.({
                isOpen: true,
                type: "two-buttons",
                title: I18N_KEYS.USER_DETAIL.HANDLE.PREPARE_PAGE.userDetail_preparePageAndRequireLogin_modalTitle_requireLogin,
                description,
                primaryBtnText: I18N_KEYS.USER_DETAIL.HANDLE.PREPARE_PAGE.userDetail_preparePageAndRequireLogin_modalButton_requireLogin_toLogin,
                secondaryBtnText: I18N_KEYS.USER_DETAIL.HANDLE.PREPARE_PAGE.userDetail_preparePageAndRequireLogin_modalButton_requireLogin_back,
                onPrimaryAction: () => {
                    const redirectPath = `/user/${username}`;

                    navigate(`/login?redirect=${encodeURIComponent(redirectPath)}`);
                    handleCloseGlobalModal();
                },
                onSecondaryAction: handleCloseGlobalModal,
            });
        },
        [handleCloseGlobalModal, navigate, setGlobalModal, username]
    );

    //------------------- CÁC TODO BACKEND CẦN QUAN TÂM -------------------
    // Các hàm dưới đây là nơi đang mock hoặc sau này sẽ gọi API thật.

    const handleFetchAccountDetail = useCallback(async () => { //Hàm lấy thông tin account
        const isViewingSelfByID = Boolean(
            isAuthenticated &&
                currentUserID &&
                String(currentUserID) === String(username)
        );

        const response = isViewingSelfByID
            ? await profileApi.getMyProfile({ page: 0, size: POST_PAGE_SIZE })
            : await profileApi.getPublicProfile(username, {
                page: 0,
                size: POST_PAGE_SIZE,
            });

        return response.data?.result || response.data || null;
    }, [currentUserID, isAuthenticated, username]);

    const handleVerifyBlocking = useCallback(async (targetAccountID) => { //Hàm ktra chặn
        // TODO: gọi backend kiểm tra user hiện tại và account đang xem có chặn lẫn nhau không.
        // Backend gợi ý nhận:
        // - currentUserID
        // - targetAccountID
        //
        // return Boolean(response.data.isBlocked);

        await Promise.resolve({
            currentUserID,
            targetAccountID,
        });

        return false;
    }, [currentUserID]);

    const handleFetchAccountPosts = useCallback(async (targetAccount) => { // Hàm lấy ds post của account
        const libraryPosts = getPageContent(targetAccount?.thuVienTacPham);

        if (libraryPosts.length > 0) {
            return libraryPosts;
        }

        return buildMockAccountPosts(getAccountID(targetAccount));
    }, []);

    const handleFetchRelationshipPage = useCallback(async ({ // Hàm lấy ds ng theo dõi/đang theo dõi
        targetAccountID,
        type,
        keyword = "",
        page,
    }) => {
        const requestPage = Math.max(Number(page || 1) - 1, 0);
        const normalizedKeyword = keyword.trim();

        const response = type === "following"
            ? await profileApi.getFollowing(targetAccountID, {
                keyword: normalizedKeyword,
                page: requestPage,
                size: RELATIONSHIP_PAGE_SIZE,
            })
            : await profileApi.getFollowers(targetAccountID, {
                keyword: normalizedKeyword,
                page: requestPage,
                size: RELATIONSHIP_PAGE_SIZE,
            });
        const pageData = response.data?.result || response.data;

        return {
            items: getPageContent(pageData),
            hasMore: !pageData?.last,
        };
    }, []);

    const handleFetchSavedPosts = useCallback(async ({ page }) => {// Hàm lấy post đã lưu
        const response = await postApi.getSavedPosts({
            page: Math.max(Number(page || 1) - 1, 0),
        });
        const pageData = response.data?.result || response.data;

        return {
            items: getPageContent(pageData),
            hasMore: !pageData?.last,
        };
    }, []);

    const handlePrepareUserDetailPage = useCallback(async () => {
        if (authLoading) return;

        const preparePageKey = `${username}__${isAuthenticated ? "in" : "out"}__${
            currentUserID || ""
        }`;

        if (preparedPageKeyRef.current === preparePageKey) {
            return;
        }

        preparedPageKeyRef.current = preparePageKey;
        setIsPreparingPage(true);

        try {
            const fetchedAccount = await handleFetchAccountDetail();

            if (!fetchedAccount) {
                setAccount(null);
                setAllPosts([]);
                setIsFollowingAccount(false);
                
                setGlobalModal?.({
                    isOpen: true,
                    type: "info",
                    title: I18N_KEYS.USER_DETAIL.HANDLE.PREPARE_PAGE.userDetail_preparePageAndRequireLogin_modalTitle_cannotFindUser,
                    description:I18N_KEYS.USER_DETAIL.HANDLE.PREPARE_PAGE.userDetail_preparePageAndRequireLogin_modalDesc_cannotFindUser,
                });
                
                navigate("/", { replace: true });

                return;
            }

            const isViewingSelf = Boolean(
                isAuthenticated &&
                    currentUserID &&
                    String(currentUserID) === getAccountID(fetchedAccount)
            );

            if (isAuthenticated && !isViewingSelf) {
                const isBlocked = await handleVerifyBlocking(
                    getAccountID(fetchedAccount)
                );

                if (isBlocked) {
                    navigate("/", { replace: true });

                    setGlobalModal?.({
                        isOpen: true,
                        type: "info",
                        title: I18N_KEYS.USER_DETAIL.HANDLE.PREPARE_PAGE.userDetail_preparePageAndRequireLogin_modalTitle_blockedUser,
                        description: I18N_KEYS.USER_DETAIL.HANDLE.PREPARE_PAGE.userDetail_preparePageAndRequireLogin_modalDesc_blockedUser,
                    });

                    return;
                }
            }

            const fetchedPosts = await handleFetchAccountPosts(fetchedAccount);

            setAccount(fetchedAccount);
            setAllPosts(fetchedPosts);
            setPostPage(1);

            setIsFollowingAccount(
                isAuthenticated && !isViewingSelf
                    ? Boolean(fetchedAccount.daTheoDoi)
                    : false
            );
        } catch (error) {
            const errorData = error.response?.data;
            const serverMessage = errorData?.message;
            const result = handleError(errorData);

            if (result && !result.handled) {
                switch (result.code) {
                    case "9998":
                        setAccount(null);
                        setAllPosts([]);
                        setIsFollowingAccount(false);

                        setGlobalModal?.({
                            isOpen: true,
                            type: "one-button",
                            title: "Không thể xem tài khoản",
                            description: serverMessage || "Bạn không thể xem thông tin người dùng này",
                            primaryBtnText: "OK",
                            onPrimaryAction: handleCloseGlobalModal,
                        });

                        navigate("/", { replace: true });
                        break;
                    default:
                        if (serverMessage) {
                            setAccount(null);
                            setAllPosts([]);
                            setIsFollowingAccount(false);

                            setGlobalModal?.({
                                isOpen: true,
                                type: "one-button",
                                title: "Không thể xem tài khoản",
                                description: serverMessage,
                                primaryBtnText: "OK",
                                onPrimaryAction: handleCloseGlobalModal,
                            });

                            navigate("/", { replace: true });
                            break;
                        }

                        addHelperError?.({
                            id: Date.now(),
                            code: I18N_KEYS.GLOBAL_ERROR.ERROR_unknownError,
                        });
                        break;
                }
            }
        } finally {
            setIsPreparingPage(false);
        }
    }, [
        addHelperError,
        authLoading,
        currentUserID,
        handleCloseGlobalModal,
        handleError,
        handleFetchAccountDetail,
        handleFetchAccountPosts,
        handleVerifyBlocking,
        isAuthenticated,
        navigate,
        setGlobalModal,
        username,
    ]);

    const handleToggleFollowAccount = async () => { // Hàm theo dõi/Bỏ theo dõi account
        if (!account) return;

        if (!isAuthenticated) {
            handleRequireLogin(I18N_KEYS.USER_DETAIL.HANDLE.PREPARE_PAGE.userDetail_preparePageAndRequireLogin_modalDesc_requireLogin_follow);
            return;
        }

        if (isCurrentAccount || isFollowLoading) return;

        const previousFollowing = isFollowingAccount;
        const nextFollowing = !previousFollowing;

        setIsFollowLoading(true);
        setIsFollowingAccount(nextFollowing);

        try {
            const response = nextFollowing
                ? await profileApi.followAccount(getAccountID(account))
                : await profileApi.unfollowAccount(getAccountID(account));
            const result = response.data?.result || response.data;

            setIsFollowingAccount(Boolean(result?.daTheoDoi));

            if (result?.soNguoiTheoDoi !== undefined) {
                setAccount((prev) => ({
                    ...prev,
                    soNguoiTheoDoi: result.soNguoiTheoDoi,
                }));
            }
        } catch (error) {
            setIsFollowingAccount(previousFollowing);

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
        } finally {
            setIsFollowLoading(false);
        }
    };

    const handleToggleFollowRelationshipAccount = async (targetAccount) => { // Hàm theo dõi/Bỏ theo dõi mấy đứa trong ds theo dõi/bỏ theo dõi của th account
        if (!targetAccount) return;

        if (!isAuthenticated) {
            handleRequireLogin(
                I18N_KEYS.USER_DETAIL.HANDLE.PREPARE_PAGE
                    .userDetail_preparePageAndRequireLogin_modalDesc_requireLogin_follow
            );
            return;
        }

        const targetAccountID = getAccountID(targetAccount);

        if (!targetAccountID || String(targetAccountID) === String(currentUserID)) {
            return;
        }

        const targetRelationshipID =
            targetAccount.relationshipID || targetAccountID;

        if (relationshipFollowLoadingID) return;

        const previousItems = relationshipItems;
        const inferredFollowing =
            isCurrentAccount && relationshipModalType === "following";
        const previousFollowing = Boolean(targetAccount.daTheoDoi ?? inferredFollowing);
        const nextFollowing = !previousFollowing;

        setRelationshipFollowLoadingID(targetRelationshipID);

        setRelationshipItems((prev) =>
            prev.map((item) => {
                const isSameItem = item.relationshipID
                    ? item.relationshipID === targetRelationshipID
                    : getAccountID(item) === String(targetAccountID);

                if (!isSameItem) return item;

                return {
                    ...item,
                    daTheoDoi: nextFollowing,
                };
            })
        );

        try {
            const response = nextFollowing
                ? await profileApi.followAccount(targetAccountID)
                : await profileApi.unfollowAccount(targetAccountID);
            const result = response.data?.result || response.data;
            const finalFollowing = Boolean(result?.daTheoDoi);

            setRelationshipItems((prev) =>
                prev.map((item) => {
                    const isSameItem = item.relationshipID
                        ? item.relationshipID === targetRelationshipID
                        : getAccountID(item) === String(targetAccountID);

                    return isSameItem
                        ? { ...item, daTheoDoi: finalFollowing }
                        : item;
                })
            );
        } catch (error) {
            setRelationshipItems(previousItems);

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
        } finally {
            setRelationshipFollowLoadingID(null);
        }
    };

    const handleOpenReportFlow = async () => { // Hàm ktra đã từng báo cáo account chưa
        if (!account) return;

        if (!isAuthenticated) {
            handleRequireLogin(I18N_KEYS.USER_DETAIL.HANDLE.PREPARE_PAGE.userDetail_preparePageAndRequireLogin_modalDesc_requireLogin_report);
            return;
        }
        console.log(account?.biKhoa)
        if (account?.biKhoa === true) {
            setGlobalModal?.({
                isOpen: true,
                type: "one-button",
                title: I18N_KEYS.USER_DETAIL.HANDLE.USER_REPORT.userDetail_handleReport_modalTitle_accountLocked,
                description: I18N_KEYS.USER_DETAIL.HANDLE.USER_REPORT.userDetail_handleReport_modalDesc_accountLocked,
                primaryBtnText: I18N_KEYS.USER_DETAIL.HANDLE.USER_REPORT.userDetail_handleReport_modalButton_accountLocked,
                onPrimaryAction: handleCloseGlobalModal,
            });

            return;
        }

        try {
            // TODO: gọi backend kiểm tra user đã từng báo cáo account này chưa.
            // const hasReportedBefore = await userApi.hasReportedUser(account.accountID);

            await Promise.resolve();

            const hasReportedBefore = false;

            if (hasReportedBefore) {
                setGlobalModal?.({
                    isOpen: true,
                    type: "one-button",
                    title: I18N_KEYS.USER_DETAIL.HANDLE.USER_REPORT.userDetail_handleReport_modalTitle_hasReportedBefore,
                    description: I18N_KEYS.USER_DETAIL.HANDLE.USER_REPORT.userDetail_handleReport_modalDesc_hasReportedBefore,
                    primaryBtnText: I18N_KEYS.USER_DETAIL.HANDLE.USER_REPORT.userDetail_handleReport_modalButton_hasReportedBefore,
                    onPrimaryAction: handleCloseGlobalModal,
                });

                return;
            }

            setIsReportModalOpen(true);
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
        }
    };

    const handleSubmitUserReport = async ({ reason, description }) => { //Hàm gửi báo cáo account
        if (!account) return;

        try {
            await profileApi.reportAccount(getAccountID(account), {
                mucBaoCao: reason,
                noiDungBaoCao: description,
            });

            setIsReportModalOpen(false);

            setGlobalModal?.({
                isOpen: true,
                type: "one-button",
                title: I18N_KEYS.USER_DETAIL.HANDLE.USER_REPORT.userDetail_handleReport_modalTitle_reported,
                description: I18N_KEYS.USER_DETAIL.HANDLE.USER_REPORT.userDetail_handleReport_modalDesc_reported,
                primaryBtnText: I18N_KEYS.USER_DETAIL.HANDLE.USER_REPORT.userDetail_handleReport_modalButton_reported,
                onPrimaryAction: handleCloseGlobalModal,
            });
        } catch (error) {
            const errorData = error.response?.data;
            const result = handleError(errorData);

            if (result && !result.handled) {
                switch (result.code) {
                    //Kịch bản acc đang bị khóa rồi
                    case "ACCOUNT_LOCKED":
                        addHelperError({
                            id: Date.now(),
                            code: I18N_KEYS.USER_DETAIL.HANDLE.USER_REPORT.userDetail_handleReport_helper_error_accountLocked,
                        })
                        break;
                    case "USER_ALREADY_REPORTED":
                        setIsReportModalOpen(false);
                        setGlobalModal?.({
                            isOpen: true,
                            type: "one-button",
                            title: I18N_KEYS.USER_DETAIL.HANDLE.USER_REPORT.userDetail_handleReport_modalTitle_hasReportedBefore,
                            description: I18N_KEYS.USER_DETAIL.HANDLE.USER_REPORT.userDetail_handleReport_modalDesc_hasReportedBefore,
                            primaryBtnText: I18N_KEYS.USER_DETAIL.HANDLE.USER_REPORT.userDetail_handleReport_modalButton_hasReportedBefore,
                            onPrimaryAction: handleCloseGlobalModal,
                        });
                        break;
                    //Kịch bản mục báo cáo rỗng
                    case "MUCBAOCAO_NULL":
                        addHelperError({
                            id: Date.now(),
                            code: I18N_KEYS.USER_DETAIL.HANDLE.USER_REPORT.userDetail_handleReport_helper_error_nullMucBaoCao,
                        })
                        break;
                    //Kịch bản nội dung rỗng
                    case "NOIDUNG_NULL":
                        addHelperError({
                            id: Date.now(),
                            code: I18N_KEYS.USER_DETAIL.HANDLE.USER_REPORT.userDetail_handleReport_helper_error_nullNoiDung,
                        })
                        break;
                    //Kịch bản mục báo cáo tầm bậy
                    case "MUCBAOCAO_WRONG_TYPE":
                        addHelperError({
                            id: Date.now(),
                            code: I18N_KEYS.USER_DETAIL.HANDLE.USER_REPORT.userDetail_handleReport_helper_error_typeMismatchMucBaoCao,
                        })
                        break;
                    //Kịch bản nội dung quá dài
                    case "NOIDUNG_TOO_LONG":
                        addHelperError({
                            id: Date.now(),
                            code: I18N_KEYS.USER_DETAIL.HANDLE.USER_REPORT.userDetail_handleReport_helper_error_noiDungTooLong,
                        })
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
    };

    const handleBlockAccount = async () => { // Hàm chặn account
        if (!account) return;

        if (!isAuthenticated) {
            handleRequireLogin(I18N_KEYS.USER_DETAIL.HANDLE.PREPARE_PAGE.userDetail_preparePageAndRequireLogin_modalDesc_requireLogin_block);
            return;
        }

        try {
            await profileApi.blockAccount(getAccountID(account));

            addHelperError?.({
                id: Date.now(),
                code: I18N_KEYS.USER_DETAIL.HANDLE.USER_BLOCKED.userDetail_handleBlockAccount_helper_success_blocked,
            });

            navigate("/", { replace: true });
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
        }
    };

    //------------------- HẾT CÁC TODO BACKEND CẦN QUAN TÂM -------------------

    useEffect(() => {
        const prepareTimer = window.setTimeout(() => {
            handlePrepareUserDetailPage();
        }, 0);

        return () => {
            window.clearTimeout(prepareTimer);
        };
    }, [handlePrepareUserDetailPage]);

    const handleShareUserPage = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);

            setIsShareDone(true);

            addHelperError?.({
                id: Date.now(),
                code: I18N_KEYS.USER_DETAIL.COMMON.userDetail_helper_success_copyLink,
            });

            window.setTimeout(() => {
                setIsShareDone(false);
            }, 1800);
        } catch {
            addHelperError?.({
                id: Date.now(),
                code: I18N_KEYS.USER_DETAIL.COMMON.userDetail_helper_error_copyLink,
            });
        }
    };

    const handleOpenActionMenu = () => {
        setIsActionMenuOpen(true);
    };

    const handleCloseActionMenu = () => {
        setIsActionMenuOpen(false);
    };

    const handleEditProfile = () => {
        setIsActionMenuOpen(false);
        navigate("/profile?edit");
    };

    const handleOpenSettings = () => {
        setIsActionMenuOpen(false);
        navigate("/profile");
    };

    const handleConfirmBlockAccount = () => {
        setIsActionMenuOpen(false);

        if (!isAuthenticated) {
            handleRequireLogin(I18N_KEYS.USER_DETAIL.HANDLE.PREPARE_PAGE.userDetail_preparePageAndRequireLogin_modalDesc_requireLogin_block);
            return;
        }

        setGlobalModal?.({
            isOpen: true,
            type: "two-buttons",
            title: I18N_KEYS.USER_DETAIL.HANDLE.USER_BLOCKED.userDetail_handleBlockAccount_modalTitle_confirm,
            description: I18N_KEYS.USER_DETAIL.HANDLE.USER_BLOCKED.userDetail_handleBlockAccount_modalDesc_confirm,
            primaryBtnText: I18N_KEYS.USER_DETAIL.HANDLE.USER_BLOCKED.userDetail_handleBlockAccount_modalButton_confirm,
            secondaryBtnText: I18N_KEYS.USER_DETAIL.HANDLE.USER_BLOCKED.userDetail_handleBlockAccount_modalButton_back,
            onPrimaryAction: () => {
                handleCloseGlobalModal();
                handleBlockAccount();
            },
            onSecondaryAction: handleCloseGlobalModal,
        });
    };

    const handleOpenReportAccount = () => {
        setIsActionMenuOpen(false);
        handleOpenReportFlow();
    };

    const handleOpenRelationshipModal = async (type) => {
        if (!account) return;

        setRelationshipModalType(type);
        setRelationshipKeyword("");
        setRelationshipPage(1);
        setRelationshipItems([]);
        setRelationshipHasMore(false);

        setIsRelationshipLoading(true);

        try {
            const result = await handleFetchRelationshipPage({
                targetAccountID: getAccountID(account),
                type,
                keyword: "",
                page: 1,
            });

            setRelationshipItems(result.items || []);
            setRelationshipHasMore(Boolean(result.hasMore));
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
        } finally {
            setIsRelationshipLoading(false);
        }
    };

    const handleCloseRelationshipModal = () => {
        setRelationshipModalType(null);
        setRelationshipKeyword("");
        setRelationshipPage(1);
        setRelationshipItems([]);
        setRelationshipHasMore(false);
    };

    const handleSearchRelationship = async (nextKeyword) => {
        if (!account || !relationshipModalType) return;

        setRelationshipKeyword(nextKeyword);
        setRelationshipPage(1);
        setRelationshipItems([]);
        setRelationshipHasMore(false);
        setIsRelationshipLoading(true);

        try {
            const result = await handleFetchRelationshipPage({
                targetAccountID: getAccountID(account),
                type: relationshipModalType,
                keyword: nextKeyword,
                page: 1,
            });

            setRelationshipItems(result.items || []);
            setRelationshipHasMore(Boolean(result.hasMore));
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
        } finally {
            setIsRelationshipLoading(false);
        }
    };

    const handleLoadMoreRelationship = async () => {
        if (
            !account ||
            !relationshipModalType ||
            isRelationshipLoading ||
            !relationshipHasMore
        ) {
            return;
        }

        const nextPage = relationshipPage + 1;

        setIsRelationshipLoading(true);

        try {
            const result = await handleFetchRelationshipPage({
                targetAccountID: getAccountID(account),
                type: relationshipModalType,
                keyword: relationshipKeyword,
                page: nextPage,
            });

            setRelationshipItems((prev) => [...prev, ...(result.items || [])]);
            setRelationshipHasMore(Boolean(result.hasMore));
            setRelationshipPage(nextPage);
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
        } finally {
            setIsRelationshipLoading(false);
        }
    };

    const handleNavigateRelationshipUser = (targetUser) => {
        const targetProfileID =
            getAccountID(targetUser) ||
            String(targetUser?.username || "").split("-")[0];

        if (!targetProfileID) return;

        handleCloseRelationshipModal();
        navigate(`/user/${targetProfileID}`);
    };

    const handleOpenSavedPostsModal = async () => {
        if (!isCurrentAccount) return;

        setIsSavedPostsModalOpen(true);
        setSavedPosts([]);
        setSavedPostPage(1);
        setSavedPostHasMore(false);
        setIsSavedPostInitialLoading(true);

        try {
            const result = await handleFetchSavedPosts({
                page: 1,
            });

            setSavedPosts(result.items || []);
            setSavedPostHasMore(Boolean(result.hasMore));
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
        } finally {
            setIsSavedPostInitialLoading(false);
        }
    };

    const handleCloseSavedPostsModal = () => {
        setIsSavedPostsModalOpen(false);
        setSavedPosts([]);
        setSavedPostPage(1);
        setSavedPostHasMore(false);
        setIsSavedPostInitialLoading(false);
        setIsSavedPostLoadingMore(false);
    };

    const handleLoadMoreSavedPosts = async () => {
        if (
            !isCurrentAccount ||
            isSavedPostLoadingMore ||
            isSavedPostInitialLoading ||
            !savedPostHasMore
        ) {
            return false;
        }

        const nextPage = savedPostPage + 1;

        setIsSavedPostLoadingMore(true);

        try {
            const result = await handleFetchSavedPosts({
                page: nextPage,
            });

            setSavedPosts((prev) => [...prev, ...(result.items || [])]);
            setSavedPostHasMore(Boolean(result.hasMore));
            setSavedPostPage(nextPage);

            return Boolean(result.hasMore);
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

            return false;
        } finally {
            setIsSavedPostLoadingMore(false);
        }
    };

    const handleEditPost = (post) => {
        if (!post?.postID) return;

        navigate(`/post/edit/${post.postID}`);
    };

    if (authLoading || isPreparingPage) {
        return (
            <PageContainer setHelperFocusState={setHelperFocusState}>
                <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-6 sm:px-6 lg:px-8">
                    <SectionContainer
                        title= {I18N_KEYS.USER_DETAIL.COMMON.userDetail_sectionContainerTitle_loading}
                        description={I18N_KEYS.USER_DETAIL.COMMON.userDetail_sectionContainerDesc_loading}
                    >
                        <div className="grid gap-8 lg:grid-cols-[13rem_minmax(0,1fr)] lg:items-center">
                            <div className="mx-auto h-40 w-40 animate-pulse rounded-full bg-bg-shade-100 lg:mx-0 sm:h-48 sm:w-48" />

                            <div className="space-y-4">
                                <div className="h-10 w-2/3 animate-pulse rounded-full bg-bg-shade-100" />
                                <div className="h-5 w-1/3 animate-pulse rounded-full bg-bg-shade-100" />
                                <div className="h-24 w-full animate-pulse rounded-4xl bg-bg-shade-100" />
                                <div className="h-10 w-1/2 animate-pulse rounded-full bg-bg-shade-100" />
                            </div>
                        </div>
                    </SectionContainer>
                </div>
            </PageContainer>
        );
    }

    if (!account) return null;
















    return (
        <PageContainer setHelperFocusState={setHelperFocusState}>
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
                <SectionContainer
                    compact
                    className="overflow-visible"
                    headerRight={
                        <UserHeaderActions
                            isShareDone={isShareDone}
                            onShare={handleShareUserPage}
                            onOpenMenu={handleOpenActionMenu}
                        />
                    }
                >
                    <AvatarGradientPanel avatar={account?.avatar}>
                        <UserProfileContent
                            account={account}
                            isCurrentAccount={isCurrentAccount}
                            isAuthenticated={isAuthenticated}
                            isFollowingAccount={isFollowingAccount}
                            isFollowLoading={isFollowLoading}
                            onToggleFollow={handleToggleFollowAccount}
                            onOpenFollowers={() =>
                                handleOpenRelationshipModal("followers")
                            }
                            onOpenFollowing={() =>
                                handleOpenRelationshipModal("following")
                            }
                            onOpenSavedPosts={handleOpenSavedPostsModal}
                        />
                    </AvatarGradientPanel>
                </SectionContainer>

                <PostSectionContainer
                    title={libraryTitle}
                    description={libraryDescription}
                >
                    {allPosts.length > 0 ? (
                        <PostGrid
                            posts={currentPagePosts}
                            isUnder18={isUnder18}
                            isAlertActive={isAlertActive}
                            visitorIP={visitorIP}
                            clearAlert={clearAlert}
                            enableInfiniteScroll={false}
                            showPagination={totalPostPages > 1}
                            currentPage={postPage}
                            totalPages={totalPostPages}
                            onPageChange={setPostPage}
                            showAuthorInfo={false}
                            viewerIsAuthor={isCurrentAccount}
                            showEditButton={isCurrentAccount}
                            onEditPost={handleEditPost}
                        />
                    ) : (
                        <div className="rounded-4xl bg-main-bg px-6 py-16 text-center shadow-sm">
                            <p className="font-ui text-sm font-bold text-text-shade-400">
                                {isCurrentAccount
                                    ? t(I18N_KEYS.USER_DETAIL.COMMON.userDetail_postSectionContainerText_noPost_userAccount)
                                    : t(I18N_KEYS.USER_DETAIL.COMMON.userDetail_postSectionContainerText_noPost_otherAccount, {displayName: displayName})
                                }
                            </p>
                        </div>
                    )}
                </PostSectionContainer>
            </div>

            <UserActionMenuModal
                isOpen={isActionMenuOpen}
                isCurrentAccount={isCurrentAccount}
                onClose={handleCloseActionMenu}
                onEditProfile={handleEditProfile}
                onOpenSettings={handleOpenSettings}
                onBlock={handleConfirmBlockAccount}
                onReport={handleOpenReportAccount}
            />

            <RelationshipListModal
                isOpen={Boolean(relationshipModalType)}
                type={relationshipModalType || "followers"}
                account={account}
                isCurrentAccount={isCurrentAccount}
                isAuthenticated={isAuthenticated}
                currentUserID={currentUserID}
                items={relationshipItems}
                keyword={relationshipKeyword}
                isLoading={isRelationshipLoading}
                hasMore={relationshipHasMore}
                followLoadingAccountID={relationshipFollowLoadingID}
                onKeywordChange={handleSearchRelationship}
                onLoadMore={handleLoadMoreRelationship}
                onClose={handleCloseRelationshipModal}
                onNavigateUser={handleNavigateRelationshipUser}
                onToggleFollow={handleToggleFollowRelationshipAccount}
            />

            <SavedPostsModal
                isOpen={isSavedPostsModalOpen}
                posts={savedPosts}
                isInitialLoading={isSavedPostInitialLoading}
                hasMore={savedPostHasMore}
                isLoadingMore={isSavedPostLoadingMore}
                isUnder18={isUnder18}
                isAlertActive={isAlertActive}
                visitorIP={visitorIP}
                clearAlert={clearAlert}
                onLoadMore={handleLoadMoreSavedPosts}
                onClose={handleCloseSavedPostsModal}
            />

            <ReportModal
                isOpen={isReportModalOpen}
                targetType="user"
                targetName={displayName}
                onClose={() => setIsReportModalOpen(false)}
                onSubmit={handleSubmitUserReport}
            />
        </PageContainer>
    );
}
