package com.productapp.dto;

import com.productapp.entity.MaterialType;

import java.time.LocalDateTime;

public class MaterialResponse {
    private Long id;
    private String name;
    private Boolean isActive;
    private LocalDateTime createdAt;

    public MaterialResponse() {
    }

    public MaterialResponse(Long id, String name, Boolean isActive, LocalDateTime createdAt) {
        this.id = id;
        this.name = name;
        this.isActive = isActive;
        this.createdAt = createdAt;
    }

    public static MaterialResponse fromEntity(MaterialType materialType) {
        if (materialType == null) {
            return null;
        }

        return new MaterialResponse(
                materialType.getId(),
                materialType.getName(),
                materialType.getIsActive(),
                materialType.getCreatedAt()
        );
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
