import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { I18N_KEYS } from "../i18n/key";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useErrorHandler } from "../hooks/useErrorHandler";
import { useAuth } from "../context/AuthContext";
import axios from "axios";

import PageContainer from "../components/PageContainer";
import Input from "../components/Input";
import Button from "../components/Button";

const OTP_RESEND_SECONDS = 60;

export default function Login({
  setGlobalModal,
  addHelperError,
  setHelperFocusState,
  triggerMascotMood,
}) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const redirect = searchParams.get("redirect") || location.state?.from?.pathname || "/";

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [resetPasswordFormData, setResetPasswordFormData] = useState({ email: "", otp: "" });
  const [verifyCode, setVerifyCode] = useState("");

  const [resetPasswordOtpCooldown, setResetPasswordOtpCooldown] = useState(0);
  const [verifyCodeCooldown, setVerifyCodeCooldown] = useState(0);
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [isResetPasswordLoading, setIsResetPasswordLoading] = useState(false);
  const [isVerifyAccountLoading, setIsVerifyAccountLoading] = useState(false);
  const [isResendingResetPasswordOtp, setIsResendingResetPasswordOtp] = useState(false);
  const [isResendingVerifyCode, setIsResendingVerifyCode] = useState(false);
  const [isSendingVerifyCode, setIsSendingVerifyCode] = useState(false);

  const resetPasswordOtpCooldownRef = useRef(0);
  const verifyCodeCooldownRef = useRef(0);
  const isResetPasswordLoadingRef = useRef(false);
  const isVerifyAccountLoadingRef = useRef(false);
  const isResendingResetPasswordOtpRef = useRef(false);
  const isResendingVerifyCodeRef = useRef(false);
  const isSendingVerifyCodeRef = useRef(false);
  const resetPasswordFormDataRef = useRef(resetPasswordFormData);
  const verifyCodeRef = useRef(verifyCode);

  const { t, i18n } = useTranslation();
  const { handleError } = useErrorHandler(setGlobalModal, addHelperError);

  const getResetPasswordResendText = useCallback((seconds = resetPasswordOtpCooldown) => {
    return seconds > 0
      ? [
          I18N_KEYS.LOGIN.HANDLE.RESET_PASSWORD
            .login_handleResetPassword_modalButton_resendOTPWithTimer,
          { seconds },
        ]
      : I18N_KEYS.LOGIN.HANDLE.RESET_PASSWORD.login_handleResetPassword_modalButton_resendOTP;
  }, [resetPasswordOtpCooldown]);

  const getVerifyCodeResendText = useCallback((seconds = verifyCodeCooldown) => {
    return seconds > 0
      ? [
          I18N_KEYS.LOGIN.HANDLE.VERIFY_ACCOUNT
            .login_handleVerifyAccount_modalButton_resendVerifyCodeWithTimer,
          { seconds },
        ]
      : I18N_KEYS.LOGIN.HANDLE.VERIFY_ACCOUNT
          .login_handleVerifyAccount_modalButton_resendVerifyCode;
  }, [verifyCodeCooldown]);

  const addError = (code) => {
    addHelperError?.({
      id: Date.now(),
      code,
    });
  };

  const handleUnhandledError = (error, handlers = {}) => {
    const result = handleError(error.response?.data);
    if (!result || result.handled) return;

    const handler = handlers[result.code];
    if (handler) {
      handler();
      return;
    }

    addError(I18N_KEYS.GLOBAL_ERROR.ERROR_unknownError);
  };

  const startResetPasswordOtpCooldown = () => {
    resetPasswordOtpCooldownRef.current = OTP_RESEND_SECONDS;
    setResetPasswordOtpCooldown(OTP_RESEND_SECONDS);
  };

  const startVerifyCodeCooldown = () => {
    verifyCodeCooldownRef.current = OTP_RESEND_SECONDS;
    setVerifyCodeCooldown(OTP_RESEND_SECONDS);
  };

  useEffect(() => {
    verifyCodeRef.current = verifyCode;
  }, [verifyCode]);

  useEffect(() => {
    resetPasswordFormDataRef.current = resetPasswordFormData;
  }, [resetPasswordFormData]);

  useEffect(() => {
    resetPasswordOtpCooldownRef.current = resetPasswordOtpCooldown;
  }, [resetPasswordOtpCooldown]);

  useEffect(() => {
    verifyCodeCooldownRef.current = verifyCodeCooldown;
  }, [verifyCodeCooldown]);

  useEffect(() => {
    isResetPasswordLoadingRef.current = isResetPasswordLoading;
  }, [isResetPasswordLoading]);

  useEffect(() => {
    isVerifyAccountLoadingRef.current = isVerifyAccountLoading;
  }, [isVerifyAccountLoading]);

  useEffect(() => {
    isResendingResetPasswordOtpRef.current = isResendingResetPasswordOtp;
  }, [isResendingResetPasswordOtp]);

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

        if (inputName === "email_resetPassword") {
          currentData = resetPasswordFormData.email;
        } else if (inputName === "otp_resetPassword") {
          currentData = resetPasswordFormData.otp;
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
  }, [resetPasswordFormData.email, resetPasswordFormData.otp, setGlobalModal, verifyCode]);

  useEffect(() => {
    if (resetPasswordOtpCooldown <= 0) return undefined;

    const timer = window.setInterval(() => {
      setResetPasswordOtpCooldown((prev) => Math.max(prev - 1, 0));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [resetPasswordOtpCooldown]);

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

        const inputName = prev.inputProps?.name;
        if (inputName !== "otp_resetPassword" && inputName !== "verifyCode") return prev;

        const nextInputOtherActionText =
          inputName === "otp_resetPassword"
            ? getResetPasswordResendText()
            : getVerifyCodeResendText();
        const nextInputOtherDisabled =
          inputName === "otp_resetPassword"
            ? resetPasswordOtpCooldown > 0 || isResendingResetPasswordOtp
            : verifyCodeCooldown > 0 || isResendingVerifyCode;

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
    getResetPasswordResendText,
    getVerifyCodeResendText,
    i18n.language,
    isResendingResetPasswordOtp,
    isResendingVerifyCode,
    resetPasswordOtpCooldown,
    setGlobalModal,
    verifyCodeCooldown,
  ]);

  const handleSendOTPResetPassword = async () => {
    const { email } = resetPasswordFormDataRef.current;

    await axios.post("http://localhost:8080/auth/password/forgot", {
      email: email.trim(),
    });

    addError(
      I18N_KEYS.LOGIN.HANDLE.RESET_PASSWORD
        .login_handleResetPassword_helper_success_resendOTP
    );
  };

  const handleVerifyOTPResetPassword = async () => {
    try {
      const { email, otp } = resetPasswordFormDataRef.current;

      await axios.post("http://localhost:8080/auth/password/reset", {
        email: email.trim(),
        otp: otp.trim(),
      });

      setGlobalModal({
        isOpen: true,
        type: "info",
        title:
          I18N_KEYS.LOGIN.HANDLE.RESET_PASSWORD
            .login_handleResetPassword_modalTitle_success_resetPassword,
        description:
          I18N_KEYS.LOGIN.HANDLE.RESET_PASSWORD
            .login_handleResetPassword_modalDesc_success_resetPassword,
      });
    } catch (error) {
      handleUnhandledError(error, {
        NULL_RESET_PASSWORD_OTP: () =>
          addError(
            I18N_KEYS.LOGIN.HANDLE.RESET_PASSWORD
              .login_handleResetPassword_input_error_nullOTP
          ),
        WRONG_RESET_PASSWORD_OTP: () =>
          addError(
            I18N_KEYS.LOGIN.HANDLE.RESET_PASSWORD
              .login_handleResetPassword_helper_error_wrongOTP
          ),
      });
    }
  };

  const handleResendResetPasswordOtpWithCooldown = async () => {
    if (resetPasswordOtpCooldownRef.current > 0 || isResendingResetPasswordOtpRef.current) {
      return;
    }

    try {
      isResendingResetPasswordOtpRef.current = true;
      setIsResendingResetPasswordOtp(true);
      try {
        await handleSendOTPResetPassword();
        startResetPasswordOtpCooldown();
      } catch (error) {
        handleUnhandledError(error, {
          RESET_PASSWORD_OTP_NOT_EXPIRED: () =>
            addError(
              I18N_KEYS.LOGIN.HANDLE.RESET_PASSWORD
                .login_handleResetPassword_helper_error_otpNotExpired
            ),
        });
      }
    } finally {
      isResendingResetPasswordOtpRef.current = false;
      setIsResendingResetPasswordOtp(false);
    }
  };

  const handleVerifyEmailResetPassword = async () => {
    try {
      await handleSendOTPResetPassword();
      startResetPasswordOtpCooldown();
      setResetPasswordFormData((prev) => ({ ...prev, otp: "" }));
      setGlobalModal({
        isOpen: true,
        type: "input",
        title:
          I18N_KEYS.LOGIN.HANDLE.RESET_PASSWORD
            .login_handleResetPassword_modalTitle_enterOTP,
        description: [
          I18N_KEYS.LOGIN.HANDLE.RESET_PASSWORD.login_handleResetPassword_modalDesc_enterOTP,
          { email: resetPasswordFormData.email },
        ],
        primaryBtnText:
          I18N_KEYS.LOGIN.HANDLE.RESET_PASSWORD
            .login_handleResetPassword_modalButton_resetPassword,
        primaryBtnType: "submit",
        inputProps: {
          id: "otp_resetPassword",
          name: "otp_resetPassword",
          placeholder: "123456",
          value: "",
          required: true,
          errorEmpty:
            I18N_KEYS.LOGIN.HANDLE.RESET_PASSWORD
              .login_handleResetPassword_input_error_nullOTP,
          onChange: (event) => {
            const nextOtp = event.target.value;
            resetPasswordFormDataRef.current = {
              ...resetPasswordFormDataRef.current,
              otp: nextOtp,
            };
            setResetPasswordFormData((prev) => ({ ...prev, otp: nextOtp }));
          },
        },
               onPrimaryAction: handleVerifyOTPResetPassword,
        inputOtherActionText: getResetPasswordResendText(OTP_RESEND_SECONDS),
        onInputOtherAction: handleResendResetPasswordOtpWithCooldown,
      });
    } catch (error) {
      handleUnhandledError(error, {
        EMAIL_NULL: () =>
          addError(
            I18N_KEYS.LOGIN.HANDLE.RESET_PASSWORD
              .login_handleResetPassword_input_error_nullEmail
          ),
        EMAIL_NOT_AN_EMAIL: () =>
          addError(
            I18N_KEYS.LOGIN.HANDLE.RESET_PASSWORD
              .login_handleResetPassword_input_error_typeMismatchEmail
          ),
        EMAIL_NOT_EXIST: () =>
          addError(
            I18N_KEYS.LOGIN.HANDLE.RESET_PASSWORD
              .login_handleResetPassword_helper_error_emailNotExist
          ),
        RESET_PASSWORD_OTP_NOT_EXPIRED: () =>
          addError(
            I18N_KEYS.LOGIN.HANDLE.RESET_PASSWORD
              .login_handleResetPassword_helper_error_otpNotExpired
          ),
      });
    }
  };

  const handleResetPassword = () => {
    setResetPasswordFormData((prev) => ({ ...prev, otp: "" }));
    setGlobalModal({
      isOpen: true,
      type: "input",
      title:
        I18N_KEYS.LOGIN.HANDLE.RESET_PASSWORD
          .login_handleResetPassword_modalTitle_enterEmail,
      description:
        I18N_KEYS.LOGIN.HANDLE.RESET_PASSWORD.login_handleResetPassword_modalDesc_enterEmail,
      primaryBtnText:
        I18N_KEYS.LOGIN.HANDLE.RESET_PASSWORD
          .login_handleResetPassword_modalButton_sendOTP,
      primaryBtnType: "submit",
      inputProps: {
        id: "email_resetPassword",
        name: "email_resetPassword",
        type: "email",
        placeholder: "you@example.com",
        value: resetPasswordFormData.email,
        required: true,
        errorEmpty:
          I18N_KEYS.LOGIN.HANDLE.RESET_PASSWORD
            .login_handleResetPassword_input_error_nullEmail,
        errorType: I18N_KEYS.LOGIN.HANDLE.LOGIN.login_handleLogin_input_error_typeMismatchEmail,
        onChange: (event) => {
          const nextEmail = event.target.value;
          resetPasswordFormDataRef.current = {
            ...resetPasswordFormDataRef.current,
            email: nextEmail,
          };
          setResetPasswordFormData((prev) => ({ ...prev, email: nextEmail }));
        },
      },
      onPrimaryAction: async () => {
        if (isResetPasswordLoadingRef.current) return;

        try {
          isResetPasswordLoadingRef.current = true;
          setIsResetPasswordLoading(true);
          setGlobalModal((prev) => ({
            ...prev,
            primaryDisabled: true,
          }));
          await handleVerifyEmailResetPassword();
        } finally {
          isResetPasswordLoadingRef.current = false;
          setIsResetPasswordLoading(false);
          setGlobalModal((prev) => {
            if (!prev.isOpen || prev.inputProps?.name !== "email_resetPassword") {
              return prev;
            }

            return {
              ...prev,
              primaryDisabled: false,
            };
          });
        }
      },
    });
  };

  const handleSendVerifyCode = async () => {
    try {
      setVerifyCode("");
      await axios.post("http://localhost:8080/auth/send-verify-otp", null, {
        params: {
          email: formData.email,
        },
      });
      addError(
        I18N_KEYS.LOGIN.HANDLE.VERIFY_ACCOUNT
          .login_handleVerifyAccount_helper_success_resendVerifyCode
      );
    } catch (error) {
      handleUnhandledError(error, {
        VERIFY_CODE_NOT_EXPIRED: () =>
          addError(
            I18N_KEYS.LOGIN.HANDLE.VERIFY_ACCOUNT
              .login_handleVerifyAccount_helper_error_verifyCodeNotExpired
          ),
      });
    }
  };

  const handleResendVerifyCodeWithCooldown = async () => {
    if (verifyCodeCooldownRef.current > 0 || isResendingVerifyCodeRef.current) return;

    try {
      isResendingVerifyCodeRef.current = true;
      setIsResendingVerifyCode(true);
      await handleSendVerifyCode();
      startVerifyCodeCooldown();
    } finally {
      isResendingVerifyCodeRef.current = false;
      setIsResendingVerifyCode(false);
    }
  };

  const handleVerifyAccount = async () => {
    try {
      await axios.post("http://localhost:8080/auth/verify-otp", {
        email: formData.email,
        otp: verifyCodeRef.current,
      });

      setGlobalModal({
        isOpen: true,
        type: "info",
        title:
          I18N_KEYS.LOGIN.HANDLE.VERIFY_ACCOUNT
            .login_handleVerifyAccount_modalTitle_success_accountVerified,
        description:
          I18N_KEYS.LOGIN.HANDLE.VERIFY_ACCOUNT
            .login_handleVerifyAccount_modalDesc_success_accountVerified,
      });

      const loginResponse = await axios.post("http://localhost:8080/auth/token", {
        email: formData.email,
        password: formData.password,
      });
      const data = loginResponse.data.result;
      const loggedInUser = {
        token: data.token,
        accountID: data.accountID,
        username: data.username,
        tenHienThi: data.tenHienThi,
        avatar: data.avatar,
        avatarUrl: data.avatarUrl,
        anhDaiDien: data.anhDaiDien,
        daVoHieuHoa: data.daVoHieuHoa,
        biKhoa: data.biKhoa,
      };

      login(loggedInUser);
      addHelperError?.({
        id: Date.now(),
        code: [
          I18N_KEYS.LOGIN.HANDLE.LOGIN.login_handleLogin_helper_success_login,
          { tenHienThi: loggedInUser.tenHienThi },
        ],
      });
      navigate(redirect, { replace: true });
    } catch (error) {
      handleUnhandledError(error, {
        NULL_VERIFY_CODE: () =>
          addError(
            I18N_KEYS.LOGIN.HANDLE.VERIFY_ACCOUNT
              .login_handleVerifyAccount_input_error_nullVerifyCode
          ),
        VERIFY_CODE_WRONG: () =>
          addError(
            I18N_KEYS.LOGIN.HANDLE.VERIFY_ACCOUNT
              .login_handleVerifyAccount_helper_error_wrongVerifyCode
          ),
      });
    }
  };

  const openVerifyAccountModal = () => {
    triggerMascotMood?.("surprised");
    setGlobalModal({
      isOpen: true,
      type: "one-button",
      title:
        I18N_KEYS.LOGIN.HANDLE.VERIFY_ACCOUNT
          .login_handleVerifyAccount_modalTitle_accountUnverified,
      description: [
        I18N_KEYS.LOGIN.HANDLE.VERIFY_ACCOUNT
          .login_handleVerifyAccount_modalDesc_accountUnverified,
        { email: formData.email },
      ],
      primaryBtnText:
        isSendingVerifyCode
          ? I18N_KEYS.LOGIN.COMMON.login_formButton_loginLoading
          : I18N_KEYS.LOGIN.HANDLE.VERIFY_ACCOUNT
              .login_handleVerifyAccount_modalButton_sendVerifyCode,
      primaryBtnType: "submit",
      primaryDisabled: isSendingVerifyCode,
      onPrimaryAction: async () => {
        if (isSendingVerifyCodeRef.current) return;

        try {
          isSendingVerifyCodeRef.current = true;
          setIsSendingVerifyCode(true);
          setGlobalModal((prev) => ({
            ...prev,
            primaryDisabled: true,
            primaryBtnText: I18N_KEYS.LOGIN.COMMON.login_formButton_loginLoading,
          }));

          await handleSendVerifyCode();
          startVerifyCodeCooldown();
          setGlobalModal({
            isOpen: true,
            type: "input",
            title:
              I18N_KEYS.LOGIN.HANDLE.VERIFY_ACCOUNT
                .login_handleVerifyAccount_modalTitle_enterVerifyCode,
            description:
              I18N_KEYS.LOGIN.HANDLE.VERIFY_ACCOUNT
                .login_handleVerifyAccount_modalDesc_enterVerifyCode,
            primaryBtnText:
              I18N_KEYS.LOGIN.HANDLE.VERIFY_ACCOUNT
                .login_handleVerifyAccount_modalButton_verifyAccount,
            primaryBtnType: "submit",
            inputProps: {
              id: "verifyCode",
              name: "verifyCode",
              placeholder: "123456",
              value: verifyCode,
              required: true,
              errorEmpty:
                I18N_KEYS.LOGIN.HANDLE.VERIFY_ACCOUNT
                  .login_handleVerifyAccount_input_error_nullVerifyCode,
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
        } finally {
          isSendingVerifyCodeRef.current = false;
          setIsSendingVerifyCode(false);
        }
      },
    });
  };

  const handleLoginError = (error) => {
    handleUnhandledError(error, {
      NULL_EMAIL: () =>
        addError(I18N_KEYS.LOGIN.HANDLE.LOGIN.login_handleLogin_input_error_nullEmail),
      EMAIL_NOT_AN_EMAIL: () =>
        addError(I18N_KEYS.LOGIN.HANDLE.LOGIN.login_handleLogin_input_error_typeMismatchEmail),
      NULL_PASSWORD: () =>
        addError(I18N_KEYS.LOGIN.HANDLE.LOGIN.login_handleLogin_input_error_nullPassword),
      WRONG_LOGIN: () =>
        addError(I18N_KEYS.LOGIN.HANDLE.LOGIN.login_handleLogin_helper_error_wrongLogin),
      ACCOUNT_LOCKED: () => {
        triggerMascotMood?.("sad");
        setGlobalModal({
          isOpen: true,
          type: "info",
          title: I18N_KEYS.LOGIN.HANDLE.LOGIN.login_handleLogin_modalTitle_accountLocked,
          description: I18N_KEYS.LOGIN.HANDLE.LOGIN.login_handleLogin_modalDesc_accountLocked,
        });
      },
      ACCOUNT_UNVERIFIED: openVerifyAccountModal,
    });
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    if (isLoginLoading) return;

    try {
      setIsLoginLoading(true);
      const response = await axios.post("http://localhost:8080/auth/token", {
        email: formData.email,
        password: formData.password,
      });

      const data = response.data.result;
      const loggedInUser = {
        token: data.token,
        accountID: data.accountID,
        username: data.username,
        tenHienThi: data.tenHienThi,
        avatar: data.avatar,
        avatarUrl: data.avatarUrl,
        anhDaiDien: data.anhDaiDien,
        daVoHieuHoa: data.daVoHieuHoa,
        biKhoa: data.biKhoa,
      };

      login(loggedInUser);
      addHelperError?.({
        id: Date.now(),
        code: [
          I18N_KEYS.LOGIN.HANDLE.LOGIN.login_handleLogin_helper_success_login,
          { tenHienThi: loggedInUser.tenHienThi },
        ],
      });
      navigate(redirect, { replace: true });
    } catch (error) {
      handleLoginError(error);
    } finally {
      setIsLoginLoading(false);
    }
  };

  return (
    <PageContainer setHelperFocusState={setHelperFocusState} headerType="simple">
      <div className="relative z-10">
        <div className="flex items-center justify-center p-4">
          <div className="flex min-h-full flex-col justify-center rounded-xl bg-main-bg px-10 py-10 shadow-2xl shadow-primary-400 dark:shadow-none sm:min-w-md sm:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-sm">
              <img src="/logo.svg" alt="EyesOnly Logo" className="mx-auto h-8 w-auto" />
              <h2 className="mt-10 text-center text-2xl/7 font-bold tracking-tight text-main-text">
                {t(I18N_KEYS.LOGIN.COMMON.login_title_login)}
              </h2>
            </div>

            <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
              <form method="POST" onSubmit={handleLogin} className="space-y-6">
                <Input
                  id="email"
                  name="email"
                  value={formData.email}
                  label={I18N_KEYS.LOGIN.COMMON.login_formLabel_email}
                  type="email"
                  placeholder="you@example.com"
                  required
                  errorEmpty={I18N_KEYS.LOGIN.HANDLE.LOGIN.login_handleLogin_input_error_nullEmail}
                  errorType={
                    I18N_KEYS.LOGIN.HANDLE.LOGIN.login_handleLogin_input_error_typeMismatchEmail
                  }
                  autoComplete="email"
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, email: event.target.value }))
                  }
                />

                <Input
                  id="password"
                  name="password"
                  value={formData.password}
                  label={I18N_KEYS.LOGIN.COMMON.login_formLabel_password}
                  type="password"
                  placeholder="••••••••"
                  required
                  errorEmpty={
                    I18N_KEYS.LOGIN.HANDLE.LOGIN.login_handleLogin_input_error_nullPassword
                  }
                  autoComplete="current-password"
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, password: event.target.value }))
                  }
                />

                <div className="flex justify-end text-sm">
                  <button
                    type="button"
                    onClick={handleResetPassword}
                    className="cursor-pointer font-body font-semibold text-secondary-800 hover:text-secondary-600"
                  >
                    {t(I18N_KEYS.LOGIN.COMMON.login_formButton_forgotPassword)}
                  </button>
                </div>

                <Button type="submit" size="full" disabled={isLoginLoading}>
                  {isLoginLoading
                    ? t(I18N_KEYS.LOGIN.COMMON.login_formButton_loginLoading)
                    : t(I18N_KEYS.LOGIN.COMMON.login_formButton_loginSubmit)}
                </Button>
              </form>

              <p className="mt-10 text-center text-sm/6 text-text-shade-400">
                {t(I18N_KEYS.LOGIN.COMMON.login_text_notAMember)}
                <Link
                  to={`/signup?redirect=${encodeURIComponent(redirect)}`}
                  className="font-semibold text-accent-700 hover:text-accent-400"
                >
                  <br />
                  {t(I18N_KEYS.LOGIN.COMMON.login_button_toSignupPage)}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
