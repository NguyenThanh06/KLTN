import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import axiosClient from "../api/axiosClient";

import { I18N_KEYS } from "../i18n/key";
import PageContainer from "../components/PageContainer";
import HeroSearchSection from "../components/HeroSearchSection";
import PostSectionContainer from "../components/PostSectionContainer";
import PostGrid from "../components/PostGrid";

const RANDOM_RETRY_LIMIT = 3;

const getPostID = (post) => post?.postID ?? post?.postId;

export default function Home({
  setGlobalModal,
  addHelperError,
  setHelperFocusState,
  isUnder18,
  isAlertActive,
  visitorIP,
  isTabBlurred,
  clearAlert,
}) {
  const location = useLocation();

  /*
   * Section 1: Tác phẩm mới ra lò.
   * Chỉ lấy đúng batch đầu tiên gồm 18 tác phẩm mới nhất.
   */
  const [newestPosts, setNewestPosts] = useState([]);
  const [isNewestLoading, setIsNewestLoading] = useState(false);

  /*
   * Section 2: Đi dạo ngẫu hứng.
   * Các batch random được nối thêm khi người dùng cuộn xuống cuối.
   */
  const [randomPosts, setRandomPosts] = useState([]);
  const [randomTotalElements, setRandomTotalElements] = useState(null);
  const [isRandomInitialLoading, setIsRandomInitialLoading] = useState(false);
  const [isRandomReady, setIsRandomReady] = useState(false);

  /*
   * Lưu các postID random đã xuất hiện trên màn hình hiện tại.
   * Backend vẫn có thể trả trùng; FE sẽ bỏ qua trước khi render.
   */
  const randomSeenPostIdsRef = useRef(new Set());

  /*
   * Tránh gọi đồng thời nhiều request random
   * khi IntersectionObserver kích hoạt liên tục.
   */
  const randomRequestInFlightRef = useRef(false);

  /*
   * Tránh gọi API initial hai lần trong React StrictMode lúc develop.
   */
  const hasLoadedInitialHomeRef = useRef(false);

  const notifyLoadError = useCallback(() => {
    addHelperError?.({
      id: Date.now(),
      code: I18N_KEYS.GLOBAL_ERROR.ERROR_unknownError,
    });
  }, [addHelperError]);

  /*
   * Modal lỗi không có quyền hiện có của trang Home.
   * Giữ lại logic này như code ban đầu của bạn.
   */
  useEffect(() => {
    if (location.state?.showForbiddenModal) {
      setGlobalModal({
        isOpen: true,
        type: "info",
        title: I18N_KEYS.GLOBAL_ERROR.ERROR_403_title,
        description: I18N_KEYS.GLOBAL_ERROR.ERROR_403_desc,
      });

      window.history.replaceState({}, document.title);
    }
  }, [location.state?.showForbiddenModal, setGlobalModal]);

  /*
   * Lấy cố định 18 tác phẩm mới nhất.
   *
   * Backend:
   * GET /home?page=0
   */
  const fetchNewestPosts = useCallback(async () => {
    try {
      setIsNewestLoading(true);

      const response = await axiosClient.get("/home", {
        params: {
          page: 0,
        },
      });

      setNewestPosts(response.data?.content || []);
    } catch (error) {
      console.error("Error while fetching newest home posts:", error);
      notifyLoadError();
    } finally {
      setIsNewestLoading(false);
    }
  }, [notifyLoadError]);

  /*
   * Gọi một batch random từ backend và lọc các Post đã hiện trước đó.
   *
   * replace = true:
   * - dùng cho lần tải đầu tiên của section random.
   *
   * replace = false:
   * - dùng cho các lần infinite scroll tải tiếp.
   */
  const fetchRandomBatch = useCallback(async ({ replace = false } = {}) => {
    if (randomRequestInFlightRef.current) {
      return {
        addedCount: 0,
        hasMore: true,
      };
    }

    randomRequestInFlightRef.current = true;

    try {
      const response = await axiosClient.get("/home/random");

      const incomingPosts = response.data?.content || [];
      const totalElements = Number(response.data?.totalElements || 0);

      if (replace) {
        randomSeenPostIdsRef.current = new Set();
      }

      const uniqueIncomingPosts = [];

      incomingPosts.forEach((post) => {
        const postID = getPostID(post);

        if (postID == null) {
          return;
        }

        if (randomSeenPostIdsRef.current.has(postID)) {
          return;
        }

        randomSeenPostIdsRef.current.add(postID);
        uniqueIncomingPosts.push(post);
      });

      setRandomTotalElements(totalElements);

      if (replace) {
        setRandomPosts(uniqueIncomingPosts);
      } else if (uniqueIncomingPosts.length > 0) {
        setRandomPosts((prev) => [
          ...prev,
          ...uniqueIncomingPosts,
        ]);
      }

      return {
        addedCount: uniqueIncomingPosts.length,

        /*
         * Khi đã hiện đủ toàn bộ Post hợp lệ thì dừng infinite scroll.
         */
        hasMore:
          randomSeenPostIdsRef.current.size < totalElements &&
          incomingPosts.length > 0,
      };
    } catch (error) {
      console.error("Error while fetching random home posts:", error);
      notifyLoadError();

      /*
       * Gặp lỗi thì dừng observer để tránh gọi API lỗi liên tục.
       */
      return {
        addedCount: 0,
        hasMore: false,
      };
    } finally {
      randomRequestInFlightRef.current = false;
    }
  }, [notifyLoadError]);

  /*
   * Tải batch random đầu tiên khi mở Home.
   */
  const fetchInitialRandomPosts = useCallback(async () => {
    try {
      setIsRandomInitialLoading(true);

      await fetchRandomBatch({
        replace: true,
      });
    } finally {
      setIsRandomInitialLoading(false);
      setIsRandomReady(true);
    }
  }, [fetchRandomBatch]);

  /*
   * Tải dữ liệu lần đầu cho cả hai section.
   */
  useEffect(() => {
    if (hasLoadedInitialHomeRef.current) {
      return;
    }

    hasLoadedInitialHomeRef.current = true;

    fetchNewestPosts();
    fetchInitialRandomPosts();
  }, [fetchNewestPosts, fetchInitialRandomPosts]);

  /*
   * Callback được PostGrid gọi khi người dùng cuộn đến cuối section random.
   *
   * Vì backend được phép random trùng,
   * một batch có thể không thêm được card mới nào.
   * Hàm thử tối đa 3 batch để tìm thêm bài chưa hiện.
   *
   * Sau 3 lần vẫn chỉ nhận bài trùng thì dừng loader,
   * tránh để observer gọi API liên tục vô hạn.
   */
  const handleLoadMoreRandomPosts = useCallback(async () => {
    for (let attempt = 0; attempt < RANDOM_RETRY_LIMIT; attempt += 1) {
      const result = await fetchRandomBatch();

      if (!result.hasMore) {
        return false;
      }

      if (result.addedCount > 0) {
        return true;
      }
    }

    return false;
  }, [fetchRandomBatch]);

  const canEnableRandomInfiniteScroll =
    isRandomReady &&
    randomTotalElements !== null &&
    randomPosts.length < randomTotalElements;

  return (
    <PageContainer setHelperFocusState={setHelperFocusState}>
      <HeroSearchSection />

      <PostSectionContainer
        title={I18N_KEYS.HOME.COMMON.home_postSection_title_newestSection}
        description={I18N_KEYS.HOME.COMMON.home_postSection_desc_newestSection}
        showMore="/search?mode=post&keyword=&page=1&pageSize=18&postSearchType=all&includeAi=true&sort=newest"
      >
        {isNewestLoading && newestPosts.length === 0 ? (
          <p className="py-10 text-center font-ui text-sm text-text-shade-300">
            Đang tải...
          </p>
        ) : (
          <PostGrid
            posts={newestPosts}
            isUnder18={isUnder18}
            isAlertActive={isAlertActive}
            visitorIP={visitorIP}
            isTabBlurred={isTabBlurred}
            clearAlert={clearAlert}
          />
        )}
      </PostSectionContainer>

      <PostSectionContainer
        title={I18N_KEYS.HOME.COMMON.home_postSection_title_randomSection}
        description={I18N_KEYS.HOME.COMMON.home_postSection_desc_randomSection}
      >
        {isRandomInitialLoading && randomPosts.length === 0 ? (
          <p className="py-10 text-center font-ui text-sm text-text-shade-300">
            Đang tải...
          </p>
        ) : (
          <PostGrid
            posts={randomPosts}
            isUnder18={isUnder18}
            isAlertActive={isAlertActive}
            visitorIP={visitorIP}
            isTabBlurred={isTabBlurred}
            clearAlert={clearAlert}

            /*
             * Chỉ section Đi dạo ngẫu hứng mới bật infinite scroll.
             */
            enableInfiniteScroll={canEnableRandomInfiniteScroll}
            onLoadMore={handleLoadMoreRandomPosts}
          />
        )}
      </PostSectionContainer>
    </PageContainer>
  );
}