package com.productapp.repository;

import com.productapp.entity.Expense;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ExpenseRepository extends JpaRepository<Expense, Long> {

	List<Expense> findAllByIsActiveTrue();

	Page<Expense> findAllByIsActiveTrue(Pageable pageable);
}
