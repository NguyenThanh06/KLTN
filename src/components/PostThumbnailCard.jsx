import { useEffect, useRef, useState } from "react";
import { RiCheckboxMultipleBlankFill } from "react-icons/ri";
import { useNavigate } from "react-router-dom";
import { Pencil } from "lucide-react";

import CatSentinel from "./CatSentinel";

import { MOCK_USER_DATA_1 } from "../data/User/mockUser1";
import { MOCK_USER_DATA_2 } from "../data/User/mockUser2";
import { MOCK_USER_DATA_3 } from "../data/User/mockUser3";

const DEFAULT_AUTHOR = {
    avatar: "/defaultAvatar/default_avatar_1.svg",
    tenHienThi: "Tác giả ẩn danh",
};

const PostThumbnailCard = ({
    post,
    isUnder18,
    isAlertActive,
    visitorIP,
    clearAlert,

    showAuthorInfo = true,
    viewerIsAuthor = false,
    showEditButton = false,
    onEditPost,
}) => {
    const navigate = useNavigate();

    const {
        postID,
        tieuDe,
        lstKTEOFile = [],
        hanCheHienThi,
        tacGia,
    } = post || {};

    const firstFile = lstKTEOFile?.[0];

    const videoRef = useRef(null);
    const canvasRef = useRef(null);

    const [isVisible, setIsVisible] = useState(false);

    const isMultiple = lstKTEOFile?.length > 1;

    const isLocked =
        !viewerIsAuthor &&
        isUnder18 &&
        (hanCheHienThi === 2 || hanCheHienThi === 3);

    const authorMap = {
        1: MOCK_USER_DATA_1,
        2: MOCK_USER_DATA_2,
        3: MOCK_USER_DATA_3,
    };

    const thongTinTacGia = authorMap[String(tacGia)] || DEFAULT_AUTHOR;

    const drawFrame = (video, canvas) => {
        if (!video || !canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        try {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        } catch {
            // Video chưa đủ dữ liệu để vẽ frame, bỏ qua để card không bị sập.
        }
    };

    useEffect(() => {
        const targetCanvas = canvasRef.current;
        if (!targetCanvas) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsVisible(entry.isIntersecting);
            },
            {
                rootMargin: "200px 0px",
                threshold: 0.1,
            }
        );

        observer.observe(targetCanvas);

        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        const video = videoRef.current;
        const canvas = canvasRef.current;

        if (!video || !canvas) return;

        let animationId;

        const renderLoop = () => {
            if (!video.paused && !video.ended) {
                drawFrame(video, canvas);
            }

            animationId = requestAnimationFrame(renderLoop);
        };

        if (isVisible && !isLocked) {
            video.play().catch(() => {});
            renderLoop();
        } else {
            video.pause();

            if (animationId) {
                cancelAnimationFrame(animationId);
            }

            drawFrame(video, canvas);
        }

        return () => {
            if (animationId) {
                cancelAnimationFrame(animationId);
            }
        };
    }, [isVisible, isLocked]);

    const handleNavigatePost = () => {
        if (!postID) return;
        navigate(`/post/${postID}`);
    };

    const handleNavigateAuthor = (event) => {
        event.stopPropagation();

        if (!thongTinTacGia?.username) return;
        navigate(`/user/${thongTinTacGia.username}`);
    };

    const handleEditPost = (event) => {
        event.stopPropagation();

        if (onEditPost) {
            onEditPost(post);
            return;
        }

        if (postID) {
            navigate(`/post/edit/${postID}`);
        }
    };

    if (!firstFile) {
        return (
            <div
                className="group flex w-full cursor-pointer flex-col"
                onClick={handleNavigatePost}
            >
                <div className="flex aspect-[4/5] w-full items-center justify-center rounded-3xl bg-bg-shade-100 shadow-sm">
                    <p className="px-5 text-center font-ui text-sm font-bold text-text-shade-400">
                        Không có tệp hiển thị
                    </p>
                </div>

                <div className="mt-3 px-1">
                    <h3 className="truncate font-ui text-sm font-bold text-main-text">
                        {tieuDe || "Tác phẩm chưa có tiêu đề"}
                    </h3>
                </div>
            </div>
        );
    }

    return (
        <div
            className="group flex w-full cursor-pointer flex-col"
            onClick={handleNavigatePost}
        >
            <div className="relative w-full overflow-hidden rounded-3xl bg-text-shade-900 shadow-sm">
                <video
                    ref={videoRef}
                    src={firstFile.link}
                    loop
                    muted
                    playsInline
                    preload="auto"
                    onLoadedData={() =>
                        drawFrame(videoRef.current, canvasRef.current)
                    }
                    className="hidden"
                />

                <canvas
                    ref={canvasRef}
                    width={firstFile.width || 1200}
                    height={firstFile.height || 1600}
                    className={`
                        block h-auto w-full transition-transform duration-500 group-hover:scale-105
                        ${
                            isLocked
                                ? "scale-95 select-none blur-2xl"
                                : ""
                        }
                    `}
                />

                {showEditButton && (
                    <button
                        type="button"
                        className="
                            interaction-pop absolute left-2 top-2 z-30 flex h-9 w-9 items-center justify-center rounded-full
                            bg-main-bg/90 text-main-text shadow-sm backdrop-blur-md hover:bg-bg-shade-50
                        "
                        onClick={handleEditPost}
                    >
                        <Pencil size={16} />
                    </button>
                )}

                {isAlertActive && (
                    <div
                        className="no-select absolute inset-0 z-20"
                        onMouseDown={(event) => event.preventDefault()}
                        onDragStart={(event) => event.preventDefault()}
                    >
                        <div className="absolute inset-0 bg-main-text/70" />

                        <div className="relative z-10 h-full w-full">
                            <CatSentinel
                                visitorIP={visitorIP}
                                isAlertActive={isAlertActive}
                                onCardResolved={clearAlert}
                                variant="card"
                            />
                        </div>
                    </div>
                )}

                {isLocked && (
                    <div className="absolute inset-0 flex items-center justify-center bg-text-shade-900/20">
                        <span className="rounded-full bg-text-shade-900/40 px-3 py-1 font-ui text-[10px] font-bold uppercase tracking-widest text-text-shade-50 backdrop-blur-sm">
                            18+
                        </span>
                    </div>
                )}

                {isMultiple && (
                    <div className="absolute right-2 top-2 z-10 flex items-center gap-1.5 rounded-full bg-main-text/50 px-2.5 py-1 text-text-shade-50 backdrop-blur-md">
                        <RiCheckboxMultipleBlankFill size={14} />
                        <span className="font-ui text-xs font-bold">
                            {lstKTEOFile.length}
                        </span>
                    </div>
                )}
            </div>

            <div className="mt-3 px-1">
                <h3 className="truncate font-ui text-sm font-bold text-main-text">
                    {tieuDe || "Tác phẩm chưa có tiêu đề"}
                </h3>

                {showAuthorInfo && (
                    <button
                        type="button"
                        className="interaction-pop mt-2 flex max-w-full items-center gap-2 rounded-full px-1 py-1 text-main-text hover:bg-bg-shade-50"
                        onClick={handleNavigateAuthor}
                    >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-bg-shade-100">
                            <img
                                src={thongTinTacGia.avatar}
                                alt=""
                                className="h-full w-full object-cover"
                            />
                        </div>

                        <div className="min-w-0 grow text-left">
                            <p className="truncate font-ui text-sm text-main-text">
                                {thongTinTacGia.tenHienThi}
                            </p>
                        </div>
                    </button>
                )}
            </div>
        </div>
    );
};

export default PostThumbnailCard;