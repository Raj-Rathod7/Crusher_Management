package com.productapp.service;

import com.productapp.dto.DashboardChartsResponse;
import com.productapp.dto.DashboardResponse;
import com.productapp.repository.CustomerRepository;
import com.productapp.repository.CustomerLedgerRepository;
import com.productapp.repository.ExpenseRepository;
import com.productapp.repository.InvoiceRepository;
import com.productapp.repository.TruckEntryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
public class DashboardService {

    private final InvoiceRepository invoiceRepository;
    private final ExpenseRepository expenseRepository;
    private final CustomerRepository customerRepository;
    private final TruckEntryRepository truckEntryRepository;
    private final CustomerLedgerRepository customerLedgerRepository;

    public DashboardService(InvoiceRepository invoiceRepository,
                            ExpenseRepository expenseRepository,
                            CustomerRepository customerRepository,
                            TruckEntryRepository truckEntryRepository,
                            CustomerLedgerRepository customerLedgerRepository) {
        this.invoiceRepository = invoiceRepository;
        this.expenseRepository = expenseRepository;
        this.customerRepository = customerRepository;
        this.truckEntryRepository = truckEntryRepository;
        this.customerLedgerRepository = customerLedgerRepository;
    }

    @Transactional(readOnly = true)
    public DashboardResponse getSummary(LocalDate dateFrom, LocalDate dateTo) {
        BigDecimal totalDebits = customerLedgerRepository.sumDebits(dateFrom, dateTo);
        BigDecimal totalCredits = customerLedgerRepository.sumCredits(dateFrom, dateTo);
        return new DashboardResponse(
                invoiceRepository.sumTotalAmount(dateFrom, dateTo),
                totalCredits,
                totalDebits.subtract(totalCredits),
                expenseRepository.sumAmount(dateFrom, dateTo),
                customerLedgerRepository.countDistinctActiveCustomers(dateFrom, dateTo),
                truckEntryRepository.countByDateRange(dateFrom, dateTo),
                invoiceRepository.findRecent(dateFrom, dateTo, org.springframework.data.domain.PageRequest.of(0, 5)).stream()
                        .map(invoice -> new DashboardResponse.RecentInvoice(
                                invoice.getId(),
                                invoice.getInvoiceNumber(),
                                invoice.getInvoiceDate(),
                                invoice.getCustomer() == null ? null : invoice.getCustomer().getName(),
                                invoice.getTotalAmount(),
                                invoice.getInvoiceItems() == null || invoice.getInvoiceItems().isEmpty()
                                    || invoice.getInvoiceItems().get(0).getMaterialType() == null
                                    ? null : invoice.getInvoiceItems().get(0).getMaterialType().getName(),
                                invoice.getInvoiceItems() == null || invoice.getInvoiceItems().isEmpty()
                                    ? null : invoice.getInvoiceItems().get(0).getQuantityBrass(),
                                invoice.getInvoiceItems() == null || invoice.getInvoiceItems().isEmpty()
                                    ? null : invoice.getInvoiceItems().get(0).getRate()))
                        .toList());
    }

    @Transactional(readOnly = true)
    public DashboardChartsResponse getCharts(LocalDate dateFrom, LocalDate dateTo) {
        List<DashboardChartsResponse.SalesPoint> salesByDate = invoiceRepository.salesByDate(dateFrom, dateTo).stream()
                .map(row -> new DashboardChartsResponse.SalesPoint(
                        (LocalDate) row[0], (long) row[1], (BigDecimal) row[2]))
                .toList();

        List<DashboardChartsResponse.ExpenseCategoryPoint> expensesByCategory = expenseRepository
                .summarizeByCategory(dateFrom, dateTo).stream()
                .map(row -> new DashboardChartsResponse.ExpenseCategoryPoint(
                        (String) row[0], (BigDecimal) row[1]))
                .toList();

        List<DashboardChartsResponse.InwardPoint> truckInwardByDate = truckEntryRepository
                .inwardByDate(dateFrom, dateTo).stream()
                .map(row -> new DashboardChartsResponse.InwardPoint(
                        (LocalDate) row[0], (long) row[1], (BigDecimal) row[2]))
                .toList();

        List<DashboardChartsResponse.MaterialSalesPoint> materialWiseSales = invoiceRepository
                .materialWiseSales(dateFrom, dateTo).stream()
                .map(row -> new DashboardChartsResponse.MaterialSalesPoint(
                        (String) row[0], (BigDecimal) row[1], (BigDecimal) row[2]))
                .toList();

        return new DashboardChartsResponse(salesByDate, expensesByCategory, truckInwardByDate, materialWiseSales);
    }
}