import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { I18N_KEYS } from "../i18n/key";

import PageContainer from "../components/PageContainer";
import SectionContainer from "../components/SectionContainer";

export default function AboutUs({
    setHelperFocusState,
}) {
    const { t } = useTranslation();

    return (
        <PageContainer setHelperFocusState={setHelperFocusState}>
            <SectionContainer>
                <div className="text-main-text font-heading leading-relaxed px-6 py-4">

                    <h2 className="text-3xl font-semibold mb-8 text-sub-text">
                        {t(I18N_KEYS.ABOUT_US.aboutUs_title)}
                    </h2>

                    <h4 className="text-xl font-bold mb-4">
                        {t(I18N_KEYS.ABOUT_US.aboutUs_h1)}
                    </h4>
                    <p className="mb-12 pb-4 border-b border-text-shade-300 whitespace-pre-line">
                        {t(I18N_KEYS.ABOUT_US.aboutUs_p1)}    
                    </p>

                    <h4 className="text-xl font-bold mb-4">
                        {t(I18N_KEYS.ABOUT_US.aboutUs_h2)}
                    </h4>
                    <p className="mb-12 pb-4 border-b border-text-shade-300 whitespace-pre-line">
                        {t(I18N_KEYS.ABOUT_US.aboutUs_p2)}    
                    </p>

                    <h4 className="text-xl font-bold mb-4">
                        {t(I18N_KEYS.ABOUT_US.aboutUs_h3)}
                    </h4>
                    <p className="mb-12 pb-4 border-b border-text-shade-300 whitespace-pre-line">
                        {t(I18N_KEYS.ABOUT_US.aboutUs_p3)}    
                    </p>
                    
                    <h4 className="text-xl font-bold mb-4">
                        {t(I18N_KEYS.ABOUT_US.aboutUs_h4)}
                    </h4>
                    <p className="mb-12 pb-4 whitespace-pre-line">
                        {t(I18N_KEYS.ABOUT_US.aboutUs_p4)}    
                    </p>


                </div>
            </SectionContainer>
        </PageContainer>
    );
}