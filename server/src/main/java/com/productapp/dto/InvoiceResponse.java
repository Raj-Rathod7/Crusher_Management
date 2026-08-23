package com.productapp.dto;

import com.productapp.entity.Invoice;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public class InvoiceResponse {
    private Long id;
    private String invoiceNumber;
    private LocalDate invoiceDate;
    private String customerName;
    private Long customerId;
    private BigDecimal totalAmount;
    private BigDecimal amountPaid;
    private BigDecimal balance;
    private String status;
    private String remarks;
    
    private String createdByUsername;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<InvoiceItemResponse> invoiceItems;

    public InvoiceResponse() {
    }

    public InvoiceResponse(Long id, String invoiceNumber, LocalDate invoiceDate, String customerName,
                           BigDecimal totalAmount, BigDecimal amountPaid, BigDecimal balance,
                           String status, String remarks,Long customerId, List<InvoiceItemResponse> invoiceItems ) {
        this.id = id;
        this.invoiceNumber = invoiceNumber;
        this.invoiceDate = invoiceDate;
        this.customerName = customerName;
        this.totalAmount = totalAmount;
        this.amountPaid = amountPaid;
        this.balance = balance;
        this.status = status;
        this.remarks = remarks;
        this.customerId = customerId;
        this.invoiceItems = invoiceItems;

        // this.createdByUsername = createdByUsername;
        // this.createdAt = createdAt;
        // this.updatedAt = updatedAt;
    }

    public static InvoiceResponse fromEntity(Invoice invoice) {
       List<InvoiceItemResponse> itemResponses =
    invoice.getInvoiceItems()
           .stream()
           .map(InvoiceItemResponse::fromEntity)
           .toList();


        return new InvoiceResponse(
                invoice.getId(),
                invoice.getInvoiceNumber(),
                invoice.getInvoiceDate(),
                invoice.getCustomer() != null ? invoice.getCustomer().getName() : null,
                invoice.getTotalAmount(),
                invoice.getAmountPaid(),
                invoice.getBalance(),
                invoice.getStatus(),
                invoice.getRemarks(),
                invoice.getCustomer() != null ? invoice.getCustomer().getId() : null,
                itemResponses
        );
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getInvoiceNumber() { return invoiceNumber; }
    public void setInvoiceNumber(String invoiceNumber) { this.invoiceNumber = invoiceNumber; }
    public LocalDate getInvoiceDate() { return invoiceDate; }
    public void setInvoiceDate(LocalDate invoiceDate) { this.invoiceDate = invoiceDate; }
    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }
    public Long getCustomerId() { return customerId; }
    public void setCustomerId(Long customerId) { this.customerId = customerId; }
    public BigDecimal getTotalAmount() { return totalAmount; }
    public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }
    public BigDecimal getAmountPaid() { return amountPaid; }
    public void setAmountPaid(BigDecimal amountPaid) { this.amountPaid = amountPaid; }
    public BigDecimal getBalance() { return balance; }
    public void setBalance(BigDecimal balance) { this.balance = balance; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
    public String getCreatedByUsername() { return createdByUsername; }
    public void setCreatedByUsername(String createdByUsername) { this.createdByUsername = createdByUsername; }
    // public LocalDateTime getCreatedAt() { return createdAt; }
    // public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    // public LocalDateTime getUpdatedAt() { return updatedAt; }
    // public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
