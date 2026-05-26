import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { I18N_KEYS } from "../i18n/key";
import { useAuth } from "../context/AuthContext";
import { useErrorHandler } from "../hooks/useErrorHandler";

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

import { MOCK_USER_DATA_1 } from "../data/User/mockUser1";
import { MOCK_USER_DATA_2 } from "../data/User/mockUser2";
import { MOCK_USER_DATA_3 } from "../data/User/mockUser3";
import { MOCK_POST_DATA_1 } from "../data/Post/mockPost1";
import { MOCK_POST_DATA_2 } from "../data/Post/mockPost2";

const POST_PAGE_SIZE = 12;
const RELATIONSHIP_PAGE_SIZE = 20;

const MOCK_USER_MAP_BY_USERNAME = {
    [MOCK_USER_DATA_1.username]: MOCK_USER_DATA_1,
    [MOCK_USER_DATA_2.username]: MOCK_USER_DATA_2,
    [MOCK_USER_DATA_3.username]: MOCK_USER_DATA_3,
};

const MOCK_USER_MAP_BY_ID = {
    [MOCK_USER_DATA_1.accountID]: MOCK_USER_DATA_1,
    [MOCK_USER_DATA_2.accountID]: MOCK_USER_DATA_2,
    [MOCK_USER_DATA_3.accountID]: MOCK_USER_DATA_3,
};

const MOCK_USER_LIST = [
    MOCK_USER_DATA_1,
    MOCK_USER_DATA_2,
    MOCK_USER_DATA_3,
];

const getAccountID = (value) => {
    if (!value) return "";
    if (typeof value === "string" || typeof value === "number") {
        return String(value);
    }

    return String(value.accountID || value.userID || value.id || "");
};

const getUserDisplayName = (account) => {
    if (!account) return "Người dùng đáng yêu";
    return account.tenHienThi || account.username || "Người dùng đáng yêu";
};

const formatNumber = (value = 0) => {
    return new Intl.NumberFormat("vi-VN").format(Number(value || 0));
};

