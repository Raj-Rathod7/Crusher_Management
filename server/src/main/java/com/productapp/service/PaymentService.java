package com.productapp.service;

import com.productapp.dto.AdvanceReceiptResponse;
import com.productapp.dto.PaymentResponse;
import com.productapp.entity.AdvanceReceiptRequest;
import com.productapp.entity.Customer;
import com.productapp.entity.Invoice;
import com.productapp.entity.Payment;
import com.productapp.entity.ReversePaymentRequest;
import com.productapp.entity.User;
import com.productapp.exceptions.ResourceNotFoundException;
import com.productapp.repository.CustomerRepository;
import com.productapp.repository.InvoiceRepository;
import com.productapp.repository.PaymentRepository;
import com.productapp.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class PaymentService {

    private static final String ENTRY_TYPE_ADVANCE_RECEIPT = "ADVANCE_RECEIPT";
    private static final String ENTRY_TYPE_CREDIT_APPLIED = "CREDIT_APPLIED";
    private static final String ENTRY_TYPE_CREDIT_ADJUSTMENT = "CREDIT_ADJUSTMENT";
    private static final String DIRECTION_CREDIT_IN = "CREDIT_IN";
    private static final String DIRECTION_CREDIT_OUT = "CREDIT_OUT";
    private static final List<String> RECEIPT_ENTRY_TYPES = List.of(ENTRY_TYPE_ADVANCE_RECEIPT, ENTRY_TYPE_CREDIT_ADJUSTMENT);

    private final PaymentRepository paymentRepository;
    private final InvoiceRepository invoiceRepository;
    private final CustomerRepository customerRepository;
    private final UserRepository userRepository;

    public PaymentService(PaymentRepository paymentRepository, InvoiceRepository invoiceRepository,
                          CustomerRepository customerRepository, UserRepository userRepository) {
        this.paymentRepository = paymentRepository;
        this.invoiceRepository = invoiceRepository;
        this.customerRepository = customerRepository;
        this.userRepository = userRepository;
    }

    public PaymentResponse save(Payment payment) {
        Customer customer = customerRepository.findByIdAndIsActiveTrue(payment.getCustomer().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found"));
        payment.setCustomer(customer);
        if (payment.getInvoice() != null && payment.getInvoice().getId() != null) {
            Invoice invoice = invoiceRepository.findById(payment.getInvoice().getId())
                .filter(foundInvoice -> Boolean.TRUE.equals(foundInvoice.getIsActive()))
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found"));
            payment.setInvoice(invoice);
        } else {
            payment.setInvoice(null);
        }
        if (payment.getEntryType() == null) {
            payment.setEntryType("INVOICE_PAYMENT");
        }
        payment.setCreatedBy(getCurrentUser());
        return PaymentResponse.fromEntity(paymentRepository.save(payment));
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

    public BigDecimal getAvailableCredit(Long customerId) {
        BigDecimal creditIn = paymentRepository.sumAmountByCustomerIdAndDirection(customerId, DIRECTION_CREDIT_IN);
        BigDecimal creditOut = paymentRepository.sumAmountByCustomerIdAndDirection(customerId, DIRECTION_CREDIT_OUT);
        return creditIn.subtract(creditOut);
    }

    @Transactional
    public AdvanceReceiptResponse createAdvanceReceipt(AdvanceReceiptRequest request) {
        Customer customer = customerRepository.findByIdAndIsActiveTrue(request.getCustomerId())
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found"));

        Payment payment = new Payment();
        payment.setCustomer(customer);
        payment.setInvoice(null);
        payment.setAmount(request.getAmount());
        payment.setPaymentDate(request.getPaymentDate());
        payment.setPaymentMode(request.getPaymentMode() != null ? request.getPaymentMode() : "cash");
        payment.setReceiptNumber(request.getReceiptNumber());
        payment.setExternalRef(request.getExternalRef());
        payment.setNotes(request.getNotes());
        payment.setEntryType(ENTRY_TYPE_ADVANCE_RECEIPT);
        payment.setDirection(DIRECTION_CREDIT_IN);
        payment.setCreatedBy(getCurrentUser());

        Payment saved = paymentRepository.save(payment);
        return new AdvanceReceiptResponse(PaymentResponse.fromEntity(saved), getAvailableCredit(customer.getId()));
    }

    public List<PaymentResponse> listReceipts(Long customerId, LocalDate dateFrom, LocalDate dateTo) {
        return paymentRepository.findReceipts(RECEIPT_ENTRY_TYPES, customerId, dateFrom, dateTo).stream()
                .map(PaymentResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public AdvanceReceiptResponse reverseReceipt(Long id, ReversePaymentRequest request) {
        Payment original = paymentRepository.findById(id)
                .filter(foundPayment -> Boolean.TRUE.equals(foundPayment.getIsActive()))
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found with id : " + id));
        if (!ENTRY_TYPE_ADVANCE_RECEIPT.equals(original.getEntryType())) {
            throw new IllegalArgumentException("Only advance receipts can be reversed");
        }

        Payment reversal = new Payment();
        reversal.setCustomer(original.getCustomer());
        reversal.setInvoice(null);
        reversal.setAmount(original.getAmount());
        reversal.setPaymentDate(LocalDate.now());
        reversal.setPaymentMode(original.getPaymentMode());
        reversal.setNotes("Reversal of receipt #" + original.getId() + ": " + request.getReason());
        reversal.setEntryType(ENTRY_TYPE_CREDIT_ADJUSTMENT);
        reversal.setDirection(DIRECTION_CREDIT_OUT);
        reversal.setSourceReceipt(original);
        reversal.setCreatedBy(getCurrentUser());

        Payment saved = paymentRepository.save(reversal);
        return new AdvanceReceiptResponse(PaymentResponse.fromEntity(saved),
                getAvailableCredit(original.getCustomer().getId()));
    }

    /**
     * Records credit consumed by an invoice; called from InvoiceService within its transaction.
     * Consumes the customer's advance receipts oldest-first (FIFO) so each CREDIT_APPLIED row
     * traces back to the specific receipt(s) that funded it via sourceReceipt.
     */
    public void applyCreditToInvoice(Customer customer, Invoice invoice, BigDecimal amount, User createdBy) {
        BigDecimal remainingToApply = amount;
        List<Payment> receipts = paymentRepository.findAllByCustomerIdAndEntryTypeOrderByPaymentDateAscIdAsc(
                customer.getId(), ENTRY_TYPE_ADVANCE_RECEIPT);

        for (Payment receipt : receipts) {
            if (remainingToApply.signum() <= 0) {
                break;
            }

            BigDecimal alreadyConsumed = paymentRepository.sumAmountBySourceReceiptId(receipt.getId());
            BigDecimal receiptRemaining = receipt.getAmount().subtract(alreadyConsumed);
            if (receiptRemaining.signum() <= 0) {
                continue;
            }

            BigDecimal portion = receiptRemaining.min(remainingToApply);
            saveCreditApplied(customer, invoice, receipt, portion, createdBy);
            remainingToApply = remainingToApply.subtract(portion);
        }

        if (remainingToApply.signum() > 0) {
            // fallback: credit available but not traceable to a specific receipt (e.g. adjustments)
            saveCreditApplied(customer, invoice, null, remainingToApply, createdBy);
        }
    }

    private void saveCreditApplied(Customer customer, Invoice invoice, Payment sourceReceipt, BigDecimal amount, User createdBy) {
        Payment payment = new Payment();
        payment.setCustomer(customer);
        payment.setInvoice(invoice);
        payment.setAmount(amount);
        payment.setPaymentDate(invoice.getInvoiceDate());
        payment.setPaymentMode("credit");
        payment.setNotes("Credit applied to invoice " + invoice.getInvoiceNumber());
        payment.setEntryType(ENTRY_TYPE_CREDIT_APPLIED);
        payment.setDirection(DIRECTION_CREDIT_OUT);
        payment.setSourceReceipt(sourceReceipt);
        payment.setCreatedBy(createdBy);
        paymentRepository.save(payment);
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return userRepository.findByUsernameAndIsActiveTrue(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }
}
