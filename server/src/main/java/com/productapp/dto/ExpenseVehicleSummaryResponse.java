package com.productapp.dto;

import java.math.BigDecimal;

public record ExpenseVehicleSummaryResponse(
        String truckNumber,
        BigDecimal totalAmount,
        long expenseCount
) {
}
