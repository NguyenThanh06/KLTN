export default function Button({
    type = "button",
    children,
    variant = "primary",
    size = "medium",
    className = "",
    disabled = false,
    ...rest
}) {
    const styles = {
        // Color Variants
        primary: "bg-primary-500 text-main-text hover:bg-primary-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500",
        outline: "border-1 border text-main-text border-text-shade-100 bg-bg-shade-50 hover:bg-bg-shade-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bg-shade-50",
        secondary: "bg-secondary-600 text-main-text hover:bg-secondary-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-600",
        accent: "bg-accent-500 text-main-text hover:bg-accent-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500",
        none: "text-main-text hover:bg-bg-shade-100",

        // Disabled Variant
        disabled: "bg-bg-shade-200 text-bg-shade-400 cursor-not-allowed opacity-80 hover:bg-bg-shade-200 active:scale-100 focus-visible:outline-none",

        // Sizes
        full: "flex w-full justify-center font-bold px-4 py-1.5",
        large: "font-semibold px-6 py-2",
        medium: "font-semibold px-4 py-1.5",
    };

    const finalVariant = disabled ? "disabled" : variant;

    return (
        <button
            type={type}
            disabled={disabled}
            {...rest}
            className={`
                ${className}
                rounded-2xl text-sm/6 font-ui transition-all
                ${!disabled ? "active:scale-95" : ""}
                ${styles[finalVariant]}
                ${styles[size]}
            `}
        >
            {children}
        </button>
    );
}