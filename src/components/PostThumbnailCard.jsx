import React, { useEffect, useRef, useState } from 'react';
import { RiCheckboxMultipleBlankFill } from "react-icons/ri";
import { Link } from 'react-router-dom';
import CatSentinel from './CatSentinel';

const PostThumbnailCard = ({ post, isUnder18, isAlertActive, visitorIP, isTabBlurred, clearAlert }) => {
  const { postId, tieuDe, imageUrls, hanCheHienThi } = post;
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false); // Trạng thái video có trong vùng nhìn không
  const isMultiple = imageUrls?.length > 1;
  const isLocked = isUnder18 && hanCheHienThi === 1;

  // Hàm vẽ một frame hiện tại của video lên canvas
  const drawFrame = (video, canvas) => {
    const ctx = canvas.getContext('2d');
    if (video && canvas) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    }
  };

  // Quyết định khi nào thì hiện hiệu ứng mờ bảo mật
  // 1. Khi đang bị báo động đỏ VÀ mèo chưa đi
  // 2. Hoặc khi người dùng vừa chuyển tab (isTabBlurred === true)
  const shouldBlur = isAlertActive || isTabBlurred;


  //Quản lý việc phát dừng video
  useEffect(() => {
    // 1. Thiết lập Observer
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      {
        rootMargin: '200px 0px', // Mở rộng vùng nhận diện thêm 200px trên/dưới
        threshold: 0.1,
      }
    );

    if (canvasRef.current) {
      observer.observe(canvasRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    let animationId;

    const renderLoop = () => {
      if (!video.paused && !video.ended) {
        drawFrame(video, canvas);
      }
      animationId = requestAnimationFrame(renderLoop);
    };

    if (isVisible && !isLocked) {
      video.play().catch(() => { });
      renderLoop();
    } else {
      video.pause();
      cancelAnimationFrame(animationId);
      // Khi bị khóa hoặc ra ngoài vùng nhìn, 
      // ta vẫn gọi drawFrame một lần để đảm bảo có hình (frame đầu hoặc frame hiện tại)
      drawFrame(video, canvas);
    }

    return () => cancelAnimationFrame(animationId);
  }, [isVisible, isLocked]);

  return (
    <>
      <Link
        to={`/post/${postId}`}
        className="cursor-pointer group  flex flex-col w-full">
        <div className="relative w-full overflow-hidden rounded-xl bg-text-shade-900 shadow-xl ">
          <video
            ref={videoRef}
            src={`http://localhost:8080/uploads/posts/${imageUrls[0].link}`}
            loop
            muted
            playsInline
            preload="auto" // Đổi thành auto để lấy được frame đầu nhanh hơn
            onLoadedData={() => drawFrame(videoRef.current, canvasRef.current)}
            className="hidden"
          />

          <canvas
            ref={canvasRef}
            width={imageUrls[0].width}
            height={imageUrls[0].height}
            className={`block w-full h-auto transition-transform duration-500 group-hover:scale-105 
                      ${isLocked ? 'blur-2xl scale-95 select-none pointer-events-none' : ''} 
                      ${shouldBlur ? 'security-blur anti-capture-layer' : ''}`}
          />

          {isAlertActive && (
            <CatSentinel
              visitorIP={visitorIP}
              isAlertActive={isAlertActive}
              onCardResolved={clearAlert}
              variant="card"
            />
          )}


          {!isAlertActive && !isTabBlurred && isLocked && (
            <div className="absolute inset-0 flex items-center justify-center bg-text-shade-900/20">
              <span className="text-[10px] font-bold text-text-shade-50 uppercase tracking-widest bg-text-shade-900/40 px-3 py-1 rounded-full backdrop-blur-sm">
                18+
              </span>
            </div>
          )}

          {isMultiple && (
            <div className="absolute top-2 right-2 bg-text-shade/60 backdrop-blur-md text-text-shade-50 px-2 py-1 rounded-md flex items-center gap-1.5 z-10">
              <RiCheckboxMultipleBlankFill size={14} />
              <span className="text-xs font-bold">{lstKTEOFile.length}</span>
            </div>
          )}
        </div>


        <div className="mt-2 px-1">
          <h3 className="text-sm font-medium text-main-text truncate">
            {tieuDe}
          </h3>
        </div>
      </Link>


    </>
  );
};

export default PostThumbnailCard;