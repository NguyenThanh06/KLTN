import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { I18N_KEYS } from '../i18n/key';

export const useErrorHandler = (setModalConfig, addToErrorStack) => {
  const { t, i18n } = useTranslation();
  const handleError = useCallback((errorResponse) => {
    const { status, code } = errorResponse;

    // A. XỬ LÝ TOÀN CỤC (Tự làm luôn)
      // 401: Chưa đăng nhập hoặc token hết hạn.
      if (status === 401) {
        window.location.href = '/login';
        return { handled: true }; // Báo cho Page là "Tôi lo xong rồi"
      }

      // 403: Đã đăng nhập nhưng không có quyền vào chỗ này.
      if (status === 403) {
        //Ni chắc là đẩy về Home + đưa modal thông báo
        navigate('/home', { 
          state: { 
            showForbiddenModal: true, 
            reason: "403" 
          } 
        });
        return { handled: true };
      }

      if (status === 500) {
        setModalConfig({
          isOpen: true,
          type: 'info',
          title: t(I18N_KEYS.GLOBAL_ERROR.ERROR_500_title),
          description: t(I18N_KEYS.GLOBAL_ERROR.ERROR_500_desc),
        });
        return { handled: true };
      }

    // B. XỬ LÝ CỤC BỘ (Trả về cho Page tự quyết)
    return {
      handled: false, 
      code: code,
      message: message
    };
  }, [setModalConfig, addToErrorStack]);

  return { handleError };
};
