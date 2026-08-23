package com.productapp.service;

import com.productapp.entity.*;
import com.productapp.dto.*;
import com.productapp.exceptions.ResourceNotFoundException;
import com.productapp.repository.ExpenseRepository;
import com.productapp.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final UserRepository userRepository;

    public ExpenseService(ExpenseRepository expenseRepository, UserRepository userRepository) {
        this.expenseRepository = expenseRepository;
        this.userRepository = userRepository;
    }

    

    public ExpenseResponse save(ExpenseRequest expenseRequest) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Expense expense = Expense.builder()
                .expenseDate(expenseRequest.getExpenseDate())
                .category(Categories.builder().id(expenseRequest.getCategoryId()).build())
                .amount(expenseRequest.getAmount())
                .notes(expenseRequest.getNotes())
                .createdBy(user)
                .build();
        return ExpenseResponse.fromEntity(expenseRepository.save(expense));
    }

    public List<ExpenseResponse> getAll() {
        return expenseRepository.findAll().stream()
                .map(ExpenseResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public ExpenseResponse getById(Long id) {
        Expense expense = expenseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Expense not found with id : " + id));
        return ExpenseResponse.fromEntity(expense);
    }
}
