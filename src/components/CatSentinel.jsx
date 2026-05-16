import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from "react-i18next";
import { I18N_KEYS } from "../i18n/key";

const catMeowAudio = new Audio('/meo-sound.wav');
catMeowAudio.volume = 0.3;

const CatSentinel = ({ 
  visitorIP, 
  isAlertActive, 
  onResolved, 
  onCardResolved,
  requiredPets = 30,
  variant = "card" 
}) => {
  const { t } = useTranslation();
  const [petCount, setPetCount] = useState(0);
  const audioRef = useRef(null);

  // Khôi phục số lần vuốt về 0 khi alert tắt
  useEffect(() => {
    if (!isAlertActive) {
      setPetCount(0);
    }
  }, [isAlertActive]);

  const handlePet = (e) => {
    e.preventDefault();
    e.stopPropagation();


    // Phát âm thanh ngay lập tức
    if (catMeowAudio) {
      catMeowAudio.currentTime = 0; 
      catMeowAudio.play().catch(err => {
        console.log("Trình duyệt vẫn đang chặn hoặc bận xử lý luồng:", err);
      });
    }

    // SỬA LOGIC ĐẾM: Tập trung toàn bộ logic xử lý mốc giới hạn vào trong 1 hàm setState duy nhất
    setPetCount(prev => {
      if (prev >= requiredPets) return prev;
      
      const nextCount = prev + 1;
      
      // Khi vừa chạm mốc đủ lần vuốt của Card hiện tại
      if (nextCount >= requiredPets) {
        if (onCardResolved) onCardResolved();
        
        // Nếu có hàm onResolved tổng của hệ thống thì kích hoạt luôn
        if (onResolved) {
          // Trì hoãn một xíu để tránh xung đột vòng đời render của React
          setTimeout(() => {
            onResolved();
          }, 50);
        }
        return 0; // Đạt mốc thì reset đếm về 0 luôn
      }
      
      return nextCount;
    });
  };

  if (!isAlertActive) return null;

  const remaningPets = requiredPets - petCount;

  const containerStyles = variant === "fullscreen" 
    ? "fixed inset-0 z-[10000] bg-main-text/40 backdrop-blur-md" 
    : "absolute inset-0 z-20 bg-main-text/20 backdrop-blur-sm";

  return (
    <div 
      onClick={handlePet}
      className={`${containerStyles} flex flex-col items-center justify-end cursor-pointer overflow-hidden rounded-xl`}
    >
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-main-bg px-3 py-1 rounded-full shadow-lg mb-2 animate-bounce"
      >
        <p className="text-[10px] md:text-xs font-bold text-text-shade-800">
          {remaningPets > 0 && (
            t(I18N_KEYS.COMMON.common_security_catSentinel_dialogue, {remaningPets: remaningPets})
          )}
        </p>
      </motion.div>

      <img 
        src="/cat-sentinel.png" 
        alt="Security Cat"
        className={`${variant === "fullscreen" ? "w-xl" : "w-full"} h-auto object-contain pointer-events-none`}
      />
    </div>
  );
};

export default CatSentinel;