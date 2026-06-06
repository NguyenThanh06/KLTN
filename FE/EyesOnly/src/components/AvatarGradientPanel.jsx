import useDominantAvatarColor from "../hooks/useDominantAvatarColor";

const rgba = (color, opacity) => {
    return `rgba(${color.r}, ${color.g}, ${color.b}, ${opacity})`;
};

export default function AvatarGradientPanel({
    avatar,
    children,
    className = "",
}) {
    const dominantColor = useDominantAvatarColor(avatar);

    const gradientStyle = {
        background: `
            linear-gradient(
                180deg,
                ${rgba(dominantColor, 0.24)} 0%,
                ${rgba(dominantColor, 0.15)} 15%,
                rgba(255, 255, 255, 0) 80%
            )
        `,
    };

    return (
        <div
            className={`
                relative overflow-hidden rounded-4xl bg-bg-shade-50
                ${className}
            `}
        >
            <div
                className="pointer-events-none absolute inset-0"
                style={gradientStyle}
            />

            <div className="relative p-4 sm:p-5 lg:p-6">
                {children}
            </div>
        </div>
    );
}