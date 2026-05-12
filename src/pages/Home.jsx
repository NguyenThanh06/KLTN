import React, { useState, useEffect } from 'react';
import { useTranslation } from "react-i18next";
import { I18N_KEYS } from "../i18n/key";
import { useErrorHandler } from '../hooks/useErrorHandler';
import { Link } from 'react-router-dom';
import { useLocation } from 'react-router-dom';

import PageContainer from '../components/PageContainer';
import Input from "../components/Input";
import Button from "../components/Button";

export default function Home( { setGlobalModal, addHelperError, setHelperFocusState } ){
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
          <div className="mx-auto max-w-2xl py-32 sm:py-48 lg:py-56">
            <div className="hidden sm:mb-8 sm:flex sm:justify-center">
              <div className="relative rounded-full px-3 py-1 text-sm/6 text-gray-600 ring-1 ring-gray-900/10 hover:ring-gray-900/20">
                Announcing our next round of funding. <a href="#" className="font-semibold text-indigo-600"><span aria-hidden="true" className="absolute inset-0"></span>Read more <span aria-hidden="true">&rarr;</span></a>
              </div>
            </div>
            <div className="text-center">
              <h1 className="text-5xl font-semibold tracking-tight text-balance text-gray-900 sm:text-7xl">Data to enrich your online business</h1>
              <p className="mt-8 text-lg font-medium text-pretty text-gray-500 sm:text-xl/8">Anim aute id magna aliqua ad ad non deserunt sunt. Qui irure qui lorem cupidatat commodo. Elit sunt amet fugiat veniam occaecat.</p>
              <div className="mt-10 flex items-center justify-center gap-x-6">
                <a href="#" className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">Get started</a>
                <a href="#" className="text-sm/6 font-semibold text-gray-900">Learn more <span aria-hidden="true">→</span></a>
              </div>
            </div>
          </div>
        </PageContainer>
    );
}



