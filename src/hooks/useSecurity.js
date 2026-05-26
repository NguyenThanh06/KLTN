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

    const protectNow = (e, delay = 4500) => {
      if (e?.cancelable) {
        e.preventDefault();
      }

      e?.stopPropagation?.();
      e?.stopImmediatePropagation?.();

      suspiciousBlurRef.current = true;
      turnOnBlur();
      triggerAlert();
      turnOffBlur(delay);
    };

    const hasImageInClipboard = (clipboardData) => {
      const items = Array.from(clipboardData?.items || []);
      const files = Array.from(clipboardData?.files || []);

      return (
        items.some((item) => item.type?.startsWith("image/")) ||
        files.some((file) => file.type?.startsWith("image/"))
      );
    };

    const tryClearClipboard = async () => {
      try {
        if (!navigator.clipboard?.writeText) return false;
        if (!window.isSecureContext) return false;

        await navigator.clipboard.writeText(
          "[Bruh, chill, chill]"
        );

        return true;
      } catch (error) {
        console.warn("Không thể ghi đè clipboard:", error);
        return false;
      }
    };

    const isPrintScreenKey = (e) => {
      return (
        e.key === "PrintScreen" ||
        e.code === "PrintScreen" ||
        e.keyCode === 44 ||
        e.which === 44
      );
    };

    const isMacScreenshotShortcut = (e) => {
      return e.metaKey && e.shiftKey && ["3", "4", "5"].includes(e.key);
    };

    const isWindowsScreenshotShortcut = (e) => {
      const key = e.key?.toLowerCase();

      return (
        (e.metaKey && e.shiftKey && ["s", "r"].includes(key)) ||
        (e.metaKey && isPrintScreenKey(e)) ||
        (e.altKey && isPrintScreenKey(e))
        // Cân nhắc bật nếu muốn cực gắt:
        // || (e.metaKey && e.code === "Space")
      );
    };

    const isLinuxScreenshotShortcut = (e) => {
      const key = e.key?.toLowerCase();

      return (
        isPrintScreenKey(e) ||
        (e.altKey && isPrintScreenKey(e)) ||
        (e.shiftKey && isPrintScreenKey(e)) ||
        (e.metaKey && e.shiftKey && isPrintScreenKey(e)) ||
        (e.ctrlKey && e.shiftKey && e.altKey && key === "r")
      );
    };

    const isScreenshotOrRecordingShortcut = (e) => {
      return (
        isPrintScreenKey(e) ||
        isMacScreenshotShortcut(e) ||
        isWindowsScreenshotShortcut(e) ||
        isLinuxScreenshotShortcut(e)
      );
    };

    const handleKeyDown = (e) => {
      const key = e.key?.toLowerCase();

      if (isScreenshotOrRecordingShortcut(e)) {
        protectNow(e, 4500);
        return;
      }

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

      const isDevToolsOrPrint =
        (e.key === "F12") ||
        (e.ctrlKey && e.shiftKey && ["i", "j", "c"].includes(key)) ||
        (e.ctrlKey && ["u", "p", "s"].includes(key));

      if (isDevToolsOrPrint) {
        protectNow(e, 3500);
      }
    };

    const handleKeyUp = (e) => {
      const key = e.key?.toLowerCase();

      if (isScreenshotOrRecordingShortcut(e)) {
        protectNow(e, 4500);
        return;
      }

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

    const handlePaste = async (e) => {
      const hasImage = hasImageInClipboard(e.clipboardData);

      if (!hasImage) return;

      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation?.();

      triggerAlert();
      turnOnBlur();

      await tryClearClipboard();

      turnOffBlur(3500);
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
    window.addEventListener("paste", handlePaste, { capture: true });
    window.addEventListener("paste", handlePaste, { capture: true });

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
      window.removeEventListener("paste", handlePaste, { capture: true });
      window.removeEventListener("paste", handlePaste, { capture: true });

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