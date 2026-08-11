package com.productapp.service;

import com.productapp.dto.PaymentResponse;
import com.productapp.entity.Customer;
import com.productapp.entity.Invoice;
import com.productapp.entity.Payment;
import com.productapp.exceptions.ResourceNotFoundException;
import com.productapp.repository.CustomerRepository;
import com.productapp.repository.InvoiceRepository;
import com.productapp.repository.PaymentRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final InvoiceRepository invoiceRepository;
    private final CustomerRepository customerRepository;

    public PaymentService(PaymentRepository paymentRepository, InvoiceRepository invoiceRepository, CustomerRepository customerRepository) {
        this.paymentRepository = paymentRepository;
        this.invoiceRepository = invoiceRepository;
        this.customerRepository = customerRepository;
    }

    public PaymentResponse save(Payment payment) {
        Invoice invoice = invoiceRepository.findById(payment.getInvoice().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found"));
        Customer customer = customerRepository.findById(payment.getCustomer().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found"));
        payment.setInvoice(invoice);
        payment.setCustomer(customer);
        return PaymentResponse.fromEntity(paymentRepository.save(payment));
    }

    public List<PaymentResponse> getAll() {
        return paymentRepository.findAll().stream()
                .map(PaymentResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public PaymentResponse getById(Long id) {
        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found with id : " + id));
        return PaymentResponse.fromEntity(payment);
    }
}
