package com.developer.EyesOnly.Service;

import com.developer.EyesOnly.DTO.Request.ImageProtectionOptionRequest;
import com.developer.EyesOnly.Exception.AppException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;

@Service
@RequiredArgsConstructor
public class PythonProtectionService {

    @Value("${python.api.url}")
    private String pythonApiUrl;

    private final RestTemplate restTemplate;

    public byte[] protect(
            MultipartFile file,
            ImageProtectionOptionRequest option
    ) {
        try {

            MultiValueMap<String, Object> body =
                    new LinkedMultiValueMap<>();

            body.add(
                    "file",
                    new MultipartInputStreamFileResource(
                            file.getInputStream(),
                            file.getOriginalFilename()
                    )
            );

            body.add(
                    "frameCount",
                    option.getFrameCount()
            );

            body.add(
                    "noiseLevel",
                    option.getNoiseLevel()
            );

            body.add(
                    "colorCoverage",
                    option.getColorCoverage()
            );

            body.add(
                    "noiseMode",
                    option.getNoiseMode()
            );

            HttpHeaders headers =
                    new HttpHeaders();

            headers.setContentType(
                    MediaType.MULTIPART_FORM_DATA
            );

            HttpEntity<MultiValueMap<String, Object>>
                    request =
                    new HttpEntity<>(body, headers);

            ResponseEntity<byte[]> response =
                    restTemplate.exchange(
                            pythonApiUrl + "/protect",
                            HttpMethod.POST,
                            request,
                            byte[].class
                    );

            return response.getBody();

        } catch (Exception e) {
            throw new AppException(
                    "Không thể xử lý ảnh bằng Python: "
                            + e.getMessage()
            );
        }

    }
    public byte[] preview(
            MultipartFile file,
            ImageProtectionOptionRequest option
    ) {
        try {

            MultiValueMap<String, Object> body =
                    new LinkedMultiValueMap<>();

            body.add(
                    "file",
                    new MultipartInputStreamFileResource(
                            file.getInputStream(),
                            file.getOriginalFilename()
                    )
            );

            body.add(
                    "frameCount",
                    option.getFrameCount()
            );

            body.add(
                    "noiseLevel",
                    option.getNoiseLevel()
            );

            body.add(
                    "colorCoverage",
                    option.getColorCoverage()
            );

            body.add(
                    "noiseMode",
                    option.getNoiseMode()
            );

            HttpHeaders headers =
                    new HttpHeaders();

            headers.setContentType(
                    MediaType.MULTIPART_FORM_DATA
            );

            HttpEntity<MultiValueMap<String, Object>>
                    request =
                    new HttpEntity<>(body, headers);

            ResponseEntity<byte[]> response =
                    restTemplate.exchange(
                            pythonApiUrl + "/protect-preview",
                            HttpMethod.POST,
                            request,
                            byte[].class
                    );

            return response.getBody();

        } catch (Exception e) {
            throw new AppException(
                    "Không thể xử lý ảnh bằng Python: "
                            + e.getMessage()
            );
        }
    }

}
