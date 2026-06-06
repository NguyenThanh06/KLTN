package com.developer.EyesOnly.Exception;

import org.springframework.http.HttpStatus;


import org.springframework.http.HttpStatus;

public enum ErrorCode {
    POST_TITLE_TOO_LONG(HttpStatus.BAD_REQUEST, "TIEUDE_TOO_LONG", "..."),
    POST_DESCRIPTION_TOO_LONG(HttpStatus.BAD_REQUEST, "MOTA_TOO_LONG", "..."),
    POST_TAG_NULL(HttpStatus.BAD_REQUEST, "TAG_NULL", "..."),
    POST_TAG_RANGE_OVERFLOW(HttpStatus.BAD_REQUEST, "TAG_RANGE_OVERFLOW", "..."),
    POST_TAG_TOO_LONG(HttpStatus.BAD_REQUEST, "TAG_TOO_LONG", "..."),
    POST_FILE_NULL(HttpStatus.BAD_REQUEST, "FILE_NULL", "..."),
    POST_FILE_WRONG_TYPE(HttpStatus.BAD_REQUEST, "FILE_WRONG_TYPE", "..."),
    POST_FILE_RANGE_OVERFLOW(HttpStatus.BAD_REQUEST, "FILE_RANGE_OVERFLOW", "..."),
    POST_FILE_TOO_MANY(HttpStatus.BAD_REQUEST, "FILE_TOO_MANY", "..."),
    POST_FILE_TOTAL_RANGE_OVERFLOW(HttpStatus.BAD_REQUEST, "FILE_TOTAL_RANGE_OVERFLOW", "..."),
    POST_AI_NULL(HttpStatus.BAD_REQUEST, "SANPHAMAI_NULL", "..."),
    POST_AI_WRONG_TYPE(HttpStatus.BAD_REQUEST, "SANPHAMAI_WRONG_TYPE", "..."),
    POST_DISPLAY_RESTRICTION_NULL(HttpStatus.BAD_REQUEST, "HANCHEHIENTHI_NULL", "..."),
    POST_DISPLAY_RESTRICTION_WRONG_TYPE(HttpStatus.BAD_REQUEST, "HANCHEHIENTHI_WRONG_TYPE", "..."),
    POST_PROTECTION_WEIRD_PROP(HttpStatus.BAD_REQUEST, "PROTECTION_WEIRD_PROP", "..."),
    VERIFY_RESULT_NOT_FOUND(
            HttpStatus.NOT_FOUND,
            "1504",
            "Không tìm thấy kết quả xác thực"
    ),
    POST_NOT_FOUND(
            HttpStatus.NOT_FOUND,
            "POST_NOT_FOUND",
            "Không tìm thấy post"
    ),
    EMAIL_TOO_LONG(
            HttpStatus.BAD_REQUEST,
            "EMAIL_TOO_LONG",
            "Email quá dài"
    ),
    EMAIL_EXIST(
            HttpStatus.BAD_REQUEST,
            "EMAIL_EXIST",
            "Email đã được đăng ký"
    ),
    OTP_NOT_EXPIRED(
            HttpStatus.BAD_REQUEST,
            "OTP_NOT_EXPIRED",
            "Bạn thao tác quá nhanh. Vui lòng đợi 60 giây trước khi gửi lại mã OTP."
    ),
    EMAIL_TONTAI(
            HttpStatus.BAD_REQUEST,
            "1001",
            "Email đã được đăng ký"
    ),
    EMAIL_NULL(
            HttpStatus.BAD_REQUEST,
            "EMAIL_NULL",
            "Không được để trống Email"
    ),

    EMAIL_NOT_AN_EMAIL(
            HttpStatus.BAD_REQUEST,
            "EMAIL_NOT_AN_EMAIL",
            "Email không đúng định dạng"
    ),

