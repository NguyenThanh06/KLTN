import React from 'react';
import { useTranslation } from 'react-i18next';
import { I18N_KEYS } from '../i18n/key';
import { Link } from 'react-router-dom';
import { FaGithub, FaFacebook } from "react-icons/fa";

export default function Footer() {
    const { t } = useTranslation();
    const currentYear = new Date().getFullYear();

    return (
        <footer className="w-full bg-main-bg/80 backdrop-blur-md z-50 mt-20">
            <div className="max-w-7xl mx-auto px-6 py-10">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    
                    {/* Phần 1: Thương hiệu & Slogan */}
                    <div className="text-center md:text-left">
                        <h2 className="text-xl font-bold text-main-text tracking-tight">
                            EyesOnly<span className="text-primary-500">.</span>
                        </h2>
                        <p className="text-xs text-sub-text mt-2 max-w-40">
                            {t(I18N_KEYS.COMMON.common_footerDesc_eyesonly)}
                        </p>
                    </div>

                    {/* Phần 2: Links */}
                    <div className="flex gap-8 text-sm font-medium text-sub-text">
                        <Link 
                            to="/about" 
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-primary-500 transition-colors">
                                {t(I18N_KEYS.COMMON.common_footerButton_about)}
                        </Link>
                        <Link 
                            to="/terms" 
                            target="_blank"
                            rel="noopener noreferrer" 
                            className="hover:text-primary-500 transition-colors">
                                {t(I18N_KEYS.COMMON.common_footerButton_terms)}
                        </Link>
                    </div>

                    {/* Phần 3: Social Icons */}
                    <div className="flex gap-5 text-xl text-sub-text">
                        <a href="#" className="hover:text-main-text transition-colors"><FaGithub /></a>
                        <a href="#" className="hover:text-main-text transition-colors"><FaFacebook /></a>
                    </div>
                </div>

                {/* Phần bản quyền bên dưới */}
                <div className="mt-10 pt-6 border-t border-gray-50 dark:border-gray-800/50 text-center text-[10px] text-gray-400 uppercase tracking-widest">
                    © {currentYear} EyesOnly. All rights reserved.
                </div>
            </div>
        </footer>
    );
}