import { useEffect, useRef, useState } from "react";

import DynamicWatermarkOverlay from "./DynamicWatermarkOverlay";
import CatSentinel from "./CatSentinel";

const POST_UPLOAD_BASE_URL = "http://localhost:8080/uploads/posts";

const buildPostMediaUrl = (link = "") => {
    if (!link) return "";

    const normalizedLink = String(link).trim();

    if (/^(https?:|blob:|data:)/i.test(normalizedLink)) {
        return normalizedLink;
    }

    const linkWithoutLeadingSlash = normalizedLink.replace(/^\/+/, "");

    if (linkWithoutLeadingSlash.startsWith("uploads/posts/")) {
        return `http://localhost:8080/${linkWithoutLeadingSlash}`;
    }

    return `${POST_UPLOAD_BASE_URL}/${linkWithoutLeadingSlash}`;
};

export default function PostDetailMediaCanvas({
    file,
    isAlertActive,
    visitorIP,
    clearAlert,
    dynamicWM = false,
    watermarkText = "EyesOnly",
    className = "",
    canvasClassName = "",
}) {
    const wrapperRef = useRef(null);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const animationRef = useRef(null);

    const [isVisible, setIsVisible] = useState(false);

    const fileLink = buildPostMediaUrl(file?.link);
    const fileWidth = Number(file?.width || 1);
    const fileHeight = Number(file?.height || 1);

    const drawFrame = () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;

        if (!video || !canvas) return;

        const context = canvas.getContext("2d");
        if (!context) return;

        context.drawImage(video, 0, 0, canvas.width, canvas.height);
    };

    useEffect(() => {
        const target = wrapperRef.current;

        if (!target) return undefined;

        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsVisible(entry.isIntersecting);
            },
            {
                rootMargin: "200px 0px",
                threshold: 0.1,
            }
        );

        observer.observe(target);

        return () => {
            observer.disconnect();
        };
    }, []);

    useEffect(() => {
        const video = videoRef.current;

        if (!video) return undefined;

        const renderLoop = () => {
            if (!video.paused && !video.ended) {
                drawFrame();
            }

            animationRef.current = requestAnimationFrame(renderLoop);
        };

        if (isVisible && !isAlertActive) {
            video.play().catch(() => {});
            renderLoop();
        } else {
            video.pause();

            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }

            drawFrame();
        }

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [isVisible, isAlertActive]);

    return (
        <div
            ref={wrapperRef}
            className={`
                relative w-full overflow-hidden bg-text-shade-900
                ${className}
            `}
        >
            <video
                ref={videoRef}
                src={fileLink}
                loop
                muted
                playsInline
                preload="auto"
                onLoadedData={drawFrame}
                className="hidden"
            />

            <canvas
                ref={canvasRef}
                width={fileWidth}
                height={fileHeight}
                className={`
                    block h-auto w-full
                    ${canvasClassName}
                `}
            />

            {dynamicWM && (
                <DynamicWatermarkOverlay text={watermarkText} />
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
        </div>
    );
}
