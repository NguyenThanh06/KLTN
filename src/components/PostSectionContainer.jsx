import React from 'react';
import { useTranslation } from "react-i18next";
import { I18N_KEYS } from "../i18n/key";


const PostSectionContainer = ({ 
  title, 
  description, 
  children,
  className = "" 
}) => {

  const { t } = useTranslation();

  return (
    // max-w-7xl giúp nội dung danh sách căn giữa đẹp mắt, đồng bộ với các layout chuẩn hiện nay
    <section className={`mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-28 sm:mb-40 ${className}`}>
      
      {/* KHU VỰC TIÊU ĐỀ (CĂN TRÁI) */}
      <div className="border-b border-main-border/30 pb-5 mb-10">
        <h2 className="text-2xl font-black tracking-tight text-main-text sm:text-3xl uppercase">
          {t(title)}
        </h2>
        
        {/* Subtitle hiển thị động nếu có truyền vào */}
        {description && (
          <p className="mt-2 text-sm font-medium text-text-shade-400 tracking-wide">
            {t(description)}
          </p>
        )}
      </div>

      {/* KHU VỰC CHỨA DANH SÁCH (CHILDREN) */}
      <div className="relative">
        {children}
      </div>
      
    </section>
  );
};

export default PostSectionContainer;