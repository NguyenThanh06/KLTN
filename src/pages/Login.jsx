import React, { useState, useEffect } from 'react';
import { useTranslation } from "react-i18next";
import { I18N_KEYS } from "../i18n/key";
import { useErrorHandler } from '../hooks/useErrorHandler';
import { useNavigate } from "react-router-dom";
import axiosClient from "../api/axiosClient";

import Header from "../components/Header";
import Input from "../components/Input";
import Button from "../components/Button";
import patternBgImg from "../assets/seamless-bg.png";


export default function Login({ setGlobalModal, addHelperError, setHelperFocusState }) {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [resetPasswordFormData, setResetPasswordFormData] = useState({ email: '', otp: '' })
    const [verifyCode, setVerifyCode] = useState("");
    const { t, i18n } = useTranslation();
    const { handleError } = useErrorHandler(setGlobalModal, addHelperError);
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    //-------------------------UseEffect----------------------
    useEffect(() => {

        setGlobalModal(prev => {
            if (!prev.isOpen || prev.type !== 'input') return prev;

            const inputName = prev.inputProps?.name;
            let currentData = "";

            // Kiểm tra form của modal
            if (inputName === "email_resetPassword") {
                currentData = resetPasswordFormData.email;
            } else if (inputName === "otp_resetPassword") {
                currentData = resetPasswordFormData.otp;
            } else if (inputName === "verifyCode") {
                currentData = verifyCode;
            }

            // Nếu giá trị không đổi thì trả về như cũ, tránh render lặp
            if (prev.inputProps.value === currentData) return prev;

            return {
                ...prev,
                inputProps: { ...prev.inputProps, value: currentData }
            };
        });

    }, [resetPasswordFormData.email, resetPasswordFormData.otp, verifyCode]);

    // -------------------------- Hàm ------------------------
    //-------------------------RESET PASSWORD------------------------

    //Hàm xử lý email yêu cầu cấp lại mật khẩu
    const handleVerifyEmailResetPassword = async (e) => {
        try {
            //await api.verifyEmail({ email: resetPasswordFormData.email });
            await handleSendOTPResetPassword();
            setGlobalModal({
                isOpen: true,
                type: "input",
                title: I18N_KEYS.LOGIN.HANDLE.RESET_PASSWORD.login_handleResetPassword_modalTitle_enterOTP,
                description: I18N_KEYS.LOGIN.HANDLE.RESET_PASSWORD.login_handleResetPassword_modalDesc_enterOTP,
                primaryBtnText: I18N_KEYS.LOGIN.HANDLE.RESET_PASSWORD.login_handleResetPassword_modalButton_resetPassword,
                primaryBtnType: "submit",
                inputProps: {
                    id: "otp_resetPassword",
                    name: "otp_resetPassword",
                    placeholder: "123456",
                    value: resetPasswordFormData.otp,
                    required: true,
                    handleInvalidMsg: I18N_KEYS.LOGIN.HANDLE.RESET_PASSWORD.login_handleResetPassword_input_error_nullOTP,
                    onChange: (e) => setResetPasswordFormData({ ...resetPasswordFormData, otp: e.target.value }),
                },
                onPrimaryAction: async () => {
                    await handleVerifyOTPResetPassword();
                },
                inputOtherActionText: I18N_KEYS.LOGIN.HANDLE.RESET_PASSWORD.login_handleResetPassword_modalButton_resendOTP,
                onInputOtherAction: async () => {
                    await handleSendOTPResetPassword();
                }
            });
        } catch (error) {
            const errorData = error.response?.data;
            const result = handleError(errorData);
            if (result && !result.handled) {
                switch (result.code) {
                    //Kịch bản email null
                    case "EMAIL_NULL":
                        addHelperError({
                            id: Date.now(),
                            code: I18N_KEYS.LOGIN.HANDLE.RESET_PASSWORD.login_handleResetPassword_input_error_nullEmail,
                        })
                        break;
                    //Kịch bản email không tồn tại
                    case "EMAIL_NOT_EXIST":
                        addHelperError({
                            id: Date.now(),
                            code: I18N_KEYS.LOGIN.HANDLE.RESET_PASSWORD.login_handleResetPassword_helper_error_emailNotExist,
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
    }

    //Hàm xử lý vụ người dùng đòi cấp lại otp cấp lại mật khẩu
    const handleSendOTPResetPassword = async (e) => {
        try {
            //await api.resendOTPResetPassword({ email: resetPasswordFormData.email });
            addHelperError({
                id: Date.now(),
                code: I18N_KEYS.LOGIN.HANDLE.RESET_PASSWORD.login_handleResetPassword_helper_success_resendOTP,
            })
        } catch (error) {
            const errorData = error.response?.data;
            const result = handleError(errorData);
            if (result && !result.handled) {
                switch (result.code) {
                    //Kịch bản otp chưa hết hạn
                    case "RESET_PASSWORD_OTP_NOT_EXPIRED":
                        addHelperError({
                            id: Date.now(),
                            code: I18N_KEYS.LOGIN.HANDLE.RESET_PASSWORD.login_handleResetPassword_helper_error_otpNotExpired,
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
    }

    //Hàm xử lý mã otp cấp lại mật khẩu
    const handleVerifyOTPResetPassword = async (e) => {
        try {
            //await api.resetPassword({email: resetPasswordFormData.email, otp: resetPasswordFormData.otp});
            setGlobalModal({
                isOpen: true,
                type: "info",
                title: I18N_KEYS.LOGIN.HANDLE.RESET_PASSWORD.login_handleResetPassword_modalTitle_success_resetPassword,
                description: I18N_KEYS.LOGIN.HANDLE.RESET_PASSWORD.login_handleResetPassword_modalDesc_success_resetPassword,
            });
        } catch (error) {
            const result = handleError(error.response);
            if (result && !result.handled) {
                switch (result.code) {
                    //Kịch bản otp null
                    case "WRONG_RESET_PASSWORD_OTP":
                        addHelperError({
                            id: Date.now(),
                            code: I18N_KEYS.LOGIN.HANDLE.RESET_PASSWORD.login_handleResetPassword_input_error_nullOTP,
                        })
                        break;
                    //Kịch bản otp sai
                    case "WRONG_RESET_PASSWORD_OTP":
                        addHelperError({
                            id: Date.now(),
                            code: I18N_KEYS.LOGIN.HANDLE.RESET_PASSWORD.login_handleResetPassword_helper_error_wrongOTP,
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
    }

    //Hàm show modal để reset password
    const handleResetPassword = (e) => {
        setGlobalModal({
            isOpen: true,
            type: 'input',
            title: I18N_KEYS.LOGIN.HANDLE.RESET_PASSWORD.login_handleResetPassword_modalTitle_enterEmail,
            description: I18N_KEYS.LOGIN.HANDLE.RESET_PASSWORD.login_handleResetPassword_modalDesc_enterEmail,
            primaryBtnText: I18N_KEYS.LOGIN.HANDLE.RESET_PASSWORD.login_handleResetPassword_modalButton_sendOTP,
            primaryBtnType: "submit",
            inputProps: {
                id: "email_resetPassword",
                name: "email_resetPassword",
                type: "email",
                placeholder: "you@example.com",
                value: resetPasswordFormData.email,
                required: true,
                handleInvalidMsg: I18N_KEYS.LOGIN.HANDLE.RESET_PASSWORD.login_handleResetPassword_input_error_nullEmail,
                onChange: (e) => setResetPasswordFormData({ ...resetPasswordFormData, email: e.target.value }),
            },
            onPrimaryAction: async () => {
                await handleVerifyEmailResetPassword();
            },
        });
    };


    //------------------------VERIFY ACCOUNT-------------------------

    //Hàm xử lý việc người dùng đòi gửi lại mã xác thực tài khoản
    const handleSendVerifyCode = async (e) => {
        try {
            //await api.resendVerifyCode({ email: formData.email });
            addHelperError({
                id: Date.now(),
                code: I18N_KEYS.LOGIN.HANDLE.VERIFY_ACCOUNT.login_handleVerifyAccount_helper_success_resendVerifyCode
            })
        } catch (error) {
            const result = handleError(error.response);
            if (result && !result.handled) {
                switch (result.code) {
                    //Kịch bản verifyCode chưa hết hạn
                    case "VERIFY_CODE_NOT_EXPIRED":
                        addHelperError({
                            id: Date.now(),
                            code: I18N_KEYS.LOGIN.HANDLE.VERIFY_ACCOUNT.login_handleVerifyAccount_helper_error_verifyCodeNotExpired,
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
    }

    //Hàm xử lý việc xác thực tài khoản
    const handleVerifyAccount = async (otp) => {
        try {
            const response = await axiosClient.post(
                "/auth/verify-otp",
                {
                    email: formData.email,
                    otp: otp
                }
            );
            console.log(verifyCode);
            
            console.log(response.data);
            setGlobalModal({
                isOpen: true,
                type: "info",
                title: I18N_KEYS.LOGIN.HANDLE.VERIFY_ACCOUNT.login_handleVerifyAccount_modalTitle_success_accountVerified,
                description: I18N_KEYS.LOGIN.HANDLE.VERIFY_ACCOUNT.login_handleVerifyAccount_modalDesc_success_accountVerified,
            });
        } catch (error) {
            const result = handleError(error.response);
            console.log(result);
            
            if (result && !result.handled) {
                switch (result.code) {
                    //Kịch bản verifyCode null
                    case "NULL_VERIFY_CODE":
                        addHelperError({
                            id: Date.now(),
                            code: I18N_KEYS.LOGIN.HANDLE.VERIFY_ACCOUNT.login_handleVerifyAccount_input_error_nullVerifyCode,
                        })
                        break;
                    //Kịch bản verifyCode sai
                    case "VERIFY_CODE_WRONG":
                        addHelperError({
                            id: Date.now(),
                            code: I18N_KEYS.LOGIN.HANDLE.VERIFY_ACCOUNT.login_handleVerifyAccount_helper_error_wrongVerifyCode,
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
    }


    //---------------------------LOGIN----------------------
    //Hàm xử lý đăng nhập
    const handleLogin = async (e) => {
        e.preventDefault();
        // chống spam
        if (isLoading) return;

        setIsLoading(true);
        try {
            const response = await axiosClient.post(
                "/auth/token",
                {
                    email: formData.email,
                    password: formData.password
                }
            );

            const data = response.data.result;
            console.log(data);

            // lưu token
            localStorage.setItem("token", data.token);
            localStorage.setItem("accountID", data.accountID);
            localStorage.setItem("tenHienThi", data.tenHienThi);

            addHelperError({
                id: Date.now(),
                code: "Đăng nhập thành công"
            });

            navigate("/home");
        }
        catch (error) {
            const result = handleError(error.response);
            console.log(result);

            if (result && !result.handled) {
                switch (result.code) {
                    case "NULL_EMAIL":
                        addHelperError({
                            id: Date.now(),
                            code: I18N_KEYS.LOGIN.HANDLE.LOGIN.login_handleLogin_input_error_nullEmail,
                        })
                        break;
                    case "NULL_PASSWORD":
                        addHelperError({
                            id: Date.now(),
                            code: I18N_KEYS.LOGIN.HANDLE.LOGIN.login_handleLogin_input_error_nullPassword,
                        })
                        break;
                    case "WRONG_LOGIN": //Đăng nhập sai
                        addHelperError({
                            id: Date.now(),
                            code: I18N_KEYS.LOGIN.HANDLE.LOGIN.login_handleLogin_helper_error_wrongLogin,
                        })
                        break;
                    case "ACCOUNT_LOCKED": //Tài khoản bị khóa
                        setGlobalModal({
                            isOpen: true,
                            type: "info",
                            title: I18N_KEYS.LOGIN.HANDLE.LOGIN.login_handleLogin_modalTitle_accountLocked,
                            description: I18N_KEYS.LOGIN.HANDLE.LOGIN.login_handleLogin_modalDesc_accountLocked,
                        })
                        break;

                    case "ACCOUNT_UNVERIFIED": //Tài khoản chưa xác thực
                        setGlobalModal({
                            isOpen: true,
                            type: "one-button",
                            title: I18N_KEYS.LOGIN.HANDLE.VERIFY_ACCOUNT.login_handleVerifyAccount_modalTitle_accountUnverified,
                            description: I18N_KEYS.LOGIN.HANDLE.VERIFY_ACCOUNT.login_handleVerifyAccount_modalDesc_accountUnverified,
                            primaryBtnText: I18N_KEYS.LOGIN.HANDLE.VERIFY_ACCOUNT.login_handleVerifyAccount_modalButton_sendVerifyCode,
                            onPrimaryAction: async () => { //Gửi mã vô email lấy nơi formData
                                await handleSendVerifyCode(verifyCode);
                                setGlobalModal({
                                    isOpen: true,
                                    type: "input",
                                    title: I18N_KEYS.LOGIN.HANDLE.VERIFY_ACCOUNT.login_handleVerifyAccount_modalTitle_enterVerifyCode,
                                    description: I18N_KEYS.LOGIN.HANDLE.VERIFY_ACCOUNT.login_handleVerifyAccount_modalDesc_enterVerifyCode,
                                    primaryBtnText: I18N_KEYS.LOGIN.HANDLE.VERIFY_ACCOUNT.login_handleVerifyAccount_modalButton_verifyAccount,
                                    primaryBtnType: "submit",
                                    inputProps: {
                                        id: "verifyCode",
                                        name: "verifyCode",
                                        placeholder: "123456",
                                        value: verifyCode,
                                        required: true,
                                        handleInvalidMsg: I18N_KEYS.LOGIN.HANDLE.VERIFY_ACCOUNT.login_handleVerifyAccount_input_error_nullVerifyCode,
                                        onChange: (e) => setVerifyCode(e.target.value),
                                    },
                                    onPrimaryAction: async () => {
                                        await handleVerifyAccount(verifyCode);
                                    },
                                    inputOtherActionText: I18N_KEYS.LOGIN.HANDLE.VERIFY_ACCOUNT.login_handleVerifyAccount_modalButton_resendVerifyCode,
                                    onInputOtherAction: async () => {
                                        await handleSendVerifyCode();
                                    }
                                });

                            }
                        })
                        break;
                }
            }
        } finally {

            // luôn mở lại nút
            setIsLoading(false);
        }
    }

    // Hàm kiểm tra xem có phải đang focus vào input/textarea không
    const handleFocusChange = (e) => {
        const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName);
        if (isInput) {
            setHelperFocusState(e.type === 'focus');
        }
    };



    // Giả lập lỗi bên backend ------ Thành làm backend thì nhớ xóa ni
    const simulateError = (code) => {
        addHelperError({
            id: Date.now(),
            code: code,
        });
    };

    return (
        <div className="relative min-h-screen w-full bg-main-bg transition-colors duration-500"
            onFocusCapture={(e) => handleFocusChange(e)}
            onBlurCapture={(e) => handleFocusChange(e)}
        >
            {/* Lớp họa tiết nền */}
            <div
                className="fixed inset-0 animate-pattern pointer-events-none z-0"
                style={{
                    backgroundImage: `url(${patternBgImg})`,
                    backgroundSize: '250px 250px',
                    backgroundRepeat: 'repeat',
                    opacity: 0.25
                }}
            ></div>
            <Header variant="simple" />
            <div className="relative z-10">
                <div className="flex items-center justify-center p-4">
                    <div className="flex min-h-full sm:min-w-md flex-col justify-center px-10 py-10 sm:px-8 rounded-xl shadow-2xl bg-main-bg shadow-primary-400 dark:shadow-none">
                        <div className="sm:mx-auto sm:w-full sm:max-w-sm">
                            <img src="/logo.svg" alt="EyesOnly Logo" className="mx-auto h-8 w-auto" />
                            <h2 className="mt-10 text-center text-2xl/7 font-bold tracking-tight text-main-text">{t(I18N_KEYS.LOGIN.COMMON.login_title_login)}</h2>
                        </div>

                        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
                            <form method="POST" onSubmit={handleLogin} className="space-y-6">
                                <Input
                                    id="email"
                                    name="email"
                                    label={I18N_KEYS.LOGIN.COMMON.login_formLabel_email}
                                    type="email"
                                    placeholder="you@example.com"
                                    required
                                    handleInvalidMsg={I18N_KEYS.LOGIN.HANDLE.LOGIN.login_handleLogin_input_error_nullEmail}
                                    autocomplete="email"
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />

                                <Input
                                    id="password"
                                    name="password"
                                    label={I18N_KEYS.LOGIN.COMMON.login_formLabel_password}
                                    type="password"
                                    placeholder="••••••••"
                                    required
                                    handleInvalidMsg={I18N_KEYS.LOGIN.HANDLE.LOGIN.login_handleLogin_input_error_nullPassword}
                                    autocomplete="current-password"
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />

                                <div className="text-sm flex justify-end">
                                    <a onClick={handleResetPassword} className="font-semibold font-body text-secondary-800 hover:text-secondary-600 cursor-pointer">{t(I18N_KEYS.LOGIN.COMMON.login_formButton_forgotPassword)}</a>
                                </div>

                                <div>
                                    <Button children={t(I18N_KEYS.LOGIN.COMMON.login_formButton_loginSubmit)} type="submit" size="full" />
                                </div>
                            </form>

                            <p className="mt-10 text-center text-sm/6 text-text-shade-400">
                                {t(I18N_KEYS.LOGIN.COMMON.login_text_notAMember)}
                                <a href="#" className="font-semibold text-accent-700 hover:text-accent-400"><br></br>{t(I18N_KEYS.LOGIN.COMMON.login_button_toSignupPage)}</a>
                            </p>



                            {/* Thành làm backend xong thì xóa cái ni, đây là chỗ debug */}
                            <button onClick={() => simulateError(I18N_KEYS.LOGIN.HANDLE.LOGIN.login_handleLogin_helper_error_wrongLogin)} className="m-2 p-2 bg-red-200">Test lỗi 1</button>
                            <button onClick={() => simulateError(I18N_KEYS.GLOBAL_ERROR.ERROR_unknownError)} className="m-2 p-2 bg-yellow-200">Test lỗi 2</button>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};