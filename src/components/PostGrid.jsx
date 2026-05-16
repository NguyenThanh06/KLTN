import React, { useMemo } from 'react';
import PostThumbnailCard from './PostThumbnailCard';

const PostGrid = ({ posts = [] , isUnder18, isAlertActive, visitorIP, isTabBlurred, clearAlert }) => {
  // Logic chia mảng để giữ thứ tự từ trái qua phải
  const columnWrapper = useMemo(() => {
    const columns = [[], [], []]; // Mặc định 3 cột cho desktop
    
    posts.forEach((post, index) => {
      columns[index % 3].push(post);
    });
    
    return columns;
  }, [posts]);

  return (
    <div className="w-full py-8">
      {/* 
          Dùng Flexbox để bọc các cột. 
      */}
      <div className="flex flex-row gap-4 xl:gap-20 ">
        {columnWrapper.map((columnPosts, colIndex) => (
          <div 
            key={colIndex} 
            className={`flex flex-col flex-1 gap-6 sm:gap-10 ${
              colIndex === 2 ? 'hidden xl:flex' : '' // Ẩn cột thứ 3 trên mobile/tablet
            }`}
          >
            {columnPosts.map((post) => (
              <PostThumbnailCard 
                  key={post.postID} 
                  post={post} 
                  isUnder18={isUnder18}
                  isAlertActive={isAlertActive} 
                  visitorIP={visitorIP}
                  isTabBlurred={isTabBlurred}
                  clearAlert={clearAlert}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PostGrid;