import React from 'react';
import { useTranslation } from 'react-i18next';
import Input from './Input';
import Button from './Button';

const DynamicModal = ({ 
    isOpen, 
    onClose, 
    type = 'info', // 'info', 'one-button', 'two-buttons', 'input'
    title,
    description,
    primaryBtnText,
    primaryBtnType = "button",
    onPrimaryAction,
    secondaryBtnText,
    onSecondaryAction,
    //Phần cho input
    formMethod = "post",
    inputProps = {},
    inputOtherActionText,
    onInputOtherAction
}) => {
    const { t } = useTranslation();

    const handleSubmit = (e) => {
        e.preventDefault(); // Chặn reload trang
        if (onPrimaryAction) onPrimaryAction(); // Gọi hàm xử lý của bạn
    };

    if (!isOpen) return null;

    return (
        // Overlay - Nền tối làm mờ, nằm dưới Header (z-40)
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-bg-shade-950/40 backdrop-blur-sm animate-fade-in">
        
            {/* Modal Content - Chặn nổi bọt sự kiện để bấm vào modal không bị tắt */}
            <div 
                className="relative w-full max-w-2xl animate-popup-appear" 
                onClick={(e) => e.stopPropagation()}
            >
                {/* Nền animate phía sau */}
                <div className="absolute inset-0 bg-main-bg rounded-full animate-modal-appear-and-pulse shadow-2xl z-0"></div>

                {/* Cái div chính chứa đồ */}
                <div className="relative w-full rounded-full bg-main-bg p-12 md:py-12 md:px-20 z-10 animate-popup-appear">

                    {/* Nút X tròn ở góc trên phải */}
                    <button 
                        onClick={onClose}
                        className="absolute -top-3 -right-3 z-50 w-10 h-10 bg-accent border-4 border-accent text-accent-50 rounded-full flex items-center justify-center text-xl font-bold hover:scale-110 transition-transform shadow-[4px_4px_0px_0px] shadow-accent-700 dark:shadow-accent-300"
                    >
                        ✕
                    </button>

                    <div className="text-center space-y-6">
                        {/* Tiêu đề & Mô tả */}
                        <h3 className="text-2xl font-bold text-main-text font-heading">{Array.isArray(title) ? t(...title) : t(title)}</h3>
                        <p className="text-sm text-text-shade-400 font-body italic">{Array.isArray(description) ? t(...description) : t(description)}</p>

                        {/* Phần thân tùy biến theo Type */}
                        <form method={formMethod} onSubmit={handleSubmit} className="flex flex-col items-center space-y-4 w-full">
                            
                            {type === 'input' && (
                                <div className="w-full space-y-2">
                                    <Input 
                                        {...inputProps}
                                    />
                                    {inputOtherActionText && (
                                        <div className="text-sm flex justify-end">
                                        <a 
                                            onClick={onInputOtherAction} 
                                            className="font-medium font-body text-secondary-800 hover:text-secondary-600 cursor-pointer"
                                        >
                                                {Array.isArray(inputOtherActionText) ? t(...inputOtherActionText) : t(inputOtherActionText)}
                                        </a>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Các nút bấm */}
                            <div className="flex flex-wrap justify-center gap-4 w-full">
                                {(type === 'two-buttons') && (
                                    <Button 
                                        variant="outline" 
                                        onClick={onSecondaryAction}
                                    >
                                        {t(secondaryBtnText)}
                                    </Button>
                                )}
                                
                                {(type !== 'info') && (
                                    <Button 
                                        type={primaryBtnType === "submit" ? "submit" : "button"}
                                        onClick={primaryBtnType !== "submit" ? onPrimaryAction : undefined}
                                        className="min-w-28"
                                    >
                                        {t(primaryBtnText)}
                                    </Button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DynamicModal;