    EMAIL_NOT_EXIST(
            HttpStatus.BAD_REQUEST,
            "EMAIL_NOT_EXIST",
            "Email không tồn tại trong hệ thống"
    ),
    RESET_PASSWORD_OTP_EXPIRED(
            HttpStatus.BAD_REQUEST,
            "RESET_PASSWORD_OTP_NOT_EXPIRED",
            "Mã xác thực đã hết hạn"
    ),
    NULL_RESET_PASSWORD_OTP( HttpStatus.BAD_REQUEST,
            "NULL_RESET_PASSWORD_OTP",
            "không được để troongs otp"),
    PASSWORD_INVALID(
            HttpStatus.BAD_REQUEST,
            "1002",
            "Mật khẩu yếu, vui lòng nhập mật khẩu có 6 ký tự trở lên"
    ),
    POST_ALREADY_REPORTED(
        HttpStatus.BAD_REQUEST,
            "POST_ALREADY_REPORTED",
          "Bạn đã báo cáo bài viết này rồi"
    ),
    PASSWORD_TRONG(
            HttpStatus.BAD_REQUEST,
            "1006",
            "Không được để trống Mật khẩu"
    ),

    NULL_EMAIL(
            HttpStatus.BAD_REQUEST,
            "NULL_EMAIL",
            "Không được để trống Email"
    ),
    UNAUTHENTICATED(
            HttpStatus.UNAUTHORIZED,
            "1001",
            "Bạn chưa đăng nhập hoặc phiên đăng nhập đã hết hạn"
    ),
    UNAUTHORIZED(
            HttpStatus.UNAUTHORIZED,
            "1001",
            "Bạn chưa đăng nhập hoặc phiên đăng nhập đã hết hạn"
    ),
    EMAIL_VALID(
            HttpStatus.BAD_REQUEST,
            "1008",
            "Email sai định dạng"
    ),

    EMAIL_DODAI(
            HttpStatus.BAD_REQUEST,
            "1013",
            "Email của bạn hơi bị dài quá rồi nghe"
    ),

    USER_NOT_EXISTED(
            HttpStatus.NOT_FOUND,
            "1003",
            "Account không tồn tại"
    ),


    USERNAME_VALID(
            HttpStatus.BAD_REQUEST,
            "1009",
            "Username chỉ được chứa chữ in thường, số và dấu gạch dưới"
    ),

    USER_TONTAI(
            HttpStatus.BAD_REQUEST,
            "1010",
            "Username đã tồn tại"
    ),

    USERNAME_TRONG(
            HttpStatus.BAD_REQUEST,
            "1011",
            "Không được để trống Username"
    ),

    USERNAME_DODAI(
            HttpStatus.BAD_REQUEST,
            "1012",
            "Username vượt quá số lượng ký tự cho phép là 20 ký tự"
    ),

    OTP_SAI(
            HttpStatus.BAD_REQUEST,
            "1005",
            "Mã OTP không chính xác"
    ),

    OTP_HETHAN(
            HttpStatus.BAD_REQUEST,
            "1014",
            "Mã OTP đã hết hạn"
    ),
    ACCOUNT_UNVERIFIED(
            HttpStatus.BAD_REQUEST,
            "ACCOUNT_UNVERIFIED",
            "Tài khoản chưa xác thực"
    ),
    ACCOUNT_LOCKED(HttpStatus.BAD_REQUEST,
            "ACCOUNT_LOCKED",
            "Tài khoản của bạn đã bị khóa"),
    ACCOUNT_DISABLED(HttpStatus.BAD_REQUEST,
            "ACCOUNT_DISABLED",
            "Tài khoản của bạn đã bị vô hiệu hóa"),
    WRONG_LOGIN(
            HttpStatus.BAD_REQUEST,
    "WRONG_LOGIN",
            "Email hoặc mật khẩu không đúng"
    ),
    KTEO_FILE_NOT_FOUND(
            HttpStatus.NOT_FOUND,
            "1501",
            "Không tìm thấy tệp KTEO cần xác thực"
    ),

    VERIFY_IMAGE_EMPTY(
            HttpStatus.BAD_REQUEST,
            "1502",
            "Vui lòng tải lên hình ảnh cần xác thực"
    ),

