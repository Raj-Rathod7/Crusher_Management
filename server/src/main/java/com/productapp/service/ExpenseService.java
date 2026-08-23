package com.productapp.service;

import com.productapp.entity.*;
import com.productapp.dto.*;
import com.productapp.exceptions.ResourceNotFoundException;
import com.productapp.repository.ExpenseRepository;
import com.productapp.repository.CategoryRepository;
import com.productapp.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;

    public ExpenseService(ExpenseRepository expenseRepository, CategoryRepository categoryRepository,
                          UserRepository userRepository) {
        this.expenseRepository = expenseRepository;
        this.categoryRepository = categoryRepository;
        this.userRepository = userRepository;
    }

    

    public ExpenseResponse save(ExpenseRequest expenseRequest) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        User user = userRepository.findByUsernameAndIsActiveTrue(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Categories category = categoryRepository.findByIdAndIsActiveTrue(expenseRequest.getCategoryId())
            .orElseThrow(() -> new ResourceNotFoundException("Category not found"));
        Expense expense = Expense.builder()
                .expenseDate(expenseRequest.getExpenseDate())
            .category(category)
                .amount(expenseRequest.getAmount())
                .notes(expenseRequest.getNotes())
                .createdBy(user)
                .build();
        return ExpenseResponse.fromEntity(expenseRepository.save(expense));
    }

    public List<ExpenseResponse> getAll() {
        return expenseRepository.findAll().stream()
                .filter(expense -> Boolean.TRUE.equals(expense.getIsActive()))
                .map(ExpenseResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public ExpenseResponse getById(Long id) {
        Expense expense = expenseRepository.findById(id)
            .filter(foundExpense -> Boolean.TRUE.equals(foundExpense.getIsActive()))
                .orElseThrow(() -> new ResourceNotFoundException("Expense not found with id : " + id));
        return ExpenseResponse.fromEntity(expense);
    }
}
