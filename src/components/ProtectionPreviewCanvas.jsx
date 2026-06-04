import React, { useEffect, useRef } from "react";

import DynamicWatermarkOverlay from "./DynamicWatermarkOverlay";

export default function ProtectionPreviewCanvas({
    selectedFile,
    previewImageUrl,
    previewVideoUrl,
    dynamicWM = false,
    watermarkText = "EyesOnly",
    isLoading = false,
}) {
    const canvasRef = useRef(null);

    useEffect(() => {
        if (!selectedFile || !canvasRef.current || previewVideoUrl) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        const image = new Image();

        image.src = previewImageUrl || selectedFile.url;

        image.onload = () => {
            canvas.width = image.width;
            canvas.height = image.height;

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        };
    }, [selectedFile, previewImageUrl, previewVideoUrl]);

    return (
        <div className="relative flex min-h-96 items-center justify-center overflow-hidden rounded-4xl bg-bg-shade-50 p-4">
            {isLoading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-main-bg/70">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-bg-shade-300 border-t-primary" />
                </div>
            )}

            {selectedFile ? (
                <div className="flex max-h-128 w-full justify-center">
                    <div className="relative inline-block max-h-128 max-w-full overflow-hidden rounded-3xl">
                        {previewVideoUrl ? (
                            <video
                                src={previewVideoUrl}
                                autoPlay
                                loop
                                muted
                                playsInline
                                className="block max-h-128 max-w-full object-contain"
                            />
                        ) : (
                            <canvas
                                ref={canvasRef}
                                className="block max-h-128 max-w-full object-contain"
                            />
                        )}

                        {dynamicWM && (
                            <DynamicWatermarkOverlay text={watermarkText} />
                        )}
                    </div>
                </div>
            ) : (
                <p className="font-ui text-sm text-text-shade-300">
                    Chưa có ảnh để xem trước.
                </p>
            )}
        </div>
    );
}