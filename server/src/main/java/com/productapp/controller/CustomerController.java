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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

@RestController
@RequestMapping("/customers")
public class CustomerController {

    private final CustomerService customerService;

    public CustomerController(CustomerService customerService) {
        this.customerService = customerService;
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
