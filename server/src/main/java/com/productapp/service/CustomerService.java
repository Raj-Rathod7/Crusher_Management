package com.productapp.service;

import com.productapp.dto.CustomerResponse;
import com.productapp.entity.Customer;
import com.productapp.exceptions.ResourceNotFoundException;
import com.productapp.repository.CustomerRepository;
import com.productapp.repository.InvoiceRepository;
import com.productapp.dto.InvoiceResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class CustomerService {

    private final CustomerRepository customerRepository;
    private final InvoiceRepository invoiceRepository;

    public CustomerService(CustomerRepository customerRepository, InvoiceRepository invoiceRepository) {
        this.customerRepository = customerRepository;
        this.invoiceRepository = invoiceRepository;
    }

    @Transactional
    public CustomerResponse save(Customer customer) {
        return CustomerResponse.fromEntity(customerRepository.save(customer));
    }

    public List<CustomerResponse> getAll() {
        return customerRepository.findAllByIsActiveTrue().stream()
                .map(CustomerResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public Page<CustomerResponse> getPage(Pageable pageable) {
        return customerRepository.findAllByIsActiveTrue(pageable).map(CustomerResponse::fromEntity);
    }

    public CustomerResponse getById(Long id) {
        Customer customer = customerRepository.findById(id)
            .filter(foundCustomer -> Boolean.TRUE.equals(foundCustomer.getIsActive()))
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id : " + id));
        return CustomerResponse.fromEntity(customer);
    }

    @Transactional(readOnly = true)
    public List<InvoiceResponse> getInvoices(Long customerId) {
        customerRepository.findByIdAndIsActiveTrue(customerId)
            .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id : " + customerId));
        return invoiceRepository.findAllByCustomerIdAndIsActiveTrueOrderByInvoiceDateDesc(customerId).stream()
            .map(InvoiceResponse::fromEntity)
            .toList();
        }

    @Transactional
    public CustomerResponse update(Long id, Customer customer) {
        Customer existing = customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id : " + id));
        existing.setName(customer.getName());
        existing.setPhone(customer.getPhone());
        existing.setAddress(customer.getAddress());
        existing.setNotes(customer.getNotes());
        if (customer.getIsActive() != null) {
            existing.setIsActive(customer.getIsActive());
        }
        return CustomerResponse.fromEntity(customerRepository.save(existing));
    }

    @Transactional
    public void delete(Long id) {
        Customer existing = customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id : " + id));
        if (invoiceRepository.sumOutstandingBalanceByCustomerId(id).signum() > 0) {
            throw new IllegalArgumentException("Customer cannot be deactivated with an outstanding balance");
        }
                existing.setIsActive(false);
                customerRepository.save(existing);
    }
}
