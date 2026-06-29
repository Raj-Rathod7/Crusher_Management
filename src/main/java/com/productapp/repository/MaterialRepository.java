package com.productapp.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.productapp.entity.MaterialType;

public interface MaterialRepository extends JpaRepository<MaterialType, Long> {
}
