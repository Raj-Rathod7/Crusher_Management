package com.productapp.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;

import com.productapp.entity.Invoice;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;
import java.math.BigDecimal;
import org.springframework.data.jpa.repository.EntityGraph;
import java.util.Optional;

public interface InvoiceRepository extends JpaRepository<Invoice, Long> {

	@EntityGraph(attributePaths = {"customer", "createdBy", "invoiceItems", "invoiceItems.materialType"})
	Optional<Invoice> findById(Long id);

	@Lock(LockModeType.PESSIMISTIC_WRITE)
	@Query("select i from Invoice i where i.id = :id")
	Optional<Invoice> findByIdForUpdate(@Param("id") Long id);

	@EntityGraph(attributePaths = {"customer", "createdBy", "invoiceItems", "invoiceItems.materialType"})
	List<Invoice> findAllByIsActiveTrue();

	@EntityGraph(attributePaths = {"customer", "createdBy"})
	Page<Invoice> findAllByIsActiveTrue(Pageable pageable);

	List<Invoice> findTop5ByIsActiveTrueOrderByInvoiceDateDesc();

	@EntityGraph(attributePaths = {"customer", "createdBy", "invoiceItems", "invoiceItems.materialType"})
	List<Invoice> findAllByCustomerIdAndIsActiveTrueOrderByInvoiceDateDesc(Long customerId);

	@Query("select coalesce(sum(i.totalAmount), 0) from Invoice i")
	BigDecimal sumTotalAmount();

}
