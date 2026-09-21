package com.productapp.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.*;
import java.time.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;

public class InvoiceRequest {

    @NotNull
    private Long customerId;

    @NotBlank
    private String invoiceNumber;

    @NotNull
    private LocalDate invoiceDate;

    @NotNull
    @DecimalMin(value = "0.01")
    private BigDecimal totalAmount;

    private String remarks;

    @NotEmpty
    @Valid
    private List<InvoiceItemRequest> invoiceItems;

    public Long getCustomerId() {
        return customerId;
    }

    public void setCustomerId(Long customerId) {
        this.customerId = customerId;
    }

    public LocalDate getInvoiceDate() {
        return invoiceDate;
    }

    public void setInvoiceDate(LocalDate invoiceDate) {
        this.invoiceDate = invoiceDate;
    }

    public String getInvoiceNumber() {
        return invoiceNumber;
    }

    public void setInvoiceNumber(String invoiceNumber) {
        this.invoiceNumber = invoiceNumber;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }

    public List<InvoiceItemRequest> getInvoiceItems() {
        return invoiceItems;
    }

    public void setInvoiceItems(List<InvoiceItemRequest> invoiceItems) {
        this.invoiceItems = invoiceItems;
    }

    public String getRemarks() {
        return remarks;
    }

    public void setRemarks(String remarks) {
        this.remarks = remarks;
    }
}