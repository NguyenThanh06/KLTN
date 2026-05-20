import React, { useState, useEffect } from 'react';
import { useTranslation } from "react-i18next";
import { I18N_KEYS } from "../i18n/key";
import { useErrorHandler } from '../hooks/useErrorHandler';
import { Link } from 'react-router-dom';
import { useLocation } from 'react-router-dom';

import PageContainer from '../components/PageContainer';
import HeroSearchSection from '../components/HeroSearchSection';
import PostSectionContainer from '../components/PostSectionContainer';
import PostGrid from '../components/PostGrid';

import {MOCK_POST_DATA_1} from "../data/Post/mockPost1";
import {MOCK_POST_DATA_2} from "../data/Post/mockPost2";

export default function Home( { setGlobalModal, addHelperError, setHelperFocusState, isUnder18, isAlertActive, visitorIP, clearAlert  } ){
    const location = useLocation();
    //Mảng tổng chứa post, bn đang để đại đại, đó nớ đổi rỗng rồi get vô hế
    const [allPosts, setAllPosts] = useState([MOCK_POST_DATA_1,MOCK_POST_DATA_2,MOCK_POST_DATA_1,MOCK_POST_DATA_2,MOCK_POST_DATA_1,MOCK_POST_DATA_2,MOCK_POST_DATA_1,MOCK_POST_DATA_2,MOCK_POST_DATA_1,MOCK_POST_DATA_2,MOCK_POST_DATA_1,MOCK_POST_DATA_2,MOCK_POST_DATA_1,MOCK_POST_DATA_2,MOCK_POST_DATA_1,MOCK_POST_DATA_2]);
    const [currentPage, setCurrentPage] = useState(1);
    const limitPage = 10; //Ni là bạn cho hn load 10 page thôi, k cho vô hạn, nớ ưng chỉnh lại
    

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


    //Cái hàm lấy thêm post page tiếp nơi phần lấy ngẫu nhiên
    const handleFetchNextPage = async () => {
      if (currentPage < limitPage){
        const nextPage = currentPage + 1;
        
        // Gọi BE ở đây
        // const response = await fetch(`/api/post?page=${nextPage}`);
        // const data = await response.json();
        
        // Kịch bản 1: Tìm khôgn ra chi hết nữa
        if (!data || data.length === 0) {
          return false; // Trả về false để báo cho PostGrid ngừng theo dõi đáy
        }
        
        // Kịch bản 2: Có bài mới -> Nạp thêm vào mảng tổng và tăng số Page lên
        setAllPosts(prevPosts => [...prevPosts, ...data]);
        setCurrentPage(nextPage);
        return true; 
      }
      return false; //Dừng load thêm do đạt limit rồi
    };





    return (
        <PageContainer setHelperFocusState = {setHelperFocusState}>
          <HeroSearchSection></HeroSearchSection>
          {/* Ni là 18 bài đăng mới nhất, thành lấy ra hế, xong sửa đường dẫn search sort mới nhất ở 'showMore' */}
          <PostSectionContainer
              title={I18N_KEYS.HOME.COMMON.home_postSection_title_newestSection}
              description={I18N_KEYS.HOME.COMMON.home_postSection_desc_newestSection}
              showMore = "/post?newest"
          >
            <PostGrid 
                    posts={[MOCK_POST_DATA_1,MOCK_POST_DATA_2,MOCK_POST_DATA_1,MOCK_POST_DATA_2,MOCK_POST_DATA_1,MOCK_POST_DATA_2,MOCK_POST_DATA_1,MOCK_POST_DATA_2,MOCK_POST_DATA_1,MOCK_POST_DATA_2,MOCK_POST_DATA_1,MOCK_POST_DATA_2,MOCK_POST_DATA_1,MOCK_POST_DATA_2,MOCK_POST_DATA_1,MOCK_POST_DATA_1,MOCK_POST_DATA_2,MOCK_POST_DATA_1]}
                    isUnder18={isUnder18}
                    isAlertActive={isAlertActive} 
                    visitorIP={visitorIP}
                    clearAlert={clearAlert}
            />
          </PostSectionContainer>


          {/* Ni là lấy post ngẫu nhiên, mỗi page cỡ 30-42 post ơ, lượng lượng thử. Bạn để số ni cho hn k bị hổng hụt ô ở nhiều màn hình. */}
          <PostSectionContainer
              title={I18N_KEYS.HOME.COMMON.home_postSection_title_randomSection}
              description={I18N_KEYS.HOME.COMMON.home_postSection_desc_randomSection}
          >
            <PostGrid 
                    posts={allPosts}
                    isUnder18={isUnder18}
                    isAlertActive={isAlertActive} 
                    visitorIP={visitorIP}
                    clearAlert={clearAlert}
                    //2 cái dưới ni là cho phép load thêm page mới khi lướt dưới đáy, nớ chỉnh cái hàm lấy thêm page mới nơi 'onLoadMore'
                    enableInfiniteScroll={true}
                    onLoadMore={handleFetchNextPage}
            />
          </PostSectionContainer>
        </PageContainer>
    );
}



