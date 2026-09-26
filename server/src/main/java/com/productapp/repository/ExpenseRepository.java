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
	List<Expense> findAllByIsActiveTrueOrderByCreatedAtDesc();

	@EntityGraph(attributePaths = {"category", "createdBy"})
	Page<Expense> findAllByIsActiveTrueOrderByCreatedAtDesc(Pageable pageable);

	@EntityGraph(attributePaths = {"category", "createdBy"})
	List<Expense> findAllByIsActiveTrueAndExpenseDateOrderByCreatedAtDesc(LocalDate expenseDate);

	@EntityGraph(attributePaths = {"category", "createdBy"})
	Page<Expense> findAllByIsActiveTrueAndExpenseDateOrderByCreatedAtDesc(LocalDate expenseDate, Pageable pageable);

	@EntityGraph(attributePaths = {"category", "createdBy"})
	Optional<Expense> findById(Long id);

	@Query("select coalesce(sum(e.amount), 0) from Expense e")
	BigDecimal sumAmount();

	@Query("select coalesce(sum(e.amount), 0) from Expense e "
			+ "where (:dateFrom is null or e.expenseDate >= :dateFrom) and (:dateTo is null or e.expenseDate <= :dateTo)")
	BigDecimal sumAmount(@Param("dateFrom") LocalDate dateFrom, @Param("dateTo") LocalDate dateTo);

	@Query("select coalesce(nullif(trim(e.truckNumber), ''), 'Unassigned'), coalesce(sum(e.amount), 0), count(e) "
			+ "from Expense e where (:dateFrom is null or e.expenseDate >= :dateFrom) "
			+ "and (:dateTo is null or e.expenseDate <= :dateTo) "
			+ "group by coalesce(nullif(trim(e.truckNumber), ''), 'Unassigned') "
			+ "order by coalesce(nullif(trim(e.truckNumber), ''), 'Unassigned')")
	List<Object[]> summarizeByTruckNumber(@Param("dateFrom") LocalDate dateFrom, @Param("dateTo") LocalDate dateTo);

	@Query("select c.name, coalesce(sum(e.amount), 0) from Expense e join e.category c "
			+ "where (:dateFrom is null or e.expenseDate >= :dateFrom) "
			+ "and (:dateTo is null or e.expenseDate <= :dateTo) "
			+ "group by c.name order by c.name")
	List<Object[]> summarizeByCategory(@Param("dateFrom") LocalDate dateFrom, @Param("dateTo") LocalDate dateTo);
}
