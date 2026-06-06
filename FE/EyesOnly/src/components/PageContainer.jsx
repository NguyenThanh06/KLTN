import { motion } from "framer-motion";

import patternBgImg from "../assets/seamless-bg.png";
import Header from "../components/Header";
import Footer from "./Footer";

export default function PageContainer({ setHelperFocusState, children, headerType = "full" }) {
    const animations = {
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -10 },
    };

    const handleFocusChange = (e) => {
        const isInput = ["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName);

        if (isInput && typeof setHelperFocusState === "function") {
            setHelperFocusState(e.type === "focus" || e.type === "focusin");
        }
    };

    return (
        <motion.div
            variants={animations}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.8, ease: "easeInOut" }}
        >
            <div
                className="relative isolate min-h-screen w-full bg-main-bg transition-colors duration-500 "
                onFocusCapture={handleFocusChange}
                onBlurCapture={handleFocusChange}
            >
                {/* Lớp họa tiết nền: chỉ nằm phía sau content */}
                <div
                    className="fixed inset-0 animate-pattern pointer-events-none z-0"
                    style={{
                        backgroundImage: `url(${patternBgImg})`,
                        backgroundSize: "250px 250px",
                        backgroundRepeat: "repeat",
                        opacity: 0.25,
                    }}
                />

                {/* Toàn bộ nội dung nằm trên pattern */}
                <div className="relative z-10">
                    <Header variant={headerType} />
                    {children}
                    <Footer />
                </div>
            </div>
        </motion.div>
    );
}