import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Compass, Home, RotateCcw } from "lucide-react";
import { FaCompass } from "react-icons/fa6";

import PageContainer from "../components/PageContainer";
import Button from "../components/Button";
import { I18N_KEYS } from "../i18n/key";

export default function NotFoundPage({
    setHelperFocusState,
}) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();

    const handleGoHome = () => {
        navigate("/", { replace: true });
    };

    const handleGoBack = () => {
        if (location.key && location.key !== "default") {
            navigate(-1);
            return;
        }

        navigate("/", { replace: true });
    };

    return (
        <PageContainer setHelperFocusState={setHelperFocusState}>
            <main className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
                <section className="w-full max-w-2xl rounded-[2rem] bg-main-bg px-6 py-10 text-center shadow-sm ring-1 ring-bg-shade-100 sm:px-10 sm:py-14">
                    <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-bg-shade-100/50 text-primary">
                        <FaCompass size={44} strokeWidth={1.8} />
                    </div>

                    <p className="mb-10 text-sm font-semibold uppercase tracking-[0.35em] text-primary">
                        {t(I18N_KEYS.GLOBAL_ERROR.ERROR_404_labelCode)}
                    </p>

                    <h1 className="mt-4 text-3xl font-bold text-main-text sm:text-4xl">
                        {t(I18N_KEYS.GLOBAL_ERROR.ERROR_404_title)}
                    </h1>

                    <p className="mx-auto mb-10 mt-4 max-w-xl text-base leading-7 text-main-text/75">
                        {t(I18N_KEYS.GLOBAL_ERROR.ERROR_404_desc)}
                    </p>

                    <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                        <Button
                            type="button"
                            variant="primary"
                            onClick={handleGoHome}
                            className="flex items-center justify-center gap-2 rounded-full px-6"
                        >
                            <Home size={18} />
                            <span>{t(I18N_KEYS.GLOBAL_ERROR.ERROR_404_button_toHome)}</span>
                        </Button>

                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleGoBack}
                            className="flex items-center justify-center gap-2 rounded-full px-6"
                        >
                            <RotateCcw size={18} />
                            <span>{t(I18N_KEYS.GLOBAL_ERROR.ERROR_404_button_back)}</span>
                        </Button>
                    </div>
                </section>
            </main>
        </PageContainer>
    );
}