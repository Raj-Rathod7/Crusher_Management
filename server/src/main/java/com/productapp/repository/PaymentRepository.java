package com.productapp.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.productapp.entity.Payment;

import java.util.List;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
	List<Payment> findAllByCustomerIdAndIsActiveTrueOrderByPaymentDateDesc(Long customerId);
}
