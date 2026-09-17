package com.productapp.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.productapp.entity.Payment;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

	@Query("select coalesce(sum(p.amount), 0) from Payment p "
			+ "where p.customer.id = :customerId and p.direction = :direction")
	BigDecimal sumAmountByCustomerIdAndDirection(@Param("customerId") Long customerId,
			@Param("direction") String direction);

	List<Payment> findAllByEntryTypeInAndCustomerIdOrderByPaymentDateDesc(List<String> entryTypes, Long customerId);

	List<Payment> findAllByEntryTypeInOrderByPaymentDateDesc(List<String> entryTypes);

	@Query("select p from Payment p where p.entryType in :entryTypes "
			+ "and (:customerId is null or p.customer.id = :customerId) "
			+ "and (:dateFrom is null or p.paymentDate >= :dateFrom) "
			+ "and (:dateTo is null or p.paymentDate <= :dateTo) "
			+ "order by p.paymentDate desc, p.id desc")
	List<Payment> findReceipts(@Param("entryTypes") List<String> entryTypes,
			@Param("customerId") Long customerId,
			@Param("dateFrom") LocalDate dateFrom,
			@Param("dateTo") LocalDate dateTo);

	List<Payment> findAllByCustomerIdAndIsActiveTrueOrderByPaymentDateDesc(Long customerId);

	List<Payment> findTop10ByIsActiveTrueOrderByPaymentDateDesc();

	@Query("select coalesce(sum(p.amount), 0) from Payment p where p.sourceReceipt.id = :receiptId")
	BigDecimal sumAmountBySourceReceiptId(@Param("receiptId") Long receiptId);

	List<Payment> findAllByCustomerIdAndEntryTypeOrderByPaymentDateAscIdAsc(Long customerId, String entryType);

	List<Payment> findAllByInvoiceIdAndEntryTypeOrderByPaymentDateAscIdAsc(Long invoiceId, String entryType);

	List<Payment> findAllByInvoiceIdOrderByPaymentDateAscIdAsc(Long invoiceId);
}
