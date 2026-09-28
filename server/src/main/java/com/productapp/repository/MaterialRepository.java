package com.productapp.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.productapp.entity.MaterialType;
import com.productapp.entity.MaterialUsageType;

import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface MaterialRepository extends JpaRepository<MaterialType, Long> {

	List<MaterialType> findAllByIsActiveTrueOrderByCreatedAtDesc();

	List<MaterialType> findAllByTypeAndIsActiveTrueOrderByCreatedAtDesc(MaterialUsageType type);

	Optional<MaterialType> findByIdAndIsActiveTrue(Long id);

	Page<MaterialType> findAllByIsActiveTrueOrderByCreatedAtDesc(Pageable pageable);
}
