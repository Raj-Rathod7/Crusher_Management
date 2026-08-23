package com.productapp.controller;

import com.productapp.dto.ExpenseRequest;
import com.productapp.dto.ExpenseResponse;
import com.productapp.entity.Expense;
import com.productapp.entity.Categories;
import com.productapp.service.ExpenseService;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

@RestController
@RequestMapping("/expenses")
public class ExpenseController {

    private final ExpenseService expenseService;

    public ExpenseController(ExpenseService expenseService) {
        this.expenseService = expenseService;
    }

    @PostMapping
    public ExpenseResponse create(@Valid @RequestBody ExpenseRequest expenseRequest) {
        return expenseService.save(expenseRequest);
    }

    @GetMapping("/categories")
    public List<Categories> getCategories() {
        return expenseService.getCategories();
    }

    @GetMapping
    public List<ExpenseResponse> getAll() {
        return expenseService.getAll();
    }

    @GetMapping("/page")
    public Page<ExpenseResponse> getPage(Pageable pageable) {
        return expenseService.getPage(pageable);
    }

    @GetMapping("/{id}")
    public ExpenseResponse getById(@PathVariable Long id) {
        return expenseService.getById(id);
    }

    @PutMapping("/{id}")
    public ExpenseResponse update(@PathVariable Long id, @Valid @RequestBody ExpenseRequest expenseRequest) {
        return expenseService.update(id, expenseRequest);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        expenseService.delete(id);
    }
}
