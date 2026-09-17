package com.productapp.controller;

import com.productapp.dto.InvoiceResponse;
import com.productapp.entity.ApplyCreditRequest;
import com.productapp.entity.Invoice;
import com.productapp.entity.InvoiceRequest;
import com.productapp.entity.RecordInvoicePaymentRequest;
import com.productapp.service.InvoiceService;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

@RestController
@RequestMapping("/invoices")
public class InvoiceController {

    private final InvoiceService invoiceService;

    public InvoiceController(InvoiceService invoiceService) {
        this.invoiceService = invoiceService;
    }

    @PostMapping
    public InvoiceResponse create(@Valid @RequestBody InvoiceRequest invoiceRequest) {
        return invoiceService.createInvoice(invoiceRequest);
    }

    @PostMapping("/{id}/apply-credit")
    public InvoiceResponse applyCredit(@PathVariable Long id, @RequestBody(required = false) ApplyCreditRequest request) {
        return invoiceService.applyCreditToExistingInvoice(id, request != null ? request.getCreditToApply() : null);
    }

    @PostMapping("/{id}/payments")
    public InvoiceResponse recordPayment(@PathVariable Long id, @Valid @RequestBody RecordInvoicePaymentRequest request) {
        return invoiceService.recordPayment(id, request);
    }

    @GetMapping
    public List<InvoiceResponse> getAll() {
        return invoiceService.getAll();
    }

    @GetMapping("/page")
    public Page<InvoiceResponse> getPage(Pageable pageable) {
        return invoiceService.getPage(pageable);
    }

    @GetMapping("/{id}")
    public InvoiceResponse getById(@PathVariable Long id) {
        return invoiceService.getById(id);
    }
}
