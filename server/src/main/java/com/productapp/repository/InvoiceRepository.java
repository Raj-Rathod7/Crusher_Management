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
import java.time.LocalDate;
import org.springframework.data.jpa.repository.EntityGraph;
import java.util.Optional;

public interface InvoiceRepository extends JpaRepository<Invoice, Long> {

	@EntityGraph(attributePaths = {"customer", "createdBy", "invoiceItems", "invoiceItems.materialType", "payment"})
	Optional<Invoice> findById(Long id);

	@Lock(LockModeType.PESSIMISTIC_WRITE)
	@Query("select i from Invoice i where i.id = :id")
	Optional<Invoice> findByIdForUpdate(@Param("id") Long id);

	@EntityGraph(attributePaths = {"customer", "createdBy", "invoiceItems", "invoiceItems.materialType", "payment"})
	List<Invoice> findAllByIsActiveTrueOrderByCreatedAtDesc();

	@EntityGraph(attributePaths = {"customer", "createdBy", "payment"})
	Page<Invoice> findAllByIsActiveTrueOrderByCreatedAtDesc(Pageable pageable);

	@EntityGraph(attributePaths = {"customer", "createdBy", "invoiceItems", "invoiceItems.materialType", "payment"})
	List<Invoice> findAllByIsActiveTrueAndInvoiceDateOrderByCreatedAtDesc(LocalDate invoiceDate);

	@EntityGraph(attributePaths = {"customer", "createdBy", "payment"})
	Page<Invoice> findAllByIsActiveTrueAndInvoiceDateOrderByCreatedAtDesc(LocalDate invoiceDate, Pageable pageable);

	@EntityGraph(attributePaths = {"customer", "createdBy", "invoiceItems", "invoiceItems.materialType", "payment"})
	List<Invoice> findAllByIsActiveTrueAndTotalPendingTrueOrderByCreatedAtDesc();

	// native query so soft-deleted invoices still reserve their numbers
	@Query(value = "select max(invoice_number) from invoices where invoice_number like :prefix", nativeQuery = true)
	String findMaxInvoiceNumber(@Param("prefix") String prefix);

	List<Invoice> findTop5ByIsActiveTrueOrderByInvoiceDateDesc();

	@EntityGraph(attributePaths = {"customer", "createdBy", "invoiceItems", "invoiceItems.materialType"})
	List<Invoice> findAllByCustomerIdAndIsActiveTrueOrderByCreatedAtDesc(Long customerId);

	@Query("select coalesce(sum(i.totalAmount), 0) from Invoice i")
	BigDecimal sumTotalAmount();

	@Query("select coalesce(sum(i.totalAmount), 0) from Invoice i "
			+ "where (:dateFrom is null or i.invoiceDate >= :dateFrom) "
			+ "and (:dateTo is null or i.invoiceDate <= :dateTo)")
	BigDecimal sumTotalAmount(@Param("dateFrom") LocalDate dateFrom, @Param("dateTo") LocalDate dateTo);

	@EntityGraph(attributePaths = {"customer", "createdBy", "invoiceItems", "invoiceItems.materialType"})
	@Query("select i from Invoice i where (:dateFrom is null or i.invoiceDate >= :dateFrom) "
			+ "and (:dateTo is null or i.invoiceDate <= :dateTo) order by i.invoiceDate desc")
	List<Invoice> findRecent(@Param("dateFrom") LocalDate dateFrom, @Param("dateTo") LocalDate dateTo, Pageable pageable);

	@Query("select i.invoiceDate, count(i), coalesce(sum(i.totalAmount), 0) from Invoice i "
			+ "where (:dateFrom is null or i.invoiceDate >= :dateFrom) "
			+ "and (:dateTo is null or i.invoiceDate <= :dateTo) "
			+ "group by i.invoiceDate order by i.invoiceDate")
	List<Object[]> salesByDate(@Param("dateFrom") LocalDate dateFrom, @Param("dateTo") LocalDate dateTo);

	@Query("select mt.name, coalesce(sum(ii.quantityBrass), 0), coalesce(sum(ii.amount), 0) "
			+ "from InvoiceItem ii join ii.invoice i join ii.materialType mt "
			+ "where (:dateFrom is null or i.invoiceDate >= :dateFrom) "
			+ "and (:dateTo is null or i.invoiceDate <= :dateTo) "
			+ "group by mt.name order by mt.name")
	List<Object[]> materialWiseSales(@Param("dateFrom") LocalDate dateFrom, @Param("dateTo") LocalDate dateTo);

}
