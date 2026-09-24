package com.productapp.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record DashboardChartsResponse(
        List<SalesPoint> salesByDate,
        List<ExpenseCategoryPoint> expensesByCategory,
        List<InwardPoint> truckInwardByDate,
        List<MaterialSalesPoint> materialWiseSales) {

    public record SalesPoint(LocalDate date, long invoiceCount, BigDecimal totalAmount) {
    }

    public record ExpenseCategoryPoint(String category, BigDecimal totalAmount) {
    }

    public record InwardPoint(LocalDate date, long truckCount, BigDecimal totalQtyBrass) {
    }

    public record MaterialSalesPoint(String material, BigDecimal quantityBrass, BigDecimal totalRevenue) {
    }
}
