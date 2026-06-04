import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { I18N_KEYS } from "../i18n/key";
import { useErrorHandler } from "../hooks/useErrorHandler";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

import PageContainer from "../components/PageContainer";
import Input from "../components/Input";
import Button from "../components/Button";
import { CiCircleMore, CiCircleCheck } from "react-icons/ci";

const OTP_RESEND_SECONDS = 60;
const FINAL_STEP = 2;

const stepVariants = {
  enter: (direction) => ({
    x: direction > 0 ? 48 : -48,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction) => ({
    x: direction > 0 ? -48 : 48,
    opacity: 0,
  }),
};

export default function Signup({ setGlobalModal, addHelperError, setHelperFocusState }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const redirect = new URLSearchParams(location.search).get("redirect") || "/";
  const { handleError } = useErrorHandler(setGlobalModal, addHelperError);

  const [step, setStep] = useState(1);
  const [stepDirection, setStepDirection] = useState(1);
  const [formData, setFormData] = useState({
    email: "",
    tenHienThi: "",
    username: "",
    password: "",
  });
  const [verifyCode, setVerifyCode] = useState("");
  const [verifyCodeCooldown, setVerifyCodeCooldown] = useState(0);
  const [isNextStepLoading, setIsNextStepLoading] = useState(false);
  const [isSignupLoading, setIsSignupLoading] = useState(false);
  const [isVerifyAccountLoading, setIsVerifyAccountLoading] = useState(false);
  const [isResendingVerifyCode, setIsResendingVerifyCode] = useState(false);
  const [isSendingVerifyCode, setIsSendingVerifyCode] = useState(false);

  const verifyCodeRef = useRef(verifyCode);
  const verifyCodeCooldownRef = useRef(0);
  const isVerifyAccountLoadingRef = useRef(false);
  const isResendingVerifyCodeRef = useRef(false);
  const isSendingVerifyCodeRef = useRef(false);

  const addError = useCallback((code) => {
    addHelperError?.({
      id: Date.now(),
      code,
    });
  }, [addHelperError]);

  const handleUnhandledError = useCallback((error, handlers = {}) => {
    const result = handleError(error.response?.data);
    if (!result || result.handled) return;

    const handler = handlers[result.code];
    if (handler) {
      handler();
      return;
    }

    addError(I18N_KEYS.GLOBAL_ERROR.ERROR_unknownError);
  }, [addError, handleError]);

  const getVerifyCodeResendText = useCallback((seconds = verifyCodeCooldown) => {
    return seconds > 0
      ? [
        I18N_KEYS.SIGNUP.HANDLE.VERIFY_ACCOUNT
          .signup_handleVerifyAccount_modalButton_resendVerifyCodeWithTimer,
        { seconds },
      ]
      : I18N_KEYS.SIGNUP.HANDLE.VERIFY_ACCOUNT
        .signup_handleVerifyAccount_modalButton_resendVerifyCode;
  }, [verifyCodeCooldown]);

  const startVerifyCodeCooldown = () => {
    verifyCodeCooldownRef.current = OTP_RESEND_SECONDS;
    setVerifyCodeCooldown(OTP_RESEND_SECONDS);
  };

  useEffect(() => {
    verifyCodeRef.current = verifyCode;
  }, [verifyCode]);

  useEffect(() => {
    verifyCodeCooldownRef.current = verifyCodeCooldown;
  }, [verifyCodeCooldown]);

  useEffect(() => {
    isVerifyAccountLoadingRef.current = isVerifyAccountLoading;
  }, [isVerifyAccountLoading]);

  useEffect(() => {
    isResendingVerifyCodeRef.current = isResendingVerifyCode;
  }, [isResendingVerifyCode]);

  useEffect(() => {
    isSendingVerifyCodeRef.current = isSendingVerifyCode;
  }, [isSendingVerifyCode]);

  useEffect(() => {
    const syncTimer = window.setTimeout(() => {
      setGlobalModal((prev) => {
        if (!prev.isOpen || prev.type !== "input") return prev;

        const inputName = prev.inputProps?.name;
        let currentData = "";

        if (inputName === "email") {
          currentData = formData.email;
        } else if (inputName === "tenHienThi") {
          currentData = formData.tenHienThi;
        } else if (inputName === "username") {
          currentData = formData.username;
        } else if (inputName === "password") {
          currentData = formData.password;
        } else if (inputName === "verifyCode") {
          currentData = verifyCode;
        }

        if (prev.inputProps.value === currentData) return prev;

        return {
          ...prev,
          inputProps: { ...prev.inputProps, value: currentData },
        };
      });
    }, 0);

    return () => window.clearTimeout(syncTimer);
  }, [
    formData.email,
    formData.password,
    formData.tenHienThi,
    formData.username,
    setGlobalModal,
    verifyCode,
  ]);

  useEffect(() => {
    if (verifyCodeCooldown <= 0) return undefined;

    const timer = window.setInterval(() => {
      setVerifyCodeCooldown((prev) => Math.max(prev - 1, 0));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [verifyCodeCooldown]);

  useEffect(() => {
    const syncTimer = window.setTimeout(() => {
      setGlobalModal((prev) => {
        if (!prev.isOpen || prev.type !== "input") return prev;
        if (prev.inputProps?.name !== "verifyCode") return prev;

        const nextInputOtherActionText = getVerifyCodeResendText();
        const nextInputOtherDisabled =
          verifyCodeCooldown > 0 || isResendingVerifyCode;

        if (
          prev.inputOtherActionText === nextInputOtherActionText &&
          prev.inputOtherDisabled === nextInputOtherDisabled
        ) {
          return prev;
        }

        return {
          ...prev,
          inputOtherActionText: nextInputOtherActionText,
          inputOtherDisabled: nextInputOtherDisabled,
        };
      });
    }, 0);

    return () => window.clearTimeout(syncTimer);
  }, [
    getVerifyCodeResendText,
    i18n.language,
    isResendingVerifyCode,
    setGlobalModal,
    verifyCodeCooldown,
  ]);

  const handleSendVerifyCode = async () => {
    try {
      await axios.post("http://localhost:8080/account/send-verify-otp", null, {
        params: {
          email: formData.email,
        },
      });

      addError(
        I18N_KEYS.SIGNUP.HANDLE.VERIFY_ACCOUNT
          .signup_handleVerifyAccount_helper_success_resendVerifyCode
      );
      return true;
    } catch (error) {
      const errorData = error.response?.data;
      const result = handleError(errorData);
      if (result && !result.handled) {
        switch (result.code) {
          //Kịch bản verifyCode chưa hết hạn
          case "VERIFY_CODE_NOT_EXPIRED":
            addHelperError({
              id: Date.now(),
              code: I18N_KEYS.SIGNUP.HANDLE.VERIFY_ACCOUNT.signup_handleVerifyAccount_helper_error_verifyCodeNotExpired,
            })
            break;
          default:
            addHelperError({
              id: Date.now(),
              code: I18N_KEYS.GLOBAL_ERROR.ERROR_unknownError,
            })
            break;
        }
      }
    }

    return false;
  };

  const handleResendVerifyCodeWithCooldown = async () => {
    if (verifyCodeCooldownRef.current > 0 || isResendingVerifyCodeRef.current) return;

    try {
      isResendingVerifyCodeRef.current = true;
      setIsResendingVerifyCode(true);
      const sent = await handleSendVerifyCode();
      if (sent) {
        startVerifyCodeCooldown();
      }
    } finally {
      isResendingVerifyCodeRef.current = false;
      setIsResendingVerifyCode(false);
    }
  };

  const handleVerifyAccount = async () => {
    try {
      await axios.post("http://localhost:8080/account/verify-and-register", {
        email: formData.email,
        otp: verifyCodeRef.current,
      });

      setGlobalModal({
        isOpen: true,
        type: "one-button",
        title:
          I18N_KEYS.SIGNUP.HANDLE.VERIFY_ACCOUNT
            .signup_handleVerifyAccount_modalTitle_success_accountVerified,
        description:
          I18N_KEYS.SIGNUP.HANDLE.VERIFY_ACCOUNT
            .signup_handleVerifyAccount_modalDesc_success_accountVerified,
        primaryBtnText:
          I18N_KEYS.SIGNUP.HANDLE.VERIFY_ACCOUNT
            .signup_handleVerifyAccount_modalButton_success_accountVerified,
        onPrimaryAction: () => {
          setGlobalModal((prev) => ({ ...prev, isOpen: false }));
          navigate(`/login?redirect=${encodeURIComponent(redirect)}`, { replace: true });
        },
      });
    } catch (error) {
      const errorData = error.response?.data;
      const result = handleError(errorData);
      if (result && !result.handled) {
        switch (result.code) {
          //Kịch bản verifyCode null
          case "NULL_VERIFY_CODE":
            addHelperError({
              id: Date.now(),
              code: I18N_KEYS.SIGNUP.HANDLE.VERIFY_ACCOUNT.signup_handleVerifyAccount_input_error_nullVerifyCode,
            })
            break;
          //Kịch bản verifyCode sai
          case "VERIFY_CODE_WRONG":
            addHelperError({
              id: Date.now(),
              code: I18N_KEYS.SIGNUP.HANDLE.VERIFY_ACCOUNT.signup_handleVerifyAccount_helper_error_wrongVerifyCode,
            })
            break;
          default:
            addHelperError({
              id: Date.now(),
              code: I18N_KEYS.GLOBAL_ERROR.ERROR_unknownError,
            })
            break;
        }
      }
    }
  };
  const handleVerifyEmailSignUp = async (e) => {
    try {
      await axios.post("http://localhost:8080/account/check-signup-email", {
        email: formData.email.trim(),
      });
      return true;
    } catch (error) {
      const errorData = error.response?.data;
      const result = handleError(errorData);
      if (result && !result.handled) {
        switch (result.code) {
          //Kịch bản email null
          case "NULL_EMAIL":
            addHelperError({
              id: Date.now(),
              code: I18N_KEYS.SIGNUP.HANDLE.SIGNUP.signup_handleSignup_input_error_nullEmail,
            })
            return false;
          //Kịch bản email tầm bậy
          case "EMAIL_NOT_AN_EMAIL":
            addHelperError({
              id: Date.now(),
              code: I18N_KEYS.SIGNUP.HANDLE.SIGNUP.signup_handleSignup_input_error_typeMismatchEmail,
            })
            return false;
          //Kịch bản email vượt quá 100 ký tự
          case "EMAIL_TOO_LONG":
            addHelperError({
              id: Date.now(),
              code: I18N_KEYS.SIGNUP.HANDLE.SIGNUP.signup_handleSignup_input_error_emailTooLong,
            })
            return false;
          //Kịch bản email đã tồn tại
          case "EMAIL_EXIST":
            addHelperError({
              id: Date.now(),
              code: I18N_KEYS.SIGNUP.HANDLE.SIGNUP.signup_handleSignup_input_error_emailAlreadyExist,
            })
            return false;
          default:
            addHelperError({
              id: Date.now(),
              code: I18N_KEYS.GLOBAL_ERROR.ERROR_unknownError,
            })
            return false;
        }
      }
    }
  }

  //Hàm xử lý cái tên hiển thị
  const handleVerifyTenHienThiSignup = async (e) => {
    try {
      //await api.verifyTenHienThiSignUp({tenHienThi: formData.tenHienThi});
      return true;
    } catch (error) {
      const errorData = error.response?.data;
      const result = handleError(errorData);
      if (result && !result.handled) {
        switch (result.code) {
          //Kịch bản tên hiển thị dài quá 30 ký tự
          case "TENHIENTHI_TOO_LONG":
            addHelperError({
              id: Date.now(),
              code: I18N_KEYS.SIGNUP.HANDLE.SIGNUP.signup_handleSignup_input_error_tenHienThiTooLong,
            })
            return false;
          default:
            addHelperError({
              id: Date.now(),
              code: I18N_KEYS.GLOBAL_ERROR.ERROR_unknownError,
            })
            return false;
        }
      }
    }
  }

  //Hàm xử lý cái username
  const handleVerifyUsernameSignup = async (e) => {
    try {
      //await api.verifyUsernameSignUp({username: formData.username});
      return true;
    } catch (error) {
      const errorData = error.response?.data;
      const result = handleError(errorData);
      if (result && !result.handled) {
        switch (result.code) {
          //Kịch bản username rỗng
          case "NULL_USERNAME":
            addHelperError({
              id: Date.now(),
              code: I18N_KEYS.SIGNUP.HANDLE.SIGNUP.signup_handleSignup_input_error_nullUsername,
            })
            return false;
          //Kịch bản username sai pattern
          case "USERNAME_NOT_AN_USERNAME":
            addHelperError({
              id: Date.now(),
              code: I18N_KEYS.SIGNUP.HANDLE.SIGNUP.signup_handleSignup_input_error_usernameWrongPattern,
            })
            return false;
          //Kịch bản username quá dài
          case "USERNAME_TOO_LONG":
            addHelperError({
              id: Date.now(),
              code: I18N_KEYS.SIGNUP.HANDLE.SIGNUP.signup_handleSignup_input_error_usernameTooLong,
            })
            return false;
          //Kịch bản username đã tồn tại
          case "USERNAME_EXIST":
            addHelperError({
              id: Date.now(),
              code: I18N_KEYS.SIGNUP.HANDLE.SIGNUP.signup_handleSignup_input_error_usernameAlreadyExist,
            })
            return false;
          default:
            addHelperError({
              id: Date.now(),
              code: I18N_KEYS.GLOBAL_ERROR.ERROR_unknownError,
            })
            return false;
        }
      }
    }
  }

  //Hàm xử lý cái mật khẩu
  const handleVerifyPasswordSignup = async (e) => {
    try {
      //await api.verifyPasswordSignUp({password: formData.password});
      return true;
    } catch (error) {
      const errorData = error.response?.data;
      const result = handleError(errorData);
      if (result && !result.handled) {
        switch (result.code) {
          //Kịch bản mk null
          case "NULL_PASSWORD":
            addHelperError({
              id: Date.now(),
              code: I18N_KEYS.SIGNUP.HANDLE.SIGNUP.signup_handleSignup_input_error_nullPassword,
            })
            return false;
          //Kịch bản mk quá ngắn
          case "PASSWORD_TOO_SHORT":
            addHelperError({
              id: Date.now(),
              code: I18N_KEYS.SIGNUP.HANDLE.SIGNUP.signup_handleSignup_input_error_passwordTooShort,
            })
            return false;
          //Kịch bản mk quá dài
          case "PASSWORD_TOO_LONG":
            addHelperError({
              id: Date.now(),
              code: I18N_KEYS.SIGNUP.HANDLE.SIGNUP.signup_handleSignup_input_error_passwordTooLong,
            })
            return false;
          default:
            addHelperError({
              id: Date.now(),
              code: I18N_KEYS.GLOBAL_ERROR.ERROR_unknownError,
            })
            return false;
        }
      }
    }
  }

  const nextStep = () => {
    setStepDirection(1);
    setStep((prev) => prev + 1);
  };

  const prevStep = () => {
    setStepDirection(-1);
    setStep((prev) => prev - 1);
  };

  const openVerifyCodeModal = async () => {
    if (isSendingVerifyCodeRef.current) return;

    try {
      isSendingVerifyCodeRef.current = true;
      setIsSendingVerifyCode(true);
      setGlobalModal((prev) => ({
        ...prev,
        primaryDisabled: true,
        primaryBtnText: I18N_KEYS.SIGNUP.COMMON.signup_formButton_signupLoading,
      }));

      const sent = await handleSendVerifyCode();
      if (!sent) {
        setGlobalModal((prev) => ({
          ...prev,
          primaryDisabled: false,
          primaryBtnText:
            I18N_KEYS.SIGNUP.HANDLE.VERIFY_ACCOUNT
              .signup_handleVerifyAccount_modalButton_sendVerifyCode,
        }));
        return;
      }

      startVerifyCodeCooldown();
      setGlobalModal({
        isOpen: true,
        type: "input",
        title:
          I18N_KEYS.SIGNUP.HANDLE.VERIFY_ACCOUNT
            .signup_handleVerifyAccount_modalTitle_enterVerifyCode,
        description:
          I18N_KEYS.SIGNUP.HANDLE.VERIFY_ACCOUNT
            .signup_handleVerifyAccount_modalDesc_enterVerifyCode,
        primaryBtnText:
          I18N_KEYS.SIGNUP.HANDLE.VERIFY_ACCOUNT
            .signup_handleVerifyAccount_modalButton_verifyAccount,
        primaryBtnType: "submit",
        inputProps: {
          id: "verifyCode",
          name: "verifyCode",
          placeholder: "123456",
          value: verifyCode,
          required: true,
          errorEmpty:
            I18N_KEYS.SIGNUP.HANDLE.VERIFY_ACCOUNT
              .signup_handleVerifyAccount_input_error_nullVerifyCode,
          onChange: (event) => setVerifyCode(event.target.value),
        },
        onPrimaryAction: async () => {
          if (isVerifyAccountLoadingRef.current) return;

          try {
            isVerifyAccountLoadingRef.current = true;
            setIsVerifyAccountLoading(true);
            await handleVerifyAccount();
          } finally {
            isVerifyAccountLoadingRef.current = false;
            setIsVerifyAccountLoading(false);
          }
        },
        inputOtherActionText: getVerifyCodeResendText(OTP_RESEND_SECONDS),
        inputOtherDisabled: true,
        onInputOtherAction: handleResendVerifyCodeWithCooldown,
      });
    } catch {
      setGlobalModal((prev) => ({
        ...prev,
        primaryDisabled: false,
        primaryBtnText:
          I18N_KEYS.SIGNUP.HANDLE.VERIFY_ACCOUNT
            .signup_handleVerifyAccount_modalButton_sendVerifyCode,
      }));
    } finally {
      isSendingVerifyCodeRef.current = false;
      setIsSendingVerifyCode(false);
    }
  };

  const openAccountUnverifiedModal = () => {
    setGlobalModal({
      isOpen: true,
      type: "one-button",
      title:
        I18N_KEYS.SIGNUP.HANDLE.VERIFY_ACCOUNT
          .signup_handleVerifyAccount_modalTitle_accountUnverified,
      description: [
        I18N_KEYS.SIGNUP.HANDLE.VERIFY_ACCOUNT
          .signup_handleVerifyAccount_modalDesc_accountUnverified,
        { email: formData.email },
      ],
      primaryBtnText:
        isSendingVerifyCode
          ? I18N_KEYS.SIGNUP.COMMON.signup_formButton_signupLoading
          : I18N_KEYS.SIGNUP.HANDLE.VERIFY_ACCOUNT
            .signup_handleVerifyAccount_modalButton_sendVerifyCode,
      primaryBtnType: "submit",
      primaryDisabled: isSendingVerifyCode,
      onPrimaryAction: openVerifyCodeModal,
    });
  };

  const handleFinalSignup = async (e) => {
    e.preventDefault();
    if (isSignupLoading) return;

    try {
      setIsSignupLoading(true);

      await axios.post("http://localhost:8080/account/request-otp", {
        email: formData.email,
        tenHienThi: formData.tenHienThi,
        username: formData.username,
        password: formData.password,
      });

      nextStep();

      openAccountUnverifiedModal();
    } catch (error) {
      const errorData = error.response?.data;
      const result = handleError(errorData);

      if (result && !result.handled) {
        switch (result.code) {
          case "EMAIL_EXIST":
            addHelperError({
              id: Date.now(),
              code: I18N_KEYS.SIGNUP.HANDLE.SIGNUP
                .signup_handleSignup_input_error_emailAlreadyExist,
            });
            break;

          case "TENHIENTHI_TOO_LONG":
            addHelperError({
              id: Date.now(),
              code: I18N_KEYS.SIGNUP.HANDLE.SIGNUP
                .signup_handleSignup_input_error_tenHienThiTooLong,
            });
            break;

          case "NULL_USERNAME":
            addHelperError({
              id: Date.now(),
              code: I18N_KEYS.SIGNUP.HANDLE.SIGNUP
                .signup_handleSignup_input_error_nullUsername,
            });
            break;

          case "USERNAME_NOT_AN_USERNAME":
            addHelperError({
              id: Date.now(),
              code: I18N_KEYS.SIGNUP.HANDLE.SIGNUP
                .signup_handleSignup_input_error_usernameWrongPattern,
            });
            break;

          case "USERNAME_TOO_LONG":
            addHelperError({
              id: Date.now(),
              code: I18N_KEYS.SIGNUP.HANDLE.SIGNUP
                .signup_handleSignup_input_error_usernameTooLong,
            });
            break;

          case "USERNAME_EXIST":
            addHelperError({
              id: Date.now(),
              code: I18N_KEYS.SIGNUP.HANDLE.SIGNUP
                .signup_handleSignup_input_error_usernameAlreadyExist,
            });
            break;

          case "NULL_PASSWORD":
            addHelperError({
              id: Date.now(),
              code: I18N_KEYS.SIGNUP.HANDLE.SIGNUP
                .signup_handleSignup_input_error_nullPassword,
            });
            break;

          case "PASSWORD_TOO_SHORT":
            addHelperError({
              id: Date.now(),
              code: I18N_KEYS.SIGNUP.HANDLE.SIGNUP
                .signup_handleSignup_input_error_passwordTooShort,
            });
            break;

          case "PASSWORD_TOO_LONG":
            addHelperError({
              id: Date.now(),
              code: I18N_KEYS.SIGNUP.HANDLE.SIGNUP
                .signup_handleSignup_input_error_passwordTooLong,
            });
            break;

          default:
            addHelperError({
              id: Date.now(),
              code: I18N_KEYS.GLOBAL_ERROR.ERROR_unknownError,
            });
            break;
        }
      }
    } finally {
      setIsSignupLoading(false);
    }
  };

  const handleNextStep = async (event) => {
    event.preventDefault();
    if (isNextStepLoading) return;

    try {
      setIsNextStepLoading(true);

      if (step === 1 && (await handleVerifyEmailSignUp())) {
        nextStep();
        return;
      }
    } finally {
      setIsNextStepLoading(false);
    }
  };

  const handleUsernameChange = (event) => {
    const value = event.target.value
      .toLowerCase()
      .replace(/\s/g, "_")
      .replace(/[^a-z0-9_]/g, "");

    setFormData((prev) => ({ ...prev, username: value }));
  };

  return (
    <PageContainer setHelperFocusState={setHelperFocusState} headerType="simple">
      <div className="relative z-10">
        <div className="flex items-center justify-center p-4">
          <div className="flex min-h-full flex-col justify-center rounded-xl bg-main-bg px-10 py-10 shadow-2xl shadow-primary-400 dark:shadow-none sm:min-w-md sm:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-sm">
              <img src="/logo.svg" alt="EyesOnly Logo" className="mx-auto h-8 w-auto" />
              <h2 className="mt-10 text-center text-2xl/7 font-bold tracking-tight text-main-text">
                {t(I18N_KEYS.SIGNUP.COMMON.signup_title_signup)}
              </h2>
            </div>

            <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
              <form
                method="POST"
                onSubmit={step !== FINAL_STEP ? handleNextStep : handleFinalSignup}
                className="space-y-6"
              >
                {step <= FINAL_STEP && (
                  <AnimatePresence mode="wait" custom={stepDirection}>
                    <motion.div
                      key={step}
                      custom={stepDirection}
                      variants={stepVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{ duration: 0.28, ease: "easeOut" }}
                      className="space-y-6"
                    >
                      {step === 1 && (
                        <Input
                          id="email"
                          name="email"
                          label={t(I18N_KEYS.SIGNUP.COMMON.signup_formLabel_email)}
                          value={formData.email}
                          type="email"
                          placeholder="you@example.com"
                          required
                          maxLength="100"
                          errorEmpty={t(
                            I18N_KEYS.SIGNUP.HANDLE.SIGNUP
                              .signup_handleSignup_input_error_nullEmail
                          )}
                          errorType={t(
                            I18N_KEYS.SIGNUP.HANDLE.SIGNUP
                              .signup_handleSignup_input_error_typeMismatchEmail
                          )}
                          errorTooLong={t(
                            I18N_KEYS.SIGNUP.HANDLE.SIGNUP
                              .signup_handleSignup_input_error_emailTooLong
                          )}
                          autoComplete="email"
                          onChange={(event) =>
                            setFormData((prev) => ({ ...prev, email: event.target.value }))
                          }
                        />
                      )}

                      {step === 2 && (
                        <>
                          <Input
                            id="tenHienThi"
                            name="tenHienThi"
                            value={formData.tenHienThi}
                            label={t(I18N_KEYS.SIGNUP.COMMON.signup_formLabel_tenHienThi)}
                            optional
                            placeholder={t(
                              I18N_KEYS.SIGNUP.COMMON.signup_formPlaceholder_tenHienThi
                            )}
                            errorTooLong={t(
                              I18N_KEYS.SIGNUP.HANDLE.SIGNUP
                                .signup_handleSignup_input_error_tenHienThiTooLong
                            )}
                            maxLength="30"
                            onChange={(event) =>
                              setFormData((prev) => ({
                                ...prev,
                                tenHienThi: event.target.value,
                              }))
                            }
                          />

                          <Input
                            id="username"
                            name="username"
                            value={formData.username}
                            label={t(I18N_KEYS.SIGNUP.COMMON.signup_formLabel_username)}
                            leftIcon={<span className="text-text-shade-200">@</span>}
                            placeholder={t(
                              I18N_KEYS.SIGNUP.COMMON.signup_formPlaceholder_username
                            )}
                            helperText={t(
                              I18N_KEYS.SIGNUP.COMMON.signup_formHelperText_username
                            )}
                            required
                            errorEmpty={t(
                              I18N_KEYS.SIGNUP.HANDLE.SIGNUP
                                .signup_handleSignup_input_error_nullUsername
                            )}
                            errorPattern={t(
                              I18N_KEYS.SIGNUP.HANDLE.SIGNUP
                                .signup_handleSignup_input_error_usernameWrongPattern
                            )}
                            errorTooLong={t(
                              I18N_KEYS.SIGNUP.HANDLE.SIGNUP
                                .signup_handleSignup_input_error_usernameTooLong
                            )}
                            pattern="[a-z0-9_]+"
                            maxLength="20"
                            autoCapitalize="none"
                            autoCorrect="off"
                            onChange={handleUsernameChange}
                          />

                          <Input
                            id="password"
                            name="password"
                            value={formData.password}
                            label={t(I18N_KEYS.SIGNUP.COMMON.signup_formLabel_password)}
                            rightIcon={
                              formData.password.length === 0 ? null : formData.password.length < 6 ? (
                                <span className="text-xl font-bold text-text-shade-200">
                                  <CiCircleMore strokeWidth={1} />
                                </span>
                              ) : (
                                <span className="text-xl font-bold text-primary-500">
                                  <CiCircleCheck strokeWidth={1} />
                                </span>
                              )
                            }
                            placeholder="••••••••"
                            helperText={t(
                              I18N_KEYS.SIGNUP.COMMON.signup_formHelperText_password
                            )}
                            required
                            errorEmpty={t(
                              I18N_KEYS.SIGNUP.HANDLE.SIGNUP
                                .signup_handleSignup_input_error_nullPassword
                            )}
                            errorTooShort={t(
                              I18N_KEYS.SIGNUP.HANDLE.SIGNUP
                                .signup_handleSignup_input_error_passwordTooShort
                            )}
                            errorTooLong={t(
                              I18N_KEYS.SIGNUP.HANDLE.SIGNUP
                                .signup_handleSignup_input_error_passwordTooLong
                            )}
                            type="password"
                            maxLength="32"
                            minLength="6"
                            onChange={(event) =>
                              setFormData((prev) => ({
                                ...prev,
                                password: event.target.value,
                              }))
                            }
                          />

                          <span className="mt-2 text-xs leading-tight text-main-text">
                            {t(I18N_KEYS.SIGNUP.COMMON.signup_formText_termsAgree)}
                            <Link
                              to="/terms"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-semibold text-primary hover:text-primary-700"
                            >
                              {t(I18N_KEYS.COMMON.common_footerButton_terms)}
                            </Link>
                            .
                          </span>
                        </>
                      )}
                    </motion.div>
                  </AnimatePresence>
                )}

                {step <= FINAL_STEP ? (
                  <div className="mt-6 flex justify-between gap-3">
                    {step > 1 ? (
                      <Button
                        type="button"
                        variant="outline"
                        disabled={isNextStepLoading || isSignupLoading}
                        onClick={prevStep}
                      >
                        {t(I18N_KEYS.SIGNUP.COMMON.signup_formButton_prevStep)}
                      </Button>
                    ) : (
                      <div />
                    )}

                    <Button type="submit" disabled={isNextStepLoading || isSignupLoading}>
                      {isNextStepLoading || isSignupLoading
                        ? t(I18N_KEYS.SIGNUP.COMMON.signup_formButton_signupLoading)
                        : step === FINAL_STEP
                          ? t(I18N_KEYS.SIGNUP.COMMON.signup_formButton_signupSubmit)
                          : t(I18N_KEYS.SIGNUP.COMMON.signup_formButton_nextStep)}
                    </Button>
                  </div>
                ) : (
                  <div className="flex-col items-center justify-center gap-4 rounded-2xl p-4 animate-float">
                    <div className="flex items-center justify-center rounded-full">
                      <CiCircleCheck className="text-6xl text-sub-text" />
                    </div>
                    <div className="grow">
                      <h4 className="mb-1 mt-5 text-center text-sm font-bold leading-none text-sub-text">
                        {t(I18N_KEYS.SIGNUP.COMMON.signup_text_success_signup)}
                      </h4>
                    </div>
                  </div>
                )}
              </form>

              <p className="mt-10 text-center text-sm/6 text-text-shade-400">
                {t(I18N_KEYS.SIGNUP.COMMON.signup_text_isAMember)}
                <Link
                  to={`/login?redirect=${encodeURIComponent(redirect)}`}
                  className="font-semibold text-accent-700 hover:text-accent-400"
                >
                  <br />
                  {t(I18N_KEYS.SIGNUP.COMMON.signup_button_toLoginPage)}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
