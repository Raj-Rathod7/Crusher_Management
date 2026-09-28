package com.productapp.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.productapp.dto.RoleResponse;
import com.productapp.entity.Role;
import com.productapp.service.RoleService;

@RestController
@RequestMapping("/roles")
@PreAuthorize("hasRole('ADMIN')")
public class RoleController {

    private final RoleService roleService;

    public RoleController(RoleService roleService) {
        this.roleService = roleService;
    }

    @PostMapping
    public RoleResponse create(@RequestBody Role role) {
        return roleService.save(role);
    }

    @GetMapping("/users")
    public List<RoleResponse> getAll() {
        return roleService.getAll();
    }

    @GetMapping("/page")
    public Page<RoleResponse> getPage(Pageable pageable) {
        return roleService.getPage(pageable);
    }

    @GetMapping("/{id}")
    public RoleResponse getById(@PathVariable Long id) {
        return roleService.getById(id);
    }
}