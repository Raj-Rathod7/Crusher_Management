package com.productapp.service;

import com.productapp.entity.*;
import com.productapp.dto.*;
import com.productapp.exceptions.ResourceNotFoundException;
import com.productapp.repository.ExpenseRepository;
import com.productapp.repository.CategoryRepository;
import com.productapp.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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

    

    @Transactional
    public ExpenseResponse save(ExpenseRequest expenseRequest) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResourceNotFoundException("Authenticated user not found");
        }
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
        return expenseRepository.findAllByIsActiveTrue().stream()
                .map(ExpenseResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<Categories> getCategories() {
        return categoryRepository.findAll();
    }

    @Transactional
    public ExpenseResponse update(Long id, ExpenseRequest expenseRequest) {
        Expense expense = expenseRepository.findById(id)
                .filter(foundExpense -> Boolean.TRUE.equals(foundExpense.getIsActive()))
                .orElseThrow(() -> new ResourceNotFoundException("Expense not found with id : " + id));
        Categories category = categoryRepository.findByIdAndIsActiveTrue(expenseRequest.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));
        expense.setExpenseDate(expenseRequest.getExpenseDate());
        expense.setCategory(category);
        expense.setAmount(expenseRequest.getAmount());
        expense.setNotes(expenseRequest.getNotes());
        return ExpenseResponse.fromEntity(expenseRepository.save(expense));
    }

    @Transactional
    public void delete(Long id) {
        Expense expense = expenseRepository.findById(id)
                .filter(foundExpense -> Boolean.TRUE.equals(foundExpense.getIsActive()))
                .orElseThrow(() -> new ResourceNotFoundException("Expense not found with id : " + id));
        expense.setIsActive(false);
        expenseRepository.save(expense);
    }

    public Page<ExpenseResponse> getPage(Pageable pageable) {
        return expenseRepository.findAllByIsActiveTrue(pageable).map(ExpenseResponse::fromEntity);
    }

    public ExpenseResponse getById(Long id) {
        Expense expense = expenseRepository.findById(id)
            .filter(foundExpense -> Boolean.TRUE.equals(foundExpense.getIsActive()))
                .orElseThrow(() -> new ResourceNotFoundException("Expense not found with id : " + id));
        return ExpenseResponse.fromEntity(expense);
    }
}
