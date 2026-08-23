package com.productapp.controller;

import com.productapp.dto.MaterialResponse;
import com.productapp.entity.MaterialType;
import com.productapp.service.MaterialService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

@RestController
@RequestMapping("/materials")
public class MaterialController {

    private final MaterialService materialService;

    public MaterialController(MaterialService materialService) {
        this.materialService = materialService;
    }

    @PostMapping
    public MaterialResponse create(@RequestBody MaterialType materialType) {
        return materialService.save(materialType);
    }

    @GetMapping
    public List<MaterialResponse> getAll() {
        return materialService.getAll();
    }

    @GetMapping("/page")
    public Page<MaterialResponse> getPage(Pageable pageable) {
        return materialService.getPage(pageable);
    }

    @GetMapping("/{id}")
    public MaterialResponse getById(@PathVariable Long id) {
        return materialService.getById(id);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        materialService.delete(id);
    }
}
