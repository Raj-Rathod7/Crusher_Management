package com.productapp.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;
import com.productapp.entity.Payment;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
	List<Payment> findAllByCustomerIdAndIsActiveTrueOrderByCreatedAtDesc(Long customerId);

	Optional<Payment> findByInvoiceIdAndIsActiveTrue(Long invoiceId);

	@EntityGraph(attributePaths = {"customer", "createdBy", "invoice"})
	List<Payment> findAllByIsActiveTrueOrderByCreatedAtDesc();

	@EntityGraph(attributePaths = {"customer", "createdBy", "invoice"})
	List<Payment> findAllByIsActiveTrueAndPaymentDateOrderByCreatedAtDesc(LocalDate paymentDate);

	@EntityGraph(attributePaths = {"customer", "createdBy", "invoice"})
	Optional<Payment> findByIdAndIsActiveTrue(Long id);
}
