è, đây là code bảo vệ xử lý hình ảnh phiên bản 1.3.1

chủ yếu cái README ni cho Thành đọc để ráp code backend. Phần 1 bạn sẽ nói cách vận hành để Thành dễ ráp, còn phần 2 thì mô tả các phiên bản trước đây.

=====================PHẦN 1=========================
1. File chính chạy của bạn là main.py . Hiện tại bạn đang để input là nhập tay, nớ có thể đổi ở file ni để hn nhận truyền vô.
2. Các tham số mà main cần nhận bao gồm 
    - File ảnh
    - noiseLevel (số nguyên, từ 0-100) == "độ nhiễu"
    - isGrayNoiseType (boolean). Tham số ni thay thế cho "màu nhiễu". Trước đây màu nhiễu là màu tĩnh/màu động. Bây chừ là true/false cho chế độ xám/chế độ màu.
    - overlayLevel (số nguyên, từ 0-100) == "độ phủ màu"
    - frameCount (số nguyên, là 1, 12, 30 hoặc 60) == "số lượng frame"
3. Nớ chỉ cần truyền vô đủ, việc xử lý cứ để đó.
4. Điểm cần chú ý, đó là hiện tại code bn đang xử lý file local. Các file dùng làm input bn để trong folder "input", và xử lý ra file kteo hn sẽ lưu ở folder "output". Thành sẽ cần chỉnh lại chỗ trả output đó. Bn để đường dẫn input/output trong config.py
5. Cái xử lý ni KHÔNG bao gồm việc tạo verify key mô hấy.
6. Các cài đặt khác nớ có thể chỉnh trong config.py 


=====================PHẦN 2=========================
Các phiên bản trước đây của thuật toán xử lý ảnh bao gồm:

1.0.0: Phương pháp đục lỗ + đổ màu nhiễu + phủ màu (cái mô tả trong khóa luận)
1.1.0: Phương pháp nhiễu biên + Đục lỗ phi nhị phân
1.2.0: Thay đổi cấu hình encoding tối ưu dung lượng và tốc độ xử lý
1.3.0: Phương pháp edge jitter+ (- đục lỗ phi nhị phân)
1.3.1: Bỏ edge jitter vì phế, đem đục lỗ phi nhị phân quay lại