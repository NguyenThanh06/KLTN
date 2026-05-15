const DynamicWatermark = ({ ip, alpha }) => {

  const watermarkItems = Array.from({ length: 48 });

  return (
    <div className={`fixed inset-0 z-9999 pointer-events-none overflow-hidden select-none`}>
      <div className="w-[150vw] h-[150vh] translate-x-[-25vw] translate-y-[25vh] grid grid-cols-4 md:grid-cols-8 gap-y-24 gap-x-12 rotate-[-15deg]">
        {watermarkItems.map((_, i) => (
          <div 
            key={i} 
            className="font-mono font-bold text-lg whitespace-nowrap text-center tracking-wide"
            style={{ 
              color: `rgba(77, 156, 214, ${alpha})`, // Ở đây mình ví dụ màu đỏ cảnh báo, bạn có thể đổi mã màu tùy ý
              transition: 'color 150ms ease-in-out' // Hiệu ứng đổi độ mờ của chữ vẫn mượt mà
            }}
          >
            {ip}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DynamicWatermark;