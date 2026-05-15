import React, { useState, useEffect } from 'react';
import { useTranslation } from "react-i18next";
import { I18N_KEYS } from "../i18n/key";
import { useErrorHandler } from '../hooks/useErrorHandler';
import { Link } from 'react-router-dom';
import { useLocation } from 'react-router-dom';

import PageContainer from '../components/PageContainer';
import Input from "../components/Input";
import Button from "../components/Button";
import HeroSearchSection from '../components/HeroSearchSection';
import PostSectionContainer from '../components/PostSectionContainer';
import PostGrid from '../components/PostGrid';

import {MOCK_POST_DATA_1} from "../data/Post/mockPost1";
import {MOCK_POST_DATA_2} from "../data/Post/mockPost2";

export default function Home( { setGlobalModal, addHelperError, setHelperFocusState, isUnder18, isAlertActive, visitorIP, isTabBlurred, clearAlert  } ){
    const location = useLocation();

    //Ni là từ cái lỗi 403 k có quyền vô trang mô đó đá về home
    useEffect(() => {
      if (location.state?.showForbiddenModal) {
        setGlobalModal({
          isOpen: true,
          type: 'info',
          title: I18N_KEYS.GLOBAL_ERROR.ERROR_403_title,
          description: I18N_KEYS.GLOBAL_ERROR.ERROR_403_desc,
        });
        // Xóa state để tránh việc F5 lại trang nó lại hiện modal
        window.history.replaceState({}, document.title);
      }
    }, [location]);

    return (
        <PageContainer setHelperFocusState = {setHelperFocusState}>
          <HeroSearchSection></HeroSearchSection>
          <PostSectionContainer
              title={I18N_KEYS.HOME.COMMON.home_postSection_title_randomSection}
              description={I18N_KEYS.HOME.COMMON.home_postSection_desc_randomSection}
          >
            <PostGrid 
                    posts={[MOCK_POST_DATA_1,MOCK_POST_DATA_2,MOCK_POST_DATA_1,MOCK_POST_DATA_2,MOCK_POST_DATA_1,MOCK_POST_DATA_2,MOCK_POST_DATA_1,MOCK_POST_DATA_2,MOCK_POST_DATA_1,MOCK_POST_DATA_2,MOCK_POST_DATA_1,MOCK_POST_DATA_2,MOCK_POST_DATA_1,MOCK_POST_DATA_2,MOCK_POST_DATA_1,MOCK_POST_DATA_2]}
                    isUnder18={isUnder18}
                    isAlertActive={isAlertActive} 
                    visitorIP={visitorIP}
                    isTabBlurred={isTabBlurred}
                    clearAlert={clearAlert}
            />
          </PostSectionContainer>
        </PageContainer>
    );
}



