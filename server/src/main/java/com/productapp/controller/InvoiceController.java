package com.productapp.controller;

import com.productapp.dto.InvoiceResponse;
import com.productapp.entity.InvoiceRequest;
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

    @PutMapping("/{id}")
    public InvoiceResponse update(@PathVariable Long id, @Valid @RequestBody InvoiceRequest invoiceRequest) {
        return invoiceService.updateInvoice(id, invoiceRequest);
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

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        invoiceService.delete(id);
    }
}
