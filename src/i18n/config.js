import i18n  from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import {CONTACT_EMAIL} from "../constants/settings";

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        fallbackLng: "vi",
        interpolation: {
            escapeValue: false
        },
        resources: {
            en: {
                translation: {
                    //Header
                    common_formPlaceholder_search: "Search...",
                    post: "Post",
                    notifications: "Notifications",
                    noNotifications: "No new notifications",
                    profile: "Profile",
                    logout: "Log out",

                    //Common Errors
                    ERROR_handleInvalid: "Don’t forget to fill this in.",
                    ERROR_unknownError: "Hmm, something weird just happened… I’m not quite sure what it is yet.",

                    // Login Pages
                        // UI
                    login: "Sign in",
                    email: "Email Address",
                    password: "Password",
                    forgotPassword: "Forgot your password?",
                    loginSubmit: "Log in",
                    notAMember: "Don’t have an account yet?",
                    signupInvite: "Let me help you get set up!",
                        // Error
                    ERROR_LOGIN_nullEmail: "Don't forget to fill in your email, my friend.",
                    ERROR_LOGIN_nullPassword: "Wait… what was your password again? ‘Open sesame’, was it?",
                    ERROR_LOGIN_wrongLogin: "Hey, looks like the login info you sent me is a bit off somewhere. Mind double-checking it?",
                    ERROR_LOGIN_notVerifiedEmail: "I’ve sent you an email, mind giving it a quick look before we go ahead and set up your account?",
                    ERROR_LOGIN_accountLocked: "Oops, looks like your account is currently under a little review. I just need to check a few things to help keep our shared space nice and comfy. Could you drop me a message at "+CONTACT_EMAIL+" so I can help you sort it out?",
                    ERROR_LOGIN_accountDeactivated: "Just a little heads-up, it’s been {{daysDeactivated}} days since you decided to deactivate your account. If things stay that way for 30 days, we might have to say a real goodbye. But hey, if you change your mind, you can always hop back in and undo it!",
                        //Success
                    welcome: "Hi {{displayName}}!",

                    //Reset Password Pages
                    resetPassword: "Reset Password",
                    emailNotExist: ""
                }
            },
            vi:{
                translation: {
                    
                    //Global Errors
                        //Lỗi Input
                    ERROR_handleInputEmpty: "Đừng quên điền chỗ này nhé.",
                    ERROR_handleInputWrongPattern: "Nhìn sai sai pattern ơ nhờ blah",
                    ERROR_handleInputWrongType: "Lộn kiểu dữ liệu rồi blah.",
                    ERROR_handleInputTooShort: "Ngắn quá!!!! blah",
                    ERROR_handleInputTooLong: "Dài quá!!!! blah",
                    ERROR_handleInputRangeUnderflow: "Số chi mà nhỏ xí blah.",
                    ERROR_handleInputRangeOverflow: "Số chi mà to đùng blah",
                    ERROR_handleInputStepMismatch: "Kêu nhập số nguyên mà đi nhập số thực blah",
                    ERROR_handleInputBadInput: "Nhập cái chi mà không quy đổi ra số được luôn??? blah",
                    ERROR_handleInputInvalid: "Lỗi méo chi chả hiểu nữa! blah",
                        //Lỗi chung khác
                    ERROR_unknownError: "Có lỗi gì đó lạ lắm, mình cũng chưa biết là gì nữa...",
                    ERROR_401: "Phiên đăng nhập hết hạn blah",
                    ERROR_403_title: "Tài khoản không có quyền vô đây, cook blah",
                    ERROR_403_desc: "Tài khoản không có quyền vô đây, cook, blah blah",
                    ERROR_422_title: "Tài khoản bị xích blah",
                    ERROR_422_desc: "Tài khoản ni vừa bị khóa blah",
                    ERROR_500_title: "Hệ thống bảo trì blah",
                    ERROR_500_desc: "Hệ thống hiện đang bảo trì blah",
                    
                    //Input things
                    common_input_label_optional: "(không bắt buộc)",

                    //Age Status Modal
                    common_ageStatus_modalTitle: "Ây yo hỏi tuổi cái blah",
                    common_ageStatus_modalDesc: "Chọn dưới 18 thì sẽ blur mấy ảnh 18+ đi, mà tắt cái modal ni thì tí hắn hỏi lại đó blah",
                    common_ageStatus_modalButton_under18: "Em chưa 18",
                    common_ageStatus_modalButton_above18: "Mình đủ 18 rồi",

                    //Header
                    common_headerPlaceholder_search: "Tìm kiếm...",
                    common_headerButton_post: "Đăng bài",
                    common_headerButton_verify: "Xác thực ảnh",
                    common_headerTitle_notifications: "Thông báo",
                    common_headerButton_user: "Trang của tôi",
                    common_headerButton_profile: "Chỉnh sửa hồ sơ",
                    common_headerButton_login: "Đăng nhập",
                    common_headerButton_logout: "Đăng xuất",
                    
                    //Notification things
                    common_headerDesc_noNotifications: "Không có thông báo mới blah",
                    common_notificationTitle_typeTheoDoi: "Có người theo dõi mới này blah",
                    common_notificationTitle_typeCmt: "Có bình luận mới này blah",
                    common_notificationTitle_typeCmtRep: "Có ai trả lời bình luận này blah",
                    common_notificationTitle_typeBaoCao: "Bài viết làm ai buồn này blah",
                    common_notificationDesc_typeTheoDoi: "mới theo dõi bạn luôn ơ blah",
                    common_notificationDesc_typeCmt: "mới có bình luận chi ơ này blah",
                    common_notificationDesc_typeCmtRep: "mới được ai trả lời chi nơi ơ này blah",
                    common_notificationDesc_typeBaoCao: "làm ai đó hơi bị khó chịu xong họ báo cáo blah",

                    //Footer
                    common_footerDesc_eyesonly: "Cộng đồng tranh ảnh tạo ra bởi hai đứa sinh viên ngầu quãi đạn.",
                    common_footerButton_about: "Về chúng mình",
                    common_footerButton_privacy: "Quyền riêng tư",
                    common_footerButton_terms: "Điều khoản",

                    //Security
                    common_security_catSentinel_dialogue: "Vuốt ve em {{remaningPets}} cái nữa đi!",


                    //Signup Page
                        // Common
                    signup_title_signup: "Đăng ký",
                    signup_formLabel_email: "Địa chỉ Email",
                    signup_formLabel_tenHienThi: "Tên của bạn",
                    signup_formPlaceholder_tenHienThi: "Nguyễn An, Lê Bình, ...",
                    signup_formLabel_username: "Username",
                    signup_formPlaceholder_username: "su_gia_bong_dem, caubephepthuat123, ...",
                    signup_formHelperText_username: "Chỉ dùng chữ thường, số và dấu gạch dưới thôi nha. Không đụng hàng lại càng ngầu!",
                    signup_formLabel_password: "Mật khẩu",
                    signup_formHelperText_password: "Bạn dùng mật khẩu từ 6 ký tự trở lên để mọi thứ an toàn hơn nhé.",
                    signup_formButton_nextStep: "Tiếp tục",
                    signup_formButton_prevStep: "Quay lại",
                    signup_formButton_signupSubmit: "Đăng ký",
                    signup_text_isAMember: "Bạn đã có tài khoản?",
                    signup_button_toLoginPage: "Mình sẽ giúp bạn đăng nhập blah!",
                    signup_text_success_signup: "ĐĂNG KÝ THÀNH CÔNG!",

                        //Handle Signup
                    signup_handleSignup_input_error_nullEmail: "Email bị để trống blah",
                    signup_handleSignup_input_error_typeMismatchEmail: "Đây kph email blah",
                    signup_handleSignup_input_error_emailTooLong: "Email quá dài blah",
                    signup_handleSignup_input_error_emailAlreadyExist: "Có người xài email ni rồi blah",
                    signup_handleSignup_input_error_tenHienThiTooLong: "Tên chi dài rứa blah",
                    signup_handleSignup_input_error_nullUsername: "Username bị để trống blah",
                    signup_handleSignup_input_error_usernameWrongPattern: "Username khôgn được đặt ri blah",
                    signup_handleSignup_input_error_usernameTooLong: "username quá dài blah",
                    signup_handleSignup_input_error_usernameAlreadyExist: "Có người xài username ni rồi blah",
                    signup_handleSignup_input_error_nullPassword: "Mật khẩu để trống tề blah",
                    signup_handleSignup_input_error_passwordTooShort: "Mật khẩu chỉ cần từ 6 ký tự trở lên thôi là được rồi.",
                    signup_handleSignup_input_error_passwordTooLong: "Mật khẩu dưới 32 blah.",
                    signup_handleSignup_helper_success_signup: "Trông ok vãi lúa blah",

                        //Handle Verify Account
                    signup_handleVerifyAccount_modalTitle_accountUnverified: "Chỉ còn một bước thôi blah",
                    signup_handleVerifyAccount_modalDesc_accountUnverified: "Mình cần gửi một mã xác thực đến email {{email}} bạn vừa đăng ký trước khi chúng ta tạo tài khoản blah.",
                    signup_handleVerifyAccount_modalButton_sendVerifyCode: "Gửi mã xác thực",
                    signup_handleVerifyAccount_modalTitle_enterVerifyCode: "Nhập mã xác thực blah",
                    signup_handleVerifyAccount_modalDesc_enterVerifyCode: "Nhập mã xác thực vô đây blah",
                    signup_handleVerifyAccount_modalButton_resendVerifyCode: "Gửi lại mã",
                    signup_handleVerifyAccount_modalButton_verifyAccount: "Xác thực blah",
                    signup_handleVerifyAccount_input_error_nullVerifyCode: "Mã xác thực để trống tề blah",
                    signup_handleVerifyAccount_helper_error_verifyCodeNotExpired: "Mã otp chưa hết hạn tề blah blah",
                    signup_handleVerifyAccount_helper_error_wrongVerifyCode: "Mã otp sai bét tề blah blah",
                    signup_handleVerifyAccount_helper_success_resendVerifyCode: "Gửi mã thành công blah",
                    signup_handleVerifyAccount_modalTitle_success_accountVerified: "Tài khoản xác thực thành công blah blah",
                    signup_handleVerifyAccount_modalDesc_success_accountVerified: "Tài khoản đã xác thực ok rồi blah blah",
                    signup_handleVerifyAccount_modalButton_success_accountVerified: "Đăng nhập luôn blah",


                    // Login Page
                        // Common
                    login_title_login: "Đăng nhập",
                    login_formLabel_email: "Địa chỉ Email",
                    login_formLabel_password: "Mật khẩu",
                    login_formButton_forgotPassword: "Quên mật khẩu sao?",
                    login_formButton_loginSubmit: "Đăng nhập",
                    login_text_notAMember: "Bạn chưa có tài khoản?",
                    login_button_toSignupPage: "Mình sẽ giúp bạn đăng ký!",

                        // Handle Reset Password
                    login_handleResetPassword_modalTitle_enterEmail: "Cấp lại mk blah",
                    login_handleResetPassword_modalDesc_enterEmail: "Nhập email đã đăng ký vô đây blah blah",
                    login_handleResetPassword_modalButton_sendOTP: "Nhận mã",
                    login_handleResetPassword_input_error_nullEmail: "Trống email blah",
                    login_handleResetPassword_input_error_typeMismatchEmail: "Không phải email blah",
                    login_handleResetPassword_helper_error_emailNotExist: "Email không có trong CSDL blah",
                    login_handleResetPassword_modalTitle_enterOTP: "Nhập cái OTP blah",
                    login_handleResetPassword_modalDesc_enterOTP: "Mã OTP gửi qua email {{email}} rồi ơ, nhập 6 cái số vô blah",
                    login_handleResetPassword_modalButton_resendOTP: "Gửi lại mã",
                    login_handleResetPassword_modalButton_resetPassword: "Cấp lại mật khẩu",
                    login_handleResetPassword_input_error_nullOTP: "OTP mà để trống rứa đó ơ hớ? blah",
                    login_handleResetPassword_helper_error_otpNotExpired: "mã otp chưa hết hạn blah",
                    login_handleResetPassword_helper_error_wrongOTP: "Mã xác thực sai blah",
                    login_handleResetPassword_helper_success_resendOTP: "Gửi mã thành công blah",
                    login_handleResetPassword_modalTitle_success_resetPassword: "Đã cấp lại mk ok blah",
                    login_handleResetPassword_modalDesc_success_resetPassword: "Đã gửi mk mới tới email, dùng đăng nhập đê blah",

                        // Handle Verify Account
                    login_handleVerifyAccount_modalTitle_accountUnverified: "Tài khoản chưa được xác thực",
                    login_handleVerifyAccount_modalDesc_accountUnverified: "Mình cần gửi một mã xác thực đến email {{email}} của bạn trước khi chúng ta đăng nhập vào tài khoản.",
                    login_handleVerifyAccount_modalButton_sendVerifyCode: "Gửi mã xác thực",
                    login_handleVerifyAccount_modalTitle_enterVerifyCode: "Nhập mã xác thực blah",
                    login_handleVerifyAccount_modalDesc_enterVerifyCode: "Nhập mã xác thực vô đây blah",
                    login_handleVerifyAccount_modalButton_resendVerifyCode: "Gửi lại mã",
                    login_handleVerifyAccount_modalButton_verifyAccount: "Xác thực blah",
                    login_handleVerifyAccount_input_error_nullVerifyCode: "Mã xác thực để trống tề blah",
                    login_handleVerifyAccount_helper_error_verifyCodeNotExpired: "Mã otp chưa hết hạn tề blah blah",
                    login_handleVerifyAccount_helper_error_wrongVerifyCode: "Mã otp sai bét tề blah blah",
                    login_handleVerifyAccount_helper_success_resendVerifyCode: "Gửi mã thành công blah",
                    login_handleVerifyAccount_modalTitle_success_accountVerified: "Tài khoản xác thực thành công blah blah",
                    login_handleVerifyAccount_modalDesc_success_accountVerified: "Tài khoản đã xác thực ok rồi blah blah",
                    
                        // Handle Login
                    login_handleLogin_input_error_nullEmail: "Quên điền email rồi kìa, bạn hiền.",
                    login_handleLogin_input_error_typeMismatchEmail: "Trông nó có vẻ không giống cái email ấy nhỉ? blah",
                    login_handleLogin_input_error_nullPassword: "Từ đã... mật khẩu của bạn là gì ấy nhỉ? 'Vừng ơi mở ra' à?",
                    login_handleLogin_helper_error_wrongLogin: "Ấy, hình như thông tin bị lệch đâu đó rồi. Xem lại thử coi nha?",
                    login_handleLogin_modalTitle_accountLocked: "Tài khoản đang tạm thời chưa sử dụng được",
                    login_handleLogin_modalDesc_accountLocked: "Ối, có vẻ tài khoản của bạn hiện đang được xem xét. Mình cần kiểm tra vài hoạt động để giúp đảm bảo không gian chung trở nên dễ chịu hơn. Bạn hãy liên hệ mình qua email "+CONTACT_EMAIL+" để được mình hỗ trợ nha.",
                    login_handleLogin_modalTitle_accountDeactivated: "Tài khoản hiện đang trong trạng thái vô hiệu hóa blah",
                    login_handleLogin_modalDesc_accountDeactivated: "Mình muốn nhắc rằng đã {{daysDeactivated}} ngày rồi kể từ khi bạn quyết định vô hiệu hóa tài khoản. Nếu cứ thế này tròn 30 ngày thì chúng ta buộc phải nói lời tạm biệt đó. Nhưng nè, bạn đổi ý thì cứ tự nhiên chỉnh lại nhé!",
                    login_handleLogin_helper_success_login: "Chào, {{tenHienThi}}!",



                    // Home Page
                        //Common
                    home_heroSectionTitle: "Hôm nay bạn muốn xem gì?",
                    home_heroSectionDesc: "Cùng khám phá một góc nhỏ của kho tàng nghệ thuật nhân loại nào! blah",
                    home_heroSectionFormPlaceholder: "Thử nhập thẻ tag, tên bài viết, mô tả hay tên tác giả xem... blah",
                    home_postSection_title_randomSection: "Khám phá ngẫu hứng blah",
                    home_postSection_desc_randomSection: "Cái ni lên random chơ không theo cái thứ tự mô hết blah",
                    }
            }
        }
    });

export default i18n;