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
import com.productapp.security.SecurityUtils;
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
        List<Payment> payments = SecurityUtils.isManager()
                ? paymentRepository.findAllByIsActiveTrueAndPaymentDateOrderByCreatedAtDesc(LocalDate.now())
                : paymentRepository.findAllByIsActiveTrueOrderByCreatedAtDesc();
        return payments.stream()
                .map(PaymentResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public PaymentResponse getById(Long id) {
        Payment payment = paymentRepository.findByIdAndIsActiveTrue(id)
                .filter(found -> !SecurityUtils.isManager() || LocalDate.now().equals(found.getPaymentDate()))
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found with id : " + id));
        return PaymentResponse.fromEntity(payment);
    }

    @Transactional
    public PaymentResponse update(Long id, CustomerPaymentRequest request) {
        Payment payment = getActivePayment(id);
        Customer customer = customerRepository.findByIdAndIsActiveTrue(payment.getCustomer().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found"));
        validatePayment(request);

        payment.setCustomer(customer);
        payment.setAmount(request.getAmount());
        payment.setPaymentDate(request.getPaymentDate());
        payment.setPaymentMode(normalizePaymentMode(request.getPaymentMode()));
        payment.setChequeNumber(request.getChequeNumber());
        payment.setExternalRef(request.getExternalRef());
        payment.setNotes(request.getNotes());
        Payment savedPayment = paymentRepository.save(payment);
        CustomerLedger ledger = customerLedgerRepository
            .findFirstBySourceTypeAndSourceIdAndIsActiveTrueOrderByIdDesc("PAYMENT", savedPayment.getId())
            .orElseThrow(() -> new ResourceNotFoundException(
                "Ledger entry not found for payment id : " + savedPayment.getId()));
        updateLedgerEntry(ledger, savedPayment);
        return PaymentResponse.fromEntity(savedPayment);
    }

    @Transactional
    public void delete(Long id) {
        Payment payment = getActivePayment(id);
        CustomerLedger ledger = customerLedgerRepository
            .findFirstBySourceTypeAndSourceIdAndIsActiveTrueOrderByIdDesc("PAYMENT", payment.getId())
            .orElseThrow(() -> new ResourceNotFoundException(
                "Ledger entry not found for payment id : " + payment.getId()));
        ledger.setIsActive(false);
        customerLedgerRepository.save(ledger);
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

    private void updateLedgerEntry(CustomerLedger ledger, Payment payment) {
        ledger.setEntryDate(payment.getPaymentDate());
        ledger.setCustomer(payment.getCustomer());
        ledger.setEntryType("CUSTOMER_PAYMENT");
        ledger.setReference("PAYMENT-" + payment.getId());
        ledger.setDescription(payment.getNotes() == null ? "Customer payment" : payment.getNotes());
        ledger.setDebit(BigDecimal.ZERO);
        ledger.setCredit(payment.getAmount());
        customerLedgerRepository.save(ledger);
    }

}
