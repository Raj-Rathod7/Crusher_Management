package com.productapp.repository;

import com.productapp.entity.Expense;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.math.BigDecimal;
import java.util.Optional;
import java.time.LocalDate;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.repository.query.Param;

public interface ExpenseRepository extends JpaRepository<Expense, Long> {

	@EntityGraph(attributePaths = {"category", "createdBy"})
	List<Expense> findAllByIsActiveTrue();

	@EntityGraph(attributePaths = {"category", "createdBy"})
	Page<Expense> findAllByIsActiveTrue(Pageable pageable);

	@EntityGraph(attributePaths = {"category", "createdBy"})
	Optional<Expense> findById(Long id);

	@Query("select coalesce(sum(e.amount), 0) from Expense e")
	BigDecimal sumAmount();

	@Query("select coalesce(nullif(trim(e.truckNumber), ''), 'Unassigned'), coalesce(sum(e.amount), 0), count(e) "
			+ "from Expense e where (:dateFrom is null or e.expenseDate >= :dateFrom) "
			+ "and (:dateTo is null or e.expenseDate <= :dateTo) "
			+ "group by coalesce(nullif(trim(e.truckNumber), ''), 'Unassigned') "
			+ "order by coalesce(nullif(trim(e.truckNumber), ''), 'Unassigned')")
	List<Object[]> summarizeByTruckNumber(@Param("dateFrom") LocalDate dateFrom, @Param("dateTo") LocalDate dateTo);
}
