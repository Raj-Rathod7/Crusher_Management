package com.productapp.repository;

import com.productapp.entity.CustomerLedger;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface CustomerLedgerRepository extends JpaRepository<CustomerLedger, Long> {

    List<CustomerLedger> findAllByCustomerIdAndIsActiveTrueOrderByEntryDateAscIdAsc(Long customerId);

    Optional<CustomerLedger> findFirstBySourceTypeAndSourceIdAndIsActiveTrueOrderByIdDesc(String sourceType,
                                                                                           Long sourceId);

    @Query("select coalesce(sum(l.debit), 0) from CustomerLedger l where l.isActive = true")
    java.math.BigDecimal sumDebits();

    @Query("select coalesce(sum(l.credit), 0) from CustomerLedger l where l.isActive = true")
    java.math.BigDecimal sumCredits();

    @Query("select coalesce(sum(l.debit), 0) from CustomerLedger l where l.isActive = true "
            + "and (:dateFrom is null or l.entryDate >= :dateFrom) and (:dateTo is null or l.entryDate <= :dateTo)")
    java.math.BigDecimal sumDebits(@Param("dateFrom") LocalDate dateFrom, @Param("dateTo") LocalDate dateTo);

    @Query("select coalesce(sum(l.credit), 0) from CustomerLedger l where l.isActive = true "
            + "and (:dateFrom is null or l.entryDate >= :dateFrom) and (:dateTo is null or l.entryDate <= :dateTo)")
    java.math.BigDecimal sumCredits(@Param("dateFrom") LocalDate dateFrom, @Param("dateTo") LocalDate dateTo);

    @Query("select count(distinct l.customer.id) from CustomerLedger l where l.isActive = true "
            + "and (:dateFrom is null or l.entryDate >= :dateFrom) and (:dateTo is null or l.entryDate <= :dateTo)")
    long countDistinctActiveCustomers(@Param("dateFrom") LocalDate dateFrom, @Param("dateTo") LocalDate dateTo);
}