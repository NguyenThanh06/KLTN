import React, { useState, useEffect } from 'react';
import { useTranslation } from "react-i18next";
import { I18N_KEYS } from "../i18n/key";
import { useErrorHandler } from '../hooks/useErrorHandler';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';

import PageContainer from '../components/PageContainer';   
import Input from "../components/Input";
import Button from "../components/Button";
import { CiCircleMore, CiCircleCheck } from 'react-icons/ci';

export default function Signup( { setGlobalModal, addHelperError, setHelperFocusState } ){
    const [ step, setStep ] = useState(1);
    const finalStep = 2;
    const [formData, setFormData] = useState({ 
        email: '', 
        tenHienThi: '',
        username: '',
        password: '',
    });
    const [verifyCode, setVerifyCode] = useState('');
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const { handleError } = useErrorHandler(setGlobalModal, addHelperError);


    //-------------------------UseEffect----------------------
    useEffect(() => {
        
        setGlobalModal(prev => {
            if (!prev.isOpen || prev.type !== 'input') return prev;

            const inputName = prev.inputProps?.name;
            let currentData = "";

            // Kiểm tra form của modal
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

            // Nếu giá trị không đổi thì trả về như cũ, tránh render lặp
            if (prev.inputProps.value === currentData) return prev;

            return {
                ...prev,
                inputProps: { ...prev.inputProps, value: currentData }
            };
        });

    }, [formData.email, formData.tenHienThi, formData.username, formData.password, verifyCode]);

    // -------------------------- Hàm ------------------------   
        //------------------------VERIFY ACCOUNT-------------------------
            //Hàm xử lý việc người dùng đòi gửi lại mã xác thực tài khoản
            const handleSendVerifyCode = async (e) => {
                try {
                    //await api.resendVerifyCode({ email: formData.email });
                    addHelperError({
                        id: Date.now(),
                        code: I18N_KEYS.SIGNUP.HANDLE.VERIFY_ACCOUNT.signup_handleVerifyAccount_helper_success_resendVerifyCode
                    })
                } catch (error) {
                    const errorData = error.response?.data;
                    const result = handleError(errorData);
                    if (result && !result.handled) {
                        switch (result.code){
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
            }
    
            //Hàm xử lý việc xác thực tài khoản
            const handleVerifyAccount = async (e) => {
                try {
                    //await api.verifyAccount({ email: formData.email, verifyCode: verifyCode });
                    setGlobalModal({
                        isOpen: true,
                        type: "one-button",
                        title: I18N_KEYS.SIGNUP.HANDLE.VERIFY_ACCOUNT.signup_handleVerifyAccount_modalTitle_success_accountVerified,
                        description: I18N_KEYS.SIGNUP.HANDLE.VERIFY_ACCOUNT.signup_handleVerifyAccount_modalDesc_success_accountVerified,
                        primaryBtnText: I18N_KEYS.SIGNUP.HANDLE.VERIFY_ACCOUNT.signup_handleVerifyAccount_modalButton_success_accountVerified,
                        onPrimaryAction: () => {
                            setGlobalModal(prev => ({ ...prev, isOpen: false }));
                            navigate("/login");
                        }
                    });
                } catch (error) {
                    const errorData = error.response?.data;
                    const result = handleError(errorData);
                    if (result && !result.handled) {
                        switch (result.code){
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
            } 
        //------------------------SIGNUP---------------------

        //Hàm xử lý cái email
        const handleVerifyEmailSignUp = async (e) => {
            try {
                //await api.verifyEmailSignUp({email: formData.email});
                return true;
            } catch (error) {
                const errorData = error.response?.data;
                const result = handleError(errorData);
                if (result && !result.handled) {
                    switch (result.code){
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
                    switch (result.code){
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
                    switch (result.code){
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
                    switch (result.code){
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

        const handleFinalSignup = async (e) => {
            e.preventDefault();
            //Chạy ktra input trước
            const results = await Promise.all([
                handleVerifyEmailSignUp(),
                handleVerifyTenHienThiSignup(),
                handleVerifyUsernameSignup(),
                handleVerifyPasswordSignup(),
            ]);
            const isAllValid = results.every(result => result === true);
            if (isAllValid) {
                try {
                    //await api.signup({ email: formData.email, tenHienThi: formData.tenHienThi, username: formData.username, password: formData.password });
                    //Làm cho hắn mất cái form đăng ký đã nờ
                    nextStep();
                    //Chừ là verify tài khoản
                    setGlobalModal({
                        isOpen: true,
                        type: "one-button",
                        title: I18N_KEYS.SIGNUP.HANDLE.VERIFY_ACCOUNT.signup_handleVerifyAccount_modalTitle_accountUnverified,
                        description: [I18N_KEYS.SIGNUP.HANDLE.VERIFY_ACCOUNT.signup_handleVerifyAccount_modalDesc_accountUnverified, {email: formData.email}],
                        primaryBtnText: I18N_KEYS.SIGNUP.HANDLE.VERIFY_ACCOUNT.signup_handleVerifyAccount_modalButton_sendVerifyCode,
                        primaryBtnType: "submit",
                        onPrimaryAction: async() => { //Gửi mã vô email lấy nơi formData
                            await handleSendVerifyCode();
                            setGlobalModal({
                                isOpen: true,
                                type: "input",
                                title: I18N_KEYS.SIGNUP.HANDLE.VERIFY_ACCOUNT.signup_handleVerifyAccount_modalTitle_enterVerifyCode,
                                description: I18N_KEYS.SIGNUP.HANDLE.VERIFY_ACCOUNT.signup_handleVerifyAccount_modalDesc_enterVerifyCode,
                                primaryBtnText: I18N_KEYS.SIGNUP.HANDLE.VERIFY_ACCOUNT.signup_handleVerifyAccount_modalButton_verifyAccount,
                                primaryBtnType: "submit",
                                inputProps: {
                                    id: "verifyCode",
                                    name: "verifyCode",
                                    placeholder: "123456",
                                    value: verifyCode,
                                    required: true,
                                    errorEmpty: I18N_KEYS.SIGNUP.HANDLE.VERIFY_ACCOUNT.signup_handleVerifyAccount_input_error_nullVerifyCode,
                                    onChange: (e) => setVerifyCode(e.target.value),
                                },
                                onPrimaryAction: async() => { 
                                    await handleVerifyAccount();
                                },
                                inputOtherActionText: I18N_KEYS.SIGNUP.HANDLE.VERIFY_ACCOUNT.signup_handleVerifyAccount_modalButton_resendVerifyCode,
                                onInputOtherAction: async() => {
                                    await handleSendVerifyCode();
                                }
                            });
                            
                        } 
                    })
                } catch (error) {
                    addHelperError({
                        id: Date.now(),
                        code: I18N_KEYS.GLOBAL_ERROR.ERROR_unknownError,
                    });
                }
            }
            return;
        }

        //---------------------Hàm tào lao khác---------------------
        const nextStep = () => setStep(prev => prev + 1);
        const prevStep = () => setStep(prev => prev - 1);

        const handleNextStep = async (e) =>{
            e.preventDefault();
            // Kiểm tra từng step
            switch (step){
                case 1: //Kiểm tra email có ok không rồi xem có trùng CSDL không?
                    if(handleVerifyEmailSignUp()){
                        nextStep();
                    }
                    break;
                default:
                    addHelperError({
                        id: Date.now(),
                        code: I18N_KEYS.GLOBAL_ERROR.ERROR_unknownError, 
                    });
            }
        }

        const handleUsernameChange = (e) => {
            // về chữ thường
            let value = e.target.value.toLowerCase();

            // chuyển hết dấu cách thành gạch dưới
            value = value.replace(/\s/g, '_');

            // xóa tất cả các ký tự KHÔNG phải là a-z, 0-9 hoặc _
            value = value.replace(/[^a-z0-9_]/g, '');

            // 4. Cập nhật vào state
            setFormData({ ...formData, username: value });
        };

    return (
        <PageContainer setHelperFocusState = {setHelperFocusState} headerType='simple'>
            <div className="relative z-10">
                <div className="flex items-center justify-center p-4">
                    <div className="flex min-h-full sm:min-w-md flex-col justify-center px-10 py-10 sm:px-8 rounded-xl shadow-2xl bg-main-bg shadow-primary-400 dark:shadow-none">
                        <div className="sm:mx-auto sm:w-full sm:max-w-sm">
                            <img src="/logo.svg" alt="EyesOnly Logo" className="mx-auto h-8 w-auto" />
                            <h2 className="mt-10 text-center text-2xl/7 font-bold tracking-tight text-main-text">{t("signup_title_signup")}</h2>
                        </div>

                        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
                            <form method="POST" onSubmit={ step != finalStep ? handleNextStep : handleFinalSignup} className="space-y-6">

                                {/* Step 1 */}
                                {step === 1 && (
                                    <Input 
                                        id="email" 
                                        name="email" 
                                        label= {t(I18N_KEYS.SIGNUP.COMMON.signup_formLabel_email)}
                                        value = {formData.email}
                                        type = "email" 
                                        placeholder="you@example.com" 
                                        required
                                        maxLength="100"
                                        errorEmpty= {t(I18N_KEYS.SIGNUP.HANDLE.SIGNUP.signup_handleSignup_input_error_nullEmail)}
                                        errorType = {t(I18N_KEYS.SIGNUP.HANDLE.SIGNUP.signup_handleSignup_input_error_typeMismatchEmail)}
                                        errorTooLong= {t(I18N_KEYS.SIGNUP.HANDLE.SIGNUP.signup_handleSignup_input_error_emailTooLong)}
                                        autoComplete="email"
                                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                                    />
                                )}
                                
                                {/* Step 2 */}
                                {step === 2 && (
                                    <>
                                    <Input 
                                        id="tenHienThi" 
                                        name="tenHienThi" 
                                        value= {formData.tenHienThi}
                                        label= {t(I18N_KEYS.SIGNUP.COMMON.signup_formLabel_tenHienThi)}
                                        optional
                                        placeholder= {t(I18N_KEYS.SIGNUP.COMMON.signup_formPlaceholder_tenHienThi)}
                                        errorTooLong= {t(I18N_KEYS.SIGNUP.HANDLE.SIGNUP.signup_handleSignup_input_error_tenHienThiTooLong)}
                                        maxLength="30"
                                        onChange={(e) => setFormData({...formData, tenHienThi: e.target.value})}
                                    />

                                    <Input 
                                        id="username" 
                                        name="username" 
                                        value= {formData.username}
                                        label= {t(I18N_KEYS.SIGNUP.COMMON.signup_formLabel_username)}
                                        leftIcon= {<span className='text-text-shade-200'>@</span>}
                                        placeholder= {t(I18N_KEYS.SIGNUP.COMMON.signup_formPlaceholder_username)}
                                        helperText= {t(I18N_KEYS.SIGNUP.COMMON.signup_formHelperText_username)}
                                        required
                                        errorEmpty= {t(I18N_KEYS.SIGNUP.HANDLE.SIGNUP.signup_handleSignup_input_error_nullUsername)}
                                        errorPattern= {t(I18N_KEYS.SIGNUP.HANDLE.SIGNUP.signup_handleSignup_input_error_usernameWrongPattern)}
                                        errorTooLong= {t(I18N_KEYS.SIGNUP.HANDLE.SIGNUP.signup_handleSignup_input_error_usernameTooLong)}
                                        pattern="[a-z0-9_]+"
                                        maxLength="20"
                                        autoCapitalize="none"
                                        autoCorrect="off"
                                        onChange={handleUsernameChange}
                                    />

                                    <Input 
                                        id="password" 
                                        name="password" 
                                        value= {formData.password}
                                        label= {t(I18N_KEYS.SIGNUP.COMMON.signup_formLabel_password)}
                                        rightIcon={
                                            formData.password.length === 0 ? null : ( // Nếu chưa nhập gì thì không hiện icon
                                                formData.password.length < 6 ? (
                                                    <span className="text-text-shade-200 font-bold text-xl"><CiCircleMore strokeWidth={1}/></span>
                                                ) : (
                                                    <span className="text-primary-500 font-bold text-xl"><CiCircleCheck strokeWidth={1}/></span>
                                                )
                                            )
                                        }
                                        placeholder="••••••••" 
                                        helperText= {t(I18N_KEYS.SIGNUP.COMMON.signup_formHelperText_password)}
                                        required
                                        errorEmpty= {t(I18N_KEYS.SIGNUP.HANDLE.SIGNUP.signup_handleSignup_input_error_nullPassword)}
                                        errorTooShort= {t(I18N_KEYS.SIGNUP.HANDLE.SIGNUP.signup_handleSignup_input_error_passwordTooShort)}
                                        errorTooLong= {t(I18N_KEYS.SIGNUP.HANDLE.SIGNUP.signup_handleSignup_input_error_passwordTooLong)}
                                        type= "password"
                                        maxLength = "32"
                                        minlenght = "6"
                                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                                    />
                                    </>
                                )}
                                
                                {step <= finalStep ? (
                                    <div className='flex justify-between gap-3 mt-6'>
                                        {/* Nút quay lại với step > 1 */}
                                        {step > 1 ? (
                                            <Button
                                                variant='outline'
                                                onClick={() => prevStep()}
                                            >
                                                {t(I18N_KEYS.SIGNUP.COMMON.signup_formButton_prevStep)}
                                            </Button>
                                        ) : (
                                            <div /> /* Giữ chỗ để nút Tiếp theo vẫn nằm bên phải */
                                        )}
                                        
                                        {/* Nút Tiếp theo hoặc đăng ký luôn */}
                                        <Button
                                            type= "submit"
                                        >
                                            {step === finalStep ? t(I18N_KEYS.SIGNUP.COMMON.signup_formButton_signupSubmit) : t(I18N_KEYS.SIGNUP.COMMON.signup_formButton_nextStep)}
                                        </Button>
                                    </div>
                                )
                                :
                                (
                                    <div className="flex-col justify-center items-center gap-4 p-4 rounded-2xl animate-float">
                                        {/* Icon Checkmark hình tròn */}
                                        <div className="rounded-full flex items-center justify-center">
                                            <CiCircleCheck className='text-sub-text text-6xl'/>
                                        </div>

                                        {/* Nội dung chữ */}
                                        <div className="grow">
                                            <h4 className="text-sm text-center font-bold text-sub-text leading-none mt-5 mb-1">
                                            {t(I18N_KEYS.SIGNUP.COMMON.signup_text_success_signup)}
                                            </h4>
                                        </div>
                                    </div>
                                )}
                                
                                
                            </form>

                            <p className="mt-10 text-center text-sm/6 text-text-shade-400">
                            {t(I18N_KEYS.SIGNUP.COMMON.signup_text_isAMember)}
                            <Link to="/login" 
                                className="font-semibold text-accent-700 hover:text-accent-400"
                            >
                                <br></br>{t(I18N_KEYS.SIGNUP.COMMON.signup_button_toLoginPage)}
                            </Link>
                            </p>

                        </div>
                    </div>
                </div>
            </div>
        </PageContainer>
    );
};