import { useState, useEffect, useRef } from "react";
import { AuthProvider } from "./context/AuthContext.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";

import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import Home from "./pages/Home.jsx";

import MascotHelper from "./components/MascotHelper";
import DynamicModal from "./components/DynamicModal";

function App() {
  const location = useLocation();
  const mascotRef = useRef(); // Tạo ref để điều khiển MascotHelper
  const [modalConfig, setModalConfig] = useState({ isOpen:false });
  const [errorStack, setErrorStack] = useState([]);
  const [isHelperFocusing, setIsHelperFocusing] = useState(false);

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
                  />} 
                />
              </Routes>
          </AnimatePresence>
          

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