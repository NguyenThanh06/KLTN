package com.developer.EyesOnly.Security;

import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.*;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.*;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtFilter jwtFilter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests(auth -> auth

                        /*
                         * OPTIONS phải để gần đầu.
                         * Đây là preflight request của browser khi gọi PATCH/PUT/DELETE.
                         */
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                        /*
                         * Public routes.
                         */
                        .requestMatchers(
                                "/home/**",
                                "/auth/**",
                                "/account/**",
                                "/profile/**",
                                "/uploads/**",
                                "/posts/postDetail/**",
                                "/posts/search/**"
                        ).permitAll()
                        .requestMatchers(HttpMethod.GET, "/profile/{accountId:\\d+}").permitAll()
                        .requestMatchers("/account-setting/**", "/profile/me", "/profile/info").authenticated()
                        .requestMatchers(HttpMethod.POST, "/verify/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/verify/**").permitAll()
                        .requestMatchers("/validate/**").permitAll()
                        .requestMatchers("/uploads/avatars/**").permitAll()
                        /*
                         * Admin login không cần token.
                         */
                        .requestMatchers("/admin/auth/login").permitAll()

                        /*
                         * Hồ sơ admin: admin nào cũng dùng được.
                         * Bao gồm:
                         * GET /admin/account
                         * PATCH /admin/account/password
                         */
                        .requestMatchers("/admin/account/**").hasRole("ADMIN")

                        /*
                         * Dashboard nếu admin nào cũng xem được.
                         * Nếu bạn muốn chia riêng thì sửa sau.
                         */
                        .requestMatchers("/admin/dashboard").hasRole("ADMIN")

                        /*
                         * Quản lý nhân sự:
                         * Chỉ admin có role Quản lý nhân sự được dùng.
                         *
                         * Ví dụ:
                         * GET /admin/staff
                         * POST /admin/staff
                         * PATCH /admin/staff/{adminID}/role
                         */
                        .requestMatchers("/admin/staff/**").hasRole("HR")

                        /*
                         * Quản lý user:
                         * Chỉ kiểm duyệt viên được dùng.
                         *
                         * Ví dụ:
                         * POST /admin/users/search
                         * GET /admin/users/{accountId}
                         * PATCH /admin/users/{accountId}/unlock
                         */
                        .requestMatchers("/admin/users/**").hasRole("MODERATOR")

                        /*
                         * Quản lý post:
                         * Chỉ kiểm duyệt viên được dùng.
                         *
                         * Ví dụ:
                         * POST /admin/posts/search
                         * GET /admin/posts/{postId}
                         * PUT/PATCH /admin/posts/{postId}/change_status
                         */
                        .requestMatchers("/admin/posts/**").hasRole("MODERATOR")

                        /*
                         * Quản lý báo cáo post/user:
                         * Chỉ kiểm duyệt viên được dùng.
                         */
                        .requestMatchers("/admin/post-reports/**").hasRole("MODERATOR")
                        .requestMatchers("/admin/user-reports/**").hasRole("MODERATOR")

                        /*
                         * Các route user thường.
                         */
                        .requestMatchers("/account-setting/**", "/profile/me").authenticated()
                        .requestMatchers("/posts/**").authenticated()

                        /*
                         * Những API admin chưa khai báo rõ thì chặn lại cho an toàn.
                         */
                        .requestMatchers("/admin/**").denyAll()

                        .anyRequest().authenticated()
                )
                .exceptionHandling(exception -> exception
                        .authenticationEntryPoint((request, response, authException) -> {
                            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                            response.setContentType("application/json;charset=UTF-8");
                            response.getWriter().write("""
                        {"status":401,"code":"UNAUTHENTICATED","message":"Token không hợp lệ hoặc đã hết hạn"}
                    """);
                                })
                                .accessDeniedHandler((request, response, accessDeniedException) -> {
                                    response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                                    response.setContentType("application/json;charset=UTF-8");
                                    response.getWriter().write("""
                        {"status":403,"code":"ACCESS_DENIED","message":"Không có quyền truy cập"}
                    """);
                                })
                )
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    // 2. Định nghĩa chi tiết cấu hình CORS
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of("http://localhost:5173")); // URL của React
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE","PATCH", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type", "Cache-Control"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}