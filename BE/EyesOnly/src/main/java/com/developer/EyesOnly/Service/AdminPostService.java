package com.developer.EyesOnly.Service;

import com.developer.EyesOnly.DTO.Request.AdminPostSearchRequest;
import com.developer.EyesOnly.DTO.Response.*;
import com.developer.EyesOnly.Entity.*;
import com.developer.EyesOnly.Repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class AdminPostService {

    private final PostRepository postRepository;
    private final GanTheRepository ganTheRepository;
    private final CommentRepository commentRepository;
    private final BaoCaoPostRepository baoCaoPostRepository;
    private final ThichPostRepository thichPostRepository;
    private static final int TEMP_HIDDEN_VALUE = 99;

    @Transactional(readOnly = true)
    public AdminPostSearchResponse searchPosts(
            AdminPostSearchRequest request,
            int page,
            int size
    ) {
        /*
         * Mỗi lần lấy 6 post theo use case.
         * Nếu frontend truyền size không hợp lệ thì tự đưa về 6.
         */
        Pageable pageable = createPageable(page, size);

        /*
         * Chuẩn hóa giá trị PostID.
         * Nếu request null thì postId cũng là null,
         * nghĩa là không lọc theo PostID.
         */
        Long postId = request == null ? null : request.getPostId();

        /*
         * Chuẩn hóa chế độ hiển thị.
         * Mặc định là ALL = Toàn bộ.
         */
        String displayMode = request == null ? null : request.getHanCheHienThi();

        if (displayMode == null || displayMode.trim().isEmpty()) {
            displayMode = "ALL";
        } else {
            displayMode = displayMode.trim();
        }

        /*
         * Nếu frontend gửi sai displayMode thì đưa về ALL.
         * Có thể đổi thành throw exception nếu bạn muốn báo lỗi rõ hơn.
         */
        if (!isValidDisplayMode(displayMode)) {
            displayMode = "ALL";
        }

        /*
         * Query lấy Page<PostID> trước.
         * Không fetch files trực tiếp trong query phân trang
         * để tránh lỗi phân trang với collection.
         */
        Page<Long> postIdPage = postRepository.searchAdminPostIds(
                postId,
                displayMode,
                pageable
        );

        List<Long> postIds = postIdPage.getContent();

        /*
         * Nếu không tìm thấy kết quả.
         */
        if (postIds.isEmpty()) {
            return AdminPostSearchResponse.builder()
                    .message("Không tìm thấy kết quả phù hợp")
                    .content(List.of())
                    .page(postIdPage.getNumber())
                    .size(postIdPage.getSize())
                    .totalElements(postIdPage.getTotalElements())
                    .totalPages(postIdPage.getTotalPages())
                    .first(postIdPage.isFirst())
                    .last(postIdPage.isLast())
                    .build();
        }

        /*
         * Sau khi đã có danh sách PostID của trang hiện tại,
         * fetch Post kèm files và tác giả.
         */
        List<Post> posts = postRepository.findPostsWithFilesAndAuthorByIds(postIds);

        /*
         * Đưa list Post về Map để giữ đúng thứ tự postIds.
         * Vì query IN :postIds không đảm bảo giữ nguyên thứ tự.
         */
        Map<Long, Post> postMap = new HashMap<>();

        for (Post post : posts) {
            postMap.put(post.getPostID(), post);
        }

        /*
         * Convert từng Post sang DTO trả về cho admin.
         */
        List<AdminPostItemResponse> content = postIds.stream()
                .map(postMap::get)
                .filter(Objects::nonNull)
                .map(this::toAdminPostItemResponse)
                .toList();

        return AdminPostSearchResponse.builder()
                .message(null)
                .content(content)
                .page(postIdPage.getNumber())
                .size(postIdPage.getSize())
                .totalElements(postIdPage.getTotalElements())
                .totalPages(postIdPage.getTotalPages())
                .first(postIdPage.isFirst())
                .last(postIdPage.isLast())
                .build();
    }

    /*
     * Tạo Pageable.
     * Admin yêu cầu sắp xếp theo Ngày đăng mới nhất.
     */
    private Pageable createPageable(int page, int size) {
        if (page < 0) {
            page = 0;
        }

        if (size <= 0) {
            size = 6;
        }

        if (size > 30) {
            size = 30;
        }

        return PageRequest.of(
                page,
                size,
                Sort.by(Sort.Direction.DESC, "ngayDang")
        );
    }

    /*
     * Kiểm tra displayMode hợp lệ.
     */
    private boolean isValidDisplayMode(String displayMode) {
        return displayMode.equals("ALL")
                || displayMode.equals("HIDDEN")
                || displayMode.equals("NOT_HIDDEN");
    }
    // hàm xem chi tiết post của admin
    @Transactional(readOnly = true)
    public AdminPostDetailResponse getPostDetail(Long postId, int commentPage, int commentSize, int reportPage, int reportSize) {

        /*
         * Admin được xem trực tiếp chi tiết post.
         * Không cần kiểm tra chặn/bị chặn như user.
         */
        Post post = postRepository.findAdminPostDetailById(postId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Post"));

        /*
         * Lấy danh sách tag của post.
         */
        List<String> tags = ganTheRepository.findByPost_PostID(postId)
                .stream()
                .map(gt -> gt.getTag().getTenTag())
                .toList();

        /*
         * Lấy số lượt thích.
         */
        Long luotThich = thichPostRepository.countByPost(post);

        /*
         * Lấy danh sách comment theo phân trang.
         * Mặc định mỗi lần 6 comment.
         */
        PageResponse<AdminCommentResponse> commentPageResponse =
                getCommentPageOfPost(postId, commentPage, commentSize);

        /*
         * Lấy danh sách báo cáo theo phân trang.
         * Mặc định mỗi lần 6 báo cáo.
         */
        PageResponse<AdminBaoCaoPostResponse> baoCaoPage =
                getReportPageOfPost(postId, reportPage, reportSize);

        return AdminPostDetailResponse.builder()
                .postID(post.getPostID())
                .tieuDe(post.getTieuDe())
                .moTa(post.getMoTa())
                .ngayDang(post.getNgayDang())

                .tacGiaID(post.getTacGia() == null ? null : post.getTacGia().getAccountID())
                .usernameTacGia(post.getTacGia() == null ? null : post.getTacGia().getUsername())
                .tenTacGia(post.getTacGia() == null ? null : post.getTacGia().getTenHienThi())
                .avatarTacGia(post.getTacGia() == null ? null : post.getTacGia().getAvatar())

                .luotXem(post.getLuotXem())
                .luotThich(luotThich)

                .sanPhamAI(post.getSanPhamAI())
                .congKhai(post.getCongKhai())
                .hanCheHienThi(post.getHanCheHienThi())
                .daXemXetBaoCao(post.getDaXemXetBaoCao())

                .files(toKteoFileResponses(post.getFiles()))
                .tags(tags)
                .comments(commentPageResponse)
                .baoCaos(baoCaoPage)
                .build();
    }
    /*
     * Mapper nhỏ chuyển Post entity sang DTO cho admin.
     */
    private AdminPostItemResponse toAdminPostItemResponse(Post post) {
        return AdminPostItemResponse.builder()
                .postID(post.getPostID())
                .tieuDe(post.getTieuDe())
                .moTa(post.getMoTa())
                .ngayDang(post.getNgayDang())
                .tacGiaID(post.getTacGia() == null ? null : post.getTacGia().getAccountID())
                .usernameTacGia(post.getTacGia() == null ? null : post.getTacGia().getUsername())
                .tenHienThiTacGia(post.getTacGia() == null ? null : post.getTacGia().getTenHienThi())
                .avatarTacGia(post.getTacGia() == null ? null : post.getTacGia().getAvatar())
                .luotXem(post.getLuotXem())
                .sanPhamAI(post.getSanPhamAI())
                .hanCheHienThi(post.getHanCheHienThi())
                .congKhai(post.getCongKhai())
                .files(toKteoFileResponses(post.getFiles()))
                .build();
    }

    /*
     * Convert list KTEOFile sang DTO.
     * Có sort theo thuTu để ảnh/file hiển thị đúng thứ tự.
     */
    private List<KteoFileResponse> toKteoFileResponses(List<KTEOFile> files) {
        if (files == null) {
            return List.of();
        }

        return files.stream()
                .sorted(Comparator.comparing(
                        KTEOFile::getThuTu,
                        Comparator.nullsLast(Integer::compareTo)
                ))
                .map(file -> KteoFileResponse.builder()
                        .fileID(file.getFileID())
                        .link(file.getLink())
                        .width(file.getWidth())
                        .height(file.getHeight())
                        .thuTu(file.getThuTu())
                        .verifyKey(file.getVerifyKey())
                        .build())
                .toList();
    }
    /*
     * Convert Comment entity sang DTO cho admin.
     */
    private AdminCommentResponse toAdminCommentResponse(Comment comment) {
        Account nguoiViet = comment.getNguoiViet();

        return AdminCommentResponse.builder()
                .commentID(comment.getCommentID())
                .noiDung(comment.getNoiDung())
                .thoiGianDang(comment.getThoiGianDang())

                .nguoiVietID(nguoiViet == null ? null : nguoiViet.getAccountID())
                .usernameNguoiViet(nguoiViet == null ? null : nguoiViet.getUsername())
                .tenHienThiNguoiViet(nguoiViet == null ? null : nguoiViet.getTenHienThi())
                .avatarNguoiViet(nguoiViet == null ? null : nguoiViet.getAvatar())

                .parentCommentID(comment.getParent() == null
                        ? null
                        : comment.getParent().getCommentID())
                .build();
    }

    /*
     * Convert BaoCaoPost entity sang DTO cho admin.
     */
    private AdminBaoCaoPostResponse toAdminBaoCaoPostResponse(BaoCaoPost baoCaoPost) {

        Account nguoiBaoCao = baoCaoPost.getNguoiBaoCao();

        return AdminBaoCaoPostResponse.builder()
                .baoCaoID(baoCaoPost.getBaoCaoID())
                .ngayBaoCao(baoCaoPost.getNgayBaoCao())
                .mucBaoCao(baoCaoPost.getMucBaoCao().getDisplayName())
                .noiDungBaoCao(baoCaoPost.getNoiDungBaoCao())
                .hanCheHienThiGoc(baoCaoPost.getHanCheHienThiGoc())
                .hanCheHienThiText(DisplayRestriction.getDisplayNameByValue(baoCaoPost.getHanCheHienThiGoc()))
                .nguoiBaoCaoID(nguoiBaoCao == null ? null : nguoiBaoCao.getAccountID())
                .usernameNguoiBaoCao(nguoiBaoCao == null ? null : nguoiBaoCao.getUsername())
                .tenHienThiNguoiBaoCao(nguoiBaoCao == null ? null : nguoiBaoCao.getTenHienThi())
                .build();
    }
    // hàm lấy và trả về danh sách comment của post dưới dạng phân trang
    private PageResponse<AdminBaoCaoPostResponse> getReportPageOfPost(
            Long postId,
            int reportPage,
            int reportSize
    ) {
        if (reportPage < 0) {
            reportPage = 0;
        }

        if (reportSize <= 0) {
            reportSize = 6;
        }

        if (reportSize > 30) {
            reportSize = 30;
        }

        Pageable pageable = PageRequest.of(
                reportPage,
                reportSize,
                Sort.by(Sort.Direction.DESC, "ngayBaoCao")
        );

        Page<BaoCaoPost> reportPageResult =
                baoCaoPostRepository.findReportsByPostIdForAdmin(postId, pageable);

        List<AdminBaoCaoPostResponse> content = reportPageResult.getContent()
                .stream()
                .map(this::toAdminBaoCaoPostResponse)
                .toList();

        return new PageResponse<>(
                content,
                reportPageResult.getNumber(),
                reportPageResult.getSize(),
                reportPageResult.getTotalElements(),
                reportPageResult.getTotalPages(),
                reportPageResult.isFirst(),
                reportPageResult.isLast()
        );
    }
    // hàm lấy và trả về danh sách báo cáo của post dưới dạng phân trang
    private PageResponse<AdminCommentResponse> getCommentPageOfPost(
            Long postId,
            int commentPage,
            int commentSize
    ) {
        if (commentPage < 0) {
            commentPage = 0;
        }

        if (commentSize <= 0) {
            commentSize = 6;
        }

        if (commentSize > 30) {
            commentSize = 30;
        }

        /*
         * Sắp xếp comment mới nhất lên đầu.
         * Nếu bạn muốn hội thoại dễ đọc hơn thì đổi DESC thành ASC.
         */
        Pageable pageable = PageRequest.of(
                commentPage,
                commentSize,
                Sort.by(Sort.Direction.DESC, "thoiGianDang")
        );

        Page<Comment> commentPageResult =
                commentRepository.findAllCommentsByPostIdForAdmin(postId, pageable);

        List<AdminCommentResponse> content = commentPageResult.getContent()
                .stream()
                .map(this::toAdminCommentResponse)
                .toList();

        return new PageResponse<>(
                content,
                commentPageResult.getNumber(),
                commentPageResult.getSize(),
                commentPageResult.getTotalElements(),
                commentPageResult.getTotalPages(),
                commentPageResult.isFirst(),
                commentPageResult.isLast()
        );
    }
}