    VERIFY_KEY_INVALID(
            HttpStatus.INTERNAL_SERVER_ERROR,
            "1503",
            "Khóa xác thực của tệp KTEO không hợp lệ"
    ),
    NULL_VERIFY_CODE(HttpStatus.BAD_REQUEST,"NULL_VERIFY_CODE","OTP không dược để trống"),
    VERIFY_CODE_WRONG(HttpStatus.BAD_REQUEST,"VERIFY_CODE_WRONG","OTP không chính xác"),
    VERIFY_CODE_EXPIRED(HttpStatus.BAD_REQUEST,"VERIFY_CODE_EXPIRED","OTP chưa hết hạn"),
    VERIFY_CODE_NOT_EXPIRED(HttpStatus.BAD_REQUEST,"VERIFY_CODE_NOT_EXPIRED","OTP chưa hết hạn"),
    CURRENTPASSWORD_NULL(HttpStatus.BAD_REQUEST, "CURRENTPASSWORD_NULL","Không được để trống Mật khẩu cũ"),
    NEWPASSWORD_NULL(HttpStatus.BAD_REQUEST, "NEWPASSWORD_NULL", "Không được để trống Mật khẩu mới"),
    CONFIRMPASSWORD_NULL(HttpStatus.BAD_REQUEST, "CONFIRMPASSWORD_NULL","Không được để trống Nhập lại mật khẩu"),
    CURRENTPASSWORD_WRONG(HttpStatus.BAD_REQUEST, "CURRENTPASSWORD_WRONG","Mật khẩu cũ không đúng"),
    NEWPASSWORD_TOO_LONG(HttpStatus.BAD_REQUEST, "NEWPASSWORD_TOO_LONG","Mật khẩu mới vượt quá số lượng ký tự cho phép là 32 ký tự"),
    CONFIRMPASSWORD_MISMATCH(HttpStatus.BAD_REQUEST, "CONFIRMPASSWORD_MISMATCH","Nhập lại mật khẩu mới không chính xác"),
    NEWPASSWORD_TOO_SHORT(HttpStatus.BAD_REQUEST, "NEWPASSWORD_TOO_SHORT","Mật khẩu yếu, vui lòng nhập mật khẩu có 6 ký tự trở lên"),
    CHANGE_PASSWORD_OTP_WRONG(HttpStatus.BAD_REQUEST, "CHANGEPASSWORD_OTP_WRONG","Mã xác nhận sai"),
    CHANGE_PASSWORD_OTP_EXPIRED(HttpStatus.BAD_REQUEST, "CHANGEPASSWORD_OTP_WRONG","Mã xác nhận đã hết hạn"),
    CHANGE_PASSWORD_REQUEST_NOT_FOUND(HttpStatus.BAD_REQUEST, "","Chưa có yêu cầu đổi mật khẩu"),
    EMAIL_BLANK(HttpStatus.BAD_REQUEST, "","Không được để trống Email"),
    EMAIL_NOT_EXISTED(HttpStatus.BAD_REQUEST,"EMAIL_NOT_EXIST" ,"Email không tồn tại"),
    WRONG_RESET_PASSWORD_OTP(HttpStatus.BAD_REQUEST, "WRONG_RESET_PASSWORD_OTP","Mã xác thực không chính xác, vui lòng kiểm tra lại"),
    RESET_PASSWORD_REQUEST_NOT_FOUND(HttpStatus.BAD_REQUEST, "","Chưa có yêu cầu cấp lại mật khẩu"),
    REPORT_TYPE_BLANK(HttpStatus.BAD_REQUEST, "MUCBAOCAO_NULL","Vui lòng chọn mục báo cáo"),
    REPORT_CONTENT_BLANK(HttpStatus.BAD_REQUEST, "NOIDUNG_NULL","Vui lòng cho biết thông tin bạn muốn báo cáo"),
    REPORT_TYPE_INVALID(HttpStatus.BAD_REQUEST, "MUCBAOCAO_WRONG_TYPE","Mục báo cáo không hợp lệ"),
    REPORT_CONTENT_TOO_LONG(HttpStatus.BAD_REQUEST, "NOIDUNG_TOO_LONG","Nội dung báo cáo vượt quá giới hạn ký tự cho phép là 100 ký tự"),
    CANNOT_REPORT_YOURSELF(HttpStatus.BAD_REQUEST, "","Không thể tự báo cáo chính mình"),
    CANNOT_REPORT_YOURPOST(HttpStatus.BAD_REQUEST, "SELF_REPORT_POST","Không thể tự báo cáo bài viết của chính mình"),
    USER_ALREADY_REPORTED(HttpStatus.BAD_REQUEST, "USER_ALREADY_REPORTED","Bạn đã báo cáo người dùng này rồi"),
    ADMIN_ID_BLANK(HttpStatus.BAD_REQUEST, "","không được để trống tên đăng nhập"),
    ADMIN_PASSWORD_BLANK(HttpStatus.BAD_REQUEST, "","không được để trống mật khẩu"),
    NULL_PASSWORD(HttpStatus.BAD_REQUEST, "NULL_PASSWORD","không được để trống mật khẩu"),
    ADMIN_LOGIN_FAILED(HttpStatus.BAD_REQUEST, "WRONG_LOGIN","Tên đăng nhập hoặc mật khẩu không chính xác"),
    ADMIN_TOKEN_CREATE_FAILED(HttpStatus.BAD_REQUEST, "","Không thể tạo token admin"),
    DA_BI_KHOA(HttpStatus.BAD_REQUEST, "ACCOUNT_LOCKED","Tài khoản này đã bị khóa không thể báo cáo"),
    TENHIENTHI_TOO_LONG(
            HttpStatus.BAD_REQUEST,
            "TENHIENTHI_TOO_LONG",
            "Tên hiển thị không được vượt quá 30 ký tự"
    ),
    NULL_USERNAME(
            HttpStatus.BAD_REQUEST,
            "NULL_USERNAME",
            "Username không được để trống"
    ),
    USERNAME_NOT_AN_USERNAME(
            HttpStatus.BAD_REQUEST,
            "USERNAME_NOT_AN_USERNAME",
            "Bạn chưa thể tiếp tục đổi tên"
    ),
    USERNAME_TOO_LONG(
            HttpStatus.BAD_REQUEST,
            "USERNAME_TOO_LONG",
            "Bạn chưa thể tiếp tục đổi tên"
    ),
    USERNAME_EXIST(
            HttpStatus.BAD_REQUEST,
            "USERNAME_EXIST",
            "Bạn chưa thể tiếp tục đổi tên"
    ),
    TENHIENTHI_CHANGED_RECENTLY(
            HttpStatus.BAD_REQUEST,
            "TENHIENTHI_CHANGED_RECENTLY",
            "Bạn chưa thể tiếp tục đổi tên"
    ),

