package com.productapp.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.productapp.entity.Customer;

public interface CustomerRepository extends JpaRepository<Customer, Long> {
}
