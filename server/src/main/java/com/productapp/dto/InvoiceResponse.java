package com.productapp.dto;

import com.productapp.entity.Invoice;
import com.productapp.entity.InvoiceItem;

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
    private String remarks;
    
    private String createdByUsername;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<InvoiceItemResponse> invoiceItems;

    public InvoiceResponse() {
    }

    public InvoiceResponse(Long id, String invoiceNumber, LocalDate invoiceDate, String customerName,
                           BigDecimal totalAmount, String remarks, Long customerId,
                           List<InvoiceItemResponse> invoiceItems) {
        this.id = id;
        this.invoiceNumber = invoiceNumber;
        this.invoiceDate = invoiceDate;
        this.customerName = customerName;
        this.totalAmount = totalAmount;
        this.remarks = remarks;
        this.customerId = customerId;
        this.invoiceItems = invoiceItems;

    }

    public static InvoiceResponse fromEntity(Invoice invoice) {
         List<InvoiceItemResponse> itemResponses =
     (invoice.getInvoiceItems() == null ? List.<InvoiceItem>of() : invoice.getInvoiceItems())
           .stream()
           .map(InvoiceItemResponse::fromEntity)
           .toList();


        InvoiceResponse response = new InvoiceResponse(
                invoice.getId(),
                invoice.getInvoiceNumber(),
                invoice.getInvoiceDate(),
                invoice.getCustomer() != null ? invoice.getCustomer().getName() : null,
                invoice.getTotalAmount(),
                invoice.getRemarks(),
                invoice.getCustomer() != null ? invoice.getCustomer().getId() : null,
                itemResponses
        );
            response.createdByUsername = invoice.getCreatedBy() != null ? invoice.getCreatedBy().getUsername() : null;
            response.createdAt = invoice.getCreatedAt();
            response.updatedAt = invoice.getUpdatedAt();
            return response;
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
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
    public String getCreatedByUsername() { return createdByUsername; }
    public void setCreatedByUsername(String createdByUsername) { this.createdByUsername = createdByUsername; }
    public List<InvoiceItemResponse> getInvoiceItems() { return invoiceItems; }
    public void setInvoiceItems(List<InvoiceItemResponse> invoiceItems) { this.invoiceItems = invoiceItems; }
    // public LocalDateTime getCreatedAt() { return createdAt; }
    // public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    // public LocalDateTime getUpdatedAt() { return updatedAt; }
    // public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
