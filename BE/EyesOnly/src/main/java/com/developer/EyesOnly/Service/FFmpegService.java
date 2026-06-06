package com.developer.EyesOnly.Service;

import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.util.UUID;

@Service
public class FFmpegService {

    /**
     * Tạo video từ ảnh bằng FFmpeg
     *
     * @param inputImagePath đường dẫn ảnh gốc
     * @param outputDir thư mục output
     * @return đường dẫn video
     */
    public String createVideoFromImage(String inputImagePath, String outputDir) {
        try {
            // tạo tên file random
            String outputFileName = UUID.randomUUID() + ".mp4";
            String outputPath = outputDir + File.separator + outputFileName;

            // command FFmpeg
            ProcessBuilder processBuilder = new ProcessBuilder(
                    "ffmpeg",
                    "-y", // overwrite
                    "-loop", "1", // lặp ảnh
                    "-i", inputImagePath,
                    "-t", "3", // duration 3s
                    "-vf",
                    // noise + watermark text
                    "noise=alls=20:allf=t+u,drawtext=text='Protected Preview':fontcolor=white@0.3:x=10:y=H-th-10",
                    "-pix_fmt", "yuv420p",
                    outputPath
            );

            processBuilder.redirectErrorStream(true);

            Process process = processBuilder.start();

            int exitCode = process.waitFor();

            if (exitCode != 0) {
                throw new RuntimeException("FFmpeg xử lý thất bại");
            }

            return outputPath;

        } catch (IOException | InterruptedException e) {
            throw new RuntimeException("Lỗi khi chạy FFmpeg", e);
        }
    }
}