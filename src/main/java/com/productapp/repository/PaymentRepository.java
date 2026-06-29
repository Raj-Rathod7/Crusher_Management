package com.productapp.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.productapp.entity.Payment;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
}
