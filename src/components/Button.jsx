export default function Button({type="button", children, onClick, variant = "primary", size = "medium"}) {
    const styles = {
        //Color Variants
        primary: " bg-primary-500 text-main-text hover:bg-primary-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500",
        outline: "border-2 border border-text-shade-300",

        //Sizes
        full: "flex w-full justify-center font-bold",
        medium: "font-semibold"
    };
    
    return (
        <button
            type={type}
            onClick={onClick}
            className={`rounded-2xl px-4 py-1.5 text-sm/6 font-ui transition-all active:scale-95 ${styles[variant]} ${styles[size]}`}
        >
            {children}
        </button>
    );
};
