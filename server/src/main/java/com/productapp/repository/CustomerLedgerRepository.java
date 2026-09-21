package com.productapp.repository;

import com.productapp.entity.CustomerLedger;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

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
}