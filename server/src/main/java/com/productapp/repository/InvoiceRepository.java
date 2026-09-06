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
import java.util.Optional;

public interface InvoiceRepository extends JpaRepository<Invoice, Long> {

	@EntityGraph(attributePaths = {"customer", "createdBy", "invoiceItems", "invoiceItems.materialType"})
	Optional<Invoice> findById(Long id);

	@EntityGraph(attributePaths = {"customer", "createdBy", "invoiceItems", "invoiceItems.materialType"})
	List<Invoice> findAllByIsActiveTrue();

	@EntityGraph(attributePaths = {"customer", "createdBy"})
	Page<Invoice> findAllByIsActiveTrue(Pageable pageable);

	List<Invoice> findTop5ByIsActiveTrueOrderByInvoiceDateDesc();

	@EntityGraph(attributePaths = {"customer", "createdBy", "invoiceItems", "invoiceItems.materialType"})
	List<Invoice> findAllByCustomerIdAndIsActiveTrueOrderByInvoiceDateDesc(Long customerId);

	@Query("select coalesce(sum(i.totalAmount), 0) from Invoice i")
	BigDecimal sumTotalAmount();

	@Query("select coalesce(sum(i.amountPaid), 0) from Invoice i")
	BigDecimal sumAmountPaid();

	@Query("select coalesce(sum(i.balance), 0) from Invoice i where i.balance > 0")
	BigDecimal sumOutstandingBalance();

	@Query("select coalesce(sum(i.balance), 0) from Invoice i "
			+ "where i.customer.id = :customerId and i.balance > 0")
	BigDecimal sumOutstandingBalanceByCustomerId(@Param("customerId") Long customerId);

	@Query("select i.customer.id, coalesce(sum(i.balance), 0) from Invoice i "
			+ "where i.isActive = true and i.customer is not null and i.balance > 0 group by i.customer.id")
	List<Object[]> sumOutstandingBalanceByCustomer();

	@Query("select i.customer.id, coalesce(sum(i.balance), 0) from Invoice i "
			+ "where i.isActive = true and i.customer.id in :customerIds and i.balance > 0 group by i.customer.id")
	List<Object[]> sumOutstandingBalanceByCustomerIds(@Param("customerIds") List<Long> customerIds);
}
