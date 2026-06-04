import { useCallback, useEffect, useRef, useState } from "react";

export const useSecurity = () => {
  const suspiciousBlurRef = useRef(false);
  const timeoutRef = useRef(null);
  const blurredRef = useRef(false);

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
    const interval = window.setInterval(() => {
      const expiresAt = localStorage.getItem("security_alert_expires_at");

      if (expiresAt && Date.now() > parseInt(expiresAt, 10)) {
        clearAlert();
      }
    }, 5000);

    const turnOnBlur = () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      setBlurredSafe(true);
    };

    const turnOffBlur = (delay = 100) => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = window.setTimeout(() => {
        if (!document.hidden && document.hasFocus()) {
          setBlurredSafe(false);
        }
      }, delay);
    };

    const protectNow = (event, delay = 4500) => {
      if (event?.cancelable) {
        event.preventDefault();
      }

      event?.stopPropagation?.();
      event?.stopImmediatePropagation?.();

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

        await navigator.clipboard.writeText("[Bruh, chill, chill]");
        return true;
      } catch (error) {
        console.warn("Could not overwrite clipboard:", error);
        return false;
      }
    };

    const isPrintScreenKey = (event) => {
      return (
        event.key === "PrintScreen" ||
        event.code === "PrintScreen" ||
        event.keyCode === 44 ||
        event.which === 44
      );
    };

    const isMacScreenshotShortcut = (event) => {
      return event.metaKey && event.shiftKey && ["3", "4", "5"].includes(event.key);
    };

    const isWindowsScreenshotShortcut = (event) => {
      const key = event.key?.toLowerCase();

      return (
        (event.metaKey && event.shiftKey && ["s", "r"].includes(key)) ||
        (event.metaKey && isPrintScreenKey(event)) ||
        (event.altKey && isPrintScreenKey(event))
      );
    };

    const isLinuxScreenshotShortcut = (event) => {
      const key = event.key?.toLowerCase();

      return (
        isPrintScreenKey(event) ||
        (event.altKey && isPrintScreenKey(event)) ||
        (event.shiftKey && isPrintScreenKey(event)) ||
        (event.metaKey && event.shiftKey && isPrintScreenKey(event)) ||
        (event.ctrlKey && event.shiftKey && event.altKey && key === "r")
      );
    };

    const isScreenshotOrRecordingShortcut = (event) => {
      return (
        isPrintScreenKey(event) ||
        isMacScreenshotShortcut(event) ||
        isWindowsScreenshotShortcut(event) ||
        isLinuxScreenshotShortcut(event)
      );
    };

    const handleKeyDown = (event) => {
      const key = event.key?.toLowerCase();

      if (isScreenshotOrRecordingShortcut(event)) {
        protectNow(event, 4500);
        return;
      }

      const isWindowsScreenshotPreparing = event.metaKey && event.shiftKey;
      const isModifierKey =
        key === "shift" ||
        key === "control" ||
        key === "alt" ||
        key === "meta";
      const isAnyModifierPressed =
        event.shiftKey || event.ctrlKey || event.altKey || event.metaKey;

      if (isModifierKey || isAnyModifierPressed) {
        turnOnBlur();

        if (isWindowsScreenshotPreparing) {
          suspiciousBlurRef.current = true;
        }
      }

      // const isDevToolsOrPrint =
      //   event.key === "F12" ||
      //   (event.ctrlKey && event.shiftKey && ["i", "j", "c"].includes(key)) ||
      //   (event.ctrlKey && ["u", "p", "s"].includes(key));

      // if (isDevToolsOrPrint) {
      //   protectNow(event, 3500);
      // }
    };

    const handleKeyUp = (event) => {
      const key = event.key?.toLowerCase();

      if (isScreenshotOrRecordingShortcut(event)) {
        protectNow(event, 4500);
        return;
      }

      const isModifierKey =
        key === "shift" ||
        key === "control" ||
        key === "alt" ||
        key === "meta";
      const isAnyModifierPressed =
        event.shiftKey || event.ctrlKey || event.altKey || event.metaKey;

      if (isModifierKey && !isAnyModifierPressed) {
        const delay = suspiciousBlurRef.current ? 3500 : 100;

        suspiciousBlurRef.current = false;
        turnOffBlur(delay);
      }
    };

    const handlePaste = async (event) => {
      if (!hasImageInClipboard(event.clipboardData)) return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation?.();

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

    const handleContextMenu = (event) => {
      event.preventDefault();
      triggerAlert();
    };

    const handleMouseLeave = (event) => {
      if (!event.relatedTarget) {
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
    window.addEventListener("keydown", handleKeyDown, { capture: true });
    window.addEventListener("keyup", handleKeyUp, { capture: true });
    window.addEventListener("blur", handleWindowBlur);
    window.addEventListener("focus", handleWindowFocus);
    // window.addEventListener("contextmenu", handleContextMenu);

    return () => {
      window.clearInterval(interval);

      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.documentElement.removeEventListener("mouseleave", handleMouseLeave);
      document.documentElement.removeEventListener("mouseenter", handleMouseEnter);

      window.removeEventListener("paste", handlePaste, { capture: true });
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
      window.removeEventListener("keyup", handleKeyUp, { capture: true });
      window.removeEventListener("blur", handleWindowBlur);
      window.removeEventListener("focus", handleWindowFocus);
      // window.removeEventListener("contextmenu", handleContextMenu);

      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, [clearAlert, setBlurredSafe, triggerAlert]);

  return {
    isAlertActive,
    isTabBlurred,
    triggerAlert,
    clearAlert,
  };
};
