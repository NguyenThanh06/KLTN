import React, { useMemo, useEffect, useRef, useState } from 'react';
import PostThumbnailCard from './PostThumbnailCard';

const PostGrid = ({ 
  posts = [], 
  isUnder18, 
  isAlertActive, 
  visitorIP,  
  clearAlert,
  enableInfiniteScroll = false,
  onLoadMore
}) => {
  
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const loaderRef = useRef(null);

  // Logic chia mảng để giữ thứ tự từ trái qua phải (giữ nguyên của bạn)
  const columnWrapper = useMemo(() => {
    const columns = [[], [], []]; // Mặc định 3 cột cho desktop
    
    posts.forEach((post, index) => {
      columns[index % 3].push(post);
    });
    
    return columns;
  }, [posts]);

  // CƠ CHẾ INTERSECTION OBSERVER BẮT ĐÁY GRID
  useEffect(() => {
    // Nếu không bật tính năng, hoặc đã hết bài để load thì không kích hoạt bộ theo dõi
    if (!enableInfiniteScroll || !onLoadMore || !hasMore) return;

    const observer = new IntersectionObserver(
      async (entries) => {
        const target = entries[0];
        
        // Khi cái div loaderRef xuất hiện ở cuối màn hình và hệ thống không bận loading
        if (target.isIntersecting && !isLoading) {
          setIsLoading(true);
          
          try {
            // Gọi hàm từ component cha truyền xuống để tải thêm dữ liệu
            // Hàm onLoadMore ở phía cha nên return true nếu còn bài, return false nếu đã hết bài
            const result = await onLoadMore();
            
            if (result === false) {
              setHasMore(false); // Đánh dấu hết bài, từ sau không call nữa
            }
          } catch (error) {
            console.error("Lỗi khi tải thêm post:", error);
          } finally {
            setIsLoading(false);
          }
        }
      },
      { 
        rootMargin: '200px', // Đón đầu trước 200px khi user chuẩn bị lướt tới đáy để tạo cảm giác mượt mà
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
  }, [enableInfiniteScroll, onLoadMore, hasMore, isLoading, posts.length]);

  // Reset trạng thái hasMore nếu mảng posts bên ngoài bất ngờ thay đổi (ví dụ khi user đổi từ khóa search)
  useEffect(() => {
    setHasMore(true);
  }, [posts.length === 0]);

  return (
    <div className="w-full py-8">
      {/* Lưới hiển thị danh sách bài đăng */}
      <div className="flex flex-row gap-4 xl:gap-20">
        {columnWrapper.map((columnPosts, colIndex) => (
          <div 
            key={colIndex} 
            className={`flex flex-col flex-1 gap-6 sm:gap-10 ${
              colIndex === 2 ? 'hidden xl:flex' : ''
            }`}
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

      {/* CHIẾC BẪY THEO DÕI NGẦM 
          Khi enableInfiniteScroll = true, một thẻ div ẩn sẽ nằm ở đây để làm mốc cho trình duyệt nhận biết đáy trang
      */}
      {enableInfiniteScroll && hasMore && (
        <div ref={loaderRef} className="w-full h-10 flex items-center justify-center mt-6">
          {isLoading && (
            // Icon Loading xoay xoay nhẹ nhàng bằng Tailwind, tinh tế không gây khó chịu
            <div className="w-6 h-6 border-2 border-main-text/20 border-t-main-text rounded-full animate-spin" />
          )}
        </div>
      )}
    </div>
  );
};

export default PostGrid;