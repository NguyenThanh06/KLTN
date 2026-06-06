package com.developer.EyesOnly.Controller;

import com.developer.EyesOnly.DTO.Request.*;
import com.developer.EyesOnly.DTO.Response.*;
import com.developer.EyesOnly.Entity.Account;
import com.developer.EyesOnly.Exception.AppException;
import com.developer.EyesOnly.Exception.ErrorCode;
import com.developer.EyesOnly.Service.*;
import com.nimbusds.jose.JOSEException;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.text.ParseException;
import java.util.List;
@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/account")
public class AccountController {
    @Autowired
    FollowAccountService followAccountService;
    @Autowired
    AccountService accountService;
    @Autowired
    BlockAccountService blockAccountService;
    @Autowired
    AccountSearchService accountSearchService;
    @Autowired
    BaoCaoUserService baoCaoUserService;
    @Autowired
    ValidateService validateService;

    // BƯỚC 1: Nhận thông tin đăng ký và gửi OTP
    @PostMapping("/request-otp")
    public ApiResponse<String> requestRegistration(@RequestBody @Valid AccountCreationRequest request) {
        accountService.requestRegistration(request);
        ApiResponse<String> apiResponse = new ApiResponse<>();
        apiResponse.setResult("Mã OTP đã được gửi đến email: " + request.getEmail() + ". Mã có hiệu lực trong 5 phút.");
        return apiResponse;
    }
    // BƯỚC 2: Xác thực OTP và tạo tài khoản vào Database
    @PostMapping("/verify-and-register")
    public ApiResponse<AccountResponse> verifyAndRegister(@RequestBody OtpRequest otpRequest) throws ParseException, JOSEException {

        if (otpRequest.getEmail() == null) {
            throw new AppException(ErrorCode.NULL_EMAIL);
        }
        System.out.println("OTP gửi tới " + otpRequest.getEmail() + " là: " + otpRequest.getOtp()); // Log để debug
        ApiResponse<AccountResponse> apiResponse = new ApiResponse<>();
        apiResponse.setResult(accountService.verifyAndCreateAccount(otpRequest
                .getEmail(),otpRequest.getOtp()));
        return apiResponse;
    }
    @PostMapping("/send-verify-otp")
    public ApiResponse<String> sendVerifyOtp(
            @RequestParam String email
    ) {
        accountService.sendOtp(email);
        return ApiResponse.<String>builder()
                .result("Đã gửi OTP")
                .build();
    }
    //http://localhost:8080/account/59/follow
    @PostMapping("/{targetAccountId}/follow")
    public ApiResponse<FollowAccountResponse> followAccount(
            Principal principal,
            @PathVariable Long targetAccountId
    ) {
        Long currentAccountId = getCurrentAccountId(principal);

        return ApiResponse.<FollowAccountResponse>builder()
                .result(followAccountService.followAccount(currentAccountId, targetAccountId))
                .build();
    }

