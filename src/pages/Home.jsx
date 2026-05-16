import React, { useState, useEffect } from 'react';
import { I18N_KEYS } from "../i18n/key";
import { useLocation } from 'react-router-dom';
import axios from "axios";

import PageContainer from '../components/PageContainer';
import HeroSearchSection from '../components/HeroSearchSection';
import PostSectionContainer from '../components/PostSectionContainer';
import PostGrid from '../components/PostGrid';
import Button from "../components/Button";

export default function Home({
  setGlobalModal,
  addHelperError,
  setHelperFocusState,
  isUnder18,
  isAlertActive,
  visitorIP,
  isTabBlurred,
  clearAlert
}) {
  const location = useLocation();

  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(0);
  const [last, setLast] = useState(false);
  const [loading, setLoading] = useState(false);

  // Lỗi 403 bị đá về home
  useEffect(() => {
    if (location.state?.showForbiddenModal) {
      setGlobalModal({
        isOpen: true,
        type: 'info',
        title: I18N_KEYS.GLOBAL_ERROR.ERROR_403_title,
        description: I18N_KEYS.GLOBAL_ERROR.ERROR_403_desc,
      });

      window.history.replaceState({}, document.title);
    }
  }, [location, setGlobalModal]);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);

        const res = await axios.get(`http://localhost:8080/home?page=${page}`, {
          withCredentials: true,
        });

        const newPosts = res.data.content || [];

        setPosts(prev => {
          if (page === 0) {
            return newPosts;
          }

          return [...prev, ...newPosts];
        });

        setLast(res.data.last);
      } catch (error) {
        console.error("Lỗi khi lấy danh sách post:", error);

        if (addHelperError) {
          addHelperError("Không thể tải danh sách bài viết.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [page]);

  const handleLoadMore = () => {
    if (!loading && !last) {
      setPage(prev => prev + 1);
    }
  };

  return (
    <PageContainer setHelperFocusState={setHelperFocusState}>
      <HeroSearchSection />

      <PostSectionContainer
        title={I18N_KEYS.HOME.COMMON.home_postSection_title_randomSection}
        description={I18N_KEYS.HOME.COMMON.home_postSection_desc_randomSection}
      >
        <PostGrid
          posts={posts}
          isUnder18={isUnder18}
          isAlertActive={isAlertActive}
          visitorIP={visitorIP}
          isTabBlurred={isTabBlurred}
          clearAlert={clearAlert}
        />

        {!last && (
          <div className="flex justify-center mt-8">
            <Button
              onClick={handleLoadMore}
              disabled={loading}
            >
              {loading ? "Đang tải..." : "Xem thêm"}
            </Button>
          </div>
        )}
      </PostSectionContainer>
    </PageContainer>
  );
}