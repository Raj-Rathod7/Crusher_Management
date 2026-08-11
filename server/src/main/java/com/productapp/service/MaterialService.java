package com.productapp.service;

import com.productapp.dto.MaterialResponse;
import com.productapp.entity.MaterialType;
import com.productapp.exceptions.ResourceNotFoundException;
import com.productapp.repository.MaterialRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class MaterialService {

    private final MaterialRepository materialRepository;

    public MaterialService(MaterialRepository materialRepository) {
        this.materialRepository = materialRepository;
    }

    public MaterialResponse save(MaterialType materialType) {
        return MaterialResponse.fromEntity(materialRepository.save(materialType));
    }

    public List<MaterialResponse> getAll() {
        return materialRepository.findAll().stream()
                .map(MaterialResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public MaterialResponse getById(Long id) {
        MaterialType materialType = materialRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Material not found with id : " + id));
        return MaterialResponse.fromEntity(materialType);
    }

    public void delete(Long id) {
        MaterialType materialType = materialRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Material not found with id : " + id));
        materialRepository.delete(materialType);
    }
}
