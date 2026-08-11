package com.productapp.dto;

import com.productapp.entity.Role;

public class RoleResponse {
    private Long id;
    private String roleName;
    private String description;
    private Boolean isActive;

    public RoleResponse() {
    }

    public RoleResponse(Long id, String roleName, String description, Boolean isActive) {
        this.id = id;
        this.roleName = roleName;
        this.description = description;
        this.isActive = isActive;
    }

    public static RoleResponse fromEntity(Role role) {
        if (role == null) {
            return null;
        }

        return new RoleResponse(
                role.getId(),
                role.getRoleName(),
                role.getDescription(),
                role.getIsActive()
        );
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getRoleName() {
        return roleName;
    }

    public void setRoleName(String roleName) {
        this.roleName = roleName;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }
}
