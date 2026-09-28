package com.productapp.service;

import com.productapp.dto.CustomerResponse;
import com.productapp.dto.CustomerSummaryResponse;
import com.productapp.dto.PaymentResponse;
import com.productapp.entity.Customer;
import com.productapp.exceptions.ResourceNotFoundException;
import com.productapp.repository.CustomerRepository;
import com.productapp.repository.InvoiceRepository;
import com.productapp.repository.PaymentRepository;
import com.productapp.repository.UserRepository;
import com.productapp.dto.InvoiceResponse;
import com.productapp.dto.CustomerLedgerEntry;
import com.productapp.entity.CustomerPaymentRequest;
import com.productapp.entity.Payment;
import com.productapp.entity.User;
import com.productapp.entity.CustomerLedger;
import com.productapp.repository.CustomerLedgerRepository;
import com.productapp.security.SecurityUtils;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.List;
import java.util.ArrayList;
import java.util.stream.Collectors;

@Service
public class CustomerService {

    private final CustomerRepository customerRepository;
    private final InvoiceRepository invoiceRepository;
    private final PaymentRepository paymentRepository;
    private final UserRepository userRepository;
    private final CustomerLedgerRepository customerLedgerRepository;

    public CustomerService(CustomerRepository customerRepository, InvoiceRepository invoiceRepository,
                   PaymentRepository paymentRepository, UserRepository userRepository,
                   CustomerLedgerRepository customerLedgerRepository) {
        this.customerRepository = customerRepository;
        this.invoiceRepository = invoiceRepository;
        this.paymentRepository = paymentRepository;
        this.userRepository = userRepository;
        this.customerLedgerRepository = customerLedgerRepository;
    }

    @Transactional
    public PaymentResponse recordPayment(Long customerId, CustomerPaymentRequest request) {
        SecurityUtils.requireTodayForManager(request.getPaymentDate());
        Customer customer = customerRepository.findByIdAndIsActiveTrue(customerId)
            .orElseThrow(() -> new ResourceNotFoundException("Customer not found"));

        if (request.getAmount() == null || request.getAmount().signum() <= 0) {
            throw new IllegalArgumentException("Payment amount must be greater than zero");
        }

        String paymentMode = request.getPaymentMode() == null || request.getPaymentMode().isBlank()
            ? "cash" : request.getPaymentMode();
        if ("cheque".equalsIgnoreCase(paymentMode)
            && (request.getChequeNumber() == null || request.getChequeNumber().isBlank())) {
            throw new IllegalArgumentException("Cheque number is required for cheque payments");
        }

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User createdBy = userRepository.findByUsernameAndIsActiveTrue(authentication.getName())
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Payment payment = new Payment();
        payment.setCustomer(customer);
        payment.setAmount(request.getAmount());
        payment.setPaymentDate(request.getPaymentDate());
        payment.setPaymentMode(paymentMode);
        payment.setChequeNumber(request.getChequeNumber());
        payment.setExternalRef(request.getExternalRef());
        payment.setNotes(request.getNotes());
        payment.setEntryType("CUSTOMER_PAYMENT");
        payment.setCreatedBy(createdBy);

        Payment savedPayment = paymentRepository.save(payment);
        customerLedgerRepository.save(CustomerLedger.builder()
            .entryDate(savedPayment.getPaymentDate())
            .customer(customer)
            .entryType("CUSTOMER_PAYMENT")
            .reference("PAYMENT-" + savedPayment.getId())
            .description(savedPayment.getNotes() == null ? "Customer payment" : savedPayment.getNotes())
            .debit(BigDecimal.ZERO)
            .credit(savedPayment.getAmount())
            .sourceType("PAYMENT")
            .sourceId(savedPayment.getId())
            .build());

        return PaymentResponse.fromEntity(savedPayment);
    }

    @Transactional
    public CustomerResponse save(Customer customer) {
        return CustomerResponse.fromEntity(customerRepository.save(customer));
    }

