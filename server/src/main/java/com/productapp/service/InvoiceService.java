package com.productapp.service;

import com.productapp.dto.InvoiceResponse;
import com.productapp.entity.Customer;
import com.productapp.entity.Invoice;
import com.productapp.exceptions.ResourceNotFoundException;
import com.productapp.repository.CustomerRepository;
import com.productapp.repository.InvoiceRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final CustomerRepository customerRepository;

    public InvoiceService(InvoiceRepository invoiceRepository, CustomerRepository customerRepository) {
        this.invoiceRepository = invoiceRepository;
        this.customerRepository = customerRepository;
    }

    public InvoiceResponse save(Invoice invoice) {
        Customer customer = customerRepository.findById(invoice.getCustomer().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found"));
        invoice.setCustomer(customer);
        return InvoiceResponse.fromEntity(invoiceRepository.save(invoice));
    }

    public List<InvoiceResponse> getAll() {
        return invoiceRepository.findAll().stream()
                .map(InvoiceResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public InvoiceResponse getById(Long id) {
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found with id : " + id));
        return InvoiceResponse.fromEntity(invoice);
    }
}
