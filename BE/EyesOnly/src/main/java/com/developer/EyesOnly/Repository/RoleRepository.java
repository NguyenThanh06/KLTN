package com.developer.EyesOnly.Repository;

import com.developer.EyesOnly.Entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RoleRepository extends JpaRepository<Role, Integer> {
}