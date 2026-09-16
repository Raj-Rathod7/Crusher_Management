package com.productapp.dto;

import java.math.BigDecimal;

public class AdvanceReceiptResponse {

    private PaymentResponse payment;
    private BigDecimal customerAvailableCredit;

    public AdvanceReceiptResponse() {
    }

    public AdvanceReceiptResponse(PaymentResponse payment, BigDecimal customerAvailableCredit) {
        this.payment = payment;
        this.customerAvailableCredit = customerAvailableCredit;
    }

    public PaymentResponse getPayment() {
        return payment;
    }

    public void setPayment(PaymentResponse payment) {
        this.payment = payment;
    }

    public BigDecimal getCustomerAvailableCredit() {
        return customerAvailableCredit;
    }

    public void setCustomerAvailableCredit(BigDecimal customerAvailableCredit) {
        this.customerAvailableCredit = customerAvailableCredit;
    }
}
