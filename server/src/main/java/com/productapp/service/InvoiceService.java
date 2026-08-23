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

import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;
 
@Service
public class InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final CustomerRepository customerRepository;
    private final MaterialRepository materialRepository;

    public InvoiceService(InvoiceRepository invoiceRepository, CustomerRepository customerRepository, MaterialRepository materialRepository) {
        this.invoiceRepository = invoiceRepository;
        this.customerRepository = customerRepository;
        this.materialRepository = materialRepository;
    }

    public InvoiceResponse createInvoice(InvoiceRequest invoiceRequest) {
        Invoice invoice = new Invoice();
        Customer customer =
                customerRepository.findById(invoiceRequest.getCustomerId())
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Customer not found"));
        invoice.setCustomer(customer);
        invoice.setAmountPaid(invoiceRequest.getAmountPaid());
        invoice.setInvoiceDate(invoiceRequest.getInvoiceDate());
        invoice.setInvoiceNumber(invoiceRequest.getInvoiceNumber());
        invoice.setTotalAmount(invoiceRequest.getTotalAmount());
        invoice.setBalance(invoiceRequest.getBalance());
        invoice.setStatus(invoiceRequest.getStatus());
        invoice.setRemarks(invoiceRequest.getRemarks());

                            
        
        List<InvoiceItem> invoiceItems = new ArrayList<>();
        BigDecimal totalAmount = BigDecimal.ZERO;
        for (InvoiceItemRequest itemRequest : invoiceRequest.getInvoiceItems()) {

            MaterialType material = materialRepository.findById(
                    itemRequest.getMaterialTypeId())
                    .orElseThrow(() ->
                            new ResourceNotFoundException("Material not found"));

            InvoiceItem item = new InvoiceItem();

            item.setInvoice(invoice);
            item.setMaterialType(material);
            item.setQuantityBrass(itemRequest.getQuantityBrass());
            item.setRate(itemRequest.getRate());
            item.setAmount(itemRequest.getAmount());
            item.setTruckNumber(itemRequest.getTruckNumber());

            totalAmount = totalAmount.add(itemRequest.getAmount());

            invoiceItems.add(item);
        }
        invoice.setInvoiceItems(invoiceItems);
        //invoice.setCreatedBy(); 

        Invoice savedInvoice = invoiceRepository.save(invoice);
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
