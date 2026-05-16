import React, { useState } from 'react';
import { useTranslation } from "react-i18next";

export default function Input({id, name, label, type = "text", placeholder, value, required = false, autocomplete="", handleInvalidMsg = "ERROR_handleInvalid", onChange=""}) {
    const { t, i18n } = useTranslation();

    const [hasError, setHasError] = useState(false);
    const [error, setError] = useState("");
    const [isClosing, setIsClosing] = useState(false); // State phụ để chạy animation thoát

    const handleInvalid = (e) => {
      e.preventDefault();
      setIsClosing(false); // Cho hắn đóng từ từ chơ không cái rụp
      setHasError(true); 
    };

    const handleInput = (e) => {
      if (hasError) {
        setIsClosing(true); // Kích hoạt hiệu ứng biến mất
        setTimeout(() => {
          setHasError(false);
          setIsClosing(false);
        }, 200); 
      }
    };

    return (
        <div className="sm:col-span-3 relative">
          <label for={id} className="font-heading font-medium block text-sm/6 text-text-shade-300">{t(label)}</label>
          <div className="mt-2">
            <input 
                onInvalid={handleInvalid}
                onInput={handleInput}
                id={id} 
                type={type} 
                name={name} 
                placeholder={t(placeholder)}
                value={value}
                required = {required}
                autocomplete = {autocomplete}
                onChange={onChange}
                className="block w-full rounded-xl bg-bg-shade-50 px-3 py-1.5 text-base text-text-shade-900 outline-1 -outline-offset-1 outline-bg-shade-300 placeholder:text-text-shade-200 focus:outline-2 focus:-outline-offset-2 focus:outline-primary-600 font-ui sm:text-sm/6" 
                />
          </div>

          {/* Nhắc quên điền */}
          {hasError && (
            <div className={`absolute top-full right-0 mt-4 mr-2 z-50 pointer-events-none ${isClosing ? 'animate-popup-exit' : 'animate-popup-appear-and-float'}`}>
              {/* Mũi tên */}
              <div className="absolute -top-2 right-6 w-0 h-0 
                border-l-8 border-l-transparent 
                border-r-8 border-r-transparent 
                border-b-10 border-accent">
              </div>
              
              {/* Nội dung bóng thoại */}
              <div className="bg-accent-200 text-main-text 
                px-4 py-1.5 rounded-full border-2 border-accent
                text-xs shadow-[3px_3px_0px_0px] shadow-accent
                max-w-44 sm:max-w-60">
                <span className="block wrap-break-words italic leading-relaxed font-body">{t(handleInvalidMsg)}</span>
              </div>
            </div>
          )}
        </div>
    );
}