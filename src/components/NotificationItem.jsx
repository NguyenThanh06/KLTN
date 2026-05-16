import React from 'react';
import { useTranslation } from "react-i18next";
import { I18N_KEYS } from "../i18n/key";
import { Link } from "react-router-dom";

import { HiUserPlus, HiMiniChatBubbleLeftEllipsis, HiMiniChatBubbleLeftRight  } from "react-icons/hi2";
import { FaHeartCrack } from "react-icons/fa6";

export default function NotificationItem({ 
    type,       //theoDoi, cmt, cmtRep, baoCao
    noiDung,
    thoiDiemThongBao, 
    daDoc,
    link,
}) {

    const { t, i18n } = useTranslation();

    return (
        <Link to={link} className="flex items-start gap-3 p-3 my-2 bg-main-bg hover:bg-primary-100 rounded-xl cursor-pointer transition-colors ">
            {/* Icon lớn bên trái */}
            <div className="shrink-0 w-10 h-10 bg-primary-200 rounded-full flex items-center justify-center text-primary-600 text-lg">
                {type === "theoDoi" && (
                    <HiUserPlus/>
                )}
                {type === "cmt" && (
                    <HiMiniChatBubbleLeftEllipsis/>
                )}
                {type === "cmtRep" && (
                    <HiMiniChatBubbleLeftRight/>
                )}
                {type === "baoCao" && (
                    <FaHeartCrack/>
                )}
            </div>

            {/* Nội dung ở giữa */}
            <div className="grow min-w-0">
                <div className="flex justify-between items-baseline mb-0.5">
                    <h4 className={`text-sm font-semibold truncate ${daDoc ? 'text-main-text' : 'text-sub-text'}`}>
                        {type === "theoDoi" && (
                            t(I18N_KEYS.COMMON.common_notificationTitle_typeTheoDoi)
                        )}
                        {type === "cmt" && (
                            t(I18N_KEYS.COMMON.common_notificationTitle_typeCmt)
                        )}
                        {type === "cmtRep" && (
                            t(I18N_KEYS.COMMON.common_notificationTitle_typeCmtRep)
                        )}
                        {type === "baoCao" && (
                            t(I18N_KEYS.COMMON.common_notificationTitle_typeBaoCao)
                        )}
                    </h4>
                    <span className="text-[10px] text-gray-400 ml-2 whitespace-nowrap">{thoiDiemThongBao}</span>
                </div>
                <p className="text-xs text-text-shade-600 line-clamp-2 leading-relaxed font-light">
                    <span className='font-medium'>{noiDung} </span>
                    {type === "theoDoi" && <span> {t(I18N_KEYS.COMMON.common_notificationDesc_typeTheoDoi)}</span>}
                    {type === "cmt" && <span> {t(I18N_KEYS.COMMON.common_notificationDesc_typeCmt)}</span>}
                    {type === "cmtRep" && <span> {t(I18N_KEYS.COMMON.common_notificationDesc_typeCmtRep)}</span>}
                    {type === "baoCao" && <span> {t(I18N_KEYS.COMMON.common_notificationDesc_typeBaoCao)}</span>}
                </p>
            </div>

            {/* Trạng thái chưa đọc bên phải */}
                <div className="shrink-0 mt-1.5">
                    {daDoc? 
                        (
                            <></>
                        ):
                        (
                            <div className="w-1.5 h-1.5 bg-accent-500 rounded-full"></div>
                        )
                    }
                </div>
        </Link>
    );
}