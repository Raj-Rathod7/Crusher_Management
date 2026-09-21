package com.productapp.service;

import com.productapp.dto.DashboardResponse;
import com.productapp.repository.CustomerRepository;
import com.productapp.repository.CustomerLedgerRepository;
import com.productapp.repository.ExpenseRepository;
import com.productapp.repository.InvoiceRepository;
import com.productapp.repository.TruckEntryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
    public DashboardResponse getSummary() {
        return new DashboardResponse(
                invoiceRepository.sumTotalAmount(),
                customerLedgerRepository.sumCredits(),
                customerLedgerRepository.sumDebits().subtract(customerLedgerRepository.sumCredits()),
                expenseRepository.sumAmount(),
                customerRepository.countByIsActiveTrue(),
                truckEntryRepository.countByIsActiveTrue(),
                invoiceRepository.findTop5ByIsActiveTrueOrderByInvoiceDateDesc().stream()
                        .map(invoice -> new DashboardResponse.RecentInvoice(
                                invoice.getId(),
                                invoice.getInvoiceNumber(),
                                invoice.getInvoiceDate(),
                                invoice.getCustomer() == null ? null : invoice.getCustomer().getName(),
                                invoice.getTotalAmount()))
                        .toList());
    }
}