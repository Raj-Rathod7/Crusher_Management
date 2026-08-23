package com.productapp.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.productapp.entity.MaterialType;

import java.util.List;
import java.util.Optional;

public interface MaterialRepository extends JpaRepository<MaterialType, Long> {

	List<MaterialType> findAllByIsActiveTrue();

	Optional<MaterialType> findByIdAndIsActiveTrue(Long id);
}
