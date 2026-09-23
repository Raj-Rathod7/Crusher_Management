package com.productapp.dto;

import com.productapp.entity.Payment;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class PaymentResponse {
    private Long id;
    private LocalDate paymentDate;
    private String customerName;
    private Long customerId;
    private Long invoiceId;
    private String invoiceNumber;
    private BigDecimal amount;
    private String paymentMode;
    private String chequeNumber;
    private String notes;
    private String entryType;
    private String externalRef;
    private String createdByUsername;
    private LocalDateTime createdAt;

    public PaymentResponse() {
    }

    public PaymentResponse(Long id, LocalDate paymentDate, String customerName,
                           BigDecimal amount, String paymentMode, String chequeNumber, String notes,
                           String createdByUsername, LocalDateTime createdAt) {
        this.id = id;
        this.paymentDate = paymentDate;
        this.customerName = customerName;
        this.amount = amount;
        this.paymentMode = paymentMode;
        this.chequeNumber = chequeNumber;
        this.notes = notes;
        this.createdByUsername = createdByUsername;
        this.createdAt = createdAt;
    }

    public static PaymentResponse fromEntity(Payment payment) {
        if (payment == null) {
            return null;
        }

        PaymentResponse response = new PaymentResponse(
                payment.getId(),
                payment.getPaymentDate(),
                payment.getCustomer() != null ? payment.getCustomer().getName() : null,
                payment.getAmount(),
                payment.getPaymentMode(),
                payment.getChequeNumber(),
                payment.getNotes(),
                payment.getCreatedBy() != null ? payment.getCreatedBy().getUsername() : null,
                payment.getCreatedAt()
        );
        response.customerId = payment.getCustomer() != null ? payment.getCustomer().getId() : null;
        response.invoiceId = payment.getInvoice() != null ? payment.getInvoice().getId() : null;
        response.invoiceNumber = payment.getInvoice() != null ? payment.getInvoice().getInvoiceNumber() : null;
        response.entryType = payment.getEntryType();
        response.externalRef = payment.getExternalRef();
        return response;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public LocalDate getPaymentDate() { return paymentDate; }
    public void setPaymentDate(LocalDate paymentDate) { this.paymentDate = paymentDate; }
    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public String getPaymentMode() { return paymentMode; }
    public void setPaymentMode(String paymentMode) { this.paymentMode = paymentMode; }
    public String getChequeNumber() { return chequeNumber; }
    public void setChequeNumber(String chequeNumber) { this.chequeNumber = chequeNumber; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public String getCreatedByUsername() { return createdByUsername; }
    public void setCreatedByUsername(String createdByUsername) { this.createdByUsername = createdByUsername; }
    public Long getCustomerId() { return customerId; }
    public void setCustomerId(Long customerId) { this.customerId = customerId; }
    public Long getInvoiceId() { return invoiceId; }
    public void setInvoiceId(Long invoiceId) { this.invoiceId = invoiceId; }
    public String getInvoiceNumber() { return invoiceNumber; }
    public void setInvoiceNumber(String invoiceNumber) { this.invoiceNumber = invoiceNumber; }
    public String getEntryType() { return entryType; }
    public void setEntryType(String entryType) { this.entryType = entryType; }
    public String getExternalRef() { return externalRef; }
    public void setExternalRef(String externalRef) { this.externalRef = externalRef; }
    // public LocalDateTime getCreatedAt() { return createdAt; }
    // public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
