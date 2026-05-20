import { useEffect, useRef, useState, useCallback } from "react";

export const useSecurity = () => {

  const suspiciousBlurRef = useRef(false);

  const checkInitialAlert = () => {
    const alertActive = localStorage.getItem("security_alert") === "true";
    const expiresAt = localStorage.getItem("security_alert_expires_at");

    if (alertActive && expiresAt) {
      if (Date.now() > parseInt(expiresAt, 10)) {
        localStorage.removeItem("security_alert");
        localStorage.removeItem("security_alert_expires_at");
        return false;
      }

      return true;
    }

    return alertActive;
  };

  const [isAlertActive, setIsAlertActive] = useState(checkInitialAlert);
  const [isTabBlurred, setIsTabBlurred] = useState(false);

  const timeoutRef = useRef(null);
  const blurredRef = useRef(false);

  const setBlurredSafe = useCallback((value) => {
    if (blurredRef.current === value) return;

    blurredRef.current = value;
    setIsTabBlurred(value);
  }, []);

  const triggerAlert = useCallback(() => {
    setIsAlertActive(true);

    localStorage.setItem("security_alert", "true");

    const cooldownTime = Date.now() + 3 * 60 * 1000;
    localStorage.setItem("security_alert_expires_at", cooldownTime.toString());
  }, []);

  const clearAlert = useCallback(() => {
    setIsAlertActive(false);

    localStorage.removeItem("security_alert");
    localStorage.removeItem("security_alert_expires_at");
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const expiresAt = localStorage.getItem("security_alert_expires_at");

      if (expiresAt && Date.now() > parseInt(expiresAt, 10)) {
        clearAlert();
      }
    }, 5000);

    const turnOnBlur = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      setBlurredSafe(true);
    };

    const turnOffBlur = (delay = 100) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        if (!document.hidden && document.hasFocus()) {
          setBlurredSafe(false);
        }
      }, delay);
    };

    const handleKeyDown = (e) => {
      const key = e.key?.toLowerCase();

      const isMacScreenshot =
        e.metaKey && e.shiftKey && ["3", "4", "5"].includes(e.key);

      const isDevToolsOrPrint =
        e.key === "PrintScreen" ||
        //e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && ["i", "j", "c"].includes(key)) ||
        (e.ctrlKey && ["u", "p", "s"].includes(key));

      const isWindowsScreenshotPreparing =
        e.metaKey && e.shiftKey;

      const isModifierKey =
        key === "shift" ||
        key === "control" ||
        key === "alt" ||
        key === "meta";

      const isAnyModifierPressed =
        e.shiftKey || e.ctrlKey || e.altKey || e.metaKey;

      if (isModifierKey || isAnyModifierPressed) {
        turnOnBlur();

        if (isWindowsScreenshotPreparing) {
          suspiciousBlurRef.current = true;
        }
      }

      if (isMacScreenshot || isDevToolsOrPrint) {
        e.preventDefault();
        triggerAlert();
      }
    };

    const handleKeyUp = (e) => {
      const key = e.key?.toLowerCase();

      const isModifierKey =
        key === "shift" ||
        key === "control" ||
        key === "alt" ||
        key === "meta";

      const isAnyModifierPressed =
        e.shiftKey || e.ctrlKey || e.altKey || e.metaKey;

      if (isModifierKey && !isAnyModifierPressed) {
        const delay = suspiciousBlurRef.current ? 3500 : 100;

        suspiciousBlurRef.current = false;
        turnOffBlur(delay);
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        turnOnBlur();
      } else {
        turnOffBlur();
      }
    };

    const handleWindowBlur = () => {
      turnOnBlur();
    };

    const handleWindowFocus = () => {
      turnOffBlur();
    };

    const handleContextMenu = (e) => {
      e.preventDefault();
      triggerAlert();
    };

    const handleMouseLeave = (e) => {
      if (!e.relatedTarget) {
        turnOnBlur();
      }
    };

    const handleMouseEnter = () => {
      turnOffBlur();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.documentElement.addEventListener("mouseleave", handleMouseLeave);
    document.documentElement.addEventListener("mouseenter", handleMouseEnter);

    window.addEventListener("keydown", handleKeyDown, { capture: true });
    window.addEventListener("keyup", handleKeyUp, { capture: true });
    window.addEventListener("blur", handleWindowBlur);
    window.addEventListener("focus", handleWindowFocus);
    window.addEventListener("contextmenu", handleContextMenu);

    return () => {
      clearInterval(interval);

      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.documentElement.removeEventListener("mouseleave", handleMouseLeave);
      document.documentElement.removeEventListener("mouseenter", handleMouseEnter);

      window.removeEventListener("keydown", handleKeyDown, { capture: true });
      window.removeEventListener("keyup", handleKeyUp, { capture: true });
      window.removeEventListener("blur", handleWindowBlur);
      window.removeEventListener("focus", handleWindowFocus);
      window.removeEventListener("contextmenu", handleContextMenu);

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [clearAlert, triggerAlert, setBlurredSafe]);

  return {
    isAlertActive,
    isTabBlurred,
    triggerAlert,
    clearAlert,
  };
};