package com.developer.EyesOnly.Repository;

import com.developer.EyesOnly.Entity.Admin;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AdminRepository extends JpaRepository<Admin, String> {
    /*
     * Lấy danh sách admin ngoại trừ admin đang đăng nhập.
     *
     * @EntityGraph(attributePaths = {"vaiTro"})
     * giúp lấy luôn Role/VaiTro để tránh lỗi lazy loading
     * khi service gọi admin.getVaiTro().getVaiTro().
     */
    @EntityGraph(attributePaths = {"vaiTro"})
    Page<Admin> findByAdminIDNot(String currentAdminID, Pageable pageable);

    /*
     * Kiểm tra AdminID đã tồn tại hay chưa.
     * Dùng khi tạo tài khoản admin mới.
     */
    boolean existsByAdminID(String adminID);
    // lấy về admin theo adminID đã truyền vào
    /*
     * Lấy admin theo AdminID.
     * @EntityGraph giúp lấy luôn vaiTro để tránh lỗi lazy loading.
     */
    @EntityGraph(attributePaths = {"vaiTro"})
    Optional<Admin> findByAdminID(String adminID);
}