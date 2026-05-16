import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { I18N_KEYS } from '../i18n/key';

export const useErrorHandler = (setModalConfig, addToErrorStack) => {
  const { t } = useTranslation();

  const handleError = useCallback((errorResponse) => {

    const status = errorResponse?.status;
    const code = errorResponse?.data?.code;
    const message = errorResponse?.data?.message;

    // 401
    if (status === 401 && code === "UNAUTHENTICATED") {
      window.location.href = '/login';
      return { handled: true };
    }

    // 403
    if (status === 403) {
      return { handled: true };
    }

    // 500
    if (status === 500) {
      setModalConfig({
        isOpen: true,
        type: 'info',
        title: t(I18N_KEYS.GLOBAL_ERROR.ERROR_500_title),
        description: t(I18N_KEYS.GLOBAL_ERROR.ERROR_500_desc),
      });

      return { handled: true };
    }

    return {
      handled: false,
      code,
      message
    };

  }, [setModalConfig]);

  return { handleError };
};
