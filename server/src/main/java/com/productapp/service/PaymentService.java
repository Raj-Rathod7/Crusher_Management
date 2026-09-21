package com.productapp.service;

import com.productapp.dto.PaymentResponse;
import com.productapp.entity.Customer;
import com.productapp.entity.CustomerLedger;
import com.productapp.entity.CustomerPaymentRequest;
import com.productapp.entity.Payment;
import com.productapp.exceptions.ResourceNotFoundException;
import com.productapp.repository.CustomerLedgerRepository;
import com.productapp.repository.CustomerRepository;
import com.productapp.repository.PaymentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final CustomerRepository customerRepository;
    private final CustomerLedgerRepository customerLedgerRepository;

    public PaymentService(PaymentRepository paymentRepository, CustomerRepository customerRepository,
                          CustomerLedgerRepository customerLedgerRepository) {
        this.paymentRepository = paymentRepository;
        this.customerRepository = customerRepository;
        this.customerLedgerRepository = customerLedgerRepository;
    }

    public List<PaymentResponse> getAll() {
        return paymentRepository.findAll().stream()
                .filter(payment -> Boolean.TRUE.equals(payment.getIsActive()))
                .map(PaymentResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public PaymentResponse getById(Long id) {
        Payment payment = paymentRepository.findById(id)
            .filter(foundPayment -> Boolean.TRUE.equals(foundPayment.getIsActive()))
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found with id : " + id));
        return PaymentResponse.fromEntity(payment);
    }

    @Transactional
    public PaymentResponse update(Long id, CustomerPaymentRequest request) {
        Payment payment = getActivePayment(id);
        Customer customer = customerRepository.findByIdAndIsActiveTrue(payment.getCustomer().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found"));
        validatePayment(request);

        postLedgerEntry(payment.getPaymentDate(), customer, "CUSTOMER_PAYMENT_REVERSAL",
                "PAYMENT-" + payment.getId() + "-REVERSAL", "Reversal of customer payment",
                payment.getAmount(), BigDecimal.ZERO, "PAYMENT", payment.getId());

        payment.setCustomer(customer);
        payment.setAmount(request.getAmount());
        payment.setPaymentDate(request.getPaymentDate());
        payment.setPaymentMode(normalizePaymentMode(request.getPaymentMode()));
        payment.setChequeNumber(request.getChequeNumber());
        payment.setExternalRef(request.getExternalRef());
        payment.setNotes(request.getNotes());
        Payment savedPayment = paymentRepository.save(payment);
        postLedgerEntry(savedPayment.getPaymentDate(), customer, "CUSTOMER_PAYMENT",
                "PAYMENT-" + savedPayment.getId(), savedPayment.getNotes() == null
                        ? "Customer payment" : savedPayment.getNotes(),
                BigDecimal.ZERO, savedPayment.getAmount(), "PAYMENT", savedPayment.getId());
        return PaymentResponse.fromEntity(savedPayment);
    }

    @Transactional
    public void delete(Long id) {
        Payment payment = getActivePayment(id);
        postLedgerEntry(payment.getPaymentDate(), payment.getCustomer(), "CUSTOMER_PAYMENT_REVERSAL",
                "PAYMENT-" + payment.getId() + "-REVERSAL", "Reversal of deleted customer payment",
                payment.getAmount(), BigDecimal.ZERO, "PAYMENT", payment.getId());
        payment.setIsActive(false);
        paymentRepository.save(payment);
    }

    private Payment getActivePayment(Long id) {
        return paymentRepository.findById(id)
                .filter(payment -> Boolean.TRUE.equals(payment.getIsActive()))
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found with id : " + id));
    }

    private void validatePayment(CustomerPaymentRequest request) {
        if (request.getAmount() == null || request.getAmount().signum() <= 0) {
            throw new IllegalArgumentException("Payment amount must be greater than zero");
        }
        if ("cheque".equalsIgnoreCase(normalizePaymentMode(request.getPaymentMode()))
                && (request.getChequeNumber() == null || request.getChequeNumber().isBlank())) {
            throw new IllegalArgumentException("Cheque number is required for cheque payments");
        }
    }

    private String normalizePaymentMode(String paymentMode) {
        return paymentMode == null || paymentMode.isBlank() ? "cash" : paymentMode;
    }

    private void postLedgerEntry(LocalDate entryDate, Customer customer, String entryType, String reference,
                                 String description, BigDecimal debit, BigDecimal credit,
                                 String sourceType, Long sourceId) {
        customerLedgerRepository.save(CustomerLedger.builder()
                .entryDate(entryDate)
                .customer(customer)
                .entryType(entryType)
                .reference(reference)
                .description(description)
                .debit(debit)
                .credit(credit)
                .sourceType(sourceType)
                .sourceId(sourceId)
                .build());
    }

}
