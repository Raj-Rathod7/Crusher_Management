package com.productapp.service;

import com.productapp.entity.Customer;
import com.productapp.entity.CustomerLedger;
import com.productapp.entity.Invoice;
import com.productapp.entity.InvoiceItemRequest;
import com.productapp.entity.InvoiceRequest;
import com.productapp.entity.MaterialType;
import com.productapp.entity.Payment;
import com.productapp.entity.User;
import com.productapp.repository.CustomerLedgerRepository;
import com.productapp.repository.CustomerRepository;
import com.productapp.repository.InvoiceRepository;
import com.productapp.repository.MaterialRepository;
import com.productapp.repository.PaymentRepository;
import com.productapp.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class InvoiceServiceTest {

    @Mock
    private InvoiceRepository invoiceRepository;

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private MaterialRepository materialRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private CustomerLedgerRepository customerLedgerRepository;

    @Mock
    private PaymentRepository paymentRepository;

    @InjectMocks
    private InvoiceService invoiceService;

    @AfterEach
    void clearAuthentication() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void createInvoiceWithoutPaymentOnlyPostsSaleLedgerEntry() {
        InvoiceRequest request = invoiceRequest(null);
        prepareDependencies();
        when(invoiceRepository.save(any(Invoice.class))).thenAnswer(invocation -> {
            Invoice invoice = invocation.getArgument(0);
            invoice.setId(11L);
            return invoice;
        });

        invoiceService.createInvoice(request);

        verify(paymentRepository, never()).save(any(Payment.class));
        ArgumentCaptor<CustomerLedger> ledgerCaptor = ArgumentCaptor.forClass(CustomerLedger.class);
        verify(customerLedgerRepository).save(ledgerCaptor.capture());
        assertEquals("SALE", ledgerCaptor.getValue().getEntryType());
        assertEquals(BigDecimal.ZERO, ledgerCaptor.getValue().getCredit());
    }

    @Test
    void createInvoiceWithPaymentCreatesCashReceiptAndLedgerCredit() {
        InvoiceRequest request = invoiceRequest(new BigDecimal("125.50"));
        prepareDependencies();
        when(invoiceRepository.save(any(Invoice.class))).thenAnswer(invocation -> {
            Invoice invoice = invocation.getArgument(0);
            invoice.setId(11L);
            return invoice;
        });
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> {
            Payment payment = invocation.getArgument(0);
            payment.setId(22L);
            return payment;
        });

        invoiceService.createInvoice(request);

        ArgumentCaptor<Payment> paymentCaptor = ArgumentCaptor.forClass(Payment.class);
        verify(paymentRepository).save(paymentCaptor.capture());
        Payment payment = paymentCaptor.getValue();
        assertEquals(new BigDecimal("125.50"), payment.getAmount());
        assertEquals(LocalDate.of(2026, 9, 23), payment.getPaymentDate());
        assertEquals("cash", payment.getPaymentMode());

        ArgumentCaptor<CustomerLedger> ledgerCaptor = ArgumentCaptor.forClass(CustomerLedger.class);
        verify(customerLedgerRepository, org.mockito.Mockito.times(2)).save(ledgerCaptor.capture());
        CustomerLedger paymentLedger = ledgerCaptor.getAllValues().get(1);
        assertEquals("CUSTOMER_PAYMENT", paymentLedger.getEntryType());
        assertEquals(new BigDecimal("125.50"), paymentLedger.getCredit());
        assertEquals("PAYMENT", paymentLedger.getSourceType());
        assertEquals(22L, paymentLedger.getSourceId());
    }

    @Test
    void createInvoiceRejectsNonPositivePaymentBeforePersistence() {
        InvoiceRequest request = invoiceRequest(BigDecimal.ZERO);
        prepareDependencies();

        assertThrows(IllegalArgumentException.class, () -> invoiceService.createInvoice(request));

        verify(invoiceRepository, never()).save(any(Invoice.class));
        verify(paymentRepository, never()).save(any(Payment.class));
    }

    private void prepareDependencies() {
        Customer customer = new Customer();
        customer.setId(10L);
        customer.setName("Alpha");
        customer.setIsActive(true);

        MaterialType material = new MaterialType();
        material.setId(20L);
        material.setName("Stone");
        material.setIsActive(true);

        User user = new User();
        user.setId(7L);
        user.setUsername("demo");
        user.setIsActive(true);

        when(customerRepository.findByIdAndIsActiveTrue(10L)).thenReturn(Optional.of(customer));
        when(materialRepository.findByIdAndIsActiveTrue(20L)).thenReturn(Optional.of(material));
        when(userRepository.findByUsernameAndIsActiveTrue("demo")).thenReturn(Optional.of(user));
        SecurityContextHolder.getContext().setAuthentication(
            new UsernamePasswordAuthenticationToken("demo", "password"));
    }

    private InvoiceRequest invoiceRequest(BigDecimal paymentAmount) {
        InvoiceItemRequest item = new InvoiceItemRequest();
        item.setMaterialTypeId(20L);
        item.setQuantityBrass(new BigDecimal("2"));
        item.setRate(new BigDecimal("100"));
        item.setAmount(new BigDecimal("200"));
        item.setTruckNumber("TRUCK-1");

        InvoiceRequest request = new InvoiceRequest();
        request.setCustomerId(10L);
        request.setInvoiceNumber("INV-2026-0001");
        request.setInvoiceDate(LocalDate.of(2026, 9, 23));
        request.setTotalAmount(new BigDecimal("200"));
        request.setPaymentAmount(paymentAmount);
        request.setInvoiceItems(List.of(item));
        return request;
    }
}