package com.developer.EyesOnly.Service;

import com.developer.EyesOnly.DTO.Request.*;
import com.developer.EyesOnly.DTO.Response.*;
import com.developer.EyesOnly.Entity.*;
import com.developer.EyesOnly.Exception.AppException;
import com.developer.EyesOnly.Exception.ErrorCode;
import com.developer.EyesOnly.Mapper.CommentMapper;
import com.developer.EyesOnly.Mapper.PostMapper;
import com.developer.EyesOnly.Repository.*;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.security.Principal;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PostService {

    private final PostRepository postRepository;
    private final TagRepository tagRepository;
    private final GanTheRepository ganTheRepository;
    private final KTEOFileRepository kteoFileRepository;
    private final UserRepository accountRepository;
    private final FileProtectionService fileProtectionService;
    private final ThichPostRepository thichPostRepository;
    private final PostMapper postMapper;
    private final AccountChanRepository chanNguoiDungRepository;
    private final BaoCaoPostRepository baoCaoPostRepository;
    private final ThichCommentRepository thichCommentRepository;
    private final LuuPostRepository luuPostRepository;
    private final UserRepository userRepository;
    private final CheckBiKhoaService checkBiKhoaService;
    @PersistenceContext
    private EntityManager entityManager;
    @Autowired
    private CommentMapper commentMapper;
    @Autowired
    private CommentRepository commentRepository;
    @Autowired
    private final ThongBaoService thongBaoService;
    @Autowired
    private final TheoDoiAccountRepository theoDoiAccountRepository;
    /*
     * Mục "Các Post liên quan" chỉ hiển thị tối đa 18 tác phẩm.
     */
    @Autowired
    private static final int RELATED_POST_LIMIT = 18;
    private static final long AUTO_HIDE_REPORT_THRESHOLD = 25L;
    /*
     * Các số frame hợp lệ mà giao diện được phép gửi lên.
     * Tất cả kteo đều dài 1 giây, chỉ khác số lượng frame.
     */
    private static final Set<Integer> ALLOWED_FRAME_COUNTS =
            Set.of(1, 12, 30, 60);

    /*
     * Các chế độ màu hợp lệ.
     * static: dùng staticColor.
     * dynamic: BE tự tạo màu thay đổi theo frame.
     */
    private static final Set<String> ALLOWED_NOISE_COLOR_MODES =
            Set.of("static", "dynamic");
    /**
     * Hàm chính tạo bài post.
     */
    @Transactional
    public Long createPost(
            CreatePostRequest request,
            MultipartFile[] imageFiles,
            Principal principal
    ) {

        // 1. Kiểm tra người dùng đăng nhập
        if (principal == null || principal.getName() == null) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }

        // THAY ĐỔI Ở ĐÂY: principal.getName() bây giờ là accountId (dạng String)
        Long accountId;
        try {
            accountId = Long.valueOf(principal.getName());
        } catch (NumberFormatException e) {
            throw new AppException("Token không hợp lệ");
        }

        // Tìm theo ID thay vì Email
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new UsernameNotFoundException("Không tìm thấy tài khoản với ID: " + accountId));

        // 2. Kiểm tra tài khoản bị vô hiệu hóa
        if (Boolean.TRUE.equals(account.getDaVoHieuHoa())) {
            throw new AppException(ErrorCode.ACCOUNT_DISABLED);
        }
        checkBiKhoaService.checkBiKhoa(accountId);
        // 3. Validate request
        validateCreatePostRequest(request, imageFiles);

        byte hanCheHienThi = resolveCreateDisplayRestriction(
                request.getHanCheHienThi()
        );

        // 5. Tạo post với default value theo use case
        Post post = Post.builder()
                .tieuDe(request.getTieuDe().trim())
                .moTa(request.getMoTa() == null ? null : request.getMoTa().trim())
                .ngayDang(LocalDateTime.now())
                .dynamicWM(request.getDynamicWM() != null ? request.getDynamicWM() : false)
                .tacGia(account)
                .luotXem(0L)
                .sanPhamAI(request.getSanPhamAI())
                .hanCheHienThi(hanCheHienThi)
                .choPhepComment(request.getChoPhepComment() != null ? request.getChoPhepComment() : true)
                .daXemXetBaoCao(false)
                .congKhai(request.getCongKhai() != null ? request.getCongKhai() : true)
                .build();

        post = postRepository.save(post);

        // 6. Xử lý tag
        saveTagsForPost(post, request.getLstGanThe());

        // 7. Xử lý ảnh -> lưu KTEO file
        saveProtectedFilesForPost(post, imageFiles, request);

        return post.getPostID();
    }
    /*
     * Kiểm tra và lấy giá trị hạn chế hiển thị khi tạo Post.
     *
     * CreatePostRequest hiện đang dùng Byte hanCheHienThi,
     * nên không dùng DisplayRestriction.fromString nữa.
     *
     * Chỉ cho phép người dùng tạo Post với:
     * - ALL
     * - R_18
     * - R_18G
     *
     * Không cho tạo Post trực tiếp ở trạng thái TEMP_HIDDEN.
     */
    private byte resolveCreateDisplayRestriction(Byte hanCheHienThi) {
        if (hanCheHienThi == null) {
            throw new AppException(ErrorCode.POST_DISPLAY_RESTRICTION_NULL);
        }

        if (hanCheHienThi == DisplayRestriction.ALL.getValue()
                || hanCheHienThi == DisplayRestriction.R_18.getValue()
                || hanCheHienThi == DisplayRestriction.R_18G.getValue()) {
            return hanCheHienThi;
        }

        throw new AppException(ErrorCode.POST_DISPLAY_RESTRICTION_WRONG_TYPE);
    }
    /**
     * Validate toàn bộ request đúng với đặc tả use case.
     */
    private void validateCreatePostRequest(CreatePostRequest request, MultipartFile[] imageFiles) {
        if (request == null) {
            throw new AppException("Dữ liệu không hợp lệ");
        }

        // Validate tiêu đề
        if (request.getTieuDe().trim().length() > 50) {
            throw new AppException(ErrorCode.POST_TITLE_TOO_LONG);
        }

        // Validate mô tả
        if (request.getMoTa() != null && request.getMoTa().trim().length() > 255) {
            throw new AppException(ErrorCode.POST_DESCRIPTION_TOO_LONG);
        }

        // Validate tag
        List<String> tags = request.getLstGanThe();

        if (tags == null || tags.isEmpty()) {
            throw new AppException(ErrorCode.POST_TAG_NULL);
        }

        if (tags.size() > 10) {
            throw new AppException(ErrorCode.POST_TAG_RANGE_OVERFLOW);
        }
        for (String tag : tags) {
            String normalizedTag = tag == null ? "" : tag.trim();

            if (normalizedTag.length() < 1 || normalizedTag.length() > 50) {
                throw new AppException(ErrorCode.POST_TAG_TOO_LONG);
            }
        }
        // Validate danh sách hình ảnh
        if (imageFiles == null || imageFiles.length == 0) {
            throw new AppException(ErrorCode.POST_FILE_NULL);
        }

        if (imageFiles.length > 10) {
            throw new AppException(ErrorCode.POST_FILE_TOO_MANY);
        }

        long totalSize = 0L;
        for (MultipartFile file : imageFiles) {
            if (file == null || file.isEmpty()) {
                throw new AppException(ErrorCode.POST_FILE_NULL);
            }

            String originalFilename = file.getOriginalFilename() == null ? "" : file.getOriginalFilename();
            String lowerName = originalFilename.toLowerCase();

            boolean supported = lowerName.endsWith(".png")
                    || lowerName.endsWith(".jpg")
                    || lowerName.endsWith(".jpeg")
                    || lowerName.endsWith(".bmp");

            if (!supported) {
                throw new AppException(ErrorCode.POST_FILE_WRONG_TYPE);
            }

            if (file.getSize() > 15L * 1024 * 1024) {
                throw new AppException(ErrorCode.POST_FILE_RANGE_OVERFLOW);
            }

            totalSize += file.getSize();
        }

        if (totalSize > 100L * 1024 * 1024) {
            throw new AppException(ErrorCode.POST_FILE_TOTAL_RANGE_OVERFLOW);
        }

        // Validate sản phẩm AI
        if (request.getSanPhamAI() == null) {
            throw new AppException(ErrorCode.POST_AI_NULL);
        }

        // Validate hạn chế hiển thị
        resolveCreateDisplayRestriction(request.getHanCheHienThi());

        // Validate option bảo vệ hình ảnh.
// Mỗi ảnh đều phải có một cấu hình bảo vệ hợp lệ.
// Không tin hoàn toàn dữ liệu FE gửi lên vì người dùng có thể sửa bằng DevTools.
        for (int i = 0; i < imageFiles.length; i++) {
            ImageProtectionOptionRequest protectionOption =
                    resolveProtectionOption(request, i);

            validateProtectionOption(protectionOption);
        }
    }
    /*
     * Lấy cấu hình bảo vệ tương ứng với ảnh thứ index.
     *
     * Trường hợp applyToAll = true:
     * - Tất cả ảnh dùng chung globalProtectionSettings.
     *
     * Trường hợp applyToAll = false:
     * - Ảnh thứ index dùng protectionPayload[index].settings.
     *
     * Nếu thiếu dữ liệu, trả về null để validateProtectionOption báo lỗi.
     */
    private ImageProtectionOptionRequest resolveProtectionOption(
            CreatePostRequest request,
            int index
    ) {
        if (request == null) {
            return null;
        }

        /*
         * Nếu người dùng chọn áp dụng cùng một cấu hình cho tất cả ảnh.
         */
        if (Boolean.TRUE.equals(request.getApplyToAll())) {
            return request.getGlobalProtectionSettings();
        }

        /*
         * Nếu applyToAll = false, mỗi ảnh cần có setting riêng.
         */
        if (Boolean.FALSE.equals(request.getApplyToAll())) {
            if (request.getProtectionPayload() == null) {
                return null;
            }

            if (index < 0 || index >= request.getProtectionPayload().size()) {
                return null;
            }

            FileProtectionPayloadRequest payloadItem =
                    request.getProtectionPayload().get(index);

            if (payloadItem == null) {
                return null;
            }

            return payloadItem.getSettings();
        }

        /*
         * Nếu FE không gửi applyToAll thì coi là sai request.
         */
        return null;
    }
    /*
     * Kiểm tra cấu hình bảo vệ của một ảnh.
     *
     * Hàm này giúp BE chặn các giá trị bị sửa sai từ FE.
     */
    private void validateProtectionOption(ImageProtectionOptionRequest option) {
        if (option == null) {
            throw new AppException(ErrorCode.POST_PROTECTION_WEIRD_PROP);
        }

        /*
         * frameCount chỉ nhận 1, 12, 30, 60.
         */
        if (option.getFrameCount() == null ||
                !ALLOWED_FRAME_COUNTS.contains(option.getFrameCount())) {
            throw new AppException(ErrorCode.POST_PROTECTION_WEIRD_PROP);
        }

        /*
         * noiseLevel là độ nhiễu.
         * Giới hạn từ 0 đến 100.
         */
        if (option.getNoiseLevel() == null ||
                option.getNoiseLevel() < 0 ||
                option.getNoiseLevel() > 100) {
            throw new AppException(ErrorCode.POST_PROTECTION_WEIRD_PROP);
        }

        /*
         * colorCoverage là mức phủ màu gốc.
         * Ví dụ colorCoverage = 5 thì mỗi frame random opacity từ 5% đến 15%.
         * Để tránh phủ quá nặng, giới hạn từ 0 đến 90.
         */
        if (option.getColorCoverage() == null ||
                option.getColorCoverage() < 0 ||
                option.getColorCoverage() > 90) {
            throw new AppException(ErrorCode.POST_PROTECTION_WEIRD_PROP);
        }

        /*
         * noiseColorMode chỉ được là static hoặc dynamic.
         */
        String noiseColorMode = option.getNoiseColorMode();

        if (noiseColorMode == null ||
                !ALLOWED_NOISE_COLOR_MODES.contains(
                        noiseColorMode.trim().toLowerCase()
                )) {
            throw new AppException(ErrorCode.POST_PROTECTION_WEIRD_PROP);
        }

        /*
         * Nếu chọn static thì bắt buộc staticColor phải là mã màu #RRGGBB.
         */
        if ("static".equalsIgnoreCase(noiseColorMode)) {
            if (!isValidHexColor(option.getStaticColor())) {
                throw new AppException(ErrorCode.POST_PROTECTION_WEIRD_PROP);
            }
        }
    }
    /*
     * Kiểm tra mã màu dạng #RRGGBB.
     */
    private boolean isValidHexColor(String color) {
        if (color == null) {
            return false;
        }

        return color.matches("^#[0-9a-fA-F]{6}$");
    }
    /**
     * Lưu tag và bản ghi gắn thẻ
     */
    private void saveTagsForPost(Post post, List<String> tags) {
        // Dùng Set để tránh trùng tag trong cùng một request
        Set<String> uniqueTags = new LinkedHashSet<>();

        for (String tagName : tags) {
            uniqueTags.add(tagName.trim());
        }

        for (String tagName : uniqueTags) {
            Tag tag = tagRepository.findById(tagName)
                    .orElseGet(() -> tagRepository.save(
                            Tag.builder()
                                    .tenTag(tagName)
                                    .soLuongPost(0L)
                                    .build()
                    ));

            GanThe ganThe = GanThe.builder()
                    .id(new GanTheId(post.getPostID(), tag.getTenTag()))
                    .post(post)
                    .tag(tag)
                    .build();

            ganTheRepository.save(ganThe);

            tag.setSoLuongPost(tag.getSoLuongPost() + 1);
            tagRepository.save(tag);
        }
    }

    /**
     * Với mỗi ảnh:
     * - lấy cấu hình bảo vệ tương ứng với ảnh hiện tại
     * - gọi FileProtectionService để tạo file .kteo
     * - lưu thông tin KTEOFile vào DB
     */
    private void saveProtectedFilesForPost(
            Post post,
            MultipartFile[] imageFiles,
            CreatePostRequest request
    ) {
        if (imageFiles == null || imageFiles.length == 0) {
            return;
        }

        for (int i = 0; i < imageFiles.length; i++) {
            MultipartFile imageFile = imageFiles[i];

            /*
             * Lấy setting bảo vệ theo request mới.
             *
             * Nếu applyToAll = true:
             * - tất cả ảnh dùng globalProtectionSettings.
             *
             * Nếu applyToAll = false:
             * - ảnh thứ i dùng protectionPayload[i].settings.
             */
            ImageProtectionOptionRequest option =
                    resolveProtectionOption(request, i);

            /*
             * Gọi service xử lý ảnh:
             * - tạo frame
             * - phủ màu Soft Light
             * - random opacity từng frame
             * - ghép thành video 1 giây
             * - lưu thành file .kteo
             */
            FileProtectionService.ProtectedFileResult result =
                    fileProtectionService.protectAndSaveImageAsKteo(
                            imageFile,
                            option,
                            post.getPostID(),
                            i + 1
                    );

            KTEOFile kteoFile = KTEOFile.builder()
                    .link(result.getRelativePath())
                    .width(result.getWidth())
                    .height(result.getHeight())
                    .thuTu(i + 1)
                    .verifyKey(result.getVerifyKey())
                    .post(post)
                    .build();

            kteoFileRepository.save(kteoFile);
        }
    }

    @Transactional(readOnly = true)
    public PageResponse<PostResponse> getPosts(int page) {

        int size = 18;

        /*
         * Nếu người dùng đã đăng nhập:
         * - currentUserId là ID account hiện tại.
         *
         * Nếu chưa đăng nhập:
         * - currentUserId là null.
         */
        Long currentUserId = getCurrentUserId();

        Pageable pageable = PageRequest.of(page, size);

        /*
         * Lọc post ngay khi lấy ID để việc phân trang vẫn chính xác.
         *
         * Người đã đăng nhập sẽ không thấy post của account mà họ đã chặn.
         * Người chưa đăng nhập vẫn thấy các post công khai bình thường.
         */
        Page<Long> postIdPage = postRepository.findPublicPostIds(
                currentUserId,
                pageable
        );

        List<Long> postIds = postIdPage.getContent();

        if (postIds.isEmpty()) {
            return new PageResponse<>(
                    List.of(),
                    postIdPage.getNumber(),
                    postIdPage.getSize(),
                    postIdPage.getTotalElements(),
                    postIdPage.getTotalPages(),
                    postIdPage.isFirst(),
                    postIdPage.isLast()
            );
        }

        /*
         * Lấy dữ liệu đầy đủ của các post đã vượt qua điều kiện lọc.
         */
        List<Post> posts =
                postRepository.findPostsWithFilesAndAuthorByIds(postIds);

        Map<Long, Post> postMap = new HashMap<>();

        for (Post post : posts) {
            postMap.put(post.getPostID(), post);
        }

        Map<Long, Long> likeCountMap = getLikeCountMap(postIds);

        Set<Long> likedPostIds = getLikedPostIds(
                currentUserId,
                postIds
        );

        /*
         * Map theo đúng thứ tự của danh sách ID phân trang ban đầu.
         */
        List<PostResponse> content = postIds.stream()
                .map(postMap::get)
                .filter(Objects::nonNull)
                .map(post -> {
                    Long postId = post.getPostID();

                    Long luotThich =
                            likeCountMap.getOrDefault(postId, 0L);

                    Boolean daThich =
                            likedPostIds.contains(postId);

                    return postMapper.toPostResponse(
                            post,
                            luotThich,
                            daThich
                    );
                })
                .toList();

        return new PageResponse<>(
                content,
                postIdPage.getNumber(),
                postIdPage.getSize(),
                postIdPage.getTotalElements(),
                postIdPage.getTotalPages(),
                postIdPage.isFirst(),
                postIdPage.isLast()
        );
    }
    /*
     * Lấy danh sách Post ngẫu nhiên cho section khám phá tại Home.
     *
     * Mỗi lần gọi API:
     * - BE chọn ngẫu nhiên tối đa 18 Post hợp lệ.
     * - BE không cần biết FE đã hiển thị Post nào.
     * - FE sẽ tự lọc trùng trước khi nối thêm vào giao diện.
     */
    @Transactional(readOnly = true)
    public PageResponse<PostResponse> getRandomPosts() {

        int size = 18;

        /*
         * Nếu đã đăng nhập:
         * - dùng accountID để lọc block và trạng thái đã thích.
         *
         * Nếu chưa đăng nhập:
         * - currentUserId là null.
         */
        Long currentUserId = getCurrentUserId();

        /*
         * Luôn lấy page 0.
         * Vì query đã random lại ở mỗi lần gọi,
         * không cần dùng page 1, page 2 cho section random.
         */
        Pageable pageable = PageRequest.of(0, size);

        Page<Long> postIdPage =
                postRepository.findRandomPublicPostIds(
                        currentUserId,
                        pageable
                );

        List<Long> postIds = postIdPage.getContent();

        if (postIds.isEmpty()) {
            return new PageResponse<>(
                    List.of(),
                    0,
                    size,
                    postIdPage.getTotalElements(),
                    postIdPage.getTotalPages(),
                    true,
                    true
            );
        }

        /*
         * Lấy dữ liệu đầy đủ của các Post đã được chọn ngẫu nhiên.
         */
        List<Post> posts =
                postRepository.findPostsWithFilesAndAuthorByIds(postIds);

        /*
         * Query IN không đảm bảo giữ nguyên thứ tự random ban đầu.
         * Vì vậy tạo map, sau đó map ngược theo postIds.
         */
        Map<Long, Post> postMap = new HashMap<>();

        for (Post post : posts) {
            postMap.put(post.getPostID(), post);
        }

        Map<Long, Long> likeCountMap = getLikeCountMap(postIds);

        /*
         * Nếu chưa đăng nhập thì không cần query danh sách Post đã thích.
         */
        Set<Long> likedPostIds = currentUserId == null
                ? Set.of()
                : getLikedPostIds(currentUserId, postIds);

        List<PostResponse> content = postIds.stream()
                .map(postMap::get)
                .filter(Objects::nonNull)
                .map(post -> {
                    Long postId = post.getPostID();

                    Long luotThich =
                            likeCountMap.getOrDefault(postId, 0L);

                    Boolean daThich =
                            likedPostIds.contains(postId);

                    return postMapper.toPostResponse(
                            post,
                            luotThich,
                            daThich
                    );
                })
                .toList();

        return new PageResponse<>(
                content,
                0,
                size,
                postIdPage.getTotalElements(),
                postIdPage.getTotalPages(),
                postIdPage.isFirst(),
                postIdPage.isLast()
        );
    }
    private Long getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        if (auth != null && auth.getPrincipal() instanceof Long) {
            return (Long) auth.getPrincipal();
        }

        return null;
    }
    @Transactional(readOnly = true)
    public PostSearchResponse searchPosts(PostSearchRequest request, int page) {
        int size = 18;

        Long currentUserId = getCurrentUserId();

        String keyword = request.getKeyword();

        boolean keywordBlank = keyword == null || keyword.trim().isBlank();

        if (!keywordBlank) {
            keyword = keyword.trim();
        } else {
            keyword = "";
        }

        String keywordCompareType = request.getKeywordCompareType();

        if (keywordCompareType == null || keywordCompareType.isBlank()) {
            keywordCompareType = "TAG_RELATIVE";
        }

        Boolean includeAIValue = request.getIncludeAI();

        boolean includeAI = includeAIValue == null || includeAIValue;

        String sortBy = request.getSortBy();

        if (sortBy == null || sortBy.isBlank()) {
            sortBy = "NEWEST";
        }

        Pageable pageable = createSearchPostPageable(page, size, sortBy);

        Page<Long> postIdPage = postRepository.searchPublicPostIds(
                keyword,
                keywordBlank,
                keywordCompareType,
                includeAI,
                currentUserId,
                pageable
        );

        List<Long> postIds = postIdPage.getContent();

        if (postIds.isEmpty()) {
            return PostSearchResponse.builder()
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

        List<Post> posts = postRepository.findPostsWithFilesAndAuthorByIds(postIds);

        Map<Long, Post> postMap = new HashMap<>();

        for (Post post : posts) {
            postMap.put(post.getPostID(), post);
        }

        Map<Long, Long> likeCountMap = getLikeCountMap(postIds);

        Set<Long> likedPostIds = getLikedPostIds(currentUserId, postIds);

        List<PostResponse> content = postIds.stream()
                .map(postMap::get)
                .filter(Objects::nonNull)
                .map(post -> {
                    Long postId = post.getPostID();

                    Long luotThich = likeCountMap.getOrDefault(postId, 0L);
                    Boolean daThich = likedPostIds.contains(postId);

                    return postMapper.toPostResponse(post, luotThich, daThich);
                })
                .toList();

        return PostSearchResponse.builder()
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
    private Pageable createSearchPostPageable(int page, int size, String sortBy) {
        if (page < 0) {
            page = 0;
        }

        Sort sort;

        switch (sortBy) {
            case "OLDEST" -> sort = Sort.by(Sort.Direction.ASC, "ngayDang");
            case "MOST_VIEWED" -> sort = Sort.by(Sort.Direction.DESC, "luotXem");
            case "NEWEST" -> sort = Sort.by(Sort.Direction.DESC, "ngayDang");
            default -> sort = Sort.by(Sort.Direction.DESC, "ngayDang");
        }

        return PageRequest.of(page, size, sort);
    }
    private Map<Long, Long> getLikeCountMap(List<Long> postIds) {
        Map<Long, Long> likeCountMap = new HashMap<>();

        List<Object[]> likeResults = thichPostRepository.countLikesByPostIds(postIds);

        for (Object[] row : likeResults) {
            Long postId = (Long) row[0];
            Long count = (Long) row[1];

            likeCountMap.put(postId, count);
        }

        return likeCountMap;
    }

    private Set<Long> getLikedPostIds(Long currentUserId, List<Long> postIds) {
        if (currentUserId == null) {
            return Set.of();
        }

        List<Long> likedIds = thichPostRepository.findLikedPostIdsByAccount(
                currentUserId,
                postIds
        );

        return new HashSet<>(likedIds);
    }
    @Transactional(readOnly = true)
    public PostDetailResponse getPostDetail(Long postId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        Long currentUserId = null;

        /*
         * JwtFilter của bạn đang set principal user là Long accountID.
         * Nếu chưa đăng nhập thì currentUserId sẽ là null.
         */
        if (auth != null && auth.getPrincipal() instanceof Long) {
            currentUserId = (Long) auth.getPrincipal();
        }

        /*
         * Tìm Post.
         */
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new AppException(ErrorCode.POST_NOT_FOUND));

        Account tacGia = post.getTacGia();

        /*
         * Nếu có đăng nhập thì mới kiểm tra chặn.
         * Nếu không check null, người chưa đăng nhập xem post có thể bị lỗi.
         */
        if (currentUserId != null && tacGia != null) {
            boolean viewerBlockedAuthor =
                    chanNguoiDungRepository
                            .existsByAccountChan_AccountIDAndAccountBiChan_AccountID(
                                    currentUserId,
                                    tacGia.getAccountID()
                            );

            boolean authorBlockedViewer =
                    chanNguoiDungRepository
                            .existsByAccountChan_AccountIDAndAccountBiChan_AccountID(
                                    tacGia.getAccountID(),
                                    currentUserId
                            );

            if (viewerBlockedAuthor || authorBlockedViewer) {
                throw new AppException(ErrorCode.POST_AUTHOR_BLOCKED);
            }
        }

        /*
         * Lấy danh sách file KTEO của post.
         * DTO PostDetailResponse cần List<KteoFileResponse>,
         * không phải List<String>.
         */
        List<KteoFileResponse> lstKTEOFile =
                kteoFileRepository.findByPost_PostID(postId)
                        .stream()
                        .map(this::toKteoFileResponse)
                        .toList();

        /*
         * Lấy danh sách tag.
         * DTO đang đặt tên là lstGanThe.
         */
        List<String> lstGanThe =
                ganTheRepository.findByPost_PostID(postId)
                        .stream()
                        .map(gt -> gt.getTag().getTenTag())
                        .toList();

        /*
         * Đếm lượt thích.
         */
        Long luotThich = thichPostRepository.countByPost(post);

        /*
         * Nếu chưa đăng nhập thì mặc định:
         * - chưa thích
         * - chưa lưu
         * - chưa theo dõi tác giả
         */
        Boolean daThich = false;
        Boolean daLuu = false;
        Boolean daTheoDoiTacGia = false;

        if (currentUserId != null) {
            daThich = thichPostRepository.existsByPost_PostIDAndAccount_AccountID(
                    postId,
                    currentUserId
            );

            daLuu = luuPostRepository.existsById(
                    new LuuPostId(postId, currentUserId)
            );

            /*
             * Nếu bạn có repository theo dõi account thì mở đoạn này.
             * Đổi tên repository cho đúng project của bạn.
             */
            if (tacGia != null &&
                    !tacGia.getAccountID().equals(currentUserId)) {

                daTheoDoiTacGia =
                        theoDoiAccountRepository
                                .existsByAccountTheoDoi_AccountIDAndAccountDuocTheoDoi_AccountID(
                                        currentUserId,
                                        tacGia.getAccountID()
                                );
            }
        }

        return PostDetailResponse.builder()
                .postID(post.getPostID())
                .tieuDe(post.getTieuDe())
                .moTa(post.getMoTa())
                .ngayDang(post.getNgayDang())
                .dynamicWM(post.getDynamicWM())

                .tacGia(tacGia == null ? null : tacGia.getAccountID())
                .usernameTacGia(tacGia == null ? null : tacGia.getUsername())
                .tenTacGia(tacGia == null ? null : tacGia.getTenHienThi())
                .avatarTacGia(tacGia == null ? null : tacGia.getAvatar())

                .luotXem(post.getLuotXem())
                .luotThich(luotThich)
                .daThich(daThich)
                .daLuu(daLuu)
                .daTheoDoiTacGia(daTheoDoiTacGia)

                .sanPhamAI(post.getSanPhamAI())
                .hanCheHienThi(post.getHanCheHienThi())
                .choPhepComment(post.getChoPhepComment())
                .daXemXetBaoCao(post.getDaXemXetBaoCao())
                .congKhai(post.getCongKhai())

                .lstGanThe(lstGanThe)
                .lstKTEOFile(lstKTEOFile)
                .build();
    }
    /*
     * Chuyển KTEOFile entity sang DTO trả về cho FE.
     * FE cần link, width, height để hiển thị video thumbnail/post detail.
     */
    private KteoFileResponse toKteoFileResponse(KTEOFile file) {
        return KteoFileResponse.builder()
                .fileID(file.getFileID())
                .link(file.getLink())
                .width(file.getWidth())
                .height(file.getHeight())
                .thuTu(file.getThuTu())
                .verifyKey(file.getVerifyKey())
                .build();
    }
    @Transactional
    public void toggleLike(Long postId, Long accountId) {
        ThichPostId id = new ThichPostId(postId, accountId);

        if (thichPostRepository.existsById(id)) {
            // Nếu đã thích rồi thì xóa (Unlike)
            thichPostRepository.deleteById(id);
        } else {
            // Nếu chưa thích thì thêm mới (Like)
            Post post = postRepository.findById(postId).orElseThrow();
            Account account = accountRepository.findById(accountId).orElseThrow();

            ThichPost like = new ThichPost(id, post, account);
            thichPostRepository.save(like);
        }
    }
    @Transactional
    public void toggleLikeComment(Long commentId, Long accountId) {

        ThichCommentId id =
                new ThichCommentId(commentId, accountId);

        // đã like -> unlike
        if (thichCommentRepository.existsById(id)) {

            thichCommentRepository.deleteById(id);

        } else {

            // chưa like -> like
            Comment comment = commentRepository.findById(commentId)
                    .orElseThrow(() ->
                            new RuntimeException("Không tìm thấy comment"));

            Account account = accountRepository.findById(accountId)
                    .orElseThrow(() ->
                            new RuntimeException("Không tìm thấy account"));

            ThichComment like = new ThichComment(
                    id,
                    comment,
                    account
            );

            thichCommentRepository.save(like);
        }
    }
    @Transactional
    public CommentResponse saveComment(Long postId, Long accountId, CommentRequest request) {
        checkBiKhoaService.checkBiKhoa(accountId);
        // 1. Tìm Post và Account
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new AppException("Bài viết không tồn tại"));
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new AppException("Tài khoản không tồn tại"));

        // 2. Sử dụng Builder để tạo đối tượng Comment
        Comment comment = Comment.builder()
                .noiDung(request.getNoiDung())
                .post(post)
                .nguoiViet(account)
                .thoiGianDang(LocalDateTime.now())
                .build();

        // 3. Xử lý logic Comment cha (Reply)
        String tenNguoiDuocTraLoi = ""; // Khởi tạo biến lưu tên
        System.out.println("đây là id của comment gốc"+request.getParentID());
        if (request.getParentID() != null) {
            Comment parentComment = commentRepository.findById(request.getParentID())
                    .orElseThrow(() -> new AppException("Bình luận gốc không tồn tại"));

            comment.setParent(parentComment);

            //  Lấy tên hiển thị của người viết bình luận cha
            tenNguoiDuocTraLoi = parentComment.getNguoiViet().getTenHienThi();
        }

        // 4. Lưu vào Database
        comment = commentRepository.save(comment);
        Account postAuthor = post.getTacGia();
        Account commentAuthor = comment.getNguoiViet();

        /*
         * Thông báo cho tác giả post nếu người comment không phải chính tác giả.
         */
        if (!postAuthor.getAccountID().equals(commentAuthor.getAccountID())&&request.getParentID()==null) {
            thongBaoService.createNotification(
                    postAuthor.getAccountID(),
                    post.getTieuDe(),
                    "/post/"+ post.getPostID() + "?comment="+comment.getCommentID(),
                    1
            );
        }
        if (!postAuthor.getAccountID().equals(commentAuthor.getAccountID())&&request.getParentID()!=null) {
            thongBaoService.createNotification(
                    postAuthor.getAccountID(),
                     post.getTieuDe(),
                    "/post/"+ post.getPostID() + "?comment="+comment.getCommentID(),
                    2
            );
        }
        // 5. Build Response và cộng thêm tên vào nội dung nếu có
        String noiDungHienThi = comment.getNoiDung();
        if (comment.getParent() != null && !tenNguoiDuocTraLoi.isEmpty()) {
            // Cộng chuỗi: "@TênNgườiDùng: Nội dung"
            noiDungHienThi = "@" + tenNguoiDuocTraLoi + ": " + noiDungHienThi;
        }

        return CommentResponse.builder()
                .commentID(comment.getCommentID())
                .noiDung(noiDungHienThi)
                .thoiGianDang(comment.getThoiGianDang())

                .accountID(account.getAccountID())
                .username(account.getUsername())
                .tenHienThi(account.getTenHienThi())
                .avatar(account.getAvatar())

                .parentID(comment.getParent() != null
                        ? comment.getParent().getCommentID()
                        : null)
                .tenNguoiDuocTraLoi(
                        comment.getParent() != null
                                ? tenNguoiDuocTraLoi
                                : null
                )
                .soLuongTraLoi(0)

                .luotThich(0L)
                .daThich(false)
                .build();
    }
    @Transactional(readOnly = true)
    public PageResponse<CommentResponse> getCommentsByPost(
            Long postId,
            int page,
            int size
    ) {
        Long currentUserId = getCurrentUserId();

        Pageable pageable = PageRequest.of(
                page,
                size,
                Sort.by("thoiGianDang").descending()
        );

        Page<Comment> commentPage =
                commentRepository.findAllByPostPostIDAndParentIsNull(
                        postId,
                        pageable
                );

        List<CommentResponse> content =
                commentPage.getContent()
                        .stream()
                        .map(comment -> toCommentResponse(comment, currentUserId))
                        .toList();

        return PageResponse.<CommentResponse>builder()
                .content(content)
                .page(commentPage.getNumber())
                .size(commentPage.getSize())
                .totalElements(commentPage.getTotalElements())
                .totalPages(commentPage.getTotalPages())
                .first(commentPage.isFirst())
                .last(commentPage.isLast())
                .build();
    }
    /*
     * Chuyển Comment entity sang CommentResponse cho FE.
     */
    private CommentResponse toCommentResponse(
            Comment comment,
            Long currentUserId
    ) {
        Account nguoiViet = comment.getNguoiViet();

        Comment parent = comment.getParent();

        Long commentId = comment.getCommentID();

        long luotThich = thichCommentRepository
                .countByComment_CommentID(commentId);

        boolean daThich = false;

        if (currentUserId != null) {
            daThich = thichCommentRepository
                    .existsByComment_CommentIDAndAccount_AccountID(
                            commentId,
                            currentUserId
                    );
        }

        int soLuongTraLoi = 0;

        /*
         * Chỉ comment gốc mới cần đếm số reply.
         * Reply thì để 0 cũng được.
         */
        if (parent == null) {
            soLuongTraLoi = (int) commentRepository
                    .countByParent_CommentID(commentId);
        }

        return CommentResponse.builder()
                .commentID(comment.getCommentID())
                .noiDung(comment.getNoiDung())
                .thoiGianDang(comment.getThoiGianDang())

                .accountID(nguoiViet == null ? null : nguoiViet.getAccountID())
                .username(nguoiViet == null ? null : nguoiViet.getUsername())
                .tenHienThi(nguoiViet == null ? null : nguoiViet.getTenHienThi())
                .avatar(nguoiViet == null ? null : nguoiViet.getAvatar())

                .parentID(parent == null ? null : parent.getCommentID())
                .tenNguoiDuocTraLoi(
                        parent == null || parent.getNguoiViet() == null
                                ? null
                                : parent.getNguoiViet().getTenHienThi()
                )
                .soLuongTraLoi(soLuongTraLoi)

                .luotThich(luotThich)
                .daThich(daThich)
                .build();
    }
    @Transactional(readOnly = true)
    public PageResponse<CommentResponse> getRepliesByParent(
            Long parentId,
            int page,
            int size
    ) {
        Long currentUserId = getCurrentUserId();

        Pageable pageable = PageRequest.of(
                page,
                size,
                Sort.by("thoiGianDang").ascending()
        );

        Page<Comment> replyPage =
                commentRepository.findAllByParent_CommentID(
                        parentId,
                        pageable
                );

        List<CommentResponse> content =
                replyPage.getContent()
                        .stream()
                        .map(comment -> toCommentResponse(comment, currentUserId))
                        .toList();

        return PageResponse.<CommentResponse>builder()
                .content(content)
                .page(replyPage.getNumber())
                .size(replyPage.getSize())
                .totalElements(replyPage.getTotalElements())
                .totalPages(replyPage.getTotalPages())
                .first(replyPage.isFirst())
                .last(replyPage.isLast())
                .build();
    }
    @Transactional
    public String updatePost(
            Long postId,
            Long accountId,
            UpdatePostRequest request
    ) {
        checkBiKhoaService.checkBiKhoa(accountId);
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy post"));

        // =========================
        // CHECK CHỦ SỞ HỮU
        // =========================

        if (!post.getTacGia().getAccountID().equals(accountId)) {
            throw new RuntimeException("Bạn không có quyền chỉnh sửa Post");
        }


        // =========================
        // DA XEM XET BAO CAO
        // =========================

        boolean daXemXetBaoCao = post.getDaXemXetBaoCao();
        if (request.getCongKhai() == null) {
            throw new RuntimeException("Chế độ công khai không phù hợp");
        }

        if (request.getChoPhepComment() == null) {
            throw new RuntimeException("Chế độ cho phép comment không phù hợp");
        }

        if (request.getDynamicWM() == null) {
            throw new RuntimeException("Chế độ thủy ấn động không phù hợp");
        }
        if (daXemXetBaoCao) {

            // CHỈ CHO UPDATE
            // Cho phép comment
            // Công khai
            post.setDynamicWM(request.getDynamicWM());
            post.setChoPhepComment(request.getChoPhepComment());
            post.setCongKhai(request.getCongKhai());

            postRepository.save(post);
            return "Chỉnh sửa Post thành công";
        }
        // =========================
        // VALIDATION
        // =========================

        // TITLE

        if (request.getTieuDe() != null &&
                request.getTieuDe().length() > 50) {

            throw new RuntimeException(
                    "Tiêu đề Post vượt quá số lượng ký tự cho phép là 50 ký tự"
            );
        }

        // MOTA

        if (request.getMoTa() != null &&
                request.getMoTa().length() > 255) {

            throw new RuntimeException(
                    "Mô tả Post vượt quá số lượng ký tự cho phép là 255 ký tự"
            );
        }

        // TAGS

        if (request.getLstGanThe() == null ||
                request.getLstGanThe().isEmpty()) {

            throw new RuntimeException(
                    "Vui lòng gắn thẻ cho bài đăng"
            );
        }

        if (request.getLstGanThe().size() > 10) {
            throw new RuntimeException(
                    "Vui lòng không gắn quá 10 thẻ cho bài đăng"
            );
        }

        for (String tag : request.getLstGanThe()) {

            if (tag == null ||
                    tag.trim().isEmpty() ||
                    tag.length() > 50) {

                throw new RuntimeException(
                        "Thẻ \"" + tag + "\" không phù hợp"
                );
            }
        }

        // SAN PHAM AI

        if (request.getSanPhamAI() == null) {
            throw new RuntimeException(
                    "Vui lòng cho biết liệu có hình ảnh nào trong danh sách hình ảnh là sản phẩm AI tạo sinh không?"
            );
        }

        // HAN CHE HIEN THI

        if (request.getHanCheHienThi() == null) {
            throw new RuntimeException(
                    "Vui lòng chọn độ tuổi phù hợp có thể xem bài Post"
            );
        }

        // ví dụ:
        // 0 = ALL
        // 1 = 13+
        // 2 = 18+
        // 3 = Tạm ẩn

        if (request.getHanCheHienThi() < 0 ||
                request.getHanCheHienThi() > 2) {

            throw new RuntimeException(
                    "Mức hạn chế hiển thị không phù hợp"
            );
        }

        // CONG KHAI

        if (request.getCongKhai() == null) {
            throw new RuntimeException(
                    "Chế độ công khai không phù hợp"
            );
        }

            post.setTieuDe(request.getTieuDe());
            post.setMoTa(request.getMoTa());
            post.setHanCheHienThi(request.getHanCheHienThi());
            // =========================
            // DEFAULT VALUE
            // =========================

            post.setDynamicWM(
                    request.getDynamicWM() != null
                            ? request.getDynamicWM()
                            : false
            );

            post.setChoPhepComment(
                    request.getChoPhepComment() != null
                            ? request.getChoPhepComment()
                            : true
            );

            post.setSanPhamAI(request.getSanPhamAI());

            // cập nhật công khai nếu khác
            if (!post.getCongKhai().equals(request.getCongKhai())) {
                post.setCongKhai(request.getCongKhai());
            }
        Set<String> normalizedTagNames = request.getLstGanThe()
                .stream()
                .filter(Objects::nonNull)
                .map(String::trim)
                .map(tag -> tag.toLowerCase(Locale.ROOT))
                .collect(Collectors.toSet());

        if (normalizedTagNames.size() != request.getLstGanThe().size()) {
            throw new RuntimeException("Vui lòng không nhập trùng thẻ");
        }
        // =========================
        // CẬP NHẬT TAG
        // =========================

        updateTagsForPost(post, request.getLstGanThe());




        // =========================
        // SAVE POST
        // =========================

        postRepository.save(post);

        return "Chỉnh sửa Post thành công";
    }
    /*
     * Cập nhật danh sách tag của Post theo phần chênh lệch.
     *
     * Không xóa toàn bộ tag cũ rồi thêm lại,
     * vì những tag vẫn còn trong bài viết không cần bị thay đổi.
     */
    private void updateTagsForPost(
            Post post,
            List<String> requestedTagNames
    ) {
        /*
         * Chuẩn hóa danh sách tag FE gửi lên:
         * - bỏ null
         * - trim khoảng trắng
         * - chuyển chữ thường
         * - bỏ tag trùng nhau
         * - giữ thứ tự người dùng gửi lên
         */
        LinkedHashSet<String> nextTagNames = requestedTagNames == null
                ? new LinkedHashSet<>()
                : requestedTagNames.stream()
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(tagName -> !tagName.isBlank())
                .map(tagName -> tagName.toLowerCase(Locale.ROOT))
                .collect(Collectors.toCollection(LinkedHashSet::new));

        /*
         * Lấy các quan hệ tag hiện tại của Post.
         */
        List<GanThe> currentRelations =
                ganTheRepository.findByPost_PostID(post.getPostID());

        /*
         * Tạo map:
         * tenTag -> quan hệ GanThe hiện tại.
         */
        Map<String, GanThe> currentRelationMap =
                currentRelations.stream()
                        .collect(Collectors.toMap(
                                relation -> relation.getTag()
                                        .getTenTag()
                                        .trim()
                                        .toLowerCase(Locale.ROOT),
                                Function.identity(),
                                (first, second) -> first,
                                LinkedHashMap::new
                        ));

        Set<String> currentTagNames =
                new HashSet<>(currentRelationMap.keySet());

        /*
         * Những tag cần thêm:
         * có trong request mới nhưng chưa có trong Post hiện tại.
         */
        Set<String> tagNamesToAdd =
                new LinkedHashSet<>(nextTagNames);

        tagNamesToAdd.removeAll(currentTagNames);

        /*
         * Những tag cần xóa:
         * đang có trong Post nhưng người dùng đã bỏ khỏi request mới.
         */
        Set<String> tagNamesToRemove =
                new LinkedHashSet<>(currentTagNames);

        tagNamesToRemove.removeAll(nextTagNames);

        /*
         * Xóa những tag thực sự bị bỏ khỏi bài viết.
         */
        List<Tag> tagsNeedDeleteAfterFlush = new ArrayList<>();

        for (String tagName : tagNamesToRemove) {
            GanThe relation = currentRelationMap.get(tagName);

            if (relation == null) {
                continue;
            }

            Tag tag = relation.getTag();

            /*
             * Xóa quan hệ Post - Tag trước.
             */
            ganTheRepository.delete(relation);

            long currentCount = tag.getSoLuongPost() == null
                    ? 0L
                    : tag.getSoLuongPost();

            long nextCount = Math.max(0L, currentCount - 1);

            tag.setSoLuongPost(nextCount);

            if (nextCount == 0L) {
                /*
                 * Chưa xóa Tag ngay lập tức.
                 * Cần đợi quan hệ GanThe được xóa khỏi DB trước.
                 */
                tagsNeedDeleteAfterFlush.add(tag);
            } else {
                tagRepository.save(tag);
            }
        }

        /*
         * Đẩy thao tác xóa GanThe xuống database trước khi xóa Tag.
         */
        if (!tagNamesToRemove.isEmpty()) {
            ganTheRepository.flush();
        }

        /*
         * Tag nào không còn Post sử dụng thì mới xóa khỏi bảng Tag.
         */
        for (Tag tag : tagsNeedDeleteAfterFlush) {
            tagRepository.delete(tag);
        }

        /*
         * Thêm những tag thực sự mới đối với Post hiện tại.
         */
        for (String tagName : tagNamesToAdd) {
            /*
             * Nếu tag đã tồn tại trong hệ thống thì dùng lại.
             * Nếu chưa tồn tại thì tạo Tag mới trước.
             */
            Tag tag = tagRepository.findById(tagName)
                    .orElseGet(() -> tagRepository.save(
                            Tag.builder()
                                    .tenTag(tagName)
                                    .soLuongPost(0L)
                                    .build()
                    ));

            long currentCount = tag.getSoLuongPost() == null
                    ? 0L
                    : tag.getSoLuongPost();

            tag.setSoLuongPost(currentCount + 1);

            tag = tagRepository.save(tag);

            /*
             * Tạo quan hệ mới giữa Post và Tag.
             */
            GanThe newRelation = GanThe.builder()
                    .post(post)
                    .tag(tag)
                    .build();

            ganTheRepository.save(newRelation);
        }
    }
    @Transactional
    public String deletePost(Long postId, Long accountId) {
        checkBiKhoaService.checkBiKhoa(accountId);
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy post"));

        if (!post.getTacGia().getAccountID().equals(accountId)) {
            throw new RuntimeException("Không có quyền");
        }

        List<Tag> tags = ganTheRepository.findTagsByPostId(postId);

        // delete post
        postRepository.delete(post);

        // flush SQL DELETE xuống DB
        postRepository.flush();

        // clear persistence context
        entityManager.clear();

        // update tags
        for (Tag tag : tags) {

            tag.setSoLuongPost(tag.getSoLuongPost() - 1);

            if (tag.getSoLuongPost() < 1) {
                tagRepository.delete(tag);
            } else {
                tagRepository.save(tag);
            }
        }

        return "Xóa bài Post thành công";
    }
    @Transactional
    public String deleteComment(
            Long commentId,
            Long accountId
    ) {
        checkBiKhoaService.checkBiKhoa(accountId);
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() ->
                        new RuntimeException("Không tìm thấy comment"));

        // check quyền
        if (!comment.getNguoiViet().getAccountID().equals(accountId)) {
            throw new RuntimeException("Không có quyền");
        }

        // tìm replies
        List<Comment> replies =
                commentRepository.findByParent_CommentID(commentId);

        // xóa likes của replies
        for (Comment reply : replies) {

            thichCommentRepository
                    .deleteByComment_CommentID(reply.getCommentID());
        }

        // xóa replies
        commentRepository.deleteAll(replies);

        // xóa likes comment cha
        thichCommentRepository
                .deleteByComment_CommentID(commentId);

        // xóa comment cha
        commentRepository.delete(comment);

        return "Xóa comment thành công";
    }
    @Transactional
    public String reportPost(
            Long currentAccountId,
            Long postId,
            BaoCaoPostRequest request
    ) {
        checkBiKhoaService.checkBiKhoa(currentAccountId);
        Account reporter = userRepository.findById(currentAccountId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Account"));
        // =========================
        // CHECK POST
        // =========================

        Post post = postRepository.findById(postId)
                .orElseThrow(() ->
                        new RuntimeException("Không tìm thấy Post"));

        if (post.getTacGia().getAccountID().equals(currentAccountId)) {
            throw new AppException(ErrorCode.CANNOT_REPORT_YOURPOST);
        }
        boolean alreadyReported =
                baoCaoPostRepository.existsByPost_PostIDAndNguoiBaoCao_AccountID(
                        postId,
                        currentAccountId
                );

        if (alreadyReported) {
            throw new AppException(ErrorCode.POST_ALREADY_REPORTED);
        }
        // =========================
        // VALIDATION
        // =========================

        // MỤC BÁO CÁO

        if (request.getMucBaoCao() == null) {

            throw new RuntimeException(
                    "Vui lòng chọn mục báo cáo"
            );
        }

        // Ví dụ:
        // 0 = Spam
        // 1 = 18+
        // 2 = Bạo lực
        // 3 = Quấy rối
        // 4 = Vi phạm bản quyền

        if (request.getMucBaoCao() == null) {

            throw new RuntimeException(
                    "Vui lòng chọn mục báo cáo"
            );
        }

        // NỘI DUNG

        if (request.getNoiDungBaoCao() == null ||
                request.getNoiDungBaoCao().trim().isEmpty()) {

            throw new RuntimeException(
                    "Vui lòng cho biết thông tin bạn muốn báo cáo"
            );
        }

        if (request.getNoiDungBaoCao().length() > 100) {

            throw new RuntimeException(
                    "Nội dung báo cáo vượt quá giới hạn ký tự cho phép là 100 ký tự"
            );
        }

        // =========================
        // CREATE
        // =========================

        BaoCaoPost baoCaoPost = BaoCaoPost.builder()
                .post(post)
                .nguoiBaoCao(reporter)
                .ngayBaoCao(new Date())
                .mucBaoCao(request.getMucBaoCao())
                .noiDungBaoCao(request.getNoiDungBaoCao().trim())
                .hanCheHienThiGoc(post.getHanCheHienThi())
                .build();

        baoCaoPostRepository.save(baoCaoPost);
        Account postAuthor = post.getTacGia();

        /*
         * Sau khi lưu báo cáo mới, đếm lại số người báo cáo duy nhất của Post này.
         *
         * Vì một người chỉ được báo cáo một Post một lần,
         * số lượng này phản ánh số tài khoản khác nhau đã báo cáo Post.
         */
        long uniqueReportCount =
                baoCaoPostRepository.countUniqueReportsByPostId(postId);

        /*
         * Nếu Post đạt đủ 25 báo cáo duy nhất:
         * - Tạm ẩn Post ngay lập tức.
         * - Không cần đợi Scheduler quét theo giờ nữa.
         *
         * Điều kiện kiểm tra thêm giúp tránh set lại nhiều lần
         * nếu Post đã bị tạm ẩn trước đó.
         */
        if (uniqueReportCount >= AUTO_HIDE_REPORT_THRESHOLD
                && !DisplayRestriction.TEMP_HIDDEN.getValue().equals(post.getHanCheHienThi())) {

            post.setHanCheHienThi(
                    DisplayRestriction.TEMP_HIDDEN.getValue()
            );

            /*
             * post đang là entity managed vì được lấy từ postRepository.findById(...)
             * nên không bắt buộc save lại.
             * Nhưng save rõ ràng như này dễ đọc hơn.
             */
            postRepository.save(post);

            System.out.println(
                    "Post " + postId
                            + " đã bị tạm ẩn vì đạt "
                            + uniqueReportCount
                            + " báo cáo"
            );
        }
        thongBaoService.createNotification(
                postAuthor.getAccountID(),
                post.getTieuDe(),
                "/post/" + post.getPostID(),
                3
        );
        return "Báo cáo bài Post thành công";
    }
    @Transactional
    public String toggleSavePost(Long postId, Long accountId) {
        Post post = postRepository.findById(postId).orElseThrow(() -> new RuntimeException("Không tìm thấy Post") );
        if(post.getHanCheHienThi()==99)
            throw new RuntimeException("Post đã bị ẩn");
        LuuPostId id = new LuuPostId(postId, accountId);

        if (luuPostRepository.existsById(id)) {

            luuPostRepository.deleteById(id);

        } else {


            Account account = accountRepository.findById(accountId)
                    .orElseThrow();

            LuuPost luuPost = LuuPost.builder()
                    .id(id)
                    .post(post)
                    .account(account)
                    .ngayLuu(LocalDateTime.now())
                    .build();

            luuPostRepository.save(luuPost);
        }
        return "Lưu Post Thành Công";

    }
    @Transactional(readOnly = true)
    public PageResponse<SavedPostResponse> getSavedPosts(
            Long accountId,
            int page
    ) {

        Pageable pageable = PageRequest.of(page, 6);

        Page<LuuPost> savedPosts =
                luuPostRepository
                        .findByAccount_AccountIDOrderByNgayLuuDesc(
                                accountId,
                                pageable
                        );

        List<SavedPostResponse> content =
                savedPosts.getContent()
                        .stream()
                        .map(luuPost -> {

                            Post post = luuPost.getPost();

                            String thumbnail = null;

                            if (post.getFiles() != null &&
                                    !post.getFiles().isEmpty()) {

                                thumbnail = post.getFiles()
                                        .get(0)
                                        .getLink();
                            }

                            return SavedPostResponse.builder()
                                    .postId(post.getPostID())
                                    .tieuDe(post.getTieuDe())
                                    .moTa(post.getMoTa())
                                    .hanCheHienThi(post.getHanCheHienThi())
                                    .lstKTEOFile(post.getFiles())
                                    .accountId(post.getTacGia().getAccountID())
                                    .tenHienThi(post.getTacGia().getTenHienThi())
                                    .avatar(post.getTacGia().getAvatar())
                                    .ngayLuu(luuPost.getNgayLuu())
                                    .build();
                        })
                        .toList();

        return PageResponse.<SavedPostResponse>builder()
                .content(content)
                .page(savedPosts.getNumber())
                .size(savedPosts.getSize())
                .totalElements(savedPosts.getTotalElements())
                .totalPages(savedPosts.getTotalPages())
                .last(savedPosts.isLast())
                .build();
    }/*
     * Lấy danh sách Post liên quan đến Post đang xem dưới dạng phân trang.
     *
     * Mỗi trang hiển thị tối đa 18 Post.
     */
    @Transactional(readOnly = true)
    public PostSearchResponse getRelatedPosts(
            Long currentPostId,
            int page
    ) {
        int size = 18;
        System.out.println(currentPostId);
        /*
         * Không cho page âm.
         */
        int safePage = Math.max(page, 0);

        /*
         * Kiểm tra Post đang xem có tồn tại hay không.
         *
         * Đổi POST_NOT_FOUND thành ErrorCode thực tế
         * Tan đang dùng nếu tên khác.
         */
        if (currentPostId == null ||
                !postRepository.existsById(currentPostId)) {
            throw new AppException(ErrorCode.POST_NOT_FOUND);
        }

        /*
         * Lấy các tag của Post đang xem.
         *
         * Backend tự lấy tag theo postID,
         * không nhận list tag từ FE để tránh request bị chỉnh sửa.
         */
        Set<String> currentPostTagNames =
                ganTheRepository.findTagNamesByPostId(currentPostId)
                        .stream()
                        .filter(Objects::nonNull)
                        .map(String::trim)
                        .filter(tagName -> !tagName.isBlank())
                        .map(tagName -> tagName.toLowerCase(Locale.ROOT))
                        .collect(Collectors.toSet());

        /*
         * Nếu Post hiện tại không có tag:
         * không có cơ sở để tìm Post liên quan.
         *
         * Trả response phân trang rỗng để FE ẩn section.
         */
        if (currentPostTagNames.isEmpty()) {
            return PostSearchResponse.builder()
                    .message("Không tìm thấy Post liên quan")
                    .content(List.of())
                    .page(0)
                    .size(size)
                    .totalElements(0)
                    .totalPages(0)
                    .first(true)
                    .last(true)
                    .build();
        }

        /*
         * Nếu viewer đã đăng nhập:
         * - lấy accountID để lọc block hai chiều;
         * - xác định trạng thái đã thích Post.
         *
         * Nếu chưa đăng nhập:
         * - currentUserId = null;
         * - vẫn có thể xem các Post công khai.
         */
        Long currentUserId = getCurrentUserId();

        Pageable pageable = PageRequest.of(
                safePage,
                size
        );

        /*
         * Repository đã chịu trách nhiệm:
         * - lọc quyền hiển thị;
         * - lọc block;
         * - sắp xếp nhiều tag trùng trước;
         * - sau đó sắp xếp mới nhất.
         */
        Page<Long> relatedPostIdPage =
                postRepository.findRelatedPublicPostIds(
                        currentPostId,
                        currentPostTagNames,
                        currentUserId,
                        pageable
                );

        List<Long> relatedPostIds =
                relatedPostIdPage.getContent();

        /*
         * Trang hiện tại không có dữ liệu.
         */
        if (relatedPostIds.isEmpty()) {
            return PostSearchResponse.builder()
                    .message("Không tìm thấy Post liên quan")
                    .content(List.of())
                    .page(relatedPostIdPage.getNumber())
                    .size(relatedPostIdPage.getSize())
                    .totalElements(relatedPostIdPage.getTotalElements())
                    .totalPages(relatedPostIdPage.getTotalPages())
                    .first(relatedPostIdPage.isFirst())
                    .last(relatedPostIdPage.isLast())
                    .build();
        }

        /*
         * Map các Post đã tìm được thành dữ liệu PostResponse
         * để PostGrid ở FE sử dụng trực tiếp.
         */
        List<PostResponse> content =
                buildPostResponseList(
                        relatedPostIds,
                        currentUserId
                );

        return PostSearchResponse.builder()
                .message(null)
                .content(content)
                .page(relatedPostIdPage.getNumber())
                .size(relatedPostIdPage.getSize())
                .totalElements(relatedPostIdPage.getTotalElements())
                .totalPages(relatedPostIdPage.getTotalPages())
                .first(relatedPostIdPage.isFirst())
                .last(relatedPostIdPage.isLast())
                .build();
    }
    /*
     * Map danh sách postID đã được query và sắp xếp từ database
     * thành danh sách PostResponse trả về FE.
     *
     * Phải map lại theo đúng thứ tự postIds ban đầu,
     * vì query IN lấy đầy đủ entity không cam kết giữ nguyên thứ tự.
     */
    private List<PostResponse> buildPostResponseList(
            List<Long> postIds,
            Long currentUserId
    ) {
        if (postIds == null || postIds.isEmpty()) {
            return List.of();
        }

        /*
         * Lấy đầy đủ Post kèm file hiển thị và tác giả.
         */
        List<Post> posts =
                postRepository.findPostsWithFilesAndAuthorByIds(postIds);

        Map<Long, Post> postMap = new HashMap<>();

        for (Post post : posts) {
            postMap.put(post.getPostID(), post);
        }

        /*
         * Lấy số lượt thích cho từng Post.
         */
        Map<Long, Long> likeCountMap =
                getLikeCountMap(postIds);

        /*
         * Khách chưa đăng nhập thì không có Post đã thích.
         *
         * Viết như vậy an toàn hơn việc gửi currentUserId = null
         * vào repository kiểm tra like.
         */
        Set<Long> likedPostIds = currentUserId == null
                ? Set.of()
                : getLikedPostIds(currentUserId, postIds);

        /*
         * Giữ nguyên thứ tự DB đã sắp xếp:
         * - Với search thường: theo sort đã chọn.
         * - Với related posts: theo số tag trùng và thời gian đăng.
         */
        return postIds.stream()
                .map(postMap::get)
                .filter(Objects::nonNull)
                .map(post -> {
                    Long postId = post.getPostID();

                    Long luotThich =
                            likeCountMap.getOrDefault(postId, 0L);

                    Boolean daThich =
                            likedPostIds.contains(postId);

                    return postMapper.toPostResponse(
                            post,
                            luotThich,
                            daThich
                    );
                })
                .toList();
    }
}
