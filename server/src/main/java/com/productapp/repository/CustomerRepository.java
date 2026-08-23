package com.productapp.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.productapp.entity.Customer;

import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface CustomerRepository extends JpaRepository<Customer, Long> {

	List<Customer> findAllByIsActiveTrue();

	Optional<Customer> findByIdAndIsActiveTrue(Long id);

	Page<Customer> findAllByIsActiveTrue(Pageable pageable);

	long countByIsActiveTrue();
}
