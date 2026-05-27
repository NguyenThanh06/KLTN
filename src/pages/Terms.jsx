import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { I18N_KEYS } from "../i18n/key";

import PageContainer from "../components/PageContainer";
import SectionContainer from "../components/SectionContainer";

export default function Terms({
    setHelperFocusState,
}) {
    const { t } = useTranslation();

    return (
        <PageContainer setHelperFocusState={setHelperFocusState}>
            <SectionContainer>
                <div className="text-main-text font-heading leading-relaxed px-6 py-4">

                    <h2 className="text-3xl font-semibold mb-8 text-sub-text">
                        {t(I18N_KEYS.TERMS.terms_title)}
                    </h2>

                    <h4 className="text-xl font-bold mb-4">
                        {t(I18N_KEYS.TERMS.terms_h1)}
                    </h4>
                    <p className="mb-12 pb-4 whitespace-pre-line border-b border-text-shade-300">
                        {t(I18N_KEYS.TERMS.terms_p1)}   
                    </p>

                    <h4 className="text-xl font-bold mb-4">
                        {t(I18N_KEYS.TERMS.terms_h2)}
                    </h4>
                    <p className="mb-12 pb-4 whitespace-pre-line border-b border-text-shade-300">
                        {t(I18N_KEYS.TERMS.terms_p2)}   
                    </p>

                    <h4 className="text-xl font-bold mb-4">
                        {t(I18N_KEYS.TERMS.terms_h3)}
                    </h4>
                    <p className="mb-12 pb-4 whitespace-pre-line border-b border-text-shade-300">
                        {t(I18N_KEYS.TERMS.terms_p3)}   
                    </p>

                    <h4 className="text-xl font-bold mb-4">
                        {t(I18N_KEYS.TERMS.terms_h4)}
                    </h4>
                    <p className="mb-12 pb-4 whitespace-pre-line border-b border-text-shade-300">
                        {t(I18N_KEYS.TERMS.terms_p4)}   
                    </p>

                    <h4 className="text-xl font-bold mb-4">
                        {t(I18N_KEYS.TERMS.terms_h5)}
                    </h4>
                    <p className="mb-12 pb-4 whitespace-pre-line border-b border-text-shade-300">
                        {t(I18N_KEYS.TERMS.terms_p5)}   
                    </p>

                    <h4 className="text-xl font-bold mb-4">
                        {t(I18N_KEYS.TERMS.terms_h6)}
                    </h4>
                    <p className="mb-12 pb-4 whitespace-pre-line border-b border-text-shade-300">
                        {t(I18N_KEYS.TERMS.terms_p6)}   
                    </p>

                    <h4 className="text-xl font-bold mb-4">
                        {t(I18N_KEYS.TERMS.terms_h7)}
                    </h4>
                    <p className="mb-12 pb-4 whitespace-pre-line border-b border-text-shade-300">
                        {t(I18N_KEYS.TERMS.terms_p7)}   
                    </p>

                    <h4 className="text-xl font-bold mb-4">
                        {t(I18N_KEYS.TERMS.terms_h8)}
                    </h4>
                    <p className="mb-12 pb-4 whitespace-pre-line border-b border-text-shade-300">
                        {t(I18N_KEYS.TERMS.terms_p8)}   
                    </p>

                    <h4 className="text-xl font-bold mb-4">
                        {t(I18N_KEYS.TERMS.terms_h9)}
                    </h4>
                    <p className="mb-12 pb-4 whitespace-pre-line border-b border-text-shade-300">
                        {t(I18N_KEYS.TERMS.terms_p9)}   
                    </p>

                    <h4 className="text-xl font-bold mb-4">
                        {t(I18N_KEYS.TERMS.terms_h10)}
                    </h4>
                    <p className="mb-12 pb-4 whitespace-pre-line border-b border-text-shade-300">
                        {t(I18N_KEYS.TERMS.terms_p10)}   
                    </p>

                    <h4 className="text-xl font-bold mb-4">
                        {t(I18N_KEYS.TERMS.terms_h11)}
                    </h4>
                    <p className="mb-12 pb-4 whitespace-pre-line border-b border-text-shade-300">
                        {t(I18N_KEYS.TERMS.terms_p11)}   
                    </p>

                    <h4 className="text-xl font-bold mb-4">
                        {t(I18N_KEYS.TERMS.terms_h12)}
                    </h4>
                    <p className="mb-12 pb-4 whitespace-pre-line border-b border-text-shade-300">
                        {t(I18N_KEYS.TERMS.terms_p12)}   
                    </p>

                    <h4 className="text-xl font-bold mb-4">
                        {t(I18N_KEYS.TERMS.terms_h13)}
                    </h4>
                    <p className="mb-12 pb-4 whitespace-pre-line border-b border-text-shade-300">
                        {t(I18N_KEYS.TERMS.terms_p13)}   
                    </p>

                    <h4 className="text-xl font-bold mb-4">
                        {t(I18N_KEYS.TERMS.terms_h14)}
                    </h4>
                    <p className="mb-12 pb-4 whitespace-pre-line">
                        {t(I18N_KEYS.TERMS.terms_p14)}
                    </p>
                    
                </div>
            </SectionContainer>
        </PageContainer>
    );
}