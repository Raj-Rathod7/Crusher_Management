package com.productapp.service;

import com.productapp.dto.MaterialResponse;
import com.productapp.entity.MaterialType;
import com.productapp.exceptions.ResourceNotFoundException;
import com.productapp.repository.MaterialRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class MaterialService {

    private final MaterialRepository materialRepository;

    public MaterialService(MaterialRepository materialRepository) {
        this.materialRepository = materialRepository;
    }

    @Transactional
    public MaterialResponse save(MaterialType materialType) {
        return MaterialResponse.fromEntity(materialRepository.save(materialType));
    }

    public List<MaterialResponse> getAll() {
        return materialRepository.findAllByIsActiveTrue().stream()
                .map(MaterialResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public Page<MaterialResponse> getPage(Pageable pageable) {
        return materialRepository.findAllByIsActiveTrue(pageable).map(MaterialResponse::fromEntity);
    }

    public MaterialResponse getById(Long id) {
        MaterialType materialType = materialRepository.findById(id)
            .filter(foundMaterial -> Boolean.TRUE.equals(foundMaterial.getIsActive()))
                .orElseThrow(() -> new ResourceNotFoundException("Material not found with id : " + id));
        return MaterialResponse.fromEntity(materialType);
    }

    @Transactional
    public void delete(Long id) {
        MaterialType materialType = materialRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Material not found with id : " + id));
        materialType.setIsActive(false);
        materialRepository.save(materialType);
    }
}
