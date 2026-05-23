import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { I18N_KEYS } from "../i18n/key";
import { useAuth } from '../context/AuthContext';
import { saveSearchHistory } from "../utils/searchHistory";


import { TbPhotoQuestion, TbLogout, TbLogin } from "react-icons/tb";
import { FaUserCircle, FaPen, FaMoon } from "react-icons/fa";
import { GoSun, GoSearch, GoBellFill, GoPlus, GoChevronDown, GoGlobe } from "react-icons/go";
import { HiMenuAlt3 } from "react-icons/hi";
import Button from "./Button";
import Input from "./Input";
import NotificationDropdown from "./NotificationDropdown";

export default function Header({variant="full"}){
    const { isAuthenticated, user, logout } = useAuth();
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const [isDark, setIsDark] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [isNotificationDropdownExiting, setIsNotificationDropdownExiting] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [isUserMenuExiting, setIsUserMenuExiting] = useState(false);
    const [showLanguageMenu, setShowLanguageMenu] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);

    const [headerSearchQuery, setheaderSearchQuery] = useState('');

    const handleHeaderSearchSubmit = (e) => {
        e.preventDefault();
        const trimmedKeyword = headerSearchQuery.trim();
        if (!trimmedKeyword) return;
        
        saveSearchHistory({
            keyword: trimmedKeyword,
            mode: "post",
        });

        navigate(`/search?mode=post&keyword=${encodeURIComponent(trimmedKeyword)}&page=1&pageSize=18&postSearchType=all&includeAi=true&sort=newest`);
    };

    //Xử lý cái logout cho đẹp hơn
    const handleLogout = async () => {
        logout();
        navigate('/', { replace: true });
    };

    //Xử lý animation bật tắt dropdown (thông báo với user)
    const toggleNotificationDropdown = () => {
        if (showNotifications) {
            setIsNotificationDropdownExiting(true);
            setTimeout(() => {
                setShowNotifications(false);
                setIsNotificationDropdownExiting(false);
            }, 150); // Khớp với thời gian animation exit
        } else {
            setShowNotifications(true);
            setShowMobileMenu(false);

            if (showUserMenu) {
                toggleshowUserMenu();
            }
        }
    };
    const toggleshowUserMenu = () => {
        if (showUserMenu) {
            setIsUserMenuExiting(true);
            setTimeout(() => {
                setShowUserMenu(false);
                setIsUserMenuExiting(false);
            }, 150); // Khớp với thời gian animation exit
        } else {
            setShowUserMenu(true);
            setShowMobileMenu(false);

            if (showNotifications) {
                toggleNotificationDropdown();
            }
        }
    };


    // Danh sách ngôn ngữ
    const languages = [
        { code: 'vi', label: 'VI' },
        { code: 'en', label: 'EN' },
        { code: 'ja', label: 'JP' },
        { code: 'es', label: 'ES' }
    ];
    //Đổi ngôn ngữ
    const currentLanguageIndex = languages.findIndex(
        (lang) => lang.code === i18n.language
    );

    const currentLanguage = languages[currentLanguageIndex] || languages[1];

    const changeToNextLanguage = () => {
        const nextIndex =
            currentLanguageIndex === -1 || currentLanguageIndex === languages.length - 1
                ? 0
                : currentLanguageIndex + 1;

        i18n.changeLanguage(languages[nextIndex].code);
    };

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
        <header className="sticky top-0 z-50 w-full px-3 lg:px-4 py-2 lg:py-0 lg:h-16 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2 bg-main-bg/80 backdrop-blur-md">            {/* Phần logo bên trái */}
            {/* Đoạn logo đầu + menu ở mobile */}
            <div className="w-full lg:w-auto flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    {variant === "full" && (
                        <div className="relative lg:hidden">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowMobileMenu((prev) => !prev);
                                    setShowNotifications(false);
                                    setShowUserMenu(false);
                                }}
                                className="w-10 h-10 rounded-full flex items-center justify-center text-main-text hover:bg-bg-shade-100 active:scale-95 transition-all"
                            >
                                <HiMenuAlt3 className="text-2xl" />
                            </button>

                            {showMobileMenu && (
                                <div className="absolute left-0 top-12 w-[min(17rem,calc(100vw-1.5rem))] bg-main-bg shadow-2xl rounded-2xl overflow-hidden z-50 animate-popup-appear border border-text-shade-200">
                                    <div className="p-3 flex flex-col gap-1 font-ui text-sm">
                                        {isAuthenticated && (
                                            <Link
                                                to="/post/create"
                                                onClick={() => setShowMobileMenu(false)}
                                                className="flex items-center gap-3 px-3 py-2 rounded-full text-main-text hover:bg-bg-shade-100"
                                            >
                                                <GoPlus />
                                                {t(I18N_KEYS.COMMON.common_headerButton_post)}
                                            </Link>
                                        )}

                                        <Link
                                            to="/verify"
                                            onClick={() => setShowMobileMenu(false)}
                                            className="flex items-center gap-3 px-3 py-2 rounded-full text-main-text hover:bg-bg-shade-100"
                                        >
                                            <TbPhotoQuestion />
                                            {t(I18N_KEYS.COMMON.common_headerButton_verify)}
                                        </Link>

                                        <button
                                            type="button"
                                            onClick={changeToNextLanguage}
                                            className="flex items-center gap-3 px-3 py-2 rounded-full text-main-text hover:bg-bg-shade-100 text-left"
                                        >
                                            <GoGlobe />
                                            <span>
                                                {t(I18N_KEYS.COMMON.common_headerButton_language)} {currentLanguage.label}
                                            </span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={toggleTheme}
                                            className="flex items-center gap-3 px-3 py-2 rounded-full text-main-text hover:bg-bg-shade-100 text-left"
                                        >
                                            {isDark ? <FaMoon /> : <GoSun />}
                                            <span>
                                                {t(I18N_KEYS.COMMON.common_headerButton_theme)} {isDark ? t(I18N_KEYS.COMMON.common_headerButton_themeDark) : t(I18N_KEYS.COMMON.common_headerButton_themeLight)}
                                            </span>
                                        </button>

                                        {!isAuthenticated && (
                                            <Link
                                                to="/login"
                                                onClick={() => setShowMobileMenu(false)}
                                                className="flex items-center gap-3 px-3 py-2 rounded-full text-main-text hover:bg-bg-shade-100"
                                            >
                                                <TbLogin />
                                                {t(I18N_KEYS.COMMON.common_headerButton_login)}
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <Link to="/" className="flex items-center gap-2 shrink-0">
                        <img src="/icon.svg" alt="Logo" className="w-auto h-8" />

                        {variant === "full" && (
                            <span className="font-heading font-bold text-xl text-primary hidden md:block">
                                EyesOnly
                            </span>
                        )}

                        {variant === "simple" && (
                            <span className="font-heading font-bold text-xl text-primary">
                                EyesOnly
                            </span>
                        )}
                    </Link>

                    
                </div>

                {variant === "full" && (
                    <div className="lg:hidden flex items-center gap-2">
                        {isAuthenticated && (
                            <div className="relative">
                                <NotificationDropdown
                                    isOpen={showNotifications}
                                    isExiting={isNotificationDropdownExiting}
                                    onToggle={toggleNotificationDropdown}
                                />
                            </div>
                        )}

                        {isAuthenticated && (
                            <div
                                className="relative flex items-center gap-1 cursor-pointer p-1 rounded-full justify-center bg-transparent text-main-text hover:bg-bg-shade-100"
                                onClick={toggleshowUserMenu}
                            >
                                <div className="w-8 h-8 rounded-full bg-brand overflow-hidden transition-all active:scale-95">
                                    <img src={user.avatar} alt="Avatar" />
                                </div>

                                {showUserMenu && (
                                    <div className={`absolute right-0 top-11 w-[min(12rem,calc(100vw-1.5rem))] bg-main-bg shadow-2xl rounded-2xl overflow-hidden z-50 ${isUserMenuExiting ? 'animate-popup-exit' : 'animate-popup-appear'}`}>
                                        <Link to="/user?id=123" className="flex items-start gap-3 py-2 px-4 my-2 bg-main-bg text-main-text cursor-pointer transition-colors">
                                            <div className="shrink-0 w-10 h-10 bg-primary-200 rounded-full flex items-center justify-center">
                                                <img src={ user.avatar } alt="Avatar" />
                                            </div>
                                            <div className="grow min-w-0">
                                                <p className="font-bold text-sm">{ user.tenHienThi }</p>
                                                <p className="text-xs text-sub-text">@{ user.username }</p>
                                            </div>
                                        </Link>
                                        <div className="border-t border-text-shade-200 font-light font-body p-4 flex flex-col gap-2">
                                            <Link to="/user?id=123">
                                                <span className="flex items-center gap-3 text-main-text">
                                                    <FaUserCircle strokeWidth={2}/>
                                                    {t(I18N_KEYS.COMMON.common_headerButton_user)}
                                                </span>
                                            </Link>
                                            <Link to="/profile">
                                                <span className="flex items-center gap-3 text-main-text">
                                                    <FaPen strokeWidth={2}/>
                                                    {t(I18N_KEYS.COMMON.common_headerButton_profile)}
                                                </span>
                                            </Link>
                                            <div onClick={handleLogout}>
                                                <span className="flex items-center gap-3 text-accent-700">
                                                    <TbLogout strokeWidth={2.5} className=""/>
                                                    {t(I18N_KEYS.COMMON.common_headerButton_logout)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            
                {/* Phần tìm kiếm */}
            {variant === "full" && (
                <div className="flex items-center w-full lg:w-1/3 lg:px-4 lg:py-2">
                    <form 
                        onSubmit={handleHeaderSearchSubmit}
                    >
                        <Input
                            value={headerSearchQuery}
                            onChange={(e) => setheaderSearchQuery(e.target.value)}
                            type="search"
                            leftIcon={
                                <span className="text-text-shade-200 font-bold text-xl">
                                    <GoSearch strokeWidth={1} />
                                </span>
                            }
                            placeholder={t(I18N_KEYS.COMMON.common_headerPlaceholder_search)}
                            className="w-full"
                        />
                    </form>
                </div>
            )}

                {/* Phần ở bên phải */}
            <div className="hidden lg:flex items-center gap-3">
            {variant==="full"&&(
                <>
                    {/* Nút đăng bài */}
                    {(isAuthenticated) && (
                        <Button>
                            <Link to="/post/create">
                                <span className="flex items-center gap-2 text-main-text">
                                    <GoPlus strokeWidth={1}/>
                                    {t(I18N_KEYS.COMMON.common_headerButton_post)}
                                </span>
                            </Link>
                        </Button>
                    )}

                    {/* Nút xác thực ảnh */}
                    <Button variant="secondary">
                        <Link to="/verify">
                            <span className="flex items-center gap-2 text-main-text">
                                <TbPhotoQuestion strokeWidth={2}/>
                                {t(I18N_KEYS.COMMON.common_headerButton_verify)}
                            </span>
                        </Link>
                    </Button>


                    {/* Thông báo với user thì hiện lúc đã đăng nhập */}
                    {(isAuthenticated) ? (
                        <>
                            {/* Nút mở thông báo */}
                                <div className="relative">
                                    <NotificationDropdown
                                        isOpen={showNotifications}
                                        isExiting={isNotificationDropdownExiting}
                                        onToggle={toggleNotificationDropdown}
                                    />
                                </div>
                                

                                {/* Cái icon avater user */}
                                <div className="relative flex items-center gap-1 cursor-pointer group p-1 rounded-full justify-center bg-transparent text-main-text hover:bg-bg-shade-100" 
                                    onClick={() => toggleshowUserMenu()}
                                >
                                    <div className="w-8 h-8 rounded-full bg-brand overflow-hidden transition-all active:scale-95">
                                        <img src={ user.avatar } alt="Avatar" />
                                    </div>
                                    {/* Dropdown User */}
                                    {showUserMenu && (
                                        <div className={`absolute right-0 top-10 w-[min(12rem,calc(100vw-1.5rem))] bg-main-bg shadow-2xl rounded-2xl overflow-hidden z-50 
                                                    ${isUserMenuExiting ? 'animate-popup-exit' : 'animate-popup-appear'}`}>
                                            <Link to="/user?id=123" className="flex items-start gap-3 py-2 px-4 my-2 bg-main-bg text-main-text cursor-pointer transition-colors">
                                                <div className="shrink-0 w-10 h-10 bg-primary-200 rounded-full flex items-center justify-center">
                                                    <img src={ user.avatar } alt="Avatar" />
                                                </div>
                                                <div className="grow min-w-0">
                                                    <p className="font-bold text-sm">{ user.tenHienThi }</p>
                                                    <p className="text-xs text-sub-text">@{ user.username }</p>
                                                </div>
                                            </Link>
                                            <div className="border-t border-text-shade-200 font-light font-body p-4 flex flex-col gap-2">
                                                <Link to="/user?id=123">
                                                    <span className="flex items-center gap-3 text-main-text">
                                                        <FaUserCircle strokeWidth={2}/>
                                                        {t(I18N_KEYS.COMMON.common_headerButton_user)}
                                                    </span>
                                                </Link>
                                                <Link to="/profile">
                                                    <span className="flex items-center gap-3 text-main-text">
                                                        <FaPen strokeWidth={2}/>
                                                        {t(I18N_KEYS.COMMON.common_headerButton_profile)}
                                                    </span>
                                                </Link>
                                                <div onClick={handleLogout}>
                                                    <span className="flex items-center gap-3 text-accent-700">
                                                        <TbLogout strokeWidth={2.5} className=""/>
                                                        {t(I18N_KEYS.COMMON.common_headerButton_logout)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                        </>
                    )
                    :
                    (
                        <>
                            {/* Hiện lúc chưa đăng nhập */}
                            <Button variant="none" className="ml-6">
                                <Link to="/login">
                                    <span className="flex items-center gap-2 text-main-text">
                                        <TbLogin strokeWidth={2.5}/>
                                        {t(I18N_KEYS.COMMON.common_headerButton_login)}
                                    </span>
                                </Link>
                            </Button>
                        </>
                    )
                }
                    
                </>
            )}

            <div className="flex items-center gap-4 pl-3 ml-2">
                {/* Dropdown Ngôn ngữ */}
                <div className="relative group">
                    <button
                        type="button"
                        onClick={() => setShowLanguageMenu((prev) => !prev)}
                        className="flex items-center gap-1 px-2 py-2 text-sub-text font-ui font-bold text-sm"
                    >
                        <span>{currentLanguage.label}</span>
                        <GoChevronDown className="text-md" />
                    </button>

                    <div
                        className={`
                            absolute right-0 top-full w-20 bg-main-bg shadow-lg border-2 border-primary-200 rounded-2xl overflow-hidden z-50
                            ${showLanguageMenu ? "block" : "hidden"}
                            lg:group-hover:block
                        `}
                    >
                        {languages.map((lang) => (
                            <button
                                key={lang.code}
                                type="button"
                                onClick={() => {
                                    i18n.changeLanguage(lang.code);
                                    setShowLanguageMenu(false);
                                }}
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
                    className="w-9 h-9 flex items-center justify-center cursor-pointer rounded-full border border-text-shade-200 text-text-shade-600 dark:text-accent-600 hover:bg-bg-shade-100 transition-all"
                >
                    {isDark ? (<FaMoon className="text-lg"/>) : (<GoSun className="text-lg"/>)}
                </button>

                </div>


            </div>
        </header>
    );
};