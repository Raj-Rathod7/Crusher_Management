package com.productapp.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record DashboardResponse(
        BigDecimal invoiceTotal,
        BigDecimal amountCollected,
        BigDecimal outstandingBalance,
        BigDecimal expenseTotal,
        long activeCustomers,
        long truckEntries,
        List<RecentInvoice> recentInvoices) {

    public record RecentInvoice(
            Long id,
            String invoiceNumber,
            LocalDate invoiceDate,
            String customerName,
            BigDecimal totalAmount,
            BigDecimal balance,
            String status) {
    }
}