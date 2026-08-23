package com.productapp.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.productapp.entity.Invoice;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.math.BigDecimal;
import org.springframework.data.jpa.repository.EntityGraph;

public interface InvoiceRepository extends JpaRepository<Invoice, Long> {

	@EntityGraph(attributePaths = {"customer", "createdBy", "invoiceItems", "invoiceItems.materialType"})
	List<Invoice> findAllByIsActiveTrue();

	@EntityGraph(attributePaths = {"customer", "createdBy"})
	Page<Invoice> findAllByIsActiveTrue(Pageable pageable);

	@Query("select coalesce(sum(i.balance), 0) from Invoice i "
			+ "where i.customer.id = :customerId and i.balance > 0")
	BigDecimal sumOutstandingBalanceByCustomerId(@Param("customerId") Long customerId);
}
