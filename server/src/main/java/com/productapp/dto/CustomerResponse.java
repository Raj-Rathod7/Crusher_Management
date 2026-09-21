package com.productapp.dto;

import com.productapp.entity.Customer;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class CustomerResponse {
    private Long id;
    private String name;
    private String phone;
    private String address;
    private String notes;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private BigDecimal pendingBalance;

    public CustomerResponse() {
    }

    public CustomerResponse(Long id, String name, String phone, String address, String notes, Boolean isActive, LocalDateTime createdAt) {
        this(id, name, phone, address, notes, isActive, createdAt, BigDecimal.ZERO);
    }

    public CustomerResponse(Long id, String name, String phone, String address, String notes, Boolean isActive,
                            LocalDateTime createdAt, BigDecimal pendingBalance) {
        this.id = id;
        this.name = name;
        this.phone = phone;
        this.address = address;
        this.notes = notes;
        this.isActive = isActive;
        this.pendingBalance = pendingBalance == null ? BigDecimal.ZERO : pendingBalance;
        this.createdAt = createdAt;
    }

    public static CustomerResponse fromEntity(Customer customer) {
        if (customer == null) {
            return null;
        }

        return new CustomerResponse(
                customer.getId(),
                customer.getName(),
                customer.getPhone(),
                customer.getAddress(),
                customer.getNotes(),
                customer.getIsActive(),
                customer.getCreatedAt(),
                BigDecimal.ZERO
        );
    }

    public static CustomerResponse fromEntity(Customer customer, BigDecimal pendingBalance) {
        if (customer == null) {
            return null;
        }

        return new CustomerResponse(
                customer.getId(),
                customer.getName(),
                customer.getPhone(),
                customer.getAddress(),
                customer.getNotes(),
                customer.getIsActive(),
                customer.getCreatedAt(),
                pendingBalance
        );
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
    public BigDecimal getPendingBalance() { return pendingBalance; }
    public void setPendingBalance(BigDecimal pendingBalance) {
        this.pendingBalance = pendingBalance == null ? BigDecimal.ZERO : pendingBalance;
    }
    // public LocalDateTime getCreatedAt() { return createdAt; }
    // public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
