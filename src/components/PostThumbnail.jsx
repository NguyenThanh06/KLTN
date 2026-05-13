import React, { useEffect, useRef, useState } from 'react';
import { Layers } from 'lucide-react';

const PostThumbnail = ({ post }) => {
  const { title, images, videoSrc } = post;
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false); // Trạng thái video có trong vùng nhìn không
  const isMultiple = images?.length > 1;

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

    const ctx = canvas.getContext('2d');
    let animationId;

    const render = () => {
      if (!video.paused && !video.ended) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      }
      animationId = requestAnimationFrame(render);
    };

    if (isVisible) {
      // Chỉ play khi nằm trong vùng nhìn
      video.play().catch(() => {});
      render();
    } else {
      // Tạm dừng khi đi ra ngoài để tiết kiệm CPU/GPU
      video.pause();
      cancelAnimationFrame(animationId);
    }

    return () => cancelAnimationFrame(animationId);
  }, [isVisible]);

  return (
    <div className="group cursor-pointer flex flex-col w-full">
      <div className="relative w-full aspect-3/4 overflow-hidden rounded-xl bg-slate-900 border border-gray-200">
        <video
          ref={videoRef}
          src={videoSrc}
          loop
          muted
          playsInline
          preload="metadata" // Chỉ tải metadata trước để tiết kiệm băng thông
          className="hidden"
        />
        
        <canvas
          ref={canvasRef}
          width={480}
          height={640}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {isMultiple && (
          <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md text-white px-2 py-1 rounded-md flex items-center gap-1.5 z-10">
            <Layers size={14} />
            <span className="text-[10px] font-bold">{images.length}</span>
          </div>
        )}
      </div>

      <div className="mt-2 px-1">
        <h3 className="text-sm font-medium text-main-text truncate">
          {title}
        </h3>
      </div>
    </div>
  );
};

export default PostThumbnail;