import { useCallback, useEffect, useRef, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { I18N_KEYS } from "../i18n/key";
import { useAuth } from "../context/AuthContext";
import { useErrorHandler } from "../hooks/useErrorHandler";

import PageContainer from "../components/PageContainer";
import SectionContainer from "../components/SectionContainer";
import PostSectionContainer from "../components/PostSectionContainer";
import PostGrid from "../components/PostGrid";
import Button from "../components/Button";

import PostDetailSkeleton from "../components/PostDetailSkeleton";
import RestrictedMediaPreview from "../components/RestrictedMediaPreview";
import PostDetailMediaViewer from "../components/PostDetailMediaViewer";
import PostAuthorCard from "../components/PostAuthorCard";
import PostInfoPanel from "../components/PostInfoPanel";
import PostActionBar from "../components/PostActionBar";
import PostCommentPanel from "../components/PostCommentPanel";
import ReportModal from "../components/ReportModal";
import CommentComposerModal from "../components/CommentComposerModal";

import { MOCK_USER_DATA_1 } from "../data/User/mockUser1";
import { MOCK_USER_DATA_2 } from "../data/User/mockUser2";
import { MOCK_USER_DATA_3 } from "../data/User/mockUser3";
import { MOCK_POST_DATA_1 } from "../data/Post/mockPost1";
import { MOCK_POST_DATA_2 } from "../data/Post/mockPost2";



    //--------------------------QUAN TRỌNG: TỐI THIỂU PAGE CẦN NHẬN MẤY CÁI THAM SỐ NI CỦA POST NÀY:-----------------------
            // {
            // postID,
            // tieuDe,
            // moTa,
            // ngayDang,
            // dynamicWM,
            // tacGia,
            // luotXem,
            // luotThich,
            // daThich,
            // daLuu,
            // daTheoDoiTacGia,
            // sanPhamAI,
            // hanCheHienThi,
            // choPhepComment,
            // daXemXetBaoCao,
            // congKhai,
            // lstGanThe,
            // lstKTEOFile
            // }

            //Bên comment thì cx cần thêm cái daThich (true/false) với luotThich (int) nữa
        







    //------------------------Hằng số thể hiện quan trọng--------------------------

const COMMENT_PAGE_SIZE = 8;
const REPLY_PAGE_SIZE = 6;

const COMMENT_COMPOSER_TYPE = {
    POST: "POST",
    REPLY: "REPLY",
};

const getLikeMoodText = (likeCount = 0) => {
    if (likeCount <= 0) return I18N_KEYS.POST_DETAIL.COMMON.postDetail_likeMoodText_range1;
    if (likeCount < 5) return I18N_KEYS.POST_DETAIL.COMMON.postDetail_likeMoodText_range2;
    if (likeCount < 20) return I18N_KEYS.POST_DETAIL.COMMON.postDetail_likeMoodText_range3;
    if (likeCount < 100) return I18N_KEYS.POST_DETAIL.COMMON.postDetail_likeMoodText_range4;
    if (likeCount < 500) return I18N_KEYS.POST_DETAIL.COMMON.postDetail_likeMoodText_range5;
    if (likeCount < 1000) return I18N_KEYS.POST_DETAIL.COMMON.postDetail_likeMoodText_range6;

    return I18N_KEYS.POST_DETAIL.COMMON.postDetail_likeMoodText_range7;
};

        //------------------------HẾT Hằng số thể hiện quan trọng--------------------------





        
        //-----------------------------Hàm linh tinh liên quan tới áp dữ liệu giả bên mock data vô test tạm--------------------------
const MOCK_USER_MAP = {
    [MOCK_USER_DATA_1.accountID]: MOCK_USER_DATA_1,
    [MOCK_USER_DATA_2.accountID]: MOCK_USER_DATA_2,
    [MOCK_USER_DATA_3.accountID]: MOCK_USER_DATA_3,
};


const getAccountID = (value) => {
    if (!value) return "";
    if (typeof value === "string" || typeof value === "number") return String(value);

    return String(value.accountID || value.userID || value.id || "");
};

const getUserByID = (accountID) => {
    return MOCK_USER_MAP[String(accountID)] || null;
};

const getUserDisplayName = (user) => {
    if (!user) return "Người dùng đáng yêu";

    return user.tenHienThi || user.username || "Người dùng đáng yêu";
};

        //-----------------------------HẾT Hàm linh tinh liên quan tới áp dữ liệu giả bên mock data vô test tạm--------------------------



const normalizeComment = (comment, currentUserID) => {
    const author = getUserByID(comment.nguoiViet);

    return {
        ...comment,
        commentID: String(comment.commentID),
        commentCha: comment.commentCha === null || comment.commentCha === undefined
            ? null
            : String(comment.commentCha),
        author,
        likeCount: comment.lstThichComment?.length || 0,
        isLikedByCurrentUser: Boolean(
            currentUserID &&
            comment.lstThichComment?.map(String).includes(String(currentUserID))
        ),
    };
};

const buildCommentTreeData = (flatComments = [], currentUserID) => {
    const normalizedComments = flatComments.map((comment) => normalizeComment(comment, currentUserID));

    const rootComments = normalizedComments.filter((comment) => !comment.commentCha);

    const repliesByParentID = normalizedComments.reduce((result, comment) => {
        if (!comment.commentCha) return result;

        if (!result[comment.commentCha]) {
            result[comment.commentCha] = [];
        }

        result[comment.commentCha].push(comment);
        return result;
    }, {});

    const replyCountByCommentID = rootComments.reduce((result, comment) => {
        result[comment.commentID] = repliesByParentID[comment.commentID]?.length || 0;
        return result;
    }, {});

    return {
        rootComments,
        repliesByParentID,
        replyCountByCommentID,
    };
};

const reorderCommentsForFocus = (flatComments = [], focusedCommentID) => {
    if (!focusedCommentID) return flatComments;

    const focusedComment = flatComments.find(
        (comment) => String(comment.commentID) === String(focusedCommentID)
    );

    if (!focusedComment) return flatComments;

    const focusedRootID = focusedComment.commentCha
        ? String(focusedComment.commentCha)
        : String(focusedComment.commentID);

    return [...flatComments].sort((a, b) => {
        const aRootID = a.commentCha ? String(a.commentCha) : String(a.commentID);
        const bRootID = b.commentCha ? String(b.commentCha) : String(b.commentID);

        if (aRootID === focusedRootID && bRootID !== focusedRootID) return -1;
        if (aRootID !== focusedRootID && bRootID === focusedRootID) return 1;

        if (String(a.commentID) === String(focusedCommentID)) return -1;
        if (String(b.commentID) === String(focusedCommentID)) return 1;

        return 0;
    });
};

//Hết đống làm lại dữ liệu cho chuẩn








export default function PostDetail({
    setGlobalModal,
    addHelperError,
    setHelperFocusState,
    triggerMascotMood,
    isUnder18,
    isAlertActive,
    visitorIP,
    clearAlert,
}) {
    const { t, i18n } = useTranslation();
    const { handleError } = useErrorHandler();
    const { loading: authLoading, user, isAuthenticated } = useAuth();

    const navigate = useNavigate();
    const location = useLocation();
    const params = useParams();

    const preparedPageKeyRef = useRef("");

    const postID = params.postID || params.id || "2";

    const [post, setPost] = useState(null);
    const [isPreparingPage, setIsPreparingPage] = useState(true);
    const mediaSectionRef = useRef(null);

    const [isFollowingAuthor, setIsFollowingAuthor] = useState(false);
    const [isFollowLoading, setIsFollowLoading] = useState(false);

    const [isPostLiked, setIsPostLiked] = useState(false);
    const [isPostSaved, setIsPostSaved] = useState(false);
    const [isLikeLoading, setIsLikeLoading] = useState(false);
    const [isSaveLoading, setIsSaveLoading] = useState(false);
    const [isShareDone, setIsShareDone] = useState(false);
    const [likeCount, setLikeCount] = useState(0);

    const [revealedRestrictedPostIDs, setRevealedRestrictedPostIDs] = useState(() => new Set());
    const [expandedMediaPostIDs, setExpandedMediaPostIDs] = useState(() => new Set());

    const [flatComments, setFlatComments] = useState([]);
    const [visibleRootCommentCount, setVisibleRootCommentCount] = useState(COMMENT_PAGE_SIZE);
    const [isFetchingMoreComments, setIsFetchingMoreComments] = useState(false);

    const [expandedCommentIDs, setExpandedCommentIDs] = useState(new Set());
    const [replyPagesByCommentID, setReplyPagesByCommentID] = useState({});
    const [isFetchingRepliesByCommentID, setIsFetchingRepliesByCommentID] = useState({});

    const [allRelatedPosts, setAllRelatedPosts] = useState([
        MOCK_POST_DATA_1,
        MOCK_POST_DATA_2,
        MOCK_POST_DATA_1,
        MOCK_POST_DATA_2,
        MOCK_POST_DATA_1,
        MOCK_POST_DATA_2,
        MOCK_POST_DATA_1,
        MOCK_POST_DATA_2,
        MOCK_POST_DATA_1,
        MOCK_POST_DATA_2,
        MOCK_POST_DATA_1,
        MOCK_POST_DATA_2,
        MOCK_POST_DATA_1,
        MOCK_POST_DATA_2,
        MOCK_POST_DATA_1,
        MOCK_POST_DATA_2,
    ]);

    const [isReportModalOpen, setIsReportModalOpen] = useState(false);

    const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
    const [commentComposerContext, setCommentComposerContext] = useState({
        type: COMMENT_COMPOSER_TYPE.POST,
        parentComment: null,
    });

    const currentUserID = getAccountID(user);

    const focusedCommentID = useMemo(() => {
        const searchParams = new URLSearchParams(location.search);
        return searchParams.get("comment");
    }, [location.search]);

    const preparePageKey = useMemo(() => {
        return `${postID}__${focusedCommentID || ""}__${isAuthenticated ? "in" : "out"}__${currentUserID || ""}`;
    }, [postID, focusedCommentID, isAuthenticated, currentUserID]);

    const author = useMemo(() => {
        if (!post) return null;
        return getUserByID(post.tacGia);
    }, [post]);

    const authorID = post?.tacGia ? String(post.tacGia) : "";

    const isCurrentUserAuthor = Boolean(
        currentUserID &&
        authorID &&
        String(currentUserID) === String(authorID)
    );

    const {
        rootComments,
        repliesByParentID,
        replyCountByCommentID,
    } = useMemo(() => {
        return buildCommentTreeData(flatComments, currentUserID);
    }, [flatComments, currentUserID]);

    const visibleRootComments = useMemo(() => {
        return rootComments.slice(0, visibleRootCommentCount);
    }, [rootComments, visibleRootCommentCount]);

    const [hasMoreCommentsFromBackend, setHasMoreCommentsFromBackend] = useState(false);
    const [commentPage, setCommentPage] = useState(1);
    const hasMoreComments = hasMoreCommentsFromBackend;

    const visibleRepliesByCommentID = useMemo(() => {
        return rootComments.reduce((result, comment) => {
            const commentID = String(comment.commentID);
            const page = replyPagesByCommentID[commentID] || 0;
            const allReplies = repliesByParentID[commentID] || [];

            result[commentID] = allReplies.slice(0, page * REPLY_PAGE_SIZE);
            return result;
        }, {});
    }, [replyPagesByCommentID, repliesByParentID, rootComments]);

    const hasMoreRepliesByCommentID = useMemo(() => {
        return rootComments.reduce((result, comment) => {
            const commentID = String(comment.commentID);
            const allReplies = repliesByParentID[commentID] || [];
            const visibleReplies = visibleRepliesByCommentID[commentID] || [];

            result[commentID] = visibleReplies.length < allReplies.length;
            return result;
        }, {});
    }, [repliesByParentID, rootComments, visibleRepliesByCommentID]);

    const isShowingAllMedia = Boolean(
        post?.postID &&
        expandedMediaPostIDs.has(String(post.postID))
    );

    const visibleFiles = useMemo(() => {
        if (!post?.lstKTEOFile?.length) return [];
        if (isShowingAllMedia) return post.lstKTEOFile;

        return [post.lstKTEOFile[0]];
    }, [post, isShowingAllMedia]);

    
    const shouldShowRestrictedPreview = Boolean(
        // Lưu ý: hiện đang coi 2 = R-18, 3 = R-18G. Khi backend chốt enum thì đổi lại.
        (post?.hanCheHienThi === 2 || post?.hanCheHienThi === 3)  &&
        !revealedRestrictedPostIDs.has(String(post.postID))
    );


    const handleCloseGlobalModal = useCallback(() => {
        setGlobalModal?.((prev) => ({
            ...prev,
            isOpen: false,
        }));
    }, [setGlobalModal]);

    const handleRequireLogin = useCallback((description = I18N_KEYS.POST_DETAIL.HANDLE.REQUIRE_LOGIN.postDetail_handleRequireLogin_modalDesc_needToLoginDefault) => {
        setGlobalModal?.({
            isOpen: true,
            type: "two-buttons",
            title: I18N_KEYS.POST_DETAIL.HANDLE.REQUIRE_LOGIN.postDetail_handleRequireLogin_modalTitle_needToLogin,
            description: description,
            primaryBtnText: I18N_KEYS.POST_DETAIL.HANDLE.REQUIRE_LOGIN.postDetail_handleRequireLogin_modalButton_toLogin,
            secondaryBtnText: I18N_KEYS.POST_DETAIL.HANDLE.REQUIRE_LOGIN.postDetail_handleRequireLogin_modalButton_back,
            onPrimaryAction: () => {
                const redirectPath = `${location.pathname}${location.search || ""}`;

                navigate(`/login?redirect=${encodeURIComponent(redirectPath)}`);
                handleCloseGlobalModal();
            },
            onSecondaryAction: handleCloseGlobalModal,
        });
    }, [
        handleCloseGlobalModal,
        location.pathname,
        location.search,
        navigate,
        setGlobalModal,
        t,
    ]);


















    //------------------- CÁC TODO BACKEND CẦN QUAN TÂM -------------------
    // Các hàm dưới đây là những điểm FE đang mock hoặc sẽ gọi API thật.

    const handleFetchPostDetail = useCallback(async () => {
        // TODO: lấy thông tin Post
        // const response = await api.getPostDetail(postID);
        // return response.data;

        //Thành gọi axios hay chi đó thì cứ thế vô chỗ Promise.resolve(); ni
        await Promise.resolve();

        //Lấy đại mock 1 đó trả cái thiệt nghe
        return MOCK_POST_DATA_1;
    }, []);

    const handleVerifyBlocking = useCallback(async () => {
        // TODO: gọi backend kiểm tra người xem và tác giả có chặn lẫn nhau không.
        // return await api.getIsChan({id1: currentUserID, id2: post.tacGia})
        await Promise.resolve();

        return false;
    }, []);

    const handleFetchInitialComments = useCallback(async (targetPostID) => { //Hàm lấy trang cmt đầu để load page
        try {
            // TODO: gọi backend lấy trang comment gốc đầu tiên.
            // Backend nên nhận:
            // - postID: targetPostID
            // - page: 1
            // - pageSize: COMMENT_PAGE_SIZE
            // - focusCommentID: focusedCommentID || null
            //
            // Nếu focusCommentID là reply, backend nên trả về comment cha + reply đó.
            // Nếu focusCommentID là comment gốc, backend nên trả comment đó ở đầu.
            //
            // Response gợi ý:
            // {
            //   comments: [...rootCommentsAndMaybeFocusedParent],
            //   hasMore: true/false
            // }

            await Promise.resolve();

            // Mock tạm trong lúc chưa có backend:
            return {
                comments: reorderCommentsForFocus(
                    MOCK_POST_DATA_1.lstComment || [],
                    focusedCommentID
                ),
                hasMore: false,
            };
        } catch (error) {
            const errorData = error.response?.data;
            const result = handleError(errorData);

            if (result && !result.handled) {
                switch (result.code) {
                    default:
                        addHelperError({
                            id: Date.now(),
                            code: I18N_KEYS.GLOBAL_ERROR.ERROR_unknownError,
                        });
                        break;
                }
            }

            return {
                comments: [],
                hasMore: false,
            };
        }
    }, [addHelperError, focusedCommentID, handleError]);


    const handlePreparePostDetailPage = useCallback(async () => { //Hàm ktra tiền điều kiện trc khi cho coi
        if (authLoading) return;

        if (preparedPageKeyRef.current === preparePageKey && post) {
            return;
        }

        preparedPageKeyRef.current = preparePageKey;

        setIsPreparingPage(true);

        try {
            const fetchedPost = await handleFetchPostDetail();

            if (!fetchedPost?.hanCheHienThi === 0) { //Post tạm ẩn bn đặt đại là 0 hế
                navigate("/", { replace: true });

                setGlobalModal?.({
                    isOpen: true,
                    type: "one-button",
                    title: I18N_KEYS.POST_DETAIL.HANDLE.PREPARE_PAGE.postDetail_handlePreparePostDetailPage_modalTitle_hiddenPost,
                    description: I18N_KEYS.POST_DETAIL.HANDLE.PREPARE_PAGE.postDetail_handlePreparePostDetailPage_modalDesc_hiddenPost,
                    primaryBtnText: I18N_KEYS.POST_DETAIL.HANDLE.PREPARE_PAGE.postDetail_handlePreparePostDetailPage_modalButton_hiddenPost,
                    onPrimaryAction: handleCloseGlobalModal,
                });

                return;
            }

            if (!fetchedPost?.congKhai) { //Post riêng tư
                navigate("/", { replace: true });

                setGlobalModal?.({
                    isOpen: true,
                    type: "one-button",
                    title: I18N_KEYS.POST_DETAIL.HANDLE.PREPARE_PAGE.postDetail_handlePreparePostDetailPage_modalTitle_privatePost,
                    description: I18N_KEYS.POST_DETAIL.HANDLE.PREPARE_PAGE.postDetail_handlePreparePostDetailPage_modalDesc_privatePost,
                    primaryBtnText: I18N_KEYS.POST_DETAIL.HANDLE.PREPARE_PAGE.postDetail_handlePreparePostDetailPage_modalButton_privatePost,
                    onPrimaryAction: handleCloseGlobalModal,
                });

                return;
            }

            if (isAuthenticated) {
                const isBlocked = await handleVerifyBlocking(fetchedPost.tacGia);

                if (isBlocked) { // Người dùng vs tác giả chặn lẫn nhau
                    navigate("/", { replace: true });

                    setGlobalModal?.({
                        isOpen: true,
                        type: "one-button",
                        title: I18N_KEYS.POST_DETAIL.HANDLE.PREPARE_PAGE.postDetail_handlePreparePostDetailPage_modalTitle_authorBlocked,
                        description: I18N_KEYS.POST_DETAIL.HANDLE.PREPARE_PAGE.postDetail_handlePreparePostDetailPage_modalDesc_authorBlocked,
                        primaryBtnText: I18N_KEYS.POST_DETAIL.HANDLE.PREPARE_PAGE.postDetail_handlePreparePostDetailPage_modalButton_authorBlocked,
                        onPrimaryAction: handleCloseGlobalModal,
                    });

                    return;
                }
            }

            const initialCommentResult = await handleFetchInitialComments(fetchedPost.postID); //Lấy comment trang đầu


            setPost(fetchedPost);

            //Mấy ni thành làm entity đặt tên chi thì đổi lại hế
            setLikeCount(Number(fetchedPost.luotThich || 0));
            setIsPostLiked(Boolean(fetchedPost.daThich));
            setIsPostSaved(Boolean(fetchedPost.daLuu));
            setIsFollowingAuthor(Boolean(fetchedPost.daTheoDoiTacGia));

            setFlatComments(initialCommentResult.comments || []);
            setCommentPage(1);
            setHasMoreCommentsFromBackend(Boolean(initialCommentResult.hasMore));
            setVisibleRootCommentCount(COMMENT_PAGE_SIZE);

            if (focusedCommentID) { //Để làm nổi bật cái cmt trên url share
                const focusedComment = (initialCommentResult.comments || []).find(
                    (comment) => String(comment.commentID) === String(focusedCommentID)
                );

                if (focusedComment?.commentCha) {
                    const parentID = String(focusedComment.commentCha);

                    setExpandedCommentIDs(new Set([parentID]));
                    setReplyPagesByCommentID({
                        [parentID]: 1,
                    });
                } else {
                    setExpandedCommentIDs(new Set());
                    setReplyPagesByCommentID({});
                }
            } else {
                setExpandedCommentIDs(new Set());
                setReplyPagesByCommentID({});
            }
        } catch (error) {
            const errorData = error.response?.data;
            const result = handleError(errorData);

            if (result && !result.handled) {
                switch (result.code) {
                    default:
                        addHelperError({
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
        handleFetchInitialComments,
        focusedCommentID,
        handleCloseGlobalModal,
        handleFetchPostDetail,
        handleVerifyBlocking,
        handleError,
        isAuthenticated,
        navigate,
        setGlobalModal,
        preparePageKey,
        post,
        t,
    ]);

    const handleShowAllMedia = () => { //Bấm xem tất cả các ảnh
        if (!post?.postID) return;

        setExpandedMediaPostIDs((prev) => {
            const next = new Set(prev);
            next.add(String(post.postID));
            return next;
        });
    };

    const handleCollapseMedia = () => { //Bấm thu gọn tất cả các ảnh
        if (!post?.postID) return;

        setExpandedMediaPostIDs((prev) => {
            const next = new Set(prev);
            next.delete(String(post.postID));
            return next;
        });

        window.requestAnimationFrame(() => {
            const top = mediaSectionRef.current?.getBoundingClientRect().top || 0;

            window.scrollTo({
                top: window.scrollY + top - 96,
                behavior: "smooth",
            });
        });
    };

    useEffect(() => {
        handlePreparePostDetailPage();
    }, [handlePreparePostDetailPage]);




    const handleToggleFollowAuthor = async () => { //Hàm theo dõi/bỏ theo dõi tác giả
        if (!isAuthenticated) {
            handleRequireLogin(I18N_KEYS.POST_DETAIL.HANDLE.REQUIRE_LOGIN.postDetail_handleRequireLogin_modalDesc_needToLoginFollow);
            return;
        }

        if (isFollowLoading) return;

        const previousFollowing = isFollowingAuthor;
        const nextFollowing = !previousFollowing;

        setIsFollowLoading(true);
        setIsFollowingAuthor(nextFollowing);

        try {
            // TODO: gọi backend follow/unfollow authorID.
            // Nếu backend trả trạng thái cuối:
            // const response = nextFollowing
            //     ? await followApi.followAuthor(authorID)
            //     : await followApi.unfollowAuthor(authorID);
            //
            // setIsFollowingAuthor(Boolean(response.data.daTheoDoiTacGia));

            await Promise.resolve();
        } catch (error) {
            setIsFollowingAuthor(previousFollowing);

            const errorData = error.response?.data;
            const result = handleError(errorData);

            if (result && !result.handled) {
                switch (result.code) {
                    default:
                        addHelperError({
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

    const handleTogglePostLike = async () => { //Hàm thích vs bỏ thích post
        if (!isAuthenticated) {
            handleRequireLogin(I18N_KEYS.POST_DETAIL.HANDLE.REQUIRE_LOGIN.postDetail_handleRequireLogin_modalDesc_needToLoginPostLike);
            return;
        }

        if (isLikeLoading) return;

        const previousLiked = isPostLiked;
        const previousLikeCount = likeCount;

        const nextLiked = !previousLiked;

        setIsLikeLoading(true);
        setIsPostLiked(nextLiked);
        setLikeCount((prev) => Math.max(0, prev + (nextLiked ? 1 : -1)));

        try {
            // TODO: gọi backend like/unlike post.postID.
            // Gợi ý:
            // const response = nextLiked
            //     ? await postApi.likePost(post.postID)
            //     : await postApi.unlikePost(post.postID);
            //
            // Nếu backend trả số mới:
            // setIsPostLiked(Boolean(response.data.daThich));
            // setLikeCount(Number(response.data.luotThich || 0));

            await Promise.resolve();


        } catch (error) {
            setIsPostLiked(previousLiked);
            setLikeCount(previousLikeCount);

            const errorData = error.response?.data;
            const result = handleError(errorData);

            if (result && !result.handled) {
                switch (result.code) {
                    default:
                        addHelperError({
                            id: Date.now(),
                            code: I18N_KEYS.GLOBAL_ERROR.ERROR_unknownError,
                        });
                        break;
                }
            }
        } finally {
            setIsLikeLoading(false);
        }
    };

    const handleTogglePostSave = async () => { //Hàm lưu/bỏ lưu post
        if (!isAuthenticated) {
            handleRequireLogin(I18N_KEYS.POST_DETAIL.HANDLE.REQUIRE_LOGIN.postDetail_handleRequireLogin_modalDesc_needToLoginPostSave);
            return;
        }

        if (isSaveLoading) return;

        const previousSaved = isPostSaved;
        const nextSaved = !previousSaved;

        setIsSaveLoading(true);
        setIsPostSaved(nextSaved);

        try {
            // TODO: gọi backend save/unsave post.postID.
            // Nếu backend trả trạng thái cuối:
            // const response = nextSaved
            //     ? await postApi.savePost(post.postID)
            //     : await postApi.unsavePost(post.postID);
            //
            // setIsPostSaved(Boolean(response.data.daLuu));

            await Promise.resolve();
        } catch (error) {
            setIsPostSaved(previousSaved);

            const errorData = error.response?.data;
            const result = handleError(errorData);

            if (result && !result.handled) {
                switch (result.code) {
                    default:
                        addHelperError({
                            id: Date.now(),
                            code: I18N_KEYS.GLOBAL_ERROR.ERROR_unknownError,
                        });
                        break;
                }
            }
        } finally {
            setIsSaveLoading(false);
        }
    };

    const handleSharePost = async () => { //Hàm copy link post, ni bên FE thôi chơ k cần chi gọi BE mô
        try {
            await navigator.clipboard.writeText(window.location.href);

            setIsShareDone(true);

            addHelperError?.({
                id: Date.now(),
                code: I18N_KEYS.POST_DETAIL.HANDLE.SHARE_POST.postDetail_handleSharePost_helper_success_copyLink,
            });

            window.setTimeout(() => {
                setIsShareDone(false);
            }, 2000);
        } catch (error) {
            addHelperError?.({
                id: Date.now(),
                code: I18N_KEYS.POST_DETAIL.HANDLE.SHARE_POST.postDetail_handleSharePost_helper_error_copyLink,
            });
        }
    };

    const handleOpenReportFlow = async () => { // Luồng báo cáo
        if (!isAuthenticated) {
            handleRequireLogin(I18N_KEYS.POST_DETAIL.HANDLE.REQUIRE_LOGIN.postDetail_handleRequireLogin_modalDesc_needToLoginReport);
            return;
        }

        try {
            // TODO: gọi backend kiểm tra người dùng đã từng báo cáo post này chưa.
            // const hasReportedBefore = await api.getIsPostReported({idAccount: currentUserID, idPost: post.postID})
            const hasReportedBefore = false;

            if (hasReportedBefore) {
                setGlobalModal?.({
                    isOpen: true,
                    type: "one-button",
                    title: I18N_KEYS.POST_DETAIL.HANDLE.POST_REPORT.postDetail_handleReport_modalTitle_hasReportedBefore,
                    description: I18N_KEYS.POST_DETAIL.HANDLE.POST_REPORT.postDetail_handleReport_modalDesc_hasReportedBefore,
                    primaryBtnText: I18N_KEYS.POST_DETAIL.HANDLE.POST_REPORT.postDetail_handleReport_modalButton_hasReportedBefore,
                    onPrimaryAction: handleCloseGlobalModal,
                });

                return;
            }

            setIsReportModalOpen(true); // Chưa báo cáo thì hn mở cái modal cho chọn vs nhập đồ
        } catch (error) {
            const errorData = error.response?.data;
            const result = handleError(errorData);

            if (result && !result.handled) {
                switch (result.code) {
                    default:
                        addHelperError({
                            id: Date.now(),
                            code: I18N_KEYS.GLOBAL_ERROR.ERROR_unknownError,
                        });
                        break;
                }
            }
        }
    };

    const handleSubmitPostReport = async ({ reason, description }) => { //Hàm gửi báo cáo thiệt này
        try {
            // TODO: gọi backend tạo báo cáo.
            await Promise.resolve({
                postID: post?.postID,
                mucBaoCao: reason,
                noiDung: description,
            });

            setIsReportModalOpen(false);

            setGlobalModal?.({
                isOpen: true,
                type: "one-button",
                title: I18N_KEYS.POST_DETAIL.HANDLE.POST_REPORT.postDetail_handleReport_modalTitle_reported,
                description: I18N_KEYS.POST_DETAIL.HANDLE.POST_REPORT.postDetail_handleReport_modalDesc_reported,
                primaryBtnText: I18N_KEYS.POST_DETAIL.HANDLE.POST_REPORT.postDetail_handleReport_modalButton_reported,
                onPrimaryAction: handleCloseGlobalModal,
            });
        } catch (error) {
            const errorData = error.response?.data;
            const result = handleError(errorData);

            if (result && !result.handled) {
                switch (result.code) {
                    //Kịch bản post đang tạm ẩn rồi
                    case "POST_HIDDEN":
                        addHelperError({
                            id: Date.now(),
                            code: I18N_KEYS.POST_DETAIL.HANDLE.POST_REPORT.postDetail_handleReport_helper_error_postHidden,
                        });
                        navigate("/");
                        break;
                    //Kịch bản mục báo cáo rỗng
                    case "MUCBAOCAO_NULL":
                        addHelperError({
                            id: Date.now(),
                            code: I18N_KEYS.POST_DETAIL.HANDLE.POST_REPORT.postDetail_handleReport_helper_error_nullMucBaoCao,
                        })
                        break;
                    //Kịch bản nội dung rỗng
                    case "NOIDUNG_NULL":
                        addHelperError({
                            id: Date.now(),
                            code: I18N_KEYS.POST_DETAIL.HANDLE.POST_REPORT.postDetail_handleReport_helper_error_nullNoiDung,
                        })
                        break;
                    //Kịch bản mục báo cáo tầm bậy
                    case "MUCBAOCAO_WRONG_TYPE":
                        addHelperError({
                            id: Date.now(),
                            code: I18N_KEYS.POST_DETAIL.HANDLE.POST_REPORT.postDetail_handleReport_helper_error_typeMismatchMucBaoCao,
                        })
                        break;
                    //Kịch bản nội dung quá dài
                    case "NOIDUNG_TOO_LONG":
                        addHelperError({
                            id: Date.now(),
                            code: I18N_KEYS.POST_DETAIL.HANDLE.POST_REPORT.postDetail_handleReport_helper_error_noiDungTooLong,
                        })
                        break;
                    default:
                        addHelperError({
                            id: Date.now(),
                            code: I18N_KEYS.GLOBAL_ERROR.ERROR_unknownError,
                        });
                        break;
                }
            }
        }
    };

    const handleFetchNextCommentPage = async () => { //Hàm lấy trang sau của comment
        if (isFetchingMoreComments || !hasMoreComments) return;

        setIsFetchingMoreComments(true);

        try {
            const nextPage = commentPage + 1;

            // TODO: gọi backend lấy comment gốc trang tiếp theo.
            // const response = await commentApi.getRootComments({
            //     postID: post.postID,
            //     page: nextPage,
            //     pageSize: COMMENT_PAGE_SIZE,
            // });
            //
            // const nextComments = response.data.comments;
            // const hasMore = response.data.hasMore;

            await Promise.resolve();

            // Mock tạm:
            const nextComments = [];
            const hasMore = false;

            setFlatComments((prev) => [...prev, ...nextComments]);
            setCommentPage(nextPage);
            setHasMoreCommentsFromBackend(Boolean(hasMore));
        } catch (error) {
            const errorData = error.response?.data;
            const result = handleError(errorData);

            if (result && !result.handled) {
                switch (result.code) {
                    default:
                        addHelperError({
                            id: Date.now(),
                            code: I18N_KEYS.GLOBAL_ERROR.ERROR_unknownError,
                        });
                        break;
                }
            }
        } finally {
            setIsFetchingMoreComments(false);
        }
    };

    const handleToggleReplies = async (comment) => { //Hàm xem/ẩn mớ cmt trả lời
        const commentID = String(comment.commentID);

        if (expandedCommentIDs.has(commentID)) {
            setExpandedCommentIDs((prev) => {
                const next = new Set(prev);
                next.delete(commentID);
                return next;
            });

            return;
        }

        setExpandedCommentIDs((prev) => {
            const next = new Set(prev);
            next.add(commentID);
            return next;
        });

        if (!replyPagesByCommentID[commentID]) {
            await handleFetchNextReplyPage(comment);
        }
    };

    const handleFetchNextReplyPage = async (comment) => { //Hàm lấy trang tiếp mớ comment trả lời
        const commentID = String(comment.commentID);

        if (isFetchingRepliesByCommentID[commentID]) return;

        setIsFetchingRepliesByCommentID((prev) => ({
            ...prev,
            [commentID]: true,
        }));

        try {
            // TODO: gọi backend lấy trang reply tiếp theo.
            // pageSize = REPLY_PAGE_SIZE.
            await Promise.resolve();

            setReplyPagesByCommentID((prev) => ({
                ...prev,
                [commentID]: (prev[commentID] || 0) + 1,
            }));
        } catch (error) {
            const errorData = error.response?.data;
            const result = handleError(errorData);

            if (result && !result.handled) {
                switch (result.code) {
                    default:
                        addHelperError({
                            id: Date.now(),
                            code: I18N_KEYS.GLOBAL_ERROR.ERROR_unknownError,
                        });
                        break;
                }
            }
        } finally {
            setIsFetchingRepliesByCommentID((prev) => ({
                ...prev,
                [commentID]: false,
            }));
        }
    };

    const handleToggleCommentLike = async (comment) => { //Hàm thích/Bỏ thích cmt
        if (!isAuthenticated) {
            handleRequireLogin(I18N_KEYS.POST_DETAIL.HANDLE.REQUIRE_LOGIN.postDetail_handleRequireLogin_modalDesc_needToLoginCommentLike);
            return;
        }

        const commentID = String(comment.commentID);
        const previousFlatComments = flatComments;

        setFlatComments((prev) => prev.map((item) => {
            if (String(item.commentID) !== commentID) return item;

            const previousLikeCount = Number(item.likeCount || item.lstThichComment?.length || 0);
            const previousLiked = Boolean(item.isLikedByCurrentUser);
            const nextLiked = !previousLiked;

            return {
                ...item,
                isLikedByCurrentUser: nextLiked,
                likeCount: Math.max(0, previousLikeCount + (nextLiked ? 1 : -1)),

                // Nếu hiện tại bạn vẫn còn dùng mock lstThichComment thì giữ đoạn này tạm.
                // Backend thật không cần lstThichComment.
                lstThichComment: Array.isArray(item.lstThichComment)
                    ? (
                        previousLiked
                            ? item.lstThichComment.filter((accountID) => String(accountID) !== String(currentUserID))
                            : [...item.lstThichComment, currentUserID]
                    )
                    : item.lstThichComment,
            };
        }));

        try {
            // TODO: gọi backend like/unlike comment.
            // Backend nên trả:
            // {
            //   commentID,
            //   daThich: true/false,
            //   luotThich: number
            // }
            //
            // const response = await commentApi.toggleCommentLike(commentID);
            //
            // setFlatComments((prev) => prev.map((item) => {
            //     if (String(item.commentID) !== commentID) return item;
            //
            //     return {
            //         ...item,
            //         isLikedByCurrentUser: Boolean(response.data.daThich),
            //         likeCount: Number(response.data.luotThich || 0),
            //     };
            // }));

            await Promise.resolve();
        } catch (error) {
            setFlatComments(previousFlatComments);

            const errorData = error.response?.data;
            const result = handleError(errorData);

            if (result && !result.handled) {
                switch (result.code) {
                    default:
                        addHelperError({
                            id: Date.now(),
                            code: I18N_KEYS.GLOBAL_ERROR.ERROR_unknownError,
                        });
                        break;
                }
            }
        }
    };

    const handleShareComment = async (comment) => { //Hàm lấy link kèm id cmt, ni FE làm
        try {
            const commentUrl = `${window.location.origin}/post/${post?.postID || postID}?comment=${comment.commentID}`;

            await navigator.clipboard.writeText(commentUrl);

            addHelperError?.({
                id: Date.now(),
                code: I18N_KEYS.POST_DETAIL.HANDLE.SHARE_COMMENT.postDetail_handleShareComment_helper_success_copyLink,
            });
        } catch (error) {
            addHelperError?.({
                id: Date.now(),
                code: I18N_KEYS.POST_DETAIL.HANDLE.SHARE_COMMENT.postDetail_handleShareComment_helper_error_copyLink,
            });
        }
    };

    const handleDeleteComment = (comment) => { //Hàm xóa comment
        if (!isAuthenticated) {
            handleRequireLogin(I18N_KEYS.POST_DETAIL.HANDLE.REQUIRE_LOGIN.postDetail_handleRequireLogin_modalDesc_needToLoginDeleteComment);
            return;
        }

        setGlobalModal?.({
            isOpen: true,
            type: "two-buttons",
            title: I18N_KEYS.POST_DETAIL.HANDLE.DELETE_COMMENT.postDetail_handleDeleteComment_modalTitle_deleteComment,
            description: I18N_KEYS.POST_DETAIL.HANDLE.DELETE_COMMENT.postDetail_handleDeleteComment_modalDesc_deleteComment,
            primaryBtnText: I18N_KEYS.POST_DETAIL.HANDLE.DELETE_COMMENT.postDetail_handleDeleteComment_modalButton_deleteComment,
            secondaryBtnText: I18N_KEYS.POST_DETAIL.HANDLE.DELETE_COMMENT.postDetail_handleDeleteComment_modalButton_back,
            onPrimaryAction: async () => {
                const commentID = String(comment.commentID);
                const snapshot = flatComments;

                setFlatComments((prev) => prev.filter((item) => {
                    const isTargetComment = String(item.commentID) === commentID;
                    const isChildOfTarget = String(item.commentCha) === commentID;

                    return !isTargetComment && !isChildOfTarget;
                }));

                handleCloseGlobalModal();

                try {
                    // TODO: gọi backend xóa comment.
                    await Promise.resolve();
                } catch (error) {
                    setFlatComments(snapshot);

                    const errorData = error.response?.data;
                    const result = handleError(errorData);

                    if (result && !result.handled) {
                        switch (result.code) {
                            //Kịch bản đứa xóa k có quyền
                            case "NOT_ALLOWED":
                                addHelperError({
                                    id: Date.now(),
                                    code: I18N_KEYS.POST_DETAIL.HANDLE.DELETE_COMMENT.postDetail_handleDeleteComment_helper_error_notAllowed,
                                });
                                break;
                            default:
                                addHelperError({
                                    id: Date.now(),
                                    code: I18N_KEYS.GLOBAL_ERROR.ERROR_unknownError,
                                });
                                break;
                        }
                    }
                }
            },
            onSecondaryAction: handleCloseGlobalModal,
        });
    };

    const handleOpenCommentComposer = (context = { //Hàm mở modal viết comment
        type: COMMENT_COMPOSER_TYPE.POST,
        parentComment: null,
    }) => {
        if (!isAuthenticated) {
            handleRequireLogin(I18N_KEYS.POST_DETAIL.HANDLE.REQUIRE_LOGIN.postDetail_handleRequireLogin_modalDesc_needToLoginComment);
            return;
        }

        setCommentComposerContext(context);
        setIsCommentModalOpen(true);
    };

    const handleCreateComment = async ({ content }) => { //Hàm viết comment mới
        const tempComment = {
            commentID: `temp-${Date.now()}`, //Đại đại id
            nguoiViet: currentUserID,
            noiDung: content,
            thoiGianDang: new Date().toISOString(),
            commentCha: null,
            lstThichComment: [],
        };

        setFlatComments((prev) => [tempComment, ...prev]);

        try {
            // TODO: gọi backend tạo comment gốc.
            await Promise.resolve();

            setIsCommentModalOpen(false);
            triggerMascotMood('happy');
        } catch (error) {
            setFlatComments((prev) => prev.filter(
                (comment) => String(comment.commentID) !== String(tempComment.commentID)
            ));

            const errorData = error.response?.data;
            const result = handleError(errorData);

            if (result && !result.handled) {
                switch (result.code) {
                    //Kịch bản nội dung rỗng
                    case "NOIDUNG_NULL":
                        addHelperError({
                            id: Date.now(),
                            code: I18N_KEYS.POST_DETAIL.HANDLE.CREATE_COMMENT.postDetail_handleCreateComment_helper_error_nullNoiDung,
                        });
                        break;
                    //Kịch bản nội dung quá dài
                    case "NOIDUNG_TOO_LONG":
                        addHelperError({
                            id: Date.now(),
                            code: I18N_KEYS.POST_DETAIL.HANDLE.CREATE_COMMENT.postDetail_handleCreateComment_helper_error_noiDungTooLong,
                        });
                        break;
                    //Kịch bản comment vô post k cho phép comment
                    case "COMMENT_NOT_ALLOWED":
                        addHelperError({
                            id: Date.now(),
                            code: I18N_KEYS.POST_DETAIL.HANDLE.CREATE_COMMENT.postDetail_handleCreateComment_helper_error_commentNotAllowed,
                        });
                        break;
                    //Kịch bản nội dung mà có từ tầm bậy thì thành tự sửa trong backend luôn, đừng lôi ra đây lại nữa hế
                    default:
                        addHelperError({
                            id: Date.now(),
                            code: I18N_KEYS.GLOBAL_ERROR.ERROR_unknownError,
                        });
                        break;
                }
            }
        }
    };

    const handleCreateReply = async ({ content, parentComment }) => { //Hàm viết comment mới (phiên bản comment trả lời, khác nhau là để bn làm cho hn hiện liền trong UI thôi, vẫn gọi chung api)
        const parentCommentID = String(parentComment.commentID);

        const tempReply = {
            commentID: `temp-reply-${Date.now()}`,
            nguoiViet: currentUserID,
            noiDung: content,
            thoiGianDang: new Date().toISOString(),
            commentCha: parentCommentID,
            lstThichComment: [],
        };

        setFlatComments((prev) => [tempReply, ...prev]);

        setExpandedCommentIDs((prev) => {
            const next = new Set(prev);
            next.add(parentCommentID);
            return next;
        });

        setReplyPagesByCommentID((prev) => ({
            ...prev,
            [parentCommentID]: Math.max(prev[parentCommentID] || 1, 1),
        }));

        try {
            // TODO: gọi backend tạo reply.
            await Promise.resolve();

            setIsCommentModalOpen(false);
            triggerMascotMood('happy');
        } catch (error) {
            setFlatComments((prev) => prev.filter(
                (comment) => String(comment.commentID) !== String(tempReply.commentID)
            ));

            const errorData = error.response?.data;
            const result = handleError(errorData);

            if (result && !result.handled) {
                switch (result.code) {
                    //Kịch bản nội dung rỗng
                    case "NOIDUNG_NULL":
                        addHelperError({
                            id: Date.now(),
                            code: I18N_KEYS.POST_DETAIL.HANDLE.CREATE_COMMENT.postDetail_handleCreateComment_helper_error_nullNoiDung,
                        });
                        break;
                    //Kịch bản nội dung quá dài
                    case "NOIDUNG_TOO_LONG":
                        addHelperError({
                            id: Date.now(),
                            code: I18N_KEYS.POST_DETAIL.HANDLE.CREATE_COMMENT.postDetail_handleCreateComment_helper_error_noiDungTooLong,
                        });
                        break;
                    //Kịch bản comment vô post k cho phép comment
                    case "COMMENT_NOT_ALLOWED":
                        addHelperError({
                            id: Date.now(),
                            code: I18N_KEYS.POST_DETAIL.HANDLE.CREATE_COMMENT.postDetail_handleCreateComment_helper_error_commentNotAllowed,
                        });
                        break;
                    //Kịch bản nội dung mà có từ tầm bậy thì thành tự sửa trong backend luôn, đừng lôi ra đây lại nữa hế
                    default:
                        addHelperError({
                            id: Date.now(),
                            code: I18N_KEYS.GLOBAL_ERROR.ERROR_unknownError,
                        });
                        break;
                }
            }
        }
    };

    const handleSubmitCommentModal = async ({ content }) => { // Hàm submit form comment bên component modal tê
        if (commentComposerContext.type === COMMENT_COMPOSER_TYPE.REPLY) {
            await handleCreateReply({
                content,
                parentComment: commentComposerContext.parentComment,
            });

            return;
        }

        await handleCreateComment({ content });
    };

    const handleFetchNextRelatedPostPage = async () => { // Hàm lấy từng trang post liên quan
        try {
            // TODO: gọi backend lấy thêm post liên quan.
            // Khi có backend thật:
            // const nextPosts = await fetchNextRelatedPosts();
            // setAllPosts((prev) => [...prev, ...nextPosts]);

            await Promise.resolve();
        } catch (error) {
            const errorData = error.response?.data;
            const result = handleError(errorData);

            if (result && !result.handled) {
                switch (result.code) {
                    default:
                        addHelperError({
                            id: Date.now(),
                            code: I18N_KEYS.GLOBAL_ERROR.ERROR_unknownError,
                        });
                        break;
                }
            }
        }
    };

    //------------------- HẾT CÁC TODO BACKEND CẦN QUAN TÂM -------------------


    if (authLoading || isPreparingPage) {
        return (
            <PageContainer setHelperFocusState={setHelperFocusState}>
                <PostDetailSkeleton />
            </PageContainer>
        );
    }

    if (!post) return null;

    const authorName = getUserDisplayName(author);
    const likeMoodText = getLikeMoodText(likeCount);

    const commentTargetName = commentComposerContext.type === COMMENT_COMPOSER_TYPE.REPLY
        ? getUserDisplayName(commentComposerContext.parentComment?.author)
        : authorName;













    return (
        <PageContainer setHelperFocusState={setHelperFocusState}>
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-6 sm:px-6 lg:px-8">
                <SectionContainer
                    title={I18N_KEYS.POST_DETAIL.COMMON.postDetail_sectionContainerTitle_postDetail}
                    description={I18N_KEYS.POST_DETAIL.COMMON.postDetail_sectionContainerDesc_postDetail}
                    className="overflow-visible"
                >
                    <div className="grid items-start gap-8 overflow-visible lg:grid-cols-[minmax(0,620px)_minmax(300px,380px)] lg:justify-between xl:gap-10">
                        <div ref={mediaSectionRef} className="flex min-w-0 flex-col gap-6">
                            {shouldShowRestrictedPreview ? (
                                <RestrictedMediaPreview
                                    file={post.lstKTEOFile?.[0]}
                                    dynamicWM = {post.dynamicWM}
                                    watermarkText={`@${author?.username || `user #${post?.tacGia || ""}` || "Protected"} · EyesOnly`} 
                                    canReveal={!isUnder18}
                                    isAlertActive={isAlertActive}
                                    visitorIP={visitorIP}
                                    clearAlert={clearAlert}
                                    onReveal={() => {
                                        setRevealedRestrictedPostIDs((prev) => {
                                            const next = new Set(prev);
                                            next.add(String(post.postID));
                                            return next;
                                        });
                                    }}
                                />
                            ) : (
                                <>
                                    <div className="relative">
                                        <PostDetailMediaViewer
                                            files={visibleFiles}
                                            dynamicWM = {post.dynamicWM}
                                            watermarkText={`@${author?.username || `user #${post?.tacGia || ""}` || "Protected"} · EyesOnly`} 
                                            isAlertActive={isAlertActive}
                                            visitorIP={visitorIP}
                                            clearAlert={clearAlert}
                                        />

                                        {!isShowingAllMedia && post.lstKTEOFile?.length > 1 && (
                                            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex justify-center bg-gradient-to-t from-main-bg via-main-bg/90 to-transparent px-4 pb-5 pt-24">
                                                <Button
                                                    type="button"
                                                    variant="primary"
                                                    className="pointer-events-auto interaction-pop rounded-full px-7 shadow-sm"
                                                    onClick={handleShowAllMedia}
                                                >
                                                    {t(I18N_KEYS.POST_DETAIL.COMMON.postDetail_mediaViewerDivButton_showAll)}
                                                </Button>
                                            </div>
                                        )}
                                    </div>

                                    {isShowingAllMedia && post.lstKTEOFile?.length > 1 && (
                                        <div className="flex justify-center">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="interaction-pop rounded-full px-7"
                                                onClick={handleCollapseMedia}
                                            >
                                                {t(I18N_KEYS.POST_DETAIL.COMMON.postDetail_mediaViewerDivButton_collapse)}
                                            </Button>
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Phần tác giả cho màn hình đth */}
                            <div className="lg:hidden">
                                <PostAuthorCard
                                    author={author}
                                    isCurrentUserAuthor={isCurrentUserAuthor}
                                    isFollowingAuthor={isFollowingAuthor}
                                    isFollowLoading={isFollowLoading}
                                    onNavigateAuthor={() => navigate(`/user/${author.username}`)}
                                    onToggleFollow={handleToggleFollowAuthor}
                                />
                            </div>

                            <div className="flex flex-col gap-4 rounded-4xl bg-bg-shade-200/20 p-5">
                                <PostInfoPanel
                                    post={post}
                                    likeMoodText={likeMoodText}
                                    commentCount={rootComments.length}
                                    language={i18n.language}
                                    isCurrentUserAuthor={isCurrentUserAuthor}
                                    onEditPost={() => navigate(`/post/edit/${post.postID}`)}
                                    onTagClick={(tag) => {
                                        navigate(`/search?mode=post&keyword=${encodeURIComponent(tag)}&page=1&pageSize=18&postSearchType=tag_exact&includeAi=true&sort=newest`);
                                    }}
                                />

                                <PostActionBar
                                    isPostLiked={isPostLiked}
                                    isPostSaved={isPostSaved}
                                    isShareDone={isShareDone}
                                    isLikeLoading={isLikeLoading}
                                    isSaveLoading={isSaveLoading}
                                    onToggleLike={handleTogglePostLike}
                                    onToggleSave={handleTogglePostSave}
                                    onShare={handleSharePost}
                                    onReport={handleOpenReportFlow}
                                />
                            </div>

                            <div className="flex flex-col gap-4 rounded-4xl p-5 bg-bg-shade-200/10">
                                <PostCommentPanel
                                    comments={visibleRootComments}
                                    currentUser={user}
                                    postAuthorID={authorID}
                                    focusedCommentID={focusedCommentID}
                                    hasMoreComments={hasMoreComments}
                                    isFetchingMoreComments={isFetchingMoreComments}
                                    expandedCommentIDs={expandedCommentIDs}
                                    visibleRepliesByCommentID={visibleRepliesByCommentID}
                                    replyCountByCommentID={replyCountByCommentID}
                                    hasMoreRepliesByCommentID={hasMoreRepliesByCommentID}
                                    isFetchingRepliesByCommentID={isFetchingRepliesByCommentID}
                                    onFetchNextCommentPage={handleFetchNextCommentPage}
                                    onToggleReplies={handleToggleReplies}
                                    onFetchNextReplyPage={handleFetchNextReplyPage}
                                    onToggleCommentLike={handleToggleCommentLike}
                                    onShareComment={handleShareComment}
                                    onDeleteComment={handleDeleteComment}
                                    onReplyComment={(comment) => handleOpenCommentComposer({
                                        type: COMMENT_COMPOSER_TYPE.REPLY,
                                        parentComment: comment,
                                    })}
                                    onNavigateUser={(accountUsername) => navigate(`/user/${accountUsername}`)}
                                />

                                <button
                                    type="button"
                                    className="interaction-pop w-full rounded-full bg-main-bg px-5 py-4 text-left font-ui text-sm font-bold text-main-text shadow-sm hover:bg-bg-shade-100 disabled:cursor-not-allowed disabled:opacity-60"
                                    disabled={post.choPhepComment === false}
                                    onClick={() => handleOpenCommentComposer({
                                        type: COMMENT_COMPOSER_TYPE.POST,
                                        parentComment: null,
                                    })}
                                >
                                    {post.choPhepComment === false
                                        ? t(I18N_KEYS.POST_DETAIL.COMMON.postDetail_commentButton_commentNotAllowed)
                                        : t(I18N_KEYS.POST_DETAIL.COMMON.postDetail_commentButton_comment)}
                                </button>
                            </div>
                        </div>

                        <aside className="hidden min-w-0 self-start lg:block lg:sticky lg:top-24">
                            <PostAuthorCard
                                author={author}
                                isCurrentUserAuthor={isCurrentUserAuthor}
                                isFollowingAuthor={isFollowingAuthor}
                                isFollowLoading={isFollowLoading}
                                onNavigateAuthor={() => navigate(`/user/${author.username}`)}
                                onToggleFollow={handleToggleFollowAuthor}
                            />
                        </aside>
                    </div>
                </SectionContainer>

                <div className="my-5"></div>

                {allRelatedPosts.length > 0 && (
                    <PostSectionContainer
                        title={t(I18N_KEYS.POST_DETAIL.COMMON.postDetail_postSectionContainerTitle_relatedPosts)}
                        description={t(I18N_KEYS.POST_DETAIL.COMMON.postDetail_postSectionContainerTitle_relatedPosts)}
                    >
                        <PostGrid
                            posts={allRelatedPosts}
                            isUnder18={isUnder18}
                            isAlertActive={isAlertActive}
                            visitorIP={visitorIP}
                            clearAlert={clearAlert}
                            enableInfiniteScroll={true}
                            onLoadMore={handleFetchNextRelatedPostPage}
                        />
                    </PostSectionContainer>
                )}
            </div>

            <ReportModal
                isOpen={isReportModalOpen}
                targetType="post"
                targetName={post.tieuDe}
                onClose={() => setIsReportModalOpen(false)}
                onSubmit={handleSubmitPostReport}
            />

            <CommentComposerModal
                isOpen={isCommentModalOpen}
                title={
                    commentComposerContext.type === COMMENT_COMPOSER_TYPE.REPLY
                        ? [I18N_KEYS.POST_DETAIL.HANDLE.CREATE_COMMENT.postDetail_handleCreateComment_commentComposerModalTitle_reply, {commentTargetName: commentTargetName}]
                        : [I18N_KEYS.POST_DETAIL.HANDLE.CREATE_COMMENT.postDetail_handleCreateComment_commentComposerModalTitle_newComment, {authorName: authorName}]
                }
                targetName={commentTargetName}
                addHelperError={addHelperError}
                onClose={() => setIsCommentModalOpen(false)}
                onSubmit={handleSubmitCommentModal}
            />
        </PageContainer>
    );
}