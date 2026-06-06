package com.developer.EyesOnly.Service;

import com.developer.EyesOnly.DTO.Request.AccountCreationRequest;
import com.developer.EyesOnly.DTO.Request.AuthenticationRequest;
import com.developer.EyesOnly.DTO.Request.IntrospectRequest;
import com.developer.EyesOnly.DTO.Response.AuthenticationRespone;
import com.developer.EyesOnly.DTO.Response.IntrospectRespone;
import com.developer.EyesOnly.Exception.AppException;
import com.developer.EyesOnly.Exception.ErrorCode;
import com.developer.EyesOnly.Repository.UserRepository;
import com.nimbusds.jose.*;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Lazy;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.text.ParseException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.regex.Pattern;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AuthenticationService {
    @Autowired
    UserRepository userRepository;
    @Autowired ValidateService validateService;
    @Autowired
    @Lazy
    AccountService accountService;
    @NonFinal
    @Value("${jwt.signerKey}")
     protected String SIGNER_KEY;
    private static final Pattern EMAIL_PATTERN =
            Pattern.compile("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$");
    public IntrospectRespone introspectRespone( IntrospectRequest request) throws JOSEException, ParseException {
        var token = request.getToken();
        JWSVerifier verifier = new MACVerifier(SIGNER_KEY.getBytes());
        SignedJWT signedJWT = SignedJWT.parse(token);
        Date expityTime = signedJWT.getJWTClaimsSet().getExpirationTime();
        var verified = signedJWT.verify(verifier);
        return IntrospectRespone.builder()
                .valid(verified && expityTime.after(new Date()))
                .build();

    }

    public AuthenticationRespone authenticate(AuthenticationRequest request){
        if(request.getEmail()==null)
            throw new AppException(ErrorCode.EMAIL_NULL);
        if (!EMAIL_PATTERN.matcher(request.getEmail()).matches()) {
            throw new AppException(ErrorCode.EMAIL_NOT_AN_EMAIL);
        }
        var user = userRepository.findByEmail(request.getEmail());
        if (user == null)
            throw  new AppException(ErrorCode.USER_NOT_EXISTED);
        PasswordEncoder passwordEncoder = new BCryptPasswordEncoder(10);
        boolean authenticated =  passwordEncoder.matches(request.getPassword(),user.getPassword());
        if(!authenticated)
            throw new AppException(ErrorCode.WRONG_LOGIN);
        if (!user.getDaXacThuc()) {
            throw new AppException(ErrorCode.ACCOUNT_UNVERIFIED);
        }
        if(user.getBiKhoa())
            throw new AppException(ErrorCode.ACCOUNT_LOCKED);
        if(request.getPassword()==null)
            throw new AppException(ErrorCode.NULL_PASSWORD);
        var token = generateToken(request.getEmail(),user.getAccountID());
        return AuthenticationRespone.builder()
                .token(token)
                .accountID(user.getAccountID())
                .username(user.getUsername())
                .tenHienThi(user.getTenHienThi())
                .avatar(user.getAvatar())
                .authenticated(true)
                .daVoHieuHoa(Boolean.TRUE.equals(user.getDaVoHieuHoa()))
                .biKhoa(Boolean.TRUE.equals(user.getBiKhoa()))
                .build();
    }
    public String generateToken(String email, Long accountId){
        JWSHeader header = new JWSHeader(JWSAlgorithm.HS512);
        JWTClaimsSet jwtClamSet =  new JWTClaimsSet.Builder()
                .subject(email)
                .issuer("devteria.com")
                .issueTime(new Date())
                .expirationTime(new Date(Instant.now().plus(1, ChronoUnit.DAYS).toEpochMilli()))

                // thêm accountId
                .claim("accountId", accountId)

                .claim("customClaim","custom")
                .build();

        Payload payload = new Payload(jwtClamSet.toJSONObject());
        JWSObject jwsObject = new JWSObject(header,payload);

        try {
            jwsObject.sign(new MACSigner(SIGNER_KEY.getBytes()));
            return jwsObject.serialize();
        } catch (JOSEException e) {
            log.error("Can not create token",e);
            throw new RuntimeException(e);
        }
    }
}
