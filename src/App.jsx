import { useState, useEffect, useRef } from "react";
import { AuthProvider } from "./context/AuthContext.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { I18N_KEYS } from "./i18n/key.js";

import { useSecurity } from './hooks/useSecurity';
import { useVisitorInfo } from './hooks/useVisitorInfo';
import DynamicWatermark from './components/DynamicWatermark';
import CatSentinel from './components/CatSentinel';


import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import Home from "./pages/Home.jsx";

import MascotHelper from "./components/MascotHelper";
import DynamicModal from "./components/DynamicModal";

function App() {
  const location = useLocation();
  const visitor = useVisitorInfo(); // Lấy IP và Path hiện tại
  const { isAlertActive, isTabBlurred, clearAlert } = useSecurity(); // Quản lý trạng thái báo động
  const currentAlpha = (isAlertActive || isTabBlurred) ? 0.08 : 0.04; //Quản lý cái độ mờ của thủy ấn động
  const { t, i18n } = useTranslation();
  const mascotRef = useRef(); // Tạo ref để điều khiển MascotHelper
  const [modalConfig, setModalConfig] = useState({ isOpen:false });
  const [errorStack, setErrorStack] = useState([]);
  const [isHelperFocusing, setIsHelperFocusing] = useState(false);
  const [isUnder18, setIsUnder18] = useState(null);


  useEffect(() => {
    const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';
    const savedAgeStatus = localStorage.getItem('under18');
    const isUnder18Boolean = savedAgeStatus === 'true';

    setIsUnder18(isUnder18Boolean);

    // Nếu không phải trang Auth và chưa có thông tin tuổi
    if (!isAuthPage && savedAgeStatus === null) {
      
      // KIỂM TRA: Nếu đang có một modal khác (như báo vô hiệu hóa) đang mở
      // Thì sẽ chờ modal đó đóng xong mới hiện hỏi tuổi, hoặc chèn vào sau.
      if (!modalConfig.isOpen) {
        setModalConfig({
          isOpen: true,
          type: 'two-buttons',
          title: t(I18N_KEYS.COMMON.common_ageStatus_modalTitle),
          description: t(I18N_KEYS.COMMON.common_ageStatus_modalDesc),
          primaryBtnText: t(I18N_KEYS.COMMON.common_ageStatus_modalButton_under18),
          secondaryBtnText: t(I18N_KEYS.COMMON.common_ageStatus_modalButton_above18),
          onPrimaryAction: () => handleAgeSelection(true),
          onSecondaryAction: () => handleAgeSelection(false),
        });
      }
    }
  }, [location.pathname, modalConfig.isOpen]); // Theo dõi cả isOpen để "xếp hàng"

  //------------- Hàm ----------------------

  //Hàm đóng cái modal thông báo
  const closeModal = () => setModalConfig(prev => ({ ...prev, isOpen: false }));
  
  // Hàm xóa lỗi khi người dùng click vào bong bóng ở helper
  const clearError = (id) => {
    setErrorStack(prev => prev.filter(err => err.id !== id));
  };
  
  // Hàm xóa toàn bộ lỗi
  const clearAllErrors = () => setErrorStack([]);

  // Hàm để các page con có thể gọi để đổi mood mascot
  const triggerMascotMood = (mood, duration) => {
    if (mascotRef.current) {
      mascotRef.current.setMood(mood, duration);
    }
  };

  // Hàm chọn tuổi
  const handleAgeSelection = (under18) => {
        localStorage.setItem('under18', under18); // Lưu lại: "true" hoặc "false"
        setIsUnder18(under18);
        closeModal();
    };

  //------------------- Hết hàm ----------------------

  

  return (
    <AuthProvider>
        <div className="antialiased">
            <AnimatePresence mode="wait">
                <Routes location={location} key={location.pathname}>
                  <Route path="/login" element={
                    <Login
                      setGlobalModal = {setModalConfig}
                      addHelperError = { (newErr) => setErrorStack(prev => [...prev, newErr])}
                      setHelperFocusState = {setIsHelperFocusing}
                      triggerMascotMood={triggerMascotMood}
                    />} 
                  />
                  <Route path="/signup" element={
                      <Signup
                        setGlobalModal = {setModalConfig}
                        addHelperError = { (newErr) => setErrorStack(prev => [...prev, newErr])}
                        setHelperFocusState = {setIsHelperFocusing}
                      />
                  }
                  />
                  <Route path="/" element={
                    <Home
                      setGlobalModal = {setModalConfig}
                      addHelperError = { (newErr) => setErrorStack(prev => [...prev, newErr])}
                      setHelperFocusState = {setIsHelperFocusing}
                      isUnder18={isUnder18}
                      visitorIP={visitor.ip} 
                      isAlertActive={isAlertActive}
                      isTabBlurred={isTabBlurred}
                      clearAlert={clearAlert}
                    />} 
                  />
                </Routes>
            </AnimatePresence>
            
            {/*Watermark động toàn trang */}
            <DynamicWatermark 
              ip={visitor.ip}
              alpha = {currentAlpha}
            />


            {/* Component chung (như helper với modal thông báo) */}
            <DynamicModal 
                key={modalConfig.title}
                {...modalConfig} 
                onClose={closeModal}
            />    

            <MascotHelper 
                ref={mascotRef} // Gán ref vào đây
                errorStack={errorStack} 
                onClearError={clearError} 
                onClearAllErrors={clearAllErrors} // Truyền hàm xóa sạch lỗi
                isInputFocusing={isHelperFocusing}
            />
        </div>
    </AuthProvider>
  )
}
export default App;