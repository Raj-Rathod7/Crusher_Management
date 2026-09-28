package com.productapp.entity;

import java.math.BigDecimal;
import java.time.LocalDate;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

public class RecordInvoicePaymentRequest {

    @NotNull
    @DecimalMin(value = "0.00")
    private BigDecimal amount;

    @DecimalMin(value = "0.00")
    private BigDecimal creditToApply;

    @NotNull
    private LocalDate paymentDate;

    private String paymentMode = "cash";

    private String chequeNumber;

    private String externalRef;

    private String notes;

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public BigDecimal getCreditToApply() {
        return creditToApply;
    }

    public void setCreditToApply(BigDecimal creditToApply) {
        this.creditToApply = creditToApply;
    }

    public LocalDate getPaymentDate() {
        return paymentDate;
    }

    public void setPaymentDate(LocalDate paymentDate) {
        this.paymentDate = paymentDate;
    }

    public String getPaymentMode() {
        return paymentMode;
    }

    public void setPaymentMode(String paymentMode) {
        this.paymentMode = paymentMode;
    }

    public String getChequeNumber() {
        return chequeNumber;
    }

    public void setChequeNumber(String chequeNumber) {
        this.chequeNumber = chequeNumber;
    }

    public String getExternalRef() {
        return externalRef;
    }

    public void setExternalRef(String externalRef) {
        this.externalRef = externalRef;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
