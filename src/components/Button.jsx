export default function Button({
    type = "button", 
    children, 
    variant = "primary", 
    size = "medium", 
    className = "",
    ...rest
}) {
    const styles = {
        //Color Variants
        primary: " bg-primary-500 text-main-text hover:bg-primary-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500",
        outline: "border-1 border text-main-text border-text-shade-100 bg-bg-shade-50 hover:bg-bg-shade-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bg-shade-50",
        secondary: "bg-secondary-500 text-main-text hover:bg-secondary-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-500",
        none: "bg-transparent text-main-text hover:bg-bg-shade-100",

        //Sizes
        full: "flex w-full justify-center font-bold",
        medium: "font-semibold",
    };
    
    return (
        <button
            type={type}
            {...rest}
            className={`${className} rounded-2xl px-4 py-1.5 text-sm/6 font-ui transition-all active:scale-95 ${styles[variant]} ${styles[size]}`}
        >
            {children}
        </button>
    );
};
