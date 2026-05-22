import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { useTranslation } from 'react-i18next';
import { I18N_KEYS } from '../i18n/key';
import normalHelper from "../assets/mascotHelpers/normal.svg";
import happyHelper from "../assets/mascotHelpers/happy.svg";
import surprisedHelper from "../assets/mascotHelpers/surprised.svg";
import sadHelper from "../assets/mascotHelpers/sad.svg";
import curiousHelper from "../assets/mascotHelpers/curious.svg";
import alertHelper from "../assets/mascotHelpers/alert.svg";

const MascotHelper = forwardRef(({ errorStack = [], isInputFocusing = false, onClearError, onClearAllErrors }, ref) => {
  const { t } = useTranslation();
  const [currentMood, setCurrentMood] = useState('normal');
  const [isJumping, setIsJumping] = useState(false);
  const [tempMoodActive, setTempMoodActive] = useState(false); // Flag chặn useEffect khi đang setMood tạm thời
  
  const prevErrorCount = useRef(errorStack.length);
  const timeoutRef = useRef(null);

  //Làm cái set mood
  useImperativeHandle(ref, () => ({
    setMood: (mood, duration = 1000) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      setTempMoodActive(true);
      setCurrentMood(mood);

      if (mood === 'happy' || mood === 'surprised') {
        setIsJumping(true);
        setTimeout(() => setIsJumping(false), 500);
      }

      timeoutRef.current = setTimeout(() => {
        setTempMoodActive(false);

        if (isInputFocusing) {
          setCurrentMood('curious');
        } else if (errorStack.length > 0) {
          setCurrentMood('alert');
        } else {
          setCurrentMood('normal');
        }
      }, duration);
    }
  }));


  useEffect(() => {
    // Nếu đang trong thời gian setMood thủ công từ ngoài, không chạy logic tự động
    if (tempMoodActive) return;

    const currentCount = errorStack.length;
    const prevCount = prevErrorCount.current;

    // ƯU TIÊN 1: Nếu đang gõ (Focus Input) -> Luôn là Curious
    if (isInputFocusing) {
      setCurrentMood('curious');
    } 
    // ƯU TIÊN 2: Logic khi có lỗi mới phát sinh (0 -> 1)
    else if (currentCount > prevCount && prevCount === 0) {
      setCurrentMood('surprised');
      setIsJumping(true);
      setTimeout(() => setIsJumping(false), 500);
      setTimeout(() => setCurrentMood('alert'), 1000);
    } 
    // ƯU TIÊN 3: Logic khi vừa xóa hết lỗi
    else if (currentCount === 0 && prevCount > 0) {
      setCurrentMood('happy');
      setIsJumping(true);
      setTimeout(() => setIsJumping(false), 500);
      setTimeout(() => setCurrentMood('normal'), 1000);
    }
    // ƯU TIÊN 4: Trạng thái duy trì (Nếu có lỗi thì alert, không thì Normal)
    else {
      if (currentCount > 0) {
        // Chỉ về Alert nếu không phải đang trong giai đoạn 'surprised'
        if (currentMood !== 'surprised') setCurrentMood('alert');
      } else {
        // Chỉ về Normal nếu không phải đang trong giai đoạn 'happy'
        if (currentMood !== 'happy') setCurrentMood('normal');
      }
    }

    prevErrorCount.current = currentCount;
  }, [errorStack.length, isInputFocusing, tempMoodActive]); // Theo dõi cả 2 sự kiện cùng lúc

  // Map mood với file ảnh
  const mascotImages = {
    normal: normalHelper,
    happy: happyHelper,
    surprised: surprisedHelper,
    sad: sadHelper,
    curious: curiousHelper,
    alert: alertHelper,
  };

  return (
    <div className="fixed bottom-3 right-3 sm:bottom-4 sm:right-4 lg:bottom-6 lg:right-6 z-100 flex flex-col items-end pointer-events-none">
        {/* Cột bong bóng lỗi */}
        <div className="flex flex-col-reverse gap-2 sm:gap-3 mb-2 sm:mb-3 lg:mb-4 items-end">
        {errorStack.map((err) => (
            <div 
            key={err.id} 
            onClick={() => onClearError(err.id)} 
            className="group pointer-events-auto cursor-pointer animate-popup-appear-and-float bg-accent-200 text-main-text px-3 py-2 sm:px-4 sm:py-2.5 lg:px-5 lg:py-3 rounded-3xl lg:rounded-4xl border-2 border-accent shadow-[3px_3px_0px_0px] lg:shadow-[4px_4px_0px_0px] shadow-accent max-w-[min(16rem,calc(100vw-5rem))] sm:max-w-64 lg:max-w-70 relative transition-all hover:scale-105 active:scale-95"
            >
              {/* Nút X đóng bóng thoại */}
              <div className="absolute -top-1.5 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-accent border-2 border-accent text-accent-50 rounded-full flex items-center justify-center text-[9px] sm:text-[10px] font-bold shadow-[2px_2px_0px_0px] shadow-accent-700 dark:shadow-accent-300 transition-transform group-hover:rotate-12">
                  ✕
              </div>

              {/* Mũi tên trỏ xuống */}
              <div className="absolute -bottom-2 right-6 sm:-bottom-3 sm:right-8 w-0 h-0 border-l-6 border-l-transparent border-r-6 border-r-transparent border-t-8 sm:border-l-8 sm:border-r-8 sm:border-t-12 border-accent"></div>
              
              {/* Nội dung lỗi */}
              <p className="font-body text-[11px] sm:text-xs italic leading-snug sm:leading-relaxed wrap-break-word pr-1 sm:pr-2">
                  {Array.isArray(err.code) 
                      ? t(err.code[0], { ...err.code[1], defaultValue: t(I18N_KEYS.GLOBAL_ERROR.ERROR_unknownError) })
                      : t(`${err.code}`, { defaultValue: t(I18N_KEYS.GLOBAL_ERROR.ERROR_unknownError) })
                  }
              </p>
            </div>
        ))}
        </div>

      {/* Mascot Icon với hiệu ứng nhảy */}
      <div 
        onClick={onClearAllErrors}
        title="Clear all notifications"
        className={`pointer-events-auto transition-all ${isJumping ? 'animate-mascot-jump' : 'animate-float'}`}>
        <img 
          src={mascotImages[currentMood]} 
          alt="Mascot"
          className="h-16 w-16 sm:h-20 sm:w-20 lg:h-24 lg:w-24 object-contain"
        />
      </div>
    </div>
  );
});

export default MascotHelper;