    @DeleteMapping("/{targetAccountId}/follow")
    public ApiResponse<FollowAccountResponse> unfollowAccount(
            Principal principal,
            @PathVariable Long targetAccountId
    ) {
        Long currentAccountId = getCurrentAccountId(principal);

        return ApiResponse.<FollowAccountResponse>builder()
                .result(followAccountService.unfollowAccount(currentAccountId, targetAccountId))
                .build();
    }
    /*
     * Lấy danh sách tài khoản mà một Account đang theo dõi.
     *
     * API này dùng được cho:
     * - Người dùng xem danh sách của chính mình.
     * - Người dùng xem danh sách của Account khác.
     * - Khách chưa đăng nhập xem danh sách của Account.
     *
     * Ví dụ:
     * GET /account/59/following?keyword=&page=0&size=6
     */
    @GetMapping("/{accountId}/following")
    public ApiResponse<AccountSearchResponse> searchFollowingAccounts(
            Principal principal,
            @PathVariable Long accountId,
            @RequestParam(defaultValue = "") String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "6") int size
    ) {
        /*
         * viewerAccountId là người đang xem danh sách.
         * Nếu chưa đăng nhập thì giá trị là null.
         */
        Long viewerAccountId = getOptionalCurrentAccountId(principal);
        System.out.println("Account đang được xem: " + accountId);
        System.out.println("Người đang xem: " + viewerAccountId);
        return ApiResponse.<AccountSearchResponse>builder()
                .result(accountSearchService.searchFollowingAccounts(
                        viewerAccountId,
                        accountId,
                        keyword,
                        page,
                        size
                ))
                .build();
    }

    /*
     * Lấy danh sách tài khoản đang theo dõi một Account.
     *
     * Ví dụ:
     * GET /account/59/followers?keyword=&page=0&size=6
     */
    @GetMapping("/{accountId}/followers")
    public ApiResponse<AccountSearchResponse> searchFollowerAccounts(
            Principal principal,
            @PathVariable Long accountId,
            @RequestParam(defaultValue = "") String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "6") int size
    ) {
        Long viewerAccountId = getOptionalCurrentAccountId(principal);

        return ApiResponse.<AccountSearchResponse>builder()
                .result(accountSearchService.searchFollowerAccounts(
                        viewerAccountId,
                        accountId,
                        keyword,
                        page,
                        size
                ))
                .build();
    }

    /*
     * Lấy ID của người đang xem nếu có đăng nhập.
     *
     * Đây là API public nên:
     * - Chưa đăng nhập: trả về null.
     * - Đã đăng nhập user: trả về accountID.
     */
    private Long getOptionalCurrentAccountId(Principal principal) {
        if (principal == null || principal.getName() == null) {
            return null;
        }

        try {
            return Long.valueOf(principal.getName());
        } catch (NumberFormatException exception) {
            return null;
        }
    }

    /*
     * Lấy danh sách account mà mình đã chặn.
     *
     * GET /profile/me/blocked?keyword=&page=0&size=6
     */
    @GetMapping("/blocked")
    public ApiResponse<AccountSearchResponse> searchMyBlockedAccounts(
            Principal principal,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "6") int size
    ) {
        Long currentAccountId = getCurrentAccountId(principal);

        return ApiResponse.<AccountSearchResponse>builder()
                .result(accountSearchService.searchMyBlockedAccounts(
                        currentAccountId,
                        keyword,
                        page,
                        size
                ))
                .build();
    }

    /*
     * Lấy accountID của user đang đăng nhập từ token.
     */
    private Long getCurrentAccountId(Principal principal) {
        if (principal == null || principal.getName() == null) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }

        try {
            return Long.valueOf(principal.getName());
        } catch (NumberFormatException exception) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }
    }

    // chặn account
    @PostMapping("/{targetAccountId}/block")
    public ApiResponse<BlockAccountResponse> blockAccount(
            Principal principal,
            @PathVariable Long targetAccountId
    ) {
        Long currentAccountId = getCurrentAccountId(principal);

        return ApiResponse.<BlockAccountResponse>builder()
                .result(blockAccountService.blockAccount(currentAccountId, targetAccountId))
                .build();
    }
    // bỏ chặn account
    @DeleteMapping("/{targetAccountId}/block")
    public ApiResponse<BlockAccountResponse> unblockAccount(
            Principal principal,
            @PathVariable Long targetAccountId
    ) {
        Long currentAccountId = getCurrentAccountId(principal);

        return ApiResponse.<BlockAccountResponse>builder()
                .result(blockAccountService.unblockAccount(currentAccountId, targetAccountId))
                .build();
    }
    //Còn chức năng đang xuất thì để FE làm
//const handleLogout = async () => {
//  const token = localStorage.getItem("token");
//
//        try {
//            await axios.post(
//                    "http://localhost:8080/auth/logout",
//                    {},
//                    {
//                            headers: {
//                Authorization: `Bearer ${token}`
//            }
//      }
//    );
//        } catch (error) {
//            console.log(error);
//        }
//
//        localStorage.removeItem("token");
//        localStorage.removeItem("accountID");
//
//        navigate("/login");
//    };
    @PostMapping("/logout")
    public ApiResponse<String> logout() {
        return ApiResponse.<String>builder()
                .result("Đăng xuất thành công")
                .build();
    }
    //http://localhost:8080/account/search?keyword=タンさん🌸&page=0&size=6
    @GetMapping("/search")
    public ApiResponse<AccountSearchResponse> searchAccounts(
            Principal principal,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "6") int size
    ) {
//        Long currentAccountId = Long.valueOf(principal.getName());
        Long currentAccountId = null;

        if (principal != null) {
            currentAccountId = Long.valueOf(principal.getName());
        }
        return ApiResponse.<AccountSearchResponse>builder()
                .result(accountSearchService.searchAccounts(
                        currentAccountId,
                        keyword,
                        page,
                        size
                ))
                .build();
    }
    // báo cáo account
    @PostMapping("/{targetAccountId}/report")
    public ApiResponse<BaoCaoUserResponse> reportUser(
            Principal principal,
            @PathVariable Long targetAccountId,
            @RequestBody BaoCaoUserRequest request
    ) {
        Long currentAccountId = getCurrentAccountId(principal);

        return ApiResponse.<BaoCaoUserResponse>builder()
                .result(baoCaoUserService.reportUser(
                        currentAccountId,
                        targetAccountId,
                        request
                ))
                .build();
    }
    @PostMapping("/check-signup-email")
    public ApiResponse<Void> checkSignupEmail(
            @RequestBody CheckSignupEmailRequest request
    ) {
        validateService.checkSignupEmail(request);

        return ApiResponse.<Void>builder()
                .message("EMAIL_VALID")
                .build();
    }
    @GetMapping
    List<Account> getUsers(){
        return accountService.getUsers();
    }
}