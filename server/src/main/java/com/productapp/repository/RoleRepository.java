package com.productapp.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.productapp.entity.Role;

import java.util.Optional;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface RoleRepository extends JpaRepository<Role, Long> {

    Optional<Role> findByRoleName(String roleName);

    Optional<Role> findByRoleNameAndIsActiveTrue(String roleName);

    List<Role> findAllByIsActiveTrue();

    Page<Role> findAllByIsActiveTrue(Pageable pageable);
    
    

}