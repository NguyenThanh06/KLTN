import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from "react-i18next";
import { I18N_KEYS } from "../i18n/key";
import { saveSearchHistory } from "../utils/searchHistory";

import { FiSearch } from "react-icons/fi";

const HeroSearchSection = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const trimmedKeyword = searchQuery.trim();
    if (!trimmedKeyword) return;
    
    saveSearchHistory({
        keyword: trimmedKeyword,
        mode: "post",
    });

    navigate(`/search?mode=post&keyword=${encodeURIComponent(trimmedKeyword)}&page=1&pageSize=18&postSearchType=all&includeAi=true&sort=newest`);
  };

  return (
    <div className="relative isolate overflow-hidden">

      {/* KHUNG HERO SECTION */}
      <div className="mx-auto max-w-2xl py-32 sm:py-48 lg:py-56 px-4">
        <div className="text-center">
          {/* Tiêu đề chính khơi gợi */}
          <h1 className="text-4xl font-black tracking-tight font-heading text-main-text sm:text-6xl uppercase mb-8">
            {t(I18N_KEYS.HOME.COMMON.home_heroSectionTitle)}
          </h1>
          
          <p className="mt-4 text-base leading-7 text-text-shade-500 max-w-md mx-auto mb-10">
            {t(I18N_KEYS.HOME.COMMON.home_heroSectionDesc)}
          </p>

          {/* FORM TÌM KIẾM TO ĐÙNG CỰC ĐẸP */}
          <form 
            onSubmit={handleSearchSubmit} 
            className="flex flex-col sm:flex-row items-center gap-3 bg-main-bg/40 backdrop-blur-md p-2 rounded-full border border-text-shade/40 shadow-xl focus-within:border-primary-800/60 "
          >
            <div className="relative w-full flex-1">
              {/* Icon kính lúp trang trí ở đầu ô Input */}
              <div className="pointer-events-none absolute inset-y-0 left-3 right-2 text-2xl flex items-center text-text-shade-400">
                <FiSearch></FiSearch>
              </div>

              {/* Ô Input to, bo viền mềm mại */}
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t(I18N_KEYS.HOME.COMMON.home_heroSectionFormPlaceholder)}
                className="w-full bg-transparent pl-11 pr-4 py-3.5 text-base font-medium text-main-text placeholder-text-shade-400 focus:outline-none
                          [&::-webkit-search-cancel-button]:appearance-none
                          [&::-webkit-search-decoration]:appearance-none"
              />
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default HeroSearchSection;