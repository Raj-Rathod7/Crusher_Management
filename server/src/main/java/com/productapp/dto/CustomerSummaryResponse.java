package com.productapp.dto;

import java.util.List;

public class CustomerSummaryResponse {

    private CustomerResponse customer;
    private List<PaymentResponse> recentPayments;
    private List<InvoiceResponse> recentInvoices;
    private List<CustomerLedgerEntry> ledger;

    public CustomerSummaryResponse() {
    }

    public CustomerSummaryResponse(CustomerResponse customer, List<PaymentResponse> recentPayments,
                                    List<InvoiceResponse> recentInvoices, List<CustomerLedgerEntry> ledger) {
        this.customer = customer;
        this.recentPayments = recentPayments;
        this.recentInvoices = recentInvoices;
        this.ledger = ledger;
    }

    public CustomerResponse getCustomer() {
        return customer;
    }

    public void setCustomer(CustomerResponse customer) {
        this.customer = customer;
    }

    public List<PaymentResponse> getRecentPayments() {
        return recentPayments;
    }

    public void setRecentPayments(List<PaymentResponse> recentPayments) {
        this.recentPayments = recentPayments;
    }

    public List<InvoiceResponse> getRecentInvoices() {
        return recentInvoices;
    }

    public void setRecentInvoices(List<InvoiceResponse> recentInvoices) {
        this.recentInvoices = recentInvoices;
    }

    public List<CustomerLedgerEntry> getLedger() {
        return ledger;
    }

    public void setLedger(List<CustomerLedgerEntry> ledger) {
        this.ledger = ledger;
    }
}
