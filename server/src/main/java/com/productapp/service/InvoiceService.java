package com.productapp.service;

import com.productapp.dto.InvoiceResponse;
import com.productapp.entity.Customer;
import com.productapp.entity.Invoice;
import com.productapp.exceptions.ResourceNotFoundException;
import com.productapp.repository.CustomerRepository;
import com.productapp.repository.InvoiceRepository;
import com.productapp.repository.MaterialRepository;
import com.productapp.entity.InvoiceItem;
import com.productapp.entity.InvoiceItemRequest;
import com.productapp.entity.InvoiceRequest;
import com.productapp.entity.MaterialType;
import com.productapp.entity.RecordInvoicePaymentRequest;
import com.productapp.entity.User;
import com.productapp.repository.UserRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDate;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;
 
@Service
public class InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final CustomerRepository customerRepository;
    private final MaterialRepository materialRepository;
    private final UserRepository userRepository;
    private final PaymentService paymentService;

    public InvoiceService(InvoiceRepository invoiceRepository, CustomerRepository customerRepository,
                          MaterialRepository materialRepository, UserRepository userRepository,
                          PaymentService paymentService) {
        this.invoiceRepository = invoiceRepository;
        this.customerRepository = customerRepository;
        this.materialRepository = materialRepository;
        this.userRepository = userRepository;
        this.paymentService = paymentService;
    }

    @Transactional
    public InvoiceResponse createInvoice(InvoiceRequest invoiceRequest) {
        Invoice invoice = new Invoice();
        User createdBy = getCurrentUser();
        Customer customer =
                customerRepository.findByIdAndIsActiveTrue(invoiceRequest.getCustomerId())
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Customer not found"));
        invoice.setCustomer(customer);
        invoice.setInvoiceDate(invoiceRequest.getInvoiceDate());
        invoice.setInvoiceNumber(invoiceRequest.getInvoiceNumber());
        invoice.setRemarks(invoiceRequest.getRemarks());

                            
        
        List<InvoiceItem> invoiceItems = new ArrayList<>();
        BigDecimal totalAmount = invoiceRequest.getTotalAmount();
        for (InvoiceItemRequest itemRequest : invoiceRequest.getInvoiceItems()) {

            MaterialType material = materialRepository.findByIdAndIsActiveTrue(
                    itemRequest.getMaterialTypeId())
                    .orElseThrow(() ->
                            new ResourceNotFoundException("Material not found"));

            InvoiceItem item = new InvoiceItem();

            item.setInvoice(invoice);
            item.setMaterialType(material);
            item.setQuantityBrass(itemRequest.getQuantityBrass());
            item.setRate(itemRequest.getRate());
            BigDecimal itemAmount = itemRequest.getQuantityBrass().multiply(itemRequest.getRate());
            item.setAmount(itemAmount);
            item.setTruckNumber(itemRequest.getTruckNumber());

            invoiceItems.add(item);
        }

        BigDecimal creditApplied = BigDecimal.ZERO;
        BigDecimal cashPaidNow = invoiceRequest.getCashPaidNow() != null ? invoiceRequest.getCashPaidNow() : BigDecimal.ZERO;
        BigDecimal amountPaid;
        Customer lockedCustomer = customer;

        if (Boolean.TRUE.equals(invoiceRequest.getApplyCredit())) {
            lockedCustomer = customerRepository.findByIdForUpdate(customer.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Customer not found"));
            BigDecimal availableCredit = paymentService.getAvailableCredit(lockedCustomer.getId());
            creditApplied = availableCredit;
            if (invoiceRequest.getCreditToApply() != null) {
                creditApplied = creditApplied.min(invoiceRequest.getCreditToApply());
            }
            creditApplied = creditApplied.min(totalAmount);
            if (creditApplied.signum() < 0) {
                creditApplied = BigDecimal.ZERO;
            }
            amountPaid = creditApplied.add(cashPaidNow);
        } else {
            amountPaid = invoiceRequest.getAmountPaid() != null ? invoiceRequest.getAmountPaid() : BigDecimal.ZERO;
        }

        BigDecimal balance = totalAmount.subtract(amountPaid);
        invoice.setAmountPaid(amountPaid);
        invoice.setTotalAmount(totalAmount);
        invoice.setBalance(balance);
        invoice.setStatus(resolveStatus(amountPaid, balance));
        invoice.setInvoiceItems(invoiceItems);
        invoice.setCreatedBy(createdBy);

        Invoice savedInvoice = invoiceRepository.save(invoice);

        if (creditApplied.signum() > 0) {
            paymentService.applyCreditToInvoice(lockedCustomer, savedInvoice, creditApplied, createdBy);
        }

        InvoiceResponse response = InvoiceResponse.fromEntity(savedInvoice);
        response.setAppliedReceipts(paymentService.listCreditApplicationsForInvoice(savedInvoice.getId()));
        response.setPayments(paymentService.listPaymentsForInvoice(savedInvoice));
        response.setCreditApplied(creditApplied);
        response.setCashPaid(cashPaidNow);
        response.setCustomerAvailableCreditAfterTxn(paymentService.getAvailableCredit(customer.getId()));
        return response;
    }

    private String resolveStatus(BigDecimal amountPaid, BigDecimal balance) {
        if (amountPaid.signum() == 0) {
            return "pending";
        }
        return balance.signum() == 0 ? "paid" : "partial";
    }

    @Transactional
    public InvoiceResponse applyCreditToExistingInvoice(Long invoiceId, BigDecimal creditToApply) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .filter(foundInvoice -> Boolean.TRUE.equals(foundInvoice.getIsActive()))
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found with id : " + invoiceId));

        if (invoice.getBalance().signum() <= 0) {
            throw new IllegalArgumentException("Invoice has no pending balance");
        }

        Customer lockedCustomer = customerRepository.findByIdForUpdate(invoice.getCustomer().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found"));

        BigDecimal amount = paymentService.getAvailableCredit(lockedCustomer.getId());
        if (creditToApply != null) {
            amount = amount.min(creditToApply);
        }
        amount = amount.min(invoice.getBalance());

        if (amount.signum() <= 0) {
            throw new IllegalArgumentException("No available credit to apply");
        }

        User createdBy = getCurrentUser();
        paymentService.applyCreditToInvoice(lockedCustomer, invoice, amount, createdBy);

        invoice.setAmountPaid(invoice.getAmountPaid().add(amount));
        invoice.setBalance(invoice.getTotalAmount().subtract(invoice.getAmountPaid()));
        invoice.setStatus(resolveStatus(invoice.getAmountPaid(), invoice.getBalance()));

        Invoice savedInvoice = invoiceRepository.save(invoice);

        InvoiceResponse response = InvoiceResponse.fromEntity(savedInvoice);
        response.setAppliedReceipts(paymentService.listCreditApplicationsForInvoice(savedInvoice.getId()));
        response.setPayments(paymentService.listPaymentsForInvoice(savedInvoice));
        response.setCreditApplied(amount);
        response.setCashPaid(BigDecimal.ZERO);
        response.setCustomerAvailableCreditAfterTxn(paymentService.getAvailableCredit(lockedCustomer.getId()));
        return response;
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return userRepository.findByUsernameAndIsActiveTrue(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    @Transactional
    public InvoiceResponse recordPayment(Long invoiceId, RecordInvoicePaymentRequest request) {
        Invoice invoice = invoiceRepository.findByIdForUpdate(invoiceId)
                .filter(foundInvoice -> Boolean.TRUE.equals(foundInvoice.getIsActive()))
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found with id : " + invoiceId));

        if (invoice.getBalance().signum() <= 0) {
            throw new IllegalArgumentException("Invoice has no pending balance");
        }
        if (request.getAmount().compareTo(invoice.getBalance()) > 0) {
            throw new IllegalArgumentException("Payment exceeds outstanding balance");
        }

        User createdBy = getCurrentUser();
        paymentService.recordInvoicePayment(invoice, request, createdBy);

        invoice.setAmountPaid(invoice.getAmountPaid().add(request.getAmount()));
        invoice.setBalance(invoice.getTotalAmount().subtract(invoice.getAmountPaid()));
        invoice.setStatus(resolveStatus(invoice.getAmountPaid(), invoice.getBalance()));

        Invoice savedInvoice = invoiceRepository.save(invoice);

        InvoiceResponse response = InvoiceResponse.fromEntity(savedInvoice);
        response.setAppliedReceipts(paymentService.listCreditApplicationsForInvoice(savedInvoice.getId()));
        response.setPayments(paymentService.listPaymentsForInvoice(savedInvoice));
        response.setCreditApplied(BigDecimal.ZERO);
        response.setCashPaid(request.getAmount());
        response.setCustomerAvailableCreditAfterTxn(paymentService.getAvailableCredit(invoice.getCustomer().getId()));
        return response;
    }

    @Transactional
    public InvoiceResponse updateInvoice(Long id, InvoiceRequest invoiceRequest) {
        Invoice existingInvoice = invoiceRepository.findById(id)
                .filter(foundInvoice -> Boolean.TRUE.equals(foundInvoice.getIsActive()))
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found with id : " + id));

        Customer customer =
                customerRepository.findByIdAndIsActiveTrue(invoiceRequest.getCustomerId())
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Customer not found"));
        existingInvoice.setCustomer(customer);
        BigDecimal amountPaid = invoiceRequest.getAmountPaid();
        existingInvoice.setInvoiceDate(invoiceRequest.getInvoiceDate());
        existingInvoice.setInvoiceNumber(invoiceRequest.getInvoiceNumber());
        existingInvoice.setRemarks(invoiceRequest.getRemarks());

        List<InvoiceItem> invoiceItems = new ArrayList<>();
        BigDecimal totalAmount = BigDecimal.ZERO;
        for (InvoiceItemRequest itemRequest : invoiceRequest.getInvoiceItems()) {

            MaterialType material = materialRepository.findByIdAndIsActiveTrue(
                    itemRequest.getMaterialTypeId())
                    .orElseThrow(() ->
                            new ResourceNotFoundException("Material not found"));

            InvoiceItem item = new InvoiceItem();

            item.setInvoice(existingInvoice);
            item.setMaterialType(material);
            item.setQuantityBrass(itemRequest.getQuantityBrass());
            item.setRate(itemRequest.getRate());
            BigDecimal itemAmount = itemRequest.getQuantityBrass().multiply(itemRequest.getRate());
            item.setAmount(itemAmount);
            item.setTruckNumber(itemRequest.getTruckNumber());

            invoiceItems.add(item);
            totalAmount = totalAmount.add(itemAmount);
        }
        BigDecimal balance = totalAmount.subtract(amountPaid);
        existingInvoice.setAmountPaid(amountPaid);
        existingInvoice.setTotalAmount(totalAmount);
        existingInvoice.setBalance(balance);
        existingInvoice.setStatus(resolveStatus(amountPaid, balance));
        existingInvoice.setInvoiceItems(invoiceItems);

        Invoice savedInvoice = invoiceRepository.save(existingInvoice);
        return InvoiceResponse.fromEntity(savedInvoice);
    }


    public List<InvoiceResponse> getAll() {
        return invoiceRepository.findAllByIsActiveTrue().stream()
                .map(InvoiceResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public Page<InvoiceResponse> getPage(Pageable pageable) {
        return invoiceRepository.findAllByIsActiveTrue(pageable).map(InvoiceResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public InvoiceResponse getById(Long id) {
        Invoice invoice = invoiceRepository.findById(id)
            .filter(foundInvoice -> Boolean.TRUE.equals(foundInvoice.getIsActive()))
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found with id : " + id));
        InvoiceResponse response = InvoiceResponse.fromEntity(invoice);
        response.setAppliedReceipts(paymentService.listCreditApplicationsForInvoice(invoice.getId()));
        response.setPayments(paymentService.listPaymentsForInvoice(invoice));
        return response;
    }
}
