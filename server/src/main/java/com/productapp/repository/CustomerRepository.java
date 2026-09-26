package com.productapp.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;

import com.productapp.entity.Customer;

import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface CustomerRepository extends JpaRepository<Customer, Long> {

	List<Customer> findAllByIsActiveTrueOrderByCreatedAtDesc();

	Optional<Customer> findByIdAndIsActiveTrue(Long id);

	Page<Customer> findAllByIsActiveTrueOrderByCreatedAtDesc(Pageable pageable);

	long countByIsActiveTrue();

	@Lock(LockModeType.PESSIMISTIC_WRITE)
	@Query("select c from Customer c where c.id = :id")
	Optional<Customer> findByIdForUpdate(@Param("id") Long id);
}
