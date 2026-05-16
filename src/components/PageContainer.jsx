import { motion, scale } from "framer-motion";

import patternBgImg from "../assets/seamless-bg.png";
import Header from "../components/Header";
import Footer from "./Footer";

export default function PageContainer({setHelperFocusState, children, headerType="full"}){
    //Hàm chuyển trang mượt mượt
    const animations = {
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -10 },
    };
    // Hàm kiểm tra xem có phải đang focus vào input/textarea không
    const handleFocusChange = (e) => {
        const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName);
        if (isInput) {
            // Kiểm tra xem hàm có tồn tại không trước khi gọi để tránh crash
            if (typeof setHelperFocusState === 'function') {
                setHelperFocusState(e.type === 'focus' || e.type === 'focusin');
            }
        }
    };

    return(
        <motion.div
            variants={animations}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.8, ease: "easeInOut" }}
        >
            <div className="relative min-h-screen w-full bg-main-bg transition-colors duration-500" 
                onFocusCapture={(e) => handleFocusChange(e)} 
                onBlurCapture={(e) => handleFocusChange(e)}
                >
                    {/* Lớp họa tiết nền */}
                    <div 
                        className="fixed inset-0 animate-pattern pointer-events-none z-0"
                        style={{
                            backgroundImage: `url(${patternBgImg})`,
                            backgroundSize: '250px 250px',
                            backgroundRepeat: 'repeat',
                            opacity: 0.25
                        }}
                    ></div>
                    <Header variant={headerType}/>
                    {children}
                    <Footer/>
            </div>
        </motion.div>
    );
}