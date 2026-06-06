package com.developer.EyesOnly.Security;

import com.nimbusds.jose.JWSVerifier;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@Component
public class JwtFilter extends OncePerRequestFilter {

    @Value("${jwt.signerKey}")
    private String SIGNER_KEY;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");

        /*
         * Nếu request không có Authorization header,
         * hoặc header không bắt đầu bằng "Bearer ",
         * thì bỏ qua filter này và cho request đi tiếp.
         */
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = authHeader.substring(7);

        try {
            SignedJWT signedJWT = SignedJWT.parse(token);

            JWSVerifier verifier = new MACVerifier(SIGNER_KEY.getBytes());

            /*
             * Kiểm tra chữ ký token.
             * Nếu token bị sửa hoặc sai secret key thì verify sẽ false.
             */
            if (!signedJWT.verify(verifier)) {
                filterChain.doFilter(request, response);
                return;
            }

            JWTClaimsSet claims = signedJWT.getJWTClaimsSet();

            Date expiryTime = claims.getExpirationTime();

            /*
             * Nếu token không có hạn sử dụng hoặc đã hết hạn,
             * thì không set SecurityContext.
             */
            if (expiryTime == null || !expiryTime.after(new Date())) {
                filterChain.doFilter(request, response);
                return;
            }

            /*
             * Nếu request trước đó đã được xác thực rồi,
             * thì không cần set lại authentication.
             */
            if (SecurityContextHolder.getContext().getAuthentication() != null) {
                filterChain.doFilter(request, response);
                return;
            }

            /*
             * Claim type dùng để phân biệt token thường và token admin.
             *
             * User token:
             * - type có thể null hoặc "USER"
             * - accountId = ID tài khoản user
             *
             * Admin token:
             * - type = "ADMIN"
             * - adminID = ID đăng nhập admin
             */
            String type = claims.getStringClaim("type");

            UsernamePasswordAuthenticationToken authentication;

            if ("ADMIN".equals(type)) {
                authentication = createAdminAuthentication(claims, request);
            } else {
                authentication = createUserAuthentication(claims, request);
            }

            if (authentication != null) {
                SecurityContextHolder.getContext().setAuthentication(authentication);
            }

        } catch (Exception e) {
            /*
             * Token lỗi thì không đăng nhập user/admin.
             * Không throw exception ở đây để tránh làm app bị crash.
             */
            System.out.println("JWT lỗi: " + e.getMessage());
        }

        filterChain.doFilter(request, response);
    }

    /*
     * Tạo Authentication cho user thường.
     *
     * Sau hàm này:
     * principal.getName() trong controller sẽ trả về accountId dạng String.
     */
    private UsernamePasswordAuthenticationToken createUserAuthentication(
            JWTClaimsSet claims,
            HttpServletRequest request
    ) {
        try {
            Long accountId = claims.getLongClaim("accountId");

            if (accountId == null) {
                return null;
            }

            List<SimpleGrantedAuthority> authorities = List.of(
                    new SimpleGrantedAuthority("ROLE_USER")
            );

            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(
                            accountId,
                            null,
                            authorities
                    );

            authentication.setDetails(
                    new WebAuthenticationDetailsSource().buildDetails(request)
            );

            return authentication;

        } catch (Exception e) {
            System.out.println("Không thể tạo authentication cho USER: " + e.getMessage());
            return null;
        }
    }

    /*
     * Tạo Authentication cho admin.
     *
     * Sau hàm này:
     * principal.getName() trong controller sẽ trả về adminID.
     *
     * Đồng thời gán quyền:
     * - ROLE_ADMIN: mọi admin đều có
     * - ROLE_HR: chỉ Quản lý nhân sự
     * - ROLE_MODERATOR: chỉ Kiểm duyệt viên
     * - ROLE_RESIGNED: admin đã nghỉ việc
     */
    private UsernamePasswordAuthenticationToken createAdminAuthentication(
            JWTClaimsSet claims,
            HttpServletRequest request
    ) {
        try {
            String adminID = claims.getStringClaim("adminID");

            if (adminID == null || adminID.isBlank()) {
                return null;
            }

            /*
             * roleName là vai trò admin đã được nhét vào token lúc login.
             *
             * Ví dụ roleName có thể là:
             * - QuanLyNhanSu
             * - KiemDuyetVien
             * - DaNghiViec
             */
            String roleName = claims.getStringClaim("roleName");

            List<SimpleGrantedAuthority> authorities = new ArrayList<>();

            /*
             * Quyền chung cho tất cả admin đã đăng nhập.
             *
             * Dùng cho:
             * - Hồ sơ của tôi
             * - Đổi mật khẩu admin
             */
            authorities.add(new SimpleGrantedAuthority("ROLE_ADMIN"));

            /*
             * Gán quyền riêng theo vai trò.
             */
            if (isHumanResourceRole(roleName)) {
                authorities.add(new SimpleGrantedAuthority("ROLE_HR"));
            }

            if (isModeratorRole(roleName)) {
                authorities.add(new SimpleGrantedAuthority("ROLE_MODERATOR"));
            }

            if (isResignedRole(roleName)) {
                authorities.add(new SimpleGrantedAuthority("ROLE_RESIGNED"));
            }

            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(
                            adminID,
                            null,
                            authorities
                    );

            authentication.setDetails(
                    new WebAuthenticationDetailsSource().buildDetails(request)
            );

            return authentication;

        } catch (Exception e) {
            System.out.println("Không thể tạo authentication cho ADMIN: " + e.getMessage());
            return null;
        }
    }
    /*
     * Kiểm tra role Quản lý nhân sự.
     *
     *để nhiều cách viết
     */
    private boolean isHumanResourceRole(String roleName) {
        if (roleName == null) {
            return false;
        }

        return roleName.equals("QuanLyNhanSu")
                || roleName.equals("Quản lý nhân sự")
                || roleName.equals("HR");
    }

    /*
     * Kiểm tra role Kiểm duyệt viên.
     */
    private boolean isModeratorRole(String roleName) {
        if (roleName == null) {
            return false;
        }

        return roleName.equals("KiemDuyetVien")
                || roleName.equals("Kiểm duyệt viên")
                || roleName.equals("KiemDuyetNoiDung")
                || roleName.equals("Kiểm duyệt nội dung")
                || roleName.equals("MODERATOR");
    }

    /*
     * Kiểm tra role Đã nghỉ việc.
     */
    private boolean isResignedRole(String roleName) {
        if (roleName == null) {
            return false;
        }

        return roleName.equals("DaNghiViec")
                || roleName.equals("Đã nghỉ việc")
                || roleName.equals("RESIGNED");
    }
    /*
     * Bean này chỉ cần nếu bạn vẫn có chỗ dùng oauth2ResourceServer().jwt().
     * Với JwtFilter tự custom như hiện tại, phần quan trọng nhất vẫn là doFilterInternal().
     */
    @Bean
    public JwtAuthenticationConverter jwtAuthenticationConverter() {
        JwtGrantedAuthoritiesConverter authoritiesConverter =
                new JwtGrantedAuthoritiesConverter();

        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
        converter.setJwtGrantedAuthoritiesConverter(authoritiesConverter);

        /*
         * Với user token, lấy accountId làm principal name.
         * Lưu ý: converter này không tự xử lý adminID.
         * Admin đang được xử lý trong doFilterInternal() phía trên.
         */
        converter.setPrincipalClaimName("accountId");

        return converter;
    }
}