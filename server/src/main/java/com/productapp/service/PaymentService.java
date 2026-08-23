package com.productapp.service;

import com.productapp.dto.PaymentResponse;
import com.productapp.entity.Customer;
import com.productapp.entity.Invoice;
import com.productapp.entity.Payment;
import com.productapp.entity.User;
import com.productapp.exceptions.ResourceNotFoundException;
import com.productapp.repository.CustomerRepository;
import com.productapp.repository.InvoiceRepository;
import com.productapp.repository.PaymentRepository;
import com.productapp.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class PaymentService {

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
        Invoice invoice = invoiceRepository.findById(payment.getInvoice().getId())
            .filter(foundInvoice -> Boolean.TRUE.equals(foundInvoice.getIsActive()))
            .orElseThrow(() -> new ResourceNotFoundException("Invoice not found"));
        Customer customer = customerRepository.findByIdAndIsActiveTrue(payment.getCustomer().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found"));
        payment.setInvoice(invoice);
        payment.setCustomer(customer);
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User createdBy = userRepository.findByUsernameAndIsActiveTrue(authentication.getName())
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        payment.setCreatedBy(createdBy);
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
}
