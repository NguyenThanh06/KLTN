import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { I18N_KEYS } from "../i18n/key";
import { useAuth } from '../context/AuthContext';
import NotificationItem from "./NotificationItem";


import { TbPhotoQuestion, TbLogout, TbLogin } from "react-icons/tb";
import { FaUserCircle, FaPen, FaMoon  } from "react-icons/fa";
import { GoSun, GoSearch, GoBellFill, GoPlus, GoChevronDown } from "react-icons/go";
import Button from "./Button";
import Input from "./Input";

export default function Header({variant="full"}){
    const { isAuthenticated, user, logout } = useAuth();
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const [isDark, setIsDark] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [isNotificationDropdownExiting, setIsNotificationDropdownExiting] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [isUserMenuExiting, setIsUserMenuExiting] = useState(false);

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
            if(showUserMenu)
                toggleshowUserMenu();
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
            if (showNotifications)
                toggleNotificationDropdown();
        }
    };


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
            <Link to="/" 
                className="flex items-center gap-2"
            >
                <img src="/icon.svg" alt="Logo" className=" w-auto h-8"/>
                {variant === "full" && (
                    <span className="font-heading font-bold text-xl text-primary hidden md:block">EyesOnly</span>
                )}
            </Link>

            {/* Phần chỉ hiện ở variant full (thanh tìm kiếm, user, nút đăng post đồ rứa) */}
                {/* Phần ở giữa */}
            {variant === "full" && (
                <div className=" hidden lg:flex items-center px-4 py-2 w-1/3">
                    <Input
                        type="search"
                        leftIcon={<span className="text-text-shade-200 font-bold text-xl"><GoSearch strokeWidth={1}/></span>}
                        placeholder={t(I18N_KEYS.COMMON.common_headerPlaceholder_search)}
                        className="w-full"
                    />
                </div>
            )}

                {/* Phần ở bên phải */}
            <div className="flex items-center gap-3">
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
                                    <div
                                        variant="none"
                                        onClick={() => toggleNotificationDropdown()}
                                        className="w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-95 bg-transparent text-main-text hover:bg-bg-shade-100"
                                    >
                                        <GoBellFill className="text-sub-text text-xl"/>
                                        <span className="absolute top-2 right-2 w-2 h-2 bg-accent-500 border-2 border-main-bg rounded-full"></span>
                                    </div>
                                    {/* Dropdown thông báo */}
                                    {showNotifications && (
                                        <div className={`absolute right-0 mt-3 w-80 bg-main-bg shadow-2xl rounded-2xl overflow-hidden z-50
                                            ${isNotificationDropdownExiting ? 'animate-popup-exit' : 'animate-popup-appear'}`}
                                        >
                                            <div className="p-4 border-b border-text-shade-200 flex justify-between items-center">
                                                <p className="font-bold text-main-text font-ui text-sm">{t(I18N_KEYS.COMMON.common_headerTitle_notifications)}</p>
                                            </div>

                                            {/* Danh sách thông báo nằm dọc xuống */}
                                            <div className="max-h-96 overflow-y-auto custom-scrollbar">
                                                {/* Mock data mẫu */}
                                                <NotificationItem 
                                                    type = "theoDoi"       //theoDoi, cmt, cmtRep, baoCao
                                                    noiDung= "Nguyễn Văn A, Lê B, ..." //Danh sách ng theo dõi, tên 2-3 đứa thôi r 3 chấm
                                                    thoiDiemThongBao= "12/4/2026" 
                                                    daDoc= {false}
                                                    link= "/login"
                                                />
                                                <NotificationItem 
                                                    type = "cmt"       //theoDoi, cmt, cmtRep, baoCao
                                                    noiDung= "Bức tranh Huế ngày mưa" //tiêu đề Post, cắt gọn lại
                                                    thoiDiemThongBao= "12/4/2026" 
                                                    daDoc= {true}
                                                    link= "/login"
                                                />
                                                <NotificationItem 
                                                    type = "cmtRep"       //theoDoi, cmt, cmtRep, baoCao
                                                    noiDung= "'Hôm qua tui ăn cục c...'" //'...cơm to dễ sợ luôn' nội dung cmt cắt gọn lại
                                                    thoiDiemThongBao= "12/4/2026" 
                                                    daDoc= {false}
                                                    link= "/login"
                                                />
                                                <NotificationItem 
                                                    type = "baoCao"       //theoDoi, cmt, cmtRep, baoCao
                                                    noiDung= "Hình vẽ tầm bậy 123" //tiêu đề Post, cắt gọn lại
                                                    thoiDiemThongBao= "12/4/2026" 
                                                    daDoc= {true}
                                                    link= "/login"
                                                />
                                                <NotificationItem 
                                                    type = "baoCao"       //theoDoi, cmt, cmtRep, baoCao
                                                    noiDung= "Hình vẽ tầm bậy 123" //tiêu đề Post, cắt gọn lại
                                                    thoiDiemThongBao= "12/4/2026" 
                                                    daDoc= {true}
                                                    link= "/login"
                                                />
                                                <NotificationItem 
                                                    type = "baoCao"       //theoDoi, cmt, cmtRep, baoCao
                                                    noiDung= "Hình vẽ tầm bậy 123" //tiêu đề Post, cắt gọn lại
                                                    thoiDiemThongBao= "12/4/2026" 
                                                    daDoc= {true}
                                                    link= "/login"
                                                />
                                                <NotificationItem 
                                                    type = "baoCao"       //theoDoi, cmt, cmtRep, baoCao
                                                    noiDung= "Hình vẽ tầm bậy 123" //tiêu đề Post, cắt gọn lại
                                                    thoiDiemThongBao= "12/4/2026" 
                                                    daDoc= {true}
                                                    link= "/login"
                                                />

                                                {/* Khi không có thông báo */}
                                                {/* <div className="py-10 text-center text-xs text-main-text">
                                                    {t(I18N_KEYS.COMMON.common_headerDesc_noNotifications)}
                                                </div> */}
                                            </div>
                                        </div>
                                    )}
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
                                        <div className={`absolute right-0 top-10 w-48 bg-main-bg shadow-2xl rounded-2xl overflow-hidden z-50 
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
                    <button className="flex items-center gap-1 px-2 py-2 text-sub-text font-ui font-bold text-sm">
                        <span>{i18n.language?.toUpperCase() || 'VI'}</span>
                        <GoChevronDown className="text-md" />
                    </button>
                    {/* List chọn ngôn ngữ hiện khi Hover */}
                    <div className="absolute right-0 top-full hidden group-hover:block w-20 bg-main-bg shadow-lg border-2 border-primary-200 rounded-2xl overflow-hidden">
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
                    className="w-9 h-9 flex items-center justify-center cursor-pointer rounded-full border border-text-shade-200 text-text-shade-600 dark:text-accent-600 hover:bg-bg-shade-100 transition-all"
                >
                    {isDark ? (<FaMoon className="text-lg"/>) : (<GoSun className="text-lg"/>)}
                </button>

                </div>


            </div>
        </header>
    );
};