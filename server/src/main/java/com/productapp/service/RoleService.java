package com.productapp.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.productapp.dto.RoleResponse;
import com.productapp.entity.Role;
import com.productapp.exceptions.ResourceNotFoundException;
import com.productapp.repository.RoleRepository;

@Service
public class RoleService {

    private final RoleRepository roleRepository;

    public RoleService(RoleRepository roleRepository) {
        this.roleRepository = roleRepository;
    }

    public RoleResponse save(Role role) {
        return RoleResponse.fromEntity(roleRepository.save(role));
    }

    public List<RoleResponse> getAll() {
        return roleRepository.findAll().stream()
                .map(RoleResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public RoleResponse getById(Long id) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Role not found with id : " + id));
        return RoleResponse.fromEntity(role);
    }

    public RoleResponse update(Long id, Role role) {
        Role existing = roleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Role not found with id : " + id));

        existing.setRoleName(role.getRoleName());
        existing.setDescription(role.getDescription());
        existing.setIsActive(role.getIsActive());

        return RoleResponse.fromEntity(roleRepository.save(existing));
    }

    public void delete(Long id) {
        Role existing = roleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Role not found with id : " + id));
        roleRepository.delete(existing);
    }
}