    public List<CustomerResponse> getAll() {
        List<Customer> customers = customerRepository.findAllByIsActiveTrueOrderByCreatedAtDesc();

        return customers.stream()
            .map(customer -> CustomerResponse.fromEntity(
                customer,
                getPendingBalance(customer.getId())
            ))
                .collect(Collectors.toList());
    }

    public Page<CustomerResponse> getPage(Pageable pageable) {
        Page<Customer> customersPage = customerRepository.findAllByIsActiveTrueOrderByCreatedAtDesc(pageable);
        List<Long> customerIds = customersPage.getContent().stream()
            .map(Customer::getId)
            .toList();

        return customersPage.map(customer -> CustomerResponse.fromEntity(
            customer,
            getPendingBalance(customer.getId())
        ));
    }

    public CustomerResponse getById(Long id) {
        Customer customer = customerRepository.findById(id)
            .filter(foundCustomer -> Boolean.TRUE.equals(foundCustomer.getIsActive()))
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id : " + id));
        return CustomerResponse.fromEntity(customer, getPendingBalance(id));
    }

    @Transactional(readOnly = true)
    public CustomerSummaryResponse getSummary(Long id) {
        Customer customer = customerRepository.findById(id)
            .filter(foundCustomer -> Boolean.TRUE.equals(foundCustomer.getIsActive()))
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id : " + id));

        CustomerResponse customerResponse = CustomerResponse.fromEntity(customer,
            getPendingBalance(id));

        List<PaymentResponse> recentPayments = paymentRepository
                .findAllByCustomerIdAndIsActiveTrueOrderByCreatedAtDesc(id).stream()
                .limit(10)
                .map(PaymentResponse::fromEntity)
                .toList();

        List<InvoiceResponse> recentInvoices = invoiceRepository
                .findAllByCustomerIdAndIsActiveTrueOrderByCreatedAtDesc(id).stream()
                .limit(10)
                .map(InvoiceResponse::fromEntity)
                .toList();

        return new CustomerSummaryResponse(customerResponse, recentPayments, recentInvoices, buildLedger(id));
    }

    @Transactional(readOnly = true)
    public List<InvoiceResponse> getInvoices(Long customerId) {
        customerRepository.findByIdAndIsActiveTrue(customerId)
            .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id : " + customerId));
        return invoiceRepository.findAllByCustomerIdAndIsActiveTrueOrderByCreatedAtDesc(customerId).stream()
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
        return CustomerResponse.fromEntity(saved, getPendingBalance(saved.getId()));
    }

    @Transactional
    public void delete(Long id) {
        Customer existing = customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id : " + id));
        if (getPendingBalance(id).signum() > 0) {
            throw new IllegalArgumentException("Customer cannot be deactivated with an outstanding balance");
        }
                existing.setIsActive(false);
                customerRepository.save(existing);
    }

    private BigDecimal getPendingBalance(Long customerId) {
        return customerLedgerRepository.findAllByCustomerIdAndIsActiveTrueOrderByEntryDateAscIdAsc(customerId)
            .stream()
            .map(entry -> entry.getDebit().subtract(entry.getCredit()))
            .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private List<CustomerLedgerEntry> buildLedger(Long customerId) {
        BigDecimal runningBalance = BigDecimal.ZERO;
        List<CustomerLedgerEntry> result = new ArrayList<>();
        for (CustomerLedger entry : customerLedgerRepository
            .findAllByCustomerIdAndIsActiveTrueOrderByEntryDateAscIdAsc(customerId)) {
            runningBalance = runningBalance.add(entry.getDebit()).subtract(entry.getCredit());
            result.add(new CustomerLedgerEntry(entry.getEntryDate(), entry.getEntryType(), entry.getReference(),
                entry.getDescription(), entry.getDebit(), entry.getCredit(), runningBalance));
        }
        return result;
    }
}
