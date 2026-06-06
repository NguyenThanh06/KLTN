package com.developer.EyesOnly.Service;

import com.developer.EyesOnly.DTO.Response.PageResponse;
import com.developer.EyesOnly.DTO.Response.ThongBaoResponse;
import com.developer.EyesOnly.Entity.Account;
import com.developer.EyesOnly.Entity.ThongBao;
import com.developer.EyesOnly.Exception.AppException;
import com.developer.EyesOnly.Exception.ErrorCode;
import com.developer.EyesOnly.Repository.ThongBaoRepository;
import com.developer.EyesOnly.Repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ThongBaoService {

    private final ThongBaoRepository thongBaoRepository;
    private final UserRepository userRepository;
    /*
     * Hàm dùng chung để tạo thông báo.
     *
     * Các service khác như:
     * - FollowAccountService
     * - CommentService
     * - BaoCaoPostService
     *
     * sẽ gọi hàm này sau khi lưu dữ liệu thành công.
     */
    public void createNotification(Long receiverAccountId, String noiDung, String link, Integer loaiThongBao) {
        /*
         * Nếu không có người nhận thì không tạo thông báo.
         * Tránh lỗi NullPointerException.
         */
        if (receiverAccountId == null) {
            return;
        }
        /*
         * Tìm account nhận thông báo.
         * Nếu account không tồn tại thì báo lỗi.
         */
        Account receiver = userRepository.findById(receiverAccountId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        /*
         * Tạo object thông báo mới.
         * Mặc định:
         * - Thời điểm thông báo = hiện tại
         * - Đã đọc = false
         */
        ThongBao thongBao = ThongBao.builder()
                .account(receiver)
                .noiDung(noiDung)
                .link(link)
                .thoiDiemThongBao(LocalDateTime.now())
                .daDoc(false)
                .loaiThongBao(loaiThongBao)
                .build();

        thongBaoRepository.save(thongBao);
    }
    /*
     * Lấy danh sách thông báo của account đang đăng nhập.
     * Có phân trang.
     */
    @Transactional(readOnly = true)
    public PageResponse<ThongBaoResponse> getMyNotifications(Long currentAccountId, int page, int size) {
        /*
         * Chống lỗi page âm.
         * Nếu frontend truyền page = -1 thì tự đưa về 0.
         */
        if (page < 0) {
            page = 0;
        }
        /*
         * Nếu size không hợp lệ thì mặc định lấy 10 thông báo.
         */
        if (size <= 0) {
            size = 10;
        }
        /*
         * Giới hạn size để tránh frontend gọi quá nhiều dữ liệu 1 lần.
         */
        if (size > 50) {
            size = 50;
        }
        Pageable pageable = PageRequest.of(page, size);
        /*
         * Lấy thông báo của account hiện tại.
         * Repository đã sắp xếp mới nhất lên đầu.
         */
        Page<ThongBao> thongBaoPage =
                thongBaoRepository.findByAccount_AccountIDOrderByThoiDiemThongBaoDesc(
                        currentAccountId,
                        pageable
                );
        // cách này ko dùng mapper khó đọc
//        List<ThongBaoResponse> content = thongBaoPage.getContent()
//                .stream()
//                .map(tb -> ThongBaoResponse.builder()
//                        .thongBaoID(tb.getThongBaoID())
//                        .noiDung(tb.getNoiDung())
//                        .link(tb.getLink())
//                        .thoiDiemThongBao(tb.getThoiDiemThongBao())
//                        .daDoc(tb.getDaDoc())
//                        .build())
//                .toList();
        // code lấy danh sách thông báo

        List<ThongBaoResponse> content = thongBaoPage.getContent()
                .stream()
                .map(this::toThongBaoResponse)
                .toList();
        /*
         * Trả response phân trang giống các API post/account khác.
         */
        return new PageResponse<>(
                content,
                thongBaoPage.getNumber(),
                thongBaoPage.getSize(),
                thongBaoPage.getTotalElements(),
                thongBaoPage.getTotalPages(),
                thongBaoPage.isFirst(),
                thongBaoPage.isLast()
        );
    }
    /*
     * Đếm số thông báo chưa đọc của account hiện tại.
     * Dùng cho icon chuông thông báo.
     */
    public Long countUnreadNotifications(Long currentAccountId) {
        return thongBaoRepository.countByAccount_AccountIDAndDaDocFalse(currentAccountId);
    }
    /*
     * Đánh dấu một thông báo là đã đọc.
     */
    @Transactional
    public void markAsRead(Long currentAccountId, Long thongBaoId) {
        /*
         * Repository đã kiểm tra:
         * - đúng thongBaoID
         * - đúng account đang đăng nhập
         *
         * Vì vậy user không thể đánh dấu thông báo của người khác.
         */
        thongBaoRepository.markAsRead(thongBaoId, currentAccountId);
    }
    /*
     * Hàm mapper nhỏ để chuyển ThongBao entity sang DTO.
     * Đặt private vì chỉ dùng nội bộ trong ThongBaoService.
     */
    private ThongBaoResponse toThongBaoResponse(ThongBao thongBao) {
        return ThongBaoResponse.builder()
                .thongBaoID(thongBao.getThongBaoID())
                .noiDung(thongBao.getNoiDung())
                .link(thongBao.getLink())
                .thoiDiemThongBao(thongBao.getThoiDiemThongBao())
                .daDoc(thongBao.getDaDoc())
                .loaiThongBao(thongBao.getLoaiThongBao())
                .build();
    }
}