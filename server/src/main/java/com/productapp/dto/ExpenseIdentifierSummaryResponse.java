package com.productapp.dto;

import java.math.BigDecimal;

public record ExpenseIdentifierSummaryResponse(
        String identifier,
        BigDecimal totalAmount,
        long expenseCount
) {
}