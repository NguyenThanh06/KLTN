package com.developer.EyesOnly.Security;

import com.nimbusds.jose.*;
import com.nimbusds.jose.crypto.*;
import com.nimbusds.jwt.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.text.ParseException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;

@Component
public class JwtUtil {

    @Value("${jwt.signerKey}")
    private String SIGNER_KEY;

    public String generateToken(String email) {
        try {
            JWSHeader header = new JWSHeader(JWSAlgorithm.HS512);

            JWTClaimsSet claimsSet = new JWTClaimsSet.Builder()
                    .subject(email)
                    .issuer("eyesonly")
                    .issueTime(new Date())
                    .expirationTime(new Date(
                            Instant.now().plus(1, ChronoUnit.HOURS).toEpochMilli()
                    ))
                    .build();

            Payload payload = new Payload(claimsSet.toJSONObject());
            JWSObject jwsObject = new JWSObject(header, payload);

            jwsObject.sign(new MACSigner(SIGNER_KEY.getBytes()));

            return jwsObject.serialize();
        } catch (Exception e) {
            throw new RuntimeException("Cannot generate token", e);
        }
    }

    public String extractUsername(String token) throws ParseException {
        SignedJWT jwt = SignedJWT.parse(token);
        return jwt.getJWTClaimsSet().getSubject();
    }

    public boolean validateToken(String token) {
        try {
            SignedJWT jwt = SignedJWT.parse(token);

            JWSVerifier verifier = new MACVerifier(SIGNER_KEY.getBytes());

            boolean valid = jwt.verify(verifier);

            Date expiry = jwt.getJWTClaimsSet().getExpirationTime();

            return valid && expiry.after(new Date());

        } catch (Exception e) {
            return false;
        }
    }
}