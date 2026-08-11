package com.productapp.service;

import com.productapp.dto.ExpenseResponse;
import com.productapp.entity.Expense;
import com.productapp.entity.User;
import com.productapp.exceptions.ResourceNotFoundException;
import com.productapp.repository.ExpenseRepository;
import com.productapp.repository.UserRepository;
import org.springframework.stereotype.Service;

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

    public ExpenseResponse save(Expense expense) {
        User user = userRepository.findById(expense.getCreatedBy().getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        expense.setCreatedBy(user);
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
