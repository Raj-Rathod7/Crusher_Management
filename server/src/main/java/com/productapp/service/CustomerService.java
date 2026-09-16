package com.productapp.service;

import com.productapp.dto.CustomerResponse;
import com.productapp.dto.CustomerSummaryResponse;
import com.productapp.dto.PaymentResponse;
import com.productapp.entity.Customer;
import com.productapp.exceptions.ResourceNotFoundException;
import com.productapp.repository.CustomerRepository;
import com.productapp.repository.InvoiceRepository;
import com.productapp.repository.PaymentRepository;
import com.productapp.dto.InvoiceResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class CustomerService {

    private final CustomerRepository customerRepository;
    private final InvoiceRepository invoiceRepository;
    private final PaymentRepository paymentRepository;

    public CustomerService(CustomerRepository customerRepository, InvoiceRepository invoiceRepository,
                           PaymentRepository paymentRepository) {
        this.customerRepository = customerRepository;
        this.invoiceRepository = invoiceRepository;
        this.paymentRepository = paymentRepository;
    }

    @Transactional
    public CustomerResponse save(Customer customer) {
        return CustomerResponse.fromEntity(customerRepository.save(customer));
    }

    public List<CustomerResponse> getAll() {
        List<Customer> customers = customerRepository.findAllByIsActiveTrue();
        Map<Long, BigDecimal> pendingBalanceByCustomerId = getOutstandingBalanceMap();

        return customers.stream()
            .map(customer -> CustomerResponse.fromEntity(
                customer,
                pendingBalanceByCustomerId.getOrDefault(customer.getId(), BigDecimal.ZERO),
                getAvailableCredit(customer.getId())
            ))
                .collect(Collectors.toList());
    }

    public Page<CustomerResponse> getPage(Pageable pageable) {
        Page<Customer> customersPage = customerRepository.findAllByIsActiveTrue(pageable);
        List<Long> customerIds = customersPage.getContent().stream()
            .map(Customer::getId)
            .toList();

        Map<Long, BigDecimal> pendingBalanceByCustomerId = getOutstandingBalanceMap(customerIds);

        return customersPage.map(customer -> CustomerResponse.fromEntity(
            customer,
            pendingBalanceByCustomerId.getOrDefault(customer.getId(), BigDecimal.ZERO),
            getAvailableCredit(customer.getId())
        ));
    }

    public CustomerResponse getById(Long id) {
        Customer customer = customerRepository.findById(id)
            .filter(foundCustomer -> Boolean.TRUE.equals(foundCustomer.getIsActive()))
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id : " + id));
        return CustomerResponse.fromEntity(customer, invoiceRepository.sumOutstandingBalanceByCustomerId(id),
                getAvailableCredit(id));
    }

    public BigDecimal getAvailableCredit(Long customerId) {
        BigDecimal creditIn = paymentRepository.sumAmountByCustomerIdAndDirection(customerId, "CREDIT_IN");
        BigDecimal creditOut = paymentRepository.sumAmountByCustomerIdAndDirection(customerId, "CREDIT_OUT");
        return creditIn.subtract(creditOut);
    }

    @Transactional(readOnly = true)
    public CustomerSummaryResponse getSummary(Long id) {
        Customer customer = customerRepository.findById(id)
            .filter(foundCustomer -> Boolean.TRUE.equals(foundCustomer.getIsActive()))
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id : " + id));

        CustomerResponse customerResponse = CustomerResponse.fromEntity(customer,
                invoiceRepository.sumOutstandingBalanceByCustomerId(id), getAvailableCredit(id));

        List<PaymentResponse> recentPayments = paymentRepository
                .findAllByCustomerIdAndIsActiveTrueOrderByPaymentDateDesc(id).stream()
                .limit(10)
                .map(PaymentResponse::fromEntity)
                .toList();

        List<InvoiceResponse> recentInvoices = invoiceRepository
                .findAllByCustomerIdAndIsActiveTrueOrderByInvoiceDateDesc(id).stream()
                .limit(10)
                .map(InvoiceResponse::fromEntity)
                .toList();

        return new CustomerSummaryResponse(customerResponse, recentPayments, recentInvoices);
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
        Customer saved = customerRepository.save(existing);
        return CustomerResponse.fromEntity(saved, invoiceRepository.sumOutstandingBalanceByCustomerId(saved.getId()),
                getAvailableCredit(saved.getId()));
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

    private Map<Long, BigDecimal> getOutstandingBalanceMap() {
        return toOutstandingBalanceMap(invoiceRepository.sumOutstandingBalanceByCustomer());
    }

    private Map<Long, BigDecimal> getOutstandingBalanceMap(List<Long> customerIds) {
        if (customerIds == null || customerIds.isEmpty()) {
            return Map.of();
        }

        return toOutstandingBalanceMap(invoiceRepository.sumOutstandingBalanceByCustomerIds(customerIds));
    }

    private Map<Long, BigDecimal> toOutstandingBalanceMap(List<Object[]> rows) {
        Map<Long, BigDecimal> result = new HashMap<>();
        for (Object[] row : rows) {
            if (row.length < 2 || row[0] == null) {
                continue;
            }

            Long customerId = (Long) row[0];
            BigDecimal balance = (BigDecimal) row[1];
            result.put(customerId, balance == null ? BigDecimal.ZERO : balance);
        }
        return result;
    }
}
