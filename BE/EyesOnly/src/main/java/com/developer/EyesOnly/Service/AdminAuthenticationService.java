package com.developer.EyesOnly.Service;

import com.developer.EyesOnly.DTO.Request.AdminLoginRequest;
import com.developer.EyesOnly.DTO.Response.AdminLoginResponse;
import com.developer.EyesOnly.Entity.Admin;
import com.developer.EyesOnly.Exception.AppException;
import com.developer.EyesOnly.Exception.ErrorCode;
import com.developer.EyesOnly.Repository.AdminRepository;
import com.nimbusds.jose.*;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jwt.*;
import lombok.RequiredArgsConstructor;
import lombok.experimental.NonFinal;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;

@Service
@RequiredArgsConstructor
public class AdminAuthenticationService {

    private final AdminRepository adminRepository;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @NonFinal
    @Value("${jwt.signerKey}")
    protected String SIGNER_KEY;
    @Transactional(readOnly = true)
    public AdminLoginResponse login(AdminLoginRequest request) {

        /*
         * Validate AdminID rỗng.
         */
        if (request.getAdminID() == null || request.getAdminID().trim().isEmpty()) {
            throw new AppException(ErrorCode.ADMIN_ID_BLANK);
        }

        /*
         * Validate mật khẩu rỗng.
         */
        if (request.getPassword() == null || request.getPassword().trim().isEmpty()) {
            throw new AppException(ErrorCode.ADMIN_PASSWORD_BLANK);
        }

        String adminID = request.getAdminID().trim();

        /*
         * Tìm admin theo AdminID.
         * Vì AdminID là khóa chính nên dùng findById().
         */
        Admin admin = adminRepository.findById(adminID)
                .orElseThrow(() ->
                        new AppException(ErrorCode.ADMIN_LOGIN_FAILED)
                );

        /*
         * So sánh mật khẩu nhập vào với mật khẩu BCrypt trong DB.
         */
        boolean passwordMatched = passwordEncoder.matches(
                request.getPassword(),
                admin.getPassword()
        );

        if (!passwordMatched) {
            throw new AppException(ErrorCode.ADMIN_LOGIN_FAILED);
        }

        String token = generateAdminToken(admin);

        Integer roleID = admin.getVaiTro() == null
                ? null
                : admin.getVaiTro().getRoleID();

        String vaiTro = admin.getVaiTro() == null
                ? null
                : admin.getVaiTro().getVaiTro();

        return AdminLoginResponse.builder()
                .adminID(admin.getAdminID())
                .adminName(admin.getAdminName())
                .roleID(roleID)
                .vaiTro(vaiTro)
                .token(token)
                .build();
    }

    private String generateAdminToken(Admin admin) {
        try {
            /*
             * Header dùng thuật toán HS512.
             */
            JWSHeader header = new JWSHeader(JWSAlgorithm.HS512);

            Instant now = Instant.now();

            Integer roleID = admin.getVaiTro() == null
                    ? null
                    : admin.getVaiTro().getRoleID();

            String roleName = admin.getVaiTro() == null
                    ? null
                    : admin.getVaiTro().getVaiTro();

            /*
             * subject = AdminID.
             * type = ADMIN để JwtFilter phân biệt token admin và user thường.
             */
            JWTClaimsSet claimsSet = new JWTClaimsSet.Builder()
                    .subject(admin.getAdminID())
                    .claim("type", "ADMIN")
                    .claim("adminID", admin.getAdminID())
                    .claim("roleID", roleID)
                    .claim("roleName", roleName)
                    .issueTime(Date.from(now))
                    .expirationTime(Date.from(now.plus(3, ChronoUnit.HOURS)))
                    .build();

            Payload payload = new Payload(claimsSet.toJSONObject());

            JWSObject jwsObject = new JWSObject(header, payload);

            jwsObject.sign(new MACSigner(SIGNER_KEY.getBytes()));

            return jwsObject.serialize();

        } catch (Exception e) {
            throw new AppException(ErrorCode.ADMIN_TOKEN_CREATE_FAILED);
        }
    }
}