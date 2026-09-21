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
import com.productapp.entity.User;
import com.productapp.repository.UserRepository;
import com.productapp.entity.CustomerLedger;
import com.productapp.repository.CustomerLedgerRepository;

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
import java.util.Optional;
import java.util.stream.Collectors;
 
@Service
public class InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final CustomerRepository customerRepository;
    private final MaterialRepository materialRepository;
    private final UserRepository userRepository;
    private final CustomerLedgerRepository customerLedgerRepository;

    public InvoiceService(InvoiceRepository invoiceRepository, CustomerRepository customerRepository,
                          MaterialRepository materialRepository, UserRepository userRepository,
                          CustomerLedgerRepository customerLedgerRepository) {
        this.invoiceRepository = invoiceRepository;
        this.customerRepository = customerRepository;
        this.materialRepository = materialRepository;
        this.userRepository = userRepository;
        this.customerLedgerRepository = customerLedgerRepository;
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

        invoice.setTotalAmount(totalAmount);
        invoice.setInvoiceItems(invoiceItems);
        invoice.setCreatedBy(createdBy);

        Invoice savedInvoice = invoiceRepository.save(invoice);
        postSaleLedgerEntry(savedInvoice, customer, savedInvoice.getTotalAmount(), BigDecimal.ZERO,
            "SALE", "Sale " + savedInvoice.getInvoiceNumber());

        InvoiceResponse response = InvoiceResponse.fromEntity(savedInvoice);
        return response;
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return userRepository.findByUsernameAndIsActiveTrue(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    @Transactional
    public InvoiceResponse updateInvoice(Long id, InvoiceRequest invoiceRequest) {
        Invoice existingInvoice = invoiceRepository.findById(id)
                .filter(foundInvoice -> Boolean.TRUE.equals(foundInvoice.getIsActive()))
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found with id : " + id));

            Customer previousCustomer = existingInvoice.getCustomer();
            BigDecimal previousTotalAmount = existingInvoice.getTotalAmount();
            Optional<CustomerLedger> existingLedger = customerLedgerRepository
                .findFirstBySourceTypeAndSourceIdAndIsActiveTrueOrderByIdDesc("INVOICE", existingInvoice.getId());

        Customer customer =
                customerRepository.findByIdAndIsActiveTrue(invoiceRequest.getCustomerId())
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Customer not found"));
        existingInvoice.setCustomer(customer);
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
        existingInvoice.setTotalAmount(totalAmount);
        existingInvoice.setInvoiceItems(invoiceItems);

        Invoice savedInvoice = invoiceRepository.save(existingInvoice);
        if (existingLedger.isPresent()) {
            postSaleLedgerEntry(savedInvoice, previousCustomer, BigDecimal.ZERO, previousTotalAmount,
                "SALE_REVERSAL", "Reversal of sale " + savedInvoice.getInvoiceNumber());
        }
        postSaleLedgerEntry(savedInvoice, savedInvoice.getCustomer(), savedInvoice.getTotalAmount(), BigDecimal.ZERO,
            "SALE", "Sale " + savedInvoice.getInvoiceNumber());
        return InvoiceResponse.fromEntity(savedInvoice);
    }

        private void postSaleLedgerEntry(Invoice invoice, Customer customer, BigDecimal debit,
                         BigDecimal credit, String entryType, String description) {
        customerLedgerRepository.save(CustomerLedger.builder()
            .entryDate(invoice.getInvoiceDate())
            .customer(customer)
            .entryType(entryType)
            .reference(invoice.getInvoiceNumber() + "-" + entryType)
            .description(description)
            .debit(debit)
            .credit(credit)
            .sourceType("INVOICE")
            .sourceId(invoice.getId())
            .build());
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
        return InvoiceResponse.fromEntity(invoice);
    }

    @Transactional
    public void delete(Long id) {
        Invoice invoice = invoiceRepository.findById(id)
                .filter(foundInvoice -> Boolean.TRUE.equals(foundInvoice.getIsActive()))
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found with id : " + id));
        postSaleLedgerEntry(invoice, invoice.getCustomer(), BigDecimal.ZERO, invoice.getTotalAmount(),
                "SALE_REVERSAL", "Reversal of deleted sale " + invoice.getInvoiceNumber());
        invoice.setIsActive(false);
        invoiceRepository.save(invoice);
    }
}
