export default function DynamicWatermarkOverlay({
    text = "EyesOnly",
    className = "",
}) {
    const safeText = text || "EyesOnly";

    return (
        <div
            className={`
                dynamic-watermark-overlay absolute inset-0 z-10 overflow-hidden
                ${className}
            `}
        >
            <div className="dynamic-watermark-track absolute -inset-24 grid grid-cols-3 gap-x-12 gap-y-10 opacity-70 sm:grid-cols-4">
                {Array.from({ length: 32 }).map((_, index) => (
                    <span
                        key={index}
                        className="relative whitespace-nowrap font-ui text-xs font-bold tracking-wide sm:text-sm"
                    >
                        <span className="absolute translate-x-[1px] translate-y-[1px] text-main-text/40">
                            {safeText}
                        </span>

                        <span className="relative text-main-bg/50 drop-shadow-sm">
                            {safeText}
                        </span>
                    </span>
                ))}
            </div>
        </div>
    );
}