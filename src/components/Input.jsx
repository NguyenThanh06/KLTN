import React, { useState } from 'react';
import { useTranslation } from "react-i18next";
import { I18N_KEYS } from '../i18n/key';
import { censorProfanityText } from "../utils/profanityCensor";

export default function Input({
    id,
    label,
    optional = false,
    placeholder,
    // Chia nhỏ các loại tin nhắn lỗi
    errorEmpty = I18N_KEYS.GLOBAL_ERROR.ERROR_handleInputEmpty,   // Khi để trống
    errorPattern = I18N_KEYS.GLOBAL_ERROR.ERROR_handleInputWrongPattern, // Khi sai định dạng (pattern)
    errorType = I18N_KEYS.GLOBAL_ERROR.ERROR_handleInputWrongType,       // Khi sai định dạng email/url mặc định
    errorTooShort = I18N_KEYS.GLOBAL_ERROR.ERROR_handleInputTooShort,   // Khi ngắn quá mức cho phép
    errorTooLong = I18N_KEYS.GLOBAL_ERROR.ERROR_handleInputTooLong,     // Khi dài quá xá
    errorRangeUnderflow = I18N_KEYS.GLOBAL_ERROR.ERROR_handleInputRangeUnderflow, // Số nhỏ hơn min
    errorRangeOverflow = I18N_KEYS.GLOBAL_ERROR.ERROR_handleInputRangeOverflow,     // Số lớn hơn max
    errorStepMismatch = I18N_KEYS.GLOBAL_ERROR.ERROR_handleInputStepMismatch,   //Kêu nhập số nguyên mà nhập số thực
    errorBadInput = I18N_KEYS.GLOBAL_ERROR.ERROR_handleInputBadInput,       // Nhập chi mà không ra số luôn
    errorGeneric = I18N_KEYS.GLOBAL_ERROR.ERROR_handleInputInvalid,     // Khi chả hiểu lỗi chi mà nói nữa
    // Props mới bổ sung
    leftIcon,         // Component Icon hoặc chuỗi (ví dụ: <AtSymbolIcon />)
    rightIcon,        // Component Icon (ví dụ: <CheckIcon />)
    helperText,       // Dòng mô tả dưới input
    className = "",   // Cho phép truyền thêm class từ ngoài
    triggerMascotMood,
    enableProfanityFilter = true,
    ...rest           // Lùa hết name, value, type, onChange, required, v.v.
}) {
    const { t } = useTranslation();
    const [hasError, setHasError] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [isClosing, setIsClosing] = useState(false);

    const shouldFilter =
        enableProfanityFilter &&
        (!rest.type || rest.type === "text" || rest.type === "search");

    const handleInvalid = (e) => {
        e.preventDefault();
        const validity = e.target.validity; // Lấy đối tượng kiểm tra lỗi của trình duyệt

        if (validity.valueMissing) {
            setErrorMessage(errorEmpty);
        } else if (validity.patternMismatch) {
            setErrorMessage(errorPattern);
        } else if (validity.typeMismatch) {
            setErrorMessage(errorType);
        } else if (validity.tooShort) {
            setErrorMessage(errorTooShort);
        } else if (validity.tooLong) {
            setErrorMessage(errorTooLong);
        } else if (validity.rangeUnderflow) {
            setErrorMessage(errorRangeUnderflow);
        } else if (validity.rangeOverflow) {
            setErrorMessage(errorRangeOverflow);
        } else if (validity.stepMismatch) {
            setErrorMessage(errorStepMismatch);
        } else if (validity.badInput) {
            setErrorMessage(errorBadInput);
        } else {
            setErrorMessage(errorGeneric);
        }

        setIsClosing(false);
        setHasError(true);
    };

    const handleInput = (e) => {
        if (hasError) {
            setIsClosing(true);
            setTimeout(() => {
                setHasError(false);
                setIsClosing(false);
            }, 200);
        }
        // Gọi lại hàm onInput từ props nếu có
        if (rest.onInput) rest.onInput(e);
    };

    return (
        <div className={`sm:col-span-3 relative ${className}`}>
            {/* Label */}
            {label && (
                <label htmlFor={id} className="font-heading font-medium block text-sm/6 text-text-shade-300 mb-2">
                    {Array.isArray(label) ? t(...label) : t(label)}
                    {optional && (
                        <span className="text-shadow-accent-200 text-xs font-light ml-2" title="optional">{t(I18N_KEYS.COMMON.common_input_label_optional)}</span>
                    )}
                </label>
            )}

            <div className="relative group">
                {/* Left Icon Container */}
                {leftIcon && (
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-shade-200 group-focus-within:text-primary-500 transition-colors">
                        {leftIcon}
                    </div>
                )}

                <input
                    id={id}
                    {...rest} // Trải hết props: type, name, value, onChange, placeholder...
                    onInvalid={handleInvalid}
                    onInput={handleInput}
                    onChange={(e) => {
                        if (!enableProfanityFilter || !shouldFilter) {
                            rest.onChange?.(e);
                            return;
                        }

                        const result = censorProfanityText(e.target.value);

                        if (result.censored) {
                            e.target.value = result.text;
                            triggerMascotMood?.("surprised");
                        }

                        rest.onChange?.(e);
                    }}
                    placeholder={Array.isArray(placeholder) ? t(...placeholder) : t(placeholder)}
                    className={`
                        [&::-webkit-search-cancel-button]:appearance-none
                        [&::-webkit-search-decoration]:appearance-none
                        block w-full rounded-xl bg-bg-shade-50 py-1.5 text-base text-text-shade-900 
                        outline-1 -outline-offset-1 outline-bg-shade-300 
                        placeholder:text-text-shade-200 
                        focus:outline-2 focus:-outline-offset-2 focus:outline-primary-600 
                        font-ui sm:text-sm/6 transition-all
                        ${leftIcon ? 'pl-10' : 'px-3'} 
                        ${rightIcon ? 'pr-10' : 'px-3'}
                        ${hasError ? 'outline-accent-500' : ''}
                    `}
                />

                {/* Right Icon Container */}
                {rightIcon && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        {rightIcon}
                    </div>
                )}
            </div>

            {/* Helper Text (Dòng mô tả dưới) */}
            {helperText && !hasError && (
                <p className="mt-1.5 text-xs text-text-shade-200 italic font-body px-1">
                    {Array.isArray(helperText) ? t(...helperText) : t(helperText)}
                </p>
            )}

            {/* Bóng thoại báo lỗi (Has Error Popup) */}
            {hasError && (
                <div className={`absolute top-full right-0 mt-4 mr-2 z-50 pointer-events-none ${isClosing ? 'animate-popup-exit' : 'animate-popup-appear-and-float'}`}>
                    <div className="absolute -top-2 right-6 w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-b-10 border-accent"></div>
                    <div className="bg-accent-200 text-main-text px-4 py-1.5 rounded-4xl border-2 border-accent text-xs shadow-[3px_3px_0px_0px] shadow-accent max-w-44 sm:max-w-60">
                        <span className="block wrap-break-words italic leading-relaxed font-body">{Array.isArray(errorMessage) ? t(...errorMessage) : t(errorMessage)}</span>
                    </div>
                </div>
            )}
        </div>
    );
}