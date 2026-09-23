package com.productapp.controller;

import com.productapp.dto.CustomerResponse;
import com.productapp.dto.CustomerSummaryResponse;
import com.productapp.dto.InvoiceResponse;
import com.productapp.entity.Customer;
import com.productapp.entity.CustomerPaymentRequest;
import com.productapp.dto.PaymentResponse;
import com.productapp.service.CustomerService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import java.util.List;
import java.time.LocalDate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

@RestController
@RequestMapping("/customers")
public class CustomerController {

    private final CustomerService customerService;
    private final com.productapp.service.CustomerLedgerExportService customerLedgerExportService;

    public CustomerController(CustomerService customerService,
                              com.productapp.service.CustomerLedgerExportService customerLedgerExportService) {
        this.customerService = customerService;
        this.customerLedgerExportService = customerLedgerExportService;
    }

    @PostMapping
    public CustomerResponse create(@RequestBody Customer customer) {
        return customerService.save(customer);
    }

    @GetMapping
    public List<CustomerResponse> getAll() {
        return customerService.getAll();
    }

    @GetMapping("/page")
    public Page<CustomerResponse> getPage(Pageable pageable) {
        return customerService.getPage(pageable);
    }

    @GetMapping("/{id}/invoices")
    public List<InvoiceResponse> getInvoices(@PathVariable Long id) {
        return customerService.getInvoices(id);
    }

    @GetMapping("/{id}/summary")
    public CustomerSummaryResponse getSummary(@PathVariable Long id) {
        return customerService.getSummary(id);
    }

    @GetMapping("/{id}/ledger/export.xlsx")
    public ResponseEntity<byte[]> exportLedgerExcel(@PathVariable Long id,
                                                     @RequestParam(required = false) LocalDate dateFrom,
                                                     @RequestParam(required = false) LocalDate dateTo) {
        byte[] content = customerLedgerExportService.exportExcel(id, dateFrom, dateTo);
        return exportResponse(content, "customer-ledger-" + id + ".xlsx",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    }

    @GetMapping("/{id}/ledger/export.pdf")
    public ResponseEntity<byte[]> exportLedgerPdf(@PathVariable Long id,
                                                   @RequestParam(required = false) LocalDate dateFrom,
                                                   @RequestParam(required = false) LocalDate dateTo) {
        byte[] content = customerLedgerExportService.exportPdf(id, dateFrom, dateTo);
        return exportResponse(content, "customer-ledger-" + id + ".pdf", MediaType.APPLICATION_PDF_VALUE);
    }

    private ResponseEntity<byte[]> exportResponse(byte[] content, String filename, String contentType) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(contentType));
        headers.setContentDisposition(ContentDisposition.attachment().filename(filename).build());
        headers.setContentLength(content.length);
        return ResponseEntity.ok().headers(headers).body(content);
    }

    @PostMapping("/{id}/payments")
    public PaymentResponse recordPayment(@PathVariable Long id,
                                         @Valid @RequestBody CustomerPaymentRequest request) {
        return customerService.recordPayment(id, request);
    }

    @GetMapping("/{id}")
    public CustomerResponse getById(@PathVariable Long id) {
        return customerService.getById(id);
    }

    @PutMapping("/{id}")
    public CustomerResponse update(@PathVariable Long id, @RequestBody Customer customer) {
        return customerService.update(id, customer);
    }
}
