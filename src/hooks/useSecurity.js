import { useEffect, useState, useRef } from 'react';

export const useSecurity = () => {

  // Kiểm tra xem alert cũ đã hết hạn chưa ngay khi khởi tạo
  const checkInitialAlert = () => {
    const alertActive = localStorage.getItem('security_alert') === 'true';
    const expiresAt = localStorage.getItem('security_alert_expires_at');
    
    if (alertActive && expiresAt) {
      if (Date.now() > parseInt(expiresAt, 10)) {
        // Đã quá hạn 3 phút -> Tự động ân xá ngầm
        localStorage.removeItem('security_alert');
        localStorage.removeItem('security_alert_expires_at');
        return false;
      }
      return true;
    }
    return alertActive;
  };


  // Trạng thái BÁO ĐỘNG ĐỎ (Chỉ bật khi cố tình F12/Inspect, lưu localStorage)
  const [isAlertActive, setIsAlertActive] = useState(checkInitialAlert);

  const timeoutRef = useRef(null);

  // Trạng thái PHÒNG THỦ NGẦM (Chỉ bật tạm thời khi user đổi tab/mở app chụp ảnh)
  const [isTabBlurred, setIsTabBlurred] = useState(false);

  const triggerAlert = () => {
    setIsAlertActive(true);
    localStorage.setItem('security_alert', 'true');
    const cooldownTime = Date.now() + 3 * 60 * 1000; //3 phút
    localStorage.setItem('security_alert_expires_at', cooldownTime.toString());
  };

  const clearAlert = () => {
    setIsAlertActive(false);
    localStorage.removeItem('security_alert');
    localStorage.removeItem('security_alert_expires_at');
  };

  useEffect(() => {
    // Bộ kiểm tra liên tục (H phòng trường hợp người dùng treo máy đợi hết giờ)
    const interval = setInterval(() => {
      const expiresAt = localStorage.getItem('security_alert_expires_at');
      if (expiresAt && Date.now() > parseInt(expiresAt, 10)) {
        clearAlert();
      }
    }, 5000); // Kiểm tra mỗi 5 giây


    const handleKeyDown = (e) => {
      // macOS: Command + Shift + 3/4/5 (Chụp màn hình Mac)
      const isMacScreenshot = e.metaKey && e.shiftKey && (e.key === '3' || e.key === '4' || e.key === '5');
      
      // Windows/Linux: F12, Ctrl+Shift+I, Ctrl+U, Ctrl+S, Ctrl+P
      // const isDevToolsOrPrint = 
      //   e.keyCode === 123 || 
      //   e.key === 'PrintScreen' ||
      //   (e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.keyCode === 74)) ||
      //   (e.ctrlKey && (e.keyCode === 85 || e.keyCode === 80 || e.keyCode === 83));

      const isAnyModifierPressed = e.shiftKey || e.ctrlKey || e.altKey || e.metaKey;
      if ((e.key === 'Shift' || e.key === 'Control'|| e.key === 'Alt' || e.key === 'Meta') || isAnyModifierPressed) {
        setIsTabBlurred(true);
      }

      // if (isMacScreenshot || isDevToolsOrPrint) {
      //   e.preventDefault();
      //   triggerAlert(); // CỐ TÌNH PHÁ HOẠI -> BẬT BÁO ĐỘNG ĐỎ CÓ LƯU STORAGE
      // }
    };

    const handleKeyUp = (e) => {
      // Khi nhả phím Shift hoặc Ctrl ra và không còn phím hệ thống nào bị đè
      const isAnyModifierPressed = e.shiftKey || e.ctrlKey || e.altKey || e.metaKey;
      if ((e.key === 'Shift' || e.key === 'Control'|| e.key === 'Alt' || e.key === 'Meta') && !isAnyModifierPressed) {
    
        
        // Xóa hẹn giờ cũ (nếu có) để chuẩn bị set lượt hẹn giờ mới
        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        // DELAY 0.5s: Chờ 500ms sau khi buông tay mới từ từ tắt mờ
        timeoutRef.current = setTimeout(() => {
          setIsTabBlurred(false);
        }, 500);
      }
    };

    // Khi đổi tab hoặc mở tool chụp ảnh (Win+Shift+S / Điện thoại)
    const handleWindowBlur = () => {
      setIsTabBlurred(true); // CHỈ LÀM MỜ TẠM THỜI, KHÔNG KHÓA WEB
    };

    // Khi người dùng quay lại trang web
    const handleWindowFocus = () => {
      setIsTabBlurred(false); // TỰ ĐỘNG MỞ KHÓA GIẢI PHÓNG TRẢI NGHIỆM
    };

    const handleContextMenu = (e) => {
      e.preventDefault();
      triggerAlert(); // Cố tình chuột phải để Inspect -> Phạt!
    };

    const handleMouseLeave = (e) => {
    // Nếu chuột rời khỏi hẳn cửa sổ trình duyệt (thường xảy ra khi tool chụp hiện lên)
    setIsTabBlurred(true);
    };

    const handleMouseEnter = () => {
    setIsTabBlurred(false);
    };

    document.documentElement.addEventListener('mouseleave', handleMouseLeave);
    document.documentElement.addEventListener('mouseenter', handleMouseEnter);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);
    window.addEventListener('contextmenu', handleContextMenu);

    return () => {
        document.documentElement.removeEventListener('mouseleave', handleMouseLeave);
        document.documentElement.removeEventListener('mouseenter', handleMouseEnter);
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
        window.removeEventListener('blur', handleWindowBlur);
        window.removeEventListener('focus', handleWindowFocus);
        window.removeEventListener('contextmenu', handleContextMenu);
        // Dọn dẹp bộ nhớ nếu component bị unmount
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return { isAlertActive, isTabBlurred, triggerAlert, clearAlert };
};