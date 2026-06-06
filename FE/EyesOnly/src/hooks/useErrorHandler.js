import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { I18N_KEYS } from '../i18n/key';

export const useErrorHandler = (setGlobalModal) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const handleError = useCallback((errorResponse) => {
    const safeErrorResponse = errorResponse || {};
    const { status, code } = safeErrorResponse;

    // A. XỬ LÝ TOÀN CỤC (Tự làm luôn)
      // 401: Chưa đăng nhập hoặc token hết hạn. Hoặc đang xài nửa chừng xong bị khóa thì thành cx trả 401 hế
      if (status === 401) {
        window.location.href = '/login';
        return { handled: true }; 
      }

      // 403: Đã đăng nhập nhưng không có quyền vào chỗ này.
      if (status === 403) {
        //Ni chắc là đẩy về Home + đưa modal thông báo
        setGlobalModal?.({
          isOpen: true,
          type: 'info',
          title: t(I18N_KEYS.GLOBAL_ERROR.ERROR_403_title),
          description: t(I18N_KEYS.GLOBAL_ERROR.ERROR_403_desc),
        });
        navigate("/", { replace: true });
        return { handled: true };
      }

      
      // 404: Tìm k ra trang
      if (status === 404) {
        //Ni chắc là đẩy về 404 thôi
        navigate("/404", { replace: true });
        return { handled: true };
      }

      if (status === 500) { // Server sập
        setGlobalModal?.({
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
    };
  }, [navigate, setGlobalModal, t]);

  return { handleError };
};
