package com.developer.EyesOnly.Service;

import com.developer.EyesOnly.DTO.Request.UpdateProfileRequest;
import com.developer.EyesOnly.DTO.Response.*;
import com.developer.EyesOnly.Entity.Account;
import com.developer.EyesOnly.Entity.Post;
import com.developer.EyesOnly.Exception.AppException;
import com.developer.EyesOnly.Exception.ErrorCode;
import com.developer.EyesOnly.Mapper.PostMapper;
import com.developer.EyesOnly.Mapper.ProfileMapper;
import com.developer.EyesOnly.Repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProfileService {

    private final UserRepository accountRepository;
    private final TheoDoiAccountRepository theoDoiAccountRepository;
    private final PostRepository postRepository;
    private final ProfileMapper profileMapper;
    private final UserRepository userRepository;
    private final ChanAccountRepository chanAccountRepository;
    private final PostMapper postMapper;

    private final ThichPostRepository thichPostRepository;
    @Transactional(readOnly = true)
    public MyProfileResponse getMyProfile(Long currentUserId, int page, int size) {

        if (size <= 0) {
            size = 6;
        }

        if (size > 30) {
            size = 30;
        }

        Pageable pageable = PageRequest.of(
                page,
                size,
                Sort.by(Sort.Direction.DESC, "ngayDang")
        );

        Account account = accountRepository.findById(currentUserId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        long soNguoiTheoDoi =
                theoDoiAccountRepository.countByAccountDuocTheoDoi_AccountID(currentUserId);

        long soNguoiDangTheoDoi =
                theoDoiAccountRepository.countByAccountTheoDoi_AccountID(currentUserId);

        Page<Long> postIdPage =
                postRepository.findPostIdsByAccountID(currentUserId, pageable);

        List<PostProfileResponse> postResponses;

        if (postIdPage.isEmpty()) {
            postResponses = List.of();
        } else {
            List<Long> postIds = postIdPage.getContent();

            List<Post> posts =
                    postRepository.findPostsWithFilesByPostIds(postIds);

            Map<Long, Post> postMap = posts.stream()
                    .collect(Collectors.toMap(Post::getPostID, post -> post));

            postResponses = postIds.stream()
                    .map(postMap::get)
                    .filter(Objects::nonNull)
                    .map(profileMapper::toPostProfileResponse)
                    .toList();
        }

        PageResponse<PostProfileResponse> thuVienTacPham =
                profileMapper.toPostPageResponse(postIdPage, postResponses);

        return profileMapper.toMyProfileResponse(
                account,
                soNguoiTheoDoi,
                soNguoiDangTheoDoi,
                thuVienTacPham
        );
    }
    @Transactional(readOnly = true)
    public AccountPublicProfileResponse getPublicProfile(
            Long currentAccountId,
            Long targetAccountId,
            int page,
            int size
    ) {
        Account targetAccount = userRepository.findById(targetAccountId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        /*
         * Nếu đã đăng nhập thì kiểm tra chặn 2 chiều:
         * - currentAccount chặn targetAccount
         * - targetAccount chặn currentAccount
         */
        if (currentAccountId != null && !currentAccountId.equals(targetAccountId)) {
            boolean biChanHoacDaChan =
                    chanAccountRepository.existsBlockRelationBetweenTwoAccounts(
                            currentAccountId,
                            targetAccountId
                    );

            if (biChanHoacDaChan) {
                throw new RuntimeException("Bạn không thể xem thông tin người dùng này");
            }
        }

        Long soNguoiTheoDoi =
                theoDoiAccountRepository.countByAccountDuocTheoDoi_AccountID(targetAccountId);

        Long soNguoiDangTheoDoi =
                theoDoiAccountRepository.countByAccountTheoDoi_AccountID(targetAccountId);

        Boolean daTheoDoi = false;

        if (currentAccountId != null && !currentAccountId.equals(targetAccountId)) {
            daTheoDoi =
                    theoDoiAccountRepository
                            .existsByAccountDuocTheoDoi_AccountIDAndAccountTheoDoi_AccountID(
                                    targetAccountId,
                                    currentAccountId
                            );
        }

        PageResponse<PostResponse> thuVienTacPham =
                getPublicPostLibraryOfAccount(currentAccountId, targetAccountId, page, size);

        return AccountPublicProfileResponse.builder()
                .accountID(targetAccount.getAccountID())
                .username(targetAccount.getUsername())
                .tenHienThi(targetAccount.getTenHienThi())
                .avatar(targetAccount.getAvatar())
                .tieuSu(targetAccount.getTieuSu())
                .soNguoiTheoDoi(soNguoiTheoDoi)
                .soNguoiDangTheoDoi(soNguoiDangTheoDoi)
                .ngayThamGia(targetAccount.getNgayTaoTaiKhoan())
                .daTheoDoi(daTheoDoi)
                .thuVienTacPham(thuVienTacPham)
                .build();
    }

    private PageResponse<PostResponse> getPublicPostLibraryOfAccount(
            Long currentAccountId,
            Long targetAccountId,
            int page,
            int size
    ) {
        Pageable pageable = createPageable(page, size);

        Page<Long> postIdPage =
                postRepository.findPublicPostIdsByAccountId(targetAccountId, pageable);

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

        List<Post> posts =
                postRepository.findPostsWithFilesAndAuthorByIds(postIds);

        Map<Long, Post> postMap = new HashMap<>();

        for (Post post : posts) {
            postMap.put(post.getPostID(), post);
        }

        Map<Long, Long> likeCountMap = getLikeCountMap(postIds);

        Set<Long> likedPostIds = getLikedPostIds(currentAccountId, postIds);

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

    private Map<Long, Long> getLikeCountMap(List<Long> postIds) {
        if (postIds == null || postIds.isEmpty()) {
            return Map.of();
        }

        List<Object[]> rows = thichPostRepository.countLikesByPostIds(postIds);

        Map<Long, Long> result = new HashMap<>();

        for (Object[] row : rows) {
            Long postId = (Long) row[0];
            Long count = (Long) row[1];

            result.put(postId, count);
        }

        return result;
    }

    private Set<Long> getLikedPostIds(Long currentUserId, List<Long> postIds) {
        if (currentUserId == null || postIds == null || postIds.isEmpty()) {
            return Set.of();
        }

        return new HashSet<>(
                thichPostRepository.findLikedPostIdsByAccountIdAndPostIds(
                        currentUserId,
                        postIds
                )
        );
    }
    /*
     * Theo use case:
     * Người dùng phải chờ đủ 8 ngày kể từ lần đổi tên gần nhất.
     */
    private static final long DISPLAY_NAME_COOLDOWN_DAYS = 8L;

    /*
     * Các loại file avatar được phép upload.
     */
    private static final Set<String> ALLOWED_AVATAR_CONTENT_TYPES = Set.of(
            "image/png",
            "image/jpeg",
            "image/bmp",
            "image/webp"
    );

    /*
     * Chỉ cho phép chọn những avatar mặc định thật sự tồn tại trên FE.
     * Không tin đường dẫn gửi lên trực tiếp từ trình duyệt.
     */
    private static final Set<String> ALLOWED_DEFAULT_AVATARS = Set.of(
            "/defaultAvatar/default_avatar_1.svg",
            "/defaultAvatar/default_avatar_2.svg",
            "/defaultAvatar/default_avatar_3.svg",
            "/defaultAvatar/default_avatar_4.svg",
            "/defaultAvatar/default_avatar_5.svg"
    );

    @Value("${app.storage.avatar-directory:uploads/avatars}")
    private String avatarStorageDirectory;

    /*
     * Dùng để trả URL avatar mà thẻ <img> của FE có thể đọc trực tiếp.
     * Trong application.properties có thể đặt:
     * app.public-base-url=http://localhost:8080
     */
    @Value("${app.public-base-url:http://localhost:8080}")
    private String publicBaseUrl;

    /*
     * Lấy thông tin profile của người dùng đang đăng nhập.
     */
    @Transactional(readOnly = true)
    public ProfileResponse getMyProfile(Long currentAccountId) {
        Account account = accountRepository.findById(currentAccountId)
                .orElseThrow(() -> new AppException(ErrorCode.ACCOUNT_NOT_FOUND));

        return toProfileResponse(account);
    }

    /*
     * Cập nhật thông tin profile.
     *
     * Quy tắc:
     * - Tên hiển thị rỗng thì dùng username.
     * - Nếu tên thực sự thay đổi thì kiểm tra thời gian đổi tên.
     * - Tiểu sử rỗng thì lưu null.
     * - Không gửi avatar mới thì giữ nguyên avatar hiện tại.
     * - Nếu gửi avatar file thì lưu file mới.
     * - Nếu gửi avatarPreset thì đổi sang avatar mặc định được chọn.
     */
    @Transactional
    public ProfileResponse updateMyProfile(
            Long currentAccountId,
            UpdateProfileRequest request,
            MultipartFile avatarFile
    ) {
        Account account = accountRepository.findById(currentAccountId)
                .orElseThrow(() -> new AppException(ErrorCode.ACCOUNT_NOT_FOUND));

        /*
         * Chuẩn hóa tên hiển thị.
         * Nếu người dùng xóa trắng tên hiển thị thì lấy username.
         */
        String rawDisplayName = request == null ? null : request.getTenHienThi();
        String normalizedDisplayName = normalizeNullableText(rawDisplayName);

        String nextDisplayName = normalizedDisplayName == null
                ? account.getUsername()
                : normalizedDisplayName;

        if (nextDisplayName.length() > 30) {
            throw new AppException(ErrorCode.TENHIENTHI_TOO_LONG);
        }

        /*
         * Chỉ kiểm tra cooldown nếu giá trị tên thực sự thay đổi.
         * Việc chỉ sửa tiểu sử hoặc avatar sẽ không bị chặn bởi cooldown đổi tên.
         */
        boolean displayNameChanged =
                !Objects.equals(account.getTenHienThi(), nextDisplayName);

        if (displayNameChanged) {
            validateDisplayNameCooldown(account.getNgayDoiTenGanNhat());

            account.setTenHienThi(nextDisplayName);
            account.setNgayDoiTenGanNhat(LocalDate.now());
        }

        /*
         * Chuẩn hóa tiểu sử.
         * Chuỗi rỗng sẽ được lưu thành null.
         */
        String nextBio = normalizeNullableText(
                request == null ? null : request.getTieuSu()
        );

        if (nextBio != null && nextBio.length() > 255) {
            throw new AppException(ErrorCode.TIEUSU_TOO_LONG);
        }

        account.setTieuSu(nextBio);

        /*
         * Xử lý avatar.
         *
         * Ưu tiên avatar file nếu có.
         * Nếu không có file nhưng có avatarPreset thì đổi avatar mặc định.
         * Nếu cả hai đều không có thì giữ nguyên avatar hiện tại.
         */
        if (avatarFile != null && !avatarFile.isEmpty()) {
            validateAvatarFile(avatarFile);

            String savedAvatarUrl = saveAvatarFile(
                    currentAccountId,
                    avatarFile
            );

            account.setAvatar(savedAvatarUrl);

        } else if (request != null &&
                request.getAvatarPreset() != null &&
                !request.getAvatarPreset().isBlank()) {

            String avatarPreset = request.getAvatarPreset().trim();

            if (!ALLOWED_DEFAULT_AVATARS.contains(avatarPreset)) {
                throw new AppException(ErrorCode.AVATAR_PRESET_INVALID);
            }

            account.setAvatar(avatarPreset);
        }

        Account savedAccount = accountRepository.save(account);

        return toProfileResponse(savedAccount);
    }

    /*
     * Kiểm tra người dùng đã đủ thời gian đổi tên hay chưa.
     */
    private void validateDisplayNameCooldown(LocalDate lastChangedDate) {
        if (lastChangedDate == null) {
            return;
        }

        LocalDate today = LocalDate.now();
        LocalDate nextAllowedDate =
                lastChangedDate.plusDays(DISPLAY_NAME_COOLDOWN_DAYS);

        if (today.isBefore(nextAllowedDate)) {
            long remainingDays = ChronoUnit.DAYS.between(
                    today,
                    nextAllowedDate
            );

            throw new AppException(
                    ErrorCode.TENHIENTHI_CHANGED_RECENTLY
            );
        }
    }

    /*
     * Chuẩn hóa chuỗi:
     * - null -> null
     * - "   " -> null
     * - "  nội dung  " -> "nội dung"
     */
    private String normalizeNullableText(String value) {
        if (value == null) {
            return null;
        }

        String normalized = value.trim();

        return normalized.isEmpty() ? null : normalized;
    }

    /*
     * Validate file avatar từ client.
     * FE có kiểm tra trước nhưng BE vẫn phải kiểm tra lại.
     */
    private void validateAvatarFile(MultipartFile avatarFile) {
        String contentType = avatarFile.getContentType();

        if (contentType == null ||
                !ALLOWED_AVATAR_CONTENT_TYPES.contains(contentType)) {
            throw new AppException(ErrorCode.AVATAR_WRONG_TYPE);
        }

        /*
         * Có thể giới hạn avatar tối đa 5MB.
         */
        if (avatarFile.getSize() > 5L * 1024 * 1024) {
            throw new AppException(ErrorCode.AVATAR_WRONG_TYPE);
        }
    }

    /*
     * Lưu avatar upload vào thư mục riêng của tài khoản.
     *
     * Avatar không phải nội dung tác phẩm cần bảo vệ như KTEO,
     * nên có thể trả URL trực tiếp cho FE hiển thị.
     */
    private String saveAvatarFile(
            Long currentAccountId,
            MultipartFile avatarFile
    ) {
        try {
            String extension = resolveAvatarExtension(
                    avatarFile.getContentType()
            );

            Path avatarFolder = Paths.get(
                    avatarStorageDirectory,
                    "account-" + currentAccountId
            );

            Files.createDirectories(avatarFolder);

            String fileName =
                    "avatar-" + UUID.randomUUID() + "." + extension;

            Path destination = avatarFolder.resolve(fileName);

            Files.copy(
                    avatarFile.getInputStream(),
                    destination,
                    StandardCopyOption.REPLACE_EXISTING
            );

            return publicBaseUrl
                    + "/uploads/avatars/account-"
                    + currentAccountId
                    + "/"
                    + fileName;

        } catch (IOException e) {
            throw new RuntimeException("Không thể lưu avatar");
        }
    }

    /*
     * Chọn đuôi file theo content type đã validate.
     */
    private String resolveAvatarExtension(String contentType) {
        return switch (contentType) {
            case "image/png" -> "png";
            case "image/jpeg" -> "jpg";
            case "image/bmp" -> "bmp";
            case "image/webp" -> "webp";
            default -> throw new AppException(ErrorCode.AVATAR_WRONG_TYPE);
        };
    }

    /*
     * Mapper trả dữ liệu đúng các field FE đang dùng.
     */
    private ProfileResponse toProfileResponse(Account account) {
        return ProfileResponse.builder()
                .accountID(account.getAccountID())
                .username(account.getUsername())
                .tenHienThi(account.getTenHienThi())
                .email(account.getEmail())
                .avatar(account.getAvatar())
                .tieuSu(account.getTieuSu())
                .ngayDoiTenGanNhat(account.getNgayDoiTenGanNhat())
                .daVoHieuHoa(account.getDaVoHieuHoa())
                .ngayVoHieuHoa(account.getNgayVoHieuHoa())
                .build();
    }
}