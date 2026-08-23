package com.productapp.repository;

import com.productapp.entity.Categories;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CategoryRepository extends JpaRepository<Categories, Long> {

    Optional<Categories> findByIdAndIsActiveTrue(Long id);
}