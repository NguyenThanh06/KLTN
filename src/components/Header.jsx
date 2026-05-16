import { useState } from "react";
import { useTranslation } from "react-i18next";
import { I18N_KEYS } from "../i18n/key";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faSun, faMoon, faChevronDown, faBell, faSearch, faPlus
} from "@fortawesome/free-solid-svg-icons";
import Button from "./Button";

export default function Header({variant="full"}){
    const { t, i18n } = useTranslation();
    const [isDark, setIsDark] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);

    // Danh sách ngôn ngữ
    const languages = [
        { code: 'en', label: 'EN' },
        { code: 'vi', label: 'VI' },
        { code: 'jp', label: 'JP' },
        { code: 'es', label: 'ES' }
    ];
    //Đổi ngôn ngữ

    // Đổi theme
    const toggleTheme = () => {
        setIsDark(!isDark);
        if (!isDark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }

    return (
        <header className="sticky top-0 z-50 w-full px-4 h-16 flex items-center justify-between bg-main-bg/80 backdrop-blur-md">
            {/* Phần logo bên trái */}
            <div className="flex items-center gap-2">
                <img src="icon.svg" alt="Logo" className=" w-auto h-8"/>
                {variant === "full" && (
                    <span className="font-heading font-bold text-xl text-primary hidden md:block">EyesOnly</span>
                )}
            </div>

            {/* Phần chỉ hiện ở variant full (thanh tìm kiếm, user, nút đăng post đồ rứa) */}
                {/* Phần ở giữa */}
            {variant === "full" && (
                <div className=" hidden lg:flex items-center bg-main-bg px-4 py-2 rounded-full w-1/3">
                    <FontAwesomeIcon icon={faSearch} className="text-gray-400 mr-2"/>
                    <input
                        type="text"
                        placeholder={t(I18N_KEYS.COMMON.common_headerPlaceholder_search)}
                        className="bg-transparent border-none outline-none text-sm w-full"
                    />
                </div>
            )}

                {/* Phần ở bên phải */}
            <div className="flex items-center gap-3">
            {variant==="full"&&(
                <>
                    <button className="bg-primary text-main-text px-4 py-1.5 rounded-full font-ui font-bold text-sm flex items-center gap-2 hover:opacity-90">
                        <FontAwesomeIcon icon={faPlus}/>
                        <span>{t(I18N_KEYS.COMMON.common_headerButton_post)}</span>
                    </button>

                    <div className="relative">
                        <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            className="w-10 h-10 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-sub-text"
                        >
                            <FontAwesomeIcon icon={faBell}/>
                        </button>
                        {/* Dropdown thông báo */}
                        {showNotifications && (
                            <div className="absolute right-0 mt-2 w-80 bg-main-bg border dark:border-gray-700 shadow-xl rounded-2xl p-4">
                                <p className="font-bold text-sm">{t(I18N_KEYS.COMMON.common_headerTitle_notifications)}</p>
                                <div className="py-10 text-center text-xs text-sub-text">{t(I18N_KEYS.COMMON.common_headerDesc_noNotifications)}</div>
                            </div>
                        )}
                    </div>

                    <div className="relative flex items-center gap-1 cursor-pointer group" onClick={() => setShowUserMenu(!showUserMenu)}>
                        <div className="w-8 h-8 rounded-full bg-brand overflow-hidden">
                            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="Avatar" />
                        </div>
                        <FontAwesomeIcon icon={faChevronDown} className="text-[10px] text-sub-text" />
                        {/* Dropdown User */}
                        {showUserMenu && (
                            <div className="absolute right-0 top-10 w-48 bg-white dark:bg-gray-800 border dark:border-gray-700 shadow-xl rounded-2xl overflow-hidden z-50">
                            <div className="p-4 border-b dark:border-gray-700">
                                <p className="font-bold text-sm">Tuan Nguyen</p>
                                <p className="text-xs text-sub-text">@tuan_dev</p>
                            </div>
                            <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700">{t(I18N_KEYS.COMMON.common_headerButton_profile)}</button>
                            <button className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-50 dark:hover:bg-gray-700 font-bold">{t(I18N_KEYS.COMMON.common_headerButton_logout)}</button>
                            </div>
                        )}
                    </div>

                </>
            )}

            <div className="flex items-center gap-4 pl-3 ml-2">
                {/* Dropdown Ngôn ngữ */}
                <div className="relative group">
                    <button className="flex items-center gap-1 px-2 py-2 text-sub-text font-ui font-bold text-sm">
                        <span>{i18n.language?.toUpperCase() || 'VI'}</span>
                        <FontAwesomeIcon icon={faChevronDown} className="text-[10px]" />
                    </button>
                    {/* List chọn ngôn ngữ hiện khi Hover */}
                    <div className="absolute right-0 top-full hidden group-hover:block w-20 bg-main-bg shadow-lg border border-2 border-primary-200 rounded-2xl overflow-hidden">
                    {languages.map((lang) => (
                        <button
                            key={lang.code}
                            onClick={() => i18n.changeLanguage(lang.code)}
                            className="w-full px-4 py-2 text-xs text-main-text hover:bg-primary-200 hover:text-primary-900 transition-colors text-center"
                        >
                        {lang.label}
                        </button>
                    ))}
                    </div>
                </div>
          
                {/* Nút Theme */}
                <button 
                    onClick={toggleTheme}
                    className="w-9 h-9 rounded-full border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-yellow-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                >
                    <FontAwesomeIcon icon={isDark ? faMoon : faSun } />
                </button>

                </div>


            </div>
        </header>
    );
};