const buildMockRelationshipUsers = (accountID, type) => {
    const baseUsers = MOCK_USER_LIST.filter(
        (item) => String(item.accountID) !== String(accountID)
    );

    return Array.from({ length: 42 }, (_, index) => {
        const baseUser = baseUsers[index % baseUsers.length];

        return {
            ...baseUser,
            relationshipID: `${type}-${baseUser.accountID}-${index + 1}`,
            accountID: baseUser.accountID,
            username: baseUser.username,
            tenHienThi:
                index < baseUsers.length
                    ? baseUser.tenHienThi
                    : `${baseUser.tenHienThi} ${index + 1}`,

            // TODO: Backend sau này cần trả thêm trường này cho từng account trong follower/following.
            // Đây là trạng thái "user đang đăng nhập có theo dõi account này hay không".
            daTheoDoi: type === "following" ? true : index % 2 === 0,
        };
    });
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









export default function UserDetail({
    setGlobalModal,
    addHelperError,
    setHelperFocusState,
    isUnder18,
    isAlertActive,
    visitorIP,
    clearAlert,
}) {

    const { t, i18n } = useTranslation();

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

    const isCurrentAccount = Boolean(
        isAuthenticated &&
            currentUserID &&
            account?.accountID &&
            String(currentUserID) === String(account.accountID)
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

    const handleFetchAccountDetail = useCallback(async () => {
        // TODO: gọi backend lấy thông tin account theo username.
        // const response = await userApi.getUserDetailByUsername(username);
        // return response.data;

        await Promise.resolve();

        return MOCK_USER_MAP_BY_USERNAME[String(username)] || null;
    }, [username]);

    const handleVerifyBlocking = useCallback(async (targetAccountID) => {
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

    const handleFetchAccountPosts = useCallback(async (targetAccountID) => {
        // TODO: gọi backend lấy danh sách post của account.
        // Backend gợi ý nhận:
        // - accountID
        // - page
        // - pageSize
        //
        // Trong bản mock đang lấy hết rồi tự phân trang FE.

        await Promise.resolve();

        return buildMockAccountPosts(targetAccountID);
    }, []);

    const handleFetchRelationshipPage = useCallback(async ({
        targetAccountID,
        type,
        keyword,
        page,
    }) => {
        // TODO: gọi backend lấy danh sách follower/following.
        // Backend gợi ý nhận:
        // - accountID: targetAccountID
        // - type: "followers" | "following"
        // - keyword
        // - page
        // - pageSize: RELATIONSHIP_PAGE_SIZE
        //
        // Response gợi ý:
        // {
        //   items: [...],
        //   hasMore: true/false
        // }

        await Promise.resolve();

        const allMockItems = buildMockRelationshipUsers(targetAccountID, type);

        const normalizedKeyword = keyword.trim().toLowerCase();

        const filteredItems = normalizedKeyword
            ? allMockItems.filter((item) => {
                  const displayName = getUserDisplayName(item).toLowerCase();
                  const username = String(item.username || "").toLowerCase();

                  return (
                      displayName.includes(normalizedKeyword) ||
                      username.includes(normalizedKeyword)
                  );
              })
            : allMockItems;

        const startIndex = (page - 1) * RELATIONSHIP_PAGE_SIZE;
        const nextItems = filteredItems.slice(
            startIndex,
            startIndex + RELATIONSHIP_PAGE_SIZE
        );

        return {
            items: nextItems,
            hasMore: startIndex + RELATIONSHIP_PAGE_SIZE < filteredItems.length,
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
                    String(currentUserID) === String(fetchedAccount.accountID)
            );

            if (isAuthenticated && !isViewingSelf) {
                const isBlocked = await handleVerifyBlocking(
                    fetchedAccount.accountID
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

            const fetchedPosts = await handleFetchAccountPosts(
                fetchedAccount.accountID
            );

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

    const handleToggleFollowAccount = async () => {
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
            // TODO: gọi backend follow/unfollow account.accountID.
            // const response = nextFollowing
            //     ? await userApi.followUser(account.accountID)
            //     : await userApi.unfollowUser(account.accountID);
            //
            // Nếu backend trả trạng thái cuối:
            // setIsFollowingAccount(Boolean(response.data.daTheoDoi));

            await Promise.resolve();
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

    const handleToggleFollowRelationshipAccount = async (targetAccount) => {
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
        const previousFollowing = Boolean(targetAccount.daTheoDoi);
        const nextFollowing = !previousFollowing;

        setRelationshipFollowLoadingID(targetRelationshipID);

        setRelationshipItems((prev) =>
            prev.map((item) => {
                const isSameItem = item.relationshipID
                    ? item.relationshipID === targetRelationshipID
                    : String(item.accountID) === String(targetAccountID);

                if (!isSameItem) return item;

                return {
                    ...item,
                    daTheoDoi: nextFollowing,
                };
            })
        );

        try {
            // TODO: gọi backend follow/unfollow account trong danh sách follower/following.
            // const response = nextFollowing
            //     ? await userApi.followUser(targetAccountID)
            //     : await userApi.unfollowUser(targetAccountID);
            //
            // Nếu backend trả trạng thái cuối:
            // const finalFollowing = Boolean(response.data.daTheoDoi);
            // setRelationshipItems((prev) =>
            //     prev.map((item) =>
            //         item.relationshipID === targetRelationshipID
            //             ? { ...item, daTheoDoi: finalFollowing }
            //             : item
            //     )
            // );
            // Mỗi cái account nên có
            // accountID,
            // username,
            // tenHienThi,
            // avatar,
            // tieuSu,
            // daTheoDoi

            await Promise.resolve();
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

    const handleOpenReportFlow = async () => {
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

    const handleSubmitUserReport = async ({ reason, description }) => {
        if (!account) return;

        try {
            // TODO: gọi backend tạo báo cáo tài khoản.
            // Backend gợi ý nhận:
            // {
            //   targetAccountID: account.accountID,
            //   mucBaoCao: reason,
            //   noiDung: description
            // }

            await Promise.resolve({
                targetAccountID: account.accountID,
                mucBaoCao: reason,
                noiDung: description,
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

    const handleBlockAccount = async () => {
        if (!account) return;

        if (!isAuthenticated) {
            handleRequireLogin(I18N_KEYS.USER_DETAIL.HANDLE.PREPARE_PAGE.userDetail_preparePageAndRequireLogin_modalDesc_requireLogin_block);
            return;
        }

        try {
            // TODO: gọi backend chặn account.accountID.
            // await userApi.blockUser(account.accountID);

            await Promise.resolve();

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
        handlePrepareUserDetailPage();
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
        } catch (error) {
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
                targetAccountID: account.accountID,
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
                targetAccountID: account.accountID,
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
                targetAccountID: account.accountID,
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
        const targetUsername = String(targetUser?.username || "").split("-")[0];

        if (!targetUsername) return;

        handleCloseRelationshipModal();
        navigate(`/user/${targetUsername}`);
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