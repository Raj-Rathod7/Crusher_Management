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

    public InvoiceService(InvoiceRepository invoiceRepository, CustomerRepository customerRepository,
                          MaterialRepository materialRepository, UserRepository userRepository) {
        this.invoiceRepository = invoiceRepository;
        this.customerRepository = customerRepository;
        this.materialRepository = materialRepository;
        this.userRepository = userRepository;
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
        BigDecimal amountPaid = invoiceRequest.getAmountPaid();
        invoice.setInvoiceDate(invoiceRequest.getInvoiceDate());
        invoice.setInvoiceNumber(invoiceRequest.getInvoiceNumber());
        invoice.setRemarks(invoiceRequest.getRemarks());

                            
        
        List<InvoiceItem> invoiceItems = new ArrayList<>();
        BigDecimal totalAmount = BigDecimal.ZERO;
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
            totalAmount = totalAmount.add(itemAmount);
        }
        BigDecimal balance = totalAmount.subtract(amountPaid);
        invoice.setAmountPaid(amountPaid);
        invoice.setTotalAmount(totalAmount);
        invoice.setBalance(balance);
        invoice.setStatus(resolveStatus(amountPaid, balance));
        invoice.setInvoiceItems(invoiceItems);
        invoice.setCreatedBy(createdBy);

        Invoice savedInvoice = invoiceRepository.save(invoice);
        return InvoiceResponse.fromEntity(savedInvoice);
    }

    private String resolveStatus(BigDecimal amountPaid, BigDecimal balance) {
        if (amountPaid.signum() == 0) {
            return "pending";
        }
        return balance.signum() == 0 ? "paid" : "partial";
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return userRepository.findByUsernameAndIsActiveTrue(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }


    public List<InvoiceResponse> getAll() {
        return invoiceRepository.findAllByIsActiveTrue().stream()
                .map(InvoiceResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public Page<InvoiceResponse> getPage(Pageable pageable) {
        return invoiceRepository.findAllByIsActiveTrue(pageable).map(InvoiceResponse::fromEntity);
    }

    public InvoiceResponse getById(Long id) {
        Invoice invoice = invoiceRepository.findById(id)
            .filter(foundInvoice -> Boolean.TRUE.equals(foundInvoice.getIsActive()))
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found with id : " + id));
        return InvoiceResponse.fromEntity(invoice);
    }
}