    TIEUSU_TOO_LONG(
            HttpStatus.BAD_REQUEST,
            "TIEUSU_TOO_LONG",
            "Tiểu sử không được vượt quá 255 ký tự"
    ),
    PASSWORD_TOO_SHORT(
            HttpStatus.BAD_REQUEST,
            "PASSWORD_TOO_SHORT",
            "Mật khẩu quá ngắn"
    ),
    PASSWORD_TOO_LONG(
            HttpStatus.BAD_REQUEST,
            "PASSWORD_TOO_LONG",
            "Mật khẩu quá dài"
    ),
    AVATAR_WRONG_TYPE(
            HttpStatus.BAD_REQUEST,
            "AVATAR_WRONG_TYPE",
            "Avatar phải là tệp hình ảnh"
    ),

    AVATAR_PRESET_INVALID(
            HttpStatus.BAD_REQUEST,
            "AVATAR_PRESET_INVALID",
            "Avatar mặc định không hợp lệ"
    ),

    ACCOUNT_NOT_FOUND(
            HttpStatus.NOT_FOUND,
            "ACCOUNT_NOT_FOUND",
            "Không tìm thấy tài khoản"
    ),
    POST_AUTHOR_BLOCKED (
            HttpStatus.BAD_REQUEST,
            "POST_ACCESS_DENIED",
            "Bạn không thể xem bài viết này"),
    CANNOT_VIEW_ACCOUNT(
            HttpStatus.FORBIDDEN,
            "CANNOT_VIEW_ACCOUNT",
            "Bạn không thể xem thông tin người dùng này"
    ),
    ;


    private final HttpStatus httpStatus;
    private final String code;
    private final String message;

    ErrorCode(HttpStatus httpStatus, String code, String message) {
        this.httpStatus = httpStatus;
        this.code = code;
        this.message = message;
    }

    public HttpStatus getHttpStatus() {
        return httpStatus;
    }

    public String getCode() {
        return code;
    }

    public String getMessage() {
        return message;
    }
}
