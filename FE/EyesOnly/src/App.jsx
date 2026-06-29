import { useState, useEffect, useRef, useCallback } from "react";
import { AuthProvider } from "./context/AuthContext.jsx";
import { Routes, Route, useLocation, useNavigationType } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { I18N_KEYS } from "./i18n/key.js";

import { useSecurity } from "./hooks/useSecurity";
import { useVisitorInfo } from "./hooks/useVisitorInfo";
import DynamicWatermark from "./components/DynamicWatermark";

import AdminLayout from "./components/admin/AdminLayout.jsx";
import AdminLogin from "./pages/admin/AdminLogin.jsx";
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import AdminPostList from "./pages/admin/AdminPostList.jsx";
import AdminPostDetail from "./pages/admin/AdminPostDetail.jsx";
import AdminUserList from "./pages/admin/AdminUserList.jsx";
import AdminUserDetail from "./pages/admin/AdminUserDetail.jsx";
import AdminStaffList from "./pages/admin/AdminStaffList.jsx";
import AdminProfile from "./pages/admin/AdminProfile.jsx";

import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import Home from "./pages/Home.jsx";
import PostCreate from "./pages/PostCreate.jsx";
import PostDetail from "./pages/PostDetail.jsx";
import PostEdit from "./pages/PostEdit.jsx";
import MixedSearch from "./pages/MixedSearch";
import UserDetail from "./pages/UserDetail.jsx";
import Profile from "./pages/Profile.jsx";
import Verify from "./pages/Verify.jsx";
import VerifyResult from "./pages/VerifyResult.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";
import Terms from "./pages/Terms.jsx";
import AboutUs from "./pages/AboutUs.jsx";

import MascotHelper from "./components/MascotHelper";
import DynamicModal from "./components/DynamicModal";

function App() {
  const location = useLocation();
  const navigationType = useNavigationType();
  const visitor = useVisitorInfo();
  const { isAlertActive, isTabBlurred, clearAlert } = useSecurity();
  const currentAlpha = isAlertActive || isTabBlurred ? 0.08 : 0.04;
  const { t } = useTranslation();
  const mascotRef = useRef();
  const [modalConfig, setModalConfig] = useState({ isOpen: false });
  const [errorStack, setErrorStack] = useState([]);
  const [isHelperFocusing, setIsHelperFocusing] = useState(false);
  const [isUnder18, setIsUnder18] = useState(() => {
    const savedAgeStatus = localStorage.getItem("under18");
    return savedAgeStatus === null ? null : savedAgeStatus === "true";
  });

  const closeModal = useCallback(() => {
    setModalConfig((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const handleAgeSelection = useCallback((under18) => {
    localStorage.setItem("under18", under18);
    setIsUnder18(under18);
    closeModal();
  }, [closeModal]);

  const handleExitComplete = () => {
    if (navigationType === "POP") {
      return;
    }

    requestAnimationFrame(() => {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "auto",
      });
    });
  };

  const addHelperError = (newErr) => {
    setErrorStack((prev) => [...prev, newErr]);
  };

  const clearError = (id) => {
    setErrorStack((prev) => prev.filter((err) => err.id !== id));
  };

  const clearAllErrors = () => setErrorStack([]);

  const triggerMascotMood = (mood, duration) => {
    if (mascotRef.current) {
      mascotRef.current.setMood(mood, duration);
    }
  };

  const commonPageProps = {
    setGlobalModal: setModalConfig,
    addHelperError,
    setHelperFocusState: setIsHelperFocusing,
    triggerMascotMood,
    isUnder18,
    visitorIP: visitor.ip,
    isAlertActive,
    clearAlert,
  };

  return (
    <AuthProvider>
      <div className="antialiased">
        <AnimatePresence mode="wait" onExitComplete={handleExitComplete}>
          <Routes location={location} key={location.pathname}>
            <Route
              path="/login"
              element={
                <Login
                  setGlobalModal={setModalConfig}
                  addHelperError={addHelperError}
                  setHelperFocusState={setIsHelperFocusing}
                  triggerMascotMood={triggerMascotMood}
                />
              }
            />
            <Route
              path="/signup"
              element={
                <Signup
                  setGlobalModal={setModalConfig}
                  addHelperError={addHelperError}
                  setHelperFocusState={setIsHelperFocusing}
                />
              }
            />
            <Route
              path="/"
              element={<Home {...commonPageProps} isTabBlurred={isTabBlurred} />}
            />
            <Route path="/post/create" element={<PostCreate {...commonPageProps} />} />
            <Route path="/post/:postID" element={<PostDetail {...commonPageProps} />} />
            <Route path="/post/edit/:postID" element={<PostEdit {...commonPageProps} />} />
            <Route path="/search" element={<MixedSearch {...commonPageProps} />} />
            <Route path="/user/:username" element={<UserDetail {...commonPageProps} />} />
            <Route path="/profile" element={<Profile {...commonPageProps} />} />
            <Route path="/verify" element={<Verify {...commonPageProps} />} />
            <Route path="/verify/:verifyID" element={<VerifyResult {...commonPageProps} />} />

            <Route
              path="/admin/login"
              element={
                <AdminLogin
                  setGlobalModal={setModalConfig}
                  addHelperError={addHelperError}
                  setHelperFocusState={setIsHelperFocusing}
                />
              }
            />
            <Route
              path="/admin"
              element={
                <AdminLayout
                  setGlobalModal={setModalConfig}
                  addHelperError={addHelperError}
                  setHelperFocusState={setIsHelperFocusing}
                />
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="posts" element={<AdminPostList />} />
              <Route path="posts/:postID" element={<AdminPostDetail />} />
              <Route path="users" element={<AdminUserList />} />
              <Route path="users/:accountID" element={<AdminUserDetail />} />
              <Route path="staff" element={<AdminStaffList />} />
              <Route path="profile" element={<AdminProfile />} />
            </Route>

            <Route
              path="/404"
              element={<NotFoundPage setHelperFocusState={setIsHelperFocusing} />}
            />
            <Route path="/about" element={<AboutUs setHelperFocusState={setIsHelperFocusing} />} />
            <Route path="/terms" element={<Terms setHelperFocusState={setIsHelperFocusing} />} />
            <Route path="*" element={<NotFoundPage setHelperFocusState={setIsHelperFocusing} />} />
          </Routes>
        </AnimatePresence>

        <DynamicWatermark ip={visitor.ip} alpha={currentAlpha} />



        <DynamicModal key={modalConfig.title} {...modalConfig} onClose={closeModal} />

        <MascotHelper
          ref={mascotRef}
          errorStack={errorStack}
          onClearError={clearError}
          onClearAllErrors={clearAllErrors}
          isInputFocusing={isHelperFocusing}
        />
      </div>
    </AuthProvider>
  );
}

export default App;
