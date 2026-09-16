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

    @NotNull
    @DecimalMin(value = "0.00")
    private BigDecimal amountPaid;

    @NotNull
    private BigDecimal balance;

    private String status;

    @NotBlank
    private String invoiceNumber;

    @NotNull
    private LocalDate invoiceDate;

    private BigDecimal totalAmount; 
    
    private String remarks;

    private Boolean applyCredit = false;

    private BigDecimal creditToApply;

    private BigDecimal cashPaidNow;

    public Boolean getApplyCredit() {
        return applyCredit;
    }

    public void setApplyCredit(Boolean applyCredit) {
        this.applyCredit = applyCredit;
    }

    public BigDecimal getCreditToApply() {
        return creditToApply;
    }

    public void setCreditToApply(BigDecimal creditToApply) {
        this.creditToApply = creditToApply;
    }

    public BigDecimal getCashPaidNow() {
        return cashPaidNow;
    }

    public void setCashPaidNow(BigDecimal cashPaidNow) {
        this.cashPaidNow = cashPaidNow;
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

    public BigDecimal getBalance() {
        return balance;
    }

    public void setBalance(BigDecimal balance) {
        this.balance = balance;
    }

    @NotEmpty
    @Valid
    private List<InvoiceItemRequest> invoiceItems;

    

    public Long getCustomerId() {
        return customerId;
    }

    public void setCustomerId(Long customerId) {
        this.customerId = customerId;
    }

    public BigDecimal getAmountPaid() {
        return amountPaid;
    }

    public void setAmountPaid(BigDecimal amountPaid) {
        this.amountPaid = amountPaid;
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

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    
}