import React, { useEffect, useRef, useState } from 'react';
import { RiCheckboxMultipleBlankFill } from "react-icons/ri";
import { useNavigate } from 'react-router-dom';
import CatSentinel from './CatSentinel';



import { MOCK_USER_DATA_1 } from '../data/User/mockUser1';
import { MOCK_USER_DATA_3 } from '../data/User/mockUser3';

const PostThumbnailCard = ({ post, isUnder18, isAlertActive, visitorIP, clearAlert }) => {
  const navigate = useNavigate();
  const { postID, tieuDe, lstKTEOFile, hanCheHienThi, tacGia } = post;
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false); // Trạng thái video có trong vùng nhìn không
  const isMultiple = lstKTEOFile?.length > 1;
  const isLocked = isUnder18 && (hanCheHienThi === 2 || hanCheHienThi === 3); //Bạn đg coi 2 là R-18 với 3 là R-18G

  //Thành bỏ đồ vô ok thì xóa cái đoạn ni, bạn làm tạm để có avatar với tên tác giả ơ
  const authorMap = {
    1: MOCK_USER_DATA_1,
    3: MOCK_USER_DATA_3,
  };

  // Nếu trả về một ID tác giả mà không có mock data, web sẽ hiện thông tin ẩn danh chơ không bị sập. 
  // (NI LÀ THÀNH XÓA ĐI HẾ, KHÔNG CÓ VỤ ẨN DANH MÔ NỜ)
  const thongTinTacGia = authorMap[tacGia] || {
    avatar: "/defaultAvatar/default_avatar_1.svg", // ảnh avatar mặc định của hệ thống
    tenHienThi: "Tác giả ẩn danh"
  };




  // Hàm vẽ một frame hiện tại của video lên canvas
  const drawFrame = (video, canvas) => {
    const ctx = canvas.getContext('2d');
    if (video && canvas) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    }
  };



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
      video.play().catch(() => {});
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
      <div 
          className="cursor-pointer group  flex flex-col w-full"
          onClick={() => navigate(`/post/${postID}`)}
      >
        <div className="relative w-full overflow-hidden rounded-xl bg-text-shade-900 shadow-xl ">
          <video
            ref={videoRef}
            src={lstKTEOFile[0].link}
            loop
            muted
            playsInline
            preload="auto" // Đổi thành auto để lấy được frame đầu nhanh hơn
            onLoadedData={() => drawFrame(videoRef.current, canvasRef.current)}
            className="hidden"
          />
          
          <canvas
            ref={canvasRef}
            width={lstKTEOFile[0].width}
            height={lstKTEOFile[0].height}
            className={`block w-full h-auto transition-transform duration-500 group-hover:scale-105 
                      ${isLocked ? 'blur-2xl scale-95 select-none pointer-events-none' : ''} `}
          />

          {isAlertActive && (
              <div
                  className="no-select absolute inset-0 z-20"
                  onMouseDown={(event) => event.preventDefault()}
                  onDragStart={(event) => event.preventDefault()}
              >
                  <div className="absolute inset-0 bg-main-text/70" />

                  <div className="relative z-10 h-full w-full">
                      <CatSentinel
                          visitorIP={visitorIP}
                          isAlertActive={isAlertActive}
                          onCardResolved={clearAlert}
                          variant="card"
                      />
                  </div>
              </div>
          )}
          
          
          { isLocked && (
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
          <button
              type="button"
              className="flex items-center gap-2 my-1 text-main-text cursor-pointer transition-colors"
              onClick={(event) => {
                  event.stopPropagation();
                  navigate(`/user?id=${tacGia}`);
              }}
          >
              <div className="shrink-0 w-8 h-8 bg-primary-200 rounded-full flex items-center justify-center">
                  <img src={thongTinTacGia.avatar} alt="AuthorAvatar" />
              </div>

              <div className="grow min-w-0 text-left">
                  <p className="font-ui text-sm">{thongTinTacGia.tenHienThi}</p>
              </div>
          </button>
        </div>
      </div>


    </>
  );
};

export default PostThumbnailCard;