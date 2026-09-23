package com.productapp.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;
import com.productapp.entity.Payment;

import java.util.List;
import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
	List<Payment> findAllByCustomerIdAndIsActiveTrueOrderByPaymentDateDesc(Long customerId);

	Optional<Payment> findByInvoiceIdAndIsActiveTrue(Long invoiceId);

	@EntityGraph(attributePaths = {"customer", "createdBy", "invoice"})
	List<Payment> findAllByIsActiveTrue();

	@EntityGraph(attributePaths = {"customer", "createdBy", "invoice"})
	Optional<Payment> findByIdAndIsActiveTrue(Long id);
}
