import React, { useMemo, useEffect, useRef, useState } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa6';
import PostThumbnailCard from './PostThumbnailCard';
import Button from './Button';

const PostGrid = ({ 
  posts = [], 
  isUnder18, 
  isAlertActive, 
  visitorIP,  
  clearAlert,

  enableInfiniteScroll = false,
  onLoadMore,

  showPagination = false,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  scrollOnPageChange = true,
}) => {
  
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const loaderRef = useRef(null);
  const gridContainerRef = useRef(null);

  const [columnCount, setColumnCount] = useState(3);
  const [displayPosts, setDisplayPosts] = useState(posts);
  const [isSwitchingPage, setIsSwitchingPage] = useState(false);
  const [pageDirection, setPageDirection] = useState(0);

  // Tìm số cột phù hợp kích cỡ màn hình
  useEffect(() => {
    const updateColumnCount = () => {
      if (window.innerWidth < 640) {
        setColumnCount(1);
      } else if (window.innerWidth < 1280) {
        setColumnCount(2);
      } else {
        setColumnCount(3);
      }
    };

    updateColumnCount();
    window.addEventListener('resize', updateColumnCount);

    return () => {
      window.removeEventListener('resize', updateColumnCount);
    };
  }, []);

  /*
   * Tạo hiệu ứng chuyển trang mềm hơn.
   * Khi posts từ component cha đổi, grid sẽ fade/slide nhẹ thay vì đổi nội dung đột ngột.
   */
  useEffect(() => {
    setIsSwitchingPage(true);

    const hideTimer = setTimeout(() => {
      setDisplayPosts(posts);

      const showTimer = setTimeout(() => {
        setIsSwitchingPage(false);
      }, 40);

      return () => clearTimeout(showTimer);
    }, 120);

    return () => clearTimeout(hideTimer);
  }, [posts]);

  /*
   * Chia post kiểu masonry gần giống Pinterest.
   * Thay vì index % 3, post tiếp theo sẽ được đưa vào cột đang có chiều cao ước lượng thấp nhất.
   *
   * Chiều cao ước lượng dựa trên:
   * - Tỉ lệ ảnh đầu tiên trong lstKTEOFile
   * - Độ dài tiêu đề
   *
   * Nếu sau này PostThumbnailCard có chiều cao rất đặc biệt, có thể nâng cấp tiếp bằng đo DOM thật.
   */
  const columnWrapper = useMemo(() => {
    const columns = Array.from({ length: columnCount }, () => []);
    const columnHeights = Array.from({ length: columnCount }, () => 0);

    displayPosts.forEach((post) => {
      const firstFile = post?.lstKTEOFile?.[0];

      const imageWidth = firstFile?.width || 1;
      const imageHeight = firstFile?.height || 1;
      const imageRatioHeight = imageHeight / imageWidth;

      const titleLength = post?.tieuDe?.length || 0;

      const estimatedImageHeight = imageRatioHeight * 320;
      const estimatedTitleHeight = Math.ceil(titleLength / 32) * 24;
      const estimatedCardGap = 32;

      const estimatedPostHeight =
        estimatedImageHeight + estimatedTitleHeight + estimatedCardGap;

      const shortestColumnIndex = columnHeights.indexOf(Math.min(...columnHeights));

      columns[shortestColumnIndex].push(post);
      columnHeights[shortestColumnIndex] += estimatedPostHeight;
    });

    return columns;
  }, [displayPosts, columnCount]);

  /*
   * Tạo danh sách nút trang cần hiện:
   * - 3 trang đầu
   * - 3 trang cuối
   * - 2 trang trước trang hiện tại
   * - trang hiện tại
   * - 2 trang sau trang hiện tại
   * Khoảng cách giữa các đoạn sẽ hiện dấu ...
   */
  const paginationItems = useMemo(() => {
    if (!showPagination || totalPages <= 1) return [];

    const pageSet = new Set();

    for (let page = 1; page <= Math.min(3, totalPages); page++) {
      pageSet.add(page);
    }

    for (let page = Math.max(totalPages - 2, 1); page <= totalPages; page++) {
      pageSet.add(page);
    }

    for (
      let page = Math.max(currentPage - 2, 1);
      page <= Math.min(currentPage + 2, totalPages);
      page++
    ) {
      pageSet.add(page);
    }

    const sortedPages = [...pageSet].sort((a, b) => a - b);
    const items = [];

    sortedPages.forEach((page, index) => {
      const previousPage = sortedPages[index - 1];

      if (index > 0 && page - previousPage > 1) {
        items.push(`ellipsis-${previousPage}-${page}`);
      }

      items.push(page);
    });

    return items;
  }, [showPagination, totalPages, currentPage]);

  const scrollToGridTop = () => {
    if (!scrollOnPageChange) return;

    window.requestAnimationFrame(() => {
      const top = gridContainerRef.current?.getBoundingClientRect().top || 0;

      window.scrollTo({
        top: window.scrollY + top - 96,
        behavior: "smooth",
      });
    });
  };

  const handleChangePage = (nextPage) => {
    if (!onPageChange) return;
    if (nextPage < 1 || nextPage > totalPages) return;
    if (nextPage === currentPage) return;

    setPageDirection(nextPage > currentPage ? 1 : -1);
    onPageChange(nextPage);
    scrollToGridTop();
  };

  // CƠ CHẾ INTERSECTION OBSERVER BẮT ĐÁY GRID
  useEffect(() => {
    if (!enableInfiniteScroll || !onLoadMore || !hasMore) return;

    const observer = new IntersectionObserver(
      async (entries) => {
        const target = entries[0];

        if (target.isIntersecting && !isLoading) {
          setIsLoading(true);

          try {
            const result = await onLoadMore();

            if (result === false) {
              setHasMore(false);
            }
          } catch (error) {
            console.error('Lỗi khi tải thêm post:', error);
          } finally {
            setIsLoading(false);
          }
        }
      },
      { 
        rootMargin: '200px',
      }
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => {
      if (loaderRef.current) {
        observer.unobserve(loaderRef.current);
      }
    };
  }, [enableInfiniteScroll, onLoadMore, hasMore, isLoading, displayPosts.length]);

  // Reset trạng thái hasMore nếu danh sách posts bị reset rỗng, ví dụ khi đổi keyword search
  useEffect(() => {
    if (posts.length === 0) {
      setHasMore(true);
    }
  }, [posts.length]);









  

  // Phần return

  return (
    <div ref={gridContainerRef} className="w-full max-w-full overflow-x-hidden py-8">
      {/* Lưới hiển thị danh sách bài đăng */}
      <div
        className={`
          grid w-full max-w-full grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3 sm:gap-8 xl:gap-12
          transition-all duration-300 ease-out
          ${isSwitchingPage ? 'opacity-0' : 'opacity-100'}
          ${
            isSwitchingPage && pageDirection > 0
              ? 'sm:translate-x-4'
              : isSwitchingPage && pageDirection < 0
                ? 'sm:-translate-x-4'
                : 'translate-x-0'
          }
        `}
      >
        {columnWrapper.map((columnPosts, colIndex) => (
          <div 
            key={colIndex} 
            className="flex min-w-0 flex-col gap-6 sm:gap-10"
          >
            {columnPosts.map((post) => (
              <PostThumbnailCard 
                key={post.postID} 
                post={post} 
                isUnder18={isUnder18}
                isAlertActive={isAlertActive} 
                visitorIP={visitorIP}
                clearAlert={clearAlert}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Pagination optional */}
      {showPagination && !enableInfiniteScroll && totalPages > 1 && (
        <div className="mt-10 flex w-full items-center justify-center">
          <div className="flex max-w-full items-center justify-center gap-1.5 overflow-x-auto px-2 py-1 sm:gap-3">
            {currentPage > 1 && (
              <Button
                type="button"
                variant="primary"
                onClick={() => handleChangePage(currentPage - 1)}
                className="
                  flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-primary-600
                  sm:h-10 sm:w-10 sm:text-sm
                "
              >
                <FaChevronLeft />
              </Button>
            )}

            <div className="flex items-center justify-center gap-1.5 sm:gap-3">
              {paginationItems.map((item) => {
                if (typeof item === 'string') {
                  return (
                    <div
                      key={item}
                      className="
                        flex h-8 min-w-5 shrink-0 items-center justify-center
                        text-xs text-shade-400 sm:h-10 sm:min-w-8 sm:text-sm
                      "
                    >
                      ...
                    </div>
                  );
                }

                const isActive = item === currentPage;

                return (
                  <Button
                    key={item}
                    type="button"
                    variant={ isActive ? ("primary") : ("outline") }
                    onClick={() => handleChangePage(item)}
                    className={`
                      flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs 
                      sm:h-10 sm:w-10 sm:text-sm
                      ${
                        isActive
                          ? 'border border-primary-600'
                          : ' '
                      }
                    `}
                  >
                    {item}
                  </Button>
                );
              })}
            </div>

            {currentPage < totalPages && (
              <Button
                type="button"
                variant="primary"
                onClick={() => handleChangePage(currentPage + 1)}
                className="
                  flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-primary-600
                  sm:h-10 sm:w-10 sm:text-sm
                "
              >
                <FaChevronRight />
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Infinite scroll loader */}
      {enableInfiniteScroll && hasMore && (
        <div ref={loaderRef} className="mt-6 flex h-10 w-full items-center justify-center">
          {isLoading && (
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-main-text/20 border-t-main-text" />
          )}
        </div>
      )}
    </div>
  );
};

export default PostGrid;