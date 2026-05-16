import { useState } from "react";
import { Routes, Route } from 'react-router-dom';
import Login from "./pages/Login.jsx";
import MascotHelper from "./components/MascotHelper";
import DynamicModal from "./components/DynamicModal";

function App() {
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

  //------------------- Hết hàm ----------------------

  return (
    <div className="antialiased">
      <Routes>
        <Route path="/login" element={
          <Login
            setGlobalModal = {setModalConfig}
            addHelperError = { (newErr) => setErrorStack(prev => [...prev, newErr])}
            setHelperFocusState = {setIsHelperFocusing}
          />} 
        />
      </Routes>


      {/* Component chung (như helper với modal thông báo) */}
      <DynamicModal 
          {...modalConfig} 
          onClose={closeModal}
      />    

      <MascotHelper 
          errorStack={errorStack} 
          onClearError={clearError} 
          isInputFocusing={isHelperFocusing}
      />
    </div>
  )
}
export default App;