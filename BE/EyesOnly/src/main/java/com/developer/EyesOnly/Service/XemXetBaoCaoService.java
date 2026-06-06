package com.developer.EyesOnly.Service;

import com.developer.EyesOnly.DTO.Request.XemXetBaoCaoRequest;
import com.developer.EyesOnly.Entity.Post;
import com.developer.EyesOnly.Repository.BaoCaoPostRepository;
import com.developer.EyesOnly.Repository.PostRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class XemXetBaoCaoService {
    public final PostRepository postRepository;
    public final BaoCaoPostRepository baoCaoPostRepository;
    private static final byte TEMP_HIDDEN = 99;
    @Transactional
    public String xemxetbaoCao(Long postId,XemXetBaoCaoRequest request){
        Post post = postRepository.findById(postId).orElseThrow(()-> new RuntimeException("không tìm thấy post"));
        Byte currentHanCheHienThi = post.getHanCheHienThi();
        Byte nextHanCheHienThi = request.getHanCheHienThi();

        /*
         * Kiểm tra xem admin có đang mở tạm ẩn hay không.
         *
         * Điều kiện:
         * - Trạng thái hiện tại của post là 99
         * - Trạng thái mới khác 99
         *
         * Ví dụ:
         * 99 -> 0: mở về không hạn chế
         * 99 -> 1: mở về 18+
         * 99 -> 2: mở về 18G
         */
        boolean isOpeningTempHidden =
                currentHanCheHienThi != null
                        && currentHanCheHienThi == TEMP_HIDDEN
                        && nextHanCheHienThi != null
                        && nextHanCheHienThi != TEMP_HIDDEN;
        post.setHanCheHienThi(request.getHanCheHienThi());
        if (request.getDaXemXetBaoCao() != null) {
            post.setDaXemXetBaoCao(request.getDaXemXetBaoCao());
        } else {
            post.setDaXemXetBaoCao(true);
        }
        postRepository.save(post);
        /*
         * Nếu admin mở tạm ẩn về trạng thái cũ,
         * xóa toàn bộ report của post này.
         *
         * Nếu không xóa, scheduler sẽ tiếp tục quét thấy report cũ
         * và lại tạm ẩn post lần nữa.
         */
        if (isOpeningTempHidden) {
            baoCaoPostRepository.deleteByPostId(postId);
        }
        return "Thay đổi chế độ hiển thị thành công";
    }
}
