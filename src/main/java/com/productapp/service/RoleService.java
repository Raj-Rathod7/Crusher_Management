package com.productapp.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.productapp.entity.Role;
import com.productapp.exceptions.ResourceNotFoundException;
import com.productapp.repository.RoleRepository;

@Service
public class RoleService {

    private final RoleRepository roleRepository;

    public RoleService(RoleRepository roleRepository) {
        this.roleRepository = roleRepository;
    }

    public Role save(Role role) {
        return roleRepository.save(role);
    }

    public List<Role> getAll() {
        return roleRepository.findAll();
    }

    public Role getById(Long id) {

        return roleRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Role not found with id : " + id));
    }
    public Role update(Long id, Role role) {

        Role existing = getById(id);

        existing.setRoleName(role.getRoleName());
        existing.setDescription(role.getDescription());
        existing.setIsActive(role.getIsActive());

        return roleRepository.save(existing);
    }

    public void delete(Long id) {

        Role existing = getById(id);

        roleRepository.delete(existing);
    }
}