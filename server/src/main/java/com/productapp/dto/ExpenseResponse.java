package com.productapp.dto;

import com.productapp.entity.Expense;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class ExpenseResponse {
    private Long id;
    private LocalDate expenseDate;
    private Long categoryId;
    private BigDecimal amount;
    private String notes;
    private String createdByUsername;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public ExpenseResponse() {
    }

    public ExpenseResponse(Long id, LocalDate expenseDate, Long categoryId, BigDecimal amount,
                           String notes, String createdByUsername, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.expenseDate = expenseDate;
        this.categoryId = categoryId;
        this.amount = amount;
        this.notes = notes;
        this.createdByUsername = createdByUsername;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public static ExpenseResponse fromEntity(Expense expense) {
        if (expense == null) {
            return null;
        }

        return new ExpenseResponse(
                expense.getId(),
                expense.getExpenseDate(),
                expense.getCategoryId(),
                expense.getAmount(),
                expense.getNotes(),
                expense.getCreatedBy() != null ? expense.getCreatedBy().getUsername() : null,
                expense.getCreatedAt(),
                expense.getUpdatedAt()
        );
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public LocalDate getExpenseDate() { return expenseDate; }
    public void setExpenseDate(LocalDate expenseDate) { this.expenseDate = expenseDate; }
    public Long getCategoryId() { return categoryId; }
    public void setCategoryId(Long categoryId) { this.categoryId = categoryId; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public String getCreatedByUsername() { return createdByUsername; }
    public void setCreatedByUsername(String createdByUsername) { this.createdByUsername = createdByUsername; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
